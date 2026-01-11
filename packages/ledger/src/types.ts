/**
 * Ledger Types
 *
 * These types are shared between packages and should match the Prisma schema.
 */

export type Currency = 'GC' | 'SC';

export type LedgerReason =
  | 'INITIAL_GRANT'
  | 'ADMIN_GRANT'
  | 'DAILY_CLAIM'
  | 'GAME_PLAY'
  | 'GAME_WIN'
  | 'REDEMPTION_REQUEST'
  | 'REDEMPTION_REFUND'
  | 'PURCHASE';

export interface LedgerEntryInput {
  userId: string;
  currency: Currency;
  delta: bigint;
  reason: LedgerReason;
  refType?: string;
  refId?: string;
}

export interface BalanceState {
  userId: string;
  currency: Currency;
  available: bigint;
}

export interface LedgerResult {
  success: boolean;
  newBalance?: bigint;
  error?: string;
}

/**
 * Represents a credit operation (positive delta)
 */
export interface CreditInput {
  userId: string;
  currency: Currency;
  amount: bigint; // Must be positive
  reason: LedgerReason;
  refType?: string;
  refId?: string;
}

/**
 * Represents a debit operation (negative delta)
 */
export interface DebitInput {
  userId: string;
  currency: Currency;
  amount: bigint; // Must be positive (will be negated internally)
  reason: LedgerReason;
  refType?: string;
  refId?: string;
}
