"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setIntendedDestination: (destination: string) => void;
  getIntendedDestination: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check", {
        method: "GET",
        credentials: "include", // This is important for including cookies
      });
      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
      return data.isAuthenticated;
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      return false;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Clear the auth cookie
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Update the authentication state
      setIsAuthenticated(false);

      // Redirect to the login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    checkAuth,
    setIntendedDestination: (destination: string) => setIntendedDestination(destination),
    getIntendedDestination: () => intendedDestination,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthRedirect() {
  const router = useRouter();
  const { checkAuth } = useAuth();

  const redirectAfterLogin = async () => {
    const authStatus = await checkAuth();
    if (authStatus) {
      router.push("/dashboard");
    }
  };

  return { redirectAfterLogin };
}
