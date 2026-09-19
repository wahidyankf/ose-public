---
name: specs-validating-structure
description: Validation methodology for specs/ folders — nine categories covering README/feature-file structural completeness, Gherkin format compliance, cross-folder consistency, C4 diagrams, cross-references, spec-to-implementation alignment, tree-shape compliance, and BDD/contracts adoption gaps. Used by specs-checker and specs-fixer.
---

# Validating Specs Structure

Methodology for validating explicitly-listed `specs/` folders (and their subfolders) for
structural completeness, content accuracy, internal consistency, and cross-folder coherence.

## Scope Rule

Validate **only** explicitly listed folders and their subfolders — never implicit discovery.
Cross-folder consistency (Category 4) runs only when 2+ folders are listed; it's skipped for a
single folder. Subfolders are always included automatically.

## Lifecycle Delegation

Quality-gate invocations may pass exact `delegated-gate-ids` under
[Lifecycle Validation Ownership](../../../repo-governance/workflows/meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md).
Do not run, re-derive, report, or fix the matching predicates: `governance-readme-index` owns
README existence/index membership; `md-links` owns internal path/fragment resolution;
`specs-structure` owns adoption, tree shape, and registered counts. Keep Gherkin journey coherence,
semantic, and cross-folder judgment. Omitted delegation
preserves standalone full behaviour. Accept `lifecycle-evidence`: checkers preserve it; fixers
scope-intersect changed files and return `updated-lifecycle-evidence`.

## The Nine Validation Categories

See [reference/validation-categories-1-4.md](reference/validation-categories-1-4.md) for
Structural Completeness (README coverage), Feature File Inventory Accuracy, Gherkin Format
Compliance, and Cross-Folder Consistency, and
[reference/validation-categories-5-9.md](reference/validation-categories-5-9.md) for C4
Diagram Consistency, Cross-Reference Integrity, Spec-to-Implementation Alignment, Spec Tree Shape
Compliance and Adoption Gaps (deterministic via `the declared spec-structure check`).

## Drift Detection, Execution Pattern, and Report Format

See [reference/drift-detection-and-reporting.md](reference/drift-detection-and-reporting.md)
for current deterministic commands, lifecycle filtering, the six-step execution
pattern, and the full audit report template.

## Fixer Mechanics

See [reference/fixer-disposition.md](reference/fixer-disposition.md) for how `specs-fixer`
maps each of the nine categories to a fix disposition (auto-fixable / requires review / skip), and
[reference/fixer-execution-and-safety.md](reference/fixer-execution-and-safety.md) for its
execution pattern, fix report format, safety rules, and changed-file capture.

## What This Methodology Does NOT Cover

Test bindings and semantic implementation (use the
[`gherkin-implementation-review`](../../../repo-governance/workflows/gherkin-implementation-review.md)),
governance docs (`rules-checker`), or runtime tests (CI). This methodology is read-only.

## Related

**Conventions**: [App README vs Specs Convention](../../../repo-governance/conventions/structure/app-readme-vs-specs.md),
[Specs Directory Structure Convention](../../../repo-governance/conventions/structure/specs-directory-structure.md).

**Agents**: `specs-checker` (implements this methodology), `specs-fixer`, `specs-maker`.
