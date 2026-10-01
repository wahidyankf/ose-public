---
description: "Reviews each outgoing range privately before a push reaches the remote, and fixes how a leak is remediated before and after it has been published."
when_to_use: "Use immediately before every push to the remote, including a branch whose PR is not yet open, and whenever a leak review reports findings."
---

# Push Review

The merge review guards what lands on `main`, but a pushed branch is already on the remote. Every
push is therefore reviewed before it leaves, privately, with nothing posted.

## Range

For each ref the push updates, the range runs from the remote's current tip of that ref to the
local head. A ref the remote lacks starts from its merge base with `origin/main`.

## Sequence

1. **List the range's commits.** Every commit in the range, oldest first, including merges.
2. **Run the screen on the range.** The pre-push hook's `public-safety-range` gate screens it commit
   by commit per [Enforcement](./enforcement.md); a scan error blocks exactly as a finding does.
3. **Read every commit.** Each commit's added lines, its file names, its message, and the ref name.
   A merge contributes what it resolved beyond the automatic merge.
4. **Judge against the [leak classes](./scope-and-exclusions.md).** No candidate is copied into
   notes, commands, or logs.
5. **Decide.** No finding: push. Any finding: do not push; remediate, then start again from step 1.

## Remediation

Before the push, the fix is to the history, not the tree. A later commit that deletes the value does
not pass, because the commit that added it would still be published. Rewrite the unpushed commits so
that none carries the value: amend the latest commit, or rebuild the range without it.

| Class                            | Replace the value with                                                      |
| -------------------------------- | --------------------------------------------------------------------------- |
| `secret_or_private_value`        | a reference to environment or secret storage; rotate it if it left the host |
| `protected_environment_property` | an environment variable declared in the committed template                  |
| `machine_specific_absolute_path` | a `~/` path, a repository-relative path, or a documented placeholder        |

After the push, the value is disclosed. Stop, rotate any credential, and report it to the repository
owner; correcting the tree alone is never the whole remedy. Rewriting published history requires the
owner's explicit approval for that instance. Once approved, a secret's rewrite follows
[Secret-Exposure History Remediation](../../../conventions/security/secrets-and-env-standards/secret-exposure-history-remediation.md),
rotation first. For a non-sensitive path, the corrective commit and the report stand unless the
owner approves a rewrite.
