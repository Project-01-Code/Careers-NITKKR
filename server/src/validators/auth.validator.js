import { z } from 'zod';

// Reusable Field Definitions

/**
 * Trims and lowercases the raw string before piping into z.email().
 * Using .pipe() is the Zod 4 replacement for the deprecated .email() method.
 */
const emailField = (requiredMsg = 'Email is required') =>
  z
    .string({ required_error: requiredMsg })
    .trim()
    .toLowerCase()
    .pipe(z.email('Invalid email format'));

/**
 * Numeric OTP as a string - exact length enforced in OTP_CONFIG on the server,
 * but we at least make sure at least 1 character was sent.
 */
const otpField = z
  .string({ required_error: 'OTP is required' })
  .min(1, 'OTP is required');

// Auth Schemas

/**
 * POST /auth/register
 * Password policy: 8-100 chars, uppercase + lowercase + digit required.
 */
export const registerSchema = z.object({
  body: z.object({
    email: emailField(),

    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),

    otp: otpField,
  }),
});

/**
 * POST /auth/login
 * Only presence check on password - avoid leaking policy info on login.
 */
export const loginSchema = z.object({
  body: z.object({
    email: emailField(),

    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

/**
 * POST /auth/refresh-token
 * Accepts token from request body OR cookies (either is fine).
 */
export const refreshTokenSchema = z
  .object({
    body: z.object({ refreshToken: z.string().optional() }).optional(),
    cookies: z.object({ refreshToken: z.string().optional() }).optional(),
  })
  .refine(
    (data) => {
      const bodyToken = data.body?.refreshToken;
      const cookieToken = data.cookies?.refreshToken;
      return (
        (typeof bodyToken === 'string' && bodyToken.trim().length > 0) ||
        (typeof cookieToken === 'string' && cookieToken.trim().length > 0)
      );
    },
    {
      message: 'Refresh token is required (must be a non-empty string)',
      path: ['refreshToken'],
    }
  );

// Profile Schemas

/**
 * PATCH /auth/profile
 * All fields optional, but at least one must be present.
 * Phone: E.164 format (e.g. +919876543210).
 */
export const updateProfileSchema = z.object({
  body: z
    .object({
      firstName: z
        .string()
        .trim()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must not exceed 50 characters')
        .optional(),
      lastName: z
        .string()
        .trim()
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
    .refine((profile) => Object.keys(profile).length > 0, {
      message: 'At least one profile field must be provided',
    }),
});

// OTP Schemas

/**
 * POST /auth/verify-email/send
 * Public endpoint - user identifies themselves by email.
 */
export const sendEmailVerificationSchema = z.object({
  body: z.object({
    email: emailField(),
  }),
});

/**
 * POST /auth/verify-email/confirm
 * Public endpoint - email + OTP required.
 */
export const verifyEmailOTPSchema = z.object({
  body: z.object({
    email: emailField(),
    otp: otpField,
  }),
});

/**
 * POST /auth/reset-password/send
 * Public endpoint - user identifies themselves by email.
 */
export const sendPasswordResetSchema = z.object({
  body: z.object({
    email: emailField(),
  }),
});

/**
 * POST /auth/reset-password/confirm
 * Public endpoint - email + OTP + new password required.
 * Same password policy as registration.
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    email: emailField(),
    otp: otpField,
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
});
