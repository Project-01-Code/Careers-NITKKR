import mongoose, { Schema } from 'mongoose';
import { PAYMENT_STATUS } from '../constants.js';

const paymentSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentIntentId: {
      type: String,
      index: true,
      sparse: true,
    },
    // Amount in INR (whole rupees, NOT paise)
    amount: {
      type: Number,
      required: true,
    },
    // Always stored lowercase to match Stripe's convention ('inr')
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
    // e.g. 'card', 'upi', 'netbanking' — populated from webhook
    paymentMethod: {
      type: String,
    },
    // Full Stripe webhook event stored for audit / dispute resolution
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
 * A partial unique index only fires when status === PAID, so pending/failed
 * records for the same application are still allowed (e.g. retry after failure).
 */
paymentSchema.index(
  { applicationId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: PAYMENT_STATUS.PAID },
  }
);

export const Payment = mongoose.model('Payment', paymentSchema);