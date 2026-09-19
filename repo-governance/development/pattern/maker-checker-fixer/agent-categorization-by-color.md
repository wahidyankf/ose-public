---
description: "How the three stages map to agent colors."
when_to_use: "Use when verifying an agent's color."
---

# Agent Categorization by Color

The maker-checker-fixer pattern aligns with the agent color categorization system:

| Color         | Role     | Stage   | Tool Pattern                                 | Examples                                                                                  |
| ------------- | -------- | ------- | -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 🟦 **Blue**   | Writers  | Maker   | Has `Write` (creates new files)              | apps-ayokoding-www-general-maker, apps-ayokoding-www-by-example-maker, readme-maker       |
| 🟩 **Green**  | Checkers | Checker | Has `Write`, `Bash` (no `Edit`)              | apps-ayokoding-www-general-checker, apps-ayokoding-www-by-example-checker, readme-checker |
| 🟨 **Yellow** | Fixers   | Fixer   | Has `Edit` + `Write` (for report generation) | repo-workflow-fixer                                                                       |

**Note**: Purple (🟪 Implementors) agents execute plans and use all tools, falling outside the maker-checker-fixer pattern.

See [AI Agents Convention - Agent Color Categorization](../../agents/ai-agents/agent-color-categorization.md#agent-color-categorization) for complete details, including the [Platform Binding Color Translation](../../agents/ai-agents/agent-color-categorization.md#platform-binding-color-translation) subsection that documents how named colors map to platform binding color tokens via `./rhino harness adapters generate`.
