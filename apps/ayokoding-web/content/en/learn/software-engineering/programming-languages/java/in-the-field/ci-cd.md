---
title: "Ci Cd"
date: 2026-02-03T00:00:00+07:00
draft: false
description: Comprehensive guide to continuous integration and deployment in Java from manual processes to automated pipelines
weight: 10000026
tags: ["java", "ci-cd", "github-actions", "jenkins", "devops", "automation"]
---

## Why CI/CD Matters

Continuous Integration and Continuous Deployment automate the software delivery process, reducing human error and accelerating release cycles. CI/CD transforms software development from manual, error-prone processes into reliable, repeatable pipelines.

**Core Benefits**:

- **Fast feedback**: Catch bugs within minutes of commit
- **Consistency**: Every build uses identical steps across all environments
- **Confidence**: Automated tests validate every change before deployment
- **Velocity**: Deploy multiple times per day instead of weeks
- **Traceability**: Complete audit trail of every build and deployment

**Problem**: Manual testing, building, and deployment processes are slow, inconsistent, and prone to human error. Teams spend hours troubleshooting environment-specific issues.

**Solution**: Automate the entire pipeline from code commit to production deployment using CI/CD tools with comprehensive testing, quality checks, and automated deployments.

## Manual Testing and Deployment

Java provides standard tools for manual building and testing. Understanding manual processes reveals why automation is essential and highlights the complexity that CI/CD systems handle.

### Manual Build Commands

Java projects use Maven or Gradle for building. Manual execution requires running multiple commands in sequence.

**Maven build process**:

```bash
# Clean previous builds
mvn clean
# => Removes target/ directory
# => Deletes all compiled classes and artifacts

# Compile source code
mvn compile
# => Compiles src/main/java to target/classes
# => Downloads dependencies from Maven Central

# Run unit tests
mvn test
# => Compiles src/test/java to target/test-classes
# => Executes all test classes matching *Test.java pattern
# => Generates test reports in target/surefire-reports/

# Package application
mvn package
# => Creates JAR/WAR in target/
# => Includes compiled classes and resources
# => Result: target/myapp-1.0.jar
```

**Gradle build process**:

```bash
# Clean previous builds
./gradlew clean
# => Removes build/ directory
# => Deletes all compiled classes and artifacts

# Compile and test
./gradlew build
# => Compiles src/main/java to build/classes
# => Executes tests from src/test/java
# => Packages application to build/libs/
# => Result: build/libs/myapp-1.0.jar
```

### Manual Test Execution

Running tests manually requires multiple steps to execute different test types.

**Unit tests** (Maven):

```bash
# Run all unit tests
mvn test
# => Executes tests in src/test/java
# => Generates reports in target/surefire-reports/
# => Exit code 0: all tests passed
# => Exit code 1: tests failed

# Run specific test class
mvn test -Dtest=CalculatorTest
# => Executes only CalculatorTest class
# => Useful for debugging single test failures

# Run tests matching pattern
mvn test -Dtest=*IntegrationTest
# => Executes all tests ending with IntegrationTest
# => Useful for running test categories
```

**Integration tests** (Maven):

```bash
# Run integration tests (requires separate plugin)
mvn verify
# => Executes test phase first (unit tests)
# => Starts application server if configured
# => Runs integration-test phase (*IT.java tests)
# => Stops application server
# => Fails build if integration tests fail
```

### Manual Artifact Creation

Creating distributable artifacts requires packaging and version management.

**Maven JAR creation**:

```bash
# Create executable JAR
mvn clean package
# => Produces target/myapp-1.0.jar
# => Includes compiled classes only
# => Requires classpath for dependencies

# Create uber JAR (with dependencies)
mvn clean package assembly:single
# => Requires maven-assembly-plugin configuration
# => Produces target/myapp-1.0-jar-with-dependencies.jar
# => Includes all dependencies in single JAR
# => Executable with java -jar command
```

**Gradle JAR creation**:

```bash
# Create standard JAR
./gradlew jar
# => Produces build/libs/myapp-1.0.jar
# => Includes compiled classes only

# Create fat JAR (shadow plugin)
./gradlew shadowJar
# => Requires com.github.johnrengelman.shadow plugin
# => Produces build/libs/myapp-1.0-all.jar
# => Includes all dependencies in single JAR
```

### Manual Deployment Steps

Deploying applications manually involves multiple error-prone steps.

**Traditional deployment process**:

```bash
# 1. Build application locally
mvn clean package
# => Creates target/myapp-1.0.jar
# => Takes 2-5 minutes depending on project size

# 2. Copy JAR to server
scp target/myapp-1.0.jar user@server:/opt/myapp/
# => Uses SSH file transfer
# => Requires server credentials
# => Network-dependent, may fail

# 3. SSH into server
ssh user@server
# => Manual connection to production server
# => Requires credentials or SSH keys

# 4. Stop running application
sudo systemctl stop myapp
# => Stops currently running service
# => Creates brief downtime

# 5. Replace JAR file
sudo mv /opt/myapp/myapp-1.0.jar /opt/myapp/myapp-1.0.jar.backup
sudo mv /tmp/myapp-1.0.jar /opt/myapp/myapp-1.0.jar
# => Manual file operations
# => Easy to make mistakes (wrong permissions, wrong location)

# 6. Start application
sudo systemctl start myapp
# => Starts new version
# => May fail to start if configuration issues

# 7. Verify deployment
curl http://localhost:8080/health
# => Manual verification
# => Easy to forget or skip
```

### Why Manual Processes Fail

**Human Error Sources**:

1. **Inconsistent steps**: Different developers follow different processes
2. **Forgotten steps**: Skipping critical verification or backup steps
3. **Environment differences**: Local build works but server deployment fails
4. **Time-consuming**: 30-60 minutes per deployment with manual verification
5. **No rollback plan**: Difficult to revert to previous version quickly
6. **Lack of testing**: Deployment to production without comprehensive testing
7. **No audit trail**: No record of who deployed what and when
8. **Credential management**: Shared passwords or SSH keys create security risks

**Before CI/CD**: Manual builds taking 30-60 minutes with inconsistent quality
**After CI/CD**: Automated pipelines completing in 5-10 minutes with consistent results

## GitHub Actions

GitHub Actions automates builds, tests, and deployments through YAML workflow files. Workflows run in GitHub-hosted or self-hosted runners with access to a rich ecosystem of pre-built actions.

### Workflow Syntax

GitHub Actions workflows use YAML syntax to define triggers, jobs, and steps.

**Basic workflow structure**:

```yaml
name: Java CI with Maven # Workflow display name in GitHub UI

on: # Trigger configuration
  push:
    branches: [main, develop] # => Runs on push to main or develop branches
  pull_request:
    branches: [main] # => Runs on pull requests targeting main

jobs: # Define one or more jobs
  build: # Job identifier (lowercase with hyphens)
    runs-on: ubuntu-latest # => Uses GitHub-hosted Ubuntu runner
    # => Runner has Java pre-installed but specific version setup needed

    steps: # Sequential steps within job
      - uses: actions/checkout@v4 # => Clones repository code
        # => Checks out pull request HEAD for PR events
        # => Checks out branch HEAD for push events

      - name: Set up JDK 21 # Step display name
        uses: actions/setup-java@v4 # => Pre-built action for Java setup
        with: # Action input parameters
          java-version: "21" # => Temurin JDK 21 (Eclipse Adoptium)
          distribution: "temurin" # => OpenJDK distribution
          cache: "maven" # => Caches ~/.m2/repository for faster builds

      - name: Build with Maven # Custom step name
        run: mvn clean verify # => Shell command executed in runner
        # => Compiles code, runs tests, packages application
        # => Exits with non-zero code on failure (fails workflow)
```

**Key concepts**:

- **Workflow**: Complete automation definition (one YAML file)
- **Job**: Collection of steps running on same runner
- **Step**: Single task (run command or use action)
- **Action**: Reusable unit of code (from marketplace or custom)
- **Runner**: Virtual machine executing the workflow

### Java Setup Actions

Configure Java environment using the official setup-java action.

**JDK version matrix**:

```yaml
name: Java Multi-Version Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix: # => Runs job multiple times with different parameters
        java-version: [17, 21] # => Test on Java 17 and 21
        # => Creates 2 separate job runs

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK ${{ matrix.java-version }}
        uses: actions/setup-java@v4
        with:
          java-version: ${{ matrix.java-version }} # => Uses matrix value
          # => First job uses 17, second uses 21
          distribution: "temurin" # => Eclipse Adoptium builds
          cache: "maven" # => Caches dependencies for faster subsequent builds

      - name: Build with Maven
        run: mvn clean verify
        # => Runs twice: once with JDK 17, once with JDK 21
        # => Both must pass for workflow success
```

**Distribution options**:

- **temurin**: Eclipse Adoptium (recommended, LTS support)
- **zulu**: Azul Zulu OpenJDK
- **adopt**: AdoptOpenJDK (legacy, use temurin instead)
- **liberica**: BellSoft Liberica JDK
- **corretto**: Amazon Corretto

### Maven in CI

Maven integration with dependency caching and parallel execution.

**Optimized Maven workflow**:

```yaml
name: Maven Build with Cache

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"
          cache: "maven" # => Automatically caches ~/.m2/repository
          # => Cache key: hash of pom.xml files
          # => Restores cache on subsequent runs (faster builds)

      - name: Build and verify
        run: |
          mvn clean verify \
            --batch-mode \ # => Non-interactive mode (no user prompts)
            --update-snapshots \ # => Force update SNAPSHOT dependencies
            --show-version # => Display Maven and JDK versions
        # => Compiles code
        # => Runs unit tests (surefire plugin)
        # => Runs integration tests (failsafe plugin)
        # => Creates JAR/WAR in target/

      - name: Generate test report
        if: always() # => Runs even if previous steps fail
        run: mvn surefire-report:report
        # => Generates HTML test reports
        # => Located in target/site/surefire-report.html

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results # => Artifact name in GitHub UI
          path: target/surefire-reports/ # => Test XML reports directory
          retention-days: 30 # => Keep artifacts for 30 days
```

### Gradle in CI

Gradle integration with build caching and performance optimization.

**Optimized Gradle workflow**:

```yaml
name: Gradle Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"

      - name: Setup Gradle
        uses: gradle/gradle-build-action@v2
        # => Manages Gradle installation and caching
        # => Caches Gradle wrapper, dependencies, build cache
        # => Automatic cache key management
        with:
          cache-read-only: false # => Allow cache writes (default: false)
          # => Set to true for pull requests to prevent cache pollution

      - name: Build with Gradle
        run: ./gradlew build --no-daemon
        # => Compiles, tests, packages application
        # => --no-daemon: Prevents background Gradle daemon (unnecessary in CI)
        # => Uses Gradle wrapper (./gradlew) for version consistency

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: jar-package
          path: build/libs/*.jar # => Uploads all JAR files from build output
```

### Test Execution

Automated test execution with reporting and failure handling.

**Comprehensive testing workflow**:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"
          cache: "maven"

      - name: Run unit tests
        run: mvn test
        # => Executes tests in src/test/java
        # => Generates reports in target/surefire-reports/
        # => Fails workflow if any test fails

      - name: Run integration tests
        run: mvn verify -DskipUnitTests=true
        # => Executes tests in src/test/java ending with *IT.java
        # => Starts/stops services if configured
        # => Requires maven-failsafe-plugin

      - name: Generate JaCoCo coverage report
        run: mvn jacoco:report
        # => Generates code coverage report
        # => Output: target/site/jacoco/index.html

      - name: Publish test results
        uses: dorny/test-reporter@v1
        if: always() # => Run even if tests fail
        with:
          name: Maven Tests # => Report name in GitHub UI
          path: target/surefire-reports/*.xml # => JUnit XML reports
          reporter: java-junit # => Report format parser
          fail-on-error: true # => Fail workflow if tests fail
```

### Artifact Publishing

Publish packages to Maven Central, GitHub Packages, or private repositories.

**Maven Central publishing**:

```yaml
name: Publish to Maven Central

on:
  release:
    types: [created] # => Triggers when GitHub release created

jobs:
  publish:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"
          server-id: ossrh # => Maven server ID for authentication
          server-username: MAVEN_USERNAME # => Environment variable name
          server-password: MAVEN_PASSWORD # => Environment variable name
          gpg-private-key: ${{ secrets.GPG_PRIVATE_KEY }} # => GPG key for signing
          gpg-passphrase: MAVEN_GPG_PASSPHRASE # => Environment variable name

      - name: Publish package
        run: mvn deploy -Prelease -DskipTests
        # => Activates release profile (includes javadoc, sources, signing)
        # => Skips tests (already tested in build job)
        # => Uploads to Maven Central via Sonatype OSSRH
        env:
          MAVEN_USERNAME: ${{ secrets.OSSRH_USERNAME }} # => Sonatype credentials
          MAVEN_PASSWORD: ${{ secrets.OSSRH_TOKEN }} # => Sonatype token
          MAVEN_GPG_PASSPHRASE: ${{ secrets.GPG_PASSPHRASE }} # => GPG key password
```

**GitHub Packages publishing**:

```yaml
name: Publish to GitHub Packages

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest

    permissions:
      contents: read
      packages: write # => Required for publishing to GitHub Packages

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"

      - name: Publish to GitHub Packages
        run: mvn deploy -DskipTests
        # => Uses distribution management from pom.xml
        # => Uploads to GitHub Packages repository
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # => Automatic token
          # => No manual secret configuration needed
```

### Docker Image Building

Build and push Docker images for containerized deployment.

**Docker build and push workflow**:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
    tags:
      - "v*.*.*" # => Triggers on version tags (v1.0.0, v2.1.3)

jobs:
  docker:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"
          cache: "maven"

      - name: Build JAR
        run: mvn clean package -DskipTests
        # => Creates target/myapp-1.0.jar
        # => Skips tests (separate test job recommended)

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        # => Enables advanced Docker features
        # => Required for multi-platform builds
        # => Enables build caching

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
          # => Authenticates with Docker Hub
          # => Required for pushing images

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: myorg/myapp # => Docker Hub image name
          tags: | # => Automatic tag generation
            type=ref,event=branch # => Branch name (main, develop)
            type=ref,event=pr # => PR number (pr-123)
            type=semver,pattern={{version}} # => Version from tag (1.0.0)
            type=semver,pattern={{major}}.{{minor}} # => Major.minor (1.0)
        # => Output: Docker tags and labels

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: . # => Build context (current directory)
          file: ./Dockerfile # => Dockerfile location
          push: true # => Push to Docker Hub after build
          tags: ${{ steps.meta.outputs.tags }} # => Tags from metadata step
          labels: ${{ steps.meta.outputs.labels }} # => Labels from metadata step
          cache-from: type=gha # => Use GitHub Actions cache
          cache-to: type=gha,mode=max # => Save to GitHub Actions cache
```

### Environment Secrets Management

Securely manage sensitive data using GitHub Secrets.

**Secrets configuration** (GitHub UI):

```
Settings → Secrets and variables → Actions → New repository secret

Secret names:
- DOCKERHUB_USERNAME → Docker Hub username
- DOCKERHUB_TOKEN → Docker Hub access token
- OSSRH_USERNAME → Sonatype OSSRH username
- OSSRH_TOKEN → Sonatype OSSRH token
- GPG_PRIVATE_KEY → GPG private key for artifact signing
- GPG_PASSPHRASE → GPG key passphrase
- DATABASE_URL → Database connection string
- API_KEY → External API key
```

**Using secrets in workflows**:

```yaml
name: Deploy Application

on:
  workflow_dispatch: # => Manual trigger from GitHub UI

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production # => Requires manual approval (optional)

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: ./deploy.sh
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          # => Injects secret as environment variable
          # => Masked in logs (shows *** instead of value)
          API_KEY: ${{ secrets.API_KEY }}
          # => Available to script as environment variables
          DEPLOY_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # => Automatic token, no manual configuration
```

**Secret security**:

- Secrets are encrypted at rest
- Masked in workflow logs (appears as `***`)
- Only available to workflows in the same repository
- Not available to forked repositories (security risk)
- Cannot be retrieved after creation (only updated)

### Matrix Builds

Test across multiple JDK versions and operating systems.

**Multi-dimensional matrix**:

```yaml
name: Cross-Platform Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }} # => Uses OS from matrix
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        # => Tests on Linux, Windows, macOS
        java-version: [17, 21]
        # => Tests on Java 17 and 21
        # => Creates 6 jobs total (3 OS × 2 Java versions)
      fail-fast: false # => Continue other jobs even if one fails
      # => Default: true (cancels all jobs on first failure)

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK ${{ matrix.java-version }}
        uses: actions/setup-java@v4
        with:
          java-version: ${{ matrix.java-version }}
          distribution: "temurin"
          cache: "maven"

      - name: Build with Maven
        run: mvn clean verify
        # => Runs 6 times: all combinations of OS and Java version
        # => Each job runs independently on separate runner

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.os }}-${{ matrix.java-version }}
          # => Unique artifact name per matrix combination
          path: target/surefire-reports/
```

## Jenkins

Jenkins provides self-hosted CI/CD with extensive plugin ecosystem. Pipeline as Code using Jenkinsfile enables version-controlled build definitions.

### Pipeline as Code

Define pipelines in Jenkinsfile stored alongside application code.

**Basic Jenkinsfile structure**:

```groovy
pipeline {
    agent any  // => Runs on any available Jenkins agent
               // => Can specify specific agent labels

    tools {
        maven 'Maven 3.9.6'  // => Uses Maven installation configured in Jenkins
                             // => Name matches Jenkins Global Tool Configuration
        jdk 'JDK 21'        // => Uses JDK 21 installation from Jenkins
                            // => Sets JAVA_HOME automatically
    }

    stages {  // => Sequential stages of the pipeline
        stage('Checkout') {
            steps {
                checkout scm  // => Checks out source code from repository
                              // => Uses repository configuration from job
                              // => Supports Git, SVN, Mercurial
            }
        }

        stage('Build') {
            steps {
                sh 'mvn clean compile'  // => Compiles source code
                                        // => sh: Unix/Linux shell command
                                        // => Use bat for Windows agents
            }
        }

        stage('Test') {
            steps {
                sh 'mvn test'  // => Runs unit tests
                               // => Generates test reports
            }
            post {
                always {
                    junit 'target/surefire-reports/*.xml'
                    // => Publishes JUnit test results to Jenkins
                    // => Creates test trend graphs
                    // => Marks build unstable if tests fail
                }
            }
        }

        stage('Package') {
            steps {
                sh 'mvn package -DskipTests'  // => Creates JAR/WAR artifact
                                              // => Skips tests (already ran in Test stage)
            }
        }
    }

    post {  // => Post-build actions (run after all stages)
        success {
            echo 'Build succeeded!'
            // => Only runs if all stages succeed
        }
        failure {
            echo 'Build failed!'
            // => Only runs if any stage fails
        }
        always {
            cleanWs()  // => Cleans workspace after build
                       // => Removes all files from build directory
        }
    }
}
```

### Declarative vs Scripted Pipelines

Jenkins supports two pipeline syntaxes with different trade-offs.

**Declarative pipeline** (recommended):

```groovy
pipeline {
    agent any

    environment {
        APP_VERSION = '1.0.0'  // => Available to all stages as ${APP_VERSION}
        DATABASE_URL = credentials('db-url')
        // => Loads credential from Jenkins credentials store
        // => Masked in console output
    }

    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'staging', 'production'],
            description: 'Deployment environment'
        )
        // => User selects value when triggering build
        // => Available as ${params.ENVIRONMENT}
    }

    stages {
        stage('Deploy') {
            when {
                branch 'main'  // => Only runs on main branch
                              // => Skipped for feature branches
            }
            steps {
                echo "Deploying version ${APP_VERSION} to ${params.ENVIRONMENT}"
                sh './deploy.sh ${params.ENVIRONMENT}'
            }
        }
    }
}
```

**Scripted pipeline** (more flexible):

```groovy
node {  // => Allocates Jenkins agent
       // => Equivalent to 'agent any' in declarative

    stage('Build') {
        try {
            checkout scm  // => Checks out code
            sh 'mvn clean verify'  // => Builds and tests

            if (env.BRANCH_NAME == 'main') {
                // => Conditional logic based on branch
                stage('Deploy') {
                    sh './deploy-production.sh'
                }
            }
        } catch (Exception e) {
            currentBuild.result = 'FAILURE'
            // => Marks build as failed
            throw e  // => Re-throws exception
        } finally {
            cleanWs()  // => Always cleans workspace
        }
    }
}
```

**When to use each**:

- **Declarative**: Standard builds with predictable structure (95% of use cases)
- **Scripted**: Complex logic requiring loops, conditionals, dynamic stages

### Maven/Gradle Integration

Jenkins provides native Maven and Gradle support with automatic tool installation.

**Maven pipeline with multi-module project**:

```groovy
pipeline {
    agent any

    tools {
        maven 'Maven 3.9.6'
        jdk 'JDK 21'
    }

    stages {
        stage('Build Modules') {
            steps {
                sh 'mvn clean install -pl common-lib -am'
                // => Builds common-lib module
                // => -pl: Projects list (specific module)
                // => -am: Also make (builds dependencies)
            }
        }

        stage('Build Application') {
            steps {
                sh 'mvn clean package -pl web-api -am -DskipTests'
                // => Builds web-api module and its dependencies
                // => Skips tests (separate test stage)
            }
        }

        stage('Test All') {
            parallel {  // => Runs stages in parallel
                stage('Unit Tests') {
                    steps {
                        sh 'mvn test'
                        // => Runs all unit tests across modules
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'mvn verify -DskipUnitTests'
                        // => Runs integration tests only
                    }
                }
            }
        }
    }
}
```

**Gradle pipeline with build caching**:

```groovy
pipeline {
    agent any

    tools {
        jdk 'JDK 21'
        // => Gradle wrapper (./gradlew) provides Gradle version
        // => No separate Gradle tool configuration needed
    }

    environment {
        GRADLE_OPTS = '-Dorg.gradle.daemon=false -Dorg.gradle.caching=true'
        // => Disables Gradle daemon (unnecessary in CI)
        // => Enables build cache for faster builds
    }

    stages {
        stage('Build') {
            steps {
                sh './gradlew clean build --no-daemon'
                // => Compiles, tests, packages application
                // => --no-daemon: Explicit daemon disable
            }
        }

        stage('Publish') {
            when {
                branch 'main'
            }
            steps {
                sh './gradlew publish'
                // => Publishes to configured repository
                // => Uses credentials from gradle.properties or environment
            }
        }
    }
}
```

### Test Reports

Jenkins visualizes test results and tracks trends over time.

**JUnit test reporting**:

```groovy
pipeline {
    agent any

    stages {
        stage('Test') {
            steps {
                sh 'mvn test'
                // => Runs tests, generates XML reports
            }
            post {
                always {
                    junit testResults: 'target/surefire-reports/*.xml',
                          allowEmptyResults: true
                    // => Publishes test results to Jenkins
                    // => Creates test trend graphs
                    // => Marks build unstable (yellow) if tests fail
                    // => allowEmptyResults: Don't fail if no tests found
                }
            }
        }
    }
}
```

**JaCoCo coverage reporting**:

```groovy
pipeline {
    agent any

    stages {
        stage('Test with Coverage') {
            steps {
                sh 'mvn clean test jacoco:report'
                // => Runs tests with JaCoCo agent
                // => Generates coverage report in target/site/jacoco/
            }
            post {
                always {
                    jacoco execPattern: 'target/jacoco.exec',
                           classPattern: 'target/classes',
                           sourcePattern: 'src/main/java'
                    // => Publishes coverage report to Jenkins
                    // => Creates coverage trend graphs
                    // => Shows coverage per package/class/method
                }
            }
        }
    }
}
```

### Artifact Archiving

Store build artifacts in Jenkins for later retrieval and deployment.

**Archiving JAR files**:

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package'
                // => Creates target/myapp-1.0.jar
            }
            post {
                success {
                    archiveArtifacts artifacts: 'target/*.jar',
                                     fingerprint: true
                    // => Stores JAR files in Jenkins
                    // => fingerprint: Tracks artifact across builds
                    // => Available in Jenkins UI for download
                    // => Used by downstream jobs
                }
            }
        }
    }
}
```

### Deployment Stages

Multi-stage deployments with approval gates for production.

**Deployment pipeline with approval**:

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package'
            }
        }

        stage('Deploy to Dev') {
            steps {
                sh './deploy.sh dev'
                // => Automatic deployment to development
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                sh './deploy.sh staging'
                // => Automatic deployment to staging
            }
        }

        stage('Approval') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?',
                      ok: 'Deploy',
                      submitter: 'admin,release-manager'
                // => Pauses pipeline for manual approval
                // => Only specified users can approve
                // => Timeout can be configured
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                sh './deploy.sh production'
                // => Deployment only after approval
            }
        }
    }
}
```

### Credentials Management

Store secrets securely in Jenkins credentials store.

**Using credentials in pipeline**:

```groovy
pipeline {
    agent any

    environment {
        DB_CREDS = credentials('database-credentials')
        // => Loads username/password credential
        // => Creates DB_CREDS_USR and DB_CREDS_PSW variables
        // => Masked in console output (shows ****)

        API_TOKEN = credentials('api-token-secret')
        // => Loads secret text credential
        // => Available as single variable
    }

    stages {
        stage('Deploy') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key', variable: 'AWS_KEY')
                ]) {
                    sh '''
                        aws configure set aws_access_key_id $AWS_KEY
                        aws s3 cp target/app.jar s3://my-bucket/
                    '''
                    // => AWS_KEY only available within this block
                    // => More secure than environment variables
                }
            }
        }
    }
}
```

## CI Best Practices

### Fast Feedback Loop

Optimize pipelines for rapid developer feedback.

**Fail fast strategies**:

```yaml
# GitHub Actions
jobs:
  quick-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Compile only
        run: mvn clean compile
        # => Fails within 1-2 minutes if compilation errors
        # => Provides immediate feedback before running tests

  test:
    needs: quick-checks # => Only runs if quick-checks succeeds
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: mvn test
        # => Runs only after successful compilation
```

**Jenkins pipeline**:

```groovy
pipeline {
    agent any
    stages {
        stage('Quick Checks') {
            parallel {
                stage('Compile') {
                    steps {
                        sh 'mvn clean compile'
                        // => Fast compilation check
                    }
                }
                stage('Lint') {
                    steps {
                        sh 'mvn checkstyle:check'
                        // => Code style validation
                    }
                }
            }
        }
        stage('Full Test Suite') {
            steps {
                sh 'mvn test'
                // => Runs only if quick checks pass
            }
        }
    }
}
```

### Build Matrix

Test across multiple JDK versions to ensure compatibility.

**Testing Java 17 and 21**:

```yaml
# GitHub Actions
strategy:
  matrix:
    java: [17, 21]
runs-on: ubuntu-latest
steps:
  - uses: actions/setup-java@v4
    with:
      java-version: ${{ matrix.java }}
      distribution: "temurin"
  - run: mvn clean verify
    # => Both versions must pass
```

**Jenkins multi-configuration**:

```groovy
pipeline {
    agent none
    stages {
        stage('Test Matrix') {
            matrix {
                agent any
                axes {
                    axis {
                        name 'JAVA_VERSION'
                        values '17', '21'
                    }
                }
                stages {
                    stage('Build') {
                        tools {
                            jdk "JDK ${JAVA_VERSION}"
                        }
                        steps {
                            sh 'mvn clean verify'
                        }
                    }
                }
            }
        }
    }
}
```

### Test Parallelization

Run tests concurrently for faster feedback.

**Maven Surefire parallel execution**:

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.3</version>
    <configuration>
        <parallel>classes</parallel>
        <!-- Run test classes in parallel -->
        <threadCount>4</threadCount>
        <!-- Use 4 threads (adjust based on runner CPU) -->
    </configuration>
</plugin>
```

**Gradle parallel test execution**:

```groovy
// build.gradle
test {
    maxParallelForks = Runtime.runtime.availableProcessors()
    // => Uses all available CPU cores
    // => Automatically adapts to runner capacity
}
```

### Caching Dependencies

Cache dependencies to reduce build time.

**GitHub Actions Maven cache**:

```yaml
- uses: actions/setup-java@v4
  with:
    cache: "maven"
    # => Caches ~/.m2/repository
    # => Cache key: hash of **/pom.xml
    # => Restores on subsequent runs
```

**GitHub Actions Gradle cache**:

```yaml
- uses: gradle/gradle-build-action@v2
  # => Automatically caches:
  #    - Gradle wrapper
  #    - Dependencies (~/.gradle/caches)
  #    - Build cache (~/.gradle/build-cache)
```

**Jenkins caching**:

```groovy
pipeline {
    agent any
    options {
        // Use Jenkins workspace caching plugin
        disableConcurrentBuilds()
        // Prevents workspace corruption from parallel builds
    }
    stages {
        stage('Build') {
            steps {
                // Maven local repository persists across builds
                sh 'mvn clean verify'
            }
        }
    }
}
```

### Artifact Management

Version and store artifacts systematically.

**Semantic versioning**:

```xml
<!-- pom.xml -->
<version>1.2.3</version>
<!-- Major.Minor.Patch -->
<!-- 1.x.x: Breaking changes -->
<!-- x.2.x: New features (backward compatible) -->
<!-- x.x.3: Bug fixes -->
```

**Snapshot versions**:

```xml
<version>1.2.3-SNAPSHOT</version>
<!-- -SNAPSHOT: Development version -->
<!-- Automatically published to snapshot repository -->
<!-- Updated on every build -->
```

**GitHub Actions artifact retention**:

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: app-jar
    path: target/*.jar
    retention-days: 90 # Keep artifacts for 90 days
    # Default: 90 days
    # Max: 400 days (varies by plan)
```

### Branch Protection Rules

Require CI success before merging pull requests.

**GitHub branch protection** (Settings → Branches):

- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require review from Code Owners
- ✅ Require signed commits
- ✅ Include administrators (no bypass)

**Prevents**:

- Merging failing builds
- Deploying untested code
- Breaking the main branch

## CD Patterns

### Blue-Green Deployment

Run two identical production environments and switch traffic between them.

**Pattern**:

```
Blue Environment (current production)
  ↓
Deploy new version to Green Environment
  ↓
Test Green Environment
  ↓
Switch traffic from Blue to Green
  ↓
Green becomes production, Blue becomes standby
```

**Implementation**:

```groovy
// Jenkinsfile
stage('Blue-Green Deploy') {
    steps {
        // Deploy to green environment
        sh './deploy-green.sh'

        // Run smoke tests
        sh './test-green.sh'

        // Switch load balancer
        sh './switch-to-green.sh'

        // Green is now production
    }
}
```

**Benefits**:

- Zero downtime deployments
- Instant rollback (switch back to blue)
- Full production testing before cutover

### Canary Releases

Gradually roll out changes to subset of users.

**Pattern**:

```
Route 5% of traffic to new version
  ↓
Monitor metrics (error rate, latency)
  ↓
If healthy: increase to 25%
  ↓
If healthy: increase to 50%
  ↓
If healthy: increase to 100%
```

**GitHub Actions with Kubernetes**:

```yaml
- name: Canary deployment
  run: |
    kubectl apply -f k8s/canary.yaml
    # Deploys canary with 10% traffic weight
    sleep 300 # Wait 5 minutes
    kubectl apply -f k8s/production.yaml
    # Promotes canary to full production
```

### Rolling Updates

Update instances gradually without downtime.

**Pattern**:

```
3 instances running v1.0
  ↓
Update instance 1 to v1.1 (2 instances still v1.0)
  ↓
Update instance 2 to v1.1 (1 instance still v1.0)
  ↓
Update instance 3 to v1.1 (all instances now v1.1)
```

**Kubernetes rolling update**:

```yaml
# deployment.yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1 # At most 1 instance down at a time
      maxSurge: 1 # At most 1 extra instance during update
```

### Database Migrations

Manage database schema changes in deployment pipeline.

**Flyway migration** (version-controlled SQL):

```groovy
// Jenkinsfile
stage('Database Migration') {
    steps {
        sh '''
            mvn flyway:migrate \
              -Dflyway.url=$DATABASE_URL \
              -Dflyway.user=$DB_USER \
              -Dflyway.password=$DB_PASSWORD
        '''
        // Applies pending migrations
        // Migrations in src/main/resources/db/migration/
        // Format: V1__initial_schema.sql, V2__add_users_table.sql
    }
}
```

**Liquibase migration** (XML/YAML changesets):

```groovy
stage('Database Migration') {
    steps {
        sh '''
            mvn liquibase:update \
              -Dliquibase.url=$DATABASE_URL \
              -Dliquibase.username=$DB_USER \
              -Dliquibase.password=$DB_PASSWORD
        '''
    }
}
```

### Feature Flags

Deploy incomplete features behind runtime toggles.

**Pattern**:

```java
if (featureFlags.isEnabled("new-checkout-flow")) {
// => Feature flag check: queries runtime configuration (not compile-time)
// => Flag source: database, config service, environment variable
// => Dynamic behavior: can toggle without code deployment
    return newCheckoutService.process(order);
// => New implementation: executes when flag enabled
// => Gradual rollout: enable for 1% → 10% → 100% of users
} else {
// => Fallback path: executes when flag disabled
    return legacyCheckoutService.process(order);
// => Legacy implementation: existing proven code
// => Zero-downtime rollback: disable flag instantly if new code has issues
}
// => Feature toggle pattern: both implementations deployed, flag controls activation
// => CI/CD benefit: merge code before feature complete, activate when ready
```

**Benefits**:

- Deploy code without activating features
- Test in production with selected users
- Instant rollback by disabling flag (no deployment)
- A/B testing different implementations

## Integration with Java Tools

### JaCoCo Coverage Reports

Measure and enforce code coverage standards.

**Coverage enforcement**:

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <executions>
        <execution>
            <id>check</id>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### Checkstyle/SpotBugs in CI

Enforce code quality standards automatically.

**GitHub Actions quality checks**:

```yaml
- name: Run Checkstyle
  run: mvn checkstyle:check
  # Fails if code style violations found

- name: Run SpotBugs
  run: mvn spotbugs:check
  # Fails if potential bugs detected

- name: Run PMD
  run: mvn pmd:check
  # Fails if code quality issues found
```

**Jenkins quality gates**:

```groovy
stage('Code Quality') {
    parallel {
        stage('Checkstyle') {
            steps {
                sh 'mvn checkstyle:checkstyle'
                recordIssues(
                    tools: [checkStyle(pattern: 'target/checkstyle-result.xml')]
                )
            }
        }
        stage('SpotBugs') {
            steps {
                sh 'mvn spotbugs:spotbugs'
                recordIssues(
                    tools: [spotBugs(pattern: 'target/spotbugsXml.xml')]
                )
            }
        }
    }
}
```

### SonarQube Integration

Continuous code quality inspection and security analysis.

**GitHub Actions with SonarCloud**:

```yaml
- name: SonarCloud Scan
  run: |
    mvn verify sonar:sonar \
      -Dsonar.projectKey=myorg_myapp \
      -Dsonar.organization=myorg \
      -Dsonar.host.url=https://sonarcloud.io \
      -Dsonar.login=${{ secrets.SONAR_TOKEN }}
  # Uploads analysis to SonarCloud
  # Quality gate must pass for build success
```

**Jenkins with SonarQube server**:

```groovy
stage('SonarQube Analysis') {
    steps {
        withSonarQubeEnv('SonarQube Server') {
            sh 'mvn sonar:sonar'
        }
    }
}
stage('Quality Gate') {
    steps {
        timeout(time: 5, unit: 'MINUTES') {
            waitForQualityGate abortPipeline: true
            // Waits for SonarQube analysis results
            // Fails build if quality gate fails
        }
    }
}
```

### Dependency Vulnerability Scanning

Automatically detect security vulnerabilities in dependencies.

**OWASP Dependency Check**:

```yaml
# GitHub Actions
- name: OWASP Dependency Check
  run: mvn dependency-check:check
  # Scans dependencies against NVD database
  # Generates report in target/dependency-check-report.html

- name: Upload security report
  uses: actions/upload-artifact@v4
  with:
    name: security-report
    path: target/dependency-check-report.html
```

**Snyk integration**:

```yaml
- name: Snyk security scan
  uses: snyk/actions/maven@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=high
    # Fails build on high-severity vulnerabilities
```

## Related Content

- [Build Tools](/en/learn/software-engineering/programming-languages/java/in-the-field/build-tools) - Maven and Gradle fundamentals for CI/CD
- [Linting and Formatting](/en/learn/software-engineering/programming-languages/java/in-the-field/linting-and-formatting) - Code quality tools in CI pipelines
- [Docker and Kubernetes](/en/learn/software-engineering/programming-languages/java/in-the-field/docker-and-kubernetes) - Container-based deployment strategies
- [Cloud-Native Patterns](/en/learn/software-engineering/programming-languages/java/in-the-field/cloud-native-patterns) - Twelve-Factor App principles for CI/CD
- [Logging](/en/learn/software-engineering/programming-languages/java/in-the-field/logging) - Structured logging for CI/CD observability
