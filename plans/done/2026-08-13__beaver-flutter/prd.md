# Product Requirements Document — BeaverNest Flutter Web Client

## Product Overview

`beavernest-app` is a Flutter Web client served by the combined BeaverNest runtime. It requests
relative `/api` routes from the current origin. Its responsive Web interface is deliberately
mobile-first and its Dart structure separates platform-neutral UI/domain code from Web adapters, so a
later Android/macOS plan can add native edges without redesigning the status experience.

The current private HTTP runtime may offer a browser-specific install-as-app action on supported
phones. It is not described as a PWA: there is no production secure context, service worker, offline
promise, or immediate automatic-reload update. The Install entry explains that boundary plainly.

## Personas

| Persona                  | Context                                             | Need                                                        |
| ------------------------ | --------------------------------------------------- | ----------------------------------------------------------- |
| Browser user             | Opens the private Web endpoint at any viewport      | Immediate, understandable Foundation status.                |
| Operator                 | Uses the status screen when a workspace is degraded | Retry and a safe live support snapshot.                     |
| Future native maintainer | Starts a later Android/macOS plan                   | Responsive widgets and no browser assumptions in core code. |

## User Stories and Acceptance Criteria

### US1 — Use the responsive status-first workspace

**As a** trusted workspace user, **I want** the Foundation status to work at phone, tablet, and
desktop browser widths, **so that** the same Web experience remains usable now and structurally ready
for a later native-client plan.

```gherkin
Feature: Responsive Flutter Web workspace

  Scenario: Web opens the same-origin workspace
    Given the combined BeaverNest runtime is ready
    When I open the Flutter Web root route
    Then the Foundation status shell is visible before readiness resolves
    And the client requests the relative "/api/v1/readiness" route
    And the status reports Application Available, Database Ready and Schema Current

  Scenario: Status reflows across browser widths
    Given the Flutter Web workspace is ready
    When I view status at mobile, tablet, and desktop widths
    Then every readiness component is visible without horizontal scrolling
```

### US2 — Recover readiness in place

**As a** workspace user, **I want** to retry a failed readiness request in place,
**so that** a recovered service does not require a page reload.

```gherkin
Feature: In-place readiness recovery

  Scenario: Status refresh recovers without navigation
    Given the same-origin endpoint initially reports unavailable
    When it recovers and I activate Refresh status
    Then the status changes to Ready with a polite announcement
```

### US3 — Inspect safe live diagnostics

**As an** operator, **I want** a constrained support snapshot,
**so that** I can assess a workspace without learning server internals.

```gherkin
Feature: Safe operational diagnostics

  Scenario: Client presents a safe support snapshot
    Given the combined endpoint returns the diagnostics snapshot
    When I open Diagnostics
    Then only its contracted safe fields are visible

  Scenario: Ready service returns a closed safe snapshot
    Given BeaverNest accepts requests with current migrations
    When I send GET "/api/v1/diagnostics"
    Then the response is 200 with only status, version, uptimeSeconds, serverTimeUtc, and readiness components

  Scenario: Unready service returns a closed unavailable snapshot
    Given BeaverNest cannot complete its readiness probe
    When I send GET "/api/v1/diagnostics"
    Then the response is 503 with Cache-Control no-store and no internal cause
```

### US4 — Install where the browser permits

**As a** phone browser user, **I want** clear installation guidance,
**so that** I can use an available browser install-as-app action without being promised unsupported
offline or auto-update behavior.

```gherkin
Feature: Honest browser installation guidance

  Scenario: Browser shortcut guidance is honest and accessible
    Given I open Help in the Flutter Web workspace
    When I open browser shortcut guidance
    Then it states browser availability and an internet connection is required
    And Escape closes it and returns focus to Help
```

### US5 — Receive a fresh deployment on normal navigation

**As a** trusted workspace user, **I want** a normal navigation to use a coherent new Web deployment,
**so that** an application/backend release does not leave me on a stale bundle.

```gherkin
Feature: Flutter Web deployment cache policy

  Scenario: Normal navigation receives a fresh hosted Flutter bundle
    Given version one of the F# hosted Flutter bundle has been loaded
    When version two is deployed and I navigate normally
    Then the browser loads a coherent version two bundle without a service worker
```

## UI Design Funnel

### R5 grounding and R7 prior art

[Repo-grounded] The existing `libs/web-ui` primitives and BeaverNest shell establish card, button,
icon, and semantic readiness affordances. Flutter cannot reuse those React components, so the plan
defines net-new Dart widgets: `StatusDashboard`, `ReadinessSummary`, `DiagnosticsScreen`, and
`SupportSnapshotCard`.

[Web-cited] Flutter documents that `flutter build web` "populates a `build/web` directory" and
that browser integration testing launches Chrome through `flutter drive`; its integration-testing
guide explicitly runs `flutter drive ... -d chrome` from the project root. Sources:
[Flutter Web build](https://docs.flutter.dev/platform-integration/web/building) and
[Flutter integration testing](https://docs.flutter.dev/testing/integration-tests), both accessed
2026-08-12.

### Diverge — low-fidelity alternatives

#### Option A — Focused Status Dashboard

```text
Phone (< 768 px)                       Desktop (>= 1024 px)
┌──────────────────────────────┐      ┌──────────────┬───────────────────┐
│ BeaverNest                    │      │ Status       │ Active context    │
│ Foundation status              │      │ Diagnostics  │ Foundation status │
│ [ Ready ]                      │      │              │ [ Ready ]         │
│ Application  Available         │      │              │ App | DB | Schema │
│ Database     Ready             │      │              │ Refresh · details │
│ Schema       Current           │      └──────────────┴───────────────────┘
│ Refresh status · Diagnostics   │
└──────────────────────────────┘
```

Phone is a single-column status-first flow. Tablet (`md`, >=768 px) places diagnostics metadata
beside the readiness summary. Desktop (`lg`, >=1024 px) adds a persistent secondary navigation
rail without changing the status task.

#### Option B — Operations Console

```text
Phone (< 768 px)                       Desktop (>= 1024 px)
┌──────────────────────────────┐      ┌───────────────────────────────────┐
│ BeaverNest                    │      │ Foundation: Ready · Diagnostics   │
│ Foundation: Ready             │      │ readiness summary | snapshot      │
│ Support snapshot              │      │ [Refresh]                         │
│ Diagnostics                   │      └───────────────────────────────────┘
└──────────────────────────────┘
```

Phone uses equal Status/Diagnostics destinations; tablet and desktop expose the support snapshot
beside the status card.

#### Diagnostics A — compact safe snapshot

```text
Mobile (< 768 px)                 Tablet (768–1023 px)        Desktop (>= 1024 px)
┌─────────────────────┐           ┌─────────┬───────────┐     ┌──────┬───────────────┐
│ Diagnostics          │           │ version │ uptime    │     │ rail │ version uptime│
│ version · uptime     │           │ UTC     │ readiness │     │      │ UTC readiness │
│ UTC · readiness      │           │ retry   │ unavailable│    │      │ retry         │
│ Retry diagnostics    │           └─────────┴───────────┘     └──────┴───────────────┘
│ unavailable, no cause│
└─────────────────────┘
```

#### Diagnostics B — status banner and details

```text
Mobile (< 768 px)                 Tablet (768–1023 px)        Desktop (>= 1024 px)
┌─────────────────────┐           ┌───────────────────────┐  ┌────────────────────────┐
│ Diagnostics          │           │ ready / unavailable   │  │ ready / unavailable    │
│ status banner        │           │ version · uptime      │  │ version | uptime | UTC │
│ version · uptime     │           │ UTC · readiness       │  │ readiness · retry      │
│ UTC · readiness      │           └───────────────────────┘  └────────────────────────┘
└─────────────────────┘
```

#### Browser shortcut A — contextual guidance

```text
Mobile (< 768 px)                 Tablet (768–1023 px)        Desktop (>= 1024 px)
┌─────────────────────┐           ┌───────────────────────┐  ┌────────────────────────┐
│ bottom sheet         │           │ side panel            │  │ modal                  │
│ Browser shortcut     │           │ Browser shortcut      │  │ Browser shortcut       │
│ browser-dependent    │           │ connection required   │  │ close / Escape returns │
│ online only · Close  │           │ Close                 │  │ focus to Help          │
└─────────────────────┘           └───────────────────────┘  └────────────────────────┘
```

#### Browser shortcut B — dedicated help card

```text
Mobile (< 768 px)                 Tablet (768–1023 px)        Desktop (>= 1024 px)
┌─────────────────────┐           ┌───────────────────────┐  ┌────────────────────────┐
│ Help                 │           │ Help                  │  │ Help                   │
│ 1 menu, 2 if offered │           │ numbered steps        │  │ numbered steps         │
│ 3 confirm            │           │ browser varies        │  │ browser varies         │
│ connection required  │           │ connection required   │  │ connection required    │
└─────────────────────┘           └───────────────────────┘  └────────────────────────┘
```

### Narrow — high-fidelity finalists

#### Status workspace

![Option A — Focused Status Dashboard; reference composition, with mobile-first reflow retained](./assets/status-dashboard.excalidraw.png)

![Option B — Operations Console; reference composition, with mobile-first reflow retained](./assets/operations-console.excalidraw.png)

#### Diagnostics workspace

![Diagnostics A — a compact safe support snapshot beside the status summary, with stacked mobile-browser reflow](./assets/diagnostics-screen-a.excalidraw.png)

![Diagnostics B — a recent-check timeline and safe support snapshot, with stacked mobile-browser reflow](./assets/diagnostics-screen-b.excalidraw.png)

#### Browser shortcut guidance

![Install guidance A — contextual browser-shortcut help without a PWA or offline claim](./assets/install-guidance-a.excalidraw.png)

![Install guidance B — dedicated browser-shortcut instructions with connection and browser-availability caveats](./assets/install-guidance-b.excalidraw.png)

### Select and justify

**Selected: Option A — Focused Status Dashboard.**

| Candidate | Decision | Rationale                                                                                                              |
| --------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Option A  | Selected | Preserves the current readiness-first job at every width, while diagnostics remains discoverable rather than dominant. |
| Option B  | Dropped  | Makes operational detail too visually primary on small screens and weakens the primary status task.                    |

| Diagnostics candidate | Decision | Rationale                                                                                                    |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| Diagnostics A         | Selected | Keeps the complete contracted field allow-list scannable and presents unavailable without inventing a cause. |
| Diagnostics B         | Dropped  | The banner competes with the Foundation status and makes the safe payload harder to compare.                 |

| Shortcut candidate | Decision | Rationale                                                                                      |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------- |
| Browser shortcut A | Dropped  | A contextual panel can be missed after dismissal and needs more focus-management complexity.   |
| Browser shortcut B | Selected | A dedicated Help card gives browser-dependent, online-only guidance a stable, reviewable home. |

Responsive strategy: mobile starts with a single-column status card; tablet groups related status
and support details without clipping; desktop adds a rail. Widgets use flexible constraints, semantic
labels, text plus icons plus color, and polite live state updates. Flutter widgets are primary
adapters: they invoke the `LoadReadiness`, `RefreshReadiness`, and `LoadDiagnostics` input use
cases. Those use cases receive fakeable `ReadinessRepository` and `DiagnosticsRepository` output
ports at composition. The core widgets and use cases must not import `dart:html`, browser storage,
HTTP clients, or generated transport types; the current Web adapter owns those concerns and maps
transport responses to pure domain models.

The selected diagnostics treatment is the compact snapshot in Diagnostics A: it keeps safe support
data scannable without duplicating the main readiness task. The selected installation treatment is
Install guidance B: a dedicated help card can state the browser-specific and online-only caveats
before describing any available shortcut action. The browser chrome shown in the reference images is
illustrative only; it does not assert HTTPS, PWA capability, a platform target, or an application
installation guarantee.

The implementation maps the surveyed readiness affordances to the net-new
`lib/presentation/theme/beavernest_theme.dart` `BeaverNestThemeExtension`: semantic `ready`,
`unavailable`, `focus`, `surface`, and `onSurface` tokens drive status cards, focus outlines, and
state announcements. It does not copy React/CSS implementation code from `libs/web-ui`. Widget and
browser proof must verify WCAG-AA text contrast, a visible keyboard focus order, 44 px minimum
pointer targets, semantic labels, polite readiness announcements, and that shortcut guidance traps
focus while open, returns focus to Help on close, and closes on Escape.

## Product Scope

The Web client has no external profile editor, CORS mode, persisted diagnostic history, or native
configuration. The new diagnostics endpoint is a live safe view, not a persistence feature. The
planned lightweight hexagonal structure is an architectural constraint, not a delivery promise for a
native target: only readiness and diagnostics are ports in this slice, and a browser-shortcut port is
not introduced without a real second implementation. The Install entry is progressive enhancement
only; a later HTTPS/PWA plan owns manifest, service worker, offline caching, and immediate auto-update.
Execution begins only after the private-sibling `restrict-env-access-to-prod-and-stag` plan meets the
technical design's semantic-completion predicate and its public implementation is merged. Flutter does not expose tier-file
configuration to users: it preserves the backend runtime's `APP_ENV` contract while retiring only
the legacy Vite guard and its frontend-specific spec identity.
