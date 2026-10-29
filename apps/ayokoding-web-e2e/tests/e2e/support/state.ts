// Per-test scenario state for the Playwright E2E adapter. Playwright gives
// every test a fresh page, so keying state by the page object keeps scenarios
// isolated without fixtures or globals. All steps take `{ page }` and share
// this bag, mirroring the godog World's single per-scenario record.
import type { Page } from "@playwright/test";

export type RecordedExchange = {
  method: string;
  url: string;
};

export type OwnedServer = {
  port: number;
  close: () => Promise<void>;
};

export type ScenarioState = {
  status?: number;
  body?: string;
  headers?: Record<string, string>;
  lastUrl?: string;
  locale?: string;
  theme?: string;
  sidebarWidth?: number;
  mobileNavOpen?: boolean;
  searchOpen?: boolean;
  focus?: string;
  clipboard?: string;
  otherUrl?: string;
  pathId?: string;
  courseId?: string;
  journey?: string;
  mode?: string;
  envPort?: string;
  flagPort?: string;
  spawnedUrl?: string;
  spawnedPort?: number;
  diagnostic?: string;
  hashes?: Record<string, string>;
  exchanges: RecordedExchange[];
  owned: OwnedServer[];
};

const states = new WeakMap<Page, ScenarioState>();

// stateFor returns the scenario state for a page, creating it on first use.
export function stateFor(page: Page): ScenarioState {
  const existing = states.get(page);
  if (existing !== undefined) return existing;
  const created: ScenarioState = { exchanges: [], owned: [] };
  states.set(page, created);
  return created;
}

// trackOwned registers a scenario-owned server for After-hook cleanup.
export function trackOwned(page: Page, server: OwnedServer): void {
  stateFor(page).owned.push(server);
}
