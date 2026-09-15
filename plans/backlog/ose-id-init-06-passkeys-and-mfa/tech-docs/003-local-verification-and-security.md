# Local Verification and Security

## Test Matrix

| Area                 | Positive cases                                       | Negative and boundary cases                                                      |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| Passkey registration | fresh session, multiple credentials, labels          | stale session, duplicate ID, wrong challenge/RP/origin/type, cancellation        |
| Passkey assertion    | allowed origin, owner, signature, UV policy          | replay, expiry, other owner, wrong signature/RP/origin/type, disabled credential |
| TOTP setup           | pending then confirmed, manual key and QR            | abandoned/restarted setup, wrong/expired/replayed/rate-limited code              |
| Recovery codes       | show once, consume once, regenerate                  | concurrent replay, old generation, malformed/rate-limited code, disclosure scan  |
| Method policy        | add/remove with recent auth, alternatives remain     | stale auth, final safe path, concurrent removals, suspended method               |
| OIDC evidence        | truthful completed `amr` and `auth_time`             | requested-but-not-completed factor, credential metadata leak                     |
| UI/a11y              | keyboard, focus, status, fallback, locale/breakpoint | browser unsupported, prompt cancel, zoom/text spacing, no color-only state       |
| Runtime              | shared challenge and no affinity                     | instance stops mid-ceremony; production rejects local RP/test config             |

## Deterministic Local Environment

Run built `ose-id-web`, `ose-id-be`, PostgreSQL, Mailpit, and the synthetic local client. Browser E2E
uses an automation-supported virtual authenticator where repository/browser tooling permits; backend E2E
also exercises protocol verification directly with synthetic key pairs. Never weaken production code to
accept a fake assertion. Test-only services are registered only by explicit local/test composition and
production startup rejects them.

Pin local RP ID and origins to the registered loopback hosts/ports. Tests cannot replace exact-origin
validation with a wildcard. Run-scoped resources, fixed clock abstraction, seeded synthetic people, and
readiness probes make parallel results deterministic. Cleanup executes after every termination path.

## Shared Challenge and Concurrency Proof

Start two backend and two web instances with no affinity. Create a WebAuthn challenge through A, stop A,
submit through B, and prove one successful consumption. Race the same assertion at A/B and prove one
success/one generic replay denial. Repeat for TOTP enrollment confirmation, recovery-code consumption,
regeneration versus use, and two concurrent last-method removals.

Correctness-critical challenge, attempt, factor, recovery, session, and audit state belongs in shared
PostgreSQL or the established shared store. Mutable singleton dictionaries, local temp files, and sticky
routing are forbidden. A cache may improve read performance only when loss cannot change a decision.

## Secret and Evidence Controls

Never persist or record passkey private keys, raw TOTP secrets/codes, plaintext recovery codes, browser
session cookies, authorization artifacts, or realistic personal data. Test traces/screenshots must mask
QR and code surfaces or disable automatic capture during the one-time display. Evidence records state
transitions, synthetic IDs/digests, result codes, and counts only.

Inspect browser storage, URL/history, RSC payloads, network, console, analytics, server logs, traces,
videos, screenshots, database dumps, and CI artifacts. Leak findings are release blockers.

## Failure and Recovery

- Browser unsupported/cancelled: return to explicit passkey action with email fallback and stable focus.
- Challenge store unavailable: fail ceremony and require restart; do not trust client-carried state.
- TOTP setup interrupted: pending secret expires and cannot authenticate.
- Recovery-code display interrupted: force safe regeneration after recent auth rather than redisplay an
  uncertain old plaintext set.
- Suspected passkey clone/counter anomaly: deny/audit according to current platform guidance and preserve
  a safe recovery route.
- Release regression: disable the temporary local gate or revert the unit; do not leave half-enabled
  factor endpoints.

Production deployment is outside scope. Startup rejects localhost RP/origins, test authenticators,
local data-protection/key settings, and absent production prerequisites. Deployment remains blocked at
minimum by the `ose-private` K3s cluster plan and the then-current platform handoff gates.
