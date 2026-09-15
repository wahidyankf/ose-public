<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry (or record the explicit "none" escape) before archival. -->

# Learnings: lms-init

## Learning: the mermaid gate threshold is looser than the binding label rule

- **Context**: authoring `tech-docs.md`. `rhino-cli md mermaid validate` reported
  `label_too_long` at 30 characters, so the diagrams were rewritten to sit at or just under 30.
  The gate then passed, but the rendered diagram visibly clipped every label past roughly 27
  characters.
- **Observation**: the binding rule is
  [Rule 3](../../../repo-governance/conventions/formatting/diagrams/common-syntax-errors-label-constraints-rule-3-line-length.md)
  — **20** characters per `<br/>` segment. The gate's default `--max-label-len` is **30**, which
  that document describes as "Mermaid's `wrappingWidth` baseline" and explicitly pairs with the
  advice to "use `--max-label-len 20` for stricter validation". So a green default-threshold run
  proves the diagram is under the backstop, not under the rule. The repository already documents
  this in three places, including a dedicated
  [render-fidelity caveat](../../../repo-governance/conventions/formatting/diagrams/mermaid-render-fidelity-caveat.md)
  stating that a green validate is "necessary, not sufficient".
- **Why it might generalize**: an author who meets the number the gate prints, rather than the
  number the convention states, ships a clipped diagram with a green gate. The failure mode is
  silent and only visible in rendered output. Candidate durable fixes to weigh at triage: lower the
  flowchart default to 20; or emit the Rule-3 number in the violation message so the printed
  threshold and the binding rule agree; or note in the flowchart width-constraints document that
  authors should run the strict flag before committing. The existing
  `plans/ideas/q2-not-urgent-important/mermaid-state-label-render-clipping-warn.md` two-pager
  covers the neighbouring `stateDiagram` case and may be the right place to fold this in rather
  than opening a new brief — check it first, and note that its own analysis warns any such rule
  must WARN rather than FAIL given the corpus size.
- **Terminal state**: Reported without plan authorization. The knowledge itself is already durable — the render-fidelity caveat states that a green `md mermaid validate` is necessary but not sufficient, and names Rule 3's 20-character flowchart limit — so no doc edit would add anything. What is missing is automatic: lowering the flowchart default to 20, or printing Rule 3's number in the violation message so the printed threshold and the binding rule agree. Both are `apps/rhino-cli` changes, which the code-routing rule forbids landing in this plan, and no `plans/ideas/` artifact was authorized. Handoff evidence: this entry, plus the existing neighbouring two-pager `plans/ideas/q2-not-urgent-important/mermaid-state-label-render-clipping-warn.md`, which its own analysis says any such rule must WARN rather than FAIL.

## Learning: absolute worktree paths in a delivery document are a leak, not a convenience

- **Date**: 2026-09-08
- **Context**: the plan-authoring PR's required `pr-leak-review` flagged four occurrences of a
  resolved home-directory path inside `delivery.md` — the cross-repository `diff` commands and the
  private-worktree provisioning step. They had been written as fully-resolved absolute paths so the
  commands would be copyable verbatim.
- **What happened**: the paths violate
  [what-counts-as-machine-specific-information.md](../../../repo-governance/development/quality/no-machine-specific-commits/what-counts-as-machine-specific-information.md)
  §Formal Plan Delivery Documents, which names `plans/**/delivery.md` explicitly and requires a
  worktree be identified only by its repository-relative route. The same section states that the
  required PR leak review inspects the changed delivery document for exactly this. The fix resolves
  the private worktree once, at the step that provisions it, into a `PRIVATE_WT` shell variable
  derived from `git worktree list --porcelain`, and expresses every later cross-repository command
  relative to the public worktree root.
- **Why it might generalize**: "make the command copyable verbatim" is a real authoring pressure in
  execution-grade plans, and it pulls directly against the portability rule. Nothing catches it at
  authoring time — the violation surfaces only at the leak review, after the PR is open and its CI
  has already run. Candidate durable fixes to weigh at triage: have `plan-checker` reject a
  home-directory or resolved host path anywhere in a delivery document, not only in the worktree
  identity section it already checks; or state the portable two-repository idiom (resolve once into
  a variable at the provisioning step) directly in the plans convention so authors reach for it
  before inventing an absolute path.
- **Terminal state**: Reported without plan authorization. The binding rule already exists and already names `plans/**/delivery.md`; the gap is that nothing catches a violation until the leak review, after the PR is open. The fix is either a `plan-checker` extension or a pre-commit path check — both code — and the portable two-repository idiom would be new normative text on a rules surface, which requires a `rules-propagation` run this plan's Phase 5 does not include. Handoff evidence: this entry records the exact violation, the four occurrences, and the fix actually applied (resolve the private worktree once into a `PRIVATE_WT` variable at the provisioning step).

## Learning: implementation notes are part of the delivery document the leak review inspects

- **Date**: 2026-09-08
- **Context**: minutes after fixing four machine-specific absolute paths in `delivery.md`, the very
  first Atomic Sync Ritual note written back into that same file recorded the literal output of
  `rtk pwd` — reintroducing the exact path class that had just been rejected.
- **What happened**: caught on re-read before commit and rewritten to state only that the path ends
  in `worktrees/lms-init`. The pull is structural, not careless: the ritual asks for notes that are
  repo-grounded and quote what was actually run, and the most direct way to evidence "I confirmed
  the location" is to paste the resolved path. But the portability rule in
  [what-counts-as-machine-specific-information.md](../../../repo-governance/development/quality/no-machine-specific-commits/what-counts-as-machine-specific-information.md)
  §Formal Plan Delivery Documents scopes to the whole committed document, notes included — and the
  leak review inspects the complete changed file, not only the prose an author considers "content".
- **Why it might generalize**: the two obligations pull in opposite directions at exactly the
  moment an executor is moving fastest, and the evidence for a location check is precisely the
  thing that must not be committed. The safe form is to record the _property_ that was verified
  ("the path ends in `worktrees/lms-init`"), not the value that satisfied it. Candidate durable
  fixes to weigh at triage: state this explicitly in the Atomic Sync Ritual's notes guidance, so
  the rule is visible where notes are written rather than only where worktree identity is declared;
  and extend whatever check enforces the portability rule to cover HTML-comment note blocks, since
  an author who has just read the rule can still violate it one edit later.
- **Terminal state**: Reported without plan authorization. Same surface and same blocker as the entry above: the portability rule already scopes to the whole committed document including notes, so nothing is under-documented. The missing piece is an enforcement extension that reads HTML-comment note blocks, which is code. Handoff evidence: this entry, plus the concrete safe form it identifies — record the property verified ("the path ends in `worktrees/lms-init`"), never the value that satisfied it.

## Learning: the parity-sibling repositories have drifted apart on their pinned npm version

- **Date**: 2026-09-08
- **Context**: Phase 0's `rtk npm run doctor -- --fix` exits 0 in both worktrees, but `ose-public`
  reports 15/16 tools OK with one warning — npm v11.16.0 installed against a required 11.11.0 —
  while the private sibling reports 16/16 with no warning on the very same host and the same installed
  npm.
- **What happened**: the requirement, not the installation, is what differs. `ose-public`'s
  `package.json` pins `volta.npm` to `11.11.0`; the private sibling pins `11.16.0`. One host, one npm,
  two verdicts. Left unbumped: this plan is authorized to initialize an LMS backend, and changing a
  pinned toolchain version is a governance change with workspace-wide CI blast radius and its own
  propagation obligation.
- **Why it might generalize**: the two repositories are documented parity siblings, but the parity
  that is actually _enforced_ is narrow — `apps/rhino-cli` byte-identity via
  `parity-manifest.sha256`. Nothing checks that their toolchain pins agree, so this divergence can
  persist indefinitely while every gate stays green, and the only symptom is a warning line one
  repository prints and the other does not. Candidate durable fixes to weigh at triage: extend the
  nightly parity audit to compare `volta` pins across the sibling pair; or state explicitly in the
  related-repositories reference which surfaces are parity-bound and which are deliberately
  independent, so a divergence like this is legible as intentional or accidental rather than
  ambiguous.
- **Terminal state**: Routed inline to [`docs/reference/related-repositories.md`](../../../docs/reference/related-repositories.md), under **What is deliberately not identical**, which already catalogues one `package.json` divergence between the siblings. That section is descriptive reference content on a non-rules surface, so the edit adds no obligation and triggers no propagation. Extending the nightly parity audit to compare `volta` pins is the automatic fix and remains code-homed and unfiled.

## Learning: a controlled vocabulary nobody validates fails open, not closed

- **Context**: DU2 rules-propagation Step 7. The plan expected the `lang:`/`platform:` tag
  vocabulary to be "enforced by `repo-config validate` plus the tag convention". Checking that
  claim disproved it: `repo-config validate` reads `repo-config.yml`, which has no tag schema and
  no `tags` key; no `gates:` entry reads `project.json` tags; `nx.json` declares no tag
  constraints and there is no ESLint config, so `@nx/enforce-module-boundaries` is not configured
  to constrain values either; and no F# validator reads project tags.
- **Observation**: the vocabulary table is enforced by human review and nothing else, and the one
  machine consequence of an undeclared value is silent in the dangerous direction. The `detect`
  job's per-tag `case` has an arm per admitted value; an unrecognized `lang:` value matches no arm,
  so the project gets **no** language quality-gate job. The PR then goes green having run nothing
  for that project. A typo in a tag reads as "this language is not affected" rather than as an
  error.
- **Corroborating evidence that this is already live, not hypothetical**: the table admits `rust`
  and `dotnet`, which no `project.json` uses, and omits `fsharp` and `giraffe`, which 6 and 2
  projects respectively do use. The drift survived because nothing measures it.
- **Why it might generalize**: the pattern is "documented controlled vocabulary + consumer that
  silently ignores unknown values". Any such pair fails open. Candidate durable fixes to weigh at
  triage: a `governance-tag-vocabulary` gate reading every `project.json` `tags` array against the
  four-dimension table; and separately, a `*)` default arm in the `detect` case that emits
  `::error::` for an unrecognized `lang:` value, so an unknown tag fails loudly at the point it
  would otherwise be dropped. Reconcile the four stale table entries first, or the gate lands red
  across 23 existing projects.
- **Terminal state**: Reported without plan authorization. Both candidate fixes are code — a `governance-tag-vocabulary` gate reading every `project.json` `tags` array, and a `*)` default arm in the `detect` job that emits `::error::` for an unrecognized `lang:` value. Handoff evidence: this entry names the live drift precisely (the table admits `rust` and `dotnet`, which no project uses, and omits `fsharp` and `giraffe`, which 6 and 2 projects use) and records the sequencing constraint — reconcile those four stale entries first, or the gate lands red across 23 existing projects.

## Learning: an Nx-cached target is not evidence that a gate ran

- **Context**: DU2-089. The plan's acceptance was "run `nx run rhino-cli:test:quick`; exit 0",
  intended to prove the word-budget gate measured a newly written `.claude/` file.
- **Observation**: the first run exited 0 while reporting "Nx read the output from the cache
  instead of running the command for 1 out of 1 tasks". The target's declared inputs did not
  include the file just written, so a green exit code proved only that a previous run had been
  green. Re-running with `--skipNxCache` produced a real run, also 0.
- **Why it might generalize**: any acceptance phrased as "run `<nx target>`; it exits 0" is
  satisfiable by a cache hit whose inputs exclude the change under test. This is the same shape as
  Trustworthy Measurement Rule 7 — a green signal that does not prove the thing you wanted proven.
  Candidate durable fixes to weigh at triage: state in the measurement rules that an Nx-cached
  result is not evidence for a file the target's inputs do not declare, and that a verification run
  must either disable the cache or assert the absence of a cache-hit line; or fix the affected
  targets' `inputs` so the relevant files are declared.
- **Terminal state**: Routed inline to [`trustworthy-measurement/rule-1-prove-the-command-ran.md`](../../../repo-governance/development/practice/trustworthy-measurement/rule-1-prove-the-command-ran.md). This is an elaboration of the rule already on that page rather than a new rule — Rule 1's subject is proving the command ran, and a cache hit means it did not — so it sits alongside the shell builtin-transform traps as the same false zero one layer up. The learning proved itself again during this plan's own Phase 4 gate, which first exited 0 with 84 of 84 tasks served from cache and had to be re-run uncached before it counted.

## Learning: a manual sanitization step with no gate leaks on its second chance, not its first

- **Context**: DU2-PP-114. The current-head `pr-leak-review` on PR #493 returned **fail** with
  seven category-3 findings — three `file:///Users/<user>/.../scripts/behaviour-coverage.test.mjs`
  stack-trace lines and four `/var/folders/<user-hash>/<session-hash>/T/...` assertion-diff lines,
  all in the newly added `evidence/du2-red-validator.txt`.
- **Observation**: this is the **second** occurrence of the identical leak class inside one plan.
  DU1 hit it on PR #491, and the fix applied then was to broaden the sanitizer's pattern list
  (adding `/var/folders` and `/private/tmp`) and re-run it over all 13 evidence files that existed
  at that moment. That fix was correct and it held — every one of those 13 files is still clean.
  It simply had no reach over a fourteenth file written later. The sanitizer is a step an agent
  remembers to run, and the failure mode of a remembered step is not "it runs wrong", it is "it
  does not run at all on the next artifact". Nothing in the repository fails when a tracked file
  under `plans/**/evidence/` contains a host path; the only thing that catches it is a leak review
  that runs after the commit is already pushed.
- **Why it might generalize**: every recurrence of this class has been caught downstream of the
  commit, by a reviewer rather than by a gate, which is the most expensive place to catch it and
  the one place it can slip through if the review is skipped. The pattern list is already written
  down and already proven — it is only unattached to anything that runs automatically. Candidate
  durable fixes to weigh at triage: a `check`-type gate in the `repo-config.yml` registry, scoped
  by glob to `plans/**/evidence/**` and `plans/**/*.md`, that fails on `/Users/`, `/home/<name>/`,
  `/var/folders/`, and `/private/tmp/`, wired to the pre-commit surface so the leak never reaches
  a push; and, because the same evidence-capture habit exists in `generated-reports/` and
  `local-tmp/`, deciding explicitly whether the glob should cover those too or whether being
  untracked is sufficient protection. Note the gate must not match a relative source path that
  merely contains the substring `home/` — `components/home/entry-item.tsx` appears in existing
  committed evidence and is not a leak, so the rule needs a leading-slash anchor.
- **Terminal state**: Reported without plan authorization. The fix is a new `check`-type gate in the `repo-config.yml` registry wired to pre-commit — enforcement machinery, so code-homed. Handoff evidence: this entry carries the whole specification ready to implement — the pattern list (`/Users/`, `/home/<name>/`, `/var/folders/`, `/private/tmp/`), the glob scope (`plans/**/evidence/**` and `plans/**/*.md`), the open question of whether to cover `generated-reports/` and `local-tmp/`, and the false-positive constraint that the rule needs a leading-slash anchor so `components/home/entry-item.tsx` is not flagged.

## Learning: teaching a validator to read a language is not the same as enabling that language

- **Context**: DU3 pre-flight, before a single DU3 file was written. The drafted
  `apps/ose-lms-be/project.json` was run through `validateProjectTargetContract` directly, and it
  returned one error: `owner test:unit must enforce at least 99% line coverage.`
- **Observation**: DU2 taught `scripts/behaviour-coverage.mjs` to extract Cucumber bindings from
  `.java` sources, and the three AC-COV cases prove it does. But the same file's
  `unitLineCoverageThreshold` recognizes exactly three ways of declaring a Unit line-coverage hard
  gate — vitest `--coverage.thresholds.lines`, Coverlet `/p:Threshold` paired with
  `/p:ThresholdType=line`, and the `dotnet-unit-coverage.mjs` collector's `--line-threshold`. All
  three are TypeScript or .NET. A Gradle/JaCoCo `test:unit` returns `undefined`, which the closed
  project-target contract reports as "does not enforce coverage at all" rather than "declares it in
  a form I cannot read". The Java project would have been rejected by the very gate meant to
  protect it, and the plan's DU3-135 acceptance (`ose-lms-be:test:coverage:unit` exits 0) could not
  have held. A related hole sits beside it: `RUNTIME_RUNNER`, which keeps `test:coverage:*` targets
  static, lists `vitest|playwright|cargo test|dotnet test|mix test|npm test` and no Gradle form, so
  a Java coverage target could shell out to `./gradlew test` and pass a rule designed to forbid
  exactly that.
- **Why it might generalize**: language enablement has two halves that look like one. The visible
  half is "can the tooling read this language's source", which is what gets tested and what the
  delivery unit is named after. The invisible half is every _other_ place the existing enforcement
  encodes a closed list of the languages it already knew about — threshold syntaxes, runner names,
  formatter hooks, tag vocabularies. The second half fails open in one direction and closed in the
  other: an unrecognized threshold blocks a compliant project, while an unrecognized runner lets a
  non-compliant one through. Both were found here only because the project.json was run through the
  validator before being written, not after. Candidate durable fixes to weigh at triage: a
  checklist item in whatever governs adding a language to the repository, requiring an audit of
  every closed language list in the enforcement machinery, not just the parser; or, more durably,
  restructuring those closed lists into one declared per-language table so that adding a language
  is a single data edit and a missing entry is visible rather than silent.
- **Terminal state**: Reported without plan authorization. The durable fix is structural — restructure the closed per-language lists scattered through the enforcement machinery (threshold syntaxes, `RUNTIME_RUNNER` names, formatter hooks, tag vocabularies) into one declared table so adding a language is a single data edit and a missing entry is visible rather than silent. That is code. Handoff evidence: this entry, plus the two concrete holes this plan actually closed under DU3-134b and DU3-134c, which are worked examples of the general shape.

## Learning: a formatter's own JDK is not the project's declared Java toolchain

- **Date**: 2026-09-08
- **Context**: DU3's first full CI run was green everywhere except `formatting-verify`, which
  failed with eight identical `google-java-format(java.lang.reflect.InvocationTargetException)`
  entries — one per Java file. The message names the source files, so it reads as a formatting
  defect in the code. Every one of those files had passed `spotlessCheck` locally minutes before.
- **What happened**: Spotless runs google-java-format inside the **Gradle daemon JVM**, not inside
  the toolchain the build declares. `apps/ose-lms-be/build.gradle.kts` pins
  `java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }`, and that governs
  compilation and tests — but not the formatter. The `formatting-verify` gate-group job provisions
  a toolchain for every other language whose formatter it runs (.NET/Fantomas, Flutter/Dart, Ruff)
  and none for Java, so Spotless ran on the runner image's default JDK 17. google-java-format
  1.36.1 reaches into javac internals JDK 17 does not expose, and the reflective failure is
  reported once per file rather than once per JVM. Setting `JAVA_HOME` to a local JDK 17 and
  changing nothing else reproduced the CI failure byte for byte; the pinned JDK 25 passed the same
  command on the same untouched sources. Fixed by adding `./.github/actions/setup-java` to both
  jobs that can run a Java formatter gate.
- **Why it might generalize**: two separate traps compose here. First, a declared language
  toolchain is easy to read as "the JDK this project uses", when in Gradle it governs only
  compilation and test execution — plugins that host a formatter or analyser in the daemon are
  outside it. Second, the failure is reported in the vocabulary of the _files_ rather than of the
  _runtime_, so the natural first response is to reformat sources that were already correct, which
  would have made the build pass for the wrong reason and permanently mis-formatted the code.
  A green local run proves nothing here, because the developer machine has the pinned JDK on PATH
  while the runner does not. Candidate durable fixes to weigh at triage: state in the Java style
  guides that Spotless binds to the daemon JVM and that CI must provision it explicitly; or add a
  build-script precondition to `ose-lms-be` that fails Spotless tasks with the actual reason
  ("daemon JVM is Java N, formatter needs ≥25") instead of a per-file reflective error; or give the
  gate registry a way to declare a gate's required toolchain so a job cannot run a gate whose
  toolchain it never installed — the mechanism the `doctor-tools:` field already gestures at but
  which cannot install a JDK today.
- **Terminal state**: Reported without plan authorization. The natural home is the Java style guides under `docs/explanation/software-engineering/`, which the repo glossary counts as a repo-rules surface, so stating this there is rule work requiring a `rules-propagation` run that Phase 5 does not include. The stronger fixes are code anyway: a build-script precondition failing Spotless with the actual reason, or a way for the gate registry to declare a gate's required toolchain. The defect itself was already fixed under DU3-PP-172 by adding `setup-java` to both jobs that can run a Java formatter gate. Handoff evidence: this entry records the byte-for-byte reproduction — `JAVA_HOME` set to JDK 17 fails, the pinned JDK 25 passes, same untouched sources.

## Learning: a CI step whose log tail is dropped cannot be root-caused from CI

- **Date**: 2026-09-08
- **Context**: the `TypeScript quality gate` failed once inside `ayokoding-www:test:unit` and passed
  on a re-run of the identical commit. Establishing _what_ failed turned out to be impossible from
  GitHub: the step's log ends mid-sentence, immediately followed by
  `##[error]Process completed with exit code 1.` — no vitest summary, no coverage table, no failing
  test named.
- **What happened**: three separate log sources were tried — the per-job logs endpoint, `gh run view
--job … --log`, and the run's full log archive — and all three end at the same content point. The
  decisive check was reading a **passing** run of the same job: its log ends the same abrupt way,
  just without the error line. So the truncation is how this step is always captured, not a symptom
  of the failure. The suite is large (165 files, 3,523 tests, v8 coverage, jsdom) and
  `apps/ayokoding-www/vitest.config.ts` already documents `--parallel=2` and a raised `testTimeout`
  added "to bound CI memory", so the process dying mid-write without a diagnostic is consistent with
  resource exhaustion — but consistent-with is not evidence, and none was obtainable.
- **Why it might generalize**: the repository's flaky-test rule requires fixing at the root cause and
  forbids retry, sleep, widening, skipping, and quarantine. That rule silently assumes the root cause
  is _observable_. When the only failing signal is an exit code and the diagnostic that would name
  the cause is exactly the output that gets dropped, an executor has no compliant move available: it
  cannot fix what it cannot see, and every remaining option is one the rule forbids. Candidate
  durable fixes to weigh at triage: have long test steps write a machine-readable summary
  (vitest's `json` reporter, or the existing `json-summary` coverage reporter) to a file and upload
  it as an artifact, so the verdict survives independently of the console log; or split
  `ayokoding-www:test:unit` so no single step emits a log long enough to be truncated; or state in
  the flaky-test convention what an executor should do when a failure is real but unobservable —
  today the honest answer is "record it and escalate", and the rule does not say so.
- **Terminal state**: Reported without plan authorization. Every candidate fix is code or CI configuration: emit a machine-readable vitest summary as an uploaded artifact, or split the suite so no single step truncates. Handoff evidence: this entry records the decisive measurement — a **passing** run of the same job truncates identically, which is what proves the truncation is how the step is always captured rather than a symptom of the failure. It also names a real gap in the flaky-test convention: it assumes the root cause is observable, and says nothing about what to do when a failure is real but unobservable.

## A deliberate wrong-toolchain reproduction can poison the next honest run

- **What happened**: the Phase 3 gate `ose-lms-be:test:quick` failed on merged `main` with the same
  eight `google-java-format(InvocationTargetException)` entries as the CI bug DU3-PP-172 had already
  fixed — on a machine whose `java` is Temurin 25, with no Java source change, and after CI had gone
  green. The cause was not a regression and not the original bug. It was residue from that bug's own
  RED reproduction: proving the JDK diagnosis required running Spotless under JDK 17 with
  `--rerun-tasks` against the real project directory, and that run leaves `spotlessJava` recorded as
  `UP-TO-DATE`, so every later run on the correct JDK keeps failing without ever recomputing it.
  Reproduced deliberately from a known-green state to prove causation rather than assert it: the
  JDK-17 rerun fails, and the very next plain JDK-25 run fails identically. `--rerun-tasks` clears
  it. A wrong-JDK run _without_ `--rerun-tasks` poisons nothing, because the task is simply skipped.
- **Why it might generalize**: RED-first is mandatory here, and for toolchain defects the only
  faithful RED is to run the real tool, in the real project directory, under the wrong toolchain.
  That makes the reproduction itself a mutation of local build state, and incremental build systems
  are designed to trust that state. The failure mode is nasty because it is _indistinguishable from
  the original defect_ — same task, same count, same exception, same file list — so the natural
  reading is "the fix did not work" or "it regressed", and the natural next move is to reopen a
  correctly-closed investigation. Nothing warns the executor, and CI cannot corroborate either way
  because runners start clean, which makes local and CI disagree for a reason unrelated to the code.
  Candidate durable fixes to weigh at triage: state in the TDD/flaky-test guidance that a RED run
  which deliberately mis-configures a toolchain must be followed by an explicit state-clearing step
  before the next local gate is trusted; or have the Java `lint` target run Spotless in a way that
  does not silently inherit a stale snapshot; or, most cheaply, record the recovery command next to
  the formatter gate so the next person spends minutes rather than an hour. The generalization is
  not Java-specific — any cached-by-default tool (Gradle, Nx, Bazel, `cargo`, `pytest` caches) can
  carry a deliberately-broken run forward into an honest one.
- **Terminal state**: Reported without plan authorization. The fix belongs in the TDD/flaky-test guidance — a RED run that deliberately mis-configures a toolchain must be followed by an explicit state-clearing step before the next local gate is trusted — and that is new normative text on a rules surface, so it needs a `rules-propagation` run rather than an ad-hoc edit during archival. Handoff evidence: this entry, including the deliberate re-reproduction from a known-green state that proves causation (a JDK-17 `--rerun-tasks` run poisons the next honest JDK-25 run; `--rerun-tasks` clears it; a wrong-JDK run without `--rerun-tasks` poisons nothing) and the generalization beyond Java to any cached-by-default tool.

## A file ledger that omits a lockfile hides a build-breaking edit

- **What happened**: the DU4 ledger reconciliation compared `git status --short` against the plan's
  `tech-docs.md` §5 file tree and found two changed paths the tree never listed. One is cosmetic:
  `apps/README.md` was edited, and the plan's own DU4-185 checkbox names that file explicitly, so
  the checklist and the ledger disagreed with each other. The other is not cosmetic. The root
  `package.json` declares `workspaces: ["apps/*", "libs/*"]`, so creating
  `apps/ose-lms-be-e2e/package.json` makes a new workspace package, and `package-lock.json` must
  gain entries for it — the `ose-be-e2e` sibling has exactly two. Immediately after the E2E project
  was written, `grep -c '"apps/ose-lms-be-e2e"' package-lock.json` returned **0**. Nothing local
  complained: `test:e2e`, `test:quick`, `typecheck`, and `lint` all passed, because they resolve
  binaries from the already-populated root `node_modules`. CI does not work that way — it runs
  `npm ci`, which reinstalls strictly from the lockfile and fails when the lockfile and the declared
  workspaces disagree. `npm install` fixed it with 10 insertions and 0 deletions, all confined to
  the new workspace, with no version drift anywhere else.
- **Why it might generalize**: the ledger is written before execution, by reasoning about which
  files a change _touches_. A lockfile is not touched by the author at all — it is touched by the
  package manager, as a consequence of a file the author did write. That whole category is
  systematically easy to omit: lockfiles, generated harness mirrors, coverage baselines, parity
  manifests. The failure is quiet in the worst way, because every local gate passes and only the
  clean-install path in CI disagrees, which means the feedback arrives one push later than it
  should. Candidate durable fixes to weigh at triage: have the plans convention require that a
  ledger entry for any new `apps/*` or `libs/*` `package.json` carry a paired `package-lock.json`
  entry; or add a cheap pre-push check that fails when a workspace `package.json` exists with no
  matching lockfile entry, which is a two-line `grep` and would have caught this before the branch
  ever left the machine. The narrower lesson stands on its own: after adding a workspace package,
  run the installer and diff the lockfile, rather than trusting that local gates going green means
  the dependency graph is actually consistent.
- **Terminal state**: Reported without plan authorization. Both fixes are blocked for different reasons: requiring a paired `package-lock.json` ledger entry is new normative text in the plans convention, a rules surface needing propagation; the cheap pre-push check that fails when a workspace `package.json` has no matching lockfile entry is code. Handoff evidence: this entry records the full mechanism and the reason it is quiet — every local gate resolves binaries from an already-populated root `node_modules`, so only CI's `npm ci` disagrees, one push later than it should.

## A shed and a test failure are indistinguishable in the output that a human reads

- **What happened**: the DU4 push was rejected seven times. Two of those rejections exited 75, and
  the surrounding output read as a test failure — `NX Running target test:unit for project
ayokoding-www failed`, then `Failed tasks: - ayokoding-www:test:unit`. It was not a test failure.
  The pre-push surface is re-executed through an outer `./hippo run --class ephemeral` guard
  declared in `repo-config.yml`, and HIPPO "admits, supervises, and **sheds**" work from host
  resource evidence. Sampling `hippo status` every five seconds through a run caught the moment:
  `state=critical reason=swap-critical availableGiB=7.68`, and the vitest child died right there
  with nothing printed after `Coverage enabled with v8`. HIPPO killed the process, Nx saw a
  non-zero child, and reported the task as failed. The only truthful token in the whole output was
  the exit code — 75, EX_TEMPFAIL, which the repository already treats as an admission deferral
  rather than a gate failure.
- **Why it might generalize**: the reader of that output has to already know that 75 means
  deferral, and has to notice it under many screens of Nx text that say the opposite. Everything
  visually prominent — the red NX banner, the named project, the "Failed tasks" list — points at a
  test defect that does not exist. The cost is not theoretical: it sent this delivery unit down a
  flaky-test investigation, and the flaky-tests-are-defects rule makes that investigation
  mandatory and expensive precisely so nobody retries past a real defect. Two candidate durable
  fixes to weigh at triage. First, the `gate-surface-guards.pre-push` entry could pass
  `--wait-for-admission`, so a shed waits for capacity instead of surfacing as a rejected push;
  that is strictly more patient than the current behaviour, not weaker. Second, and independent of
  the first, the gate runner could detect a 75 from its HIPPO wrapper and print one line saying the
  run was shed and no gate verdict was reached — so the exit code's meaning appears where the
  reader is already looking. Neither touches HIPPO itself, which is an independent upstream
  repository and is never modified from here.
- **Terminal state**: Reported without plan authorization. Both candidate fixes are configuration or code in this repository — passing `--wait-for-admission` on the `gate-surface-guards.pre-push` entry, and having the gate runner detect a 75 from its HIPPO wrapper and print one line saying the run was shed and no gate verdict was reached. Neither touches HIPPO itself, which is an independent upstream repository and is never modified from here. Handoff evidence: `evidence/du4-prepush-shed.txt` plus this entry, which together carry the sampled `state=critical reason=swap-critical availableGiB=7.68` measurement caught at the moment the child died.

## Recording a failure as unexplained is a result, not an omission

- **What happened**: alongside the two shed rejections above, five more pre-push runs exited 1 —
  a different code, with the host measured at `state=normal` immediately beforehand each time, and
  always naming the same project. The shed explanation did not cover them, and an early draft of the
  evidence file claimed it did. Ten forced executions failed to reproduce the signature: the target
  alone under both HIPPO classes, four vitest suites concurrently, four sequentially in one Nx
  invocation, and finally the entire pre-push surface re-run with `NX_SKIP_NX_CACHE=true` so that
  every task genuinely executed rather than replaying a cached pass — 206 targets, zero failed
  tasks, and the suspect project really running 52 files and 547 tests inside the gate. The
  signature was written up as OPEN, with every measurement attached, and the branch was pushed only
  after the forced uncached run proved the surface green.
- **Why it might generalize**: there were two comfortable exits available and both were wrong. One
  was to stretch the confirmed shed mechanism to cover the second signature, which would have left a
  false explanation in the repository that the next investigator would trust. The other was to call
  it flaky and re-run until it passed, which is the exact evasion the flaky-tests rule forbids. What
  made the third option safe was evidence rather than optimism: a cached pass proves nothing about a
  gate, so the run that justified pushing was the one that forced every task to execute. The
  transferable habits are narrow and concrete — when a diagnosis explains some of the evidence,
  say which part; prefer a forced uncached run over an incidental green one when the green is what
  you are relying on; and treat "not reproduced across N specified attempts" as a finding worth
  writing down, because the next person to meet the signature then starts from measurements instead
  of from scratch.
- **Terminal state**: Reported without plan authorization. The transferable habits belong in the measurement and flaky-test guidance — say which part of the evidence a diagnosis explains, prefer a forced uncached run when the green is what you are relying on, and treat "not reproduced across N specified attempts" as a finding worth writing down — which is new normative text on a rules surface and needs a `rules-propagation` run. Handoff evidence: `evidence/du4-prepush-shed.txt`, which is structured around exactly this and opens by retracting an earlier draft's overclaim that the shed explained both signatures.
