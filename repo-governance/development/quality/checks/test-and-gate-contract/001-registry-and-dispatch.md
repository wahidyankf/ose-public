---
description: >-
  Holds rules C1 to C5 of the test and gate contract: one gate declaration that hooks and hosted workflows dispatch, no
  dead entries or unwired artefacts, installed hooks, pinned tools, and offline, deterministic gates.
when_to_use: >-
  Use when declaring or wiring a gate, when deleting a gate artefact, when pinning a tool a gate runs, or when a gate
  gives a different answer on a second run.
---

# Registry and Dispatch

These rules make the gate list a single source. A command list copied into a hook or a workflow is a second list, and
the two drift the first time someone edits one of them.

## C1 One Declaration

Each repository declares its gates in exactly one place: a gate registry, or, for a repository without one, one runner
entrypoint with one subcommand per surface. Hooks and hosted workflows only invoke it; neither copies a command list.

The recommended adapter is RHINO's `repo-config.yml` registry, dispatched by `rhino gate run --surface <surface>`, per
`Gate Entries`. A repository that uses
its own runner meets the same rule through that runner.

## C2 No Dead Entries and No Unwired Artefacts

Every surface or membership the declaration names has a caller, and every gate artefact the repository ships is wired or
deleted with proof, per `Deletion With Proof`. Typical dead artefacts are a surface
membership that nothing dispatches, a hook-runner configuration no hook reads, a linter or commit-format configuration
no gate runs, a test script outside every target, and a pinned tool no gate invokes.

## C3 Hooks Are Installed

The declared [Checkout Bootstrap](../../../workflow/worktree-setup.md) installs the hooks, and a health check fails
while they are absent.

## C4 Pins

Every tool a gate runs is pinned in the repository. A shared upstream tool sits on one release across every repository
of a group that pins it. Hosted workflows read the same pins as local runs, so a local pass and a hosted pass test the
same tool. Third-party actions in hosted workflows are pinned to a full commit SHA, because a tag can be moved after
review.

## C5 Offline and Deterministic

A gate gives the same answer twice with no network once its pinned tools are installed. A test never downloads code
while it runs; a bootstrap it needs is pinned and cached, or vendored.

## Mechanical Wiring Check

RHINO's `gate wiring validate` is the recommended check for a registry repository. It reads the registry and a declared
`gates.wiring` section naming the hook directory and the workflow directory; a repository with no hosted workflows
declares `ci: { none: "<reason>" }`, and the reason is mandatory. It fails on:

| Rule | Fails when                                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------- |
| W01  | a surface has registry entries and no hook file or workflow step calls `gate run --surface <it>`            |
| W02  | a hook or workflow step calls `gate run --surface <name>` for a surface the registry does not declare       |
| W03  | the `pull-request` surface has entries, a workflow directory is set, and no workflow step calls it          |
| W04  | a `pre-commit`, `commit-msg`, or `pre-push` surface has entries and the hook directory has no matching file |
| W05  | a step that calls `gate run` can never fail: `continue-on-error: true`, `\|\| true`, `\|\| :`, or `set +e`  |
| W06  | a lock file names a release that differs from the release a workflow step installs by name                  |
| W07  | a local surface holds an entry outside its allowed list, per [Surface Placement](002-surface-placement.md)  |

A `scheduled` or `manual` surface counts as called when a workflow with the matching trigger calls it. Findings name the
path, the line, the rule, and the field. A repository without a registry runs the same checks as a short test in its own
runner, counted toward its own coverage floor.
