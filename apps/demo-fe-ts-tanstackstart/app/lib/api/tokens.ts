import { apiFetch } from "./client";
import type { JwksResponse } from "./types";

export function getJwks(): Promise<JwksResponse> {
  return apiFetch<JwksResponse>("/.well-known/jwks.json");
}

export function decodeTokenClaims(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  const payload = parts[1];
  if (!payload) throw new Error("Invalid JWT format");
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded) as Record<string, unknown>;
}
