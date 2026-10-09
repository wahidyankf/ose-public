# 003 — Harness Conversion Design

Plan 05 built the harness and defined the `ayokoding.run/v1` contract; this plan makes 31 existing
courses meet it. This page says how a course that has code files, inline programs, or no code at all
becomes a set of deterministic units, which spikes prove the hard cases first, and where a lesson may show
code that does not run. It does not restate the contract: plan 05's `run.yaml` field guide, anchor grammar,
fence classes, and simulation convention (rules S1 to S9) apply unchanged, and any defect in the harness is
fixed in `apps/ayokoding-cli` with a regression test (plan 05's migration step M11), never by weakening a
course check (decision D16).

## Starting Points

Every course starts in one of three positions. "Create" means a unit folder that does not exist today;
"convert" means a folder that exists and needs a `run.yaml`, expected files, and anchors. Totals: 826
to create and 1,745 to convert, for 2,571 target units.

| Course                                                                                            | Target units (examples / katas / capstone) | Folders today (examples / katas) | Create | Convert | Starting point          |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------- | ------ | ------- | ----------------------- |
| [`browser-automation-with-cdp`](../syllabus/courses/browser-automation-with-cdp.md)               | 75 / 8 / 1                                 | 59 / 0                           | 25     | 59      | mixed                   |
| [`build-automation-and-task-runners`](../syllabus/courses/build-automation-and-task-runners.md)   | 80 / 8 / 1                                 | 79 / 0                           | 10     | 79      | convert in place        |
| [`building-production-cli-tools`](../syllabus/courses/building-production-cli-tools.md)           | 78 / 8 / 1                                 | 78 / 0                           | 8      | 79      | convert in place        |
| [`capstone-forge-ready`](../syllabus/courses/capstone-forge-ready.md)                             | 45 / 5 / 1                                 | 0 / 0                            | 50     | 1       | create from the lessons |
| [`debugging-and-profiling`](../syllabus/courses/debugging-and-profiling.md)                       | 80 / 8 / 1                                 | 80 / 0                           | 8      | 81      | convert in place        |
| [`extending-neovim`](../syllabus/courses/extending-neovim.md)                                     | 80 / 8 / 1                                 | 80 / 8                           | 0      | 89      | convert in place        |
| [`just-enough-nvim`](../syllabus/courses/just-enough-nvim.md)                                     | 91 / 8 / 1                                 | 91 / 8                           | 0      | 100     | convert in place        |
| [`software-engineering-practices`](../syllabus/courses/software-engineering-practices.md)         | 29 / 5 / 1                                 | 28 / 0                           | 6      | 29      | convert in place        |
| [`software-testing`](../syllabus/courses/software-testing.md)                                     | 86 / 8 / 1                                 | 86 / 0                           | 8      | 87      | convert in place        |
| [`version-control-and-git`](../syllabus/courses/version-control-and-git.md)                       | 82 / 8 / 1                                 | 82 / 8                           | 0      | 91      | convert in place        |
| [`just-enough-bash`](../syllabus/courses/just-enough-bash.md)                                     | 83 / 8 / 1                                 | 83 / 8                           | 0      | 92      | convert in place        |
| [`just-enough-c`](../syllabus/courses/just-enough-c.md)                                           | 78 / 8 / 1                                 | 78 / 0                           | 8      | 79      | convert in place        |
| [`just-enough-cpp`](../syllabus/courses/just-enough-cpp.md)                                       | 75 / 8 / 1                                 | 75 / 0                           | 9      | 75      | convert in place        |
| [`just-enough-csharp`](../syllabus/courses/just-enough-csharp.md)                                 | 78 / 8 / 1                                 | 78 / 5                           | 3      | 84      | convert in place        |
| [`just-enough-dart`](../syllabus/courses/just-enough-dart.md)                                     | 78 / 8 / 1                                 | 0 / 0                            | 86     | 1       | create from the lessons |
| [`just-enough-elixir`](../syllabus/courses/just-enough-elixir.md)                                 | 78 / 8 / 1                                 | 78 / 0                           | 8      | 79      | convert in place        |
| [`just-enough-go`](../syllabus/courses/just-enough-go.md)                                         | 78 / 8 / 1                                 | 78 / 5                           | 3      | 84      | convert in place        |
| [`just-enough-java`](../syllabus/courses/just-enough-java.md)                                     | 80 / 8 / 1                                 | 80 / 0                           | 8      | 81      | convert in place        |
| [`just-enough-kotlin`](../syllabus/courses/just-enough-kotlin.md)                                 | 78 / 8 / 1                                 | 0 / 0                            | 86     | 1       | create from the lessons |
| [`just-enough-lua`](../syllabus/courses/just-enough-lua.md)                                       | 84 / 8 / 1                                 | 84 / 8                           | 0      | 93      | convert in place        |
| [`just-enough-python`](../syllabus/courses/just-enough-python.md)                                 | 84 / 8 / 1                                 | 84 / 8                           | 0      | 93      | convert in place        |
| [`just-enough-rust`](../syllabus/courses/just-enough-rust.md)                                     | 78 / 8 / 1                                 | 0 / 0                            | 86     | 1       | create from the lessons |
| [`just-enough-swift`](../syllabus/courses/just-enough-swift.md)                                   | 78 / 8 / 1                                 | 0 / 0                            | 86     | 1       | create from the lessons |
| [`just-enough-typescript`](../syllabus/courses/just-enough-typescript.md)                         | 82 / 8 / 1                                 | 82 / 8                           | 0      | 91      | convert in place        |
| [`bare-metal-virtualization`](../syllabus/courses/bare-metal-virtualization.md)                   | 80 / 8 / 1                                 | 0 / 0                            | 89     | 0       | create from the lessons |
| [`cicd-and-release-engineering`](../syllabus/courses/cicd-and-release-engineering.md)             | 83 / 8 / 1                                 | 83 / 0                           | 8      | 84      | convert in place        |
| [`cloud-and-iac`](../syllabus/courses/cloud-and-iac.md)                                           | 30 / 5 / 1                                 | 25 / 0                           | 11     | 25      | mixed                   |
| [`containers-and-orchestration`](../syllabus/courses/containers-and-orchestration.md)             | 83 / 8 / 1                                 | 2 / 0                            | 90     | 2       | create from the lessons |
| [`platform-engineering-and-devex`](../syllabus/courses/platform-engineering-and-devex.md)         | none (no code)                             | -                                | -      | -       | -                       |
| [`self-hosting-essentials`](../syllabus/courses/self-hosting-essentials.md)                       | 78 / 8 / 1                                 | 78 / 4                           | 4      | 83      | convert in place        |
| [`self-managed-kubernetes-and-gitops`](../syllabus/courses/self-managed-kubernetes-and-gitops.md) | 82 / 8 / 1                                 | 0 / 0                            | 91     | 0       | create from the lessons |
| [`site-reliability-engineering`](../syllabus/courses/site-reliability-engineering.md)             | 30 / 5 / 1                                 | 0 / 0                            | 35     | 1       | create from the lessons |

## Conversion Families

Seven families cover every course. A course may use more than one; the brief names them.

| Family        | When it applies                                                                                                  | What the unit does                                                                                                                                       | Courses (main users)                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| F1 Real run   | The program runs offline in a catalog toolchain                                                                  | Runs the program for real; the expected file holds the real bytes                                                                                        | All 14 language primers; the Python, Go, Rust, and shell examples of the tools courses                                                  |
| F2 Replay     | The example is a keystroke transcript                                                                            | Replays the keys headless in Neovim and prints the buffer; the expected file is the buffer                                                               | `just-enough-nvim`, `extending-neovim`, `capstone-forge-ready`                                                                          |
| F3 Model      | The lesson teaches a tool the sandbox cannot host (a hypervisor, `perf`, a cloud API, a cluster, `systemctl`)    | A small deterministic Python or shell program models what the tool reports or decides; the lesson says it is a model; the launch line is an illustration | `bare-metal-virtualization`, `self-hosting-essentials`, `self-managed-kubernetes-and-gitops`, `debugging-and-profiling`                 |
| F4 Static     | The artifact is configuration that a validator can check offline (OpenTofu, Kubernetes manifests, Swift UI code) | Runs the validator (`mode: static` with a `static.reason`); the lesson says it is validated, not applied                                                 | `cloud-and-iac`, `bare-metal-virtualization`, `containers-and-orchestration`, `self-managed-kubernetes-and-gitops`, `just-enough-swift` |
| F5 Simulation | The behaviour depends on time, faults, or interleaving                                                           | Follows plan 05's simulation convention: virtual clock, seeded faults, a fixed seed set, `simulation: true`                                              | `site-reliability-engineering`, the last examples of `browser-automation-with-cdp`                                                      |
| F6 Check      | The lesson's claim is a rule over a file (a workflow, a Dockerfile, a Compose file, a script lint)               | A `kind: check` run applies a locked linter or schema, or a small parser asserts the rule                                                                | `cicd-and-release-engineering`, `containers-and-orchestration`, `self-hosting-essentials`, `just-enough-bash`                           |
| F7 No code    | A leadership course with no programs                                                                             | No unit and no `run.yaml`; the course is "not applicable" in the coverage report                                                                         | `platform-engineering-and-devex`                                                                                                        |

**The honesty rule (decision D12).** F3 and F4 teach less than a real run, and the lesson says so in one
sentence beside the fence, in plain words, for example "This models what the hypervisor reports; it does not
start a virtual machine." The Content Quality Gate checks that the sentence is present wherever a unit is a
model or a static check. A modelled example is never described as the real tool.

## Unit Shapes and `run.yaml` Templates

Each template shows the fields a maker fills in. Paths are unit-relative. The field names and rules are plan
05's; nothing here adds a field. Expected files are `.txt` and are written by `EX-RECORD` and then read by a
person, never typed by hand.

**1. A script example (Python, Bash, Lua, Elixir, Node).**

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

**2. A compiled example (C, C++, Rust, Kotlin, C#).** The command is argv with no shell, so a build and run
pair goes into `run.sh`, and the build output goes to `/tmp` (the unit folder is a throwaway copy, but keeping
binaries out of it keeps the layout clean).

```yaml
schema: ayokoding.run/v1
toolchain: gcc
runs:
  - name: main
    command: [bash, run.sh]
    timeout: 60s
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

**3. An example with a lockfile and tests (Python packages, Go modules, Rust crates).** The lockfile is a
shared file under the code root, and the harness builds one environment image per lockfile.

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

**4. A Git or shell example with fixed identity and dates (rule DR4 below).**

```yaml
schema: ayokoding.run/v1
toolchain: shell
runs:
  - name: main
    command: [bash, run.sh]
    env:
      GIT_AUTHOR_NAME: Ada Example
      GIT_AUTHOR_EMAIL: ada@example.com
      GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z"
      GIT_COMMITTER_NAME: Ada Example
      GIT_COMMITTER_EMAIL: ada@example.com
      GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z"
      GIT_CONFIG_GLOBAL: /dev/null
      GIT_PAGER: cat
      GIT_EDITOR: "true"
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

**5. A static validation (OpenTofu, `kubeconform`, `swift-parse`).** `mode: static` forbids services and needs
a reason and a note that says what the run proves.

```yaml
schema: ayokoding.run/v1
toolchain: opentofu
mode: static
static:
  reason: cloud
  note: The provider needs a cloud account, so the configuration is validated against the provider schema but never applied.
dependencies:
  lockfile: learning/code/.terraform.lock.hcl
runs:
  - name: validate
    kind: check
    command: [bash, run.sh]
    expect:
      exit: 0
      stdout: expected/validate.stdout.txt
```

**6. A keystroke replay (Neovim).** The unit holds `before.txt`, `keys.vim`, and the expected buffer; the exact
`run.sh` line is fixed by spike SP1 and then shared by every replay unit.

```yaml
schema: ayokoding.run/v1
toolchain: neovim
runs:
  - name: main
    command: [bash, run.sh]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

**7. A kata.** The unit has `before/` and `after/` subfolders; the `before` run may expect a non-zero exit,
because the kata starts from a broken program.

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

**8. A simulation.** Use plan 05's simulation convention (rules S1 to S9): a virtual clock, seeded faults, a
fixed seed set of at least 32 seeds, and the summary line.

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, main.py]
    simulation: true
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

## Determinism and the Gaps Found

The baseline survey found nondeterminism, dependency, and tool gaps in 20 courses (classes X15, X16, X17).
These are the measured findings; each brief carries its own line.

| Course                                                                                            | Class | Finding (measured 2026-10-09)                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`build-automation-and-task-runners`](../syllabus/courses/build-automation-and-task-runners.md)   | X17   | Four of the tools the lessons teach are not in the catalog: `just`, Gradle, Bazel (and Make needs the `gcc` image).                                                                                                   |
| [`building-production-cli-tools`](../syllabus/courses/building-production-cli-tools.md)           | X16   | Cobra (Go) and clap (Rust) need lockfiles with hashes (`go.sum`, `Cargo.lock`).                                                                                                                                       |
| [`capstone-forge-ready`](../syllabus/courses/capstone-forge-ready.md)                             | X15   | `vim.pack.add` fetches pinned plugins from GitHub, and pyright needs a language-server download; neither can run with the network off.                                                                                |
| [`debugging-and-profiling`](../syllabus/courses/debugging-and-profiling.md)                       | X15   | Clock use in 13 files, threads in 31, network use in 8; `cProfile`, `tracemalloc`, and `py-spy` outputs carry timings and addresses.                                                                                  |
| [`debugging-and-profiling`](../syllabus/courses/debugging-and-profiling.md)                       | X17   | `py-spy`, `perf`, `gdb`, and `lldb` need `ptrace` or perf events, which `--cap-drop ALL` removes (the `native-and-systems` page has 18 examples).                                                                     |
| [`extending-neovim`](../syllabus/courses/extending-neovim.md)                                     | X15   | 33 files use the network through `vim.pack.add` of GitHub URLs.                                                                                                                                                       |
| [`just-enough-nvim`](../syllabus/courses/just-enough-nvim.md)                                     | X17   | Some features cannot be replayed headless (UI popups, `:terminal`, mouse use).                                                                                                                                        |
| [`software-engineering-practices`](../syllabus/courses/software-engineering-practices.md)         | X15   | `mktemp` creates random directory names (a 28-folder code tree); `git` author and dates must be fixed.                                                                                                                |
| [`software-engineering-practices`](../syllabus/courses/software-engineering-practices.md)         | X17   | `gh` is used in 44 lines, `pre-commit` hooks need network installs.                                                                                                                                                   |
| [`software-testing`](../syllabus/courses/software-testing.md)                                     | X16   | Third-party packages: pytest, hypothesis, pytest-bdd, fastapi, pydantic, pact, behave, freezegun, httpx, uvicorn, testcontainers.                                                                                     |
| [`software-testing`](../syllabus/courses/software-testing.md)                                     | X17   | `testcontainers` needs a Docker daemon; two TypeScript files (Vitest, fast-check) are Node, not Python.                                                                                                               |
| [`version-control-and-git`](../syllabus/courses/version-control-and-git.md)                       | X15   | Commit hashes, timestamps, and author lines vary unless `GIT_AUTHOR_DATE`, `GIT_COMMITTER_DATE`, the author and committer names, `GIT_CONFIG_GLOBAL`, and the default branch are fixed. `mktemp` is used in 91 files. |
| [`just-enough-bash`](../syllabus/courses/just-enough-bash.md)                                     | X15   | `$RANDOM`, `$$`, `date`, and `mktemp` reach output in some examples; `trap` examples depend on signal timing.                                                                                                         |
| [`just-enough-bash`](../syllabus/courses/just-enough-bash.md)                                     | X17   | ShellCheck and shfmt are mentioned about 100 times, but the `shell` image does not contain them.                                                                                                                      |
| [`just-enough-cpp`](../syllabus/courses/just-enough-cpp.md)                                       | X17   | Sanitizers: the overview recommends `-fsanitize=address,undefined`. LeakSanitizer needs `ptrace`, which `--cap-drop ALL` removes. Three units (ex-51, ex-68, capstone) use `cmake`, which the `gcc` image may lack.   |
| [`just-enough-csharp`](../syllabus/courses/just-enough-csharp.md)                                 | X16   | xunit needs a NuGet lockfile (`packages.lock.json`) and an offline restore.                                                                                                                                           |
| [`just-enough-kotlin`](../syllabus/courses/just-enough-kotlin.md)                                 | X16   | The coroutine examples import `kotlinx.coroutines`, a library, resolved through Gradle (`kotlinx-coroutines-core:1.11.0`).                                                                                            |
| [`just-enough-python`](../syllabus/courses/just-enough-python.md)                                 | X16   | pytest appears in 3 files; ruff, black, and pyright are named in the overview. Pyright needs a Node download and is shown as an illustration.                                                                         |
| [`just-enough-typescript`](../syllabus/courses/just-enough-typescript.md)                         | X16   | eslint and prettier are npm packages and need a `package-lock.json`.                                                                                                                                                  |
| [`bare-metal-virtualization`](../syllabus/courses/bare-metal-virtualization.md)                   | X17   | Hypervisor commands (`virsh`, `qm`, `pvesh`) need a host; Terraform and Packer need their tools; the capstone has cloud-init, Packer, and Terraform files.                                                            |
| [`cicd-and-release-engineering`](../syllabus/courses/cicd-and-release-engineering.md)             | X17   | `kind` clusters, `docker`, and `gh` appear in a few lines; GitHub Actions cannot run here.                                                                                                                            |
| [`containers-and-orchestration`](../syllabus/courses/containers-and-orchestration.md)             | X17   | `docker`, `podman`, `kubectl`, and `kind` need a daemon or a cluster (214, 45, 156, and 75 mentions).                                                                                                                 |
| [`self-hosting-essentials`](../syllabus/courses/self-hosting-essentials.md)                       | X15   | Scripts call `ufw`, `systemctl`, `restic`, `curl`, `ssh`, and `ssh-keygen` (52, 51, 8, 23, 6, and 3 command lines), with 64 system and 49 network markers.                                                            |
| [`self-managed-kubernetes-and-gitops`](../syllabus/courses/self-managed-kubernetes-and-gitops.md) | X17   | `kubectl --dry-run=client` needs `kubectl`, which is not in the catalog.                                                                                                                                              |

Rules for every unit in this plan (these restate plan 05's rules for the cases this plan meets most):

- **DR1.** No clock read reaches output or control flow. Pass a value in, or use a virtual clock.
- **DR2.** Every random generator has an explicit seed written in the code.
- **DR3.** Hash-map and set iteration order never reaches output; sort first. Output never depends on
  thread or goroutine order; join and print in a fixed order, or use the simulation convention.
- **DR4.** Every Git example sets identity, dates, `GIT_CONFIG_GLOBAL`, `GIT_PAGER`, and `GIT_EDITOR` as in
  template 4, uses a fixed default branch, and never uses `mktemp` for a path that reaches output (91 files
  in `version-control-and-git` do today).
- **DR5.** No network, even to `localhost`, except declared services. Plugin managers and package
  installers run only against a vendored or `file://` fixture (spike SP2), never GitHub.
- **DR6.** A tool that needs `ptrace`, perf events, or a UI is modelled or shown as an illustration;
  no unit asks for capabilities the sandbox removes (`--cap-drop ALL`).
- **DR7.** A recorded transcript names the version the harness ran, taken from the catalog pin
  (Neovim 0.12.5, not 0.12.3 or 0.12.4).

A fix that makes a unit pass by loosening its check (`stdout: ignore` on an example that prints something
meaningful, a longer timeout to hide a hang, retrying) is forbidden; the root cause is fixed (this
repository's flaky-test rule).

## Phase 1 Spikes

A **spike** is a small proof that one hard case works before a course depends on it. Phase 1 builds each
spike as a throwaway unit in the execution worktree (under `local-tmp/`, not committed), runs it through the
harness twice, and records the result in the ledger as `pass` or `fail`, with the measured seconds. A failed
spike does not stop the plan: it selects the fallback in the last column, and the brief of each affected
course already describes it.

| Spike | Topic                           | Question                                                                                                                                                                                                                                                                        | If it passes                                                                                                      | If it fails                                                                                                                             | Courses                                                                                                                                                                                                                                                                                          |
| ----- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SP1   | Neovim keystroke replay         | Does `nvim -u NONE -i NONE -n --headless` replay five keystroke shapes (motion, change, `:s`, search, macro) and print the buffer, with byte-identical output on a double run?                                                                                                  | One replay unit design serves the 91 + 80 + 45 Neovim examples                                                    | The replay shapes that fail become labelled illustrations; at most 10 percent of `just-enough-nvim` (9 transcripts) may stay unreplayed | `capstone-forge-ready`, `extending-neovim`, `just-enough-nvim`                                                                                                                                                                                                                                   |
| SP2   | Neovim offline plugin seam      | Can `vim.pack.add` load plugins from `file://` fixture repositories or a vendored path inside the sandbox (needs `git` in the image)?                                                                                                                                           | Plugin examples run for real                                                                                      | The plugin step is a stub seam and the install line is a launch illustration                                                            | `capstone-forge-ready`, `extending-neovim`                                                                                                                                                                                                                                                       |
| SP3   | Locked wheels that bundle tools | Do hash-locked PyPI wheels (`rust-just`, `shellcheck-py`, `shfmt-py`, `ruff`, `check-jsonschema`) install from `dependencies.lockfile` with the network off and give identical output on two runs?                                                                              | The lint, build, and schema examples run for real; no catalog change                                              | Those examples become Python models, with the tool line as an illustration                                                              | `browser-automation-with-cdp`, `build-automation-and-task-runners`, `software-engineering-practices`, `just-enough-bash`, `just-enough-python`, `just-enough-typescript`, `bare-metal-virtualization`, `cicd-and-release-engineering`, `containers-and-orchestration`, `self-hosting-essentials` |
| SP4   | `gcc` image completeness        | Does the `gcc` image have Make and CMake, and does AddressSanitizer run with `ASAN_OPTIONS=detect_leaks=0`?                                                                                                                                                                     | C, C++, and Make units run for real                                                                               | CMake units become Makefile builds that teach the same idea; CMake files stay as illustrations (decision D5)                            | `build-automation-and-task-runners`, `just-enough-c`, `just-enough-cpp`                                                                                                                                                                                                                          |
| SP5   | .NET start-up cost              | What does one `dotnet` invocation cost with `DOTNET_CLI_TELEMETRY_OPTOUT`, `DOTNET_NOLOGO`, release configuration, and `--no-restore`, and is the output identical on two runs?                                                                                                 | The measured seconds replace the planning figure for C#                                                           | If the C# course cannot fit a shard, rung 4 of the ladder applies                                                                       | `just-enough-csharp`                                                                                                                                                                                                                                                                             |
| SP6   | Kotlin coroutines library       | Can the coroutine preview use a pinned `kotlinx-coroutines` jar, installed through plan 09's hash-locked jar recipe (a lockfile in the course, no catalog change) or baked into the `kotlin` image (a catalog change, budget-gated), and give identical output on a double run? | Option a, through the recipe if the merged `kotlin` entry can use it, otherwise only if decision D9's rule passes | Option b (default, decision D7): standard `kotlin.coroutines` primitives and `sequence`; the library lines are illustrations            | `just-enough-kotlin`                                                                                                                                                                                                                                                                             |
| SP7   | Gradle toolchain                | Would a `gradle` toolchain (Temurin 25 plus the Gradle distribution, SHA256-checked, `--offline`) fit the budget rule in 004 and give identical output?                                                                                                                         | A `gradle` toolchain for about 12 units, only if decision D9's rule passes                                        | Default (decision D6): a Python task-graph model, with the Groovy and Kotlin DSL shown as illustrations                                 | `build-automation-and-task-runners`, `just-enough-kotlin`                                                                                                                                                                                                                                        |
| SP8   | Caddy validation                | Would `caddy validate` as a toolchain fit the budget rule (about 13 units)?                                                                                                                                                                                                     | A `caddy` toolchain, only if decision D9's rule passes                                                            | Default: a Python structure check, labelled as a model                                                                                  | `self-hosting-essentials`                                                                                                                                                                                                                                                                        |
| SP9   | systemd validation              | Would `systemd-analyze verify` as a toolchain fit the budget rule (about 14 units)?                                                                                                                                                                                             | A `systemd-analyze` toolchain, only if decision D9's rule passes                                                  | Default: an INI parse with the unit-file rules the lesson teaches, labelled as a model                                                  | `self-hosting-essentials`                                                                                                                                                                                                                                                                        |
| SP10  | Git determinism                 | With `GIT_AUTHOR_*`, `GIT_COMMITTER_*`, `GIT_CONFIG_GLOBAL`, a fixed default branch, `GIT_PAGER=cat`, and `GIT_EDITOR=true`, are commit hashes and `git bisect` runs identical on two runs?                                                                                     | Every Git example shows real hashes                                                                               | Hashes are masked by a documented filter, and the lesson says why (last resort)                                                         | `debugging-and-profiling`, `software-engineering-practices`, `version-control-and-git`                                                                                                                                                                                                           |
| SP11  | Offline Go and Rust modules     | Do locked Cobra and clap crates build offline (`go.sum`, `Cargo.lock`, an environment image per lockfile) within the planning seconds?                                                                                                                                          | Real Go and Rust CLI units                                                                                        | Units that need the crates use only the standard library, with the library lines as illustrations                                       | `building-production-cli-tools`, `just-enough-go`, `just-enough-rust`                                                                                                                                                                                                                            |
| SP12  | OpenTofu providers offline      | With at most two providers baked from one shared lockfile, does `tofu init` and `tofu validate` work offline, and what is the image size?                                                                                                                                       | Static `opentofu` units (reason `cloud`) run                                                                      | Fewer providers, or the configuration shown as an illustration with a validated fragment                                                | `bare-metal-virtualization`, `cloud-and-iac`                                                                                                                                                                                                                                                     |
| SP13  | Pact in the double run          | Does the `pact` native library start a loopback mock server and give identical output on two runs?                                                                                                                                                                              | The Pact examples run for real                                                                                    | The Pact examples become a Python model of the contract, labelled as a model                                                            | `software-testing`                                                                                                                                                                                                                                                                               |
| SP14  | Privileged profilers            | Which profiler examples (`py-spy`, `perf`, `gdb`, `lldb`) have a deterministic model (call counts, a collapsed-stack file), so only the launch lines are illustrations?                                                                                                         | A list of models and illustrations for the 18 native examples                                                     | More examples become illustrations; the budget in the brief caps them                                                                   | `debugging-and-profiling`                                                                                                                                                                                                                                                                        |
| SP15  | Mobile-adjacent code            | Which Dart and Swift examples are `flutter test` units or `swift-parse` static units (reason `ios`), and which are illustrations?                                                                                                                                               | A unit or a static unit for every example that has code                                                           | The remainder become illustrations within the budget                                                                                    | `just-enough-dart`, `just-enough-swift`                                                                                                                                                                                                                                                          |
| SP16  | Elixir determinism              | Do scripts run with `elixir main.exs` (no Mix) print identical output on two runs when processes message in a fixed order?                                                                                                                                                      | Real Elixir units                                                                                                 | Units that depend on scheduling are rewritten to a fixed message order                                                                  | `just-enough-elixir`                                                                                                                                                                                                                                                                             |
| SP17  | Lua runtimes                    | Do `luajit`, `lua` 5.5, and `neovim` give the output the lessons show, and does each unit declare its runtime?                                                                                                                                                                  | Real Lua units with a declared runtime                                                                            | Version-difference examples become prose with a recorded unit per runtime                                                               | `just-enough-lua`                                                                                                                                                                                                                                                                                |
| SP18  | Offline Kubernetes schemas      | Does `kubeconform -strict` validate manifests with offline schemas (static, reason `cluster`)?                                                                                                                                                                                  | Static manifest units run                                                                                         | Manifests are shown as illustrations next to a Python structure check                                                                   | `containers-and-orchestration`, `self-managed-kubernetes-and-gitops`                                                                                                                                                                                                                             |

Four spikes decide whether a toolchain is added: SP6 (the Kotlin coroutine jar), SP7 (Gradle), SP8 (Caddy),
and SP9 (`systemd-analyze`). Each passes only if both its technical question and the budget rule in
[004](./004-toolchain-additions-and-ci-cost.md#the-toolchain-budget-rule) pass; otherwise the fallback is
used. SP5 and the measured seconds of every spike replace the planning figures in the briefs.

## Static Mode

Static mode proves a configuration is well formed; it does not prove the configuration works. The plan uses
only the reasons plan 05 allows and never adds one.

| Course                               | Validator     | `static.reason` | What the run proves                                                   | What the lesson must say                                 |
| ------------------------------------ | ------------- | --------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| `cloud-and-iac`                      | `opentofu`    | `cloud`         | `tofu validate` accepts the configuration with baked provider schemas | The configuration is validated, not applied              |
| `bare-metal-virtualization`          | `opentofu`    | `cloud`         | Same, for the Terraform HCL examples                                  | Same                                                     |
| `containers-and-orchestration`       | `kubeconform` | `cluster`       | `kubeconform -strict` accepts the manifest against offline schemas    | The manifest is validated, not applied to a cluster      |
| `self-managed-kubernetes-and-gitops` | `kubeconform` | `cluster`       | Same                                                                  | Same                                                     |
| `just-enough-swift`                  | `swift-parse` | `ios`           | The UI code parses as Swift                                           | The code is parsed, not built or run (no UIKit on Linux) |

No course uses `android`, `windows`, or a Clang or Groovy validator: the catalog's known gaps (Clang, Groovy and
Gremlin, a stronger Android validator, WinUI) are accepted (decision D5), and the lessons that need them show
illustrations.

## Illustration Policy

A code fence that is neither anchored nor an illustration is a sync finding (`unanchored-fence`). A fence may
be marked `<!-- harness: illustration -->` only when it is not meant to run as shown.

**Allowed:** an install or launch line for a tool the harness does not host (a browser, a hypervisor,
`perf`, `gh`, `ufw`); a pseudo-code fragment; a deliberately broken snippet that the lesson explains; a
file the toolchain cannot parse offline.

**Not allowed:** a program that could run (it becomes a unit); a fragment of a larger file (it becomes a range
anchor, `path#Lx-Ly`); a line that is marked an illustration only to avoid recording its output.

Each brief carries a budget. The budgets add up to 252 illustration fences against
1,368 unanchored code fences today. `examples coverage` reports the count per course; the Content
Quality Gate judges whether each one is justified, and the completion test does not count them (a count in a
test would fix the budget, and the briefs may change after the first audit).

| Course                                                                                            | Illustration budget (fences that may stay unanchored)                                              |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`browser-automation-with-cdp`](../syllabus/courses/browser-automation-with-cdp.md)               | At most 8 fences (browser launch commands).                                                        |
| [`build-automation-and-task-runners`](../syllabus/courses/build-automation-and-task-runners.md)   | At most 14 fences (Bazel and Gradle launch lines, install lines).                                  |
| [`building-production-cli-tools`](../syllabus/courses/building-production-cli-tools.md)           | At most 6 fences (install and release commands).                                                   |
| [`capstone-forge-ready`](../syllabus/courses/capstone-forge-ready.md)                             | At most 6 fences (install and launch lines).                                                       |
| [`debugging-and-profiling`](../syllabus/courses/debugging-and-profiling.md)                       | At most 24 fences (`py-spy`, `perf`, `gdb`, `lldb` launch lines).                                  |
| [`extending-neovim`](../syllabus/courses/extending-neovim.md)                                     | At most 8 fences.                                                                                  |
| [`just-enough-nvim`](../syllabus/courses/just-enough-nvim.md)                                     | Up to 9 transcripts stay unreplayed (10 percent).                                                  |
| [`software-engineering-practices`](../syllabus/courses/software-engineering-practices.md)         | At most 8 fences (`gh`, hook installs).                                                            |
| [`software-testing`](../syllabus/courses/software-testing.md)                                     | At most 10 fences.                                                                                 |
| [`version-control-and-git`](../syllabus/courses/version-control-and-git.md)                       | At most 4 fences (remote hosting commands).                                                        |
| [`just-enough-bash`](../syllabus/courses/just-enough-bash.md)                                     | At most 4 fences (installing tools).                                                               |
| [`just-enough-c`](../syllabus/courses/just-enough-c.md)                                           | At most 4 fences (install lines).                                                                  |
| [`just-enough-cpp`](../syllabus/courses/just-enough-cpp.md)                                       | At most 6 fences (CMake and install lines).                                                        |
| [`just-enough-csharp`](../syllabus/courses/just-enough-csharp.md)                                 | At most 5 fences (`dotnet new`).                                                                   |
| [`just-enough-dart`](../syllabus/courses/just-enough-dart.md)                                     | At most 5 fences.                                                                                  |
| [`just-enough-elixir`](../syllabus/courses/just-enough-elixir.md)                                 | At most 3 fences.                                                                                  |
| [`just-enough-go`](../syllabus/courses/just-enough-go.md)                                         | At most 3 fences.                                                                                  |
| [`just-enough-java`](../syllabus/courses/just-enough-java.md)                                     | At most 6 fences (Maven and Gradle lines).                                                         |
| [`just-enough-kotlin`](../syllabus/courses/just-enough-kotlin.md)                                 | At most 8 fences (the coroutine library lines under option b).                                     |
| [`just-enough-lua`](../syllabus/courses/just-enough-lua.md)                                       | At most 2 fences.                                                                                  |
| [`just-enough-python`](../syllabus/courses/just-enough-python.md)                                 | At most 4 fences.                                                                                  |
| [`just-enough-rust`](../syllabus/courses/just-enough-rust.md)                                     | At most 3 fences.                                                                                  |
| [`just-enough-swift`](../syllabus/courses/just-enough-swift.md)                                   | At most 5 fences.                                                                                  |
| [`just-enough-typescript`](../syllabus/courses/just-enough-typescript.md)                         | At most 3 fences.                                                                                  |
| [`bare-metal-virtualization`](../syllabus/courses/bare-metal-virtualization.md)                   | At most 12 fences (hypervisor commands and Packer templates).                                      |
| [`cicd-and-release-engineering`](../syllabus/courses/cicd-and-release-engineering.md)             | At most 8 fences.                                                                                  |
| [`cloud-and-iac`](../syllabus/courses/cloud-and-iac.md)                                           | At most 6 fences (LocalStack and apply lines).                                                     |
| [`containers-and-orchestration`](../syllabus/courses/containers-and-orchestration.md)             | At most 40 fences (28 percent of 144); the course teaches the CLI, so the share is high by design. |
| [`platform-engineering-and-devex`](../syllabus/courses/platform-engineering-and-devex.md)         | None.                                                                                              |
| [`self-hosting-essentials`](../syllabus/courses/self-hosting-essentials.md)                       | At most 16 fences (`ufw`, `systemctl`, `ssh`, `restic`, nginx).                                    |
| [`self-managed-kubernetes-and-gitops`](../syllabus/courses/self-managed-kubernetes-and-gitops.md) | At most 10 fences.                                                                                 |
| [`site-reliability-engineering`](../syllabus/courses/site-reliability-engineering.md)             | At most 2 fences.                                                                                  |

## Authoring Workflow for One Unit

Plan 05's decision D21 sets the order, because the commit hook formats code files but no longer reformats
code inside lesson fences:

1. Edit the code file.
2. Format it with the repository formatter for its language (`ruff`, `gofmt`, `rustfmt`, `csharpier`,
   `shfmt`, `tofu fmt`, `stylua`, `clang-format`, Prettier). Java, Kotlin, Swift, Dart, and Elixir have no
   repository formatter in the hook as of 2026-10-09 (Phase 0 re-reads this); keep their style as the lesson
   shows it, and run the catalog's validator (`ktlint` for Kotlin) where one exists.
3. `EX-SYNC-WRITE` repairs every anchored fence from its file.
4. `EX-RECORD` writes only missing expected files; delete a stale expected file first when the output
   legitimately changed.
5. Read every recorded file. A recorded file that holds an error message, a path, a timestamp, an address, or
   a stack trace is a finding, not an expectation.
6. `EX-CHECK` runs every unit twice and compares bytes.

## Wiring Lessons to Units

A lesson shows the program and its output, each tied to a file:

- A path-label anchor for the program (``**`learning/code/ex-12-…/main.py`**``), or a labelled-path anchor
  with a caption (``**Before** (`drilling/code/kata-03-…/before/kata.py`)``).
- A labelled-path anchor for the output (``**Output** (`learning/code/ex-12-…/expected/main.stdout.txt`):``).
- A range anchor (`#Lx-Ly`) for a long file shown in parts.

`EX-SYNC` reports `unreferenced-unit` for a unit no lesson shows, so every created unit needs its lesson, and
every lesson example needs its unit. Where `just-enough-java` has 80 programs and no fences, and
`just-enough-rust` has 84 programs and 12 fences, that is the main authoring work of the audit.
