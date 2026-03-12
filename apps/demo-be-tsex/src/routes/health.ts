import { HttpRouter, HttpServerResponse } from "@effect/platform";

export const healthRouter = HttpRouter.empty.pipe(HttpRouter.get("/health", HttpServerResponse.json({ status: "UP" })));
