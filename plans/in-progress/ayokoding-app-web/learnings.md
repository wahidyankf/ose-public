# Learnings: ayokoding-app-web

<!-- Append sanitized observations during implementation. Triage every entry before archival. -->

## L1 — Temporary staging can fail before a scanner judges content

- Observed (2026-10-26): the full tracked-tree public-safety scan failed while staging inputs.
  Filesystem free-space output did not reveal the per-user temporary-filesystem quota. A bounded
  reproduction identified cross-device hardlink failure followed by a copy quota error.
- Resolution: task-owned temporary staging on the repository filesystem allowed hardlinks;
  the unchanged baseline, diff and pre-commit checks all passed. No check or resource floor was
  weakened, and no source repair was required.
- Routing state: pending Phase 4 review of whether existing setup guidance already covers this
  diagnostic. Keep machine names, paths and bounds in ignored runtime evidence.

## L2 — Build outputs and cache copies have separate storage costs

- Observed (2026-10-26): the full static build finished, then the task was stopped while Nx
  copied its output into cache. The cache entry was unpublished, belonged to this exact task,
  and duplicated completed build bytes. A successful compiler result did not prove the full
  Integration target had run.
- Resolution so far: removed only the verified unpublished entry after checking ownership,
  byte identity, open handles and protected paths. The documented cache-disable option retains
  the complete dependency graph. Storage pressure cleared; a separate memory-pressure failure
  still requires the original full target to pass.
- Routing state: pending Phase 4 review after full-target proof. Do not turn one machine's
  storage measurements into a global policy or delete unrelated caches.

## L3 — Collection-time input sessions outlive scenario cleanup

- Observed (2026-10-26): calculator steps created input-driver sessions while collecting
  scenarios. Releasing the rendered DOM alone did not release those scenario-held sessions.
- Resolution: independent lazy sessions are released through the actual scenario teardown;
  regression tests prove lazy allocation, independent sessions and keyboard-state reset.
  The full quick target passed all 4,180 tests with the original coverage floor. A separate
  weak-reference probe was inconclusive and is not evidence of garbage-collector causality.
- Routing state: the scoped repair and regression tests are the candidate durable owner;
  Phase 4 must confirm delivery and record the final disposition.

## L4 — Criticality and repair confidence answer different questions

- Observed (2026-10-26): an initial interpretation treated medium-criticality semantic findings
  as requiring a person, although their repair confidence was high.
- Resolution: reread the existing application procedure and orthogonal classification rule.
  Revalidation and authority determine whether a fix can proceed; criticality sets importance.
  The interpretation was corrected before any source repair or user escalation.
- Routing state: pending Phase 4 triage; the governing rule already states this distinction,
  so another duplicated rule may add no durable value.
