# 010 — Rule and Docs Impact

This plan is lightly rule-affecting. It adds three small rules for AyoKoding code examples (output that does not
depend on the processor count, admission of a service image, and offline network examples), applies rules that plans
05, 08, 09, and 11 created (HC1 to HC8, S1 to S9, CL1 to CL4 and CC1 to CC7, FILL1, FILL2, TC1, TC2) without changing
them, and keeps the definition-of-done floors plan-local. The rules-propagation phase of
[../delivery.md](../delivery.md) runs the repository's
[Rules Propagation](../../../../repo-governance/workflows/quality/rules-propagation.md) workflow over the inventory
below, then the Rules Quality Gate (at most 2 cycles). Only one repository is affected: `ose-public`. The private
sibling and the upstream tools (RHINO, HIPPO) are independent and are not consulted or notified.

## Rule Inventory

Each rule is one obligation, stated so a reviewer can tell when it is followed and when it is broken.

| Id  | Rule (one obligation each)                                                                                                                                                                                                        | Scope                                                                                                                                     | Disposition                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AU1 | No value derived from the processor count, the cache hierarchy, or the scheduler reaches the output or the control flow of a code unit; pool sizes, `GOMAXPROCS`, scheduler counts, and thread counts are set explicitly          | Every harness unit of every course                                                                                                        | **Gated** for the cases that change bytes: the double run, whose second execution has half the CPU quota, fails the unit. A dependence that happens not to change the bytes is judged by the Content Quality Gate                                    |
| AU2 | A service id enters the toolchain catalog only if its image is pinned by digest, needs no secret, is ready inside its `readyTimeout` of at most 60 seconds, gives byte-identical output on the double run, and fits the CI ladder | New service entries in `apps/ayokoding-cli/toolchains/`                                                                                   | **Gated in part**: the fixture unit and smoke row of each id prove tests 1 to 4. Test 5 (fits the ladder) is a measured budget decision recorded in the ledger, **Unenforced by decision** as a test because it depends on the runner class          |
| AU3 | An example never talks to a real host: every address and name in an expected file or an `**Output**` block is a documentation value or loopback, and a port appears only when the unit chose it as a constant                     | Network-teaching units and their expected files (`networking-essentials`, `advanced-networking`, and any other course with network units) | **Unenforced by decision** as a test: telling a documentation host from a real one in prose and traces needs reading. A search for addresses and names in the expected files is a reading aid before the Content Quality Gate, which judges the rule |

Obligations in this plan that are **not** rules:

- **The floors themselves** (28,000, 22,000, and 23,000 words; 75 and 45 examples; the diagram band; 5,000 words of
  drilling) are plan-local targets, as plans 06, 07, 08, and 11 chose. They bind the registered courses through
  TC2 (plan 11) and nothing else. Whether they become a rule for every course is plan 14's decision.
- **The illustration budgets** (3, 6, and 0 fences) are per-course numbers in the briefs, judged by the Content
  Quality Gate; they change when the first audit shows a number is wrong.
- **The toolchain budget rule, the CI ladder, the size-class rule, and rule AI-1** are procedures of this plan
  ([004](./004-toolchain-additions-and-ci-budget.md), [006](./006-prerequisites-metadata-and-closure.md)) and end with
  it.
- **The cap of 2 cycles** is a plan-level setting, not a durable rule: the gates already accept `max-cycles` 1 to 3.
  No rule file changes for it.

### Supersessions and Conflicts

- **Plan 05's determinism rules** (no clock reads, explicit seeds, no network except declared services, no thread
  order, no hash-map order, no timing in compared streams) are not changed. AU1 names one more cause of divergence
  that the half-quota second run exposes; it adds to the list and loosens nothing.
- **Plan 05's "Adding a Toolchain" procedure** has three steps (catalog entry, fixture unit with smoke row, build).
  AU2 adds a test of admission that the procedure lacks for service images; it does not change the three steps.
- **Plan 05's S1 to S9** (the simulation convention) are applied as written ([003](./003-harness-modes-simulation-and-determinism.md#simulation-convention)).
  Nothing here weakens one.
- **Plan 09's SEC1** limits security course examples to reserved addresses and binds two courses, none of the 34.
  AU3 is in the same spirit for network-teaching examples. To avoid two lists, AU3 names the ranges by reference to
  the documentation blocks (RFC 5737 and RFC 3849) and loopback, and adds what SEC1 does not say: the example never
  talks to a real host, and a port appears only when the unit chose it. Phase 7 reads the merged SEC1 wording and, if
  it already says the same, records AU3 as an extension that cites it.
- **Plan 09's FILL1 and FILL2** bind this plan's CP-2b for six courses (the baseline ratchet in
  [007](./007-testing-strategy.md#the-filler-baseline-ratchet)). Nothing here replaces them.
- **Plan 11's TC1 and TC2** are applied, not changed. TC1 (a model or static check says so beside its fence) is
  load-bearing for the hardware, networking, and NoSQL fallbacks. TC2 (an audited course stays in the registry at its
  floors) gains 34 courses. If the merged TC2 text states a count of registered courses ("32 after this plan"), Phase
  7 replaces the count with the words "the courses in the registry", because the count changes with every plan.
- **Plan 08's CC1 to CC7 and CL1 to CL4** bind `capstone-solid-core` ([006](./006-prerequisites-metadata-and-closure.md#capstone-solid-core)).
  CC5 and CC7 do not apply to it; this plan adds a CC6 row only if a shared file exists.
- **`AGENTS.md`, `CLAUDE.md`, and every instruction surface:** no change. The three rules bind only AyoKoding code
  examples, so the narrowest surfaces are the skill module and the gate adapter.

### How the Gated Rules Are Checked

- **AU1:** by the harness itself. Plan 05's runner executes every unit twice, the second time with half the CPU quota,
  and compares the bytes. The regression proof is in the table below.
- **AU2:** by the fixture unit and smoke row each added id carries in the CLI, which `toolchains build <id>` and the
  double run exercise; by the spike record for test 5. Phase 1 writes both.
- **AU3:** by the Content Quality Gate, with a search as a reading aid. The search is a command the maker and the
  checker run on the course's expected files and `**Output**` blocks, listing IPv4 and IPv6 literals and host names
  for the reader to classify. It is never a pass or fail by itself.

## Placement

| Rule       | Canonical home                                                                                                                                                                                                                        | Reach                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| AU1 to AU3 | `.agents/skills/apps-ayokoding-www-developing-content/reference/code-example-harness.md` (plan 05's module), one new section, "Offline examples: processor count, services, and network", beside the determinism and service sections | Every AyoKoding content maker and fixer loads the skill; plan 13 and any later course cite it         |
| AU1 to AU3 | The existing "Example Harness" pointer in `repo-governance/development/quality/gate-adapters/ayokoding-www.md`, extended by one clause                                                                                                | The content and tutorial gates read the adapter, so the judged part of each rule reaches the checkers |

If Phase 0 finds the module absent under that name (plan 05 named it differently), the rules go into the module's
merged name; if no module exists, a new module `offline-examples.md` holds them, linked from `SKILL.md` and
`reference/README.md`. The module links to nothing under `plans/`, because plans are archived and a rule must outlive
them. It uses the rule form the skill already has: statement, reason, a violating and a conforming example, and an
enforcement line. No rule is placed in `AGENTS.md` or in a repository-governance convention file.

## Exact Text Changes

### Rules AU1 to AU3 (new section in `code-example-harness.md`)

> **AU1 — Output independent of the processor count.** The second execution of a unit runs with half the CPU quota, so
> no value derived from the processor count, the cache hierarchy, or the scheduler may reach output or control flow.
> That covers `os.cpu_count()`, `nproc`, `runtime.NumCPU()`, the default `GOMAXPROCS`, `available_parallelism`, the
> Erlang scheduler count, a database engine's thread count, `sysconf`, and any pool size taken from them. Pass an
> explicit value instead. Enforcement: the double run; judged by the Content Quality Gate for the rest.
>
> **AU2 — Admit a service image only when it is proven.** A service id enters the toolchain catalog only if its image
> is pinned by digest, starts with no secret, is ready inside a `readyTimeout` of at most 60 seconds, gives
> byte-identical output on the double run, and keeps the CI check inside its budget. A store that fails a test is not
> added: its units become labelled models. Enforcement: the id's fixture unit and smoke row; the budget is recorded
> in the plan ledger.
>
> **AU3 — Offline network examples.** A network example never talks to a real host. Every address and name in an
> expected file or an `**Output**` block is a documentation value (`example.com` and its subdomains, the RFC 5737 and
> RFC 3849 blocks) or loopback, and a port appears in output only when the unit chose it as a constant. Use a
> loopback pair, a fixture, or a seeded model. Enforcement: judged by the Content Quality Gate.

### Gate Adapter: Extend One Pointer

In the adapter's "Example Harness" section, add one clause to the pointer sentence:

> … and keep output independent of the processor count, admit service images only through the admission test, and keep
> network examples offline (rules AU1 to AU3).

### Skill Files

- `SKILL.md` and `reference/README.md`: no change if the module already has an entry; otherwise one index entry.
- If another plan already added any of these sentences, the rule is recorded as `Not triggered` with the commit, and
  only a contradiction (if any) is fixed.

## Generated Harness Routes

The skill edits change a reference file, not a skill's `name` or `description`, so the generated routes
(`.claude/skills/<skill>/SKILL.md` and the other declared harness directories) are expected not to change. The
delivery still runs, from the worktree root:

```bash
rtk ./hippo run --class transactional --resource-tier light --disk-path . -- ./rhino harness adapters generate
rtk ./hippo run --class ephemeral --resource-tier light --disk-path . -- ./rhino harness adapters validate
```

and records whether any generated file changed. Nobody edits a generated route by hand.

## Enforcement Proof (Both Ways)

"1, then 0" means the command exits 1 with the break in place and 0 after it is undone. Each break is made in the
working tree, run, then undone with `rtk git checkout -- <file>`, and the outputs are saved as evidence. A break that
does not turn the command red is a defect in the check, fixed before the plan goes on.

| Rule | Break                                                                                        | Command                                                                 | Expected  |
| ---- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------- |
| AU1  | In a fixture unit, replace the fixed pool size with `os.cpu_count()` and print the pool size | `EX-CHECK` on the fixture course (or the CLI's smoke test for the unit) | 1, then 0 |
| AU2  | Remove the digest from one added service entry in the catalog (or the smoke row of that id)  | `CLI-QUICK` (the catalog validation and the smoke table test)           | 1, then 0 |
| TC2  | Remove one row from `audited-courses.ts` (the ninth scenario)                                | `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts`      | 1, then 0 |

If no service id is added (rung 2t could not be built, or every spike failed), AU2's proof uses the existing
`postgres` entry's fixture. AU3 is judged: its proof is a negative run of the Content Quality Gate on one networking
unit whose expected file holds a public address, which must report a finding, recorded as evidence. AU1's
second form, a dependence that does not change bytes, is likewise judged.

## C4

No change. See [009](./009-file-impact.md#architecture-documents).

## Docs Propagation

| File                                                                 | Change                                                                                                                                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/ayokoding-cli/README.md` (plan 05's)                           | The toolchain-aware selection rule (rung 2t), the unit-level split (rung 2d), and the shard rule, only if a rung changes them                                          |
| The CLI's toolchain list or catalog reference (as merged by plan 05) | The ids added by this plan with their pins and the licence statement each spike recorded; nothing from an image is committed                                           |
| `specs/apps/ayokoding/www/behaviours/backend/content/README.md`      | Only if plan 11 did not list `audited-course-completion.feature`                                                                                                       |
| `docs/` and `apps/ayokoding-www/README.md`                           | Searched for statements about the number of audited courses, the harness coverage, the toolchain list, and the CI shard count; each stale normative statement is fixed |
