# Decision Records

Each record names:

- the selected option and two rejected alternatives;
- prior art and evidence;
- trade-offs and consequences;
- what would make us revisit it.

"Decision n" refers to the resolved series decisions in
[brd.md](../brd.md#resolved-series-decisions-this-plan-relies-on).

- **D1 and D2** restate user decisions so their alternatives are on record.
- **D12** is an interpretation of decision 32, flagged for the user's attention in the plan's
  hand-off.
- Every other record is a technical choice derived from evidence.

## D1 — Go and Cobra in `apps/ayokoding-cli` (decision 37, user)

- **Selected:** a Go 1.26.1 module using cobra v1.10.2, revived at `apps/ayokoding-cli`.
- **Alternative 1 — TypeScript scripts inside `apps/ayokoding-www`.** Rejected by the user: tooling
  belongs in `apps/ayokoding-cli`, never in ad-hoc scripts.
- **Alternative 2 — Python, like ferret-cli.** Rejected by the user ("golang + cobra").
- **Prior art:** HIPPO (Go, Cobra) and roots-be (Go) in the same ecosystem.
- **Consequences:** a second Go module in the repository; the CI Go cache covers both.
- **Revisit when:** the user changes decision 37.

## D2 — HIPPO strictness with justified differences (decision 37, user)

- **Selected:** mirror HIPPO's `.golangci.yml`, tools, and test contract. The parity table in
  [002](./002-cli-project-and-hippo-parity.md#hippo-parity-table) has 33 rows: 24 parity, 5
  stricter, 4 different with reasons.
- **Alternative 1 — copy roots-be's `default: standard`.** Rejected: the user named HIPPO as the
  bar, and five linters are too weak.
- **Alternative 2 — mirror HIPPO byte for byte, including all adapters in `test:quick`.** Rejected:
  this repository forbids Integration and E2E runtime in hooks and the PR gate.
- **Consequences:** contributors face a strict linter on day one. The test pyramid splits across
  `test:quick` and scheduled targets.
- **Revisit when:** HIPPO changes its configuration. Phase 0 re-reads it.

## D3 — The Nx target is `ayokoding-www:examples:check`

- **Selected:** a `{domain}:{work}` validation target on `ayokoding-www`, not cached. It depends on
  `ayokoding-cli:build` through `dependsOn` only.
- **Alternative 1 — `ayokoding-www:test:examples`** (the brief's proposal). Rejected: `test:*` names
  are reserved for a project's own runtime test layers. Integration-like runtime under a `test:*`
  name in the PR gate would contradict the execution model.
- **Alternative 2 — `ayokoding-cli:examples:check`.** Rejected: a course change would not make the
  CLI affected, so pull requests would miss course changes unless an implicit dependency were added.
  That dependency would re-run the CLI's tests on every content change.
- **Evidence:** the `{domain}:{work}` rule allows the bare verb `check`; `nx affected` already marks
  `ayokoding-www` affected on content changes.
- **Consequences:** the target is added to the canonical governance target list. The PR gate gets a
  dedicated job.
- **Revisit when:** content moves out of `ayokoding-www`.

## D4 — Drive containers through the Docker command-line interface

- **Selected:** execute `docker` (or `AYOKODING_CONTAINER_CLI`) with argv built by a pure function.
- **Alternative 1 — the Docker Engine Go SDK.** Rejected: a large dependency tree that depguard
  would have to allow, and it ties the tool to the Docker daemon API.
- **Alternative 2 — testcontainers-go.** Rejected: built for tests, not product code, and it pulls a
  large dependency set into production.
- **Prior art:** HIPPO supervises child processes through `os/exec`; GitHub's runners ship the
  Docker CLI.
- **Trade-offs:** parsing CLI output is less typed than an API. The tool uses only stable flags and
  `--format` templates.
- **Consequences:** Podman works by setting the variable. Integration tests use a fake CLI.
- **Revisit when:** a required feature has no CLI flag.

## D5 — YAML through `go.yaml.in/yaml/v3` with strict decoding

- **Selected:** `go.yaml.in/yaml/v3` with `KnownFields(true)`, then a constructor that checks every
  rule.
- **Alternative 1 — a JSON run spec, which needs no dependency.** Rejected: decision 30 names
  `run.yaml`.
- **Alternative 2 — `gopkg.in/yaml.v3`.** Rejected: unmaintained upstream. The `go.yaml.in` fork is
  maintained by the YAML organization and already present (v3.0.4) in this repository's Go module
  graph.
- **Consequences:** one extra production dependency, allowed by depguard and recorded in the parity
  table (row 3).
- **Revisit when:** the fork stops releasing.

## D6 — Anchors reuse today's bold-path convention

- **Selected:** keep ``**`path`**`` and add the labelled-path form ``**Label** (`path`)``, with
  an optional line range.
- **Alternative 1 — HTML comment markers such as `<!-- harness: file path -->`.** Rejected: readers
  would lose the visible file name, and 3,568 anchors would need rewriting.
- **Alternative 2 — fence attributes such as ` ```python file=path `.** Rejected: rehype-pretty-code
  parses fence meta, which risks rendering side effects, and authors cannot see the attribute in
  rendered pages.
- **Evidence:** 3,568 existing anchors; katas already use the labelled form; HTML comments are
  invisible after rendering (about 2,316 already in courses).
- **Consequences:** migration is mostly fixing content, not syntax.
- **Revisit when:** the renderer changes how it treats bold code spans.

## D7 — Opt-in per course, then all-or-nothing

- **Selected:** a course opts in with its first `run.yaml`; from then on every unit and fence must
  pass.
- **Alternative 1 — opt-in per unit.** Rejected: a half-migrated course would look "green" while
  most of its code is unchecked, which contradicts decision 27's "every code example".
- **Alternative 2 — mandatory for every course at merge.** Rejected: 0 courses comply today, so the
  gate would fail every PR until plans 06–13 finish (scope item 6 requires inert behaviour).
- **Consequences:** each content plan migrates whole courses. Plan 14 measures 100%.
- **Revisit when:** a course is too large to migrate in one plan.

## D8 — Katas and capstones are units

- **Selected:** units are examples, katas, and the capstone code root.
- **Alternative 1 — examples only, the literal wording of decision 30.** Rejected: decision 26 ("all
  the code is solid") and decision 27 ("every code example") cover drilling and capstone code too.
  Together they hold 84 + 31 code dirs.
- **Alternative 2 — every file is a unit.** Rejected: capstones and multi-file examples run as
  projects, not files.
- **Consequences:** more `run.yaml` files for content plans.
- **Revisit when:** a course kind appears that has neither shape.

## D9 — Dependencies are installed at image build time, never at run time

- **Selected:** an environment image per `(toolchain, lockfile)`, built with network access from a
  hash-locked lockfile inside the course. Runs use `--network none`.
- **Alternative 1 — vendor dependencies into the repository.** Rejected: thousands of third-party
  files in content trees, and licence review for each.
- **Alternative 2 — allow network at run time.** Rejected: decision 31 forbids real network.
- **Prior art:** reproducible-build practice of separating fetch from build (for example
  `cargo fetch --locked` followed by `--offline`).
- **Consequences:** the first run of a course builds an image; later runs reuse it through the
  content hash.
- **Revisit when:** a toolchain cannot install offline-runnable dependencies.

## D10 — Determinism enforced by isolation and a double run

- **Selected:** no network, a cleared and pinned environment, resource limits, and two executions
  under different CPU quotas compared byte for byte.
- **Alternative 1 — a single run.** Rejected: scheduling-dependent output would pass once and fail
  later, which is a flaky test by the repository's definition.
- **Alternative 2 — libfaketime and a seeded scheduler injected into every runtime.** Rejected: it
  does not reach statically linked runtimes such as Go, and each language would need its own hook.
- **Trade-offs:** doubles run time. A full run stays monthly and sharded.
- **Consequences:** the remaining clock rule is judged by the content gates, and the gate text says
  so.
- **Revisit when:** full-run shards exceed 300 minutes.

## D11 — The simulation convention is course code with a fixed output contract

- **Selected:** a single-threaded event loop, virtual clock, and one seeded generator in the course
  code. A fixed seed set of at least 32. Output lines `failing seed: n (invariant)` and
  `seeds: p passed, f failed (of t)`. Replay through `AYOKODING_SEED`.
- **Alternative 1 — a simulation library shipped by `ayokoding-cli`.** Rejected by decision 37:
  teaching helpers stay in course content, where the reader can read them.
- **Alternative 2 — the harness loops over seeds and calls the program once per seed.** Rejected: it
  multiplies container starts by 32 or more, and it hides the seed loop, which is part of what the
  course teaches.
- **Prior art:** FoundationDB simulation, TigerBeetle VOPR (seed plus commit replays a run), the sled
  simulation guide, turmoil ([006](./006-determinism-and-simulation.md#prior-art)).
- **Consequences:** the harness checks only the summary line, not the protocol.
- **Revisit when:** a course needs a property-testing framework whose output cannot follow S7.

## D12 — Static mode also covers Windows (interpretation of decision 32)

- **Selected:** the closed reason list is `cloud`, `cluster`, `ios`, `android`, `windows`.
  `windows` covers Win32 C, Windows-only PowerShell, and WPF/WinUI code.
- **Alternative 1 — Windows runners in CI that run the code for real.** Rejected: GitHub's Windows
  runners cannot run this harness's Linux containers, and their minutes cost double.
- **Alternative 2 — leave Windows code unproven.** Rejected: decision 26 requires solid code.
- **Reasoning:** decision 32's rule is "anything that runs in a container runs for real". Windows
  code cannot run in a Linux container, for the same reason as iOS code.
- **Consequences:** `windows-os` and `windows-app-development` become static. No macOS course exists,
  so no `macos` reason is added.
- **Revisit when:** the user decides otherwise, or the harness gains a Windows runner.

## D13 — Derived images are built locally, not published

- **Selected:** derived images build from embedded Dockerfiles with checksum-pinned downloads,
  tagged by content hash and cached with buildx.
- **Alternative 1 — publish them to GHCR through `publish-images.yml`.** Rejected: it needs a
  registry write token in a content workflow and adds a release process for images.
- **Alternative 2 — only official images.** Rejected: Kotlin, Lua, LuaJIT, Neovim, and the
  validators have no official image.
- **Trade-offs:** the first build on a cold cache is slower.
- **Revisit when:** derived builds exceed 15 minutes per shard on a warm cache.

## D14 — Neo4j 2026.09.0 instead of the 5.26 LTS line

- **Selected:** `neo4j:2026.09.0` Community.
- **Alternative 1 — `neo4j:5.26` LTS.** Rejected: `graph-databases` teaches Cypher 25, which the
  5.x line lacks.
- **Alternative 2 — both images.** Rejected: one course does not need two engines. A course that
  contrasts Cypher 5 can select the Cypher version per query on the 2026 line.
- **Evidence:** the course text mentions Cypher 25 eight times and Neo4j 2026.02. Docker Hub tags
  were read on 2026-10-09.
- **Revisit when:** the course drops Cypher 25.

## D15 — The CLI uses Go 1.26; courses use Go 1.27

- **Selected:** the module declares `go 1.26.1`, as HIPPO does. The course image is `golang:1.27`.
- **Alternative 1 — Go 1.27 for the CLI.** Rejected: CI installs Go from roots-be's `go 1.26`, and
  the tool's Go version is independent of the version courses teach.
- **Alternative 2 — Go 1.26 for courses.** Rejected: courses teach the current stable release.
- **Revisit when:** roots-be moves to 1.27.

## D16 — CI topology: PR job, reusable workflow, monthly caller, shards

- **Selected:** a job in `pr-quality-gate.yml` that calls `_reusable-ayokoding-www-examples-check.yml`;
  a monthly caller; four shards for full runs; full mode when `toolchains/**` changes.
- **Alternative 1 — a separate PR workflow.** Rejected: the `Quality gate` aggregator is the merge
  precondition, so a separate workflow would not block merges.
- **Alternative 2 — one unsharded full run.** Rejected: about 6,000 units run twice could exceed the
  6-hour job limit.
- **Evidence:** a GitHub schedule runs only on the default branch; minute 17 avoids top-of-hour load
  (GitHub docs read 2026-10-09).
- **Revisit when:** the runner pool changes, or shards exceed 300 minutes.

## D17 — The coverage report is computed, never committed

- **Selected:** `examples coverage` computes unit and fence coverage from the working tree. CI writes
  it to the job summary.
- **Alternative 1 — commit a coverage file.** Rejected: it would drift and conflict between
  parallel content plans.
- **Alternative 2 — runtime coverage from the last full run.** Rejected: that needs stored state
  between workflow runs.
- **Consequences:** plan 14 combines `coverage --min-percent 100` with a green full run on the same
  commit.
- **Revisit when:** plan 14 needs history.

## D18 — Decline plan 02's `paths core` subcommand

- **Selected:** no `paths` subcommand.
- **Alternative 1 — port `computeCore` to Go.** Rejected: two implementations of one rule would
  drift, and the TypeScript test already prints the expected core.
- **Alternative 2 — call the TypeScript core from Go.** Rejected: Node becomes a runtime dependency
  of the CLI.
- **Revisit when:** maintainers need path recomputation outside the app's test run.

## D19 — Integration and E2E adapters run outside `test:quick`

- **Selected:** `test:integration` and `test:e2e`, run twice daily and on demand.
- **Alternative 1 — HIPPO's quick contract with all three adapters.** Rejected: repository rule.
- **Alternative 2 — no E2E adapter.** Rejected: the user asked for E2E against the stamped binary.
- **Revisit when:** the execution model changes.

## D20 — OpenTofu validates cloud code

- **Selected:** `tofu init -backend=false` with providers from the course lockfile, then
  `tofu validate`.
- **Alternative 1 — Terraform.** Rejected: its BUSL licence is not open source, while OpenTofu
  (MPL-2.0) accepts the same configuration language for validation. The repository's commit hook
  already formats `.tf` files with `tofu fmt`.
- **Alternative 2 — `tflint` only.** Rejected: it checks style and rules, not provider schemas.
- **Revisit when:** a course uses a Terraform-only feature that `tofu validate` rejects.

## D21 — Formatter symmetry: files are formatted, lesson fences are not

- **Selected:**
  - code files under course code dirs keep their repository formatters (the commit hook runs ruff,
    gofmt, rustfmt, csharpier, shfmt, `tofu fmt`, stylua, clang-format, and Prettier);
  - `scripts/format-staged` runs Prettier on Markdown under `apps/ayokoding-www/content/` with
    `--embedded-language-formatting=off`, so lesson fence bodies are never rewritten;
  - `examples sync --write` copies file bytes into fences.
- **Alternative 1 — exclude course code from all formatters.** Rejected: it gives up the
  repository's formatting standard on about 9,500 files.
- **Alternative 2 — leave it as it is.** Rejected: Prettier formats SQL, TypeScript, JSON, and YAML
  fences in Markdown while it skips `.sql` files (the existing `.prettierignore` entry for sqlite
  REPL scripts). The two sides then diverge for reasons the author cannot see.
- **Evidence:** `scripts/format-staged` sends `*.md` and code files to Prettier and native
  formatters. `.prettierignore` excludes `apps/ayokoding-www/content/**/code/**/*.sql`. A Prettier
  `overrides` entry would not work, because `format-staged` copies the configuration to a temporary
  folder and relative override globs stop matching.
- **Consequences:** a small change in `scripts/format-staged` with a test in
  `scripts/format-staged.test.mjs`. Authors run `sync --write` after formatting.
- **Revisit when:** Prettier gains a per-path embedded-format setting that survives the snapshot
  configuration.
