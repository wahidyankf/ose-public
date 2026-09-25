# Factual Accuracy Validation (Step 4b)

After Step 4 (Technical Documentation), verify factual claims with web tools.

**What to verify**: dependency versions (existence, deprecation); API compatibility (e.g. tRPC v11
plus Zod v3 working together); command syntax currency; platform behaviour claims (e.g. "Next.js
serves `app/robots.ts` over `public/robots.txt`"); configuration option validity for the specified
version.

**How to verify**: use `docs-validating-factual-accuracy` Skill methodology — WebSearch for version
compatibility/deprecation/breaking changes; WebFetch official docs for API signatures/config/behaviour
claims; classify each claim `[Verified]`, `[Error]`, `[Outdated]`, `[Unverified]`; report unverified
claims as MEDIUM (may be correct but unconfirmed).

**Delegate multi-page research to `web-researcher`**: per the
[Web Research Delegation Convention](../../../../repo-governance/conventions/writing/web-research-delegation.md),
invoke [`web-researcher`](../../../../.agents/agents/web-researcher.md) for multi-page research
(threshold: 2+ `WebSearch` calls or 3+ `WebFetch` calls for one claim) — keeps the plan-audit context
lean and returns a cited, synthesised summary. Use in-context `WebSearch`/`WebFetch` only for
single-shot verification against a known authoritative URL.

### Caching Verified Claims (Iterations 2+)

Read the iteration 1 audit report's factual-verification results. Claims `[Verified]` in iteration 1
carry forward as `[Verified — cached from iteration 1]` — do not re-verify. Claims `[Error]`/
`[Outdated]` in iteration 1 that were fixed: re-verify only those. New claims from fixer edits: verify
normally. Never verify claims outside the changed files' scope. This prevents non-deterministic
WebSearch results from generating new findings on unchanged claims.
