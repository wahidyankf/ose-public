/**
 * Assembling the status OSE ID reports, and deciding the HTTP envelope that carries it.
 *
 * What this deliberately does not do is read the backend. The shell's architecture note records
 * that the readiness read happens server-side and is never proxied; the read itself arrives with
 * the backend's health surface in a later slice. Until then the backend row states, in words, that
 * it is not reported — which is true — rather than claiming a readiness nobody measured.
 */
import {
  AUTHENTICATION_DISABLED_NOTICE,
  STATUS_PAGE_CACHE_CONTROL,
  STATUS_PAGE_MEDIA_TYPE,
  STATUS_UNAVAILABLE_DETAIL,
  STATUS_UNAVAILABLE_HEADING,
  type ServiceStatusReport,
  type StatusReadResult,
} from "../domain/service-status";

export interface StatusResponseEnvelope {
  readonly status: 200 | 503;
  readonly contentType: string;
  readonly cacheControl: string;
  /** The status surface is anonymous and stateless: it never sets a cookie of any kind. */
  readonly setCookie: undefined;
}

/** The status this foundation slice can truthfully report. */
export function foundationStatusReport(): ServiceStatusReport {
  return {
    components: [
      {
        id: "web-shell",
        name: "OSE ID web shell",
        stateLabel: "Running",
        detail: "This page answered, so the shell is serving. It stores nothing and reads no user data.",
      },
      {
        id: "backend",
        name: "OSE ID backend",
        stateLabel: "Not reported",
        detail:
          "Backend readiness reporting is not part of this foundation build, so no backend state is claimed here.",
      },
      {
        id: "authentication",
        name: "Authentication",
        stateLabel: "Disabled",
        detail: AUTHENTICATION_DISABLED_NOTICE,
      },
    ],
  };
}

/**
 * Reads the status as a result rather than by throwing, so a source that cannot answer produces one
 * sanitized failure shape instead of an exception whose message would have to be scrubbed at the
 * edge. This foundation source reads nothing outside the process and therefore always answers; the
 * unreadable outcome exists for the source that replaces it once backend readiness is read.
 */
export function readServiceStatus(): StatusReadResult {
  return { readable: true, report: foundationStatusReport() };
}

/** The envelope both outcomes share, differing only in status code. */
export function statusResponseEnvelope(read: StatusReadResult): StatusResponseEnvelope {
  return {
    status: read.readable ? 200 : 503,
    contentType: STATUS_PAGE_MEDIA_TYPE,
    cacheControl: STATUS_PAGE_CACHE_CONTROL,
    setCookie: undefined,
  };
}

/**
 * The sanitized failure document. It is assembled from constants only — no interpolated error, no
 * request detail, no configuration — so there is no path by which a machine detail reaches a reader.
 */
export function sanitizedUnavailableDocument(): string {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${STATUS_UNAVAILABLE_HEADING}</title>`,
    "</head>",
    "<body>",
    "<main>",
    `<h1>${STATUS_UNAVAILABLE_HEADING}</h1>`,
    `<p>${STATUS_UNAVAILABLE_DETAIL}</p>`,
    "</main>",
    "</body>",
    "</html>",
  ].join("");
}
