import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { HttpServerResponse } from "@effect/platform";
import { errorHandler, AppRouter } from "../../src/app.js";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  FileTooLargeError,
  UnsupportedMediaTypeError,
} from "../../src/domain/errors.js";

// Extracts the JSON body from an Effect HttpServerResponse.
// The response body is a Uint8ArrayImpl (from HttpServerResponse.json).
function extractBody(response: HttpServerResponse.HttpServerResponse): Record<string, unknown> {
  // The body object has a `.body` property which is a Uint8Array
  const bodyObj = (response as unknown as { body: { body?: Uint8Array } }).body;
  if (bodyObj?.body instanceof Uint8Array) {
    return JSON.parse(Buffer.from(bodyObj.body).toString("utf-8")) as Record<string, unknown>;
  }
  return {};
}

// Run an app through errorHandler and capture status + body
async function runThroughErrorHandler(failWith: unknown): Promise<{
  status: number;
  body: Record<string, unknown>;
}> {
  const failingApp = Effect.fail(failWith) as Effect.Effect<HttpServerResponse.HttpServerResponse, unknown, never>;
  const handledApp = errorHandler(failingApp);
  const response = await Effect.runPromise(
    handledApp as Effect.Effect<HttpServerResponse.HttpServerResponse, never, never>,
  );
  return { status: response.status, body: extractBody(response) };
}

describe("errorHandler", () => {
  it("maps ValidationError to 400", async () => {
    const err = new ValidationError({ field: "amount", message: "Invalid" });
    const { status, body } = await runThroughErrorHandler(err);
    expect(status).toBe(400);
    expect(body["error"]).toBe("Validation error");
    expect(body["field"]).toBe("amount");
  });

  it("maps UnauthorizedError to 401", async () => {
    const err = new UnauthorizedError({ reason: "No token" });
    const { status, body } = await runThroughErrorHandler(err);
    expect(status).toBe(401);
    expect(body["error"]).toBe("Unauthorized");
  });

  it("maps ForbiddenError to 403", async () => {
    const err = new ForbiddenError({ reason: "No access" });
    const { status, body } = await runThroughErrorHandler(err);
    expect(status).toBe(403);
    expect(body["error"]).toBe("Forbidden");
  });

  it("maps NotFoundError to 404", async () => {
    const err = new NotFoundError({ resource: "User 1" });
    const { status, body } = await runThroughErrorHandler(err);
    expect(status).toBe(404);
    expect(body["error"]).toBe("Not found");
  });

  it("maps ConflictError to 409", async () => {
    const err = new ConflictError({ message: "Already exists" });
    const { status, body } = await runThroughErrorHandler(err);
    expect(status).toBe(409);
    expect(body["error"]).toBe("Conflict");
  });

  it("maps FileTooLargeError to 413", async () => {
    const err = new FileTooLargeError();
    const { status, body } = await runThroughErrorHandler(err);
    expect(status).toBe(413);
    expect(body["error"]).toBe("File too large");
  });

  it("maps UnsupportedMediaTypeError to 415", async () => {
    const err = new UnsupportedMediaTypeError();
    const { status, body } = await runThroughErrorHandler(err);
    expect(status).toBe(415);
    expect(body["error"]).toBe("Unsupported media type");
  });

  it("maps unknown errors to 500", async () => {
    const err = new Error("Something went wrong");
    const { status, body } = await runThroughErrorHandler(err);
    expect(status).toBe(500);
    expect(body["error"]).toBe("Internal server error");
  });
});

describe("AppRouter", () => {
  it("is defined", () => {
    expect(AppRouter).toBeDefined();
  });
});
