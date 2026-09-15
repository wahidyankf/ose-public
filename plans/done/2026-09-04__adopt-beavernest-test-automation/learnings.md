# Learnings

Transient execution log. Add a candidate only when a durable repository surface could prevent the
same gap for a future contributor.

Every future entry uses a stable `L-<number>` heading and includes exactly one repository-relevance
field before routing:

```text
## L-<number>: <short title>
Repository relevance: <public|private-only|discard>
Observation: <sanitized execution fact>
Durable prevention: <candidate rule, documentation, test, or automation surface>
Route: <filled only after Phase 21 safety and overlap gates>
```

`public` may enter an authorized public durable surface after the overlap scan. `private-only` may
be reported or routed only inside the private sibling; it never enters a public idea, plan, rule, or
export. `discard` records a one-line reason and is not routed.

Before archival, every surviving entry must be routed inline to a non-code home, filed as a
literally authorized follow-up plan, reported without plan authorization with handoff evidence, or
discarded with a one-line reason after both safety gates are applied.

## L-1: An Nx project name is inferred from its directory when `project.json` omits `name`

Repository relevance: public
Observation: `test-contract registry validate` reported `ose-www is absent from the Nx project
list` even though `apps/ose-www/project.json` exists, because that file — like most app projects
here — declares no `name` key and relies on Nx inferring the name from the containing directory.
A reader that only trusts an explicit `name` silently loses those projects, and the resulting
diagnostic blames the registry rather than the reader.
Durable prevention: any repository tool that enumerates Nx projects from `project.json` must fall
back to the containing directory name, and should be checked against `nx show projects --json`
rather than against a hand-listed project set.
Route: Discard -- already resolved: `TestContract.fs:projectNameOf` and `TestContractProject.fs:declaredName` already fall back to the containing-directory name when `project.json` omits `name`, with fixture-backed unit coverage. No residual gap to route.

## L-2: The local F# analyzer run does not reproduce every CI analyzer diagnostic

Repository relevance: public
Observation: `rhino-cli:lint` passed locally — with the Nx cache skipped, and again when the
offending expression was deliberately restored — while the same target in CI failed with
`GRA-TYPE-ANNOTATE-001 : Please annotate your type when using the 'string' function`. Both sides
load g-research.fsharp.analyzers 0.22.0 through the same command, and the verbose local log shows
the file being analyzed, so a green local lint is not evidence that the analyzer gate will pass.
Durable prevention: treat CI as the only authority for the G-Research analyzer rules, and avoid the
constructs those rules police in the first place — never apply `string` to an unannotated
expression in `apps/rhino-cli` F# sources; parse and compare typed values instead.
Route: Routed inline, merged with L-7 (same root cause) -- added a "F# analyzer/lint passes locally, fails in CI" row to `repo-governance/development/quality/ci-blocker-resolution/the-investigation-process-steps-1-4.md`'s Step 4 table.

## L-3: Captured tool transcripts leak the absolute worktree path

Repository relevance: public
Observation: `dotnet test` prints each built assembly and the test-run target as a fully resolved
path, so an evidence file captured verbatim from `nx run <project>:test:unit` carried six lines of
`/Users/<user>/.../worktrees/<name>/...` into a tracked file. The leak review caught it; no local
gate did, because absolute paths are neither a lint nor a formatting failure. The same pattern is
already present in several merged `plans/done/**` evidence files, so this is a class rather than a
one-off slip.
Durable prevention: normalize the repository-root prefix to a portable placeholder when capturing
any build, test, or coverage transcript into a tracked evidence file, and scan a candidate evidence
file for an absolute home-directory path before staging it rather than relying on the leak review
to find it.
Route: Routed inline -- appended a paragraph to `repo-governance/development/quality/no-machine-specific-commits/verifying-a-commit-before-pushing.md` naming captured build/test transcripts as a common miss, since the existing doc covered hand-typed paths but not tool-generated ones.

## L-4: The frozen Phase 4 shared-plumbing allowlist is narrower than its own splits

Repository relevance: public
Observation: the Phase 0 command that materializes `D-P4-PUB.shared-plumbing.txt` writes exactly
three paths (`RhinoCli.Application.fsproj`, `RhinoCli.UnitTests.fsproj`, `apps/rhino-cli/project.json`)
and then requires that list to equal the duplicate set of the eight `D-P4-PUB-*.paths.txt` leaves.
Recomputing that duplicate set from the frozen splits yields five paths: the two extra ones are
`apps/rhino-cli/src/RhinoCli.Application/src/TestContract.fs` and
`apps/rhino-cli/src/tests/unit/Steps/TestContractRegistryUnitTests.fs`, which `D-P4-PUB-REGISTRY`
and `D-P4-PUB-LAYOUT-MANIFEST` both claim. The command therefore cannot pass as written, and the
artifact was never materialized. It did not block `D-P4-PUB-BDD`, whose three shared paths are all
inside the narrow allowlist, but `D-P4-PUB-LAYOUT-MANIFEST` will touch two paths the allowlist does
not name.
Durable prevention: derive a shared-path allowlist from the leaf splits rather than restating it,
so a hand-written list can never disagree with the splits it is checked against; where a plan does
restate one, make the check the single source and the prose the derived text.
Route: Discard -- plan-specific, already resolved via `evidence/phase-4/R-PUB/{bdd,coverage}-shared-plumbing.tsv`; no other plan uses this frozen-allowlist mechanism, so a durable rule would catch nothing for a future plan.

## L-5: The evidence-ledger gate demands a separator the Markdown lint forbids

Repository relevance: public
Observation: every `DB-04D` requires
`awk -F '\t' '$1 == "EVIDENCE" && $2 == "<binding>"'` to count at least one row in
`implementation-notes.md`, so the ledger rows must be tab-separated. The rows have always been
separated by two spaces instead, which makes that count zero for every binding. Rewriting the
`D-P4-PUB-BDD` rows with real tabs made the count correct and then failed the commit: the ledger
lives in a fenced block inside a Markdown file, and `markdownlint` `MD010/no-hard-tabs` reported 35
errors across those seven lines. The two rules cannot both be satisfied in the current file, so the
rows were restored to two spaces and the gate's intent — at least one sanitized evidence row exists
for this binding — was proved with a separator-agnostic check instead.
Durable prevention: move the evidence ledger out of Markdown into a real `.tsv` file that
`markdownlint` never sees and the gate can parse by field, or restate the gate to match the
separator the lint permits. A gate whose passing condition is forbidden by another gate on the same
file is unsatisfiable, not merely inconvenient.
Route: Discard -- plan-specific, already resolved (ledger stayed two-space-separated with a separator-agnostic check); `implementation-notes.md`'s `EVIDENCE` ledger is bespoke to this one oversized plan, not a standard plan-folder convention, so no future plan would hit the same conflict.

## L-6: A case-insensitive ignore rule silently untracked a frozen allocation directory

Repository relevance: public
Observation: `D-P4-PUB-COVERAGE`'s frozen allocation places nine fixtures under
`apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Coverage/`. The repository's `.gitignore`
carries a bare `coverage/` rule for native coverage output, and `core.ignorecase` is true on this
platform, so that rule matched the capitalized `Coverage/` directory. All nine fixtures existed on
disk, were copied beside the test assembly by the `Fixtures/**/*.json` content glob, and made every
contract case pass — while `git status --untracked-files=all` never listed them. The delivery would
have committed a validator with no corpus and a green local suite. `git check-ignore -v` on one
fixture named the rule; a scoped negation directly beneath the existing
`!apps/rhino-cli/internal/coverage/` precedent re-included exactly that directory.
Durable prevention: after creating any allocation directory, assert that every planned path is
actually visible to Git — `git check-ignore -v <path>` must exit non-zero, or the file must appear
in `git status --untracked-files=all` — before treating a passing test run as evidence. A build
system that reads a file by glob and a version-control system that ignores it disagree silently, and
the test suite reports the build system's view.
Route: Discard -- already fully resolved: `.gitignore` carries the exact `!apps/rhino-cli/tests/unit/Fixtures/TestContract/Coverage/` negation, and all 9 fixtures are confirmed git-tracked (`git check-ignore` returns nothing on them).

## L-7: A stale `obj/` evaluation made the local F# analyzer skip the file the delivery added

Repository relevance: public
Observation: `rhino-cli:lint` runs the G-Research analyzers over each project. Locally the target
exited 0 on the committed `D-P4-PUB-COVERAGE` head; CI failed the same head with this exact
error:

```text
TestContractCoverage.fs(469,24): Error GRA-TYPE-ANNOTATE-001 : Please annotate your type when using the `string` function.
```

Same analyzer version (0.22.0), same tool manifest, same flags. Running the
analyzer with `--verbosity d` showed why: it resolves a project's compile list through a design-time
MSBuild evaluation backed by `obj/`, and the local `obj/` predated the new file, so the analyzer
reported "Running analyzers for" 13 files that did not include `TestContractCoverage.fs`. It
analyzed a compile list from before the delivery and exited 0 — a silent false pass, not a
disagreement about the rule. After `dotnet build` refreshed `obj/`, the same command listed 18 files
including the new one and reproduced the CI error exactly.
Durable prevention: whenever a delivery adds a `.fs` file, build the owning project before trusting
`lint`, and assert the analyzer's own file list contains the added path rather than reading its exit
code. An analyzer that silently narrows its input reports success for work it never inspected; the
exit code cannot distinguish "clean" from "not looked at".
Route: Routed inline -- see L-2; same table-row addition covers both, since L-7 is the diagnosed root cause of L-2's symptom.

## L-8: A declared Nx target outran the engine it invoked, and nothing ran it

Repository relevance: public
Observation: the merged `D-P4-PUB-COVERAGE` leaf declared
`rhino-cli:coverage:policy:validation`, running
`test-contract coverage validate --project rhino-cli`. Two things were wrong at once and neither
surfaced. First, the verb did not exist: the `test-contract` route table had no `coverage validate`
entry, so the invocation fell through to the unrouted-command error. Second, and more durably, the
coverage engine has no real-project reader — `loadDocument` resolves only names under
`apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Coverage`, so a `--project` argument has
nothing to bind to. The target survived review because no gate referenced it: the .NET quality gate
runs `typecheck lint test:quick specs:behavior:coverage` and `test:coverage`, and
`coverage:policy:validation` appears in no `dependsOn` and no workflow. A target that nothing runs
cannot fail, so its brokenness is invisible for exactly as long as it stays unwired.
Durable prevention: a policy target is only worth declaring once the engine behind it can read the
real repository. Pointing it at the fixture corpus instead would have made it green and vacuous —
it would re-assert what the unit suite already asserts while reading as project-level enforcement.
This delivery removed the target and routed the four verbs; the target returns with the
owner-migration reader, which is the first point at which it can measure anything.
Route: Discard -- already fully resolved: every migrated project's `project.json` now wires real `--project`-scoped `bdd`/`layout`/`coverage`/`manifest` validate targets (this plan's own Phase 20A/20B and the earlier `--project` reader work closed the exact vacuous-target gap described).

## L-9: A build output made the unit runner discover five copies of its own tests

Repository relevance: public
Observation: `ayokoding-www`'s vitest "unit" project includes `**/*.unit.{test,spec}.{ts,tsx}` and
excludes only `node_modules`. `next build` copies the entire application — tests included — into
`.next/standalone/apps/ayokoding-www/`, so any run that follows a build in the same workspace
discovers each `.unit.test.ts` twice. The copies fail on their own relative imports:

```text
Error: Cannot find module '../../core/manifest-integrity' imported from
.next/standalone/apps/ayokoding-www/src/features/course-paths/manifests/careers/careers-ai-manifest.unit.test.ts
```

Five suites failed while the same five passed from `src/`. Nothing about the change under test was
involved; `nx run-many -t build,...,test:quick` on one project is enough to reproduce it, and the
pre-push gate hits it whenever a build has run earlier in the session.
Durable prevention: a test-discovery glob that is not anchored to a source directory must exclude
the build output directory explicitly, because a build tool that copies sources and a test runner
that globs for sources disagree silently and the runner reports the build tool's view. Excluding
`**/.next/**` in the affected project restored `build` and `test:quick` to being composable in one
workspace.
Route: Reported without plan authorization -- the same `.next`-build-output test-discovery collision is confirmed still live in `apps/ose-www/vitest.config.ts` (unanchored unit glob, no `**/.next/**` exclude, real `next build` target), unlike the two sibling apps already fixed. Reported to the user in-conversation on 2026-09-03 as a follow-up one-line vitest-config fix; not required to complete this plan's own scope, so not landed inline per the code-routing downstream rule.

## L-10: A no-data placeholder turned an unreadable corpus into a passing suite

Repository relevance: public
Observation: `apps/crane-cli/tests/unit/Suite.fs` resolved its Gherkin corpus from `GHERKIN_ROOT`
and fell back to `specs/apps/crane/behavior/cli/gherkin`, the path Phase 5 retired. `GHERKIN_ROOT`
is set nowhere, so the fallback ran, `Directory.Exists` returned false, and `buildScenarioData`
answered with a single no-op row — added deliberately "so `[Theory]` does not fail with No data
found". `nx run crane-cli:test:unit` reported 99 passing tests; with the path corrected it reports 135. Thirty-six scenarios had been dark, and all thirty-six passed the moment they were loaded, so
the twelve step-definition files were never wrong. `specs:behavior:coverage` also passed throughout,
because it scans step sources statically and never asks whether the runtime found the corpus.
Durable prevention: a suite that loads no scenarios must fail, not degrade. Treat a missing corpus
directory, an unreadable feature file, and an empty expansion as three distinct errors that each
name the offending path, and never wrap per-file parsing in a `with _ -> Seq.empty` that turns a
binding defect into an empty set. Verify such a guard by pointing it at a path that does not exist
and asserting a non-zero exit — the same path had been exiting 0.
Route: Discard -- already fully resolved: `apps/crane-cli/tests/unit/Suite.fs` now raises on a missing corpus directory, zero feature files, or zero expanded scenarios, each naming the offending path; no placeholder no-op row remains.

## L-11: The Phase 4 enforcement foundation is built but almost entirely unwired

Repository relevance: public
Observation: grepping every `gates:` entry in `repo-config.yml`, every `apps/*/project.json` and
`libs/*/project.json` target, and every `.github/workflows/*.yml` for the six `test-contract`
validators returns zero call sites for all six. Only `parity manifest validate` (1) and
`specs structure validate` (19) are wired. Four of the six — `bdd`, `coverage`, `layout`,
`manifest` — require `--fixture <NAME>.json` and read only the fixture corpus, so their being
ungated is the known L-8 gap rather than a defect. But `test-contract registry validate` and
`registry validate-mapping` both read the real `repo-config.yml` and run against the repository
today, and neither is invoked by anything. `registry validate` had been exiting 1 on `main` with
seven findings, five of them naming `wahidyankf-www` and `wahidyankf-www-fe-e2e`, projects deleted
in #423 — the orphans survived precisely because no gate asked.
Durable prevention: a validator that reads real repository state is finished only when something
runs it. Register the gate in the same delivery unit that builds the validator, and prove the wiring
by making the repository violate the rule and watching the gate fail — an unwired validator and a
passing one are indistinguishable from the exit code of any gate run.
Route: Reported without plan authorization -- `test-contract registry validate`/`registry validate-mapping` are confirmed still unwired into any `repo-config.yml` gate, project target, or workflow, though currently clean (`state=verified projects=26`). Reported to the user in-conversation on 2026-09-03 as a follow-up gate-wiring change (with a Regression Test Mandate proof of a deliberate registry-drift failure); not required to complete this plan's own scope, so not landed inline.
