/**
 * The composition root for the status read: the one place that turns configuration into a live
 * backend probe. It is deliberately the only module in the Foundation context that touches `env`,
 * so every other module stays drivable from a test without a process environment.
 *
 * **Two reads per request, on purpose.** The App Router cannot choose its own response status, so
 * the envelope decision (200 or the sanitized 503) belongs to the proxy, while the rows belong to
 * the page — and the two run in different stages of the same request with no channel between them
 * that does not couple the page to a proxy-set header. Each therefore reads the backend itself. The
 * cost is one extra loopback `GET /health/ready` per page view, on a page with no other traffic; the
 * benefit is that neither stage can serve a state the other invented. The two reads can disagree
 * only if the backend changes between them, and `serviceStatusReport` already has honest words for
 * the one direction that is visible ("Not reported", never a guess).
 */
import { env } from "@/env";
import { createBackendReadinessClient, type BackendReadinessProbe } from "../infrastructure/backend-readiness-client";
import { createServiceStatusReader, serviceStatusReport } from "./service-status";
import type { BackendReadinessResult, ServiceStatusReport, StatusReadResult } from "../domain/service-status";

/**
 * Built per call rather than once at module load: `env` is read when a request is served, so a
 * process started with a different backend origin never serves a probe built from a stale one.
 */
function backendProbe(): BackendReadinessProbe {
  return createBackendReadinessClient({ baseUrl: env.OSE_ID_BE_URL });
}

export function readBackendReadiness(): Promise<BackendReadinessResult> {
  return backendProbe()();
}

/** The envelope's read: unreadable here is what produces the sanitized 503. */
export function readServiceStatus(): Promise<StatusReadResult> {
  return createServiceStatusReader(backendProbe())();
}

/** The page's read: always a renderable report, because the page has no way to answer 503. */
export async function readServiceStatusReport(): Promise<ServiceStatusReport> {
  return serviceStatusReport(await readBackendReadiness());
}
