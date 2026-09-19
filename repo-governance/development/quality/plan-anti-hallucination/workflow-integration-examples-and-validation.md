---
description: "Workflow fit, worked examples, and how this is validated."
when_to_use: "Use for a worked example of this convention."
---

# Workflow Integration, Examples, and Validation

## Workflow Integration

- **`plan-quality-gate`** workflow — Step 1 (Initial Validation) explicitly invokes the hallucination scan as part of `plan-checker`'s Step 5f. The gate cannot pass while `[Unverified]` claims remain or any Anti-Pattern violation is open.
- **`plan-execution`** workflow — Step 2 (Initial Execution) per-item verification: before delegating an item, the orchestrator re-grounds its file paths and commands. Verification failure escalates rather than proceeds (refuse-on-uncertainty applied at execution time too).

## Examples

### Good — repo-grounded file path

```markdown
- [ ] Edit `apps/ose-www/src/server/trpc.ts` [Repo-grounded] — wrap public router with
      `unstable_cache(fn, keyParts, { revalidate: 300 })` per Next.js 16 docs (verified
      2026-05-03 at https://nextjs.org/docs/app/api-reference/functions/unstable_cache,
      excerpt: "unstable_cache allows caching results of expensive operations") [Web-cited].
      Verify by running
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-www:test:quick`
      — all tests pass.
```

### Bad — invented file path + fabricated API

```markdown
- [ ] Edit `apps/ose-www/src/lib/cache-config.ts` to enable Next.js automatic edge caching
      with `enableEdgeCache(true)`. Performance improves by 40%.
```

Problems: file path was not verified (probably does not exist); `enableEdgeCache` is fabricated API; 40% is a fabricated KPI. Three Anti-Pattern violations (AP-2, AP-4, AP-5).

### Good — refuse-on-uncertainty

```markdown
- [ ] Add Sharia-compliant interest-free billing model to `apps/organiclever-www/src/components/Pricing.tsx`.
      _Unknown — verify Vercel + Stripe Sharia-compliance posture before authoring_ — see follow-up
      research item under Open Questions.
```

The author refused to write a fabricated billing flow. A follow-up research item appears under the plan's Open Questions section. Better than fabricating.

## Validation

To validate a plan complies with this convention:

1. **Confidence labels present**: every non-trivial factual claim has `[Repo-grounded]` / `[Web-cited]` / `[Judgment call]` / `[Unverified]` or is contained in a quoted code-fence whose source is unambiguous.
2. **No Anti-Pattern hits**: `plan-checker` Step 5f scan reports zero AP-1 through AP-14 violations.
3. **Repo-grounding verifiable**: every internal reference (file path, Nx target, agent, skill) resolves on the current commit.
4. **External citations complete**: every `[Web-cited]` claim includes URL + access date + excerpt inline.
5. **No bare KPIs**: every numeric percentage / duration / count is either an observable check, a citation, or `[Judgment call]` — never an unlabeled fact.

`plan-checker` enforces all five at validation time.
