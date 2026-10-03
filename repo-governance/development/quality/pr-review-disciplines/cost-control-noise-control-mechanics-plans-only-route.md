---
description: "Defines the freshly recomputed specialist route and mandatory probes for plans-only PRs."
when_to_use: "Use when the current PR cycle may contain only qualifying hand-authored plan artifacts."
---

# Cost/Noise Control: Plans-Only Review Route

## Route Test

Recompute this route from the current diff every cycle. It applies only when the entire
hand-authored diff consists of `plans/**` documents, their required indexes, and required
non-executable assets referenced by those documents: binary mockups, exported images, or editable
diagram/design sources under plan-local `assets/`. Executable source or scripts,
runtime/build/tool configuration or manifests, tests or fixtures, runnable prototypes,
unreferenced assets, and unrelated files force the standard route even inside a plan directory.
Use the binding ownership registry by file and region: only wholly generated files and generated
regions are ignored; vendored files and hand-authored regions participate in the test.

Record the ordinary trivial/lite/full risk tier. For `lite` and `full`, select these five
specialists plus `pr-review-checker` as coordinator:

- `pr-review-security-checker`
- `swe-architect` (Lens mode)
- `pr-review-logic-checker`
- `pr-review-docs-checker`
- `pr-review-governance-checker`

For `trivial`, select no specialists. The coordinator performs one generalist pass which runs the
primary security probe first, then covers architecture/design, domain intent and Gherkin,
documentation quality, and governance conformance. This preserves all five concerns without a
six-pass trivial review.

Record the plans-only verdict and every selected or skipped specialist in the human-readable
review-route record.

## Review Focus

The separate mandatory [`pr-leak-review`](../../../workflows/quality/pr-leak-review.md) owns real
secrets, protected environment properties, and machine-specific paths for every exact PR head.
The optional plans-only semantic route consumes that authenticated evidence and does not repeat the
predicate. Architecture reviews architecture and design decisions made by the plan. Logic reviews domain
intent and Gherkin acceptance-criteria completeness. Documentation reviews the plan as the shipping
artifact for substantive quality and completeness. Governance reviews mechanical conformance.

Suppress findings that merely complain that eventual implementation artifacts are absent from the
plans-only PR. Later implementation correctness belongs to the PR that ships that implementation;
the plan's own architecture, domain criteria, contradictions, omissions, and rule violations remain
in scope.

For every non-plans-only PR, security-sensitive paths still force `full` regardless of size. The
standard full-tier Content-Type Applicability Filter also remains unchanged.

## Enforcement

**Enforcement disposition — split.** `pr-leak-review` provides mandatory current-head evidence.
Explicit `pr-review` routes a plans-only pass and records every selected or skipped specialist.

## Related

- [Risk-Tier Fan-Out](./cost-control-noise-control-mechanics-risk-tier-fan-out.md) — standard tier
  calculation and specialist selection.
- [What Code-Related Means](what-code-related-means.md)
  — why the plan remains a blocking shipping artifact.
