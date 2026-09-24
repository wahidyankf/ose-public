---
description: "Provides the quick-reference summary table for all Mermaid label constraint rules."
when_to_use: "Use when you want the full label-constraint rules summarized in one quick-reference table."
---

# Common Mermaid Syntax Errors: Label Constraints — Quick Reference Summary

| Location                               | `<br/>` supported? | Max length | URL paths allowed?            |
| -------------------------------------- | ------------------ | ---------- | ----------------------------- |
| Node label line (between `<br/>` tags) | Yes                | 20 chars   | Yes (node labels render HTML) |
| Edge label `\|"text"\|`                | No                 | 20 chars   | No (`.` breaks parser)        |

**Automated check**: No gate enforces the 20-character limit above; it is a convention that
authors meet and reviewers check. The `md-mermaid` gate runs `./rhino md mermaid validate`, which
measures node and edge labels only against the 30-grapheme limit declared in `repo-config.yml`
`policies.markdown.mermaid`, and the command has no option to lower it. The validator also checks
`accTitle`/`accDescr` and the declared colour palette; it does not parse syntax or measure rank
width.

**Real-World Context**: All five rules were verified when fixing C4 architecture diagrams in the monorepo. Failures observed:

- `\n` in node labels rendered as literal `\n` (fixed by switching to `<br/>`)
- `<br/>` in edge labels rendered as literal `<br/>` text (fixed by removing HTML, using plain text)
- `"HTTPS: fetch JWKS public key"` (28 chars) clipped to `"HTTPS: fetch JWKS publ"` (fixed by shortening to `"JWKS public key"`)
- `"Single deployable backend process"` (34 chars) clipped to `"Single deployable back"` (fixed by splitting across two `<br/>` lines)
- `"GET /.well-known/jwks.json"` broke the parser at the leading `.` (fixed by replacing with `"JWKS public key"`)
