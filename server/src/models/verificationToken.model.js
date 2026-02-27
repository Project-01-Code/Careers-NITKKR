import mongoose, { Schema } from 'mongoose';
import { TOKEN_TYPES } from '../constants.js';

const verificationTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(TOKEN_TYPES),
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// Auto-delete documents when expiresAt is reached
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// One active OTP per user per type
verificationTokenSchema.index({ userId: 1, type: 1 }, { unique: true });

export const VerificationToken = mongoose.model(
  'VerificationToken',
  verificationTokenSchema
);
