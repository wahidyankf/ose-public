---
title: Frontend Development
description: UI development conventions for the open-sharia-enterprise monorepo's frontend applications
category: explanation
subcategory: development/frontend
tags:
  - index
  - frontend
  - ui
  - conventions
  - accessibility
  - styling
created: 2026-03-28
---

# Frontend Development

UI development conventions for the open-sharia-enterprise monorepo's frontend applications. These documents define how to build, style, and test user interface components across all frontend apps in the repository.

**Governance**: All frontend conventions in this directory serve the [Vision](../../vision/open-sharia-enterprise.md) (Layer 0), implement the [Core Principles](../../principles/README.md) (Layer 1), and complement [Documentation Conventions](../../conventions/README.md) (Layer 2) as part of the six-layer architecture. Each convention MUST include TWO mandatory sections: "Principles Implemented/Respected" and "Conventions Implemented/Respected". See [Repository Governance Architecture](../../repository-governance-architecture.md) for the complete governance model.

## 🎯 Scope

**This directory contains conventions for UI DEVELOPMENT:**

**✅ Belongs Here:**

- UI component patterns and composition strategies
- Design token categories, naming rules, and per-app override patterns
- Styling approach (Tailwind v4, utility-first, class ordering)
- Accessibility requirements specific to UI components (focus management, ARIA, reduced-motion)
- Dark mode implementation requirements
- Form control patterns and validation UI

**❌ Does NOT Belong Here:**

- How to write and format documentation (use [Conventions](../../conventions/README.md))
- Color accessibility for diagrams and documentation (use [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md))
- Backend API patterns or server-side logic
- Build infrastructure and Nx targets (use [Nx Target Standards](../infra/nx-targets.md))

## 📋 Contents

- [Design Tokens Convention](./design-tokens.md) — Token categories, naming rules, per-app override pattern, and dark mode requirements
- [Component Patterns Convention](./component-patterns.md) — CVA variants, Radix composition, `cn()` utility, and component state requirements
- [Accessibility Convention](./accessibility.md) — WCAG AA compliance, focus management, reduced-motion, and form controls
- [Styling Convention](./styling.md) — Tailwind v4 patterns, utility-first approach, class ordering, and responsive design

## 🔗 Related Documentation

- [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md) — WCAG AA color palette, contrast ratios, and color-blind friendly design (authoritative source for all color decisions)
- [Accessibility First Principle](../../principles/content/accessibility-first.md) — Foundational principle governing all accessibility requirements
- [Implementation Workflow](../workflow/implementation.md) — Three-stage development workflow applied when building UI features
- [Three-Level Testing Standard](../quality/three-level-testing-standard.md) — Unit, integration, and E2E testing requirements for frontend apps

## ✅ Principles Implemented/Respected

- [Accessibility First](../../principles/content/accessibility-first.md) — Every UI convention in this directory enforces WCAG AA compliance as a baseline requirement, not an afterthought
- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) — Component patterns favor composition over inheritance and utility-first styling over custom CSS abstractions
- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) — Design tokens, variant definitions, and class ordering rules make UI decisions visible and auditable

## 📐 Conventions Implemented/Respected

- [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md) — UI color usage must meet the WCAG AA contrast ratios defined in this convention
- [Indentation Convention](../../conventions/formatting/indentation.md) — All code examples in this directory use language-appropriate indentation (2 spaces for TypeScript/JSX/JSON)
