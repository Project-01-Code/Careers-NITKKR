import { z } from 'zod';
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
} from '../constants.js';

/* =========================================================
   APPLICATION FEE SCHEMA
========================================================= */

const applicationFeeSchema = z.object({
  general: z.number().min(0, 'General fee cannot be negative'),
  sc_st: z.number().min(0, 'SC/ST fee cannot be negative'),
  obc: z.number().min(0, 'OBC fee cannot be negative'),
  ews: z.number().min(0, 'EWS fee cannot be negative'),
  pwd: z.number().min(0, 'PwD fee cannot be negative'),
  isRequired: z.boolean().default(true),
});

/* =========================================================
   ELIGIBILITY CRITERIA SCHEMA
========================================================= */

const requiredDegreeSchema = z.object({
  level: z.enum(DEGREE_LEVELS),
  field: z.string().min(1, 'Degree field is required'),
  isMandatory: z.boolean().default(true),
});

const eligibilityCriteriaSchema = z
  .object({
    minAge: z
      .number()
      .int()
      .min(18, 'Minimum age must be at least 18')
      .max(100, 'Minimum age cannot exceed 100'),
    maxAge: z
      .number()
      .int()
      .min(18, 'Maximum age must be at least 18')
      .max(100, 'Maximum age cannot exceed 100'),
    ageRelaxation: z
      .object({
        SC: z.number().min(0).default(5),
        ST: z.number().min(0).default(5),
        OBC: z.number().min(0).default(3),
        PwD: z.number().min(0).default(10),
      })
      .optional()
      .default({ SC: 5, ST: 5, OBC: 3, PwD: 10 }),
    nationality: z
      .array(z.string().min(1))
      .min(1, 'At least one nationality is required')
      .default(['Indian']),
    minExperience: z
      .number()
      .int()
      .min(0, 'Minimum experience cannot be negative')
      .default(0),
    requiredDegrees: z
      .array(requiredDegreeSchema)
      .min(1, 'At least one required degree must be specified'),
  })
  .superRefine((data, ctx) => {
    if (data.maxAge <= data.minAge) {
      ctx.addIssue({
        path: ['maxAge'],
        message: 'Maximum age must be greater than minimum age',
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* =========================================================
   DOCUMENT SCHEMA
========================================================= */

const documentSchema = z.object({
  type: z.enum(JOB_DOCUMENT_TYPES),
  category: z.enum(JOB_CATEGORIES).optional(),
  label: z.string().min(1, 'Document label is required'),
  url: z.string().url('Invalid URL'),
  publicId: z.string().min(1, 'Cloudinary public ID is required'),
});

/* =========================================================
   REQUIRED SECTION SCHEMA
========================================================= */

const requiredSectionSchema = z
  .object({
    sectionType: z.enum(JOB_SECTION_TYPES),
    isMandatory: z.boolean().default(true),
    requiresPDF: z.boolean().default(false),
    pdfLabel: z.string().min(1, 'PDF label cannot be empty').optional(),
    maxPDFSize: z
      .number()
      .positive('PDF size must be positive')
      .max(20, 'Max PDF size is 20MB')
      .optional(),
    instructions: z.string().optional(),
  })
  .superRefine((section, ctx) => {
    if (section.requiresPDF && !section.pdfLabel) {
      ctx.addIssue({
        path: ['pdfLabel'],
        message: 'pdfLabel is required when requiresPDF is true',
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* =========================================================
   CUSTOM FIELD SCHEMA
========================================================= */

const customFieldSchema = z
  .object({
    fieldName: z.string().min(1, 'Field name is required'),
    fieldType: z.enum(JOB_FIELD_TYPES),
    options: z.array(z.string()).optional(),
    isMandatory: z.boolean().default(false),
    section: z.string().default('custom'),
  })
  .superRefine((field, ctx) => {
    if (
      field.fieldType === 'dropdown' &&
      (!field.options || field.options.length === 0)
    ) {
      ctx.addIssue({
        path: ['options'],
        message: 'Dropdown fields must have options',
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* =========================================================
   CREATE JOB SCHEMA
========================================================= */

export const createJobSchema = z
  .object({
    title: z
      .string()
      .min(5, 'Title must be at least 5 characters')
      .max(200, 'Title cannot exceed 200 characters'),

    advertisementNo: z
      .string()
      .regex(
        /^[A-Z0-9/-]+$/,
        'Advertisement number must be uppercase alphanumeric'
      ),

    department: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format'),

    designation: z.enum(JOB_DESIGNATIONS),

    grade: z.enum(JOB_GRADES).optional(),

    payLevel: z.enum(JOB_PAY_LEVELS),

    positions: z.number().int().min(1, 'At least one position is required'),

    recruitmentType: z.enum(JOB_RECRUITMENT_TYPES).default('external'),

    categories: z.array(z.enum(JOB_CATEGORIES)).optional().default([]),

    applicationFee: applicationFeeSchema,

    eligibilityCriteria: eligibilityCriteriaSchema,

    description: z
      .string()
      .min(50, 'Description must be at least 50 characters'),

    qualifications: z.array(z.string()).optional(),

    responsibilities: z.array(z.string()).optional(),

    documents: z.array(documentSchema).optional().default([]),

    requiredSections: z
      .array(requiredSectionSchema)
      .min(1, 'At least one required section is mandatory'),

    customFields: z.array(customFieldSchema).optional(),

    applicationStartDate: z
      .string()
      .datetime()
      .refine(
        (date) => new Date(date) > new Date(),
        'Application start date must be in the future'
      ),

    applicationEndDate: z.string().datetime(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const startDate = new Date(data.applicationStartDate);
    const endDate = new Date(data.applicationEndDate);

    if (endDate <= startDate) {
      ctx.addIssue({
        path: ['applicationEndDate'],
        message: 'Application end date must be after start date',
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* =========================================================
   UPDATE JOB SCHEMA
========================================================= */

export const updateJobSchema = createJobSchema.partial().strict();

/* =========================================================
   JOB FILTER SCHEMA (for query params)
========================================================= */

export const jobFilterSchema = z.object({
  status: z.enum(JOB_STATUSES).optional(),
  designation: z.enum(JOB_DESIGNATIONS).optional(),
  payLevel: z.enum(JOB_PAY_LEVELS).optional(),
  recruitmentType: z.enum(JOB_RECRUITMENT_TYPES).optional(),
  category: z.enum(JOB_CATEGORIES).optional(),
  department: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format')
    .optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'publishDate', 'applicationEndDate', 'payLevel'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
});
