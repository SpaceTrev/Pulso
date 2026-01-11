/**
 * API Client Implementation
 *
 * A typed fetch wrapper that handles authentication and request formatting.
 * Used by both web and mobile clients.
 */

import { API_ENDPOINTS } from './endpoints';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
  BalanceResponse,
  LedgerEntryResponse,
  ProvablyFairCommitResponse,
  SetClientSeedRequest,
  DicePlayRequest,
  GamePlayResponse,
  GameVerifyResponse,
  DailyClaimResponse,
  DailyClaimStatusResponse,
  CreateRedemptionRequest,
  RedemptionResponse,
  AdminGrantRequest,
  AdminRedemptionUpdateRequest,
  ApiError,
} from './types';

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
  setToken?: (token: string | null) => void;
  onUnauthorized?: () => void;
}

export interface ApiClient {
  // Auth
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  getMe: () => Promise<UserResponse>;
  logout: () => void;

  // Balances
  getBalances: () => Promise<BalanceResponse>;
  getLedger: (params?: { limit?: number; offset?: number; currency?: 'GC' | 'SC' }) => Promise<{
    entries: LedgerEntryResponse[];
    total: number;
  }>;

  // Provably Fair
  getProvablyFairCommit: () => Promise<ProvablyFairCommitResponse>;
  setClientSeed: (data: SetClientSeedRequest) => Promise<ProvablyFairCommitResponse>;
  rotateSeed: () => Promise<{ previousServerSeed: string; newServerSeedHash: string }>;

  // Games
  playDice: (data: DicePlayRequest) => Promise<GamePlayResponse>;
  getPlays: (params?: { limit?: number; offset?: number }) => Promise<{
    plays: GamePlayResponse[];
    total: number;
  }>;
  verifyPlay: (id: string) => Promise<GameVerifyResponse>;

  // Daily Claim
  claimDaily: () => Promise<DailyClaimResponse>;
  getDailyClaimStatus: () => Promise<DailyClaimStatusResponse>;

  // Redemptions
  createRedemption: (data: CreateRedemptionRequest) => Promise<RedemptionResponse>;
  getRedemptions: () => Promise<RedemptionResponse[]>;
  getRedemption: (id: string) => Promise<RedemptionResponse>;

  // Admin
  adminGrant: (data: AdminGrantRequest) => Promise<{ success: boolean }>;
  adminGetRedemptions: () => Promise<RedemptionResponse[]>;
  adminUpdateRedemption: (id: string, data: AdminRedemptionUpdateRequest) => Promise<RedemptionResponse>;
  adminGetUsers: () => Promise<UserResponse[]>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseUrl, getToken, setToken, onUnauthorized } = config;

  async function request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getToken?.();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      setToken?.(null);
      onUnauthorized?.();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Unknown',
        message: 'An unexpected error occurred',
        statusCode: response.status,
      }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  function get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return request<T>(url, { method: 'GET' });
  }

  function post<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  function put<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  return {
    // Auth
    async register(data: RegisterRequest): Promise<AuthResponse> {
      const response = await post<AuthResponse>(API_ENDPOINTS.AUTH_REGISTER, data);
      setToken?.(response.accessToken);
      return response;
    },

    async login(data: LoginRequest): Promise<AuthResponse> {
      const response = await post<AuthResponse>(API_ENDPOINTS.AUTH_LOGIN, data);
      setToken?.(response.accessToken);
      return response;
    },

    async getMe(): Promise<UserResponse> {
      return get<UserResponse>(API_ENDPOINTS.ME);
    },

    logout(): void {
      setToken?.(null);
    },

    // Balances
    async getBalances(): Promise<BalanceResponse> {
      return get<BalanceResponse>(API_ENDPOINTS.BALANCES);
    },

    async getLedger(params?: { limit?: number; offset?: number; currency?: 'GC' | 'SC' }) {
      return get<{ entries: LedgerEntryResponse[]; total: number }>(
        API_ENDPOINTS.LEDGER,
        params
      );
    },

    // Provably Fair
    async getProvablyFairCommit(): Promise<ProvablyFairCommitResponse> {
      return get<ProvablyFairCommitResponse>(API_ENDPOINTS.PF_COMMIT);
    },

    async setClientSeed(data: SetClientSeedRequest): Promise<ProvablyFairCommitResponse> {
      return post<ProvablyFairCommitResponse>(API_ENDPOINTS.PF_CLIENT_SEED, data);
    },

    async rotateSeed() {
      return post<{ previousServerSeed: string; newServerSeedHash: string }>(
        API_ENDPOINTS.PF_ROTATE
      );
    },

    // Games
    async playDice(data: DicePlayRequest): Promise<GamePlayResponse> {
      return post<GamePlayResponse>(API_ENDPOINTS.DICE_PLAY, data);
    },

    async getPlays(params?: { limit?: number; offset?: number }) {
      return get<{ plays: GamePlayResponse[]; total: number }>(
        API_ENDPOINTS.GAME_PLAYS,
        params
      );
    },

    async verifyPlay(id: string): Promise<GameVerifyResponse> {
      return get<GameVerifyResponse>(API_ENDPOINTS.GAME_VERIFY(id));
    },

    // Daily Claim
    async claimDaily(): Promise<DailyClaimResponse> {
      return post<DailyClaimResponse>(API_ENDPOINTS.DAILY_CLAIM);
    },

    async getDailyClaimStatus(): Promise<DailyClaimStatusResponse> {
      return get<DailyClaimStatusResponse>(API_ENDPOINTS.DAILY_CLAIM_STATUS);
    },

    // Redemptions
    async createRedemption(data: CreateRedemptionRequest): Promise<RedemptionResponse> {
      return post<RedemptionResponse>(API_ENDPOINTS.REDEMPTIONS, data);
    },

    async getRedemptions(): Promise<RedemptionResponse[]> {
      return get<RedemptionResponse[]>(API_ENDPOINTS.REDEMPTIONS);
    },

    async getRedemption(id: string): Promise<RedemptionResponse> {
      return get<RedemptionResponse>(API_ENDPOINTS.REDEMPTION_DETAIL(id));
    },

    // Admin
    async adminGrant(data: AdminGrantRequest) {
      return post<{ success: boolean }>(API_ENDPOINTS.ADMIN_GRANT, data);
    },

    async adminGetRedemptions(): Promise<RedemptionResponse[]> {
      return get<RedemptionResponse[]>(API_ENDPOINTS.ADMIN_REDEMPTIONS);
    },

    async adminUpdateRedemption(id: string, data: AdminRedemptionUpdateRequest) {
      return put<RedemptionResponse>(API_ENDPOINTS.ADMIN_REDEMPTION_UPDATE(id), data);
    },

    async adminGetUsers(): Promise<UserResponse[]> {
      return get<UserResponse[]>(API_ENDPOINTS.ADMIN_USERS);
    },
  };
}
