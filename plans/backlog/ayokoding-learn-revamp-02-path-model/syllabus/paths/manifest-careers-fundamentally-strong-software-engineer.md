# Manifest — `careers/fundamentally-strong/software-engineer`

**Path title**: Fundamentally Strong Software Engineer · **Arc**: `fundamentally-strong` · **File**:
`apps/ayokoding-www/src/features/course-paths/manifests/careers/fundamentally-strong/software-engineer.json` · **Courses before and after**: 121

This file specifies the target manifest. The JSON below is the exact file body Phase 3 writes. The
reading tables repeat the same data with position numbers.

## Phases and Outcomes

- **Description:** For engineers who want strong fundamentals: from first programs through computer science depth to a solid-core capstone.
- **Goals:** `capstone-solid-core`
- **Assumes:** none
- **Courses:** 121 total; 24 core; 97 extension

| Phase ID                               | Title                                      | Kind      | Positions | Courses in order                                                                                                                                                                                                                                                                                           |
| -------------------------------------- | ------------------------------------------ | --------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `programming-foundations`              | Programming foundations                    | core      | 1–4       | `just-enough-python`, `just-enough-bash`, `data-structures-and-algorithms-essentials`, `object-oriented-programming-essentials`                                                                                                                                                                            |
| `first-working-software`               | Building working software                  | core      | 5–12      | `sql-essentials`, `backend-essentials`, `networking-essentials`, `just-enough-typescript`, `frontend-essentials`, `software-testing`, `security-essentials`, `capstone-first-working-software`                                                                                                             |
| `computer-science-depth`               | Computer science depth                     | core      | 13–19     | `computer-science-foundations`, `object-oriented-design-and-patterns`, `programming-paradigms`, `functional-programming`, `concurrency-and-parallelism`, `advanced-algorithms`, `advanced-sql-and-query-performance`                                                                                       |
| `practice-and-leadership`              | Engineering practice and leadership        | core      | 20–23     | `project-management`, `software-engineering-practices`, `software-product-engineering`, `engineering-management`                                                                                                                                                                                           |
| `solid-core-capstone`                  | Solid-core capstone                        | core      | 24        | `capstone-solid-core`                                                                                                                                                                                                                                                                                      |
| `editor-and-shell`                     | Editor and shell workflow                  | extension | 25–29     | `just-enough-nvim`, `just-enough-lua`, `extending-neovim`, `capstone-forge-ready`, `version-control-and-git`                                                                                                                                                                                               |
| `more-languages`                       | More programming languages                 | extension | 30–38     | `just-enough-c`, `just-enough-cpp`, `just-enough-go`, `just-enough-rust`, `just-enough-java`, `just-enough-kotlin`, `just-enough-swift`, `just-enough-csharp`, `just-enough-dart`                                                                                                                          |
| `systems-and-tooling`                  | Operating systems and developer tooling    | extension | 39–46     | `linux-os`, `windows-os`, `system-programming`, `modern-system-programming`, `build-your-own-git`, `building-production-cli-tools`, `build-automation-and-task-runners`, `debugging-and-profiling`                                                                                                         |
| `apps-and-interfaces`                  | Web, mobile, and desktop apps              | extension | 47–56     | `advanced-frontend`, `build-your-own-reactive-ui`, `information-architecture-and-seo`, `analytics-and-experimentation`, `android-app-development`, `ios-app-development`, `hybrid-app-development`, `windows-app-development`, `linux-app-development`, `browser-automation-with-cdp`                      |
| `backend-depth`                        | Backend depth                              | extension | 57–60     | `async-python-and-fastapi-services`, `api-design`, `build-your-own-web-framework`, `backend-at-scale`                                                                                                                                                                                                      |
| `data-and-databases`                   | Data and databases                         | extension | 61–68     | `nosql-databases`, `graph-databases`, `search-and-information-retrieval`, `data-access-orms-and-query-builders`, `build-your-own-orm-and-query-builder`, `database-internals-and-storage-engines`, `build-your-own-database`, `data-engineering`                                                           |
| `infrastructure-and-operations`        | Networking, infrastructure, and operations | extension | 69–76     | `advanced-networking`, `self-hosting-essentials`, `containers-and-orchestration`, `cloud-and-iac`, `cicd-and-release-engineering`, `bare-metal-virtualization`, `platform-engineering-and-devex`, `self-managed-kubernetes-and-gitops`                                                                     |
| `more-computer-science`                | More computer science                      | extension | 77–85     | `computer-architecture`, `csp-style-concurrency`, `just-enough-elixir`, `actor-model-concurrency`, `lisp`, `just-enough-fsharp`, `type-systems`, `compilers-parsers-and-transpilers`, `capstone-concurrency-showdown` (outline)                                                                            |
| `architecture-and-distributed-systems` | Architecture and distributed systems       | extension | 86–94     | `software-architecture`, `enterprise-java-and-the-jvm`, `domain-driven-design`, `event-driven-architecture`, `system-design`, `distributed-systems`, `build-your-own-raft`, `site-reliability-engineering`, `capstone-concurrency-and-systems` (outline)                                                   |
| `security`                             | Security                                   | extension | 95–101    | `it-and-application-security`, `offensive-security`, `defensive-security`, `detection-engineering-and-siem-operations`, `vulnerability-management-and-assessment`, `it-governance-grc`, `capstone-secure-service` (outline)                                                                                |
| `more-practice-and-leadership`         | More engineering practice and leadership   | extension | 102–103   | `technical-communication`, `agentic-coding`                                                                                                                                                                                                                                                                |
| `ai-and-agents`                        | AI apps and agents                         | extension | 104–112   | `creating-ai-powered-apps`, `agentic-ai`, `the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-orchestration-subagents-and-observability`, `capstone-build-your-own-coding-agent` (outline), `capstone-build-your-own-pentest-engine` (outline) |
| `interview-preparation`                | Interview preparation                      | extension | 113–117   | `coding-interview`, `take-home-and-live-coding`, `system-design-interview`, `behavioral-and-leadership-interviews`, `capstone-interview-loop`                                                                                                                                                              |
| `integrative-capstones`                | Integrative capstones                      | extension | 118–121   | `capstone-full-stack-app`, `capstone-data-pipeline` (outline), `capstone-real-world-delivery` (outline), `capstone-lead-at-altitude` (outline)                                                                                                                                                             |

| Core phase                | After this phase you can …                                                                                    | You cannot yet …                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `programming-foundations` | write Python and shell scripts, choose suitable data structures, and model code with classes                  | build software that stores data or serves users   |
| `first-working-software`  | build, test, and secure a small working app with a database, an API, and a UI                                 | explain the theory underneath the code you wrote  |
| `computer-science-depth`  | reason about computation, design patterns, paradigms, concurrency, advanced algorithms, and query performance | lead how a team plans, builds, and ships software |
| `practice-and-leadership` | plan delivery, run review and release practices, make product trade-offs, and support a team                  | show all of this in one integrated project        |
| `solid-core-capstone`     | prove your fundamentals in one integrated project                                                             | specialise; pick an optional extension for that   |

## Target JSON

```json
{
  "pathId": "careers/fundamentally-strong/software-engineer",
  "arc": "fundamentally-strong",
  "title": "Fundamentally Strong Software Engineer",
  "description": "For engineers who want strong fundamentals: from first programs through computer science depth to a solid-core capstone.",
  "goals": ["capstone-solid-core"],
  "assumes": [],
  "phases": [
    {
      "id": "programming-foundations",
      "title": "Programming foundations",
      "kind": "core",
      "outcome": {
        "can": "write Python and shell scripts, choose suitable data structures, and model code with classes",
        "cannotYet": "build software that stores data or serves users"
      },
      "courses": [
        "just-enough-python",
        "just-enough-bash",
        "data-structures-and-algorithms-essentials",
        "object-oriented-programming-essentials"
      ]
    },
    {
      "id": "first-working-software",
      "title": "Building working software",
      "kind": "core",
      "outcome": {
        "can": "build, test, and secure a small working app with a database, an API, and a UI",
        "cannotYet": "explain the theory underneath the code you wrote"
      },
      "courses": [
        "sql-essentials",
        "backend-essentials",
        "networking-essentials",
        "just-enough-typescript",
        "frontend-essentials",
        "software-testing",
        "security-essentials",
        "capstone-first-working-software"
      ]
    },
    {
      "id": "computer-science-depth",
      "title": "Computer science depth",
      "kind": "core",
      "outcome": {
        "can": "reason about computation, design patterns, paradigms, concurrency, advanced algorithms, and query performance",
        "cannotYet": "lead how a team plans, builds, and ships software"
      },
      "courses": [
        "computer-science-foundations",
        "object-oriented-design-and-patterns",
        "programming-paradigms",
        "functional-programming",
        "concurrency-and-parallelism",
        "advanced-algorithms",
        "advanced-sql-and-query-performance"
      ]
    },
    {
      "id": "practice-and-leadership",
      "title": "Engineering practice and leadership",
      "kind": "core",
      "outcome": {
        "can": "plan delivery, run review and release practices, make product trade-offs, and support a team",
        "cannotYet": "show all of this in one integrated project"
      },
      "courses": [
        "project-management",
        "software-engineering-practices",
        "software-product-engineering",
        "engineering-management"
      ]
    },
    {
      "id": "solid-core-capstone",
      "title": "Solid-core capstone",
      "kind": "core",
      "outcome": {
        "can": "prove your fundamentals in one integrated project",
        "cannotYet": "specialise; pick an optional extension for that"
      },
      "courses": ["capstone-solid-core"]
    },
    {
      "id": "editor-and-shell",
      "title": "Editor and shell workflow",
      "kind": "extension",
      "courses": [
        "just-enough-nvim",
        "just-enough-lua",
        "extending-neovim",
        "capstone-forge-ready",
        "version-control-and-git"
      ]
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
        "windows-os",
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
        "computer-architecture",
        "csp-style-concurrency",
        "just-enough-elixir",
        "actor-model-concurrency",
        "lisp",
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
      "courses": ["technical-communication", "agentic-coding"]
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
      "id": "interview-preparation",
      "title": "Interview preparation",
      "kind": "extension",
      "courses": [
        "coding-interview",
        "take-home-and-live-coding",
        "system-design-interview",
        "behavioral-and-leadership-interviews",
        "capstone-interview-loop"
      ]
    },
    {
      "id": "integrative-capstones",
      "title": "Integrative capstones",
      "kind": "extension",
      "courses": [
        "capstone-full-stack-app",
        "capstone-data-pipeline",
        "capstone-real-world-delivery",
        "capstone-lead-at-altitude"
      ]
    }
  ]
}
```
