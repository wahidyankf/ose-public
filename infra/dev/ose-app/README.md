# OSE Application local-stack scaffold

This folder contains an early Compose scaffold for a future paired OSE
Application stack. It is **not** the supported onboarding route today: the
active API is the F# service in [apps/ose-be/](../../../apps/ose-be/), and the
active web client is in [apps/ose-app-web/](../../../apps/ose-app-web/). 🧪

## Start in the supported place

- To see the web client, follow
  [the OSE Application web README](../../../apps/ose-app-web/README.md).
- To develop the API or its local dependencies, follow
  [the OSE Application backend README](../../../apps/ose-be/README.md).
- For workspace setup and the first local success, use the
  [OSE getting-started tutorial](../../../docs/tutorials/getting-started-with-ose-public.md).

macOS and Ubuntu Linux are the supported local-development paths. Windows may
work through WSL2, but it is not yet a verified route for this scaffold.

## Why this folder is not an onboarding command

The Compose files retain a Rust-container shape and application paths that no
longer match the active F# backend. They also describe an exploratory,
AI-assisted path whose local credentials must never be committed. Running this
scaffold would not be a reliable way for a new reader to learn or verify the
current product.

Keep this directory as a clear boundary for future work. Before it is promoted
to a supported local stack, it needs an explicit owner, aligned application
paths, a secret-safe configuration guide, and a fresh-checkout verification.

## Related references

- [OSE Application web](../../../apps/ose-app-web/README.md)
- [OSE Application backend](../../../apps/ose-be/README.md)
- [OSE Application specifications](../../../specs/apps/ose/README.md)
