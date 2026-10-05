'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, usersApi, setAuthToken, getAuthToken } from '@/api';
import { User, SignInRequest, SignUpRequest, UserRole } from '@/api/types';
import { parseJwt, isTokenExpired } from '@/lib/jwt';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isModerator: boolean;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (credentials: SignInRequest) => Promise<void>;
  register: (data: SignUpRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFRESH_TOKEN_KEY = 'refresh_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const openAuthModal = useCallback((tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const fetchUserProfile = useCallback(async (userId: number): Promise<User | null> => {
    try {
      const res = await usersApi.getById(userId);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (user?.username) {
        await authApi.signOut({ username: user.username });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
      setTokenState(null);
      setUser(null);
    }
  }, [user]);

  const tryRefreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
      if (!storedRefreshToken) return null;

      const res = await authApi.refreshToken({ refreshToken: storedRefreshToken });
      if (res.access_token) {
        setAuthToken(res.access_token);
        setTokenState(res.access_token);
        return res.access_token;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const payload = parseJwt(token);
    if (!payload?.user_id) return;
    const userData = await fetchUserProfile(payload.user_id);
    if (userData) {
      setUser(userData);
    }
  }, [token, fetchUserProfile]);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsLoading(true);
      let currentToken = getAuthToken();

      if (currentToken && isTokenExpired(currentToken)) {
        currentToken = await tryRefreshToken();
      }

      if (currentToken) {
        setAuthToken(currentToken);
        setTokenState(currentToken);

        const payload = parseJwt(currentToken);
        if (payload?.user_id) {
          const userData = await fetchUserProfile(payload.user_id);
          if (isMounted) {
            if (userData) {
              setUser(userData);
            } else {
              // Token might be invalid
              setAuthToken(null);
              setTokenState(null);
              setUser(null);
            }
          }
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchUserProfile, tryRefreshToken]);

  const login = async (credentials: SignInRequest) => {
    const res = await authApi.signIn(credentials);
    if (res.access_token) {
      setAuthToken(res.access_token);
      setTokenState(res.access_token);

      if (res.refresh_token && typeof window !== 'undefined') {
        localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh_token);
      }

      const payload = parseJwt(res.access_token);
      if (payload?.user_id) {
        const userData = await fetchUserProfile(payload.user_id);
        setUser(userData);
      }
      closeAuthModal();
    }
  };

  const register = async (data: SignUpRequest) => {
    await authApi.signUp(data);
    // After signup, automatically login
    await login({ username: data.username, password: data.password });
  };

  const role: UserRole | null = user?.role || (token ? parseJwt(token)?.user_role || null : null);
  const isAdmin = role === 'ADMIN';
  const isModerator = role === 'MODERATOR' || isAdmin;
  const isAuthenticated = !!user || !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        role,
        isAdmin,
        isModerator,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
