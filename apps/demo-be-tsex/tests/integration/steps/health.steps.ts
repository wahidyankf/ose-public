import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import type { CustomWorld } from "../world.js";

When("an operations engineer sends GET \\/health", async function (this: CustomWorld) {
  this.response = await this.get("/health");
});

When("an unauthenticated engineer sends GET \\/health", async function (this: CustomWorld) {
  this.response = await this.get("/health");
});

Then("the health status should be {string}", function (this: CustomWorld, status: string) {
  expect(this.response).not.toBeNull();
  expect(this.response?.body?.status).toBe(status);
});

Then("the response should not include detailed component health information", function (this: CustomWorld) {
  expect(this.response).not.toBeNull();
  const body = this.response?.body;
  // Only status field should be present, no component details
  expect(body).not.toHaveProperty("components");
  expect(body).not.toHaveProperty("details");
  expect(body).not.toHaveProperty("db");
});
