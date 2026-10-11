# Course Titles and References

## R1 — Course titles carry no authoring bookkeeping

Every `_index.md` frontmatter title of `apps/ayokoding-www/content/en/learn/courses/<slug>/_index.md`
MUST have no catalogue or pass number prefix (`NN ·` or `Pass N`):

- **Reason**: the only order number a reader sees is the course's 1-based position in the active
  path; stale catalogue numbers contradict it and leak authoring bookkeeping to readers.
- **Violating**: a `_index.md` frontmatter of `title: "46 · Distributed Systems"`.
- **Conforming**: `title: "Distributed Systems"`.
- **Enforcement**: `gated` by
  `apps/ayokoding-www/tests/unit/be-steps/course-content-hygiene.steps.ts` (scenario
  "No course title carries a catalogue number"), which runs in `ayokoding-www:test:unit`.

## R2 — Course pages carry no internal verification vocabulary

Published course content under `apps/ayokoding-www/content/en/learn/courses/**` (all file types)
MUST NOT contain an "Accuracy notes" section, an "Accuracy note" label, or an internal confidence
tag (`[Unverified]`, `[Needs Verification]`, `[Verified …]`); an unconfirmed claim MUST be hedged
in plain words without tags.

- **Reason**: internal verification vocabulary leaks authoring process to readers and misstates
  the confidence of what a page publishes.
- **Violating**: `## Accuracy notes` with a `[Unverified]` tag on a course overview.
- **Conforming**: the same facts under a `## References` heading, their Markdown source links, and
  a plain-language caveat where a claim is unconfirmed.
- **Enforcement**: `gated` by
  `apps/ayokoding-www/tests/unit/be-steps/course-content-hygiene.steps.ts` (scenario
  "Courses cite sources in a References section without internal verification tags", first Then
  step over the whole courses tree), which runs in `ayokoding-www:test:unit`. This excludes
  plan-internal syllabus records under `plans/**`, which keep their own `## Accuracy notes`
  convention.

## R3 — Source-citing pages present their sources under a References heading

A published course Markdown page that cites sources MUST present them under a `## References`
heading (at that page's usual heading level).

- **Reason**: an Accuracy-notes-style internal section was previously the only place sources lived;
  the reader-facing presentation must be a References section.
- **Violating**: a course page citing its sources only under `## Accuracy notes`, or presenting
  cited sources with no References heading.
- **Conforming**: `search-and-information-retrieval/overview.md`, which cites its sources under
  `## References`.
- **Disposition**: `covered` on the pinned sample — the same hygiene test scenario's last step
  ("And a course that cites sources shows them under a \"References\" heading") asserts the
  heading on `search-and-information-retrieval/overview.md`; no fleet-wide gate asserts the
  heading on every page, so this rule is covered by that sample rather than `gated`. A
  source-citing page that also breaks R2 is caught there anyway.
