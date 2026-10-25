# Learning Progress Behaviours

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: Learning progress stays in the reader's browser. The rewrite keeps
> the current record format and recovery behavior without sending progress to the server.

## Contents

- [Browser progress](./browser-progress.feature) — completion, shared course status, v1 storage,
  blocked and corrupt storage, reset, cross-tab changes, and origin separation. Bindings are planned.

## Planned layer disposition

The TypeScript Unit adapter proves state transitions, validation, and storage-failure handling.
Playwright proves real storage, DOM updates, focus, cross-tab events, and network privacy.
These effects have no separate local resource boundary for a Phoenix Integration adapter;
the scenario-level exemptions record that disposition. Server-rendered progress placeholders
remain covered with the content and shell integration fixtures.
