---
description: Assembles the Security & Functional Clearance Status table and writes the clearance report progressively to local-tmp/dependency-bump-planning/.
when_to_use: Use when turning per-package classifications into the final clearance table and report.
---

# Phase 3: Clearance Table & Decisions (Sequential)

Assemble the results into the policy's **Security & Functional Clearance Status** for every
package, using one of: `CLEAR`, `CLEAR (patch-of)`, `WAIVER`, `FUNCTIONAL-HOLD` (per the policy).
Append the `(KEV-listed)` suffix to any status where the CVE appears in CISA KEV.

Build the proposed bump table with columns:
**project → package → current → proposed → path → KEV-listed → EPSS score → clearance**

Record the cutoff computation from Phase 0. Mark any KEV Fast-Track escalations prominently
(e.g., `Path B → Path C (KEV Fast-Track)`) so the human checkpoint can review them first.

Write all of this progressively to
`local-tmp/dependency-bump-planning/dependency-bump-planning__<uuid>__<YYYY-MM-DD--HH-MM>__report.md`
(the `clearance-report` output) per the [Temporary Files convention](../../../development/infra/temporary-files.md).

**Output**: `clearance-report` written. Bump table + clearance statuses finalized.
