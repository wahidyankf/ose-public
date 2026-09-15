# Business Requirements Document — BeaverNest Flutter Web Client

## Business Goal

[Judgment call] BeaverNest should establish Flutter through a small Web-only migration before taking
on native packaging and endpoint-management complexity. This produces a stable shared UI foundation
without delaying the existing browser-based private workspace.

## Business Value

- One Flutter Web client replaces the current Vite/React implementation without changing the trusted
  same-origin operating model.
- A safe diagnostics snapshot gives an operator useful live context without exposing server internals.
- Deferring native clients reduces delivery risk and gives their later plan a proven Flutter baseline.
- Browser-install guidance gives supported phones an app-like entry point without misrepresenting the
  current HTTP VPN runtime as a secure-context PWA.

## Affected Roles

| Role         | Need                                                                 |
| ------------ | -------------------------------------------------------------------- |
| Browser user | Immediate, accessible Foundation status at the existing private URL. |
| Operator     | A safe support snapshot alongside ready/unavailable status.          |
| Maintainer   | A reproducible Flutter Web toolchain and a clean legacy retirement.  |
| Reviewer     | Explicit proof that no sensitive server fields reach the browser.    |

## Success Measures

- [Observable] `fvm flutter build web` builds the deployed client from the committed SDK pin.
- [Observable] browser E2E proves the Flutter bundle through the combined `beavernest-be` runtime.
- [Observable] repository searches find no live `beavernest-app-web` project, build, spec, or E2E
  identity after cutover.

## Non-Goals

- This plan does not add native desktop or mobile clients, profiles, endpoint configuration, or
  device testing.
- It does not claim service-worker offline behavior, immediate auto-update, or standards-compliant
  PWA installation; these require production HTTPS and a later infrastructure/product plan.
- It does not change VPN, authentication, public exposure, or deployment provisioning.
- It does not store support history or add server-side diagnostic persistence.

## Risks and Mitigations

| Risk                                                                 | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Environment-tier work changes the legacy BeaverNest app concurrently | Hard-block this plan until the private sibling's `restrict-env-access-to-prod-and-stag` plan is semantically complete: archived, absent from `in-progress`, marked Complete, and without unresolved delivery items; Phase 0 also records its merged `ose-public` implementation evidence before a branch is created. Preserve the resulting backend `APP_ENV` loader, process-environment precedence, and regression coverage through cutover. |
| Dart generator cannot represent the current OpenAPI contract         | A Phase 0 compatibility spike blocks client code until generated closed response types and drift checks pass.                                                                                                                                                                                                                                                                                                                                  |
| Flutter asset hosting differs from Vite                              | Combined-runtime browser E2E validates bootstrap, assets, cache headers, and fallback behavior.                                                                                                                                                                                                                                                                                                                                                |
| Atomic cutover causes an avoidable regression                        | Retain the legacy test baseline until the replacement passes its own Web/browser and API evidence before merge.                                                                                                                                                                                                                                                                                                                                |
