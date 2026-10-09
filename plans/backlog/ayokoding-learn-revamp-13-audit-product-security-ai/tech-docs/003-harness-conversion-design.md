# 003 — Harness Conversion Design

Plan 05 built the harness and defined the `ayokoding.run/v1` contract; this plan makes 37 existing courses with code
meet it. This page says how a course that has code files, inline programs, or no code at all becomes a set of
deterministic units, which spikes prove the hard cases first, where a lesson may show code that does not run, and what
a static run proves for the mobile and desktop courses. It does not restate the contract: plan 05's `run.yaml` field
guide, anchor grammar, fence classes, and simulation convention apply unchanged, and any defect in the harness is
fixed in `apps/ayokoding-cli` with a regression test (plan 05's migration step M11), never by weakening a course check
(decision D12). Plan 11's conversion design (families, determinism rules, the authoring workflow) is the model; this
page keeps what applies and adds what the AI, security, mobile, and web courses need.

## Starting Points

Every course starts in one of three positions. "Create" means a unit folder that does not exist today; "convert" means
a folder that exists and needs a `run.yaml`, expected files, and anchors. Totals: 1,007 to create and
1,824 to convert, for 2,831 target units (2,528 example units, 266 kata units, and
37 capstone units).

| Course                                                                                                                      | Target units (examples / katas / capstone) | Folders today (examples / katas) | Create | Convert | Starting point   |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------- | ------ | ------- | ---------------- |
| [`advanced-frontend`](../syllabus/courses/advanced-frontend.md)                                                             | 80 / 8 / 1                                 | 80 / 6                           | 2      | 87      | convert in place |
| [`android-app-development`](../syllabus/courses/android-app-development.md)                                                 | 78 / 8 / 1                                 | 78 / 6                           | 2      | 85      | convert in place |
| [`api-design`](../syllabus/courses/api-design.md)                                                                           | 80 / 8 / 1                                 | 80 / 6                           | 2      | 87      | convert in place |
| [`async-python-and-fastapi-services`](../syllabus/courses/async-python-and-fastapi-services.md)                             | 78 / 8 / 1                                 | 78 / 10                          | 0      | 87      | convert in place |
| [`backend-at-scale`](../syllabus/courses/backend-at-scale.md)                                                               | 80 / 8 / 1                                 | 80 / 6                           | 2      | 87      | convert in place |
| [`backend-essentials`](../syllabus/courses/backend-essentials.md)                                                           | 80 / 8 / 1                                 | 80 / 19                          | 0      | 89      | convert in place |
| [`build-your-own-reactive-ui`](../syllabus/courses/build-your-own-reactive-ui.md)                                           | 80 / 8 / 1                                 | 80 / 0                           | 8      | 81      | convert in place |
| [`build-your-own-web-framework`](../syllabus/courses/build-your-own-web-framework.md)                                       | 80 / 8 / 1                                 | 80 / 0                           | 8      | 81      | convert in place |
| [`capstone-first-working-software`](../syllabus/courses/capstone-first-working-software.md)                                 | 45 / 5 / 1                                 | 0 / 0                            | 50     | 1       | mixed            |
| [`capstone-full-stack-app`](../syllabus/courses/capstone-full-stack-app.md)                                                 | 45 / 5 / 1                                 | 0 / 0                            | 50     | 1       | mixed            |
| [`frontend-essentials`](../syllabus/courses/frontend-essentials.md)                                                         | 80 / 8 / 1                                 | 80 / 0                           | 8      | 81      | convert in place |
| [`hybrid-app-development`](../syllabus/courses/hybrid-app-development.md)                                                   | 78 / 8 / 1                                 | 0 / 0                            | 86     | 1       | mixed            |
| [`information-architecture-and-seo`](../syllabus/courses/information-architecture-and-seo.md)                               | 53 / 5 / 1                                 | 53 / 0                           | 6      | 53      | convert in place |
| [`ios-app-development`](../syllabus/courses/ios-app-development.md)                                                         | 78 / 8 / 1                                 | 7 / 0                            | 79     | 8       | mixed            |
| [`linux-app-development`](../syllabus/courses/linux-app-development.md)                                                     | 78 / 8 / 1                                 | 78 / 0                           | 8      | 79      | convert in place |
| [`windows-app-development`](../syllabus/courses/windows-app-development.md)                                                 | 78 / 8 / 1                                 | 78 / 5                           | 3      | 84      | convert in place |
| [`agent-context-and-memory`](../syllabus/courses/agent-context-and-memory.md)                                               | 48 / 5 / 1                                 | 48 / 0                           | 6      | 48      | convert in place |
| [`agent-orchestration-subagents-and-observability`](../syllabus/courses/agent-orchestration-subagents-and-observability.md) | 46 / 5 / 1                                 | 46 / 0                           | 6      | 46      | convert in place |
| [`agent-permissions-and-sandboxing`](../syllabus/courses/agent-permissions-and-sandboxing.md)                               | 75 / 8 / 1                                 | 52 / 0                           | 32     | 52      | mixed            |
| [`agent-tools-and-mcp`](../syllabus/courses/agent-tools-and-mcp.md)                                                         | 75 / 8 / 1                                 | 54 / 0                           | 30     | 54      | mixed            |
| [`agentic-ai`](../syllabus/courses/agentic-ai.md)                                                                           | 80 / 8 / 1                                 | 80 / 0                           | 9      | 80      | convert in place |
| [`agentic-coding`](../syllabus/courses/agentic-coding.md)                                                                   | 27 / 5 / 1                                 | 16 / 0                           | 16     | 17      | mixed            |
| [`creating-ai-powered-apps`](../syllabus/courses/creating-ai-powered-apps.md)                                               | 80 / 8 / 1                                 | 80 / 0                           | 8      | 81      | convert in place |
| [`evaluating-ai-output-essentials`](../syllabus/courses/evaluating-ai-output-essentials.md)                                 | 43 / 5 / 1                                 | 43 / 0                           | 5      | 44      | convert in place |
| [`evaluating-ai-systems-in-depth`](../syllabus/courses/evaluating-ai-systems-in-depth.md)                                   | 80 / 8 / 1                                 | 80 / 0                           | 8      | 81      | convert in place |
| [`fine-tuning-and-adaptation`](../syllabus/courses/fine-tuning-and-adaptation.md)                                           | 75 / 8 / 1                                 | 74 / 0                           | 10     | 74      | convert in place |
| [`inference-serving-and-model-deployment`](../syllabus/courses/inference-serving-and-model-deployment.md)                   | 75 / 8 / 1                                 | 75 / 0                           | 8      | 76      | convert in place |
| [`product-patterns-for-probabilistic-systems`](../syllabus/courses/product-patterns-for-probabilistic-systems.md)           | none (no code)                             | -                                | -      | -       | -                |
| [`statistics-for-evaluation`](../syllabus/courses/statistics-for-evaluation.md)                                             | 45 / 5 / 1                                 | 45 / 0                           | 5      | 46      | convert in place |
| [`the-agent-loop`](../syllabus/courses/the-agent-loop.md)                                                                   | 75 / 8 / 1                                 | 48 / 0                           | 36     | 48      | mixed            |
| [`analytics-and-experimentation`](../syllabus/courses/analytics-and-experimentation.md)                                     | 75 / 8 / 1                                 | 0 / 0                            | 83     | 1       | mixed            |
| [`engineering-management`](../syllabus/courses/engineering-management.md)                                                   | none (no code)                             | -                                | -      | -       | -                |
| [`project-management`](../syllabus/courses/project-management.md)                                                           | none (no code)                             | -                                | -      | -       | -                |
| [`software-product-engineering`](../syllabus/courses/software-product-engineering.md)                                       | none (no code)                             | -                                | -      | -       | -                |
| [`technical-communication`](../syllabus/courses/technical-communication.md)                                                 | none (no code)                             | -                                | -      | -       | -                |
| [`behavioral-and-leadership-interviews`](../syllabus/courses/behavioral-and-leadership-interviews.md)                       | none (no code)                             | -                                | -      | -       | -                |
| [`capstone-interview-loop`](../syllabus/courses/capstone-interview-loop.md)                                                 | 45 / 5 / 1                                 | 0 / 0                            | 50     | 1       | mixed            |
| [`coding-interview`](../syllabus/courses/coding-interview.md)                                                               | 75 / 8 / 1                                 | 0 / 0                            | 83     | 1       | mixed            |
| [`system-design-interview`](../syllabus/courses/system-design-interview.md)                                                 | none (no code)                             | -                                | -      | -       | -                |
| [`take-home-and-live-coding`](../syllabus/courses/take-home-and-live-coding.md)                                             | 75 / 8 / 1                                 | 0 / 0                            | 84     | 0       | convert in place |
| [`detection-engineering-and-siem-operations`](../syllabus/courses/detection-engineering-and-siem-operations.md)             | 78 / 8 / 1                                 | 0 / 0                            | 87     | 0       | convert in place |
| [`it-and-application-security`](../syllabus/courses/it-and-application-security.md)                                         | 27 / 5 / 1                                 | 0 / 0                            | 32     | 1       | mixed            |
| [`it-governance-grc`](../syllabus/courses/it-governance-grc.md)                                                             | none (no code)                             | -                                | -      | -       | -                |
| [`offensive-security`](../syllabus/courses/offensive-security.md)                                                           | 78 / 8 / 1                                 | 0 / 0                            | 87     | 0       | convert in place |
| [`security-essentials`](../syllabus/courses/security-essentials.md)                                                         | 80 / 8 / 1                                 | 80 / 0                           | 8      | 81      | convert in place |

## Conversion Families

Eight families cover every course. A course may use more than one; the brief names them.

| Family                | When it applies                                                                                                                                        | What the unit does                                                                                                                                                                                 | Courses (main users)                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 Real run           | The program runs offline in a catalog toolchain                                                                                                        | Runs the program for real; the expected file holds the real bytes                                                                                                                                  | Most Python, TypeScript, Kotlin, Swift, Dart, and .NET logic units; all shell lab scripts                                                                                                                                              |
| F2 In-process service | A web or API example needs a server                                                                                                                    | Calls the application object in process (an ASGI or WSGI callable, or the framework's test client) with SQLite under `/tmp`; no listening socket, so no network                                    | `backend-essentials`, `async-python-and-fastapi-services`, `api-design`, `build-your-own-web-framework`, `security-essentials`, `capstone-first-working-software`, `capstone-full-stack-app`                                           |
| F3 Model              | The lesson teaches a thing the sandbox cannot host (a browser layout engine, a desktop shell, a systemd unit, a GPU server, a SIEM, a vulnerable host) | A small deterministic program models what the thing reports or decides; the lesson says it is a model; the launch line is an illustration                                                          | `frontend-essentials` (layout), `advanced-frontend` (measurements), `linux-app-development`, `inference-serving-and-model-deployment`, `fine-tuning-and-adaptation`, `offensive-security`, `detection-engineering-and-siem-operations` |
| F4 Static             | The artifact is a file a validator can check offline (Compose and androidx files, SwiftUI files, WPF and XAML project files)                           | Runs the validator (`mode: static` with a `static.reason`); the lesson says it is validated, not built or run                                                                                      | `android-app-development` (`android`), `ios-app-development` (`ios`), `windows-app-development` (`windows`)                                                                                                                            |
| F5 AI fixture         | The example calls a language model, a tool, or an agent loop                                                                                           | Replaces the model with a scripted `FakeModel` and recorded responses, a counter clock, and fixed seeds; no key, no network (policy AI1 to AI6 in [011](./011-ai-fixtures-and-sourcing-policy.md)) | The 14 AI engineering courses and `agentic-coding` units that drive an agent                                                                                                                                                           |
| F6 Safe lab           | The example attacks, probes, detects, or sandboxes                                                                                                     | Runs the target as an in-process model on synthetic data; prints what the attack saw (rules S1 to S7 and SL1 to SL4 in [012](./012-safe-lab-and-content-safety-rules.md))                          | `offensive-security`, `detection-engineering-and-siem-operations`, `it-and-application-security`, `security-essentials`, `agent-permissions-and-sandboxing`                                                                            |
| F7 Check              | The lesson's claim is a rule over source (a type checker, a linter)                                                                                    | A `kind: check` run applies a locked, wheel-bundled checker (spike SP9)                                                                                                                            | `api-design`, `backend-at-scale`, `backend-essentials`, `build-your-own-web-framework`                                                                                                                                                 |
| F8 No code            | A leadership, governance, or product course with no programs                                                                                           | No unit and no `run.yaml`; the course is "not applicable" in the coverage report                                                                                                                   | The eight no-code courses                                                                                                                                                                                                              |

**The honesty rule (decision D12).** F3 and F4 teach less than a real run, and the lesson says so in one sentence
beside the fence, in plain words, for example "This models what a layout engine computes; it does not render a page."
The Content Quality Gate checks that the sentence is present wherever a unit is a model or a static check. A modelled
example is never described as the real tool. The same rule covers F5: a scripted model is never described as a real
model's answer ([011](./011-ai-fixtures-and-sourcing-policy.md)).

## Unit Shapes and `run.yaml` Templates

Each template shows the fields a maker fills in. Paths are unit-relative. The field names and rules are plan 05's;
nothing here adds a field. Expected files are `.txt` and are written by `EX-RECORD` and then read by a person, never
typed by hand.

**1. A script example (Python or shell).**

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, main.py]
    timeout: 30s
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

**2. An in-process service example with a locked stack and tests (FastAPI, Flask, Starlette).** The lock is a shared
file under the code root; the harness builds one environment image per distinct lock content. Calls go through the
framework's test client, so no port is opened.

```yaml
schema: ayokoding.run/v1
toolchain: python
dependencies:
  lockfile: learning/code/requirements.lock
runs:
  - name: main
    command: [python3, main.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
  - name: tests
    kind: test
    command: [python3, -m, pytest, -q, -p, no:cacheprovider]
    expect:
      exit: 0
      stdout: ignore
```

**3. A TypeScript example on a locked jsdom stack.** The command is argv with no shell, so a compile-and-run pair goes
into `run.sh`, and the build output goes to `/tmp`.

```yaml
schema: ayokoding.run/v1
toolchain: typescript
dependencies:
  lockfile: learning/code/package-lock.json
runs:
  - name: main
    command: [bash, run.sh]
    timeout: 60s
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

**4. An AI fixture unit (F5).** The kit is a shared file under the code root and is imported with `PYTHONPATH=..`, so
the unit stays one folder. The recorded responses live in the unit.

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, main.py]
    env:
      PYTHONPATH: ".."
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

**5. A static validation (Android, iOS, Windows).** `mode: static` forbids services and needs a reason and a note that
says what the run proves. The reason is one of the closed set; this plan uses `android`, `ios`, and `windows`.

```yaml
schema: ayokoding.run/v1
toolchain: swift-parse
mode: static
static:
  reason: ios
  note: SwiftUI exists only on Apple platforms, so the file is parsed as Swift but never type-checked, built, or run.
runs:
  - name: parse
    kind: check
    command: [bash, run.sh]
    expect:
      exit: 0
      stdout: expected/parse.stdout.txt
```

**6. A kata.** The unit has `before/` and `after/` subfolders; the `before` run may expect a non-zero exit, because the
kata starts from a broken program.

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: before
    workdir: before
    command: [python3, kata.py]
    expect:
      exit: 1
      stdout: ignore
      stderr: ignore
      invariant: the program fails on the input the exercise names
  - name: after
    workdir: after
    command: [python3, kata.py]
    expect:
      exit: 0
      stdout: expected/after.stdout.txt
```

**7. A safe-lab unit (F6).** The target is a function or an application object inside the unit. The unit prints what
the attack saw and what the defence changed. It opens no socket and runs no shell command.

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, lab.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

**8. A type-check run (F7).** The checker is a hash-locked wheel (spike SP9); the run is a `check`.

```yaml
schema: ayokoding.run/v1
toolchain: python
dependencies:
  lockfile: learning/code/requirements.lock
runs:
  - name: main
    command: [python3, main.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
  - name: types
    kind: check
    command: [python3, -m, mypy, --strict, main.py]
    expect:
      exit: 0
      stdout: ignore
```

## Determinism and the Gaps Found

The baseline survey found nondeterminism, dependency, tool, and privilege gaps in most code courses (classes X15, X16,
X17). These are the measured findings; each brief carries its own line.

| Course                                                                                                                      | Class | Finding (measured 2026-10-09)                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`advanced-frontend`](../syllabus/courses/advanced-frontend.md)                                                             | X15   | 36 of 100 code files touch DOM or browser APIs (keyword scan), 4 read a clock, 4 use timers or promises, and 3 draw random numbers; each needs a fixed input or a virtual clock.                                                                                                                    |
| [`advanced-frontend`](../syllabus/courses/advanced-frontend.md)                                                             | X16   | `vitest` and `@testing-library/dom` are third-party packages; there is no `package-lock.json` in the course.                                                                                                                                                                                        |
| [`advanced-frontend`](../syllabus/courses/advanced-frontend.md)                                                             | X17   | Waterfall, bundle-size, and layout-cost examples describe browser measurements that a container cannot make.                                                                                                                                                                                        |
| [`android-app-development`](../syllabus/courses/android-app-development.md)                                                 | X16   | A code comment says "Imports are intentionally omitted: this app module needs Room, Retrofit, lifecycle-viewmodel, and coroutines"; none of these has a locked version.                                                                                                                             |
| [`android-app-development`](../syllabus/courses/android-app-development.md)                                                 | X17   | 68 of 96 code files use Android or Compose symbols (keyword scan). The Android SDK and Gradle are not in the catalog, so those files cannot compile in the harness.                                                                                                                                 |
| [`api-design`](../syllabus/courses/api-design.md)                                                                           | X17   | The type checker `pyright` needs a Node download and is not in the catalog (spike SP9 tests a wheel-bundled checker).                                                                                                                                                                               |
| [`async-python-and-fastapi-services`](../syllabus/courses/async-python-and-fastapi-services.md)                             | X15   | 31 files use timers or the event loop and 67 use network keywords (`uvicorn` in 59, `httpx`, `localhost`); servers must be replaced by in-process ASGI calls and sleeps by a controllable loop clock.                                                                                               |
| [`async-python-and-fastapi-services`](../syllabus/courses/async-python-and-fastapi-services.md)                             | X16   | Third-party packages: fastapi, pydantic, pydantic-settings, httpx, aiosqlite, pytest-asyncio, starlette; the only dependency files are a `pyproject.toml` inside one example and a `pyrightconfig.json`.                                                                                            |
| [`async-python-and-fastapi-services`](../syllabus/courses/async-python-and-fastapi-services.md)                             | X17   | Example 77 (a `uv` project) and example 78 (a Dockerfile for a multi-worker ASGI deploy) need `uv` and Docker, neither in the catalog.                                                                                                                                                              |
| [`backend-at-scale`](../syllabus/courses/backend-at-scale.md)                                                               | X15   | 2 files use timers, 2 draw random numbers, and 1 reaches a socket; queues, caches, and retries must use a virtual clock and a seeded generator.                                                                                                                                                     |
| [`backend-at-scale`](../syllabus/courses/backend-at-scale.md)                                                               | X17   | Redis, a message queue, and an OAuth provider are named in the lessons; the units must use in-memory fakes and say so.                                                                                                                                                                              |
| [`backend-essentials`](../syllabus/courses/backend-essentials.md)                                                           | X15   | 126 files use network keywords (`TestClient` in 55, `uvicorn` in 53, `http.server` in 8 that bind real sockets); 4 draw random numbers, 2 use timers.                                                                                                                                               |
| [`backend-essentials`](../syllabus/courses/backend-essentials.md)                                                           | X16   | Third-party packages: fastapi, pydantic, starlette, flask, uvicorn, pytest; no hash-locked requirements file exists.                                                                                                                                                                                |
| [`build-your-own-reactive-ui`](../syllabus/courses/build-your-own-reactive-ui.md)                                           | X17   | `npx tsx` downloads a runner; the harness has no network. Spike SP1 settles the run command (compile with `tsc` to `/tmp` and run with `node`).                                                                                                                                                     |
| [`build-your-own-web-framework`](../syllabus/courses/build-your-own-web-framework.md)                                       | X15   | 3 files touch network keywords (one opens a socket); in-process request objects replace them.                                                                                                                                                                                                       |
| [`capstone-first-working-software`](../syllabus/courses/capstone-first-working-software.md)                                 | X15   | `uvicorn` appears in 3 files, a socket in 1, a clock in 1, and `attack_transcript.py` sends real `urllib` calls to `127.0.0.1`; all must run in process (spike SP11).                                                                                                                               |
| [`capstone-first-working-software`](../syllabus/courses/capstone-first-working-software.md)                                 | X16   | fastapi, pydantic, hypothesis, argon2-cffi, and pytest are listed in an unhashed `requirements.txt` (spikes SP3, SP4, and SP10).                                                                                                                                                                    |
| [`capstone-full-stack-app`](../syllabus/courses/capstone-full-stack-app.md)                                                 | X16   | fastapi, pydantic, pytest for the backend; vitest and `@testing-library/dom` for the frontend; no hash-locked file for either.                                                                                                                                                                      |
| [`capstone-full-stack-app`](../syllabus/courses/capstone-full-stack-app.md)                                                 | X17   | One `run.yaml` names one toolchain, but the capstone has Python and TypeScript halves (decision D8: the capstone unit is Python; the frontend half is proven by `typescript` example units that read a byte-identical copy of the API contract).                                                    |
| [`frontend-essentials`](../syllabus/courses/frontend-essentials.md)                                                         | X16   | `playwright`, `vitest`, and `@testing-library/dom` have no lockfile in the course.                                                                                                                                                                                                                  |
| [`frontend-essentials`](../syllabus/courses/frontend-essentials.md)                                                         | X17   | 77 `verify.mjs` scripts import `playwright` and read `boundingBox` and computed layout from a real Chromium; the catalog has no browser (decision D5, spike SP2). About 14 examples (box model, flex, grid, responsive breakpoints, contrast) need layout.                                          |
| [`hybrid-app-development`](../syllabus/courses/hybrid-app-development.md)                                                   | X17   | Emulators, device builds, and platform channels cannot run in the sandbox; widget and unit tests (`flutter test`) can.                                                                                                                                                                              |
| [`ios-app-development`](../syllabus/courses/ios-app-development.md)                                                         | X17   | 55 lesson fences use UIKit, SwiftUI, Combine, or XCTest symbols (keyword scan) that exist only on Apple platforms.                                                                                                                                                                                  |
| [`linux-app-development`](../syllabus/courses/linux-app-development.md)                                                     | X15   | 10 files use timers or threads, 7 use sockets, 15 start subprocesses, 16 use temporary folders, 4 use GUI toolkit names, 4 mention `systemctl` or `docker`.                                                                                                                                         |
| [`linux-app-development`](../syllabus/courses/linux-app-development.md)                                                     | X17   | systemd units, a desktop toolkit, and D-Bus cannot run in the container.                                                                                                                                                                                                                            |
| [`windows-app-development`](../syllabus/courses/windows-app-development.md)                                                 | X17   | WinUI 3 compiles only on Windows; WPF and WinForms cross-compile with `-p:EnableWindowsTargeting=true` (spike SP8).                                                                                                                                                                                 |
| [`agent-context-and-memory`](../syllabus/courses/agent-context-and-memory.md)                                               | X15   | All 48 files are tiny deterministic Python (391 lines in all); 3 mention a model, a provider, or a token counter. Tokens are counted by whitespace splitting, not by a vendor tokenizer.                                                                                                            |
| [`agent-orchestration-subagents-and-observability`](../syllabus/courses/agent-orchestration-subagents-and-observability.md) | X15   | 2 files use `asyncio`, which gives a different interleaving unless the schedule is fixed; the units use a single-threaded event loop with scripted tasks and a counter clock, and traces carry sequence numbers instead of times.                                                                   |
| [`agent-permissions-and-sandboxing`](../syllabus/courses/agent-permissions-and-sandboxing.md)                               | X15   | The programs touch no clock, network, or random source (keyword scan found none); the risk is the opposite: a rewrite that touches a real path or process must not. Rule SL1 in tech-docs/012 keeps every host effect inside a fake filesystem, a fake process table, and a fake network.           |
| [`agent-tools-and-mcp`](../syllabus/courses/agent-tools-and-mcp.md)                                                         | X15   | 2 files use `asyncio`; 3 mention a pentest keyword (injection) and 7 mention a model or MCP. Servers and clients talk through in-process pipes (a pair of queues), never a socket or a subprocess.                                                                                                  |
| [`agent-tools-and-mcp`](../syllabus/courses/agent-tools-and-mcp.md)                                                         | X17   | A real MCP server or client needs an SDK and a transport; the units implement JSON-RPC 2.0 framing in standard-library Python, and the real SDK call is an illustration.                                                                                                                            |
| [`agentic-ai`](../syllabus/courses/agentic-ai.md)                                                                           | X15   | 8 files mention a model or MCP and 3 a browser; browser and web-search tools are fakes with fixed pages, and the fake model is scripted.                                                                                                                                                            |
| [`agentic-coding`](../syllabus/courses/agentic-coding.md)                                                                   | X15   | The code files use a seeded random source in 1 file; prompts and agent replies are recorded text fixtures, never live calls.                                                                                                                                                                        |
| [`agentic-coding`](../syllabus/courses/agentic-coding.md)                                                                   | X17   | TypeScript (4 files) and a shell script need the `typescript` and `shell` toolchains; each unit uses one.                                                                                                                                                                                           |
| [`creating-ai-powered-apps`](../syllabus/courses/creating-ai-powered-apps.md)                                               | X15   | 11 files mention a model or provider, 4 a pentest keyword (prompt injection), and 1 a clock. Retrieval uses a bag-of-words embedding written in the course, never a vendor embedding.                                                                                                               |
| [`evaluating-ai-output-essentials`](../syllabus/courses/evaluating-ai-output-essentials.md)                                 | X15   | 5 files use a random source; each gets a fixed seed. The `.jsonl` case files (9) are fixtures and stay byte-identical.                                                                                                                                                                              |
| [`evaluating-ai-systems-in-depth`](../syllabus/courses/evaluating-ai-systems-in-depth.md)                                   | X15   | 6 files mention a model and 2 a browser; judges are scripted functions with fixed verdict tables, and trajectories are JSONL fixtures.                                                                                                                                                              |
| [`fine-tuning-and-adaptation`](../syllabus/courses/fine-tuning-and-adaptation.md)                                           | X17   | A real fine-tune needs a GPU, model weights, and a hosted service. The units compute loss curves, LoRA rank arithmetic, data deduplication, and train/test leakage checks on a fixed tiny dataset in standard-library Python, and the lessons say so on the first page.                             |
| [`inference-serving-and-model-deployment`](../syllabus/courses/inference-serving-and-model-deployment.md)                   | X15   | No clock or random source is used by the programs (the scan found none); arrival traces are fixed lists.                                                                                                                                                                                            |
| [`inference-serving-and-model-deployment`](../syllabus/courses/inference-serving-and-model-deployment.md)                   | X17   | A real inference server needs a GPU and model weights. The units simulate continuous batching, KV-cache budgets, and autoscaling on a virtual clock and a fixed arrival trace.                                                                                                                      |
| [`statistics-for-evaluation`](../syllabus/courses/statistics-for-evaluation.md)                                             | X15   | 37 files draw random numbers (bootstrap and permutation tests); each gets a fixed seed and the output uses a fixed number of resamples.                                                                                                                                                             |
| [`statistics-for-evaluation`](../syllabus/courses/statistics-for-evaluation.md)                                             | X16   | 33 `requirements.txt` files pin `numpy==2.5.1`, `scipy==1.18.0`, and `scikit-learn==1.9.0` without hashes. The harness needs one hash-locked `requirements.lock` per course (spike SP3 proves that wheels exist for the catalog's Python 3.14 and that the results match to the printed precision). |
| [`the-agent-loop`](../syllabus/courses/the-agent-loop.md)                                                                   | X15   | The programs touch no clock, network, or random source (scan found none); the existing `FakeModel` pattern is kept and becomes the shared convention.                                                                                                                                               |
| [`analytics-and-experimentation`](../syllabus/courses/analytics-and-experimentation.md)                                     | X15   | Assignment, power, and bootstrap examples are random by nature; every simulation takes a fixed seed and a fixed resample count, and bucketing uses SHA-256 of a fixed salt and ID.                                                                                                                  |
| [`analytics-and-experimentation`](../syllabus/courses/analytics-and-experimentation.md)                                     | X17   | Event and SQL examples need a database; SQLite from the standard library serves every one (decision D4: no PostgreSQL service for this course).                                                                                                                                                     |
| [`coding-interview`](../syllabus/courses/coding-interview.md)                                                               | X15   | Programs are pure functions over fixed inputs; random inputs (stress tests) use a fixed seed.                                                                                                                                                                                                       |
| [`system-design-interview`](../syllabus/courses/system-design-interview.md)                                                 | X17   | Capacity and availability scenarios compute numbers by hand; they stay in the lesson as worked arithmetic with units, not as programs.                                                                                                                                                              |
| [`detection-engineering-and-siem-operations`](../syllabus/courses/detection-engineering-and-siem-operations.md)             | X17   | A real SIEM (Wazuh, Elastic, Splunk) is not in the catalog and would need network and a service. The lab parses decoders and rules itself in Python; rule-engine behaviour is a model and the lessons say so.                                                                                       |
| [`it-and-application-security`](../syllabus/courses/it-and-application-security.md)                                         | X16   | `argon2-cffi==25.1.0` and `cryptography==49.0.0` are pinned in two `requirements.txt` files without hashes; the wheels for the catalog's Python 3.14 are proved by spike SP3.                                                                                                                       |
| [`it-and-application-security`](../syllabus/courses/it-and-application-security.md)                                         | X17   | Identity, SIEM, and cloud IAM scenarios need real services; the units model policy decisions (access checks, password-entropy arithmetic, log sampling) in Python on invented data.                                                                                                                 |
| [`offensive-security`](../syllabus/courses/offensive-security.md)                                                           | X15   | 3 of the 4 files mention `localhost` or `127.0.0.1` as scope strings (the scope checker rejects any other target); none opens a socket, and the units keep it that way.                                                                                                                             |
| [`offensive-security`](../syllabus/courses/offensive-security.md)                                                           | X17   | A vulnerable target (Juice Shop, DVWA) and an attack tool (nmap, sqlmap, Metasploit) are named but cannot run here. The units model the target as an in-process Python object with inert fixture strings, and the lessons say that no real tool runs.                                               |
| [`security-essentials`](../syllabus/courses/security-essentials.md)                                                         | X15   | 58 of 132 files use network words (`localhost`, `urllib`, `socket`), 26 a database, 15 a random source, 10 a clock; sockets and servers become in-process calls, hashing salts and tokens use a fixed seed, and times come from a counter clock.                                                    |
| [`security-essentials`](../syllabus/courses/security-essentials.md)                                                         | X16   | FastAPI and Pydantic appear in 2 pinned mentions; the stack has no hash-locked requirements file (spike SP4 locks it once for the course).                                                                                                                                                          |
| [`security-essentials`](../syllabus/courses/security-essentials.md)                                                         | X17   | 2 files use `docker`/`sudo`-style system words and 1 a Windows API; they become illustrations or models.                                                                                                                                                                                            |

Rules for every unit in this plan (these restate plan 05's rules for the cases this plan meets most):

- **DR1.** No clock read reaches output or control flow. Pass a value in, use a counter clock, or use a virtual clock
  (queues, caches, retries, serving, and timers).
- **DR2.** Every random generator has an explicit seed written in the code; `PYTHONHASHSEED=0` is set by the harness,
  and a property test uses a derandomized runner (spike SP10).
- **DR3.** Hash-map and set iteration order never reaches output; sort first. Output never depends on thread or task
  order; join and print in a fixed order, or follow the simulation convention.
- **DR4.** No network, even to `localhost`: web and API calls go through an in-process application object or a test
  client, and no unit listens on a port. The one exception is an `AF_UNIX` socket under `/tmp` in
  `linux-app-development`, which is a local file and not the network.
- **DR5.** Every third-party package is in a hash-locked file declared in `dependencies.lockfile`; nothing is
  downloaded at run time, and a package without a wheel for the pinned Python is replaced or the unit is rewritten
  (spikes SP3 and SP4).
- **DR6.** An AI example reads no key or provider variable and makes no call to a hosted model; the model is a
  scripted `FakeModel` and the responses are recorded files (policy AI1 to AI6).
- **DR7.** A recorded transcript and the lesson text name the version the harness ran, taken from the catalog pin
  (Python 3.14.8, not 3.13; TypeScript 7.0; Kotlin 2.4; Swift 6.4; Dart 3.13; Flutter 3.41; .NET 10).
- **DR8.** Output never carries an absolute path, a host name, a user name, a temporary-folder name (`mktemp`), a
  process or thread identifier, or an address outside the reserved ranges (SEC1).

A fix that makes a unit pass by loosening its check (`stdout: ignore` on an example that prints something meaningful,
a longer timeout to hide a hang, retrying) is forbidden; the root cause is fixed (this repository's flaky-test rule).

## Phase 1 Spikes

A **spike** is a small proof that one hard case works before a course depends on it. Phase 1 builds each spike as a
throwaway unit in the execution worktree (under `local-tmp/`, not committed), runs it through the harness twice, and
records the result in the ledger as `pass` or `fail`, with the measured seconds. A failed spike does not stop the plan:
it selects the fallback in the table, and the brief of each affected course already describes it. Four spikes (SP2,
SP7, SP9, and SP13) also feed the toolchain budget rule in [004](./004-toolchain-additions-and-ci-cost.md#the-toolchain-budget-rule);
none adds a toolchain by itself.

| Spike | Topic                                  | Question                                                                                                                                                                                                                                                                                                                                                                                | If it passes                                                                                                 | If it fails                                                                                                                                                             | Courses                                                                                                                                                                                                                                                                                                                                                             |
| ----- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SP1   | Locked jsdom test stack                | Does a hash-locked `package-lock.json` (jsdom, a test runner, and the DOM testing library) install from `dependencies.lockfile` with the network off under `typescript` and give byte-identical output on two runs for five DOM shapes (click events, form submit, focus order, an async state update, an accessibility-tree query)?                                                    | DOM-semantic examples run for real in jsdom; no catalog change                                               | The DOM examples become Node models of the DOM subset they teach, labelled as models, and the browser launch lines are illustrations                                    | `advanced-frontend`, `build-your-own-reactive-ui`, `capstone-full-stack-app`, `frontend-essentials`                                                                                                                                                                                                                                                                 |
| SP2   | Headless Chromium cost (decision D5)   | What would a headless Chromium toolchain cost (image size, start-up per unit, build time) and is computed layout byte-identical across two runs and two CPU quotas? The result feeds the budget rule in 004; it does not add the toolchain by itself.                                                                                                                                   | Only if the budget rule also passes, candidate C1 becomes GO and the layout models are replaced by real runs | Default: about 14 layout examples become Node models of the CSS algorithm they teach (box sizes, flex distribution, grid tracks, breakpoints), labelled as models       | `frontend-essentials`                                                                                                                                                                                                                                                                                                                                               |
| SP3   | Locked numeric and crypto wheels       | Do hash-locked cp314 wheels for `numpy`, `scipy`, `scikit-learn`, `statsmodels`, `cryptography`, and `argon2-cffi` install offline on amd64 and arm64 and give identical output with `OMP_NUM_THREADS=1`?                                                                                                                                                                               | Statistics, crypto, and password examples run for real from a course lock                                    | Standard-library implementations (`statistics`, `hashlib`, `hmac`) where the lesson allows; the library call is an illustration within the budget                       | `capstone-first-working-software`, `statistics-for-evaluation`, `it-and-application-security`                                                                                                                                                                                                                                                                       |
| SP4   | Locked FastAPI stack                   | Do hash-locked cp314 wheels for `fastapi`, `starlette`, `pydantic`, `flask`, `httpx`, `aiosqlite`, `pytest`, and `pytest-asyncio` install offline on both architectures, and does one lock content serve every course that uses the stack (one environment image)?                                                                                                                      | In-process service examples run for real; one environment image per distinct lock content                    | A package without a cp314 wheel is replaced by the standard library where the lesson allows, or the unit is rewritten; the architecture split is recorded               | `async-python-and-fastapi-services`, `backend-essentials`, `capstone-first-working-software`, `capstone-full-stack-app`, `security-essentials`                                                                                                                                                                                                                      |
| SP5   | Flutter start-up and determinism       | What does one `flutter test` invocation cost offline from a `pubspec.lock`, and is the output identical on two runs? Which examples are pure Dart (`dart`) and which need the widget binding (`flutter`)?                                                                                                                                                                               | Widget and state examples are `flutter test` units; the measured seconds replace the planning figure         | Widget examples become pure Dart models of the widget tree, labelled as models; the `flutter` launch lines are illustrations                                            | `hybrid-app-development`                                                                                                                                                                                                                                                                                                                                            |
| SP6   | Swift on Linux: real or static         | Which `ios-app-development` examples compile and run for real under `swift` 6.4 on Linux (Foundation, concurrency, Codable, view-model logic), and which import SwiftUI, UIKit, or Combine and fall to `swift-parse`?                                                                                                                                                                   | A list that sorts all 78 examples into real units and static units                                           | Examples that neither run nor parse become illustrations within the budget of 12; any excess is reported to the user                                                    | `ios-app-development`                                                                                                                                                                                                                                                                                                                                               |
| SP7   | ktlint parse-only and Kotlin logic     | Does `ktlint` with its standard rules off fail on a syntax error and pass valid Compose and androidx files, and does `kotlinc` compile the framework-free logic units, with identical output on two runs?                                                                                                                                                                               | Compose and androidx files are static units (reason `android`); logic units run for real                     | Compose files become illustrations next to a Kotlin model of the state logic; the budget rise is recorded and reported (a stronger Android validator stays a known gap) | `android-app-development`                                                                                                                                                                                                                                                                                                                                           |
| SP8   | Windows validators                     | Which Windows example files can the merged `windows-static` validator and `dotnet` with `-p:EnableWindowsTargeting=true` check (Win32 C, PowerShell, WPF, WinForms, WinUI project and XAML files), what does each run prove, and is the output identical on two runs?                                                                                                                   | Project and XAML units are static (reason `windows`) with a note that says what the run proves               | A well-formedness and required-property check under `python` (still `mode: static`, reason `windows`); the build claim leaves the lesson                                | `windows-app-development`                                                                                                                                                                                                                                                                                                                                           |
| SP9   | Wheel-bundled Python type checker      | Does a type checker that ships as a wheel (first `basedpyright`, which bundles its Node runtime, then `mypy`) run offline from a hash-locked lock as a `kind: check` run with byte-identical output on two runs and two CPU quotas? (`pyright` itself downloads Node at first use and is not in the catalog.)                                                                           | The `# pyright: strict` directive lines have a real check behind them in the units that teach typing         | The check line is an illustration within the budget, and the directive lines are removed from the files that no checker reads                                           | `api-design`, `backend-at-scale`, `backend-essentials`, `build-your-own-web-framework`                                                                                                                                                                                                                                                                              |
| SP10  | Property-test determinism              | With `derandomize=True` and no example database, are Hypothesis runs identical on two runs and two CPU quotas?                                                                                                                                                                                                                                                                          | Property-based examples run for real with a fixed seed                                                       | The examples use a seeded generator written in the unit (a hand-rolled property loop)                                                                                   | `capstone-first-working-software`                                                                                                                                                                                                                                                                                                                                   |
| SP11  | In-process attacks and the safety scan | Can every security and permission example run its target in process (a framework test client or a model), with no listening socket, under `--network none`, and does the banned-API and address scan of [012](./012-safe-lab-and-content-safety-rules.md#the-three-checks) pass on the converted units?                                                                                 | Safe-lab rules SL1 to SL4 hold for every unit                                                                | The example becomes a data-table model of the attack's observable effect, and the scan list records the reason                                                          | `capstone-first-working-software`, `agent-permissions-and-sandboxing`, `detection-engineering-and-siem-operations`, `it-and-application-security`, `offensive-security`, `security-essentials`                                                                                                                                                                      |
| SP12  | Shared scripted fake model             | Does one shared kit (a scripted `FakeModel` with a response queue and a recorded-response lookup, a counter clock, and a fixed-seed tool set) serve the agent loop, tool call, memory, orchestration, permission, and evaluation examples of the 14 AI courses with byte-identical output and no key or network? How big is the kit, and how many examples need a second fixture shape? | One kit per course under `learning/code/`, imported with `PYTHONPATH=..`; policy AI1 to AI6 holds            | A per-unit scripted function (no kit), or a pure-function model of the mechanism; the kit's absence is recorded                                                         | `agent-context-and-memory`, `agent-orchestration-subagents-and-observability`, `agent-permissions-and-sandboxing`, `agent-tools-and-mcp`, `agentic-ai`, `agentic-coding`, `creating-ai-powered-apps`, `evaluating-ai-output-essentials`, `evaluating-ai-systems-in-depth`, `fine-tuning-and-adaptation`, `inference-serving-and-model-deployment`, `the-agent-loop` |
| SP13  | Linux application model                | Which `linux-app-development` examples run for real in the container (argument parsing, streams, files, in-process signals, `AF_UNIX` sockets under `/tmp`, subprocesses of `python3`, `echo`, and `cat`), and which need a model (a systemd unit, a GUI toolkit, a desktop launch)?                                                                                                    | A list of real and modelled examples; the models state what they do not prove                                | More examples become models; C3 (a headless GUI toolkit) stays NO-GO                                                                                                    | `linux-app-development`                                                                                                                                                                                                                                                                                                                                             |

## Static Mode

Static mode proves a configuration is well formed; it does not prove the configuration works. The plan uses only the
reasons plan 05 allows (`android`, `ios`, `windows`) and never adds one. A static unit carries `static.note`, and the
lesson repeats the sentence beside the fence, so a reader never takes a parse for a build.

| Course                    | Validator        | `static.reason` | What the run proves                                                                                                                                                                                                                                                                              |
| ------------------------- | ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `android-app-development` | `ktlint`         | `android`       | The `ktlint` run proves each Compose or androidx file is syntactically valid Kotlin. It does not prove that `androidx.*` symbols resolve, that the module builds, or that the screen renders or survives a configuration change.                                                                 |
| `ios-app-development`     | `swift-parse`    | `ios`           | The `swift-parse` run (`swiftc -parse`) proves each UI file is syntactically valid Swift. It does not prove that SwiftUI or UIKit symbols exist, that types check, or that a screen renders or behaves; those frameworks exist only on Apple platforms.                                          |
| `windows-app-development` | `windows-static` | `windows`       | The `windows-static` run proves that a WPF or WinForms project compiles against the Windows targeting pack and that WinUI project files and XAML are well formed and carry the required properties. It does not run any window, prove WinUI 3 compilation, or exercise the Windows message loop. |

Rules for static units:

1. **Split by import, not by course.** A file that imports no platform framework runs for real in the language
   toolchain (reducers, repositories over fakes, formatting, validation, view-model logic). Only a file that imports
   the platform (`android.*`, `androidx.*`, Compose, SwiftUI, UIKit, Combine, WPF, WinForms, WinUI) is static.
2. **Say what is not proved.** Each static fence is followed by a sentence in plain words, for example "This file is
   parsed as Swift; SwiftUI is not available here, so the layout and behaviour are not checked."
3. **No static unit hides a failing real run.** A file that could run is never marked static to pass; the Content
   Quality Gate reads the split.
4. **Known gaps stay gaps.** A stronger Android validator and WinUI 3 compilation are not added (decision D9); the
   lessons that need them show launch illustrations within the budget.

## Illustration Policy

A code fence that is neither anchored nor an illustration is a sync finding (`unanchored-fence`). A fence may be marked
`<!-- harness: illustration -->` only when it is not meant to run as shown.

**Allowed:** an install or launch line for a tool the harness does not host (a browser, an emulator, `systemctl`,
Xcode, Android Studio, a hosted-model request); a pseudo-code fragment; a deliberately broken snippet that the lesson
explains; a file the toolchain cannot parse offline.

**Not allowed:** a program that could run (it becomes a unit); a fragment of a larger file (it becomes a range anchor,
`path#Lx-Ly`); a line that is marked an illustration only to avoid recording its output; an attack payload that works
against real software (rule S3).

Each brief carries a budget. The budgets add up to 274 illustration fences against 755
unanchored code fences today. `examples coverage` reports the count per course; the Content Quality Gate judges
whether each one is justified, and the completion test does not count them (a count in a test would fix the budget,
and the briefs may change after the first audit).

| Course                                                                                                                      | Illustration budget (fences that may stay unanchored)                                                                   |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`advanced-frontend`](../syllabus/courses/advanced-frontend.md)                                                             | At most 8 fences (launch lines for a bundler or dev server and the browser DevTools steps).                             |
| [`android-app-development`](../syllabus/courses/android-app-development.md)                                                 | At most 12 fences (Android Studio, emulator, Gradle, and device install lines).                                         |
| [`api-design`](../syllabus/courses/api-design.md)                                                                           | At most 6 fences (`curl` lines and the type-checker invocation if SP9 fails).                                           |
| [`async-python-and-fastapi-services`](../syllabus/courses/async-python-and-fastapi-services.md)                             | At most 8 fences (`uvicorn`, `uv`, and `docker` launch lines).                                                          |
| [`backend-at-scale`](../syllabus/courses/backend-at-scale.md)                                                               | At most 6 fences (Redis, broker, and load-test launch lines).                                                           |
| [`backend-essentials`](../syllabus/courses/backend-essentials.md)                                                           | At most 10 fences (`curl`, `uvicorn`, and multi-process launch lines).                                                  |
| [`build-your-own-reactive-ui`](../syllabus/courses/build-your-own-reactive-ui.md)                                           | At most 6 fences (browser mount lines).                                                                                 |
| [`build-your-own-web-framework`](../syllabus/courses/build-your-own-web-framework.md)                                       | At most 6 fences (server launch lines).                                                                                 |
| [`capstone-first-working-software`](../syllabus/courses/capstone-first-working-software.md)                                 | At most 6 fences (install and `uvicorn` launch lines).                                                                  |
| [`capstone-full-stack-app`](../syllabus/courses/capstone-full-stack-app.md)                                                 | At most 6 fences (dev-server and `npm install` lines).                                                                  |
| [`frontend-essentials`](../syllabus/courses/frontend-essentials.md)                                                         | At most 8 fences (Playwright launch lines and browser DevTools steps).                                                  |
| [`hybrid-app-development`](../syllabus/courses/hybrid-app-development.md)                                                   | At most 12 fences (`flutter create`, emulator, device, and store-packaging lines).                                      |
| [`information-architecture-and-seo`](../syllabus/courses/information-architecture-and-seo.md)                               | At most 6 fences (search-console and browser-extension steps).                                                          |
| [`ios-app-development`](../syllabus/courses/ios-app-development.md)                                                         | At most 12 fences (Xcode, simulator, TestFlight, and device lines).                                                     |
| [`linux-app-development`](../syllabus/courses/linux-app-development.md)                                                     | At most 8 fences (`systemctl`, package-manager, and desktop-launch lines).                                              |
| [`windows-app-development`](../syllabus/courses/windows-app-development.md)                                                 | At most 10 fences (`dotnet new winui`, Visual Studio, and MSIX packaging lines).                                        |
| [`agent-context-and-memory`](../syllabus/courses/agent-context-and-memory.md)                                               | At most 8 fences (real SDK calls for hosted memory features, shown with a dated Reference).                             |
| [`agent-orchestration-subagents-and-observability`](../syllabus/courses/agent-orchestration-subagents-and-observability.md) | At most 8 fences (product-specific hook and skill configuration files, shown with a dated Reference).                   |
| [`agent-permissions-and-sandboxing`](../syllabus/courses/agent-permissions-and-sandboxing.md)                               | At most 8 fences (real `bubblewrap`, `seccomp`, and container commands, shown as illustrations with the safety banner). |
| [`agent-tools-and-mcp`](../syllabus/courses/agent-tools-and-mcp.md)                                                         | At most 8 fences (real SDK server and client lines, and client configuration files, shown with a dated Reference).      |
| [`agentic-ai`](../syllabus/courses/agentic-ai.md)                                                                           | At most 8 fences (framework and hosted-agent calls, shown with a dated Reference).                                      |
| [`agentic-coding`](../syllabus/courses/agentic-coding.md)                                                                   | At most 24 fences (agent prompts, JSON tool traces, and diffs that no file stands behind).                              |
| [`creating-ai-powered-apps`](../syllabus/courses/creating-ai-powered-apps.md)                                               | At most 8 fences (hosted SDK calls and `pip install` lines, shown with a dated Reference).                              |
| [`evaluating-ai-output-essentials`](../syllabus/courses/evaluating-ai-output-essentials.md)                                 | At most 4 fences (hosted evaluation-service screenshots and CLI lines).                                                 |
| [`evaluating-ai-systems-in-depth`](../syllabus/courses/evaluating-ai-systems-in-depth.md)                                   | At most 4 fences (hosted judge-model calls).                                                                            |
| [`fine-tuning-and-adaptation`](../syllabus/courses/fine-tuning-and-adaptation.md)                                           | At most 8 fences (hosted fine-tuning API calls and GPU launch lines).                                                   |
| [`inference-serving-and-model-deployment`](../syllabus/courses/inference-serving-and-model-deployment.md)                   | At most 4 fences (`vllm serve` and Kubernetes manifests).                                                               |
| [`product-patterns-for-probabilistic-systems`](../syllabus/courses/product-patterns-for-probabilistic-systems.md)           | None.                                                                                                                   |
| [`statistics-for-evaluation`](../syllabus/courses/statistics-for-evaluation.md)                                             | At most 2 fences (`pip install` lines).                                                                                 |
| [`the-agent-loop`](../syllabus/courses/the-agent-loop.md)                                                                   | At most 4 fences (hosted API calls).                                                                                    |
| [`analytics-and-experimentation`](../syllabus/courses/analytics-and-experimentation.md)                                     | At most 4 fences (vendor analytics dashboards and SQL for a warehouse).                                                 |
| [`engineering-management`](../syllabus/courses/engineering-management.md)                                                   | None.                                                                                                                   |
| [`project-management`](../syllabus/courses/project-management.md)                                                           | None.                                                                                                                   |
| [`software-product-engineering`](../syllabus/courses/software-product-engineering.md)                                       | None.                                                                                                                   |
| [`technical-communication`](../syllabus/courses/technical-communication.md)                                                 | None.                                                                                                                   |
| [`behavioral-and-leadership-interviews`](../syllabus/courses/behavioral-and-leadership-interviews.md)                       | None.                                                                                                                   |
| [`capstone-interview-loop`](../syllabus/courses/capstone-interview-loop.md)                                                 | At most 4 fences (video-call and whiteboard tool screens).                                                              |
| [`coding-interview`](../syllabus/courses/coding-interview.md)                                                               | At most 4 fences (online-judge submission screens and editor settings).                                                 |
| [`system-design-interview`](../syllabus/courses/system-design-interview.md)                                                 | None.                                                                                                                   |
| [`take-home-and-live-coding`](../syllabus/courses/take-home-and-live-coding.md)                                             | At most 4 fences (editor screens and video-call settings).                                                              |
| [`detection-engineering-and-siem-operations`](../syllabus/courses/detection-engineering-and-siem-operations.md)             | At most 6 fences (SIEM console screens and collector configuration shown as text).                                      |
| [`it-and-application-security`](../syllabus/courses/it-and-application-security.md)                                         | At most 4 fences (cloud console and identity-provider screens).                                                         |
| [`it-governance-grc`](../syllabus/courses/it-governance-grc.md)                                                             | None.                                                                                                                   |
| [`offensive-security`](../syllabus/courses/offensive-security.md)                                                           | At most 10 fences (tool command lines (shown with the authorization banner) and lab-setup steps).                       |
| [`security-essentials`](../syllabus/courses/security-essentials.md)                                                         | At most 10 fences (`openssl`, `curl`, and `docker` lines).                                                              |

## Authoring Workflow for One Unit

Plan 05's decision D21 sets the order, because the commit hook formats code files but no longer reformats code inside
lesson fences:

1. Edit the code file.
2. Format it with the repository formatter for its language (`ruff` for Python, Prettier for TypeScript, JSON, and
   Markdown, `shfmt` for shell, `csharpier` for C#). Kotlin, Swift, and Dart have no repository formatter in the hook
   as of 2026-10-09 (Phase 0 re-reads this); keep their style as the lesson shows it, and run the catalog's validator
   (`ktlint`, `swift-parse`) where one exists.
3. `EX-SYNC-WRITE` repairs every anchored fence from its file.
4. `EX-RECORD` writes only missing expected files; delete a stale expected file first when the output legitimately
   changed.
5. Read every recorded file. A recorded file that holds an error message, a path, a timestamp, an address, a key, or a
   stack trace is a finding, not an expectation.
6. `EX-CHECK` runs every unit twice and compares bytes.

For an AI unit, step 1 also writes the recorded response files, and step 5 also reads them against policy AI1 to AI6.
For a security unit, step 5 also runs the safety scan of [012](./012-safe-lab-and-content-safety-rules.md#the-three-checks).

## Wiring Lessons to Units

A lesson shows the program and its output, each tied to a file:

- A path-label anchor for the program (``**`learning/code/ex-12-…/main.py`**``), or a labelled-path anchor with a
  caption (``**Before** (`drilling/code/kata-03-…/before/kata.py`)``).
- A labelled-path anchor for the output (``**Output** (`learning/code/ex-12-…/expected/main.stdout.txt`):``).
- A range anchor (`#Lx-Ly`) for a long file shown in parts. The Windows and Android courses use range anchors where an
  excerpt stands today.
- A shared file (the AI kit, a lockfile) is anchored once, where the lesson first uses it.

`EX-SYNC` reports `unreferenced-unit` for a unit no lesson shows, so every created unit needs its lesson, and every
lesson example needs its unit. Where `ios-app-development` and `hybrid-app-development` have 78 examples and no unit
folder, and `agent-context-and-memory` has 48 programs and 1,700 words, that is the main authoring work of the audit.
