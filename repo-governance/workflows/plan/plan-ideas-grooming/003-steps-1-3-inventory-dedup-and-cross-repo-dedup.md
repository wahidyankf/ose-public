---
description: Listing every idea file per repo, merging or splitting within-repo near-duplicates, then resolving cross-repo duplicate pairs before merging.
when_to_use: Use when starting a grooming sweep — building the working set and running the first two dedup passes.
---

# Steps 1-3 — Inventory, Dedup Pass, and Cross-Repo Dedup

## 1. Inventory

For each repo named in the `repos` input, list every `plans/ideas/*.md` file — excluding
`README.md` and excluding any file already sitting inside a `q1-…`–`q4-…` quadrant subfolder from
a prior run — and read each file's title, one-line summary, provenance blockquote, and all seven
body sections defined by the
[Two-Pager Template](../../../conventions/structure/plans/two-pager-template.md#two-pager-template). This inventory is
the working set every later step operates against; nothing outside `plans/ideas/**` in any of the
`repos` is read or touched.

## 2. Dedup pass (merge/split)

Within each repo first: flag any pair of idea files whose one-line summaries share three or more
significant terms, or whose filenames share a common stem, as a **merge candidate**. Log every
candidate and its rationale to that repo's grooming log (see Step 7 for the log's location), then
merge autonomously — fold the less-complete file's unique content into the more-complete file, and
delete the now-redundant file. Separately, flag any idea whose Problem/context section names two or
more genuinely unrelated concerns as a **split candidate**; split it into two files, each retaining
the shared prior-art links from the original. A merge or a split both leave the survivor(s) subject
to the rename check in Step 9, since folding or dividing content routinely leaves a filename that no
longer describes what remains.

## 3. Cross-repo dedup

Beyond the within-repo pass, compare idea titles and content across every repo in the `repos` set
for the same run. When a title or its content matches an idea already inventoried in a different
target repo, resolve that pair's residency (Step 4) **before** merging — the merge must land in
whichever repo Step 4 determines is correct, never wherever the pair happened to be compared first.
Skipping this ordering risks merging two copies into the wrong repo and then having to relocate the
merged survivor anyway.
