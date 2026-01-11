import * as crypto from 'crypto';

/**
 * Provably Fair System
 *
 * Implements a commit-reveal scheme for verifiable randomness:
 * 1. Server generates server_seed and commits hash(server_seed)
 * 2. Client sets their own client_seed
 * 3. Each play uses HMAC-SHA256(server_seed, client_seed:nonce)
 * 4. After seed rotation, server_seed is revealed for verification
 */

// ============================================================================
// SEED GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure random seed (64 hex chars = 256 bits).
 */
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a default client seed (can be customized by user).
 */
export function generateDefaultClientSeed(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Compute the hash commitment for a server seed.
 * This is revealed to the user BEFORE any plays.
 */
export function hashServerSeed(serverSeed: string): string {
  return crypto.createHash('sha256').update(serverSeed).digest('hex');
}

// ============================================================================
// COMMIT PHASE
// ============================================================================

export interface CommitResult {
  serverSeed: string;      // Keep secret until rotation
  serverSeedHash: string;  // Reveal to user immediately
}

/**
 * Generate a new server seed and its commitment hash.
 * The serverSeed is kept secret; only serverSeedHash is shown to user.
 */
export function commit(): CommitResult {
  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  return { serverSeed, serverSeedHash };
}

// ============================================================================
// DICE ROLL CALCULATION
// ============================================================================

/**
 * Generate a deterministic dice result using HMAC-SHA256.
 *
 * @param serverSeed - The secret server seed
 * @param clientSeed - The user's client seed
 * @param nonce - Incrementing nonce (starts at 0)
 * @returns A number in range [0, 9999] (maps to 0.00% - 99.99%)
 */
export function rollDice(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  // Create HMAC with server seed as key
  const hmac = crypto.createHmac('sha256', serverSeed);

  // Message is "clientSeed:nonce"
  hmac.update(`${clientSeed}:${nonce}`);

  // Get hex digest
  const hash = hmac.digest('hex');

  // Take first 8 hex characters (32 bits)
  const subHash = hash.substring(0, 8);

  // Convert to number
  const decimal = parseInt(subHash, 16);

  // Map to range [0, 9999]
  // Using modulo with prime slightly larger than range for better distribution
  return decimal % 10000;
}

/**
 * Alternative: Get raw float result [0, 1) for other game types.
 */
export function rollFloat(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const hmac = crypto.createHmac('sha256', serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  const hash = hmac.digest('hex');
  const subHash = hash.substring(0, 8);
  const decimal = parseInt(subHash, 16);
  return decimal / 0xffffffff;
}

// ============================================================================
// VERIFICATION
// ============================================================================

export interface VerifyInput {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  result: number;
}

export interface VerifyResult {
  valid: boolean;
  hashMatches: boolean;
  resultMatches: boolean;
  computedHash: string;
  computedResult: number;
}

/**
 * Verify a past game result.
 *
 * Users can verify that:
 * 1. The revealed serverSeed hashes to the committed serverSeedHash
 * 2. The result was correctly computed from seeds + nonce
 *
 * @param input - Verification input data
 * @returns Verification result with detailed breakdown
 */
export function verify(input: VerifyInput): VerifyResult {
  const { serverSeed, serverSeedHash, clientSeed, nonce, result } = input;

  // Verify hash commitment
  const computedHash = hashServerSeed(serverSeed);
  const hashMatches = computedHash === serverSeedHash;

  // Verify result
  const computedResult = rollDice(serverSeed, clientSeed, nonce);
  const resultMatches = computedResult === result;

  return {
    valid: hashMatches && resultMatches,
    hashMatches,
    resultMatches,
    computedHash,
    computedResult,
  };
}

/**
 * Verify only that a server seed matches its hash.
 * Useful when server seed is revealed but you just want to check the commitment.
 */
export function verifyServerSeedHash(
  serverSeed: string,
  expectedHash: string
): boolean {
  return hashServerSeed(serverSeed) === expectedHash;
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use rollDice instead
 */
export function generateHash(serverSeed: string, clientSeed: string, nonce: number): string {
  const hmac = crypto.createHmac('sha256', serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  return hmac.digest('hex');
}

/**
 * @deprecated Use rollDice instead
 */
export function hashToNumber(hash: string): number {
  const subHash = hash.substring(0, 8);
  const decimal = parseInt(subHash, 16);
  return decimal / 0xffffffff;
}

/**
 * @deprecated Use rollDice instead
 */
export function generateResult(serverSeed: string, clientSeed: string, nonce: number): number {
  return rollFloat(serverSeed, clientSeed, nonce);
}

/**
 * @deprecated Use verify instead
 */
export function verifyResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  expectedResult: number
): boolean {
  const result = generateResult(serverSeed, clientSeed, nonce);
  return Math.abs(result - expectedResult) < 0.0001;
}

/**
 * @deprecated Use generateServerSeed instead
 */
export function generateSeed(): string {
  return generateServerSeed();
}

/**
 * Calculate dice result (1-100) from float
 * @deprecated Use rollDice which returns 0-9999 directly
 */
export function calculateDiceResult(result: number): number {
  return Math.floor(result * 100) + 1;
}

/**
 * Calculate crash multiplier from float
 */
export function calculateCrashMultiplier(result: number): number {
  const e = 2 ** 32;
  const h = parseInt((result * e).toString(), 10);
  const crashPoint = Math.floor((100 * e - h) / (e - h)) / 100;
  return Math.max(1, Math.min(crashPoint, 100));
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
