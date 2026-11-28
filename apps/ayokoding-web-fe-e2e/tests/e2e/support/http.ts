// HTTP helpers for the Playwright E2E adapter. Every call goes through the
// page's own request context so cookies and origin match what the browser
// sends, and every exchange is recorded for the network-privacy assertions.
import { expect, type Page } from "@playwright/test";
import { stateFor } from "./state";

export type FetchOptions = {
  method?: string;
  maxRedirects?: number;
  headers?: Record<string, string>;
};

// fetchText performs one recorded request and stores the response on the
// scenario state for the Then steps to assert.
export async function fetchText(page: Page, url: string, options: FetchOptions = {}): Promise<void> {
  const state = stateFor(page);
  const method = options.method ?? "GET";
  state.exchanges.push({ method, url });
  state.lastUrl = url;
  const response = await page.request.fetch(url, {
    method,
    maxRedirects: options.maxRedirects,
    headers: options.headers,
  });
  state.status = response.status();
  state.body = await response.text();
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(response.headers())) {
    headers[name.toLowerCase()] = value;
  }
  state.headers = headers;
}

// gotoPage navigates the real browser to a URL and stores the response on
// the scenario state, recording the exchange like any other request.
export async function gotoPage(page: Page, url: string): Promise<void> {
  const state = stateFor(page);
  state.exchanges.push({ method: "GET", url });
  state.lastUrl = url;
  const response = await page.goto(url);
  state.status = response?.status();
  state.body = await page.content();
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(response?.headers() ?? {})) {
    headers[name.toLowerCase()] = value;
  }
  state.headers = headers;
}

// statusOf returns the last recorded response status.
export function statusOf(page: Page): number {
  const status = stateFor(page).status;
  expect(status, "no recorded response status").toBeDefined();
  return status as number;
}

// bodyOf returns the last recorded response body.
export function bodyOf(page: Page): string {
  const body = stateFor(page).body;
  expect(body, "no recorded response body").toBeDefined();
  return body as string;
}

// headerOf returns one last recorded response header, case-insensitively.
export function headerOf(page: Page, name: string): string {
  return stateFor(page).headers?.[name.toLowerCase()] ?? "";
}

// locationOf returns the Location header of the last recorded response.
export function locationOf(page: Page): string {
  return headerOf(page, "location");
}
