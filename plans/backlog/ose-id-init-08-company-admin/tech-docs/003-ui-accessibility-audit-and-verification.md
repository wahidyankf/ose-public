# UI, Accessibility, Audit, and Verification

## Selected Information Architecture

The selected roster-and-drawer design starts at Members and provides sibling navigation to Invitations
and Entitlements. The shell always displays the active company. A global company switcher does not live
inside the admin area; switching starts the existing fresh authorization flow and leaves this route.

### Members

Desktop uses a semantic table or roster with caption/header relationships. Mobile converts rows to
labeled cards in the same order. Search/filter stays tenant-local. Selecting a member opens a side drawer
on large screens and a full-width sheet on small screens.

### Invitations

Show invitee address, created/expiry, invited-by allowlisted display, and textual status. Actions include
invite, resend, and revoke with clear consequences. Never display or copy the capability.

### Entitlements

Show registered OSE products and explicit granted/not-granted text per member. Explain that this controls
product entry, not product roles. Unknown/unavailable product entries are non-editable with reason.

## Sensitive Action Pattern

1. Open action from a stable named member/invitation/entitlement context.
2. If recent authentication is absent, redirect through the established reauthentication journey and
   return through an allowlisted server-held path.
3. Show a confirmation naming active company, target, action, and consequence.
4. Submit an idempotency/version token through the BFF.
5. On success, announce status and return focus to the originating row/card or stable heading.
6. On stale/conflict, reload current state and explain that nothing unsafe was changed.

## Accessibility Contract

- One H1 and clear landmarks; active company is programmatically associated with page context.
- All fields/actions have labels, instructions, and visible focus; keyboard order follows visual order.
- Status uses text plus shape/icon/border, never color alone.
- Error summary receives focus and links to affected controls; live status does not steal focus.
- Dialogs/sheets have title, description, cancel/escape, focus trap, and focus return.
- Tables have captions/headers; mobile cards repeat labels rather than relying on column position.
- No cognitive-function test blocks authentication; paste/autofill/password managers remain usable.
- At 200% zoom and 320 CSS px, no action or essential information clips or requires page-level horizontal
  scrolling.

## Audit Projection

The authoritative security audit remains backend-owned. Company admins may see a minimal activity
projection only if required to understand membership/entitlement outcomes. It may include event type,
target display label, actor display label, timestamp, and result for the active company. It never includes
provider claims, IP/device fingerprint, credentials, recovery data, token IDs, other companies, or global
operator events.

## Test Matrix

| Layer       | Required proof                                                                         |
| ----------- | -------------------------------------------------------------------------------------- |
| Unit        | BFF mapping, view models, error/focus/status, responsive component states              |
| Integration | BFF/session-to-unchanged-Plan-03 contracts, CSRF, problem mapping, production guard    |
| E2E         | browser invokes Plan 03 members/invites/entitlements; denial, keyboard/a11y/responsive |
| Manual      | screen reader/keyboard, 375/768/1280, 200% zoom, storage/network/log inspection        |

Every fixture uses synthetic `.test` data and at least Company A and Company B. Tests must prove absence
of Company B data, not merely a successful Company A response.

Every Gherkin scenario maps to Unit, Integration, and E2E adapters. Any boundary-based per-scenario
exemption is explicit, indexed in behavior-coverage configuration, and statically validated. Authored
production code maintains at least 99% Unit line coverage; no ad hoc ignore applies.

## Statelessness

Drawer state may live in the URL or browser presentation state, but authority, recent-auth state,
idempotency, membership version, invitations, entitlements, and audit cannot live in one web/backend
instance. Plan 09 later proves multi-instance handoff for these operations.
