---
description: README index obligation and the checks `md readme-index validate` runs
when_to_use: Use when a directory needs a README index or `md readme-index validate` reports a finding.
---

# Governance README Completeness Convention

**Every directory carries a literal `README.md` — no exception.** A sibling `<dir-name>.md`
progressive-disclosure parent no longer excuses one; the former split-directory exemption is
removed. That index must link every sibling `.md` file and every subdirectory, each annotated as
`- [<title>](<path>) — <description> <when_to_use>`: an em-dash (or `--`), then the target's
frontmatter `description` and, if present, `when_to_use`. An annotation repeating its surroundings
adds nothing.

A `<dir-name>.md` parent stays audited as a second index over the same contents. Linking it does
not satisfy the subdirectory requirement, so the README also links the directory itself, once.

Link every subdirectory as `./<dir>/`. The validator counts a subdirectory as linked only by that
directory link: `./<dir>/README.md` and `./<dir>.md` do not count. On GitHub, `./<dir>/` opens the
directory listing with its `README.md` rendered beneath it.

## What the Validator Checks

`./rhino md readme-index validate`, at the release pinned in `rhino.lock`, reads
`policies.markdown.readme-index.trees` in `repo-config.yml`. Each entry names a tree by `path` and may
add `require-direct-children`, `annotations`, and `exclusions`. It exits `0` clean, `1` on findings,
and `2` on an unusable declaration. It is not a `gates:` entry, so no hook or CI job runs it: run it
after adding, moving, or deleting a README or a direct child of a declared tree.

| Finding kind                 | Raised when                                           | Armed for a tree when                   |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------- |
| `missing-readme-index`       | the tree has no `README.md`                           | always                                  |
| `missing-readme-index-child` | the README omits a direct child file or subdirectory  | it sets `require-direct-children: true` |
| `missing-readme-annotation`  | a declared `annotations` file or its `text` is absent | it lists `annotations`                  |

Every declared tree sets `require-direct-children: true`, so the validator enforces that each
tree's root `README.md` exists and links every direct child file and subdirectory. It checks that
root only: carrying a README in every directory below it, and annotating each link, remain authoring
obligations checked by review. No tree lists `annotations` by decision: that option checks that a
declared file carries declared `text`, not that each link is annotated, so enabling it would imply
coverage it does not give. A tree adopts or drops a check by editing its option on the entry, which
is a configuration decision, not a wording change.

## Declared Trees

The declared list in `repo-config.yml` is authoritative, and this convention copies none of it.
`.agents/agents/` and `.agents/skills/`, the canonical agent and skill sources, are declared trees.
Generated binding directories carry no hand-authored-index obligation. A source- or vendored-owned
Markdown path inside a declared tree remains subject to the rule.

## Remediation

Fix a finding by hand: link the omitted target, drop a dangling link, or append the annotation.
`./rhino md internal-link validate` reports a link whose target file does not exist, including one
left behind by a rename; repoint it by hand.

## Updating Scope

Edit the tree's entry under `policies.markdown.readme-index.trees` in `repo-config.yml`, recording
the rationale as a YAML comment.

## Principles Implemented/Respected

- [Documentation First](../../principles/content/documentation-first.md) — every governance
  directory remains discoverable through a maintained index.
- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) —
  which trees need an index, and which checks run on them, is declared rather than inferred.
- [Automation Over Manual](../../principles/software-engineering/automation-over-manual.md) — the
  validator detects a missing index and, on every declared tree, an omitted child; where a tree
  declares `annotations`, a missing annotation file or text.
