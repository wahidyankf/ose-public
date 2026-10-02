---
description: "FALSE_POSITIVE: skip, report to the user."
when_to_use: "Use when deciding whether a finding is a false positive."
---

# FALSE_POSITIVE → Skip (Report to User)

**Criteria:**

- Re-validation clearly disproves the issue
- Checker's detection logic was flawed
- Finding was based on incorrect analysis
- Content is actually compliant but checker missed it
- Checker applied wrong rules to specific context

**Decision:** Skip fix, report to user with detailed analysis and checker improvement suggestion.

**Examples Across Domains:**

**repo-workflow-fixer:**

- Checker flagged markdown headings as YAML comments (searched entire file instead of just frontmatter)
- Checker reported missing field that actually exists (case sensitivity issue)
- Checker misinterpreted file content (wrong pattern match)

**content-fixer:**

- Checker flagged overview.md in English folder but file is correct (checker confused /en/ with /id/)
- Checker flagged missing ikhtisar.md in blogging content (learning-only rule applied to wrong directory)
- Checker misidentified language path when validating filenames

**docs-tutorial-fixer:**

- Checker reported missing Introduction section but section exists (titled "Introduction to Topic")
- Checker reported missing diagram but diagram exists (different Mermaid syntax or placement)
- Checker misinterpreted tutorial type (tutorial follows convention correctly)

**content-fixer:**

- Checker flagged Next.js MDX link as broken (doesn't recognize component-style link syntax)
- Checker applied post validation rules to static page (about.md doesn't need date field)
- Checker counted code block as prose paragraph (wrong content type detection)

**readme-fixer:**

- Checker flagged valid acronym expansion as missing (expansion exists nearby)
- Checker counted lines incorrectly (markdown formatting issues)
- Checker misinterpreted valid plain language as jargon (context-appropriate technical term)
- Checker flagged code block as long paragraph (wrong content detection)

**docs-fixer:**

- Checker flagged correct LaTeX as incorrect (misunderstood syntax)
- Checker reported missing field that actually exists in frontmatter
- Checker flagged valid command as broken (used wrong verification source)
- Checker misinterpreted accessible diagram colors as inaccessible
- Checker reported contradiction but statements apply to different contexts

**docs-fixer:**

- Checker reported missing section that actually exists (different heading variation)
- Checker flagged technology as "deprecated" but it's still maintained (outdated info)
- Checker reported broken link that actually works (path resolution issue)
- Checker misidentified file structure (valid edge case)

**Common Pattern:** FALSE_POSITIVE issues reveal **checker logic flaws** that need correction.
