---
description: Measure the integrated path not an isolated invocation, establish the critical path before prescribing a wall-clock remedy, and treat a remedy written before anyone saw a timeline as a hypothesis
when_to_use: Use before hard-gating a plan phase on a benchmark number, or before applying a pre-authored performance remedy.
---

# Rules 2-4

## 2. Measure the integrated path, not an isolated invocation

A per-invocation benchmark does not predict its saving inside a batched or child-process execution
model. Measure the path that actually runs in production before hard-gating a phase on the number.

Worked example: `prettier` and `markdownlint-cli2` were benchmarked as standalone
`npx --no -- <tool>` invocations (622 ms / 441 ms), yielding a projected ~250 ms per-tool saving and
a `≤ 900 ms` acceptance clause. The real pre-commit path never paid that cost: the registry's
commands were always bare, and the outer batch runner of the time spawned
`npx --no -- lint-staged` (retired 2026-09-19) **once** for the whole batch, with both tools running
as its children on a `node_modules/.bin`-inclusive `PATH`.
The `npx` tax the benchmark measured was never being paid twice. Actual measured saving: −138 ms
(−5.4 %), against a projection of ~500 ms — roughly 4× overstated.

**The tell**: the benchmark and the production path differ in _how the process is spawned_. Whenever
that is true, the isolated number is an upper bound at best.

## 3. Establish the critical path before prescribing a wall-clock remedy

Wall-clock in a fan-out DAG is a **max**, not a sum. It is completely insensitive to everything off
the critical path, so any wall-clock remedy must first prove the component it changes is _on_ it.

Worked example: a CI wall-clock p50 regression (974.5 s → 1,219 s) triggered a pre-authored remedy —
"re-balance group composition." The per-job timeline showed the critical path was the TypeScript
quality gate at 1,033 s, a job the topology change never touched, which had taken 1,030 s and
1,018 s on the same branch _before_ the change. All gate groups finished ~13 minutes clear of the
critical path. Re-balancing them could not have moved wall-clock by one second.

The corollary: **sum-type and max-type metrics do not move together.** Runner-seconds (a sum) fell
47.6 % in the very runs where wall-clock (a max) rose. A plan that treats both as symptoms of one
cause will mis-diagnose whichever it reads second.

## 4. A remedy written before anyone saw a timeline is a hypothesis

Plans routinely pair a metric with a prescribed fix at authoring time. That pairing is a guess about
which component will hold the number. Record it as a guess: when the gate fires, re-derive the
component from the actual timeline before applying the prescribed remedy, and if they disagree, the
timeline wins and the plan's remedy gets corrected in place rather than executed.
