/**
 * The HTTP envelope for the status surface.
 *
 * Next.js App Router pages cannot choose their own response status, so the one place that can —
 * middleware — owns the envelope for both outcomes. The status source arrives as a parameter so the
 * failure branch is a real, driven path rather than a branch nothing can reach.
 *
 * The source is asynchronous because reading it crosses the network to the backend's readiness
 * route. Nothing about the envelope waits on anything else: one read, then one response.
 */
import { NextResponse } from "next/server";
import type { StatusReadResult } from "../domain/service-status";
import { sanitizedUnavailableDocument, statusResponseEnvelope } from "./service-status";

export type StatusMiddleware = () => Promise<NextResponse>;

export function createStatusMiddleware(readStatus: () => Promise<StatusReadResult>): StatusMiddleware {
  return async () => {
    const envelope = statusResponseEnvelope(await readStatus());

    if (envelope.status === 503) {
      return new NextResponse(sanitizedUnavailableDocument(), {
        status: envelope.status,
        headers: {
          "content-type": envelope.contentType,
          "cache-control": envelope.cacheControl,
        },
      });
    }

    const passthrough = NextResponse.next();
    passthrough.headers.set("cache-control", envelope.cacheControl);
    return passthrough;
  };
}
