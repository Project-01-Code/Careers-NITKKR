import { z } from 'zod';

/**
 * User Registration Schema
 * Email-only authentication with strong password requirements
 * Password policy: Minimum 8 characters, uppercase, lowercase, and number required
 */
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),

    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
});

/**
 * User Login Schema
 * Password validation (only presence check)
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),

    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

/**
 * Refresh Token Schema
 * Accepts token from request body or cookies
 */
export const refreshTokenSchema = z
  .object({
    body: z
      .object({
        refreshToken: z.string().optional(),
      })
      .optional(),
    cookies: z
      .object({
        refreshToken: z.string().optional(),
      })
      .optional(),
  })
  .refine((data) => data.body?.refreshToken || data.cookies?.refreshToken, {
    message: 'Refresh token is required',
    path: ['refreshToken'],
  });

/**
 * Update Profile Schema
 * Allows updating profile fields only. No auth or RBAC fields.
 * Phone format: E.164 international format (e.g., +919876543210)
 */
export const updateProfileSchema = z.object({
  body: z
    .object({
      firstName: z
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must not exceed 50 characters')
        .optional(),
      lastName: z
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must not exceed 50 characters')
        .optional(),
      phone: z
        .string()
        .regex(
          /^\+?[1-9]\d{1,14}$/,
          'Invalid phone number format (E.164 format expected, e.g., +919876543210)'
        )
        .optional(),
      dateOfBirth: z
        .string()
        .optional()
        .refine(
          (date) => !date || !isNaN(Date.parse(date)),
          'Invalid date format'
        )
        .transform((date) => (date ? new Date(date) : undefined)),
      nationality: z
        .string()
        .min(2, 'Nationality must be at least 2 characters')
        .max(50, 'Nationality must not exceed 50 characters')
        .trim()
        .optional(),
    })
    .refine(
      (profile) => {
        const keys = Object.keys(profile);
        return keys.length > 0;
      },
      { message: 'At least one profile field must be provided' }
    ),
});
