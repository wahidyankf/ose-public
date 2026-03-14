import { apiFetch } from "./client";
import type { UserListResponse, User, DisableRequest, PasswordResetResponse } from "./types";

export function listUsers(page = 0, size = 20, search?: string): Promise<UserListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (search) params.set("search", search);
  return apiFetch<UserListResponse>(`/api/v1/admin/users?${params}`);
}

export function disableUser(userId: string, data: DisableRequest): Promise<User> {
  return apiFetch<User>(`/api/v1/admin/users/${userId}/disable`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function enableUser(userId: string): Promise<User> {
  return apiFetch<User>(`/api/v1/admin/users/${userId}/enable`, {
    method: "POST",
  });
}

export function unlockUser(userId: string): Promise<User> {
  return apiFetch<User>(`/api/v1/admin/users/${userId}/unlock`, {
    method: "POST",
  });
}

export function forcePasswordReset(userId: string): Promise<PasswordResetResponse> {
  return apiFetch<PasswordResetResponse>(`/api/v1/admin/users/${userId}/force-password-reset`, {
    method: "POST",
  });
}
