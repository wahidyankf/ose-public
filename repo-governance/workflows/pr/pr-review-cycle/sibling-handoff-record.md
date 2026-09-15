---
description: "Defines the complete v1 sibling-handoff schema, canonical example, and typed API read-back gate."
when_to_use: "Use after a source PR merges and a paired successor PR exists, before the successor's first scout pass."
---

# Sibling-Handoff Record

An admitted source-PR comment contains exactly one marker block and one JSON object with these
required fields. Unknown or missing fields stop reconciliation.

| Field                        | Type and invariant                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `source_repository`          | String, canonical case-sensitive `OWNER/REPO` of the comment's repository.                                               |
| `source_pr`                  | Positive integer equal to the merged source PR number.                                                                   |
| `source_final_reviewed_head` | Full 40-character lowercase hexadecimal SHA equal to the source PR final head and terminal authenticated reviewed head.  |
| `source_merge_sha`           | Full 40-character lowercase hexadecimal SHA equal to the source PR merge commit and reachable from source `origin/main`. |
| `successor_repository`       | String, canonical case-sensitive `OWNER/REPO` of the paired destination.                                                 |
| `successor_pr`               | Positive integer equal to the already-open successor PR number.                                                          |
| `successor_initial_head`     | Full 40-character lowercase hexadecimal SHA equal to the successor PR head at emission.                                  |
| `successor_base_sha`         | Full 40-character lowercase hexadecimal SHA equal to the successor destination-base SHA when opened.                     |
| `successor_branch`           | Non-empty string equal to the exact successor head branch without `refs/heads/`.                                         |

Canonical shape (repeated hexadecimal characters are example values, not wildcards):

```html
<!-- ose-pr-review-sibling-handoff:v1
{"source_repository":"wahidyankf/ose-public","source_pr":307,
 "source_final_reviewed_head":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
 "source_merge_sha":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
 "successor_repository":"wahidyankf/<private-sibling>","successor_pr":75,
 "successor_initial_head":"cccccccccccccccccccccccccccccccccccccccc",
 "successor_base_sha":"dddddddddddddddddddddddddddddddddddddddd",
 "successor_branch":"worktree/update-pr-review"}
-->
```

## Typed Read-Back and Freeze

After posting, retrieve typed objects rather than scanning raw text:

```bash
gh api "repos/${SOURCE_REPOSITORY}/pulls/${SOURCE_PR}"
gh api --paginate "repos/${SOURCE_REPOSITORY}/issues/${SOURCE_PR}/comments"
gh api --paginate "repos/${SOURCE_REPOSITORY}/pulls/${SOURCE_PR}/reviews"
gh api "repos/${SUCCESSOR_REPOSITORY}/pulls/${SUCCESSOR_PR}"
gh api "repos/${SOURCE_REPOSITORY}/collaborators/${ACTOR_LOGIN}/permission"
gh api "repos/${SOURCE_REPOSITORY}/compare/${SOURCE_MERGE_SHA}...main"
```

Apply the common [admission gate](./cycle-record-authentication.md#common-admission-gate) before
parsing any body. Require source `merged`, final `head.sha`, and
`merge_commit_sha == source_merge_sha`; an authenticated terminal review at that head; and exactly
one admitted handoff. Require the open successor's repository/number,
`head.repo.full_name`, `head.ref`, initial `head.sha`, `base.ref == main`, and initial `base.sha` to
equal the record. That base-SHA equality is an immediate post-emission read-back only. Later scouts
retain the authenticated opening-base record, require the live `base.ref == main` and the same PR
identity, but never compare the historical `successor_base_sha` with moving live `base.sha`. On the
first scout the live head still equals `successor_initial_head`; later scouts prove the initial SHA
belongs to the same PR history instead of comparing it with the evolving live head.

A missing, duplicate, conflicting, blocked, unmerged, pre-merge, schema-invalid, unreachable, or
coordinate-mismatched record freezes the successor before scouting. PR-body text and
successor-side copies never satisfy this class.
