import { apiFetch } from "./client";
import type { User, UpdateProfileRequest, ChangePasswordRequest } from "./types";

export function getCurrentUser(): Promise<User> {
  return apiFetch<User>("/api/v1/users/me");
}

export function updateProfile(data: UpdateProfileRequest): Promise<User> {
  return apiFetch<User>("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function changePassword(data: ChangePasswordRequest): Promise<void> {
  return apiFetch("/api/v1/users/me/password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deactivateAccount(): Promise<void> {
  return apiFetch("/api/v1/users/me/deactivate", {
    method: "POST",
  });
}
