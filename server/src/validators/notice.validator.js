import { z } from 'zod';

/**
 * Notice Categories Enum
 */
const noticeCategories = [
  'Faculty Recruitment',
  'Non-Teaching Positions',
  'Project & Research Staff',
  'Guest & Adjunct Faculty',
  'Results & Shortlisting',
  'Important Notifications',
];

/**
 * Create Notice Schema
 */
export const createNoticeSchema = z.object({
  body: z.object({
    heading: z
      .string({ required_error: 'Heading is required' })
      .min(5, 'Heading must be at least 5 characters')
      .max(200, 'Heading must not exceed 200 characters')
      .trim(),

    advtNo: z.string().trim().optional().nullable(),

    category: z.enum(noticeCategories, {
      errorMap: () => ({ message: 'Invalid category selected' }),
    }),

    externalLink: z
      .string()
      .url('External link must be a valid URL')
      .trim()
      .optional()
      .nullable(),
  }),
});

/**
 * Update Notice Schema
 */
export const updateNoticeSchema = z.object({
  body: z.object({
    heading: z
      .string()
      .min(5, 'Heading must be at least 5 characters')
      .max(200, 'Heading must not exceed 200 characters')
      .trim()
      .optional(),

    advtNo: z.string().trim().optional().nullable(),

    category: z
      .enum(noticeCategories, {
        errorMap: () => ({ message: 'Invalid category selected' }),
      })
      .optional(),

    externalLink: z
      .string()
      .url('External link must be a valid URL')
      .trim()
      .optional()
      .nullable(),

    isActive: z.boolean().optional(),
  }),
});

/**
 * Get Notices Query Schema (for pagination)
 */
export const getNoticesQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive number')
      .transform(Number)
      .refine((val) => val > 0, 'Page must be greater than 0')
      .optional()
      .default('1'),

    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive number')
      .transform(Number)
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('4'),

    category: z
      .enum(noticeCategories, {
        errorMap: () => ({ message: 'Invalid category selected' }),
      })
      .optional(),
  }),
});

/**
 * Notice ID Param Schema
 */
export const noticeIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid notice ID format'),
  }),
});
