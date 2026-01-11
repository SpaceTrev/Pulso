import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Game schemas
export const GameResultSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  gameType: z.enum(['slots', 'dice', 'crash']),
  betAmount: z.number().positive(),
  multiplier: z.number().positive(),
  payout: z.number().nonnegative(),
  seed: z.string(),
  createdAt: z.date(),
});

export const CreateGameResultSchema = GameResultSchema.omit({
  id: true,
  createdAt: true,
});

// Types
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type GameResult = z.infer<typeof GameResultSchema>;
export type CreateGameResult = z.infer<typeof CreateGameResultSchema>;
