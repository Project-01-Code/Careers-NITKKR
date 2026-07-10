import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS, PAYMENT_STATUS } from '../constants.js';
import { Application } from '../models/application.model.js';
import { Payment } from '../models/payment.model.js';
import mongoose from 'mongoose';
import { stripeService } from '../services/stripe.service.js';
import { calculateApplicationFee, markApplicationSubmitted } from '../services/payment.service.js';

// ---------------------------------------------------------------------------
// POST /api/v1/payments/create-checkout-session
// ---------------------------------------------------------------------------

/**
 * Calculate the correct fee, create a Stripe Checkout Session, and persist a PENDING Payment record.
 * Returns { sessionId, url, amount, currency, publishableKey } so the frontend can redirect to Stripe.
 *
 * §9: Free/exempted applications (amount === 0) are immediately marked submitted — no session created.
 * §10: Duplicate PENDING sessions are reused instead of creating new ones.
 */
export const createCheckoutSession = asyncHandler(async (req, res) => {
  const { applicationId } = req.body;
  const userId = req.user._id;

  if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Valid applicationId is required');
  }

  // ── 1. Load application — must belong to the requesting user (§8: ownership check) ─
  const application = await Application.findOne({ _id: applicationId, userId });
  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  // ── 2. Terminal payment guard — already paid or exempted (§10: idempotency) ─────────
  if (
    application.paymentStatus === PAYMENT_STATUS.PAID ||
    application.paymentStatus === PAYMENT_STATUS.EXEMPTED
  ) {
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { alreadyPaid: true, paymentStatus: application.paymentStatus },
        'Fee already paid or exempted'
      )
    );
  }

  // ── 3. Already submitted guard ─────────────────────────────────────────────────────
  if (application.status === 'submitted') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Application is already submitted');
  }

  // ── 4. Load job to calculate the expected fee ─────────────────────────────────────
  const job = application.jobSnapshot;
  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job snapshot not found on application');
  }

  // ── 5. Derive category & disability from personal section ──────────────────────────
  const personalData = application.sections?.get('personal')?.data ?? {};
  const rawCategory  = personalData.category ?? 'GEN';
  const isPwd        = Boolean(personalData.disability);

  // ── 6. Calculate expected fee (§8: server always owns the amount) ──────────────────
  const { totalAmount, baseFee, transactionFee, isFeeRequired } =
    calculateApplicationFee(job.applicationFee, rawCategory, isPwd);

  // ── 7. §9: Free payment path — skip Stripe entirely ─────────────────────────────
  if (totalAmount === 0 || !isFeeRequired) {
    markApplicationSubmitted(application, PAYMENT_STATUS.EXEMPTED, userId);
    await application.save();

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          exempted: true,
          isFeeRequired,
          paymentStatus: application.paymentStatus,
          applicationStatus: application.status,
        },
        'Application fee exempted. Submission complete.'
      )
    );
  }

  // ── 8. §10: Reuse existing PENDING session if the amount still matches ───────────
  // Also clean up any stale FAILED records to keep the DB tidy.
  const [existingPending] = await Promise.all([
    Payment.findOne({ applicationId: application._id, status: PAYMENT_STATUS.PENDING }),
    // §15: Delete FAILED records — they are no longer actionable
    Payment.deleteMany({ applicationId: application._id, status: PAYMENT_STATUS.FAILED }),
  ]);

  if (existingPending) {
    // §8: Validate stored amount matches current expected fee before reusing
    if (existingPending.amount !== totalAmount) {
      // Fee config changed since last attempt — delete stale session and fall through to create a new one
      await existingPending.deleteOne();
    } else {
      // Amount is still correct — return existing session so the user can resume payment
      // Retrieve the session URL from Stripe since sessions can expire
      try {
        const session = await stripeService.retrieveSession(existingPending.sessionId);
        if (session.status === 'open' && session.url) {
          return res.status(HTTP_STATUS.OK).json(
            new ApiResponse(
              HTTP_STATUS.OK,
              {
                sessionId:      existingPending.sessionId,
                url:            session.url,
                amount:         existingPending.amount,
                currency:       existingPending.currency,
                publishableKey: stripeService.publishableKey,
                baseFee,
                transactionFee,
                alreadyPending: true,
              },
              'Existing payment session returned. Complete your payment.'
            )
          );
        }
      } catch {
        // Session expired or invalid — fall through to create a new one
      }
      await existingPending.deleteOne();
    }
  }

  // ── 9. Build success/cancel URLs for Stripe Checkout ───────────────────────────────
  const clientOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const successUrl = `${clientOrigin}/applications/${application._id}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl  = `${clientOrigin}/applications/${application._id}/payment-cancel`;

  // ── 10. Create new Stripe Checkout Session ─────────────────────────────────────────
  const session = await stripeService.createCheckoutSession(
    totalAmount,
    application._id,
    userId,
    successUrl,
    cancelUrl
  );

  // ── 11. Persist PENDING record with the authoritative amount ─────────────────────
  // §15: amount is stored here — webhook reads it from DB and never trusts external input
  try {
    await Payment.create({
      sessionId:     session.id,
      amount:        totalAmount,   // stored in rupees
      currency:      'inr',
      status:        PAYMENT_STATUS.PENDING,
      applicationId: application._id,
      userId,
    });
  } catch (dbError) {
    console.error('[payment.controller] Failed to save payment record:', dbError.message);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to save payment record. Please try again.'
    );
  }

  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      {
        sessionId:      session.id,
        url:            session.url,     // Stripe-hosted checkout URL
        amount:         totalAmount,     // rupees — for display
        currency:       'inr',
        publishableKey: stripeService.publishableKey,
        baseFee,
        transactionFee,
      },
      'Payment session created successfully'
    )
  );
});

// ---------------------------------------------------------------------------
// POST /api/v1/payments/webhook
// ---------------------------------------------------------------------------

/**
 * Stripe Webhook Handler — server-to-server event processing.
 *
 * This is the primary mechanism for confirming payment completion.
 * Implements idempotent processing with event deduplication:
 *
 * 1. Verifies the webhook signature to ensure authenticity
 * 2. Checks if the event has already been processed (deduplication via stripeEventId)
 * 3. Extracts the Checkout Session and updates the Payment + Application records
 * 4. Stores raw event data for audit trail
 *
 * §10 — Idempotent: duplicate events are safely ignored
 * §15 — Signature verification prevents spoofed events
 */
export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Missing Stripe signature header');
  }

  // ── 1. §15: Verify webhook signature — primary cryptographic proof ──────────────
  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error('[payment.controller] Webhook signature verification failed:', err.message);
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid webhook signature');
  }

  // ── 2. §10: Event deduplication — skip if already processed ─────────────────────
  const existingEvent = await Payment.findOne({ stripeEventId: event.id });
  if (existingEvent) {
    // Already processed this exact event — return 200 to acknowledge without re-processing
    console.log(`[payment.controller] Duplicate event ${event.id} — skipping`);
    return res.status(HTTP_STATUS.OK).json({ received: true, deduplicated: true });
  }

  // ── 3. Handle checkout.session.completed event ──────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Only process paid sessions
    if (session.payment_status !== 'paid') {
      return res.status(HTTP_STATUS.OK).json({ received: true, status: 'not_paid' });
    }

    const { applicationId, userId } = session.metadata || {};

    if (!applicationId) {
      console.error('[payment.controller] Webhook: missing applicationId in session metadata');
      return res.status(HTTP_STATUS.OK).json({ received: true, error: 'missing_metadata' });
    }

    // ── 4. Find the PENDING payment record ──────────────────────────────────────
    const paymentRecord = await Payment.findOne({
      sessionId: session.id,
      status: PAYMENT_STATUS.PENDING,
    });

    if (!paymentRecord) {
      // §10: Idempotent — may already be PAID from a previous delivery attempt
      const alreadyPaid = await Payment.findOne({
        sessionId: session.id,
        status: PAYMENT_STATUS.PAID,
      });

      if (alreadyPaid) {
        console.log(`[payment.controller] Session ${session.id} already paid — idempotent skip`);
        return res.status(HTTP_STATUS.OK).json({ received: true, alreadyPaid: true });
      }

      console.error(`[payment.controller] No PENDING record for session ${session.id}`);
      return res.status(HTTP_STATUS.OK).json({ received: true, error: 'no_pending_record' });
    }

    // ── 5. §8: Amount consistency check ──────────────────────────────────────────
    const paidAmountInRupees = Math.round(session.amount_total / 100);
    if (paymentRecord.amount !== paidAmountInRupees) {
      paymentRecord.status = PAYMENT_STATUS.FAILED;
      paymentRecord.rawWebhookData = {
        eventId: event.id,
        sessionId: session.id,
        error: 'amount_mismatch',
        storedAmount: paymentRecord.amount,
        paidAmount: paidAmountInRupees,
      };
      await paymentRecord.save();

      console.error(`[payment.controller] Amount mismatch: stored=${paymentRecord.amount}, paid=${paidAmountInRupees}`);
      return res.status(HTTP_STATUS.OK).json({ received: true, error: 'amount_mismatch' });
    }

    // ── 6. §11: PENDING → PAID — immutable terminal state ─────────────────────
    paymentRecord.status              = PAYMENT_STATUS.PAID;
    paymentRecord.stripePaymentIntentId = session.payment_intent;
    paymentRecord.stripeEventId       = event.id;  // Deduplication key
    paymentRecord.rawWebhookData      = {
      eventId:       event.id,
      eventType:     event.type,
      sessionId:     session.id,
      paymentIntent: session.payment_intent,
      amountTotal:   session.amount_total,
      currency:      session.currency,
      paymentStatus: session.payment_status,
      processedAt:   new Date().toISOString(),
    };
    await paymentRecord.save();

    // ── 7. §11: Mark Application submitted ────────────────────────────────────
    const application = await Application.findById(applicationId);
    if (application) {
      markApplicationSubmitted(application, PAYMENT_STATUS.PAID, userId);
      await application.save();
      console.log(`[payment.controller] Application ${applicationId} marked as submitted via webhook`);
    } else {
      console.error(`[payment.controller] Application ${applicationId} not found during webhook processing`);
    }
  }

  // Always acknowledge receipt to Stripe to prevent retries
  return res.status(HTTP_STATUS.OK).json({ received: true });
});

// ---------------------------------------------------------------------------
// GET /api/v1/payments/status/:applicationId
// ---------------------------------------------------------------------------

/**
 * Returns the current payment and application statuses from the local DB.
 * §14: No external Stripe API call — all data sourced from MongoDB.
 */
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const userId = req.user._id;

  // §8: userId ownership check — cannot fetch another user's status
  const application = await Application.findOne({ _id: applicationId, userId });
  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  // §10: Fast path — already in a terminal state; no need to check Payment collection
  if (
    application.paymentStatus === PAYMENT_STATUS.PAID ||
    application.paymentStatus === PAYMENT_STATUS.EXEMPTED
  ) {
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          paymentStatus:     application.paymentStatus,
          applicationStatus: application.status,
        },
        'Payment status fetched successfully'
      )
    );
  }

  // Get the most recent payment record for this application
  const paymentRecord = await Payment.findOne({ applicationId }).sort({ createdAt: -1 });

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        paymentStatus:     paymentRecord?.status ?? PAYMENT_STATUS.PENDING,
        applicationStatus: application.status,
        // Include sessionId so frontend can check if a PENDING session exists (§10)
        ...(paymentRecord?.status === PAYMENT_STATUS.PENDING && {
          pendingSessionId: paymentRecord.sessionId,
        }),
      },
      'Payment status fetched successfully'
    )
  );
});
