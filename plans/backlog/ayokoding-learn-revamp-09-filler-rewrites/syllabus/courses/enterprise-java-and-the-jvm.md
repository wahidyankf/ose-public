# Enterprise Java and the JVM (By Example)

**Course ID**: `enterprise-java-and-the-jvm` · **Format**: By Example.

**Scope note**: Builds layered Spring Boot services and explains the JVM they run on. Part 1 wires objects by hand,
then with the Spring container, configuration, properties, and profiles. Part 2 adds a web layer (tested with
MockMvc, so no server port is opened), validation, error handling, JSON, JPA on an in-memory database,
transactions, and the N+1 problem. Part 3 covers slice tests, Actuator, class loading, the JIT compiler, garbage
collectors, the memory model, and packaging. It leaves out Spring Security, reactive stacks, messaging, cloud
deployment, native images, and the design of the architecture itself (`software-architecture` covers that).

**Short summary**: Enterprise Java is mostly objects wired together by a container, plus a runtime that manages
memory and compiles hot code. You build a small service layer by layer, test each layer, and then look under it at
the JVM.

## Why this exists · the big idea

- **The problem before the solution**: Spring Boot hides a great deal of wiring. Engineers who learn it from
  annotations alone cannot say why a bean is missing, why a rollback did not happen, or why a service slows down
  under load, and they treat the JVM as a black box.
- **Keep-this-if-you-forget-everything**: the container builds your objects from declared dependencies, so explicit
  constructors make the wiring visible; a transaction or a proxy is a wrapper around a call, so it applies only to
  calls that go through the wrapper; and the JVM's behavior (loading, compiling, collecting) is observable from
  inside the program.

## Learning objectives

- Wire a service with constructor injection by hand and with the Spring container, and read the error when a bean
  is missing or ambiguous.
- Configure behavior with properties and profiles, and say what auto-configuration did and how to override it.
- Build controller, service, and repository layers, validate input, and map failures to stable error bodies.
- Use JPA with transactions, explain when a rollback happens and when it does not, and measure and fix an N+1 query.
- Test with plain JUnit, full-context tests, web and data slices, and `@MockitoBean`.
- Expose health and metrics with Actuator and state what not to expose.
- Show class loading, the JIT mode, the collector in use, and a controlled out-of-memory error from a program.
- Package an application as a jar and explain what the launcher does.

## Prerequisites

- **Prior courses**: `just-enough-java`, `software-architecture`.
- **Assumed knowledge**: Java classes, interfaces, generics, records, collections, and exceptions; layered
  architecture at a high level.

## Mode and targets

- **Mode**: By Example. **Reason**: each Spring mechanism (wiring, scope, rollback, validation) and each JVM
  behavior (class loading, collection) produces observable output from a short program, so a reader learns it by
  running it and reading what it prints.
- **Examples**: 78 (floor 75), 26 per level. **Words**: at least 28,000. **Diagrams**: 41 marked `[D]` (band 30–50).
- **Metadata**: `format: by-example`; `category: application-development`; `description` kept from plan 03 ("Build
  layered Spring Boot services and understand the JVM they run on."); `prerequisites` unchanged;
  `estimatedHours` from the drift test.

## Defects found 2026-10-09

- All 78 headings read `Example N: java-example-NN` over one repeated body (unique-body ratio 0.01).
- The 85 `.java` files share one shape, and the overview and example text cite Spring Boot 4.1.0 and `mvn test`.
  Maven needs a network, so the harness cannot run it; Spring Boot 4.1.1 is current on 2026-10-09.
- No example prints output; no expected files, no `run.yaml`, no dependency lock.
- The JVM section names collectors and a memory model but shows no observable behavior.

## Accuracy notes

- Spring Boot 4.1.1 (Spring Framework 7, Hibernate 7, Jackson 3) on JDK 25 (Temurin): versions from spring.io and
  plan 05's catalog, read 2026-10-09. Boot 4 split its starters and test starters by technology; the maker reads
  the Boot 4.1 reference and chooses artifact names from it, not from Boot 3 memory
  ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism.md#the-java-install-recipe)). `@MockBean` is
  gone; `@MockitoBean` is the documented replacement.
- Jackson 3 uses new packages for the databind classes while annotations keep the old package; the maker checks
  every import against the resolved jars.
- JVM claims are observed, not asserted: collector names come from the management beans, the JIT mode from
  `java.vm.info`, class loaders from `getClassLoader()`. No example prints a timing, a pause, a thread count, a
  pid, a timestamp, or any value that depends on the CPU count.
- Explicit flags are fixed for every run: `-XX:+UseSerialGC -Xshare:auto -XX:TieredStopAtLevel=1`, plus per-example
  flags (`-Xint`, `-Xmx16m`, `-XX:+UseG1GC`, `-XX:+UseZGC`, `-XX:+UseParallelGC`) where an example is about them.
  The second run uses half the CPU, so any output the JVM would choose by ergonomics would differ.
- JUnit runs through the console launcher; lines that carry elapsed time are dropped by `run-common.sh`, which is
  the only filter and is documented in the course.
- Boot startup logging is off (`spring.main.banner-mode=off`, root log level `WARN`) so only the unit's own lines
  are compared.

## Concepts

- **co-01 · dependency-injection** — dependencies are declared and supplied from outside.
- **co-02 · inversion-of-control** — the container owns construction and lifecycle, and events decouple callers.
- **co-03 · constructor-injection** — constructors make required dependencies explicit; cycles fail early.
- **co-04 · beans** — stereotypes and `@Bean` methods register managed collaborators.
- **co-05 · bean-lifecycle-and-scope** — singleton and prototype, callbacks, and proxies.
- **co-06 · configuration-classes** — `@Configuration` declares explicit beans.
- **co-07 · autoconfiguration** — Boot configures supported classpath conventions and backs off for yours.
- **co-08 · starters** — starters provide coherent dependency sets.
- **co-09 · application-properties** — external configuration, binding, and precedence.
- **co-10 · profiles** — profiles select environment-specific configuration.
- **co-11 · rest-controller** — controllers bind HTTP requests to responses.
- **co-12 · request-mapping** — paths, queries, and bodies map to arguments.
- **co-13 · service-layer** — services hold business decisions between HTTP and persistence.
- **co-14 · repository-layer** — repositories isolate persistence.
- **co-15 · validation** — constraints reject invalid input at the boundary.
- **co-16 · error-handling** — advice maps failures to stable error bodies.
- **co-17 · jpa-entity** — entities model table-backed state; lazy loading has rules.
- **co-18 · jpa-repository** — repository interfaces provide CRUD, queries, and paging.
- **co-19 · transactions** — a transaction makes a multi-step write atomic; rollback rules; propagation.
- **co-20 · n-plus-one** — traversal can multiply queries; measure and fix.
- **co-21 · json-serialization** — DTOs are serialized at the HTTP boundary.
- **co-22 · actuator** — health and metrics expose operational state.
- **co-23 · testing-spring** — plain, full-context, and slice tests have different scopes.
- **co-24 · mockito-bean** — a context collaborator is replaced in a focused test.
- **co-25 · jvm-classloading** — classes load lazily through a loader hierarchy.
- **co-26 · jit** — hot code is compiled after warm-up.
- **co-27 · generational-gc** — short-lived allocation is collected cheaply.
- **co-28 · gc-collectors** — collector choice trades throughput against pause and footprint.
- **co-29 · memory-model** — heap regions and limits are observable.
- **co-30 · packaging** — a jar, its manifest, and the launcher.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–26)

- **ex-01 · dependencies-by-hand** — a class that builds its own dependency cannot be tested apart — verify the
  output. (co-01) [D]
- **ex-02 · constructor-injection-by-hand** — pass the dependency in — verify a stub swap. (co-03)
- **ex-03 · interface-and-two-implementations** — one interface, two classes — verify both. (co-01)
- **ex-04 · a-hand-written-container** — a small container from a map of suppliers — verify the wiring. (co-02) [D]
- **ex-05 · first-application-context** — an `AnnotationConfigApplicationContext` with one bean — verify. (co-04)
- **ex-06 · component-scanning** — `@Component` and `@ComponentScan` — verify the beans found. (co-04) [D]
- **ex-07 · stereotypes** — `@Service` and `@Repository` — verify they are beans. (co-04)
- **ex-08 · constructor-injection-in-spring** — a single constructor needs no annotation — verify. (co-03) [D]
- **ex-09 · missing-bean** — read the recorded `NoSuchBeanDefinitionException` text — verify. (co-04)
- **ex-10 · two-candidates** — read `NoUniqueBeanDefinitionException`, then fix with `@Primary` and
  `@Qualifier` — verify both. (co-04) [D]
- **ex-11 · java-configuration** — `@Configuration` and `@Bean` — verify. (co-06)
- **ex-12 · bean-scopes** — singleton and prototype identity — verify the comparison. (co-05) [D]
- **ex-13 · lifecycle-callbacks** — `@PostConstruct` and `@PreDestroy` order — verify. (co-05) [D]
- **ex-14 · initialization-order** — dependencies are created first — verify. (co-05)
- **ex-15 · circular-dependency** — a constructor cycle fails; read the recorded message — verify. (co-03) [D]
- **ex-16 · values-from-properties** — `@Value` with a default — verify. (co-09)
- **ex-17 · configuration-properties** — bind a record with `@ConfigurationProperties` — verify. (co-09) [D]
- **ex-18 · property-precedence** — a command-line argument beats a file, which beats a default — verify. (co-09)
  [D]
- **ex-19 · profiles** — `@Profile` selects a bean — verify both profiles. (co-10) [D]
- **ex-20 · conditional-beans** — `@ConditionalOnProperty` — verify. (co-07)
- **ex-21 · first-boot-application** — `SpringApplication` with no web server — verify the context starts. (co-07)
  [D]
- **ex-22 · what-autoconfiguration-did** — print the names of matched auto-configurations from the conditions
  report — verify the selected names. (co-07) [D]
- **ex-23 · starters-are-dependency-sets** — list the direct dependencies of a starter from the lock — verify.
  (co-08)
- **ex-24 · backing-off** — your own bean replaces an auto-configured one — verify. (co-07) [D]
- **ex-25 · startup-runners** — run code with `ApplicationRunner` — verify the order. (co-07)
- **ex-26 · application-events** — publish and listen — verify. (co-02)

### Intermediate (`learning/intermediate.md`, Examples 27–52)

- **ex-27 · first-controller** — a `@RestController` tested with MockMvc, no server port — verify the body and
  status. (co-11) [D]
- **ex-28 · path-variables-and-query-parameters** — verify three requests. (co-12)
- **ex-29 · request-bodies** — POST JSON into a record — verify. (co-12)
- **ex-30 · status-codes** — `ResponseEntity` and `201` with a location — verify. (co-11)
- **ex-31 · json-with-jackson** — DTO records to JSON and back — verify. (co-21) [D]
- **ex-32 · jackson-settings** — property names and unknown properties — verify. (co-21)
- **ex-33 · the-service-layer** — a service holds the rule, the controller stays thin — verify. (co-13) [D]
- **ex-34 · an-in-memory-repository** — an interface and one implementation — verify. (co-14)
- **ex-35 · layer-boundaries** — a reflective check that controllers do not depend on repositories — verify the
  failing case. (co-13) [D]
- **ex-36 · bean-validation** — `@Valid`, `@NotBlank`, `@Min` — verify the rejected body. (co-15) [D]
- **ex-37 · a-custom-constraint** — an annotation and a validator — verify. (co-15)
- **ex-38 · validation-error-body** — turn field errors into a stable body — verify. (co-15, co-16)
- **ex-39 · controller-advice** — `@RestControllerAdvice` maps a domain exception to `404` — verify. (co-16) [D]
- **ex-40 · problem-details** — RFC 9457 bodies — verify. (co-16)
- **ex-41 · a-jpa-entity** — an entity on an in-memory H2 database — verify save and find. (co-17) [D]
- **ex-42 · spring-data-repositories** — derived query methods — verify. (co-18)
- **ex-43 · query-annotations** — `@Query` with a JPQL string — verify. (co-18)
- **ex-44 · transactions-commit** — a two-step write commits together — verify. (co-19) [D]
- **ex-45 · rollback-on-runtime-exception** — a failure undoes both steps — verify. (co-19) [D]
- **ex-46 · checked-exceptions-do-not-roll-back** — the surprise, and `rollbackFor` — verify both. (co-19)
- **ex-47 · propagation** — `REQUIRES_NEW` keeps an audit row — verify. (co-19) [D]
- **ex-48 · lazy-loading** — a lazy association read outside a transaction fails; read the recorded message —
  verify. (co-17)
- **ex-49 · n-plus-one-measured** — count SQL statements with Hibernate statistics — verify N+1. (co-20) [D]
- **ex-50 · the-fetch-join-fix** — the same read with one statement — verify the count. (co-20) [D]
- **ex-51 · pagination** — `Pageable` and `Page` — verify the slices. (co-18)
- **ex-52 · optimistic-locking** — `@Version` rejects a stale update — verify. (co-19)

### Advanced (`learning/advanced.md`, Examples 53–78)

- **ex-53 · a-unit-test-without-spring** — a plain JUnit test through the console launcher — verify the summary.
  (co-23)
- **ex-54 · a-full-context-test** — start the whole context — verify. (co-23) [D]
- **ex-55 · a-web-slice-test** — only the web layer (the Boot 4 annotation names are read from the reference) —
  verify. (co-23) [D]
- **ex-56 · a-data-slice-test** — only JPA — verify. (co-23)
- **ex-57 · mockitobean** — replace a collaborator in the context — verify a stubbed answer. (co-24) [D]
- **ex-58 · test-profiles-and-properties** — test-only configuration — verify. (co-23)
- **ex-59 · actuator-health** — `/actuator/health` through MockMvc — verify the status body. (co-22) [D]
- **ex-60 · a-custom-health-indicator** — report a degraded dependency — verify. (co-22)
- **ex-61 · exposing-endpoints** — expose only what is needed — verify a hidden endpoint returns `404`. (co-22)
- **ex-62 · metrics-with-micrometer** — a counter that increments — verify its value. (co-22) [D]
- **ex-63 · class-loader-hierarchy** — print the loader names for application, platform, and boot classes —
  verify. (co-25) [D]
- **ex-64 · lazy-class-loading** — static initializers run at first use — verify the order. (co-25) [D]
- **ex-65 · classpath-order** — two jars with the same class, the first wins — verify. (co-25)
- **ex-66 · jit-mode** — `java.vm.info` in mixed mode and with `-Xint` — verify both. (co-26) [D]
- **ex-67 · observing-compilation** — a hot method compiled at the first tier under a blocking compile flag —
  verify the fact, not a time. (co-26)
- **ex-68 · heap-regions** — the names of the memory pools under Serial — verify. (co-29) [D]
- **ex-69 · the-generational-hypothesis** — short-lived garbage triggers young collections and not old ones —
  verify the counts are positive and zero. (co-27) [D]
- **ex-70 · collector-names** — the collector beans for Serial, Parallel, G1, and ZGC — verify four names. (co-28)
  [D]
- **ex-71 · reachability** — a weak reference is cleared after a collection that frees its target — verify. (co-27)
- **ex-72 · a-controlled-out-of-memory** — catch `OutOfMemoryError` under `-Xmx16m` — verify the message class.
  (co-29) [D]
- **ex-73 · flags-and-ergonomics** — print the flags the run set and why the choice must not depend on CPU
  count — verify. (co-28)
- **ex-74 · jar-and-manifest** — build a plain jar with the `jar` tool and run it — verify. (co-30) [D]
- **ex-75 · the-boot-launcher** — list the launcher classes inside the loader jar — verify. (co-30)
- **ex-76 · self-invocation-skips-the-proxy** — a transactional method called from the same class does not roll
  back — verify. (co-05, co-19) [D]
- **ex-77 · a-production-readiness-check** — a test that asserts limited exposure, an active profile, and no
  default credential — verify the failing case. (co-22) [D]
- **ex-78 · capstone-preview** — run the capstone scenario — verify the responses. (co-01–co-30)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-new-inside-the-class`, `kata-02-field-injection-null`,
  `kata-03-checked-exception-no-rollback`, `kata-04-self-invocation-skips-transaction`,
  `kata-05-n-plus-one-in-loop`, `kata-06-entity-in-controller-response`, `kata-07-prototype-in-singleton`,
  `kata-08-gc-assumed-from-cpu-count`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6 (for example, why constructor
  injection beats field injection, and when a plain object is better than a bean).

## Capstone spec

**An orders service.** A Boot application without a web server: a controller, a service, a JPA repository on
H2, validation, an error advice, and Actuator health, tested end to end with MockMvc. A scenario script places two
orders (one invalid, one with a failing second step that must roll back), reads them back, and prints each
status and body, then prints the collector name and JIT mode. The expected output holds the responses and the
JVM facts.

## Code and harness

- Toolchain `java` (JDK 25) with the new install recipe: `jars.lock` (SHA-256 per jar) and a shared
  `run-common.sh` under `learning/code/`; a unit checks that `pom.xml` and the lock agree. Nothing is downloaded
  at run time ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism.md#run-specs-by-language)). Memory
  is raised with `resources.memory: 2g`.
- Probe P9 decides whether the course can be built at all. If it fails and cannot be fixed, the course is BLOCKED
  and Phase 6 of the plan is a stop for the user's choice.
- The capstone is its own code root with its own copy of `run-common.sh` and `jars.lock`.

## Lineage

- Replaces the templated course measured on 2026-10-09 (3,509 words, 88 code files). Topic lineage: the
  `enterprise-java-and-the-jvm` brief of the 2026-08-15 jvm-and-build-your-own plan.

## In which paths

- `careers/fundamentally-strong/software-engineer`, `careers/immediately-effective/software-engineer`, and
  `careers/interview-ready/software-engineer` — extension phase `architecture-and-distributed-systems`. No
  manifest change.
