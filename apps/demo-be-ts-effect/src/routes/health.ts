import { HttpRouter, HttpServerResponse } from "@effect/platform";
import type { HealthResponse } from "../lib/api/types.js";

const healthBody = { status: "UP" } satisfies HealthResponse;
export const healthRouter = HttpRouter.empty.pipe(HttpRouter.get("/health", HttpServerResponse.json(healthBody)));
