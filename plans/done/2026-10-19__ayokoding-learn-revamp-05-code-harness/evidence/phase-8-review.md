# Phase 8 independent review (code harness)

Reviewer: independent (did not write the code). Scope: `apps/ayokoding-cli/**`
against the plan tech-docs (001–011), `prd.md` FRs, correctness (argv
planning, double-run comparison, cleanup on all paths, exit-status mapping),
the repo Go standards, and test honesty. Branch
`ayokoding-learn-revamp-05-code-harness`; plan manual checks 1–15 all MATCH.

Method: read the CLI adapter (`internal/adapters/cli`), the application run
path (`internal/application/run*.go`), the container adapter
(`internal/adapters/containers/run.go`, `build.go`), the plan/finding/selection
domains, the 002/003/006 contracts, and the Go standards; ran
`nx run ayokoding-cli:test:unit` (exit 0, from cache).

## Cycle 1 findings

### F1 (blocking): run stdin bytes never reach the container

- Location: `apps/ayokoding-cli/internal/adapters/cli/root.go:172-174`
  (`_ = stdin`), `apps/ayokoding-cli/internal/adapters/containers/run.go:157`
  (`Run` takes no stdin) and `:380-411` (`supervisedExec` never sets
  `cmd.Stdin`).
- Violated requirement: plan tech-docs `003-run-yaml-contract.md` row 77 —
  "`runs[].stdin` … A unit-relative file fed to standard input". The
  application layer provably delivers the bytes to its `Runtime` port
  (`internal/application/run_prepare_test.go:48`), but the CLI adapter drops
  them (`_ = stdin`) and the containers adapter has no stdin channel, so a
  real run with `stdin:` feeds the container EOF (`/dev/null`) instead of the
  file. The stale comment on `runAdapter` ("stdin … stays dropped") admits it.
- Disposition: FIX in cycle 1 (see below). No spec scenario and no valid
  fixture covers stdin (only `broken-runspec/ex-36-bad-stdin`, an absolute
  path that must fail validation), which is why every gate stayed green.

### Non-blocking notes (no fix; recorded only)

- N1: `internal/application/run_execute.go:32` `errProbeUnready` is wrapped
  but never matched with `errors.Is`; per Go standards it should be a plain
  wrap. Cosmetic; identity is package-private.
- N2: `containers.Runtime.WaitReady` (`run.go:235`) is dead production code;
  the run path polls via `containerplan.PollReady`. Duplicated logic.
- N3: `t.TempDir`/`t.Setenv` in unit files (`run_prepare_test.go:476`,
  `run_simulation_test.go:187`, `sync_test.go:145,240`) belong to the
  integration selection per the Go skill; moving them would break the recorded
  99% unit-coverage gate, so they stay.
- N4: `cli.execute` returns 130 whenever the context ended, even if the
  command already failed another way. Edge-case priority only.
- N5: `checkExpectation` reports only the first differing stream per run
  (stdout wins). Design; one finding per run.
- N6: `selection.Named` does not sort; sharded selections sort inside
  `Shard`, so per-input bytes stay deterministic.

Checked and clear: argv planning (`containerplan.PlanRun` matches 005 —
platform position, label, `--network none`, read-only/tmpfs/cap-drop,
pids-limit, equal memory+swap, halved second-run CPU, sorted env, `/work`
mount, `--interactive` iff stdin, local refs by bare tag); double-run
byte comparison incl. the `ignore`-stream skip sanctioned by 006 rule 6;
cleanup on all paths (deferred service teardown, timed-out container removal,
`cleanupAtInterrupt` with `WithoutCancel`, untrack-before-remove `Cleanup`);
exit mapping 0/1/2/124/125/126/127/130/141 incl. unpinned-catalog refusal
(exit 2); interfaces declared by consumers (`application.Runtime`,
`application.EnvImageBuilder`); no context stored in structs; every
goroutine (`supervisedExec` waiter) drained on all branches; `--single-run`
is in the 002 command tree, not creep; error strings lowercase;
`--record` never overwrites (missing-only write).

## Fix record (strict TDD, cycle 1)

Rule: RED must fail on an assertion, never on a build error.

- RED-1 (unit): added `Exec`-seam/stdin plumbing signatures but forwarded
  nothing yet; new `internal/adapters/containers/run_stdin_test.go`
  `TestRun_ForwardsStdinToContainer` (fake captures the stdin arg, asserts
  `"typed\n"`) FAILED on the assertion (`stdin=""`, want `"typed\n"`).
- RED-2 (integration): added `FAKECONTAINER_ECHO_STDIN` to
  `tests/support/fakecontainer/main.go` plus
  `TestContainers_RunDeliversStdin` asserting container stdout equals the
  fed bytes; FAILED (`stdout=""`, container got EOF).
- GREEN: `containers.Runtime.Run`/`Exec`-seam/`supervisedExec` thread stdin
  (`cmd.Stdin` set when non-empty; control-plane callers pass nil),
  `runAdapter` forwards instead of dropping, stale comment corrected. Both
  tests pass; no new `//nolint`, no signature growth past cyclop/funlen.
- Re-ran `nx run ayokoding-cli:test:quick` after the fix: exit 0.

## Result

1 blocking finding (F1), fixed with 2 regression tests. 6 non-blocking
notes, no action. Review cycles used: 1 of 2.
