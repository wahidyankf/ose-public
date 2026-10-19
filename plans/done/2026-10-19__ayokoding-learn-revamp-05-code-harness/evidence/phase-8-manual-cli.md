# Phase 8 manual CLI verification (checks 1–15)

Measured 2026-10-18 from the worktree root. Every command below ran through
`rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . --`
except `CLI-BUILD`, which ran through the same runner at standard tier per the
Command Reference. Paths are repository-relative. No container was left behind:
after check 13, `docker ps -a --filter label=ayokoding.run` and
`docker network ls --filter name=ayokoding-` both list nothing but headers.

- `CLI-BUILD` (`npm exec nx -- run ayokoding-cli:build`): exit 0,
  `NX Successfully ran target build for project ayokoding-cli`.

| #   | Command (from the worktree root)                                                                                                 | Exit                                                                      | Observed first lines                                                                                                                                                                                                                                                                                                                                                                                                       | Verdict                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `apps/ayokoding-cli/dist/ayokoding-cli --help`                                                                                   | 0                                                                         | stdout (32 lines): `Check AyoKoding course code examples in pinned containers.`, the exit-status table (0, 1, 2, 124, 125, 126, 127, 130, 141), `Available Commands:` listing `examples`, `help`, `toolchains`; stderr empty                                                                                                                                                                                               | MATCH                                                       |
| 2   | `apps/ayokoding-cli/dist/ayokoding-cli`                                                                                          | 2                                                                         | stdout empty; stderr (21 lines) starts `Error: ayokoding.usage.missing-command: no command given`, then usage                                                                                                                                                                                                                                                                                                              | MATCH                                                       |
| 3   | `apps/ayokoding-cli/dist/ayokoding-cli --version`                                                                                | 0                                                                         | stdout: `ayokoding-cli dev (commit unknown, catalog 85b49aa7366b37872f561a4b1f535e32a711a170b93d107b52de13b6cc47b6f0)`; stderr empty                                                                                                                                                                                                                                                                                       | MATCH                                                       |
| 4   | `apps/ayokoding-cli/dist/ayokoding-cli examples run`                                                                             | 2                                                                         | stderr: `Error: ayokoding.usage.missing-selection: one of --course, --since, or --all is required`, then usage                                                                                                                                                                                                                                                                                                             | MATCH                                                       |
| 5   | `apps/ayokoding-cli/dist/ayokoding-cli --output json examples run`                                                               | 2                                                                         | stdout empty; stderr one JSON body: `{"schemaVersion":1,"error":{"code":"ayokoding.usage.missing-selection","message":"one of --course, --since, or --all is required"}}`                                                                                                                                                                                                                                                  | MATCH                                                       |
| 6   | `apps/ayokoding-cli/dist/ayokoding-cli examples check --since origin/main`                                                       | 0                                                                         | stdout: `0 opted-in courses; nothing to run` and `0 of 126 applicable courses covered`; stderr empty; `docker ps -a --filter label=ayokoding.run` lists nothing                                                                                                                                                                                                                                                            | MATCH (day count 126, not the 116 printed in tech-docs/008) |
| 7   | `apps/ayokoding-cli/dist/ayokoding-cli examples sync --course just-enough-python --output json`                                  | 1                                                                         | stdout: JSON payload, 106 findings (preview, no `--write`): `ayokoding.sync.unanchored-output`=94, `ayokoding.sync.unanchored-fence`=11, `ayokoding.sync.anchor-without-fence`=1; stderr empty                                                                                                                                                                                                                             | MATCH                                                       |
| 8   | `apps/ayokoding-cli/dist/ayokoding-cli --content apps/ayokoding-cli/tests/testdata/courses examples check --course green-python` | 0                                                                         | stdout: four `passed` lines (`ex-01-hello`, `ex-02-range`, `ex-03-env`, `ex-04-immutable`) plus `1 of 14 applicable courses covered`; stderr empty                                                                                                                                                                                                                                                                         | VARIANCE (see note 1)                                       |
| 9   | Same with `--course failing-run`                                                                                                 | 1                                                                         | stdout: two `passed` lines plus nine `failed` lines carrying the four run-result codes (`ayokoding.examples.exit-mismatch`, `.stdout-mismatch`, `.stderr-mismatch`, `.run-timeout`) and `ayokoding.sync.unreferenced-unit` lines (by fixture design: the course ships no lessons); then `1 of 14 applicable courses covered`; stderr empty                                                                                 | MATCH                                                       |
| 10  | Same with `--course simulation`, replay `--seed 17`                                                                              | 2 on the literal doc slug, 0 on the existing unit (see note 2)            | literal `--unit learning/code/ex-02-raft-bug`: stderr `Error: ayokoding.usage.invalid-arguments: unit learning/code/ex-02-raft-bug does not exist in course simulation`. With `--unit learning/code/ex-01-sim --seed 17`: stdout `simulation learning/code/ex-01-sim main: passed`, `simulation learning/code/ex-01-sim main: replay seed 17`, then the `t=0/1/2` trace lines; no expected-output comparison; stderr empty | VARIANCE on the slug only; replay behavior MATCH            |
| 11  | `NO_COLOR=1 ... --color auto --content apps/ayokoding-cli/tests/testdata/courses examples check --course failing-run`            | 1                                                                         | stdout shows the same passed/failed lines as check 9; 0 ESC bytes on stdout, 0 on stderr                                                                                                                                                                                                                                                                                                                                   | MATCH                                                       |
| 12  | `AYOKODING_CONTAINER_CLI=does-not-exist ... examples check --course green-python`                                                | 127                                                                       | stderr: `Error: ayokoding.env.container-cli-not-found: container command does-not-exist not found on PATH` plus usage; stdout carries only `0 of 0 applicable courses covered`                                                                                                                                                                                                                                             | MATCH                                                       |
| 13  | Check 8 course swapped to `services-postgres` under `timeout --verbose -s INT 5`                                                 | 1 on the literal run (finished first); 130 on the slow rerun (see note 3) | literal run stdout: `services-postgres learning/code/ex-01-query main: passed`, one `unreferenced-unit` finding, `1 of 14 applicable courses covered`; INT never delivered (warm cache). Slow rerun (`examples check --all` on the fixture root): stderr `timeout: sending signal INT to command ...` (INT delivered), CLI exit 130 with `--preserve-status` (124 without it, per `timeout` semantics); leftovers empty    | MATCH on the run where INT fired                            |
| 14  | `apps/ayokoding-cli/dist/ayokoding-cli --help \| head -1`, then `PIPESTATUS[0]`                                                  | 0 (outer)                                                                 | stdout first line `Check AyoKoding course code examples in pinned containers.`; `PIPESTATUS[0]`=0, allowed (help fits the pipe buffer); never 1 or 2                                                                                                                                                                                                                                                                       | MATCH                                                       |
| 15  | `examples validate --include-inert --output json` and `examples sync --include-inert --output json`                              | 1 and 1                                                                   | validate: 6678 findings; sync: 13189 findings; scope (`coverage --include-inert --output json`): 182 courses, 126 applicable, 56 inert. Per-course table saved in `phase-8-content-baseline.md`                                                                                                                                                                                                                            | MATCH                                                       |

## Notes (variances: stale doc text, no CLI bug)

1. Check 8: tech-docs/008 expects "two units green; progress with durations on
   stderr only". The `green-python` fixture grew from two units (Phase 4) to
   four (`ex-03-env`, `ex-04-immutable` added in Phase 5; Phase-5 evidence
   records the same four `passed` lines). No progress emitter exists anywhere
   in the as-built CLI (`renderCheck` writes the payload to stdout only; a
   repo-wide search for progress/elapsed/TTY output finds nothing outside the
   conditional tier rule), and no spec scenario requires one. The observed
   behavior — exit 0, every unit green, payload-only stdout, empty stderr —
   satisfies the CLI contract. Root cause is stale expected-column text, which
   is outside this task's ownership (plan docs must not be touched), so no
   code fix applies.
2. Check 10: the slug `learning/code/ex-02-raft-bug` matches no unit in the
   `simulation` fixture (units are `ex-01-sim`, `ex-02-no-summary`,
   `ex-03-few-seeds`, `ex-04-bugdemo`) and appears nowhere else except
   tech-docs/008; the simulation spec uses a generic "simulation unit with 64
   seeds". The replay behavior itself passes against the existing 64-seed unit
   `learning/code/ex-01-sim` with `--seed 17`: exit 0, trace printed, no
   expected-output comparison.
3. Check 13: the first attempt finished before the 5 s delay (exit 1), so INT
   was never delivered — the plan anticipates this warm-cache case. The
   deterministic rerun (`examples check --all` over the 14 fixture courses,
   which always runs past 5 s) delivered INT and the CLI exited 130 after
   removing its containers and networks. Plain `timeout` reports 124 for that
   run; `--preserve-status` surfaces the CLI's own 130.

## Surface-gate reasoning

No UI or HTTP API changes in this task (only the two evidence files were
written; no source file was modified), so the UI Web Quality Gate and the
rule-15/rule-16 tester retests are not applicable. The CLI's tester proof is
this checklist plus the E2E adapter (`ayokoding-cli:test:e2e`, green in
Phases 5–7). No CLI behavior bug was exposed, so no fix and no regression
test were added.

## Post-F1-fix re-runs (Phase 8 gate, 2026-10-18)

After the F1 stdin fix (recorded in `phase-8-review.md`; `CLI-QUICK`
already green), `CLI-INTEGRATION`, `CLI-E2E`, `CLI-BEHAVIOUR`, and `SMOKE`
were re-run once more from the worktree root with `--skip-nx-cache`:
integration and behaviour at ephemeral/standard, E2E and SMOKE at
ephemeral/heavy. `CLI-BUILD` was rebuilt first so SMOKE used the fixed
binary. No source file was modified by this task.

| Gate                | Command (from the worktree root)                                                                                                                                                                  | Exit              | Observed                                                                                                  | Verdict |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------- | ------- |
| CLI-INTEGRATION     | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-cli:test:integration --skip-nx-cache`                                                   | 0                 | `ok tests/bdd 68.939s`, `ok tests/integration 8.455s`, `NX Successfully ran target test:integration`      | PASS    |
| CLI-BEHAVIOUR       | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-cli:test:coverage --skip-nx-cache`                                                      | 0                 | all four adapters green; `13 features, 64 expanded scenarios`, `NX Successfully ran target test:coverage` | PASS    |
| CLI-E2E             | `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ayokoding-cli:test:e2e --skip-nx-cache`                                                              | 0                 | `ok tests/bdd 68.075s`, `NX Successfully ran target test:e2e`                                             | PASS    |
| SMOKE               | `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- apps/ayokoding-cli/dist/ayokoding-cli --content apps/ayokoding-cli/tests/testdata/toolchain-smoke examples check --all` | 0 (third attempt) | 35 `passed` lines, 0 `failed`, `27 of 27 applicable courses covered`                                      | PASS    |
| leftover containers | `docker ps -a --filter label=ayokoding.run`                                                                                                                                                       | 0                 | headers only, no containers                                                                               | PASS    |
| leftover networks   | `docker network ls --filter name=ayokoding-`                                                                                                                                                      | 0                 | headers only, no networks                                                                                 | PASS    |

SMOKE notes: the first two attempts never ran to completion — HIPPO shed
the ephemeral child under host macOS memory-warning pressure
(`hippo.limit.pressure-shed`, wrapper exit 124; the CLI printed only
`0 of 0 applicable courses covered` before the shed). Root cause is
environmental, not a CLI bug: `examples affected --all` against the same
content root selects all 27 courses both locally and through the same
HIPPO runner (exit 0), and the third attempt ran clean with the
35-passed/0-failed baseline identical to the Phase 5 gate runs. No fix
and no regression test apply, so none were added.
