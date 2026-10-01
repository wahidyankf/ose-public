---
description: "Step 4 of the AI benchmark refresh: spot-check changed figures against their sources, run the quality commands and e2e scenarios, and check the page in a real browser."
when_to_use: "Use when proving a refreshed dataset is correct before it is committed."
---

# Verification

## 4. Verify (Sequential)

Run four checks in order; all must pass before Step 5.

- **Depends on**: Step 3

### a. Source spot-check

Compare at least 10 changed figures or prices with their cited sources, or every change when fewer
changed. The floor of 10 is this workflow's choice.

**Agent**: `apps-ayokoding-www-facts-checker`, scoped to the changed rows of `core/data/models.ts` and
`core/data/operators.ts` rather than tutorial content. It fetches pages only, so the main thread reads any
client-rendered board in a real browser.

**Agent**: `apps-ayokoding-www-facts-fixer`, only when the checker reports errors; then re-check, bounded
as [Check-Fix Required Steps](../../meta/workflow-identifier/check-fix-required-steps.md) sets.

### b. Quality commands

Run in this order from the worktree root:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:test:quick
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www-fe-e2e:test:quick
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:generate-benchmark-reference
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:validate-benchmark-reference
```

The regenerated `docs/reference/ai-model-benchmarks.md` ships in the same PR.

### c. End-to-end scenarios

Run the
[`ai-benchmark.feature`](../../../../specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature)
scenarios through the `heavy` tier, which
[Guarded Admission and Parallelism](../../../development/practice/resource-aware-development/guarded-admission-and-parallelism.md)
assigns to full builds and browser suites:

```bash
./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ayokoding-www-fe-e2e:test:e2e
```

### d. Manual real-browser check

Per
[Manual Behavioural Verification](../../../development/quality/manual-behavioural-verification.md), open
the page in a real browser, in both `en` and `id`, and check the tier map, the substitute finder, and the
table: refreshed values, the new last-updated date, and no layout breakage.

- **Output**: verification results, recorded in the PR body at Step 5

**Success criteria**: all four checks pass.

**On failure**: fix at the root cause per
[CI Blocker Resolution](../../../development/quality/ci-blocker-resolution.md), then rerun from the failing
check; a check that cannot pass ends the run as `failed`.
