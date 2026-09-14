# rhino-cli Gherkin Specs

Gherkin feature files for [rhino-cli](../../../../../apps/rhino-cli/README.md) — the Repository
Hygiene & INtegration Orchestrator CLI.

## Structure

Feature files are grouped into domain subdirectories, one per subcommand family:

```
cli/behaviours/
├── contracts/              # contracts subcommand family (scaffolding generators)
├── convention/             # convention subcommand family
├── env/                    # env subcommand family
├── env-contract/           # env validate's IaC (terraform/ansible) dispatch surface
├── gate/                   # gate-registry command family
├── git/                    # git subcommand family
├── governance/             # governance subcommand family (word-budget, readme-index)
├── harness/                # harness subcommand family (agent/binding machinery)
├── md/                     # md subcommand family
├── plan/                   # plan subcommand family (structural plan validation)
├── repo-config/            # repo-config.yml-driven-behaviour regressions
├── repo-config-validate/   # repo-config validate schema-parity gate
├── repo-governance/        # repo-governance subcommand family
├── specs/                  # specs subcommand family
├── system/                 # system commands (doctor)
└── test-coverage/          # test-coverage subcommand family
```

## Feature Files by Domain

### contracts

| File                              | Command(s)                | Scenarios |
| --------------------------------- | ------------------------- | --------- |
| `contracts-dart-scaffold.feature` | `contracts dart-scaffold` | 3         |

### convention

| File                                    | Command(s)                    | Scenarios |
| --------------------------------------- | ----------------------------- | --------- |
| `convention-audit.feature`              | `convention audit`            | 1         |
| `repo-governance-license-audit.feature` | `convention license validate` | 4         |

### env

| File                             | Command(s)     | Scenarios |
| -------------------------------- | -------------- | --------- |
| `env-backup.feature`             | `env backup`   | 21        |
| `env-init.feature`               | `env init`     | 4         |
| `env-restore.feature`            | `env restore`  | 16        |
| `env-validate-app-drift.feature` | `env validate` | 3         |

### env-contract

| File                         | Command(s)     | Scenarios |
| ---------------------------- | -------------- | --------- |
| `iac-env-validation.feature` | `env validate` | 1         |

### gate

| File                       | Command(s)                            | Scenarios |
| -------------------------- | ------------------------------------- | --------- |
| `gate-declaration.feature` | `repo-config validate` / `gate list`  | 11        |
| `gate-emission.feature`    | `gate emit`                           | 5         |
| `gate-enumeration.feature` | `gate list`                           | 8         |
| `gate-execution.feature`   | `gate run`                            | 28        |
| `gate-validation.feature`  | `gate validate`                       | 26        |
| `parity-manifest.feature`  | `parity manifest generate`/`validate` | 5         |

### git

| File                     | Command(s)          | Scenarios |
| ------------------------ | ------------------- | --------- |
| `git-lockfile.feature`   | `git lockfile sync` | 3         |
| `git-pre-commit.feature` | `git pre-commit`    | 3         |

### governance

| File                              | Command(s)                         | Scenarios |
| --------------------------------- | ---------------------------------- | --------- |
| `governance-word-budget.feature`  | `governance word-budget validate`  | 9         |
| `governance-readme-index.feature` | `governance readme-index validate` | 17        |

### harness

| File                                      | Command(s)                                                     | Scenarios |
| ----------------------------------------- | -------------------------------------------------------------- | --------- |
| `agents-bindings.feature`                 | `harness bindings validate`/`generate`                         | 10        |
| `agents-detect-duplication.feature`       | `harness duplication validate`                                 | 4         |
| `agents-skills-mirror.feature`            | `harness bindings generate`/`validate` (skills mirror)         | 5         |
| `agents-sync.feature`                     | `harness sync validate`                                        | 8         |
| `agents-validate-claude.feature`          | `harness claude validate`                                      | 5         |
| `codex-binding.feature`                   | `harness bindings generate` (Codex)                            | 3         |
| `governance-word-budget-pre-push.feature` | `governance word-budget validate`                              | 4         |
| `governance-word-budget-rule.feature`     | `governance word-budget validate`                              | 5         |
| `harness-audit.feature`                   | `harness audit`                                                | 1         |
| `harness-catalog.feature`                 | `harness catalog generate`/`validate`                          | 2         |
| `harness-ownership.feature`               | `harness ownership validate`                                   | 5         |
| `harness-sync-triage.feature`             | `harness sync triage`/`promote`                                | 12        |
| `vendored-skill-preservation.feature`     | `harness bindings generate`/`validate`, `repo-config validate` | 2         |

### md

| File                                        | Command(s)                      | Scenarios |
| ------------------------------------------- | ------------------------------- | --------- |
| `docs-validate-frontmatter.feature`         | `md frontmatter validate`       | 8         |
| `docs-validate-links.feature`               | `md links validate`             | 7         |
| `docs-validate-mermaid.feature`             | `md mermaid validate`           | 39        |
| `md-audit.feature`                          | `md audit`                      | 1         |
| `repo-governance-frontmatter-audit.feature` | `md frontmatter-dates validate` | 4         |

### plan

| File                     | Command(s)      | Scenarios |
| ------------------------ | --------------- | --------- |
| `plan-structure.feature` | `plan validate` | 6         |

### repo-config

| File                  | Command(s)                                                  | Scenarios |
| --------------------- | ----------------------------------------------------------- | --------- |
| `data-driven.feature` | N/A — data-driven-behaviour regression (no single CLI verb) | 9         |

### repo-config-validate

| File                           | Command(s)             | Scenarios |
| ------------------------------ | ---------------------- | --------- |
| `repo-config-validate.feature` | `repo-config validate` | 5         |

### repo-governance

| File                                         | Command(s)                                 | Scenarios |
| -------------------------------------------- | ------------------------------------------ | --------- |
| `repo-governance-audit.feature`              | `repo-governance audit`                    | 6         |
| `repo-governance-layer-coherence.feature`    | `repo-governance layer-coherence validate` | 3         |
| `repo-governance-traceability-audit.feature` | `repo-governance traceability validate`    | 8         |
| `repo-governance-vendor-audit.feature`       | `repo-governance vendor validate`          | 12        |

### specs

| File                              | Command(s)                                                                                  | Scenarios |
| --------------------------------- | ------------------------------------------------------------------------------------------- | --------- |
| `env-staged-guard.feature`        | `env staged-guard validate`                                                                 | 3         |
| `specs-audit.feature`             | `specs audit`                                                                               | 1         |
| `validate-adoption.feature`       | `specs structure validate` (merged; scenarios exercise `validate_spec_adoption` in-process) | 4         |
| `validate-counts.feature`         | `specs counts validate`                                                                     | 4         |
| `validate-links.feature`          | `md links validate` (composed; standalone `specs validate-links` was deleted)               | 4         |
| `validate-logical-corpus.feature` | `specs structure validate`                                                                  | 6         |
| `validate-tree.feature`           | `specs structure validate` (merged; scenarios exercise `validate_spec_tree` in-process)     | 4         |

### system

| File                             | Command(s)                                             | Scenarios |
| -------------------------------- | ------------------------------------------------------ | --------- |
| `cargo-target-share.feature`     | `doctor`                                               | 18        |
| `doctor.feature`                 | `doctor`                                               | 16        |
| `fsharp-tool-invocation.feature` | N/A — F# lint-target manifest regression (no CLI verb) | 1         |

### test-coverage

| File                             | Command(s)               | Scenarios |
| -------------------------------- | ------------------------ | --------- |
| `test-coverage-validate.feature` | `test-coverage validate` | 10        |

## Conventions

- **File naming**: `[domain]-[action].feature` (kebab-case, domain-prefixed)
- **Step language**: CLI-semantic only — no framework or library names
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`

## Related

- **Parent**: [rhino-cli](../README.md)
- **BDD Standards**: [behaviour-driven-development-bdd/](../../../../../docs/explanation/software-engineering/development/behaviour-driven-development-bdd/README.md)

See [Specs Directory Structure Convention](../../../../../repo-governance/conventions/structure/specs-directory-structure.md)
for the canonical purpose of this folder.

- [Contracts Domain](./contracts/README.md) — Gherkin specs for rhino-cli contract scaffolding commands (contracts dart-scaffold).
- [rhino](./convention/README.md) — cli/behaviours/convention
- [rhino](./env/README.md) — cli/behaviours/env
- [Env-Contract Domain](./env-contract/README.md) — Gherkin specs for env validate's IaC (terraform/ansible) dispatch surface.
- [Gate Gherkin Specs](./gate/README.md) — Gherkin specs for the registry-driven gate command family (declaration, emission, execution, validation).
- [rhino](./git/README.md) — cli/behaviours/git
- [rhino](./governance/README.md) — cli/behaviours/governance
- [rhino](./harness/README.md) — cli/behaviours/harness
- [rhino](./md/README.md) — cli/behaviours/md
- [Plan Domain](./plan/README.md) — Gherkin specs for `plan validate`, the structural plan validator held to RHINO parity.
- [Repo-Config Domain](./repo-config/README.md) — Gherkin specs proving per-repo behaviour is read from repo-config.yml rather than hard-coded.
- [Repo-Config-Validate Domain](./repo-config-validate/README.md) — Gherkin specs for the repo-config validate schema-parity gate.
- [rhino](./repo-governance/README.md) — cli/behaviours/repo-governance
- [Specs Domain](./specs/README.md) — Gherkin specs for the specs subcommand family (structure and audit validators).
- [rhino](./system/README.md) — cli/behaviours/system
- [Test Coverage Domain](./test-coverage/README.md) — Gherkin specs for `test-coverage validate`.
