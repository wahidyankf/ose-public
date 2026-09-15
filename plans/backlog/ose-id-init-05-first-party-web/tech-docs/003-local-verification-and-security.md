# Local Verification and Security

## Owned Local Stack

The web E2E owner starts and cleans up the complete identity stack it needs: `ose-id-web`, at least two
web instances for handoff proof, `ose-id-be`, PostgreSQL, Mailpit from
`ose-id-init-02-local-email-account`, and the synthetic local
OIDC client/resource from Init 04. Readiness probes—not sleeps—gate test start. Every port and resource
is run-scoped and loopback-only. Cleanup runs after pass, failure, cancellation, and timeout.

No Google/fake social provider is started. No deployment manifest, public ingress, production secret,
or Kubernetes dependency enters the stack.

## Test Ownership

| Layer          | Owner                        | Required evidence                                                                       |
| -------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| Component/Unit | `ose-id-web`                 | form state, view mapping, error/focus/status, safe-return validation                    |
| Contract       | web plus backend             | typed render models/commands, unknown problem code, schema drift                        |
| Web E2E        | `ose-id-web-e2e`             | email, recovery/verification, context, consent, account security, absent future methods |
| Accessibility  | web E2E plus manual          | axe, keyboard, focus, zoom, text spacing, landmarks, live status                        |
| Security       | web E2E plus leak inspection | cookies, headers, CSRF, storage, RSC, URL, logs, analytics, open redirect               |
| Multi-instance | web E2E                      | begin on A, stop A, continue on B without affinity                                      |

Tests run against production-built processes rather than dev-server behavior unless a repository rule
explicitly defines otherwise. Clocks, identities, companies, scopes, and email messages are synthetic
and deterministic. Select records by run ID rather than “latest” to prevent parallel collision.

## Browser Leak Inspection

After a complete flow, inspect:

- local/session storage, IndexedDB, Cache Storage, service workers, and browser cookies;
- address/history/referrer, HTML, RSC/Flight payloads, network request/response bodies and headers;
- console, analytics, server logs, screenshots, traces, videos, and committed evidence.

Only the opaque web session cookie may represent authentication in the browser. Test tools must redact
or avoid recording passwords, capabilities, codes, tokens, cookies, and real-looking personal data.

## No-Affinity Scenario

Route the first request to web A, authenticate through the backend, then terminate A. Route context and
consent through B using the same opaque cookie. The flow succeeds because shared session/transaction
state is authoritative. Repeat with concurrent duplicate form submission and prove only one backend
transition completes.

If an optimization cache is lost, the page may become slower but must not authorize differently. No
server component, module singleton, temp directory, or local file stores correctness state.

## Failure and Recovery

- Backend unavailable: show a safe retry/restart page; retain no password and create no fallback identity.
- Shared session unavailable: invalidate the browser handle and restart explicitly; do not use cached
  context or consent.
- Transaction expired or authority changed: explain that authorization must restart; preserve no stale
  selection.
- BFF release regression: disable the local/test feature gate and revert the delivery unit; backend
  protocols remain functional for machine tests.
- Migration/schema mismatch: fail startup rather than rendering partially understood data.

Production-mode configuration checks reject localhost backend/callbacks, local session protection,
test identities, and absent production prerequisites before the server listens. Actual deployment
remains blocked at minimum on the private-sibling K3s cluster plan and then-current handoff gates.

## Manual Evidence

For every supported locale at 320, 768, and 1280 px, capture sign-in, context, consent allow/cancel,
account security, validation error, service unavailable, and absent-future-method states. Use meaningful
alt text and synthetic identities. Record keyboard order, focus destination, live announcements, zoom,
text spacing, console errors, and network/storage inspection. Commit screenshots under `evidence/` only
after leak review.
