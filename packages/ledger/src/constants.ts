/**
 * Ledger Constants
 *
 * Shared constants for the ledger system.
 */

/**
 * Reasons that result in credits (positive deltas)
 */
export const CREDIT_REASONS = [
  'INITIAL_GRANT',
  'ADMIN_GRANT',
  'DAILY_CLAIM',
  'GAME_WIN',
  'REDEMPTION_REFUND',
  'PURCHASE',
] as const;

/**
 * Reasons that result in debits (negative deltas)
 */
export const DEBIT_REASONS = [
  'GAME_PLAY',
  'REDEMPTION_REQUEST',
] as const;

/**
 * All valid ledger reasons
 */
export const ALL_LEDGER_REASONS = [
  ...CREDIT_REASONS,
  ...DEBIT_REASONS,
] as const;

/**
 * Check if a reason is a credit reason
 */
export function isCreditReason(reason: string): boolean {
  return (CREDIT_REASONS as readonly string[]).includes(reason);
}

/**
 * Check if a reason is a debit reason
 */
export function isDebitReason(reason: string): boolean {
  return (DEBIT_REASONS as readonly string[]).includes(reason);
}

/**
 * SC amount given for daily claim (in smallest units, e.g., 100 = 1.00 SC)
 */
export const DAILY_CLAIM_SC_AMOUNT = 100n; // 1.00 SC

/**
 * Initial GC grant for new users (in smallest units)
 */
export const INITIAL_GC_GRANT = 10000n; // 100.00 GC

/**
 * Initial SC grant for new users (in smallest units)
 */
export const INITIAL_SC_GRANT = 0n; // No initial SC - must earn via daily claim

/**
 * Cooldown period for daily claim in milliseconds (24 hours)
 */
export const DAILY_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Minimum redemption amount (in smallest units)
 */
export const MIN_REDEMPTION_SC = 1000n; // 10.00 SC minimum

/**
 * Minimum play amount (in smallest units)
 */
export const MIN_PLAY_AMOUNT = 10n; // 0.10 coins minimum

/**
 * Maximum play amount (in smallest units)
 */
export const MAX_PLAY_AMOUNT = 100000n; // 1000.00 coins maximum
