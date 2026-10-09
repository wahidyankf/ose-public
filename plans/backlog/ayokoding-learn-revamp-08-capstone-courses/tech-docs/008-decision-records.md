# 008 — Decision Records

Each record gives the choice, two alternatives, prior art, trade-offs, consequences, and what would make
us revisit it. Series decisions (numbered 1–42, made by the user on 2026-10-09) are inputs, not
re-decided here; a record cites them where they bind.

## D1 — Capstones Use the Existing Annotated-Concept Mode; No New Mode

- **Selected:** seven capstones use Annotated Concept (standard) and one uses its no-code sub-mode. The
  catalog label `format: capstone` stays a label. A new section in the course contract (the six capstone
  headings, in [002](./002-capstone-course-contract-and-modes.md#what-capstone-contract-d6-means)) carries
  what makes a capstone different.
- **Alternatives:** (a) a new "capstone" tutorial mode with its own maker, checker, fixer, and gate
  workflow; (b) By Example (75–85 examples) in the project's language.
- **Prior art:** the gate adapter defines four modes, each with a maker/checker pair; the filled
  `statistics-for-evaluation` is an Annotated-Concept course with a `capstone/` page inside `learning/`;
  `engineering-management` uses the no-code sub-mode; `capstone-solid-core` is project-shaped with its own
  layout and the adapter has no rule for it. CodeCrafters' challenges (<https://codecrafters.io/challenges/redis>)
  are staged, with an automated test per stage, which this plan mirrors with one harness run per
  milestone.
- **Trade-offs:** (a) would give exact capstone checks but needs a new agent pair, a workflow, an adapter
  change, and a rules-propagation round before any course can start; (b) would re-teach each language's
  syntax, which the prerequisites already teach.
- **Consequences:** the gates that exist judge the courses; the contract headings are checked by the
  content-shape test, not by a gate. A rule module records the contract
  ([009](./009-rule-and-docs-impact.md)). Plan 03's rule R3 reads a mode from `format`, which has no
  value for `capstone`; rule CC1 extends it with the declaration sentence, and the no-code course keeps
  `format: capstone` so the catalog shows one label for every capstone.
- **Revisit when:** three or more capstones fail the mode gate on the same capstone-specific ground, or
  a later plan adds a capstone mode to the adapter.

## D2 — Volume: 45 Worked Examples and a Real Capstone Unit per Standard Course

- **Selected:** 45 worked examples (the mode floor) in five themes, five milestones, a rubric, five
  katas, and at least 23,000 words (18,000 for the no-code course with 24 scenarios), all derived in
  [002](./002-capstone-course-contract-and-modes.md#word-and-hour-targets).
- **Alternatives:** (a) a lighter capstone: about 20 examples and 12,000 words, with the project as the
  main work; (b) the exemplar size of about 52,000 words.
- **Prior art:** measured existing Annotated-Concept courses with at least 4 estimated hours range from
  17.6k to 26k words, with a median near 21.5k; the mode floor is 45 worked examples.
- **Trade-offs:** (a) is cheaper and kinder to the CI budget but falls below the mode's own floor, so
  the mode gate would route it to `needs-decision`; (b) doubles the work and CI time with no rule behind
  it.
- **Consequences:** about 156,000 words of prose and 358 harness units, which is why the CI budget is
  managed explicitly ([004](./004-code-harness-and-determinism-design.md#run-time-budget)). **This is an
  assumption the user may want to revisit:** the volume follows the mode's floor and the user's
  instruction to fill every course to the definition of done.
- **Revisit when:** the CI ladder reaches rung 4 for a course, or the first batch's gate reports show
  padding to reach the floor.

## D3 — Prerequisite Readiness Is a Check, Not a Wait (Gate R)

- **Selected:** before each course starts, Gate R checks that its prerequisites exist, are not outlines, are
  not skeletons, and that the concepts the capstone relies on are present. A failing check BLOCKS and
  reports; nothing pauses for another plan. Capstones are built to survive a later rewrite of a
  prerequisite (rules CL1–CL4 in [003](./003-prerequisites-readiness-and-ordering.md#course-level-coupling)).
- **Alternatives:** (a) a hard pause until plan 09 has rewritten `defensive-security` and
  `vulnerability-management-and-assessment`; (b) reorder the series so plan 09 runs first.
- **Prior art:** plan 05's migration steps check readiness per course; plan 02's R5 forbids outline
  courses in a core; the repository's rule against assuming material authority forbids reordering the
  user's fixed sequence.
- **Trade-offs:** (a) deadlocks under strict sequential execution (decision 42: plan 09 starts only after
  this plan merges); (b) changes an order the user fixed. The chosen design costs some restating inside
  each capstone, which also makes it more self-contained for the reader.
- **Consequences:** three security-flavoured courses are written against two templated filler courses;
  plans 09–13 and 14 carry a re-check duty (handoff table in 003). An earlier draft of this plan used a
  hard pause ("Gate P"); decision 42 made that a deadlock, and this record replaces it.
- **Revisit when:** the user changes the execution order, or plan 09 turns out to change a concept a
  capstone relies on.

## D4 — The AI Core Is the Closure of One Goal

- **Selected:** the AI Engineer path declares one goal, `capstone-build-your-own-coding-agent`, and its core
  is exactly the goal's prerequisite closure, stopping at four assumed courses: 12 core courses and 16
  extension courses, 28 in all ([005](./005-ai-path-goal-and-closure.md)).
- **Alternatives:** (a) declare more goals (for example `evaluating-ai-systems-in-depth` and
  `inference-serving-and-model-deployment`) so the core stays near the curated 25; (b) assume
  `async-python-and-fastapi-services` to keep the core at 11 without it.
- **Prior art:** the three software-engineer paths use one goal each and cores of 13, 13, and 24
  (decisions 7 and 11); plan 02's rule R6 requires core equal to the closure once a goal exists.
- **Trade-offs:** (a) keeps the shape the user saw in plan 02 but turns the path into a list of goals
  with a closure that happens to equal a curated list, and any prerequisite change breaks it more often;
  (b) hides a course the capstone uses heavily (`async`/`await` in themes A and B) from a reader who is
  "a developer who already codes" but may not know Python's async model. The chosen design gives a short,
  honest core and a named extension for everything else.
- **Consequences:** the core shrinks from 25 to 12 courses (a product-shape change to flag); the frozen
  membership list gains two IDs; the path page is rewritten; nothing is deleted.
- **Revisit when:** the user wants evaluation or serving in the core. Adding a goal is a one-line manifest
  change that the closure test verifies.

## D5 — Re-Run the Prerequisite Rubric on the Written Course

- **Selected:** nine edge changes judged by what each written course uses: seven added language
  primers (L1), one added course (T1), one removed course (T1), with the codes `A-L1`, `A-PROSE`, and
  `R-UNUSED` ([003](./003-prerequisites-readiness-and-ordering.md#prerequisite-rubric-re-run)).
- **Alternatives:** (a) keep plan 02's edges (`K-OUTLINE`) unchanged; (b) remove every edge the capstone
  restates under rule CL2.
- **Prior art:** plan 02's rubric tests T1–T4, L1, and C1 and its statement that the rewrite plans re-run
  the rubric on outline courses.
- **Trade-offs:** (a) leaves a Python capstone without `just-enough-python` and a pentest capstone that
  still requires a browser course it forbids; (b) would drop edges that tell the reader what to learn
  first.
- **Consequences:** seven capstones gain a primer edge; the path checks run after each edit
  (verified against all four career manifests).
- **Revisit when:** plans 09–13 revise prerequisites of the integrated courses.

## D6 — One Toolchain per Unit: Secondary Units and Identical Copies for Two Capstones

- **Selected:** the Go and Elixir showdown keeps its Go capstone unit and adds a secondary Elixir example
  unit with the same `vectors.json`; the real-world delivery keeps a Python capstone unit and static
  validator example units that hold identical copies of the manifests and infrastructure code. Both pairs
  are compared byte for byte by a unit test ([004](./004-code-harness-and-determinism-design.md#two-language-capstones)).
- **Alternatives:** (a) ask plan 05 to allow two toolchains in one unit (a contract change); (b) put a
  second capstone folder beside the first.
- **Prior art:** plan 05's contract names one capstone folder and one toolchain per unit and says a unit
  needing two languages uses the language plus a service.
- **Trade-offs:** (a) is the cleanest end state but changes a merged contract from inside a content plan,
  which plan 05's step M11 allows only for a harness defect; (b) is a layout finding. The copies cost some
  duplication and a test.
- **Consequences:** a possible gap in plan 05 is reported to the user, not fixed here.
- **Revisit when:** plan 05's maintainers add multi-toolchain units; then the copies and the test go.

## D7 — Exempt E2E Where the Real Content Can No Longer Supply the Case

- **Selected:** the "Start falls back to the first learning page" scenario and every scenario that opens a
  real outline course get an E2E exemption with Unit proof over fixtures; no E2E step depends on a course
  shape or status that the published content no longer has
  ([006](./006-e2e-rebinding-and-testing-strategy.md)).
- **Alternatives:** (a) keep a permanent draft fixture course with `status: outline` in the content tree
  so the E2E steps still have a case; (b) leave one real capstone unfinished.
- **Prior art:** plan 03's own note ("if none remains, record a new exemption with its own reason");
  plan 02's exemption pairs for scenarios with no browser boundary; the repository's exemption grammar.
- **Trade-offs:** (a) would be the one outline course left, which breaks the end-state count of decision
  40 and puts a draft course in the production content tree; (b) contradicts the plan. The cost of the
  chosen path is that the browser no longer proves two UI states against real content; Unit proves them
  with fixtures, and the manual checks cover the rest.
- **Consequences:** the product code for the outline status and the shape fallback stays.
- **Revisit when:** a new skeleton course is added (the badge then has a real case again), or the E2E
  server can serve fixture content.

## D8 — Measure the CI Budget First, Then Climb a Four-Rung Ladder

- **Selected:** a projection in Phase 0, a binding limit of 45 projected minutes on one shard, and a
  response ladder: author for speed, choose the shard count by units, raise the `since` timeout, stop
  and report
  ([004](./004-code-harness-and-determinism-design.md#run-time-budget)).
- **Alternatives:** (a) raise the timeout and hope; (b) cut examples or merge units to fit.
- **Prior art:** plan 05's CI design (one shard for at most 8 courses, otherwise four, a 60-minute
  timeout for `since` runs and 300 for full runs).
- **Trade-offs:** (a) hides a real failure mode; (b) weakens the courses to fit a tool, which the plan
  forbids. The ladder keeps the courses whole and puts the fix in the harness, where it belongs, with a
  regression test.
- **Consequences:** a conditional packet in the delivery plan; a likely small change in
  `apps/ayokoding-cli` and the CI planning step (shard count by units).
- **Revisit when:** plan 05's CI changes its shard rule or limits.

## D9 — Security Courses Teach in a Self-Owned, Offline Lab

- **Selected:** the three security-flavoured courses run in-process against fixtures; no example opens a
  socket, runs a shell, or contacts a machine; addresses are RFC 5737 documentation ranges; attack behaviour
  is labelled log lines; a deterministic test scans code for network and shell APIs
  ([004](./004-code-harness-and-determinism-design.md#safety-checks-for-security-courses)).
- **Alternatives:** (a) a live lab in containers with real vulnerable software and scanners; (b) leave
  the boundary to reviewer judgement with no scan.
- **Prior art:** OWASP Top 10:2025 (<https://owasp.org/Top10/2025/>) for the weakness classes; MITRE
  ATT&CK v19 (<https://attack.mitre.org/>) for technique names, with its required notice; NIST SP 800-115
  (2008, <https://csrc.nist.gov/pubs/sp/800/115/final>) for the idea that testing needs written
  authorisation and scope, with its current status re-checked in Phase 0.
- **Trade-offs:** (a) is richer but needs network and weaponised material in a public repository, against
  the harness's offline rule; (b) relies on attention. The chosen lab is less realistic and fully
  reproducible.
- **Consequences:** a safety finding is CRITICAL in the Content Quality Gate; the harness's networking-off
  rule backs the scan.
- **Revisit when:** the user asks for live-lab content, which needs a separate plan and review.

## D10 — Every Cap Is 2 Cycles (Supersedes Decision 29's 3)

- **Selected:** `max-cycles: 2` on the mode gate, the Content Quality Gate, the plan quality gate, and every
  maker-checker or review loop; BLOCKED after the second cycle.
- **Alternatives:** (a) the repository default of 3, which decision 29 first recorded; (b) 1 cycle.
- **Prior art:** the user's instruction of 2026-10-09 ("semua jadi 2 aja"); plans 05 and 06 already apply
  it; the gates accept 1–3.
- **Trade-offs:** fewer chances to repair a heavy course before it is BLOCKED, in exchange for bounded
  cost and earlier reports to the user.
- **Consequences:** more BLOCKED courses are possible among the heaviest; the BLOCKED route is the safety
  valve. Sibling plans 02–04 may still say 3; the user decides whether to align them.
- **Revisit when:** more than two courses in the first batch are BLOCKED on the same cause.

## D11 — Code Is Built Test First by `swe-developer`; Lessons by the Maker

- **Selected:** the capstone reference solution (an application with tests) is built by `swe-developer`,
  test first; the lessons, example units, katas, and drilling are written by the Annotated-Concept maker.
- **Alternatives:** (a) the maker writes everything, as plan 06 does for its courses; (b) `swe-developer`
  writes every example unit too.
- **Prior art:** the repository's SWE delegation rule (coding work goes to a `swe-*` agent) and the TDD
  rule for code changes.
- **Trade-offs:** (a) mixes two skills in one long agent run and breaks the delegation rule for a real
  application; (b) uses a code agent for 315 short teaching snippets whose value is in the writing.
- **Consequences:** two attempts per course for the reference solution plus two for the maker; the ledger
  records both.
- **Revisit when:** reference solutions need little code (for example a later plan's small capstone).

## D12 — Flip All Eight Together; Keep the Completion Test Out of the Course Commits

- **Selected:** courses are committed with `status: outline` still set; the metadata flip, the drift-test
  `estimatedHours`, and the completion feature land together after the human stop.
- **Alternatives:** (a) flip each course in its own commit; (b) write the completion test first and let it
  fail through the batches.
- **Prior art:** plan 06's metadata phase; the drift test covers only non-outline courses; a failing test
  would fail the pre-push `test:quick`.
- **Trade-offs:** (a) lets the badge disappear course by course but runs the drift test eight times and
  complicates a BLOCKED course; (b) breaks the push hook.
- **Consequences:** a BLOCKED course simply stays an outline with no half-flipped state.
- **Revisit when:** a plan has more than about a dozen such courses and wants interim hours.

## D13 — Floors Stay Plan-Local; the Contract Becomes a Rule

- **Selected:** the word and drilling floors bind these eight courses through the content-shape test; the
  contract headings, the mode declaration, the coupling rule, and the safety boundary become a durable
  rule module.
- **Alternatives:** (a) promote the floors to a rule for every course; (b) make nothing durable.
- **Prior art:** plan 06's D4 and D9 make the same split between plan-local targets and durable rules.
- **Trade-offs:** (a) would bind courses that plans 11–13 have not measured; (b) lets the next capstone
  drift.
- **Consequences:** future capstones follow the module; the gates judge the parts a test cannot.
- **Revisit when:** plans 11–13 measure the other courses and want shared floors.
