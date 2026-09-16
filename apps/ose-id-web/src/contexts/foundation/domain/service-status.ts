/**
 * The Foundation context's model of what OSE ID may say about itself while it is inert.
 *
 * Every user-visible word lives here rather than in a component, because the accessibility contract
 * this slice owes — status conveyed as text, authentication stated as disabled, nothing about the
 * stack revealed — is a property of the words, not of the markup that carries them.
 */

/** The single level-one heading the status page carries. */
export const STATUS_PAGE_HEADING = "OSE ID service status";

/** The accessible name of the status region, distinct from the page heading. */
export const STATUS_REGION_LABEL = "OSE ID service component status";

export const STATUS_PAGE_SUMMARY =
  "OSE ID is running as an inert foundation service. This page reports component state and does nothing else.";

/** The short, prominent statement that this build cannot authenticate anyone. */
export const AUTHENTICATION_DISABLED_HEADLINE = "Authentication is not enabled in this build.";

export const AUTHENTICATION_DISABLED_SUMMARY =
  "No account, credential, provider, company, consent, or administration surface exists yet. There is nothing here to sign in to.";

/** The authentication component's own detail line inside the status region. */
export const AUTHENTICATION_DISABLED_NOTICE =
  "Authentication is not enabled. OSE ID cannot sign anyone in yet, and this page is not a sign-in form.";

/** The media type and cache directive every status response carries, success or failure. */
export const STATUS_PAGE_MEDIA_TYPE = "text/html; charset=utf-8";
export const STATUS_PAGE_CACHE_CONTROL = "no-cache";

/** The sanitized failure page: it names the failure and nothing about the machine it happened on. */
export const STATUS_UNAVAILABLE_HEADING = "OSE ID service status is unavailable";
export const STATUS_UNAVAILABLE_DETAIL =
  "The status shell is serving but could not read the state it reports on. Nothing was stored and no sign-in was attempted.";

/**
 * Whether a component's reported state is a by-design-active good outcome or a by-design-inactive,
 * equally fine, neutral one. This never carries meaning on its own — {@link ServiceStatusComponent}
 * always states its state in `stateLabel` and `detail` text regardless of tone — it only lets the
 * presentation layer vary typographic emphasis so a first glance can triage the two apart without
 * reading every sentence.
 */
export type ServiceStatusTone = "positive" | "neutral";

/**
 * A component's state, named in words. The label is the text a reader sees; a colour may reinforce
 * it but never carries it, which is why no colour is modelled here at all.
 */
export interface ServiceStatusComponent {
  readonly id: string;
  readonly name: string;
  readonly stateLabel: string;
  readonly detail: string;
  readonly tone: ServiceStatusTone;
}

export interface ServiceStatusReport {
  readonly components: readonly ServiceStatusComponent[];
}

/**
 * The outcome of reading the status. An unreadable read carries no reason on purpose: the reason
 * is exactly the kind of detail the sanitization rule forbids the surface from revealing.
 */
export type StatusReadResult =
  | { readonly readable: true; readonly report: ServiceStatusReport }
  | { readonly readable: false };
