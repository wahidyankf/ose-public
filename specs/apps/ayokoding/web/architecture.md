# AyoKoding Phoenix Web — Architecture Status

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: The Phoenix rewrite is planned, but no Phoenix application has been
> built in this authoring change. This document records the current implementation boundary so
> readers can distinguish accepted behavior from architecture that still needs implementation.

## Current implemented boundary

`apps/ayokoding-web` does not yet exist. There is no implemented Phoenix endpoint, LiveView,
Elixir content adapter, browser hook, or rewrite test runner to describe as built.

The working educational site is still
[`apps/ayokoding-www`](../../../../apps/ayokoding-www/README.md), with its implemented
[architecture](../www/architecture.md) and [behavior corpus](../www/behaviours/README.md).
Its Markdown, manifests, and public assets remain in their current locations. The planned rewrite
does not claim ownership of those source files or stop existing content work.

## Proposed design location

The [rewrite plan](../../../../plans/in-progress/ayokoding-app-web/README.md) carries proposed
Phoenix components, interfaces, dependency choices, diagrams, local commands, and recovery steps.
They are proposed design, not current architecture. The [behaviors](./behaviours/README.md) in
this corpus are the accepted outcomes that implementation must prove.

## Update obligation during implementation

In the same delivery unit that introduces a working component, replace the corresponding absence
statement with evidence from its actual source and configuration. Describe its system boundary,
runtime containers, and internal components with accessible C4 diagrams, which show a system
from its surrounding users down to its internal parts. Record actual module responsibilities,
shared-source paths, LiveView and browser-only state boundaries, test ownership, and local ports.

Keep future components in the plan until they exist. Do not describe deployment architecture in
this corpus while deployment remains outside the rewrite's scope.

## Related

- [Owner index](./README.md) — status, scope, and planned proof ownership.
- [Current site architecture](../www/architecture.md) — implemented reference system.
