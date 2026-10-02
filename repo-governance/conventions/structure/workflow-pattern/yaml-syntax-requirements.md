---
description: Which characters require quoting in workflow YAML frontmatter, with good/bad examples, to avoid breaking some YAML parsers.
when_to_use: Use when writing or reviewing a workflow's YAML frontmatter and unsure whether a value needs quoting.
---

# YAML Syntax Requirements

**CRITICAL**: All YAML frontmatter values containing special characters MUST be wrapped in quotes to prevent parser errors in some YAML parsers.

**Characters requiring quotes**:

- Colon `:` (most common)
- Square brackets `[`, `]`
- Curly braces `{`, `}`
- Hash `#`
- Ampersand `&`
- Asterisk `*`
- Exclamation mark `!`
- Pipe `|`
- Greater-than `>`
- Single quote `'`
- Double quote `"`
- Percent `%`
- At sign `@`
- Backtick `` ` ``

**Quoting guidelines**:

- Use double quotes `"` for consistency
- Quote ALL values containing special characters, not just the character itself
- Escape inner quotes if needed: `"Description with "quoted" text"`
- Quote complex descriptions containing colons (e.g., mode descriptions with multiple options)

**Examples**:

Good:

```yaml
description: "Validates repository consistency across all layers in at most three bounded cycles and returns one verdict"
when_to_use: "Use when a quality threshold must be chosen (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, all: every level)"
```

Bad:

```yaml
description: Validates repository consistency across all layers: unquoted colons break some parsers
when_to_use: Use when a quality threshold must be chosen (lax: CRITICAL only, normal: CRITICAL/HIGH)
```

Frontmatter carries only `description` and `when_to_use`, and both are prose that regularly contains
a colon — which is exactly why this rule still binds. A workflow's enum values, defaults, and goal
now live in the body, where Markdown quoting rules apply instead of YAML's.

**Why this matters**:

- Unquoted colons break some YAML parsers (they may display raw frontmatter or fail to load)
- YAML parsers interpret unquoted special characters as syntax, not content
- Quoted values ensure consistent parsing across all tools (GitHub, static site generators, editor previews)
