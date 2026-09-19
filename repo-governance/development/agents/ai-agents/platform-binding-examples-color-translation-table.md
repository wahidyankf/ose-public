---
description: "Provides the full color-to-role translation table used across platform bindings."
when_to_use: Use when looking up which color an agent role maps to, or translating a color across harnesses.
---

# Platform Binding Examples — Color Translation Table

The content below is platform-specific. It documents the concrete translation applied by `./rhino harness adapters generate` and is intentionally vendor-specific.

## Color Translation Table

**Translation table**: the portable native adapter profile owns this mapping.

| Claude color | OpenCode value | Role hint                         |
| ------------ | -------------- | --------------------------------- |
| `blue`       | `primary`      | Maker                             |
| `green`      | `success`      | Checker / Researcher              |
| `yellow`     | `warning`      | Fixer                             |
| `purple`     | `secondary`    | Implementor                       |
| `red`        | `error`        | Reserved future role              |
| `orange`     | `warning`      | Reserved — closest hue to warning |
| `pink`       | `accent`       | Reserved future role              |
| `cyan`       | `info`         | Reserved future role              |

**Single source of truth**: the declared Rhino harness profile. Any mapping change MUST update
the profile and this table in the same commit.

**Escape hatch**: If you write a hex code (e.g., `#3B82F6`) or a valid OpenCode theme token (e.g., `primary`) directly in `.claude/agents/*.md`, the converter passes it through unchanged.

**Edge Case Notes:**

- **\*Yellow with Write**: Some Yellow fixer agents (e.g., readme-fixer, repo-workflow-fixer) may have Write tool for audit report generation. Documented exception.
- **\*Purple Bash-only**: Deployers (apps-ayokoding-www-deployer, apps-ose-www-deployer, apps-organiclever-app-web-deployer) only need Bash for git/deployment orchestration. Purple without Write/Edit is valid for Bash-only orchestrators.
- **\*\*Green with Write + Edit**: Link checker agents (docs-link-checker, apps-ayokoding-www-link-checker) also have Edit and Write tools for cache file management, but their primary role is validation (checker). Color is green to reflect primary role. See "Link Checker Agents Note" below.
- **\*\*\*Green research agent (`web-researcher`)**: The `web-researcher` agent has the `researcher` role suffix and `color: green`. Green is used because the agent's purpose is validation-adjacent research — verifying external claims and gathering current information — which sits in the validation family rather than content creation. See "Research Agent Note" below.

**Color Accessibility Note**: The four active role colors (blue, green, yellow, purple) are from the verified accessible palette defined in [Color Accessibility Convention](../../../conventions/formatting/color-accessibility.md) — the master reference for all color usage in this repository. These colors meet WCAG AA standards for both light and dark modes and work for all types of color blindness (protanopia, deuteranopia, and tritanopia). The additional reserved colors (red, orange, pink, cyan) are reserved for future role categories; when adopted they MUST also be drawn from the accessible palette and verified against the Color Accessibility Convention. See the accessibility section below for details on how agents are identified beyond color. All color-related work must reference the Color Accessibility Convention as the authoritative source.
