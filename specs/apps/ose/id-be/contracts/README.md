# OSE ID BE — API Contract

Audience: engineers and technical product managers who need to know exactly what the OSE ID backend
answers over HTTP before any identity feature is built.

OpenAPI 3.1 is the machine-readable source of truth for this service. Prose and Gherkin describe why
a response looks the way it does; this contract fixes the shape a caller can depend on.

## Contents

- [openapi.yaml](./openapi.yaml) — the whole published surface: two health probes and five
  registered identity routes that permanently fail closed.

## What the Contract Currently Covers

The service is identity-inert. It publishes liveness, readiness, and nothing a caller can sign in
with. The five identity routes exist only so that an unbuilt capability answers one stable way
instead of leaking a hint about what is coming.

| Method | Path                         | Answer                                                   |
| ------ | ---------------------------- | -------------------------------------------------------- |
| GET    | `/health/live`               | `200` — the process answers, without asking the database |
| GET    | `/health/ready`              | `200` when usable, `503` with an allowlisted reason      |
| GET    | `/connect/authorize`         | `404 capability_disabled`                                |
| POST   | `/connect/token`             | `404 capability_disabled`                                |
| GET    | `/external/google/challenge` | `404 capability_disabled`                                |
| POST   | `/scim/v2/Users`             | `404 capability_disabled`                                |
| GET    | `/platform/admin/companies`  | `404 capability_disabled`                                |

Only these exact method and path pairs are matched. Any other request, including a different method
on one of these paths, gets the framework's ordinary not-found behaviour with no capability code.

## Validating a Change

```bash
npm exec redocly -- lint specs/apps/ose/id-be/contracts/openapi.yaml
```

Two warning families are expected and intentional: the health probes declare no `4XX` because a
running process has no client-error case, and the disabled routes declare no `2XX` because success is
exactly what they must never produce.

## Related

- [OSE ID BE corpus](../README.md) — the owner index this contract belongs to.
- [Foundation behaviours](../behaviours/foundation/README.md) — the Gherkin these operations answer to.
- [OSE BE contract](../../be/contracts/README.md) — the sibling backend contract this one mirrors.
- [generated](./generated/README.md) — the gitignored bundle output this contract's `bundle`/`docs`
  targets produce.
