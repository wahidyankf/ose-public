---
description: The exact-head PR CI, applicable surface gates, universal secret check, and no-bypass rule.
when_to_use: Use when confirming which gates a PR must pass before merge, or when a secret exposure is suspected in a PR diff.
---

# Quality Gates

Every PR requires the `Quality gate` check emitted by
`.github/workflows/pr-quality-gate.yml`. Verify that GitHub associates the successful run with the
PR's exact current head SHA and current base branch; stale evidence never authorizes merge. This is
the sole default automated PR gate. Do not rerun locally or imitate predicates already owned by
pre-commit, pre-push, or PR CI merely to satisfy this protocol.

Changed reachable behaviour may also require a finite surface gate:

| Surface                   | Required result                                              |
| ------------------------- | ------------------------------------------------------------ |
| UI                        | The applicable static and running-UI gates pass              |
| API                       | The API quality gate passes against the running endpoint     |
| Other reachable behaviour | Its interface is exercised and the result recorded           |
| No reachable behaviour    | An explicit exemption identifies why no surface gate applies |

Every push first passes the private push leak review of each outgoing commit, and every PR runs one
focused [`pr-leak-review`](../../../workflows/pr/pr-leak-review.md) against its exact current head.
Only authenticated `ose-pr-leak-review:v1` `pass` evidence counts, and the hosted
`pr-leak-review.yml` publishes it as the required `leak-review` commit status on that head. Missing,
stale, failed, or findings-bearing evidence blocks merge; a fix triggers one new pass, never a
two-clean streak. Its scope is defined by the canonical
[committed-secret](../../../conventions/security/secrets-and-env-standards/hard-iron-rule-no-secrets-in-committed-files.md),
[protected-environment](../anti-patterns/hardcoded-environment-configuration.md), and
[machine-specific-path](../../quality/no-machine-specific-commits.md) rules.

`pr-leak-review` is the only universal nondeterministic agent gate. Surface gates remain
conditional on changed reachable behaviour; broad semantic review remains optional.

These gates complement PR CI; they do not create a broad semantic-review requirement. Optional
[`pr-review`](../../../workflows/pr/pr-review.md) and
[`pr-review-cycle`](../../../workflows/pr/pr-review-cycle.md) runs are user-invoked review tools,
not merge gates by default.

## Leak Finding Remediation

When leak review suspects a secret exposure, stop normal merge handling, contain and rotate the credential, then follow the full
reachable-ref history-rewrite and replacement-PR procedure in
[Secrets and Environment Standards](../../../conventions/security/secrets-and-env-standards.md). A
green quality gate, a resolved review thread, or an older leak pass never authorizes
merging a contaminated PR.

## No Bypass Without Explicit Permission

Bypassing any quality gate without explicit user permission is **forbidden**. This includes:

- Merging with failing CI checks
- Merging with unresolved review comments (unless the user explicitly dismisses them)
- Using admin override to bypass branch protection rules
- Merging with pending required status checks

If the user explicitly says "merge despite the failing lint check" (or equivalent), the agent may proceed -- but only for that specific instance and only for the specific gates the user named.
