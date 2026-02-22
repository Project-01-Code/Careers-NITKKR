import mongoose, { Schema } from 'mongoose';
import {
  JOB_DESIGNATIONS,
  JOB_GRADES,
  JOB_PAY_LEVELS,
  JOB_RECRUITMENT_TYPES,
  JOB_CATEGORIES,
  JOB_DOCUMENT_TYPES,
  JOB_SECTION_TYPES,
  JOB_FIELD_TYPES,
  JOB_STATUSES,
  DEGREE_LEVELS,
  JOB_RECRUITMENT_TYPE,
  JOB_STATUS,
} from '../constants.js';

/* ---------------------------------------------
   Application Fee Sub Schema
--------------------------------------------- */
const applicationFeeSchema = new Schema(
  {
    general: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sc_st: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    obc: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    ews: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    pwd: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

/* ---------------------------------------------
   Eligibility Criteria Sub Schema
--------------------------------------------- */
const eligibilityCriteriaSchema = new Schema(
  {
    minAge: {
      type: Number,
      required: true,
      min: 18,
      max: 100,
    },
    maxAge: {
      type: Number,
      required: true,
      min: 18,
      max: 100,
    },
    ageRelaxation: {
      SC: { type: Number, default: 5 },
      ST: { type: Number, default: 5 },
      OBC: { type: Number, default: 3 },
      PwD: { type: Number, default: 10 },
    },
    nationality: {
      type: [String],
      required: true,
      default: ['Indian'],
    },
    minExperience: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    requiredDegrees: [
      {
        level: {
          type: String,
          enum: DEGREE_LEVELS,
          required: true,
        },
        field: {
          type: String,
          required: true,
          trim: true,
        },
        isMandatory: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  { _id: false }
);

/* ---------------------------------------------
   Document Sub Schema (Advertisements, Forms, Annexures)
--------------------------------------------- */
const documentSchema = new Schema(
  {
    type: {
      type: String,
      enum: JOB_DOCUMENT_TYPES,
      required: true,
    },
    category: {
      type: String,
      enum: JOB_CATEGORIES,
      default: null,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/* ---------------------------------------------
   Required Sections Sub Schema
--------------------------------------------- */
const requiredSectionSchema = new Schema(
  {
    sectionType: {
      type: String,
      enum: JOB_SECTION_TYPES,
      required: true,
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
    requiresPDF: {
      type: Boolean,
      default: false,
    },
    pdfLabel: {
      type: String,
      default: null,
    },
    maxPDFSize: {
      type: Number,
      default: 5, // MB
    },
    instructions: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

/* ---------------------------------------------
   Custom Fields Sub Schema
--------------------------------------------- */
const customFieldSchema = new Schema(
  {
    fieldName: {
      type: String,
      required: true,
      trim: true,
    },
    fieldType: {
      type: String,
      enum: JOB_FIELD_TYPES,
      required: true,
    },
    options: [String], // only used for dropdown
    isMandatory: {
      type: Boolean,
      default: false,
    },
    section: {
      type: String,
      default: 'custom',
    },
  },
  { _id: false }
);

/* ---------------------------------------------
   Main Job Schema
--------------------------------------------- */
const jobSchema = new Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },

    advertisementNo: {
      type: String,
      required: [true, 'Advertisement number is required'],
      trim: true,
      uppercase: true,
    },

    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },

    // Position Details (specific)
    designation: {
      type: String,
      required: true,
      enum: JOB_DESIGNATIONS,
    },

    grade: {
      type: String,
      enum: JOB_GRADES,
      default: null,
    },

    payLevel: {
      type: String,
      required: true,
      enum: JOB_PAY_LEVELS,
    },

    positions: {
      type: Number,
      required: true,
      min: 1,
    },

    // Recruitment Classification
    recruitmentType: {
      type: String,
      required: true,
      enum: JOB_RECRUITMENT_TYPES,
      default: JOB_RECRUITMENT_TYPE.EXTERNAL,
    },

    categories: [
      {
        type: String,
        enum: JOB_CATEGORIES,
      },
    ],

    // Application Fee Structure
    applicationFee: {
      type: applicationFeeSchema,
      required: true,
    },

    // Eligibility Criteria
    eligibilityCriteria: {
      type: eligibilityCriteriaSchema,
      required: true,
    },

    // Job Details
    description: {
      type: String,
      required: true,
    },

    qualifications: [String],
    responsibilities: [String],

    // Documents (Advertisement, Application Forms, Annexures)
    documents: [documentSchema],

    // Application configuration
    requiredSections: [requiredSectionSchema],

    customFields: [customFieldSchema],

    // Timeline
    publishDate: {
      type: Date,
      default: null,
    },

    applicationStartDate: {
      type: Date,
      required: true,
    },

    applicationEndDate: {
      type: Date,
      required: true,
    },

    // Status Management
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: JOB_STATUS.DRAFT,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    // Soft Delete
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },

    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ---------------------------------------------
   Indexes for Performance
--------------------------------------------- */

// Unique advertisement number
jobSchema.index({ advertisementNo: 1 }, { unique: true });

// Compound index for filtering active jobs
jobSchema.index({ status: 1, deletedAt: 1, applicationEndDate: 1 });

// Filtering indexes
jobSchema.index({ designation: 1, payLevel: 1 });
jobSchema.index({ recruitmentType: 1 });
jobSchema.index({ department: 1 });
jobSchema.index({ categories: 1 });

// Timestamp index for sorting
jobSchema.index({ createdAt: -1 });
jobSchema.index({ publishDate: -1 });

/* ---------------------------------------------
   Virtual Fields
--------------------------------------------- */

// isActive: derived from status, deletedAt, and applicationEndDate
jobSchema.virtual('isActive').get(function () {
  return (
    this.status === 'published' &&
    !this.deletedAt &&
    this.applicationEndDate > new Date()
  );
});

/* ---------------------------------------------
   Pre-save Validation
--------------------------------------------- */

jobSchema.pre('save', function () {
  // Validate application dates
  if (this.applicationEndDate <= this.applicationStartDate) {
    throw new Error('Application end date must be after start date');
  }

  // Validate age limits
  if (
    this.eligibilityCriteria &&
    this.eligibilityCriteria.maxAge <= this.eligibilityCriteria.minAge
  ) {
    throw new Error('Maximum age must be greater than minimum age');
  }
});

/* ---------------------------------------------
   Export Model
--------------------------------------------- */

export const Job = mongoose.model('Job', jobSchema);
