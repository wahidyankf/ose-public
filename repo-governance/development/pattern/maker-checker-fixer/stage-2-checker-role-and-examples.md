---
description: "The checker's role, tool pattern, color, and example agents."
when_to_use: "Use to identify which checker agent to use."
---

# Stage 2: Checker — Role and Examples

**Role**: Validates content against conventions and generates audit reports

**Characteristics**:

- **Validation-driven** - Analyzes existing content for compliance
- **Non-destructive** - Does NOT modify files being checked
- **Comprehensive reporting** - Generates detailed audit reports in `local-tmp/<agent-family>/`
- **Evidence-based** - Re-validates findings to prevent false positives (in fixer stage)

**Tool Pattern**: `Read`, `Glob`, `Grep`, `Write`, `Bash` (read-only + report generation)

- `Write` needed for audit report files
- `Bash` needed for UTC+7 timestamps in report filenames

**Color**: 🟩 Green (Checker agents)

**Examples**:

| Agent                                 | Validates                                                                                                                                        | Generates Report                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| rules-checker                         | AGENTS.md, agents, conventions, documentation (preflight JSON consumed; report has `## Deterministic Findings` + `## AI-Only Findings` sections) | `repo-rules__{uuid-chain}__{timestamp}__audit.md`               |
| apps-ayokoding-www-general-checker    | General Next.js content (frontmatter, links)                                                                                                     | `ayokoding-web__{uuid-chain}__{timestamp}__audit.md`            |
| apps-ayokoding-www-by-example-checker | By-example tutorials (coverage, annotations)                                                                                                     | `ayokoding-web-by-example__{uuid-chain}__{timestamp}__audit.md` |
| docs-tutorial-checker                 | Tutorial pedagogy, narrative flow, visual aids                                                                                                   | `docs-tutorial__{uuid-chain}__{timestamp}__audit.md`            |
| apps-ose-www-content-checker          | Platform content (structure, formatting, links)                                                                                                  | `ose-web__{uuid-chain}__{timestamp}__audit.md`                  |
| readme-checker                        | README engagement, accessibility, jargon                                                                                                         | `readme__{uuid-chain}__{timestamp}__audit.md`                   |

**Note on Report File Naming**: The `__` (double underscore) in report filenames (e.g., `readme__{timestamp}__audit.md`) is the **report file naming separator** defined in the [Temporary Files Convention](../../infra/temporary-files.md), separating agent-family prefix, UUID chain, and timestamp. This is NOT an old agent name - it is the standard 4-part pattern: `{agent-family}__{uuid-chain}__{timestamp}__{type}.md`.

**Note on `rules-checker` Two-Section Reports**: The `rules-checker` row above produces audit reports with two top-level sections — `## Deterministic Findings (Rhino preflight)` first, then `## AI-Only Findings`. The split is defined in the [Deterministic vs AI Validation Split Convention](../../../conventions/structure/deterministic-vs-ai-validation-split.md); the JSON envelope contract that drives the deterministic half is documented there as well.
