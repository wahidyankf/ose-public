# GitHub Actions workflow map

These workflows continuously check that OSE stays buildable and that its
delivery paths remain healthy. They are here for orientation: product readers
can see how quality is protected, while early engineers can find the workflow
that explains a run they encounter. 🚦

Use the [root README](../../README.md) to run the product locally. Do not
trigger, edit, or copy a workflow as a substitute for the documented local
development path.

## Start with the workflow family

| Family                          | What it does                                                                                         | Where to look                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Pull-request and main checks    | Validates affected workspace quality and environment contracts                                       | `pr-quality-gate.yml`, `validate-env.yml`                                                                           |
| Dependency audit                | Looks for dependency risk                                                                            | `dependency-vulnerability-audit.yml`                                                                                |
| Non-product full quality        | Runs complete library and executable-tool test layers twice daily or on demand                       | `non-product-full-quality.yml`                                                                                      |
| Website delivery                | Tests each public website before its managed delivery step                                           | `*-www-test-local-deploy-prod.yml` and `_reusable-www-test-local-deploy.yml`                                        |
| Application delivery            | Tests a paired web/backend application before its managed staging path                               | `*-app-test-local-deploy-stag.yml`, `*-app-test-stag.yml`, and reusable counterparts                                |
| Backend images and UI artifacts | Builds publishable backend images or the web UI artifact when their inputs change                    | `_reusable-be-build-deploy.yml`, `*-be-build-deploy-stag.yml`, `publish-images.yml`, `web-ui-build-deploy-prod.yml` |
| Pinned local tools              | Proves the pinned HIPPO and RHINO consumer contracts on Linux and macOS before merge and twice daily | `hippo-consumer-smoke.yml`, `rhino-consumer-smoke.yml`                                                              |

The workflow filenames are the authoritative inventory. This map names stable
families rather than maintaining a fragile duplicate list.

## Reading a workflow run

1. Open the run in GitHub and identify the workflow filename and triggering
   event.
2. Read the workflow’s `name`, `on`, permissions, and reusable-workflow call
   before assuming what it changed.
3. For a failed quality check, reproduce the named local command from the
   [development guides](../../repo-governance/development/README.md).
4. Treat a queued run as a capacity signal first. OSE repositories share a
   limited runner pool; follow the
   [CI monitoring guidance](../../repo-governance/development/workflow/ci-monitoring.md)
   before changing code or configuration.

## Maintenance boundaries

- Reusable workflows hold shared behaviour; callers provide the product-specific
  inputs.
- Keep secrets in GitHub’s protected configuration. Never copy them into YAML,
  logs, issues, or documentation.
- A workflow can run scheduled or managed delivery work; that does not make it
  the local onboarding route.
- Follow the [CI conventions](../../repo-governance/development/infra/ci-conventions.md)
  and [workflow naming convention](../../repo-governance/development/infra/github-actions-workflow-naming.md)
  when changing automation.

## Related guides

- [Composite Actions](../actions/README.md) — shared toolchain setup
- [CI/CD reference](../../docs/reference/system-architecture/ci-cd.md) — how
  quality and delivery fit together
- [Repository validation](../../repo-governance/development/quality/repository-validation.md)
  — local checks and their purpose
