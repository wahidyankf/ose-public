# Skill-tree links are exempt from link validation, and the exemption hides broken ones

One-line summary: `repo-config.yml` exempts `.agents/skills/**` from `./rhino md internal-link validate`; with the
exemption lifted in a scratch copy, the pinned RHINO reports 17 genuinely unresolvable links in 10 canonical skill
files, and a hand check finds 7 more dangling `#fragment` anchors that the validator never reads.

> Rewritten 2026-10-06 from `harness-mirror-and-test-isolation-defects`, which was demoted from a full `backlog/` plan
> to a two-pager on 2026-08-21 and filed 2026-08-19 by
> [`update-harness-support`](../../done/2026-08-20__update-harness-support/README.md)'s Knowledge Capture phase. Of its
> three defects, two no longer reproduce on the pinned RHINO `v0.11.0` and were dropped; the third survives only as the
> `ose-public`-local residue below.
> Renamed from harness-mirror-and-test-isolation-defects.md on 2026-10-06 by plan-ideas-grooming.

## Problem / context

`policies.markdown.internal-link.exclude-sources` in `repo-config.yml` lists `.claude/skills/**` and
`.agents/skills/**`. The first no longer hides anything: `.claude/skills/` now holds 75 generated route stubs and two
JSON records, with no content links. The second is the canonical, hand-authored skill tree, 558 Markdown files (408
under `reference/`), and it is exempt from the one gate that would notice a broken link in it.

Lifting only that entry in a scratch copy of `repo-config.yml` and running the pinned release (`./rhino md
internal-link validate`) reports 27 links whose target does not exist, in 11 files:

- **10 are deliberate.** `docs-validating-links/reference/internal-link-validation.md` teaches link syntax with `PASS`
  and `FAIL` example links written as live links, so they would need a code span or fence once the exemption is gone.
- **17 are real, in 10 files.** 12 are one `../` short (the target exists one level up, for example
  `../../../repo-governance/...` from a `reference/` page); 2 follow a retired nested `agents/web/` path (the agent is now
  `.agents/agents/web-researcher.md`); 3 name application and dev-stack files that no longer exist
  (`apps/organiclever-www/next.config.mjs` and two files under `infra/dev/organiclever-www/`).

Fragments are a separate, wider gap. `./rhino md internal-link validate` strips `#fragment` and skips fragment-only
links by design (its own reference documents this), and
[Anchors, Images, and Link Validation](../../../repo-governance/conventions/formatting/linking/anchors-images-and-link-validation.md)
already tells authors to verify them by hand. Checked by hand against GitHub's slug rules, 7 links in 3 skill files
dangle, and every one points at a heading that moved in a progressive-disclosure split: five at the
`grilling-with-options` convention, one at `plan-anti-hallucination`, and one same-file anchor whose heading now sits in
a sibling reference page. Separately, `docs/reference/sdlc-gate-standard.md` still says the gate resolves `#fragment`
anchors, which contradicts that convention.

## Why now

Skills are instructions loaded into an agent's context, so a path one level short sends every reader, human or agent,
to a file that does not exist, on every load. The reason for the exemption has also gone: it was introduced when a
byte-identical mirror made the same bytes broken in one tree and fine in the other, and that mirror is now only stubs.
The exemption's cost remains; its justification does not.

## Prior art / precedents

- [Anchors, Images, and Link Validation](../../../repo-governance/conventions/formatting/linking/anchors-images-and-link-validation.md)
  — the standing rule that fragments are verified by hand against the GitHub slug algorithm.
- [mermaid-validator-does-not-check-syntax](./mermaid-validator-does-not-check-syntax.md) — the same family: a
  validator whose pass means less than its name implies.
- [Upstream Tool Defects](../../../repo-governance/development/workflow/upstream-tool-defects.md) — how a missing
  fragment check in the pinned RHINO would be raised, since a documented non-feature is not fixed locally.
- **`github-slugger`** — the reference slug implementation the convention names; a local fragment check would reuse it
  rather than invent a rule.

## Proposed direction (sketch)

- Repair the 17 real links (repoint or remove) and escape the 10 teaching examples, then delete `.agents/skills/**` from
  `exclude-sources` so the gate guards the tree it was exempting. Keep the `.claude/skills/**` entry: it covers stubs.
- Repair the 7 dangling fragments by hand now, pointing each at the child document that now carries the heading.
- Reconcile the gate standard's statement about anchors with the convention, so only one account of fragment coverage
  stands.

## Rough scope & non-goals

In scope: the `.agents/skills/**` link and fragment repairs, the `exclude-sources` entry, and the one contradicting
sentence in the gate standard.

Out of scope (for now): building fragment validation, which belongs to RHINO or to a deliberate local check decided
separately; the generated `.claude/skills/` stubs; the other `exclude-sources` entries (`plans/done/**` and the two
content trees), each of which has its own reason.

## Risks & open questions

- Does lifting the exemption surface anything the scratch run missed? The scratch copy omitted application content
  trees, so a real run after the repair, not this count, is the check. (open)
- Who should check fragments mechanically: an upstream RHINO capability, or a local script? Until decided, the hand
  check in the convention is the only coverage. (open)
- Are the 10 teaching examples better escaped in place or restated without link syntax? Either satisfies the gate.
  (open)

## What success looks like + promotion signal

Success, stated both ways: with `.agents/skills/**` removed from `exclude-sources`, `./rhino md internal-link validate`
exits 0 (it reports 27 findings in the scratch copy today), and a hand check of the skill tree's fragments finds none
dangling (7 today).

Promotion signal: none needed beyond a free delivery unit. The counts are measured, the repair is mechanical, and the
whole change is one small pull request; promote it to a plan only if the fragment-checking question is bundled in.
