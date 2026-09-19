# Execution-Grade Clarity (HARD RULE)

Plans are executed by **execution-grade (sonnet-tier)** agents, not planning-grade (opus-tier) agents. Authoring-grade hand-waving is forbidden.

**Every outcome section and checkbox MUST be executable by a junior engineer fresh from bootcamp
with no professional work experience and no repository or stack context.**

- The outcome section names its canonical acceptance criterion plus **Input, Outcome, and Proof**.
- Every independently verifiable action is a separate checkbox with an executor tag.

- **Explicit file path(s)** when the action touches a known file. When the path cannot be determined at authoring time, give the maximum-possible-detail target: parent directory + naming pattern + sibling reference (e.g., "new file under `apps/organiclever-www/src/lib/` following the pattern of sibling `auth.ts`").
- **Explicit shell command(s)** verbatim when applicable (e.g.,
  `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-web:test:quick`), not
  "run the lint".
- **Prerequisites, expected failure/pass state, failure handling, and evidence destination** for
  each action; never assume professional experience supplies a missing step.
- **Separate RED, GREEN, and REFACTOR checkboxes** for every code behaviour slice.
- **Concrete proof** stating the observable change that proves done (e.g., "all assertions in
  `trpc.test.ts` pass", "the guarded `ose-web:typecheck` command exits 0"). No bare "implement X", "set up Y",
  "configure Z".

Canonical Gherkin remains in `prd.md`/`specs/**`; reference IDs/titles instead of copying full
scenarios. Checklist, LOC, and file counts never create, erase, or force delivery boundaries. Split
only at natural cohesive seams, keep every artifact required for an internally consistent unit
together, and require each resulting `main` state to be safe to deploy to production immediately.
For incomplete behaviour, record a temporary production-disabled flag, tests for both paths, and
rollout, rollback, and removal.

**`plan-checker` admits violations to the ledger. The `plan-quality-gate` repair pass rewrites offending items with maximum detail.**

A finite cross-repository lifecycle checkbox may instead use the canonical same-document controlled
runbook-reference exception when it meets every condition in the
[Plans Organization Convention §Execution-Grade Clarity](../../../../repo-governance/conventions/structure/plans/execution-grade-clarity.md#controlled-runbook-reference-exception).
Do not duplicate that exception here.

## Bad / Good Examples

**Bad** (missing path, missing command, missing criterion):

```markdown
- [ ] Add caching
```

**Good** (explicit path, explicit command, explicit criterion):

```markdown
- [ ] Edit `apps/ose-www/src/server/trpc.ts`: wrap the public router with
      `unstable_cache(..., { revalidate: 300 })`. Verify by running
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-web:test:quick` — all tests pass.
```

**Bad**:

```markdown
- [ ] Implement the rate-limit middleware
```

**Good**:

```markdown
- [ ] Create `apps/organiclever-be/src/Middleware/RateLimit.fs` (siblings: `Auth.fs`, `Cors.fs`)
      implementing token-bucket rate limiting per `tech-docs.md §Rate Limiting`. Verify by running
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:test:unit` — new test `RateLimit_RejectsExceedingRequests` passes.
```

**Bad**:

```markdown
- [ ] Run the lint
```

**Good**:

```markdown
- [ ] Run `rtk npm run affected:lint` — the existing guarded root alias exits 0 with no errors reported.
```

See [Plans Organization Convention §Execution-Grade Clarity](../../../../repo-governance/conventions/structure/plans/execution-grade-clarity.md#execution-grade-clarity-hard-rule) for the authoritative rule.
