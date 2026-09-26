---
description: "The one-way dependency rule - shell/ may import core/, core/ must never import shell/ - and the forbidden-imports list that enforces it."
when_to_use: "Use when checking whether a core/ file has accidentally imported React, Next.js, or another effectful dependency."
---

# The Dependency Rule

```mermaid
flowchart LR
    accTitle: The Dependency Rule
    accDescr: shell/ leads to core/ via may import; core/ leads to shell/ via must not import.
    SH["shell/"] -->|may import| CO["core/"]
    CO -.->|must not import| SH
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

`core/` MUST NOT import any of: `react`, `react-dom`, `next`, `next/*`, node builtins (`fs`, `path`, `node:*`),
`@trpc/server` router/init wiring, any HTTP/DB/`fetch` client, or browser globals — not even as types. If a file under
`core/` needs one of those, it belongs in `shell/`. `core/` may import other `core/` modules (pure to pure). `shell/`
may freely import its own and sibling `core/`.

## Forbidden imports

| Zone     | Forbidden                                                                                  |
| -------- | ------------------------------------------------------------------------------------------ |
| `core/`  | `react`, `react-dom`, `next`, `next/*`, `fs`/`path`/`node:*`, `@trpc/server`, `fetch`/HTTP |
| `shell/` | Business decisions that belong in the core (extract pure logic to `core/` and call it)     |

Verify core purity with:

```bash
rg -n "from ['\"](react|react-dom|next|node:|fs|path|@trpc/server)" apps/<app>/src/features/*/core
```

This must return nothing.
