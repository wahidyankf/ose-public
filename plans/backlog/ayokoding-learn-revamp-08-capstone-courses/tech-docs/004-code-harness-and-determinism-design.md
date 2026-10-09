# 004 — Code Harness and Determinism Design

Seven of the eight capstones carry code, and every piece of it runs in plan 05's harness. This page says
how: the units each course holds, the toolchains, the shape of a capstone unit, the determinism rules
that apply here, the run-time budget and what to do if it is too tight, the two courses that need two
toolchains, the figures two courses share, and the safety checks for the three security-flavoured
courses.

The contract itself is plan 05's `ayokoding.run/v1` (`run.yaml`), its anchor grammar, its double run,
and its simulation convention S1–S9. This page does not restate them; it applies them. Where plan 05's
names differ as merged, Phase 0 records the merged names.

## Units per Course

Paths are relative to the course folder. "Example" is a unit under `learning/code/ex-NN-<slug>/`, "kata"
under `drilling/code/kata-NN-<slug>/{before,after}/`, and the capstone unit is `learning/capstone/code/`.

| Course                                   | Toolchain (catalog id)               | Example units | Kata units | Capstone unit | Units |
| ---------------------------------------- | ------------------------------------ | ------------- | ---------- | ------------- | ----- |
| `capstone-build-your-own-coding-agent`   | `python`                             | 45            | 5          | 1             | 51    |
| `capstone-data-pipeline`                 | `python` plus service `postgres`     | 45            | 5          | 1             | 51    |
| `capstone-concurrency-and-systems`       | `go`                                 | 45            | 5          | 1             | 51    |
| `capstone-concurrency-showdown`          | `go` and `elixir`                    | 46            | 5          | 1 (Go)        | 52    |
| `capstone-lead-at-altitude`              | none                                 | 0             | 0          | 0             | 0     |
| `capstone-secure-service`                | `python`                             | 45            | 5          | 1             | 51    |
| `capstone-build-your-own-pentest-engine` | `typescript` (Node standard library) | 45            | 5          | 1             | 51    |
| `capstone-real-world-delivery`           | `python`, `kubeconform`, `opentofu`  | 45            | 5          | 1             | 51    |

The showdown holds one more example unit than its 45 worked examples: the Elixir half of the project is
the extra example unit `ex-46-capstone-elixir-batch` (see
[Two-Language Capstones](#two-language-capstones)). The total is 6 courses of 51 units plus the
showdown's 52, which is 358 units: 316 example units, 35 kata units, and 7 capstone units.

## Shape of a Capstone Unit

A capstone unit is one folder with one toolchain. Its `run.yaml` has **one run per milestone** plus a
`tests` run, so each acceptance criterion's proof run (see [002](./002-capstone-course-contract-and-modes.md#what-capstone-contract-d6-means))
is a named run the learner can execute alone.

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: stage-1-loop
    kind: example
    command: [python3, -m, scribe.stages.stage_1_loop]
    timeout: 60s
    expect:
      exit: 0
      stdout: expected/stage-1-loop.stdout.txt
  # … one run per milestone …
  - name: tests
    kind: test
    command: [python3, -m, unittest, discover, -s, tests]
    timeout: 120s
    expect:
      exit: 0
      stdout: ignore
```

- A stage run prints a short, fixed report whose last lines name each acceptance criterion it proves
  and `PASS` or `FAIL`; the expected-output file records the all-`PASS` report.
- A stage run exits non-zero when any criterion it covers fails. That is the invariant: the expected
  file holds the report, and the exit status is the verdict.
- The `tests` run is a `kind: test` run with `stdout: ignore`, because test runners print timings.
- `services` and `resources` are set per unit, only when needed (`postgres` for the data pipeline).
- Simulation stages set `simulation: true` and follow S1–S9 (seed count 64 for Go and Elixir, 32 for the
  Habit Hub controller).
- The lessons anchor a capstone excerpt with the range form
  (``**`learning/capstone/code/…#L10-L42`**``) and the capstone page anchors the stage reports.

## Determinism Rules Specific to These Courses

Plan 05's six rules for every example and the S1–S9 obligations apply. These additions apply to the
capstone families:

| Family            | Rule                                                                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python async      | `asyncio.run` with a fake clock passed in; no real `sleep`; `asyncio.gather` results sorted before printing; subprocess output stripped of timings                                                 |
| Agent traces      | Counter-based span and event identifiers; canonical JSON with sorted keys; no timestamps, absolute paths, or random identifiers in any output                                                      |
| Go concurrency    | Results sorted by job ID; virtual time through `testing/synctest` (generally available since Go 1.25, re-checked in Phase 0); `go test -race -count=1` in a `kind: test` run with `stdout: ignore` |
| Elixir            | Tests synchronise on messages, never on sleeps; Mix project uses only the standard library and OTP, so nothing is fetched                                                                          |
| TypeScript        | Node standard library only; `node --test` for the unit tests; no wall clock; sorted output                                                                                                         |
| SQL on Postgres   | Fixed fixtures loaded by the unit; every query that returns rows has an `ORDER BY`; no `now()` reaches output; a seeded generator, not `random()`                                                  |
| Static validators | Manifests and infrastructure code validate offline; providers are baked from the course's `.terraform.lock.hcl`; no step needs a registry or a cloud account                                       |

Hidden-randomness trap: a hash-map iteration order, an unseeded generator, and the process id are the
three that slip through. The double run catches most; the Content Quality Gate's code review looks for
the rest (plan 05 states the gates judge what the harness cannot).

## Run-Time Budget

The PR gate runs `ayokoding-www:examples:check` in `since` mode. Plan 05 gives it one shard when at
most 8 courses are selected and `timeout-minutes: 60`. This PR changes 7 code courses and 358 units,
and every run executes twice. That is the largest harness load of the whole series, so the plan treats
the budget as a measured quantity, not a hope.

**Planning figures** (for sizing only; Phase 0 replaces them with measurements):

| Course                                   | Planning minutes | What dominates                                               |
| ---------------------------------------- | ---------------- | ------------------------------------------------------------ |
| `capstone-build-your-own-coding-agent`   | 8                | Container start-up for 51 Python units, twice each           |
| `capstone-data-pipeline`                 | 10               | A PostgreSQL start and readiness wait per unit               |
| `capstone-concurrency-and-systems`       | 10               | Go compile time per unit, with `-race` in `tests`            |
| `capstone-concurrency-showdown`          | 12               | Go compile plus Mix compile and OTP start                    |
| `capstone-secure-service`                | 6                | Container start-up                                           |
| `capstone-build-your-own-pentest-engine` | 10               | TypeScript toolchain start-up and type checking              |
| `capstone-real-world-delivery`           | 12               | `tofu init`/`validate` and `kubeconform` on the static units |
| Sum                                      | 68               | More than one 60-minute shard can hold                       |

**Binding rule.** The projected CI time of the longest shard of the PR must be at most 45 minutes
(75% of the 60-minute timeout, leaving room for image pulls and a slow runner). With one shard that is
the sum of all courses. The per-course figures are planning aids; the binding number is the measured
sum, or the measured longest shard once rung 2 is applied.

**Phase 0 measurement.** On the merged harness, time the container-invocation cost per toolchain
(`python`, `go`, `elixir`, `typescript`, `kubeconform`, `opentofu`, and `postgres` start with its
readiness wait) with the CLI's own smoke fixtures, record seconds per invocation, and compute
`sum over units of (runs × 2 × seconds per invocation) + environment builds`. Record the projection in the
evidence. After the first wave, replace the projection with the measured `examples check` time of each
finished course.

**Response ladder.** Apply the first rung that brings the projection to 45 minutes or less, in order;
write the rung taken in the ledger.

1. **Author for speed.** Keep one run per example unit (`main` only; no extra `tests` runs), keep
   every example's program short, and keep each example to one source file so a compiled toolchain
   builds as little as possible. A unit is never merged with another to save time: one unit per
   example is plan 05's contract.
2. **Count units, not courses, when choosing the shard count (a harness fix).** Plan 05's
   `examples-plan` job emits one shard when at most 8 courses are selected and four otherwise, and
   `--shard K/N` splits the selected courses by slug. Eight large courses can pass the course test and
   still exceed one runner's time. Change the rule so that it counts selected **units**: `[1]` when at
   most 120 units are selected, otherwise `[1,2,3,4]`. Phase 1 reads the merged code to find where the
   count is made. If the CLI's `examples affected --output json` already reports units, only the
   workflow step changes; if not, the CLI gains a `units` field and the workflow reads it. This is plan
   05's migration step M11 (a harness defect that blocks the plan). A regression test comes first (RED:
   358 units over 7 courses still returns one shard; GREEN: it returns four), then the change, in this
   PR. Runner minutes stay the same; wall-clock time falls. With plan 05's split by slug, the seven
   code courses fall into four shards of 18, 22, 16, and 12 planning minutes (coding agent with data
   pipeline; pentest engine with real-world delivery; concurrency-and-systems with secure service; the
   showdown alone), so the largest shard is well under 45. Phase 0 recomputes this from the merged
   split rule and the measured figures.
3. **Raise the `since` timeout.** If a single course's shard still exceeds 45 minutes, raise
   `timeout-minutes` for `selection: since` from 60 to 120 in the reusable workflow. Record the reason
   in the workflow comment.
4. **Stop and report.** If the projection is still over after rung 3, mark the heaviest course
   BLOCKED with the cause "does not fit the CI budget" and report to the user. A course is never
   weakened (fewer examples, merged units, a skipped run) to fit.

The expected path is rung 2: 358 units with a 120-unit threshold gives four shards. It is planned as a
conditional packet in [../delivery.md](../delivery.md), triggered by the Phase 0 projection.

## Cross-Course Figures

`capstone-lead-at-altitude` uses the Relay service from `capstone-concurrency-and-systems` as a case
study, so some numbers appear in both. The concurrency course produces them; the lead course copies
them. The rule is **copy from the source, then search**:

| Figure                                                                           | Source (in `capstone-concurrency-and-systems`)                         | Where the lead course uses it                  |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| Availability SLO 99.9% over 30 days                                              | `learning/code/ex-42-error-budget-arithmetic/expected/main.stdout.txt` | Case-study data, theme A, the policy scenarios |
| Error budget 43.2 minutes                                                        | Same file                                                              | Theme A and theme C                            |
| Burn-rate rows 14.4 over 1 hour (2%), 6 over 6 hours (5%), 1 over 3 days (10%)   | `learning/code/ex-43-burn-rate-table/expected/main.stdout.txt`         | Theme A, the alert and on-call scenarios       |
| Window pairs 1 hour with 5 minutes, 6 hours with 30 minutes, 3 days with 6 hours | The same file and the course's accuracy notes                          | Theme A                                        |
| Simulated outage summary (`seeds: 64 passed, 0 failed (of 64)`)                  | `learning/code/ex-45-simulated-outage-pages/expected/main.stdout.txt`  | Mentioned once, as the evidence the page fires |

The figure "31 of 43.2 minutes spent in two incidents" is constructed inside the lead course and has
no source elsewhere; it must satisfy `31 < 43.2` and is labelled as constructed.

**Phase gate for the lead course.** Before the lead course's Content Quality Gate runs, the executor
searches the lead course for each figure above and for each, finds the same text in the source file, with
a fixed-string search (`rtk git grep -F`). A figure that appears in the lead course and not in the
source file is a finding; a source figure the lead course changed is a finding. The concurrency
course is finished first (wave 1 before wave 2, see [003](./003-prerequisites-readiness-and-ordering.md#waves))
for exactly this reason.

## Two-Language Capstones

Plan 05's contract gives a unit one toolchain, and a capstone is one unit. Two capstones need more:

### `capstone-concurrency-showdown` (Go and Elixir)

- **Capstone unit** (`learning/capstone/code/`): toolchain `go`. It holds the Go reference "Batch", the
  shared `vectors.json`, `comparison.md`, and a checker that confirms `comparison.md` cites real run
  outputs. Runs: `stage-1-go-batch`, `stage-3-contract`, `stage-4-failures`, `stage-5-comparison-check`,
  `tests`.
- **Elixir half**: a **secondary example unit**, `learning/code/ex-46-capstone-elixir-batch/`, toolchain
  `elixir`, a Mix project with runs `contract`, `failures`, `tests`. It carries the same `vectors.json`
  bytes.
- **Link between the halves**: both assert the SHA-256 of `vectors.json` (written into each unit's
  expected output), and the executor runs `diff` on the two copies at execution time and records the
  result. The capstone page anchors to both units.
- **Why not a second capstone unit**: the contract names `learning/capstone/code/` once and allows
  one toolchain per unit. A second capstone folder would be a layout finding.

### `capstone-real-world-delivery` (Python with offline validators)

- **Capstone unit**: toolchain `python`. It holds the Habit Hub reference, the simulation, the manifests,
  the infrastructure code, the workflow, the threat register, and the ship check. Its `stage-4-delivery`
  run checks the manifests and infrastructure code **structurally in Python** (hardening properties,
  pinned versions, no secrets).
- **Validator units**: examples ex-29, ex-30, ex-32 are `mode: static` units with `kubeconform` (reason
  `cluster`) and `opentofu` (reason `cloud`). Each holds an **identical copy** of the manifest or
  infrastructure file the capstone unit holds.
- **Link**: the executor runs `diff` between each copy and the capstone's own file at execution time and
  records the result in the ledger; a content-shape check also compares the files byte for byte so a
  later edit to one copy fails the unit tests.
- **Illustrations**: the container recipe (ex-28) and the CI workflow (ex-34) are
  `<!-- harness: illustration -->` blocks with Python structural tests; each has a sentence saying why
  it is not run.

### Possible plan-05 gap

Both workarounds exist because a capstone unit holds one toolchain. If plan 05 as merged allows a unit to
declare a validator beside its language, the executor uses that and removes the copies; Phase 0 reads the
merged `run.yaml` field guide to find out. If not, the copies stay, and the report to the user names this
as a gap for plan 05's maintainers (a follow-up, not a blocker).

## Safety Checks for Security Courses

`capstone-secure-service`, `capstone-build-your-own-pentest-engine`, and `capstone-real-world-delivery`
each carry a `## Safety boundary` section (full text in the course briefs). The boundary is a contract
with the reader and the repository: these courses teach defence and auditable assessment without
operational attack material. Three checks enforce it, in this order:

1. **Author check (the maker).** Before submitting, the maker reads the course's safety boundary and
   runs the search in step 2 on its own folder.
2. **Search check (the executor, deterministic).** Before the Content Quality Gate, run these searches
   over the course folder and read every hit:
   - sockets and name resolution: `socket`, `connect(`, `http.client`, `urllib`, `requests`, `fetch(`,
     `net.`, `dns`, `getaddrinfo`, `subprocess` with a shell, `curl`, `nmap`;
   - payload and credential material: `password` lists, wordlist files, `' OR`, `UNION SELECT`, `<script`,
     `../../`, encoded shell payloads, `.env` files other than the planted fake secret;
   - real addresses: every IPv4 address in the course is inside `192.0.2.0/24`, `198.51.100.0/24`, or
     `203.0.113.0/24` (RFC 5737), `127.0.0.1`, or a private range used as data;
   - the scope guard (pentest engine): the target list is a constant in code, and no function takes a
     target from a model response or fixture text.

   Each hit is either removed or recorded in the ledger with a one-line reason why it is harmless (for
   example, an apostrophe used as a harmless test string against the in-process service). An unexplained hit is a
   finding.

3. **Gate check (the Content Quality Gate).** The checker is told to read the safety boundary and judge
   every page and code file against it; any operational detail is a CRITICAL finding. A security course
   cannot end `PASS` or `PASS_WITH_FINDINGS` with an open safety finding.

The harness backs this up: it runs every unit with networking off, so a stray network call fails the
unit instead of reaching a host.

## Illustration Policy

`<!-- harness: illustration -->` is for code that is not meant to run as shown. In this plan that means
the container recipe, a CI workflow, a Prometheus rule, a `signal.Notify` call, and optional
local-cluster commands, each followed by a sentence saying why it is not run. A maker never marks a
runnable block as an illustration to pass sync (plan 05's step M11); the gates judge the count (the
coverage report counts illustrations per course).

## References

- Plan 05's `run.yaml` contract, runner catalog, determinism and CI designs (merged before this plan).
- Google SRE Workbook, "Alerting on SLOs": `https://sre.google/workbook/alerting-on-slos/`, read
  2026-10-09, for the burn-rate table.
- RFC 5737 (IPv4 address blocks reserved for documentation): `https://www.rfc-editor.org/rfc/rfc5737`,
  read 2026-10-09.
- Go 1.25 release notes for `testing/synctest`: `https://go.dev/doc/go1.25`, cited in plan 05, re-checked
  in Phase 0.
