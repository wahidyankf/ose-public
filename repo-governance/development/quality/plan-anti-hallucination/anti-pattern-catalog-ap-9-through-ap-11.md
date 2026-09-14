---
description: "Behaviour claim, cross-link, absence-search fabrication."
when_to_use: "Use as a checklist for AP-9 - AP-11."
---

# Anti-Pattern Catalog: AP-9 through AP-11

## AP-9: Citing a behaviour claim without a source

> "Vercel automatically caches static assets for 31 days..."

Behaviour claims need either a repo-doc reference, an inline `[Web-cited]` excerpt with URL + date, or `[Judgment call]`.

## AP-10: Cross-link to a file that does not exist

> "See the Foo Convention at relative path `./foo.md` ..." — when the cited target does not resolve on the current commit, this is AP-10.

Resolve the relative path and confirm the file exists before linking.

## AP-11: Citing a zero-result search as proof of absence

> "Grepped the whole repo — no other file references the old target name."

If the command was not recorded, stderr was suppressed, the exit status was not inspected, or no
known-positive control probe was run, the zero proves nothing. See
[Absence and Completeness Claims](./absence-and-completeness-claims-zero-result-search-evidence-checklist.md). A failed search and a
clean search are textually identical.
