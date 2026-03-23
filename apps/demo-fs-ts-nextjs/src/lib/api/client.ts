const TOKEN_KEY = "demo_fe_access_token";
const REFRESH_KEY = "demo_fe_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:set"));
  }
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:cleared"));
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error: ${status}`);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    // Only clear session on 401 (unauthenticated / token expired).
    // 403 (forbidden / insufficient permission) should NOT log the user out.
    if (res.status === 401 && typeof window !== "undefined") {
      sessionStorage.setItem("auth_error", "Your account has been disabled or deactivated. Please log in again.");
      clearTokens();
    }
    throw new ApiError(res.status, body);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
