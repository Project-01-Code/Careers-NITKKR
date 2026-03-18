import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS, PAYMENT_STATUS } from '../constants.js';
import { Application } from '../models/application.model.js';
import { Payment } from '../models/payment.model.js';
import mongoose from 'mongoose';
import { razorpayService } from '../services/razorpay.service.js';
import { calculateApplicationFee, markApplicationSubmitted } from '../services/payment.service.js';

// ---------------------------------------------------------------------------
// POST /api/v1/payments/create-order
// ---------------------------------------------------------------------------

/**
 * Calculate the correct fee, create a Razorpay order, and persist a PENDING Payment record.
 * Returns { orderId, amount, amountInPaise, currency, keyId } so the frontend can open the Razorpay modal.
 *
 * §9: Free/exempted applications (amount === 0) are immediately marked submitted — no order created.
 * §10: Duplicate PENDING orders are reused instead of creating new ones.
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
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
  // Do this BEFORE the PENDING check so we always have the current expected amount.
 // ✅ Replace with this
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

  // ── 7. §9: Free payment path — skip Razorpay entirely ─────────────────────────────
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

  // ── 8. §10: Reuse existing PENDING order if the amount still matches ───────────────
  // Also clean up any stale FAILED records to keep the DB tidy.
  const [existingPending] = await Promise.all([
    Payment.findOne({ applicationId: application._id, status: PAYMENT_STATUS.PENDING }),
    // §15: Delete FAILED records — they are no longer actionable
    Payment.deleteMany({ applicationId: application._id, status: PAYMENT_STATUS.FAILED }),
  ]);

  if (existingPending) {
    // §8: Validate stored amount matches current expected fee before reusing
    if (existingPending.amount !== totalAmount) {
      // Fee config changed since last attempt — delete stale order and fall through to create a new one
      await existingPending.deleteOne();
    } else {
      // Amount is still correct — return existing order so the user can resume payment
      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(
          HTTP_STATUS.OK,
          {
            orderId:       existingPending.orderId,
            amount:        existingPending.amount,
            amountInPaise: existingPending.amount * 100, // §14: always provide paise for the modal
            currency:      existingPending.currency,
            keyId:         razorpayService.keyId,        // public key — safe to expose
            baseFee,
            transactionFee,
            alreadyPending: true,
          },
          'Existing payment order returned. Complete your payment.'
        )
      );
    }
  }

  // ── 9. Create new Razorpay order ───────────────────────────────────────────────────
  const order = await razorpayService.createOrder(totalAmount, application._id);

  // ── 10. Persist PENDING record with the authoritative amount ─────────────────────
  // §15: amount is stored here — verifyPayment reads it from DB and never trusts the frontend
  try {
    await Payment.create({
      orderId:       order.id,
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
        orderId:       order.id,
        amount:        totalAmount,  // rupees — for display
        amountInPaise: order.amount, // paise  — what the Razorpay modal requires
        currency:      order.currency,
        keyId:         razorpayService.keyId,
        baseFee,
        transactionFee,
      },
      'Payment order created successfully'
    )
  );
});

// ---------------------------------------------------------------------------
// POST /api/v1/payments/verify-payment
// ---------------------------------------------------------------------------

/**
 * Called by the frontend AFTER the Razorpay modal succeeds.
 *
 * §8  — Validates: orderId exists, status is PENDING, userId matches, amount is consistent
 * §10 — Idempotent: already-PAID orders return success without re-processing
 * §15 — Uses timingSafeEqual, never trusts frontend amount, validates all fields
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const userId = req.user._id;

  // ── 1. §15: Input validation — all three fields must be non-empty strings ────────
  if (
    !razorpayOrderId   || typeof razorpayOrderId   !== 'string' ||
    !razorpayPaymentId || typeof razorpayPaymentId !== 'string' ||
    !razorpaySignature || typeof razorpaySignature !== 'string'
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required strings'
    );
  }

  // ── 2. §8: Fetch PENDING record — orderId must exist in OUR database ──────────────
  const paymentRecord = await Payment.findOne({
    orderId: razorpayOrderId,
    status: PAYMENT_STATUS.PENDING,
  });

  if (!paymentRecord) {
    // §10: Idempotent retry — already paid?
    const alreadyPaid = await Payment.findOne({
      orderId: razorpayOrderId,
      status: PAYMENT_STATUS.PAID,
    });

    if (alreadyPaid) {
      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, { alreadyPaid: true }, 'Payment already verified')
      );
    }

    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      'Payment order not found or already processed'
    );
  }

  // ── 3. §8: User ownership check — prevents one user verifying another's payment ───
  if (paymentRecord.userId.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Unauthorized payment verification attempt');
  }

  // ── 4. §8: Amount consistency check ──────────────────────────────────────────────
  // Re-calculate the expected fee now and compare it against what was stored when the
  // order was created. Rejects any payment where the stored amount doesn't match
  // the current job fee config (e.g. fee changed after order was created).
  const application = await Application.findById(paymentRecord.applicationId);
  if (!application) {
    console.error(
      `[payment.controller] verifyPayment: application ${paymentRecord.applicationId} not found`
    );
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Application not found');
  }

 // ✅ Replace with this
const job = application.jobSnapshot;
if (!job) {
  throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job snapshot not found during verification');
}
  const personalData  = application.sections?.get('personal')?.data ?? {};
  const rawCategory   = personalData.category ?? 'GEN';
  const isPwd         = Boolean(personalData.disability);
  const { totalAmount: expectedAmount } = calculateApplicationFee(
    job.applicationFee, rawCategory, isPwd
  );

  // If the stored amount differs from the expected amount, reject — amount was tampered
  // or the fee config changed. Either way it is not safe to proceed.
  if (paymentRecord.amount !== expectedAmount) {
    paymentRecord.status = PAYMENT_STATUS.FAILED;
    paymentRecord.rawVerificationData = {
      razorpayOrderId,
      razorpayPaymentId,
      error: 'amount_mismatch',
      storedAmount: paymentRecord.amount,
      expectedAmount,
    };
    await paymentRecord.save();

    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Payment amount mismatch. Please restart the payment process.'
    );
  }

  // ── 5. §15: HMAC-SHA256 signature verification — primary cryptographic proof ──────
  // Uses timingSafeEqual internally (see razorpay.service.js) to prevent timing attacks.
  let isValid;
  try {
    isValid = razorpayService.verifySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
  } catch {
    // timingSafeEqual throws if buffer lengths differ (malformed/truncated signature)
    isValid = false;
  }

  if (!isValid) {
    // §11: PENDING → FAILED transition on invalid signature
    paymentRecord.status = PAYMENT_STATUS.FAILED;
    paymentRecord.rawVerificationData = {
      razorpayOrderId,
      razorpayPaymentId,
      error: 'invalid_signature',
    };
    await paymentRecord.save();

    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Payment verification failed. Invalid signature.'
    );
  }

  // ── 6. §11: PENDING → PAID — immutable terminal state ───────────────────────────
  paymentRecord.status             = PAYMENT_STATUS.PAID;
  paymentRecord.razorpayPaymentId  = razorpayPaymentId;
  paymentRecord.rawVerificationData = {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    verifiedAt: new Date().toISOString(),
  };
  await paymentRecord.save();

  // ── 7. §11: Mark Application submitted ──────────────────────────────────────────
  markApplicationSubmitted(application, PAYMENT_STATUS.PAID, userId);
  await application.save();

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        paymentStatus:     PAYMENT_STATUS.PAID,
        applicationStatus: application.status,
        applicationId:     application._id,
      },
      'Payment verified and application submitted successfully!'
    )
  );
});

// ---------------------------------------------------------------------------
// GET /api/v1/payments/status/:applicationId
// ---------------------------------------------------------------------------

/**
 * Returns the current payment and application statuses from the local DB.
 * §14: No external Razorpay API call — all data sourced from MongoDB.
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
        // Include orderId so frontend can resume a PENDING payment (§10)
        ...(paymentRecord?.status === PAYMENT_STATUS.PENDING && {
          pendingOrderId: paymentRecord.orderId,
        }),
      },
      'Payment status fetched successfully'
    )
  );
});
