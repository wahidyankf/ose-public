---
description: "Defines optional frontmatter fields an agent definition may include beyond the required set."
when_to_use: Use when deciding whether to add an optional frontmatter field to an agent.
---

# Agent File Structure — Optional Frontmatter Fields

The canonical agent schema has exactly two optional fields, `skills` and `constraints`, defined with the
[required fields](./agent-file-structure-required-frontmatter.md). `./rhino metadata validate` rejects every other key,
including a `created` date.

**Note**: The `updated:` field is NOT used in agent frontmatter. Per the [No Manual Date Metadata Convention](../../../conventions/structure/no-date-metadata.md), non-website markdown files must not carry `updated:` fields — git history is the authoritative change record.

**Best Practices:**

- Do NOT add `updated:` or `created:` — use `git log --follow -- <file>` to find when an agent was added or changed
- Place `skills`, then `constraints`, after the five required fields
