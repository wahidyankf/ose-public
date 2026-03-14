import { createBdd } from "playwright-bdd";
import { setAdminRole } from "../../fixtures/db-cleanup";
import { getTokenForUser, setTokenForUser, getIdForUser, setIdForUser } from "../../utils/token-store";

const { Given } = createBdd();

async function ensureSuperadmin(request: import("@playwright/test").APIRequestContext): Promise<string> {
  try {
    return getTokenForUser("superadmin");
  } catch {
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

// ---------------------------------------------------------------------------
// Security steps: account lockout scenarios
// ---------------------------------------------------------------------------

Given("{string} has had the maximum number of failed login attempts", async ({ request }, username: string) => {
  // Trigger account lockout by sending multiple bad-password requests.
  // The backend typically locks after 5 failed attempts.
  for (let i = 0; i < 6; i++) {
    await request.post("/api/v1/auth/login", {
      data: { username, password: "WrongPassword1!" },
      headers: { "Content-Type": "application/json" },
    });
  }
});

Given(
  "a user {string} is registered and locked after too many failed logins",
  async ({ request }, username: string) => {
    // Register the user first
    const regRes = await request.post("/api/v1/auth/register", {
      data: { username, email: `${username}@example.com`, password: "Str0ng#Pass1" },
      headers: { "Content-Type": "application/json" },
    });
    const regBody = (await regRes.json()) as Record<string, unknown>;
    if (regBody["id"]) {
      setIdForUser(username, regBody["id"] as string);
    }
    // Trigger lockout with repeated bad-password attempts
    for (let i = 0; i < 6; i++) {
      await request.post("/api/v1/auth/login", {
        data: { username, password: "WrongPassword1!" },
        headers: { "Content-Type": "application/json" },
      });
    }
  },
);

Given("an admin has unlocked alice's account", async ({ request }) => {
  const adminToken = await ensureSuperadmin(request);
  const aliceId = getIdForUser("alice");
  await request.post(`/api/v1/admin/users/${aliceId}/unlock`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
});
