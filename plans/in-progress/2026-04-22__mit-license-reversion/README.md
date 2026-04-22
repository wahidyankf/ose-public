# Plan: Revert to MIT License

**Status**: In Progress
**Created**: 2026-04-22
**Scope**: `ose-public`

## Overview

Relicense the entire `ose-public` repository from the current split-license model (FSL-1.1-MIT for
product apps/specs, MIT for libs) to **uniform MIT** across all directories. This reverses the
migration done in `plans/done/2026-04-04__fsl-license-migration/`.

## Quick Links

- [Business Rationale](./brd.md)
- [Requirements](./prd.md)
- [Technical Documentation](./tech-docs.md)
- [Delivery Checklist](./delivery.md)

## Approach Summary

This relicensing replaces all FSL-1.1-MIT LICENSE file text with standard MIT License text,
patches the `package.json` (and `package-lock.json`) `license` field, rewrites documentation
references to FSL throughout governance and docs, and creates a new MIT rationale explanation
document. The changes are purely textual — no code logic, build configuration, or test files
are modified. A single thematic commit captures the full relicensing, followed by a draft PR
against `main`.

## Scope Summary

### LICENSE Files (FSL → MIT)

| File                           | Current     | Change |
| ------------------------------ | ----------- | ------ |
| `LICENSE`                      | FSL-1.1-MIT | MIT    |
| `apps/ayokoding-cli/LICENSE`   | FSL-1.1-MIT | MIT    |
| `apps/ayokoding-web/LICENSE`   | FSL-1.1-MIT | MIT    |
| `apps/organiclever-be/LICENSE` | FSL-1.1-MIT | MIT    |
| `apps/organiclever-fe/LICENSE` | FSL-1.1-MIT | MIT    |
| `apps/oseplatform-cli/LICENSE` | FSL-1.1-MIT | MIT    |
| `apps/oseplatform-web/LICENSE` | FSL-1.1-MIT | MIT    |
| `apps/wahidyankf-web/LICENSE`  | FSL-1.1-MIT | MIT    |
| `specs/LICENSE`                | FSL-1.1-MIT | MIT    |

### Configuration / Metadata

| File                | Change                                          |
| ------------------- | ----------------------------------------------- |
| `package.json`      | `"license": "FSL-1.1-MIT"` → `"license": "MIT"` |
| `package-lock.json` | Patch root package `"license"` field to `"MIT"` |

### Documentation (FSL refs → MIT / remove)

| File                                                                                             | Change                         |
| ------------------------------------------------------------------------------------------------ | ------------------------------ |
| `LICENSING-NOTICE.md`                                                                            | Rewrite for uniform MIT        |
| `CLAUDE.md`                                                                                      | License field update           |
| `README.md`                                                                                      | License section rewrite        |
| `governance/vision/README.md`                                                                    | License reference update       |
| `governance/conventions/README.md`                                                               | Remove FSL references          |
| `governance/conventions/structure/README.md`                                                     | Remove FSL references          |
| `governance/conventions/structure/licensing.md`                                                  | Rewrite for MIT                |
| `governance/conventions/writing/oss-documentation.md`                                            | Remove FSL examples/references |
| `governance/conventions/writing/readme-quality.md`                                               | Update example text            |
| `governance/principles/general/simplicity-over-complexity.md`                                    | Update YAML example            |
| `docs/how-to/add-new-lib.md`                                                                     | Update license defaults        |
| `docs/explanation/software-engineering/licensing/`                                               | Update explanations            |
| `apps/oseplatform-web/content/about.md`                                                          | Update license section         |
| `apps/oseplatform-web/content/updates/2026-04-05-phase-1-week-8-wide-to-learn-narrow-to-ship.md` | Update license reference       |

### Files NOT Changed (Third-Party Code)

| File                                  | Reason                           |
| ------------------------------------- | -------------------------------- |
| `archived/ayokoding-web-hugo/LICENSE` | Third-party copyright (Xin 2023) |

### Files NOT Changed (Historical Plans)

Plans in `plans/done/` are frozen historical records — not updated retroactively.
