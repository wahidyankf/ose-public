---
title: Production Dependency Compatibility with FSL-1.1-MIT
description: Audit of all production dependency licenses for compatibility with FSL-1.1-MIT, including LGPL elimination and MPL-2.0 analysis
category: explanation
tags:
  - licensing
  - compliance
  - fsl
  - dependency-audit
created: 2026-04-04
updated: 2026-04-04
---

# Production Dependency Compatibility with FSL-1.1-MIT

Audit of all production (non-demo) application dependencies for license compatibility with the
project's FSL-1.1-MIT license.

## Audit Methodology

- **Date**: 2026-04-04
- **Scope**: All production apps (~10 projects across npm, Go, .NET, and Elixir ecosystems)
- **Exclusion**: Demo apps (`a-demo-*`) are reference implementations only and do not ship as
  products — their dependency licenses are excluded from this audit
- **Tools**: `npm ls`, `go list -m all`, `dotnet list package`, `mix deps`

## Production Dependency License Summary

| App               | Ecosystem | Result                                        |
| ----------------- | --------- | --------------------------------------------- |
| `ayokoding-web`   | npm       | All permissive after LGPL removal (see below) |
| `oseplatform-web` | npm       | All permissive after LGPL removal (see below) |
| `organiclever-fe` | npm       | All permissive after LGPL removal (see below) |
| `organiclever-be` | .NET/F#   | All permissive (MIT, Apache-2.0, PostgreSQL)  |
| `rhino-cli`       | Go        | MPL-2.0 indirect (see below)                  |
| `ayokoding-cli`   | Go        | MPL-2.0 indirect (see below)                  |
| `oseplatform-cli` | Go        | MPL-2.0 indirect (see below)                  |
| `golang-commons`  | Go        | MPL-2.0 indirect (see below)                  |
| `elixir-cabbage`  | Elixir    | All permissive (MIT, Apache-2.0)              |
| `elixir-gherkin`  | Elixir    | All permissive (MIT, Apache-2.0)              |

## LGPL-3.0 Elimination: `@img/sharp-libvips`

### Problem

**Dependency chain**: `next` (MIT) → `sharp` (Apache-2.0, optional) →
`@img/sharp-libvips-*` (LGPL-3.0-or-later, optional, platform-specific)

`@img/sharp-libvips-*` packages contain pre-built `libvips` native shared library binaries for
image processing. Sharp calls libvips via its C API at runtime (dynamic linking).

**Why this conflicts with FSL-1.1-MIT**: GPL-3.0 Section 10 (incorporated by LGPL-3.0) prohibits
imposing "further restrictions on the exercise of the rights granted or affirmed under this
License." GPL-3.0 Section 7 defines non-permissive additional terms as "further restrictions."
FSL's non-compete clause could be interpreted as such a restriction when applied to a work
containing LGPL-licensed components.

### Resolution

Set `images.unoptimized: true` in all 3 production Next.js apps' `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};
```

This prevents sharp from being loaded or bundled into production output. Sharp may remain in
`node_modules` as an optional dependency of `next`, but is never invoked at runtime.

### Why This Is Safe

- **Vercel handles image optimization via its own CDN pipeline** — not through sharp in the
  application code. With `unoptimized: true`, the image optimization pipeline is bypassed
  entirely.
- **No production performance impact** — Vercel's infrastructure handles image optimization at
  the platform level.
- **Local development** — images serve at original size without optimization. This is acceptable
  for development workflows.

## MPL-2.0: HashiCorp Libraries (Go CLI Apps)

### Packages

- `hashicorp/go-immutable-radix` (MPL-2.0)
- `hashicorp/go-memdb` (MPL-2.0)
- `hashicorp/golang-lru` (MPL-2.0)

### Dependency Chain

`godog` (MIT, test framework) → HashiCorp libs (MPL-2.0, indirect)

### Why MPL-2.0 Is Compatible with FSL

MPL-2.0 is **file-level copyleft** — it only requires that modifications to MPL-licensed _source
files themselves_ be shared under MPL-2.0. MPL-2.0 Section 3.3 ("Distribution of a Larger Work")
explicitly permits combining MPL-licensed code with code under different licenses:

> "You may create and distribute a Larger Work under terms of Your choice, provided that You also
> comply with the requirements of this License for the Covered Software."

The FSL non-compete clause applies to the project's own code, not to the MPL-licensed files.
These are indirect dependencies of a test framework — they are compiled into CLI binaries but
serve godog's internal data structures.

**Resolution**: No action required. Documented here for transparency.

## Demo App Exclusion Rationale

Demo apps (`a-demo-*`) are excluded from this audit because:

1. They are reference implementations demonstrating different technology stacks
2. They do not ship as products or services
3. Their dependencies are used only for educational and demonstration purposes
4. The FSL-1.1-MIT non-compete clause applies to commercial competing products/services, not
   internal demonstrations

## Related Documentation

- [Licensing Decisions](./ex-soen-li__licensing-decisions.md) — Analysis of notable dependency
  licenses
- [Licensing Index](./README.md) — All licensing documentation
