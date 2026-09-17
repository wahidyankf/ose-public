# organiclever-www — Feature-context Architecture

Every feature lives inside one feature context under `src/contexts/<bc>/`:

```
src/contexts/<bc>/
├── domain/           # Pure types, invariants, tagged errors — no IO, no Effect
├── application/      # Use-cases, ports, XState orchestrating machines — depends on domain
├── infrastructure/   # PGlite stores, Effect Layers, live adapters — depends on domain + application + shared/runtime
└── presentation/     # React hooks + components — depends on domain + application
```

**Layer rules** (ESLint `boundaries` at **error** severity since Phase 8):

- `domain` ← no project imports
- `application` ← `domain` only
- `infrastructure` ← `domain` + `application` + `@/shared/runtime`
- `presentation` ← `domain` + `application`
- Cross-context coupling: only via the target's `application/index.ts` or `presentation/index.ts` barrel

**Published API barrels**: each context exposes `domain/index.ts`, `application/index.ts`, `infrastructure/index.ts`, and `presentation/index.ts`. Consumers always import from the barrel, never from internal files.

## Adding a Feature (Feature-context Workflow)

1. Identify the feature context that owns the feature.
2. Write or update the Gherkin spec in `specs/apps/organiclever/www/behaviours/frontend/<bc>/`.
3. Implement: Red (failing step) → Green (minimal code) → Refactor.
4. Keep all new code inside the correct context layer. If it touches IO, it goes in `infrastructure/`. If it is a use-case, it goes in `application/`. Never break the layer rules.
5. Run
   `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-www:lint`
   to confirm 0 boundary errors before committing.

## XState Machine Placement Rule

- **UI shell machine** (no IO, no aggregate model — e.g., `appMachine` toggling dark mode) → `presentation/`
- **Orchestrating machine** (invokes `fromPromise` actors hitting infrastructure — e.g., `journalMachine`, `workoutSessionMachine`) → `application/`
