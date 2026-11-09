import { z } from 'zod';

// Authentication Schemas
export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username cannot exceed 24 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(60),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().optional()
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Please enter your username or email'),
  password: z.string().min(1, 'Please enter your password')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Call Initiation Schema
export const initiateCallSchema = z.object({
  callType: z.enum(['INTERNET_WEBRTC', 'TELECOM_PSTN']),
  targetUserId: z.string().optional(),
  targetUsername: z.string().optional(),
  destinationNumber: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format. Use E.164 e.g. +919876543210')
    .optional()
}).refine(
  (data) => {
    if (data.callType === 'INTERNET_WEBRTC') {
      return Boolean(data.targetUserId || data.targetUsername);
    }
    if (data.callType === 'TELECOM_PSTN') {
      return Boolean(data.destinationNumber);
    }
    return false;
  },
  {
    message: 'Destination user or phone number is required depending on call type'
  }
);

// Wallet Schemas
export const topUpWalletSchema = z.object({
  amountPaise: z
    .number()
    .int('Amount must be an integer in paise')
    .min(10000, 'Minimum top-up is ₹100 (10,000 paise)')
    .max(1000000, 'Maximum top-up is ₹10,000 (1,000,000 paise)'),
  planId: z.string().optional()
});

// User Search Schema
export const searchUserSchema = z.object({
  query: z.string().min(1, 'Search query must not be empty').max(50)
});

// Update Profile Schema
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(60).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone format').optional().nullable(),
  avatarUrl: z.string().url().optional().nullable()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type InitiateCallInput = z.infer<typeof initiateCallSchema>;
export type TopUpWalletInput = z.infer<typeof topUpWalletSchema>;
export type SearchUserInput = z.infer<typeof searchUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

