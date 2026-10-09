# 007 — Testing Strategy

This plan changes content, test support code, and (only if a ladder rung triggers) a little CI selection code. Most of
its proof is therefore not a new test. It changes nine kinds of thing, and each is proven a different way:

| What changes                                                                        | Proven by                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 45 courses (prose, code, drilling)                                                  | Per course: the mode quality gate and the Content Quality Gate (judgement), and the code harness (execution). For all 45 together: plans 11 and 12's content-shape test, extended, with each course as a probe row first (RED) |
| Six filler-baseline entries                                                         | Plan 09's filler-guard tests: the entry leaves the baseline in the same commit as the fixed course, and the cap falls by one; the baseline ends empty                                                                          |
| `prerequisites`, `estimatedHours`, and (two courses) `format` of the course indexes | Plan 02's integrity tests and plan 03's drift and format tests over the real content ([005](./005-prerequisites-ai-path-and-capstone-integrity.md))                                                                            |
| The AI manifest, only on the exception in 005                                       | `careers-ai-manifest.unit.test.ts` and the integrity tests, RED then GREEN                                                                                                                                                     |
| Capstone relies-on rows, and the contract of three capstones                        | Plan 08's capstone content-shape test, with the three slugs added to its constant                                                                                                                                              |
| Offline and safe content (AI and security courses)                                  | A new feature, `course-content-safety.feature`, four scenarios (boundary, banned APIs, reserved addresses, hosted-model calls), and a tested exceptions list                                                                   |
| The shape-3 Start-button case                                                       | The edited Gherkin exemption with its Unit proof, once the last course without a `learning/` folder gains one                                                                                                                  |
| Series harness coverage                                                             | `ayokoding-cli examples coverage`, per course and repository-wide, and a green full run on the same commit                                                                                                                     |
| CI shard count and timeout (rungs 2b, 2c, 2t, 2d, 3), only if triggered             | Go unit tests in `apps/ayokoding-cli`, regression test first, and the workflow's own run on the draft PR                                                                                                                       |

## Layers

The app's BDD contract binds every Gherkin scenario in `specs/apps/ayokoding/www/behaviours/` to the adapters declared
in `apps/ayokoding-www/behaviour-coverage.json`:

| Adapter     | Bindings folder                        | In `test:quick`? |
| ----------- | -------------------------------------- | ---------------- |
| Unit        | `apps/ayokoding-www/tests/unit`        | Yes              |
| Integration | `apps/ayokoding-www/tests/integration` | No (CI)          |
| E2E         | `apps/ayokoding-www-fe-e2e/tests/e2e`  | No (CI)          |

A scenario needs exactly one binding per adapter, or an exemption tag with an
`# Exemption(<adapter>): <reason>; alternative-proof: <target> / <scenario>` comment, as the existing features do.
`test:coverage:behaviour` checks this statically. The backend corpus is also bound by `apps/ayokoding-www-be-e2e`, so a
backend feature needs an E2E binding there or an E2E exemption.

## Extending the Audited Course Completion Feature

Plan 11 creates `specs/apps/ayokoding/www/behaviours/backend/content/audited-course-completion.feature`, its step file
`apps/ayokoding-www/tests/unit/be-steps/audited-course-completion.steps.ts`, and the registry
`apps/ayokoding-www/tests/unit/be-steps/audited-courses.ts` that exports `AUDITED_COURSES` (rows of `{ slug, format }`)
and `DEFERRED_BY_USER`. Plan 12 adds a ninth scenario for its own courses and says plan 13 adds a tenth. This plan
follows that. It creates no second completion feature file.

- **45 rows.** Each course adds one row in its own commit at CP-6. The row is added after the probe run is GREEN, so no
  commit has a red test and a BLOCKED course leaves no row behind. When this plan is done the registry holds the rows of
  plans 11, 12, and 13.

| `format` in the registry row | Rows |
| ---------------------------- | ---- |
| `by-example`                 | 27   |
| `annotated-concept`          | 7    |
| `annotated-concept-no-code`  | 8    |
| `capstone`                   | 3    |
| Total                        | 45   |

- **One new scenario, the tenth.** "The registry lists every course audited by plan 13" holds a constant of the 45 slugs
  next to the constants of plans 11 and 12 and fails if one is missing from `AUDITED_COURSES` and not in
  `DEFERRED_BY_USER`. Like the scenarios before it, it cannot be green until the last course is registered, so Phase 8
  adds it, Gherkin first (RED: the feature text and a step that fail), after the last row exists (GREEN). The Gherkin
  text and the exemption comments are in [../prd.md](../prd.md#audited-course-completion-the-tenth-scenario).
- **Phase 0 follows the merged names.** It reads the merged step file and records the constant's name and shape, the
  registry's exports, the probe variable, and the scenario titles as merged, and follows them. If plans 11 and 12 merged
  a different design (for example one constant per plan in a separate file), this plan adds its own constant in the
  same place and records the difference. The scenario's meaning does not change.
- **Probe row.** `AUDIT_PROBE=<slug>:<format>` adds one course to the registry for a single run. CP-1 uses it to show a
  course RED before the audit without a red row in the working tree. The new safety scenarios below also read the
  probe row, so CP-1 shows the safety state of a security or AI course too.
- **Floors by mode.** The step file holds one table (word floor, example floor and heading form, diagram rule, kata
  floor, example-unit floor) and reads the row for the course's registered `format`. The table is the one in
  [002](./002-definition-of-done-and-targets.md#targets-by-mode); this plan changes no floor. If Phase 0 finds that the
  merged table lacks a row for `capstone` or `annotated-concept-no-code`, it adds the row (23,000 words, 45 worked
  examples, 10 diagrams, 5 katas for `capstone`; 18,000 words, 20 worked scenarios, 10 diagrams, no code for
  `annotated-concept-no-code`) in the same commit as the first row that needs it.
- **Counting rules.** As plan 11 states them: words are whitespace-separated tokens across every `.md` file of the
  course outside `code/` folders and without `_index.md`, frontmatter removed, fenced code included; examples are the
  headings of the mode's form, numbered 1 to N without a gap; diagrams are ` ```mermaid ` fences; "Why It Matters" is the
  block after the heading `**Why It Matters**` or `### Why It Matters` up to the next heading or bold label.
- **The two corrected courses.** `behavioral-and-leadership-interviews` and `system-design-interview` are registered
  with `annotated-concept-no-code` (decision D3). The same commit edits the `format` frontmatter of each course, so the
  index and the registry agree; plan 03's tests accept either value.
- **What it does not check.** Annotation density, the code-bearing share of an Annotated Concept course, illustration
  justification, accuracy, and prose quality belong to the quality gates. Whether the code runs and its output is
  stable belongs to `examples check`.
- **Why a test and not a script.** Series decision 37 keeps checks in the app's tested TypeScript or in
  `ayokoding-cli`, never ad-hoc scripts. A test also keeps guarding these courses after the plan archives: a later edit
  that thins a course fails `test:quick`.

### Test-First for Content

Each course follows the same loop. CP-1 runs the step file with the course as a probe row and `UNIT-NODE`: the scenarios
the course does not yet meet fail, and the ledger records which. CP-2 to CP-5 close them. CP-6 adds the real row and
commits it with the course, GREEN. The red probe run per course is the evidence that the test could fail.

## New Feature: Course Content Safety

`specs/apps/ayokoding/www/behaviours/backend/content/course-content-safety.feature` holds four scenarios (text and
exemption comments in [../prd.md](../prd.md#new-backendcontentcourse-content-safetyfeature)). It turns the rules of
[011](./011-ai-fixtures-and-sourcing-policy.md) and [012](./012-safe-lab-and-content-safety-rules.md) that a program can
check into checks, in the style of plan 08's CC5 scenario. Every scenario carries `@integration-exempt @e2e-exempt`,
because it reads committed course files only.

- **Unit binding:** `apps/ayokoding-www/tests/unit/be-steps/course-content-safety.steps.ts`, with its scanner and scope
  lists in `apps/ayokoding-www/tests/unit/be-steps/course-safety-scan.ts` (test support code, not product code).
- **Scope = a constant list intersected with the registry.** The step file holds two constants: the six safety-scanned courses
  (`security-essentials`, `it-and-application-security`, `offensive-security`,
  `detection-engineering-and-siem-operations`, `agent-permissions-and-sandboxing`, and `capstone-first-working-software`)
  and the 13 AI courses that have code. A scenario checks only the slugs of its constant that are in `AUDITED_COURSES` or
  the probe row. A course therefore enters the safety checks exactly when its registry row lands, and no commit has a red
  test. The tenth completion scenario proves that every course ends in the registry, so every constant ends fully applied.
- **Scenario 1, "Safety-scanned courses state their safety boundary".** The page that carries the `## Safety boundary`
  heading (`learning/overview.md` for the five courses, the course `overview.md` for the capstone, as plan 08's CC5
  places it) has the heading and at least 60 words under it.
- **Scenario 2, "Safety-scanned course code opens no socket, resolves no name, or runs no shell".** The scanner reads
  every file under the course's code roots (`learning/code`, `drilling/code`, `learning/capstone/code`), expected files
  included, and reports a hit for each banned API of
  [012](./012-safe-lab-and-content-safety-rules.md#the-three-checks). A hit that is in the exceptions list passes; every
  other hit fails with the file, line, and pattern.
- **Scenario 3, "Safety-scanned course pages and code use only reserved addresses".** The scanner reads every Markdown
  page and every code or expected file of the six courses and reports each IPv4 or IPv6 literal outside the ranges of
  plan 09's rule SEC1 (rule SF2 extends the rule's reach from plan 09's two courses to these six). Plan 09's own
  scenario and its two-course list do not change.
- **Scenario 4, "AI course code calls no hosted model and reads no credential".** The scanner reads the code roots of the
  13 AI courses and reports a hosted-model SDK import, a credential variable read, a model download call, and a network
  module ([011](./011-ai-fixtures-and-sourcing-policy.md#ai1-to-ai7)).
- **The scanner and its exceptions are themselves tested.** The step file's first commit carries a helper test
  (`apps/ayokoding-www/tests/unit/be-steps/course-safety-scan.unit.test.ts`) over an in-memory course tree: a tree with a
  `socket` import, an `openai` import, and a public address each makes the matching scenario fail (RED); the clean tree
  passes (GREEN). The same helper test checks the exceptions list: each entry names a file that exists, a pattern that
  still occurs in it, and a reason of at least 10 characters, so an exception cannot outlive the code that needed it and
  cannot be added without a sentence of why. It is the "both ways" proof of
  [010](./010-rule-and-docs-impact.md#enforcement-proof-both-ways).
- **What it does not check.** Whether a unit teaches an attack at a safe level of detail, whether a lesson's hostname is
  a real one, and whether a claim has a current source are judged by the Content Quality Gate, which is told to read
  012 and 011 (Unenforced by decision, as plan 08 did for operational detail).

## The Filler Baseline Ratchet

Plan 09 added a deterministic filler guard (`core/course-filler.ts`, rules FG1 to FG6) with a closed baseline in
`core/course-filler-baseline.ts`: `FILLER_BASELINE`, `FILLER_BASELINE_CAP`, and `REWRITTEN_FILLER_COURSES`. Phase 0
reads the merged names. The arithmetic of the baseline across the series, with the owner tags plan 09 gave each entry:

| Moment                              | Entries | Cap | Entries tagged `plan-13` |
| ----------------------------------- | ------- | --- | ------------------------ |
| Plan 09 starts (2026-10-09)         | 25      | 25  | 6                        |
| Plan 09 has rewritten eight courses | 17      | 17  | 6                        |
| Plan 11 has removed its five        | 12      | 12  | 6                        |
| Plan 12 has removed its six         | 6       | 6   | 6                        |
| This plan has removed its six       | 0       | 0   | 0                        |

The rules that bind this plan live in the skill module `reference/course-quality-guards.md`:

- **FILL1.** A course that is not an outline must not be templated filler: it passes FG1 to FG6.
- **FILL2.** The baseline only shrinks: no new entry, the cap falls in the commit that removes an entry, and a listed
  course that no longer fires must leave the list.
- **SEC1.** Security course examples use only reserved addresses. It bound plan 09's two security courses; this plan
  extends its reach to six more courses through a scenario of its own feature (rule SF2).

The six measures, in plan 09's words: FG1 is the ratio of distinct example bodies (below 0.5 fires); FG2 the ratio of
distinct unit code (below 0.5); FG3 the share of bodies that have a near-duplicate (0.5 or more); FG4 the share of stub
units of fewer than 4 non-blank code lines (0.8 or more); FG5 total words below 1,000; FG6 the share of words in
paragraphs that repeat in at least 10 example bodies (0.25 or more). A rule needs at least 10 samples (20 for FG6) before
it can fire. The six courses of this plan that are in the baseline:

| Slug                               | Rules fired (2026-10-09) | Values                                                                    | Wave and slot |
| ---------------------------------- | ------------------------ | ------------------------------------------------------------------------- | ------------- |
| `agent-permissions-and-sandboxing` | FG2 and FG6              | unique-code ratio 0.06, boilerplate share 0.29                            | 9.1           |
| `android-app-development`          | FG3 and FG6              | near-duplicate share 0.90, boilerplate share 0.52                         | 6.2           |
| `build-your-own-reactive-ui`       | FG2, FG3, and FG6        | unique-code ratio 0.06, near-duplicate share 0.65, boilerplate share 0.48 | 12.2          |
| `information-architecture-and-seo` | FG6                      | boilerplate share 0.34                                                    | 10.3          |
| `linux-app-development`            | FG6                      | boilerplate share 0.32                                                    | 11.1          |
| `windows-app-development`          | FG3                      | near-duplicate share 0.79                                                 | 13.2          |

The ratchet binds this plan in five ways:

1. **CP-6 removes the entry.** For each of the six courses the coordinator deletes the course's entry from
   `FILLER_BASELINE` and lowers `FILLER_BASELINE_CAP` by one, in the same commit as the course. If the entry stayed, the
   guard's test "every baseline course still fires" would fail once the course no longer fires; if the course still
   fired, "every non-outline course that fires a rule is in the baseline" would fail after the removal. The audit is
   therefore not DONE until `course-filler.steps.ts` is green without the entry.
2. **The order of removals is the wave order.** The cap falls one step at each commit of the table after this list, so
   every commit has a consistent baseline. A BLOCKED filler course keeps its entry and the cap stays above 0 for it;
   the BLOCKED procedure restores the baseline file too, and the end-state gate records the number left.
3. **The other 39 courses must not start firing.** The plan writes about 487,871 words and creates 1,007
   unit folders. A maker that writes 85 "Why It Matters" paragraphs from one template fires FG1, FG3, or FG6, and a
   maker that copies one program with new literals fires FG2. Two details of the normalization matter to makers.
   Comments are stripped before FG2 and FG4 measure a unit, so a unit with twenty annotation lines and three code lines
   counts as a stub; write each example with at least four code lines of its own. And FG6 counts a paragraph that
   repeats in ten example bodies, so a closing "why it matters" sentence is written from the example's own code and
   output, never from a template. Two families carry an extra risk. **AI units** import one `FakeModel` kit and then
   differ only in their scripted replies, which looks like one program with new literals (FG2, FG3); every AI unit must
   hold at least four non-blank lines of its own logic that other units do not share (a different tool, a different
   failure, a different check). **Security units** come in attack and defence pairs that look alike; the pair differs in
   what the defence checks, and the unit says so in code, not only in a comment. CP-2 runs
   `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts`, which scans the whole corpus, and the packet owner reads the
   course's own row in the printed metrics table before the gates. Authoring is also split into blocks of at most 15
   examples, and a block is not handed on until `FILLER` shows no fired rule for it. A course that fires is fixed, never
   added to the baseline (FILL2 forbids a new entry).
4. **No exemption.** If a rule seems wrong for a course, the rule is changed with a fixture and a new calibration table
   in plan 09's module, not exempted here.
5. **`REWRITTEN_FILLER_COURSES` is plan 09's list.** This plan does not add to it. Once an entry is gone, the guard's
   general scenario keeps guarding the course, and a course cannot be in both lists.

The removal order:

| Commit order | Course (wave, slot)                        | Cap after the commit |
| ------------ | ------------------------------------------ | -------------------- |
| 1            | `android-app-development` (6, 2)           | 5                    |
| 2            | `agent-permissions-and-sandboxing` (9, 1)  | 4                    |
| 3            | `information-architecture-and-seo` (10, 3) | 3                    |
| 4            | `linux-app-development` (11, 1)            | 2                    |
| 5            | `build-your-own-reactive-ui` (12, 2)       | 1                    |
| 6            | `windows-app-development` (13, 2)          | 0                    |

Why the six are rewritten and not only repaired: the guard measures the code and the lessons together, and four of the
six fire on the programs themselves (FG2 or FG3), where a lesson cannot be made distinct while the programs repeat. The
other two, `information-architecture-and-seo` and `linux-app-development`, fire only on the repeated paragraphs (FG6),
so their programs may stay and their lessons are rewritten.

The end-state gate reads the result directly: `FILLER_BASELINE` is empty, the cap is 0, no entry carries the tag
`plan-13`, the scan reports no fired rule for any of the 45 slugs, and `course-filler.steps.ts` exits 0
([../delivery.md](../delivery.md#phase-9-end-state-gate)). Plan 14 requires the baseline to be empty; this plan leaves
the empty constants in place and does not delete the mechanism.

Phase 0 reads the merged baseline. If a plan 13 course has already left the list, the owner tags differ, or the cap is
not 6, the table above is corrected in the evidence, and the ledger rows say which courses need the removal. An
unexplained difference (an extra course in the baseline that plan 09's calibration did not list) is reported to the user
and is not baselined by this plan.

## The Series Harness Coverage Gate

Decision 40 ends the series with every course that has code covered by the harness. Plan 05 gave the harness a
coverage report, `ayokoding-cli examples coverage`, and a floor flag, `--min-percent`. This plan is the last audit plan,
so its end-state gate proves the series gate. It builds no new gate code (decision D18); it runs the existing command in
the way that makes the claim checkable, and plan 14 repeats it.

**The denominator.** A course is _applicable_ when it has a `code/` folder with files or a code fence that is not
prose. A no-code course is _not applicable_: it appears in the report as not applicable and stays outside the percent.
This plan's 37 courses with code are applicable and its 8 no-code courses are not applicable:

| Course                                                                                                                      | Coverage class | Units | Harness mode  | Expected in the coverage JSON                                                      |
| --------------------------------------------------------------------------------------------------------------------------- | -------------- | ----- | ------------- | ---------------------------------------------------------------------------------- |
| [`advanced-frontend`](../syllabus/courses/advanced-frontend.md)                                                             | applicable     | 89    | real          | `covered: true`                                                                    |
| [`android-app-development`](../syllabus/courses/android-app-development.md)                                                 | applicable     | 87    | real + static | `covered: true`                                                                    |
| [`api-design`](../syllabus/courses/api-design.md)                                                                           | applicable     | 89    | real          | `covered: true`                                                                    |
| [`async-python-and-fastapi-services`](../syllabus/courses/async-python-and-fastapi-services.md)                             | applicable     | 87    | real          | `covered: true`                                                                    |
| [`backend-at-scale`](../syllabus/courses/backend-at-scale.md)                                                               | applicable     | 89    | real          | `covered: true`                                                                    |
| [`backend-essentials`](../syllabus/courses/backend-essentials.md)                                                           | applicable     | 89    | real          | `covered: true`                                                                    |
| [`build-your-own-reactive-ui`](../syllabus/courses/build-your-own-reactive-ui.md)                                           | applicable     | 89    | real          | `covered: true`                                                                    |
| [`build-your-own-web-framework`](../syllabus/courses/build-your-own-web-framework.md)                                       | applicable     | 89    | real          | `covered: true`                                                                    |
| [`capstone-first-working-software`](../syllabus/courses/capstone-first-working-software.md)                                 | applicable     | 51    | real          | `covered: true`                                                                    |
| [`capstone-full-stack-app`](../syllabus/courses/capstone-full-stack-app.md)                                                 | applicable     | 51    | real          | `covered: true`                                                                    |
| [`frontend-essentials`](../syllabus/courses/frontend-essentials.md)                                                         | applicable     | 89    | real          | `covered: true`                                                                    |
| [`hybrid-app-development`](../syllabus/courses/hybrid-app-development.md)                                                   | applicable     | 87    | real          | `covered: true`                                                                    |
| [`information-architecture-and-seo`](../syllabus/courses/information-architecture-and-seo.md)                               | applicable     | 59    | real          | `covered: true`                                                                    |
| [`ios-app-development`](../syllabus/courses/ios-app-development.md)                                                         | applicable     | 87    | real + static | `covered: true`                                                                    |
| [`linux-app-development`](../syllabus/courses/linux-app-development.md)                                                     | applicable     | 87    | real          | `covered: true`                                                                    |
| [`windows-app-development`](../syllabus/courses/windows-app-development.md)                                                 | applicable     | 87    | real + static | `covered: true`                                                                    |
| [`agent-context-and-memory`](../syllabus/courses/agent-context-and-memory.md)                                               | applicable     | 54    | real          | `covered: true`                                                                    |
| [`agent-orchestration-subagents-and-observability`](../syllabus/courses/agent-orchestration-subagents-and-observability.md) | applicable     | 52    | real          | `covered: true`                                                                    |
| [`agent-permissions-and-sandboxing`](../syllabus/courses/agent-permissions-and-sandboxing.md)                               | applicable     | 84    | real          | `covered: true`                                                                    |
| [`agent-tools-and-mcp`](../syllabus/courses/agent-tools-and-mcp.md)                                                         | applicable     | 84    | real          | `covered: true`                                                                    |
| [`agentic-ai`](../syllabus/courses/agentic-ai.md)                                                                           | applicable     | 89    | real          | `covered: true`                                                                    |
| [`agentic-coding`](../syllabus/courses/agentic-coding.md)                                                                   | applicable     | 33    | real          | `covered: true`                                                                    |
| [`creating-ai-powered-apps`](../syllabus/courses/creating-ai-powered-apps.md)                                               | applicable     | 89    | real          | `covered: true`                                                                    |
| [`evaluating-ai-output-essentials`](../syllabus/courses/evaluating-ai-output-essentials.md)                                 | applicable     | 49    | real          | `covered: true`                                                                    |
| [`evaluating-ai-systems-in-depth`](../syllabus/courses/evaluating-ai-systems-in-depth.md)                                   | applicable     | 89    | real          | `covered: true`                                                                    |
| [`fine-tuning-and-adaptation`](../syllabus/courses/fine-tuning-and-adaptation.md)                                           | applicable     | 84    | real          | `covered: true`                                                                    |
| [`inference-serving-and-model-deployment`](../syllabus/courses/inference-serving-and-model-deployment.md)                   | applicable     | 84    | real          | `covered: true`                                                                    |
| [`product-patterns-for-probabilistic-systems`](../syllabus/courses/product-patterns-for-probabilistic-systems.md)           | not applicable | -     | -             | no `code/` folder with files and no non-prose fence; the course stays free of code |
| [`statistics-for-evaluation`](../syllabus/courses/statistics-for-evaluation.md)                                             | applicable     | 51    | real          | `covered: true`                                                                    |
| [`the-agent-loop`](../syllabus/courses/the-agent-loop.md)                                                                   | applicable     | 84    | real          | `covered: true`                                                                    |
| [`analytics-and-experimentation`](../syllabus/courses/analytics-and-experimentation.md)                                     | applicable     | 84    | real          | `covered: true`                                                                    |
| [`engineering-management`](../syllabus/courses/engineering-management.md)                                                   | not applicable | -     | -             | no `code/` folder with files and no non-prose fence; the course stays free of code |
| [`project-management`](../syllabus/courses/project-management.md)                                                           | not applicable | -     | -             | no `code/` folder with files and no non-prose fence; the course stays free of code |
| [`software-product-engineering`](../syllabus/courses/software-product-engineering.md)                                       | not applicable | -     | -             | no `code/` folder with files and no non-prose fence; the course stays free of code |
| [`technical-communication`](../syllabus/courses/technical-communication.md)                                                 | not applicable | -     | -             | no `code/` folder with files and no non-prose fence; the course stays free of code |
| [`behavioral-and-leadership-interviews`](../syllabus/courses/behavioral-and-leadership-interviews.md)                       | not applicable | -     | -             | no `code/` folder with files and no non-prose fence; the course stays free of code |
| [`capstone-interview-loop`](../syllabus/courses/capstone-interview-loop.md)                                                 | applicable     | 51    | real          | `covered: true`                                                                    |
| [`coding-interview`](../syllabus/courses/coding-interview.md)                                                               | applicable     | 84    | real          | `covered: true`                                                                    |
| [`system-design-interview`](../syllabus/courses/system-design-interview.md)                                                 | not applicable | -     | -             | no `code/` folder with files and no non-prose fence; the course stays free of code |
| [`take-home-and-live-coding`](../syllabus/courses/take-home-and-live-coding.md)                                             | applicable     | 84    | real          | `covered: true`                                                                    |
| [`detection-engineering-and-siem-operations`](../syllabus/courses/detection-engineering-and-siem-operations.md)             | applicable     | 87    | real          | `covered: true`                                                                    |
| [`it-and-application-security`](../syllabus/courses/it-and-application-security.md)                                         | applicable     | 33    | real          | `covered: true`                                                                    |
| [`it-governance-grc`](../syllabus/courses/it-governance-grc.md)                                                             | not applicable | -     | -             | no `code/` folder with files and no non-prose fence; the course stays free of code |
| [`offensive-security`](../syllabus/courses/offensive-security.md)                                                           | applicable     | 87    | real          | `covered: true`                                                                    |
| [`security-essentials`](../syllabus/courses/security-essentials.md)                                                         | applicable     | 89    | real          | `covered: true`                                                                    |

**What Phase 9 runs, in this order:**

1. `EX-COVERAGE` saved as `<plan>/evidence/phase-9-coverage.json`. Expectation: every one of the 37
   applicable courses above reports `covered: true`; the 8 others report not applicable; no course of
   this plan reports a unit without a `run.yaml`.
2. For each applicable course, `CLI examples coverage --course <slug> --min-percent 100` exits 0. This is the per-course
   proof that the course's share of the series gate is met, and it is the check a reviewer can repeat on one course.
3. Repository-wide: `CLI examples coverage --min-percent 100` exits 0. This is the series claim. If it exits non-zero
   because of a course that is not one of this plan's 45 (a course a user deferred in plan 11 or 12, or a course the
   other plans left), the output is saved, the owner is named in the evidence, and the gate for this plan stays met for
   its own share; the series claim is reported to the user as open, and plan 14 re-measures it. The plan never lowers
   `--min-percent` to make it pass.
4. `EXAMPLES --configuration=full` is green **on the same commit** as step 3. A coverage percent with a red full run
   proves only that units exist, not that they pass, so plan 14 combines both on one commit and so does this plan.
   Where the full run cannot finish inside a runner timeout, the gate runs it as the monthly workflow would (all
   courses, eight shards, weighted split) and records the longest shard ([004](./004-toolchain-additions-and-ci-cost.md#the-ci-budget)).
5. The no-code accounting: the set of courses reported not applicable that belong to this plan equals the eight no-code
   courses of the table above, no more and no fewer. A code course reported not applicable would hide an
   unconverted course; a no-code course reported applicable would mean code crept in.

**Which share belongs to plan 13.** The series ends at 100 percent of the applicable courses covered. Plans 06 to 08 and
10 covered theirs, plans 11 and 12 theirs, and this plan covers the 37 applicable courses above, which are
the last. Plan 14 re-measures the whole: it runs `coverage --min-percent 100` and a green full run on one commit, and
fails if any applicable course is uncovered. A BLOCKED or deferred course of this plan with code leaves its own entry in
the table above uncovered, so it keeps the series gate red until it is DONE; the user decides explicitly, and plan 14
hears about it.

**The optional ratchet (decision D18).** A CI step that runs `coverage --min-percent 100` on every pull request would
stop a later change from uncovering a course. It would also make every future new course with code a harness course on
day one. That is a product decision about the repository, not a part of auditing 45 courses, so the plan does not build
it. The evidence records the one-line command so the user can add it after plan 14 if they want.

## Scenario-to-Test Map

| Scenario                                                                             | Unit                                                   | Integration | E2E                                                                 |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------ | ----------- | ------------------------------------------------------------------- |
| No audited course is an outline and each declares its mode                           | `be-steps/audited-course-completion.steps.ts`          | exempt      | exempt (both E2E projects)                                          |
| Every audited course reaches the word floor of its mode                              | same                                                   | exempt      | exempt                                                              |
| Every audited course has the example count and numbering of its mode                 | same                                                   | exempt      | exempt                                                              |
| Every audited course has the diagrams of its mode                                    | same                                                   | exempt      | exempt                                                              |
| Every example has a "Why It Matters" block of 50 to 100 words                        | same                                                   | exempt      | exempt                                                              |
| Every audited course has the full drilling page                                      | same                                                   | exempt      | exempt                                                              |
| Every audited course keeps its code in units with a run specification                | same                                                   | exempt      | exempt                                                              |
| The registry lists every course of plan 11                                           | same                                                   | exempt      | exempt                                                              |
| The registry lists every course audited by plan 12                                   | same                                                   | exempt      | exempt                                                              |
| The registry lists every course audited by plan 13 (new)                             | same                                                   | exempt      | exempt                                                              |
| Safety-scanned courses state their safety boundary (new)                             | `be-steps/course-content-safety.steps.ts`              | exempt      | exempt                                                              |
| Safety-scanned course code opens no socket, resolves no name, or runs no shell (new) | same                                                   | exempt      | exempt                                                              |
| Safety-scanned course pages and code use only reserved addresses (new)               | same                                                   | exempt      | exempt                                                              |
| AI course code calls no hosted model and reads no credential (new)                   | same                                                   | exempt      | exempt                                                              |
| Start falls back to the course overview (edited)                                     | `fe-steps/course-landing-header.steps.tsx` (unchanged) | as merged   | **exempt (new)**, if no course without a `learning/` folder remains |

The titles of the first nine are plans 11 and 12's, as merged; Phase 0 copies them exactly. The last row is
an edit to a feature that an earlier plan created; the table records what this plan changes in it, and Phase 0 reads
its merged text.

Other tests this plan relies on, all existing:

| Test                                                                                                                              | Run when                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` (plan 09)                                                                  | CP-2, and CP-6 for the six baseline courses                                            |
| `UNIT-NODE tests/unit/be-steps/course-metadata.steps.ts` (plan 03)                                                                | CP-6, to read the expected `estimatedHours` and `format`                               |
| The path integrity tests in [005](./005-prerequisites-ai-path-and-capstone-integrity.md#the-integrity-tests-that-must-stay-green) | CP-6 when `prerequisites` or `format` changed                                          |
| Plan 08's capstone content-shape test (`capstone-course-completion.steps.ts`)                                                     | CP-6 for the three capstones, and CP-7 for any capstone whose relies-on row was edited |
| `ayokoding-www:examples:check` (plan 05)                                                                                          | CP-5 per course; the PR gate on every push                                             |
| `QUICK`, `BEHAVIOUR`, `E2E-BEHAVIOUR`, `BE-E2E-BEHAVIOUR`                                                                         | Each checkpoint push and the end-state gate                                            |
| `INTEGRATION`, `E2E-QUICK`, `E2E`                                                                                                 | The end-state gate (regression only; this plan changes no UI)                          |

### The three capstones and plan 08's constant

Plan 08's step file lists its eight rewritten capstones in one constant and also runs a general rule over every
`capstone-*` course (not an outline, `format: capstone`). The three capstones of this plan are not in the constant.
Each of them is built to the same contract (CC1 to CC7, CL1 to CL4), so its CP-6 commit adds its slug to the constant
**after** the probe is GREEN, and the scenarios on the word floor, the six capstone headings, the drilling page, the
harness, and course-level links then guard it. Phase 0 reads the merged constant's name and shape. If the merged step
file derives its list from the folder names instead of a constant, nothing is added and the three capstones are
covered automatically.

## Conditional Harness Tests

These are Go tests in `apps/ayokoding-cli` (`CLI-QUICK`) or workflow-plan tests, written before the change they cover,
in the place Phase 1 finds them (expected: `internal/selection/` and the CLI's selection feature file). They carry plan
05's selection scenarios; the Gherkin scenarios of rungs 2b, 2c, 2t, and 2d, copied from plans 11 and 12, are in the text of
[../prd.md](../prd.md#conditional-cli-selection-scenarios) and are built only for a rung that is not merged.

| Rung                            | RED (fails before the change)                                                                    | GREEN (passes after)                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 2b (reuse if merged by plan 11) | A selection of 813 units over 9 courses returns four shards where the rule says eight            | It returns eight; 800 units return four; 120 units return one                                                      |
| 2c (reuse if merged by plan 11) | A split by sorted slug leaves the longest shard above the limit while a split by unit count fits | The split is by unit count, largest first, with no overlap and no gap across `1..N`                                |
| 2t (plan 12; reuse if merged)   | A change to the `python` Dockerfile selects every opted-in course                                | It selects every course that declares `python`; a change to the catalog schema still selects every opted-in course |
| 2d (plan 12; reuse if merged)   | A course of 87 units selected into eight shards appears in one shard                             | It appears in at least two, every unit runs exactly once, and the course-level checks run once                     |

Rung 3 (the 120-minute `since` timeout) is a workflow constant and is proven by the draft PR's own run finishing inside
it. If plans 11 and 12 already merged a rung, Phase 0 records it as present and runs its tests as regression tests only.
This plan adds no toolchain by default, so it adds no "each added id" test; if a candidate of
[004](./004-toolchain-additions-and-ci-cost.md#which-toolchains-are-missing) becomes GO, it carries plan 05's fixture
unit and smoke row.

## Manual Verification

The plan changes course pages and code, not components, but a reader sees them, so the end-state gate checks them in a
browser and on the wire. Each check names its expected observation in
[../delivery.md](../delivery.md#phase-10-manual-verification).

- **Browser (port 3101, 375×800 and 1280×800, English).** For one course per family (application development:
  `frontend-essentials`; AI engineering: `agent-tools-and-mcp`; product and leadership: `engineering-management`;
  interview preparation: `system-design-interview`; security: `offensive-security`), the static course
  `android-app-development`, and both new-folder capstones (`capstone-full-stack-app` and
  `capstone-first-working-software`): open the course landing, a learning page, the drilling page, and, for the
  capstones, the capstone page. Expect: examples render in order with their code and output blocks; Mermaid diagrams
  render; `<details>` blocks in drilling open; no "Outline" badge; the catalog card shows the format and the hours;
  the course appears in its paths unchanged; the safety boundary of `offensive-security` is visible near the top; the
  static course says plainly what its static runs prove; **Start** on both capstones opens `learning/overview`.
- **Wire.** The tRPC catalog payload lists the same `outlineCourseIds` as at baseline (this plan changes none) and
  carries the recomputed `estimatedHours` for three sampled courses and the corrected `format` for the two interview
  courses.
- **Harness.** Run `EX-CHECK` directly for three sampled courses (one AI, one static, one capstone) and read the
  coverage report: 37 of 37 applicable courses covered, 8 not applicable, and this
  plan's share of the series total recorded for plan 14.
- **Indonesian locale.** `rtk git status --short -- apps/ayokoding-www/content/id` is empty after every index
  generation; the `/id` landing pages are unchanged.
