# Leak Review Record Check

`record-status.sh` makes the [PR Leak Review](../../repo-governance/workflows/pr/pr-leak-review.md) merge precondition
mechanical. The hosted [`pr-leak-review`](../../.github/workflows/pr-leak-review.yml) workflow runs it on every
pull-request change and review event; it publishes the `leak-review` commit status on the pull request's live head,
`success` only when the designated reviewer's latest undismissed review on that head carries a `pass` record with every
count zero.

| Setting           | This repository      |
| ----------------- | -------------------- |
| Record marker     | `ose-pr-leak-review` |
| Reviewer identity | the repository owner |
| Required status   | `leak-review`        |

```bash
bash scripts/leak-review/tests/run.sh   # offline, against a stand-in forge
```

The suite runs as the `leak-review-tests` gate on the pre-push and pull-request surfaces.
