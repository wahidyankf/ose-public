import { Effect } from "effect";
import type { Role, UserStatus } from "./types.js";
import { ValidationError } from "./errors.js";

export interface User {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly displayName: string;
  readonly role: Role;
  readonly status: UserStatus;
  readonly failedLoginAttempts: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateUserData {
  readonly username: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly displayName: string;
}

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_UPPERCASE_RE = /[A-Z]/;
const PASSWORD_SPECIAL_RE = /[^A-Za-z0-9]/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,50}$/;

export const validatePasswordStrength = (password: string): Effect.Effect<string, ValidationError> => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return Effect.fail(
      new ValidationError({
        field: "password",
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
      }),
    );
  }
  if (!PASSWORD_UPPERCASE_RE.test(password)) {
    return Effect.fail(
      new ValidationError({
        field: "password",
        message: "Password must contain at least one uppercase letter",
      }),
    );
  }
  if (!PASSWORD_SPECIAL_RE.test(password)) {
    return Effect.fail(
      new ValidationError({
        field: "password",
        message: "Password must contain at least one special character",
      }),
    );
  }
  return Effect.succeed(password);
};

export const validateEmailFormat = (email: string): Effect.Effect<string, ValidationError> => {
  if (!EMAIL_RE.test(email)) {
    return Effect.fail(
      new ValidationError({
        field: "email",
        message: "Invalid email format",
      }),
    );
  }
  return Effect.succeed(email);
};

export const validateUsername = (username: string): Effect.Effect<string, ValidationError> => {
  if (!USERNAME_RE.test(username)) {
    return Effect.fail(
      new ValidationError({
        field: "username",
        message: "Username must be 3-50 characters and contain only letters, digits, underscores, and hyphens",
      }),
    );
  }
  return Effect.succeed(username);
};
