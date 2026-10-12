---
description: The decidable test for whether a plan's delivery checklist authoring or restructuring course/curriculum content brings it into scope, with worked positive and negative examples.
when_to_use: Read this when deciding whether a new or existing plan must carry the syllabus folder layout, template-derived shape, and disposition/custody declarations.
---

# The Learning-Bearing Trigger

Part of the [Learning-Plan `syllabus/` Folder Convention](../learning-plan-syllabus.md).

A plan is **learning-bearing** when its delivery checklist **authors or restructures course,
tutorial, or curriculum content** — the direct analogue of "adds or changes user-facing screens or
components under `apps/` or `libs/`" for a UI-bearing plan. Merely citing a course, linking to one, or
fixing a small defect in an existing body does not trigger it, exactly as a CSS-token bump does not
trigger the UI funnel. The test an author applies: does a delivery step **produce new or
restructured** course/path content, or does it only **read or lightly correct** what already exists?
If the former, the plan is learning-bearing; if the latter, it is not.

**Positive examples (learning-bearing):**

1. A plan's delivery checklist creates new `syllabus/courses/<course-id>.md` files with a
   concept/worked-example breakdown for courses that do not yet exist — this **authors** curriculum
   content, so the plan is learning-bearing and must carry the folder layout, template-derived shape,
   and disposition/custody declarations below.
2. A plan's delivery checklist splits one existing course into two, renumbers the affected
   prerequisite stages across every path manifest that references it, and rewrites the manifest's `phases`
   entries accordingly — this **restructures** curriculum content, so the plan is learning-bearing
   even though it touches existing files rather than creating new ones.

**Negative examples (not learning-bearing):**

1. A plan's delivery checklist fixes a broken relative link or a typo inside an existing
   `syllabus/courses/*.md` file's prose, with no change to the course's concepts, structure, or
   scope — this neither authors nor restructures curriculum content, so the plan is not
   learning-bearing, exactly as a CSS-token bump is not UI-bearing.
2. A plan's delivery checklist references an existing corpus by relative link (for example, a
   course-authoring plan's `tech-docs.md` cites a `syllabus/paths/manifest-*.md` file as the source
   it builds against) without editing any file under that corpus — reading is not authoring, so this
   plan is a **consumer** (see the [Custody Rule](./custody-rule.md)), not learning-bearing in
   its own right.

Only plans meeting this trigger carry the folder layout, template-derived shape, and the
[Corpus Disposition](./corpus-disposition.md) declaration; every other plan is exempt from this
convention in the same way a non-UI-bearing plan is exempt from the UI-design-funnel record.
