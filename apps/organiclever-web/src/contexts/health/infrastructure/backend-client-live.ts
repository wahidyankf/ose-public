import { Effect, Layer } from "effect";
import { BackendClient } from "./backend-client";
import { NetworkError } from "./errors";

const BACKEND_URL = process.env["ORGANICLEVER_BE_URL"] ?? "http://localhost:8202";

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new NetworkError({ status: response.status, message: text || response.statusText });
  }
  const text = await response.text();
  if (!text) return undefined;
  return JSON.parse(text) as unknown;
}

export const BackendClientLive = Layer.succeed(
  BackendClient,
  BackendClient.of({
    get: (path, headers) =>
      Effect.tryPromise({
        try: () =>
          fetchJson(`${BACKEND_URL}${path}`, {
            headers: { "Content-Type": "application/json", ...headers },
          }),
        catch: (error) => {
          if (error instanceof NetworkError) return error;
          return new NetworkError({ status: 0, message: String(error) });
        },
      }),

    post: (path, body, headers) =>
      Effect.tryPromise({
        try: () =>
          fetchJson(`${BACKEND_URL}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify(body),
          }),
        catch: (error) => {
          if (error instanceof NetworkError) return error;
          return new NetworkError({ status: 0, message: String(error) });
        },
      }),
  }),
);
