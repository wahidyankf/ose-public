---
description: "Provides the quick-reference summary table for all Mermaid label constraint rules."
when_to_use: "Use when you want the full label-constraint rules summarized in one quick-reference table."
---

# Common Mermaid Syntax Errors: Label Constraints — Quick Reference Summary

| Location                               | `<br/>` supported? | Max length | URL paths allowed?            |
| -------------------------------------- | ------------------ | ---------- | ----------------------------- |
| Node label line (between `<br/>` tags) | Yes                | 20 chars   | Yes (node labels render HTML) |
| Edge label `\|"text"\|`                | No                 | 20 chars   | No (`.` breaks parser)        |

**Automated enforcement**: Run `./rhino md mermaid validate` to check these rules
mechanically instead of counting characters manually. Pass `--max-label-len 20` to check the
20-character limit above; the bare default is 30, matching Mermaid's `wrappingWidth` baseline. The
`md-mermaid-strict` gate applies the 20 automatically to every changed `.md` file. The tool also
checks parallel rank width (Rule 2 above) and single-diagram-per-block.

**Real-World Context**: All five rules were verified when fixing C4 architecture diagrams in the monorepo. Failures observed:

- `\n` in node labels rendered as literal `\n` (fixed by switching to `<br/>`)
- `<br/>` in edge labels rendered as literal `<br/>` text (fixed by removing HTML, using plain text)
- `"HTTPS: fetch JWKS public key"` (28 chars) clipped to `"HTTPS: fetch JWKS publ"` (fixed by shortening to `"JWKS public key"`)
- `"Single deployable backend process"` (34 chars) clipped to `"Single deployable back"` (fixed by splitting across two `<br/>` lines)
- `"GET /.well-known/jwks.json"` broke the parser at the leading `.` (fixed by replacing with `"JWKS public key"`)
