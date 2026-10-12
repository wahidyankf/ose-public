# Learnings: ayokoding-learn-revamp-02-path-model

Phase 9 triage (litmus → secret/sensitivity → repo-relevance gates). Terminal state per entry.
No entry carries secrets, absolute paths, hostnames, tokens, or `.env*` content.

## L1 — Reported without plan authorization (code-homed, needs an ideas two-pager)

- **Learning:** `ayokoding-www-fe-e2e:test:e2e` silently binds to a stale `nx` build cache:
  a cached production build bakes the previous manifest set into prerendered pages while the
  batch endpoint serves the current fixtures, producing cross-browser cascades of missing UI
  (Phase 0: landing-hero/canonical-fallback mismatches; Phase 3: same class). The durable fix
  is to build with `--skip-nx-cache` whenever the manifest set or its env differs from cache,
  or to key the build cache on `AYOKODING_WEB_MANIFESTS_DIR` + fixture contents.
- **Litmus:** keep — no durable surface catches this automatically next time.
- **Home:** `apps/ayokoding-www-fe-e2e` build wiring (code-homed) → an authorized
  `plans/ideas/` two-pager or a CI-hygiene follow-up owned outside this plan. The user did not
  literally authorize a plan artifact, so no two-pager was created (plan artifact rule).
- **Terminal state:** reported without plan authorization. Handoff evidence: Phase 0
  `evidence/phase-0-baseline.md` (stale-cache note), Phase 3 `evidence/phase-3-manifests.md`
  (fresh-build prescription), and this execution's shell history. Surfaced to the user in the
  final delivery report.

## L2 — Discarded (already caught by its own durable surface)

- **Learning:** single-shot `getComputedStyle` reads race stylesheets in flight on WebKit
  (empty string for text-decoration/pseudo content before author styles apply).
- **Reason:** the durable surface already exists — the hardened E2E steps
  (`waitForLoadState("networkidle")` before style reads, committed Phase 0) fail reliably
  without it and pass with it (4/4 green reruns). No further routing needed.
- **Terminal state:** discarded with reason above.

## L3 — Discarded (environmental, no repo-durable surface)

- **Learning:** `hippo` ephemeral sandboxes shed under host memory pressure (exit 124/130,
  process killed mid-run with no failing assertion); the same commands pass directly.
- **Reason:** host-capacity condition, not repository content — no rule, test, or doc in this
  public repo can catch or fix another machine's memory pressure. Recorded per-phase as
  substitution S1 wherever used.
- **Terminal state:** discarded with reason above.

## Required reports (plan-owned, not learnings)

- **Known follow-up:** an `ayokoding-cli paths core` subcommand wrapping `computeCore`, owned
  by plan 05 (tech-docs/README.md "Out-of-scope follow-up"). Reported to the user in the final
  delivery report.
- **Cross-plan handoffs:** plan 06 restructures the accounting paths and removes their
  allowlist entries; plan 07 does the same for ERP and deletes the marker mechanism; plan 08
  fills the capstones and gives the AI path its goal. The drafted skills input lives in the
  archived `syllabus/paths/`; the merge commit is noted in the final delivery report so those
  plans can find it.
