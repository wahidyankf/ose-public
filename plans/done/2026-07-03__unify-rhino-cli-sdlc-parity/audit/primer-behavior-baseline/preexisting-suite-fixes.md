# Primer preexisting cucumber-suite fixes (2026-07-02)

While attempting to capture the Phase-0 round-trip behavior baseline (Decision 8), primer's own
`apps/rhino-cli` cucumber suite (`cargo test --release --manifest-path apps/rhino-cli/Cargo.toml`)
was found completely broken: `tests/agents.rs` failed 21/21 scenarios with a uniform "exit code 2"
(clap usage-error) pattern regardless of what each scenario expected. Root-cause investigation traced
this — and 10 further broken test binaries discovered along the way — to primer's own prior "phase
9a/b/c command-surface rationalization" commit, which restructured much of the CLI without updating
this repo's own `tests/*.rs` step-defs to match, and in several cases silently dropped or orphaned
real behavior. This is entirely unrelated to the `unify-rhino-cli-sdlc-parity` plan's own payload —
a genuine preexisting defect on `ose-primer`'s `main`, fixed here per this repo's root-cause-orientation
policy (Iron Rule 3: fix ALL issues, including preexisting).

All fixes below are **uncommitted** in `~/ose-projects/ose-primer`'s working tree as of this
writing — they land as part of this plan's normal commit/push flow (Local Quality Gates → Push
sections of `delivery.md`), not committed ad-hoc mid-Phase-0.

## Final state

`cargo test --release --manifest-path apps/rhino-cli/Cargo.toml --no-fail-fast` → **exit 0**.
11 cucumber-rs binaries (86+34+174+36+211+22+16+110+38(24 real +14 pre-existing-unwired)+16+1 =
all passing/accounted), 1005 lib unit tests passed (1 ignored), 0 doc-tests, 0 failures anywhere.
`cargo fmt --check` clean. `cargo clippy --all-targets -- -D warnings` clean.

## Per-binary root causes

| Binary            | Scenarios                         | Root cause                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents`          | 21/21                             | Stale CLI shape (`agents {verb}` → `harness {noun} {verb}`) **+ 2 genuine regressions**: Amazon Q `--dry-run` silently wrote files; `agent_validator.rs` dropped required `tools`/`color` field checks                                                                                                                                                                                              |
| `contracts`       | 8/8                               | **Genuine regression**: `specs clean java-imports`/`specs scaffold dart` were permanently-passing no-op stubs — real, unit-tested logic (`internal::contracts::*`) was orphaned (not `mod`-declared), silently breaking 3 real Nx codegen targets (`crud-be-java-springboot`/`crud-be-java-vertx`/`crud-fe-dart-flutterweb`)                                                                        |
| `doctor`          | 9/9                               | **Genuine regression**: doctor's tool list was silently narrowed 19→13 tools (and config-file paths pointed at ose-public's apps) by a wholesale ose-public→ose-primer source sync that didn't account for primer's own larger polyglot app portfolio; plus `find_root()`'s hexagonal-port rewrite broke the "git binary missing" scenario                                                          |
| `env`             | 44 failing steps                  | Fake `.git`-directory test fixtures incompatible with `find_root()`'s hexagonal-port rewrite (real `git rev-parse` shell-out) **+ 2 genuine regressions**: `.pem`/`.key`/`.crt`/`.pfx` secret-file matching dropped; backup-dir-inside-repo safety guard bypassable via symlinked paths (macOS `/tmp`→`/private/tmp`)                                                                               |
| `docs`            | 45/45                             | Stale CLI shape (`docs validate-*` → `md {noun} validate`) **+ 2 genuine regressions**: `md mermaid validate --quiet` was a no-op; `md links validate` silently dropped `broken-anchor`-category findings from its text/markdown report                                                                                                                                                             |
| `java`            | 4/4                               | **Genuine regression**: `lang java null-safety-annotations validate` was a permanently-passing stub — real, unit-tested logic (`internal::java::*`) was orphaned (not `mod`-declared), silently disabling primer's Java null-safety CI gate                                                                                                                                                         |
| `env_validate`    | 5/5                               | Stale test fixture (wrote standalone `env-contract.yaml`; loader now reads the merged `repo-config.yml` `env-contract:`/`env-injection:` sections) — no source regression                                                                                                                                                                                                                           |
| `repo_governance` | 24 real + 14 pre-existing-unwired | Gherkin parse error (wrapped `Background` step line) blocking most scenarios; stale CLI shape (`repo-governance vendor-audit`/`gherkin-keyword-cardinality` → `repo-governance vendor validate`/`specs gherkin-cardinality validate`) — no source regression. The 14 skipped steps are pre-existing, deliberately unwired documentation-only scenarios from an unrelated older commit, out of scope |
| `workflows`       | 4/4                               | Stale CLI shape (`workflows validate-naming` → `repo-governance workflows naming validate`) — no source regression                                                                                                                                                                                                                                                                                  |
| `golden_master`   | 1/1 (aggregate)                   | Manifest frozen against the pre-rationalization CLI; ~19 stale/removed entries rewritten to current shape, 3 non-`--help` entries' expected output regenerated to reflect already-fixed real behavior — no additional source regression found                                                                                                                                                       |
| `spec_coverage`   | 6/6                               | Stale CLI shape (`spec-coverage validate` → `specs behavior-coverage validate`) + fake `.git`-directory fixture (same `find_root()` issue as `env`/`repo_governance`/`doctor`) — no source regression                                                                                                                                                                                               |

## Files touched (uncommitted, `ose-primer` working tree)

```
apps/rhino-cli/src/application/agents/agent_validator.rs
apps/rhino-cli/src/application/docs/links.rs
apps/rhino-cli/src/application/doctor/{checker,mod,tools}.rs
apps/rhino-cli/src/application/env/backup.rs
apps/rhino-cli/src/cli.rs
apps/rhino-cli/src/commands/env_backup.rs
apps/rhino-cli/src/commands/harness_generate_bindings.rs
apps/rhino-cli/src/commands/lang_java_validate_null_safety.rs
apps/rhino-cli/src/commands/md_audit.rs
apps/rhino-cli/src/commands/md_validate_mermaid.rs
apps/rhino-cli/src/commands/specs_clean_java_imports.rs
apps/rhino-cli/src/commands/specs_scaffold_dart.rs
apps/rhino-cli/src/infrastructure/git/root.rs
apps/rhino-cli/src/internal.rs
apps/rhino-cli/src/internal/contracts/mod.rs
apps/rhino-cli/src/internal/contracts/reporter.rs (deleted)
apps/rhino-cli/src/internal/java/{mod,reporter}.rs
apps/rhino-cli/tests/{agents,contracts,docs,doctor,env,env_validate,java,repo_governance,spec_coverage,workflows}.rs
apps/rhino-cli/tests/golden-master/manifest.json (+ regenerated .stdout/.stderr/.exit fixtures)
specs/apps/rhino/behavior/rhino-cli/gherkin/repo-governance/repo-governance-instruction-size.feature
```

See `full-test-suite-output.txt` for the complete frozen `--no-fail-fast` run, and `help/` for the
`--help` snapshot (top-level + all 8 command groups + all 37 leaf commands) that forms the Phase 3
round-trip behavior baseline this plan's Decision 8 requires.
