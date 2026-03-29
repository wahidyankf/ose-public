import type { APIResponse } from "@playwright/test";

let response: APIResponse | null = null;

export function setResponse(r: APIResponse): void {
  response = r;
}

export function getResponse(): APIResponse {
  if (!response) {
    throw new Error("No response stored. A When step must run before Then steps.");
  }
  return response;
}

export function clearResponse(): void {
  response = null;
}
