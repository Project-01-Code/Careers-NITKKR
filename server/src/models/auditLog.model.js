import mongoose, { Schema } from 'mongoose';

const auditLogSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        resourceType: {
            type: String,
            required: true,
            trim: true,
        },
        resourceId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        changes: {
            before: { type: Object },
            after: { type: Object },
        },
        ipAddress: {
            type: String,
            default: '',
        },
        userAgent: {
            type: String,
            default: '',
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Only for createdAt/updatedAt management if needed, but we have manual timestamp
    }
);

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
