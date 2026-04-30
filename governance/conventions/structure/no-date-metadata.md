---
title: "No Manual Date Metadata Convention"
description: Non-website markdown files must not contain manual date metadata of any kind. Git history is the single source of truth for when files changed and why.
category: explanation
subcategory: conventions
tags:
  - conventions
  - frontmatter
  - maintenance
  - git
created: 2026-04-25
---

# No Manual Date Metadata Convention

Non-website markdown files in this repository must not contain manual date metadata of any kind: no `updated:` frontmatter fields, no `**Last Updated**` footer blocks, and no inline body date annotations such as `- **Created**: YYYY-MM-DD` or `- **Last Updated**: YYYY-MM-DD`. Git history is the authoritative, drift-free record of when files changed and why. Manual date fields create maintenance overhead, drift the moment any file is touched, and add zero information value over what `git log` already provides.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Removing manual date tracking eliminates a maintenance burden that grows with every file edit. Fewer fields to maintain means less surface area for drift and audit noise.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Git provides automatic, authoritative, tamper-evident change tracking. Manual date fields duplicate this information poorly — git does it better without any human effort.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: By explicitly banning all forms of manual date metadata from non-website files, this convention makes the rule unambiguous. No exceptions to remember, no judgment calls about whether to update the date, no false signals to readers.

## Purpose

Manual `updated:` fields, `**Last Updated**` footers, and inline body annotations like `- **Created**: 2025-12-01` were intended to signal content age. In practice they:

- **Drift immediately**: Any edit to a file should update the date, but this is easy to forget and impossible to enforce automatically
- **Create audit noise**: Governance quality gate runs flag date mismatches and stale annotations as real findings, requiring multiple fix iterations that add no value
- **Duplicate git**: `git log --follow -- <file>` gives the same information with full commit message context and author attribution
- **Mislead readers**: A stale date signals "this content is old" when the file may simply not have needed updates
- **Pollute document bodies**: Inline `- **Created**: 2025-12-01` annotations in agent or convention files are visible to every reader but answer no question that git does not already answer

The `created:` frontmatter field is unaffected by this convention. It is set once at file creation, never updated, and does not drift.

## Scope

### Files Subject to This Convention (non-website files)

All markdown files outside the website app directories:

- `governance/` — conventions, development practices, principles, workflows, vision
- `docs/` — tutorials, how-to guides, reference, explanation
- `.claude/agents/` — agent definition files
- `.claude/skills/` — skill package files
- `plans/` — planning documents (backlog, in-progress, done, ideas)
- `specs/` — Gherkin feature files and OpenAPI contracts
- Root-level markdown files (`README.md`, `AGENTS.md`, `LICENSING-NOTICE.md`, etc.)

### Files Exempt from This Convention (website content)

Content files under the following app directories that render in the UI may keep their dates because human readers see "last updated" in the browser and it communicates content freshness directly:

- `apps/ayokoding-web/` — educational platform content
- `apps/oseplatform-web/` — platform marketing content
- `apps/organiclever-web/` — product landing site content
- `apps/wahidyankf-web/` — personal portfolio content

The `date:` field in oseplatform-web post frontmatter (publication date, not maintenance date) is also unaffected.

### The `created:` Frontmatter Field is Unaffected

The `created:` frontmatter field is permitted and encouraged in governance, docs, and agent files. It is set once at creation and never changes, so it cannot drift. It answers "when was this file first added?" — a question git can answer but less conveniently.

### Dates Inside Actual Content Are Unaffected

Dates that appear inside actual document content — changelog entries, plan steps, commit references, examples, tutorial narrative — are not affected by this convention. The rule targets standalone metadata annotation lines only.

## Standards

### Standard 1: No `updated:` in YAML Frontmatter

Non-website markdown files MUST NOT contain an `updated:` field in their YAML frontmatter block.

FAIL — forbidden:

```yaml
---
title: "Example Convention"
created: 2025-11-22
updated: 2026-04-19
---
```

PASS — correct:

```yaml
---
title: "Example Convention"
created: 2025-11-22
---
```

### Standard 2: No `**Last Updated**` Footer Blocks

Non-website markdown files MUST NOT contain a `**Last Updated**` footer block. The typical pattern is a `---` horizontal rule separator followed by a `**Last Updated**: YYYY-MM-DD` line at the end of the file — both the separator and the line must be absent.

FAIL — forbidden (at end of file):

```markdown
...last paragraph of content...

---

**Last Updated**: 2026-04-19
```

PASS — correct (file ends after last content paragraph):

```markdown
...last paragraph of content...
```

### Standard 3: Misplaced `**Last Updated**` Lines Must Also Be Removed

Some files have `**Last Updated**` embedded in the middle of the document body rather than at the end. These must also be removed regardless of position.

### Standard 4: No Inline Date Annotations in Document Body

Non-website markdown files MUST NOT contain standalone inline date annotation lines in the document body. These are lines that exist solely to record metadata dates for human readers, not actual document content.

The most common patterns to remove:

- `- **Created**: YYYY-MM-DD`
- `- **Last Updated**: YYYY-MM-DD`
- `**Created**: YYYY-MM-DD` (standalone line, not part of a content paragraph)
- `**Version**: x.y — YYYY-MM-DD` (version-date annotation lines)

FAIL — forbidden inline body annotations in agent files:

```markdown
## Agent Metadata

- **Role**: Maker (blue)
- **Created**: 2025-12-01
- **Last Updated**: 2026-04-19
```

PASS — correct (remove the date annotation lines, keep the role):

```markdown
## Agent Metadata

- **Role**: Maker (blue)
```

FAIL — forbidden in convention documents:

```markdown
## Document History

- **Created**: 2025-11-22
- **Last Updated**: 2026-04-19
```

PASS — correct (remove the section entirely or keep only non-date content):

The section adds nothing git does not provide. Remove it.

**Important distinction**: This rule targets standalone metadata annotation lines. A date mentioned inside an actual content paragraph — for example, "This pattern was introduced in the 2025-12-01 refactor" — is content, not a metadata annotation, and is unaffected.

### Standard 5: How to Find the Authoritative Change Date

Use git to find when a file was last changed:

```bash
git log --follow --oneline -1 -- path/to/file.md
git log --follow --format="%ad %s" --date=short -- path/to/file.md
```

This gives the date, commit message, and full context — far more informative than a bare date in frontmatter or an inline annotation.

## Examples

### Agent File — Before and After

FAIL — agent body with inline date annotations:

```markdown
## Agent Metadata

- **Role**: Maker (blue)
- **Created**: 2025-12-01
- **Last Updated**: 2026-03-15

**Model Selection Justification**: ...
```

PASS — agent body without date annotations:

```markdown
## Agent Metadata

- **Role**: Maker (blue)

**Model Selection Justification**: ...
```

### Convention File — Before and After

FAIL — convention with `updated:` frontmatter:

```yaml
---
title: "Example Convention"
description: An example.
category: explanation
subcategory: conventions
created: 2025-11-22
---
```

PASS — convention without `updated:` frontmatter:

```yaml
---
title: "Example Convention"
description: An example.
category: explanation
subcategory: conventions
created: 2025-11-22
---
```

## Migration

All existing violations in non-website files should be removed:

1. Remove `updated:` from YAML frontmatter
2. Remove `**Last Updated**` footer blocks (including the preceding `---` separator if it was added solely for the footer)
3. Remove standalone inline body date annotation lines (`- **Created**: date`, `- **Last Updated**: date`, etc.)

No replacement content is needed for any of these removals. The information they contained is already in git history.

When removing a `---` footer separator, confirm it is the final `---` in the file and not the YAML frontmatter closing delimiter or a section horizontal rule inside the document body. The safe pattern is: `\n---\n\n**Last Updated**:` appearing at or near the end of the file.

## Tools and Automation

- **`repo-rules-checker`** — validates that non-website markdown files do not contain `updated:` frontmatter, `**Last Updated**` footer blocks, or inline body date annotations
- **`repo-rules-fixer`** — removes these fields from non-website files when found

## References

**Related Conventions:**

- [Convention Writing Convention](../writing/conventions.md) — meta-convention for how to structure convention documents; its frontmatter example must not include `updated:`
- [File Naming Convention](./file-naming.md) — kebab-case naming rules for all files

**Related Development Practices:**

- [AI Agents Convention](../../development/agents/ai-agents.md) — frontmatter field requirements for agent files; body annotation cleanup applies to agent files

**Agents:**

- `repo-rules-checker` — enforces this convention during governance audits
- `repo-rules-fixer` — removes disallowed fields from non-website files
