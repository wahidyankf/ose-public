# Manifest — `careers/immediately-effective/ai-engineer` (after plan 08)

**Path title**: Immediately Effective AI Engineer · **Arc**: `immediately-effective` · **File**:
`apps/ayokoding-www/src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.json`
· **Courses before and after**: 26 before, 28 after

This file specifies the target manifest. The JSON below is the exact file body the path phase writes. It
replaces the file plan 02 writes (plan 02 gave this path no goals; its draft is in
`plans/backlog/ayokoding-learn-revamp-02-path-model/syllabus/paths/` until that plan is archived, then
in `plans/done/`). The reading tables repeat the same data with position numbers.

## Phases and Outcomes

- **Description:** For developers who already code: build an AI coding agent, then go deeper on
  evaluation, serving, and operations.
- **Goals:** `capstone-build-your-own-coding-agent`
- **Assumes:** `api-design`, `backend-essentials`, `just-enough-bash`, `sql-essentials`
- **Courses:** 28 total; 12 core; 16 extension

| Phase ID                       | Title                                    | Kind      | Positions | Courses in order                                                                                                                                                                              |
| ------------------------------ | ---------------------------------------- | --------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `python-services-and-practice` | Python services and engineering practice | core      | 1–4       | `just-enough-python`, `async-python-and-fastapi-services`, `software-testing`, `software-engineering-practices`                                                                               |
| `building-with-models`         | Building with models                     | core      | 5         | `creating-ai-powered-apps`                                                                                                                                                                    |
| `agents`                       | Agents                                   | core      | 6–11      | `agentic-ai`, `the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-orchestration-subagents-and-observability`                      |
| `capstone`                     | Capstone                                 | core      | 12        | `capstone-build-your-own-coding-agent`                                                                                                                                                        |
| `programming-depth`            | Programming and computing depth          | extension | 13–14     | `data-structures-and-algorithms-essentials`, `computer-architecture`                                                                                                                          |
| `shipping-and-operating`       | Shipping and operating software          | extension | 15–21     | `frontend-essentials`, `containers-and-orchestration`, `data-engineering`, `backend-at-scale`, `cicd-and-release-engineering`, `site-reliability-engineering`, `software-product-engineering` |
| `agents-in-the-browser`        | Agents in the browser                    | extension | 22        | `browser-automation-with-cdp`                                                                                                                                                                 |
| `evaluation-in-depth`          | Evaluation in depth                      | extension | 23–26     | `evaluating-ai-output-essentials`, `statistics-for-evaluation`, `evaluating-ai-systems-in-depth`, `product-patterns-for-probabilistic-systems`                                                |
| `serving-and-adapting`         | Serving and adapting models              | extension | 27–28     | `inference-serving-and-model-deployment`, `fine-tuning-and-adaptation`                                                                                                                        |

| Core phase                     | After this phase you can …                                                                                   | You cannot yet …                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `python-services-and-practice` | write and test Python, build a typed async service, and keep a codebase healthy with review and automation   | call a language model from your product                                                                        |
| `building-with-models`         | build an AI-powered feature that retrieves context and checks the model's output                             | build an agent that plans and uses tools                                                                       |
| `agents`                       | build an agent loop with tools, memory, permissions, and observability                                       | join those parts into one tested agent                                                                         |
| `capstone`                     | build and test a small coding agent that stays in its workspace, asks before it acts, and keeps an audit log | measure agent quality with statistical confidence or serve your own models; the optional extensions cover that |

## Closure Check

Core = the goal plus every transitive prerequisite, stopping at the courses in `assumes`
(`computeCore(goals, prerequisitesByCourse, assumes)`). The table uses plan 02's complete revised graph
(its kept **and** added edges) and this plan's one edge change for the capstone (`just-enough-python`
added). Every prerequisite is either earlier in the path or assumed.

| Pos | Core course                                       | Prerequisites                                                                                                                                                                                                                                           | Status of each prerequisite        |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | `just-enough-python`                              | none                                                                                                                                                                                                                                                    | —                                  |
| 2   | `async-python-and-fastapi-services`               | `just-enough-python`, `backend-essentials`, `sql-essentials`                                                                                                                                                                                            | position 1; assumed; assumed       |
| 3   | `software-testing`                                | `just-enough-python`                                                                                                                                                                                                                                    | position 1                         |
| 4   | `software-engineering-practices`                  | `just-enough-bash`, `software-testing`, `backend-essentials`                                                                                                                                                                                            | assumed; position 3; assumed       |
| 5   | `creating-ai-powered-apps`                        | `backend-essentials`, `api-design`                                                                                                                                                                                                                      | assumed; assumed                   |
| 6   | `agentic-ai`                                      | `creating-ai-powered-apps`                                                                                                                                                                                                                              | position 5                         |
| 7   | `the-agent-loop`                                  | `agentic-ai`                                                                                                                                                                                                                                            | position 6                         |
| 8   | `agent-tools-and-mcp`                             | `the-agent-loop`                                                                                                                                                                                                                                        | position 7                         |
| 9   | `agent-context-and-memory`                        | `the-agent-loop`                                                                                                                                                                                                                                        | position 7                         |
| 10  | `agent-permissions-and-sandboxing`                | `the-agent-loop`                                                                                                                                                                                                                                        | position 7                         |
| 11  | `agent-orchestration-subagents-and-observability` | `agent-tools-and-mcp`, `agent-context-and-memory`                                                                                                                                                                                                       | positions 8, 9                     |
| 12  | `capstone-build-your-own-coding-agent` (goal)     | `just-enough-python`, `the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-orchestration-subagents-and-observability`, `async-python-and-fastapi-services`, `software-engineering-practices` | positions 1, 7, 8, 9, 10, 11, 2, 4 |

`assumes` is exact (rule R7). `sql-essentials` is a prerequisite of position 2; `backend-essentials` of
positions 2, 4, and 5; `api-design` of position 5; and `just-enough-bash` of position 4. None of the
four is in the path, and every prerequisite of a core course that is not in the core is one of the four.

**Why `just-enough-bash` is assumed and `software-testing` is core.** The path is "for developers who
already code", and plan 02's draft already assumed `just-enough-bash`. `software-testing` was core in
plan 02's draft, and the capstone's test-first fix (theme E) uses it through
`software-engineering-practices`, so it stays where it was.

The extension courses keep their original relative order from the 26-course path. Their outside
prerequisites (`computer-science-foundations`, `just-enough-typescript`, `advanced-sql-and-query-performance`,
`security-essentials`, `version-control-and-git`, `system-design`, `networking-essentials`) are listed as
links on each course page and are not walked. The ordering check (R10) over the flattened order finds no
course before an in-path prerequisite.

## Changes Against Plan 02's Draft

| Aspect             | Plan 02 draft                                       | After plan 08                                                                                                   |
| ------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Goals              | none                                                | `capstone-build-your-own-coding-agent`                                                                          |
| Core courses       | 25                                                  | 12                                                                                                              |
| Extension          | 1 (the outline capstone)                            | 16                                                                                                              |
| Total courses      | 26                                                  | 28 (adds `async-python-and-fastapi-services` and `software-engineering-practices`, which the capstone requires) |
| `assumes`          | 11 courses                                          | 4 courses (`api-design`, `backend-essentials`, `just-enough-bash`, `sql-essentials`)                            |
| Description        | "…build, evaluate, deploy, and operate AI systems." | "…build an AI coding agent, then go deeper on evaluation, serving, and operations."                             |
| Moved to extension | —                                                   | 16 courses that were core in the draft, listed in the extension phases above                                    |
| Capstone           | extension phase, outline                            | last core phase, filled                                                                                         |

The 16 courses that move from core to extension are `data-structures-and-algorithms-essentials`,
`computer-architecture`, `frontend-essentials`, `containers-and-orchestration`, `data-engineering`,
`backend-at-scale`, `cicd-and-release-engineering`, `site-reliability-engineering`,
`software-product-engineering`, `evaluating-ai-output-essentials`, `browser-automation-with-cdp`,
`statistics-for-evaluation`, `evaluating-ai-systems-in-depth`, `product-patterns-for-probabilistic-systems`,
`inference-serving-and-model-deployment`, and `fine-tuning-and-adaptation`. Nine draft core courses stay
in the core (`just-enough-python`, `software-testing`, `creating-ai-powered-apps`, `agentic-ai`,
`the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`,
and `agent-orchestration-subagents-and-observability`). The draft's one extension course, the capstone,
moves into the core, and two courses join the path as core members
(`async-python-and-fastapi-services` and `software-engineering-practices`): 9 + 1 + 2 = 12.

Seven of plan 02's eleven assumed courses (`advanced-sql-and-query-performance`,
`computer-science-foundations`, `just-enough-typescript`, `networking-essentials`, `security-essentials`,
`system-design`, `version-control-and-git`) are no longer assumed, because no core course needs them;
they remain outside prerequisites of some extension courses.

## Page Copy

The path page `apps/ayokoding-www/content/en/learn/paths/careers/immediately-effective/ai-engineer/_index.md`
keeps its other frontmatter keys. Its `description` equals the manifest description. The body becomes:

> This path is for developers who already write software. The "Before you start" list shows the
> courses it assumes; take any you have not covered first. The core is short: Python services,
> testing and engineering habits, building with language models, the agent courses, and a capstone
> where you build and test a small coding agent that stays inside its workspace.
>
> Everything after the core is optional. Use the extensions to go deeper on shipping and operating
> software, browser automation, evaluating AI systems with statistics, and serving and adapting models.
>
> Course pages you open from this path keep the path context, so Previous and Next follow this path.

The copy avoids every word the path-copy test bans (plan 02): none of the banned terms appears, and the
description keeps the phrase "for developers who already code".

## Target JSON

```json
{
  "pathId": "careers/immediately-effective/ai-engineer",
  "arc": "immediately-effective",
  "title": "Immediately Effective AI Engineer",
  "description": "For developers who already code: build an AI coding agent, then go deeper on evaluation, serving, and operations.",
  "goals": ["capstone-build-your-own-coding-agent"],
  "assumes": ["api-design", "backend-essentials", "just-enough-bash", "sql-essentials"],
  "phases": [
    {
      "id": "python-services-and-practice",
      "title": "Python services and engineering practice",
      "kind": "core",
      "outcome": {
        "can": "write and test Python, build a typed async service, and keep a codebase healthy with review and automation",
        "cannotYet": "call a language model from your product"
      },
      "courses": [
        "just-enough-python",
        "async-python-and-fastapi-services",
        "software-testing",
        "software-engineering-practices"
      ]
    },
    {
      "id": "building-with-models",
      "title": "Building with models",
      "kind": "core",
      "outcome": {
        "can": "build an AI-powered feature that retrieves context and checks the model's output",
        "cannotYet": "build an agent that plans and uses tools"
      },
      "courses": ["creating-ai-powered-apps"]
    },
    {
      "id": "agents",
      "title": "Agents",
      "kind": "core",
      "outcome": {
        "can": "build an agent loop with tools, memory, permissions, and observability",
        "cannotYet": "join those parts into one tested agent"
      },
      "courses": [
        "agentic-ai",
        "the-agent-loop",
        "agent-tools-and-mcp",
        "agent-context-and-memory",
        "agent-permissions-and-sandboxing",
        "agent-orchestration-subagents-and-observability"
      ]
    },
    {
      "id": "capstone",
      "title": "Capstone",
      "kind": "core",
      "outcome": {
        "can": "build and test a small coding agent that stays in its workspace, asks before it acts, and keeps an audit log",
        "cannotYet": "measure agent quality with statistical confidence or serve your own models; the optional extensions cover that"
      },
      "courses": ["capstone-build-your-own-coding-agent"]
    },
    {
      "id": "programming-depth",
      "title": "Programming and computing depth",
      "kind": "extension",
      "courses": ["data-structures-and-algorithms-essentials", "computer-architecture"]
    },
    {
      "id": "shipping-and-operating",
      "title": "Shipping and operating software",
      "kind": "extension",
      "courses": [
        "frontend-essentials",
        "containers-and-orchestration",
        "data-engineering",
        "backend-at-scale",
        "cicd-and-release-engineering",
        "site-reliability-engineering",
        "software-product-engineering"
      ]
    },
    {
      "id": "agents-in-the-browser",
      "title": "Agents in the browser",
      "kind": "extension",
      "courses": ["browser-automation-with-cdp"]
    },
    {
      "id": "evaluation-in-depth",
      "title": "Evaluation in depth",
      "kind": "extension",
      "courses": [
        "evaluating-ai-output-essentials",
        "statistics-for-evaluation",
        "evaluating-ai-systems-in-depth",
        "product-patterns-for-probabilistic-systems"
      ]
    },
    {
      "id": "serving-and-adapting",
      "title": "Serving and adapting models",
      "kind": "extension",
      "courses": ["inference-serving-and-model-deployment", "fine-tuning-and-adaptation"]
    }
  ]
}
```
