// Network-privacy helpers for the Playwright E2E adapter. The recorder taps
// the page's own request pipeline so every document, fragment, and asset
// request in the scenario is visible to the privacy assertions.
import { expect, type Page } from "@playwright/test";
import { PROGRESS_KEY } from "./storage";
import { stateFor } from "./state";

// installRecorder taps every request the page context sends from here on.
// Call it in the scenario's first Given step; pages are fresh per test.
export async function installRecorder(page: Page): Promise<void> {
  const state = stateFor(page);
  await page.route("**/*", (route) => {
    state.exchanges.push({ method: route.request().method(), url: route.request().url() });
    void route.continue();
  });
}

// assertNoProgressLeak fails when any recorded exchange carries the
// browser-only progress record or its storage key.
export function assertNoProgressLeak(page: Page): void {
  for (const exchange of stateFor(page).exchanges) {
    expect(exchange.url, `${exchange.method} ${exchange.url} must not carry progress`).not.toContain(PROGRESS_KEY);
    expect(exchange.url, `${exchange.method} ${exchange.url} must not carry progress`).not.toContain("completed=");
  }
}
