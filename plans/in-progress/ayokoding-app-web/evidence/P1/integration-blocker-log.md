# P1D REFACTOR blocker — `next build` bus error (pre-existing, environmental)

## What was attempted (HIPPO `ephemeral/heavy`, from the worktree root)

```bash
rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ayokoding-www:test:integration
rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ayokoding-www:build   # retry, same result
```

Both fail identically at `ayokoding-www:build → next build` (Next.js 16.4.3,
Turbopack) with a bare `Bus error` (SIGBUS) and no further diagnostic.

## Baseline isolation (adapters stashed, then restored)

With the six P1D adapters stashed (pristine `origin/main`-era inline data
back in place) the build fails with the byte-identical `Bus error`. After
`git stash pop` the tree is back to the full P1D state (verified: all six
adapters re-import the shared JSON).

## Verdict

The crash is pre-existing and environmental, not caused by this packet:
identical failure with and without the JSON adapters, on a 7 GB host where
HIPPO already shed an earlier run for memory pressure. It blocks
`ayokoding-www:test:integration` (dependsOn build) and both Playwright
targets (`ayokoding-www-be-e2e:test:e2e`, `ayokoding-www-fe-e2e:test:e2e`,
both run `ayokoding-www:build` first). Recorded for the coordinator as a P0
baseline-validity item: a green build in a resourced environment unblocks the
REFACTOR reruns, which need no P1D code changes (unit, reference, and static
gates already prove behavior is unchanged).

## P1D gates that do not need the build (all green, see green-proof.log.md)

- `ayokoding-data:test:quick` (typecheck, lint, 10 unit tests, static coverage)
- `ayokoding-www:typecheck`, `ayokoding-www:lint` (0 errors)
- `ayokoding-www:test:unit` — 3648/3648 assertions pass; only the 39
  pre-existing mermaid collection failures remain (identical set to RED)
- `ayokoding-www:validate-benchmark-reference` — unchanged
- `ayokoding-www:test:coverage` (static) — 63 features, 509 scenarios
- `rtk npm run test:validators` — 216 pass, 0 fail
