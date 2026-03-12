import { Brand } from "effect";

// Currency brand
export type Currency = Brand.Branded<string, "Currency">;
export const Currency = Brand.nominal<Currency>();

export const SUPPORTED_CURRENCIES = ["USD", "IDR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(value as SupportedCurrency);
}

// Role brand
export type Role = "USER" | "ADMIN";
export const ROLES = ["USER", "ADMIN"] as const;

export function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

// UserStatus brand
export type UserStatus = "ACTIVE" | "INACTIVE" | "DISABLED" | "LOCKED";
export const USER_STATUSES = ["ACTIVE", "INACTIVE", "DISABLED", "LOCKED"] as const;

export function isUserStatus(value: string): value is UserStatus {
  return USER_STATUSES.includes(value as UserStatus);
}

// Currency decimal precision
export const CURRENCY_DECIMALS: Record<SupportedCurrency, number> = {
  USD: 2,
  IDR: 0,
};
