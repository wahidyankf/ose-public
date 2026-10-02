---
description: Enumerates every in-scope dependency manifest across npm, Cargo, .NET, Go, Docker, and GitHub Actions, and records current pinned versions.
when_to_use: Use when building the full dependency inventory table before classification.
---

# Phase 1: Inventory (Sequential)

Enumerate every in-scope dependency manifest and capture its currently-pinned versions. Manifests
governed by the policy (intersected with `scope-filter`/`ecosystems`):

- **npm**: workspace-root `package.json` (`volta` block = Node/npm language pins; `dependencies`,
  `devDependencies`, `optionalDependencies`), `apps/*/package.json`, and `libs/*/package.json`.
- **Cargo**: no in-tree Rust project exists today; treat Cargo as empty unless a `Cargo.toml`
  appears. RHINO is an external executable pinned by version and per-platform digest in
  `rhino.lock`, not a Cargo dependency.
- **.NET**: `apps/*/*.fsproj`/`*.csproj` `<PackageReference>` (e.g. `crane-cli`), plus the per-app
  `global.json` SDK pins (`apps/organiclever-be`, `apps/ose-be`, `apps/ose-id-be`,
  `apps/ose-id-be-e2e`). The `.github/actions/setup-dotnet` composite-action default pins the SDK CI
  installs; bump them together. `./rhino toolchain validate` only probes that `dotnet` runs; it
  reads no `global.json`.
- **Go**: no Go module exists in the active tree — the tracked `*.go` files are AyoKoding course
  corpora with no `go.mod`. Treat Go as empty unless a `go.mod` appears.
- **Docker**: `FROM` base-image tags in **all** Dockerfiles (`apps/*/Dockerfile*` including
  `Dockerfile.integration`, and `infra/**/Dockerfile*`) plus the `image:` references in
  `apps/*/docker-compose*.yml` and `infra/**/docker-compose*.yml`.
- **GitHub Actions**: three pin classes under `.github/`, all governed by the policy —
  (1) **composite-action input defaults** that pin language/toolchain versions
  (`.github/actions/setup-*/action.yml` defaults for node, dotnet, go, golangci-lint, python, jvm,
  and the rust cargo-tooling versions); (2) **inline version pins** set directly in workflow YAML
  (e.g. `node-version: "24"`, `go-version: "1.25.8"` in `.github/workflows/_reusable-*.yml`); and
  (3) **third-party action `uses:` references** in `.github/workflows/*.yml` and
  `.github/actions/*/action.yml` (e.g. `actions/checkout@v4`, `volta-cli/action@v4`,
  `Swatinem/rust-cache@v2`).

Use the `nx-workspace` skill / `nx graph` to enumerate projects, then `Grep`/`Glob` for the
manifests (including `.github/`, `infra/`, and root config files). Record a table: source →
ecosystem → package → current pinned version.

**Output**: Full inventory of in-scope dependencies with current versions.

**Note**: This scope mirrors the policy's [What This Policy
Covers](../../../development/workflow/dependency-bump-policy.md) list, which already governs all
Dockerfile `FROM` lines, GitHub Actions `uses:` references, and composite-action input defaults.
Lockfiles (`package-lock.json`, `Cargo.lock`, `go.sum`) and workspace-internal `*` references stay
out of scope per that same policy section.
