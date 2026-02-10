import { z } from 'zod';

/* =========================================================
   ENUMS (single source of truth)
========================================================= */

const JOB_CATEGORIES = ['Faculty', 'Non-Teaching', 'Research'];

const SECTION_TYPES = [
    'personal',
    'education',
    'experience',
    'research',
    'publications',
    'references',
    'documents',
    'custom',
];

const FIELD_TYPES = ['text', 'number', 'date', 'dropdown'];

/* =========================================================
   REQUIRED SECTION SCHEMA
========================================================= */

const requiredSectionSchema = z
    .object({
        sectionType: z.enum(SECTION_TYPES),

        isMandatory: z.boolean().default(true),

        requiresPDF: z.boolean().default(false),

        pdfLabel: z
            .string()
            .min(1, 'PDF label cannot be empty')
            .optional(),

        maxPDFSize: z
            .number()
            .positive('PDF size must be positive')
            .max(20, 'Max PDF size is 20MB')
            .optional(),

        instructions: z.string().optional(),
    })
    .superRefine((section, ctx) => {
        // If PDF is required → label must exist
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

        fieldType: z.enum(FIELD_TYPES),

        options: z.array(z.string()).optional(),

        isMandatory: z.boolean().default(false),
    })
    .superRefine((field, ctx) => {
        // Dropdown must have options
        if (field.fieldType === 'dropdown' && (!field.options || field.options.length === 0)) {
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

        jobCode: z
            .string()
            .regex(/^[A-Z0-9/-]+$/, 'Job code must be uppercase alphanumeric'),

        category: z.enum(JOB_CATEGORIES),

        department: z.string().min(2, 'Department is required'),

        positions: z.number().int().min(1, 'At least one position is required'),

        description: z.string().min(50, 'Description must be at least 50 characters'),

        qualifications: z.array(z.string()).optional(),

        responsibilities: z.array(z.string()).optional(),

        payScale: z.object({
            payLevel: z.string().min(1, 'Pay Level is required'),
            entryPay: z.number().positive('Entry Pay must be positive'),
            payBand: z.string().optional(),
            gradePay: z.number().optional(),
        }),

        requiredSections: z
            .array(requiredSectionSchema)
            .min(1, 'At least one required section is mandatory'),

        customFields: z.array(customFieldSchema).optional(),

        applicationDeadline: z
            .string()
            .datetime()
            .refine(
                (date) => new Date(date) > new Date(),
                'Application deadline must be in the future'
            ),

        startDate: z.string().datetime().optional(),
    })
    .strict(); // 🚨 Reject unknown fields

/* =========================================================
   UPDATE JOB SCHEMA
========================================================= */

export const updateJobSchema = createJobSchema.partial().strict();
