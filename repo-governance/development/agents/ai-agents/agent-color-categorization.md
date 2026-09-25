---
description: "Defines the color field and its role-to-category mapping for agent definitions."
when_to_use: Use when assigning or validating the color field on an agent definition.
---

# Agent Color Categorization

## Role Color (Documentation Only)

Each agent has a role color that helps users identify its type at a glance. The color is **not** agent metadata:
canonical agents in `.agents/agents/` carry no `color` key, `./rhino metadata validate` rejects one, and no generated
harness route renders one. The color lives in documentation, such as an agent body's `**Role**: Checker (green)` line
and the tables below.

- Values: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`
- Indicates the agent's primary role category
- Used for visual identification in agent listings and documentation

## Color-to-Role Mapping

Agents are categorized by their **primary role** which aligns with naming suffixes and tool permissions:

| Color         | Role             | Purpose                               | Tool Pattern                            | Agents                                                                                                        |
| ------------- | ---------------- | ------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 🟦 **Blue**   | **Makers**       | Create new content from scratch       | Has `Write` tool                        | docs-maker<br>plan-maker<br>docs-tutorial-maker<br>rules-maker                                                |
| 🟩 **Green**  | **Checkers**     | Validate and generate reports         | Has `Write`, `Bash` (no `Edit`)\*\*     | rules-checker<br>plan-checker<br>docs-checker<br>docs-link-checker\*\*<br>apps-ayokoding-www-link-checker\*\* |
| 🟨 **Yellow** | **Fixers**       | Modify and propagate existing content | Has `Edit` (usually not `Write`)        | docs-file-manager<br>readme-fixer<br>repo-workflow-fixer                                                      |
| 🟪 **Purple** | **Implementors** | Execute plans with full tool access   | Has `Write`, `Edit`, `Bash` (or Bash)\* | deployers\*<br>swe-code-maker                                                                                 |

## Platform Binding Color Translation

No harness route carries a color. Canonical agents in `.agents/agents/` are the only authored source, and
`./rhino harness adapters generate` renders their routes from `name`, `description`, `tier`, `capabilities`, `skills`,
and `constraints` only. The translation table in the platform binding examples records the historical mapping for
documentation that still uses role colors.
