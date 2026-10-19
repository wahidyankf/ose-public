# Code Example Harness

Rules HC1–HC7 from plan `ayokoding-learn-revamp-05-code-harness`: the durable content-author
obligations for course code examples. The harness is `ayokoding-cli` (`apps/ayokoding-cli/`),
driven per unit by `run.yaml`. The PR gate runs `ayokoding-www:examples:check` on affected
opted-in courses, plus a monthly full run. HC8 (course completeness) lives in the AyoKoding gate
adapter's [Example Harness](../../../../repo-governance/development/quality/gate-adapters/ayokoding-www.md#example-harness).

## HC1 — A course with any `run.yaml` is opted in

A course with any `run.yaml` is opted in. From then on every unit is covered, there is no layout
or sync finding, and `ayokoding-cli examples check --course <slug>` MUST exit 0.

- **Reason**: opt-in must be unambiguous so gates and authors know which courses the harness judges.
- **Violating**: an opted-in course with one unit missing its `run.yaml`.
- **Conforming**: every unit carries `run.yaml` and the check exits 0.
- **Enforcement**: `gated` by `ayokoding-www:examples:check` (PR gate on affected courses; monthly full run).

## HC2 — Course code lives only in canonical units

Course code MUST live only in canonical units: `learning/code/ex-NN-<slug>/`,
`drilling/code/kata-NN-<slug>/`, `learning/capstone/code/`.

- **Reason**: canonical units let the harness find code without search and keep lessons portable.
- **Violating**: a unit at `learning/extra/code/`.
- **Conforming**: every unit under one of the three patterns.
- **Enforcement**: `gated` by `examples validate` (`ayokoding.layout.*`).

## HC3 — Lesson fences match their files

In an opted-in course, every code fence MUST be anchored and byte-identical to its target, or
marked `<!-- harness: illustration -->`; every `**Output**` block MUST be anchored to an
expected-output file.

- **Reason**: lesson blocks readers copy must equal the files the harness runs, or be marked as not runnable.
- **Violating**: one character changed in an anchored fence.
- **Conforming**: fences byte-identical to their files; outputs anchored to `expected/`.
- **Enforcement**: `gated` by `examples sync` (`ayokoding.sync.*`).

## HC4 — The illustration marker is only for non-runnable code (judgement)

`<!-- harness: illustration -->` MUST mark only code that is not meant to run as shown: a
fragment, pseudo-code, a deliberately broken snippet, or a tool-install or launch command.

- **Reason**: the marker excuses code from execution only when running it as shown is meaningless.
- **Violating**: the marker on a complete example to dodge a red run.
- **Conforming**: the marker on a fragment with its setup omitted.
- **Disposition**: `unenforced by decision` — intent needs judgement; the coverage report counts markers per course.

## HC5 — Every run is deterministic

Every run MUST be deterministic: no network, no wall-clock reads that reach output or control
flow, explicit seeds, and no output that depends on thread order.

- **Reason**: runs must reproduce byte-identically across the double run, CI, and the monthly full run.
- **Violating**: printing `time.time()` into stdout (the double run mismatches).
- **Conforming**: fixed environment facts only (`SECRET_TOKEN=absent`, `TZ=UTC`, `SOURCE_DATE_EPOCH=0`).
- **Enforcement**: `gated` in part (no network, fixed environment, double run); the rest judged by the gates.

## HC6 — Simulation convention for nondeterministic behaviour

Examples whose behaviour depends on time, delivery, failure, or interleaving MUST follow the
simulation convention S1–S9.

- **Reason**: nondeterministic domains stay green by simulating the behaviour instead of exhibiting it.
- **Violating**: a simulation printing no summary line.
- **Conforming**: a summary line over at least 32 seeds.
- **Enforcement**: `gated` in part (S6–S7: summary line, at least 32 seeds); S1–S5, S8, S9 judged.

## HC7 — Static mode needs a closed-vocabulary reason and a note

`mode: static` MUST be used only with a reason from `cloud`, `cluster`, `ios`, `android`,
`windows`, and a note saying what the static run proves.

- **Reason**: static mode is an exception to execution; each use justifies itself in the closed vocabulary.
- **Violating**: `mode: static` with no `static.note`.
- **Conforming**: `reason: ios` with a note saying the run parses without the Apple SDK.
- **Enforcement**: `gated` by `examples validate` (`ayokoding.runspec.*`).

## Author workflow

Edit the code files, never the fences by hand. Format, then run `examples sync --write` to copy
file bytes into fences, then `examples check --course <slug>`, then commit. The check stays
green from the first opt-in commit: add `run.yaml` together with its code, fences, and expected
output.

## Worked example

Adding `learning/code/ex-05-greet/` with `greet.py`, its `run.yaml`, and its `expected/` file:
anchor the fence in the lesson (`**learning/code/ex-05-greet/greet.py**`), anchor the
`**Output**` block to the expected file, run `examples sync` (clean), then
`examples check --course <slug>` (exit 0). A fragment of the call sequence shown only to explain
the idea carries `<!-- harness: illustration -->` instead of an anchor.
