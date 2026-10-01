---
description: The ose/<repo>/<app>/<env>/<secret> naming rule for every item this repository creates, reads, or names in an approved secret manager (currently Bitwarden), the global owner segment, its scope boundary, and why the rule is unenforced.
when_to_use: Use when naming a new secret-manager item, or when a plan, script, or document refers to one.
---

# Secret-Manager Item Naming

A secret manager holds items for repositories beyond this one, so every item name states which
repository owns it. The rule binds whichever secret manager is approved; today that is Bitwarden,
used through the `bw` CLI.

## Rule

Name every secret-manager item that an active tracked file in this repository creates, reads, or
refers to as:

```text
ose/<repo>/<app>/<env>/<secret>
```

| Segment    | Value                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ose`      | Fixed namespace label for this project. It names no repository and implies no parent repository.                                                       |
| `<repo>`   | The owning repository's name (`ose-public` for an item this repository owns), or `global` for an item every repository naming items under `ose/` uses. |
| `<app>`    | The application or tool the item serves, such as `ose-app` for `ose-app-be` and `ose-app-web`.                                                         |
| `<env>`    | The deployment environment, such as `staging`.                                                                                                         |
| `<secret>` | What the item holds, such as `cosign-password`.                                                                                                        |

Every segment is lowercase kebab-case. Example: `ose/ose-public/ose-app/staging/cosign-password`.

**Active** means any tracked file outside `generated-reports/` and `plans/done/`.

## Scope Boundary

The rule covers items stored in a secret manager's vault only. It does not rename the places a value
is copied to, which keep their own rules:

- environment variables and `.env*` keys follow the
  [Environment Variable Naming Standard](./environment-variable-naming-standard.md), which forbids a
  tier in the name;
- GitHub Actions secrets and variables follow the
  [GitHub Environment Key Registry](./github-environment-key-registry.md).

Adopting another secret manager keeps this rule only if its item names accept `/`; otherwise the
adoption amends this standard first.

## Pass and Violation

- **Follows:** every secret-manager item name in an active tracked file has exactly five
  `/`-separated lowercase kebab-case segments, the first is `ose`, and the second is a repository
  name or `global`.
- **Violates:** an active tracked file creates, reads, or names an item without that shape, such as
  `ose-app-staging/cosign-password`, which carries neither the namespace nor the owner.

## Enforcement

**Unenforced by decision.** Item names appear in prose and in human-run secret-manager commands
such as `bw`, and no machine-readable registry lists them. A pattern search over free text cannot
tell an item name from a filesystem path such as `/etc/<app>/`, so an empty result would be a false
zero. The first script that resolves items by exact name is where a mechanical check belongs.

## Related Documents

- [Secrets and Environment-Variable Standards](../secrets-and-env-standards.md) — the hub this
  standard belongs to.
- [Secret-Surface Census](./secret-surface-census.md) — every secret-bearing surface.
