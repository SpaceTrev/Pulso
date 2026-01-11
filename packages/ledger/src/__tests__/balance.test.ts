import { describe, it, expect } from 'vitest';
import {
  computeNextBalance,
  validateDebitAmount,
  validateCreditAmount,
  computeBalanceFromLedger,
  isBalanceConsistent,
} from '../balance';

describe('computeNextBalance', () => {
  it('should add positive delta to balance', () => {
    const result = computeNextBalance(100n, 50n);
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(150n);
  });

  it('should subtract negative delta from balance', () => {
    const result = computeNextBalance(100n, -50n);
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(50n);
  });

  it('should allow balance to reach zero', () => {
    const result = computeNextBalance(100n, -100n);
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(0n);
  });

  it('should reject operations that would result in negative balance', () => {
    const result = computeNextBalance(100n, -150n);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Insufficient balance');
    expect(result.newBalance).toBeUndefined();
  });

  it('should reject if current balance is already negative', () => {
    const result = computeNextBalance(-10n, 50n);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Current balance cannot be negative');
  });

  it('should handle large numbers correctly', () => {
    const largeBalance = 10000000000000n; // 100 billion
    const largeDelta = 5000000000000n;
    const result = computeNextBalance(largeBalance, largeDelta);
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(15000000000000n);
  });

  it('should handle zero balance with credit', () => {
    const result = computeNextBalance(0n, 100n);
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(100n);
  });

  it('should reject zero balance with debit', () => {
    const result = computeNextBalance(0n, -1n);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Insufficient balance');
  });
});

describe('validateDebitAmount', () => {
  it('should return negated amount for positive input', () => {
    expect(validateDebitAmount(100n)).toBe(-100n);
  });

  it('should throw for zero amount', () => {
    expect(() => validateDebitAmount(0n)).toThrow('Debit amount must be positive');
  });

  it('should throw for negative amount', () => {
    expect(() => validateDebitAmount(-50n)).toThrow('Debit amount must be positive');
  });
});

describe('validateCreditAmount', () => {
  it('should return same amount for positive input', () => {
    expect(validateCreditAmount(100n)).toBe(100n);
  });

  it('should throw for zero amount', () => {
    expect(() => validateCreditAmount(0n)).toThrow('Credit amount must be positive');
  });

  it('should throw for negative amount', () => {
    expect(() => validateCreditAmount(-50n)).toThrow('Credit amount must be positive');
  });
});

describe('computeBalanceFromLedger', () => {
  it('should compute balance from initial + deltas', () => {
    const deltas = [100n, -50n, 200n, -75n];
    const result = computeBalanceFromLedger(0n, deltas);
    expect(result).toBe(175n);
  });

  it('should handle empty deltas array', () => {
    const result = computeBalanceFromLedger(500n, []);
    expect(result).toBe(500n);
  });

  it('should handle non-zero initial balance', () => {
    const deltas = [100n, -50n];
    const result = computeBalanceFromLedger(1000n, deltas);
    expect(result).toBe(1050n);
  });
});

describe('isBalanceConsistent', () => {
  it('should return true for consistent balance', () => {
    const deltas = [100n, -50n, 200n];
    // Balance should be 0 + 100 - 50 + 200 = 250
    expect(isBalanceConsistent(250n, deltas, 0n)).toBe(true);
  });

  it('should return false for inconsistent balance', () => {
    const deltas = [100n, -50n, 200n];
    expect(isBalanceConsistent(300n, deltas, 0n)).toBe(false);
  });

  it('should account for initial balance', () => {
    const deltas = [100n, -50n];
    // Balance should be 1000 + 100 - 50 = 1050
    expect(isBalanceConsistent(1050n, deltas, 1000n)).toBe(true);
    expect(isBalanceConsistent(1000n, deltas, 1000n)).toBe(false);
  });
});

describe('Ledger Invariants', () => {
  it('balances should never go negative through any sequence of operations', () => {
    let balance = 100n;
    const operations = [
      { type: 'credit', amount: 50n },
      { type: 'debit', amount: 30n },
      { type: 'credit', amount: 100n },
      { type: 'debit', amount: 220n }, // This would make it go negative
    ];

    for (const op of operations) {
      const delta = op.type === 'credit' ? op.amount : -op.amount;
      const result = computeNextBalance(balance, delta);

      // Balance should never go negative
      if (result.success && result.newBalance !== undefined) {
        expect(result.newBalance).toBeGreaterThanOrEqual(0n);
        balance = result.newBalance;
      } else {
        // Operation was rejected - balance unchanged
        expect(balance).toBeGreaterThanOrEqual(0n);
      }
    }
  });

  it('balance should equal initial + sum of all ledger deltas', () => {
    const initialBalance = 0n;
    const ledgerEntries: bigint[] = [];
    let currentBalance = initialBalance;

    // Simulate a series of operations
    const operations = [
      100n,   // credit
      -50n,   // debit
      200n,   // credit
      -100n,  // debit
      50n,    // credit
    ];

    for (const delta of operations) {
      const result = computeNextBalance(currentBalance, delta);
      if (result.success && result.newBalance !== undefined) {
        currentBalance = result.newBalance;
        ledgerEntries.push(delta);
      }
    }

    // Verify invariant: balance = initial + sum(deltas)
    const expectedBalance = computeBalanceFromLedger(initialBalance, ledgerEntries);
    expect(currentBalance).toBe(expectedBalance);
    expect(isBalanceConsistent(currentBalance, ledgerEntries, initialBalance)).toBe(true);
  });
});
