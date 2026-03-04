import { z } from 'zod';
import { APPLICATION_STATUS, JOB_SECTION_TYPES } from '../constants.js';

/** Create Application Schema */
export const createApplicationSchema = z.object({
  body: z.object({
    jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid job ID format'),
  }),
});

/** Get Applications Query Schema */
export const getApplicationsQuerySchema = z.object({
  query: z.object({
    status: z.enum(Object.values(APPLICATION_STATUS)).optional(),
    jobId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid job ID format')
      .optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

/** Save Section Schema */
export const saveSectionSchema = z.object({
  body: z.object({
    data: z
      .record(z.string(), z.any())
      .refine((data) => Object.keys(data).length > 0, {
        message: 'Section data cannot be empty',
      }),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID format'),
    sectionType: z.enum(JOB_SECTION_TYPES),
  }),
});

/** Withdraw Application Schema */
export const withdrawApplicationSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID format'),
  }),
});

/** Section Type Param Schema */
export const sectionTypeParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID format'),
    sectionType: z.enum(JOB_SECTION_TYPES),
  }),
});
