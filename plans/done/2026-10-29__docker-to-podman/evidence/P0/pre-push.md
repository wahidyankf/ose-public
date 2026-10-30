# P0 local pre-push baseline

## Result and boundary

The checked-in `.husky/pre-push` completed with exit 0. Its three declared checks passed:
`public-safety-tree`, `public-safety-range`, and `env-validate`. This is local baseline validation
using accurately observed prospective update input. No commit, push, PR, remote ref, or Git index
was created or changed. Delivery must rerun the gate against its actual committed changes and
Git-provided update records.

The execution worktree HEAD and observed main were
`71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7`. Fresh read-only HTTPS ref checks immediately before
execution confirmed the local branch and fallback ref at that commit and the remote execution
branch absent. The input therefore used the real local branch/OID and Git's zero-OID convention
for a prospective new remote branch. Its main-to-HEAD range had zero new commits; this is not
evidence of publication or final committed-change review.

## Command and resource boundary

From the execution worktree root, with its native tool PATH, approved host `HIPPO_CONFIG`, and
a task-owned same-filesystem mode-0700 `TMPDIR`:

```sh
./.husky/pre-push < local-tmp/swe-debugger/prepush-prospective-update.txt
```

The checked-in hook supplies its own single HIPPO `ephemeral/heavy` boundary and invokes
`./rhino gate run --surface pre-push --push-updates-stdin`. No redundant outer guard was added.
The new private scratch directory preserved the earlier shared scratch directory. Its ownership
is recorded for terminal cleanup.

## Terminal receipt

- Tool session: `10665`, retained and polled through terminal exit 0.
- HIPPO execution: `development-ephemeral-1793039119642-1792821`, outcome `passed`.
- UTC interval: `2026-10-26T18:25:19.644724511Z` through `18:27:33.693162504Z`.
- Child wall time: 131.887 seconds; one owner, maximum pressure level 1, zero health failures.
- Native outputs: all three named gates passed; durable `hook_exit=0` and separate exit-file 0.
- All observed hook/HIPPO/Rhino process IDs were absent afterward. Follow-up metadata session
  `32542` also completed with exit 0. No owned command remains live.

Raw command/input/output/status and exact protocol-source correlation remain ignored under
`local-tmp/swe-debugger/prepush-*`. The private scratch is an owned disposable artifact, retained
until the plan's ownership-based cleanup.

## Earlier invocation errors

Two earlier direct RHINO invocations exited 2 before executing any gate: one omitted the required
stdin flag, and the other supplied an empty update stream. They are not gate passes. Exact pinned
RHINO 0.15.0 source establishes that fallback to `origin/main` applies to a present new-ref record
with zero remote OID; empty stdin is rejected. The corrected run used the actual checked-in hook's
resource boundary and a verified, explicitly prospective input. No tool patch or repin was needed.

This hook surface does not execute Unit/Integration/E2E tests. Their separate fresh results and
remaining failures are recorded in [the baseline matrix](./baseline-targets.md).
