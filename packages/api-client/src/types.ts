/**
 * API Client Types
 */

// Auth types
export interface AuthTokens {
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

// Balance types
export interface BalanceResponse {
  gc: string; // BigInt as string
  sc: string; // BigInt as string
}

// Ledger types
export interface LedgerEntryResponse {
  id: string;
  currency: 'GC' | 'SC';
  delta: string; // BigInt as string
  reason: string;
  refType: string | null;
  refId: string | null;
  createdAt: string;
}

// Provably Fair types
export interface ProvablyFairCommitResponse {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface SetClientSeedRequest {
  clientSeed: string;
}

// Game types
export interface DicePlayRequest {
  currency: 'GC' | 'SC';
  amount: string; // BigInt as string
  target: number; // 0-9999
  direction: 'over' | 'under';
}

export interface GamePlayResponse {
  id: string;
  gameType: 'DICE';
  currency: 'GC' | 'SC';
  amount: string;
  payoutAmount: string;
  direction: string;
  target: number;
  result: number;
  win: boolean;
  multiplier: number;
  pfServerSeedHash: string;
  pfClientSeed: string;
  pfNonce: number;
  createdAt: string;
}

export interface GameVerifyResponse {
  id: string;
  serverSeed: string | null; // Only revealed after seed rotation
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  result: number;
  verified: boolean;
}

// Daily Claim types
export interface DailyClaimResponse {
  success: boolean;
  amount: string;
  nextClaimAt: string;
}

export interface DailyClaimStatusResponse {
  canClaim: boolean;
  lastClaimAt: string | null;
  nextClaimAt: string | null;
}

// Redemption types
export interface CreateRedemptionRequest {
  amountSc: string; // BigInt as string
}

export interface RedemptionResponse {
  id: string;
  amountSc: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Admin types
export interface AdminGrantRequest {
  userId: string;
  currency: 'GC' | 'SC';
  amount: string;
}

export interface AdminRedemptionUpdateRequest {
  status: 'APPROVED' | 'REJECTED';
  notes?: string;
}

// API Error type
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
