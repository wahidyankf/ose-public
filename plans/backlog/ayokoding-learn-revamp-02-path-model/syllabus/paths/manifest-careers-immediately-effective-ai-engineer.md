# Manifest — `careers/immediately-effective/ai-engineer`

**Path title**: Immediately Effective AI Engineer · **Arc**: `immediately-effective` · **File**:
`apps/ayokoding-www/src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.json` · **Courses before and after**: 26

This file specifies the target manifest. The JSON below is the exact file body Phase 3 writes. The
reading tables repeat the same data with position numbers.

## Phases and Outcomes

- **Description:** For developers who already code: build, evaluate, deploy, and operate AI systems.
- **Goals:** none (see notes)
- **Assumes:** `advanced-sql-and-query-performance`, `api-design`, `backend-essentials`, `computer-science-foundations`, `just-enough-bash`, `just-enough-typescript`, `networking-essentials`, `security-essentials`, `sql-essentials`, `system-design`, `version-control-and-git`
- **Courses:** 26 total; 25 core; 1 extension

| Phase ID                    | Title                            | Kind      | Positions | Courses in order                                                                                                                                                                                                  |
| --------------------------- | -------------------------------- | --------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `programming-and-computing` | Programming and computing basics | core      | 1–3       | `just-enough-python`, `data-structures-and-algorithms-essentials`, `computer-architecture`                                                                                                                        |
| `shipping-software`         | Shipping and operating software  | core      | 4–11      | `frontend-essentials`, `software-testing`, `containers-and-orchestration`, `data-engineering`, `backend-at-scale`, `cicd-and-release-engineering`, `site-reliability-engineering`, `software-product-engineering` |
| `building-with-models`      | Building with models             | core      | 12–13     | `creating-ai-powered-apps`, `evaluating-ai-output-essentials`                                                                                                                                                     |
| `agents`                    | Agents                           | core      | 14–20     | `agentic-ai`, `browser-automation-with-cdp`, `the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-orchestration-subagents-and-observability`           |
| `evaluation-in-depth`       | Evaluation in depth              | core      | 21–23     | `statistics-for-evaluation`, `evaluating-ai-systems-in-depth`, `product-patterns-for-probabilistic-systems`                                                                                                       |
| `serving-and-adapting`      | Serving and adapting models      | core      | 24–25     | `inference-serving-and-model-deployment`, `fine-tuning-and-adaptation`                                                                                                                                            |
| `capstone`                  | Capstone                         | extension | 26        | `capstone-build-your-own-coding-agent` (outline)                                                                                                                                                                  |

| Core phase                  | After this phase you can …                                                                                       | You cannot yet …                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `programming-and-computing` | write and test Python, use core data structures, and reason about how hardware runs your code                    | ship or operate a service                      |
| `shipping-software`         | build a tested frontend, run data pipelines and services in containers, and set up CI/CD and reliability targets | call a language model from your product        |
| `building-with-models`      | build an AI-powered feature and measure the quality of its output                                                | build an agent that plans and uses tools       |
| `agents`                    | build an agent loop with tools, memory, permissions, and observability                                           | measure AI quality with statistical confidence |
| `evaluation-in-depth`       | evaluate AI systems with sound statistics and design products around probabilistic behaviour                     | serve or adapt your own models                 |
| `serving-and-adapting`      | deploy models for inference and adapt them with fine-tuning                                                      | —                                              |

## Target JSON

```json
{
  "pathId": "careers/immediately-effective/ai-engineer",
  "arc": "immediately-effective",
  "title": "Immediately Effective AI Engineer",
  "description": "For developers who already code: build, evaluate, deploy, and operate AI systems.",
  "assumes": [
    "advanced-sql-and-query-performance",
    "api-design",
    "backend-essentials",
    "computer-science-foundations",
    "just-enough-bash",
    "just-enough-typescript",
    "networking-essentials",
    "security-essentials",
    "sql-essentials",
    "system-design",
    "version-control-and-git"
  ],
  "phases": [
    {
      "id": "programming-and-computing",
      "title": "Programming and computing basics",
      "kind": "core",
      "outcome": {
        "can": "write and test Python, use core data structures, and reason about how hardware runs your code",
        "cannotYet": "ship or operate a service"
      },
      "courses": ["just-enough-python", "data-structures-and-algorithms-essentials", "computer-architecture"]
    },
    {
      "id": "shipping-software",
      "title": "Shipping and operating software",
      "kind": "core",
      "outcome": {
        "can": "build a tested frontend, run data pipelines and services in containers, and set up CI/CD and reliability targets",
        "cannotYet": "call a language model from your product"
      },
      "courses": [
        "frontend-essentials",
        "software-testing",
        "containers-and-orchestration",
        "data-engineering",
        "backend-at-scale",
        "cicd-and-release-engineering",
        "site-reliability-engineering",
        "software-product-engineering"
      ]
    },
    {
      "id": "building-with-models",
      "title": "Building with models",
      "kind": "core",
      "outcome": {
        "can": "build an AI-powered feature and measure the quality of its output",
        "cannotYet": "build an agent that plans and uses tools"
      },
      "courses": ["creating-ai-powered-apps", "evaluating-ai-output-essentials"]
    },
    {
      "id": "agents",
      "title": "Agents",
      "kind": "core",
      "outcome": {
        "can": "build an agent loop with tools, memory, permissions, and observability",
        "cannotYet": "measure AI quality with statistical confidence"
      },
      "courses": [
        "agentic-ai",
        "browser-automation-with-cdp",
        "the-agent-loop",
        "agent-tools-and-mcp",
        "agent-context-and-memory",
        "agent-permissions-and-sandboxing",
        "agent-orchestration-subagents-and-observability"
      ]
    },
    {
      "id": "evaluation-in-depth",
      "title": "Evaluation in depth",
      "kind": "core",
      "outcome": {
        "can": "evaluate AI systems with sound statistics and design products around probabilistic behaviour",
        "cannotYet": "serve or adapt your own models"
      },
      "courses": [
        "statistics-for-evaluation",
        "evaluating-ai-systems-in-depth",
        "product-patterns-for-probabilistic-systems"
      ]
    },
    {
      "id": "serving-and-adapting",
      "title": "Serving and adapting models",
      "kind": "core",
      "outcome": {
        "can": "deploy models for inference and adapt them with fine-tuning"
      },
      "courses": ["inference-serving-and-model-deployment", "fine-tuning-and-adaptation"]
    },
    {
      "id": "capstone",
      "title": "Capstone",
      "kind": "extension",
      "courses": ["capstone-build-your-own-coding-agent"]
    }
  ]
}
```
