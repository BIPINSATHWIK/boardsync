const { z } = require('zod');

const signupSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, { message: 'Email is required' })
      .email({ message: 'Email must contain @ and a valid domain (e.g. you@example.com)' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' })
      .max(128, { message: 'Password too long' }),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(1, { message: 'Password is required' }),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
  }),
});

module.exports = { signupSchema, loginSchema, refreshSchema };
