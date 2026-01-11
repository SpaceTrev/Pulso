/**
 * Ledger Service
 *
 * Handles all balance-related operations through the ledger.
 * This is the ONLY way balances should be modified.
 */

import { PrismaClient, Currency, LedgerReason } from '@prisma/client';
import {
  computeNextBalance,
  validateDebitAmount,
  validateCreditAmount,
} from '@pulso/ledger';

interface LedgerEntryData {
  userId: string;
  currency: Currency;
  delta: bigint;
  reason: LedgerReason;
  refType?: string;
  refId?: string;
}

export interface LedgerServiceResult {
  success: boolean;
  newBalance?: bigint;
  error?: string;
  ledgerEntryId?: string;
}

/**
 * Apply a ledger entry and update balance atomically.
 * This runs in a database transaction to ensure consistency.
 */
export async function applyLedgerEntry(
  prisma: PrismaClient,
  entry: LedgerEntryData
): Promise<LedgerServiceResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get or create balance
      let balance = await tx.balance.findUnique({
        where: {
          userId_currency: {
            userId: entry.userId,
            currency: entry.currency,
          },
        },
      });

      if (!balance) {
        // Create balance if it doesn't exist
        balance = await tx.balance.create({
          data: {
            userId: entry.userId,
            currency: entry.currency,
            available: 0n,
          },
        });
      }

      // Compute new balance
      const balanceResult = computeNextBalance(balance.available, entry.delta);

      if (!balanceResult.success || balanceResult.newBalance === undefined) {
        throw new Error(balanceResult.error || 'Balance computation failed');
      }

      // Create ledger entry
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          userId: entry.userId,
          currency: entry.currency,
          delta: entry.delta,
          reason: entry.reason,
          refType: entry.refType || null,
          refId: entry.refId || null,
        },
      });

      // Update balance
      await tx.balance.update({
        where: {
          userId_currency: {
            userId: entry.userId,
            currency: entry.currency,
          },
        },
        data: {
          available: balanceResult.newBalance,
        },
      });

      return {
        newBalance: balanceResult.newBalance,
        ledgerEntryId: ledgerEntry.id,
      };
    });

    return {
      success: true,
      newBalance: result.newBalance,
      ledgerEntryId: result.ledgerEntryId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

/**
 * Credit an amount to a user's balance.
 */
export async function creditBalance(
  prisma: PrismaClient,
  userId: string,
  currency: Currency,
  amount: bigint,
  reason: LedgerReason,
  refType?: string,
  refId?: string
): Promise<LedgerServiceResult> {
  const delta = validateCreditAmount(amount);
  return applyLedgerEntry(prisma, {
    userId,
    currency,
    delta,
    reason,
    refType,
    refId,
  });
}

/**
 * Debit an amount from a user's balance.
 */
export async function debitBalance(
  prisma: PrismaClient,
  userId: string,
  currency: Currency,
  amount: bigint,
  reason: LedgerReason,
  refType?: string,
  refId?: string
): Promise<LedgerServiceResult> {
  const delta = validateDebitAmount(amount);
  return applyLedgerEntry(prisma, {
    userId,
    currency,
    delta,
    reason,
    refType,
    refId,
  });
}

/**
 * Get user balances for both currencies.
 */
export async function getBalances(
  prisma: PrismaClient,
  userId: string
): Promise<{ gc: bigint; sc: bigint }> {
  const balances = await prisma.balance.findMany({
    where: { userId },
  });

  let gc = 0n;
  let sc = 0n;

  for (const balance of balances) {
    if (balance.currency === 'GC') {
      gc = balance.available;
    } else if (balance.currency === 'SC') {
      sc = balance.available;
    }
  }

  return { gc, sc };
}

/**
 * Get ledger entries for a user.
 */
export async function getLedgerEntries(
  prisma: PrismaClient,
  userId: string,
  options: {
    currency?: Currency;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { currency, limit = 20, offset = 0 } = options;

  const where: any = { userId };
  if (currency) {
    where.currency = currency;
  }

  const [entries, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.ledgerEntry.count({ where }),
  ]);

  return { entries, total };
}

/**
 * Initialize balances for a new user with initial grants.
 */
export async function initializeUserBalances(
  prisma: PrismaClient,
  userId: string,
  gcGrant: bigint = 10000n,
  scGrant: bigint = 0n
): Promise<void> {
  // Create GC balance with initial grant
  if (gcGrant > 0n) {
    await applyLedgerEntry(prisma, {
      userId,
      currency: 'GC',
      delta: gcGrant,
      reason: 'INITIAL_GRANT',
    });
  } else {
    // Just create the balance record
    await prisma.balance.create({
      data: {
        userId,
        currency: 'GC',
        available: 0n,
      },
    });
  }

  // Create SC balance with initial grant (usually 0)
  if (scGrant > 0n) {
    await applyLedgerEntry(prisma, {
      userId,
      currency: 'SC',
      delta: scGrant,
      reason: 'INITIAL_GRANT',
    });
  } else {
    await prisma.balance.create({
      data: {
        userId,
        currency: 'SC',
        available: 0n,
      },
    });
  }
}
