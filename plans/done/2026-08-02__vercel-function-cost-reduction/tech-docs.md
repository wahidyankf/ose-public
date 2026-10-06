# Technical Documentation — Vercel Function Cost Reduction

## Evidence: why nothing is cached

Every claim below was verified against the committed build output and against live production on
**2026-07-30**. Nothing here is inferred from reading source alone.

### Build output proves zero prerendered pages

`apps/ayokoding-www/.next/prerender-manifest.json` (BUILD_ID `FHQcNd6t8H3HTYFAhxlh2`, built
2026-07-27) contains exactly **4** entries, none of which is a page:

```text
routes:        ["/_global-error", "/feed.xml", "/robots.txt", "/sitemap.xml"]
dynamicRoutes: 0
```

`.next/routes-manifest.json` classifies every page as a dynamic route. `find .next/server/app -name
"*.html"` returns **1** file (`_global-error.html`).

### Live production confirms it

The same course-lesson URL, requested three times consecutively:

```text
GET /en/learn/courses/debugging-and-profiling/learning
run1  ttfb=0.547s  x-vercel-cache: MISS
run2  ttfb=0.613s  x-vercel-cache: MISS
run3  ttfb=0.712s  x-vercel-cache: MISS
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
```

`/en` and `/en/browse` return the same headers. Nothing is ever cached at the edge.

### Cause A — `headers()` in the root layout

`apps/ayokoding-www/src/app/layout.tsx:3,24-25`:

```ts
import { headers } from "next/headers";
// ...
const headersList = await headers();
const pathname = headersList.get("x-pathname") ?? headersList.get("x-url") ?? "";
```

Its only purpose is line 30's `htmlLang(locale)` — computing the `lang` attribute. Roughly four
lines of code forfeit static generation for every content page in the app — **2,183** markdown files
as of 2026-08-01 (`en` 2,059 / `id` 124), up from the 2,068 measured on 2026-07-30 and still growing
under the `ayokoding-learning-path-*` plans. The cost of Cause A scales with the content tree.

### Cause B — `searchParams` in the content catch-all

`apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx:94,365`:

```ts
searchParams: Promise;
// ...
const usp = urlSearchParamsFrom(await searchParams); // line 365
```

Used only to read an optional `?path=` course-path context.

`generateStaticParams` at `[...slug]/page.tsx:55-88` already enumerates the whole content tree. It
is complete and correct — Causes A and B simply prevent it from ever materialising.

### The circular middleware

`apps/ayokoding-www/src/middleware.ts` matcher:
`["/((?!_next/static|_next/image|favicon.ico|favicon.png).*)"]`.

`src/features/i18n/shell/middleware.ts` does exactly five things; on the hot path for a real page
request only step 5 executes — `NextResponse.next()` plus
`response.headers.set("x-pathname", pathname)` (lines 44-47). **That header exists solely to feed
Cause A.** The middleware runs on 89% of all requests to produce the value that makes the site
dynamic. Removing Cause A makes the middleware purposeless.

The other four steps are: an early `next()` for `/api/`, `/_next/`, favicons, `robots.txt`,
`sitemap.xml`, `feed.xml` (lines 9-18); the `/` → `/en` 307 (lines 21-23); the uppercase-locale 308
(lines 30-34); and a no-op branch (lines 37-42). Only the two redirects need a new home.

### Supporting cost drivers

| Driver                                                                                                                                                      | Evidence                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full content index read per cold start: 2,068 files / 70.46 MiB **as measured 2026-07-30** (2,183 files by 2026-08-01), `readFile` + gray-matter + Zod each | `src/features/content/shell/repository-fs.ts:18-58`, `service.ts:246-256`, module singleton at `src/features/app-shell/shell/trpc-init.ts:12`                               |
| Per-request markdown parse with Shiki dual themes                                                                                                           | `src/features/content/core/parser.ts:33-61` (`rehypePrettyCode`, `github-dark` + `github-light`)                                                                            |
| `getBySlug` called **twice per request** for the same slug                                                                                                  | `[...slug]/page.tsx:130` (`generateMetadata`) and `:339` (page body)                                                                                                        |
| 7,515 content files traced into **every** function bundle                                                                                                   | `next.config.ts:25-27` `outputFileTracingIncludes: { "/**": [...] }`; confirmed in four separate `.nft.json` trace files, including `api/trpc`. `.next/standalone` = 165 MB |
| Whole content tree in every page's RSC flight payload                                                                                                       | `src/features/navigation/shell/sidebar.tsx:10` → `sidebar-tree.tsx:1` (`"use client"`); 1,938 `"slug"` occurrences in one 425,996-byte live response                        |

### wahidyankf-www

Build route table shows `ƒ /`, `ƒ /cv`, `ƒ /personal-projects`, `○ /_not-found`. Each dynamic route
is dynamic for one reason: `await searchParams` for `?search=`, at `src/app/page.tsx:3-4`,
`src/app/cv/page.tsx:10-11`, `src/app/personal-projects/page.tsx:10-11`.

All three consumers are **already** `"use client"` and use the value only to seed `useState`
(`HomeContent.tsx:29-31`, `CvContent.tsx:477-484`, `PersonalProjectsContent.tsx:21-27`), so the fix
is a prop removal, not a rewrite. `grep useSearchParams` currently returns no hits in this app.

Live: `x-vercel-cache: MISS`, `cache-control: private, no-cache, no-store`, `/cv` renders 178,411 B
per invocation. There is no `robots.ts` and no `sitemap.ts`, while `src/app/layout.tsx:54-64` sets
maximally crawl-inviting robots metadata. `layout.tsx:39,51` reference an `og-image.jpg` that 404s.

### Ruled out — do not re-litigate

| Candidate                                                      | Verdict                                                                                                                                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The 74 `next.config.ts` redirect rules                         | **Not a cost factor.** Compiled to regexes in `routes-manifest.json` and evaluated in Vercel's edge routing layer _before_ middleware — zero function invocation. Wrong tree.     |
| Image Optimization                                             | **Zero cost.** `images: { unoptimized: true }` in all five `next.config.ts`; `isNextImageImported: false`.                                                                        |
| Crons / scheduled invocations                                  | **None.** No `crons` key in any `vercel.json`; there is no root `vercel.json`.                                                                                                    |
| ISR background regeneration                                    | **None.** No `revalidate` export anywhere; all four prerendered routes have `initialRevalidateSeconds: false`.                                                                    |
| `ose-www`, `organiclever-www`, `ose-app-web`, web-ui Storybook | **Provably cached.** All return `x-vercel-cache: HIT` with `x-nextjs-prerender: 1` and ages of 13–45 days.                                                                        |
| `next/link` prefetch amplification                             | **Refuted.** A dynamic route is not prefetched without a `loading.js` boundary, and zero `loading.*` files exist in either app. An earlier hypothesis; corrected before planning. |

## Verified platform facts

### The team is on legacy pre-Fluid-Compute billing

A **non-zero** line item named **"Function Duration" measured in GB-Hrs**, plus a **standalone priced
"Edge Middleware Invocations"** line, belong to the legacy pre-Fluid vocabulary. The current model
bills three distinct resources: Active CPU ($0.128/CPU-hr in `iad1`), Provisioned Memory
($0.0106/GB-hr), and Invocations ($0.60/M).

**Read the values, not the presence of the rows (corrected 2026-08-01).** The dashboard renders the
full line-item catalogue and zeroes whatever does not apply, so `Fluid Active CPU` and
`Fluid Provisioned Memory` are already visible at **$0.00** next to `Function Duration` at **$6.62**.
An earlier draft of this section reasoned from the Fluid rows being _absent_ under legacy billing;
they are not absent, they are zero. The diagnosis stands on Function Duration being non-zero. This
matters because step 0.3's acceptance criterion was written against the absent-row reading and would
have "passed" on first inspection without any migration having occurred — see the evidence file's
§Correction to the legacy-billing diagnostic.

- [Fluid compute pricing](https://vercel.com/docs/functions/usage-and-pricing) — updated 2026-06-16
- [Legacy usage & pricing for Functions](https://vercel.com/docs/functions/usage-and-pricing/legacy-pricing) — updated 2026-06-25
- [Routing Middleware](https://vercel.com/docs/routing-middleware) — updated 2026-07-01

The legacy docs state the model bills wall-clock time and recommend migrating: "Enable Fluid compute
for more cost-effective billing that separates active CPU time from provisioned memory time."

The $0.18/GB-Hr legacy rate is not published in a current table, but appears in Vercel's own blog
([Introducing Active CPU pricing for Fluid compute](https://vercel.com/blog/introducing-active-cpu-pricing-for-fluid-compute),
2025-06-25) as the comparison baseline. The observed rate is $0.1801 — an exact match.

**Why Fluid Compute matters here**: it pauses billing during I/O wait, and one warm instance serving
N concurrent requests bills Provisioned Memory once for the instance-hour regardless of request
count. Content rendering is I/O-heavy (reading 70 MB of markdown), so most of the current billed
wall-clock time is exactly what Active CPU billing excludes.

### Pro credit mechanics — the budget target

[Vercel Pro plan](https://vercel.com/docs/plans/pro-plan) (updated 2026-07-15): "$20/month Pro
platform fee — 1 deploying team seat included — $20/month in usage credit", and "Vercel will charge
usage against your monthly credit before switching to on-demand billing." The credit resets monthly
and unused portions expire.

Therefore the $7.43 "Infrastructure Subtotal" is **pre-credit gross usage**, not an additive charge.
The arithmetic that governs every target in this plan is:

```text
invoice = 20 + max(0, gross_metered_usage - 20)
```

So the owner's **$30/month invoice ceiling** is exactly `gross_metered_usage <= $30`; a gross figure
of $20 or below yields an invoice of exactly $20.00 with no on-demand line at all. The three tiers in
[brd.md](./brd.md) — ceiling $30, target $20, stretch $10 — are all statements about **gross** usage,
which is what the dashboard's Infrastructure Subtotal reports. The Spend Management threshold is the
one number in this plan that is **not** gross (see below).

**Open risk carried forward**: Vercel's docs are internally inconsistent about whether the credit
covers **Observability Plus** — the Pro plan page lists it under "Paid add-ons" while the pricing
page lists Observability under "Managed Infrastructure". Disabling Observability Plus (DD-1) removes
the ambiguity rather than betting on either reading.

### Spend Management is not a hard cap

[Spend Management](https://vercel.com/docs/spend-management) (updated 2026-06-26):

- Location: **Team → Settings → Billing → Spend Management**. Requires Owner or Billing role.
- "Setting a spend amount does not automatically stop usage. If you want to pause all your projects
  at a certain amount, you must enable the option." The pause action is **off by default** and
  requires typing the team name to confirm.
- Checks run "every few minutes", so spend can overshoot. Vercel's own guidance: set the threshold
  below the true ceiling.
- **The threshold meters spend _above_ the plan credit, not gross usage.** Verbatim: "The spend
  amount that you set covers metered resources that go **beyond** your Pro plan credits and usage
  allocation for all projects on your team." It also excludes seats, Marketplace integrations, and
  add-ons, which Vercel bills separately and monthly.
- Notifications fire at 50%, 75%, 100%. Unpausing is manual and per-project — raising the spend
  amount does **not** unpause anything.

**Correction, 2026-08-01.** An earlier draft of this plan recommended a spend amount on the
reasoning that it was "well inside the $20 credit". That reading was **inverted**: because the
threshold counts only post-credit spend, any amount you set is _past_ the credit, not inside it — the
configured $15 means a **$35 invoice**, not $15 of gross usage. Anyone reasoning from the old
sentence would pick a dangerously low value believing it bought safety. See DD-9.

### Free firewall rulesets block before the meter

[WAF managed rulesets](https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets)
(updated 2026-07-09) and
[WAF usage & pricing](https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing)
(updated 2026-06-16):

- **Bot Protection** is inactive by default (dashboard label "Off"). **AI Bots** is inactive by
  default (label "Allow"). Both are **free**; only rate limiting and the OWASP Core Ruleset are
  priced (rate limiting $0.50/M _allowed_ requests in `iad1`).
- Verbatim: "WAF deny, challenge, or rate-limit mitigated traffic does not incur CDN Requests or
  Fast Data Transfer (FDT)."
- WAF executes ahead of Functions and Middleware in the documented rule-execution order, so a
  blocked request never becomes a billed invocation.

**Open risk carried forward**: primary documentation does **not** confirm that Bot Protection
auto-allowlists verified crawlers such as Googlebot. This is why DD-2 mandates an indexability
smoke-test and a documented rollback.

### Observability Plus

[Observability Plus](https://vercel.com/docs/observability/observability-plus) (updated 2026-07-06):
$1.20/M events (observed: $1.204/M — matches). Base Observability is free on all plans. Excluding a
project stops its metered events entirely. **No per-event sampling control exists** — the only
levers are the team-level toggle and per-project exclusion. Toggles live at Team Settings → Billing
→ Observability Plus, or per-project via "Exclude Project from Plus".

Note: it is **enabled by default** for teams created or upgraded to Paid Pro on or after 2026-04-03,
which likely explains why this charge appeared without a deliberate opt-in.

### Fast Origin Transfer can be billed twice per request

Verbatim from [CDN pricing and usage](https://vercel.com/docs/manage-cdn-usage) (updated
2026-06-23): "If using Middleware, it is possible to accrue Fast Origin Transfer twice for a single
Function request. To prevent this, you want to only run Middleware when necessary." This is an
additional, independent reason to eliminate the middleware.

## Verified framework facts

### Promoting the root layout is Next.js's documented i18n pattern

A root layout is required, but it need **not** be `app/layout.tsx`:

> "Omitting `app/layout.js` — layouts in subdirectories like `app/dashboard/layout.js` each become
> root layouts." … "The root layout can be under a dynamic segment, for example when implementing
> internationalization with `app/[lang]/layout.js`."

- [`layout.js` file convention](https://nextjs.org/docs/app/api-reference/file-conventions/layout) — updated 2026-03-05
- [Internationalization guide](https://nextjs.org/docs/app/guides/internationalization) — updated 2025-12-09

The official pattern:

```tsx
// app/[locale]/layout.tsx — this IS the root layout once app/layout.tsx is deleted
export default async function RootLayout({ children, params }) {
  return (
    <html lang={(await params).locale}>
      <body>{children}</body>
    </html>
  );
}
```

**Critical constraint**: `app/layout.tsx` must be **deleted entirely**. If it remains, it stays the
root layout, `app/[locale]/layout.tsx` remains merely nested, and nested layouts are forbidden from
rendering `<html>` / `<body>`. Both files exist today, so this is a move-and-delete.

`headers()` forces dynamic rendering — "Using it will opt a route into dynamic rendering"
([`headers()`](https://nextjs.org/docs/app/api-reference/functions/headers), updated 2026-03-03).
There is no static-compatible alternative that keeps the read: `cookies()` is equally dynamic.

### `searchParams` → `useSearchParams()` restores prerendering

[`useSearchParams`](https://nextjs.org/docs/app/api-reference/functions/use-search-params) (updated
2026-07-22): "If a route is prerendered, calling `useSearchParams` will cause the Client Component
tree up to the closest `Suspense` boundary to be client-side rendered."

The `<Suspense>` wrapper is **mandatory**, and dev mode hides its absence: "During production
builds, a static page that calls `useSearchParams` from a Client Component must be wrapped in a
`Suspense` boundary, otherwise the build fails." Every such change therefore needs a real
`next build` in its acceptance criteria — a dev-server check is not evidence.

**This app already implements the pattern in three places**, which is the strongest available
de-risking:

- `src/app/[locale]/tools/ai-benchmark/page.tsx` — static server component, `<Suspense>`, client
  `useSearchParams()` in `benchmark-content.tsx:18`.
- `src/app/[locale]/tools/cost-of-living-calculator/page.tsx` — same, `calculator-content.tsx:31`.
- `src/features/course-paths/shell/sidebar-host.tsx:36` — **already** resolves `?path=` client-side.

That last one matters most: the client-side `?path=` resolution Cause B duplicates server-side
**already ships and works**.

### Routing order confirms config redirects replace middleware redirects

[`proxy.js` file convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
(updated 2026-05-13) documents the order: `headers` from config → **`redirects` from config** →
Proxy/middleware → `beforeFiles` rewrites → filesystem routes → dynamic routes → `fallback`
rewrites. Config redirects fire **before** middleware, so moving both redirects there eliminates
those middleware invocations outright.

**Caveat**: `path-to-regexp` is case-**sensitive** and cannot lowercase a captured parameter in the
destination ([discussion #43495](https://github.com/vercel/next.js/discussions/43495)). With two
locales the variant set is finite, so enumerate literally rather than attempting generic case-folding.

### Blocking unresolved risk — does `middleware.ts` still execute on 16.2.6?

Next.js 16 deprecated `middleware.ts` in favour of `proxy.ts`
([Renaming Middleware to Proxy](https://nextjs.org/docs/messages/middleware-to-proxy); codemod
`npx @next/codemod@canary middleware-to-proxy .`). Secondary sources **conflict** on runtime
behaviour in 16.2.x: some report a warning-but-works, others report that since 16.2.4 Next "no
longer looks for the file by default" — meaning it compiles and typechecks cleanly but **silently
no-ops**.

This app runs 16.2.6 and depends on middleware for the `/` → `/en` redirect today. A silent no-op is
far worse than a build error, so Phase 0 resolves this **empirically** on the deployed app before
any code depends on the answer.

### `outputFileTracingIncludes` must be keyed per route

[`output` reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
(updated 2025-10-08): "Keep patterns as narrow as possible to avoid oversized traces (avoid `**/*`
at the repo root)." The option applies only to **server** traces, so once content pages are static
they stop needing content traced at all — Phase 1–2 shrink this problem before Phase 4 addresses it.

`output: "standalone"` is dead configuration on Vercel (neutral, not harmful) but **is required by
this app's Dockerfile**. Do not delete it blindly; verify the Docker path still builds.

### `React.cache()` scope

[React `cache()`](https://react.dev/reference/react/cache): "React will invalidate the cache for all
memoized functions for each server request." It dedupes **within** one render pass only — exactly
right for the double `getBySlug`, and nothing more. Its stakes drop sharply once pages are static,
since "per request" becomes "per build".

## Vercel MCP capability boundary

The Vercel MCP server (`plugin:vercel:vercel`, OAuth-authenticated 2026-08-01) changes which steps
an agent can perform. Its surface was probed empirically rather than assumed — what follows is what
the tools actually returned, not what their names suggest.

### What the MCP makes `[AI]`-doable

| Capability                    | Tool                                        | Plan step it unlocks                                        |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Per-project invocation counts | `get_runtime_logs` + `group_by: source`     | **0.1** — DD-7's attribution, without the billing dashboard |
| Per-route function volume     | `get_runtime_logs` + `group_by: route`      | 0.1, and the Phase 1/2/4 before-and-after comparison        |
| Status-code mix               | `get_runtime_logs` + `group_by: statusCode` | 0.1; surfaced the previously unknown 504s                   |
| Middleware liveness           | `get_runtime_logs`, `source: middleware`    | **0.6** — the blocking question, answered by measurement    |
| Deploy state and provenance   | `get_deployment`, `list_deployments`        | Phase 4/5 deploy verification                               |
| Doc verification              | `search_vercel_documentation`               | re-checking the platform facts above as they change         |

### What it cannot do — these stay `[HUMAN]`

No tool exists for billing, usage, invoices, Spend Management, Observability Plus, the firewall/WAF,
Fluid Compute, or domain configuration. The only mutating tools in the entire surface are
`deploy_to_vercel`, `update_project_deployment_protection`, the `buy_*` purchase family, and the
comment-toolbar tools. Therefore steps **0.2, 0.3, 0.4, 0.5**, the Phase 6 domain fix, and the
invoice reading (now split out to
[`vercel-cost-steady-state-verification`](../../ideas/q4-not-urgent-not-important/vercel-cost-steady-state-verification.md))
are unchanged — an agent still cannot reach those settings.

`get_deployment` reports `type: "LAMBDAS"` and exposes no fluid-compute flag, so an agent cannot even
_verify_ DD-3's migration; that check remains a human dashboard read.

### Identifiers in a public repo

`ose-public` is public and its history is permanent, so this plan addresses Vercel resources by
**slug**, never by opaque ID.

Vercel IDs (`team_*`, `prj_*`, `dpl_*`) are **identifiers, not credentials** — every API call still
requires a bearer token, so an ID alone grants nothing. They are nonetheless not published here, for
three reasons:

1. Vercel's own tooling treats them as non-public: `vercel link` writes `orgId`/`projectId` into
   `.vercel/project.json` and gitignores that directory, and Vercel's CI guidance stores
   `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` as encrypted secrets rather than inline values.
2. They are stable and non-rotatable in practice — unlike a token, you cannot cheaply revoke a
   project ID if one day it turns out to matter.
3. Committing them buys nothing: `get_runtime_logs`, `get_project`, `list_deployments`, and
   `get_deployment` all accept a slug wherever they accept an ID (verified 2026-08-01 — the same
   query returns identical data both ways).

The slugs `wahidyan-kresna-fridayokas-projects` and `ayokoding-www` are already public: they appear
in every preview and production deployment hostname, e.g.
`<vercel-project-host>`. Publishing them adds no information.

Related hardening found while checking this: the repo `.gitignore` had **no `.vercel/` entry**. No
`.vercel/` directory is tracked or present today, but any future `vercel link` would create one
containing both IDs. An ignore rule was added.

### Measured operational limits

- `since: "24h"` and `since: "72h"` return; `since: "7d"` fails with `Aggregate query failed:
timed out`. **72h is the widest usable window.**
- `group_by` truncates to the top _N_ with a "showing top N" footer; pass `limit` explicitly or lose
  rows silently.
- `get_web_analytics` is unusable here: `400 web_analytics_not_enabled` on `ayokoding-www`. Web
  Analytics is a separate product from Observability and is off. Do not plan around it.
- Counts are **log events**, not billed units. They give attribution and volume, never dollars.

## Measured baseline — supersedes the inference

Full data in [evidence/baseline-per-project.md](./evidence/baseline-per-project.md), captured
2026-08-01. The three findings that change how the plan should be read:

1. **`ayokoding-www` is 99.90% of all function volume** (43,105 of 43,150 events across all seven
   projects in 24h). DD-6 and DD-7 are confirmed by measurement.
2. **The `[...slug]` content catch-all alone is 85.6%** of `ayokoding-www`'s function volume. The
   plan's leverage ordering is correct.
3. **`middleware` (274,463) ≈ `function` (273,487) over 72h** — a 0.36% gap. The circular-cost
   finding is now measured. It also settles the Phase 0.6 question: middleware **does** execute on
   16.2.6, so Phase 3 is the "replace before delete" branch.

Cross-check: 91,162 function invocations/day measured here versus the dashboard's 85,250/day on
2026-07-30 — two independent sources within ~7%.

Two adjustments follow from the data:

- **`wahidyankf-www` (Unit 2) has negligible cost impact** — 45 function events in 24h, 0.1% of
  `ayokoding-www`'s. Its justification is SEO correctness and the missing `robots.ts`/`sitemap.ts`,
  not savings. Keep it (the fix is a prop removal), but do not attribute budget headroom to it.
- **49 × `504` in 24h** is a new finding not in the original analysis — billed function time spent
  timing out, consistent with the cold-start content-index read.

## Design decisions

### DD-1 — Disable Observability Plus entirely, team-wide

Removes ~$10/month (17% of gross spend) at a measured, certain rate. There is no sampling control,
so the only alternatives were per-project exclusion or full disablement. Full disablement also
sidesteps the unresolved question of whether the Pro credit covers this charge at all. Accepted
tradeoff: shorter retention and no Query access; base Observability remains free and available.

### DD-2 — Enable Bot Protection and set AI Bots to deny

Both are free, both are currently off, and mitigation happens **before** the billing meter. Given
341K invocations across four days for sites of this size, crawler traffic is a material share.
Accepted risk: Googlebot allowlisting is unverified, so this carries a mandatory indexability
smoke-test and a single-toggle rollback.

### DD-3 — Migrate to Fluid Compute in Phase 0, before any code change

Banks a large win immediately (Vercel's own comparison: ~$0.149/hr vs ~$0.318/hr equivalent, and
more for I/O-bound work) and de-risks the plan by reducing exposure before touching code. The
alternative — migrating after the static conversion, when few functions remain to bill — leaves
money on the table for the entire duration of the code work for no benefit.

### DD-4 — Fix Cause A by promoting the locale layout, not by patching the header read

Rejected alternatives: reading `cookies()` instead (equally dynamic); passing the locale down some
other server channel (no such channel exists that is not itself a dynamic API); keeping the root
layout and accepting dynamic rendering (this is the entire problem). The locale is **already** a
route segment, so `params` is the natural, documented, zero-cost source.

### DD-5 — Do not adopt `cacheComponents` / PPR

Three independent reasons:

1. **It cannot fix Cause A.** `<html lang={...}>` needs its value synchronously to emit the element;
   an attribute cannot be deferred behind a `<Suspense>` boundary the way child content can.
2. **It could make things worse.** Enabling it means "all dynamic code in any page, layout, or API
   route is executed at request time by default" ([Next.js 16](https://nextjs.org/blog/next-16),
   2025-10-21) — inverting fetch-caching defaults across all 2,183 pages risks re-introducing the exact
   problem being fixed, absent an exhaustive `use cache` audit.
3. **It is not declared stable.** Next.js labelled Turbopack and React Compiler "stable" in the same
   release post and never applied that word to Cache Components
   ([`cacheComponents`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents),
   updated 2026-05-13).

Orthogonal, higher-risk, and unnecessary for the win. Explicitly out of scope.

### DD-6 — Include wahidyankf-www, exclude the four already-cached projects

wahidyankf-www is the only other project with genuinely dynamic routes, and its fix is a prop
removal against already-client consumers. `ose-www`, `organiclever-www`, `ose-app-web`, and the
Storybook are provably CDN-cached and are excluded to keep the change surface honest.

### DD-7 — Take the per-project baseline before disabling Observability

Aggregate billing figures cannot be split per project from repo evidence. The middleware-count
≈ function-count equality points hard at ayokoding-www as the dominant consumer, but that is
inference. Since DD-1 disables the tool that can answer the question, the snapshot must be taken
first — otherwise the plan's savings attribution is unfalsifiable.

**Status: satisfied 2026-08-01**, ahead of DD-1, via the Vercel MCP rather than the dashboard — see
[evidence/baseline-per-project.md](./evidence/baseline-per-project.md). The inference held: 99.90%.

### DD-8 — Use the Vercel MCP for measurement, never as a substitute for the dashboard steps

The MCP moves the _measurement_ half of Phase 0 from `[HUMAN]` to `[AI]` and gives every later phase
a stronger success metric than a single `curl` — a before-and-after invocation count per route.

It changes **nothing** about the settings half. The temptation to re-tag 0.2–0.5 as `[AI]` because
"we have Vercel access now" must be resisted: the probe found no billing tool and no settings tool of
any kind. Steps that were `[HUMAN]` because they need the dashboard stay `[HUMAN]`, and a step is
re-tagged only where a _named tool_ was shown to return the required datum.

Rejected alternative: `get_web_analytics` as the baseline source. It returns
`400 web_analytics_not_enabled`, and enabling Web Analytics to measure a cost-reduction plan would
add a metered product to cut a bill.

### DD-9 — $15 spend cap as a soft backstop under a $30 budget goal

Two numbers doing two different jobs, deliberately not the same number:

| Number                          | Kind                    | Enforced by             |
| ------------------------------- | ----------------------- | ----------------------- |
| **$30 invoice** (gross ≤ $30)   | Budget **goal**         | The engineering work    |
| **$15 on-demand** (invoice $35) | **Backstop**, armed     | Vercel Spend Management |
| **$20 invoice** (gross < $20)   | Target — zero on-demand | The engineering work    |
| **$10 gross**                   | Stretch                 | The engineering work    |

Because the spend amount meters post-credit spend (see §Spend Management above), $15 sits **$5 above**
the $30 goal, making the enforced worst case **$35**. That gap is the decision.

**Why not set the cap at the goal.** A cap pinned to $10 fires on a normal overrun — an ordinary bad
week takes every production site down and each project then needs resuming by hand. Setting it $5
higher means it fires only on a genuine runaway. The explicit, accepted cost: **a quiet month can
invoice up to $35 without the cap ever intervening.** The cap stops catastrophe, not overspend.
Holding $30 is the plan's job, not the cap's — and the $30 goal is therefore **advisory**, tracked by
the successor plan's grading rather than enforced by the platform.

The consequence is stated plainly rather than discovered in production. At the measured burn rate
(**$1.399/day gross**, from $9.79 over 7 elapsed days on 2026-08-01): the $20 credit is exhausted
around **Aug 8**, the $30 goal is passed around **Aug 15**, the cap fires around **Aug 19**, and the
cycle would close near**$43**. Since $43 exceeds the $35 cap, **the cap will fire this cycle unless
Phases 1–4 land first** — every production project serving `503 DEPLOYMENT_PAUSED` until resumed one
at a time. That is the schedule pressure on Unit 1.

Rejected alternatives:

- **Cap at $10, matching the goal exactly** — enforces $30 mechanically, but converts every ordinary
  overrun into an outage and offers no lag margin against Vercel's multi-minute check interval.
- **Alerts only, arm the pause after Phase 4** — no outage risk at all, but then nothing bounds a
  runaway; the ceiling degrades to a promise that depends on someone reading a notification.

## File impact

| Path                                                                    | Change                                                               |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `apps/ayokoding-www/src/app/layout.tsx`                                 | **Deleted**; contents merged into the locale layout                  |
| `apps/ayokoding-www/src/app/[locale]/layout.tsx`                        | Becomes the root layout; renders `<html lang={params.locale}>`       |
| `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx`      | `searchParams` prop removed; `?path=` resolution moves client-side   |
| `apps/ayokoding-www/src/middleware.ts`                                  | **Deleted** (redirects move to config)                               |
| `apps/ayokoding-www/src/features/i18n/shell/middleware.ts`              | **Deleted** or reduced to the pure redirect helpers it still needs   |
| `apps/ayokoding-www/next.config.ts`                                     | Two redirects added; `outputFileTracingIncludes` scoped per route    |
| `apps/ayokoding-www/src/features/content/shell/service.ts`              | `getBySlug` wrapped in `React.cache()`                               |
| `apps/wahidyankf-www/src/app/{page,cv/page,personal-projects/page}.tsx` | `searchParams` prop removed                                          |
| `apps/wahidyankf-www/src/features/*/shell/*Content.tsx`                 | Read `useSearchParams()` behind `<Suspense>`                         |
| `apps/wahidyankf-www/src/app/{robots,sitemap}.ts`                       | **New**                                                              |
| `apps/wahidyankf-www/src/app/layout.tsx`                                | Fix the 404 `og-image.jpg` reference                                 |
| `apps/organiclever-app-web/src/app/app/**/{layout,page}.tsx`            | Remove **8** inert `force-dynamic` directives (9 in the app; 1 kept) |
| `apps/organiclever-app-web/src/app/system/status/be/page.tsx`           | Add `robots: { index: false }`                                       |
| `.github/workflows/web-ui-build-deploy-prod.yml`                        | Gate the daily force-push on a `libs/web-ui/` diff                   |
| `libs/web-ui/vercel.json`                                               | Add an `ignoreCommand`                                               |
| `specs/apps/ayokoding/behavior/ayokoding-www/gherkin/**`                | New/updated feature files per the PRD                                |

## Testing strategy

Machine-checkable criteria only, each falsifiable in both directions:

| Check                                                                  | Before      | After                   |
| ---------------------------------------------------------------------- | ----------- | ----------------------- |
| `jq '.routes \| length' .next/prerender-manifest.json` (ayokoding-www) | `4`         | `>= 2000`               |
| `next build` route table, content catch-all                            | `ƒ`         | `●` or `○`              |
| `next build` route table, wahidyankf `/`, `/cv`, `/personal-projects`  | `ƒ` ×3      | `○` ×3                  |
| `curl -I` repeat request, `x-vercel-cache`                             | `MISS`      | `HIT`                   |
| `curl -I` `/` with redirects disabled                                  | 307 → `/en` | 307 → `/en` (unchanged) |

Five repo-specific traps to avoid when writing acceptance commands. Every one of them shares a
failure mode: **a check that silently observes nothing still exits 0**, and reads as a pass.

- `grep` here is a shell function routing to **UGREP**. Never use `-L` (it means
  files-without-match and exits 0). Use `--exclude-dir`, not `--glob`.
- `apps/ayokoding-www`'s `test:e2e` and `test:integration` Nx targets are **no-op echo stubs**. They
  must never be cited as evidence that anything passed.
- **There is no `specs:coverage` target** on `ayokoding-www`, `wahidyankf-www`, or
  `organiclever-app-web`. `nx.json` lists `specs:coverage` under `targetDefaults`, but that entry
  carries only `{"cache": true}` — targetDefaults merge into targets that already exist and never
  create one. The real names are `specs:structure-validation` and `specs:behavior:coverage`, both
  wrapped by `test:specs`, which `test:quick` already chains. Confirm with `nx show project <name>`.
- **A test file that matches no vitest include glob is collected by nothing and exits 0.** The three
  apps do not share globs: `ayokoding-www` collects `**/*.unit.{test,spec}.{ts,tsx}` (node) plus
  `src/features/**` and `src/app/**` `*.test.*` (jsdom), and `test/unit/**` only under `be-steps`
  and `fe-steps`; `wahidyankf-www` collects `src/**/*.unit.test.{ts,tsx}` only; `organiclever-app-web`
  collects both `**/*.unit.*` and `src/**/*.{test,spec}.*`. This exact trap was already caught once
  as a HIGH review finding — see the comment at `apps/ayokoding-www/vitest.config.ts:82-93`.
- **`test:unit` cannot see build output, and will cache a stale pass.** It is `cache: true`, has no
  `dependsOn: ["build"]`, and does not list `.next/**` among its inputs. Any assertion over
  `.next/prerender-manifest.json`, `*.nft.json`, or the route table must run behind an explicit
  `nx build`, never inside a unit test. This plan therefore splits every such check into a
  cache-safe **source-level** guard plus a separate **build-output proof**.

Unit coverage follows the repo's three-level standard; the Gherkin in [prd.md](./prd.md) binds to
feature files under `specs/apps/ayokoding/behavior/ayokoding-www/gherkin/`. The wahidyankf-www spec
path must be located in the existing tree, not invented.

## Rollback

| Change                          | Rollback                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot Protection / AI Bots        | Single dashboard toggle back to "Off" / "Allow". No deploy needed. Fastest rollback here.                                                     |
| Fluid Compute                   | Dashboard toggle off, then redeploy. Reverts to legacy billing.                                                                               |
| Observability Plus              | Re-enable in Team Settings → Billing. Historical events are not recovered.                                                                    |
| Spend Management pause          | Disable the pause action; unpause each project manually (per-project, does not auto-resume).                                                  |
| Root layout promotion (Cause A) | Single revert commit restoring `app/layout.tsx`. Highest-blast-radius code change, so it is isolated in its own phase with a full build gate. |
| `searchParams` removals         | Single revert commit per app; independent of the layout change.                                                                               |
| Middleware deletion             | Single revert commit restoring `src/middleware.ts`; the config redirects are additive and can stay.                                           |
