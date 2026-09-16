# OSE ID Web — Architecture

The current, as-built system. A change that alters an actor, a container, a component
responsibility, a relationship, or a boundary updates this document in the same delivery unit.

## Scope

`ose-id-web` is a deliberately inert status shell. It renders one local page that tells a developer
whether the identity backend, its database, and its schema are ready, and it says plainly that
identity features are disabled. It is not a sign-in surface and holds nothing that a sign-in surface
would need.

There is no sign-in form, no browser token store, no identity cookie, no session, and no
backend-for-frontend protocol behaviour. Those absences are the design: a shell that cannot
authenticate anyone cannot leak a credential while the real identity work is still being built.

## In This Architecture

- [Runtime guard and status reporting](./architecture/runtime-guard-and-status-reporting.md) — the
  startup mode guard, how the shell obtains a status, and what it is allowed to show.

## System Context

```mermaid
flowchart LR
  accTitle: OSE ID web system context
  accDescr: A local developer opens the ose-id-web status shell in a browser, and the shell reads the backend readiness route from its own server side.
  DEV["Local developer"] --> WEB["ose-id-web<br/>status shell"]
  WEB --> BE["ose-id-be<br/>readiness route"]

  classDef actor fill:#808080,stroke:#000000,color:#000000,stroke-width:2px
  classDef app fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef dep fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  class DEV actor
  class WEB app
  class BE dep
```

The browser talks only to `ose-id-web`. The readiness read happens on the shell's own server side, so
no browser request ever reaches `ose-id-be` and no backend origin is exposed to the page.

## Containers

| Container    | Technology             | Port | Persistence |
| ------------ | ---------------------- | ---- | ----------- |
| `ose-id-web` | Next.js and TypeScript | 3500 | none        |

Port 3500 is a fixed reservation in
[`docs/reference/web-sites.md`](../../../../docs/reference/web-sites.md). The process is stateless in
the same sense the backend is: it stores nothing on disk, keeps no session, and holds no value whose
loss on restart would change what a reader is told.

## Components

```mermaid
flowchart TD
  accTitle: OSE ID web status shell components
  accDescr: The status page route composes a service status panel of readiness rows and uses a server-side backend health adapter that runs behind the configuration and mode guard.
  PAGE["Status page route"] --> PANEL["ServiceStatusPanel"]
  PANEL --> ROW["ReadinessRow"]
  PAGE --> ADAPTER["Backend health<br/>adapter, server"]
  ADAPTER --> GUARD["Config and mode<br/>guard"]

  classDef route fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef ui fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  classDef infra fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
  class PAGE route
  class PANEL,ROW ui
  class ADAPTER,GUARD infra
```

| Component              | Responsibility                                                    |
| ---------------------- | ----------------------------------------------------------------- |
| Status page route      | Serving the one page at `/` and nothing else                      |
| `ServiceStatusPanel`   | Naming the status region and composing its rows                   |
| `ReadinessRow`         | Presenting one component's state as text, never as colour alone   |
| Backend health adapter | Reading backend readiness on the server and sanitizing the result |
| Config and mode guard  | Refusing to start outside Local and Test                          |

`ServiceStatusPanel` and `ReadinessRow` stay local to this app. They reuse the shared `Card`,
`Alert`, `Badge`, and token primitives from `libs/web-ui`, and are promoted to a shared library only
when a second real consumer exists — a component with one caller is a guess about the second.

## Constraints

**Status is text.** Every component state is readable as words, so a screen reader and a
monochrome display convey the same thing a colour does. The status region is named and announces
politely on refresh without stealing focus.

**No identity surface.** The page renders no form, no provider link, no company control, and no
session cookie. A control that could start an authentication flow does not belong here until a plan
that owns authentication adds it.

**Nothing infrastructural is shown.** A failed read produces a sanitized page, never a stack trace, a
backend host, a connection detail, a machine path, or a secret.

**Local and Test only.** The same startup invariant the backend applies applies here, enforced
independently in this process rather than inherited from the backend's answer.

## Related

- [Behaviours](./behaviours/README.md) — the scenarios this shell must satisfy.
- [OSE ID BE](../id-be/architecture.md) — the sibling corpus for the backend whose readiness it
  reads.
