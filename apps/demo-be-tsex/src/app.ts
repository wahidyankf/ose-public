import { HttpRouter, HttpServer, HttpServerResponse, HttpMiddleware } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { Layer, Effect } from "effect";
import { createServer } from "node:http";
import { healthRouter } from "./routes/health.js";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  FileTooLargeError,
  UnsupportedMediaTypeError,
} from "./domain/errors.js";

export const AppRouter = HttpRouter.empty.pipe(HttpRouter.mountApp("/", healthRouter));

export const errorHandler = HttpMiddleware.make((app) =>
  Effect.catchAll(app, (error) => {
    if (error instanceof ValidationError) {
      return HttpServerResponse.json(
        {
          error: "Validation error",
          field: error.field,
          message: error.message,
        },
        { status: 400 },
      );
    }
    if (error instanceof UnauthorizedError) {
      return HttpServerResponse.json({ error: "Unauthorized", message: error.reason }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return HttpServerResponse.json({ error: "Forbidden", message: error.reason }, { status: 403 });
    }
    if (error instanceof NotFoundError) {
      return HttpServerResponse.json({ error: "Not found", message: `${error.resource} not found` }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return HttpServerResponse.json({ error: "Conflict", message: error.message }, { status: 409 });
    }
    if (error instanceof FileTooLargeError) {
      return HttpServerResponse.json(
        {
          error: "File too large",
          message: "File exceeds maximum allowed size",
        },
        { status: 413 },
      );
    }
    if (error instanceof UnsupportedMediaTypeError) {
      return HttpServerResponse.json(
        {
          error: "Unsupported media type",
          message: "File type not allowed",
        },
        { status: 415 },
      );
    }
    return HttpServerResponse.json({ error: "Internal server error" }, { status: 500 });
  }),
);

export const makeAppLayer = (port: number) =>
  HttpServer.serve(AppRouter, errorHandler).pipe(Layer.provide(NodeHttpServer.layer(() => createServer(), { port })));
