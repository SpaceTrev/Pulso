/**
 * API Endpoint Definitions
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  ME: '/me',

  // Balances
  BALANCES: '/balances',
  LEDGER: '/ledger',

  // Provably Fair
  PF_COMMIT: '/provablyfair/commit',
  PF_CLIENT_SEED: '/provablyfair/client-seed',
  PF_ROTATE: '/provablyfair/rotate',

  // Games
  DICE_PLAY: '/games/dice/play',
  GAME_PLAYS: '/games/plays',
  GAME_VERIFY: (id: string) => `/games/plays/${id}/verify`,

  // Daily Claim
  DAILY_CLAIM: '/claims/daily',
  DAILY_CLAIM_STATUS: '/claims/daily/status',

  // Redemptions
  REDEMPTIONS: '/redemptions',
  REDEMPTION_DETAIL: (id: string) => `/redemptions/${id}`,

  // Admin
  ADMIN_GRANT: '/admin/grant',
  ADMIN_REDEMPTIONS: '/admin/redemptions',
  ADMIN_REDEMPTION_UPDATE: (id: string) => `/admin/redemptions/${id}`,
  ADMIN_USERS: '/admin/users',
} as const;
