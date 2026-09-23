---
description: Workflows for keeping reader-facing documentation true, reachable, and readable, and for auditing it on request
when_to_use: Use when routing to the workflow that carries a change into the documents it affects, audits documentation, or validates style-guide separation.
---

# Documentation Workflows

Use these workflows to keep human-facing documents true to the repository. One writer carries each change into the documents it affects; one read-only gate audits them on request.

## Purpose

These workflows define **WHEN and HOW documentation is kept current and audited**: propagation writes with every change, the quality gate judges and hands its findings to propagation, and the separation gate checks one domain boundary.

## Scope

**✅ Workflows Here:**

- Carrying a change into every affected README, `docs/`, `specs/`, and project document
- Removing obsolete documents and the links that point at them
- On-request documentation audits
- Style-guide and AyoKoding separation

**❌ Not Included:**

- ayokoding-web content validation (that's ayokoding-web/)
- Governance and agent instructions (that's rules/)
- Single-agent operations (use agents directly)

## Workflows

- [docs-propagation](./docs-propagation.md) — Carries one change into every human-facing document it affects in one bounded pass: stale facts corrected, obsolete documents removed, each fact kept in its one home, and the result readable by a newcomer. Use automatically before committing a change that alters what a document describes.
- [docs-quality-gate](./docs-quality-gate.md) — Audits human-facing documents on explicit request and returns a verdict with a finite ledger, handing every finding to docs-propagation instead of editing. Use for an explicit documentation review, before a release, or to sweep a whole repository.
- [docs-software-engineering-separation-quality-gate](./docs-software-engineering-separation-quality-gate.md) — Validates separation between OSE Platform style guides and AyoKoding educational content, then fixes violations iteratively. Use after adding/updating prerequisite relationships or style-guide/AyoKoding content, or periodically for compliance.

## Related Documentation

- [Workflows Index](../README.md) - All orchestrated workflows
- [Content Quality Principles](../../conventions/writing/quality.md) - Quality standards these workflows enforce
- [Tutorial Convention](../../conventions/tutorials/general.md) - Tutorial standards
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core workflow pattern
