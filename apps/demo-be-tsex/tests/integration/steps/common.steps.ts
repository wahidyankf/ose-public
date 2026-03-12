import { Given, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import type { CustomWorld } from "../world.js";

Given("the API is running", async function (this: CustomWorld) {
  // Server is started in BeforeAll hook
  this.baseUrl = `http://localhost:8299`;
});

Then("the response status code should be {int}", function (this: CustomWorld, statusCode: number) {
  expect(this.response).not.toBeNull();
  expect(this.response?.status).toBe(statusCode);
});
