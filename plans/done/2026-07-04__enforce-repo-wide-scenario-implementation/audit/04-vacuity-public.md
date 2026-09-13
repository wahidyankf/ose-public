# Coverage-Gate Vacuity Check — `organiclever-be` — ose-public

## Target name resolution

The task brief's candidate name `specs:behavior:coverage` exists verbatim in
`apps/organiclever-be/project.json` — no substitution needed. Confirmed by direct read of the target
definition (line 116):

```json
"specs:behavior:coverage": {
  "executor": "nx:run-commands",
  "options": {
    "command": "cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- specs behavior-coverage validate --shared-steps --exclude-dir messaging specs/apps/organiclever/behavior/organiclever-be/gherkin apps/organiclever-be"
  },
  "cache": true,
  "inputs": [
    "{workspaceRoot}/specs/apps/organiclever/behavior/organiclever-be/gherkin/**/*.feature",
    "{projectRoot}/src/**/*.fs"
  ]
}
```

## Command and result

```text
$ cd ~/ose-projects/ose-public
$ npx nx run organiclever-be:specs:behavior:coverage --skip-nx-cache

> nx run organiclever-be:"specs:behavior:coverage"

> cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- specs behavior-coverage validate --shared-steps --exclude-dir messaging specs/apps/organiclever/behavior/organiclever-be/gherkin apps/organiclever-be

Spec coverage valid! 3 specs, 11 scenarios, 31 steps — all covered.

 NX   Successfully ran target specs:behavior:coverage for project organiclever-be

EXIT CODE: 0
```

(First run returned identically from Nx cache; a forced `--skip-nx-cache` re-run reproduced the same
output live, ruling out a stale cache masking a real failure.)

Note: `01-scenario-census-public.md` independently greps 6 `.feature` files / 12 scenarios for
`organiclever-be`'s full directory (`db`, `health`, `journal`, `messaging` combined). This command
passes `--exclude-dir messaging`, which drops the 3 `messaging/*.feature` scenarios
(`nats-config.feature`, `nats-connect.feature`, `jetstream-demo.feature` — each carries a literal
`@unit`/`@e2e` tag; excluded specifically because those scenarios require live NATS infrastructure not
available to this step-text-matching check), leaving 3 folders (`db`, `health`, `journal` — matching
the tool's own "3 specs") and 9 scenarios by a direct file grep. The tool itself reports "11 scenarios"
for those same 3 folders — a minor internal counting discrepancy in the tool's own scenario tally
(possibly `Background:` blocks or a parsing nuance) that does not affect the pass/fail verdict and is
out of scope for this audit; it is noted here only so the two scenario counts in this plan's audit
files are not mistaken for a contradiction.

## Did it pass genuinely or vacuously?

**Genuinely, but at a coarser granularity than the plan's target model — and via a different engine
than the `@covers`-marker system the plan is meant to generalize.** Identical shape of finding to
`ose-be` (same F# backend template, same `--exclude-dir messaging` invocation pattern — see
`apps/ose-be/project.json:116-123`, not independently re-run here since it is the same code path).

### It is a real check, not a no-op

Tracing `specs behavior-coverage validate` in `apps/rhino-cli/src/cli.rs`
(`SpecsCommands::BehaviorCoverage` → `SpecsBehaviorCoverageCommands::Validate` → `specs_coverage::run`,
`apps/rhino-cli/src/cli.rs:821-823`) leads to `apps/rhino-cli/src/commands/specs_coverage.rs::run` →
`crate::internal::speccoverage::checker::check_all` →
`apps/rhino-cli/src/application/speccoverage/checker.rs::check_shared_steps` (since `--shared-steps` is
passed). This function (lines 162-202):

1. Parses every `.feature` file under the given specs dir (here `specs/apps/organiclever/behavior/organiclever-be/gherkin`,
   excluding `messaging/`) into scenarios/steps via `parse_feature_file`.
2. Walks the entire `app_dir` (here `apps/organiclever-be` — both `tests/unit/` and
   `tests/integration/` together) and extracts every step-definition pattern into a step-text matcher
   (`extract_all_step_texts`).
3. For each Gherkin step, calls `step_covered(&all_step_texts, step)` — the step's text (and any
   `{placeholder}` variants) must match a real step-definition regex somewhere in the app.
4. Also runs `check_orphan_step_impls`, flagging step-definition regexes that match no Gherkin step.

This is genuine step-text matching, not a trivial success stub — it inspects the actual TickSpec step
definitions under `apps/organiclever-be/tests/{unit,integration}/` and would fail
(`step_gaps`/`orphan_step_impls` populated → non-zero exit, per `specs_coverage.rs:231-270`) if a
Gherkin step in `db`/`health`/`journal` lacked a matching step implementation anywhere in the app.

### But it does not enforce what the plan describes

The plan's target model is: registry `levels: [unit, integration]` (per `organiclever-be`'s
`repo-config.yml` row) + per-scenario `@covers`/level tags, cross-checked so that **each required level
independently proves coverage of each scenario**. What actually runs today falls short of that in two
specific, verifiable ways:

1. **No per-level separation.** `check_shared_steps` runs once per Nx target
   (`organiclever-be:specs:behavior:coverage`) with `app_dir = apps/organiclever-be` — the whole app
   directory, containing both `tests/unit/` and `tests/integration/` steps. Both level-directories'
   step definitions are pooled into one matcher before checking. The registry says `organiclever-be`
   needs coverage at **both** `unit` and `integration`, but the live check only proves "the union of
   unit-dir and integration-dir step implementations covers every Gherkin step textually" — it cannot
   detect a scenario fully implemented at unit level with zero integration coverage (or vice versa).
   `ValidateArgs`'s `--unit-dir`/`--integration-dir`/`--e2e-dir` flags
   (`apps/rhino-cli/src/commands/specs_coverage.rs:29-37`, dispatched via `resolve_level_dirs` to
   `run_three_level`) exist for exactly this per-level separation, but `organiclever-be`'s
   `project.json` invocation passes none of them — it uses the pooled whole-app-dir mode.
2. **The `@covers`-marker engine is not wired to this command at all.**
   `application::behavior_coverage::validator::validate()` (the per-scenario, per-level, `// @covers
<spec>:<title>` marker engine documented in `02-covers-adoption-public.md`) is never called from
   `commands/specs_coverage.rs::run`/`run_domain` — grepping the whole `apps/rhino-cli/src/commands/`
   tree for `behavior_coverage` returns nothing. rhino-cli's own test source confirms this explicitly:
   `apps/rhino-cli/tests/specs_tree.rs:6-16` states _"The live CLI verb `specs behavior-coverage
validate` (`commands::specs_coverage::run`) is a different thing — Gherkin-step-vs-test-implementation
   gap checking, not `@covers` level-tag validation. The real `@covers` engine is dead/unwired CLI
   code"_. The `@covers`-marker engine currently exists only as dead code from the live command's
   perspective — exercised solely by rhino-cli's own `tests/specs_tree.rs` cucumber suite
   (self-referential dogfooding of `behavior-coverage.feature`/`domain-coverage.feature`, see
   `02-covers-adoption-public.md`), not by `organiclever-be` or any of the other 24 downstream projects.

### Net assessment

The `organiclever-be:specs:behavior:coverage` pass is a **real, non-trivial step-text match** — not
vacuous in the "always green no matter what" sense; it would genuinely catch an unimplemented Gherkin
step. But it is **vacuous relative to the plan's stated goal**: it does not verify per-level coverage
against the registry's `levels:` array, and it neither uses nor calls the `@covers`-marker + level-tag
cross-check engine this plan wants generalized repo-wide. Combined with the finding in
`01-scenario-census-public.md` (18 of 26 registry `specs:` glob strings don't match real paths) and
`02-covers-adoption-public.md` (zero `@covers` adoption outside rhino-cli's own meta-specs), the
foundational engine still needs to be (a) wired into the live CLI path, (b) made level-aware for
pooled/shared-steps projects like `organiclever-be`/`ose-be`/`ayokoding-www`/`web-ui`, and (c) pointed at
corrected, real `specs:` globs — before it can be generalized to the other 25 projects. This is a
foundational, not cosmetic, gap for this plan's tech-docs/delivery sections to account for.
