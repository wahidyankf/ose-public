---
description: How workflows relate to principles, conventions, development practices, agents, other workflows, and plans.
when_to_use: Use when explaining how workflows fit alongside principles, conventions, development practices, agents, or plans.
---

# Relationship to Other Layers

## Workflows ↔ Principles

Workflows **must respect** all core principles:

- **Explicit Over Implicit**: All steps, dependencies, conditions are explicit
- **Automation Over Manual**: Workflows automate complex multi-step processes
- **Simplicity Over Complexity**: Break complex workflows into smaller composable ones
- **No Time Estimates**: Workflows define WHAT to do, not HOW LONG it takes

## Workflows ↔ Conventions

Workflows **must follow** all conventions:

- File naming, linking, indentation, emoji usage
- All workflow documentation uses Markdown conventions
- Workflows can enforce conventions (e.g., validation workflow runs checkers)

## Workflows ↔ Development

Workflows **implement** development practices:

- Maker-Checker-Fixer pattern IS a workflow
- Implementation workflow (make it work, make it right, make it fast) can be formalized
- Code quality checks can be orchestrated via workflows

## Workflows ↔ Agents

Workflows **orchestrate** agents:

- Workflows call agents, not the reverse
- Agents don't know about workflows (separation of concerns)
- Workflows pass inputs/outputs between agents
- Workflows handle agent failures

## Workflows ↔ Workflows

Workflows **compose** other workflows:

- A workflow step can be another workflow (nested)
- Outer workflow passes inputs; inner workflow returns outputs
- Nesting is explicit — the step declares `**Workflow**: category/name`
- No circular nesting (workflow A calling workflow B calling workflow A)

## Workflows ↔ Plans

Workflows **operationalize** plans:

- Plans describe WHAT to build (strategic)
- Workflows describe HOW to build it (tactical)
- Plans can reference workflows: "Use deployment-workflow for release"
- Workflows can be generated from plan checklists
