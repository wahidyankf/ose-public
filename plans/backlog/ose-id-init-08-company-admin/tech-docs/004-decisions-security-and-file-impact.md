# 004 — Decisions, Security, and File Impact

## Decisions

| ID    | Decision                               | Rejected alternative                               | Revisit trigger                                      |
| ----- | -------------------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| CA-01 | `/admin/company` stays in `ose-id-web` | fifth deployable; platform console                 | a distinct authorized trust/operator boundary exists |
| CA-02 | Plan 08 is BFF/UI only                 | duplicating Plan 03 domain/API/schema/RLS          | never within this plan                               |
| CA-03 | roster/detail is selected              | task tabs; dashboard-first                         | tested usability evidence favors runner-up           |
| CA-04 | render authoritative API outcomes      | client/BFF predicts last-admin or invitation rules | never                                                |
| CA-05 | local Mailpit inspection only          | production email or browser capability handling    | separate deploy/email plan                           |

## Security Boundary

The Plan 05 server session is the sole BFF call context. Plan 03 remains authoritative for company
resolution, membership/admin authority, invitation state, entitlement state, concurrency, audit,
persistence, and RLS. The BFF allowlists fields, rejects/ignores client authority hints, applies existing
CSRF/origin rules, and maps unknown upstream statuses to a generic error. It never returns raw invitation
capabilities, provider subjects, credentials, recovery/device/IP data, global audit, other companies, or
product roles. No browser/process-local cache may become correctness or authorization state.

## File-Impact Analysis

```text
.
├── apps/
│   ├── ose-id-web/
│   │   ├── project.json [E]
│   │   └── src/
│   │       ├── app/(company-admin)/admin/company/ [N]
│   │       └── features/company-admin/
│   │           ├── api/ [N]
│   │           ├── components/ [N]
│   │           └── models/ [N]
│   └── ose-id-web-e2e/
│       ├── project.json [E]
│       └── src/company-admin/ [N]
├── plans/in-progress/ose-id-init-08-company-admin/ [E]
└── specs/apps/ose/id-web/
    ├── behaviours/company-admin/company-admin.feature [N]
    └── contracts/company-admin.openapi.yaml [N]
```

Phase 0 resolves Plan 05 naming and amends these proposed `[N]` paths before RED if needed. The boundary
may become narrower, not expand into backend ownership. Existing Plan 05 generated clients and
`libs/web-ui` are read-only inputs: unchanged OpenAPI does not justify regenerated output, and a missing
shared primitive stops execution for an explicit plan amendment instead of creating an unbounded path.
Explicitly forbidden: changes under
`apps/ose-id-be`, `apps/ose-id-be-e2e`, or `specs/apps/ose/id-be`; OpenAPI operation changes; domain
aggregates/commands/queries; persistence mapping; migrations; RLS; notification/capability rules.

## Licensing, Deployment, and Recovery

OSE-authored source/docs inherit root MIT; dependencies and assets retain their own licenses. No
Kubernetes, deployment workflow, production config/mail, DNS, cloud secret, or operator network belongs
here. A future deploy plan is blocked at minimum on ose-private
`plans/backlog/start-infra-04-deploy-tencent-lighthouse-k3s-cluster` plus then-current handoff gates.

Rollback disables the guarded web routes/adapters; it does not change Plan 03 data or security behavior.
There is no schema down-migration because this plan creates no migration.

## Evidence Confidence

- **[Repo-grounded]** Archived Plans 03/05 and delivered code/API are authoritative; Phase 0 resolves
  their moved paths.
- **[Web-cited, official, accessed 2026-09-15]** W3C
  [dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) requires focus to move inside
  an open dialog and return after close; this binds confirmation tests.
- **[Web-cited, official, accessed 2026-09-15]** W3C
  [table guidance](https://www.w3.org/WAI/tutorials/tables/) requires programmatic header/data-cell
  relationships; this binds the desktop roster.
- **[Judgment call]** Roster/detail remains selected pending execution-time tester evidence.
