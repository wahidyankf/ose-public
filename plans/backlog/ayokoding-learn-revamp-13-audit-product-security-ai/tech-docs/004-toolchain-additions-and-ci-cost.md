# 004 — Toolchain Additions and CI Cost

This plan puts 2,831 units into the harness, and every unit runs twice. After plans 11 and 12 it is the third
large harness load in a row, and the harness has one hard limit that plan 05 set for pull requests: the check must
finish inside a runner timeout. This page treats that limit as a measured quantity. It says which toolchains the
courses could use but the catalog lacks (after plans 09 to 12), how each would be added, why the plan adds none by
default, what a full examples run then costs, and what happens to CI shards. All CI figures here are **planning
figures** with invented per-invocation seconds, used only to size the work; Phase 1 replaces them with measurements,
and every decision below is re-taken on the measured numbers (decision D17).

## What the Catalog Gives

Toolchain ids and pins as plan 05's catalog reads on 2026-10-09; Phase 0 re-reads the merged catalog, which plans 06
to 12 extend, and records any change that touches an id this plan uses. This plan adds none of its own by default.

| Catalog id       | Pin (2026-10-09)                                                                        | Used here for                                                              |
| ---------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `python`         | 3.14.8                                                                                  | Most courses; hash-locked packages for FastAPI, numeric, and crypto stacks |
| `typescript`     | 7.0.2 (derived from `node` 24.21.0)                                                     | DOM, frontend, and web-framework units under a locked jsdom stack          |
| `shell`          | Debian trixie snapshot (`bash`, `coreutils`, `git`, `jq`, `sqlite3`)                    | Command-line units                                                         |
| `kotlin`         | 2.4.21 (derived from `java`)                                                            | `android-app-development` logic units                                      |
| `ktlint`         | pinned in plan 05 Phase 3 (validator, static reason `android`)                          | `android-app-development` Compose and androidx files                       |
| `swift`          | 6.4.0                                                                                   | `ios-app-development` Foundation and logic units                           |
| `swift-parse`    | 6.4.0 (`swiftc -parse`, static reason `ios`)                                            | `ios-app-development` UI files                                             |
| `dart`           | 3.13.5                                                                                  | `hybrid-app-development` logic units                                       |
| `flutter`        | 3.41.5 (the repository `.fvmrc` pin)                                                    | `hybrid-app-development` widget tests                                      |
| `dotnet`         | SDK 10.0.401 (C# 14)                                                                    | `windows-app-development` logic units                                      |
| `windows-static` | Debian trixie snapshot (mingw-w64 `-fsyntax-only`, PowerShell parser; reason `windows`) | `windows-app-development` project and XAML units                           |

How many of the 45 courses use each id (the id comes from the course's toolchain text in its brief):

| Catalog id       | Courses | Units in those courses (upper bound; mixed courses count in full) | Which                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | ------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `python`         | 30      | 2,216                                                             | `api-design`, `async-python-and-fastapi-services`, `backend-at-scale`, `backend-essentials`, `build-your-own-web-framework`, `capstone-first-working-software`, `capstone-full-stack-app`, `information-architecture-and-seo`, `linux-app-development`, `agent-context-and-memory`, `agent-orchestration-subagents-and-observability`, `agent-permissions-and-sandboxing`, `agent-tools-and-mcp`, `agentic-ai`, `agentic-coding`, `creating-ai-powered-apps`, `evaluating-ai-output-essentials`, `evaluating-ai-systems-in-depth`, `fine-tuning-and-adaptation`, `inference-serving-and-model-deployment`, `statistics-for-evaluation`, `the-agent-loop`, `analytics-and-experimentation`, `capstone-interview-loop`, `coding-interview`, `take-home-and-live-coding`, `detection-engineering-and-siem-operations`, `it-and-application-security`, `offensive-security`, `security-essentials` |
| `typescript`     | 5       | 351                                                               | `advanced-frontend`, `build-your-own-reactive-ui`, `capstone-full-stack-app`, `frontend-essentials`, `agentic-coding`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `shell`          | 6       | 467                                                               | `linux-app-development`, `agentic-coding`, `take-home-and-live-coding`, `detection-engineering-and-siem-operations`, `offensive-security`, `security-essentials`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `kotlin`         | 1       | 87                                                                | `android-app-development`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `ktlint`         | 1       | 87                                                                | `android-app-development`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `swift`          | 1       | 87                                                                | `ios-app-development`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `swift-parse`    | 1       | 87                                                                | `ios-app-development`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `dart`           | 1       | 87                                                                | `hybrid-app-development`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `flutter`        | 1       | 87                                                                | `hybrid-app-development`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `dotnet`         | 1       | 87                                                                | `windows-app-development`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `windows-static` | 1       | 87                                                                | `windows-app-development`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

Two catalog facts matter beyond the table. First, a course's locked dependencies are **not** a catalog change: the
harness builds one environment image per distinct `(toolchain, lockfile)` pair from a file inside the course, so
FastAPI, numeric, crypto, jsdom, and type-checker stacks add images but touch nothing under `toolchains/`. Second, the
FastAPI-based courses can share one lock content (spike SP4), so one image serves them.

## Entries Other Plans Add

Plans 09 to 12 are merged before this plan starts (series decision 42), so their full-run effect on CI is over. None of
their additions is used by these 45 courses. The facts are read from the plans' own documents on 2026-10-10; Phase 0
reads the merged entries.

| Plan | Change to the catalog or selection                                                                                                                                                                                                | What it means here                                                                                                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 09   | A `clojure` entry; a hash-locked jar recipe on `java`                                                                                                                                                                             | None of the 45 courses teaches Clojure or runs Java. `kotlin` derives from `java`, and `android-app-development` uses `kotlin`, so Phase 0 builds `java` and `kotlin` once and runs the smoke fixture for each |
| 10   | Catalog additions for its new courses (for example WebAssembly)                                                                                                                                                                   | Not used here                                                                                                                                                                                                  |
| 11   | Rungs 2b (shard count scales with units, up to 8), 2c (weighted split), and 3 (`since` timeout 120) of the response ladder, if Phase 1 of plan 11 took them                                                                       | This plan reuses what is merged and does not repeat it                                                                                                                                                         |
| 12   | Service and derived ids for its database courses (such as `valkey`, `mongodb`, `cassandra`, `dynamodb-local`, `timescaledb`, `gremlin`, and `neo4j-gds`), toolchain-aware selection (rung 2t), and a heavy-course split (rung 2d) | Not used here. If rung 2t is merged, a catalog change selects only the courses that declare the changed id, which changes how budget condition 3 below is judged                                               |

**This plan's own additions: none by default.** The four candidates below are the only ones considered. Each is default
NO-GO under the budget rule and appears here so that a measured GO changes the packets at once. If a candidate becomes
GO, the change is listed in the ledger, lands in the single early commit the rule requires, and the file-impact table
is updated.

## Which Toolchains Are Missing

No course of this plan needs a toolchain the catalog lacks in order to meet the definition of done: each course has an
honest fallback in the last column. Four additions would turn modelled or static units into real ones.

| Candidate                          | Course                                                                                 | Units it would unlock                                                   | Spike | Fallback if not added (default)                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| C1 `chromium` (headless browser)   | `frontend-essentials`                                                                  | about 14 layout examples (box model, flex, grid, breakpoints, contrast) | SP2   | Node models of the CSS algorithm, labelled as models; the Playwright launch lines are illustrations (decision D5)  |
| C2 `pyright` (Python type checker) | `api-design`, `backend-at-scale`, `backend-essentials`, `build-your-own-web-framework` | `kind: check` runs of the type checker in about 20 units                | SP9   | A wheel-bundled `mypy` in the unit's hash-locked lock (no catalog change), or the check line as an illustration    |
| C3 headless GUI toolkit            | `linux-app-development`                                                                | 4 units                                                                 | SP13  | Python models of the event loop; the toolkit lines are illustrations                                               |
| C4 Android Gradle and SDK          | `android-app-development`                                                              | Compose and androidx units (about 60)                                   | SP7   | `ktlint` static units (reason `android`) plus `kotlin` logic units; a stronger Android validator stays a known gap |

Gaps the plan accepts without a candidate: Clang (no course here needs it), Groovy and Gremlin validators (plan 12's),
a stronger Android validator (the same row as C4), and WinUI 3 compilation, which needs Windows.

**How each candidate would be added.** Plan 05's "Adding a Toolchain" procedure has three steps, and any GO follows it:

1. **A catalog entry and its files.** A derived `Dockerfile` under `apps/ayokoding-cli/toolchains/<id>/` whose downloads
   are checked with `sha256sum -c`, Debian packages from a fixed `snapshot.debian.org` date, and a catalog line with the
   id, kind, pin, and install argv. For C1 this is a pinned Chromium build plus one bundled font, so layout is
   byte-identical; for C2 no entry is needed (a wheel in the course lock); for C3 a GUI toolkit with a virtual
   framebuffer; for C4 the Android SDK command-line tools, Gradle, and a pinned platform.
2. **A fixture unit and a smoke row.** The CLI's own fixture course gets one unit for the id, and the smoke table gets a
   row, so `toolchains build <id>` and the double run are tested without a real course.
3. **`ayokoding-cli toolchains build <id>`.** Run once per id in Phase 1 and recorded with the build time and image size.

**What each would cost, and why only C2 is free.**

- **C1 `chromium`.** A large image (several hundred megabytes), a start-up of about two to four seconds per page, and
  one more image build in each shard that runs `frontend-essentials`. Its 77 `verify.mjs` scripts would each be a unit;
  about 14 of them (the layout examples) are the ones a model teaches worse. A browser start-up is slower than the 4 s
  planning figure, so the course's 13.2 planning minutes would grow by an amount Phase 1 measures. The cost that
  matters most is not the minutes: it is the selection effect below.
- **C2 type checker.** No catalog change. One environment image for the lock content that adds the checker, shared by
  the four courses, built once per shard that runs them. Free under the budget rule because it is a course file.
- **C3 headless GUI.** Would serve four units, below the value floor of 10. NO-GO.
- **C4 Android Gradle and SDK.** The SDK download and platform licences need the network at build time, so it fails the
  first condition of the rule (works with the network off). NO-GO, and the `ktlint` static units are the honest
  fallback.

**What a full examples run costs.** The monthly and FULL runs cover every opted-in course in the repository. At
planning figures the courses of plans 06 to 12 project about 1,315 planning minutes (plan 11's text gives about 850 at
its end; plan 12's draft adds about 465 for its 34 courses; Phase 0 recomputes both from the merged units), and this
plan's 45 courses add 326.0, so the full run at the end state is about 1,640 planning minutes. Eight shards leave
a longest shard of at least 205 minutes, above the 90-minute limit of a 120-minute timeout, and close to the 225-minute
limit of the monthly 300-minute timeout. A full run therefore fits only the monthly job, and only with eight shards
and a weighted split.

## Why an Addition Is Expensive

- **Any change under `apps/ayokoding-cli/toolchains/` puts the PR's examples check in FULL mode** (plan 05), unless
  plan 12's toolchain-aware selection (rung 2t) is merged: with it, the change selects only the courses that declare
  the changed id. Phase 0 reads the merged selection code to learn which case applies.
- **FULL mode in a pull request still runs as `selection: since`.** The reusable workflow gives `since` a 60-minute
  timeout (rung 3 raises it to 120 if a plan before this one took it). Only the monthly run has the 300-minute `all`
  timeout.
- **It lasts for the whole PR.** The base is `origin/main`, so every push after the toolchain commit, up to the merge,
  runs the full check. This plan pushes five times.

If rung 2t is absent, a FULL-mode pull request of this size cannot fit whatever the shard count is, so no candidate can
satisfy condition 3 and all four stay NO-GO. If rung 2t is present, an addition that no opted-in course declares yet
selects nothing extra, and condition 3 is judged on the PR's own projection below.

## The Toolchain Budget Rule

A toolchain is added only if **all four** hold (decision D9):

1. **Technical proof.** Its spike passes: the tool installs from a SHA256-checked download, works with the network off,
   and gives byte-identical output on the double run at both CPU quotas.
2. **Honest value.** It unlocks at least 10 units that a model would teach worse, and the brief says why.
3. **Budget.** Phase 1's projection of the PR's check (the full run if rung 2t is absent, the selected courses if it is
   present), using the merged units and the measured seconds, divided over the shard count the ladder allows, has a
   longest shard at or below 75 percent of the timeout that will apply.
4. **One commit.** All additions land together in a single early commit, so the PR's check changes from one known point,
   and the ledger records the commit and the measured effect.

The default is **NO-GO**: when any item is unmeasured, the answer is no. The briefs list each candidate with its
fallback, and the fallback is the plan of record. If a measurement turns a candidate to GO, the maker's packet for that
course changes at once, and the ledger records it.

## The CI Budget

**What the check does today.** Plan 05's `examples-plan` job runs `ayokoding-cli examples affected` and emits the shard
list; the reusable workflow runs each shard with `--shard K/N`, which splits the selected courses by sorted slug (shard
K keeps every N-th course starting at K). Plans 08, 11, and 12 may have changed the rule to count units, to scale
the shard count up to 8, to split by weight, and to raise the `since` timeout to 120; Phase 0 reads the merged workflow
and CLI to see what is actually in place and what each shard's limit is.

**The binding rule** (plans 08 and 11): the projected time of the longest shard of the PR must be at most 75 percent of
the timeout that applies, which leaves room for image pulls and a slow runner. That is 45 minutes under a 60-minute
timeout and 90 under 120.

**Planning figures per course.** A run costs one container invocation per execution, and every run executes twice. A
course's minutes are seconds per invocation x 2 x the number of runs (examples + 2 x katas + 3 per capstone). The
seconds are invented per-toolchain constants (a Python container start about 2 s, a Kotlin or Swift invocation 6 to 8 s,
Flutter 8 s, .NET 12 to 13 s); Phase 1 measures them. Environment builds for hash-locked wheels and packages are not in
these figures; Phase 1 measures them too. The eight no-code courses cost nothing.

| Course                                                                                                                      | Toolchains                                                                               | Planning seconds per invocation | Runs (examples + 2 x katas + capstone) | Runs total | Executions | Planning minutes |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------- | ---------- | ---------- | ---------------- |
| [`advanced-frontend`](../syllabus/courses/advanced-frontend.md)                                                             | typescript (jsdom, vitest, testing-library from a hash-locked `package-lock.json`)       | 4.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 13.2             |
| [`android-app-development`](../syllabus/courses/android-app-development.md)                                                 | kotlin; ktlint (static, reason android)                                                  | 6.4                             | 78 + 2 x 8 + 3                         | 97         | 2          | 20.7             |
| [`api-design`](../syllabus/courses/api-design.md)                                                                           | python                                                                                   | 2.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 6.6              |
| [`async-python-and-fastapi-services`](../syllabus/courses/async-python-and-fastapi-services.md)                             | python (fastapi, pydantic, httpx, aiosqlite, pytest-asyncio from a hash-locked lockfile) | 3.0                             | 78 + 2 x 8 + 3                         | 97         | 2          | 9.7              |
| [`backend-at-scale`](../syllabus/courses/backend-at-scale.md)                                                               | python                                                                                   | 2.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 6.6              |
| [`backend-essentials`](../syllabus/courses/backend-essentials.md)                                                           | python (fastapi, flask, pydantic, starlette, pytest from a hash-locked lockfile)         | 3.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 9.9              |
| [`build-your-own-reactive-ui`](../syllabus/courses/build-your-own-reactive-ui.md)                                           | typescript                                                                               | 3.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 9.9              |
| [`build-your-own-web-framework`](../syllabus/courses/build-your-own-web-framework.md)                                       | python                                                                                   | 2.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 6.6              |
| [`capstone-first-working-software`](../syllabus/courses/capstone-first-working-software.md)                                 | python (fastapi, pydantic, hypothesis, argon2-cffi, pytest from a hash-locked lockfile)  | 4.0                             | 45 + 2 x 5 + 3                         | 58         | 2          | 7.7              |
| [`capstone-full-stack-app`](../syllabus/courses/capstone-full-stack-app.md)                                                 | python (fastapi stack); typescript (jsdom, vitest, testing-library)                      | 4.0                             | 45 + 2 x 5 + 3                         | 58         | 2          | 7.7              |
| [`frontend-essentials`](../syllabus/courses/frontend-essentials.md)                                                         | typescript (jsdom from a hash-locked `package-lock.json`)                                | 4.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 13.2             |
| [`hybrid-app-development`](../syllabus/courses/hybrid-app-development.md)                                                   | dart; flutter (pubspec.lock)                                                             | 8.0                             | 78 + 2 x 8 + 3                         | 97         | 2          | 25.9             |
| [`information-architecture-and-seo`](../syllabus/courses/information-architecture-and-seo.md)                               | python                                                                                   | 2.0                             | 53 + 2 x 5 + 3                         | 66         | 2          | 4.4              |
| [`ios-app-development`](../syllabus/courses/ios-app-development.md)                                                         | swift; swift-parse (static, reason ios)                                                  | 4.5                             | 78 + 2 x 8 + 3                         | 97         | 2          | 14.6             |
| [`linux-app-development`](../syllabus/courses/linux-app-development.md)                                                     | python; shell                                                                            | 2.0                             | 78 + 2 x 8 + 3                         | 97         | 2          | 6.5              |
| [`windows-app-development`](../syllabus/courses/windows-app-development.md)                                                 | dotnet; windows-static (static, reason windows)                                          | 13.0                            | 78 + 2 x 8 + 3                         | 97         | 2          | 42.0             |
| [`agent-context-and-memory`](../syllabus/courses/agent-context-and-memory.md)                                               | python                                                                                   | 2.0                             | 48 + 2 x 5 + 3                         | 61         | 2          | 4.1              |
| [`agent-orchestration-subagents-and-observability`](../syllabus/courses/agent-orchestration-subagents-and-observability.md) | python                                                                                   | 2.0                             | 46 + 2 x 5 + 3                         | 59         | 2          | 3.9              |
| [`agent-permissions-and-sandboxing`](../syllabus/courses/agent-permissions-and-sandboxing.md)                               | python                                                                                   | 2.0                             | 75 + 2 x 8 + 3                         | 94         | 2          | 6.3              |
| [`agent-tools-and-mcp`](../syllabus/courses/agent-tools-and-mcp.md)                                                         | python                                                                                   | 2.0                             | 75 + 2 x 8 + 3                         | 94         | 2          | 6.3              |
| [`agentic-ai`](../syllabus/courses/agentic-ai.md)                                                                           | python                                                                                   | 2.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 6.6              |
| [`agentic-coding`](../syllabus/courses/agentic-coding.md)                                                                   | python; typescript; shell                                                                | 2.5                             | 27 + 2 x 5 + 3                         | 40         | 2          | 3.3              |
| [`creating-ai-powered-apps`](../syllabus/courses/creating-ai-powered-apps.md)                                               | python                                                                                   | 2.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 6.6              |
| [`evaluating-ai-output-essentials`](../syllabus/courses/evaluating-ai-output-essentials.md)                                 | python                                                                                   | 2.0                             | 43 + 2 x 5 + 3                         | 56         | 2          | 3.7              |
| [`evaluating-ai-systems-in-depth`](../syllabus/courses/evaluating-ai-systems-in-depth.md)                                   | python                                                                                   | 2.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 6.6              |
| [`fine-tuning-and-adaptation`](../syllabus/courses/fine-tuning-and-adaptation.md)                                           | python                                                                                   | 2.0                             | 75 + 2 x 8 + 3                         | 94         | 2          | 6.3              |
| [`inference-serving-and-model-deployment`](../syllabus/courses/inference-serving-and-model-deployment.md)                   | python                                                                                   | 2.0                             | 75 + 2 x 8 + 3                         | 94         | 2          | 6.3              |
| [`product-patterns-for-probabilistic-systems`](../syllabus/courses/product-patterns-for-probabilistic-systems.md)           | none (no code, no run.yaml)                                                              | -                               | -                                      | -          | 0          | 0.0              |
| [`statistics-for-evaluation`](../syllabus/courses/statistics-for-evaluation.md)                                             | python (numpy, scipy, scikit-learn, statsmodels from a hash-locked lockfile)             | 4.0                             | 45 + 2 x 5 + 3                         | 58         | 2          | 7.7              |
| [`the-agent-loop`](../syllabus/courses/the-agent-loop.md)                                                                   | python                                                                                   | 1.5                             | 75 + 2 x 8 + 3                         | 94         | 2          | 4.7              |
| [`analytics-and-experimentation`](../syllabus/courses/analytics-and-experimentation.md)                                     | python                                                                                   | 2.0                             | 75 + 2 x 8 + 3                         | 94         | 2          | 6.3              |
| [`engineering-management`](../syllabus/courses/engineering-management.md)                                                   | none (no code, no run.yaml)                                                              | -                               | -                                      | -          | 0          | 0.0              |
| [`project-management`](../syllabus/courses/project-management.md)                                                           | none (no code, no run.yaml)                                                              | -                               | -                                      | -          | 0          | 0.0              |
| [`software-product-engineering`](../syllabus/courses/software-product-engineering.md)                                       | none (no code, no run.yaml)                                                              | -                               | -                                      | -          | 0          | 0.0              |
| [`technical-communication`](../syllabus/courses/technical-communication.md)                                                 | none (no code, no run.yaml)                                                              | -                               | -                                      | -          | 0          | 0.0              |
| [`behavioral-and-leadership-interviews`](../syllabus/courses/behavioral-and-leadership-interviews.md)                       | none (no code, no run.yaml)                                                              | -                               | -                                      | -          | 0          | 0.0              |
| [`capstone-interview-loop`](../syllabus/courses/capstone-interview-loop.md)                                                 | python                                                                                   | 2.0                             | 45 + 2 x 5 + 3                         | 58         | 2          | 3.9              |
| [`coding-interview`](../syllabus/courses/coding-interview.md)                                                               | python                                                                                   | 2.0                             | 75 + 2 x 8 + 3                         | 94         | 2          | 6.3              |
| [`system-design-interview`](../syllabus/courses/system-design-interview.md)                                                 | none (no code, no run.yaml)                                                              | -                               | -                                      | -          | 0          | 0.0              |
| [`take-home-and-live-coding`](../syllabus/courses/take-home-and-live-coding.md)                                             | python; shell                                                                            | 2.0                             | 75 + 2 x 8 + 3                         | 94         | 2          | 6.3              |
| [`detection-engineering-and-siem-operations`](../syllabus/courses/detection-engineering-and-siem-operations.md)             | python; shell                                                                            | 2.0                             | 78 + 2 x 8 + 3                         | 97         | 2          | 6.5              |
| [`it-and-application-security`](../syllabus/courses/it-and-application-security.md)                                         | python (cryptography, argon2-cffi from a hash-locked lockfile)                           | 2.0                             | 27 + 2 x 5 + 3                         | 40         | 2          | 2.7              |
| [`it-governance-grc`](../syllabus/courses/it-governance-grc.md)                                                             | none (no code, no run.yaml)                                                              | -                               | -                                      | -          | 0          | 0.0              |
| [`offensive-security`](../syllabus/courses/offensive-security.md)                                                           | python; shell                                                                            | 2.0                             | 78 + 2 x 8 + 3                         | 97         | 2          | 6.5              |
| [`security-essentials`](../syllabus/courses/security-essentials.md)                                                         | python (fastapi, pydantic from a hash-locked lockfile); shell                            | 3.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 9.9              |

The heaviest courses, by planning minutes:

| Course                                                                      | Planning minutes | Share of the plan | Toolchains                                                                         |
| --------------------------------------------------------------------------- | ---------------- | ----------------- | ---------------------------------------------------------------------------------- |
| [`windows-app-development`](../syllabus/courses/windows-app-development.md) | 42.0             | 13 percent        | dotnet; windows-static (static, reason windows)                                    |
| [`hybrid-app-development`](../syllabus/courses/hybrid-app-development.md)   | 25.9             | 8 percent         | dart; flutter (pubspec.lock)                                                       |
| [`android-app-development`](../syllabus/courses/android-app-development.md) | 20.7             | 6 percent         | kotlin; ktlint (static, reason android)                                            |
| [`ios-app-development`](../syllabus/courses/ios-app-development.md)         | 14.6             | 4 percent         | swift; swift-parse (static, reason ios)                                            |
| [`advanced-frontend`](../syllabus/courses/advanced-frontend.md)             | 13.2             | 4 percent         | typescript (jsdom, vitest, testing-library from a hash-locked `package-lock.json`) |
| [`frontend-essentials`](../syllabus/courses/frontend-essentials.md)         | 13.2             | 4 percent         | typescript (jsdom from a hash-locked `package-lock.json`)                          |

By wave (the PR's cumulative load at each wave's head):

| Wave | Courses (slot order)                                                                                                  | Planning minutes | Target units | Cumulative units | Cumulative runs | Cumulative minutes | Checkpoint                  |
| ---- | --------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | ---------------- | --------------- | ------------------ | --------------------------- |
| 1    | 1. `backend-essentials`; 2. `frontend-essentials`; 3. `coding-interview`                                              | 29.4             | 262          | 262              | 292             | 29.4               |                             |
| 2    | 1. `api-design`; 2. `security-essentials`; 3. `advanced-frontend`                                                     | 29.7             | 267          | 529              | 589             | 59.1               |                             |
| 3    | 1. `creating-ai-powered-apps`; 2. `backend-at-scale`; 3. `behavioral-and-leadership-interviews`                       | 13.2             | 178          | 707              | 787             | 72.3               | push 1 (opens the draft PR) |
| 4    | 1. `agentic-ai`; 2. `evaluating-ai-output-essentials`; 3. `it-and-application-security`                               | 13.0             | 171          | 878              | 982             | 85.3               |                             |
| 5    | 1. `the-agent-loop`; 2. `statistics-for-evaluation`; 3. `system-design-interview`                                     | 12.4             | 135          | 1,013            | 1,134           | 97.7               |                             |
| 6    | 1. `agent-tools-and-mcp`; 2. `android-app-development`; 3. `project-management`                                       | 27.0             | 171          | 1,184            | 1,325           | 124.7              | push 2                      |
| 7    | 1. `take-home-and-live-coding`; 2. `inference-serving-and-model-deployment`; 3. `evaluating-ai-systems-in-depth`      | 19.2             | 257          | 1,441            | 1,612           | 143.9              |                             |
| 8    | 1. `agent-context-and-memory`; 2. `software-product-engineering`; 3. `detection-engineering-and-siem-operations`      | 10.6             | 141          | 1,582            | 1,770           | 154.5              |                             |
| 9    | 1. `agent-permissions-and-sandboxing`; 2. `agent-orchestration-subagents-and-observability`; 3. `ios-app-development` | 24.8             | 223          | 1,805            | 2,020           | 179.3              | push 3                      |
| 10   | 1. `offensive-security`; 2. `capstone-full-stack-app`; 3. `information-architecture-and-seo`                          | 18.6             | 197          | 2,002            | 2,241           | 197.9              |                             |
| 11   | 1. `linux-app-development`; 2. `hybrid-app-development`; 3. `capstone-first-working-software`                         | 40.1             | 225          | 2,227            | 2,493           | 238.0              |                             |
| 12   | 1. `analytics-and-experimentation`; 2. `build-your-own-reactive-ui`; 3. `it-governance-grc`                           | 16.2             | 173          | 2,400            | 2,686           | 254.2              | push 4                      |
| 13   | 1. `build-your-own-web-framework`; 2. `windows-app-development`; 3. `agentic-coding`                                  | 51.9             | 209          | 2,609            | 2,922           | 306.1              |                             |
| 14   | 1. `capstone-interview-loop`; 2. `engineering-management`; 3. `product-patterns-for-probabilistic-systems`            | 3.9              | 51           | 2,660            | 2,980           | 310.0              |                             |
| 15   | 1. `technical-communication`; 2. `fine-tuning-and-adaptation`; 3. `async-python-and-fastapi-services`                 | 16.0             | 171          | 2,831            | 3,171           | 326.0              | push 5 (final)              |

**Shards by checkpoint.** The plan pushes five times (after waves 3, 6, 9, 12, and 15), and each push runs the check on
every course finished so far. The table gives the longest shard for plan 05's split (sorted slug, round-robin) and for
the best possible split by course, with four and eight shards.

| Selection                         | Courses | Total planning minutes | Shards | Longest shard, plan 05's split (sorted slug, round-robin) | Longest shard, best possible split | Real split within 45 (timeout 60) | Real split within 90 (timeout 120) | Best split within 45 | Best split within 90 |
| --------------------------------- | ------- | ---------------------- | ------ | --------------------------------------------------------- | ---------------------------------- | --------------------------------- | ---------------------------------- | -------------------- | -------------------- |
| waves 1 to 3 (push 1)             | 9       | 72.3                   | 4      | 23.1                                                      | 19.8                               | yes                               | yes                                | yes                  | yes                  |
| waves 1 to 3 (push 1)             | 9       | 72.3                   | 8      | 23.1                                                      | 13.2                               | yes                               | yes                                | yes                  | yes                  |
| waves 1 to 6 (push 2)             | 18      | 124.7                  | 4      | 41.6                                                      | 32.7                               | yes                               | yes                                | yes                  | yes                  |
| waves 1 to 6 (push 2)             | 18      | 124.7                  | 8      | 33.9                                                      | 20.7                               | yes                               | yes                                | yes                  | yes                  |
| waves 1 to 9 (push 3)             | 27      | 179.3                  | 4      | 49.6                                                      | 45.4                               | no                                | yes                                | no                   | yes                  |
| waves 1 to 9 (push 3)             | 27      | 179.3                  | 8      | 33.0                                                      | 23.6                               | yes                               | yes                                | yes                  | yes                  |
| waves 1 to 12 (push 4)            | 36      | 254.2                  | 4      | 84.6                                                      | 64.8                               | no                                | yes                                | no                   | yes                  |
| waves 1 to 12 (push 4)            | 36      | 254.2                  | 8      | 48.7                                                      | 34.1                               | no                                | yes                                | yes                  | yes                  |
| waves 1 to 15 (push 5) - final PR | 45      | 326.0                  | 4      | 119.3                                                     | 82.8                               | no                                | no                                 | no                   | yes                  |
| waves 1 to 15 (push 5) - final PR | 45      | 326.0                  | 8      | 71.1                                                      | 42.0                               | no                                | yes                                | yes                  | yes                  |

Reading the table. With four shards, the real split fits the 45-minute rule only through push 2, fits the 90-minute
rule through push 4, and misses it at the last push (119.3 minutes), where even the best split (82.8) is close to the
limit. With eight shards, the real split fits the 90-minute rule at every push and the 45-minute rule only through
push 3; at pushes 4 and 5 only the best split fits 45 (34.1 and 42.0). The last figure is not an accident:
`windows-app-development` alone is 42.0 planning minutes, so no split by whole courses can go below 42.0, and a
split of that course by unit (plan 12's rung 2d, if merged) is the only way lower. So the expected path at planning
figures is rung 2b (eight shards) before push 3, rung 2c (a weighted split) before push 4, and rung 3 (a 120-minute
timeout) before push 4, unless plans 11 and 12 already merged them.

The shard contents for the final push at eight shards, with the real split:

| Shard (of 8) | Planning minutes | Courses | Which (sorted slug, round-robin)                                                                                                                                                          |
| ------------ | ---------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1            | 48.2             | 6       | `advanced-frontend`, `android-app-development`, `capstone-first-working-software`, `evaluating-ai-systems-in-depth`, `it-governance-grc`, `system-design-interview`                       |
| 2            | 37.5             | 6       | `agent-context-and-memory`, `api-design`, `capstone-full-stack-app`, `fine-tuning-and-adaptation`, `linux-app-development`, `take-home-and-live-coding`                                   |
| 3            | 37.2             | 6       | `agent-orchestration-subagents-and-observability`, `async-python-and-fastapi-services`, `capstone-interview-loop`, `frontend-essentials`, `offensive-security`, `technical-communication` |
| 4            | 49.8             | 6       | `agent-permissions-and-sandboxing`, `backend-at-scale`, `coding-interview`, `hybrid-app-development`, `product-patterns-for-probabilistic-systems`, `the-agent-loop`                      |
| 5            | 71.1             | 6       | `agent-tools-and-mcp`, `backend-essentials`, `creating-ai-powered-apps`, `inference-serving-and-model-deployment`, `project-management`, `windows-app-development`                        |
| 6            | 27.4             | 5       | `agentic-ai`, `behavioral-and-leadership-interviews`, `detection-engineering-and-siem-operations`, `information-architecture-and-seo`, `security-essentials`                              |
| 7            | 27.8             | 5       | `agentic-coding`, `build-your-own-reactive-ui`, `engineering-management`, `ios-app-development`, `software-product-engineering`                                                           |
| 8            | 27.0             | 5       | `analytics-and-experimentation`, `build-your-own-web-framework`, `evaluating-ai-output-essentials`, `it-and-application-security`, `statistics-for-evaluation`                            |

## The Response Ladder

Apply the first rungs that bring the projection to the binding rule, in order. Write each rung taken in the ledger with
the measured figures that required it. Evaluate the ladder at Phase 1 (on the spike seconds) and again before every
checkpoint push (on the measured `examples check` minutes of the finished courses). The rungs are plan 11's and plan
12's; this plan reuses what is merged and makes only what is missing, test first, under plan 05's migration step M11.

1. **Author for speed.** One run per example unit (`main` only, with no extra `tests` runs unless the lesson is about
   tests), short programs, one source file per example. A unit is never merged with another to save time: one unit per
   example is plan 05's contract. Windows and Flutter units keep to one invocation per example.
2. **Count units, not courses.** If plan 08 or 11 merged the rule that counts selected units (`[1]` when at most 120
   units, otherwise `[1,2,3,4]`), nothing is needed here. If not, make the change with a regression test first.
   - **2b. Scale the shard count with the units, up to 8.** `[1]` when at most 120 units are selected, `[1,2,3,4]` when
     at most 800, and `[1,2,3,4,5,6,7,8]` above 800, for every selection mode. RED: 813 units over 9 courses still
     return four shards; GREEN: they return eight. Eight is the cap because the OSE repositories share a limited
     runner pool (plan 05's cost note).
   - **2c. A weighted split, only if needed.** If the measured longest shard under the sorted-slug split is above the
     limit while the best possible split would fit, change `--shard K/N` to split by unit count (largest first), with
     the same regression-test-first order.
3. **Raise the `since` timeout.** If the longest shard is above 45 minutes but at or below 90, raise `timeout-minutes`
   for `selection: since` from 60 to 120 in the reusable workflow, and record the reason in the workflow comment. At
   planning figures this is needed from the fourth push if no earlier plan did it.
4. **Stop and report.** If the projection is still above 75 percent of the applicable timeout after rung 3, mark the
   heaviest course BLOCKED with the cause "does not fit the CI budget" and report to the user. A course is never
   weakened (fewer examples, merged units, a skipped run) to fit.
5. **Plan 12's rungs 2t and 2d, if merged.** Rung 2t changes how a catalog edit selects courses (see above). Rung 2d
   splits one course's units across shards; it is the only rung that helps `windows-app-development` below its own
   42.0 planning minutes. If it is not merged and the measured Windows course alone exceeds 75 percent of the timeout,
   rung 4 applies to that course, after the user hears about it.

These changes are small, tested harness and workflow edits made in Phase 1 (or at the first checkpoint that needs
them), so they ride the same PR. They change CI timeouts and shard counts only; no course check is loosened.

## The Monthly Full Run

Plan 05 runs every opted-in course monthly with a 300-minute `all` timeout (the limit is 75 percent, 225). Rung 2b is
written for every selection mode, so the monthly run scales to eight shards too. At planning figures the end state is
about 1,640 minutes in the full run, so eight shards with the best split give about 205 minutes each, inside 225, and
four shards give about 410, outside 300. This is the last audit plan, so the end-of-series figure is this plan's to
record and plan 14's to confirm: Phase 9 records the projection from the merged units and the measured seconds. Plan
05's revisit trigger applies: full-run shards above 300 minutes, or derived environment builds above 15 minutes per
shard on a warm cache.

## Phase 0 and Phase 1 Measurements

Phase 0 records the shard facts (the merged `examples-plan` rule, the timeouts, the shard split, which of rungs 2b, 2c,
2t, 2d, and 3 are already merged), the merged catalog, and computes the FULL-run projection with a conservative
per-course figure. Phase 1 measures, with the CLI's own smoke fixtures and the spikes, the seconds per invocation for
`python`, `shell`, `typescript`, `kotlin`, `ktlint`, `swift`, `swift-parse`, `dart`, `flutter`, `dotnet`, and
`windows-static`, plus the environment build minutes for each distinct lock (the FastAPI stack, the numeric stack, the
crypto pair, the jsdom stack, the type-checker lock, and Flutter's `pubspec.lock`). It computes each course's minutes as
the sum of runs x 2 x seconds plus environment builds, fills the shard table, applies the budget rule to the four
candidates, and writes the rung decisions to the evidence file. After each finished course the ledger replaces its
planning minutes with the measured `EX-CHECK` time.
