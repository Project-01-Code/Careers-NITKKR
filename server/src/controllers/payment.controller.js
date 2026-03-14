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
// POST /api/v1/payments/create-order
// ---------------------------------------------------------------------------

/**
 * Calculate the correct fee for the applicant's category, create a Stripe
 * Checkout Session, and persist a PENDING Payment record.
 *
 * If the resolved fee is 0 (exempt category or fee not required) the
 * application is immediately marked EXEMPTED + submitted — no Stripe session
 * is created.
 *
 * @route   POST /api/v1/payments/create-order
 * @access  Private (Applicant only)
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { applicationId } = req.body;
  const userId = req.user._id;

  // ── Validate applicationId format ─────────────────────────────────────────
  // Windsurf addition: catches malformed IDs before hitting the DB,
  // preventing a Mongoose CastError from bubbling up as a 500.
  if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Valid Application ID is required');
  }

  // ── 1. Load application (must belong to the requesting user) ─────────────
  const application = await Application.findOne({ _id: applicationId, userId });
  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  // ── 2. Guard: already in a terminal payment state ─────────────────────────
  if (
    application.paymentStatus === PAYMENT_STATUS.PAID ||
    application.paymentStatus === PAYMENT_STATUS.EXEMPTED
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Fee already paid or exempted for this application'
    );
  }

  // ── 3. Guard: already submitted (covers exempted path edge case) ──────────
  // Windsurf addition: prevents re-submission if the application somehow
  // reached 'submitted' state without payment being finalised.
  if (application.status === 'submitted') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Application is already submitted');
  }

  // ── 4. Guard: existing PENDING session — prevent duplicate Stripe sessions ─
  // Windsurf addition: if the user hits create-order twice (double-click,
  // network retry), we block a second Stripe session from being created.
  // The frontend should resume the existing session instead.
  const existingPending = await Payment.findOne({
    applicationId: application._id,
    status: PAYMENT_STATUS.PENDING,
  });
  if (existingPending) {
    // Return the existing session URL so the frontend can redirect without
    // creating a duplicate charge.
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          sessionId: existingPending.sessionId,
          // We don't store the URL — tell the frontend to re-call Stripe if needed,
          // or store the URL on the Payment model if your frontend needs it here.
          alreadyPending: true,
        },
        'A payment session already exists for this application. Please complete the existing payment.'
      )
    );
  }

  // ── 5. Load the associated job (fee config lives here) ────────────────────
  const job = await mongoose.model('Job').findById(application.jobId).lean();
  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Associated job not found');
  }

  // ── 6. Derive candidate category & disability status ─────────────────────
  const personalData = application.sections?.get('personal')?.data ?? {};
  const rawCategory  = personalData.category ?? 'GEN';
  const isPwd        = Boolean(personalData.disability);

  // ── 7. Calculate the fee ──────────────────────────────────────────────────
  const { totalAmount, baseFee, transactionFee, isFeeRequired } =
    calculateApplicationFee(job.applicationFee, rawCategory, isPwd);

  // ── 8. Exempt path — no Stripe session needed ─────────────────────────────
  if (totalAmount === 0) {
    markApplicationSubmitted(application, PAYMENT_STATUS.EXEMPTED);
    await application.save();

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          exempted:          true,
          isFeeRequired,
          paymentStatus:     application.paymentStatus,
          applicationStatus: application.status,
        },
        'Application fee exempted. Submission complete.'
      )
    );
  }

  // ── 9. Build redirect URLs ────────────────────────────────────────────────
  const origin     = req.get('origin') || 'http://localhost:3000';
  const successUrl = `${origin}/applications/${applicationId}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl  = `${origin}/applications/${applicationId}/payment-cancel`;

  // ── 10. Create Stripe Checkout Session ────────────────────────────────────
  // Windsurf addition: explicit try/catch here gives a cleaner error message
  // than letting stripeService's internal error bubble through asyncHandler.
  let session;
  try {
    session = await stripeService.createCheckoutSession(
      totalAmount,
      application._id,
      successUrl,
      cancelUrl
    );
  } catch (stripeError) {
    console.error('Failed to create Stripe session:', stripeError);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create payment session. Please try again.'
    );
  }

  // ── 11. Persist a PENDING payment record ──────────────────────────────────
  // Windsurf addition: explicit try/catch so a DB failure here returns a
  // clear 500 rather than a generic unhandled rejection. The Stripe session
  // will auto-expire in 24h if the user never completes it.
  try {
    await Payment.create({
      sessionId:     session.id,
      amount:        totalAmount,
      currency:      session.currency?.toLowerCase() ?? 'inr',
      status:        PAYMENT_STATUS.PENDING,
      applicationId: application._id,
      userId,
    });
  } catch (dbError) {
    console.error('Failed to create payment record:', dbError);
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
        url:            session.url,
        baseFee,
        transactionFee,
        totalAmount,
        currency:       session.currency ?? 'inr',
      },
      'Payment session created successfully'
    )
  );
});

// ---------------------------------------------------------------------------
// GET /api/v1/payments/status/:applicationId
// ---------------------------------------------------------------------------

/**
 * Let the frontend poll for the current payment status of an application
 * after the user returns from Stripe Checkout (success / cancel redirect).
 *
 * When the Stripe session shows payment_status === 'paid' but our DB still
 * shows PENDING (webhook not yet delivered), we reconcile here so the user
 * isn't left on a spinner.
 *
 * @route   GET /api/v1/payments/status/:applicationId
 * @access  Private (Applicant only)
 */
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const userId = req.user._id;

  const application = await Application.findOne({ _id: applicationId, userId });
  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  // Already in a terminal state — nothing more to do
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

  // Find the most recent payment record for this application
  const paymentRecord = await Payment.findOne({ applicationId }).sort({ createdAt: -1 });

  if (!paymentRecord) {
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { paymentStatus: PAYMENT_STATUS.PENDING },
        'No payment record found'
      )
    );
  }

  // ── Reconcile: webhook may not have arrived yet ───────────────────────────
  if (paymentRecord.status === PAYMENT_STATUS.PENDING) {
    try {
      const stripeSession = await stripeService.retrieveCheckoutSession(
        paymentRecord.sessionId
      );

      if (stripeSession.payment_status === 'paid') {
        paymentRecord.status          = PAYMENT_STATUS.PAID;
        paymentRecord.paymentIntentId = stripeSession.payment_intent;
        paymentRecord.paymentMethod   = stripeSession.payment_method_types?.[0] ?? 'card';
        await paymentRecord.save();

        markApplicationSubmitted(application, PAYMENT_STATUS.PAID);
        await application.save();
      }
    } catch (err) {
      // Non-fatal — webhook will eventually reconcile; just log and continue
      console.error('getPaymentStatus: Stripe session retrieval failed', err.message);
    }
  }

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        paymentStatus:     paymentRecord.status,
        applicationStatus: application.status,
      },
      'Payment status fetched successfully'
    )
  );
});

// ---------------------------------------------------------------------------
// POST /api/v1/payments/webhook
// ---------------------------------------------------------------------------

/**
 * Stripe webhook receiver.
 *
 * IMPORTANT: This route must be registered BEFORE express.json() middleware
 * and must use express.raw({ type: 'application/json' }) so that req.body
 * remains a raw Buffer (required by Stripe signature verification).
 *
 * Idempotent: every handler checks the current DB status before writing,
 * so duplicate webhook deliveries are safe.
 *
 * @route   POST /api/v1/payments/webhook
 * @access  Public (Stripe only — verified by signature)
 */
export const verifyWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Webhook signature missing');
  }

  let event;
  try {
    event = stripeService.verifyWebhookSignature(req.body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(HTTP_STATUS.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleSessionCompleted(event);
      break;

    case 'checkout.session.expired':
      await handleSessionExpired(event);
      break;

    // event.data.object is a PaymentIntent here — NOT a Checkout Session.
    // applicationId lives in its metadata (set during session creation).
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event);
      break;

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  return res.status(HTTP_STATUS.OK).send('OK');
});

// ---------------------------------------------------------------------------
// Private webhook sub-handlers
// ---------------------------------------------------------------------------

/**
 * checkout.session.completed — mark Payment PAID and submit the Application.
 * Atomic findOneAndUpdate prevents double-processing on duplicate deliveries.
 */
async function handleSessionCompleted(event) {
  const session   = event.data.object;
  const sessionId = session.id;

  const paymentRecord = await Payment.findOneAndUpdate(
    { sessionId, status: { $ne: PAYMENT_STATUS.PAID } },
    {
      $set: {
        status:          PAYMENT_STATUS.PAID,
        paymentIntentId: session.payment_intent,
        paymentMethod:   session.payment_method_types?.[0] ?? 'card',
        rawWebhookData:  event,
      },
    },
    { new: true }
  );

  if (!paymentRecord) {
    console.warn(`checkout.session.completed: no actionable record for session ${sessionId}`);
    return;
  }

  const application = await Application.findById(paymentRecord.applicationId);
  if (application) {
    markApplicationSubmitted(application, PAYMENT_STATUS.PAID);
    await application.save();
  } else {
    console.error(`checkout.session.completed: application ${paymentRecord.applicationId} not found`);
  }
}

/**
 * checkout.session.expired — mark Payment FAILED.
 * Windsurf addition: try/catch + result logging for easier debugging.
 */
async function handleSessionExpired(event) {
  const sessionId = event.data.object.id;

  try {
    const result = await Payment.findOneAndUpdate(
      { sessionId, status: { $nin: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.FAILED] } },
      { $set: { status: PAYMENT_STATUS.FAILED, rawWebhookData: event } },
      { new: true }
    );
    if (!result) {
      console.warn(`handleSessionExpired: no pending record for session ${sessionId}`);
    } else {
      console.log(`handleSessionExpired: payment ${result._id} marked FAILED`);
    }
  } catch (err) {
    console.error(`handleSessionExpired: DB update failed for session ${sessionId}:`, err);
  }
}

/**
 * payment_intent.payment_failed — mark Payment FAILED.
 * Looks up by applicationId from PaymentIntent metadata (no sessionId available here).
 * Windsurf addition: try/catch + result logging for easier debugging.
 */
async function handlePaymentIntentFailed(event) {
  const applicationId = event.data.object.metadata?.applicationId;

  if (!applicationId) {
    console.warn('payment_intent.payment_failed: no applicationId in PaymentIntent metadata');
    return;
  }

  try {
    const result = await Payment.findOneAndUpdate(
      {
        applicationId,
        status: { $nin: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.FAILED] },
      },
      { $set: { status: PAYMENT_STATUS.FAILED, rawWebhookData: event } },
      { sort: { createdAt: -1 }, new: true }
    );
    if (!result) {
      console.warn(`handlePaymentIntentFailed: no pending record for application ${applicationId}`);
    } else {
      console.log(`handlePaymentIntentFailed: payment ${result._id} marked FAILED`);
    }
  } catch (err) {
    console.error(`handlePaymentIntentFailed: DB update failed for application ${applicationId}:`, err);
  }
}