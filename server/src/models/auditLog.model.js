import mongoose, { Schema } from 'mongoose';
import { RESOURCE_TYPES } from '../constants.js';

const auditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: Object.values(RESOURCE_TYPES),
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
    },
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

// Prevent modifications to audit logs (append-only)
auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    throw new Error('Audit logs are append-only and cannot be modified');
  }
  next();
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
