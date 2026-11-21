---
description: >-
  Holds rules C6 and C8 to C11 of the test and gate contract: what each surface holds, the per-surface allowed list and
  its default, the parallel pull-request gate, the local landing gate, commit messages, leaks, and why hooks stay thin.
when_to_use: >-
  Use when deciding which surface a check belongs on, when a hook grows a test or a scan, when declaring a local
  surface's allowed list, or when a repository has no hosted pull-request gate.
---

# Surface Placement

A surface is the moment a gate runs, as `Surfaces and Mutation` defines. Under this contract each surface holds exactly
one kind of work.

## C6 What Each Surface Holds

| Surface            | Holds                                                   | Never holds                       |
| ------------------ | ------------------------------------------------------- | --------------------------------- |
| `pre-commit`       | staged-file formatters that rewrite and restage         | any check, test, or scan          |
| `commit-msg`       | the commit-message format lint                          | anything about file contents      |
| `pre-push`         | the deterministic leak scanner over the pushed range    | tests, lint, document checks      |
| `pull-request`     | everything else except `test:e2e`, hook checks replayed | a step whose failure is discarded |
| `main`/`scheduled` | `test:e2e` and any recorded physically-bound layer      | a layer nothing else runs         |

### Allowed Lists

The table is the default. In a repository with a pull-request gate, each local surface (`pre-commit`, `commit-msg`,
`pre-push`) holds only the gate entries its allowed list names. A repository may declare, in its registry, one list per
local surface, of allowed entry IDs or kinds; RHINO reads them from `gates.wiring.local-surfaces`. When a repository
declares no list, the default applies:

| Local surface | Default allowed list   |
| ------------- | ---------------------- |
| `pre-commit`  | staged-file formatting |
| `commit-msg`  | commit-message lint    |
| `pre-push`    | the deterministic scan |

An entry outside its surface's list fails, naming the entry and the surface: rule W07 of
[Registry and Dispatch](001-registry-and-dispatch.md), or a runner-native check in a repository without a registry.

## C8 The Pull-Request Gate Is a Superset and Runs in Parallel

The pull-request gate replays every hook check, including a verify-clean replay of each formatter, and adds every other
check. Its jobs are split per project and per test level, so they run in parallel and spread over runners. One aggregate
job named `quality-gate` is the single result; a skipped or cancelled dependency counts as failed. A repository keeps
the runners it already uses and spreads load through parallel jobs, not by moving runners.

## C9 Landing Gate Without a Pull-Request Gate

A repository with no remote, and any route that pushes straight to the default branch, runs the registry's
`pull-request` surface locally over the change before landing or pushing, and records the result. `test:e2e` is included
where the repository declares it and its dependencies are local. Its hooks stay the same; the landing gate replaces the
hosted side.

## C10 Commit Messages

The format lint runs at `commit-msg`, and again over the range in the pull-request gate, per
[Commit Messages](../../../workflow/commit-messages.md). Every repository has one; a message-safety scan is not a
substitute.

## C11 Leaks

Every repository registers a deterministic leak scanner at `pre-push` over the pushed range, and in the pull-request
gate over the tree, the range, and the messages. A repository without a remote keeps the `pre-push` entry dormant and
runs the scanner in its landing gate. For a push an agent makes, the
[PR Leak Review](../../../../workflows/quality/pr-leak-review.md) judgement review runs and passes before the push; a
repository with no remote records it as not applicable.

## Why the Hooks Are Thin

Work in the pull-request gate can be dispatched from any machine, spreads evenly across runners, and runs more in
parallel. Work in a hook runs on one author machine, serially, before anyone can look at the change. Only three kinds of
work have to run there:

- work that rewrites files, which a hosted job cannot do;
- the message lint, because a bad message found only at the pull request would force rewriting pushed history; and
- the leak scan, which must happen before history leaves the machine.

Everything else, document and repository checks included, runs in the pull-request gate and not before a push.
