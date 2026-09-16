# Backlog Plans

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
plan is outside this series and must wait for the Kubernetes foundation in the private sibling, beginning with
`start-infra-04-deploy-tencent-lighthouse-k3s-cluster`, plus any then-current platform handoff gates.

Three waves emptied this queue:

- **Demoted to two-pagers 2026-08-05** — the Ruff config, the bulk-link concurrency fix, merge-queue
  adoption, the `ayokoding-www` cost reduction, the `reuseExistingServer` audit, the Vitest glob
  guard, the app-shell tap targets, the Vercel steady-state grading, and plan-decision-integrity
  hardening.
- **Demoted to two-pagers 2026-08-21** — the five governance follow-ups filed by
  [`repo-rules-sweep`](../done/2026-08-18__repo-rules-sweep/README.md) and
  [`update-harness-support`](../done/2026-08-20__update-harness-support/README.md):
  [oxlint-upgrade-and-lint-reproducibility](../ideas/q1-urgent-important/oxlint-upgrade-and-lint-reproducibility.md),
  [rhino-cli-governance-tooling-defects](../ideas/q1-urgent-important/rhino-cli-governance-tooling-defects.md),
  [file-naming-convention-rework](../ideas/q1-urgent-important/file-naming-convention-rework.md),
  [harness-mirror-and-test-isolation-defects](../ideas/q1-urgent-important/harness-mirror-and-test-isolation-defects.md),
  and
  [declare-vite-peer-dependency](../ideas/q2-not-urgent-important/declare-vite-peer-dependency.md).
- **Demoted to two-pagers 2026-09-08** — the three follow-ups
  [`rewrite-rhino-cli-to-fsharp`](../done/2026-08-30__rewrite-rhino-cli-to-fsharp/README.md)'s Phase
  12 Knowledge Capture triage had filed straight into this queue:
  [remove-stale-compat-min-version-stubs](../ideas/q1-urgent-important/remove-stale-compat-min-version-stubs.md),
  [remove-dead-shadow-diff-script](../ideas/q2-not-urgent-important/remove-dead-shadow-diff-script.md),
  and
  [rhino-bin-resolver-shim-coverage](../ideas/q2-not-urgent-important/rhino-bin-resolver-shim-coverage.md).
  Knowledge Capture may not write here — see [Instructions](#instructions) below — so the three were
  relocated to `../ideas/` rather than retained under a plan-local exception.

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
