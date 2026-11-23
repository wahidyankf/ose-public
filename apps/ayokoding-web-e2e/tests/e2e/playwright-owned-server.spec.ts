// Covering proof for the Playwright-owned acceptance server. The browser suite
// starts its own Go server on port 3191, never reuses a listener, and names no
// development port, so the developer's servers on 3101 and 3102 keep running
// after the suite finishes. The proof reads the configuration the suite runs
// with; it starts no server and no browser.
import { expect, test } from "@playwright/test";
import config from "../../playwright.config";

type OwnedServer = {
  command: string;
  url: string;
  reuseExistingServer: boolean;
  env?: Record<string, string>;
};

const owned = config.webServer as OwnedServer;

test("Playwright starts its own Go server on port 3191 and never reuses a listener", () => {
  expect(owned.url).toBe("http://localhost:3191/en");
  expect(owned.reuseExistingServer).toBe(false);
  expect(owned.env?.AYOKODING_WEB_PORT).toBe("3191");
});

test("the owned server and the base URL name no development port", () => {
  const settings = JSON.stringify({
    command: owned.command,
    env: owned.env,
    url: owned.url,
    baseURL: config.use?.baseURL,
  });
  expect(settings).not.toMatch(/3101|3102/);
});
