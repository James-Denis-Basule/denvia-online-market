/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { ReactNode } from 'react';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/authService';
import { mergeGuestCart } from '../services/commerceService';

import type {
  AccountType,
  AuthUser,
} from '../services/authService';

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  accountType?: AccountType;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem('authUser');

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      localStorage.removeItem('authUser');
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem('accessToken'),
  );

  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
      return null;
    }

    try {
      const response = await getCurrentUser();
      const currentUser = response.data?.user;

      if (!currentUser) {
        throw new Error('Unable to restore authenticated user.');
      }

      localStorage.setItem('authUser', JSON.stringify(currentUser));

      setAccessToken(token);
      setUser(currentUser);

      return currentUser;
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');

      setAccessToken(null);
      setUser(null);

      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refreshUser();
    }, 0);
    return () => window.clearTimeout(id);
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginUser(email, password);
    const authenticatedUser = response.data.user;
    const authenticatedToken = response.data.accessToken;

    // Keep persisted and in-memory authentication state synchronized.
    localStorage.setItem('accessToken', authenticatedToken);
    localStorage.setItem('authUser', JSON.stringify(authenticatedUser));

    setAccessToken(authenticatedToken);
    setUser(authenticatedUser);
    setIsLoading(false);

    // Merge products that were added while the user was logged out.
    // The guest cart remains in localStorage if the merge fails.
    try {
      await mergeGuestCart();
    } catch (error) {
      console.error('Failed to merge guest cart after login:', error);
    }

    return authenticatedUser;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await registerUser(payload);
  }, []);


  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [
      user,
      accessToken,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
