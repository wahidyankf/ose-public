---
description: "A completeness claim needs a diff, not a text search."
when_to_use: "Use before citing a search as proof a list is complete."
---

# A completeness claim requires a diff against enumerated ground truth, not a text search

Text search finds what you thought to look for. It cannot find what a document **omits**. To assert
that a document enumerates all of something, enumerate the ground truth independently and **diff**
the two sets. Three blind-spot classes in the plan that authored this rule were found only this
way — never by searching text.

**Ground truth is frequently NOT a file on disk.** A completeness contract that assumes on-disk
artifacts reproduces the exact class of gap it means to catch. Enumerate from whatever authority
actually owns the set:

| Set being claimed complete  | Authoritative enumeration command                            |
| --------------------------- | ------------------------------------------------------------ |
| Deploy/environment branches | `git branch -r`                                              |
| Agents                      | `find .agents/agents -name '*.md' ! -name README.md -print0` |
| Nx targets on a project     | `nx show project <name> --json`                              |
| Declared dependencies       | `jq` over `package.json` / `Cargo.toml`                      |
| Committed files of a kind   | `git ls-files '<pattern>'`                                   |

**Recipe**:

```bash
# 1. Enumerate ground truth from its owning authority
git branch -r | sed 's#^ *origin/##' | command grep -E '^(prod|stag)-' | sort > /tmp/truth.txt
# 2. Enumerate what the document claims
command grep -oE '(prod|stag)-[a-z0-9-]+' AGENTS.md | sort -u > /tmp/claimed.txt
# 3. Diff — anything in truth but not claimed is an uncovered case
comm -23 /tmp/truth.txt /tmp/claimed.txt
```

A non-empty left column is a completeness violation, regardless of how many text searches returned
"looks fine".
