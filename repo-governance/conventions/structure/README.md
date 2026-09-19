---
description: Documentation organization frameworks, file naming, and project planning structure
when_to_use: Use when deciding where a document belongs, how to name it, or how a plan record moves through its lifecycle.
---

# Structure Conventions

Use these conventions to decide where a document belongs, how to name it, and how planning records move through their lifecycle. They answer the practical question: **"How should this repository stay navigable as it grows?"**

## Documents

- [App README vs Specs Convention](./app-readme-vs-specs.md) — Defines what content lives in app/infra READMEs vs specs/, the logical-owner-corpus spec tree shape, and the PM-readability contract for specs/. Use when deciding whether content belongs in an app README or in its specs/ tree, or when shaping a specs/apps/ tree.
- [Deterministic vs AI Validation Split Convention](./deterministic-vs-ai-validation-split.md) — Defines which governance validation layer (deterministic preflight vs AI checker) owns which category, and the contract between them. Use when deciding whether a governance validation rule belongs in the deterministic preflight or the AI checker.
- [Diátaxis Framework](./diataxis-framework.md) — Understanding the Diátaxis documentation framework used in open-sharia-enterprise. Use when deciding where new documentation belongs or organizing content by Diátaxis category.
- [File Naming Convention](./file-naming.md) — Standard markdown + GitHub-compatible kebab-case naming for all files. Use when naming a new file under docs/, repo-governance/, or a similar repository location.
- [Governance Frontmatter Convention](./governance-frontmatter.md) — The two-key frontmatter allow-list every file under repo-governance/ obeys — description and when_to_use, and nothing else. Use when authoring or reviewing a governance file's frontmatter, or when tempted to add a metadata key to that tree.
- [Governance README Completeness Convention](./governance-readme-completeness.md) — Two-gate README index enforcement — orphan/ghost link detection plus missing/unannotated completeness checks. Use when a directory's README.md fails an orphan, ghost, missing, or unannotated finding.
- [Governance Vendor-Independence Convention](./governance-vendor-independence.md) — Governance prose must be vendor-neutral; vendor-specific bindings belong in platform-binding directories, not in repo-governance/. Use when writing or reviewing repo-governance/, AGENTS.md, or CLAUDE.md prose and checking it stays vendor-neutral.
- [Governance Word-Budget Convention](./governance-word-budget.md) — Per-surface word thresholds for auto-loaded instruction files, enforced by Rhino and git hooks. Use when a governance or instruction file may be approaching or over its word-count threshold.
- [Governance Word-Budget Remediation](./governance-word-budget-remediation.md) — Enforcement-point detail, the progressive-disclosure fix, and forbidden anti-fixes for the word-budget gate. Use when a file fails the word-budget gate and you need the remediation steps.
- [Learning-Plan `syllabus/` Folder Convention](./learning-plan-syllabus.md) — Defines the learning-bearing plan trigger, required syllabus/ folder layout, section tiering, course template, corpus disposition, and custody rule. Read this before authoring or restructuring course content inside a plan's syllabus/ folder, or when consuming another plan's syllabus corpus.
- [Per-Directory Licensing Convention](./licensing.md) — Standards for the per-directory licensing strategy using MIT for all code in this repository. Read this when you need the licensing rule set — placing a LICENSE file, checking copyright notice format, or auditing compliance.
- [Multi-Harness Binding Convention](./multi-harness-binding.md) — Rules governing how this repository stays compatible with many AI coding-agent harnesses while keeping AGENTS.md as the single canonical instruction surface. Read this before adding, changing, or auditing any file that wires a coding-agent harness to the repository.
- [No Manual Date Metadata Convention](./no-date-metadata.md) — Non-website markdown files must not contain manual date metadata of any kind; git history is the single source of truth. Read this before adding, reviewing, or removing any date field in a non-website markdown file.
- [No Last Updated Convention](./no-last-updated.md) — Superseded stub — redirects to No Manual Date Metadata Convention. Read this only if you were linked here directly.
- [Ordinal Filename Prefixes Convention](./ordinal-filename-prefixes.md) — When a governed markdown filename may carry a leading NN- ordinal, and when the parent index carries order instead. Use when naming or renaming a governed markdown file whose name starts with a number, or when splitting a document into shards.
- [Plan Validator Contract](./plan-validator-contract.md) — Freezes the plan-structure validation contract — inputs, rule identifiers, messages, exit classes, the shared fixture corpus, and what is deliberately not validated. Use before implementing a plan-structure validator, or when checking that two implementations still agree.
- [Plans Organization Convention](./plans.md) — Standards for organizing project planning documents in plans/ folder. Use when deciding where a plan document belongs, how to name/structure it, or how it moves through the lifecycle.
- [Post-Mortem Convention](./post-mortems.md) — Standards for blameless incident post-mortems — location, naming, mandatory sections, severity scale, and action-item tracking. Read this when you need to write, name, or review a blameless incident post-mortem.
- [Programming Language Documentation Separation Convention](./programming-language-docs-separation.md) — Establishes the relationship between docs/explanation/ style guides and ayokoding-www educational content. Read this when deciding whether new programming-language content belongs in a style guide or in ayokoding-www.
- [Related Repositories Convention](./related-repositories.md) — Names the five OSE Code Repositories and defines the two-repository parity set within them, independent upstream/product boundaries, required awareness surfaces, and public-to-private propagation scope. Read this before changing cross-repository references or shared boundaries.
- [Specs Directory Structure Convention](./specs-directory-structure.md) — Canonical logical-owner-corpus directory structure for specs/ — Gherkin feature files, as-built architecture documents, and OpenAPI contracts. Read this when placing a spec artifact or scaffolding specs/ for a new app or library.
- [Worktree Path Convention](./worktree-path.md) — Defines the worktree directory structure, naming convention, and gitignore requirements for claude --worktree routing. Read this when creating, naming, or cleaning up a worktree, or configuring the WorktreeCreate hook.

## Related Documentation

- [Writing Conventions](../writing/README.md) — Content quality standards
- [Formatting Conventions](../formatting/README.md) — Markdown syntax and visual elements
- [Tutorials Conventions](../tutorials/README.md) — Tutorial creation standards
- [Repository Governance Architecture](../../repository-governance-architecture.md) — Six-layer governance model
