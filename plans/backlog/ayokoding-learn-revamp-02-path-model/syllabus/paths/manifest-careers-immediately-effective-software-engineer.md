# Manifest — `careers/immediately-effective/software-engineer`

**Path title**: Immediately Effective Software Engineer · **Arc**: `immediately-effective` · **File**:
`apps/ayokoding-www/src/features/course-paths/manifests/careers/immediately-effective/software-engineer.json` · **Courses before and after**: 114

This file specifies the target manifest. The JSON below is the exact file body Phase 3 writes. The
reading tables repeat the same data with position numbers.

## Phases and Outcomes

- **Description:** For new engineers who want to ship: set up your editor, then build a tested full-stack app; deeper topics are optional.
- **Goals:** `capstone-forge-ready`, `capstone-full-stack-app`
- **Assumes:** none
- **Courses:** 114 total; 13 core; 101 extension

| Phase ID                               | Title                                      | Kind      | Positions | Courses in order                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------ | --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `your-editor`                          | Set up your editor                         | core      | 1–4       | `just-enough-nvim`, `just-enough-lua`, `extending-neovim`, `capstone-forge-ready`                                                                                                                                                                                                                                                                                                                       |
| `python-and-backend`                   | Python, data, and the backend              | core      | 5–8       | `just-enough-python`, `sql-essentials`, `backend-essentials`, `networking-essentials`                                                                                                                                                                                                                                                                                                                   |
| `frontend-and-quality`                 | Frontend, testing, and security            | core      | 9–12      | `just-enough-typescript`, `frontend-essentials`, `software-testing`, `security-essentials`                                                                                                                                                                                                                                                                                                              |
| `full-stack-capstone`                  | Full-stack capstone                        | core      | 13        | `capstone-full-stack-app`                                                                                                                                                                                                                                                                                                                                                                               |
| `editor-and-shell`                     | Editor and shell workflow                  | extension | 14–15     | `just-enough-bash`, `version-control-and-git`                                                                                                                                                                                                                                                                                                                                                           |
| `programming-fundamentals`             | Programming fundamentals                   | extension | 16–17     | `data-structures-and-algorithms-essentials`, `object-oriented-programming-essentials`                                                                                                                                                                                                                                                                                                                   |
| `more-languages`                       | More programming languages                 | extension | 18–26     | `just-enough-c`, `just-enough-cpp`, `just-enough-go`, `just-enough-rust`, `just-enough-java`, `just-enough-kotlin`, `just-enough-swift`, `just-enough-csharp`, `just-enough-dart`                                                                                                                                                                                                                       |
| `systems-and-tooling`                  | Operating systems and developer tooling    | extension | 27–33     | `linux-os`, `system-programming`, `modern-system-programming`, `build-your-own-git`, `building-production-cli-tools`, `build-automation-and-task-runners`, `debugging-and-profiling`                                                                                                                                                                                                                    |
| `apps-and-interfaces`                  | Web, mobile, and desktop apps              | extension | 34–43     | `advanced-frontend`, `build-your-own-reactive-ui`, `information-architecture-and-seo`, `analytics-and-experimentation`, `android-app-development`, `ios-app-development`, `hybrid-app-development`, `windows-app-development`, `linux-app-development`, `browser-automation-with-cdp`                                                                                                                   |
| `backend-depth`                        | Backend depth                              | extension | 44–47     | `async-python-and-fastapi-services`, `api-design`, `build-your-own-web-framework`, `backend-at-scale`                                                                                                                                                                                                                                                                                                   |
| `data-and-databases`                   | Data and databases                         | extension | 48–56     | `nosql-databases`, `graph-databases`, `search-and-information-retrieval`, `advanced-sql-and-query-performance`, `data-access-orms-and-query-builders`, `build-your-own-orm-and-query-builder`, `database-internals-and-storage-engines`, `build-your-own-database`, `data-engineering`                                                                                                                  |
| `infrastructure-and-operations`        | Networking, infrastructure, and operations | extension | 57–64     | `advanced-networking`, `self-hosting-essentials`, `containers-and-orchestration`, `cloud-and-iac`, `cicd-and-release-engineering`, `bare-metal-virtualization`, `platform-engineering-and-devex`, `self-managed-kubernetes-and-gitops`                                                                                                                                                                  |
| `more-computer-science`                | More computer science                      | extension | 65–78     | `computer-science-foundations`, `computer-architecture`, `object-oriented-design-and-patterns`, `programming-paradigms`, `functional-programming`, `concurrency-and-parallelism`, `advanced-algorithms`, `csp-style-concurrency`, `just-enough-elixir`, `actor-model-concurrency`, `just-enough-fsharp`, `type-systems`, `compilers-parsers-and-transpilers`, `capstone-concurrency-showdown` (outline) |
| `architecture-and-distributed-systems` | Architecture and distributed systems       | extension | 79–87     | `software-architecture`, `enterprise-java-and-the-jvm`, `domain-driven-design`, `event-driven-architecture`, `system-design`, `distributed-systems`, `build-your-own-raft`, `site-reliability-engineering`, `capstone-concurrency-and-systems` (outline)                                                                                                                                                |
| `security`                             | Security                                   | extension | 88–94     | `it-and-application-security`, `offensive-security`, `defensive-security`, `detection-engineering-and-siem-operations`, `vulnerability-management-and-assessment`, `it-governance-grc`, `capstone-secure-service` (outline)                                                                                                                                                                             |
| `more-practice-and-leadership`         | More engineering practice and leadership   | extension | 95–100    | `project-management`, `technical-communication`, `software-engineering-practices`, `agentic-coding`, `software-product-engineering`, `engineering-management`                                                                                                                                                                                                                                           |
| `ai-and-agents`                        | AI apps and agents                         | extension | 101–109   | `creating-ai-powered-apps`, `agentic-ai`, `the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-orchestration-subagents-and-observability`, `capstone-build-your-own-coding-agent` (outline), `capstone-build-your-own-pentest-engine` (outline)                                                                                              |
| `integrative-capstones`                | Integrative capstones                      | extension | 110–114   | `capstone-first-working-software`, `capstone-data-pipeline` (outline), `capstone-solid-core`, `capstone-real-world-delivery` (outline), `capstone-lead-at-altitude` (outline)                                                                                                                                                                                                                           |

| Core phase             | After this phase you can …                                                                | You cannot yet …                                           |
| ---------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `your-editor`          | edit code quickly in Neovim and shape it with your own Lua configuration                  | build a program                                            |
| `python-and-backend`   | write Python, store data with SQL, and serve a small JSON API                             | build the browser side of an app                           |
| `frontend-and-quality` | build a typed browser UI, test both sides of an app, and apply baseline security controls | ship a complete full-stack app                             |
| `full-stack-capstone`  | ship a tested, secured full-stack app from database to browser                            | design for large scale; the optional extensions cover that |

## Target JSON

```json
{
  "pathId": "careers/immediately-effective/software-engineer",
  "arc": "immediately-effective",
  "title": "Immediately Effective Software Engineer",
  "description": "For new engineers who want to ship: set up your editor, then build a tested full-stack app; deeper topics are optional.",
  "goals": ["capstone-forge-ready", "capstone-full-stack-app"],
  "assumes": [],
  "phases": [
    {
      "id": "your-editor",
      "title": "Set up your editor",
      "kind": "core",
      "outcome": {
        "can": "edit code quickly in Neovim and shape it with your own Lua configuration",
        "cannotYet": "build a program"
      },
      "courses": ["just-enough-nvim", "just-enough-lua", "extending-neovim", "capstone-forge-ready"]
    },
    {
      "id": "python-and-backend",
      "title": "Python, data, and the backend",
      "kind": "core",
      "outcome": {
        "can": "write Python, store data with SQL, and serve a small JSON API",
        "cannotYet": "build the browser side of an app"
      },
      "courses": ["just-enough-python", "sql-essentials", "backend-essentials", "networking-essentials"]
    },
    {
      "id": "frontend-and-quality",
      "title": "Frontend, testing, and security",
      "kind": "core",
      "outcome": {
        "can": "build a typed browser UI, test both sides of an app, and apply baseline security controls",
        "cannotYet": "ship a complete full-stack app"
      },
      "courses": ["just-enough-typescript", "frontend-essentials", "software-testing", "security-essentials"]
    },
    {
      "id": "full-stack-capstone",
      "title": "Full-stack capstone",
      "kind": "core",
      "outcome": {
        "can": "ship a tested, secured full-stack app from database to browser",
        "cannotYet": "design for large scale; the optional extensions cover that"
      },
      "courses": ["capstone-full-stack-app"]
    },
    {
      "id": "editor-and-shell",
      "title": "Editor and shell workflow",
      "kind": "extension",
      "courses": ["just-enough-bash", "version-control-and-git"]
    },
    {
      "id": "programming-fundamentals",
      "title": "Programming fundamentals",
      "kind": "extension",
      "courses": ["data-structures-and-algorithms-essentials", "object-oriented-programming-essentials"]
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
        "just-enough-csharp",
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
        "advanced-frontend",
        "build-your-own-reactive-ui",
        "information-architecture-and-seo",
        "analytics-and-experimentation",
        "android-app-development",
        "ios-app-development",
        "hybrid-app-development",
        "windows-app-development",
        "linux-app-development",
        "browser-automation-with-cdp"
      ]
    },
    {
      "id": "backend-depth",
      "title": "Backend depth",
      "kind": "extension",
      "courses": ["async-python-and-fastapi-services", "api-design", "build-your-own-web-framework", "backend-at-scale"]
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
        "advanced-algorithms",
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
        "capstone-data-pipeline",
        "capstone-solid-core",
        "capstone-real-world-delivery",
        "capstone-lead-at-altitude"
      ]
    }
  ]
}
```
