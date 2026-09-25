---
description: Which files this convention applies to, which website-content directories are exempt, and why the created field and in-content dates are unaffected.
when_to_use: Read this when checking whether a specific file or directory (especially website content under apps/*-www) is subject to this convention or exempt from it.
---

# No Manual Date Metadata: Scope

Which files this convention governs, which are exempt, and which date-like content is unaffected.
Part of the [No Manual Date Metadata Convention](../no-date-metadata.md).

## Files Subject to This Convention (non-website files)

All markdown files outside the website app directories:

- `repo-governance/` — conventions, development practices, principles, workflows, vision
- `docs/` — tutorials, how-to guides, reference, explanation
- `.agents/agents/` — agent definition files
- `.agents/skills/` — skill package files
- `plans/` — planning documents (backlog, in-progress, done, ideas)
- `specs/` — Gherkin feature files and OpenAPI contracts
- Root-level markdown files (`README.md`, `AGENTS.md`, `LICENSING-NOTICE.md`, etc.)

## Files Exempt from This Convention (website content)

Content files under the following app directories that render in the UI may keep their dates because human readers see "last updated" in the browser and it communicates content freshness directly:

- `apps/ayokoding-www/` — educational platform content
- `apps/ose-www/` — platform marketing content
- `apps/organiclever-www/` — OrganicLever marketing site content

The `date:` field in ose-www post frontmatter (publication date, not maintenance date) is also unaffected.

## The `created:` Frontmatter Field is Unaffected

The `created:` frontmatter field is permitted and encouraged in governance, docs, and agent files. It is set once at creation and never changes, so it cannot drift. It answers "when was this file first added?" — a question git can answer but less conveniently.

## Dates Inside Actual Content Are Unaffected

Dates that appear inside actual document content — changelog entries, plan steps, commit references, examples, tutorial narrative — are not affected by this convention. The rule targets standalone metadata annotation lines only.
