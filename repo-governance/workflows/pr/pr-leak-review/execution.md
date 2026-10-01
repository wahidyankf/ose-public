---
description: "Defines the merge review's pinned-head, commit-by-commit inspection and sanitized review phases."
when_to_use: "Use when running or implementing the merge review for a PR head."
---

# Execution

## Pin and Inspect

1. **Pin the head.** Resolve the repository and open PR through typed GitHub API objects. Record the
   base ref and SHA and the exact current `headRefOid`. Everything after this step concerns that
   head alone.
2. **Read every commit at that head.** Each commit's diff from base to head, including tracked
   configuration, generated artifacts, localized content, binary metadata, file names, and commit
   messages, plus the PR title and body. A summary or memory of the change is not a reading, and no
   file is skipped because another gate owns it. Removed lines are read only for context.
3. **Judge candidates against the three [leak classes](./scope-and-exclusions.md) and no others.**
   Compare candidates with repository secret/env rules, examples, fixtures, public-value
   documentation, and path-portability rules. Ignore arbitrary conversation except when it
   establishes an explicit public/example placeholder. Never copy a candidate into notes, commands,
   logs, or output.

## Produce the Review

1. **Write each finding without its value.** Record only its class, the commit, the path and line or
   metadata location, why the location breaks the class, and the remediation in
   [Push Review](./push-review.md#remediation). Never repeat, partially quote, hash, encode,
   pattern-describe, or include enough context to reconstruct the sensitive value.
2. **Confirm the head before posting.** Compare live `headRefOid` with the pin. On mismatch, post
   nothing and return `stale`.
3. **Post exactly one review, whatever the result.** Post one GitHub `COMMENT` review through the
   Reviews API on the pinned head, clean or findings, carrying the record in
   [Evidence and Outcomes](./evidence-and-outcomes.md). State that every other security and
   semantic concern was out of scope. An unposted pass cannot be told apart from a review nobody
   ran, which is why every result is posted.
