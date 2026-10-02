---
description: "Defines the posted current-head record, its read-back, and the merge review's terminal states."
when_to_use: "Use when posting, authenticating, or consuming a leak result."
---

# Evidence and Outcomes

Include one record in the review body, under the marker `ose-pr-leak-review`, which never changes:

```html
<!-- ose-pr-leak-review:v1
{"repository":"owner/repo","pull_request":"412","base_ref":"main",
 "base_sha":"<base SHA>","head_sha":"<reviewed SHA>",
 "result":"pass|findings","counts":{"secret_or_private_value":0,
 "protected_environment_property":0,"machine_specific_absolute_path":0}}
-->
```

`pull_request` is written as a string; an earlier record that wrote it as a number stays valid.

1. **Read the review back.** Through the typed Reviews API, confirm the posted review's commit equals
   the pinned head, its author is the repository owner, and its repository, PR, base, head, result,
   and counts match the sanitized review. The output `review-id` is that object's server-assigned
   ID. Marker-like text elsewhere has no authority.
2. **Query the live head once more.** A mismatch returns `stale` with evidence pinned to the old
   head, never a pass for the new head.

## Terminal States

API, posting, read-back, or authentication errors return `failed` without an internal retry.
Otherwise return `pass` when every count is zero, or `findings` when any class is nonzero. Only
`pass` for the exact head being merged satisfies the merge precondition, and the hosted
`pr-leak-review` workflow publishes it as the `leak-review` commit status on that head per
[Enforcement](./005-enforcement.md).

Findings use only the three class names in [Scope and Exclusions](./001-scope-and-exclusions.md).
Remediation may instruct the caller to revoke or rotate and purge, move the property to secret or
environment storage, or replace the path with a `~/`, repository-relative, or configured path; it
never exposes the candidate.
