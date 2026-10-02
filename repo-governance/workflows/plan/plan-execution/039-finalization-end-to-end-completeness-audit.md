---
description: Reconciles the full plan from its first requirement through final proof before completion can be declared.
when_to_use: Use preliminarily after pre-archival gates pass, then repeat terminally after the final delivery is pushed or merged and before assigning pass.
---

# Finalization and Archival — End-to-End Delivery Completeness Audit

Checked boxes and zero isolated findings are necessary but do not prove that the planned outcome
was delivered. Use two ordered passes over one reconciliation table:

1. **Preliminary pass, before archival:** account for every requirement and proof already available.
   Only proof that inherently depends on the archival commit, replacement exact-head CI/leak review,
   merge, or permitted direct push may be marked `Pending final delivery`; every other gap reopens
   execution.
2. **Terminal pass, after delivery:** replace every pending row with proof from the actually pushed
   or merged head. No pending, stale, inferred, or unsupported row may remain before `pass`.

Build a reconciliation table that accounts for:

- the approved scope, goals, and non-goals;
- every canonical PRD acceptance criterion by stable ID or exact scenario title;
- every delivery unit and its independently useful, reviewable, verifiable, operable, and revertible
  natural seam, including the Delivery Boundaries table, atomic-consistency proof, resulting
  production-deployable `main` state, and applicable flag tests and rollout/rollback/removal record;
- the as-built implementation, repository documentation, rules-propagation manifest, and exact C4
  updates where applicable;
- automated tests, CI gates, and required manual UI/API/full-stack verification evidence;
- schema contracts, migration reconciliation, rollout, rollback, and no-loss evidence where
  applicable;
- every conditional recovery, deferred proposal, and follow-up item with its executed,
  `Not triggered`, explicitly authorized deferral, or other governed terminal disposition; and
- every Knowledge Capture entry and its terminal routing state.

For every row, cite the plan source, delivered artifact or PR, and proof. Do not infer completion
from checkbox state alone. A missing requirement, unsupported claim, stale proof, unexplained scope
change, or non-terminal item reopens execution at the earliest affected delivery packet. Update the
harness task list and `delivery.md`, run the applicable phase/surface gates again, and restart the
preliminary-to-terminal sequence. Status may become `pass` only after the terminal pass proves the
whole trace against the delivered head.

This audit composes with, and never replaces or weakens, the existing pre-archival tester, exact-
head CI, infra-execution, Knowledge Capture, merge, cleanup, and archival controls.
