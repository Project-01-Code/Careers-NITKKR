import mongoose, { Schema } from 'mongoose';

const noticeSchema = new Schema(
  {
    heading: {
      type: String,
      required: [true, 'Heading is required'],
      trim: true,
    },
    advtNo: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Faculty Recruitment',
          'Non-Teaching Positions',
          'Project & Research Staff',
          'Guest & Adjunct Faculty',
          'Results & Shortlisting',
          'Important Notifications',
        ],
        message: '{VALUE} is not a valid category',
      },
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    cloudinaryId: {
      type: String,
      default: null,
    },
    externalLink: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying of active notices sorted by date
noticeSchema.index({ isActive: 1, createdAt: -1 });

export const Notice = mongoose.model('Notice', noticeSchema);
