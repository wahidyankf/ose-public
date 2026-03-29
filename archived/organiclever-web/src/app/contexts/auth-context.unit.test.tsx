import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AuthProvider, useAuth, useAuthRedirect } from "./auth-context";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function makeFetchMock(data: unknown) {
  return vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue(data),
  });
}

describe("AuthProvider / useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", makeFetchMock({ isAuthenticated: false }));
  });

  it("renders children and exposes context", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("sets isAuthenticated true when checkAuth returns true on mount", async () => {
    vi.stubGlobal("fetch", makeFetchMock({ isAuthenticated: true }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it("checkAuth catches error and returns false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), { wrapper });
    let checkResult: boolean;
    await act(async () => {
      checkResult = await result.current.checkAuth();
    });
    expect(checkResult!).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    consoleSpy.mockRestore();
  });

  it("login returns true on success and sets isAuthenticated", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ isAuthenticated: false }) })
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));

    let loginResult: boolean;
    await act(async () => {
      loginResult = await result.current.login("user@example.com", "password123");
    });
    expect(loginResult!).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("login returns false when success is false", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ isAuthenticated: false }) })
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false }) });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));

    let loginResult: boolean;
    await act(async () => {
      loginResult = await result.current.login("user@example.com", "wrongpassword");
    });
    expect(loginResult!).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("login catches fetch error and returns false", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ isAuthenticated: false }) })
      .mockRejectedValueOnce(new Error("Network failure"));
    vi.stubGlobal("fetch", fetchMock);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));

    let loginResult: boolean;
    await act(async () => {
      loginResult = await result.current.login("user@example.com", "password");
    });
    expect(loginResult!).toBe(false);
    consoleSpy.mockRestore();
  });

  it("logout calls fetch and redirects to /login", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ isAuthenticated: false }) })
      .mockResolvedValueOnce({});
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));

    await act(async () => {
      await result.current.logout();
    });
    expect(mockPush).toHaveBeenCalledWith("/login");
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("logout catches fetch error gracefully", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ isAuthenticated: false }) })
      .mockRejectedValueOnce(new Error("Logout failed"));
    vi.stubGlobal("fetch", fetchMock);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));

    await act(async () => {
      await result.current.logout();
    });
    expect(mockPush).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("setIntendedDestination and getIntendedDestination work", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).toBeDefined());

    expect(result.current.getIntendedDestination()).toBeNull();

    act(() => {
      result.current.setIntendedDestination("/dashboard/members");
    });
    expect(result.current.getIntendedDestination()).toBe("/dashboard/members");
  });

  it("useAuth throws when used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");
  });
});

describe("useAuthRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", makeFetchMock({ isAuthenticated: false }));
  });

  it("redirectAfterLogin pushes /dashboard when checkAuth returns true", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ isAuthenticated: false }) })
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ isAuthenticated: true }) });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuthRedirect(), { wrapper });
    await waitFor(() => expect(result.current).toBeDefined());

    await act(async () => {
      await result.current.redirectAfterLogin();
    });
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("redirectAfterLogin does not push when checkAuth returns false", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ isAuthenticated: false }) })
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ isAuthenticated: false }) });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuthRedirect(), { wrapper });
    await waitFor(() => expect(result.current).toBeDefined());

    mockPush.mockClear();
    await act(async () => {
      await result.current.redirectAfterLogin();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
