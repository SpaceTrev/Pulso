import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const CurrencySchema = z.enum(['GC', 'SC']);
export type Currency = z.infer<typeof CurrencySchema>;

export const UserRoleSchema = z.enum(['USER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const GameTypeSchema = z.enum(['DICE']);
export type GameType = z.infer<typeof GameTypeSchema>;

export const DiceDirectionSchema = z.enum(['over', 'under']);
export type DiceDirection = z.infer<typeof DiceDirectionSchema>;

export const LedgerReasonSchema = z.enum([
  'INITIAL_GRANT',
  'ADMIN_GRANT',
  'DAILY_CLAIM',
  'GAME_PLAY',
  'GAME_WIN',
  'REDEMPTION_REQUEST',
  'REDEMPTION_REFUND',
  'PURCHASE',
]);
export type LedgerReason = z.infer<typeof LedgerReasonSchema>;

export const RedemptionStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'PAID',
]);
export type RedemptionStatus = z.infer<typeof RedemptionStatusSchema>;

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

// ============================================================================
// BALANCE SCHEMAS
// ============================================================================

export const BalanceSchema = z.object({
  gc: z.string(), // BigInt as string
  sc: z.string(), // BigInt as string
});
export type Balance = z.infer<typeof BalanceSchema>;

export const LedgerEntrySchema = z.object({
  id: z.string().uuid(),
  currency: CurrencySchema,
  delta: z.string(), // BigInt as string (signed)
  reason: LedgerReasonSchema,
  refType: z.string().nullable(),
  refId: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

// ============================================================================
// PROVABLY FAIR SCHEMAS
// ============================================================================

export const ProvablyFairCommitSchema = z.object({
  serverSeedHash: z.string(),
  clientSeed: z.string(),
  nonce: z.number().int().nonnegative(),
});
export type ProvablyFairCommit = z.infer<typeof ProvablyFairCommitSchema>;

export const SetClientSeedSchema = z.object({
  clientSeed: z
    .string()
    .min(1, 'Client seed is required')
    .max(64, 'Client seed too long'),
});
export type SetClientSeedInput = z.infer<typeof SetClientSeedSchema>;

// ============================================================================
// GAME SCHEMAS
// ============================================================================

// BigInt amount as string, validated to be positive
const AmountStringSchema = z
  .string()
  .regex(/^\d+$/, 'Amount must be a positive integer string')
  .refine((val) => BigInt(val) > 0n, 'Amount must be greater than 0');

export const DicePlaySchema = z.object({
  currency: CurrencySchema,
  amount: AmountStringSchema,
  target: z.number().int().min(1).max(9800), // 0.01% to 98%
  direction: DiceDirectionSchema,
});
export type DicePlayInput = z.infer<typeof DicePlaySchema>;

export const GamePlaySchema = z.object({
  id: z.string().uuid(),
  gameType: GameTypeSchema,
  currency: CurrencySchema,
  amount: z.string(),
  payoutAmount: z.string(),
  direction: z.string(),
  target: z.number(),
  result: z.number(),
  win: z.boolean(),
  multiplier: z.number(),
  pfServerSeedHash: z.string(),
  pfClientSeed: z.string(),
  pfNonce: z.number(),
  createdAt: z.string().datetime(),
});
export type GamePlay = z.infer<typeof GamePlaySchema>;

export const GameVerifySchema = z.object({
  id: z.string().uuid(),
  serverSeed: z.string().nullable(),
  serverSeedHash: z.string(),
  clientSeed: z.string(),
  nonce: z.number(),
  result: z.number(),
  verified: z.boolean(),
});
export type GameVerify = z.infer<typeof GameVerifySchema>;

// ============================================================================
// DAILY CLAIM SCHEMAS
// ============================================================================

export const DailyClaimResponseSchema = z.object({
  success: z.boolean(),
  amount: z.string(),
  nextClaimAt: z.string().datetime(),
});
export type DailyClaimResponse = z.infer<typeof DailyClaimResponseSchema>;

export const DailyClaimStatusSchema = z.object({
  canClaim: z.boolean(),
  lastClaimAt: z.string().datetime().nullable(),
  nextClaimAt: z.string().datetime().nullable(),
});
export type DailyClaimStatus = z.infer<typeof DailyClaimStatusSchema>;

// ============================================================================
// REDEMPTION SCHEMAS
// ============================================================================

export const CreateRedemptionSchema = z.object({
  amountSc: AmountStringSchema,
});
export type CreateRedemptionInput = z.infer<typeof CreateRedemptionSchema>;

export const RedemptionSchema = z.object({
  id: z.string().uuid(),
  amountSc: z.string(),
  status: RedemptionStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Redemption = z.infer<typeof RedemptionSchema>;

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const AdminGrantSchema = z.object({
  userId: z.string().uuid(),
  currency: CurrencySchema,
  amount: AmountStringSchema,
});
export type AdminGrantInput = z.infer<typeof AdminGrantSchema>;

export const AdminRedemptionUpdateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional(),
});
export type AdminRedemptionUpdateInput = z.infer<typeof AdminRedemptionUpdateSchema>;

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});
export type Pagination = z.infer<typeof PaginationSchema>;
