/**
 * Service layer API for integration tests.
 *
 * Each function mirrors the corresponding HTTP route handler but calls
 * Effect services directly — no HTTP server is involved. Results are
 * returned as { status, body, headers } objects so that existing step
 * definitions do not need to change.
 *
 * Error mapping follows the same rules as app.ts#handleDomainError:
 *   ValidationError    → 400
 *   UnauthorizedError  → 401
 *   ForbiddenError     → 403
 *   NotFoundError      → 404
 *   ConflictError      → 409
 *   FileTooLargeError  → 413
 *   UnsupportedMediaTypeError → 415
 *   other              → 500
 */

import { Effect } from "effect";
import { UserRepository } from "../../src/infrastructure/db/user-repo.js";
import { ExpenseRepository } from "../../src/infrastructure/db/expense-repo.js";
import { AttachmentRepository } from "../../src/infrastructure/db/attachment-repo.js";
import { RevokedTokenRepository } from "../../src/infrastructure/db/token-repo.js";
import { PasswordService } from "../../src/infrastructure/password.js";
import { JwtService } from "../../src/auth/jwt.js";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  FileTooLargeError,
  UnsupportedMediaTypeError,
} from "../../src/domain/errors.js";
import { validatePasswordStrength, validateEmailFormat, validateUsername } from "../../src/domain/user.js";
import { validateAmount, validateUnit } from "../../src/domain/expense.js";
import { CURRENCY_DECIMALS, isSupportedCurrency } from "../../src/domain/types.js";
import { isAllowedContentType, MAX_ATTACHMENT_SIZE } from "../../src/domain/attachment.js";
import type { ExpenseType } from "../../src/domain/expense.js";
import type { UserStatus } from "../../src/domain/types.js";
import { serviceRuntime } from "./hooks.js";

export interface HttpResponse {
  readonly status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly body: any;
  readonly headers: Record<string, string>;
}

const MAX_FAILED_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// Error mapping (mirrors app.ts#handleDomainError)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errorToResponse(error: any): HttpResponse {
  if (error instanceof ValidationError) {
    return {
      status: 400,
      body: { error: "Validation error", field: error.field, message: error.message },
      headers: {},
    };
  }
  if (error instanceof UnauthorizedError) {
    return { status: 401, body: { error: "Unauthorized", message: error.reason }, headers: {} };
  }
  if (error instanceof ForbiddenError) {
    return { status: 403, body: { error: "Forbidden", message: error.reason }, headers: {} };
  }
  if (error instanceof NotFoundError) {
    return { status: 404, body: { error: "Not found", message: `${error.resource} not found` }, headers: {} };
  }
  if (error instanceof ConflictError) {
    return { status: 409, body: { error: "Conflict", message: error.message }, headers: {} };
  }
  if (error instanceof FileTooLargeError) {
    return {
      status: 413,
      body: { error: "File too large", message: "File exceeds maximum allowed size" },
      headers: {},
    };
  }
  if (error instanceof UnsupportedMediaTypeError) {
    return { status: 415, body: { error: "Unsupported media type", message: "File type not allowed" }, headers: {} };
  }
  return { status: 500, body: { error: "Internal server error" }, headers: {} };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runEffect<A>(
  effect: Effect.Effect<A, unknown, any>,
): Promise<{ ok: true; value: A } | { ok: false; error: unknown }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = await (serviceRuntime as any).runPromise(effect);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error };
  }
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function verifyToken(
  token: string,
): Effect.Effect<
  import("../../src/auth/jwt.js").JwtClaims,
  UnauthorizedError | import("@effect/sql/SqlError").SqlError,
  JwtService | RevokedTokenRepository
> {
  return Effect.gen(function* () {
    const jwt = yield* JwtService;
    const claims = yield* jwt.verify(token);
    if (claims.tokenType !== "access") {
      return yield* Effect.fail(new UnauthorizedError({ reason: "Not an access token" }));
    }
    const tokenRepo = yield* RevokedTokenRepository;
    const isRevoked = yield* tokenRepo.isRevoked(claims.jti, claims.sub, claims.iat);
    if (isRevoked) {
      return yield* Effect.fail(new UnauthorizedError({ reason: "Token has been revoked" }));
    }
    return claims;
  });
}

function extractToken(authHeader: string | undefined): string {
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return "";
}

// ---------------------------------------------------------------------------
// Formatting helpers (mirrors routes/expense.ts)
// ---------------------------------------------------------------------------

function formatAmount(amount: number, currency: string): string {
  const upperCurrency = currency.toUpperCase();
  if (!isSupportedCurrency(upperCurrency)) {
    return amount.toString();
  }
  const decimals = CURRENCY_DECIMALS[upperCurrency];
  return amount.toFixed(decimals);
}

function expenseToResponse(expense: {
  id: string;
  userId: string;
  type: ExpenseType;
  amount: number;
  currency: string;
  category: string;
  description: string;
  quantity: string | null;
  unit: string | null;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: expense.id,
    type: expense.type.toLowerCase(),
    amount: formatAmount(expense.amount, expense.currency),
    currency: expense.currency,
    category: expense.category,
    description: expense.description,
    quantity: expense.quantity !== null ? Number(expense.quantity) : undefined,
    unit: expense.unit ?? undefined,
    date: expense.date,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function userToAdminResponse(user: any) {
  return {
    id: user.id as string,
    username: user.username as string,
    email: user.email as string,
    displayName: user.displayName as string,
    role: user.role as string,
    status: user.status as string,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function attachmentToResponse(attachment: any) {
  const id = attachment.id as string;
  const expenseId = attachment.expenseId as string;
  return {
    id,
    expense_id: expenseId,
    filename: attachment.filename as string,
    contentType: attachment.contentType as string,
    size: attachment.size as number,
    url: `/api/v1/expenses/${expenseId}/attachments/${id}`,
  };
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function getHealth(): Promise<HttpResponse> {
  return { status: 200, body: { status: "UP" }, headers: {} };
}

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------

export async function register(body: Record<string, unknown>): Promise<HttpResponse> {
  const username = (body["username"] as string | undefined) ?? "";
  const email = (body["email"] as string | undefined) ?? "";
  const password = (body["password"] as string | undefined) ?? "";

  const result = await runEffect(
    Effect.gen(function* () {
      if (!username) {
        return yield* Effect.fail(new ValidationError({ field: "username", message: "Username is required" }));
      }
      if (!email) {
        return yield* Effect.fail(new ValidationError({ field: "email", message: "Email is required" }));
      }
      if (!password) {
        return yield* Effect.fail(new ValidationError({ field: "password", message: "Password is required" }));
      }

      yield* validateUsername(username);
      yield* validateEmailFormat(email);
      yield* validatePasswordStrength(password);

      const passwordSvc = yield* PasswordService;
      const passwordHash = yield* passwordSvc.hash(password);

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.create({ username, email, passwordHash, displayName: username });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 201, body: result.value, headers: {} };
}

export async function login(body: Record<string, unknown>): Promise<HttpResponse> {
  const username = (body["username"] as string | undefined) ?? "";
  const password = (body["password"] as string | undefined) ?? "";

  const result = await runEffect(
    Effect.gen(function* () {
      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findByUsername(username);

      if (!user) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Invalid credentials" }));
      }
      if (user.status === "DISABLED") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Account is disabled" }));
      }
      if (user.status === "INACTIVE") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Account is deactivated" }));
      }
      if (user.status === "LOCKED") {
        return yield* Effect.fail(
          new UnauthorizedError({ reason: "Account is locked due to too many failed attempts" }),
        );
      }

      const passwordSvc = yield* PasswordService;
      const valid = yield* passwordSvc.verify(password, user.passwordHash);

      if (!valid) {
        const newAttempts = user.failedLoginAttempts + 1;
        yield* userRepo.incrementFailedAttempts(user.id);
        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
          yield* userRepo.updateStatus(user.id, "LOCKED");
        }
        return yield* Effect.fail(new UnauthorizedError({ reason: "Invalid credentials" }));
      }

      yield* userRepo.resetFailedAttempts(user.id);

      const jwt = yield* JwtService;
      const accessToken = yield* jwt.signAccess(user.id, user.username, user.role);
      const refreshToken = yield* jwt.signRefresh(user.id);

      return {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
      };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function logout(authHeader: string | undefined): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const jwt = yield* JwtService;
      const claims = yield* jwt.verify(tokenStr);
      if (claims.tokenType !== "access") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Not an access token" }));
      }
      const tokenRepo = yield* RevokedTokenRepository;
      yield* tokenRepo.revoke(claims.jti, claims.sub);
      return { message: "Logged out successfully" };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function logoutAll(authHeader: string | undefined): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);
      const tokenRepo = yield* RevokedTokenRepository;
      yield* tokenRepo.revokeAllForUser(claims.sub);
      return { message: "All sessions logged out" };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function refreshToken(body: Record<string, unknown>): Promise<HttpResponse> {
  const refreshTokenStr = ((body["refreshToken"] ?? body["refresh_token"]) as string | undefined) ?? "";

  const result = await runEffect(
    Effect.gen(function* () {
      if (!refreshTokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing refresh token" }));
      }

      const jwt = yield* JwtService;
      const claims = yield* jwt.verify(refreshTokenStr);

      if (claims.tokenType !== "refresh") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Not a refresh token" }));
      }

      const tokenRepo = yield* RevokedTokenRepository;
      const isRevoked = yield* tokenRepo.isRevoked(claims.jti, claims.sub, claims.iat);

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(claims.sub);
      if (!user) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "User not found" }));
      }

      if (user.status !== "ACTIVE") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Account is deactivated" }));
      }

      if (isRevoked) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Token has been revoked" }));
      }

      yield* tokenRepo.revoke(claims.jti, claims.sub);

      const newAccessToken = yield* jwt.signAccess(user.id, user.username, user.role);
      const newRefreshToken = yield* jwt.signRefresh(user.id);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: "Bearer",
      };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

// ---------------------------------------------------------------------------
// JWKS
// ---------------------------------------------------------------------------

export async function getJwks(): Promise<HttpResponse> {
  const result = await runEffect(
    Effect.gen(function* () {
      const jwt = yield* JwtService;
      return yield* jwt.getJwks();
    }),
  );
  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

// ---------------------------------------------------------------------------
// User routes
// ---------------------------------------------------------------------------

export async function getMe(authHeader: string | undefined): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);
      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(claims.sub);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }
      if (user.status !== "ACTIVE") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Account is not active" }));
      }
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function updateMe(authHeader: string | undefined, body: Record<string, unknown>): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);
      const displayName = (body["displayName"] ?? body["display_name"]) as string | undefined;

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(claims.sub);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      if (displayName !== undefined) {
        yield* userRepo.updateDisplayName(user.id, displayName);
      }

      const updated = yield* userRepo.findById(claims.sub);
      if (!updated) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      return {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role,
        status: updated.status,
      };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function changePassword(
  authHeader: string | undefined,
  body: Record<string, unknown>,
): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);
      const oldPassword = ((body["oldPassword"] ?? body["old_password"]) as string | undefined) ?? "";
      const newPassword = ((body["newPassword"] ?? body["new_password"]) as string | undefined) ?? "";

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(claims.sub);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      const passwordSvc = yield* PasswordService;
      const valid = yield* passwordSvc.verify(oldPassword, user.passwordHash);
      if (!valid) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Invalid credentials" }));
      }

      const newHash = yield* passwordSvc.hash(newPassword);
      yield* userRepo.updatePassword(user.id, newHash);

      return { message: "Password changed successfully" };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function deactivateMe(authHeader: string | undefined): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);
      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(claims.sub);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      yield* userRepo.updateStatus(user.id, "INACTIVE");

      const tokenRepo = yield* RevokedTokenRepository;
      yield* tokenRepo.revokeAllForUser(user.id);

      return { message: "Account deactivated successfully" };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

// ---------------------------------------------------------------------------
// Expense routes
// ---------------------------------------------------------------------------

export async function createExpense(
  authHeader: string | undefined,
  body: Record<string, unknown>,
): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);

      const typeRaw = ((body["type"] as string | undefined) ?? "expense").toUpperCase() as ExpenseType;
      const amountRaw = body["amount"] as string | number | undefined;
      const currency = ((body["currency"] as string | undefined) ?? "").toUpperCase();
      const category = (body["category"] as string | undefined) ?? "";
      const description = (body["description"] as string | undefined) ?? "";
      const date = (body["date"] as string | undefined) ?? "";
      const quantityRaw = body["quantity"] as string | undefined;
      const unitRaw = body["unit"] as string | undefined;

      if (!description) {
        return yield* Effect.fail(new ValidationError({ field: "description", message: "Description is required" }));
      }
      if (!date) {
        return yield* Effect.fail(new ValidationError({ field: "date", message: "Date is required" }));
      }

      const amount = typeof amountRaw === "string" ? parseFloat(amountRaw) : (amountRaw ?? 0);
      if (isNaN(amount)) {
        return yield* Effect.fail(new ValidationError({ field: "amount", message: "Amount must be a number" }));
      }

      yield* validateAmount(currency, amount);

      if (unitRaw !== undefined && unitRaw !== "") {
        yield* validateUnit(unitRaw);
      }

      const expenseRepo = yield* ExpenseRepository;
      const createData = {
        userId: claims.sub,
        type: typeRaw,
        amount,
        currency,
        category,
        description,
        date,
        ...(quantityRaw !== undefined ? { quantity: quantityRaw } : {}),
        ...(unitRaw !== undefined ? { unit: unitRaw } : {}),
      };
      const expense = yield* expenseRepo.create(createData);
      return expenseToResponse(expense);
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 201, body: result.value, headers: {} };
}

export async function listExpenses(
  authHeader: string | undefined,
  queryParams: Record<string, string> = {},
): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);
      const page = Math.max(1, parseInt(queryParams["page"] ?? "1", 10));
      const size = Math.min(100, parseInt(queryParams["size"] ?? "20", 10));

      const expenseRepo = yield* ExpenseRepository;
      const result = yield* expenseRepo.findByUserId(claims.sub, page, size);

      return {
        content: result.items.map(expenseToResponse),
        totalElements: result.total,
        page,
        size,
      };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function getExpense(authHeader: string | undefined, expenseId: string): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);

      const expenseRepo = yield* ExpenseRepository;
      const expense = yield* expenseRepo.findById(expenseId);

      if (!expense) {
        return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
      }
      if (expense.userId !== claims.sub) {
        return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
      }

      return expenseToResponse(expense);
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function updateExpense(
  authHeader: string | undefined,
  expenseId: string,
  body: Record<string, unknown>,
): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);

      const expenseRepo = yield* ExpenseRepository;
      const existing = yield* expenseRepo.findById(expenseId);

      if (!existing) {
        return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
      }
      if (existing.userId !== claims.sub) {
        return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
      }

      const typeRaw = body["type"] !== undefined ? ((body["type"] as string).toUpperCase() as ExpenseType) : undefined;
      const amountRaw = body["amount"] as string | number | undefined;
      const currencyRaw = body["currency"] as string | undefined;
      const category = body["category"] as string | undefined;
      const description = body["description"] as string | undefined;
      const date = body["date"] as string | undefined;
      const quantityRaw = body["quantity"] as string | undefined;
      const unitRaw = body["unit"] as string | undefined;

      const currency = currencyRaw !== undefined ? currencyRaw.toUpperCase() : existing.currency;
      const amount =
        amountRaw !== undefined ? (typeof amountRaw === "string" ? parseFloat(amountRaw) : amountRaw) : existing.amount;

      if (amountRaw !== undefined || currencyRaw !== undefined) {
        yield* validateAmount(currency, amount);
      }

      if (unitRaw !== undefined && unitRaw !== "") {
        yield* validateUnit(unitRaw);
      }

      const updateData: Partial<import("../../src/domain/expense.js").CreateExpenseData> = {
        ...(typeRaw !== undefined ? { type: typeRaw } : {}),
        ...(amountRaw !== undefined ? { amount } : {}),
        ...(currencyRaw !== undefined ? { currency } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(quantityRaw !== undefined ? { quantity: quantityRaw } : {}),
        ...(unitRaw !== undefined ? { unit: unitRaw } : {}),
        ...(date !== undefined ? { date } : {}),
      };
      const updated = yield* expenseRepo.update(expenseId, updateData);
      return expenseToResponse(updated);
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function deleteExpense(authHeader: string | undefined, expenseId: string): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);

      const expenseRepo = yield* ExpenseRepository;
      const existing = yield* expenseRepo.findById(expenseId);

      if (!existing) {
        return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
      }
      if (existing.userId !== claims.sub) {
        return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
      }

      yield* expenseRepo.delete(expenseId);
      return null;
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 204, body: null, headers: {} };
}

export async function getExpenseSummary(authHeader: string | undefined): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);
      const expenseRepo = yield* ExpenseRepository;
      const summary = yield* expenseRepo.summarize(claims.sub);

      const resultMap: Record<string, string> = {};
      for (const [currency, { expense }] of Object.entries(summary)) {
        resultMap[currency] = formatAmount(expense, currency);
      }

      return resultMap;
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

// ---------------------------------------------------------------------------
// Attachment routes
// ---------------------------------------------------------------------------

export async function uploadAttachment(
  authHeader: string | undefined,
  expenseId: string,
  filename: string,
  contentType: string,
  content: Buffer,
): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);

      const expenseRepo = yield* ExpenseRepository;
      const expense = yield* expenseRepo.findById(expenseId);
      if (!expense) {
        return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
      }
      if (expense.userId !== claims.sub) {
        return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
      }

      if (content.length > MAX_ATTACHMENT_SIZE) {
        return yield* Effect.fail(new FileTooLargeError());
      }

      if (!isAllowedContentType(contentType)) {
        return yield* Effect.fail(new UnsupportedMediaTypeError());
      }

      const attachmentRepo = yield* AttachmentRepository;
      const attachment = yield* attachmentRepo.create({
        expenseId,
        userId: claims.sub,
        filename,
        contentType,
        size: content.length,
        data: content,
      });

      return attachmentToResponse(attachment);
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 201, body: result.value, headers: {} };
}

export async function listAttachments(authHeader: string | undefined, expenseId: string): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);

      const expenseRepo = yield* ExpenseRepository;
      const expense = yield* expenseRepo.findById(expenseId);
      if (!expense) {
        return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
      }
      if (expense.userId !== claims.sub) {
        return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
      }

      const attachmentRepo = yield* AttachmentRepository;
      const attachments = yield* attachmentRepo.findByExpenseId(expenseId);

      return { attachments: attachments.map(attachmentToResponse) };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function deleteAttachment(
  authHeader: string | undefined,
  expenseId: string,
  attachmentId: string,
): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);

      const expenseRepo = yield* ExpenseRepository;
      const expense = yield* expenseRepo.findById(expenseId);
      if (!expense) {
        return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
      }
      if (expense.userId !== claims.sub) {
        return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
      }

      const attachmentRepo = yield* AttachmentRepository;
      const attachment = yield* attachmentRepo.findById(attachmentId);
      if (!attachment) {
        return yield* Effect.fail(new NotFoundError({ resource: "Attachment" }));
      }
      if (attachment.userId !== claims.sub) {
        return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
      }

      yield* attachmentRepo.delete(attachmentId);
      return null;
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 204, body: null, headers: {} };
}

// ---------------------------------------------------------------------------
// Report routes
// ---------------------------------------------------------------------------

export async function getReport(
  authHeader: string | undefined,
  queryParams: Record<string, string>,
): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const claims = yield* verifyToken(tokenStr);

      const from = queryParams["from"] ?? "";
      const to = queryParams["to"] ?? "";
      const currency = (queryParams["currency"] ?? "").toUpperCase();

      if (!from) {
        return yield* Effect.fail(new ValidationError({ field: "from", message: "from date is required" }));
      }
      if (!to) {
        return yield* Effect.fail(new ValidationError({ field: "to", message: "to date is required" }));
      }
      if (!currency) {
        return yield* Effect.fail(new ValidationError({ field: "currency", message: "currency is required" }));
      }

      const expenseRepo = yield* ExpenseRepository;
      const expenses = yield* expenseRepo.findByDateRange(claims.sub, from, to, currency);

      let incomeTotal = 0;
      let expenseTotal = 0;
      const incomeBreakdown: Record<string, number> = {};
      const expenseBreakdown: Record<string, number> = {};

      for (const entry of expenses) {
        if (entry.type === "INCOME") {
          incomeTotal += entry.amount;
          const cat = entry.category || "uncategorized";
          incomeBreakdown[cat] = (incomeBreakdown[cat] ?? 0) + entry.amount;
        } else {
          expenseTotal += entry.amount;
          const cat = entry.category || "uncategorized";
          expenseBreakdown[cat] = (expenseBreakdown[cat] ?? 0) + entry.amount;
        }
      }

      const net = incomeTotal - expenseTotal;

      const incomeBreakdownArr = Object.entries(incomeBreakdown).map(([cat, amount]) => ({
        category: cat,
        type: "income",
        total: formatAmount(amount, currency),
      }));

      const expenseBreakdownArr = Object.entries(expenseBreakdown).map(([cat, amount]) => ({
        category: cat,
        type: "expense",
        total: formatAmount(amount, currency),
      }));

      return {
        totalIncome: formatAmount(incomeTotal, currency),
        totalExpense: formatAmount(expenseTotal, currency),
        net: formatAmount(net, currency),
        incomeBreakdown: incomeBreakdownArr,
        expenseBreakdown: expenseBreakdownArr,
        currency,
        from,
        to,
      };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------

function requireAdminToken(
  tokenStr: string,
): Effect.Effect<
  import("../../src/auth/jwt.js").JwtClaims,
  UnauthorizedError | ForbiddenError | import("@effect/sql/SqlError").SqlError,
  JwtService | RevokedTokenRepository
> {
  return Effect.gen(function* () {
    const claims = yield* verifyToken(tokenStr);
    if (claims.role !== "ADMIN") {
      return yield* Effect.fail(new ForbiddenError({ reason: "Admin access required" }));
    }
    return claims;
  });
}

export async function adminListUsers(
  authHeader: string | undefined,
  queryParams: Record<string, string> = {},
): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      yield* requireAdminToken(tokenStr);

      const page = Math.max(1, parseInt(queryParams["page"] ?? "1", 10));
      const size = Math.min(100, parseInt(queryParams["size"] ?? "20", 10));
      const search = queryParams["search"] ?? queryParams["email"];

      const userRepo = yield* UserRepository;
      const result = yield* userRepo.listUsers(page, size, search);

      return {
        content: result.items.map(userToAdminResponse),
        totalElements: result.total,
        page,
        size,
      };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function adminDisableUser(authHeader: string | undefined, userId: string): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      yield* requireAdminToken(tokenStr);

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(userId);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      yield* userRepo.updateStatus(userId, "DISABLED" as UserStatus);

      const tokenRepo = yield* RevokedTokenRepository;
      yield* tokenRepo.revokeAllForUser(userId);

      const updated = yield* userRepo.findById(userId);
      if (!updated) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      return userToAdminResponse(updated);
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function adminEnableUser(authHeader: string | undefined, userId: string): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      yield* requireAdminToken(tokenStr);

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(userId);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      yield* userRepo.updateStatus(userId, "ACTIVE" as UserStatus);

      const updated = yield* userRepo.findById(userId);
      if (!updated) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      return userToAdminResponse(updated);
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function adminUnlockUser(authHeader: string | undefined, userId: string): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      yield* requireAdminToken(tokenStr);

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(userId);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      yield* userRepo.updateStatus(userId, "ACTIVE" as UserStatus);
      yield* userRepo.resetFailedAttempts(userId);

      const updated = yield* userRepo.findById(userId);
      if (!updated) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      return userToAdminResponse(updated);
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

export async function adminForcePasswordReset(authHeader: string | undefined, userId: string): Promise<HttpResponse> {
  const tokenStr = extractToken(authHeader);

  const result = await runEffect(
    Effect.gen(function* () {
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      yield* requireAdminToken(tokenStr);

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(userId);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      const jwt = yield* JwtService;
      const resetToken = yield* jwt.signAccess(user.id, user.username, user.role);

      return {
        token: resetToken,
      };
    }),
  );

  if (!result.ok) {
    return errorToResponse(result.error);
  }
  return { status: 200, body: result.value, headers: {} };
}

// ---------------------------------------------------------------------------
// Path-based router — maps HTTP paths/methods to service calls
// ---------------------------------------------------------------------------

/**
 * Parse query string from a path like "/api/v1/expenses?page=1&size=10"
 */
function parsePathAndQuery(path: string): { pathname: string; queryParams: Record<string, string> } {
  const [pathname, queryString] = path.split("?", 2);
  const queryParams: Record<string, string> = {};
  if (queryString) {
    for (const pair of queryString.split("&")) {
      const [key, value] = pair.split("=", 2);
      if (key) {
        queryParams[decodeURIComponent(key)] = decodeURIComponent(value ?? "");
      }
    }
  }
  return { pathname: pathname ?? path, queryParams };
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function dispatchRequest(
  method: Method,
  path: string,
  body: Record<string, unknown> = {},
  authHeader?: string,
): Promise<HttpResponse> {
  const { pathname, queryParams } = parsePathAndQuery(path);

  // Health
  if (method === "GET" && pathname === "/health") {
    return getHealth();
  }

  // JWKS
  if (method === "GET" && pathname === "/.well-known/jwks.json") {
    return getJwks();
  }

  // Auth
  if (method === "POST" && pathname === "/api/v1/auth/register") {
    return register(body);
  }
  if (method === "POST" && pathname === "/api/v1/auth/login") {
    return login(body);
  }
  if (method === "POST" && pathname === "/api/v1/auth/logout") {
    return logout(authHeader);
  }
  if (method === "POST" && pathname === "/api/v1/auth/logout-all") {
    return logoutAll(authHeader);
  }
  if (method === "POST" && pathname === "/api/v1/auth/refresh") {
    return refreshToken(body);
  }

  // User
  if (method === "GET" && pathname === "/api/v1/users/me") {
    return getMe(authHeader);
  }
  if (method === "PATCH" && pathname === "/api/v1/users/me") {
    return updateMe(authHeader, body);
  }
  if (method === "POST" && pathname === "/api/v1/users/me/password") {
    return changePassword(authHeader, body);
  }
  if (method === "POST" && pathname === "/api/v1/users/me/deactivate") {
    return deactivateMe(authHeader);
  }

  // Admin
  if (method === "GET" && pathname === "/api/v1/admin/users") {
    return adminListUsers(authHeader, queryParams);
  }

  const disableMatch = pathname.match(/^\/api\/v1\/admin\/users\/([^/]+)\/disable$/);
  if (method === "POST" && disableMatch) {
    return adminDisableUser(authHeader, disableMatch[1]!);
  }

  const enableMatch = pathname.match(/^\/api\/v1\/admin\/users\/([^/]+)\/enable$/);
  if (method === "POST" && enableMatch) {
    return adminEnableUser(authHeader, enableMatch[1]!);
  }

  const unlockMatch = pathname.match(/^\/api\/v1\/admin\/users\/([^/]+)\/unlock$/);
  if (method === "POST" && unlockMatch) {
    return adminUnlockUser(authHeader, unlockMatch[1]!);
  }

  const forceResetMatch = pathname.match(/^\/api\/v1\/admin\/users\/([^/]+)\/force-password-reset$/);
  if (method === "POST" && forceResetMatch) {
    return adminForcePasswordReset(authHeader, forceResetMatch[1]!);
  }

  // Expenses — order matters: /summary and specific routes before :id
  if (method === "POST" && pathname === "/api/v1/expenses") {
    return createExpense(authHeader, body);
  }
  if (method === "GET" && pathname === "/api/v1/expenses") {
    return listExpenses(authHeader, queryParams);
  }
  if (method === "GET" && pathname === "/api/v1/expenses/summary") {
    return getExpenseSummary(authHeader);
  }

  const expenseIdMatch = pathname.match(/^\/api\/v1\/expenses\/([^/]+)$/);
  if (method === "GET" && expenseIdMatch) {
    return getExpense(authHeader, expenseIdMatch[1]!);
  }
  if (method === "PUT" && expenseIdMatch) {
    return updateExpense(authHeader, expenseIdMatch[1]!, body);
  }
  if (method === "DELETE" && expenseIdMatch) {
    return deleteExpense(authHeader, expenseIdMatch[1]!);
  }

  // Attachments
  const attachmentListMatch = pathname.match(/^\/api\/v1\/expenses\/([^/]+)\/attachments$/);
  if (method === "GET" && attachmentListMatch) {
    return listAttachments(authHeader, attachmentListMatch[1]!);
  }
  if (method === "DELETE" && attachmentListMatch) {
    // Should not happen but handle gracefully
    return { status: 404, body: { error: "Not found" }, headers: {} };
  }

  const attachmentDeleteMatch = pathname.match(/^\/api\/v1\/expenses\/([^/]+)\/attachments\/([^/]+)$/);
  if (method === "DELETE" && attachmentDeleteMatch) {
    return deleteAttachment(authHeader, attachmentDeleteMatch[1]!, attachmentDeleteMatch[2]!);
  }

  // Reports
  if (method === "GET" && pathname === "/api/v1/reports/pl") {
    return getReport(authHeader, queryParams);
  }

  return { status: 404, body: { error: "Not found" }, headers: {} };
}
