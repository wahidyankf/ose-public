# rhino-cli Gherkin Specs

Gherkin feature files for [rhino-cli](../../../../../apps/rhino-cli/README.md) — the Repository
Hygiene & INtegration Orchestrator CLI.

## Feature Files

| File                                | Command(s)                  | Scenarios |
| ----------------------------------- | --------------------------- | --------- |
| `agents-sync.feature`               | `agents sync`               | 7         |
| `agents-validate-claude.feature`    | `agents validate-claude`    | 5         |
| `agents-validate-naming.feature`    | `agents validate-naming`    | 4         |
| `docs-validate-links.feature`       | `docs validate-links`       | 4         |
| `docs-validate-mermaid.feature`     | `docs validate-mermaid`     | 22        |
| `doctor.feature`                    | `doctor`                    | 9         |
| `env-backup.feature`                | `env backup`                | 18        |
| `env-init.feature`                  | `env init`                  | 4         |
| `env-restore.feature`               | `env restore`               | 13        |
| `git-pre-commit.feature`            | `git pre-commit`            | 1         |
| `spec-coverage-validate.feature`    | `spec-coverage validate`    | 6         |
| `test-coverage-diff.feature`        | `test-coverage diff`        | 4         |
| `test-coverage-merge.feature`       | `test-coverage merge`       | 3         |
| `test-coverage-validate.feature`    | `test-coverage validate`    | 10        |
| `workflows-validate-naming.feature` | `workflows validate-naming` | 4         |

## Conventions

- **File naming**: `[domain]-[action].feature` (kebab-case, domain-prefixed)
- **Step language**: CLI-semantic only — no framework or library names
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`

## Related

- **Parent**: [rhino-cli specs](../../README.md)
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
