# Manifest — `careers/interview-ready/software-engineer`

**Path title**: Interview-Ready Software Engineer · **Arc**: `interview-ready` · **File**:
`apps/ayokoding-www/src/features/course-paths/manifests/careers/interview-ready/software-engineer.json` · **Courses before and after**: 116

This file specifies the target manifest. The JSON below is the exact file body Phase 3 writes. The
reading tables repeat the same data with position numbers.

## Phases and Outcomes

- **Description:** For engineers returning to the job market: a focused core that ends in a full mock interview loop, then optional depth.
- **Goals:** `capstone-interview-loop`
- **Assumes:** none
- **Courses:** 116 total; 13 core; 103 extension

| Phase ID                               | Title                                      | Kind      | Positions | Courses in order                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------ | --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `programming-and-command-line`         | Programming and the command line           | core      | 1–3       | `just-enough-python`, `just-enough-bash`, `version-control-and-git`                                                                                                                                                                                                                                                                                                              |
| `algorithms-and-backend-basics`        | Data structures and backend basics         | core      | 4–7       | `data-structures-and-algorithms-essentials`, `sql-essentials`, `backend-essentials`, `networking-essentials`                                                                                                                                                                                                                                                                     |
| `interview-skills`                     | Interview skills                           | core      | 8–12      | `advanced-algorithms`, `coding-interview`, `take-home-and-live-coding`, `system-design-interview`, `behavioral-and-leadership-interviews`                                                                                                                                                                                                                                        |
| `interview-capstone`                   | Interview capstone                         | core      | 13        | `capstone-interview-loop`                                                                                                                                                                                                                                                                                                                                                        |
| `editor-and-shell`                     | Editor and shell workflow                  | extension | 14–17     | `just-enough-nvim`, `just-enough-lua`, `extending-neovim`, `capstone-forge-ready`                                                                                                                                                                                                                                                                                                |
| `programming-fundamentals`             | Programming fundamentals                   | extension | 18–20     | `object-oriented-programming-essentials`, `just-enough-typescript`, `software-testing`                                                                                                                                                                                                                                                                                           |
| `more-languages`                       | More programming languages                 | extension | 21–28     | `just-enough-c`, `just-enough-cpp`, `just-enough-go`, `just-enough-rust`, `just-enough-java`, `just-enough-kotlin`, `just-enough-swift`, `just-enough-dart`                                                                                                                                                                                                                      |
| `systems-and-tooling`                  | Operating systems and developer tooling    | extension | 29–35     | `linux-os`, `system-programming`, `modern-system-programming`, `build-your-own-git`, `building-production-cli-tools`, `build-automation-and-task-runners`, `debugging-and-profiling`                                                                                                                                                                                             |
| `apps-and-interfaces`                  | Web, mobile, and desktop apps              | extension | 36–44     | `frontend-essentials`, `advanced-frontend`, `build-your-own-reactive-ui`, `information-architecture-and-seo`, `analytics-and-experimentation`, `android-app-development`, `ios-app-development`, `hybrid-app-development`, `browser-automation-with-cdp`                                                                                                                         |
| `backend-depth`                        | Backend depth                              | extension | 45–49     | `async-python-and-fastapi-services`, `api-design`, `build-your-own-web-framework`, `security-essentials`, `backend-at-scale`                                                                                                                                                                                                                                                     |
| `data-and-databases`                   | Data and databases                         | extension | 50–58     | `nosql-databases`, `graph-databases`, `search-and-information-retrieval`, `advanced-sql-and-query-performance`, `data-access-orms-and-query-builders`, `build-your-own-orm-and-query-builder`, `database-internals-and-storage-engines`, `build-your-own-database`, `data-engineering`                                                                                           |
| `infrastructure-and-operations`        | Networking, infrastructure, and operations | extension | 59–66     | `advanced-networking`, `self-hosting-essentials`, `containers-and-orchestration`, `cloud-and-iac`, `cicd-and-release-engineering`, `bare-metal-virtualization`, `platform-engineering-and-devex`, `self-managed-kubernetes-and-gitops`                                                                                                                                           |
| `more-computer-science`                | More computer science                      | extension | 67–79     | `computer-science-foundations`, `computer-architecture`, `object-oriented-design-and-patterns`, `programming-paradigms`, `functional-programming`, `concurrency-and-parallelism`, `csp-style-concurrency`, `just-enough-elixir`, `actor-model-concurrency`, `just-enough-fsharp`, `type-systems`, `compilers-parsers-and-transpilers`, `capstone-concurrency-showdown` (outline) |
| `architecture-and-distributed-systems` | Architecture and distributed systems       | extension | 80–88     | `software-architecture`, `enterprise-java-and-the-jvm`, `domain-driven-design`, `event-driven-architecture`, `system-design`, `distributed-systems`, `build-your-own-raft`, `site-reliability-engineering`, `capstone-concurrency-and-systems` (outline)                                                                                                                         |
| `security`                             | Security                                   | extension | 89–95     | `it-and-application-security`, `offensive-security`, `defensive-security`, `detection-engineering-and-siem-operations`, `vulnerability-management-and-assessment`, `it-governance-grc`, `capstone-secure-service` (outline)                                                                                                                                                      |
| `more-practice-and-leadership`         | More engineering practice and leadership   | extension | 96–101    | `project-management`, `technical-communication`, `software-engineering-practices`, `agentic-coding`, `software-product-engineering`, `engineering-management`                                                                                                                                                                                                                    |
| `ai-and-agents`                        | AI apps and agents                         | extension | 102–110   | `creating-ai-powered-apps`, `agentic-ai`, `the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-orchestration-subagents-and-observability`, `capstone-build-your-own-coding-agent` (outline), `capstone-build-your-own-pentest-engine` (outline)                                                                       |
| `integrative-capstones`                | Integrative capstones                      | extension | 111–116   | `capstone-first-working-software`, `capstone-full-stack-app`, `capstone-data-pipeline` (outline), `capstone-solid-core`, `capstone-real-world-delivery` (outline), `capstone-lead-at-altitude` (outline)                                                                                                                                                                         |

| Core phase                      | After this phase you can …                                                                                       | You cannot yet …                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `programming-and-command-line`  | write and run small Python scripts, use the shell, and keep your work in Git                                     | solve algorithm problems under interview time pressure                  |
| `algorithms-and-backend-basics` | use core data structures, query a database with SQL, and explain how a web request reaches a backend             | work through a timed coding or system-design interview                  |
| `interview-skills`              | solve coding problems aloud, deliver a take-home, sketch a system design, and tell clear stories about your work | run a full interview loop end to end                                    |
| `interview-capstone`            | complete a realistic interview loop and know which areas to practise next                                        | operate production systems at scale; the optional extensions cover that |

## Target JSON

```json
{
  "pathId": "careers/interview-ready/software-engineer",
  "arc": "interview-ready",
  "title": "Interview-Ready Software Engineer",
  "description": "For engineers returning to the job market: a focused core that ends in a full mock interview loop, then optional depth.",
  "goals": ["capstone-interview-loop"],
  "assumes": [],
  "phases": [
    {
      "id": "programming-and-command-line",
      "title": "Programming and the command line",
      "kind": "core",
      "outcome": {
        "can": "write and run small Python scripts, use the shell, and keep your work in Git",
        "cannotYet": "solve algorithm problems under interview time pressure"
      },
      "courses": ["just-enough-python", "just-enough-bash", "version-control-and-git"]
    },
    {
      "id": "algorithms-and-backend-basics",
      "title": "Data structures and backend basics",
      "kind": "core",
      "outcome": {
        "can": "use core data structures, query a database with SQL, and explain how a web request reaches a backend",
        "cannotYet": "work through a timed coding or system-design interview"
      },
      "courses": [
        "data-structures-and-algorithms-essentials",
        "sql-essentials",
        "backend-essentials",
        "networking-essentials"
      ]
    },
    {
      "id": "interview-skills",
      "title": "Interview skills",
      "kind": "core",
      "outcome": {
        "can": "solve coding problems aloud, deliver a take-home, sketch a system design, and tell clear stories about your work",
        "cannotYet": "run a full interview loop end to end"
      },
      "courses": [
        "advanced-algorithms",
        "coding-interview",
        "take-home-and-live-coding",
        "system-design-interview",
        "behavioral-and-leadership-interviews"
      ]
    },
    {
      "id": "interview-capstone",
      "title": "Interview capstone",
      "kind": "core",
      "outcome": {
        "can": "complete a realistic interview loop and know which areas to practise next",
        "cannotYet": "operate production systems at scale; the optional extensions cover that"
      },
      "courses": ["capstone-interview-loop"]
    },
    {
      "id": "editor-and-shell",
      "title": "Editor and shell workflow",
      "kind": "extension",
      "courses": ["just-enough-nvim", "just-enough-lua", "extending-neovim", "capstone-forge-ready"]
    },
    {
      "id": "programming-fundamentals",
      "title": "Programming fundamentals",
      "kind": "extension",
      "courses": ["object-oriented-programming-essentials", "just-enough-typescript", "software-testing"]
    },
    {
      "id": "more-languages",
      "title": "More programming languages",
      "kind": "extension",
      "courses": [
        "just-enough-c",
        "just-enough-cpp",
        "just-enough-go",
        "just-enough-rust",
        "just-enough-java",
        "just-enough-kotlin",
        "just-enough-swift",
        "just-enough-dart"
      ]
    },
    {
      "id": "systems-and-tooling",
      "title": "Operating systems and developer tooling",
      "kind": "extension",
      "courses": [
        "linux-os",
        "system-programming",
        "modern-system-programming",
        "build-your-own-git",
        "building-production-cli-tools",
        "build-automation-and-task-runners",
        "debugging-and-profiling"
      ]
    },
    {
      "id": "apps-and-interfaces",
      "title": "Web, mobile, and desktop apps",
      "kind": "extension",
      "courses": [
        "frontend-essentials",
        "advanced-frontend",
        "build-your-own-reactive-ui",
        "information-architecture-and-seo",
        "analytics-and-experimentation",
        "android-app-development",
        "ios-app-development",
        "hybrid-app-development",
        "browser-automation-with-cdp"
      ]
    },
    {
      "id": "backend-depth",
      "title": "Backend depth",
      "kind": "extension",
      "courses": [
        "async-python-and-fastapi-services",
        "api-design",
        "build-your-own-web-framework",
        "security-essentials",
        "backend-at-scale"
      ]
    },
    {
      "id": "data-and-databases",
      "title": "Data and databases",
      "kind": "extension",
      "courses": [
        "nosql-databases",
        "graph-databases",
        "search-and-information-retrieval",
        "advanced-sql-and-query-performance",
        "data-access-orms-and-query-builders",
        "build-your-own-orm-and-query-builder",
        "database-internals-and-storage-engines",
        "build-your-own-database",
        "data-engineering"
      ]
    },
    {
      "id": "infrastructure-and-operations",
      "title": "Networking, infrastructure, and operations",
      "kind": "extension",
      "courses": [
        "advanced-networking",
        "self-hosting-essentials",
        "containers-and-orchestration",
        "cloud-and-iac",
        "cicd-and-release-engineering",
        "bare-metal-virtualization",
        "platform-engineering-and-devex",
        "self-managed-kubernetes-and-gitops"
      ]
    },
    {
      "id": "more-computer-science",
      "title": "More computer science",
      "kind": "extension",
      "courses": [
        "computer-science-foundations",
        "computer-architecture",
        "object-oriented-design-and-patterns",
        "programming-paradigms",
        "functional-programming",
        "concurrency-and-parallelism",
        "csp-style-concurrency",
        "just-enough-elixir",
        "actor-model-concurrency",
        "just-enough-fsharp",
        "type-systems",
        "compilers-parsers-and-transpilers",
        "capstone-concurrency-showdown"
      ]
    },
    {
      "id": "architecture-and-distributed-systems",
      "title": "Architecture and distributed systems",
      "kind": "extension",
      "courses": [
        "software-architecture",
        "enterprise-java-and-the-jvm",
        "domain-driven-design",
        "event-driven-architecture",
        "system-design",
        "distributed-systems",
        "build-your-own-raft",
        "site-reliability-engineering",
        "capstone-concurrency-and-systems"
      ]
    },
    {
      "id": "security",
      "title": "Security",
      "kind": "extension",
      "courses": [
        "it-and-application-security",
        "offensive-security",
        "defensive-security",
        "detection-engineering-and-siem-operations",
        "vulnerability-management-and-assessment",
        "it-governance-grc",
        "capstone-secure-service"
      ]
    },
    {
      "id": "more-practice-and-leadership",
      "title": "More engineering practice and leadership",
      "kind": "extension",
      "courses": [
        "project-management",
        "technical-communication",
        "software-engineering-practices",
        "agentic-coding",
        "software-product-engineering",
        "engineering-management"
      ]
    },
    {
      "id": "ai-and-agents",
      "title": "AI apps and agents",
      "kind": "extension",
      "courses": [
        "creating-ai-powered-apps",
        "agentic-ai",
        "the-agent-loop",
        "agent-tools-and-mcp",
        "agent-context-and-memory",
        "agent-permissions-and-sandboxing",
        "agent-orchestration-subagents-and-observability",
        "capstone-build-your-own-coding-agent",
        "capstone-build-your-own-pentest-engine"
      ]
    },
    {
      "id": "integrative-capstones",
      "title": "Integrative capstones",
      "kind": "extension",
      "courses": [
        "capstone-first-working-software",
        "capstone-full-stack-app",
        "capstone-data-pipeline",
        "capstone-solid-core",
        "capstone-real-world-delivery",
        "capstone-lead-at-altitude"
      ]
    }
  ]
}
```
