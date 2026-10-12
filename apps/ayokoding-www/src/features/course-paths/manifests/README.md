# Path Manifests

This directory is the machine-consumed source of truth for path manifests: nested
`<path-id>.json` data files, one per path. A slash in a path ID becomes a nested directory — for
example, `careers/interview-ready/software-engineer` lands at
`manifests/careers/interview-ready/software-engineer.json`.

Each manifest must validate against `PathManifestSchema` in
[`../core/schemas.ts`](../core/schemas.ts).

## Shape

- `phases`: the ordered syllabus. Each phase has an `id`, a `title`, a `kind` (`core` or
  `extension`), and a `courses` list of course IDs. Every `core` phase also carries an `outcome`
  (`can`, plus optional `cannotYet`) naming what a reader can do after finishing it.
- `goals`: the capstone course IDs whose prerequisite closure defines the core. The core is
  computed with `computeCore` in [`../core/path-core.ts`](../core/path-core.ts), never listed
  by hand.
- `assumes`: course IDs the reader is expected to know before starting. A core course's
  prerequisite must appear earlier in the path or in `assumes`, and `assumes` lists nothing else.
- `restructurePendingIn`: a temporary marker, allowed only on the four skills paths listed in
  [`../core/skills-restructure-allowlist.ts`](../core/skills-restructure-allowlist.ts). It
  exempts a marked manifest from the core rules until its restructure lands. Plan 06 removes the
  two accounting entries; plan 07 removes the two ERP entries and the allowlist module itself.
- `courseOrder`: derived, never authored — the concatenation of every phase's `courses` in order.
  Navigation and the flat readers still walk this list.

## Integrity tests

Real manifests are checked against real course frontmatter in
`tests/unit/features/course-paths/manifests/`: `path-model-integrity.unit.test.ts` (every rule
that applies), `manifest-membership.unit.test.ts` (no course added or dropped), and
`skills-order.unit.test.ts` (marked skills paths keep today's order). Edit data to match the
rules, never the reverse.
