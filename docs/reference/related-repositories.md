---
title: "Related Repositories"
description: Ecosystem of sibling repositories derived from or related to open-sharia-enterprise
category: reference
subcategory: ecosystem
tags:
  - reference
  - ose-primer
  - ecosystem
  - cross-repo
created: 2026-04-18
updated: 2026-04-18
---

# Related Repositories

This reference documents the external repositories that exist in the `open-sharia-enterprise` ecosystem, the relationships between them, and where to find authoritative source-of-truth for each concern.

As of 2026-04-18, one related repository is actively tracked: [`ose-primer`](https://github.com/wahidyankf/ose-primer).

## `ose-primer`

`ose-primer` ([github.com/wahidyankf/ose-primer](https://github.com/wahidyankf/ose-primer)) is a public, MIT-licensed template repository derived from `ose-public`. It packages the repository scaffolding (governance layer, AI agents, skills, conventions, CI harness, `a-demo-*` polyglot showcase) into a reusable starting point for teams building their own Sharia-compliant enterprise product on top of the same platform conventions.

### Upstream / downstream relationship

`ose-public` is **upstream**: all scaffolding originates here, then flows to `ose-primer` through the propagation flow documented in the [ose-primer sync convention](../../governance/conventions/structure/ose-primer-sync.md).

`ose-primer` is **downstream**: it receives scaffolding updates, but its product layer (anything a consumer builds on top) is never pulled back into `ose-public`. Generic improvements that consumers contribute to `ose-primer` (for example, new governance patterns, Skill definitions, or demo-app implementations) can flow back to `ose-public` through the adoption flow documented in the same convention.

The two flows are directional — propagation (upstream → downstream) and adoption (downstream → upstream) — and classified per path in the convention's classifier table. Paths that are product-specific (for example, `apps/organiclever-*` or `apps/oseplatform-web`) are tagged `neither` and never flow in either direction.

### Licensing difference

`ose-public` uses a **per-directory license strategy**: `FSL-1.1-MIT` for product apps and behavioral specs (the WHAT); `MIT` for shared libraries and reference implementations (the HOW). See [LICENSING-NOTICE.md](../../LICENSING-NOTICE.md) for details.

`ose-primer` is **MIT throughout**. Only scaffolding, governance, agents, skills, and polyglot demo apps live in `ose-primer`; the FSL-licensed product tier is intentionally excluded. Consumers who fork `ose-primer` can build proprietary or open products on top without inheriting the FSL layer.

### Non-Goals for this document

- This document does not describe sync automation mechanics or release cadence. Those details live in the [ose-primer sync convention](../../governance/conventions/structure/ose-primer-sync.md) and the orchestrating workflows under `governance/workflows/repo/`.
- This document does not enumerate every file-by-file classification. The authoritative classifier table lives in the sync convention.
- This document does not describe how to clone, set up, or build `ose-primer` itself; that belongs in `ose-primer`'s own README.

### Where to look next

- [ose-primer sync convention](../../governance/conventions/structure/ose-primer-sync.md) — directional classification, transforms, safety invariants, and audit rules.
- [ose-primer on GitHub](https://github.com/wahidyankf/ose-primer) — downstream template repository.

---

**Last Updated**: 2026-04-18
