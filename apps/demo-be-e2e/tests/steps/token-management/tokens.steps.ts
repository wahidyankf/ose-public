import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setResponse, getResponse } from "../../utils/response-store";
import { getTokenForUser, getIdForUser } from "../../utils/token-store";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// Token management / JWKS steps
// ---------------------------------------------------------------------------

When(/^alice decodes her access token payload$/, async () => {
  // Decode the JWT payload (base64url) without verification.
  // Store the decoded payload in response-store via a synthetic APIResponse-like
  // approach by setting a flag; we actually store it on a module-level variable.
  const token = getTokenForUser("alice");
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error("Stored token is not a valid JWT");
  }
  const payloadB64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (payloadB64.length % 4)) % 4);
  const decoded = JSON.parse(Buffer.from(payloadB64 + padding, "base64").toString("utf-8")) as Record<string, unknown>;
  // Store decoded payload for subsequent Then steps
  decodedTokenPayload = decoded;
});

// Module-level storage for decoded JWT payload (single worker, sequential tests)
let decodedTokenPayload: Record<string, unknown> = {};

Then(
  "the token should contain a non-null {string} claim",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, claim: string) => {
    expect(decodedTokenPayload[claim]).toBeDefined();
    expect(decodedTokenPayload[claim]).not.toBeNull();
  },
);

When(/^the client sends GET \/\.well-known\/jwks\.json$/, async ({ request }) => {
  setResponse(await request.get("/.well-known/jwks.json"));
});

Then(
  "the response body should contain at least one key in the {string} array",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, field: string) => {
    const body = (await getResponse().json()) as Record<string, unknown>;
    const arr = body[field] as unknown[];
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBeGreaterThan(0);
  },
);

Then("alice's access token should be recorded as revoked", async ({ request }) => {
  // Attempt to use the token on a protected endpoint; expect 401
  const token = getTokenForUser("alice");
  const res = await request.get("/api/v1/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(401);
});

Given("alice has logged out and her access token is blacklisted", async ({ request }) => {
  const token = getTokenForUser("alice");
  await request.post("/api/v1/auth/logout", {
    headers: { Authorization: `Bearer ${token}` },
  });
});

Given(
  /^the admin has disabled alice's account via POST \/api\/v1\/admin\/users\/\{alice_id\}\/disable$/,
  async ({ request }) => {
    const adminToken = getTokenForUser("superadmin");
    const aliceId = getIdForUser("alice");
    setResponse(
      await request.post(`/api/v1/admin/users/${aliceId}/disable`, {
        data: { reason: "Token test" },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      }),
    );
  },
);
