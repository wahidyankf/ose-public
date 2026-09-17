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
        tone: "positive",
      },
      {
        id: "backend",
        name: "OSE ID backend",
        stateLabel: "Not reported",
        detail:
          "Backend readiness reporting is not part of this foundation build, so no backend state is claimed here.",
        tone: "neutral",
      },
      {
        id: "authentication",
        name: "Authentication",
        stateLabel: "Disabled",
        detail: AUTHENTICATION_DISABLED_NOTICE,
        tone: "neutral",
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
 * The inline style sheet for {@link sanitizedUnavailableDocument}. Values are copied from the same
 * OSE design values the rest of the app renders through Tailwind (see
 * `libs/web-ui-token/src/ose.css`'s `--warm-0`/`--warm-900`/`--warm-500` light values and its
 * `[data-theme="dark"], .dark` overrides), inlined literally rather than referenced, because this
 * document is the one surface the architecture note requires to render even when the pipeline that
 * compiles and serves the app's own CSS bundle is the thing that failed.
 */
const SANITIZED_DOCUMENT_STYLE = [
  ":root{color-scheme:light dark}",
  "body{margin:0;min-height:100vh;background:oklch(99% 0.004 245);color:oklch(18% 0.016 240);",
  "font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}",
  "main{max-width:42rem;margin:0 auto;padding:2rem 1rem}",
  "h1{font-size:1.5rem;font-weight:600;margin:0 0 0.5rem}",
  "p{margin:0;color:oklch(48% 0.016 245)}",
  "@media (prefers-color-scheme:dark){",
  "body{background:oklch(18% 0.012 240);color:oklch(96% 0.008 245)}",
  "p{color:oklch(70% 0.014 245)}",
  "}",
].join("");

/**
 * The sanitized failure document. It is assembled from constants only — no interpolated error, no
 * request detail, no configuration — so there is no path by which a machine detail reaches a reader.
 * Styling is inlined rather than linked so the document never depends on a separate stylesheet
 * request succeeding, and it carries the same `role="status"` live-region semantics as the rendered
 * status region so assistive technology announces the failure the same way it announces success.
 */
export function sanitizedUnavailableDocument(): string {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${STATUS_UNAVAILABLE_HEADING}</title>`,
    `<style>${SANITIZED_DOCUMENT_STYLE}</style>`,
    "</head>",
    "<body>",
    '<main role="status" aria-live="polite">',
    `<h1>${STATUS_UNAVAILABLE_HEADING}</h1>`,
    `<p>${STATUS_UNAVAILABLE_DETAIL}</p>`,
    "</main>",
    "</body>",
    "</html>",
  ].join("");
}
