---
description: Defines the exact agent response protocol for a missing-artifact failure, including the filesystem-error cooldown ladder, and lists the anti-patterns to avoid
when_to_use: Use when a build, test, or tooling command fails because an artifact is missing and you need to know the correct response steps or want to check a behaviour against known anti-patterns.
---

# Agent Response Protocol and Anti-Patterns

## Agent Response Protocol

When a build, test, lint, or tooling command fails because an artifact is absent:

1. **Do not** file a finding, open a plan, raise a CI blocker, or report a failure to the user.
2. **Regenerate, then retry the failed step.** `nx build <project>` for build output, the guarded
   `npm install` for dependencies, and for a swept toolchain `npm run doctor` followed, only on
   reported drift, by the transactionally guarded `./rhino toolchain provision --apply`. A first `cargo`-backed command
   after a sweep rebuilds from cold — slow is not broken.
3. **If regeneration itself fails with a filesystem error inside the artifact directory** — for
   example `No such file or directory` writing a compiled object mid-build, `couldn't create a temp
dir`, or `failed to write bytecode` — the sweep is still in progress, not finished. Retrying
   immediately re-races the same window and reliably fails again. Back off with increasing cooldowns
   before the next regeneration attempt: **3 → 5 → 8 → 12 → 17 minutes.** This is a distinct case from
   step 2's plain "artifact absent, rebuild instantly" outcome — only a build that fails _while
   running_, not one that simply starts cold, warrants the cooldown.
4. **Escalate only if** the failure still reproduces after the fifth (17-minute) attempt, or something
   outside the three removable classes is missing. Either is a real problem and this convention does
   not cover it.
5. A failure that **reproduces after a clean regeneration** is a genuine defect. Treat it normally.

## Anti-Patterns

- **Committing build output** to survive the sweeper. Build output is gitignored by design; committing
  it trades a two-minute rebuild for permanent repository weight.
- **Editing `.gitignore`** to "protect" artifacts. The sweeper's scope is gitignored regenerable
  paths; un-ignoring them corrupts the repository instead of preserving anything.
- **Filing a bug, finding, or plan** against a missing artifact.
- **Blaming a concurrent agent** for a deletion the environment performed.
- **Disabling, rescheduling, or working around the sweeper.** It exists because the disk is shared;
  circumventing it moves the cost onto everyone else.
- **Tight-looping regeneration attempts against an active sweep.** A build that fails mid-run with a
  filesystem error, not merely a cold-start rebuild, means the sweep has not finished; retrying without
  the step-3 cooldown just re-races the same window repeatedly.
- **Reaching for a destructive git recovery** — `reset --hard`, `clean -fdx`, force-removing a
  worktree — after a sweep. Nothing tracked was lost, so there is nothing to recover, and those
  operations are forbidden regardless.
