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

import type { AuthUser } from '../services/authService';

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
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
      const currentUser = response.data?.user ?? response.user;

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
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginUser(email, password);
    const authenticatedUser = response.data.user;

    setAccessToken(response.data.accessToken);
    setUser(authenticatedUser);

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
