import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "~/lib/api/client";
import { refreshToken as refreshTokenApi } from "~/lib/api/auth";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
  error: null,
  setError: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    clearTokens();
    setIsAuthenticated(false);
    void navigate({ to: "/login" });
  }, [navigate]);

  useEffect(() => {
    const token = getAccessToken();
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const doRefresh = async () => {
      const token = getRefreshToken();
      if (!token) {
        logout();
        return;
      }
      try {
        const tokens = await refreshTokenApi(token);
        setTokens(tokens.accessToken, tokens.refreshToken);
      } catch {
        logout();
        setError("Session expired. Please log in again.");
      }
    };

    const interval = setInterval(() => void doRefresh(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, logout, error, setError }),
    [isAuthenticated, isLoading, logout, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
