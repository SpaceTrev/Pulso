/**
 * Shared Helper Functions
 */

import { BALANCE_DISPLAY_DIVISOR, HOUSE_EDGE, DICE_RANGE, MULTIPLIER_PRECISION } from './constants';

/**
 * Format a balance amount (in smallest units) for display.
 * @param amount - Amount in smallest units (bigint or string)
 * @returns Formatted string with 2 decimal places
 */
export function formatBalance(amount: bigint | string): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const intPart = value / BigInt(BALANCE_DISPLAY_DIVISOR);
  const decPart = value % BigInt(BALANCE_DISPLAY_DIVISOR);
  const decStr = decPart.toString().padStart(2, '0');
  return `${intPart.toString()}.${decStr}`;
}

/**
 * Parse a display amount to smallest units.
 * @param display - Display string (e.g., "10.50")
 * @returns Amount in smallest units as bigint
 */
export function parseDisplayAmount(display: string): bigint {
  const parts = display.split('.');
  const intPart = BigInt(parts[0] || '0');
  let decPart = 0n;
  if (parts[1]) {
    const decStr = parts[1].padEnd(2, '0').slice(0, 2);
    decPart = BigInt(decStr);
  }
  return intPart * BigInt(BALANCE_DISPLAY_DIVISOR) + decPart;
}

/**
 * Calculate win chance for dice game.
 * @param target - Target value (0-9999)
 * @param direction - 'over' or 'under'
 * @returns Win chance as percentage (0-100)
 */
export function calculateWinChance(
  target: number,
  direction: 'over' | 'under'
): number {
  if (direction === 'under') {
    // Win if result < target
    return (target / DICE_RANGE) * 100;
  } else {
    // Win if result > target
    return ((DICE_RANGE - target - 1) / DICE_RANGE) * 100;
  }
}

/**
 * Calculate multiplier for dice game (with house edge).
 * @param target - Target value (0-9999)
 * @param direction - 'over' or 'under'
 * @returns Multiplier as a number
 */
export function calculateMultiplier(
  target: number,
  direction: 'over' | 'under'
): number {
  const winChance = calculateWinChance(target, direction) / 100;
  if (winChance <= 0 || winChance >= 1) return 0;

  // Fair multiplier = 1 / winChance
  // With house edge = fair * (1 - HOUSE_EDGE)
  const fairMultiplier = 1 / winChance;
  const effectiveMultiplier = fairMultiplier * (1 - HOUSE_EDGE);

  // Round to 4 decimal places
  return Math.floor(effectiveMultiplier * MULTIPLIER_PRECISION) / MULTIPLIER_PRECISION;
}

/**
 * Check if dice result is a win.
 * @param result - Roll result (0-9999)
 * @param target - Target value
 * @param direction - 'over' or 'under'
 * @returns True if win
 */
export function isWin(
  result: number,
  target: number,
  direction: 'over' | 'under'
): boolean {
  if (direction === 'under') {
    return result < target;
  } else {
    return result > target;
  }
}

/**
 * Calculate payout amount.
 * @param playAmount - Amount played (in smallest units)
 * @param multiplier - Multiplier (as integer * MULTIPLIER_PRECISION)
 * @param win - Whether the play was a win
 * @returns Payout amount in smallest units
 */
export function calculatePayout(
  playAmount: bigint,
  multiplier: number,
  win: boolean
): bigint {
  if (!win) return 0n;
  // Payout = playAmount * multiplier
  // multiplier is stored as integer with MULTIPLIER_PRECISION
  return (playAmount * BigInt(multiplier)) / BigInt(MULTIPLIER_PRECISION);
}

/**
 * Format multiplier for display.
 * @param multiplier - Multiplier as integer * MULTIPLIER_PRECISION
 * @returns Formatted string (e.g., "2.50x")
 */
export function formatMultiplier(multiplier: number): string {
  const value = multiplier / MULTIPLIER_PRECISION;
  return `${value.toFixed(2)}x`;
}

/**
 * Format percentage for display.
 * @param percent - Percentage (0-100)
 * @returns Formatted string (e.g., "50.00%")
 */
export function formatPercent(percent: number): string {
  return `${percent.toFixed(2)}%`;
}

/**
 * Truncate string in the middle (useful for hashes).
 * @param str - String to truncate
 * @param startLen - Characters to keep at start
 * @param endLen - Characters to keep at end
 * @returns Truncated string
 */
export function truncateMiddle(
  str: string,
  startLen: number = 8,
  endLen: number = 8
): string {
  if (str.length <= startLen + endLen + 3) return str;
  return `${str.slice(0, startLen)}...${str.slice(-endLen)}`;
}

/**
 * Format date for display.
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate time until next daily claim.
 * @param lastClaimAt - Last claim timestamp
 * @param cooldownMs - Cooldown period in milliseconds
 * @returns Object with canClaim and timeRemaining
 */
export function getClaimStatus(
  lastClaimAt: string | Date | null,
  cooldownMs: number
): { canClaim: boolean; nextClaimAt: Date | null; timeRemainingMs: number } {
  if (!lastClaimAt) {
    return { canClaim: true, nextClaimAt: null, timeRemainingMs: 0 };
  }

  const lastClaim = typeof lastClaimAt === 'string' ? new Date(lastClaimAt) : lastClaimAt;
  const nextClaimAt = new Date(lastClaim.getTime() + cooldownMs);
  const now = new Date();
  const timeRemainingMs = Math.max(0, nextClaimAt.getTime() - now.getTime());

  return {
    canClaim: timeRemainingMs === 0,
    nextClaimAt,
    timeRemainingMs,
  };
}

/**
 * Format time remaining for display.
 * @param ms - Milliseconds remaining
 * @returns Formatted string (e.g., "5h 30m")
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Now';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}
