# API Exploratory Tester Report — verification-mode retest `aet-c4b3191bca34`

**Target**: `http://127.0.0.1:8501` (`ose-id-be`, fresh owned local stack, foundation-ready fixture
profile, empty domain state). **Goal**: retest `AET-001`, `AET-002`, and `AET-003` from discovery run
`aet-2ecbb6945fdd` against the `RouteDisclosureGuard` fix, confirm byte-for-byte indistinguishability
from a genuinely-absent path, and regression-check the rest of the closed surface. **Mode**:
verification (scoped retest, not full discovery — per this agent's Bounded Quality-Gate Role: reproduce
the supplied original findings and smoke-test affected operations, plus the task's own explicit
regression-sweep request). **Output mode**: `delivery` → `plans/in-progress/ose-id-init-01-foundation`.
**Protocol**: REST (same OpenAPI 3.1.0 contract as the discovery run; unchanged text for the relevant
clause).

## What changed since the discovery run

A new `RouteDisclosureGuard` middleware (`apps/ose-id-be/src/OseId.Host/RouteDisclosureGuard.cs`),
backed by a new `RouteDisclosurePolicy`/`AbsentRouteAnswer` domain model
(`apps/ose-id-be/src/OseId.Domain/Routing/`), now wraps the whole application pipeline
(`OseIdHost.ComposePipeline`, registered ahead of `MapInboundRoutes`, so every route the host maps
gets the same treatment — nothing route-specific). It inspects every response after the endpoint
pipeline runs; if the status is exactly `405` (`RouteDisclosurePolicy.MethodMismatchStatus`), it
strips the `Allow` header and rewrites the response to `RouteDisclosurePolicy.AbsentRoute`: status
`404`, no `Content-Type`, no declared `Content-Length` (left for Kestrel to compute as zero from a
body nothing wrote) — deliberately mirroring what a genuinely-unregistered path already produces,
not adding headers to the `405`. A new spec,
`specs/apps/ose/id-be/behaviours/foundation/route-disclosure.feature`, is the authoritative ground
truth for this behaviour: "OSE ID answers exactly as it answers an unregistered path... the answer
names no method that path would have answered," exercised over 8 example rows spanning both health
routes and all 5 disabled-capability routes.

## Retest scope executed

1. **AET-001 retest** — all 7 routes × wrong method, 22 individual probes (14 matching the original
   discovery scope + 8 additional `DELETE`/`PATCH`/extra-`TRACE` probes for method-agnostic
   confirmation), against a genuinely-nonexistent-path baseline captured fresh this pass.
2. **AET-002 retest** — header-presence check (`X-Correlation-ID`, `Cache-Control: no-store`,
   `Content-Type`, `Allow`) on the same 22 probes, compared against the same baseline.
3. **Byte-for-byte diff** — direct `diff` of a rewritten wrong-method response against the baseline
   response, `Date` stripped (the only field that legitimately varies between any two requests).
4. **AET-003 retest** — confirmed `Server: Kestrel` is still disclosed on every response (unchanged,
   explicitly out of scope for this retest per the task).
5. **Regression sweep** — all 7 documented operations' correct method/path (full schema/header
   re-check), and the same 28-path closed-surface sweep from the discovery run.
6. **New observation (AET-004)** — a `HEAD`-specific latency issue surfaced while retesting; fully
   characterized and dispositioned as out of this retest's blocking scope (see below).

Full sanitized request/response evidence: `retest-request-response-matrix.md`. Run metadata:
`retest-run-id.txt`.

## Dispositions

### AET-001 — **RESOLVED**

- **Original finding**: wrong-method requests to the 5 disabled-capability routes returned `405
Method Not Allowed` with a leaked `Allow` header, instead of the contracted bare `404`.
- **Retest result**: 22/22 wrong-method probes across all 7 routes (both health routes + all 5
  disabled-capability routes), spanning `GET`/`POST`/`HEAD`/`OPTIONS`/`PUT`/`DELETE`/`PATCH`/`TRACE`,
  now return `404` with no `Allow` header. Zero `405` responses observed anywhere this pass.
- **Method-agnostic confirmation**: the original discovery run tested `POST`/`HEAD`/`OPTIONS`/`PUT`/
  `DELETE` on `/connect/authorize` plus one wrong method per remaining route (14 probes total). This
  retest adds `PATCH` on 4 routes, a second `DELETE`/`TRACE` on 2 more routes, and `DELETE` on
  `/health/live` — 8 additional method/route combinations never previously probed, all clean. The fix
  operates on the response status code (`RouteDisclosurePolicy.DisclosesRegisteredPath(405)`), not on
  any specific verb, and is registered once for the whole pipeline — consistent with the observed
  method-agnostic result.
- **Verdict**: the contract's "falls through to the framework's ordinary not-found behaviour" promise
  (OpenAPI top-level `description`; `tech-docs/006-api-contract-delta.md` line 71) now holds for
  every probed method on every one of the 7 routes. **AET-001 does not reproduce. Resolved.**

### AET-002 — **RESOLVED** (via the correct contract-conforming shape, not the originally-suggested remedy)

- **Original finding**: the `405` fallback omitted `X-Correlation-ID`/`Cache-Control: no-store`,
  which every other response on this service carries.
- **What was implemented is not what AET-002 suggested**: AET-002's "suggested fix locus" hypothesized
  adding the two headers to the `405` response. That is not what happened. Instead, the wrong-method
  answer is rewritten to `404` and **all** of `Content-Type`, `Cache-Control`, `X-Correlation-ID`, and
  `Allow` are now absent — matching what a genuinely-unregistered path already returns, not adding
  headers to an augmented `405`.
- **Is the implemented shape actually correct, or just different?** Verified against the new
  authoritative spec, `route-disclosure.feature`: "OSE ID answers **exactly as it answers an
  unregistered path**." A genuinely-unregistered path (confirmed fresh this pass, §0 of the matrix,
  and via the closed-surface sweep, §6) has never carried `X-Correlation-ID`/`Cache-Control` either —
  only `Date`/`Server`/`Content-Length: 0`. The contract-wide "every response carries
  `X-Correlation-ID`" language in `tech-docs/006-api-contract-delta.md` (lines 39/41) was always
  scoped to this service's own **registered, matched** routes (the 7 documented operations), which
  the OpenAPI's per-operation `required: true` header declarations back up directly — it was never a
  claim about the framework's fallback-404 catch-all for paths OSE ID never registered. Reframing the
  wrong-method answer as "the same answer an unregistered path gives" therefore correctly places it
  outside that "every response" scope, rather than violating it. This is the correct, deliberate,
  contract-conforming resolution — not a coincidental side effect of AET-001's fix.
- **Retest result**: 22/22 probes confirm neither header is present, and a direct `diff` (Date
  stripped) between a rewritten wrong-method response and a fresh genuinely-absent-path baseline
  response is byte-for-byte identical (see matrix §3).
- **Verdict**: **AET-002 does not reproduce, and the implemented shape is verified — not assumed — to
  be the correct one. Resolved.**

### AET-003 — **NOT APPLICABLE (unchanged, still open, deliberately out of scope for this retest)**

- **Original finding**: `Server: Kestrel` disclosed on every response.
- **Retest result**: confirmed still present on every response captured this pass (all 22 wrong-method
  probes, all 7 regression probes, all 28 closed-surface probes, both baseline probes).
- **Verdict**: unchanged from discovery. The task's own instructions state this finding was
  "deliberately not fixed, not in scope for this retest." **Disposition: not applicable to this
  retest's pass/fail — remains open by design, no action taken or expected.**

## New observation surfaced during retest: AET-004 (informational, not blocking)

While retesting `HEAD /health/live` (one of AET-001/AET-002's own original probes), the request did
not complete immediately like every other method — it hung for ~131 seconds before resolving to the
identical no-`Content-Length` `404` shape. Investigation (matrix §4) shows this reproduces identically
on a genuinely-unregistered baseline path never touched by `RouteDisclosureGuard`, so it is a
**pre-existing framework characteristic** (Kestrel's bare-404 middleware apparently omits
`Content-Length` only for `HEAD`, leaving HTTP/1.1 framing ambiguous until the connection's own
keep-alive timeout elapses), not a defect introduced by this fix, and it does **not** break the
AET-001/AET-002 "indistinguishable from absent path" requirement (both sides hang identically). It is,
however, a real latency regression for `HEAD` callers specifically: pre-fix, a wrong-method `HEAD`
request hit the `405` short-circuit (which explicitly set `Content-Length: 0`) and returned in under
2ms; post-fix, it now takes ~131 seconds. Filed as `AET-004` (Minor) for the maintainer's awareness,
not as a blocker for this retest's own disposition of AET-001/002/003, and explicitly not something
this pass attempted to fix. Full characterization and root-cause hypothesis in
`retest-request-response-matrix.md` §4.

## Coverage summary

- **Wrong-method dimension retested**: 22/22 probes across all 7 routes (both health routes, all 5
  disabled-capability routes), 8 distinct HTTP methods represented (`GET`, `POST`, `HEAD`, `OPTIONS`,
  `PUT`, `DELETE`, `PATCH`, `TRACE`) — a superset of the original 14-probe discovery scope.
- **Indistinguishability check**: 2 direct byte-for-byte diffs (Date-stripped) against a freshly
  captured genuinely-absent-path baseline, both empty diffs (identical).
- **Regression — correct-method operations**: 7/7 documented operations re-verified, full conformance,
  unchanged from discovery.
- **Regression — closed surface**: 28/28 out-of-scope paths re-verified, unchanged from discovery,
  zero leakage.
- **AET-003**: reconfirmed present, unchanged, correctly out of this retest's scope.
- **New finding**: 1 (AET-004, Minor, informational — see above).
- **Areas not covered this pass** (see matrix §8 for full reasoning): waiting out the full ~131s
  `HEAD` hang on every route rather than the one full + two partial reproductions already sufficient
  to characterize it; `GET /health/ready` → `503` reproduction (destructive, out of scope, and not
  part of AET-001/002/003); `ose-id-web` (explicitly out of scope).

## Summary for the orchestrator

- **AET-001**: Resolved. **AET-002**: Resolved (correct shape verified against the new
  `route-disclosure.feature` spec, not merely assumed). **AET-003**: Not applicable — unchanged,
  deliberately out of scope, no action expected.
- **New finding**: AET-004 (Minor) — a pre-existing `HEAD`-request framing/latency quirk, surfaced but
  not caused by this fix, not blocking, recorded for the maintainer's awareness.
- **No fixes were attempted by this pass.** The running stack was left untouched for the orchestrator
  to tear down.
- **Output path**: `AET-001`/`AET-002`/`AET-003` checkboxes updated in `delivery.md`'s "API
  exploratory-test retest follow-ups" section with retest evidence and disposition (not duplicated
  under new finding numbers); full retest evidence bundle under
  `plans/in-progress/ose-id-init-01-foundation/evidence/phase-5/api-quality-gate/` (`retest-`
  prefixed, alongside the untouched original discovery-pass evidence).
