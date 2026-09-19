# OSE LMS backend

The learning-management backend for Open Sharia Enterprise. It is a Spring Boot service on Java 25
that answers two REST endpoints and reports its own health. It has no database, no message broker,
and no outbound calls.

Built with Java 25, Spring Boot 4.1.1, and Gradle 9.7.1 (via the checked-in wrapper).

## Start it locally

```bash
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-lms-be:dev
```

The service listens on <http://localhost:8303>. Two endpoints answer:

| Method | Path             | Response body                 |
| ------ | ---------------- | ----------------------------- |
| GET    | `/api/v1/health` | `{"status":"healthy"}`        |
| GET    | `/api/v1/hello`  | `{"message":"Hello, world!"}` |

Spring Boot Actuator adds `/actuator/health`. No other Actuator endpoint is exposed.

## Configuration

One variable, declared in `.env.example`:

| Variable          | Required | Default | Meaning       |
| ----------------- | -------- | ------- | ------------- |
| `OSE_LMS_BE_PORT` | no       | `8303`  | Listener port |

The port resolves in a fixed order: `OSE_LMS_BE_PORT` first, then the default. A value that is not
a number fails at startup rather than silently falling back, and a number outside the valid range
fails when the server binds.

## How the code is arranged

```text
apps/ose-lms-be/
├── build.gradle.kts          # toolchain, Spotless, JaCoCo, Cucumber
├── src/main/java/com/oseplatform/lms/
│   ├── OseLmsBeApplication.java
│   ├── config/PortResolver.java
│   ├── health/HealthController.java
│   └── hello/HelloController.java
├── src/main/resources/application.yaml
├── src/test/java/com/oseplatform/lms/
│   ├── RunCucumberTest.java   # JUnit Platform suite entry point
│   └── steps/                 # Cucumber step bindings
└── generated-contracts/       # OpenAPI models, generated and gitignored
```

Response bodies come from models generated out of the contract in
`specs/apps/ose/lms-be/contracts/`, not from inline maps, so a contract change that the code does
not follow fails to compile.

## Common commands

| Command                                     | What it does                                   |
| ------------------------------------------- | ---------------------------------------------- |
| `nx run ose-lms-be:codegen`                 | Regenerates the contract models                |
| `nx run ose-lms-be:build`                   | Builds the runnable jar                        |
| `nx run ose-lms-be:typecheck`               | Compiles main and test sources                 |
| `nx run ose-lms-be:lint`                    | Spotless with google-java-format               |
| `nx run ose-lms-be:dev`                     | Runs the service from source                   |
| `nx run ose-lms-be:run`                     | Runs the built jar                             |
| `nx run ose-lms-be:test:unit`               | Cucumber scenarios plus the 99% coverage floor |
| `nx run ose-lms-be:test:quick`              | Typecheck, lint, unit tests, and coverage      |
| `nx run ose-lms-be:test:coverage:unit`      | Static Unit-adapter binding check              |
| `nx run ose-lms-be:test:coverage:behaviour` | Static whole-corpus binding check              |
| `nx run ose-lms-be:test:coverage`           | Both static coverage checks in order           |
| `nx run ose-lms-be:deps:audit`              | Resolves and reports the runtime classpath     |
| `nx run ose-lms-be:compat:min-version`      | Reports the toolchain floor                    |

## BDD and Testing

The canonical corpus is `specs/apps/ose/lms-be/behaviours/`. The Unit adapter binds it with
Cucumber-JVM under `src/test/java`, driving the HTTP scenarios through MockMvc and the port
scenarios through a pure `PortResolver`. `test:coverage:unit` proves every applicable scenario has a
binding; `test:coverage:behaviour` proves the whole corpus is bound somewhere.

**The Integration layer is inapplicable here, and that is a deliberate declaration rather than an
omission.** The Integration adapter exists to exercise a boundary the service owns locally — a
database, a migration set, a broker, a file store. This service owns none of them: it holds no
state, opens no connection, and reads nothing but one environment variable. An Integration target
here could only re-run what the Unit adapter already proves in-process, and the repository forbids
an echo target that reports success without exercising anything. `behaviour-coverage.json`
therefore names no `integration` adapter, so no validator expects one.

Public HTTP proof against a really-started process belongs to the dedicated `ose-lms-be-e2e`
project, which owns that boundary. Until it exists, `behaviour-coverage.json` names no `e2e`
adapter either, so no coverage target points at a directory that is not there.

For the expected behaviour, see the
[Gherkin scenarios](../../specs/apps/ose/lms-be/behaviours/README.md). For the product direction,
see the [OSE application overview](../../specs/apps/ose/overview.md).
