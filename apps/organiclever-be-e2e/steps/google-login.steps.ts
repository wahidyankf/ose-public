import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setResponse, getResponse } from "../utils/response-store";
import { setTokenForUser, setRefreshTokenForUser } from "../utils/token-store";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// State for the current scenario's Google ID token and user identifiers
// ---------------------------------------------------------------------------

let currentIdToken: string | null = null;
let storedRefreshToken: string | null = null;

// ---------------------------------------------------------------------------
// Given steps — token and user setup
// ---------------------------------------------------------------------------

Given(
  "a valid Google ID token for user {string} with name {string} and avatar {string}",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, email: string, name: string, _avatar: string) => {
    // APP_ENV=test accepts tokens in the format "test:<email>:<name>:<googleId>"
    const googleId = `google-${email.replace(/[^a-z0-9]/gi, "-")}`;
    currentIdToken = `test:${email}:${name}:${googleId}`;
  },
);

Given(
  "no user exists with Google ID {string}",
  // oxlint-disable-next-line no-empty-pattern
  async ({}) => {
    // No-op: the Before hook resets state; a fresh DB has no users.
  },
);

Given(
  "a valid Google ID token for {string} with Google ID {string}",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, email: string, googleId: string) => {
    currentIdToken = `test:${email}:New User:${googleId}`;
  },
);

Given(
  "a user exists with Google ID {string} and name {string}",
  async ({ request }, googleId: string, name: string) => {
    // Create the user by performing a login with the old name first
    const email = `${googleId}@example.com`;
    const idToken = `test:${email}:${name}:${googleId}`;
    await request.post("/api/v1/auth/google", {
      data: { idToken },
      headers: { "Content-Type": "application/json" },
    });
  },
);

Given(
  "a valid Google ID token for Google ID {string} with name {string}",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, googleId: string, name: string) => {
    const email = `${googleId}@example.com`;
    currentIdToken = `test:${email}:${name}:${googleId}`;
  },
);

Given("an invalid Google ID token", async () => {
  currentIdToken = "invalid-token";
});

Given("a user {string} has a valid refresh token", async ({ request }, email: string) => {
  const name = email.split("@")[0] ?? "User";
  const googleId = `google-${name}`;
  const idToken = `test:${email}:${name}:${googleId}`;
  const res = await request.post("/api/v1/auth/google", {
    data: { idToken },
    headers: { "Content-Type": "application/json" },
  });
  const body = (await res.json()) as Record<string, unknown>;
  setTokenForUser(email, body["accessToken"] as string);
  setRefreshTokenForUser(email, body["refreshToken"] as string);
  storedRefreshToken = body["refreshToken"] as string;
});

Given(
  "a user {string} has an expired refresh token",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, _email: string) => {
    // Simulate expiry by storing an obviously invalid token value
    storedRefreshToken = "expired.refresh.token.value";
  },
);

Given("the user records have been deleted while keeping tokens", async ({ request }) => {
  // Use the test reset endpoint to wipe user records (requires APP_ENV=test)
  await request.post("/api/v1/test/delete-users", {
    headers: { "Content-Type": "application/json" },
  });
});

// ---------------------------------------------------------------------------
// When steps — HTTP actions
// ---------------------------------------------------------------------------

When(/^the client sends POST \/api\/v1\/auth\/google with the Google ID token$/, async ({ request }) => {
  setResponse(
    await request.post("/api/v1/auth/google", {
      data: { idToken: currentIdToken },
      headers: { "Content-Type": "application/json" },
    }),
  );
});

When(/^the client sends POST \/api\/v1\/auth\/google with a malformed request body$/, async ({ request }) => {
  setResponse(
    await request.post("/api/v1/auth/google", {
      data: "not-valid-json{",
      headers: { "Content-Type": "application/json" },
    }),
  );
});

When(/^the client sends POST \/api\/v1\/auth\/google with an empty idToken$/, async ({ request }) => {
  setResponse(
    await request.post("/api/v1/auth/google", {
      data: { idToken: "" },
      headers: { "Content-Type": "application/json" },
    }),
  );
});

When(/^the client sends POST \/api\/v1\/auth\/refresh with the refresh token$/, async ({ request }) => {
  setResponse(
    await request.post("/api/v1/auth/refresh", {
      data: { refreshToken: storedRefreshToken },
      headers: { "Content-Type": "application/json" },
    }),
  );
});

When(/^the client sends POST \/api\/v1\/auth\/refresh with the expired refresh token$/, async ({ request }) => {
  setResponse(
    await request.post("/api/v1/auth/refresh", {
      data: { refreshToken: storedRefreshToken },
      headers: { "Content-Type": "application/json" },
    }),
  );
});

When(/^the client sends POST \/api\/v1\/auth\/refresh with a malformed request body$/, async ({ request }) => {
  setResponse(
    await request.post("/api/v1/auth/refresh", {
      data: "not-valid-json{",
      headers: { "Content-Type": "application/json" },
    }),
  );
});

// ---------------------------------------------------------------------------
// Then steps — assertions
// ---------------------------------------------------------------------------

Then("a user record should be created with email {string}", async ({ request }, email: string) => {
  // The previous When step already logged in and stored the response.
  // Use the access token from that response to verify the user exists via /auth/me.
  const body = (await getResponse().json()) as Record<string, unknown>;
  const accessToken = body["accessToken"] as string;
  expect(accessToken).toBeDefined();
  const profileRes = await request.get("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(profileRes.status()).toBe(200);
  const profile = (await profileRes.json()) as Record<string, unknown>;
  expect(profile["email"]).toBe(email);
});

Then("the user name should be updated to {string}", async ({ request }, name: string) => {
  // Use the access token from the When step's response to verify the profile
  const body = (await getResponse().json()) as Record<string, unknown>;
  const accessToken = body["accessToken"] as string;
  expect(accessToken).toBeDefined();
  const profileRes = await request.get("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = (await profileRes.json()) as Record<string, unknown>;
  expect(profile["name"]).toBe(name);
});

Then(
  "the response body should contain a new {string}",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, field: string) => {
    const body = (await getResponse().json()) as Record<string, unknown>;
    expect(body[field]).not.toBeNull();
    expect(body[field]).toBeDefined();
  },
);

Then("the old refresh token should be invalidated", async ({ request }) => {
  // Attempting to use the old refresh token again should return 401
  const res = await request.post("/api/v1/auth/refresh", {
    data: { refreshToken: storedRefreshToken },
    headers: { "Content-Type": "application/json" },
  });
  expect(res.status()).toBe(401);
});

Then("the response body should contain an error message about invalid token", async () => {
  const body = (await getResponse().json()) as { message?: string; error?: string };
  const message = body.message ?? body.error ?? "";
  expect(message).toMatch(/invalid|unauthorized/i);
});

Then("the response body should contain an error message about bad request", async () => {
  const body = (await getResponse().json()) as { message?: string; error?: string };
  const message = body.message ?? body.error ?? "";
  expect(message.length).toBeGreaterThan(0);
});

Then("the response body should contain an error message about expired token", async () => {
  const body = (await getResponse().json()) as { message?: string; error?: string };
  const message = body.message ?? body.error ?? "";
  expect(message).toMatch(/expir|invalid|revoked/i);
});

Then("the response body should contain an error message about user not found", async () => {
  const body = (await getResponse().json()) as { message?: string; error?: string };
  const message = body.message ?? body.error ?? "";
  expect(message).toMatch(/not found|user|invalid/i);
});
