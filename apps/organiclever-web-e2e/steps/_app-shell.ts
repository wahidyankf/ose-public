/**
 * Shared E2E helper for OrganicLever web. Centralises the dev base URL and
 * exposes a `appPath` builder for the new URL-routed shell so each step file
 * does not hard-code the base URL.
 *
 * Step files import the constant or helper they need; this keeps the diff per
 * step file small (one import line + one URL change).
 */

export const APP_BASE_URL = "http://localhost:3200";

/**
 * Build a fully-qualified URL for a /app/<tab> path or any sub-path under /app.
 * Pass the segment after `/app/` (e.g. `home`, `history`, `workout/finish`).
 *
 * Examples:
 *   appPath("home")          → "http://localhost:3200/app/home"
 *   appPath("workout/finish")→ "http://localhost:3200/app/workout/finish"
 *   appPath("")              → "http://localhost:3200/app/home" (default tab)
 */
export function appPath(segment: string = "home"): string {
  const trimmed = segment.replace(/^\/+/, "").replace(/\/+$/, "");
  if (trimmed === "") return `${APP_BASE_URL}/app/home`;
  return `${APP_BASE_URL}/app/${trimmed}`;
}

/** Bare /app URL — used to assert the 308 redirect to /app/home. */
export const APP_BARE_URL = `${APP_BASE_URL}/app`;
