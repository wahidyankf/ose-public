import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { createTestContext, registerUser, loginUser, getAuth, type TestContext } from "./helpers/test-context";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/apps/demo/be/gherkin/user-lifecycle/user-account.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  let ctx: TestContext;

  Background(({ Given, And }) => {
    Given("the API is running", () => {
      ctx = createTestContext();
    });

    And('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', async () => {
      await registerUser(ctx, "alice", "alice@example.com", "Str0ng#Pass1");
    });

    And('"alice" has logged in and stored the access token', async () => {
      await loginUser(ctx, "alice", "Str0ng#Pass1");
    });
  });

  Scenario("Get own profile returns username, email, and display name", ({ When, Then, And }) => {
    When("alice sends GET /api/v1/users/me", async () => {
      ctx.response = await ctx.client.dispatch("GET", "/api/v1/users/me", null, getAuth(ctx, "alice"));
    });

    Then("the response status code should be 200", () => {
      expect(ctx.response!.status).toBe(200);
    });

    And('the response body should contain "username" equal to "alice"', () => {
      expect((ctx.response!.body as Record<string, unknown>).username).toBe("alice");
    });

    And('the response body should contain "email" equal to "alice@example.com"', () => {
      expect((ctx.response!.body as Record<string, unknown>).email).toBe("alice@example.com");
    });

    And('the response body should contain a non-null "displayName" field', () => {
      expect((ctx.response!.body as Record<string, unknown>).displayName).toBeDefined();
    });
  });

  Scenario("Update display name succeeds", ({ When, Then, And }) => {
    When('alice sends PATCH /api/v1/users/me with body { "displayName": "Alice Smith" }', async () => {
      ctx.response = await ctx.client.dispatch(
        "PATCH",
        "/api/v1/users/me",
        { displayName: "Alice Smith" },
        getAuth(ctx, "alice"),
      );
    });

    Then("the response status code should be 200", () => {
      expect(ctx.response!.status).toBe(200);
    });

    And('the response body should contain "displayName" equal to "Alice Smith"', () => {
      expect((ctx.response!.body as Record<string, unknown>).displayName).toBe("Alice Smith");
    });
  });

  Scenario("Successful password change returns 200", ({ When, Then }) => {
    When(
      'alice sends POST /api/v1/users/me/password with body { "oldPassword": "Str0ng#Pass1", "newPassword": "NewPass#456" }',
      async () => {
        ctx.response = await ctx.client.dispatch(
          "POST",
          "/api/v1/users/me/password",
          { currentPassword: "Str0ng#Pass1", newPassword: "N3wPass#456!" },
          getAuth(ctx, "alice"),
        );
      },
    );

    Then("the response status code should be 200", () => {
      expect(ctx.response!.status).toBe(200);
    });
  });

  Scenario("Reject password change with incorrect old password", ({ When, Then, And }) => {
    When(
      'alice sends POST /api/v1/users/me/password with body { "oldPassword": "Wr0ngOld!", "newPassword": "NewPass#456" }',
      async () => {
        ctx.response = await ctx.client.dispatch(
          "POST",
          "/api/v1/users/me/password",
          { currentPassword: "Wr0ngOld!", newPassword: "N3wPass#456!" },
          getAuth(ctx, "alice"),
        );
      },
    );

    Then("the response status code should be 401", () => {
      expect(ctx.response!.status).toBe(401);
    });

    And("the response body should contain an error message about invalid credentials", () => {
      const body = ctx.response!.body as Record<string, unknown>;
      expect(String(body.error).toLowerCase()).toContain("invalid");
    });
  });

  Scenario("Authenticated user self-deactivates their account", ({ When, Then }) => {
    When("alice sends POST /api/v1/users/me/deactivate", async () => {
      ctx.response = await ctx.client.dispatch("POST", "/api/v1/users/me/deactivate", null, getAuth(ctx, "alice"));
    });

    Then("the response status code should be 200", () => {
      expect(ctx.response!.status).toBe(200);
    });
  });

  Scenario("Self-deactivated user cannot log in with previous credentials", ({ Given, When, Then, And }) => {
    Given("alice has deactivated her own account via POST /api/v1/users/me/deactivate", async () => {
      await ctx.client.dispatch("POST", "/api/v1/users/me/deactivate", null, getAuth(ctx, "alice"));
    });

    When(
      'the client sends POST /api/v1/auth/login with body { "username": "alice", "password": "Str0ng#Pass1" }',
      async () => {
        ctx.response = await ctx.client.dispatch(
          "POST",
          "/api/v1/auth/login",
          { username: "alice", password: "Str0ng#Pass1" },
          null,
        );
      },
    );

    Then("the response status code should be 401", () => {
      expect(ctx.response!.status).toBe(401);
    });

    And("the response body should contain an error message about account deactivation", () => {
      const body = ctx.response!.body as Record<string, unknown>;
      expect(String(body.error).toLowerCase()).toContain("deactivat");
    });
  });
});
