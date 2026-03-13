import mongoose, { Schema } from 'mongoose';
import { REVIEW_STATUS, REVIEW_RECOMMENDATION } from '../constants.js';

/**
 * Scorecard sub-schema for structured expert assessment
 * Academic: Max 50, Research: Max 30, Experience: Max 20, Total: Max 100
 */
const scorecardSchema = new Schema(
  {
    academicScore: { type: Number, min: 0, max: 50, default: 0 },
    researchScore: { type: Number, min: 0, max: 30, default: 0 },
    experienceScore: { type: Number, min: 0, max: 20, default: 0 },
    totalScore: { type: Number, min: 0, max: 100, default: 0 },
    recommendation: {
      type: String,
      enum: REVIEW_RECOMMENDATION,
      default: REVIEW_RECOMMENDATION[2], // HOLD
    },
    comments: { type: String, default: '' },
  },
  { _id: false }
);

/**
 * Section verification tracking for reviewer's PDF review
 */
const sectionVerificationSchema = new Schema(
  {
    status: { type: String, enum: ['verified', 'rejected', 'pending'], default: 'pending' },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

/**
 * Review Model - Independent expert assessment of an application
 */
const reviewSchema = new Schema(
  {
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    scorecard: {
      type: scorecardSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: REVIEW_STATUS,
      default: 'PENDING',
      index: true,
    },
    sectionVerifications: {
      type: Map,
      of: sectionVerificationSchema,
      default: {},
    },
  },
  { timestamps: true }
);

// One review per reviewer per application (compound index supports applicationId queries)
reviewSchema.index({ reviewerId: 1, applicationId: 1 }, { unique: true });

// Pre-save: auto-calculate totalScore
reviewSchema.pre('save', function () {
  if (this.scorecard) {
    this.scorecard.totalScore =
      (this.scorecard.academicScore || 0) +
      (this.scorecard.researchScore || 0) +
      (this.scorecard.experienceScore || 0);
  }
});

export const Review = mongoose.model('Review', reviewSchema);
