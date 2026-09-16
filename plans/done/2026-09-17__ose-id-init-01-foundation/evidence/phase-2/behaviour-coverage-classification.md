# Phase 2 Gate — Isolated Behaviour-Coverage Classification

The Phase 2 Mandatory Nx Quality Matrix exits non-zero on `ose-id-be:test:quick` and
`ose-id-be-e2e:test:quick`, both via the chained `test:coverage` step. The delivery plan
permits this at the Phase 2 and Phase 3 gates only, and only when an isolated
classification proves every non-zero line is exactly `undefined <adapter> binding` naming a
scenario from a not-yet-opened phase, with zero orphan/duplicate/ambiguous/unused/
target-configuration findings. This document is that classification.

## Method

Each adapter declared by each project's `behaviour-coverage.json` was run in isolation
through HIPPO:

```sh
./hippo run --class ephemeral --disk-path . -- \
  node scripts/behaviour-coverage.mjs --config apps/<project>/behaviour-coverage.json --adapter <adapter>
```

`scripts/behaviour-coverage.mjs` emits exactly three finding kinds (`undefined`,
`ambiguous`, `unused`); all three were counted, not just the expected one.

## Per-adapter result

| Project          | Adapter       | Exit | Finding lines |
| ---------------- | ------------- | ---- | ------------- |
| `ose-id-be`      | `integration` | 1    | 22            |
| `ose-id-be`      | `unit`        | 1    | 22            |
| `ose-id-be-e2e`  | `e2e`         | 1    | 22            |
| `ose-id-be-e2e`  | `unit`        | 1    | 22            |
| `ose-id-web`     | `integration` | 0    | 0             |
| `ose-id-web`     | `unit`        | 0    | 0             |
| `ose-id-web-e2e` | `e2e`         | 0    | 0             |

All three `ose-id-web*` adapters are fully green, which positively proves every Phase 2
behaviour (AC-FND-04-WEB, AC-FND-07) is bound.

## Finding-kind census

- `undefined`: **88**
- `ambiguous`: **0**
- `unused`: **0**
- unrecognised: **0**

## Scenario ownership

| Owning phase | Feature file                                         | Lines |
| ------------ | ---------------------------------------------------- | ----- |
| 3            | `foundation/database-privilege.feature`              | 16    |
| 3            | `persistence/database-audit-and-soft-delete.feature` | 20    |
| 4            | `foundation/health.feature`                          | 20    |
| 4            | `foundation/local-stack.feature`                     | 16    |
| 4            | `foundation/stateless-instances.feature`             | 16    |

Total finding lines: **88**. Lines naming a Phase 2 or earlier scenario: **0**.
Violations (wrong kind, or current/earlier phase): **0**.

No Phase 2 feature file (`foundation/runtime-mode.feature`,
`foundation/disabled-capabilities.feature`, `foundation/status-shell.feature`) appears in
any finding, so the gate is not masking unfinished Phase 2 work.

Scenario-to-phase ownership is taken from `tech-docs/005-bdd-spec-delta-and-adapter-map.md`
(AC to feature file) combined with the delivery checklist headings (AC to phase).

## Gate re-run confirmation

The matrix was re-run at the Phase 2 Gate after the E2E server fixture was corrected
(`evidence/phase-2-gate/`). It reports **44** finding lines rather than 88 because Nx fails
each project at its first failing `test:coverage:*` step and does not reach the second
adapter; the isolated per-adapter census above remains the complete picture. The re-run
census is unchanged in kind and ownership:

- `undefined`: **44**; `ambiguous`/`unused`/unrecognised: **0**
- Lines naming a Phase 2 or earlier scenario: **0**
- Feature files named: the same five Phase 3/4 backend features listed above

`ose-id-web-e2e:test:e2e` and both `ose-id-web` coverage adapters exit 0 at the gate,
including after `Sanitize a status-rendering failure` took its `@e2e-exempt` tag. That
scenario keeps mandatory Unit proof and named Integration proof
(`ose-id-web:test:integration`), so no adapter's obligation was waived — only the layer
that cannot express the scenario was released.
