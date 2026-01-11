/**
 * Balance Calculation Functions
 *
 * Pure functions for computing balance changes.
 * These enforce the non-negative balance invariant.
 */

import type { LedgerResult } from './types';

/**
 * Computes the next balance after applying a delta.
 * Enforces non-negative balance constraint.
 *
 * @param currentBalance - The current balance (must be >= 0)
 * @param delta - The change to apply (can be positive or negative)
 * @returns LedgerResult with new balance or error
 */
export function computeNextBalance(
  currentBalance: bigint,
  delta: bigint
): LedgerResult {
  // Validate current balance is non-negative
  if (currentBalance < 0n) {
    return {
      success: false,
      error: 'Current balance cannot be negative',
    };
  }

  const newBalance = currentBalance + delta;

  // Enforce non-negative balance
  if (newBalance < 0n) {
    return {
      success: false,
      error: 'Insufficient balance',
    };
  }

  return {
    success: true,
    newBalance,
  };
}

/**
 * Validates that a delta for a debit operation is valid.
 * For debits, the amount should be positive, and we negate it.
 *
 * @param amount - The amount to debit (must be positive)
 * @returns The negated delta or throws if invalid
 */
export function validateDebitAmount(amount: bigint): bigint {
  if (amount <= 0n) {
    throw new Error('Debit amount must be positive');
  }
  return -amount;
}

/**
 * Validates that a delta for a credit operation is valid.
 *
 * @param amount - The amount to credit (must be positive)
 * @returns The delta or throws if invalid
 */
export function validateCreditAmount(amount: bigint): bigint {
  if (amount <= 0n) {
    throw new Error('Credit amount must be positive');
  }
  return amount;
}

/**
 * Calculates the expected balance from initial + sum of ledger deltas.
 * Used for balance reconciliation.
 *
 * @param initialBalance - Starting balance (usually 0)
 * @param ledgerDeltas - Array of all ledger deltas
 * @returns The computed balance
 */
export function computeBalanceFromLedger(
  initialBalance: bigint,
  ledgerDeltas: bigint[]
): bigint {
  return ledgerDeltas.reduce((acc, delta) => acc + delta, initialBalance);
}

/**
 * Checks if a balance matches the sum of ledger entries.
 * Used for integrity checks.
 *
 * @param currentBalance - The stored balance
 * @param ledgerDeltas - All ledger deltas for this user/currency
 * @param initialBalance - Starting balance (default 0)
 * @returns True if balance is consistent
 */
export function isBalanceConsistent(
  currentBalance: bigint,
  ledgerDeltas: bigint[],
  initialBalance: bigint = 0n
): boolean {
  const computed = computeBalanceFromLedger(initialBalance, ledgerDeltas);
  return computed === currentBalance;
}
