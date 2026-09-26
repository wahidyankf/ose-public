---
description: "Provides the quick-reference summary table for all Mermaid label constraint rules."
when_to_use: "Use when you want the full label-constraint rules summarized in one quick-reference table."
---

# Common Mermaid Syntax Errors: Label Constraints — Quick Reference Summary

| Location                               | `<br/>` supported?  | Max length | URL paths allowed?            |
| -------------------------------------- | ------------------- | ---------- | ----------------------------- |
| Node label line (between `<br/>` tags) | Yes                 | 20 chars   | Yes (node labels render HTML) |
| Edge label `\|"text"\|`                | Yes (no other HTML) | 20 chars   | No (`.` breaks parser)        |

**Automated check**: The `md-mermaid` gate runs `./rhino md mermaid validate`, which fails node
and edge label segments over the 20-grapheme limit declared in `repo-config.yml`
`policies.markdown.mermaid`. The validator also checks `accTitle`/`accDescr` and the declared
colour palette; it does not parse syntax or measure rank width. The `md-mermaid-palette` gate
checks that each diagram type that applies it declares a palette `classDef default`.

**Real-World Context**: All five rules were verified when fixing C4 architecture diagrams in the monorepo. Failures observed:

- `\n` in node labels rendered as literal `\n` (fixed by switching to `<br/>`)
- `<br/>` in edge labels rendered as literal `<br/>` text at the time (fixed by removing HTML, using plain text); GitHub's Mermaid v11 now renders it as a break, so Rule 2 allows it
- `"HTTPS: fetch JWKS public key"` (28 chars) clipped to `"HTTPS: fetch JWKS publ"` (fixed by shortening to `"JWKS public key"`)
- `"Single deployable backend process"` (34 chars) clipped to `"Single deployable back"` (fixed by splitting across two `<br/>` lines)
- `"GET /.well-known/jwks.json"` broke the parser at the leading `.` (fixed by replacing with `"JWKS public key"`)
