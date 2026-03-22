import type { Repositories } from "@/repositories/interfaces";
import type { ServiceResult } from "@/lib/types";
import { verifyToken, getJwks } from "@/lib/jwt";
import * as authService from "@/services/auth-service";
import * as userService from "@/services/user-service";
import * as expenseService from "@/services/expense-service";
import * as attachmentService from "@/services/attachment-service";
import * as reportService from "@/services/report-service";

export interface ServiceResponse {
  status: number;
  body: unknown;
}

function toResponse<T>(result: ServiceResult<T>, successStatus = 200): ServiceResponse {
  if (result.ok) return { status: successStatus, body: result.data };
  return { status: result.status, body: { error: result.error } };
}

async function extractClaims(repos: Repositories, authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const claims = await verifyToken(token);
  if (!claims || claims.tokenType !== "access") return null;
  const isRevoked = await repos.sessions.isAccessTokenRevoked(claims.jti);
  if (isRevoked) return null;
  const user = await repos.users.findById(claims.sub);
  if (!user || user.status === "DISABLED" || user.status === "INACTIVE" || user.status === "LOCKED") return null;
  return claims;
}

export class ServiceClient {
  constructor(private repos: Repositories) {}

  async dispatch(
    method: string,
    path: string,
    body: Record<string, unknown> | null,
    authHeader: string | null,
    file?: { filename: string; contentType: string; size: number; data: Buffer },
  ): Promise<ServiceResponse> {
    const m = method.toUpperCase();

    // Health
    if (m === "GET" && path === "/health") {
      return { status: 200, body: { status: "UP" } };
    }

    // JWKS
    if (m === "GET" && path === "/.well-known/jwks.json") {
      const jwks = await getJwks();
      return { status: 200, body: jwks };
    }

    // Test API
    if (m === "POST" && path === "/api/v1/test/reset-db") {
      await this.repos.attachments.deleteAll();
      await this.repos.expenses.deleteAll();
      await this.repos.sessions.deleteAll();
      await this.repos.users.deleteAll();
      return { status: 200, body: { message: "Database reset" } };
    }
    if (m === "POST" && path === "/api/v1/test/promote-admin") {
      const username = body?.username as string;
      if (!username) return { status: 400, body: { error: "Username is required" } };
      const user = await this.repos.users.findByUsername(username);
      if (!user) return { status: 404, body: { error: "User not found" } };
      // Directly update role in the in-memory repo by updating status then finding
      // We need a way to set role. For in-memory, we do it via a special method.
      await this.repos.users.updateStatus(user.id, "ACTIVE");
      // Promote by casting. In-memory repo stores mutable objects
      const u = await this.repos.users.findById(user.id);
      if (u) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (u as any).role = "ADMIN";
      }
      return { status: 200, body: { message: `User ${username} promoted to ADMIN` } };
    }

    // Auth
    if (m === "POST" && path === "/api/v1/auth/register") {
      const result = await authService.register(
        this.repos,
        body as { username: string; email: string; password: string },
      );
      return toResponse(result, 201);
    }
    if (m === "POST" && path === "/api/v1/auth/login") {
      const result = await authService.login(this.repos, body as { username: string; password: string });
      return toResponse(result);
    }
    if (m === "POST" && path === "/api/v1/auth/logout") {
      const result = await authService.logout(this.repos, authHeader);
      return toResponse(result);
    }
    if (m === "POST" && path === "/api/v1/auth/logout-all") {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const result = await authService.logoutAll(this.repos, claims.sub, claims.jti);
      return toResponse(result);
    }
    if (m === "POST" && path === "/api/v1/auth/refresh") {
      const refreshToken = body?.refreshToken as string;
      const result = await authService.refresh(this.repos, refreshToken);
      return toResponse(result);
    }

    // Token claims
    if (m === "GET" && path === "/api/v1/tokens/claims") {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      return { status: 200, body: claims };
    }

    // Users/me
    if (m === "GET" && path === "/api/v1/users/me") {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const result = await userService.getProfile(this.repos, claims.sub);
      return toResponse(result);
    }
    if (m === "PATCH" && path === "/api/v1/users/me") {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const result = await userService.updateDisplayName(
        this.repos,
        claims.sub,
        (body as { displayName: string }).displayName,
      );
      return toResponse(result);
    }
    if (m === "POST" && path === "/api/v1/users/me/password") {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const result = await userService.changePassword(
        this.repos,
        claims.sub,
        body as { currentPassword: string; newPassword: string },
      );
      return toResponse(result);
    }
    if (m === "POST" && path === "/api/v1/users/me/deactivate") {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const result = await userService.deactivateAccount(this.repos, claims.sub);
      return toResponse(result);
    }

    // Admin
    if (m === "GET" && path.startsWith("/api/v1/admin/users")) {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      if (claims.role !== "ADMIN") return { status: 403, body: { error: "Admin access required" } };
      const url = new URL(path, "http://localhost");
      const search = url.searchParams.get("search") ?? undefined;
      const page = parseInt(url.searchParams.get("page") ?? "1", 10);
      const size = parseInt(url.searchParams.get("size") ?? "20", 10);
      const result = await userService.listUsers(this.repos, page, size, search);
      return toResponse(result);
    }

    // Admin user actions
    const adminUserMatch = path.match(/^\/api\/v1\/admin\/users\/([^/]+)\/(.+)$/);
    if (m === "POST" && adminUserMatch) {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      if (claims.role !== "ADMIN") return { status: 403, body: { error: "Admin access required" } };
      const [, targetId, action] = adminUserMatch;
      switch (action) {
        case "disable": {
          const result = await userService.disableUser(this.repos, targetId!);
          return toResponse(result);
        }
        case "enable": {
          const result = await userService.enableUser(this.repos, targetId!);
          return toResponse(result);
        }
        case "unlock": {
          const result = await userService.unlockUser(this.repos, targetId!);
          return toResponse(result);
        }
        case "force-password-reset": {
          const result = await userService.forcePasswordReset(this.repos, targetId!);
          return toResponse(result);
        }
      }
    }

    // Expenses
    if (m === "POST" && path === "/api/v1/expenses") {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const result = await expenseService.createExpense(
        this.repos,
        claims.sub,
        body as Parameters<typeof expenseService.createExpense>[2],
      );
      return toResponse(result, 201);
    }
    if (m === "GET" && path === "/api/v1/expenses") {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const result = await expenseService.listExpenses(this.repos, claims.sub, 1, 20);
      return toResponse(result);
    }
    if (m === "GET" && path === "/api/v1/expenses/summary") {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const result = await expenseService.getExpenseSummary(this.repos, claims.sub);
      return toResponse(result);
    }

    // Single expense
    const expenseMatch = path.match(/^\/api\/v1\/expenses\/([^/]+)$/);
    if (expenseMatch) {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const expenseId = expenseMatch[1]!;
      if (m === "GET") {
        const result = await expenseService.getExpense(this.repos, expenseId, claims.sub);
        return toResponse(result);
      }
      if (m === "PUT") {
        const result = await expenseService.updateExpense(
          this.repos,
          expenseId,
          claims.sub,
          body as Parameters<typeof expenseService.updateExpense>[3],
        );
        return toResponse(result);
      }
      if (m === "DELETE") {
        const result = await expenseService.deleteExpense(this.repos, expenseId, claims.sub);
        return result.ok ? { status: 204, body: null } : toResponse(result);
      }
    }

    // Attachments
    const attachListMatch = path.match(/^\/api\/v1\/expenses\/([^/]+)\/attachments$/);
    if (attachListMatch) {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const expenseId = attachListMatch[1]!;
      if (m === "GET") {
        const result = await attachmentService.listAttachments(this.repos, expenseId, claims.sub);
        if (!result.ok) return toResponse(result);
        return { status: 200, body: { attachments: result.data } };
      }
      if (m === "POST" && file) {
        const result = await attachmentService.uploadAttachment(this.repos, expenseId, claims.sub, file);
        if (!result.ok) return toResponse(result);
        return {
          status: 201,
          body: {
            ...result.data,
            url: `/api/v1/expenses/${expenseId}/attachments/${result.data.id}`,
          },
        };
      }
    }

    const attachSingleMatch = path.match(/^\/api\/v1\/expenses\/([^/]+)\/attachments\/([^/]+)$/);
    if (attachSingleMatch) {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const expenseId = attachSingleMatch[1]!;
      const attachmentId = attachSingleMatch[2]!;
      if (m === "GET") {
        const result = await attachmentService.getAttachment(this.repos, expenseId, attachmentId, claims.sub);
        return toResponse(result);
      }
      if (m === "DELETE") {
        const result = await attachmentService.deleteAttachment(this.repos, expenseId, attachmentId, claims.sub);
        return result.ok ? { status: 204, body: null } : toResponse(result);
      }
    }

    // Reports
    if (m === "GET" && path.startsWith("/api/v1/reports/pl")) {
      const claims = await extractClaims(this.repos, authHeader);
      if (!claims) return { status: 401, body: { error: "Unauthorized" } };
      const url = new URL(path, "http://localhost");
      const from = url.searchParams.get("from") ?? undefined;
      const to = url.searchParams.get("to") ?? undefined;
      const currency = url.searchParams.get("currency") ?? undefined;
      const result = await reportService.generatePLReport(this.repos, claims.sub, from, to, currency);
      return toResponse(result);
    }

    return { status: 404, body: { error: "Not found" } };
  }
}
