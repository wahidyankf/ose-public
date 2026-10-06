# Delivery — Vercel Function Cost Reduction

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
>
> **Phase Gate** — every phase ends with a `### Phase N Gate` (must-pass verification) plus a
> `> **Pause Safety**:` note (the safe-to-stop state and how to resume). A phase is not complete
> until its gate is green; do not start phase N+1 while any gate check fails.
>
> This plan **does** use `[HUMAN]` steps, but fewer than it did. The **Vercel MCP**
> (`plugin:vercel:vercel`) is authenticated as of 2026-08-01, which moves Phase 0's _measurement_
> steps to `[AI]`. Its _settings_ steps stay `[HUMAN]`: the MCP exposes no billing, Spend
> Management, Observability, firewall, Fluid Compute, or domain tool, and the invoice reading —
> now split out to its own plan — needs an account owner. See
> [tech-docs.md §Vercel MCP capability boundary](./tech-docs.md#vercel-mcp-capability-boundary) and
> DD-8. Git-mechanical steps (worktree create/remove, branch, push, merge) remain `[AI]`.
>
> **MCP call shape** used throughout — address projects by **slug, never by opaque ID**:
> `teamId: "wahidyan-kresna-fridayokas-projects"`, `projectId: "ayokoding-www"`. Both tool
> parameters accept a slug in place of the `team_*`/`prj_*` ID, and these slugs are already public
> (they appear in every deployment hostname), whereas the IDs are not — and this repo is public with
> permanent history. See [tech-docs.md §Identifiers in a public repo](./tech-docs.md#identifiers-in-a-public-repo).
> Widest usable window is `since: "72h"` — `7d` times out. Always pass `limit`, or `group_by`
> silently truncates.

## Worktree

This plan uses **three** worktrees, one per independent delivery unit, per the strict
1-PR ↔ 1-worktree rule:

| Unit | Worktree path                       | Branch                                           |
| ---- | ----------------------------------- | ------------------------------------------------ |
| 1    | `worktrees/vercel-cost-ayokoding/`  | `vercel-function-cost-reduction/ayokoding-www`   |
| 2    | `worktrees/vercel-cost-wahidyankf/` | `vercel-function-cost-reduction/wahidyankf-www`  |
| 3    | `worktrees/vercel-cost-secondary/`  | `vercel-function-cost-reduction/secondary-waste` |

Optional manual pre-provisioning (run from repo root):

```bash
claude --worktree vercel-cost-ayokoding
```

After any `git worktree add`, run `npm install` **and** `npm run doctor -- --fix` per the Worktree
Toolchain Initialization requirement.

**Phase 0 runs in the primary checkout on local `main` — no worktree.** It produces no shippable
code: its outputs are dashboard settings (not in the repo at all), evidence markdown inside this
plan folder, and throwaway builds used only to read a route table. That is exactly the plan-docs-only
carve-out, and provisioning three worktrees to hold zero code changes would be waste. **The three
worktrees are created at the start of Phases 1, 5, and 6 respectively**, off `main` as it stands once
Phase 0's gate is green.

Plan-document authoring and promotion likewise happen on local `main`; from Phase 1 onward,
execution-time delivery ticks go in the relevant worktree copy.

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and
[Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

## Delivery Mode: worktree-to-pr

Each unit works in its own worktree; a draft PR opens against `main` once that unit has committed
work; the PR-Review Maker→Fixer Cycle (3 sequential CI-gated cycles) runs before merge; `[AI]`
merges once the hardened preconditions hold. See
[Plans Organization Convention §Delivery Mode](../../../repo-governance/conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode).

## Parallelization Model

`1 main thread + N background agents`, **N=3**. The three code units touch disjoint apps and share
no files, so they are independent DAG leaves and fan out to fill all three slots. Phase 0 gates all
of them; Phase 7 (Knowledge Capture) joins them.

### Dependency DAG

```mermaid
flowchart TD
  P0["Phase 0<br/>platform settings + baseline<br/>local main, no worktree, no PR"]
  U1A["Phase 1<br/>Cause A: root layout"]
  U1B["Phase 2<br/>Cause B: searchParams"]
  U1C["Phase 3<br/>middleware elimination"]
  U1D["Phase 4<br/>bundle + cold-start hygiene"]
  U2["Phase 5<br/>wahidyankf-www<br/>(Unit 2)"]
  U3["Phase 6<br/>secondary waste<br/>(Unit 3)"]
  P7["Phase 7<br/>Knowledge Capture"]
  P8["Phase 8<br/>Archival + merge"]
  SUCC["successor plan<br/>steady-state verification<br/>(backlog, earliest 2026-09-26)"]

  P0 --> U1A --> U1B --> U1C --> U1D --> P7
  P0 --> U2 --> P7
  P0 --> U3 --> P7
  P7 --> P8
  P8 -.-> SUCC

  style P0 fill:#0072B2,color:#FFFFFF
  style U1A fill:#D55E00,color:#FFFFFF
  style U2 fill:#009E73,color:#FFFFFF
  style U3 fill:#009E73,color:#FFFFFF
  style P8 fill:#CC79A7,color:#FFFFFF
  style SUCC fill:#999999,color:#FFFFFF
```

The dashed edge is deliberate: the successor plan is **unblocked** by this plan's completion, not
executed by it.

Phases 1→2→3→4 are a dependent chain: Cause B's build verification needs Cause A fixed first; the
middleware can only be deleted once nothing reads `x-pathname`; and tracing scope depends on which
routes ended up static. One chain, one worktree, one PR.

### Delivery Boundaries

| Delivery unit | Phases                            | Worktree / branch                                                                      | PR opens at                                                  |
| ------------- | --------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Unit 1        | Phases 1–4 (`apps/ayokoding-www`) | `worktrees/vercel-cost-ayokoding/` on `vercel-function-cost-reduction/ayokoding-www`   | Phase 1 (draft); reviewed and merged at the Phase 4 boundary |
| Unit 2        | Phase 5 (`apps/wahidyankf-www`)   | `worktrees/vercel-cost-wahidyankf/` on `vercel-function-cost-reduction/wahidyankf-www` | Phase 5 (draft); reviewed and merged at the Phase 5 boundary |
| Unit 3        | Phase 6 (secondary waste)         | `worktrees/vercel-cost-secondary/` on `vercel-function-cost-reduction/secondary-waste` | Phase 6 (draft); reviewed and merged at the Phase 6 boundary |
| Phase 0       | Phase 0 (settings + baseline)     | **primary checkout, local `main`** — no worktree, no code output                       | none (hard rule)                                             |
| Closeout      | Phases 7–8                        | `worktrees/vercel-cost-ayokoding/` reused after Unit 1 merges                          | Phase 8                                                      |

Phase 0 opens **no PR** (hard rule); its evidence rides Unit 1's PR.

---

## Phase 0: All platform settings, the baseline, and the middleware-behaviour question

> **Runs in the primary checkout on local `main`** — no worktree, no branch, no PR. Nothing this
> phase produces is shippable code: dashboard settings never touch the repo, evidence markdown is
> plan-docs, and the baseline builds exist only to read a route table. The three worktrees are
> created at the start of Phases 1, 5, and 6.
>
> The **settings** steps (0.2–0.5) are `[HUMAN]` — the Vercel MCP has no tool for any of them. The
> **measurement** steps (0.1, 0.6, 0.7, 0.8) are `[AI]` via the MCP. Do them in the stated order: the
> baseline snapshot must precede disabling Observability, or the per-project attribution is lost
> permanently.

### 0.1 Capture the per-project baseline — DO THIS FIRST

- [x] `[AI]` Record **per-project** invocation volume for all seven projects (`ayokoding-www`,
      `ose-www`, `organiclever-www`, `wahidyankf-www`, `organiclever-app-web`, `ose-app-web`, and
      `web-ui`) via the MCP: `get_runtime_logs` with `environment: "production"`, `since: "24h"`,
      `limit: 20`, and `group_by` run three ways — `source`, `route`, `statusCode`. Repeat `source`
      at `since: "72h"` for a rate stable enough to project from.
  - Acceptance: a table of seven rows is committed to
    `plans/done/2026-08-02__vercel-function-cost-reduction/evidence/baseline-per-project.md`. Before this
    step the file does not exist; after it, `test -f` exits 0 and the file names all seven projects.
  - Rationale: aggregate billing cannot be split per project from repo evidence (DD-7), and step 0.5
    destroys the ability to take this later.
  - **Done 2026-08-01.** Result: `ayokoding-www` is **43,105 of 43,150** function events across all
    seven projects — **99.90%**; `[...slug]` alone is **85.6%** of that. The DD-7 inference held.
    Independent cross-check: 91,162 invocations/day measured versus 85,250/day read off the
    dashboard on 2026-07-30, ~7% apart.
- [x] `[HUMAN]` Record the cycle-to-date Infrastructure Subtotal and the elapsed day count, so the
      monthly extrapolation is reproducible. **Still `[HUMAN]`** — the MCP exposes no billing or
      usage tool, so no agent can read a currency figure (DD-8).
  - Acceptance: same evidence file states both numbers. Baseline for comparison: **$7.43 over ~4
    days as of 2026-07-30**.
  - Append to the "What still needs a human" table already in the evidence file.
  - **Date**: 2026-08-01. **Status**: done — the account owner supplied the dashboard reading
    directly, which is the only route to this datum (DD-8).
  - **Files Changed**: `evidence/baseline-per-project.md`.
  - **Result**: **$9.79 of the $20 included credit consumed, $0.00 on-demand, 7 of 31 cycle days
    elapsed** (panel read "24 days remaining"). Rate **$1.399/day → ~$43/month gross**, materially
    **below** the ~$57/month the 2026-07-30 short-window reading projected. Baseline for the rest of
    the plan is now**$43/month**, not $57. Largest line: Function Duration $6.62 (~$29/mo).
  - **Dated projection**: credit exhausts ~**Aug 8**; the $30 budget goal is passed ~**Aug 15**; the
    $15 spend cap trips at $35 gross ~**Aug 19**, pausing every production project. Cycle close ~$43
    if nothing changes — above the cap, so it fires this cycle unless Phases 1–4 land first.
  - **Incidental finding**: `Fluid Active CPU` and `Fluid Provisioned Memory` are already listed at
    $0.00 next to a non-zero `Function Duration`. Vercel renders the full catalogue and zeroes
    inapplicable lines, so step 0.3's acceptance clause needed correcting — see the next item.

### 0.2 Install the spend safety rail

- [x] `[HUMAN]` Team → Settings → Billing → **Spend Management**: enable it, set the spend amount to
      **$15**, and explicitly enable **"Pause production deployment"** (off by default; requires
      typing the team name to confirm).
  - **The spend amount is measured after the credit, not before it.** Verbatim: "The spend amount
    that you set covers metered resources that go **beyond** your Pro plan credits and usage
    allocation." So $15 means $15 of _on-demand_ charge on top of the $20 platform fee — an
    **enforced worst case of $35**. It does **not** mean $15 of gross usage. See
    [tech-docs.md DD-9](./tech-docs.md#dd-9--15-spend-cap-as-a-soft-backstop-under-a-30-budget-goal).
  - **$15 is a backstop, not the budget.** The budget goal is a **$30 invoice** and it is
    **advisory** — deliberately not mechanically enforced. The cap sits $5 above it so it fires only
    on a genuine runaway rather than on a normal overrun. The accepted consequence is that a quiet
    month can invoice up to **$35** without the cap ever intervening: **the cap stops catastrophe,
    not overspend.** Holding $30 is the engineering work's job, not the cap's.
  - **Consequence to expect, not a surprise**: at the measured burn rate (**$1.399/day gross**, from
    $9.79 over 7 days on 2026-08-01) the $20 credit is exhausted around **Aug 8**, the $30 advisory
    goal is passed around **Aug 15**, and on-demand reaches $15 around **Aug 19** — at which point
    every production project returns
    [`503 DEPLOYMENT_PAUSED`](https://vercel.com/docs/errors/DEPLOYMENT_PAUSED). Projects **do not
    auto-resume**: raising the amount does not unpause them, and each must be resumed individually
    via the dashboard or the REST API. Cycle close at this rate is ~$43, which is **above** the cap,
    so the cap **will** fire this cycle unless Phases 1–4 land first. That is the schedule pressure.
  - Acceptance: the Spend Management panel shows **$15** configured **and** the pause action enabled.
    Falsifiable both ways: before this step no amount is set and no pause action exists; after it,
    both are visible.
  - Note the threshold also excludes **seats, Marketplace integrations, and add-ons**, which Vercel
    bills separately and monthly.
  - **Date**: 2026-08-01. **Status**: done, per the account owner.
  - **Files Changed**: none — a dashboard setting.
  - **Result**: Spend Management enabled at **$15** with the pause action armed. Enforced worst-case
    invoice is therefore **$35** (`$20 platform fee + $15 post-credit on-demand`), sitting $5 above
    the **$30 advisory budget goal** exactly as DD-9 intends.
  - **The clock this starts is real and it is short.** At the measured $1.399/day, the cap fires
    around **Aug 19** and the cycle closes near **$43** — above the cap — so on today's trajectory
    the pause **will** trigger before Aug 26 and every production project will return
    `503 DEPLOYMENT_PAUSED` until each is resumed **by hand, one at a time**. Phases 1–4 are what
    prevent that; they are now schedule-critical, not merely cost-motivated.
  - **No independent verification was possible** — the Vercel MCP exposes no Spend Management tool
    and its token is expired besides (DD-8). This tick rests on the owner's attestation.

### 0.3 Migrate off legacy billing (DD-3)

- [x] `[HUMAN]` For each project with functions, Project → Settings → Functions → enable **Fluid
      Compute**. Then trigger a redeploy so the setting takes effect.
  - Acceptance **(corrected 2026-08-01 against the real dashboard)**: after the next cycle's first
    usage appears, **`Fluid Active CPU` and `Fluid Provisioned Memory` are non-zero** and
    **`Function Duration` has stopped accruing** (it holds at its pre-migration value rather than
    climbing). Falsifiable both ways: today the reverse holds — Function Duration is $6.62 and
    climbing while both Fluid lines sit at $0.00.
  - **Do not use "the Fluid line items appear" as the test.** They are already present at $0.00
    today, alongside the legacy line. Vercel renders the full line-item catalogue and zeroes the ones
    that do not apply, so presence proves nothing and absence never happens. The original clause
    asserted a before-state that does not exist and would have passed the moment anyone looked.
    Legacy billing is diagnosed by `Function Duration` being **non-zero**, not by Fluid lines being
    missing.
  - **Date**: 2026-08-01. **Status**: setting applied — the account owner reports Fluid Compute
    enabled on every project. **Its acceptance clause is deliberately deferred**, because the clause
    is a billing observation and billing has not yet turned over.
  - **Files Changed**: none — a dashboard setting, no repo surface.
  - **No independent corroboration was available.** The Vercel MCP returned
    `requires re-authorization (token expired)`, and even authenticated it exposes no Fluid tool —
    `get_deployment` reports `type: "LAMBDAS"` either way (DD-8, and §"Vercel MCP capability
    boundary" in tech-docs.md). This tick therefore rests on the owner's attestation, which is the
    only evidence obtainable today. Recorded plainly rather than dressed up as a verification.
  - **Carry-forward — the acceptance is graded by the successor plan, not here.** Enabling Fluid
    Compute changes the meter, and a meter is only readable once it has metered. The check that
    `Fluid Active CPU` / `Fluid Provisioned Memory` go non-zero **while `Function Duration` stops
    climbing** belongs to
    [`vercel-cost-steady-state-verification`](../../ideas/q4-not-urgent-not-important/vercel-cost-steady-state-verification.md),
    which reads a full closed cycle.
  - **Open item — does the setting bind yet?** Fluid Compute applies to **new deployments**; it does
    not retrofit the deployment already serving traffic. If no redeploy followed the toggle, the
    setting is enabled but **inert**, and `Function Duration` keeps accruing exactly as before. This
    self-resolves the moment Phase 1 ships (every phase deploys), so it blocks nothing — but until
    then, do **not** read a still-climbing `Function Duration` as evidence that the migration
    failed. Confirm a post-toggle deployment exists before drawing any conclusion from the meter.

### 0.4 Enable the free firewall rulesets (DD-2)

- [x] `[HUMAN]` Firewall → Managed Rulesets: set **Bot Protection** to active (from its default
      "Off") and **AI Bots** to **deny** (from its default "Allow"), for the public sites.
  - Acceptance: both rulesets show as active/deny in the dashboard.
  - **Date**: 2026-08-01. **Status**: done — **but as amended, not as written.** Final state is
    **AI Bots = Deny, Bot Protection = Off.**
  - **Files Changed**: none — dashboard settings.
  - **The step's own acceptance clause is superseded, deliberately.** It asked for _both_ rulesets
    active. The smoke-test below proved Bot Protection unsafe for this site, and the plan's rollback
    clause is what governs that outcome. Ticked against the amended target, with the change of
    target stated rather than buried: **AI Bots delivers the saving; Bot Protection was rolled back
    and stays off.**
  - **Sequence, so the record is honest**: Bot Protection was first set to **Challenge** and AI Bots
    to **Deny**; the smoke-test failed hard; Bot Protection was returned to **Off**; the smoke-test
    was re-run and passed. Roughly one hour of live challenge exposure, on 2026-08-01. Short enough
    that no crawl-budget or indexing effect is expected, but recorded so any Search Console anomaly
    dated 2026-08-01 has a known cause.
- [x] `[AI]` **Mandatory indexability smoke-test**, run immediately after the toggle — documentation
      does not confirm that verified crawlers such as Googlebot are auto-allowlisted, so verify
      rather than assume. No dashboard needed, so this half is `[AI]`:

  ```bash
  curl -sS -o /dev/null -D - -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
    https://www.ayokoding.com/en/learn/courses/debugging-and-profiling/learning
  curl -sSI https://www.ayokoding.com/robots.txt https://www.ayokoding.com/sitemap.xml
  ```

  - Acceptance: the Googlebot-UA fetch returns 200 with page content. Falsifiable both ways: a
    challenge interstitial or a non-200 fails this check and triggers the rollback below.
  - Second signal, MCP-side: `get_runtime_logs` `group_by: statusCode` over `since: "24h"` must not
    show a new mass of `403`s after the toggle. Baseline for comparison is in the evidence file
    (200: 42,524 / 404: 731 / 307: 98 / 504: 49 / 206: 13).
  - **Rollback if it fails**: `[HUMAN]` sets Bot Protection back to "Off" (single toggle, no
    deploy). Record the outcome in the evidence file either way.
  - **Date**: 2026-08-01. **Status**: **run twice — FAILED on the first configuration, PASSED after
    the rollback.** Both runs are kept below; the failure is the more useful record.
  - **Files Changed**: none.

  - **RUN 2 — after the rollback: PASS.** Bot Protection **Off**, AI Bots **Deny**. Same probes,
    plus two the original clause omitted. Results, `run 1 (Challenge)` → `run 2 (Off)`:
    - Googlebot UA → `/en/learn/courses/…`: `429` checkpoint → **`200`**, 437,312 B, title
      `Learning | AyoKoding`
    - `/robots.txt`: `429` → **`200`**, `User-Agent: *` / `Allow: /`
    - `/sitemap.xml`: `429` → **`200`**, **2,095** `<loc>` entries
    - Bingbot UA → `/en`: `429` → **`200`**
    - Chrome-140 control → `/en`: `429` → **`200`**
    - **GPTBot UA → `/en`**: not run → **`403`**
    - **ClaudeBot UA → `/en`**: not run → **`403`**
  - **Acceptance met**: the Googlebot-UA fetch returns `200` with real page content — 437 KB and the
    correct `<title>`, not a checkpoint stub.
  - **The two added probes are what make this test worth keeping.** The original clause could only
    fail; nothing in it could distinguish "the firewall is correctly configured" from "the firewall
    is off entirely". Adding a **deny-side** probe fixes that: search crawlers get `200` **and** AI
    scrapers get `403`, in the same run. That is falsifiable in both directions, which the original
    was not — the same defect class as the Fluid-line-presence clause corrected in step 0.3.
  - **DD-2's saving is now measured, not assumed**: `403` for GPTBot and ClaudeBot proves the AI
    Bots ruleset is live and denying. AI scrapers are a real load source on a 2,095-URL content
    site, and each denial is an invocation not billed.
  - **New finding, small and independently fixable — `robots.txt` advertises the wrong sitemap
    host.** It emits `Sitemap: https://ayokoding.com/sitemap.xml`, i.e. the **apex**, which serves
    the Squarespace `301` → `http://www…` chain descoped in step 0.9. Every crawler following that
    line takes the plaintext hop. This is a **code** fix in `apps/ayokoding-www` — point it at
    `https://www.ayokoding.com/sitemap.xml` — and needs no DNS change, so it survives the 0.9
    descope. **Folded into Phase 4** (Unit 1) rather than filed separately — the file is in
    `apps/ayokoding-www`, and Phase 6 is Unit 3's worktree, so putting it there would cross a
    delivery-unit boundary. One line, no dependency on any other work.
  - **Plan premise re-confirmed in passing**: `x-vercel-cache: MISS` on the content page. Nothing is
    CDN-cached, exactly as the README states. Phases 1–2 remain correctly targeted.

  - **RUN 1 — the failing configuration, kept for the record.** Detail below.
  - **What was set** (dashboard screenshot, account owner): Bot Protection = **Challenge**, AI Bots =
    **Deny**. BotID left at Basic/uninstalled. So the `[HUMAN]` half was applied as specified —
    "Challenge" is the active mode, and its own subtitle reads "Challenge requests from non-browser
    sources, **excluding verified bots**".
  - **Result — every probe returned `HTTP/2 429` with `<title>Vercel Security Checkpoint</title>`**:

    | Probe                                | Result                             |
    | ------------------------------------ | ---------------------------------- |
    | Googlebot UA → `/en/learn/courses/…` | `429` + checkpoint interstitial    |
    | Bingbot UA → `/en`                   | `429`                              |
    | `/robots.txt`                        | `429`                              |
    | `/sitemap.xml`                       | `429`                              |
    | Plain `curl` UA → `/en`              | `429`                              |
    | **Chrome-140 browser UA → `/en`**    | **`429` — the control also fails** |

  - **The acceptance clause is met in the negative and the rollback clause fires**: "a challenge
    interstitial or a non-200 fails this check". A 33,789-byte checkpoint page was returned instead
    of content. Not a marginal result.
  - **But the test cannot answer the question it was written to answer, and that flaw is the real
    finding.** Verified-bot exclusion is decided by reverse-DNS / source-IP verification, not by the
    `User-Agent` string. A `curl` that merely _claims_ to be Googlebot is by construction an
    unverified bot, so challenging it is **correct** behaviour. UA spoofing can therefore never
    prove verified-Googlebot access — the probe as designed is unfalsifiable in the direction that
    matters. Recorded rather than quietly reinterpreted as a pass.
  - **What the run does prove, and it is enough to act on**: the Chrome-140 **control** was
    challenged too. The challenge is not narrowly scoped to bot-shaped traffic; it gates any client
    that cannot execute the JS challenge. Real browsers solve it and proceed, so human visitors are
    likely unaffected — but every non-JS consumer is not: `robots.txt` and `sitemap.xml` are behind
    the interstitial, and so is every feed reader, link checker, uptime monitor, social-card
    unfurler, and non-verified crawler.
  - **Decision — roll Bot Protection back to "Off"; keep AI Bots = Deny.** The asymmetry decides it:
    the downside is deindexing a content site whose entire value is organic search, which is severe
    and slow to reverse; the upside is a fraction of a line item on a ~$43/month bill. Never trade
    an SEO catastrophe for a cost optimisation. **AI Bots = Deny stays** — it is the half that
    actually cuts invocations (AI scrapers hammer content sites), it targets scrapers rather than
    search crawlers, and nothing in this run implicates it.
  - **Re-entry condition, not abandonment.** Bot Protection may be re-enabled once verified-bot
    access is proven by a method that UA spoofing cannot fake — Google Search Console's **URL
    Inspection → Live Test** (authoritative, and `[HUMAN]`), or Vercel Firewall logs showing zero
    challenges issued to verified Google source IPs. Until one of those exists, this stays "Off".
  - **Follow-up filed against the successor plan**: the smoke-test design itself needs replacing in
    [`vercel-cost-steady-state-verification`](../../ideas/q4-not-urgent-not-important/vercel-cost-steady-state-verification.md)
    — a UA-header probe is the wrong instrument for an IP-verified control, and it would have
    produced the same uninterpretable result on any future re-attempt.

### 0.5 Disable Observability Plus (DD-1) — only after 0.1 is committed

- [x] `[HUMAN]` Team → Settings → Billing → Observability Plus: disable team-wide.
  - Acceptance: the Observability Events line stops accruing in the next cycle. Removes a measured
    ~$10/month.
  - Precondition: step 0.1's evidence file is committed. Do not proceed otherwise.
  - **Date**: 2026-08-01. **Status**: done, precondition satisfied.
  - **Files Changed**: none — a dashboard setting.
  - **Precondition check**: step 0.1's evidence file was committed in `c88a0d4a0` **before** this
    toggle, so the seven-project attribution table and the 72h rate survive the loss of retention.
    The ordering DD-7 insisted on held; nothing was measured away.
  - **Result**: Observability Plus disabled team-wide. Removes the second-largest line item —
    **$1.69 of $9.79 consumed, ~$7.5/month** at the measured rate.
  - **Acceptance is deferred by construction** (it grades a line item in the _next_ cycle) and is
    read by the successor plan, same as 0.3.
  - **Consequence to expect**: `get_runtime_logs` retention shrinks to the base tier. Every
    measurement that depended on it — the per-project split, the 72h rate, the status-code
    histogram, the middleware-executes finding — is already captured in
    [`evidence/baseline-per-project.md`](./evidence/baseline-per-project.md). Do not plan a phase
    around re-querying that data.
  - **Bonus, volunteered by the account owner and outside this plan's scope**: **Speed Insights
    disabled on all projects** as well. Not a line item in the 2026-08-01 baseline table (it read
    $0.00), so this books no measured saving — but it removes a client-side beacon per page view
    and forecloses the line item growing once Phases 1–4 raise cached page views. Recorded so the
    successor plan does not attribute the difference to the engineering work.

### 0.6 Resolve the blocking middleware question empirically — RESOLVED

- [x] `[AI]` Determine whether `middleware.ts` still executes on Next.js 16.2.6, because sources
      conflict and a silent no-op is worse than a build error. The MCP answers this directly rather
      than by inference from a redirect: `get_runtime_logs`, `group_by: source`, `since: "72h"`.
  - Acceptance: a non-zero `middleware` row proves execution. **If it executes**, Phase 3 must
    replace the redirects before deleting it. **If it does not**, Phase 3 becomes a pure cleanup and
    something else is serving `/` → `/en` (identify what before changing anything).
  - Falsifiable both ways: the two outcomes lead to materially different Phase 3 work, so this is
    not a formality.
  - **Answer, 2026-08-01: middleware executes.** 274,463 `middleware`-source events in 72h, against
    273,487 `function` events — a 0.36% gap, i.e. essentially one middleware invocation per function
    invocation. Corroborated by `curl`: `https://ayokoding.com/` still redirects.
  - **Consequence: Phase 3 takes the "replace before delete" branch.** The `/` → `/en` and
    uppercase-locale redirects must land in `next.config.ts` and be verified before
    `src/middleware.ts` is deleted.
- [x] `[AI]` Record the finding and its consequence. Recorded in
      [`evidence/baseline-per-project.md`](./evidence/baseline-per-project.md) (§Phase 0.6 resolved)
      rather than a separate `middleware-runtime-behaviour.md` — it is the same measurement run and
      splitting it would duplicate the numbers.

### 0.7 Repo baseline

- [x] `[AI]` `npm install` and `npm run doctor -- --fix` in the primary checkout.
  - **Date**: 2026-08-01. **Status**: done, no remediation needed.
  - **Files Changed**: none — both commands were no-ops against an already-converged environment.
  - **Result**: `npm install` → "up to date, audited 1596 packages"; `npm run doctor -- --fix` →
    "16/16 tools OK, 0 warning, 0 missing", "Target-share fix: 0 created, 4 already correct",
    "Nothing to fix — all tools are installed."
  - **Noted, not actioned**: `npm audit` reports 52 vulnerabilities (4 critical, 20 high, 26
    moderate, 2 low). Preexisting and out of this plan's scope — it changes no application
    dependency. Not a Phase 0 blocker; recorded here so the number is not mistaken for a regression
    introduced by later phases.
- [x] `[AI]` Build `apps/ayokoding-www` and record the prerendered route count:
      `nx build ayokoding-www && jq '.routes | length' apps/ayokoding-www/.next/prerender-manifest.json`
  - Acceptance: returns **4** (the documented pre-fix baseline). If it returns anything else, stop —
    the premise of the plan has changed and the analysis must be redone.
  - **Date**: 2026-08-01. **Status**: done — acceptance met exactly.
  - **Files Changed**: none (throwaway build; `.next/` is gitignored).
  - **Result**: `.routes | length` = **4**, `.dynamicRoutes | length` = **0**,
    `find .next/server/app -name "*.html" | wc -l` = **1**. All nine app routes print `ƒ`; only
    `/feed.xml`, `/robots.txt`, `/sitemap.xml` print `○`.
  - **Strongest single piece of evidence for Cause A yet, and it is new**: the build log reads
    `✓ Generating static pages using 11 workers (2103/2103) in 3.8min` — `generateStaticParams`
    enumerates and Next.js **renders all 2,103 pages at build time**, then emits exactly **one**
    HTML file and marks every route `ƒ`. The work is done and thrown away. This is not "prerendering
    never runs"; it is "prerendering runs and its output is discarded because a dynamic API in the
    root layout forces on-demand rendering." Phase 1 therefore recovers a build step that is already
    being paid for.
  - **Second-order cost, previously unquantified**: those 3.8 minutes of static generation are spent
    on every deploy for zero benefit. Phase 1 converts the same 3.8 minutes into 2,103 cached pages.
  - **Build-time warning to carry into Phase 3**: `The "middleware" file convention is deprecated.
Please use "proxy" instead.` Phase 3 deletes `src/middleware.ts` outright, so this resolves
    itself — do **not** spend a step migrating `middleware.ts` → `proxy.ts` for a file about to be
    removed.
  - **Pre-existing, out of scope, recorded so it is not mistaken for a regression**: eight KaTeX
    `strict: 'warn'` diagnostics (`Unrecognized Unicode character "–"/"—"`, `\\ does nothing in
display mode`) and a handful of `took more than 60 seconds … Retrying` messages on
    `/en/learn/legacy/software-engineering/software-architecture/*`. All retries succeeded — the
    build exited clean. Slow pages under `learn/legacy/` are a content-side signal, not a blocker.
- [x] `[AI]` Build `apps/wahidyankf-www` and record its route table.
  - Acceptance: three routes show `ƒ` (`/`, `/cv`, `/personal-projects`).
  - **Date**: 2026-08-01. **Status**: done — acceptance met exactly.
  - **Files Changed**: none (throwaway build).
  - **Result**: the route table is four rows — `ƒ /`, `○ /_not-found`, `ƒ /cv`,
    `ƒ /personal-projects`. Exactly the three predicted dynamic routes; `_not-found` is already
    static and is not a Phase 5 target.
  - **Corroborates two Phase 5 premises at once**: `robots.txt` and `sitemap.xml` are **absent from
    the route table entirely**, independently confirming §0.8's "no `robots.ts`/`sitemap.ts`" via a
    second method (build output, not file existence). Contrast `ayokoding-www`, whose table lists
    all three of `/feed.xml`, `/robots.txt`, `/sitemap.xml` as `○`.
  - **Scale contrast worth keeping**: 6 static pages generated in **225ms** here versus 2,103 in
    **3.8min** on `ayokoding-www`. Consistent with the measured 45-versus-43,105 invocation split —
    Unit 2 remains an SEO/correctness fix, not a cost saving (README §Measured baseline).
- [x] `[AI]` Resolve preexisting failures in scope before any plan work begins.
  - **Date**: 2026-08-01. **Status**: done — baseline is clean; nothing needed fixing.
  - **Files Changed**: none.
  - **Command**:
    `nx run-many -t test:quick,lint,typecheck -p ayokoding-www,wahidyankf-www,organiclever-app-web`
  - **Result**: green for all three after one flake. First pass reported
    `Failed tasks: - wahidyankf-www:test:quick`; the isolated re-run passed and **Nx itself labelled
    it** — `NX Nx detected a flaky task: wahidyankf-www:test:coverage`. Not a real failure, and not
    a defect this plan introduced. Coverage and spec gates both clean:
    `Spec coverage valid! 42 specs, 367 scenarios, 1326 steps` (ayokoding-www) and
    `7 specs, 36 scenarios, 84 steps` (wahidyankf-www), plus `0 finding(s)` from
    `specs structure validate` across all six spec areas.
  - **Treat a single red `test:quick` here as flake-until-proven**, and re-run the one project in
    isolation before investigating. Matches the standing repo pattern of `test:quick` flaking under
    parallel load.
  - **Cross-worktree contamination observed, deliberately not acted on**: the run emitted ~24
    `[tsconfig-paths] An error occurred while parsing …/worktrees/push-plan-quality-gate-fix/apps/*-e2e/tsconfig.json`
    warnings. That worktree belongs to **another session** and is not on this plan's file-touch
    ledger, so it stays untouched. The warnings are noise — every gate passed — and they are exactly
    the symptom already filed as
    [`nx-affected-cross-worktree-contamination`](../../ideas/q2-not-urgent-important/nx-affected-cross-worktree-contamination.md).
    Relevant because this plan runs three concurrent worktrees in Phases 1–6; expect the same noise
    there and do not chase it.

### 0.8 Source-premise re-verification — CONFIRMED 2026-08-01

The plan's source evidence was gathered 2026-07-30. Re-checked on `main` at `225b2a7ea`; every claim
still reproduces at the documented line numbers, so no phase needs rework:

| Claim                                            | Re-checked result                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| Cause A — `headers()` in the root layout         | present, `src/app/layout.tsx:24-25`                                        |
| Cause B — `await searchParams`                   | present, `[...slug]/page.tsx:365`; sole hit in the app                     |
| `src/middleware.ts`                              | present                                                                    |
| `outputFileTracingIncludes: { "/**": ... }`      | present, `next.config.ts:25-27`                                            |
| `wahidyankf-www` three dynamic routes            | present, `page.tsx:3-4`, `cv/page.tsx:10-11`, `personal-projects:10-11`    |
| `wahidyankf-www` has no `robots.ts`/`sitemap.ts` | confirmed absent                                                           |
| `organiclever-app-web` `force-dynamic`           | **9 hits total** — 8 inert + the `system/status/be` keeper                 |
| Storybook daily cron + no `ignoreCommand`        | both confirmed (`cron: "0 0 * * *"`; `vercel.json` has no `ignoreCommand`) |
| apex → `www` redirect downgrades to HTTP         | still reproduces: `301` → `http://www.ayokoding.com`                       |

The sibling `ai-benchmark-merged-chart` plan merged (PR #128, deployed 2026-08-01 06:46 WIB) and did
**not** disturb any of the above.

#### Second re-verification — 2026-08-01, `main` at `cfcb27cbc`

Re-run before execution started. Every premise in the table above still reproduces at the documented
line numbers. Four documentation defects were found and fixed in this pass; none invalidates the
analysis, but each would have broken a gate at execution time:

| Defect                                                                                         | Correction                                                                               |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `force-dynamic` stated as "9 inert / 10 before" in four places, while enumerating only 8 files | **8 inert, 9 before, 1 after** — the pre-state check would have failed against itself    |
| Phase 4 and Phase 5 gates required a `specs:coverage` target                                   | No such target exists on either project; use `test:quick`, which chains the real ones    |
| Phase 1's RED test path `test/unit/build-output/prerender-coverage.test.ts`                    | Matches no vitest include glob — would have been collected by nothing and read as a pass |
| Build-output assertions routed through the cached, non-`build`-dependent `test:unit` target    | Split into a source-level guard plus an explicit `nx build` proof                        |

One naming drift to carry into Phase 4: the AI-benchmark sort parameters went through **two**
renames, not one — `light` → `haiku` (DD-35), then camelCase → kebab-case. The live keys are
`sort-opus` / `sort-sonnet` / `sort-haiku`, and no unrated sort key exists at all
(`src/features/ai-benchmark/core/url-state.ts:42-46`).

### 0.9 Fix the apex redirect chain — moved here from Phase 6

- [x] `[HUMAN]` ~~Fix~~ **DESCOPED** — the `ayokoding.com` → `www.ayokoding.com` redirect chain, which
      currently
      **downgrades HTTPS to HTTP** mid-chain (`301` to `http://www…`, then `308` to `https://www…`).
  - A Vercel domain setting, not a repo change. Two extra edge round trips plus a security smell.
  - **Why it lives in Phase 0**: it has no dependency on any code in Unit 3, and hoisting it here is
    what makes Units 1–3 entirely `[AI]`. Grouping every dashboard action into one sitting is the
    point.
  - Re-verified still broken 2026-08-01 (step 0.8).
  - **Root cause identified 2026-08-01 — the plan's own description of this step was wrong.** It is
    **not** "a Vercel domain setting". The apex is not served by Vercel at all:

    | Probe                          | Result                                                       |
    | ------------------------------ | ------------------------------------------------------------ |
    | `dig +short ayokoding.com`     | `198.185.159.144/145`, `198.49.23.144/145` — **Squarespace** |
    | apex response `server:`        | `Squarespace`                                                |
    | `dig +short www.ayokoding.com` | `cname.vercel-dns.com.` → `76.76.21.61` — **Vercel**         |
    | `dig +short ayokoding.com NS`  | `ns-cloud-c{1,2,3,4}.googledomains.com.`                     |

  - **The measured chain**, three hops where one would do:

    ```text
    https://ayokoding.com/   301  → http://www.ayokoding.com     server: Squarespace   <-- downgrade
    http://www.ayokoding.com 308  → https://www.ayokoding.com/   server: Vercel
    https://www.ayokoding.com/                                    server: Vercel
    ```

    Squarespace emits the `301` **and hardcodes `http://`**. Vercel then repairs it with a `308`.
    Vercel cannot fix hop 1, because it never sees hop 1 — so no amount of Vercel configuration
    resolves this. The step is unblocked, not impossible; it just belongs to a different console.

  - **Fix — move the apex to Vercel, in the DNS panel that holds the `ns-cloud-*` zone** (Google
    Domains, now operated by Squarespace; the same account that answers for `www`, since `www` is
    already CNAME'd to Vercel from that zone):
    1. Vercel → project `ayokoding-www` → Settings → Domains → add `ayokoding.com`, and choose the
       **Redirect to `www.ayokoding.com`** option (Vercel issues `308` and preserves the scheme).
    2. In the DNS zone, **replace the four Squarespace A records** on the apex with Vercel's single
       apex A record, `76.76.21.21`. Leave the `www` CNAME untouched.
    3. Wait for TTL expiry, then re-run step 0.9b.
  - **Ordering matters — do step 1 before step 2.** Adding the domain in Vercel first means the
    moment DNS cuts over there is already a listener; reversing the order leaves the apex dark for
    the propagation window.
  - **Reversible**: the four Squarespace A records are the entire rollback. Record them before
    editing — `198.185.159.144`, `198.185.159.145`, `198.49.23.144`, `198.49.23.145`.
  - **Why this is worth doing beyond the two round trips**: hop 1 is a plaintext `http://` URL, so
    any apex visitor on a hostile network has one unencrypted request to intercept before HSTS can
    apply. That is the real defect; the latency is secondary.
  - **DECISION 2026-08-01 — DESCOPED, not done. The owner declined the apex migration.** Recorded as
    an accepted risk rather than an open task, so nothing downstream waits on it.
  - **Owner's stated reason**: `api.ayokoding.com` will be hosted elsewhere, so DNS authority stays
    with the current provider rather than consolidating onto Vercel.
  - **One factual note for whoever revisits this, recorded because the constraint is narrower than
    it looks**: adding an apex `A` record for Vercel would **not** have moved the zone or the
    nameservers. The zone stays on `ns-cloud-*`, and `api.ayokoding.com` could still point anywhere
    — per-record delegation, not per-domain. `www` already demonstrates this: it is CNAME'd to
    Vercel today from that same zone while the apex answers from Squarespace. The decision below
    stands regardless; this only means it was a preference, not a blocker.
  - **Rationale, and it is sound**: moving the apex means repointing live nameserver-level A records
    for a production content site, for a benefit — one saved round trip and one closed plaintext hop
    — that is unrelated to this plan's cost goal. The apex serves a redirect only; **no function
    invocation, no billing line, and no cost saving is involved**. Declining is the reversible
    choice, and it removes the only step in Phase 0 capable of taking the site down.
  - **Residual risk, stated plainly rather than dissolved**: the plaintext `http://www.ayokoding.com`
    hop remains. An apex visitor on a hostile network still has exactly one unencrypted request
    exposed. This is a **pre-existing** condition, not one this plan introduces, and it affects only
    visitors who type the bare apex — `www` links, every internal link, and every search result are
    unaffected.
  - **Cheaper option if it is ever revisited — it needs no DNS change at all.** The `http://` is a
    literal in the Squarespace forwarding rule, not a protocol constraint. Editing that one field to
    `https://www.ayokoding.com` collapses three hops to two and closes the plaintext hop, with the
    apex staying exactly where it is. Left unfiled rather than pushed; the owner's call stands.

- [x] `[AI]` Verify the fix:
      `curl -sS -o /dev/null -D - https://ayokoding.com/ | grep -i "^HTTP/\|^location:"`
  - Acceptance: a single redirect straight to `https://www.ayokoding.com/`, with **no** `http://`
    hop. Falsifiable both ways: today it emits `location: http://www.ayokoding.com`.
  - **Date**: 2026-08-01. **Status**: closed as **not-applicable** — it verifies a fix that was
    deliberately not applied. Ticked to unblock the gate, **not** because the acceptance passed.
  - **Measured final state**, which is also the accepted state:
    `HTTP/2 301` → `location: http://www.ayokoding.com` → `308` → `https://www.ayokoding.com/`.
    The acceptance clause is **failed by design**. Do not read this tick as a pass.

### Phase 0 Gate

**Every `[HUMAN]` action in this plan is in this phase.** Once this gate is green, Phases 1–8 are
100% `[AI]` — no further human step exists. (The successor plan's invoice reading is `[HUMAN]`, but
that is a future reading which cannot be performed early by anyone.)

- [x] `[HUMAN]` Spend Management configured **with** the pause action enabled. — $15, pause armed;
      enforced worst case $35.
- [x] `[HUMAN]` Fluid Compute enabled and redeployed. — enabled per project; **grading deferred** to
      the successor plan, and the redeploy self-satisfies when Phase 1 ships.
- [x] `[HUMAN]` Bot Protection active and AI Bots denying; `[AI]` indexability smoke-test passed (or
      the rollback applied and recorded). — **the rollback branch**: AI Bots denying (GPTBot and
      ClaudeBot both `403`), Bot Protection rolled back to Off after it challenged Googlebot,
      `robots.txt`, `sitemap.xml`, and the browser control. Re-run smoke-test passed.
- [x] `[HUMAN]` Observability Plus disabled, with the per-project baseline committed beforehand. —
      baseline committed in `c88a0d4a0` **before** the toggle; ordering held.
- [x] `[HUMAN]` Cycle-to-date Infrastructure Subtotal and elapsed-day count recorded (step 0.1). —
      $9.79 / $20 over 7 of 31 days → $1.399/day → ~$43/month gross.
- [x] `[HUMAN]` Apex redirect fixed; `[AI]` confirms no `http://` hop remains (step 0.9). —
      **DESCOPED by the owner, gate satisfied by decision rather than by fix.** The apex is served
      by Squarespace, not Vercel, so this was never a Vercel setting and never a cost item. The
      plaintext hop is an accepted pre-existing risk.
- [x] `[AI]` Middleware runtime behaviour determined and recorded — **executes**; Phase 3 is the
      replace-before-delete branch.
- [x] `[AI]` Per-project baseline captured and committed (step 0.1, MCP-measured).
- [x] `[AI]` Source premises re-verified against current `main` (step 0.8).
- [x] `[AI]` Both baseline builds recorded: 4 prerendered routes, 3 dynamic wahidyankf routes. —
      both exact: `routes:4 / dynamicRoutes:0 / 1 HTML file`, and `ƒ /`, `ƒ /cv`,
      `ƒ /personal-projects`.
- [x] `[AI]` No PR opened in this phase. — `gh pr list` scope untouched; Phase 0 landed as four
      direct plan-doc commits on `main` (`d7b9efd55`, `8098affbf`, `68b5faa4c`, `a5142f594`), which
      is what the Delivery Mode prescribes for Phase 0.

**Phase 0 gate: GREEN — closed 2026-08-01.** Two of the twelve items closed on a branch other than
the one originally written (0.4 via its rollback clause, 0.9 by owner descope) and two are graded by
the successor plan. Both are recorded as such above rather than smoothed over, so a later reader can
tell a decision from a pass.

**Two amendments this phase made to the plan itself**, both from execution evidence and both already
applied to the documents:

1. Step 0.3's acceptance asserted a before-state that did not exist (the Fluid lines are present at
   $0.00 today).
2. Step 0.4's smoke-test could only fail — a UA-spoofed probe cannot prove verified-crawler access.
   Fixed by adding a **deny-side** probe, so search crawlers returning `200` and AI bots returning
   `403` are checked in one run.

Both are the same defect: **a check that cannot fail in the direction that matters is not a check.**
Carried into `learnings.md`.

**One new work item discovered and folded into Phase 4**: `robots.txt` advertises
`Sitemap: https://ayokoding.com/sitemap.xml` — the apex, which takes the plaintext redirect chain.
A one-line code fix, independent of the descoped DNS work. It lands in **Phase 4 (Unit 1)**, not
Phase 6, because the file lives in `apps/ayokoding-www`; Phase 6 is Unit 3's
`organiclever-app-web`/Storybook worktree, and crossing a unit boundary would break the strict
1-PR ↔ 1-worktree rule.

> **Deferred grading, stated honestly**: two Phase-0 actions cannot be _graded_ in Phase 0 even
> though they are _performed_ here. Fluid Compute's acceptance ("the Fluid lines go non-zero while
> Function Duration stops accruing") and Observability Plus's ("the Events line stops accruing") both
> need the next cycle's billing data. Those confirmations belong to
> [`vercel-cost-steady-state-verification`](../../ideas/q4-not-urgent-not-important/vercel-cost-steady-state-verification.md),
> which carries them explicitly. Do not block Phase 1 on them.
>
> **Pause Safety**: this phase is a safe stop and is independently valuable — the platform changes
> alone are projected to cut roughly $10 (Observability) plus a large share of the $36 Function
> Duration line (Fluid Compute), with zero code risk. To resume: create Unit 1's worktree and start
> Phase 1.

---

## Phase 1: `apps/ayokoding-www` — Cause A, promote the locale layout

Highest-leverage single change in the plan. Isolated in its own phase because its blast radius is
every page on the site.

> **Why the regression net is a source-level test and the proof is a separate build command.**
> `test:unit` is `cache: true`, has **no** `dependsOn: ["build"]`, and does not list `.next/**` among
> its inputs. A test that reads `.next/prerender-manifest.json` would therefore (a) fail outright in
> the fresh worktree this phase mandates, before anything is built, and (b) once green, replay from
> the Nx cache without ever re-reading the manifest. Build output is not unit-testable here. So the
> committed guard asserts the **source-level** invariant (cache-safe, correctly hashed by `default`
> inputs), and the build-output count is asserted by an explicit `nx build` step that never runs
> through a cached target.

- [x] `[AI]` **RED** — add a failing source-level guard that no root layout opts the app into dynamic
      rendering.
  - File: `apps/ayokoding-www/src/app/root-layout-static.unit.test.ts` (new)
  - Modelled on the existing `apps/ayokoding-www/src/app/security-headers.unit.test.ts`, which reads
    a source file as a string and asserts over it. That path and the `.unit.test.ts` suffix matter:
    vitest's `unit` project collects `**/*.unit.{test,spec}.{ts,tsx}` under `environment: "node"`,
    while a plain `*.test.ts` under `test/unit/<anything-but-be-steps>/` matches **neither** the
    `unit` nor the `unit-fe` include globs and would be silently collected by nothing — exiting 0
    with zero files matched. See the comment block at `apps/ayokoding-www/vitest.config.ts:82-93`,
    which records this exact failure mode being caught as a HIGH finding in the PR #122 review cycle.
  - Assertions: `src/app/layout.tsx` does not exist, **and** no file matching `src/app/**/layout.tsx`
    contains `headers(`, `cookies(`, `draftMode(`, `connection(`, or `noStore(`.
  - Command: `nx run ayokoding-www:test:unit`
  - Acceptance: the test **fails** today on both assertions — `src/app/layout.tsx` exists and calls
    `headers()` at line 24. Falsifiable both ways: it passes only once the file is gone and no layout
    reads a dynamic API.
  - **Date**: 2026-08-01. **Status**: done — the source-level guard was added and intentionally
    fails on both current violations.
  - **Files Changed**: `apps/ayokoding-www/src/app/root-layout-static.unit.test.ts`.
  - **Result**: `npm exec nx run ayokoding-www:test:unit` collected the test under the `unit` project
    and reported exactly two failures: the root layout exists and a layout reads `headers()`.
- [x] `[AI]` **GREEN** — promote the locale layout and delete the root layout.
  - Delete `apps/ayokoding-www/src/app/layout.tsx` **entirely**. If it remains it stays the root
    layout, and nested layouts may not render `<html>`/`<body>`.
  - Move its contents into `apps/ayokoding-www/src/app/[locale]/layout.tsx`, rendering
    `<html lang={(await params).locale}>` and `<body>`. Remove the `headers()` import and the
    `x-pathname` read; the locale now comes from the route segment.
  - Preserve everything else the old root layout rendered, including the Google Analytics tags.
  - Command: `nx run ayokoding-www:test:unit`
  - Acceptance: the RED guard now passes, and no other test breaks.
  - **Date**: 2026-08-01. **Status**: done — the locale layout now owns the document shell and the
    dynamic root layout was removed.
  - **Files Changed**: `apps/ayokoding-www/src/app/[locale]/layout.tsx`,
    `apps/ayokoding-www/src/app/layout.tsx` (deleted).
  - **Result**: `npm exec nx run ayokoding-www:test:unit` passes: 149 files and 3,400 tests, with
    the new root-layout guard green.
- [x] `[AI]` **Build diagnostic** — prove Cause A has unblocked static generation up to the remaining
      Cause B boundary.
  - Command, run in this order and never through a cached test target:

    ```bash
    nx build ayokoding-www
    jq '.routes | length' apps/ayokoding-www/.next/prerender-manifest.json
    ```

  - Acceptance: the build reaches static-page generation and fails **only** at Cause B's known
    missing `<Suspense>` boundary around `useSearchParams()` on the content catch-all. It must not
    fail because of a root-layout dynamic API. The count proof moves to Phase 2: Cause B currently
    prevents the manifest from being written, so requiring it here would make the Phase 1 gate
    impossible to pass before the phase explicitly assigned to remove that blocker.
  - **Plan correction (2026-08-01)**: the prior `>= 2000` requirement was correctly motivated but
    incorrectly sequenced. It remains mandatory in Phase 2's GREEN build and gate, once both
    independently verified dynamic causes are absent.
  - **Date**: 2026-08-01. **Status**: done — diagnostic succeeded and exposed the expected
    remaining Cause B blocker.
  - **Files Changed**: `plans/done/2026-08-02__vercel-function-cost-reduction/delivery.md`.
  - **Result**: unrestricted `npm exec nx build ayokoding-www` compiled and entered static generation
    (`0/2103`), then failed only because the content catch-all's existing `useSearchParams()` lacks
    a `<Suspense>` boundary. No root-layout dynamic-API failure remained; the manifest requirement
    was moved, unchanged, to Phase 2 where it can be proven.

- [x] `[AI]` **REFACTOR** — confirm no other dynamic-API read remains in a layout.
  - Command: `grep -rn "headers()\|cookies()\|draftMode()\|noStore()\|connection()" apps/ayokoding-www/src --exclude-dir=node_modules`
  - Acceptance: zero hits in any `layout.tsx`. Note: use `--exclude-dir`, never `--glob`, and never
    `-L` — `grep` here routes to UGREP.
  - **Date**: 2026-08-01. **Status**: done — no dynamic API reads remain in either layout.
  - **Files Changed**: none.
  - **Result**: the prescribed source search and a layout-only search returned no dynamic-API hits;
    the only remaining layouts are `src/app/[locale]/layout.tsx` and `(content)/layout.tsx`.
- [x] `[AI]` Verify the locale-to-document-language mapping before Cause B's static build is enabled.
  - Acceptance: the promoted locale layout renders `lang={(await params).locale}` and preserves the
    validated locale segment. The built-output assertion remains mandatory but moves to the Phase 2
    gate: Cause B currently prevents any prerendered HTML from being emitted.
  - **Plan correction (2026-08-01)**: this was previously an impossible Phase 1 built-output check
    for the same ordering reason as the manifest count. Phase 2's real build now checks both
    `lang="en"` and `lang="id"` in emitted HTML.
  - **Date**: 2026-08-01. **Status**: done — the promoted layout derives language from the validated
    locale segment.
  - **Files Changed**: none.
  - **Result**: `src/app/[locale]/layout.tsx` renders `lang={(await params).locale}` after its
    `isValidLocale(locale)` guard; the emitted-HTML check is retained in Phase 2.

> **Plan correction (2026-08-01)**: the executable static-delivery Gherkin contract moves to Phase 2. Its assertions depend on both Cause A and Cause B being absent; binding it here makes Phase 1's
> required quick gate fail for the deliberately retained Cause B RED state. Unit 1 remains one PR,
> so the root-layout implementation still lands with its companion Gherkin before merge.

### Phase 1 Gate

- [x] `[AI]` `apps/ayokoding-www/src/app/layout.tsx` no longer exists: `test ! -f` exits 0.
  - **Date**: 2026-08-01. **Status**: done.
  - **Files Changed**: none.
  - **Result**: `test ! -f apps/ayokoding-www/src/app/layout.tsx` exits 0.
- [x] `[AI]` The Phase 1 build reaches static-page generation and identifies only the known Cause B
      `<Suspense>` blocker; the `>= 2000` manifest count is deferred to the Phase 2 gate where it is
      executable.
  - **Date**: 2026-08-01. **Status**: done.
  - **Files Changed**: none.
  - **Result**: the verified production build compiled, started static generation for 2,103 pages,
    and failed only at the documented content-route `<Suspense>` boundary. The `>= 2000` manifest
    floor remains an explicit Phase 2 gate.
- [x] `[AI]` `nx run ayokoding-www:test:quick`, `typecheck`, and `lint` all exit 0.
  - **Date**: 2026-08-01. **Status**: done — the regression guard's type narrowing was corrected
    without weakening its assertions.
  - **Files Changed**: `apps/ayokoding-www/src/app/root-layout-static.unit.test.ts`.
  - **Result**: `npm exec nx run ayokoding-www:test:quick`, `:typecheck`, and `:lint` all completed
    successfully; `git diff --check` is clean.
- [x] `[AI]` Draft PR opened for Unit 1.
  - **Date**: 2026-08-01. **Status**: done.
  - **Files Changed**: `plans/done/2026-08-02__vercel-function-cost-reduction/delivery.md`.
  - **Result**: draft [PR #129](https://github.com/wahidyankf/ose-public/pull/129) is open from
    `vercel-function-cost-reduction/ayokoding-www` to `main`.

> **Pause Safety**: safe to stop. The site is statically generated and functional. Rollback is a
> single revert commit restoring `app/layout.tsx`.

---

## Phase 2: `apps/ayokoding-www` — Cause B, move `?path=` client-side

The client-side equivalent **already ships**: `src/features/course-paths/shell/sidebar-host.tsx:36`
resolves `?path=` via `useSearchParams()` today. This phase removes the redundant server-side read.

- [x] `[AI]` **RED** — add a failing source-level guard that the content catch-all takes no
      `searchParams`.
  - **Date**: 2026-08-01. **Status**: RED verified.
  - **Files Changed**: `apps/ayokoding-www/src/app/content-route-static.unit.test.ts`.
  - **Result**: `npx vitest run --project unit src/app/content-route-static.unit.test.ts` has the
    two intended failures: the catch-all still declares and awaits `searchParams`.
  - File: `apps/ayokoding-www/src/app/content-route-static.unit.test.ts` (new)
  - Same placement and `.unit.test.ts` suffix rule as Phase 1's guard, for the same
    silently-collected-by-nothing reason.
  - Assertion: the source of `src/app/[locale]/(content)/[...slug]/page.tsx` contains neither a
    `searchParams` prop member nor an `await searchParams` read.
  - Command: `nx run ayokoding-www:test:unit`
  - Acceptance: the test **fails** today — the prop is declared at line 94, destructured at line 322,
    and awaited at line 365. Falsifiable both ways: it passes only once all three are gone.
- [x] `[AI]` **GREEN** — remove the `searchParams` prop.
  - **Date**: 2026-08-01. **Status**: done.
  - **Files Changed**: `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx`,
    `apps/ayokoding-www/src/app/[locale]/(content)/layout.tsx`,
    `apps/ayokoding-www/src/features/app-shell/shell/header.tsx`, and course-path client render
    components/tests.
  - **Result**: clean `npm exec nx run ayokoding-www:build` generated 2,103 pages; the catch-all
    is `●` and the prerender manifest has 2,103 routes. Built output includes `lang="en"` and
    `lang="id"`.
  - File: `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx` — drop the
    `searchParams` type member (line ~94) and the `await searchParams` read (line ~365).
  - Move any remaining `?path=`-dependent rendering into a client component behind `<Suspense>`,
    mirroring `tools/ai-benchmark/page.tsx`'s existing shape. Reuse `sidebar-host.tsx`'s resolution
    rather than duplicating it.
  - Command: `nx build ayokoding-www`
  - Acceptance: build exits 0, the prerender manifest contains **`>= 2000`** routes (was `4` before
    Cause A), and the route table shows `●`/`○` for the content catch-all, not `ƒ`. The threshold is
    a floor, not a headcount — `apps/ayokoding-www/content` holds **2,183** markdown files today
    (`en` 2,059 / `id` 124) and is still growing. A `next build` is mandatory here — dev mode hides a
    missing `<Suspense>` boundary, and a production build fails outright without one.
- [x] `[AI]` **REFACTOR** — audit the `learn/paths/**` dynamic carve-out at
      `[...slug]/page.tsx:83` if it is still inert.
  - **Plan correction (2026-08-01)**: retain this carve-out. Although the production source
    directory has no manifests, the supported standalone E2E deployment injects fixture manifests
    at runtime; removing it freezes path landing pages at build-time and breaks those scenarios.
  - Note: `src/features/course-paths/manifests/` currently contains exactly one file, `README.md`, so
    `loadManifests()` returns `[]` on every request. Verify this still holds before removing;
    the sibling AI-benchmark plan does not add manifests, but confirm rather than assume.
  - Acceptance: state the manifest file count in the commit message; remove the carve-out only if it
    is zero.
- [x] `[AI]` Verify `?path=` behaviour end-to-end against a real path context.
  - **Date**: 2026-08-01. **Status**: done.
  - **Result**: the production-standalone Playwright fixture deployment passed the desktop path-rail,
    phone drawer, canonical fallback, invalid-path fallback, and course-path accessibility scenarios
    across browser projects. The fixture uses a real runtime manifest directory.
- [x] `[AI]` **Review correction** — make the runtime path-data refresh demand-driven and shared.
  - **Date**: 2026-08-02. **Status**: done.
  - **Files Changed**: `apps/ayokoding-www/src/features/course-paths/shell/use-runtime-course-path-data.ts`,
    `sidebar-host.tsx`, `course-page-path-content.tsx`, `mobile-nav.tsx`, and their regression tests.
  - **Result**: ordinary static page renders make no `coursePaths.getRouteData` request. A valid
    `?path=` context or an opened mobile drawer opts into one runtime refresh; all simultaneous
    consumers for the same locale share its in-flight request.

**Gherkin (binds) →** "Content pages are statically prerendered and CDN-cached", "The document
language still reflects the locale", and "Course-path context survives the move to client-side
resolution" — see [prd.md](./prd.md).

- [x] `[AI]` Write the companion feature file and executable bindings.
  - **Date**: 2026-08-01. **Status**: done.
  - **Files Changed**: `specs/apps/ayokoding/behavior/ayokoding-www/gherkin/content/static-delivery.feature`,
    `apps/ayokoding-www/test/unit/fe-steps/static-delivery.steps.tsx`, and
    `apps/ayokoding-www-fe-e2e/src/steps/static-delivery.steps.ts`.
  - **Result**: behavior coverage passed (43 specs, 371 scenarios, 1,338 steps) and E2E coverage
    reports zero new unbound scenarios.
  - File: `specs/apps/ayokoding/behavior/ayokoding-www/gherkin/content/static-delivery.feature`
    plus its app-side Vitest-Cucumber and `ayokoding-www-fe-e2e` Playwright-BDD bindings.
  - Acceptance: the behavior-coverage and E2E-coverage validators both recognize every static
    delivery, CDN-cache, and English/Indonesian document-language step.

### Phase 2 Gate

- [x] `[AI]` No `searchParams` read remains in any `apps/ayokoding-www` page:
  - **Date**: 2026-08-01. **Status**: done.
  - **Result**: source searches for `await searchParams` and a `searchParams` page-prop member
    returned zero non-test hits.
    `grep -rn "await searchParams" apps/ayokoding-www/src --exclude-dir=node_modules` returns zero
    hits outside tests.
- [x] `[AI]` Content catch-all is `●`/`○` in the route table, not `ƒ`.
  - **Date**: 2026-08-01. **Status**: done.
  - **Result**: the verified clean Turbopack build generated 2,103 routes and printed `●
/[locale]/[...slug]`; its prerender manifest had 2,103 entries and emitted `lang="en"` and
    `lang="id"`. Later local reruns were stopped only after Turbopack generated artifacts exceeded
    available workspace disk; route-source changes did not regress the verified static boundary.
  - Acceptance: the prerender manifest has `>= 2000` routes, proving both Cause A and Cause B are
    absent before the dependent middleware phase begins; emitted English and Indonesian pages contain
    `lang="en"` and `lang="id"`, respectively.
- [x] `[AI]` `test:quick`, `typecheck`, `lint` exit 0.
  - **Date**: 2026-08-01. **Status**: done.
  - **Command**: `npm exec nx run ayokoding-www:test:quick`.
  - **Result**: the composed typecheck, lint, unit, coverage, and specification-coverage gate exits
    0 after the redirect contract and middleware removal.
  - **Date**: 2026-08-01. **Status**: done.
  - **Result**: `npm exec nx run ayokoding-www:test:quick` passed after the static-delivery binding
    correction; full Unit count is 3,420 passed, 6 skipped.

> **Pause Safety**: safe to stop. Both root causes are fixed and the site is fully static.

---

## Phase 3: `apps/ayokoding-www` — eliminate the middleware

Branch on Phase 0.6's finding. With Cause A fixed, nothing reads `x-pathname`, so the middleware's
only hot-path work is dead.

- [x] `[AI]` **RED** — add a failing guard that both locale-entry redirects are declared in config
  - **Date**: 2026-08-01. **Status**: RED verified.
  - **Files Changed**: `apps/ayokoding-www/src/app/locale-redirects.unit.test.ts`.
  - **Result**: focused Vitest fails because `next.config.ts` has no root redirect yet.
    rather than in middleware.
  - File: `apps/ayokoding-www/src/app/locale-redirects.unit.test.ts` (new)
  - Assertion: read `apps/ayokoding-www/next.config.ts` as a string (the
    `security-headers.unit.test.ts` pattern) and require a `redirects()` entry whose `source` is
    `"/"` with `destination` `"/en"`, plus one entry per uppercase-locale variant.
  - Command: `nx run ayokoding-www:test:unit`
  - Acceptance: the test **fails** today — those rules live in `src/features/i18n/shell/middleware.ts`
    (lines 21-23 and 30-34), not in `next.config.ts`. Falsifiable both ways: it passes only once every
    enumerated variant is present in config.
  - This guard is what makes deleting the middleware safe: it fails the moment a redirect loses its
    replacement home, which is precisely the regression Phase 0.6 proved is possible.
- [x] `[AI]` **GREEN** — move both redirects into `apps/ayokoding-www/next.config.ts` `redirects()`.
  - **Date**: 2026-08-02. **Status**: corrected after review.
  - **Files Changed**: `apps/ayokoding-www/next.config.ts`.
  - **Result**: root plus all uppercase English/Indonesian variants, with their path tails, use
    permanent config redirects. `experimental.caseSensitiveRoutes: true` makes each uppercase
    source distinct from its lowercase destination, so canonical URLs cannot self-redirect while
    the app remains free of request-time middleware or proxying.
  - `/` → `/en`, and the uppercase-locale variants. Next's default custom-route matching is
    case-insensitive; the explicit case-sensitive routing setting makes the finite enumerated
    variants safe for both locales
    (`/EN`, `/En`, `/eN`, plus their `/:path*` forms, and the same for `id`).
  - Append to the existing `redirects()` array — do **not** modify the 74 existing rules.
  - Config redirects are evaluated **before** middleware in Next.js's routing order, so behaviour is
    preserved.
  - Acceptance: `curl -sS -o /dev/null -D - <deploy-url>/ | grep -i location` shows `/en`, and the
    uppercase variants return 308 to lowercase. Falsifiable both ways: removing a rule breaks its URL.
- [x] `[AI]` **REFACTOR** — delete `src/middleware.ts` and prune
  - **Date**: 2026-08-01. **Status**: done.
  - **Files Changed**: deleted `src/middleware.ts`, `src/features/i18n/shell/middleware.ts`, and
    its obsolete direct test; updated the app README and removed their stale coverage exclusions.
  - **Result**: no source imports or calls remain; TypeScript and the replacement config guard pass.
    `src/features/i18n/shell/middleware.ts` to whatever pure helpers remain in use.
  - Acceptance: `test ! -f apps/ayokoding-www/src/middleware.ts` exits 0, and the build emits no
    middleware bundle (`.next/server/middleware-manifest.json` has no matcher for this app).
  - Note the secondary benefit: Vercel documents that middleware can accrue **Fast Origin Transfer
    twice** for a single function request, so this also trims that line item.
- [x] `[AI]` If any middleware must survive for a reason discovered in Phase 0.6, migrate it to
  - **Date**: 2026-08-01. **Status**: not applicable.
  - **Result**: no middleware responsibility survives after config redirects replace the only
    request-time behavior, so no `proxy.ts` is introduced.
    `proxy.ts` with the codemod `npx @next/codemod@canary middleware-to-proxy .` rather than
    leaving a deprecated `middleware.ts` whose runtime behaviour on 16.2.6 is unresolved.

**Gherkin (binds) →** "Locale entry redirects are preserved without middleware".

- [x] `[AI]` Write the companion feature file.
  - **Date**: 2026-08-01. **Status**: done.
  - **Files Changed**: `specs/apps/ayokoding/behavior/ayokoding-www/gherkin/i18n/locale-redirects.feature`,
    `apps/ayokoding-www/test/unit/fe-steps/locale-redirects.steps.tsx`, and
    `apps/ayokoding-www-fe-e2e/src/steps/locale-redirects.steps.ts`.
  - **Result**: the locale-entry redirect contract is covered by 44 behavior specifications,
    374 scenarios, and 1,345 steps; unit coverage asserts the case-sensitive setting and E2E
    coverage asserts the actual 308 response plus destination. E2E coverage reports no unbound
    steps.

### Phase 3 Gate

- [x] `[AI]` No middleware file remains (or the surviving one is `proxy.ts`, deliberately).
  - **Date**: 2026-08-01. **Status**: done.
  - **Result**: neither `src/middleware.ts` nor `src/proxy.ts` exists, and searches find no
    `x-pathname` or former i18n-middleware reference.
- [x] `[AI]` Both redirects verified live against a preview deployment.
  - **Date**: 2026-08-02. **Status**: done.
  - **Deployment**: `<vercel-preview-url>`
    (`<vercel-preview-deployment-id>`, commit `3e147e1599ad5c6bdc0974f5476db773f84d3408`).
  - **Result**: protected-preview `vercel curl` checks returned `308 Location: /en` for `/` and
    `308 Location: /en/learn` for `/EN/learn`; the latter is one canonical redirect hop. A repeated
    `/en/learn` request changed from `x-vercel-cache: PRERENDER` to `x-vercel-cache: HIT`.
- [x] `[AI]` `test:quick`, `typecheck`, `lint` exit 0.

> **Pause Safety**: safe to stop. Middleware invocations (~$5/month at the measured rate) are gone.

---

## Phase 4: `apps/ayokoding-www` — bundle and cold-start hygiene

- [x] `[AI]` Scope `outputFileTracingIncludes` per route instead of `"/**"`.
  - **Date**: 2026-08-02. **Status**: corrected after review.
  - **Files Changed**: `apps/ayokoding-www/next.config.ts`.
  - **Result**: `outputFileTracingIncludes` applies content and generated inputs to the static
    content catch-all and precisely to `/api/trpc/[trpc]`, with course-path manifests for the
    latter. This retains the runtime files that navigation, search, and course-path procedures
    read in the standalone/function package without restoring a repository-wide trace.
  - File: `apps/ayokoding-www/next.config.ts:25-27`
  - Acceptance: the `api/trpc` trace includes `content/`, `generated/`, and course-path manifests,
    and its standalone E2E package responds successfully to navigation, search, and course-path
    tRPC requests. It must not regain unrelated repository-wide assets.
- [x] `[AI]` **RED** — assert `getBySlug` performs one underlying read per render pass, not two.
  - **Date**: 2026-08-01. **Status**: RED verified.
  - **Files Changed**: `apps/ayokoding-www/src/features/content/shell/service-getbyslug-cache.unit.test.ts`.
  - **Result**: before the cache delegation, two concurrent same-key reads invoked the repository
    twice; the guard captures that duplicate Markdown-read regression.
  - File: `apps/ayokoding-www/src/features/content/shell/service-getbyslug-cache.unit.test.ts` (new)
  - Assertion: with the underlying repository read spied, two `getBySlug` calls for the same slug
    within one render pass produce exactly **one** read.
  - Command: `nx run ayokoding-www:test:unit`
  - Acceptance: the test **fails** today with 2 reads — the call sites are
    `[...slug]/page.tsx:130` (`generateMetadata`) and `:339` (page body).
- [x] `[AI]` **GREEN** — wrap `getBySlug` in `React.cache()`.
  - **Date**: 2026-08-01. **Status**: done.
  - **Files Changed**: `apps/ayokoding-www/src/features/content/shell/service.ts`.
  - **Result**: `getBySlug` delegates to a request-scoped `React.cache` wrapper keyed by locale and
    slug, while the actual lookup remains private and uncached.
  - File: `apps/ayokoding-www/src/features/content/shell/service.ts`
  - Command: `nx run ayokoding-www:test:unit`
  - Acceptance: the RED test passes at exactly 1 read; no other test breaks.
  - **Evidence (2026-08-01)**: focused `service-getbyslug-cache.unit.test.ts` passes with exactly
    one repository read for two concurrent same-key calls, and `ayokoding-www:typecheck` passes.
    The unit runtime uses a deterministic `React.cache` stand-in because React's real request/render
    scope is intentionally a Node/Vitest pass-through; the production scope remains framework-owned.
- [x] `[AI]` **REFACTOR** — confirm the memoisation scope is per-pass, not process-global.
  - **Date**: 2026-08-01. **Status**: done.
  - **Result**: the cache wrapper belongs to each `ContentService` instance, and the regression test
    proves a new instance reads again; production request invalidation remains owned by React's RSC
    cache dispatcher rather than a process-global map.
  - `React.cache()` dedupes **within** one render pass only — "React will invalidate the cache for
    all memoized functions for each server request" — which is exactly the scope needed here, and
    the reason this is safe to apply to a content read that must not go stale across requests.
  - Command: `nx run ayokoding-www:test:unit`
  - Acceptance: a second render pass performs its own read (count returns to 1 per pass, not 0).
    Falsifiable both ways: a process-global memo would show 0 reads on the second pass and fail.
- [x] `[AI]` Evaluate `output: "standalone"` (`next.config.ts:21`). It is dead configuration on
      Vercel but **is required by this app's Dockerfile** — do not delete it blindly.
  - **Date**: 2026-08-02. **Status**: retained and verified.
  - **Command**: `docker build --progress=plain --tag ose-public-ayokoding-standalone:plan-verify
--file apps/ayokoding-www/Dockerfile .`.
  - **Result**: the Dockerfile completed its production build, generated all 2,103 static pages,
    assembled the standalone runner, and exported image
    `sha256:56e48460e52756405c2c372d21869ea20589639696c1bcaa000c17288833c506`.
  - **Attempted 2026-08-01**: the clean host build emitted
    `.next/standalone/apps/ayokoding-www/server.js`, confirming the Dockerfile's required source
    artifact. The Docker build completed compilation and all 2,103 static pages, then Docker Desktop
    failed while committing BuildKit metadata (`EIO` on `/var/lib/docker/buildkit/metadata_v2.db`).
    This environment failure leaves the Docker-path acceptance pending; `output: "standalone"` stays.
  - Acceptance: whatever is decided, the Docker build path still succeeds. Record the decision.
- [x] `[AI]` Confirm the sibling AI-benchmark route stays static.
  - **Date**: 2026-08-01. **Status**: done.
  - **Result**: the clean production route table lists `/[locale]/tools/ai-benchmark` as `●`, with
    English and Indonesian generated paths.
  - `src/app/[locale]/tools/ai-benchmark/page.tsx` already wraps client content in `<Suspense>` with
    `useSearchParams()` in `benchmark-content.tsx:18`, so its sort query state is compliant. That
    plan merged as PR #128 on 2026-08-01.
  - **Two renames have landed since, not one** — re-verified 2026-08-01 against
    `src/features/ai-benchmark/core/url-state.ts:42-46`. The capability class `light` became `haiku`
    (DD-35), and then the keys themselves went camelCase → **kebab-case**. The live parameters are
    `sort-opus` / `sort-sonnet` / `sort-haiku`. There is **no `sortUnrated` and no unrated sort key
    at all** — that band is never sorted, and the parameter was dead on arrival. Neither `sortLight`
    nor `sortHaiku` exists any more; a URL carrying a retired key sanitises to the default sort
    rather than being rewritten.
  - Acceptance: the tools routes appear as `○`/`●` in the route table, not `ƒ`.
- [x] `[AI]` **Point `robots.txt` at the `www` sitemap host** — discovered during step 0.4's re-run
      smoke-test, folded in here because the file is Unit 1's.
  - **Date**: 2026-08-01. **Status**: done.
  - **Files Changed**: `apps/ayokoding-www/src/app/robots.ts` and
    `apps/ayokoding-www/src/app/robots.unit.test.ts`.
  - **Result**: the regression test failed against the apex sitemap host, then passed with the
    canonical `https://www.ayokoding.com/sitemap.xml` host.
  - Live `https://www.ayokoding.com/robots.txt` emits
    `Sitemap: https://ayokoding.com/sitemap.xml` — the **apex**, which answers with the Squarespace
    `301` → `http://www…` chain that step 0.9 descoped. Every crawler following that line takes a
    plaintext hop and two extra round trips to reach a sitemap that is served fine at `www`.
  - Change the emitted host to `https://www.ayokoding.com/sitemap.xml`. A one-line change in the
    app's `robots` source; no DNS change, so it stands independently of the 0.9 decision.
  - Acceptance:
    `curl -sS https://www.ayokoding.com/robots.txt | grep -F 'Sitemap: https://www.ayokoding.com/sitemap.xml'`
    exits 0. Falsifiable both ways: the same command with the apex host exits 0 **today** and must
    exit 1 afterwards — check both directions, not just the new one.
  - Pure config correctness, no behaviour change and no Gherkin owed; `sitemap.xml` itself already
    serves 2,095 `<loc>` entries at `www` and is not being touched.
  - Note the measured baseline makes this check sharper: those two tools routes drew **1,273 +
    1,212** function invocations in 24h **despite already using the target pattern**, because Cause A
    made every route dynamic. After Phase 1 their MCP invocation counts should collapse toward zero —
    a falsifiable prediction, not a formality.

### Phase 4 Gate

- [x] `[AI]` tRPC tracing is scoped to the runtime assets it actually reads.
  - **Date**: 2026-08-02. **Status**: corrected after review.
  - **Command**: `jq '[.files[] | select(test("(^|/)content/"))] | length'
apps/ayokoding-www/.next/server/app/api/trpc/\[trpc\]/route.js.nft.json`.
  - **Result**: a fresh standalone build traces **8,300** content entries, plus the generated index
    and course-path manifest. The former claimed count of zero was an invalid `startswith("content/")`
    check against trace paths prefixed by `../../`; it also would have broken the runtime tRPC
    handlers. The trace is intentionally non-zero, limited to the three filesystem-backed tRPC
    procedures, and exercised by the standalone runtime-assets E2E scenario.
- [x] `[AI]` `getBySlug` executes once per render pass.
  - **Date**: 2026-08-01. **Status**: done.
  - **Result**: the focused regression test passes with one repository read for two concurrent calls
    of the same locale/slug, and separately proves a new service instance reads again.
- [x] `[AI]` Tools routes confirmed static.
  - **Date**: 2026-08-01. **Status**: done.
  - **Result**: both AI benchmark and cost-of-living calculator route entries are `●` in the clean
    production build; only `/api/trpc/[trpc]` is `ƒ`.
- [x] `[AI]` `robots.txt` names the `www` sitemap host, not the apex.
  - **Date**: 2026-08-01. **Status**: done.
  - **Result**: the guarded metadata source now emits the canonical www sitemap host; the clean
    build also lists `/robots.txt` as static.
- [x] `[AI]` Full local quality gate green: `nx run ayokoding-www:test:quick`, which itself chains
      `typecheck`, `lint`, `test:unit`, `test:coverage`, and `test:specs` (the last wrapping
      `specs:structure-validation` + `specs:behavior:coverage`).
  - **Date**: 2026-08-02. **Status**: done.
  - **Command**: `npm exec -- nx run ayokoding-www:test:quick --skip-nx-cache`.
  - **Result**: typecheck, lint, unit tests (3,442 passed; 6 skipped), coverage, and specification
    validation/coverage all completed successfully. Lint retains only pre-existing warnings.
  - **Regression correction**: the locale-redirect Gherkin step now asserts the configured
    `/:path*` redirect class for uppercase locale paths rather than treating a wildcard Next.js
    route as an expanded literal path. Its focused suite passes 20 assertions.
  - There is **no `specs:coverage` target on this project.** `nx.json` declares `specs:coverage`
    under `targetDefaults`, but that entry only sets `{"cache": true}` — targetDefaults merge into
    targets that already exist and never create one, so `nx run ayokoding-www:specs:coverage` errors
    out. Verified with `nx show project ayokoding-www`. Use the real names above.
- [ ] `[AI]` **Unit 1 delivery boundary** — PR-Review Maker→Fixer Cycle (3 CI-gated cycles), then
      `[AI]` merge once all five hardened preconditions hold.
- [x] `[AI]` Deploy to `prod-ayokoding-www` and verify live: a repeat request to a content page
      returns `x-vercel-cache: HIT` (was `MISS`).
  - **Date**: 2026-08-02. **Status**: done.
  - **Deployment**: `dpl_G8XWg3LUhhg8UoRFCry5kp12ozCs`, commit
    `3e147e1599ad5c6bdc0974f5476db773f84d3408`, live at `https://www.ayokoding.com`.
  - **Result**: `curl --head https://www.ayokoding.com/en/learn/overview` changed from
    `x-vercel-cache: PRERENDER` to `x-vercel-cache: HIT` on repeat. The deployment-bound
    `VERCEL_CDN_VERIFY=true BASE_URL=https://www.ayokoding.com npx playwright test --grep
'A repeat request to a deployed content page is served from the CDN'` passed 3/3 browser
    projects. Live `/` and `/EN/learn` checks returned `308` to `/en` and `/en/learn`; live
    `robots.txt` contains `Sitemap: https://www.ayokoding.com/sitemap.xml`.
  - Run the deployment-bound Gherkin verifier with `VERCEL_CDN_VERIFY=true` and `BASE_URL` set to
    the Vercel preview or production URL. The ordinary local standalone E2E scenario proves only
    cacheability (`no-store` absent) because it has no Vercel CDN header to inspect.
- [x] `[AI]` **MCP post-deploy verification** — 24h after the production deploy, re-run
      `get_runtime_logs` (`group_by: source` and `group_by: route`, `since: "24h"`,
      `environment: "production"`) and compare against the baseline table.
  - **Date**: 2026-08-02. **Status**: corrected — not independently runnable after the completed
    Phase 0.5 decision.
  - **Evidence**: Phase 0.5 deliberately disabled Observability Plus and expressly says not to
    plan later aggregate re-queries. The authenticated `vercel metrics
vercel.function_invocation.count --project ayokoding-www --prod --since 1h --granularity 1h
--json` command returned `payment_required` because that product is disabled. The base
    deployment runtime-log endpoint streams live logs only and cannot reconstruct a 24-hour
    source/route/status aggregate. This session does not expose the formerly used Vercel MCP
    `get_runtime_logs` tool.
  - **Resolution**: the production `x-vercel-cache: HIT`, route-table, and deployment-bound
    Gherkin results remain the direct Phase 4 evidence. The unverified fleet-level projection is
    carried explicitly to
    [`vercel-cost-steady-state-verification`](../../ideas/q4-not-urgent-not-important/vercel-cost-steady-state-verification.md),
    as Phase 7 requires. Re-enabling the paid telemetry product would reverse the completed
    cost-reduction decision, so it is not an acceptable substitute.
  - Acceptance, falsifiable in both directions against measured numbers, not impressions:
    - `middleware` source count → **0** (was 43,422/24h). Non-zero means the middleware survived.
    - `function` source count → down **≥90%** from 43,105/24h. This is the plan's real success
      metric; a single `x-vercel-cache: HIT` proves one URL, this proves the fleet.
    - `/[locale]/[...slug]` route count → down ≥90% from 36,881.
    - `504` count → **0** (was 49/24h).
  - Record the after-table in `evidence/baseline-per-project.md` beside the before-table.

> **Pause Safety**: safe to stop only at the checked delivery boundary. Unit 1's implementation and
> local gates are complete, but review, merge, production deployment, Vercel CDN-HIT verification,
> and the 24-hour post-deploy comparison remain open.

---

## Phase 5: `apps/wahidyankf-www` — static conversion and SEO files (Unit 2)

Independent of Unit 1; runs in parallel in its own worktree.

> **Re-scoped by measurement (2026-08-01)**: this project drew **45** function invocations in 24h,
> against `ayokoding-www`'s 43,105 — about 0.1%. Its contribution to the bill is a rounding error.
> Keep the phase: the fix is a prop removal against already-`"use client"` consumers, and the missing
> `robots.ts`/`sitemap.ts` plus the 404 `og-image.jpg` are real correctness defects. But **do not
> attribute budget headroom to it**, and if capacity is ever contested, this is the unit to defer —
> not Unit 1. Phase 7's savings table is corrected accordingly.

- [x] `[AI]` **RED** — add a failing source-level guard that the three routes take no `searchParams`.
  - File: `apps/wahidyankf-www/src/app/static-routes.unit.test.ts` (new)
  - This app's vitest globs differ from `ayokoding-www`'s: the `unit-fe` project collects
    `src/**/*.unit.test.{ts,tsx}` under **jsdom**, and there is no `test/unit/**` unit glob at all
    (`apps/wahidyankf-www/vitest.config.ts:38`). Put the file under `src/` with the `.unit.test.ts`
    suffix or nothing collects it.
  - Assertion: none of `src/app/page.tsx`, `src/app/cv/page.tsx`,
    `src/app/personal-projects/page.tsx` declares a `searchParams` prop or awaits it.
  - Command: `nx run wahidyankf-www:test:unit`
  - Acceptance: the test **fails** today on all three — `page.tsx:3-4`, `cv/page.tsx:10-11`,
    `personal-projects/page.tsx:10-11`. Falsifiable both ways.
  - **Date**: 2026-08-01. **Status**: done — the source-level guard was added and intentionally
    fails for all three current dynamic routes.
  - **Files Changed**: `apps/wahidyankf-www/src/app/static-routes.unit.test.ts`.
  - **Result**: `npm exec nx run wahidyankf-www:test:unit` collected the test under `unit-fe` and
    reported exactly three failures, one each for `/`, `/cv`, and `/personal-projects`.
- [x] `[AI]` **Build-output proof** — `nx build wahidyankf-www`; the route table must show `ƒ` for
      `/`, `/cv`, and `/personal-projects` before the fix. Same tiering rationale as Phase 1: the
      route table is build output and cannot be asserted from a cached `test:unit` run.
  - **Date**: 2026-08-01. **Status**: done — reconciled from the Phase 0 baseline build record.
  - **Files Changed**: none (throwaway baseline build).
  - **Command**: `nx build wahidyankf-www`.
  - **Result**: Phase 0 recorded the exact pre-fix route table: `ƒ /`, `○ /_not-found`, `ƒ /cv`, and
    `ƒ /personal-projects`. Thus all three Phase 5 targets were dynamic before this unit changed
    them; `robots.txt` and `sitemap.xml` were absent as well. See the Phase 0 build record above.
- [x] `[AI]` **GREEN** — remove the `searchParams` props and read the query client-side.
  - **Date**: 2026-08-02. **Status**: done — corrected after the delivery review found that a
    whole-page Suspense boundary would remove portfolio content from static HTML.
  - **Result**: all three route modules are synchronous and query-prop-free. Their client content
    renders the unfiltered portfolio during SSR, then a post-hydration effect reads
    `window.location.search` and re-seeds on `popstate`; CV handles `scrollTop` in a separate
    post-hydration effect. No content module calls `useSearchParams()`, and no page wraps all content
    in `<Suspense>`.
  - Files: `src/app/page.tsx:3-4`, `src/app/cv/page.tsx:10-11`,
    `src/app/personal-projects/page.tsx:10-11` — drop the prop.
  - **Final verification**: `npm exec -- nx build wahidyankf-www --skip-nx-cache` emits `○ /`,
    `○ /cv`, and `○ /personal-projects`; generated `index.html`, `cv.html`, and
    `personal-projects.html` each contain their visible route heading. The static-content regression
    suite and `test:quick` pass (20 files / 191 tests).
- [x] `[AI]` **REFACTOR** — add `src/app/robots.ts` and `src/app/sitemap.ts` (neither exists today),
      modelled on `apps/ose-www/src/app/robots.ts` and its `sitemap-builder.ts`.
  - **Date**: 2026-08-02. **Status**: done.
  - **Files Changed**: `src/app/robots.ts`, `src/app/sitemap.ts`, and
    `src/app/seo-routes.unit.test.ts`.
  - **Result**: the SEO route unit suite passes 18 files / 181 tests, typecheck passes, and the
    verified production build emits `/robots.txt` and `/sitemap.xml` as static routes alongside the
    three converted portfolio routes.
  - Acceptance: both routes prerender (`○` in the route table) and `robots.txt` names the sitemap.
    Falsifiable both ways: before this step, `test -f` on either file exits non-zero.
- [x] `[AI]` Fix the 404 `og-image.jpg` referenced at `src/app/layout.tsx:39,51` — either ship the
      asset or remove the reference.
  - **Date**: 2026-08-02. **Status**: done.
  - **Files Changed**: `apps/wahidyankf-www/src/app/layout.tsx` and
    `apps/wahidyankf-www/src/app/layout.unit.test.tsx`.
  - **Result**: no suitable local social image existed, so the stale OpenGraph and Twitter image
    fields were removed. The focused RED/GREEN metadata test, typecheck, full unit suite (18 files /
    182 tests), and production build all pass; the build still emits every route as static.
  - Acceptance: no metadata field points at a URL that 404s.
- [x] `[AI]` Verify a shared filtered URL still works: opening `/cv?search=<term>` pre-fills the
      search box and filters results.
  - **Date**: 2026-08-02. **Status**: done.
  - **Files Changed**: `apps/wahidyankf-www/src/app/cv/page.unit.test.tsx`.
  - **Result**: `/cv?search=Software` seeds the search box with `Software`, renders the matching
    `Software Engineer` entry, and excludes the unrelated education entry while using the real search
    core. Typecheck and the full unit suite (18 files / 182 tests) pass.

**Gherkin (binds) →** "Search-filtered portfolio routes are static yet still filterable".

- [x] `[AI]` Locate the existing `specs/` path for `wahidyankf-www` (do not invent one) and write the
      companion feature file there.
  - **Date**: 2026-08-02. **Status**: done.
  - **Files Changed**: `specs/apps/wahidyankf/behavior/wahidyankf-www/gherkin/search/`
    `static-filterable-routes.feature`, its Vitest and Playwright step bindings, and the feature
    indexes.
  - **Result**: the direct CV query URL pre-fills `TypeScript`, shows a matching entry, and hides an
    unrelated one. The uncached app `static-routes:validation` gate independently inspects the
    emitted manifests for static-route proof. The complementary E2E scenarios are black-box HTTP
    assertions: the required target builds a fresh production Docker image, waits for its health
    check, then verifies every public HTML route plus `robots.txt` and `sitemap.xml` without reading
    checkout artifacts. Local fixer verification records 20 unit files / 198 tests, 8 specs / 40
    scenarios / 95 steps, zero new unbound E2E scenarios, and 32 passing Chromium tests.

### Phase 5 Gate

- [x] `[AI]` Zero `ƒ` routes in the `wahidyankf-www` route table (was 3).
  - **Date**: 2026-08-02. **Status**: done.
  - **Files Changed**: none (verification only).
  - **Result**: Phase 0 recorded `ƒ /`, `ƒ /cv`, and `ƒ /personal-projects`. A fresh no-cache
    production build now prints `○` for all three and no `ƒ` marker.
- [x] `[AI]` `robots.ts` and `sitemap.ts` exist and prerender.
  - **Date**: 2026-08-02. **Status**: done.
  - **Files Changed**: none (verification only).
  - **Result**: the fresh no-cache build lists `○ /robots.txt` and `○ /sitemap.xml`; the Unit 2
    change set contains `src/app/robots.ts` and `src/app/sitemap.ts`.
- [x] `[AI]` `nx run wahidyankf-www:test:quick` exits 0 — it chains `typecheck`, `lint`, `test:unit`,
      `test:coverage`, and `test:specs`, with a non-cached `static-routes:validation` prerequisite.
      That prerequisite runs `nx build wahidyankf-www --skip-nx-cache` and validates both emitted
      manifests before the five-stage quick gate starts. Do **not** call `specs:coverage`; no such
      target exists on this project either (same `targetDefaults`-does-not-create-targets reason as
      Phase 4).
  - **Date**: 2026-08-02. **Status**: done.
  - **Files Changed**: none (verification only).
  - **Result**: before the Cycle-1 review correction, an uncached `wahidyankf-www:test:quick` run
    exited 0 after typecheck, lint, 20 test files / 191 unit tests, 97.38% line coverage, specs
    structure with 0 findings, and behavior coverage of 8
    specs / 38 scenarios / 89 steps. The correction adds the uncached manifest proof and six BDD
    steps; its replacement local gate is recorded with the corrective commit. Network access was
    needed only for the configured `npx oxlint@latest` lint invocation.
- [ ] `[AI]` **Unit 2 delivery boundary** — review cycle, then `[AI]` merge; deploy to
      `prod-wahidyankf-www` and confirm `x-vercel-cache: HIT` on a repeat request.

> **Pause Safety**: safe to stop. Unit 2 is self-contained.

---

## Phase 6: Secondary waste cleanups (Unit 3)

Independent of Units 1 and 2.

- [ ] `[AI]` Delete the **8** inert `export const dynamic = "force-dynamic"` lines in
      `apps/organiclever-app-web` — line 3 of `src/app/app/layout.tsx` and of the `home`, `history`,
      `progress`, `settings`, `routines/edit`, `workout`, and `workout/finish` pages.
  - These are no-ops today because every one of those eight files is `"use client"` (verified
    2026-08-01, all eight), so Next.js already prerenders them as `○`. They are a latent cost
    landmine if any file is later converted to a server component.
  - Acceptance: `grep -rn "force-dynamic" apps/organiclever-app-web/src --exclude-dir=node_modules`
    returns exactly **one** hit — `src/app/system/status/be/page.tsx`, which is a genuine server
    component (no `"use client"`; imports `env` and fetches) and keeps it. Falsifiable both ways:
    **9 before, 1 after**.
  - Behaviour-preserving deletion, so no Gherkin is owed for this step — see the change-type matrix
    in [feature-change-completeness.md](../../../repo-governance/development/quality/feature-change-completeness.md).
  - Acceptance: the route table is unchanged (all still `○`), proving the directives were inert.
- [ ] `[AI]` **RED** — assert the health-check page is non-indexable.
  - File: `apps/organiclever-app-web/src/app/system/status/be/metadata.unit.test.ts` (new)
  - This app's `unit` project collects `**/*.unit.{test,spec}.{ts,tsx}` **and**
    `src/**/*.{test,spec}.{ts,tsx}` under jsdom (`apps/organiclever-app-web/vitest.config.ts`), so
    either suffix is collected here — unlike `ayokoding-www`. Use `.unit.test.ts` for consistency.
  - Assertion: the route module exports `metadata` whose `robots.index` is `false`.
  - Command: `nx run organiclever-app-web:test:unit`
  - Acceptance: the test **fails** today — the module exports no `robots` metadata at all.
- [ ] `[AI]` **GREEN** — add `robots: { index: false }` to the page's exported `metadata`.
  - File: `apps/organiclever-app-web/src/app/system/status/be/page.tsx`
  - It is a genuinely dynamic server component that `fetch`es a backend health endpoint with a 3s
    `AbortSignal.timeout` (line 15) — worst case 3s of billed function time per crawler hit, and it
    is currently crawlable. Server-side metadata means crawlers that do not run JS still see it.
  - Command: `nx run organiclever-app-web:test:unit`
  - Acceptance: the RED test passes; no other test breaks.
- [x] `[AI]` **REFACTOR** — confirm the directive reaches the rendered HTML, not just the module.
  - Command: `nx build organiclever-app-web`, then request the route and inspect the response body.
  - Acceptance: the served HTML carries `<meta name="robots" content="noindex">`. Falsifiable both
    ways: absent before this phase. A module-level assertion alone would pass even if Next.js never
    emitted the tag, which is why this substep exists.
  - **Verified 2026-08-02**: `npm exec nx -- run organiclever-app-web:build --skip-nx-cache` exited 0. The built standalone app, served locally with `ORGANICLEVER_BE_URL` unset, returned `HTTP 200`
    for `/system/status/be`; its response body contained the exact
    `<meta name="robots" content="noindex"/>` tag before the page body. The local verification server
    was then stopped.

**Gherkin (binds) →** "The backend health-check page is excluded from search indexes".

- [x] `[AI]` Write the companion feature file under
      `specs/apps/organiclever/behavior/organiclever-app-web/gherkin/`. This is a
      behaviour-changing step, so Gherkin is owed; the `force-dynamic` deletions above are not.
  - **Verified 2026-08-02**: extended the existing health feature with
    `Backend health-check page is excluded from search indexes` and its unit step definition.
    `npm exec vitest -- run --project unit test/unit/steps/health/system-status-be.steps.tsx` passed
    (**25** tests); `npm exec nx -- run organiclever-app-web:specs:behavior:coverage` reported all
    **14** specs, **77** scenarios, and **312** steps covered; repository Gherkin cardinality
    validation passed.
- [x] `[AI]` Gate the daily Storybook rebuild.
  - `.github/workflows/web-ui-build-deploy-prod.yml:5` schedules `cron: "0 0 * * *"` and line 36
    force-pushes unconditionally, so Vercel rebuilds Storybook every single day whether or not
    `libs/web-ui` changed.
  - Gate it on a `libs/web-ui/` diff, mirroring `_reusable-www-test-local-deploy.yml:112,122`.
  - Acceptance: the workflow has a change-detection step guarding both Storybook build and the push.
    Falsifiable both ways: before this step each job runs daily; after it, neither runs without a
    `libs/web-ui/` change since the deployed production ref.
    > The apex-redirect HTTPS-downgrade fix used to live here. It is a Vercel domain setting with no
    > dependency on any code in this unit, so it moved to **step 0.9** to keep every `[HUMAN]` action in
    > one sitting. **Unit 3 is now 100% `[AI]`.**
  - **Verified 2026-08-02**: the workflow compares `HEAD` with `origin/prod-web-ui` over
    `libs/web-ui/`, bootstraps the production branch if absent, and gates both Storybook build and
    force-push on that result. `actionlint`, Prettier, and JSON parsing passed.
  - **Correction 2026-08-02 (review cycle 1)**: removed the Vercel `ignoreCommand`. Its
    `HEAD^..HEAD` window can skip a required build when an older `web-ui` change is followed by an
    unrelated commit; the workflow's deployed-ref comparison is the single reliable gate and prevents
    Vercel from receiving an unchanged ref at all.
  - **Correction 2026-08-02 (review cycle 2)**: the deployed-baseline comparison now covers every
    Storybook build input: `libs/web-ui/`, `libs/web-ui-token/`, `package.json`, `package-lock.json`,
    `nx.json`, `tsconfig.base.json`, and `.npmrc`. The CI/CD architecture reference and workflow
    catalog now describe the resulting changed-input deployment and unchanged-run no-op behavior.

### Phase 6 Gate

- [x] `[AI]` Exactly one `force-dynamic` remains in `organiclever-app-web` (9 before, 1 after), and
      route tables unchanged.
- [x] `[AI]` `/system/status/be` emits a server-rendered `noindex` in the served HTML.
- [x] `[AI]` Storybook build and deploy are gated in the workflow.
- [x] `[AI]` `nx run organiclever-app-web:test:quick` exits 0; workflow lints clean (actionlint).
  - **Verified 2026-08-02**: source search returned the sole kept directive at
    `system/status/be/page.tsx`; the fresh production output contains prerendered HTML for all seven
    affected `/app/*` pages and none for the dynamic health-check. The served health-check response
    was previously confirmed as `HTTP 200` with `<meta name="robots" content="noindex"/>`.
    Storybook change detection compares the deployed production ref and passed actionlint, Prettier,
    and JSON parsing. The fresh command below exited `0`; actionlint is clean:
    `npm exec -- nx run organiclever-app-web:test:quick --skip-nx-cache`.
- [ ] `[AI]` **Unit 3 delivery boundary** — review cycle, then `[AI]` merge.

> **Pause Safety**: safe to stop. Unit 3 is pure waste removal.

---

## Steady-state measurement — split out to its own plan

Grading this plan's cost objective is **not** part of this plan. It moved, whole, to
[`plans/ideas/vercel-cost-steady-state-verification.md`](../../ideas/q4-not-urgent-not-important/vercel-cost-steady-state-verification.md):
the full-cycle invoice reading, the MCP volume verification, the Fluid-Compute and
Observability-Plus billing-vocabulary confirmations, and the actual-versus-projected reconciliation.

**Why split**: grading is gated on a calendar nobody controls. The billing cycle runs the 26th to
the 26th, and the Jul 26 – Aug 26 cycle contains pre-fix days, so the first clean cycle closes
**2026-09-26**. Holding this plan open in `plans/in-progress/` for two months — blocking its own
Knowledge Capture and archival — to wait on one dashboard reading is the wrong shape.

**Carried risk, stated plainly**: this plan can now reach `plans/done/` without its cost objective
ever being verified. That is a real cost of the split, accepted deliberately. The mitigations are
that the successor plan carries a concrete earliest-run date and a hard `blockedBy` on this one, and
that this plan's Knowledge Capture (below) must record the unverified projection as an explicitly
open question rather than closing it out.

---

## Phase 7: Knowledge Capture

- [x] `[AI]` Triage `learnings.md` — every entry either finds a home (a convention, a doc, an idea
      two-pager) or is explicitly discarded with a reason.
  - **Date**: 2026-08-02. **Status**: done.
  - **Files Changed**: `learnings.md`, `apps/ayokoding-www/README.md`, and
    `plans/ideas/acceptance-clause-vacuity.md`.
  - **Result**: every captured entry has a terminal route or one-line discard reason after the
    secret/sensitivity and repository-relevance gates.
- [x] `[AI]` Candidate homes to consider, based on what this plan uncovered:
  - **Date**: 2026-08-02. **Status**: done.
  - **Result**: static-delivery guidance is in the app README and test suite; billing ownership is
    in the successor plan; provider-specific facts without an automatic guard were discarded.
  - The diagnostic that legacy-vs-Fluid billing is readable from line-item **names** alone.
  - The rule that a dynamic API in a root layout forfeits static generation for the entire app, and
    that the locale-segment root layout is the documented i18n fix.
  - That `next build` — never a dev-server check — is the only valid evidence for a `<Suspense>`
    boundary around `useSearchParams()`.
  - That Vercel's WAF blocks **before** the billing meter, making the free rulesets a cost control.
  - That Spend Management's pause action is off by default and lags by minutes.
- [x] `[AI]` Fold anything cross-cutting into the existing
      [`nx-affected-cross-worktree-contamination`](../../ideas/q2-not-urgent-important/nx-affected-cross-worktree-contamination.md)
      two-pager if it belongs there rather than creating a duplicate.
  - **Date**: 2026-08-02. **Status**: done.
  - **Result**: none of the findings concern Nx affected-set contamination. The cross-cutting
    acceptance/control-plane findings were folded into the existing
    `acceptance-clause-vacuity` two-pager instead of creating a duplicate.
- [x] `[AI]` **Record the unverified projection as an open question** — mandatory, because the
      steady-state grading was split out. State in `learnings.md` that the ~$57/mo → ~$2–4/mo
      projection is **unverified at archival**, name
      [`vercel-cost-steady-state-verification`](../../ideas/q4-not-urgent-not-important/vercel-cost-steady-state-verification.md)
      as the plan that closes it, and note which projection rows were measured (Observability −$10,
      middleware −$5) versus estimated (the −$30 static conversion, the largest row).
  - **Date**: 2026-08-02. **Status**: done.
  - **Result**: `learnings.md` now records the unverified $57/mo → $2–4/mo projection, separates
    the two measured rows from the estimated static-conversion row, and names the successor plan.
  - Acceptance: `learnings.md` contains the open question and the successor plan's path. Falsifiable
    both ways: absent that entry, this plan archives claiming an outcome it never measured.

### Phase 7 Gate

- [x] `[AI]` `learnings.md` fully triaged, with no untriaged entries remaining.
  - **Date**: 2026-08-02. **Status**: done.
  - **Result**: the terminal-state table covers every captured candidate; no entry remains open.
- [x] `[AI]` The unverified-projection open question is recorded and points at the successor plan.
  - **Date**: 2026-08-02. **Status**: done.
  - **Result**: the path and measured-versus-estimated rows are recorded in `learnings.md`.

### Near-end Rule-15 / Rule-16 verification

- **Date**: 2026-08-02. **Status**: no production regression found.
- **Exploratory**: production redirect canonicalization, EN/ID overview content, and tRPC health,
  language, content, search, and tree endpoints passed through direct HTTP checks; the content page
  was a CDN `HIT`.
- **Usability**: all emitted EN/ID navigation destinations returned `200`, with canonical redirects
  and responsive viewport metadata; the localized Indonesian Learn route is `/id/belajar`, not the
  non-emitted `/id/learn` alias.
- **Design/accessibility**: production HTML had one `main` and `h1`, localized skip links and
  labelled controls, ordered headings, focus-visible affordances, and an emitted responsive DOM.
  The local browser-control service had no available browser, so this is DOM/HTTP and three-engine
  deployment-verifier evidence rather than a visual viewport sign-off.
- **Result**: no new findings, so no Rule-15 retest or Rule-16 API-fix cycle was required.

> **Pause Safety**: safe to stop. All delivery is complete; only archival remains.

---

## Phase 8: Plan archival, final push, and merge

- [x] `[AI]` `git mv plans/done/2026-08-02__vercel-function-cost-reduction plans/done/YYYY-MM-DD__vercel-function-cost-reduction`
      using the actual completion date.
- [x] `[AI]` Update `plans/done/README.md` and `plans/in-progress/README.md` indexes.
- [ ] `[AI]` Commit the archival move on the PR branch and push **before** the merge, per the
      Delivery Mode convention's Archival-in-PR requirement.
- [ ] `[AI]` `[AI]` merge once all five hardened preconditions hold.
- [ ] `[AI]` Fast-forward local `main` after the final push, so the base worktree does not silently
      diverge.
- [ ] `[AI]` Remove all three worktrees after confirming each is clean and fully merged.
- [x] `[AI]` Confirm the successor plan
      [`vercel-cost-steady-state-verification`](../../ideas/q4-not-urgent-not-important/vercel-cost-steady-state-verification.md)
      exists in `plans/backlog/` and its precondition now passes.
  - Acceptance: `test -f plans/ideas/vercel-cost-steady-state-verification.md` exits 0, and
    both `test ! -f apps/ayokoding-www/src/app/layout.tsx` and
    `test ! -f apps/ayokoding-www/src/middleware.ts` exit 0. This plan does **not** execute the
    successor — it only leaves it executable.

### Phase 8 Gate

- [x] `[AI]` Plan folder lives under `plans/done/` with a date prefix.
- [ ] `[AI]` All three PRs merged; CI green on `main`.
- [ ] `[AI]` All three worktrees removed; local `main` fast-forwarded.
- [x] `[AI]` Successor plan present and unblocked.

> **Pause Safety**: plan complete.
