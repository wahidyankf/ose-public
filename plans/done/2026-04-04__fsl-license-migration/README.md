# Plan: Migrate from MIT to FSL-1.1-MIT License

**Status**: Done
**Created**: 2026-04-04

## Overview

Relicense the open-sharia-enterprise repository from MIT to **FSL-1.1-MIT** (Functional Source
License 1.1 with MIT as the Change License). Under FSL-1.1-MIT:

- **Immediately**: Source code is publicly available. Anyone can use, modify, and distribute the
  software for any purpose **except** offering a competing commercial product or service.
- **After 2 years**: The code automatically converts to the MIT license with no restrictions.

This protects the project from competitors repackaging it as a competing Sharia-compliant enterprise
platform during the critical early growth period, while guaranteeing full open-source freedom after
the change date.

**Git Workflow**: Commit to `main` (Trunk Based Development)

## Quick Links

- [Requirements](./requirements.md) - Files to change, acceptance criteria, legal considerations
- [Technical Documentation](./tech-docs.md) - FSL-1.1-MIT specification, competing use definition,
  third-party code handling
- [Delivery Plan](./delivery.md) - Phased checklist and validation

## Scope Summary

### Core License Files

| File           | Current            | Change                               |
| -------------- | ------------------ | ------------------------------------ |
| `LICENSE`      | MIT full text      | Replace with FSL-1.1-MIT full text   |
| `package.json` | `"license": "MIT"` | Change to `"license": "FSL-1.1-MIT"` |

### Documentation Referencing Project License

| File                                                          | Current Reference                           | Change                                        |
| ------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------- |
| `README.md`                                                   | MIT License section                         | Update to describe FSL-1.1-MIT                |
| `CLAUDE.md` (x2)                                              | `License: MIT`                              | Change to `License: FSL-1.1-MIT`              |
| `governance/vision/README.md`                                 | `Open source (MIT)`                         | `Source-available (FSL-1.1-MIT)` + conversion |
| `apps/oseplatform-web/content/about.md` (x2)                  | `MIT License` in license section            | Update to describe FSL-1.1-MIT                |
| `governance/conventions/writing/oss-documentation.md`         | MIT badge, template, "Current Project: MIT" | Update to FSL-1.1-MIT                         |
| `governance/conventions/writing/readme-quality.md`            | MIT in good/bad example text                | Update examples to FSL-1.1-MIT                |
| `governance/principles/general/simplicity-over-complexity.md` | `license: MIT` in YAML example              | Change to `license: FSL-1.1-MIT`              |
| `docs/how-to/hoto__add-new-lib.md`                            | `MIT` in new-lib README template            | Change to `FSL-1.1-MIT`                       |

### External Platform Attributes

| Platform | Current                                                      | Change                                                      |
| -------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| GitHub   | `licenseInfo: MIT License` (auto-detected from LICENSE file) | Will show "Other" (FSL not in GitHub's list); expected      |
| GitHub   | Description: "Open-source Sharia-compliant enterprise..."    | Update to "Source-available Sharia-compliant enterprise..." |

### Files NOT Changed (Third-Party Code)

| File                                  | Copyright           | Why Unchanged                                  |
| ------------------------------------- | ------------------- | ---------------------------------------------- |
| `libs/elixir-cabbage/LICENSE`         | Matt Widmann (2017) | Third-party fork; retains original MIT license |
| `libs/elixir-gherkin/LICENSE`         | Matt Widmann (2018) | Third-party fork; retains original MIT license |
| `archived/ayokoding-web-hugo/LICENSE` | Xin (2023)          | Third-party fork; retains original MIT license |

### Files NOT Changed (References to Other Projects' Licenses)

These files mention "MIT" when describing third-party dependency licenses (not the project's own
license). They remain unchanged:

- `libs/elixir-cabbage/FORK_NOTES.md` — upstream fork license
- `libs/elixir-gherkin/FORK_NOTES.md` — upstream fork license
- `libs/elixir-cabbage/README.md` — upstream fork license
- `apps/a-demo-be-fsharp-giraffe/README.md` — DbUp dependency license
- `apps/a-demo-be-csharp-aspnetcore/README.md` — EF Core dependency license
- `governance/development/pattern/database-audit-trail.md` — dependency license table
- `docs/explanation/software-engineering/licensing/*.md` — licensing docs (reference MIT generically)
- `governance/conventions/writing/oss-documentation.md` (generic license lists like "MIT, Apache 2.0, GPL")

### Files NOT Changed (Historical Records)

Plans in `plans/done/` are historical records of completed work. They describe what was true at the
time and are not updated retroactively:

- `plans/done/2025-11-24__init-monorepo/tech-docs.md`
- `plans/done/2026-03-09__organiclever-be-exph/tech-docs.md`
- `plans/done/2026-03-28__organiclever-fullstack-evolution/tech-docs.md`

### Files NOT Changed (References to Other Products' Licenses)

- `apps/oseplatform-web/content/updates/2026-01-11-phase-0-week-8-*.md` — references OpenCode's MIT
  license (a different project), not our project's license

## Context

### Why FSL-1.1-MIT

The project's [vision](../../../governance/vision/open-sharia-enterprise.md) aims to democratize
Shariah-compliant enterprise systems. FSL-1.1-MIT is the **middle path** between fully proprietary
and fully permissive licensing:

```
Proprietary          FSL-1.1-MIT              MIT / Apache 2.0
(closed source)      (source-available,       (fully open source,
                      non-compete for          no restrictions)
                      2 years, then MIT)
     ◄─────────────────── ● ───────────────────►
                     Middle Path
```

- **Too restrictive (proprietary)**: Contradicts the project's mission of democratizing
  Sharia-compliant enterprise systems. No one can learn from, audit, or contribute to the code.
- **Too permissive (MIT from day one)**: Allows well-funded competitors to take the entire
  platform, rebrand it, and offer it as a competing commercial service before the project has
  established itself — undermining the sustainability of the original project.
- **The middle path (FSL-1.1-MIT)**: Source code is fully visible and usable from day one.
  The only restriction is a time-limited non-compete clause that expires after 2 years. This
  protects the project during its critical early growth period while guaranteeing eventual full
  open-source freedom.

This balances two goals:

1. **Protection**: Prevents competitors from taking the code and offering a competing commercial
   Sharia-compliant enterprise platform without contributing back — but only for 2 years
2. **Openness**: Source code is fully visible from day one, and every commit progressively becomes
   MIT-licensed — guaranteeing eventual full freedom with no strings attached

### Dependency Compatibility

A full dependency audit (2026-04-04) of all **production** (non-demo) apps found:

- **0 GPL/AGPL** dependencies — clean
- **1 LGPL** dependency — `@img/sharp-libvips` (LGPL-3.0), transitive optional via Next.js →
  `sharp`. Affects `ayokoding-web`, `oseplatform-web`, and `organiclever-fe`. **Resolution**:
  set `images.unoptimized: true` in all 3 apps to eliminate sharp entirely (Vercel handles image
  optimization at the edge anyway)
- **MPL-2.0** — HashiCorp libs (`go-immutable-radix`, `go-memdb`, `golang-lru`), indirect deps
  via `godog` in Go CLI apps. File-level copyleft only — no conflict with FSL. No action needed.
- **All other deps** — MIT, Apache-2.0, BSD, ISC, PostgreSQL License (all permissive)

Demo apps (`a-demo-*`) are excluded from this audit — they are reference implementations only and
do not ship as products. See [tech-docs.md](./tech-docs.md) for the full audit and
[delivery.md](./delivery.md) for mitigation steps.

### Change Date and Per-Version Rolling Conversion

The FSL Change Date will be set to **2028-04-04** (2 years from the initial license change). FSL
converts to MIT on a **per-version (per-commit) rolling basis**: each commit becomes MIT-licensed
2 years after its first public distribution. The Change Date is the floor — the earliest any code
becomes MIT. Code committed after 2026-04-04 gets its own 2-year window (e.g., a commit from
2026-06-15 becomes MIT on 2028-06-15). See [tech-docs.md](./tech-docs.md) for the full
explanation.
