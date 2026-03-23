import type {
  UserRepository,
  SessionRepository,
  ExpenseRepository,
  AttachmentRepository,
  Repositories,
} from "@/repositories/interfaces";
import type { User, Expense, Attachment, RefreshToken, PagedResult, UserStatus } from "@/lib/types";

function uuid(): string {
  return crypto.randomUUID();
}

export function createInMemoryUserRepository(): UserRepository {
  let users: User[] = [];

  return {
    async create(data) {
      const user: User = {
        id: uuid(),
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        role: "USER",
        status: "ACTIVE",
        failedLoginAttempts: 0,
        passwordResetToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.push(user);
      return user;
    },
    async findByUsername(username) {
      return users.find((u) => u.username === username) ?? null;
    },
    async findByEmail(email) {
      return users.find((u) => u.email === email) ?? null;
    },
    async findById(id) {
      return users.find((u) => u.id === id) ?? null;
    },
    async updateStatus(id, status: UserStatus) {
      users = users.map((u) => (u.id === id ? { ...u, status, updatedAt: new Date() } : u));
    },
    async updateDisplayName(id, displayName) {
      users = users.map((u) => (u.id === id ? { ...u, displayName, updatedAt: new Date() } : u));
    },
    async updatePassword(id, passwordHash) {
      users = users.map((u) => (u.id === id ? { ...u, passwordHash, updatedAt: new Date() } : u));
    },
    async updatePasswordResetToken(id, token) {
      users = users.map((u) => (u.id === id ? { ...u, passwordResetToken: token, updatedAt: new Date() } : u));
    },
    async incrementFailedAttempts(id) {
      users = users.map((u) =>
        u.id === id ? { ...u, failedLoginAttempts: u.failedLoginAttempts + 1, updatedAt: new Date() } : u,
      );
    },
    async resetFailedAttempts(id) {
      users = users.map((u) => (u.id === id ? { ...u, failedLoginAttempts: 0, updatedAt: new Date() } : u));
    },
    async listUsers(page, size, search?) {
      let filtered = users;
      if (search) {
        filtered = filtered.filter((u) => u.email.includes(search) || u.username.includes(search));
      }
      const total = filtered.length;
      const offset = (page - 1) * size;
      const items = filtered.slice(offset, offset + size);
      return { items, total, page, size } as PagedResult<User>;
    },
    async deleteAll() {
      users = [];
    },
  };
}

export function createInMemorySessionRepository(): SessionRepository {
  let refreshTokens: RefreshToken[] = [];
  let revokedAccessTokens: Set<string> = new Set();

  return {
    async createRefreshToken(data) {
      const token: RefreshToken = {
        id: uuid(),
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        revoked: false,
        createdAt: new Date(),
      };
      refreshTokens.push(token);
      return token;
    },
    async findRefreshTokenByHash(hash) {
      return refreshTokens.find((t) => t.tokenHash === hash && !t.revoked) ?? null;
    },
    async revokeRefreshToken(id) {
      refreshTokens = refreshTokens.map((t) => (t.id === id ? { ...t, revoked: true } : t));
    },
    async revokeAllUserTokens(userId) {
      refreshTokens = refreshTokens.map((t) => (t.userId === userId ? { ...t, revoked: true } : t));
    },
    async revokeAccessToken(jti, _userId) {
      revokedAccessTokens.add(jti);
    },
    async isAccessTokenRevoked(jti) {
      return revokedAccessTokens.has(jti);
    },
    async deleteAll() {
      refreshTokens = [];
      revokedAccessTokens = new Set();
    },
  };
}

export function createInMemoryExpenseRepository(): ExpenseRepository {
  let expenses: Expense[] = [];

  return {
    async create(data) {
      const expense: Expense = {
        id: uuid(),
        userId: data.userId,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        description: data.description,
        date: data.date,
        type: data.type,
        quantity: data.quantity ?? null,
        unit: data.unit ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expenses.push(expense);
      return expense;
    },
    async findById(id) {
      return expenses.find((e) => e.id === id) ?? null;
    },
    async findByIdAndUserId(id, userId) {
      return expenses.find((e) => e.id === id && e.userId === userId) ?? null;
    },
    async update(id, data) {
      let updated: Expense | null = null;
      expenses = expenses.map((e) => {
        if (e.id === id) {
          updated = {
            ...e,
            ...data,
            quantity: data.quantity ?? null,
            unit: data.unit ?? null,
            updatedAt: new Date(),
          };
          return updated;
        }
        return e;
      });
      return updated!;
    },
    async delete(id) {
      expenses = expenses.filter((e) => e.id !== id);
    },
    async listByUserId(userId, page, size) {
      const filtered = expenses.filter((e) => e.userId === userId);
      const total = filtered.length;
      const offset = (page - 1) * size;
      const items = filtered.slice(offset, offset + size);
      return { items, total, page, size } as PagedResult<Expense>;
    },
    async summaryByUserId(userId) {
      const filtered = expenses.filter((e) => e.userId === userId);
      const byCurrency = new Map<string, { totalIncome: number; totalExpense: number }>();
      for (const e of filtered) {
        const curr = byCurrency.get(e.currency) ?? { totalIncome: 0, totalExpense: 0 };
        const amount = parseFloat(e.amount);
        if (e.type === "INCOME") curr.totalIncome += amount;
        else curr.totalExpense += amount;
        byCurrency.set(e.currency, curr);
      }
      return [...byCurrency.entries()].map(([currency, { totalIncome, totalExpense }]) => ({
        currency,
        totalIncome: String(totalIncome),
        totalExpense: String(totalExpense),
      }));
    },
    async findByUserIdFiltered(userId, from, to, currency) {
      return expenses.filter((e) => {
        if (e.userId !== userId) return false;
        if (from && e.date < from) return false;
        if (to && e.date > to) return false;
        if (currency && e.currency !== currency.toUpperCase()) return false;
        return true;
      });
    },
    async deleteAll() {
      expenses = [];
    },
  };
}

export function createInMemoryAttachmentRepository(): AttachmentRepository {
  let attachments: Attachment[] = [];

  return {
    async create(data) {
      const attachment: Attachment = {
        id: uuid(),
        expenseId: data.expenseId,
        filename: data.filename,
        contentType: data.contentType,
        size: data.size,
        data: data.data,
        createdAt: new Date(),
      };
      attachments.push(attachment);
      return attachment;
    },
    async findById(id) {
      return attachments.find((a) => a.id === id) ?? null;
    },
    async findByIdAndExpenseId(id, expenseId) {
      return attachments.find((a) => a.id === id && a.expenseId === expenseId) ?? null;
    },
    async listByExpenseId(expenseId) {
      return attachments.filter((a) => a.expenseId === expenseId);
    },
    async delete(id) {
      attachments = attachments.filter((a) => a.id !== id);
    },
    async deleteAll() {
      attachments = [];
    },
  };
}

export function createInMemoryRepositories(): Repositories {
  return {
    users: createInMemoryUserRepository(),
    sessions: createInMemorySessionRepository(),
    expenses: createInMemoryExpenseRepository(),
    attachments: createInMemoryAttachmentRepository(),
  };
}
