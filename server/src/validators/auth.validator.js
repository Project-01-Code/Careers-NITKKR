import { z } from 'zod';

/**
 * User Registration Schema
 */
export const registerSchema = z.object({
  body: z.object({
    fullName: z
      .string({ required_error: 'Full name is required' })
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .trim(),

    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),

    username: z
      .string({ required_error: 'Username is required' })
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must not exceed 30 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores'
      )
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
 */
export const loginSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .trim()
        .optional(),

      username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .toLowerCase()
        .trim()
        .optional(),

      password: z
        .string({ required_error: 'Password is required' })
        .min(1, 'Password is required'),
    })
    .refine((data) => data.email || data.username, {
      message: 'Either email or username is required',
      path: ['email'],
    }),
});

/**
 * Refresh Token Schema
 */
export const refreshTokenSchema = z
  .object({
    body: z.object({
      refreshToken: z.string().optional(),
    }),
    cookies: z
      .object({
        refreshToken: z.string().optional(),
      })
      .optional(),
  })
  .refine((data) => data.body.refreshToken || data.cookies?.refreshToken, {
    message: 'Refresh token is required',
    path: ['body', 'refreshToken'],
  });
