---
description: How a declared .env.example key is injected into each running surface across GitHub Actions, Vercel, and the backend container path — introduction and source-of-truth rule.
when_to_use: Use when you need the entry point for how an app-runtime env key gets from .env.example into a real deployed environment.
---

# Tiered Injection Standard

The declaration standards (naming convention, template layout, annotation format, and the
`environment` drift guard) standardize how an app **declares** its env vars locally. This
document closes the remaining gap: how a declared key is **injected** into each running surface across
GitHub Actions, Vercel, and the backend container path at each deploy stage.

## Source of truth

`apps/<app>/.env.example` is the canonical key set for every app-runtime variable. Every injection
target (GitHub Environment, Vercel project, backend container secret) uses the **same key names**. The rule that
a tier qualifier never appears in a key (`DATABASE_URL`, not `PROD_DATABASE_URL`) is what
makes one key set serve all three stages. The stage is encoded by **which injection target** holds
the value, never by the key name.
