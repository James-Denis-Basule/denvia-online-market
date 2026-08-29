import { z } from 'zod';

export const accountTypeSchema = z.enum(['customer', 'business']);

export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),

  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters'),

  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),

  phone: z
    .string()
    .trim()
    .optional(),

  accountType: accountTypeSchema.default('customer'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),

  password: z
    .string()
    .min(1, 'Password is required'),
});

export type AccountType = z.infer<typeof accountTypeSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
