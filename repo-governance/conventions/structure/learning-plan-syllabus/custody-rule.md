---
description: The four custody rules governing custodian/consumer relationships over a syllabus corpus — single custodian, read-only consumers, routed change requests, and the two archival hand-off branches.
when_to_use: Read this when a plan needs to reference or change content in another plan's syllabus corpus, or when a custodian plan is ready to archive while a consumer still links in.
---

# Custody Rule

Part of the [Learning-Plan `syllabus/` Folder Convention](../learning-plan-syllabus.md).

A learning-bearing plan that **owns** a corpus is its **custodian**; a plan that only reads another
plan's corpus is a **consumer**. Four rules govern the relationship:

1. **Exactly one custodian per corpus.** The custodian is named in the corpus's own
   `syllabus/README.md` as a `**Custodian**: <plan-id>` line, and echoed in every consumer plan's
   selected technical form under its own `## Corpus Custody` heading as `custodied-by:<plan-id>`.
   The selected form is `tech-docs.md`, or a companion owned and mapped by `tech-docs/README.md`
   when directory form is selected. This is a distinct
   declaration from [`## Corpus Disposition`](./corpus-disposition.md), which only the owning
   (custodian) plan carries. A consumer plan is not learning-bearing in its own right (see the
   [Learning-Bearing Trigger](./learning-bearing-trigger.md)'s negative example 2) and so never
   carries a `## Corpus Disposition` section, but it still carries this `## Corpus Custody` echo
   regardless.
2. **Consumers are read-only.** A consumer plan links into the corpus by relative path and MUST NOT
   edit, copy, or fork any file under it. A consumer's delivery checklist containing a step that
   writes to another plan's `syllabus/` is a defect.
3. **Edits are change requests routed to the Custodian.** A needed change lands as a step in the
   **custodian's own** `delivery.md`, never as a direct edit from a consumer plan.
4. **Archival hand-off.** When a custodian is ready to archive while a live consumer still links into
   its corpus, the archival step MUST take one of two branches:

| Live consumer? | Corpus still being edited? | Branch                                                                                                                                                     |
| -------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No             | —                          | Move the folder to `plans/done/`; no link rewrite needed                                                                                                   |
| Yes            | No                         | **(a) Link rewrite (default)** — rewrite every inbound link to the corpus's new `plans/done/YYYY-MM-DD__<id>/syllabus/…` location                          |
| Yes            | Yes                        | **(b) Custody transfer** — `git mv` the `syllabus/` folder into a named successor plan, update that plan's `**Custodian**` line, and rewrite inbound links |

**Half of this rule is mechanically checkable.**
`./rhino md internal-link validate` skips `plans/done/**` as a **scan source** (through
`policies.markdown.internal-link.exclude-sources` in `repo-config.yml`), not as a link **target** —
so a still-live consumer plan is scanned, and its link into a corpus that moved without a rewrite
fails the check. It is not a declared gate today, so run it before pushing a hand-off. This is the backstop that catches a missed hand-off; it does not replace naming a Custodian
or choosing the correct branch above.
