import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setResponse, getResponse } from "../../utils/response-store";

const { When, Then } = createBdd();

When(/^a client sends GET \/api\/v1\/hello$/, async ({ request }) => {
  setResponse(await request.get("/api/v1/hello"));
});

When(/^a client sends GET \/api\/v1\/hello with an Origin header of (.+)$/, async ({ request }, origin: string) => {
  setResponse(
    await request.get("/api/v1/hello", {
      headers: { Origin: origin },
    }),
  );
});

Then(/^the response body should be \{"message":"world!"\}$/, async () => {
  const body = await getResponse().json();
  expect(body.message).toBe("world!");
});

Then(/^the response Content-Type should be application\/json$/, async () => {
  expect(getResponse().headers()["content-type"]).toContain("application/json");
});

Then("the response should include an Access-Control-Allow-Origin header permitting the request", async () => {
  const acao = getResponse().headers()["access-control-allow-origin"];
  expect(acao).toBeTruthy();
});
