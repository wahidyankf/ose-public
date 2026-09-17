# Common Development Workflow — Nx Monorepo Integration

## Repository Structure

This platform uses **Nx** for monorepo management with clear separation of concerns:

**Apps** (`apps/[app-name]`):

- Deployable applications
- Import libraries but never export
- Each independently deployable
- Never import other apps

**Libraries** (`libs/[lib-name]`):

- Reusable code modules
- Flat structure (no nesting)
- Can import other libraries (no circular dependencies)
- Naming convention: `[language]-[name]` (e.g., `ts-env-loader`, `fsharp-env-loader`, `fsharp-crane-core`)

## Common Nx Commands

All target names follow [Nx Target Standards](../../../../repo-governance/development/infra/nx-targets.md). Use canonical names: `dev` (not `serve`), `test:quick` (not `test`), `start` (not `serve` for production).
Run each local compute-bearing command through one checksum-pinned HIPPO boundary. Existing guarded
root npm aliases must not be wrapped a second time. HIPPO safely reuses an inherited fixed
allocation, but an extra wrapper is redundant and nonconforming with OSE's one-outer-boundary
policy.

**Development**:

```bash
rtk ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev [project-name]
rtk ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- start [project-name]
```

**Building**:

```bash
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build [project-name]
rtk npm run affected:build # Existing guarded root alias
```

**Testing**:

```bash
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run [project-name]:test:quick
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run [project-name]:test:unit
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run [project-name]:test:integration
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run [project-name]:test:e2e
rtk npm run affected:test # Existing guarded root alias
```

**Analysis**:

```bash
rtk npm run graph # Existing guarded service alias
rtk npm run graph -- --affected
```

**Affected Commands Philosophy**:

- After making changes, use the guarded root affected aliases or one outer HIPPO boundary around
  `npm exec nx -- affected -t <target>`
- Only builds/tests projects impacted by your changes
- Efficient in large monorepo (don't rebuild everything)

## Monorepo Best Practices

1. **Keep libraries focused**: Each library should have single responsibility
2. **Avoid circular dependencies**: Libraries form directed acyclic graph (DAG)
3. **Use affected commands**: Leverage Nx's smart rebuilding
4. **Apps never depend on apps**: Only libraries are shared
5. **Test at library level**: Unit test libraries, integration test apps
