# Phase 0 — Upstream Verification Result

Run against `origin/main` merged into `worktree/ose-islamic`. Every check below is the
`delivery.md` Phase 0 Upstream Verification step, executed and recorded.

**Verdict: all prerequisites MET.** `islamic-be-init` is unblocked.

## `lms-init` DU1 — config-driven doctor tool inventory

| Check                                       | Result                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Merge commit                                | `c6fffc384 refactor(rhino-cli): resolve the doctor tool inventory from repo-config`                         |
| `doctor.extra-tools` in `ose-public`        | present, `repo-config.yml:174`, first entry `java`                                                          |
| `doctor.extra-tools` in the private sibling | present, `repo-config.yml:272`, value `[]`                                                                  |
| Top-level key-set parity                    | holds — both repositories carry the key                                                                     |
| `builtinDoctorToolInventory`                | `RepoConfig.fs:174`                                                                                         |
| `doctorToolInventoryFor (config)`           | `RepoConfig.fs:284`, appends configured names to the built-ins                                              |
| `Doctor.fs` re-exports                      | `Doctor.fs:781`, `:786`; extra tools become `ToolDef`s at `:1811`                                           |
| `DoctorExtraTool` schema                    | `RepoConfig.fs:214`–`:224` — `Name`, `Binary`, `VersionArgs`, `VersionStream`, `RequiredVersion`, `Install` |
| `go` in `builtinDoctorToolInventory`        | **absent** — so D-9's `extra-tools` registration is both possible and necessary                             |

The schema matches `tech-docs.md` §2 D-9's YAML field for field, including `version-stream`.

## `lms-init` DU2 — Java language enablement

| Check                                         | Result                                                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Merge commit                                  | `2e3ff7a8e feat(repo): enable java projects across the quality surfaces (#493)`                    |
| `BINDING_FILE`                                | `scripts/behaviour-coverage.mjs:20` — `/\.(?:ts\|tsx\|fs\|java)$/iu`                               |
| `extractBindings`                             | `:405`–`:410`, three-way dispatch with a `.java` arm                                               |
| Shared feature-reference helper               | `featureReferences(source, literalPattern)` at `:302`; `javaFeatureReferences` at `:374` reuses it |
| `setup-java` composite action                 | `.github/actions/setup-java/` present                                                              |
| `has-java` detect output                      | `pr-quality-gate.yml:29`, `:80`, `:91`, `:102`                                                     |
| `java` job                                    | `:367` gated on `has-java == 'true'`                                                               |
| `tag:lang:java` exclusions                    | 4 occurrences — `typescript` ×1, `dotnet` ×2, `flutter` ×1                                         |
| `quality-gate` needs                          | `:392` includes `java`                                                                             |
| `format-java` gate + `scripts/format-java.sh` | present                                                                                            |

## Finding recorded during verification

The `java` job DU2 added selects by **exclusion** like its siblings and names no `go`
(`pr-quality-gate.yml:377`, excludes `ts,fsharp,csharp,rust,dart`). A `lang:go` project therefore
leaks into **four** jobs, not the three this plan originally documented. Corrected in
`tech-docs.md` §1.4, `prd.md` AC, `README.md`, and `delivery.md` DU1; the structural cause is
recorded in `learnings.md`.
