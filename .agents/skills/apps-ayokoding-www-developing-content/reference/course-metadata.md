---
title: "Course Metadata"
---

# Course Metadata

Every course `_index.md` under `apps/ayokoding-www/content/en/learn/courses/<slug>/` declares
catalog metadata. The catalog page, the sidebar category groups, and the course header render
from these fields.

## Required fields

- `category`: one of the 14 ids below.
- `description`: one sentence, 20–120 characters, one line, no `·`, ending in `.`, `!`, or `?`.
- Non-outline courses also declare `format` (one of the six below) and `estimatedHours`
  (integer, 1–200). Outline courses (`status: outline`) may omit `format` and `estimatedHours`.

## The 14 category ids

`tools-and-practices`, `programming-languages`, `computer-science`,
`application-development`, `data-and-databases`, `systems-and-networking`,
`architecture-and-distributed-systems`, `infrastructure-and-operations`, `security`,
`ai-engineering`, `product-and-leadership`, `interview-preparation`, `accounting`,
`erp-systems`. Display order follows this list. A course with a missing or unknown category
renders under "Other courses"; the guard below keeps that group empty on real content.

## The six formats

`by-example`, `primer`, `annotated-concept`, `annotated-concept-no-code`, `in-the-field`,
`capstone`. The tutorial gates read a course's mode from `format` (`annotated-concept-no-code`
selects the no-code sub-mode; `annotated-concept` selects standard mode).

## Estimated hours

`estimatedHours` equals `estimateCourseHours` for the course's current files: prose minutes
(words / 200) plus code minutes (lines / 10); code shown both inline and in files counts once
(the larger of the two); whole hours, minimum 1. After adding or removing material, recompute
and store the new value; the guard prints the expected number on drift.

## Drift guard

The scenario "Every course in the library carries valid metadata" (the course-metadata
feature, Unit and Integration) checks all 181 courses and fails `ayokoding-www:test:unit`
naming the course and each bad field. Runtime parsing stays tolerant (a typo parses to
`undefined` and the page still renders) so strictness lives only in this guard.
