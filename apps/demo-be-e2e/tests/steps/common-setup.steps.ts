import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setAdminRole } from "../fixtures/db-cleanup";
import { setResponse, getResponse } from "../utils/response-store";
import {
  setTokenForUser,
  setRefreshTokenForUser,
  setIdForUser,
  getTokenForUser,
  getIdForUser,
  setLastExpenseId,
  getLastExpenseId,
} from "../utils/token-store";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// User registration helpers
// ---------------------------------------------------------------------------

Given(
  "a user {string} is registered with password {string}",
  async ({ request }, username: string, password: string) => {
    const res = await request.post("/api/v1/auth/register", {
      data: { username, email: `${username}@example.com`, password },
      headers: { "Content-Type": "application/json" },
    });
    const body = (await res.json()) as Record<string, unknown>;
    if (body["id"]) {
      setIdForUser(username, body["id"] as string);
    }
  },
);

Given(
  "a user {string} is registered with email {string} and password {string}",
  async ({ request }, username: string, email: string, password: string) => {
    const res = await request.post("/api/v1/auth/register", {
      data: { username, email, password },
      headers: { "Content-Type": "application/json" },
    });
    const body = (await res.json()) as Record<string, unknown>;
    if (body["id"]) {
      setIdForUser(username, body["id"] as string);
    }
    // Also log in so the token is available for subsequent steps
    const loginRes = await request.post("/api/v1/auth/login", {
      data: { username, password },
      headers: { "Content-Type": "application/json" },
    });
    const loginBody = (await loginRes.json()) as Record<string, unknown>;
    if (loginBody["accessToken"]) {
      setTokenForUser(username, loginBody["accessToken"] as string);
    }
  },
);

Given("a user {string} is registered and deactivated", async ({ request }, username: string) => {
  // Register the user
  await request.post("/api/v1/auth/register", {
    data: { username, email: `${username}@example.com`, password: "Str0ng#Pass1" },
    headers: { "Content-Type": "application/json" },
  });
  // Login to get access token
  const loginRes = await request.post("/api/v1/auth/login", {
    data: { username, password: "Str0ng#Pass1" },
    headers: { "Content-Type": "application/json" },
  });
  const loginBody = (await loginRes.json()) as Record<string, unknown>;
  const token = loginBody["accessToken"] as string;
  // Deactivate the account
  await request.post("/api/v1/users/me/deactivate", {
    headers: { Authorization: `Bearer ${token}` },
  });
});

// ---------------------------------------------------------------------------
// Login helpers
// ---------------------------------------------------------------------------

Given("{string} has logged in and stored the access token", async ({ request }, username: string) => {
  const res = await request.post("/api/v1/auth/login", {
    data: { username, password: "Str0ng#Pass1" },
    headers: { "Content-Type": "application/json" },
  });
  const body = (await res.json()) as Record<string, unknown>;
  setTokenForUser(username, body["accessToken"] as string);
});

Given("{string} has logged in and stored the access token and refresh token", async ({ request }, username: string) => {
  const res = await request.post("/api/v1/auth/login", {
    data: { username, password: "Str0ng#Pass1" },
    headers: { "Content-Type": "application/json" },
  });
  const body = (await res.json()) as Record<string, unknown>;
  setTokenForUser(username, body["accessToken"] as string);
  setRefreshTokenForUser(username, body["refreshToken"] as string);
});

// ---------------------------------------------------------------------------
// Admin setup helper
// ---------------------------------------------------------------------------

Given("an admin user {string} is registered and logged in", async ({ request }, username: string) => {
  // Register the admin user
  const regRes = await request.post("/api/v1/auth/register", {
    data: { username, email: `${username}@example.com`, password: "Str0ng#Pass1" },
    headers: { "Content-Type": "application/json" },
  });
  const regBody = (await regRes.json()) as Record<string, unknown>;
  if (regBody["id"]) {
    setIdForUser(username, regBody["id"] as string);
  }
  // Promote to admin via direct DB update
  await setAdminRole(username);
  // Login to get admin token
  const loginRes = await request.post("/api/v1/auth/login", {
    data: { username, password: "Str0ng#Pass1" },
    headers: { "Content-Type": "application/json" },
  });
  const loginBody = (await loginRes.json()) as Record<string, unknown>;
  setTokenForUser(username, loginBody["accessToken"] as string);
});

// ---------------------------------------------------------------------------
// Account status check (shared across security + admin features)
// ---------------------------------------------------------------------------

async function ensureSuperadmin(request: import("@playwright/test").APIRequestContext): Promise<string> {
  // Return existing superadmin token if already set up
  try {
    return getTokenForUser("superadmin");
  } catch {
    // Register superadmin, promote via DB, and log in
    const regRes = await request.post("/api/v1/auth/register", {
      data: { username: "superadmin", email: "superadmin@example.com", password: "Str0ng#Pass1" },
      headers: { "Content-Type": "application/json" },
    });
    const regBody = (await regRes.json()) as Record<string, unknown>;
    if (regBody["id"]) {
      setIdForUser("superadmin", regBody["id"] as string);
    }
    await setAdminRole("superadmin");
    const loginRes = await request.post("/api/v1/auth/login", {
      data: { username: "superadmin", password: "Str0ng#Pass1" },
      headers: { "Content-Type": "application/json" },
    });
    const loginBody = (await loginRes.json()) as Record<string, unknown>;
    const token = loginBody["accessToken"] as string;
    setTokenForUser("superadmin", token);
    return token;
  }
}

Then("alice's account status should be {string}", async ({ request }, status: string) => {
  const adminToken = await ensureSuperadmin(request);
  const aliceId = getIdForUser("alice");
  // Try page=1 first (1-based backends), fall back to page=0 (0-based backends like Spring)
  for (const page of [1, 0]) {
    const res = await request.get(`/api/v1/admin/users?page=${page}&size=100`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = (await res.json()) as { data: Array<Record<string, unknown>> };
    const aliceRecord = body.data?.find((u) => u["id"] === aliceId);
    if (aliceRecord) {
      expect(aliceRecord["status"]).toBe(status.toUpperCase());
      return;
    }
  }
  throw new Error(`alice (id=${aliceId}) not found in admin users list on any page`);
});

// ---------------------------------------------------------------------------
// Shared POST /auth/login When step (used in password-login, user-account, security)
// ---------------------------------------------------------------------------

When(/^the client sends POST \/api\/v1\/auth\/login with body (.+)$/, async ({ request }, bodyStr: string) => {
  setResponse(
    await request.post("/api/v1/auth/login", {
      data: JSON.parse(bodyStr) as Record<string, unknown>,
      headers: { "Content-Type": "application/json" },
    }),
  );
});

// ---------------------------------------------------------------------------
// Shared POST /auth/register When step (used in registration, security)
// ---------------------------------------------------------------------------

When(/^the client sends POST \/api\/v1\/auth\/register with body (.+)$/, async ({ request }, bodyStr: string) => {
  setResponse(
    await request.post("/api/v1/auth/register", {
      data: JSON.parse(bodyStr) as Record<string, unknown>,
      headers: { "Content-Type": "application/json" },
    }),
  );
});

// ---------------------------------------------------------------------------
// Shared GET /users/me with alice's token (used in tokens + admin)
// ---------------------------------------------------------------------------

When(/^the client sends GET \/api\/v1\/users\/me with alice's access token$/, async ({ request }) => {
  const token = getTokenForUser("alice");
  setResponse(
    await request.get("/api/v1/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
});

// ---------------------------------------------------------------------------
// Shared POST /auth/logout with alice's token (used in token-lifecycle + tokens)
// ---------------------------------------------------------------------------

When(/^alice sends POST \/api\/v1\/auth\/logout with her access token$/, async ({ request }) => {
  const token = getTokenForUser("alice");
  setResponse(
    await request.post("/api/v1/auth/logout", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
});

// ---------------------------------------------------------------------------
// Shared expense creation Given steps (used in expenses, currency, units, reporting, attachments)
// ---------------------------------------------------------------------------

Given(/^alice has created an entry with body (.+)$/, async ({ request }, bodyStr: string) => {
  const token = getTokenForUser("alice");
  const res = await request.post("/api/v1/expenses", {
    data: JSON.parse(bodyStr) as Record<string, unknown>,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = (await res.json()) as Record<string, unknown>;
  setLastExpenseId(body["id"] as string);
});

Given(/^alice has created an expense with body (.+)$/, async ({ request }, bodyStr: string) => {
  const token = getTokenForUser("alice");
  const res = await request.post("/api/v1/expenses", {
    data: JSON.parse(bodyStr) as Record<string, unknown>,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = (await res.json()) as Record<string, unknown>;
  setLastExpenseId(body["id"] as string);
});

Given(/^bob has created an entry with body (.+)$/, async ({ request }, bodyStr: string) => {
  const token = getTokenForUser("bob");
  const res = await request.post("/api/v1/expenses", {
    data: JSON.parse(bodyStr) as Record<string, unknown>,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = (await res.json()) as Record<string, unknown>;
  // Store bob's last expense ID under a special key
  setIdForUser("bob_last_expense", body["id"] as string);
});

// ---------------------------------------------------------------------------
// Shared POST /expenses with alice's token (used in expenses, currency, units)
// ---------------------------------------------------------------------------

When(/^alice sends POST \/api\/v1\/expenses with body (.+)$/, async ({ request }, bodyStr: string) => {
  const token = getTokenForUser("alice");
  const res = await request.post("/api/v1/expenses", {
    data: JSON.parse(bodyStr) as Record<string, unknown>,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  setResponse(res);
  const resBody = (await res.json()) as Record<string, unknown>;
  if (resBody["id"]) {
    setLastExpenseId(resBody["id"] as string);
  }
});

// ---------------------------------------------------------------------------
// Shared GET /expenses/{expenseId} (used in expenses, currency, units)
// ---------------------------------------------------------------------------

When(/^alice sends GET \/api\/v1\/expenses\/\{expenseId\}$/, async ({ request }) => {
  const token = getTokenForUser("alice");
  const id = getLastExpenseId();
  setResponse(
    await request.get(`/api/v1/expenses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
});

// ---------------------------------------------------------------------------
// Error message assertions (shared across multiple features)
// ---------------------------------------------------------------------------

Then("the response body should contain an error message about account deactivation", async () => {
  const body = (await getResponse().json()) as { message: string };
  expect(body.message).toMatch(/deactivat|disabled/i);
});

Then("the response body should contain an error message about token expiration", async () => {
  const body = (await getResponse().json()) as { message: string };
  // Backend returns "Invalid token" for expired/revoked refresh tokens
  expect(body.message).toMatch(/expir|invalid|revoked/i);
});

Then("the response body should contain an error message about invalid token", async () => {
  const body = (await getResponse().json()) as { message: string };
  expect(body.message).toMatch(/invalid|revoked/i);
});
