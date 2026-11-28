// HTTP helpers for the HTTP boundary adapter. Every call goes through the
// request context with GET only, and every exchange is recorded on the scenario
// state for the Then steps to assert. No helper retries a request.
import { expect, type APIRequestContext } from "@playwright/test";
import { stateFor } from "./state";

export type FetchOptions = {
  maxRedirects?: number;
  headers?: Record<string, string>;
};

// fetchText performs one recorded GET and stores the response on the scenario state.
export async function fetchText(request: APIRequestContext, url: string, options: FetchOptions = {}): Promise<void> {
  const state = stateFor(request);
  state.exchanges.push({ method: "GET", url });
  state.lastUrl = url;
  const response = await request.fetch(url, {
    method: "GET",
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

// statusOf returns the last recorded response status.
export function statusOf(request: APIRequestContext): number {
  const status = stateFor(request).status;
  expect(status, "no recorded response status").toBeDefined();
  return status as number;
}

// bodyOf returns the last recorded response body.
export function bodyOf(request: APIRequestContext): string {
  const body = stateFor(request).body;
  expect(body, "no recorded response body").toBeDefined();
  return body as string;
}

// headerOf returns one last recorded response header, case-insensitively.
export function headerOf(request: APIRequestContext, name: string): string {
  return stateFor(request).headers?.[name.toLowerCase()] ?? "";
}

// locationOf returns the Location header of the last recorded response.
export function locationOf(request: APIRequestContext): string {
  return headerOf(request, "location");
}
