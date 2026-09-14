---
description: "A measured example, plus a verification recipe."
when_to_use: "Use for a worked example before trusting a zero result."
---

# Absence and Completeness Claims (HARD): Zero-Result Search Evidence (part 2)

**Measured example from this repository** — one query, one tree, three commands:

| Command                                         | Result   | What it actually means          |
| ----------------------------------------------- | -------- | ------------------------------- |
| `grep -r <pat> --glob '*.md' . 2>/dev/null`     | 0 hits   | Tool rejected the flag and died |
| `command grep -rn --include='*.md' <pat> .`     | 377 hits | Ran correctly                   |
| `/opt/homebrew/bin/rg -l --glob '*.md' <pat> .` | 69 files | Ran correctly (file counts)     |

The cause: in this environment `grep` resolves to **`ugrep`**, which REJECTS ripgrep's `--glob`
flag. Combined with `2>/dev/null`, a hard failure was indistinguishable from a clean sweep. Related
tool traps documented elsewhere in this repo: `grep -L` means _follow symlinks_, not
_files-without-match_, so a `grep -L` acceptance clause reads as passing unconditionally.

**Verification recipe** (run BEFORE citing any zero result):

```bash
# Prefer an absolute path to the tool whose flag syntax you are using
/opt/homebrew/bin/rg -n --glob '*.md' 'Delivery Mode' repo-governance/   # rg syntax
command grep -rn --include='*.md' 'Delivery Mode' repo-governance/       # POSIX syntax
# Never: grep -r --glob '*.md' ... 2>/dev/null

# Known-positive control probe: this MUST return non-zero before a zero result is trusted
command grep -rn --include='*.md' 'Delivery Mode' repo-governance/ | head -1

# Do not parse `ls` — its output can carry hyperlink escapes that corrupt catalogue diffs
find repo-governance -name '*.md' -print0 | xargs -0 -n1 basename | sort
```
