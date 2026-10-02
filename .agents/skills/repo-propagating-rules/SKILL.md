---
name: repo-propagating-rules
description: Run the rules-propagation workflow whenever a repository rule is being created, updated, superseded, or deleted. TRIGGERS on "add rule", "new rule", "update the rule", "change the convention", "adjust the rule", "delete that rule", "make it a rule that…", "from now on we should…", "we should always/never…", or any request that would edit repo-governance/, AGENTS.md, CLAUDE.md, an agent or skill definition, repo-config.yml, a hook, or a CI workflow. Load it BEFORE editing any of those surfaces, not after.
when_to_use: Use the moment a request implies rule work, and before the first edit to any repo-rules surface.
---

# Propagating Repository Rules

Rule work does not go in through an ad-hoc edit. It goes through
[rules-propagation](../../../repo-governance/workflows/quality/rules-propagation.md), which
exists because placing a rule badly is invisible at review time and expensive later.

## Recognising Rule Work

The phrasing varies more than the intent does. All of these are rule work:

- Named: "add rule", "update the rule", "change the convention", "delete that rule".
- Unnamed: "from now on…", "we should always…", "never do X again", "make sure that before Y we
  do Z". A standing obligation stated in prose is a rule whether or not the word appears.
- Implied by target: any edit to governance prose, the instruction surfaces, an agent or skill
  definition, the machine-readable declarations, the enforcement wiring, or the language style
  guides.

A one-off instruction for the current task is **not** rule work. The test is whether the
obligation outlives the work that prompted it.

## What Running It Means

Ten steps, summarised: normalize the rule until it is falsifiable both ways; classify its subject,
audience, vendor-neutrality, and layer; scan for contradictions and apply layer-aware precedence
before writing anything; place it on the narrowest surface that binds, evicting from the
instruction surface if it is admitted there; tidy every other surface stating its subject; record
one of three enforcement dispositions; verify; deliver.

Read the workflow rather than working from this summary — the steps carry conditions this Skill
deliberately does not restate.

## Do Not

- Do not edit a rule surface first and reconcile it afterwards. The conflict scan is a **pre**-write
  step because a contradiction found after the write often means the wrong rule was edited.
- Do not finish Step 6 without classifying every subject-scoped rule and discoverability surface as
  keep, amend, merge, delete, relocate, or supersede. Merge or delete only after every distinct
  obligation and necessary discoverability path survives at the canonical home; a kept duplicate
  needs a rationale.
- Do not soften an unfalsifiable rule into "guidance" so it can be written. That is a halt.
- Do not raise a word budget to make a rule fit.

## Related

- `repo-understanding-shared-vocabulary` — whether a given file is a repo rule at all.
- [Repo Rules — Membership Test](../../../repo-governance/glossary/repo-rules-membership-test.md).
