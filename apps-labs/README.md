# Apps Labs

## Purpose

The `apps-labs/` directory is for **experimental applications and proof-of-concepts (POCs)** that are **outside the Nx monorepo**. Use this space to evaluate framework ergonomics, test new programming languages, and prototype ideas before making production decisions.

## Key Characteristics

- **Not in Nx monorepo** — Independent build systems, no Nx overhead
- **Not for production** — Experimental only, never deployed
- **Temporary** — Delete when experiments conclude
- **Stack independent** — Any framework, language, or tooling
- **Low commitment** — Quick prototypes without monorepo integration concerns

## What Belongs Here

- Framework comparisons and evaluations
- Language explorations
- Architecture pattern validation
- Performance testing setups
- Tool evaluations (build tools, testing frameworks, state management)

## What Does NOT Belong Here

- ❌ **Production apps** → Use `apps/` instead (Nx monorepo)
- ❌ **Reusable libraries** → Use `libs/` instead
- ❌ **Long-term maintained projects** → Graduate to `apps/`

## Lifecycle

**Creating an experiment**: Add a directory with a brief README explaining the goal. No Nx config needed.

**Graduating to production**: Recreate in `apps/` with Nx integration, then delete the original here.

**Cleanup**: Delete when evaluation is complete, POC is inactive 3+ months, or functionality has been reimplemented in `apps/`.

## Relationship to Other Directories

| Directory    | Purpose                 | In Nx? | Production? |
| ------------ | ----------------------- | ------ | ----------- |
| `apps/`      | Production applications | ✅ Yes | ✅ Yes      |
| `apps-labs/` | Standalone experiments  | ❌ No  | ❌ No       |
| `libs/`      | Reusable libraries      | ✅ Yes | ✅ Yes      |
