import mongoose, { Schema } from 'mongoose';
import { APPLICATION_STATUS, JOB_SECTION_TYPES, JOB_FIELD_TYPES } from '../constants.js';

/* ---------------------------------------------
   Job Snapshot Sub Schema
--------------------------------------------- */
const jobSnapshotSchema = new Schema({
    title: String,
    jobCode: String,
    department: String,
    requiredSections: [{
        sectionType: {
            type: String,
            enum: JOB_SECTION_TYPES
        },
        isMandatory: Boolean,
        requiresPDF: Boolean,
        pdfLabel: String,
        maxPDFSize: Number,
        instructions: String
    }],
    customFields: [{
        fieldName: String,
        fieldType: {
            type: String,
            enum: JOB_FIELD_TYPES
        },
        options: [String],
        isMandatory: Boolean,
        section: String
    }]
}, { _id: false });

/* ---------------------------------------------
   Section Data Sub Schema
--------------------------------------------- */
const sectionDataSchema = new Schema({
    data: {
        type: Schema.Types.Mixed,
        default: {}
    },
    pdfUrl: String,
    cloudinaryId: String,
    savedAt: Date,
    isComplete: {
        type: Boolean,
        default: false
    },
    // Verification fields
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: String
}, { _id: false });

/* ---------------------------------------------
   Status History Sub Schema
--------------------------------------------- */
const statusHistorySchema = new Schema({
    status: {
        type: String,
        enum: Object.values(APPLICATION_STATUS),
        required: true
    },
    changedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    changedAt: {
        type: Date,
        default: Date.now
    },
    remarks: String
}, { _id: false });

/* ---------------------------------------------
   Main Application Schema
--------------------------------------------- */
const applicationSchema = new Schema({
    applicationNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    jobId: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
        index: true
    },

    // Snapshot of job config at time of application
    jobSnapshot: {
        type: jobSnapshotSchema,
        required: true
    },

    status: {
        type: String,
        enum: Object.values(APPLICATION_STATUS),
        default: APPLICATION_STATUS.DRAFT,
        index: true
    },

    submittedAt: Date,

    // Flexible sections storage
    sections: {
        type: Map,
        of: sectionDataSchema,
        default: {}
    },

    validationErrors: [{
        section: String,
        field: String,
        message: String
    }],

    // Locking mechanism
    isLocked: {
        type: Boolean,
        default: false
    },
    lockedAt: Date,

    // Review Details
    reviewNotes: String,
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,

    statusHistory: [statusHistorySchema]

}, {
    timestamps: true
});

/* ---------------------------------------------
   Indexes
--------------------------------------------- */
// Enforce one application per job per user
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Performance indexes
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ 'jobSnapshot.department': 1 });
applicationSchema.index({ createdAt: -1 });

/* ---------------------------------------------
   Middlewares
--------------------------------------------- */
// Optimistic Concurrency Control is handled by Mongoose __v by default via 'versionKey: false' if disabled, but enabled by default.
// We keep it enabled.

export const Application = mongoose.model('Application', applicationSchema);
