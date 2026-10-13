# 003 — Category Taxonomy and Course Mapping

This file holds every value the backfill writes, except `estimatedHours`, whose authoritative values
come from the drift test at execution time ([004](./004-estimated-hours-and-start-target.md)). The
hours shown in the tables below are the 2026-10-09 snapshot, so a reviewer can see the scale.

## The 14 Categories

Categories are a code constant, `COURSE_CATEGORIES`, in
`apps/ayokoding-www/src/features/content/core/course-categories.ts`. The order below is the display
order on the catalog page and in the sidebar. It runs roughly from the first things a new learner
needs (tools, a language) to specialist domains (accounting, ERP).

| Order | `id`                                   | Label (en)                           | Label (id)                          | One-line blurb (en)                                                               | Courses | Outline |
| ----- | -------------------------------------- | ------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------- | ------- | ------- |
| 1     | `tools-and-practices`                  | Tools and practices                  | Alat dan praktik                    | Editors, Git, testing, debugging, and everyday engineering habits.                | 11      | 0       |
| 2     | `programming-languages`                | Programming languages                | Bahasa pemrograman                  | Short primers that make you productive in one language.                           | 16      | 0       |
| 3     | `computer-science`                     | Computer science                     | Ilmu komputer                       | Algorithms, paradigms, type systems, compilers, and concurrency models.           | 13      | 1       |
| 4     | `application-development`              | Application development              | Pengembangan aplikasi               | Build web, backend, mobile, and desktop applications.                             | 17      | 0       |
| 5     | `data-and-databases`                   | Data and databases                   | Data dan basis data                 | Store, query, search, and move data reliably.                                     | 11      | 1       |
| 6     | `systems-and-networking`               | Systems and networking               | Sistem dan jaringan                 | How hardware, operating systems, and networks run your code.                      | 7       | 0       |
| 7     | `architecture-and-distributed-systems` | Architecture and distributed systems | Arsitektur dan sistem terdistribusi | Design systems that stay easy to change and survive failure.                      | 8       | 1       |
| 8     | `infrastructure-and-operations`        | Infrastructure and operations        | Infrastruktur dan operasi           | Containers, cloud, delivery pipelines, and running services in production.        | 9       | 1       |
| 9     | `security`                             | Security                             | Keamanan                            | Find, fix, detect, and govern security problems.                                  | 9       | 2       |
| 10    | `ai-engineering`                       | AI engineering                       | Rekayasa AI                         | Build, evaluate, and run software that uses AI models and agents.                 | 15      | 1       |
| 11    | `product-and-leadership`               | Product and leadership               | Produk dan kepemimpinan             | Product thinking, project management, communication, and leading teams.           | 6       | 1       |
| 12    | `interview-preparation`                | Interview preparation                | Persiapan wawancara                 | Prepare for coding, system design, and behavioral interviews.                     | 5       | 0       |
| 13    | `accounting`                           | Accounting                           | Akuntansi                           | Conventional and Sharia accounting for engineers who build financial systems.     | 24      | 24      |
| 14    | `erp-systems`                          | ERP systems                          | Sistem ERP                          | Enterprise resource planning: how business systems record and connect operations. | 30      | 30      |
|       |                                        |                                      |                                     | **Total**                                                                         | **181** | **62**  |

```ts
// shape of each entry
export interface CourseCategory {
  id: (typeof COURSE_CATEGORY_IDS)[number];
  order: number; // 1-14, display order
  labelKey: TranslationKey; // e.g. "courseCategoryDataAndDatabases"
  blurbKey: TranslationKey; // e.g. "courseCategoryDataAndDatabasesBlurb"
}
```

Labels and blurbs are translation keys (see [005](./005-ui-components-and-copy.md#translation-keys)),
so the `id` dictionary stays complete even though `content/id/` has no courses today.

### Mapping rules

1. **Exactly one category per course.** A course that fits two areas goes where a learner would look
   first for it. Examples: `sql-essentials` is under Data and databases, not Programming languages;
   `api-design` is under Application development, not Architecture.
2. **Capstones go to their theme**, not to a "Capstones" bucket: `capstone-data-pipeline` is under
   Data and databases; `capstone-interview-loop` is under Interview preparation.
3. **Sharia accounting and Sharia ERP** courses stay inside Accounting and ERP systems. The skills
   paths already separate conventional and Sharia tracks; the catalog groups by subject.
4. **Just Enough Nvim** is under Tools and practices (it teaches an editor, not a language). The
   other `just-enough-*` primers and `lisp` are under Programming languages.

## Formats

| `format` value               | Label (en)                   | Label (id)                    | Meaning                                                                  | Count |
| ---------------------------- | ---------------------------- | ----------------------------- | ------------------------------------------------------------------------ | ----- |
| `by-example`                 | Code by example              | Belajar lewat contoh kode     | Annotated code examples, by-example tutorial mode.                       | 74    |
| `primer`                     | Language primer              | Primer bahasa                 | A `just-enough-*` style language primer.                                 | 16    |
| `annotated-concept`          | Concept walkthrough          | Penjelasan konsep             | Concept-centric worked examples with code, standard mode.                | 17    |
| `annotated-concept-no-code`  | Concept walkthrough, no code | Penjelasan konsep, tanpa kode | The no-code sub-mode for leadership and governance topics.               | 7     |
| `in-the-field`               | In the field                 | Di lapangan                   | Production-grade implementation guides. No course uses it on 2026-10-09. | 0     |
| `capstone`                   | Capstone project             | Proyek capstone               | An integration project that combines earlier courses.                    | 5     |
| (omitted, `status: outline`) | Shown as the Outline badge   | Shown as the Outline badge    | Not written yet; plans 06–08 choose the format when they write it.       | 62    |

**Backfill rule** (applied in this order; it produced the `format` column below):

1. A course with `status: outline` gets no `format`.
2. A course whose `learning/overview.md` calls itself a "leadership no-code sub-mode" topic gets
   `annotated-concept-no-code`. On 2026-10-09 these are 7: `engineering-management`,
   `it-governance-grc`, `platform-engineering-and-devex`,
   `product-patterns-for-probabilistic-systems`, `project-management`, `software-product-engineering`,
   `technical-communication`.
3. A course whose slug starts with `capstone-` gets `capstone` (5 non-outline capstones:
   `capstone-first-working-software`, `capstone-forge-ready`, `capstone-full-stack-app`,
   `capstone-interview-loop`, `capstone-solid-core`).
4. Every other course takes its latest `**Format**` record in the archived syllabus files
   `plans/done/*/syllabus/courses/<slug>.md`: "By Example" → `by-example`, "Primer" → `primer`,
   "Annotated-concept" or "Annotated-Concept" → `annotated-concept`. All 107 remaining courses have
   such a record.

Why not derive the format from the folder layout? On 2026-10-09 a layout rule (example headings,
`code/` folders) disagreed with the recorded designation for 39 courses, so it is not reliable. See
[007 D2](./007-decision-records.md#d2--format-as-a-frontmatter-field).

## Description Rubric

- One sentence, 20–120 characters, ending with a period. The drafts below are 51–89 characters.
- Plain English for a bootcamp graduate. Start with a verb when possible ("Build", "Learn", "Design").
- Say what the learner can do after the course, not how the course is organized.
- No catalogue numbers, no `·`, no internal plan terms ("Pass 1", "topic 11", "DD-17", "Dangerous 1").
- Sharia courses describe system behaviour only and state no ruling (series decision 19).
- The executor may fix a typo or grammar while backfilling, but a change of meaning is reviewed in
  the PR.

## The 181-Row Mapping

Columns: the course directory name; the `format` value; the 2026-10-09 `estimatedHours` snapshot
(the drift test supplies the final value); the number of path manifests that list the course today;
the `description` to write. All 181 courses are used by at least one path.

### Tools and practices (`tools-and-practices`, 11 courses)

| Course slug                         | `format`            | `estimatedHours` | Paths | `description`                                                                          |
| ----------------------------------- | ------------------- | ---------------- | ----- | -------------------------------------------------------------------------------------- |
| `browser-automation-with-cdp`       | `by-example`        | 2                | 4     | Drive a real browser through the Chrome DevTools Protocol, one command at a time.      |
| `build-automation-and-task-runners` | `by-example`        | 2                | 3     | Declare build inputs and tasks so a tool reruns only what changed.                     |
| `build-your-own-git`                | `by-example`        | 1                | 3     | Rebuild Git's objects, refs, and index in Python to see how it really works.           |
| `building-production-cli-tools`     | `by-example`        | 2                | 3     | Build command-line tools in Go and Rust that people and scripts can rely on.           |
| `capstone-forge-ready`              | `capstone`          | 1                | 3     | Set up a reproducible Neovim development environment and prove you can work in it.     |
| `debugging-and-profiling`           | `by-example`        | 15               | 3     | Find bugs with a method instead of guessing, and measure where code is slow.           |
| `extending-neovim`                  | `by-example`        | 6                | 3     | Turn Neovim into a reproducible editor with Lua config, plugins, and language servers. |
| `just-enough-nvim`                  | `primer`            | 4                | 3     | Learn modal editing in Neovim from scratch; no programming experience needed.          |
| `software-engineering-practices`    | `annotated-concept` | 5                | 3     | Use code review, automated checks, and team habits that keep a codebase healthy.       |
| `software-testing`                  | `by-example`        | 8                | 4     | Write unit, integration, and end-to-end tests that keep working code working.          |
| `version-control-and-git`           | `by-example`        | 7                | 3     | Track changes, branch, merge, and share work safely with Git.                          |

### Programming languages (`programming-languages`, 16 courses)

| Course slug              | `format`     | `estimatedHours` | Paths | `description`                                                                          |
| ------------------------ | ------------ | ---------------- | ----- | -------------------------------------------------------------------------------------- |
| `just-enough-bash`       | `primer`     | 4                | 3     | Write shell scripts with pipes, redirection, and small composable commands.            |
| `just-enough-c`          | `primer`     | 4                | 3     | Learn the small part of C you need for systems courses: pointers, memory, and builds.  |
| `just-enough-cpp`        | `primer`     | 4                | 3     | Move from C to modern C++ with RAII, classes, the standard library, and templates.     |
| `just-enough-csharp`     | `primer`     | 3                | 2     | Get productive in C# and .NET before building a Windows desktop app.                   |
| `just-enough-dart`       | `primer`     | 2                | 3     | Learn the Dart you need for Flutter: types, null safety, classes, and async code.      |
| `just-enough-elixir`     | `primer`     | 1                | 3     | Learn Elixir values, pattern matching, and recursion before actor-model concurrency.   |
| `just-enough-fsharp`     | `primer`     | 1                | 3     | Learn F# records, unions, and pattern matching for functional-first code.              |
| `just-enough-go`         | `primer`     | 3                | 3     | Learn Go packages, types, errors, and tooling before Go concurrency.                   |
| `just-enough-java`       | `primer`     | 1                | 3     | Learn modern Java syntax, records, collections, and streams before enterprise Java.    |
| `just-enough-kotlin`     | `primer`     | 1                | 3     | Learn Kotlin null safety, functions, and classes before Android development.           |
| `just-enough-lua`        | `primer`     | 4                | 3     | Learn the Lua you need to configure and extend Neovim.                                 |
| `just-enough-python`     | `primer`     | 4                | 4     | Learn Python as your everyday language for scripts, tests, and small services.         |
| `just-enough-rust`       | `primer`     | 2                | 3     | Learn Rust ownership, borrowing, traits, and Cargo before systems programming in Rust. |
| `just-enough-swift`      | `primer`     | 1                | 3     | Learn Swift optionals, structs, and enums before iOS development.                      |
| `just-enough-typescript` | `primer`     | 4                | 3     | Add types to JavaScript so many bugs show up before the code runs.                     |
| `lisp`                   | `by-example` | 1                | 1     | See how code can be data, with Scheme macros and a short look at Clojure.              |

### Computer science (`computer-science`, 13 courses)

| Course slug                                 | `format`            | `estimatedHours`  | Paths | `description`                                                                      |
| ------------------------------------------- | ------------------- | ----------------- | ----- | ---------------------------------------------------------------------------------- |
| `actor-model-concurrency`                   | `by-example`        | 2                 | 3     | Build fault-tolerant concurrent programs with Elixir processes and supervisors.    |
| `advanced-algorithms`                       | `by-example`        | 14                | 3     | Solve hard problems with graphs, dynamic programming, and other proven techniques. |
| `capstone-concurrency-showdown`             | omitted (outline)   | omitted (outline) | 3     | Solve one concurrency problem twice, in Go and in Elixir, and compare the results. |
| `compilers-parsers-and-transpilers`         | `by-example`        | 1                 | 3     | Build a lexer, parser, and code generator for a small language.                    |
| `computer-science-foundations`              | `annotated-concept` | 5                 | 3     | Understand number representation, automata, and the limits of computation.         |
| `concurrency-and-parallelism`               | `by-example`        | 12                | 3     | Run work at the same time with threads and async code without corrupting state.    |
| `csp-style-concurrency`                     | `by-example`        | 5                 | 3     | Coordinate Go goroutines with channels, bounded work, and clear cancellation.      |
| `data-structures-and-algorithms-essentials` | `by-example`        | 8                 | 4     | Pick the right data structure and algorithm, and reason about their cost.          |
| `functional-programming`                    | `by-example`        | 10                | 3     | Write pure functions, avoid shared mutable state, and compose small pieces.        |
| `object-oriented-design-and-patterns`       | `by-example`        | 14                | 3     | Apply SOLID principles and design patterns to keep code easy to change.            |
| `object-oriented-programming-essentials`    | `by-example`        | 8                 | 3     | Use classes, encapsulation, and polymorphism to keep objects valid.                |
| `programming-paradigms`                     | `by-example`        | 10                | 3     | Compare imperative, functional, logic, and declarative styles of programming.      |
| `type-systems`                              | `by-example`        | 1                 | 3     | Use algebraic data types and type inference to make wrong states hard to write.    |

### Application development (`application-development`, 17 courses)

| Course slug                         | `format`            | `estimatedHours` | Paths | `description`                                                                       |
| ----------------------------------- | ------------------- | ---------------- | ----- | ----------------------------------------------------------------------------------- |
| `advanced-frontend`                 | `by-example`        | 8                | 3     | Make web UIs fast, accessible, and maintainable as they grow.                       |
| `android-app-development`           | `by-example`        | 3                | 3     | Build native Android apps in Kotlin that survive lifecycle and permission changes.  |
| `api-design`                        | `by-example`        | 8                | 3     | Design web APIs that other teams can depend on without breaking changes.            |
| `async-python-and-fastapi-services` | `by-example`        | 6                | 3     | Build typed async Python services with FastAPI that handle slow I/O well.           |
| `backend-at-scale`                  | `by-example`        | 7                | 4     | Keep a backend correct under heavy load, retries, and partial failure.              |
| `backend-essentials`                | `by-example`        | 13               | 3     | Build an HTTP backend that stores data and serves many clients.                     |
| `build-your-own-reactive-ui`        | `by-example`        | 6                | 3     | Build a small reactive UI library two ways: a virtual DOM and signals.              |
| `build-your-own-web-framework`      | `by-example`        | 2                | 3     | Build a small web framework core: routing, middleware, and error handling.          |
| `capstone-first-working-software`   | `capstone`          | 2                | 3     | Ship a small, tested habit-tracker app with a Python API and a SQLite database.     |
| `capstone-full-stack-app`           | `capstone`          | 2                | 3     | Connect a typed frontend to a backend and database in one working app.              |
| `enterprise-java-and-the-jvm`       | `by-example`        | 2                | 3     | Build layered Spring Boot services and understand the JVM they run on.              |
| `frontend-essentials`               | `by-example`        | 10               | 4     | Build interactive web pages where the UI is a function of state.                    |
| `hybrid-app-development`            | `by-example`        | 2                | 3     | Ship one Flutter app to mobile and desktop from a single Dart codebase.             |
| `information-architecture-and-seo`  | `annotated-concept` | 1                | 3     | Structure web content so people, search engines, and screen readers can use it.     |
| `ios-app-development`               | `by-example`        | 1                | 3     | Build native iOS apps in Swift with SwiftUI, view models, and async data.           |
| `linux-app-development`             | `by-example`        | 2                | 2     | Write Linux programs in Python that respect arguments, streams, files, and signals. |
| `windows-app-development`           | `by-example`        | 6                | 2     | Build responsive Windows desktop apps in C# with the MVVM pattern.                  |

### Data and databases (`data-and-databases`, 11 courses)

| Course slug                              | `format`            | `estimatedHours`  | Paths | `description`                                                                       |
| ---------------------------------------- | ------------------- | ----------------- | ----- | ----------------------------------------------------------------------------------- |
| `advanced-sql-and-query-performance`     | `by-example`        | 16                | 3     | Read query plans and use indexes to make slow SQL fast.                             |
| `build-your-own-database`                | `by-example`        | 2                 | 3     | Build a small database with pages, an index, a write-ahead log, and crash recovery. |
| `build-your-own-orm-and-query-builder`   | `by-example`        | 12                | 3     | Build a small ORM and query builder to see what the real ones do.                   |
| `capstone-data-pipeline`                 | omitted (outline)   | omitted (outline) | 3     | Build a data pipeline from raw ingestion to quality checks and a query interface.   |
| `data-access-orms-and-query-builders`    | `by-example`        | 11                | 3     | Use ORMs and query builders safely and avoid hidden extra queries.                  |
| `data-engineering`                       | `annotated-concept` | 5                 | 4     | Build data pipelines that rerun safely and catch bad data early.                    |
| `database-internals-and-storage-engines` | `by-example`        | 13                | 3     | Learn how B-trees, LSM-trees, and write-ahead logs store and protect data.          |
| `graph-databases`                        | `by-example`        | 7                 | 3     | Model and query connected data when relationships are the real question.            |
| `nosql-databases`                        | `by-example`        | 10                | 3     | Choose document, key-value, or column stores to match how data is read.             |
| `search-and-information-retrieval`       | `by-example`        | 15                | 3     | Build full-text search with inverted indexes and relevance ranking.                 |
| `sql-essentials`                         | `by-example`        | 8                 | 3     | Model data in tables and query it with joins, filters, and aggregates.              |

### Systems and networking (`systems-and-networking`, 7 courses)

| Course slug                 | `format`            | `estimatedHours` | Paths | `description`                                                              |
| --------------------------- | ------------------- | ---------------- | ----- | -------------------------------------------------------------------------- |
| `advanced-networking`       | `annotated-concept` | 5                | 3     | Debug real network problems with load balancers, proxies, and TLS.         |
| `computer-architecture`     | `by-example`        | 16               | 4     | Learn how CPUs, caches, and memory decide how fast your code really runs.  |
| `linux-os`                  | `by-example`        | 3                | 3     | Explore Linux processes, system calls, file systems, and signals hands-on. |
| `modern-system-programming` | `by-example`        | 2                | 3     | Write safe, fast systems code in Rust, side by side with the C course.     |
| `networking-essentials`     | `by-example`        | 7                | 3     | Follow a request from URL to response through DNS, TCP, and HTTP.          |
| `system-programming`        | `by-example`        | 3                | 3     | Write C programs that work directly with memory, files, and processes.     |
| `windows-os`                | `by-example`        | 4                | 1     | Learn the Windows object-and-handle model through Win32 C and PowerShell.  |

### Architecture and distributed systems (`architecture-and-distributed-systems`, 8 courses)

| Course slug                    | `format`            | `estimatedHours`  | Paths | `description`                                                                      |
| ------------------------------ | ------------------- | ----------------- | ----- | ---------------------------------------------------------------------------------- |
| `build-your-own-raft`          | `by-example`        | 1                 | 3     | Build a small Raft cluster with leader election and a replicated key-value store.  |
| `capstone-real-world-delivery` | omitted (outline)   | omitted (outline) | 3     | Ship a prior capstone app as a documented, event-driven, secure, deployed service. |
| `capstone-solid-core`          | `capstone`          | 4                 | 3     | Rework the first capstone app into a clean, well-designed professional codebase.   |
| `distributed-systems`          | `by-example`        | 3                 | 3     | Reason about partial failure, clocks, replication, and consensus across machines.  |
| `domain-driven-design`         | `by-example`        | 3                 | 3     | Model business rules in code with bounded contexts and aggregates.                 |
| `event-driven-architecture`    | `by-example`        | 1                 | 3     | Connect services with durable events instead of fragile synchronous calls.         |
| `software-architecture`        | `annotated-concept` | 1                 | 3     | Decide where to draw boundaries in a system and what each one costs.               |
| `system-design`                | `annotated-concept` | 1                 | 3     | Estimate load, find bottlenecks, and choose building blocks for a system.          |

### Infrastructure and operations (`infrastructure-and-operations`, 9 courses)

| Course slug                          | `format`                    | `estimatedHours`  | Paths | `description`                                                                  |
| ------------------------------------ | --------------------------- | ----------------- | ----- | ------------------------------------------------------------------------------ |
| `bare-metal-virtualization`          | `by-example`                | 2                 | 3     | Run virtual machines on your own hardware with KVM and Proxmox.                |
| `capstone-concurrency-and-systems`   | omitted (outline)           | omitted (outline) | 3     | Build, package, and operate a concurrent service against a reliability target. |
| `cicd-and-release-engineering`       | `by-example`                | 9                 | 4     | Build pipelines that test every change and release it safely.                  |
| `cloud-and-iac`                      | `annotated-concept`         | 1                 | 3     | Describe cloud infrastructure as code that you can review and reproduce.       |
| `containers-and-orchestration`       | `by-example`                | 5                 | 4     | Package apps in containers and run them with Kubernetes.                       |
| `platform-engineering-and-devex`     | `annotated-concept-no-code` | 1                 | 3     | Build internal platforms that make the safe way the easy way for teams.        |
| `self-hosting-essentials`            | `by-example`                | 6                 | 3     | Run your own server with a reverse proxy, TLS, a firewall, and backups.        |
| `self-managed-kubernetes-and-gitops` | `by-example`                | 1                 | 3     | Run your own Kubernetes cluster and manage it from Git.                        |
| `site-reliability-engineering`       | `annotated-concept`         | 1                 | 4     | Set reliability targets, measure them, and respond well to incidents.          |

### Security (`security`, 9 courses)

| Course slug                                 | `format`                    | `estimatedHours`  | Paths | `description`                                                                 |
| ------------------------------------------- | --------------------------- | ----------------- | ----- | ----------------------------------------------------------------------------- |
| `capstone-build-your-own-pentest-engine`    | omitted (outline)           | omitted (outline) | 3     | Build an auditable security assessment pipeline that only scans your own lab. |
| `capstone-secure-service`                   | omitted (outline)           | omitted (outline) | 3     | Take an HTTP service through a full security review, fix, and detection loop. |
| `defensive-security`                        | `by-example`                | 1                 | 3     | Detect attacks, respond to incidents, and stop them from happening again.     |
| `detection-engineering-and-siem-operations` | `by-example`                | 1                 | 3     | Turn raw logs into tested detection rules a security team can trust.          |
| `it-and-application-security`               | `annotated-concept`         | 1                 | 3     | Combine identity, hardening, and layered controls to protect a whole system.  |
| `it-governance-grc`                         | `annotated-concept-no-code` | 1                 | 3     | Turn security work into owned decisions, fitting controls, and real evidence. |
| `offensive-security`                        | `by-example`                | 1                 | 3     | Learn how attackers find weaknesses, inside a safe and authorized test.       |
| `security-essentials`                       | `by-example`                | 20                | 3     | Find and fix the most common web vulnerabilities in services you build.       |
| `vulnerability-management-and-assessment`   | `by-example`                | 1                 | 3     | Find, rank, and fix vulnerabilities across code, images, and infrastructure.  |

### AI engineering (`ai-engineering`, 15 courses)

| Course slug                                       | `format`                    | `estimatedHours`  | Paths | `description`                                                                        |
| ------------------------------------------------- | --------------------------- | ----------------- | ----- | ------------------------------------------------------------------------------------ |
| `agent-context-and-memory`                        | `annotated-concept`         | 1                 | 4     | Manage an agent's limited context window and what it remembers.                      |
| `agent-orchestration-subagents-and-observability` | `annotated-concept`         | 1                 | 4     | Split agent work across subagents and trace what each one does.                      |
| `agent-permissions-and-sandboxing`                | `by-example`                | 1                 | 4     | Limit what an AI agent may do with permissions, sandboxes, and guardrails.           |
| `agent-tools-and-mcp`                             | `by-example`                | 2                 | 4     | Give agents typed tools and connect them with the Model Context Protocol.            |
| `agentic-ai`                                      | `by-example`                | 1                 | 4     | Survey how AI agents use tools, memory, and planning, and where they fail.           |
| `agentic-coding`                                  | `annotated-concept`         | 5                 | 3     | Use AI coding agents to plan, write, and check code without losing control.          |
| `capstone-build-your-own-coding-agent`            | omitted (outline)           | omitted (outline) | 4     | Combine the agent courses into a small local coding assistant.                       |
| `creating-ai-powered-apps`                        | `by-example`                | 1                 | 4     | Build apps that use language models safely, with retrieval and output checks.        |
| `evaluating-ai-output-essentials`                 | `annotated-concept`         | 4                 | 1     | Test AI features with fixed cases and clear scoring instead of guesswork.            |
| `evaluating-ai-systems-in-depth`                  | `by-example`                | 8                 | 1     | Read real failures, pick useful metrics, and check that AI judges agree with people. |
| `fine-tuning-and-adaptation`                      | `by-example`                | 8                 | 1     | Learn when fine-tuning a model helps and when retrieval or prompting works better.   |
| `inference-serving-and-model-deployment`          | `by-example`                | 6                 | 1     | Understand what model serving costs and how to deploy models efficiently.            |
| `product-patterns-for-probabilistic-systems`      | `annotated-concept-no-code` | 2                 | 1     | Design product experiences around AI features that are sometimes wrong.              |
| `statistics-for-evaluation`                       | `annotated-concept`         | 5                 | 1     | Use basic statistics to tell whether an evaluation result is real.                   |
| `the-agent-loop`                                  | `by-example`                | 1                 | 4     | Build the observe, decide, act loop at the heart of an AI agent.                     |

### Product and leadership (`product-and-leadership`, 6 courses)

| Course slug                     | `format`                    | `estimatedHours`  | Paths | `description`                                                                 |
| ------------------------------- | --------------------------- | ----------------- | ----- | ----------------------------------------------------------------------------- |
| `analytics-and-experimentation` | `by-example`                | 1                 | 3     | Define product metrics and run fair experiments before you trust a change.    |
| `capstone-lead-at-altitude`     | omitted (outline)           | omitted (outline) | 3     | Lead an existing service as a technical lead, from strategy to retrospective. |
| `engineering-management`        | `annotated-concept-no-code` | 2                 | 3     | Lead engineers through one-on-ones, feedback, growth plans, and priorities.   |
| `project-management`            | `annotated-concept-no-code` | 2                 | 3     | Scope, plan, estimate, and track work so a project stays on course.           |
| `software-product-engineering`  | `annotated-concept-no-code` | 2                 | 4     | Turn engineering work into product outcomes that users actually need.         |
| `technical-communication`       | `annotated-concept-no-code` | 2                 | 3     | Write clear status updates, proposals, decision records, and postmortems.     |

### Interview preparation (`interview-preparation`, 5 courses)

| Course slug                            | `format`            | `estimatedHours` | Paths | `description`                                                                  |
| -------------------------------------- | ------------------- | ---------------- | ----- | ------------------------------------------------------------------------------ |
| `behavioral-and-leadership-interviews` | `annotated-concept` | 1                | 2     | Tell short, honest stories about your real work for behavioral interviews.     |
| `capstone-interview-loop`              | `capstone`          | 1                | 2     | Practice a complete interview loop after finishing the four interview courses. |
| `coding-interview`                     | `by-example`        | 1                | 2     | Solve coding interview problems while explaining your approach out loud.       |
| `system-design-interview`              | `annotated-concept` | 1                | 2     | Run a system design interview from requirements to trade-offs within the time. |
| `take-home-and-live-coding`            | `by-example`        | 1                | 2     | Deliver a solid take-home project and work well in a live coding session.      |

### Accounting (`accounting`, 24 courses)

| Course slug                                    | `format`          | `estimatedHours`  | Paths | `description`                                                                        |
| ---------------------------------------------- | ----------------- | ----------------- | ----- | ------------------------------------------------------------------------------------ |
| `accounting-foundations`                       | omitted (outline) | omitted (outline) | 2     | Learn the accounting equation, double entry, and why every entry needs evidence.     |
| `accounts-payable-and-procure-to-pay`          | omitted (outline) | omitted (outline) | 2     | Match requests, orders, receipts, and invoices before money is paid.                 |
| `accounts-receivable-and-order-to-cash`        | omitted (outline) | omitted (outline) | 2     | Trace what customers owe from order through billing to collection.                   |
| `accrual-accounting-and-revenue-recognition`   | omitted (outline) | omitted (outline) | 2     | Record revenue and costs when they are earned, not just when cash moves.             |
| `audit-controls-and-compliance`                | omitted (outline) | omitted (outline) | 2     | Design controls that address real risks and leave reviewable evidence.               |
| `chart-of-accounts-and-data-modeling`          | omitted (outline) | omitted (outline) | 2     | Design a chart of accounts that supports reporting, decisions, and controls.         |
| `consolidation-and-multi-entity-accounting`    | omitted (outline) | omitted (outline) | 2     | Combine the books of related companies and remove internal transactions.             |
| `financial-reporting-and-xbrl`                 | omitted (outline) | omitted (outline) | 2     | Tag financial report facts with XBRL so machines can read them correctly.            |
| `financial-reporting-standards-ifrs-vs-gaap`   | omitted (outline) | omitted (outline) | 2     | Compare how IFRS and US GAAP recognize, measure, and present the same events.        |
| `financial-statements-and-close-cycle`         | omitted (outline) | omitted (outline) | 2     | Close a period and prepare financial statements you can explain.                     |
| `fixed-assets-and-depreciation`                | omitted (outline) | omitted (outline) | 2     | Track long-lived assets, depreciate them, and spot impairment.                       |
| `general-ledger-system-architecture`           | omitted (outline) | omitted (outline) | 2     | Design a general ledger system that stays balanced, auditable, and safe to retry.    |
| `inventory-and-cogs-accounting`                | omitted (outline) | omitted (outline) | 2     | Account for inventory and cost of goods sold so margins are correct.                 |
| `islamic-contract-modeling-for-systems`        | omitted (outline) | omitted (outline) | 1     | Model Islamic contracts such as murabaha in software with their full sale evidence.  |
| `journal-entries-and-posting-mechanics`        | omitted (outline) | omitted (outline) | 2     | Write and post journal entries with the right accounts, dates, and evidence.         |
| `lease-and-intangible-asset-accounting`        | omitted (outline) | omitted (outline) | 2     | Classify and account for leases and intangible assets from their economic substance. |
| `managerial-and-cost-accounting`               | omitted (outline) | omitted (outline) | 2     | Use cost information to support business decisions.                                  |
| `multi-currency-accounting-and-fx-translation` | omitted (outline) | omitted (outline) | 2     | Record foreign-currency transactions and translate balances with traceable rates.    |
| `payroll-and-tax-accounting-essentials`        | omitted (outline) | omitted (outline) | 2     | Account for payroll and tax with clear authorization and calculation records.        |
| `sharia-accounting-and-aaoifi-standards`       | omitted (outline) | omitted (outline) | 1     | Compare the main Sharia accounting frameworks before you encode a policy.            |
| `sharia-ledger-system-architecture`            | omitted (outline) | omitted (outline) | 1     | Design a ledger system that records Sharia contract events with full evidence.       |
| `sukuk-and-islamic-capital-markets-accounting` | omitted (outline) | omitted (outline) | 1     | Account for sukuk using the assets and contracts behind them.                        |
| `treasury-and-cash-management`                 | omitted (outline) | omitted (outline) | 2     | Match bank and book records and manage cash and liquidity.                           |
| `zakah-computation-and-reporting-for-systems`  | omitted (outline) | omitted (outline) | 1     | Compute and report zakah separately from income tax, with its own evidence.          |

### ERP systems (`erp-systems`, 30 courses)

| Course slug                                   | `format`          | `estimatedHours`  | Paths | `description`                                                                             |
| --------------------------------------------- | ----------------- | ----------------- | ----- | ----------------------------------------------------------------------------------------- |
| `demand-and-supply-planning`                  | omitted (outline) | omitted (outline) | 2     | Plan demand and supply as a controlled forecast and commitment process.                   |
| `erp-analytics-and-reporting`                 | omitted (outline) | omitted (outline) | 2     | Build ERP reports with clear sources, freshness, and control totals.                      |
| `erp-audit-trail-and-change-tracking`         | omitted (outline) | omitted (outline) | 2     | Record who changed what, when, and why for every important ERP change.                    |
| `erp-availability-and-reservations`           | omitted (outline) | omitted (outline) | 2     | Promise stock to customers using on-hand, incoming, and reserved quantities.              |
| `erp-bom-and-routing-architecture`            | omitted (outline) | omitted (outline) | 2     | Model bills of materials and production routings with version history.                    |
| `erp-conceptual-data-model`                   | omitted (outline) | omitted (outline) | 2     | Give parties, items, documents, and events stable identities across ERP modules.          |
| `erp-document-lifecycle-and-state-machines`   | omitted (outline) | omitted (outline) | 2     | Model ERP documents with named states and guarded, reversible transitions.                |
| `erp-extension-and-customization`             | omitted (outline) | omitted (outline) | 2     | Choose between configuration, extensions, and custom code in an ERP.                      |
| `erp-fiscal-calendar-and-period-close`        | omitted (outline) | omitted (outline) | 2     | Assign events to fiscal periods and lock closed periods safely.                           |
| `erp-foundations-and-history`                 | omitted (outline) | omitted (outline) | 2     | Learn what an ERP system is: one shared record of a business's events.                    |
| `erp-integration-patterns`                    | omitted (outline) | omitted (outline) | 2     | Connect ERP modules and outside systems with versioned, retry-safe messages.              |
| `erp-inventory-costing-methods`               | omitted (outline) | omitted (outline) | 2     | Value inventory with a clear costing method and reproducible cost history.                |
| `erp-inventory-integrity-and-concurrency`     | omitted (outline) | omitted (outline) | 2     | Keep stock numbers correct when many people change inventory at once.                     |
| `erp-module-map-and-architecture`             | omitted (outline) | omitted (outline) | 2     | Map ERP modules to business capabilities without splitting the shared data.               |
| `erp-numbering-sequences-and-uom-conversion`  | omitted (outline) | omitted (outline) | 2     | Generate unique document numbers and convert units of measure without losing data.        |
| `erp-posting-rules-and-account-determination` | omitted (outline) | omitted (outline) | 2     | Turn approved business events into ledger postings with clear, testable rules.            |
| `erp-procurement-and-fulfillment-exceptions`  | omitted (outline) | omitted (outline) | 2     | Handle returns, disputes, cancellations, and partial deliveries inside the ERP.           |
| `erp-security-and-controls`                   | omitted (outline) | omitted (outline) | 2     | Control who can create, approve, post, and change each ERP transaction.                   |
| `erp-subledger-to-gl-architecture`            | omitted (outline) | omitted (outline) | 2     | Keep detailed subledgers and general ledger totals in agreement.                          |
| `human-capital-management-and-hire-to-retire` | omitted (outline) | omitted (outline) | 2     | Manage worker records from hiring to leaving, with payroll inputs and privacy.            |
| `inventory-and-warehouse-management`          | omitted (outline) | omitted (outline) | 2     | Track stock identity, location, quantity, and ownership through a warehouse.              |
| `islamic-contract-based-transaction-flows`    | omitted (outline) | omitted (outline) | 1     | Build ERP flows that keep Islamic contract terms, approvals, and settlement records.      |
| `multi-company-and-multi-currency-erp`        | omitted (outline) | omitted (outline) | 2     | Run several legal entities and currencies in one ERP with clear ownership.                |
| `order-to-cash-systems`                       | omitted (outline) | omitted (outline) | 2     | Build the sales flow from customer order to delivered goods and collected cash.           |
| `procure-to-pay-systems`                      | omitted (outline) | omitted (outline) | 2     | Build the purchase flow from request to supplier payment with a three-way match.          |
| `production-planning-and-mrp`                 | omitted (outline) | omitted (outline) | 2     | Turn demand, stock, and bills of materials into dated production and purchase plans.      |
| `quality-management-and-inspection`           | omitted (outline) | omitted (outline) | 2     | Record inspections and decide what happens to failed material without losing its history. |
| `record-to-report-systems`                    | omitted (outline) | omitted (outline) | 2     | Turn approved business events into controlled period-end financial results.               |
| `sharia-compliant-erp-design`                 | omitted (outline) | omitted (outline) | 1     | Design an ERP where Sharia contract terms and local policy stay configurable.             |
| `zakat-and-sharia-compliance-modules`         | omitted (outline) | omitted (outline) | 1     | Build compliance modules with reviewable inputs, rules, and reports.                      |
