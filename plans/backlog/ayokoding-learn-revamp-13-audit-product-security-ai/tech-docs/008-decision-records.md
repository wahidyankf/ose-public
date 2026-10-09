# 008 — Decision Records

Each record gives the choice, two alternatives, prior art, trade-offs, consequences, and what would make us revisit it.
Series decisions (numbered 1 to 42, made by the user on 2026-10-09) are inputs, not re-decided here; a record cites them
where they bind. The user made no choice about the items below, so each is a default taken on the user's behalf,
recorded so it can be reversed; none is an open question for the user. The user's choices that bind this plan are
decisions 26 to 29 (definition of done, 70/111 split, per-course execution, the cap of 2 cycles), 30 to 33 (the harness
contract, determinism, container runtime and static mode, CI), 35 (English only), 37 (checks in tested code), and 40 to
42 (the end state, the deferred plan gate, strict sequential execution).

## D1 — Audit in Place; Do Not Rewrite

- **Selected:** each of the 45 courses keeps its slug, title, mode, category, weight, subject, and place in every path.
  The audit closes the defect classes in place and adds only what the definition of done needs. The two exceptions are
  named: the `format` value of two interview courses (D3) and the new `learning/` folder of two capstones (D15).
- **Alternatives:** (a) rewrite the weak courses from scratch, as plans 06 to 09 do for outlines and filler; (b) leave
  the courses and only add `run.yaml` files.
- **Prior art:** series decision 28 splits the work into "rewrite from scratch" (outlines, filler) and "audit" (the other
  111); plan 11 took the same choice for its 32 courses.
- **Trade-offs:** an audit keeps what is good, but several of these courses are closer to a rewrite than an audit: a
  course with 48 programs in 1,700 words (`agent-context-and-memory`), two with 78 examples and no unit folder
  (`ios-app-development`, `hybrid-app-development`), and two capstones that are one page and a `code/` folder
  (`capstone-first-working-software`, `capstone-full-stack-app`). Option (b) would leave courses that fail the
  definition of done.
- **Consequences:** briefs list defects, not outlines; the size class decides the effort; a course that cannot meet its
  mode after 2 cycles is BLOCKED, not rewritten into another shape.
- **Revisit when:** the first audit shows a course where more than half of the existing text is replaced; the user may
  then prefer to treat it as a rewrite plan.

## D2 — Fifteen Waves in Prerequisite Order

- **Selected:** 15 waves of three courses, each course after its in-plan prerequisites; a wave takes the three available
  courses with the longest chain of courses behind them, and holds at most one size-XL course
  ([006](./006-execution-model.md#waves-in-prerequisite-order)).
- **Alternatives:** (a) one wave per family (application development, AI, security, interviews, product); (b) heaviest
  courses first.
- **Prior art:** plans 06, 07, 11, and 12 batch by prerequisite level; the repository runs three background agents (N+1,
  N = 3).
- **Trade-offs:** family order would put every AI course in a row and every mobile course in a row, which loads the same
  fixtures and the same slow toolchains together, and breaks prerequisite order (`creating-ai-powered-apps` needs
  `backend-essentials` and `api-design`). Heaviest first would start courses before their prerequisites are final.
- **Consequences:** the courses with no dependents, including the heaviest course for CI (`windows-app-development`),
  fall late, so their measured minutes replace the planning figures last (D17); every wave has at most one course that
  needs a long authoring effort, so the three slots finish at similar times.
- **Revisit when:** a BLOCKED prerequisite blocks more than one dependent in the same wave.

## D3 — Two Interview Courses Change Format to No-Code

- **Selected:** `behavioral-and-leadership-interviews` and `system-design-interview` move from the `format`
  `annotated-concept` (plan 03's value) to `annotated-concept-no-code`. Neither has a `code/` folder, a code fence, or a
  program: their artifacts are stories, diagrams, estimates, and spoken explanations. The coordinator edits the
  `format` frontmatter of each course in that course's commit.
- **Alternatives:** (a) keep `annotated-concept` and write code for them (invents code the subject does not need);
  (b) leave the mismatch (the mode checker and the completion test would read the wrong floors: 22,000 words and 27
  code-bearing examples of 45).
- **Prior art:** plan 11 and the adapter define a no-code sub-mode with 18,000 words and 20 worked scenarios; plan 03
  derives `format` from the course's shape.
- **Trade-offs:** the correction is a metadata change that lowers the word floor for two courses, which can look like
  lowering a bar. It does not: the floor of a no-code course is the one the adapter sets for its kind, and the
  alternative demands code that does not exist.
- **Consequences:** two registry rows carry the new value; two `format` edits in the course indexes (plan 03's tests accept either value); the catalog card shows the no-code format; the briefs say so.
- **Revisit when:** the user wants either course to teach with code; that is a new-topic decision for a later plan.

## D4 — SQLite Only; No Database Service in This Plan

- **Selected:** `analytics-and-experimentation` and every other course of this plan that needs a database use SQLite from
  the standard library. This plan uses no PostgreSQL, MongoDB, Redis, or other service from the catalog.
- **Alternatives:** (a) use the PostgreSQL service that plan 05's catalog carries for the SQL examples; (b) add a columnar
  or analytical engine.
- **Prior art:** plan 12 adds database services for its own database courses and pays the CI cost of the service
  lifecycle; none of the 45 courses teaches a database engine.
- **Trade-offs:** SQLite lacks some analytic functions; the event and funnel examples use only what SQLite has, and the
  lessons say so. A service would add one lifecycle to every unit of the course and the PostgreSQL image to every shard
  that runs it, for no teaching gain.
- **Consequences:** no service id is used; the CI projection stays at the courses' own cost.
- **Revisit when:** a course needs a window function or a type that SQLite lacks and no model can show.

## D5 — No Headless Chromium by Default

- **Selected:** about 14 `frontend-essentials` layout examples (box model, flex, grid, breakpoints, contrast) and the
  77 `verify.mjs` scripts that import `playwright` move to jsdom under the locked `typescript` toolchain; the layout
  examples become Node models of the CSS algorithm they teach, labelled as models (D12). The Playwright launch line is an
  illustration. Spike SP2 measures a headless Chromium toolchain; it becomes GO only if the budget rule (D9) also passes.
- **Alternatives:** (a) add a `chromium` toolchain now; (b) drop the layout examples.
- **Prior art:** plan 11's D8 rejects real Chromium for `browser-automation-with-cdp` on determinism (timing, fonts,
  GPU), image size, and flakiness; plan 05's catalog has no browser.
- **Trade-offs:** a model cannot show a real engine's quirks and teaches the algorithm, not the product; dropping the
  examples would cut a topic the course promises.
- **Consequences:** `frontend-essentials` is a `typescript` course with no catalog change; the lesson says where a real
  browser would differ.
- **Revisit when:** the catalog gains a deterministic browser image for another reason, or SP2 and the budget rule pass.

## D6 — One Commit per Course, Five Checkpoint Pushes

- **Selected:** one commit per DONE course, made by the coordinator, plus separate commits for harness, workflow, and
  test-support changes; pushes after waves 3, 6, 9, 12, and 15, with a draft PR opened at the first.
- **Alternatives:** (a) one commit per wave, as plan 07 does; (b) one commit for the whole plan.
- **Prior art:** plan 06 and plan 11 commit per course; plan 07 per wave, because its courses are gated together.
- **Trade-offs:** 45 commits are more to read than 15, but each course is independent, already shipping, and may be
  BLOCKED or deferred on its own; a per-course commit can be reverted without touching a neighbour, and a PR of about
  9,000 to 11,000 files is only reviewable commit by commit.
- **Consequences:** every commit leaves `test:quick` green (the registry row, the baseline entry, the scope-list entry,
  and the course land together).
- **Revisit when:** commit count slows the push leak review or CI beyond the wave budget.

## D7 — One PR, With the Scale Reported

- **Selected:** the 45 courses ship in one pull request, as the series rule "one plan = one PR" fixes. The README tells
  the user the scale (about 487,871 words to write, 1,007 of 2,831 target units to create, 13 of 45 courses size XL) and
  that the waves are the seam if they prefer a split.
- **Alternatives:** (a) split into three PRs by family (forbidden by the series rule, and it would break the single
  end-state proof); (b) cut the scope to what fits one PR (a course is never weakened).
- **Prior art:** plan 11 (32 courses, 2,571 units) and plan 12 (34 courses) took one PR each.
- **Trade-offs:** a large PR is slow to review and heavy for CI; a split would let each part merge sooner but leaves the
  harness coverage gate open in between.
- **Consequences:** the commits, the checkpoint pushes, and the ladder (D17) carry the risk; Phase 2 probes the
  GitHub files-view limit at the first push and records it.
- **Revisit when:** the user asks for a split, or the CI ladder reaches its last rung (stop and report).

## D8 — The Full-Stack Capstone Is a Python Unit With TypeScript Example Units

- **Selected:** `capstone-full-stack-app` has a Python capstone unit (the backend reference solution, its tests, and a
  script that regenerates the OpenAPI contract and fails when it differs from the committed `contract/openapi.json`).
  The frontend half is proven by `typescript` example units (jsdom, vitest, testing-library) that read a byte-identical
  copy of `openapi.json`; a row in plan 08's byte-identity scenario (rule CC6) keeps the two copies equal.
- **Alternatives:** (a) a combined Python and Node toolchain for one unit (fails the budget rule D9, because it serves
  one unit); (b) drop the frontend half from the harness (leaves half the capstone unproved).
- **Prior art:** plan 08's rule CC6 (a capstone unit holds one toolchain; shared files are byte-identical copies) and
  its two known pairs.
- **Trade-offs:** the end-to-end integration of the two halves is shown by the contract, not by one running system; the
  lesson says so (D12).
- **Consequences:** one added pair in CC6's step file; the capstone page states the contract as the integration point.
- **Revisit when:** plan 05's `run.yaml` allows two toolchains in one unit.

## D9 — Toolchain Additions Are Default NO-GO

- **Selected:** no toolchain is added unless the four-part budget rule in
  [004](./004-toolchain-additions-and-ci-cost.md#the-toolchain-budget-rule) passes on measured figures; an unmeasured item
  counts as a no. Four candidates exist (C1 `chromium`, C2 a Python type checker, C3 a headless GUI toolkit, C4 an
  Android Gradle and SDK); all start as NO-GO with a fallback, and C2 needs no catalog change at all (a wheel in the
  course lock). Known gaps stay gaps: Clang, Groovy, a stronger Android validator, and WinUI 3 compilation.
- **Alternatives:** (a) add the four now for the most real units; (b) add none and never revisit.
- **Prior art:** plan 05 puts any change under `apps/ayokoding-cli/toolchains/` in FULL mode; plan 11's D9 and plan 12's
  budget rule are the same.
- **Trade-offs:** real units teach better than models, but FULL mode on every push of a 2,831-unit PR is the largest CI
  cost of the series, and the fallbacks are honest.
- **Consequences:** about 14 layout examples and the Compose and androidx files are models or static checks, labelled;
  the CI projection stays at the courses' own cost.
- **Revisit when:** the measured projection fits the budget (rung 2t merged), or plan 14 or a later plan adds a
  toolchain for another reason.

## D10 — AI Courses Use Deterministic Fixtures; Fast-Moving Claims Are Sourced at Fix Time

- **Selected:** the 13 AI courses with code run on a scripted `FakeModel` and stored responses, with no key, no network,
  and no model download (policy AI1 to AI6); one kit per course, the same interface in all of them; every claim that
  changes by the month (a product, a model, a protocol revision, a price, a limit, a law) gets a dated primary source
  at the time the maker writes it, and is otherwise rewritten as a pattern (AI7)
  ([011](./011-ai-fixtures-and-sourcing-policy.md)).
- **Alternatives:** (a) record real model outputs once and replay them (a capture needs a key and a date, and then looks
  like a statement about a model); (b) call a hosted model in CI (non-deterministic, costs money, needs a secret).
- **Prior art:** `the-agent-loop` already uses a `FakeModel`; plan 05's determinism rules; plan 09's accuracy rules A1
  to A7.
- **Trade-offs:** a scripted model cannot show how a real model fails; the lesson says it is scripted (D12) and the
  failure modes are taught as data. The sourcing policy costs a fetch per claim and goes stale; it records the date.
- **Consequences:** scenario 4 of the new safety feature ([007](./007-testing-strategy.md#new-feature-course-content-safety))
  keeps hosted-model SDKs and credential reads out of the code; a "Sources checked" column in the ledger.
- **Revisit when:** the harness gains a sanctioned offline model runtime.

## D11 — Targets Follow Plan 06's Accounting Convention

- **Selected:** diagrams 30 to 50 for By Example (the adapter's band); at least 10 for Annotated Concept, capstone, and
  no-code; code-bearing share for Annotated Concept at least 27 of 45 (60 percent).
- **Alternatives:** (a) no diagram floor for Annotated Concept; (b) a higher floor for AI and security courses.
- **Prior art:** plan 06 set the 10-diagram and 60-percent rules; plan 11 adopted them.
- **Trade-offs:** a uniform floor is simple and checkable; a topic-specific floor would need a basis for each number.
- **Consequences:** `X20` appears wherever a course is short of the diagram floor; the completion test reads one table.
- **Revisit when:** plan 14 decides to make the floors a repository rule.

## D12 — Honesty About Models, Static Checks, Scripted Responses, and Illustrations

- **Selected:** a modelled or statically checked example, and a scripted model reply, says so in one plain sentence
  beside its fence; a fence is an illustration only for tools the harness cannot host, pseudo-code, deliberately broken
  snippets, and files the toolchain cannot parse; budgets per course are in the briefs (total 274 fences).
- **Alternatives:** (a) mark every non-runnable fence an illustration without a budget; (b) forbid models and require real
  tools only.
- **Prior art:** plan 05's illustration marker; plan 11's rule TC1.
- **Trade-offs:** a budget needs judgement per course; the gate reads the brief's number.
- **Consequences:** `examples coverage` shows each course's illustration count.
- **Revisit when:** an audit finds a budget wrong; the brief is edited in the ledger and the reason recorded.

## D13 — Security Content Runs in Process on Synthetic Data, With a Gated Scan

- **Selected:** every security example attacks or defends a model or an in-process application object on synthetic data,
  never a target, with safe-lab rules S1 to S7 (plan 09) and four additions SL1 to SL4; a `## Safety boundary` section;
  and a new four-scenario feature that checks the boundary section, scans code for banned APIs and hosted-model calls,
  and applies the reserved-address rule to six courses ([012](./012-safe-lab-and-content-safety-rules.md)).
- **Alternatives:** (a) judge safety only through the Content Quality Gate (no regression guard after the plan
  archives); (b) run attacks against a vulnerable container in the harness (a listening service, outside the offline
  rule).
- **Prior art:** plan 08's CC5 and its three checks; plan 09's SEC1.
- **Trade-offs:** a scan produces false positives (an apostrophe in a harmless SQL test string, or the word `socket` in a string
  that explains a concept); an exceptions list with a reason per entry handles them and is itself tested.
- **Consequences:** one new feature file, one scanner, one tested list of exceptions; plan 09's feature is not edited.
- **Revisit when:** the scan misses a hazard that a reviewer finds, or a course needs a banned API for a legitimate
  reason more than three times.

## D14 — Prerequisites: Re-Check Only, With One Exception Path

- **Selected:** plan 02's revised lists stand; CP-1 re-checks them against the lessons; a change is made only if the
  rubric requires it and the integrity tests stay green. A change that would alter the AI Engineer core
  ([005](./005-prerequisites-ai-path-and-capstone-integrity.md#the-ai-engineer-path-core)) is recorded as `needs-decision`
  and not made (rule AI-1).
- **Alternatives:** (a) re-derive all 45 lists; (b) freeze the lists with no re-check.
- **Prior art:** plan 02's rubric and closure rules; plan 08's duty that any change to the AI core updates the manifest
  in the same PR; plan 08's shrink of the core from 25 to 12 on purpose.
- **Trade-offs:** a rewrite can create a dependency by accident, so the re-check runs again at the end; a frozen list
  could drift from the text.
- **Consequences:** expected result for the eight core courses is no change.
- **Revisit when:** a re-check finds an edge that fails the rubric in more than three courses.

## D15 — Two Capstones Gain a `learning/` Folder; the Shape-3 Binding Is Exempted if None Remains

- **Selected:** `capstone-full-stack-app` and `capstone-first-working-software` get a `learning/` folder (class X12). The
  Start-button case "Start falls back to the course overview" (shape 3) then loses its real-content E2E binding; if
  no other course lacks a `learning/` folder, the E2E step is removed and an `@e2e-exempt` tag records why, with the Unit
  fixture proof kept ([005](./005-prerequisites-ai-path-and-capstone-integrity.md#capstones-that-gain-a-learning-folder)).
- **Alternatives:** (a) keep one capstone without a `learning/` folder to hold the binding (a deliberate gap in a course
  that must meet the capstone contract); (b) add a permanent fixture course to the published tree (a fake course in
  production content).
- **Prior art:** plan 08 did the same for shape 2 and left the duty for shape 3 to plans 11 to 13.
- **Trade-offs:** one end-to-end binding is removed; the rule it protects stays proved by Unit over fixture trees for
  all three shapes.
- **Consequences:** a Gherkin edit and an E2E step removal in the commit of `capstone-first-working-software`; flagged
  to the user in the README.
- **Revisit when:** the E2E server learns to serve fixture trees.

## D16 — Static Mode Only for Existing Reasons, Split by Import

- **Selected:** static mode uses the reasons the catalog has (`android`, `ios`, `windows`), and only for files that
  import a platform framework; logic that imports none runs for real in the language toolchain. Each static fence is
  followed by a sentence that says what the run proves and what it does not.
- **Alternatives:** (a) mark a whole mobile course static (hides real logic that could run); (b) add a new static reason.
- **Prior art:** plan 05's closed reason list and its validators (`ktlint`, `swift-parse`, `windows-static`); plan 11's
  D14.
- **Trade-offs:** a split needs a per-file decision; the Content Quality Gate reads it.
- **Consequences:** `android-app-development`, `ios-app-development`, and `windows-app-development` are "real and
  static" courses; `hybrid-app-development` and `linux-app-development` are real, with models where the platform is
  missing.
- **Revisit when:** plan 05's catalog changes its static reasons or validators.

## D17 — Planning Figures Are Not Estimates; Measure and Fix the Root

- **Selected:** every CI figure in this plan is a planning figure for sizing, replaced by Phase 0 and 1 measurements; no
  time estimate appears for people or agents. A defect found in the harness is fixed in `apps/ayokoding-cli` with a
  regression test first (plan 05's M11); a course check is never loosened. Every ladder decision is taken on the measured
  numbers and re-taken before every push.
- **Alternatives:** (a) estimate durations and rely on them; (b) work around harness defects in the courses.
- **Prior art:** the repository's "No Time Estimates" principle; plan 08's run-time budget; plan 11's D16.
- **Trade-offs:** measured figures arrive in Phase 1, after the plan is written, so the plan carries a ladder and not a
  schedule.
- **Consequences:** the ledger has a CI section; the ladder rungs are commits with regression tests.
- **Revisit when:** the measured figures disagree with the planning figures by more than a factor of two.

## D18 — The Series Coverage Gate Is Proved, Not Built

- **Selected:** Phase 9 proves decision 40 with the existing `coverage` command: per course `--min-percent 100`,
  repository-wide `--min-percent 100`, and a green full run on the same commit, with the eight no-code courses accounted
  for as not applicable ([007](./007-testing-strategy.md#the-series-harness-coverage-gate)). No new gate code is written,
  and a CI ratchet is left to the user as an optional follow-up.
- **Alternatives:** (a) add a CI step that runs `coverage --min-percent 100` on every PR (changes the repository's
  contribution rules for every future course); (b) add a Gherkin scenario that reads the coverage JSON (duplicates
  plan 05's report and plan 14's gate).
- **Prior art:** plan 05's coverage report and `--min-percent` flag; plan 14 owns the terminal gate.
- **Trade-offs:** without a ratchet, a later change can uncover a course until the next full run notices; the monthly
  full run still catches it.
- **Consequences:** the evidence records the one-line command for the ratchet; plan 14 re-measures.
- **Revisit when:** a course loses its coverage after this plan merges.
