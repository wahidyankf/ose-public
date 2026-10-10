# Backlog Plans

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

Full, ready-to-execute plans waiting to start. A plan lands here **only** by promotion from a
two-pager in [`../ideas/`](../ideas/README.md) — when its open questions have shrunk to ones that
genuinely need a full plan's depth to answer.

## Start here 🧭

This is the delivery queue, not the best first stop for learning what OSE is. If you are exploring
the product or setting up a checkout, begin with the [repository README](../../README.md) and
[documentation hub](../../docs/README.md). Come back here when you need to understand a proposed
piece of work: open its README for the why, scope, and dependencies, then use `delivery.md` for the
step-by-step execution record.

## Planned Projects

### FERRET initialization series

FERRET (Framework for Evaluation, Regression, Reliability & Experiment Tracking) begins as a local-only,
backend-optional telemetry system for coding-agent harness lifecycle metadata. The first plan proves safe
standalone capture; the second adds a protocol-independent local backend and REST synchronization. Neither plan
adds a frontend or cloud deployment. A later cloud plan is outside this series and requires separate
authorization.

| Order | Plan                                                                                  | Locally verifiable outcome                                                                                                                   | Depends on |
| ----: | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
|     1 | [Standalone local CLI](../done/2026-09-21__ferret-init-01-local-cli/README.md) (done) | One per-user SQLite store, 30-day retention, local analytics, and fail-open macOS/Linux POSIX harness capture; Windows CLI-local portability | —          |
|     2 | [Protocol-independent local backend](./ferret-init-02-local-backend/README.md)        | FastAPI/PostgreSQL, OpenAPI REST, durable optional sync, and additive GraphQL/MCP adapter seams                                              | 01         |

### OSE ID initialization series

The original OSE Identity/CIAM idea is split into nine independently reviewable, local-only plans. OSE
ID source code is MIT licensed. Every intermediate state is production-disabled and fail-closed; this
series does not deploy the service.

| Order | Plan                                                                                  | Locally verifiable outcome                                                           | Depends on |
| ----: | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------- |
|     1 | [Foundation](../done/2026-09-17__ose-id-init-01-foundation/README.md) (done)          | Four projects, PostgreSQL, migrations, health/readiness, and an owned local runner   | —          |
|     2 | [Local email account](./ose-id-init-02-local-email-account/README.md)                 | Backend registration, verification, password sign-in/recovery, sessions, and Mailpit | 01         |
|     3 | [Company tenancy core](./ose-id-init-03-company-tenancy-core/README.md)               | Personal/company contexts, memberships, entitlements, invitations, and RLS           | 02         |
|     4 | [OIDC/OAuth provider](./ose-id-init-04-oidc-oauth-provider/README.md)                 | OpenIddict, PKCE, consent contract, audiences/scopes, and context-bound claims       | 03         |
|     5 | [First-party web](./ose-id-init-05-first-party-web/README.md)                         | Identifier-first Next.js/BFF sign-in, recovery, consent, and context UI              | 04         |
|     6 | [Passkeys and MFA](./ose-id-init-06-passkeys-and-mfa/README.md)                       | Passkeys, TOTP, and recovery codes                                                   | 05         |
|     7 | [Google federation](./ose-id-init-07-google-federation/README.md)                     | Google-only upstream login and deterministic fake-provider proof                     | 05         |
|     8 | [Company admin](./ose-id-init-08-company-admin/README.md)                             | Company-scoped member, invitation, and entitlement administration                    | 05         |
|     9 | [Local scale and composition](./ose-id-init-09-local-scale-and-composition/README.md) | No-affinity multi-instance proof and reusable dependent-app stack contract           | 06, 07, 08 |

Plans 06, 07, and 08 are independent siblings after Plan 05. Plan 09 joins them; only after Plan 09
may the blocked [`lms-user`](./lms-user/README.md) plan execute. A future OSE ID deployment
plan is outside this series and must wait for the private infrastructure cluster plan, plus any then-current platform handoff gates.

### AyoKoding Learn Revamp series

The `learn` section of `apps/ayokoding-www` is reworked from a pile of documents into learning paths
with complete, runnable courses, and `learn/legacy` is removed. The work is split into 14 plans. Each
plan is one worktree and one PR, and the plans run **strictly in numeric order**: the next plan starts
only after the previous one is merged, deployed, verified, and cleaned up. The "Depends on" column
names the earlier plans each one builds on directly. Every plan's Phase 0 first runs the deferred
`plan-quality-gate` (at most 2 cycles); plan 01's verdict is recorded in its `delivery.md`.

| Order | Plan                                                                                                | Locally verifiable outcome                                                                          | Depends on  |
| ----: | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------- |
|     2 | [Path model](./ayokoding-learn-revamp-02-path-model/README.md)                                      | Phases, goals, `assumes`, outline marker, prerequisite revision, closure checks, career copy        | 01          |
|     3 | [Catalog and metadata](./ayokoding-learn-revamp-03-catalog-and-metadata/README.md)                  | Course metadata schema and backfill, categories, catalog page, course landing header                | 01          |
|     4 | [Learning experience](./ayokoding-learn-revamp-04-learning-experience/README.md)                    | Browser progress, phase roadmap page, context bar, mark complete (and undo), Learn home             | 02, 03      |
|     5 | [Code harness](./ayokoding-learn-revamp-05-code-harness/README.md)                                  | Go + Cobra `ayokoding-cli`, `run.yaml` contract, runners, Nx target, CI, quality-gate propagation   | —           |
|     6 | [Accounting courses](./ayokoding-learn-revamp-06-accounting-courses/README.md)                      | 24 accounting courses written; both accounting paths restructured in the same PR                    | 02, 03, 05  |
|     7 | [ERP courses](./ayokoding-learn-revamp-07-erp-courses/README.md)                                    | 30 ERP courses written; both ERP paths restructured in the same PR                                  | 06          |
|     8 | [Capstone courses](./ayokoding-learn-revamp-08-capstone-courses/README.md)                          | 8 skeleton capstones rewritten; the AI Engineer path gets its goal                                  | 02, 03, 05  |
|     9 | [Filler rewrites](./ayokoding-learn-revamp-09-filler-rewrites/README.md)                            | 8 templated filler courses rewritten                                                                | 03, 05      |
|    10 | [Legacy unique migration](./ayokoding-learn-revamp-10-legacy-unique-migration/README.md)            | 48 new courses for legacy topics with no equivalent; the legacy-to-course map recorded              | 03, 05      |
|    11 | [Audit: languages and tooling](./ayokoding-learn-revamp-11-audit-languages-and-tooling/README.md)   | 32 language, tooling, and infrastructure courses audited and fixed, every example in the harness    | 03, 05      |
|    12 | [Audit: CS, systems, and data](./ayokoding-learn-revamp-12-audit-cs-systems-and-data/README.md)     | 34 CS, systems, concurrency, distributed, database, and architecture courses audited and fixed      | 05          |
|    13 | [Audit: product, security, and AI](./ayokoding-learn-revamp-13-audit-product-security-ai/README.md) | 45 application, AI, product, interview, and security courses audited and fixed                      | 03, 05      |
|    14 | [Legacy removal](./ayokoding-learn-revamp-14-legacy-removal/README.md)                              | `learn/legacy` deleted, 308 redirects added, `docs/` links repointed, series-completion gate passed | 10 (+11–13) |

The end state is a catalog of 229 courses, none in `status: outline`, each with runnable examples.
Plan 01 is in progress (see
[`../in-progress/ayokoding-learn-revamp-01-navigation-and-display/README.md`](../in-progress/ayokoding-learn-revamp-01-navigation-and-display/README.md));
the remaining plans are planning documents only until the user orders execution.

Three waves emptied this queue:

- **Demoted to two-pagers 2026-08-05** — the Ruff config, the bulk-link concurrency fix, merge-queue
  adoption, the `ayokoding-www` cost reduction, the `reuseExistingServer` audit, the Vitest glob
  guard, the app-shell tap targets, the Vercel steady-state grading, and plan-decision-integrity
  hardening.
- **Demoted to two-pagers 2026-08-21** — the five governance follow-ups filed by
  [`repo-rules-sweep`](../done/2026-08-18__repo-rules-sweep/README.md) and
  [`update-harness-support`](../done/2026-08-20__update-harness-support/README.md):
  [oxlint-upgrade-and-lint-reproducibility](../ideas/q1-urgent-important/oxlint-upgrade-and-lint-reproducibility.md),
  `rhino-governance-tooling-defects` (since resolved and deleted),
  [file-naming-convention-rework](../ideas/q1-urgent-important/file-naming-convention-rework.md),
  `harness-mirror-and-test-isolation-defects` (since rewritten, delivered, and deleted),
  and
  [declare-vite-peer-dependency](../ideas/q2-not-urgent-important/declare-vite-peer-dependency.md).
- **Demoted to two-pagers 2026-09-08** — the three follow-ups
  [`rewrite-rhino-cli-to-fsharp`](../done/2026-08-30__rewrite-rhino-cli-to-fsharp/README.md)'s Phase
  12 Knowledge Capture triage had filed straight into this queue were relocated to `../ideas/`
  rather than retained under a plan-local exception, because Knowledge Capture may not write here —
  see [Instructions](#instructions) below. Two have since been deleted as moot after the in-tree
  Rhino source was retired; the survivor, `remove-stale-compat-min-version-stubs`, was delivered and deleted on
  2026-10-06 (see the [ideas grooming log](../ideas/README.md#grooming-log)).

The `ayokoding-learning-path-*` programme, which once filled this queue, has completed: plans `01`
through `18` are archived in [`../done/`](../done/README.md). `rewrite-rhino-cli-to-fsharp` passed
through here and is now archived alongside them.

## Instructions

**Idea Capture**: For ideas not ready for formal planning, write a two-pager in
[`../ideas/`](../ideas/README.md) — not here.

**Knowledge Capture may never write here.** A plan's Knowledge Capture phase files future work as an
explicitly authorized `../ideas/<slug>.md` two-pager, or records `Reported without plan
authorization`. It may not create, move, or write any file or folder under `backlog/`, and no
instruction to a plan creates an exception — the promotion path below is the only route in. See the
[Knowledge Capture Convention](../../repo-governance/development/quality/knowledge-capture/routing-timing-destination-aware-inline-vs-ideas.md).

**Naming**: Plans in `backlog/` use NO date prefix — just the slug (e.g.,
`doc-command-existence-validation/`). A date prefix is applied only when a plan is archived to
`done/`, where it records the completion date.

When promoting a two-pager to a plan:

1. Create folder: `[project-identifier]/`
2. Add `README.md`, `brd.md`, `prd.md`, `delivery.md`, and either a compact `tech-docs.md` or, for a
   substantial design, `tech-docs/README.md` plus numbered topic documents. Carry the two-pager's
   problem, scope, decisions, and open questions forward.
3. Add the plan to this list
4. Delete the two-pager from `../ideas/` and drop its line from `../ideas/README.md`
