import { z } from 'zod';

/**
 * Application Validators
 * Zod schemas for validating application-related requests
 */

/**
 * Create Application Schema
 * Validates request body for creating a new application
 */
export const createApplicationSchema = z.object({
  body: z.object({
    jobId: z.string().min(1, 'Job ID is required'),
  }),
});

/**
 * Get Applications Query Schema
 * Validates query parameters for listing applications
 */
export const getApplicationsQuerySchema = z.object({
  query: z.object({
    status: z
      .enum([
        'draft',
        'submitted',
        'under_review',
        'shortlisted',
        'rejected',
        'selected',
        'withdrawn',
      ])
      .optional(),
    jobId: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

/**
 * Save Section Schema
 * Validates request body for saving section data
 */
export const saveSectionSchema = z.object({
  body: z.object({
    data: z
      .record(z.any())
      .refine((data) => Object.keys(data).length > 0, {
        message: 'Section data cannot be empty',
      }),
  }),
  params: z.object({
    id: z.string().min(1, 'Application ID is required'),
    sectionType: z.string().min(1, 'Section type is required'),
  }),
});

/**
 * Withdraw Application Schema
 * Validates request body for withdrawing an application
 */
export const withdrawApplicationSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Application ID is required'),
  }),
});

/**
 * Section Type Param Schema
 * Validates sectionType parameter
 */
export const sectionTypeParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Application ID is required'),
    sectionType: z.string().min(1, 'Section type is required'),
  }),
});
