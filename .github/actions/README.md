# Composite GitHub Actions

These actions give OSE workflows a consistent, repeatable toolchain setup.
They are building blocks for automation, not commands a new contributor needs
to run locally. For a local first success, start from the
[root README](../../README.md). ⚙️

## What each action prepares

| Action               | What it prepares                                          | Used when                                    |
| -------------------- | --------------------------------------------------------- | -------------------------------------------- |
| `setup-node`         | The pinned Node.js toolchain, dependencies, and Nx cache  | A workflow runs workspace tasks              |
| `setup-dotnet`       | .NET tooling and its cache                                | A workflow validates F# work                 |
| `setup-java`         | The pinned Temurin JDK and the Gradle dependency cache    | A workflow validates Java work               |
| `setup-rust`         | The pinned Rust toolchain and Rust quality tools          | A workflow validates Rust work               |
| `setup-go`           | The pinned Go toolchain, its caches, and golangci-lint    | A workflow validates Go work                 |
| `setup-python`       | The pinned Python, checksum-verified uv, and the uv cache | A workflow validates Python work             |
| `setup-playwright`   | Browsers and operating-system dependencies                | A workflow runs browser E2E checks           |
| `setup-docker-cache` | Docker Buildx and its layer cache                         | A workflow needs an integration or E2E stack |

Workflows reference an action with `uses: ./.github/actions/<name>`. Keep
setup behaviour in the relevant `action.yml`; this README explains intent so a
reader can choose the right place to investigate.

`setup-python` declares no inputs. Its Python patch version, uv version, and
uv checksum are literals inside the action. The patch version must equal the
FERRET `.python-version` files, so change them together. It installs the
toolchain only; a workflow syncs the locked dependencies through each
project's `install` target.

## Safe maintenance boundary

- Keep versions and installation logic in the action definition, not in a
  calling workflow.
- Use the workspace’s pinned toolchains; do not add a one-off installer just
  to make a workflow pass.
- Treat caches as an acceleration, never as the only source of a build input.
- Do not put credentials, tokens, or environment values in action files or
  documentation.

## Related guides

- [Workflow map](../workflows/README.md) — which automation consumes these
  actions
- [CI/CD reference](../../docs/reference/system-architecture/ci-cd.md) — the
  broader quality and delivery model
- [CI conventions](../../repo-governance/development/infra/ci-conventions.md)
  — repository standards for workflow design
