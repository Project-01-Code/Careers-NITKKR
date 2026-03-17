import mongoose, { Schema } from 'mongoose';
import { PAYMENT_STATUS } from '../constants.js';

const paymentSchema = new Schema(
  {
    // Razorpay order ID (e.g. order_xxxx) — created before the user pays
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Razorpay payment ID (e.g. pay_xxxx) — available only after successful payment
    razorpayPaymentId: {
      type: String,
      index: true,
      sparse: true,
    },
    // Amount in INR whole rupees (NOT paise)
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'inr',
      lowercase: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // e.g. 'card', 'upi', 'netbanking' — populated after verification
    paymentMethod: {
      type: String,
    },
    // Raw Razorpay payload stored for audit / dispute resolution
    // ⚠️ ASSUMPTION: This stores the verified { orderId, paymentId, signature } object.
    // Future webhook handlers can also populate this field.
    rawVerificationData: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Prevent duplicate successful payments for the same application.
 * Partial index only enforces uniqueness when status === PAID.
 * PENDING / FAILED records for the same application remain allowed (idempotent retries).
 */
paymentSchema.index(
  { applicationId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: PAYMENT_STATUS.PAID },
  }
);

export const Payment = mongoose.model('Payment', paymentSchema);