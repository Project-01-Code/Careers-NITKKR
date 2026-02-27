import mongoose, { Schema } from 'mongoose';

export const PAYMENT_STATUS = {
    CREATED: 'created',
    PAID: 'paid',
    FAILED: 'failed',
};

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
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.CREATED,
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
        paymentMethod: {
            type: String, // e.g., 'upi', 'card', 'netbanking'
        },
        rawWebhookData: {
            type: Schema.Types.Mixed, // Store complete webhook response for audit
        },
    },
    {
        timestamps: true,
    }
);

// Prevent multiple successful payments for the same application
paymentSchema.index(
    { applicationId: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: PAYMENT_STATUS.PAID } }
);

export const Payment = mongoose.model('Payment', paymentSchema);
