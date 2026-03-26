import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  application
  kotlin("jvm") version "2.1.21"
  kotlin("plugin.serialization") version "2.1.21"
  id("io.ktor.plugin") version "3.1.2"
  id("org.jetbrains.kotlinx.kover") version "0.9.1"
  id("io.gitlab.arturbosch.detekt") version "1.23.8"
  id("com.ncorti.ktfmt.gradle") version "0.22.0"
}

val ktorVersion = "3.1.2"
val exposedVersion = "0.59.0"
val koinVersion = "4.0.2"
val cucumberVersion = "7.22.0"
val junitVersion = "5.11.4"
val logbackVersion = "1.5.18"
val postgresDriverVersion = "42.7.5"
val sqliteVersion = "3.49.1.0"
val jbcryptVersion = "0.4"
val javaJwtVersion = "4.4.0"
val kotlinxDatetimeVersion = "0.6.1"
val flywayVersion = "11.4.0"

group = "com.demobektkt"

version = "0.0.1"

application { mainClass.set("com.demobektkt.ApplicationKt") }

ktor { fatJar { archiveFileName.set("demo-be-kotlin-ktor-all.jar") } }

java {
  sourceCompatibility = JavaVersion.VERSION_21
  targetCompatibility = JavaVersion.VERSION_21
}

tasks.withType<KotlinCompile> {
  compilerOptions {
    jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21)
    freeCompilerArgs.addAll(
      "-Xjsr305=strict",
      // opt-in required for kotlin.time.Instant used in generated contract types
      "-opt-in=kotlin.time.ExperimentalTime",
    )
  }
}

// Include generated contract types in compilation.
// ErrorResponse is excluded because it declares Map<String, Any> with @Contextual —
// kotlin.Any has no serializer and causes a compile-time crash in the Kotlin serialization plugin.
sourceSets.main {
  kotlin.srcDirs("generated-contracts/src/main/kotlin")
  kotlin.exclude("com/demobektkt/contracts/ErrorResponse.kt")
}

repositories { mavenCentral() }

dependencies {
  // Ktor server
  implementation("io.ktor:ktor-server-core:$ktorVersion")
  implementation("io.ktor:ktor-server-netty:$ktorVersion")
  implementation("io.ktor:ktor-server-content-negotiation:$ktorVersion")
  implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")
  implementation("io.ktor:ktor-server-auth:$ktorVersion")
  implementation("io.ktor:ktor-server-auth-jwt:$ktorVersion")
  implementation("io.ktor:ktor-server-status-pages:$ktorVersion")
  implementation("io.ktor:ktor-server-call-logging:$ktorVersion")
  implementation("io.ktor:ktor-server-cors:$ktorVersion")

  // Database - Exposed ORM
  implementation("org.jetbrains.exposed:exposed-core:$exposedVersion")
  implementation("org.jetbrains.exposed:exposed-dao:$exposedVersion")
  implementation("org.jetbrains.exposed:exposed-jdbc:$exposedVersion")
  implementation("org.jetbrains.exposed:exposed-java-time:$exposedVersion")

  // Database drivers
  implementation("org.postgresql:postgresql:$postgresDriverVersion")

  // Database migrations
  implementation("org.flywaydb:flyway-core:$flywayVersion")
  implementation("org.flywaydb:flyway-database-postgresql:$flywayVersion")

  // kotlinx-datetime (required by generated contract types)
  implementation("org.jetbrains.kotlinx:kotlinx-datetime:$kotlinxDatetimeVersion")

  // JWT
  implementation("com.auth0:java-jwt:$javaJwtVersion")

  // Password hashing
  implementation("org.mindrot:jbcrypt:$jbcryptVersion")

  // Dependency Injection
  implementation("io.insert-koin:koin-ktor:$koinVersion")
  implementation("io.insert-koin:koin-logger-slf4j:$koinVersion")

  // Logging
  implementation("ch.qos.logback:logback-classic:$logbackVersion")

  // Test dependencies
  testImplementation("io.ktor:ktor-server-test-host:$ktorVersion")
  testImplementation("org.jetbrains.kotlin:kotlin-test:2.1.21")
  testImplementation("org.junit.jupiter:junit-jupiter:$junitVersion")
  testImplementation("org.junit.platform:junit-platform-suite:1.11.4")
  testImplementation("io.cucumber:cucumber-java:$cucumberVersion")
  testImplementation("io.cucumber:cucumber-junit-platform-engine:$cucumberVersion")
  testImplementation("io.insert-koin:koin-test:$koinVersion")
  testImplementation("org.xerial:sqlite-jdbc:$sqliteVersion")
  testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:$junitVersion")
}

tasks.test {
  useJUnitPlatform()
  systemProperty("cucumber.junit-platform.naming-strategy", "long")
  // Sequential execution prevents race conditions during binary result writes
  maxParallelForks = 1
  // Disable standard Gradle test reports to avoid binary store EOF errors
  // with large Cucumber suites (Gradle TestOutputStore.Reader truncation issue)
  reports.junitXml.required.set(false)
  reports.html.required.set(false)
}

val testSourceSet = sourceSets.test.get()

tasks.register<Test>("testUnit") {
  description = "Run unit tests only (Cucumber BDD + plain JUnit)"
  group = "verification"
  testClassesDirs = testSourceSet.output.classesDirs
  classpath = testSourceSet.runtimeClasspath
  useJUnitPlatform {
    // Exclude integration-tagged JUnit tests (ErrorPathsTest, AdditionalCoverageTest)
    excludeTags("integration")
  }
  systemProperty("cucumber.junit-platform.naming-strategy", "long")
  // Override cucumber.glue to use unit step definitions only
  systemProperty("cucumber.glue", "com.demobektkt.unit.steps")
  maxParallelForks = 1
  reports.junitXml.required.set(false)
  reports.html.required.set(false)
}

tasks.register<Test>("testIntegration") {
  description = "Run integration tests only (Cucumber BDD + JUnit)"
  group = "verification"
  testClassesDirs = testSourceSet.output.classesDirs
  classpath = testSourceSet.runtimeClasspath
  useJUnitPlatform {
    // Exclude unit-tagged tests (UnitCucumberRunner and unit JUnit tests)
    excludeTags("unit")
  }
  systemProperty("cucumber.junit-platform.naming-strategy", "long")
  // Set cucumber.glue to integration step definitions
  systemProperty("cucumber.glue", "com.demobektkt.integration.steps")
  maxParallelForks = 1
  reports.junitXml.required.set(false)
  reports.html.required.set(false)
  // Exclude unit JUnit test classes
  exclude("com/demobektkt/unit/**")
}

// Copy Gherkin specs into test resources classpath.
// In Docker, specs are pre-copied to src/test/resources/specs/ so this task is skipped
// via the SKIP_SPEC_COPY env var to avoid Gradle scanning /sys filesystem.
val specsDir = file("${rootProject.projectDir}/../../specs/apps/demo/be/gherkin")

if (System.getenv("SKIP_SPEC_COPY") == null && specsDir.exists()) {
  tasks.processTestResources { from(specsDir) { into("specs/apps/demo/be/gherkin") } }
}

// Kover configuration
kover {
  // Only instrument testUnit for coverage (not testIntegration or default test)
  currentProject { instrumentation { disabledForTestTasks.addAll("test", "testIntegration") } }
  reports {
    filters {
      excludes {
        // Exclude Exposed production DB repositories (untestable without real DB in integration
        // tests)
        classes(
          "com.demobektkt.infrastructure.Exposed*",
          "com.demobektkt.infrastructure.DatabaseFactory",
          "com.demobektkt.infrastructure.tables.*",
          // Exclude main entry point (only calls embeddedServer)
          "com.demobektkt.ApplicationKt",
          // Exclude DI module setup (wires Exposed repos, not testable without DB)
          "com.demobektkt.plugins.DIKt",
          // Exclude HTTP/route layer — unit tests call domain logic directly via
          // UnitServiceDispatcher (no HTTP). Routes are covered by integration/e2e tests.
          "com.demobektkt.routes.*",
          "com.demobektkt.plugins.*",
          // Exclude generated contract types — data classes + companion serializer objects
          // are exercised only by integration/e2e tests (HTTP serialization layer).
          "com.demobektkt.contracts.*",
        )
      }
    }
    total {
      xml {
        onCheck = false
        xmlFile.set(file("build/reports/kover/report.xml"))
      }
      verify { rule { minBound(90) } }
    }
  }
}

// Disable the default 'test' task so only testUnit/testIntegration run
// This prevents Kover from pulling in the default test task
tasks.test { enabled = false }

// detekt configuration
detekt {
  config.setFrom(files("detekt.yml"))
  buildUponDefaultConfig = true
  allRules = false
}

// ktfmt configuration
ktfmt { googleStyle() }
