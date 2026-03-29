import { createBdd } from "playwright-bdd";
import { setResponse } from "../utils/response-store";
import { setTokenForUser, getTokenForUser } from "../utils/token-store";

const { Given, When } = createBdd();

// ---------------------------------------------------------------------------
// Module-level state for the active user and crafted tokens
// ---------------------------------------------------------------------------

let activeUserEmail: string | null = null;
let craftedToken: string | null = null;

// ---------------------------------------------------------------------------
// Given steps — authentication setup
// ---------------------------------------------------------------------------

Given("a user {string} is authenticated with a valid access token", async ({ request }, email: string) => {
  const name = email.split("@")[0] ?? "User";
  const googleId = `google-${name}`;
  // APP_ENV=test accepts tokens in the format "test:<email>:<name>:<googleId>"
  const idToken = `test:${email}:${name}:${googleId}`;
  const res = await request.post("/api/v1/auth/google", {
    data: { idToken },
    headers: { "Content-Type": "application/json" },
  });
  const body = (await res.json()) as Record<string, unknown>;
  setTokenForUser(email, body["accessToken"] as string);
  activeUserEmail = email;
  craftedToken = null;
});

Given(
  "a user {string} has an expired access token",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, email: string) => {
    // Store an obviously invalid token to simulate expiry
    setTokenForUser(email, "expired.access.token.value");
    activeUserEmail = email;
    craftedToken = null;
  },
);

Given("the database has been reset", async ({ request }) => {
  // Use the test reset endpoint to wipe user records (requires APP_ENV=test)
  await request.post("/api/v1/test/delete-users", {
    headers: { "Content-Type": "application/json" },
  });
});

Given("a crafted access token with no subject claim", async () => {
  craftedToken = "crafted.no-sub.token";
  activeUserEmail = null;
});

Given(
  "a crafted access token with a non-GUID subject claim {string}",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, _subjectClaim: string) => {
    craftedToken = "crafted.non-guid-sub.token";
    activeUserEmail = null;
  },
);

// ---------------------------------------------------------------------------
// When steps — HTTP actions
// ---------------------------------------------------------------------------

When(/^the client sends GET \/api\/v1\/auth\/me with the access token$/, async ({ request }) => {
  const token = resolveToken();
  setResponse(
    await request.get("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
});

When(/^the client sends GET \/api\/v1\/auth\/me without an access token$/, async ({ request }) => {
  setResponse(await request.get("/api/v1/auth/me"));
});

When(/^the client sends GET \/api\/v1\/auth\/me with the expired access token$/, async ({ request }) => {
  const token = resolveToken();
  setResponse(
    await request.get("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveToken(): string {
  if (craftedToken) return craftedToken;
  if (activeUserEmail) return getTokenForUser(activeUserEmail);
  throw new Error("No token available. A Given authentication step must run first.");
}
