/**
 * The composition root for the status surface's HTTP envelope. The status source and the envelope
 * policy both live in the Foundation context; this file only names which source the running app
 * uses and which path it applies to.
 */
import { readServiceStatus } from "@/contexts/foundation/application/service-status";
import { createStatusMiddleware } from "@/contexts/foundation/application/status-middleware";

export const proxy = createStatusMiddleware(readServiceStatus);

export const config = {
  matcher: ["/"],
};
