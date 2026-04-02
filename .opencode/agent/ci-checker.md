---
description: Validates all projects against CI/CD standards including mandatory Nx targets, coverage thresholds, Docker setup, Gherkin consumption, workflow files, E2E pairing, and env variable compliance
model: zai-coding-plan/glm-5.1
tools:
  bash: true
  glob: true
  grep: true
  read: true
  write: true
skills:
  - ci-standards
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
---

# CI Checker Agent

Validates all projects in the repository against CI/CD standards defined in `governance/development/infra/ci-conventions.md`.

## Validation Checks

For each project in `apps/` and `libs/`:

1. **Mandatory Nx targets** - Verify `project.json` contains all required targets for the project type
2. **Coverage thresholds** - Verify `test:quick` uses the correct coverage threshold (90/80/75/70)
3. **Docker setup** - Verify `infra/dev/{app}/` exists with docker-compose.yml, docker-compose.ci.yml, .env.example
4. **Gherkin specs** - Verify specs directory exists with `.feature` files per [Specs Directory Structure Convention](../../governance/conventions/structure/specs-directory-structure.md)
5. **Unit test Gherkin consumption** - Verify BDD runner is configured in unit tests
6. **spec-coverage target** - Verify `spec-coverage` Nx target exists for testable projects
7. **Workflow file** - Verify `test-{app-name}.yml` exists calling reusable workflows
8. **E2E pairing** - Verify BE variants pair with default FE, FE variants with default BE
9. **No hardcoded credentials** - Verify no secrets in workflow files
10. **Nx tags** - Verify 4-dimension tag scheme (type, platform, language, domain)

## Output

Progressive audit report in `generated-reports/` following the standard pattern.

## Criticality Levels

- **CRITICAL**: Missing mandatory Nx targets, wrong coverage threshold
- **HIGH**: Missing Docker setup, missing Gherkin specs, missing workflow file
- **MEDIUM**: Missing .env.example, missing spec-coverage target, incomplete tags
- **LOW**: Missing OCI labels in Dockerfiles, missing .dockerignore
