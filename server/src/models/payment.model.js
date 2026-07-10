import mongoose, { Schema } from 'mongoose';
import { PAYMENT_STATUS } from '../constants.js';

const paymentSchema = new Schema(
  {
    // Stripe Checkout Session ID (e.g. cs_xxxx) — created before the user pays
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Stripe Payment Intent ID (e.g. pi_xxxx) — available only after successful payment
    stripePaymentIntentId: {
      type: String,
      index: true,
      sparse: true,
    },
    // Stripe Event ID used for deduplication — prevents processing the same webhook twice
    stripeEventId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
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
    // Raw Stripe event data stored for audit / dispute resolution
    rawWebhookData: {
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