---
description: The [domain]-[type] naming convention and type-suffix vocabulary used for apps under apps/.
when_to_use: Use when naming a new app directory under apps/ and choosing its [type] suffix.
---

# App Naming Types

Apps in `apps/` follow the `[domain]-[type]` naming convention. The following `[type]` suffixes are
used in this repository:

| Type suffix | Meaning                                                           | Example                                        |
| ----------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| `www`       | Public website at the domain root (marketing, portfolio, content) | `ose-www`, `ayokoding-www`, `organiclever-www` |
| `app-web`   | Web client at the `app.*` subdomain (the product application UI)  | `organiclever-app-web`, `ose-app-web`          |
| `be`        | Generic HTTP backend for a product domain                         | `organiclever-be`, `ose-be`                    |
| `cli`       | Command-line tool                                                 | `Rhino`, `crane-cli`                           |
| `e2e`       | End-to-end test suite (Playwright)                                | `ose-www-fe-e2e`, `organiclever-be-e2e`        |

This type vocabulary ensures that the folder name alone communicates the tier and deployment target
without ambiguity.
