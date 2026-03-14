import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setResponse } from "../../utils/response-store";
import {
  getTokenForUser,
  getRefreshTokenForUser,
  setRefreshTokenForUser,
  setTokenForUser,
} from "../../utils/token-store";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// Token lifecycle steps
// ---------------------------------------------------------------------------

When(/^alice sends POST \/api\/v1\/auth\/refresh with her refresh token$/, async ({ request }) => {
  const token = getRefreshTokenForUser("alice");
  setResponse(
    await request.post("/api/v1/auth/refresh", {
      data: { refreshToken: token },
      headers: { "Content-Type": "application/json" },
    }),
  );
});

Given("alice's refresh token has expired", async () => {
  // The refresh token stored is valid; we simulate expiry by overwriting with
  // an obviously invalid/expired token value so the next refresh call returns 401.
  setRefreshTokenForUser("alice", "expired.refresh.token");
});

Given("alice has used her refresh token to get a new token pair", async ({ request }) => {
  const originalRefresh = getRefreshTokenForUser("alice");
  // Perform a refresh to rotate the token pair
  const res = await request.post("/api/v1/auth/refresh", {
    data: { refreshToken: originalRefresh },
    headers: { "Content-Type": "application/json" },
  });
  const body = (await res.json()) as Record<string, unknown>;
  // Store new tokens but keep the original refresh token accessible via a
  // secondary key so the scenario can still send it
  setTokenForUser("alice_new", body["accessToken"] as string);
  setRefreshTokenForUser("alice_new", body["refreshToken"] as string);
  // alice's refresh token remains as the original (for the "send original" step)
});

When(/^alice sends POST \/api\/v1\/auth\/refresh with her original refresh token$/, async ({ request }) => {
  const token = getRefreshTokenForUser("alice");
  setResponse(
    await request.post("/api/v1/auth/refresh", {
      data: { refreshToken: token },
      headers: { "Content-Type": "application/json" },
    }),
  );
});

Given("the user {string} has been deactivated", async ({ request }, username: string) => {
  // Need an admin to disable this user, or we self-deactivate
  // Since we just need the user deactivated and we have their token:
  const token = getTokenForUser(username);
  await request.post("/api/v1/users/me/deactivate", {
    headers: { Authorization: `Bearer ${token}` },
  });
});

When(/^alice sends POST \/api\/v1\/auth\/logout-all with her access token$/, async ({ request }) => {
  const token = getTokenForUser("alice");
  setResponse(
    await request.post("/api/v1/auth/logout-all", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
});

Given("alice has already logged out once", async ({ request }) => {
  const token = getTokenForUser("alice");
  await request.post("/api/v1/auth/logout", {
    headers: { Authorization: `Bearer ${token}` },
  });
});

Then("alice's access token should be invalidated", async ({ request }) => {
  const token = getTokenForUser("alice");
  const res = await request.get("/api/v1/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(401);
});
