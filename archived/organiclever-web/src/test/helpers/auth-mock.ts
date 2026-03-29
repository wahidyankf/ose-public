import { vi } from "vitest";
import type { useAuth } from "@/app/contexts/auth-context";

type AuthContextShape = ReturnType<typeof useAuth>;

const baseMock = {
  isAuthenticated: false,
  login: vi.fn().mockResolvedValue(false),
  logout: vi.fn().mockResolvedValue(undefined),
  checkAuth: vi.fn().mockResolvedValue(false),
  setIntendedDestination: vi.fn(),
  getIntendedDestination: vi.fn().mockReturnValue(null),
};

export const BASE_AUTH = baseMock as unknown as AuthContextShape;

export const AUTHENTICATED = {
  ...baseMock,
  isAuthenticated: true,
  login: vi.fn().mockResolvedValue(true),
  checkAuth: vi.fn().mockResolvedValue(true),
} as unknown as AuthContextShape;
