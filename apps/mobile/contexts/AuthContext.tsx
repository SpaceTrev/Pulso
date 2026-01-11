import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { createApiClient, ApiClient } from '@pulso/api-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  api: ApiClient | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<ApiClient | null>(null);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      if (storedToken) {
        const client = createApiClient(API_URL, storedToken);
        setToken(storedToken);
        setApi(client);
        // Fetch user profile
        const profile = await client.getProfile();
        setUser(profile.user);
      }
    } catch (err) {
      // Token expired or invalid
      await SecureStore.deleteItemAsync('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const client = createApiClient(API_URL);
    const res = await client.login(email, password);
    await SecureStore.setItemAsync('token', res.token);
    setToken(res.token);
    setUser(res.user);
    setApi(createApiClient(API_URL, res.token));
  };

  const register = async (email: string, password: string) => {
    const client = createApiClient(API_URL);
    const res = await client.register(email, password);
    await SecureStore.setItemAsync('token', res.token);
    setToken(res.token);
    setUser(res.user);
    setApi(createApiClient(API_URL, res.token));
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setToken(null);
    setUser(null);
    setApi(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        isLoading,
        user,
        token,
        api,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
