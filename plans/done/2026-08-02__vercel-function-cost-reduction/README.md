# Vercel Function Cost Reduction — hold the invoice under the $30 budget

Cut gross metered Vercel infrastructure usage from **~$43/month** to inside an owner-set budget of
**$30/month total invoice**, and ideally well inside it. Because
`invoice = 20 + max(0, gross − 20)`:

| Level                       | Gross metered usage | Invoice  | Enforced by                                  |
| --------------------------- | ------------------- | -------- | -------------------------------------------- |
| **Backstop** (armed cap)    | `$35`               | `$35`    | Vercel Spend Management — $15 on-demand      |
| **Budget goal** (owner-set) | `<= $30/month`      | `<= $30` | The engineering work; **advisory**           |
| **Target**                  | `< $20/month`       | `$20.00` | Credit absorbs everything; no on-demand line |
| **Stretch**                 | `< $10/month`       | `$20.00` | 50% headroom inside the credit               |

The cap sits **above** the budget on purpose: it fires only on a genuine runaway, not on an ordinary
overrun, because a cap pinned to the goal turns every bad week into a production outage. **The cap
stops catastrophe; holding $30 is the engineering work's job.** Accepted cost — a quiet month can
reach $35 without the cap ever intervening.

## Context

Re-read on **2026-08-01**, seven days into the Jul 26 – Aug 26 billing cycle: **$9.79 of the $20
included credit consumed, $0.00 on-demand** — a rate of **$1.399/day**, extrapolating to **~$43/month
gross**. That means roughly **$23/month of real on-demand overage** and an invoice around $43 against
the $30 budget, about **$13 over it** — and above the $35 armed cap, so at this rate the cap fires
before the cycle closes (~Aug 19).

The first reading (2026-07-30, $7.43 over four days) projected ~$57/month. The seven-day window is
the better estimate and supersedes it; a four-day extrapolation was too short. The problem is
smaller than first thought, and every conclusion below still holds — $43 misses the $30 budget,
overruns the credit, and trips the $35 backstop.

The single dominant line item is **Function Duration: $6.62 of the $9.79 consumed — 68% of spend**.

Root cause, verified three independent ways rather than inferred: **`apps/ayokoding-www`
prerenders zero of its 2,183 content pages.** Its build output
(`.next/prerender-manifest.json`) contains 4 entries, none of them a page, with `dynamicRoutes: 0`;
`find .next/server/app -name "*.html"` returns exactly 1 file; and live production returns
`x-vercel-cache: MISS` with `cache-control: private, no-cache, no-store` on repeated identical
requests. Every single page view executes a serverless function, and nothing is ever CDN-cached.

Two independent code causes block prerendering, and `generateStaticParams` — which already
enumerates the entire content tree — is rendered inert by them:

- **Cause A** (site-wide): the **root** layout calls `await headers()` purely to compute
  `<html lang>`. A dynamic API in the root layout opts every route in the app into dynamic rendering.
- **Cause B** (content catch-all): the `[...slug]` page accepts and awaits `searchParams` to read an
  optional `?path=` course-path parameter.

A third finding compounds it: the middleware's only productive work on the hot path is setting the
very `x-pathname` header that Cause A reads — so the middleware exists to feed the thing that makes
the site dynamic. That is a circular, self-inflicted cost running on **89% of all requests**.

The team is also still on Vercel's **legacy pre-Fluid-Compute billing model**, which bills
wall-clock time including I/O wait rather than active CPU.

## Scope

**In scope**

- Platform settings: migrate to Fluid Compute, enable Spend Management with the pause action,
  enable the free Bot Protection and AI Bots firewall rulesets, disable Observability Plus.
- `apps/ayokoding-www`: fix Cause A (promote `app/[locale]/layout.tsx` to root layout), fix Cause B
  (move `?path=` reading client-side), eliminate the middleware, scope
  `outputFileTracingIncludes`, dedupe the double `getBySlug`.
- `apps/wahidyankf-www`: convert `/`, `/cv`, `/personal-projects` to static; add `robots.ts` and
  `sitemap.ts`; fix the 404 `og-image.jpg`.
- Secondary waste: eight inert `force-dynamic` directives in `organiclever-app-web`, the crawlable
  `/system/status/be` health-check page, and an unconditional daily Storybook rebuild.

**Out of scope** (each with a recorded rationale in [tech-docs.md](./tech-docs.md))

- Adopting `cacheComponents` / PPR — it cannot fix Cause A, and it would invert fetch-caching
  defaults across all 2,183 pages, risking a re-introduction of the very problem being fixed.
- Rendering changes to `ose-www`, `organiclever-www`, `ose-app-web`, and the web-ui Storybook —
  all four are provably already fully CDN-cached.
- The 74 compiled `next.config.ts` redirect rules — they run in Vercel's edge routing layer and
  cost no function invocation. Explicitly the wrong tree.

## Approach summary

Bank the risk-free platform wins first, then remove the code causes in leverage order:

1. **Phase 0** — dashboard-only safety rails and billing-model migration, plus a per-project
   baseline snapshot taken _before_ Observability is switched off. Also empirically resolves one
   unverified risk: whether `middleware.ts` still executes at all on Next.js 16.2.6.
2. **Phases 1–4** — `apps/ayokoding-www`: the 65% line item. Cause A, then Cause B, then delete the
   now-purposeless middleware, then bundle/cold-start hygiene.
3. **Phase 5** — `apps/wahidyankf-www` static conversion and SEO files.
4. **Phase 6** — secondary waste cleanups.
5. **Phases 7–8** — Knowledge Capture and archival.

Steady-state measurement against the budget is **not** in this plan. It was split out to
[`vercel-cost-steady-state-verification`](../../ideas/q4-not-urgent-not-important/vercel-cost-steady-state-verification.md)
because grading needs a full clean billing cycle to close (earliest **2026-09-26**), which would
otherwise hold this plan open for two months after the engineering finished.

The fix is not novel architecture. `apps/ayokoding-www` **already contains the target pattern in
three places**: `tools/ai-benchmark/page.tsx` and `tools/cost-of-living-calculator/page.tsx` are
static server components wrapping client content in `<Suspense>`, and
`features/course-paths/shell/sidebar-host.tsx` already resolves `?path=` client-side via
`useSearchParams()`. Phases 1–2 make the content route match the convention the app already uses.

## Documents

| Document                       | Purpose                                                           |
| ------------------------------ | ----------------------------------------------------------------- |
| [brd.md](./brd.md)             | Business goal, cost impact, budget constraint, risks              |
| [prd.md](./prd.md)             | Behaviour that must not regress, acceptance criteria in Gherkin   |
| [tech-docs.md](./tech-docs.md) | Evidence, verified platform/framework facts, design decisions     |
| [delivery.md](./delivery.md)   | Phased, gated delivery checklist with the DAG and delivery bounds |

## Delivery at a glance

- **Delivery Mode**: `worktree-to-pr` (repo default).
- **Three independent delivery units** fan out in parallel: Unit 1 `ayokoding-www` (Phases 1–4),
  Unit 2 `wahidyankf-www` (Phase 5), Unit 3 secondary cleanups (Phase 6).
- **Phase 0 runs on local `main` in the primary checkout** — no worktree, no branch, no PR. It emits
  only dashboard settings, evidence markdown, and throwaway builds; the three worktrees are created
  at the start of Phases 1, 5, and 6.
- **Every `[HUMAN]` action in the plan sits in Phase 0** — one dashboard sitting. Phases 1–8 are
  100% `[AI]`. The apex-redirect fix was hoisted out of Phase 6 to achieve this, which makes Unit 3
  fully `[AI]` too.
- Phase 0's _settings_ steps are `[HUMAN]` — the Vercel MCP has no billing, Spend Management,
  Observability, firewall, Fluid Compute, or domain tool. Its _measurement_ steps are `[AI]` via that
  MCP, and **steps 0.1, 0.6 and 0.8 are already done** (2026-08-01).

## Measured baseline — 2026-08-01

The per-project attribution DD-7 called for is no longer an inference. Measured through the Vercel
MCP (`get_runtime_logs`), full data in
[evidence/baseline-per-project.md](./evidence/baseline-per-project.md):

- **`ayokoding-www` is 99.90% of all function volume** — 43,105 of 43,150 events across all seven
  Vercel projects in 24h. The other five sites are cache-served; `web-ui` emits nothing at all.
- **The `[...slug]` content catch-all alone is 85.6%** of that. The plan targets the right route.
- **`middleware` (274,463) ≈ `function` (273,487) over 72h.** The circular-cost finding is measured,
  and it settles the plan's one blocking unknown: middleware **does** execute on Next.js 16.2.6, so
  Phase 3 must replace the redirects before deleting the file.
- **Cross-check**: 91,162 invocations/day measured, against 85,250/day read off the billing
  dashboard on 2026-07-30 — two independent sources within ~7%.
- **Re-scoping**: `wahidyankf-www` (Unit 2) drew 45 invocations in 24h — ~0.1% of `ayokoding-www`.
  It stays in scope as an SEO/correctness fix, not as a saving.
- **New finding**: 49 × `504` in 24h — billed function time spent timing out, absent from the
  original analysis.

All source premises (Cause A, Cause B, the middleware, and every Unit 2/3 target) were re-verified
against `main` at `225b2a7ea` on 2026-08-01 and still reproduce at the documented line numbers.

## Downstream dependents

All 15 `ayokoding-learning-path-*` course-authoring/careers/skills plans in `plans/backlog/`
(`05`–`18`, plus the in-progress `04`) carry a hard `blockedBy` on this plan, since every one of them
lands new content or manifest data under `apps/ayokoding-www`'s root layout/middleware — the exact
surface this plan rewrites. Each of those plans checks this plan's completion via the same concrete
signal: `test ! -f apps/ayokoding-www/src/app/layout.tsx` (i.e. Cause A's fix — promoting
`app/[locale]/layout.tsx` to root — has landed). This plan does not need to track them individually;
they self-verify against `origin/main` at their own Phase 0.

## Related

- [`ayokoding-www-ai-benchmark-merged-chart`](../../done/2026-07-30__ayokoding-www-ai-benchmark-merged-chart/README.md)
  — sibling plan, completed and archived to `done/` during this plan's own execution. Verified
  non-conflicting:
  its `/[locale]/tools/ai-benchmark` route already reads its `sort-opus`/`sort-sonnet`/`sort-haiku`
  query state client-side inside a `<Suspense>` boundary, which is exactly the pattern this plan
  enforces everywhere else. (Those keys went through two renames after this plan was first written —
  `light` → `haiku`, then camelCase → kebab-case — and no unrated sort key exists at all.)
- [`nx-affected-cross-worktree-contamination`](../../ideas/q2-not-urgent-important/nx-affected-cross-worktree-contamination.md)
  — filed two-pager; relevant because this plan spans three worktrees concurrently.

> Deployment hosts redacted: the preview deployment's URL and ID and the project's `vercel.app` host in this plan's files were replaced with `<vercel-preview-url>`, `<vercel-preview-deployment-id>`, and `<vercel-project-host>`, so those records are not byte-verbatim.
