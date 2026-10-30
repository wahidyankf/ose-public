# OrganicLever local-stack scaffold

This folder holds an early Compose scaffold for a future full
OrganicLever stack. It is **not** the supported way to get started today: the
current OrganicLever app is local-first, and its active backend is the F#
service in [apps/organiclever-be/](../../../apps/organiclever-be/). 🧪

## Start in the supported place

- To explore the product quickly, follow
  [the OrganicLever web README](../../../apps/organiclever-app-web/README.md).
  It runs without a backend for its primary local-first experience.
- To work on the backend, use
  [the OrganicLever backend README](../../../apps/organiclever-be/README.md).
  That guide owns the current dependency and test setup.
- For the wider workspace setup, begin with the
  [OSE getting-started tutorial](../../../docs/tutorials/getting-started-with-ose-public.md).

macOS and Ubuntu Linux are the supported local-development paths. Windows may
work through WSL2, but it is not yet a verified route for this scaffold.

## Why this folder is not an onboarding command

The Compose files retain an earlier Rust-container shape and mount paths that
do not match the current F# backend application. Running them would give a new
reader a misleading picture of the active product architecture.

Keep this directory as an implementation boundary for a future, intentionally
validated stack. Do not add credentials or production settings here. When the
stack becomes supported, replace this status with an end-to-end quick-start
that verifies the running services and links to the relevant specifications.

## Related references

- [OrganicLever web app](../../../apps/organiclever-app-web/README.md)
- [OrganicLever backend](../../../apps/organiclever-be/README.md)
- [OrganicLever specifications](../../../specs/apps/organiclever/README.md)
