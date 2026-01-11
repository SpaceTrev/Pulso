import * as crypto from 'crypto';

/**
 * Generate a cryptographically secure random seed
 */
export function generateSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a deterministic hash from server seed, client seed, and nonce
 */
export function generateHash(serverSeed: string, clientSeed: string, nonce: number): string {
  const data = `${serverSeed}:${clientSeed}:${nonce}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Convert hash to a number between 0 and 1
 */
export function hashToNumber(hash: string): number {
  const subHash = hash.substring(0, 8);
  const decimal = parseInt(subHash, 16);
  return decimal / 0xffffffff;
}

/**
 * Generate a provably fair result for games
 * @param serverSeed - Secret server seed
 * @param clientSeed - Public client seed
 * @param nonce - Incrementing nonce
 * @returns A number between 0 and 1
 */
export function generateResult(serverSeed: string, clientSeed: string, nonce: number): number {
  const hash = generateHash(serverSeed, clientSeed, nonce);
  return hashToNumber(hash);
}

/**
 * Verify a game result
 */
export function verifyResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  expectedResult: number
): boolean {
  const result = generateResult(serverSeed, clientSeed, nonce);
  return Math.abs(result - expectedResult) < 0.0001; // Allow small floating point differences
}

/**
 * Calculate multiplier for crash game
 */
export function calculateCrashMultiplier(result: number): number {
  // Crash game: convert 0-1 to multiplier (1x to 100x)
  // Using exponential distribution for crash point
  const e = 2 ** 32;
  const h = parseInt((result * e).toString(), 10);
  const crashPoint = Math.floor((100 * e - h) / (e - h)) / 100;
  return Math.max(1, Math.min(crashPoint, 100));
}

/**
 * Calculate dice result (1-100)
 */
export function calculateDiceResult(result: number): number {
  return Math.floor(result * 100) + 1;
}

/**
 * Calculate slot result (0-9 for each reel)
 */
export function calculateSlotResult(result: number): [number, number, number] {
  const hash = crypto.createHash('sha256').update(result.toString()).digest('hex');
  const reel1 = parseInt(hash.substring(0, 2), 16) % 10;
  const reel2 = parseInt(hash.substring(2, 4), 16) % 10;
  const reel3 = parseInt(hash.substring(4, 6), 16) % 10;
  return [reel1, reel2, reel3];
}
