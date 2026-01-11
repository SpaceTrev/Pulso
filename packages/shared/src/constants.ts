/**
 * Shared Constants
 *
 * Constants used across web, mobile, and API.
 * Note: Compliance-related copy avoids banned words.
 */

// ============================================================================
// COMPLIANCE - BANNED WORDS
// ============================================================================

/**
 * Words that MUST NOT appear in user-facing content.
 * Use the alternatives provided.
 */
export const BANNED_WORDS = [
  'bet',
  'wager',
  'gambling',
  'casino',
  'cashout',
  'cash out',
  'withdraw',
  'withdrawal',
] as const;

/**
 * Approved alternatives for common concepts.
 */
export const APPROVED_TERMS = {
  bet: 'play',
  wager: 'entry',
  gambling: 'entertainment',
  casino: 'play',
  cashout: 'redemption request',
  withdraw: 'request redemption',
  withdrawal: 'redemption',
} as const;

// ============================================================================
// CURRENCY DISPLAY
// ============================================================================

export const CURRENCY_NAMES = {
  GC: 'Gold Coins',
  SC: 'Sweepstakes Coins',
} as const;

export const CURRENCY_SYMBOLS = {
  GC: 'GC',
  SC: 'SC',
} as const;

/**
 * GC is for entertainment only and has NO real value.
 * SC can be redeemed but is NEVER sold.
 */
export const CURRENCY_DISCLAIMERS = {
  GC: 'Gold Coins are for entertainment purposes only and have no monetary value.',
  SC: 'Sweepstakes Coins cannot be purchased. They can only be earned through free methods and may be redeemed for rewards.',
} as const;

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

/**
 * House edge as a multiplier (e.g., 0.02 = 2% house edge).
 * Effective multiplier = fair multiplier * (1 - HOUSE_EDGE)
 */
export const HOUSE_EDGE = 0.02; // 2%

/**
 * Dice game range: 0-9999 (maps to 0.00% - 99.99%)
 */
export const DICE_RANGE = 10000;

/**
 * Minimum target for dice (0.01%)
 */
export const DICE_MIN_TARGET = 1;

/**
 * Maximum target for dice (98.00%)
 */
export const DICE_MAX_TARGET = 9800;

/**
 * Multiplier precision: stored as integer * 10000
 * e.g., 2.5x = 25000
 */
export const MULTIPLIER_PRECISION = 10000;

// ============================================================================
// BALANCE CONFIGURATION
// ============================================================================

/**
 * Balance amounts are stored as smallest units.
 * Display division factor (100 = 2 decimal places).
 */
export const BALANCE_DISPLAY_DIVISOR = 100;

/**
 * Minimum play amount in smallest units (0.10)
 */
export const MIN_PLAY_AMOUNT = 10n;

/**
 * Maximum play amount in smallest units (1000.00)
 */
export const MAX_PLAY_AMOUNT = 100000n;

/**
 * Minimum redemption amount in smallest units (10.00 SC)
 */
export const MIN_REDEMPTION_AMOUNT = 1000n;

// ============================================================================
// DAILY CLAIM
// ============================================================================

/**
 * Daily claim amount in smallest units (1.00 SC)
 */
export const DAILY_CLAIM_AMOUNT = 100n;

/**
 * Daily claim cooldown in milliseconds (24 hours)
 */
export const DAILY_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// INITIAL GRANTS
// ============================================================================

/**
 * Initial GC grant for new users (100.00 GC)
 */
export const INITIAL_GC_GRANT = 10000n;

/**
 * Initial SC grant for new users (0 - must earn via daily claim)
 */
export const INITIAL_SC_GRANT = 0n;

// ============================================================================
// UI LABELS
// ============================================================================

export const UI_LABELS = {
  // Navigation
  home: 'Home',
  play: 'Play',
  history: 'History',
  rewards: 'Rewards',
  settings: 'Settings',

  // Actions
  playNow: 'Play Now',
  claimDaily: 'Claim Daily Reward',
  requestRedemption: 'Request Redemption',
  viewStatus: 'View Status',

  // Game
  rollDice: 'Roll',
  target: 'Target',
  multiplier: 'Multiplier',
  winChance: 'Win Chance',
  result: 'Result',

  // Currency
  goldCoins: 'Gold Coins',
  sweepstakesCoins: 'Sweepstakes Coins',
  getCoins: 'Get Coins',

  // Status
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',

  // Errors
  insufficientBalance: 'Insufficient balance',
  invalidAmount: 'Invalid amount',
  alreadyClaimed: 'Already claimed today',
  tryAgainLater: 'Please try again later',
} as const;

// ============================================================================
// COPY TEXT
// ============================================================================

export const COPY = {
  heroTitle: 'Play for Fun, Win Real Rewards',
  heroSubtitle: 'Enjoy provably fair entertainment with Gold Coins or earn Sweepstakes Coins for a chance to redeem rewards.',

  howItWorksTitle: 'How It Works',
  howItWorksSteps: [
    {
      title: 'Get Gold Coins',
      description: 'Purchase Gold Coins to enjoy unlimited entertainment play.',
    },
    {
      title: 'Earn Sweepstakes Coins',
      description: 'Claim your daily free Sweepstakes Coins and earn more through play.',
    },
    {
      title: 'Request Redemption',
      description: 'Use your Sweepstakes Coins to request reward redemptions.',
    },
  ],

  dailyClaimTitle: 'Daily Reward',
  dailyClaimDescription: 'Claim your free Sweepstakes Coins every 24 hours.',

  redemptionDisclaimer: 'Redemption requests are subject to verification. Processing may take 3-5 business days.',

  provablyFairTitle: 'Provably Fair',
  provablyFairDescription: 'Every play result can be independently verified using our transparent commit-reveal system.',

  gcDisclaimer: 'Gold Coins are for entertainment only and cannot be redeemed.',
  scDisclaimer: 'Sweepstakes Coins can only be earned through free methods and are redeemable for rewards.',

  footerDisclaimer: 'Pulso is a sweepstakes platform. Gold Coins have no monetary value. Sweepstakes Coins are earned through free methods only and may be redeemed subject to verification.',
} as const;
