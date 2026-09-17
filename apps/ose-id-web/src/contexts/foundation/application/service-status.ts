/**
 * Assembling the status OSE ID reports, and deciding the HTTP envelope that carries it.
 *
 * The backend read itself belongs to the infrastructure adapter; this module turns its closed
 * three-word answer into rows a reader can read, and turns "no answer" into the one sanitized
 * failure envelope. Nothing here ever sees a host, a body, or an error, so nothing here can leak
 * one — the row words below are constants selected by state, never text built from a response.
 */
import {
  AUTHENTICATION_DISABLED_NOTICE,
  STATUS_PAGE_CACHE_CONTROL,
  STATUS_PAGE_MEDIA_TYPE,
  STATUS_UNAVAILABLE_DETAIL,
  STATUS_UNAVAILABLE_HEADING,
  type BackendReadinessResult,
  type BackendReadinessState,
  type ServiceStatusComponent,
  type ServiceStatusReport,
  type StatusReadResult,
} from "../domain/service-status";
import type { BackendReadinessProbe } from "../infrastructure/backend-readiness-client";

export interface StatusResponseEnvelope {
  readonly status: 200 | 503;
  readonly contentType: string;
  readonly cacheControl: string;
  /** The status surface is anonymous and stateless: it never sets a cookie of any kind. */
  readonly setCookie: undefined;
}

/**
 * The shell's own row. It is the one row not sourced from the backend: the page answering at all is
 * the liveness signal, so this row is true whenever anybody can read it.
 */
const WEB_SHELL_COMPONENT: ServiceStatusComponent = {
  id: "web-shell",
  name: "OSE ID web shell",
  stateLabel: "Running",
  detail: "This page answered, so the shell is serving. It stores nothing and reads no user data.",
  tone: "positive",
};

const AUTHENTICATION_COMPONENT: ServiceStatusComponent = {
  id: "authentication",
  name: "Authentication",
  stateLabel: "Disabled",
  detail: AUTHENTICATION_DISABLED_NOTICE,
  tone: "neutral",
};

/**
 * The three backend-sourced rows for each state the backend may report.
 *
 * Every cell is a literal. A state the backend did not report is stated as "Not reported" rather
 * than inferred: a `schema_incompatible` answer proves the database was reachable, but the backend
 * did not *say* so in that answer, and a status page that quietly upgrades an inference into a
 * report is the thing this page exists not to be.
 */
const BACKEND_COMPONENTS_BY_STATE: Record<BackendReadinessState, readonly ServiceStatusComponent[]> = {
  ready: [
    {
      id: "backend",
      name: "OSE ID backend",
      stateLabel: "Ready",
      detail: "The backend answered its readiness check and reports it can serve.",
      tone: "positive",
    },
    {
      id: "postgresql",
      name: "PostgreSQL",
      stateLabel: "Ready",
      detail: "The backend reports its database is reachable.",
      tone: "positive",
    },
    {
      id: "schema",
      name: "Schema",
      stateLabel: "Compatible",
      detail: "The backend reports the applied schema is one this build can serve.",
      tone: "positive",
    },
  ],
  "database-unavailable": [
    {
      id: "backend",
      name: "OSE ID backend",
      stateLabel: "Not ready",
      detail: "The backend answered, and reports it cannot serve yet.",
      tone: "attention",
    },
    {
      id: "postgresql",
      name: "PostgreSQL",
      stateLabel: "Unavailable",
      detail: "The backend reports it cannot reach its database.",
      tone: "attention",
    },
    {
      id: "schema",
      name: "Schema",
      stateLabel: "Not reported",
      detail: "The backend reported a database problem instead, so no schema state is claimed here.",
      tone: "neutral",
    },
  ],
  "schema-incompatible": [
    {
      id: "backend",
      name: "OSE ID backend",
      stateLabel: "Not ready",
      detail: "The backend answered, and reports it cannot serve yet.",
      tone: "attention",
    },
    {
      id: "postgresql",
      name: "PostgreSQL",
      stateLabel: "Not reported",
      detail: "The backend reported a schema problem instead, so no database state is claimed here.",
      tone: "neutral",
    },
    {
      id: "schema",
      name: "Schema",
      stateLabel: "Incompatible",
      detail: "The backend reports the applied schema is not one this build can serve.",
      tone: "attention",
    },
  ],
};

/**
 * The rows shown when the backend gave no answer this shell understands. The status envelope turns
 * an unreadable read into the sanitized `503` document, so these rows are what a reader sees only in
 * the narrow window where the envelope's read succeeded and the page's own read did not (see
 * `readServiceStatusReport`). They still state the truth — that nothing was read — rather than
 * guessing, because a page that guesses once has to be distrusted always.
 */
const UNREADABLE_BACKEND_COMPONENTS: readonly ServiceStatusComponent[] = [
  {
    id: "backend",
    name: "OSE ID backend",
    stateLabel: "Not reported",
    detail: "OSE ID could not read the backend's readiness, so no backend state is claimed here.",
    tone: "attention",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    stateLabel: "Not reported",
    detail: "The database state is reported by the backend, which did not answer.",
    tone: "neutral",
  },
  {
    id: "schema",
    name: "Schema",
    stateLabel: "Not reported",
    detail: "The schema state is reported by the backend, which did not answer.",
    tone: "neutral",
  },
];

/** The status OSE ID can truthfully report, given what the backend said about itself. */
export function serviceStatusReport(backend: BackendReadinessResult): ServiceStatusReport {
  const backendComponents = backend.readable
    ? BACKEND_COMPONENTS_BY_STATE[backend.state]
    : UNREADABLE_BACKEND_COMPONENTS;
  return {
    components: [WEB_SHELL_COMPONENT, ...backendComponents, AUTHENTICATION_COMPONENT],
  };
}

/**
 * Reads the status as a result rather than by throwing, so a backend that cannot answer produces one
 * sanitized failure shape instead of an exception whose message would have to be scrubbed at the
 * edge. An unreadable backend makes the whole status unreadable: the shell's own liveness is never
 * in doubt at the moment it is rendering, so a page that reported only that would be a page that
 * always says "fine".
 */
export function createServiceStatusReader(probe: BackendReadinessProbe): () => Promise<StatusReadResult> {
  return async () => {
    const backend = await probe();
    return backend.readable ? { readable: true, report: serviceStatusReport(backend) } : { readable: false };
  };
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
