// Per-test scenario state for the HTTP boundary adapter. Playwright gives every
// test its own request context, so keying state by that object keeps scenarios
// isolated without globals. Steps take `{ request }` and share this bag.
import type { APIRequestContext } from "@playwright/test";

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
  spawnedUrl?: string;
  learnPage?: string;
  exchanges: RecordedExchange[];
  owned: OwnedServer[];
};

const states = new WeakMap<APIRequestContext, ScenarioState>();

// stateFor returns the scenario state for a request context, creating it on first use.
export function stateFor(request: APIRequestContext): ScenarioState {
  const existing = states.get(request);
  if (existing !== undefined) return existing;
  const created: ScenarioState = { exchanges: [], owned: [] };
  states.set(request, created);
  return created;
}

// trackOwned registers a scenario-owned server for After-hook cleanup.
export function trackOwned(request: APIRequestContext, server: OwnedServer): void {
  stateFor(request).owned.push(server);
}
