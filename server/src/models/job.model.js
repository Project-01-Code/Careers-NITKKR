import mongoose, { Schema } from 'mongoose';

/* ---------------------------------------------
   Required Sections Sub Schema
--------------------------------------------- */
const requiredSectionSchema = new Schema(
  {
    sectionType: {
      type: String,
      enum: [
        'personal',
        'education',
        'experience',
        'research',
        'publications',
        'references',
        'documents',
        'custom',
      ],
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
      enum: ['text', 'number', 'date', 'dropdown'],
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
   Pay Scale Sub Schema (Indian Govt Standard)
--------------------------------------------- */
const payScaleSchema = new Schema(
  {
    payLevel: {
      type: String, // e.g., "Level-10", "Level-14"
      required: true,
      trim: true,
    },
    entryPay: {
      type: Number, // e.g., 57700
      required: true,
    },
    payBand: {
      type: String, // e.g., "PB-3 (15600-39100)"
      default: null,
    },
    gradePay: {
      type: Number, // Legacy 6th CPC
      default: null,
    },
  },
  { _id: false }
);

/* ---------------------------------------------
   Main Job Schema
--------------------------------------------- */
const jobSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },

    jobCode: {
      type: String,
      required: [true, 'Job code is required'],
      trim: true,
      uppercase: true,
    },

    category: {
      type: String,
      required: true,
      enum: ['Faculty', 'Non-Teaching', 'Research'],
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    positions: {
      type: Number,
      required: true,
      min: 1,
    },

    description: {
      type: String,
      required: true,
    },

    qualifications: [String],
    responsibilities: [String],

    payScale: {
      type: payScaleSchema,
      required: true,
    },

    employmentType: {
      type: String,
      enum: ['Permanent', 'Contract', 'Temporary'],
      default: 'Permanent',
    },

    requiredSections: [requiredSectionSchema],

    customFields: [customFieldSchema],

    noticeId: {
      type: Schema.Types.ObjectId,
      ref: 'Notice',
      default: null,
    },

    applicationDeadline: {
      type: Date,
      required: true,
    },

    startDate: Date,

    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'cancelled'],
      default: 'draft',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    publishedAt: Date,
    closedAt: Date,
  },
  {
    timestamps: true,
  }
);

/* ---------------------------------------------
   Indexes
--------------------------------------------- */

jobSchema.index({ jobCode: 1 }, { unique: true });

jobSchema.index({
  status: 1,
  isActive: 1,
  applicationDeadline: 1,
});

jobSchema.index({ category: 1, department: 1 });

jobSchema.index({ noticeId: 1 });

/* ---------------------------------------------
   Deadline Validation Hook
--------------------------------------------- */

jobSchema.pre('save', async function () {
  if (this.isNew && this.applicationDeadline <= new Date()) {
    throw new Error('Application deadline must be in the future');
  }
});


/* ---------------------------------------------
   Model Export
--------------------------------------------- */

export const Job = mongoose.model('Job', jobSchema);
