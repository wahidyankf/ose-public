/**
 * The HTTP envelope for the status surface.
 *
 * Next.js App Router pages cannot choose their own response status, so the one place that can —
 * middleware — owns the envelope for both outcomes. The status source arrives as a parameter so the
 * failure branch is a real, driven path rather than a branch nothing can reach.
 */
import { NextResponse } from "next/server";
import type { StatusReadResult } from "../domain/service-status";
import { sanitizedUnavailableDocument, statusResponseEnvelope } from "./service-status";

export type StatusMiddleware = () => NextResponse;

export function createStatusMiddleware(readStatus: () => StatusReadResult): StatusMiddleware {
  return () => {
    const envelope = statusResponseEnvelope(readStatus());

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
