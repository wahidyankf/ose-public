# Syllabus — Courses Corpus

One file per new course, grouped below by wave. Each file follows the repository's copy-paste course
template (mirroring plans 06 and 07) and adds this plan's mode, target, runtime, capstone, and drilling
specs. Slice S0 of each course's authoring expands the worked-example section to the full example list.

**48 courses, 16 waves of 3, N=3 background agents in parallel per wave** (series decision 29). This is
intentionally large: see [delivery.md](../../delivery.md#wave-strategy-and-pr-size-risk) for the PR-size risk
and the checkpoint-push strategy that keeps one PR reviewable despite the volume.

Every course's "In which paths" section states "None" with a reason: this plan migrates unique legacy
content that has no existing path membership, and assigning 48 courses into career or skills path
manifests is a path-authoring decision left to a later plan or path owner (plan 02 closure rule R4 only
binds courses that are already path members, so leaving these unassigned does not break any path's
closure). A course discoverable from the catalog by its `category` meets this plan's own definition of
done; path membership is not required by decision 27.

| Wave | Course file                                                                                                               | Category                        | Mode              | Legacy words | Prior courses                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------- | ------------ | ----------------------------------------------------------------------------- |
| 1    | [Claude Code for Engineers](./claude-code-for-engineers.md)                                                               | `ai-engineering`                | By Example        | 63,143       | `agentic-coding`, `version-control-and-git`, `just-enough-bash`               |
| 1    | [Hermes Agent for Engineers](./hermes-agent-for-engineers.md)                                                             | `ai-engineering`                | By Example        | 63,358       | `agentic-coding`, `version-control-and-git`, `just-enough-bash`               |
| 1    | [OpenClaw for Engineers](./openclaw-for-engineers.md)                                                                     | `ai-engineering`                | By Example        | 56,171       | `agentic-coding`, `version-control-and-git`, `just-enough-bash`               |
| 2    | [Pi Coding Agent for Engineers](./pi-coding-agent-for-engineers.md)                                                       | `ai-engineering`                | By Example        | 42,533       | `agentic-coding`, `version-control-and-git`, `just-enough-bash`               |
| 2    | [Playwright End-to-End Testing](./playwright-end-to-end-testing.md)                                                       | `tools-and-practices`           | By Example        | 146,397      | `just-enough-typescript`, `software-testing`                                  |
| 2    | [Frontend Unit Testing with Vitest and Testing Library](./frontend-unit-testing-with-vitest-and-testing-library.md)       | `tools-and-practices`           | By Example        | 69,942       | `just-enough-typescript`, `frontend-essentials`                               |
| 3    | [GitHub Actions and the gh CLI](./github-actions-and-gh-cli.md)                                                           | `infrastructure-and-operations` | By Example        | 57,737       | `version-control-and-git`, `cicd-and-release-engineering`, `just-enough-bash` |
| 3    | [Text Processing with awk, sed, and jq](./text-processing-with-awk-sed-and-jq.md)                                         | `programming-languages`         | Annotated-Concept | 54,455       | `just-enough-bash`                                                            |
| 3    | [Corporate Finance Essentials](./corporate-finance-essentials.md)                                                         | `accounting`                    | Annotated-Concept | 7,383        | `accounting-foundations`, `just-enough-python`                                |
| 4    | [Practical Data Analytics](./practical-data-analytics.md)                                                                 | `data-and-databases`            | Annotated-Concept | 33,893       | `just-enough-python`, `sql-essentials`                                        |
| 4    | [Datomic and Datalog Essentials](./datomic-and-datalog-essentials.md)                                                     | `data-and-databases`            | Annotated-Concept | 50,090       | `just-enough-python`, `sql-essentials`                                        |
| 4    | [Advanced Shell Scripting In Depth](./advanced-shell-scripting-in-depth.md)                                               | `programming-languages`         | By Example        | 75,817       | `just-enough-bash`                                                            |
| 5    | [Clojure Essentials](./clojure-essentials.md)                                                                             | `programming-languages`         | By Example        | 57,091       | `lisp`                                                                        |
| 5    | [Python In Depth](./python-in-depth.md)                                                                                   | `programming-languages`         | By Example        | 63,592       | `just-enough-python`                                                          |
| 5    | [Go In Depth](./golang-in-depth.md)                                                                                       | `programming-languages`         | By Example        | 174,633      | `just-enough-go`, `csp-style-concurrency`                                     |
| 6    | [Java In Depth](./java-in-depth.md)                                                                                       | `programming-languages`         | By Example        | 258,750      | `just-enough-java`, `enterprise-java-and-the-jvm`                             |
| 6    | [Elixir In Depth](./elixir-in-depth.md)                                                                                   | `programming-languages`         | By Example        | 224,314      | `just-enough-elixir`, `actor-model-concurrency`                               |
| 6    | [TypeScript In Depth](./typescript-in-depth.md)                                                                           | `programming-languages`         | By Example        | 206,007      | `just-enough-typescript`                                                      |
| 7    | [Rust In Depth](./rust-in-depth.md)                                                                                       | `programming-languages`         | By Example        | 142,396      | `just-enough-rust`                                                            |
| 7    | [C# In Depth](./csharp-in-depth.md)                                                                                       | `programming-languages`         | By Example        | 53,691       | `just-enough-csharp`                                                          |
| 7    | [F# In Depth](./fsharp-in-depth.md)                                                                                       | `programming-languages`         | By Example        | 47,548       | `just-enough-fsharp`                                                          |
| 8    | [Kotlin In Depth](./kotlin-in-depth.md)                                                                                   | `programming-languages`         | By Example        | 93,864       | `just-enough-kotlin`                                                          |
| 8    | [Dart In Depth](./dart-in-depth.md)                                                                                       | `programming-languages`         | By Example        | 85,887       | `just-enough-dart`                                                            |
| 8    | [WebAssembly Essentials](./webassembly-essentials.md)                                                                     | `programming-languages`         | By Example        | 34,323       | `just-enough-rust`                                                            |
| 9    | [Database Migrations with Python and Alembic](./database-migrations-with-python-and-alembic.md)                           | `data-and-databases`            | By Example        | 33,543       | `just-enough-python`, `sql-essentials`                                        |
| 9    | [Database Migrations with Java and Liquibase](./database-migrations-with-java-and-liquibase.md)                           | `data-and-databases`            | By Example        | 36,595       | `just-enough-java`, `sql-essentials`                                          |
| 9    | [Database Migrations with Kotlin and Flyway](./database-migrations-with-kotlin-and-flyway.md)                             | `data-and-databases`            | By Example        | 36,885       | `just-enough-kotlin`, `sql-essentials`                                        |
| 10   | [Database Migrations with Go and Goose](./database-migrations-with-golang-and-goose.md)                                   | `data-and-databases`            | By Example        | 35,197       | `just-enough-go`, `sql-essentials`                                            |
| 10   | [Database Migrations with Rust and sqlx](./database-migrations-with-rust-and-sqlx.md)                                     | `data-and-databases`            | By Example        | 34,402       | `just-enough-rust`, `sql-essentials`                                          |
| 10   | [Database Migrations with C# and EF Core](./database-migrations-with-csharp-and-ef-core.md)                               | `data-and-databases`            | By Example        | 35,417       | `just-enough-csharp`, `sql-essentials`                                        |
| 11   | [Database Migrations with F# and DbUp](./database-migrations-with-fsharp-and-dbup.md)                                     | `data-and-databases`            | By Example        | 33,848       | `just-enough-fsharp`, `sql-essentials`                                        |
| 11   | [Database Migrations with Elixir and Ecto](./database-migrations-with-elixir-and-ecto.md)                                 | `data-and-databases`            | By Example        | 48,273       | `just-enough-elixir`, `sql-essentials`                                        |
| 11   | [Database Migrations with Clojure and Migratus](./database-migrations-with-clojure-and-migratus.md)                       | `data-and-databases`            | By Example        | 31,663       | `clojure-essentials`, `sql-essentials`                                        |
| 12   | [Database Migrations with TypeScript and Effect SQL](./database-migrations-with-typescript-and-effect-sql.md)             | `data-and-databases`            | By Example        | 35,782       | `just-enough-typescript`, `sql-essentials`                                    |
| 12   | [Database Migrations with Java and Spring Data JPA](./database-migrations-with-java-and-spring-data-jpa.md)               | `data-and-databases`            | By Example        | 64,892       | `enterprise-java-and-the-jvm`, `sql-essentials`                               |
| 12   | [Web Backends in Go with Gin](./web-backends-in-go-with-gin.md)                                                           | `application-development`       | By Example        | 32,979       | `just-enough-go`, `backend-essentials`                                        |
| 13   | [Web Backends in Rust with Axum](./web-backends-in-rust-with-axum.md)                                                     | `application-development`       | By Example        | 28,630       | `just-enough-rust`, `backend-essentials`                                      |
| 13   | [Web Backends in C# with ASP.NET Core](./web-backends-in-csharp-with-aspnetcore.md)                                       | `application-development`       | By Example        | 35,755       | `just-enough-csharp`, `backend-essentials`                                    |
| 13   | [Web Backends in F# with Giraffe](./web-backends-in-fsharp-with-giraffe.md)                                               | `application-development`       | By Example        | 38,314       | `just-enough-fsharp`, `backend-essentials`                                    |
| 14   | [Web Backends in the JVM with Vert.x](./web-backends-in-the-jvm-with-vertx.md)                                            | `application-development`       | By Example        | 33,246       | `just-enough-java`, `backend-essentials`                                      |
| 14   | [Web Backends in Kotlin with Ktor](./web-backends-in-kotlin-with-ktor.md)                                                 | `application-development`       | By Example        | 33,506       | `just-enough-kotlin`, `backend-essentials`                                    |
| 14   | [Web Backends in Clojure with Pedestal](./web-backends-in-clojure-with-pedestal.md)                                       | `application-development`       | By Example        | 28,426       | `clojure-essentials`, `backend-essentials`                                    |
| 15   | [Web Backends in Elixir with Phoenix and LiveView](./web-backends-in-elixir-with-phoenix-and-liveview.md)                 | `application-development`       | By Example        | 136,337      | `just-enough-elixir`, `actor-model-concurrency`, `backend-essentials`         |
| 15   | [Flutter for the Web](./flutter-for-the-web.md)                                                                           | `application-development`       | By Example        | 37,569       | `just-enough-dart`, `hybrid-app-development`                                  |
| 15   | [Cross-Platform Mobile with React Native](./cross-platform-mobile-with-react-native.md)                                   | `application-development`       | By Example        | 39,364       | `just-enough-typescript`, `frontend-essentials`                               |
| 16   | [Modern Frontend Meta-Frameworks: Next.js and TanStack Start](./modern-frontend-meta-frameworks.md)                       | `application-development`       | Annotated-Concept | 86,640       | `just-enough-typescript`, `frontend-essentials`, `advanced-frontend`          |
| 16   | [Frontend Styling with Tailwind CSS and Radix UI](./frontend-styling-with-tailwind-and-radix-ui.md)                       | `application-development`       | Annotated-Concept | 68,842       | `just-enough-typescript`, `frontend-essentials`, `advanced-frontend`          |
| 16   | [TypeScript Advanced Tooling: Zod, Effect, tRPC, and XState](./typescript-advanced-tooling-zod-effect-trpc-and-xstate.md) | `application-development`       | Annotated-Concept | 160,039      | `just-enough-typescript`, `frontend-essentials`                               |

## Dependency note

`clojure-essentials` (wave 5) is a prerequisite of `web-backends-in-clojure-with-pedestal` (wave 14) and `database-migrations-with-clojure-and-migratus` (wave 11), because Clojure has no `just-enough-clojure` primer in the existing catalog (`lisp` covers only Scheme plus a short look at Clojure) and this plan's own `clojure-essentials` course fills that gap. Both dependents are scheduled in a later wave, so the prerequisite is always filled first. No other cross-course dependency exists inside this plan's 48 courses; every other course's prerequisites are plans 01 to 09 courses, already filled before this plan starts (series decision 42).

## Totals

| Category                        | New courses |
| ------------------------------- | ----------- |
| `accounting`                    | 1           |
| `ai-engineering`                | 4           |
| `application-development`       | 13          |
| `data-and-databases`            | 13          |
| `infrastructure-and-operations` | 1           |
| `programming-languages`         | 14          |
| `tools-and-practices`           | 2           |
| **Total**                       | **48**      |

Modes: 41 By Example, 7 Annotated-Concept.

## Related

- [Syllabus overview](../README.md)
- [Legacy to course mapping](../legacy-to-course-mapping.md)
