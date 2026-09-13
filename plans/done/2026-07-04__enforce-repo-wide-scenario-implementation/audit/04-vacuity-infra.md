# Coverage-Gate Vacuity Check — `coralpolyp-be` — ose-infra

## Command and result

```text
$ cd ~/ose-projects/ose-infra
$ npx nx run coralpolyp-be:specs:behavior:coverage --skip-nx-cache

> nx run coralpolyp-be:"specs:behavior:coverage"

> cargo run --quiet --manifest-path apps/rhino-cli/Cargo.toml -- specs behavior-coverage validate --shared-steps --exclude-dir test-support specs/apps/coralpolyp/behavior/coralpolyp-be/gherkin apps/coralpolyp-be

Spec coverage valid! 1 specs, 3 scenarios, 7 steps — all covered.

 NX   Successfully ran target specs:behavior:coverage for project coralpolyp-be

EXIT CODE: 0
```

(The target name matches `repo-config.yml`/`project.json` verbatim — no substitution needed. First run
came back from Nx cache with the identical message; a forced `--skip-nx-cache` re-run reproduced the
same output live.)

Note: the reported "3 scenarios" is one more than the 2 literal `Scenario:` blocks in
`health-check.feature` (see `01-scenario-census-infra.md`) — the file also has a `Background: Given
the API is running` block, which the parser evidently counts as an additional scenario-equivalent
unit. This is a minor counting quirk, not a correctness bug in the pass/fail verdict.

## Did it pass genuinely or vacuously?

**Genuinely, but at a coarser granularity than the plan's target model — and via a different engine
than the `@covers`-marker system the plan is meant to generalize.**

### It is a real check, not a no-op

Tracing `specs behavior-coverage validate` in `apps/rhino-cli/src/cli.rs` (`SpecsCommands::
BehaviorCoverage` → `SpecsBehaviorCoverageCommands::Validate` → `specs_coverage::run`) leads to
`apps/rhino-cli/src/application/speccoverage/checker.rs::check_shared_steps`. With `--shared-steps`,
this function:

1. Parses every `.feature` file under the given specs dir(s) into scenarios/steps
   (`parse_feature_file`).
2. Walks the entire `app_dir` (here `apps/coralpolyp-be`, excluding `test-support`, `target`,
   `generated-contracts`, etc.) and extracts every step-definition pattern
   (`#[given(...)]`/`#[when(expr = ...)]`/`#[then(...)]`) into a `StepMatcher`
   (`extract_all_step_texts`).
3. For each Gherkin step, calls `step_covered(&all_step_texts, step)`, which requires the step's
   primary text (and all `{placeholder}` variants) to match a real step-definition regex.
4. Also runs `check_orphan_step_impls` (flags step definitions that match nothing in the specs).

This is genuine step-text matching, not a trivial success stub — it inspects
`apps/coralpolyp-be/tests/unit/steps/health_steps.rs` and `tests/integration/steps/health_steps.rs`
and would fail (`step_gaps`/`orphan_step_impls` populated → non-zero exit) if a Gherkin step lacked a
matching `#[given]`/`#[when]`/`#[then]` implementation anywhere in the app.

### But it does not enforce what the plan describes

The plan's target model is: registry `levels: [unit, integration]` (per `coralpolyp-be`'s
`repo-config.yml` row) + per-scenario `@covers`/level tags, cross-checked so that **each required
level independently proves coverage of each scenario**. What actually runs today falls short of that
in two specific, verifiable ways:

1. **No per-level separation.** `check_shared_steps` is invoked once per Nx target
   (`coralpolyp-be:specs:behavior:coverage`) with `app_dir = apps/coralpolyp-be` — the _whole_ app
   directory, which contains both `tests/unit/steps/` and `tests/integration/steps/`. Step
   definitions from both level-directories are pooled into one `StepMatcher` before matching. The
   registry says `coralpolyp-be` needs coverage at **both** `unit` and `integration`, but the live
   check only proves "the union of unit-dir and integration-dir step implementations covers every
   Gherkin step textually" — it cannot detect a scenario that is fully implemented at the unit level
   but has zero integration coverage (or vice versa). `resolve_level_dirs`/the three-level
   `--unit-dir`/`--integration-dir`/`--e2e-dir` flags exist in `ValidateArgs` for exactly this
   per-level separation, but `coralpolyp-be`'s `project.json` invocation does not pass them — it uses
   the pooled whole-app-dir mode.
2. **The `@covers`-marker engine is not wired to this command at all.** `application::
behavior_coverage::validator::validate()` (the per-scenario, per-level, `// @covers <spec>:<title>`
   marker engine that `02-covers-adoption-infra.md` describes) is never called from
   `commands/specs_coverage.rs::run`/`run_domain` — grepping the whole `apps/rhino-cli/src/commands/`
   tree for `behavior_coverage` returns nothing. The doc-comment on `run_domain`
   (`specs_coverage.rs:273-282`) confirms this in-repo: _"An eligible project still runs the same
   underlying scan as behavior-coverage today ... that path-based filter has nothing to act on until
   such content is physically split out, which is a content-authoring decision tracked as a separate
   follow-up, not a mechanical wiring change."_ The `@covers`-marker engine currently exists only as
   dead code from the live-command's perspective — it is exercised solely by rhino-cli's own
   `tests/specs_tree.rs` cucumber suite (self-referential dogfooding of the two meta-specs
   `behavior-coverage.feature`/`domain-coverage.feature`, see `02-covers-adoption-infra.md`), not by
   any of the 7 downstream projects' actual coverage gates.

### Net assessment

The `coralpolyp-be:specs:behavior:coverage` pass is a **real, non-trivial step-text match** — it is
not vacuous in the "always green" sense, and it would catch a genuinely unimplemented step. But it is
**vacuous relative to the plan's stated goal**: it does not verify per-level coverage against the
registry's `levels:` array, and it does not use (or even call) the `@covers`-marker + level-tag
cross-check engine the plan wants generalized repo-wide. Building that generalization is not a matter
of copying an already-working mechanism to 7 more projects — the mechanism itself
(`application::behavior_coverage::validator`) still needs to be wired into the live CLI path and made
level-aware for pooled/shared-steps projects like `coralpolyp-be`, `coralpolyp-fe`, and `ts-ui` before
it can be generalized. This is a foundational, not cosmetic, gap for the plan's tech-docs/delivery
sections to account for.
