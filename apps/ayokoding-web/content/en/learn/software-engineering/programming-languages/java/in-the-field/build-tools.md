---
title: "Build Tools"
date: 2026-02-03T00:00:00+07:00
draft: false
description: Comprehensive guide to Java build automation from manual compilation to Maven and Gradle
weight: 10000001
tags: ["java", "maven", "gradle", "build-tools", "dependency-management"]
---

## Why Build Tools Matter

Build tools automate the compilation, testing, packaging, and deployment of Java applications. Manual builds become unmaintainable as projects grow in complexity and dependencies.

**Core Benefits**:

- **Automation**: Compile, test, and package with single command
- **Dependency management**: Automatically download and manage libraries
- **Reproducibility**: Same build process across all environments
- **Standardization**: Consistent project structure and conventions
- **CI/CD integration**: Seamless integration with continuous integration pipelines

**Problem**: Manual compilation with javac becomes tedious with multiple source files, external dependencies, test execution, and packaging requirements.

**Solution**: Use build tools like Maven or Gradle to automate the entire build lifecycle with dependency management.

## Build Tool Comparison

| Tool       | Pros                                     | Cons                         | Use When                            |
| ---------- | ---------------------------------------- | ---------------------------- | ----------------------------------- |
| **Maven**  | Convention-based, mature, huge ecosystem | XML verbosity, inflexible    | Standard Java projects, enterprises |
| **Gradle** | Flexible, concise DSL, faster builds     | Steeper learning curve       | Complex builds, Android projects    |
| **javac**  | No dependencies, complete control        | Manual dependency management | Learning fundamentals, simple tools |
| **Ant**    | Flexible XML build scripts               | No dependency management     | Legacy projects only                |

**Recommendation**: Use Maven for standard Java applications and Gradle when you need build flexibility or performance. Both are excellent choices.

**Recommended progression**: Start with manual javac/jar to understand compilation fundamentals → Learn Maven for convention-based builds → Explore Gradle for advanced scenarios.

## Manual Building with Standard Library

Java's standard library provides javac compiler and jar packager. Use these tools to understand build fundamentals before introducing build automation.

### Compiling with javac

Compile Java source files to bytecode (.class files) using the javac command.

**Basic pattern** (single file):

```bash
# Compile single source file
javac HelloWorld.java  # => Compiles HelloWorld.java to HelloWorld.class (bytecode)
                       # => Creates .class file in same directory as source
                       # => Bytecode runs on any JVM (platform-independent)

# Execute compiled class
java HelloWorld  # => Runs HelloWorld.class bytecode
                 # => JVM finds HelloWorld.class in current directory
                 # => Executes main() method
                 # => Note: NO .class extension in command
```

**Multiple source files**:

```bash
# Compile all Java files in current directory
javac *.java  # => Compiles ALL .java files: Main.java, Utils.java, Calculator.java → .class files
              # => * is shell glob pattern (expands to all .java files)
              # => Creates: Main.class, Utils.class, Calculator.class

# Compile with explicit source files
javac Main.java Utils.java Calculator.java  # => Compiles specified files in order
                                             # => Automatically compiles dependencies if needed
                                             # => If Main.java uses Utils.java, javac compiles Utils.java first

# Execute main class
java Main  # => Runs Main.class (must contain public static void main(String[] args))
           # => JVM loads Main.class, Utils.class, Calculator.class as needed
           # => Classpath is current directory by default
```

**Output directory** (-d flag):

```bash
# Create output directory
mkdir -p build/classes  # => Creates build/classes directory (parent directories created with -p)
                        # => -p flag prevents error if directory already exists

# Compile to specific directory
javac -d build/classes src/Main.java src/Utils.java  # => -d flag specifies output directory for .class files
                                                      # => Compiles src/Main.java → build/classes/Main.class
                                                      # => Compiles src/Utils.java → build/classes/Utils.class
                                                      # => Preserves package structure if classes have package declarations

# Execute from output directory
java -cp build/classes Main  # => -cp (classpath) flag tells JVM where to find .class files
                              # => JVM looks in build/classes directory for Main.class
                              # => Loads dependencies (Utils.class) from same directory
```

### Managing Dependencies (Classpath)

Include external libraries using the classpath (-cp flag).

**Pattern** (single dependency):

```bash
# Download dependency manually (example: JSON library)
curl -o libs/json.jar https://repo1.maven.org/maven2/org/json/json/20240303/json-20240303.jar  # => Downloads JSON library JAR from Maven Central
                                                                                                # => Saves as libs/json.jar
                                                                                                # => Manual dependency management (tedious for multiple dependencies)

# Compile with classpath
javac -cp libs/json.jar -d build/classes src/JsonExample.java  # => -cp libs/json.jar adds JSON library to classpath
                                                                # => Compiler can resolve imports from org.json package
                                                                # => Compiles JsonExample.java → build/classes/JsonExample.class

# Execute with classpath
java -cp build/classes:libs/json.jar JsonExample  # => -cp specifies TWO classpath entries separated by colon (Linux/Mac)
                                                   # => build/classes contains JsonExample.class
                                                   # => libs/json.jar contains org.json classes
                                                   # => JVM searches both locations for classes
                                                   # => Windows uses semicolon separator: build\classes;libs\json.jar
```

**Multiple dependencies**:

```bash
# Compile with multiple JARs (Linux/Mac)
javac -cp "libs/*" -d build/classes src/Application.java

# Execute with multiple JARs (Linux/Mac)
java -cp "build/classes:libs/*" Application

# Windows uses semicolon separator
javac -cp "libs/*" -d build\classes src\Application.java
java -cp "build\classes;libs\*" Application
```

**Problem**: Manual dependency management becomes unmanageable with transitive dependencies (dependencies of dependencies).

### Creating JAR Files

Package compiled classes into distributable JAR files using the jar command.

**Basic JAR** (library):

```bash
# Create JAR from compiled classes
jar -cvf myapp.jar -C build/classes .  # => Creates JAR archive named myapp.jar
                                       # => -C build/classes changes directory to build/classes
                                       # => . adds all files from build/classes directory
                                       # => Result: myapp.jar contains all .class files

# Flags:
#   -c: create archive  # => Creates new JAR file (not executable without manifest)
#   -v: verbose output  # => Prints files being added to JAR
#   -f: specify filename  # => Next argument is JAR filename (myapp.jar)
#   -C: change to directory before adding files  # => Avoids including directory structure in JAR
```

**Executable JAR** (with manifest):

```bash
# Create manifest file
cat > manifest.txt <<'EOF'  # => Creates manifest.txt with heredoc syntax
Main-Class: com.example.Main  # => Specifies entry point class (must have main method)
Class-Path: libs/json.jar libs/commons-lang3.jar  # => Specifies external JAR dependencies (relative paths)
EOF  # => Each entry on new line, blank line at end REQUIRED

# Create executable JAR
jar -cvfm myapp.jar manifest.txt -C build/classes .  # => -m flag includes manifest.txt in JAR
                                                     # => Manifest stored in META-INF/MANIFEST.MF inside JAR
                                                     # => JAR now executable with java -jar

# Execute JAR
java -jar myapp.jar  # => -jar flag executes JAR as application
                     # => JVM reads Main-Class from manifest
                     # => Loads com.example.Main and calls main() method
                     # => Searches for dependencies in Class-Path locations
                     # => Requires libs/json.jar and libs/commons-lang3.jar present
```

**Uber JAR** (fat JAR with dependencies):

```bash
# Extract dependency JARs
mkdir temp
cd temp
jar -xf ../libs/json.jar
jar -xf ../libs/commons-lang3.jar
cd ..

# Combine with application classes
cp -r build/classes/* temp/

# Create uber JAR
jar -cvfe myapp-uber.jar com.example.Main -C temp .

# Execute uber JAR (no classpath needed!)
java -jar myapp-uber.jar
```

### Why Manual Building Doesn't Scale

**Limitations**:

1. **Dependency management**: No transitive dependency resolution
2. **Versioning**: No automatic version conflict resolution
3. **Repository access**: No central repository integration
4. **Build lifecycle**: No standardized phases (compile, test, package)
5. **Testing**: No test execution automation
6. **Plugin ecosystem**: No reusable build plugins
7. **Multi-module projects**: Complex coordination between modules
8. **Reproducibility**: Difficult to ensure same build across environments

**Before**: Manual javac with shell scripts and manual dependency management
**After**: Build tools with automated dependency resolution and lifecycle management

## Maven

Maven is a convention-based build tool that uses XML configuration (pom.xml) and provides dependency management through Maven Central repository.

### Project Structure Convention

Maven enforces a standard directory structure.

**Standard layout**:

```
myproject/
├── pom.xml                    # Project Object Model (build configuration)
├── src/
│   ├── main/
│   │   ├── java/              # Application source code
│   │   │   └── com/example/
│   │   │       └── Main.java
│   │   └── resources/         # Application resources (config, properties)
│   │       └── application.properties
│   └── test/
│       ├── java/              # Test source code
│       │   └── com/example/
│       │       └── MainTest.java
│       └── resources/         # Test resources
└── target/                    # Build output (generated)
    ├── classes/               # Compiled application classes
    ├── test-classes/          # Compiled test classes
    └── myproject-1.0.jar      # Packaged JAR
```

**Benefits**:

- **Consistency**: All Maven projects follow same structure
- **Tooling**: IDEs automatically recognize Maven projects
- **Convention**: No configuration needed for standard layout

### Basic POM Structure

The Project Object Model (pom.xml) defines project configuration, dependencies, and build settings.

**Minimal pom.xml**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- Project coordinates (identify this project) -->
    <groupId>com.example</groupId>
    <artifactId>myapp</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <!-- Project metadata -->
    <name>My Application</name>
    <description>Example Maven project</description>

    <!-- Properties (variables) -->
    <properties>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <!-- Dependencies -->
    <dependencies>
        <!-- SLF4J Logging -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>2.0.9</version>
        </dependency>

        <!-- JUnit 5 (test scope) -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.1</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

**Key elements**:

- **Coordinates**: groupId (organization), artifactId (project name), version (release version)
- **Properties**: Configuration variables (Java version, encoding)
- **Dependencies**: External libraries with scope (compile, test, runtime, provided)

### Maven Build Lifecycle

Maven defines a standard build lifecycle with phases executed in order.

**Default lifecycle phases**:

| Phase        | Description                                  | Bindings                      |
| ------------ | -------------------------------------------- | ----------------------------- |
| **validate** | Validate project structure and configuration | -                             |
| **compile**  | Compile source code                          | maven-compiler-plugin:compile |
| **test**     | Run unit tests                               | maven-surefire-plugin:test    |
| **package**  | Package compiled code (JAR, WAR)             | maven-jar-plugin:jar          |
| **verify**   | Run integration tests and validation         | maven-failsafe-plugin:verify  |
| **install**  | Install package to local repository          | maven-install-plugin:install  |
| **deploy**   | Deploy package to remote repository          | maven-deploy-plugin:deploy    |

**Additional lifecycle** (clean):

| Phase     | Description                   | Bindings                 |
| --------- | ----------------------------- | ------------------------ |
| **clean** | Remove build output (target/) | maven-clean-plugin:clean |

**Common commands**:

```bash
# Clean build output
mvn clean

# Compile source code
mvn compile

# Run tests
mvn test

# Package without tests
mvn package -DskipTests

# Full build (compile, test, package)
mvn clean package

# Install to local repository (~/.m2/repository)
mvn clean install

# Run specific phase
mvn verify
```

**Phase execution**: Running a phase executes all preceding phases automatically.

**Example**:

```bash
# This command runs: validate → compile → test → package
mvn package
```

### Dependency Management

Maven automatically downloads dependencies from Maven Central repository and manages transitive dependencies.

**Adding dependencies**:

```xml
<dependencies>
    <!-- JSON processing with Jackson -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.16.1</version>
    </dependency>

    <!-- Spring Boot Starter Web (includes many transitive deps) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <version>3.2.1</version>
    </dependency>

    <!-- JUnit 5 for testing -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

**Dependency scopes**:

| Scope        | Description                                          | Included In                 |
| ------------ | ---------------------------------------------------- | --------------------------- |
| **compile**  | Default scope, available everywhere                  | Compile, test, runtime      |
| **test**     | Only available during test compilation and execution | Test only                   |
| **runtime**  | Not needed for compilation, only runtime             | Runtime, test               |
| **provided** | Provided by JDK or container (servlet API)           | Compile, test (not runtime) |

**Finding dependencies** (search Maven Central):

```bash
# Visit: https://mvnrepository.com
# Search for library name, copy dependency XML
```

**View dependency tree**:

```bash
# Show all dependencies including transitive
mvn dependency:tree

# Filter by artifact
mvn dependency:tree -Dincludes=com.fasterxml.jackson.core

# Show only conflicts
mvn dependency:tree -Dverbose
```

### Dependency Conflicts and Resolution

Maven resolves version conflicts using "nearest definition" strategy.

**Conflict example**:

```
Project
├── jackson-databind:2.16.1
│   └── jackson-core:2.16.1 (transitive)
└── custom-lib:1.0
    └── jackson-core:2.15.0 (transitive)
```

**Resolution**: Maven chooses 2.16.1 (shorter path to project root).

**Force specific version** (dependency management):

```xml
<dependencyManagement>
    <dependencies>
        <!-- Override transitive dependency version -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-core</artifactId>
            <version>2.16.1</version>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <!-- Dependencies inherit versions from dependencyManagement -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.16.1</version>
    </dependency>
</dependencies>
```

**Exclude transitive dependency**:

```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>custom-lib</artifactId>
    <version>1.0</version>
    <exclusions>
        <exclusion>
            <!-- Exclude old jackson-core -->
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-core</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

### Maven Plugins

Plugins extend Maven capabilities for compilation, testing, packaging, and deployment.

**Common plugins**:

```xml
<build>
    <plugins>
        <!-- Compiler Plugin (specify Java version) -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.12.1</version>
            <configuration>
                <source>21</source>
                <target>21</target>
            </configuration>
        </plugin>

        <!-- Surefire Plugin (unit tests) -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.2.3</version>
        </plugin>

        <!-- JaCoCo Plugin (code coverage) -->
        <plugin>
            <groupId>org.jacoco</groupId>
            <artifactId>jacoco-maven-plugin</artifactId>
            <version>0.8.11</version>
            <executions>
                <execution>
                    <goals>
                        <goal>prepare-agent</goal>
                    </goals>
                </execution>
                <execution>
                    <id>report</id>
                    <phase>test</phase>
                    <goals>
                        <goal>report</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>

        <!-- Assembly Plugin (create uber JAR) -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-assembly-plugin</artifactId>
            <version>3.6.0</version>
            <configuration>
                <descriptorRefs>
                    <descriptorRef>jar-with-dependencies</descriptorRef>
                </descriptorRefs>
                <archive>
                    <manifest>
                        <mainClass>com.example.Main</mainClass>
                    </manifest>
                </archive>
            </configuration>
            <executions>
                <execution>
                    <phase>package</phase>
                    <goals>
                        <goal>single</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

**Generate coverage report**:

```bash
mvn clean test

# Report available at: target/site/jacoco/index.html
```

### Multi-Module Projects

Maven supports projects composed of multiple modules with shared configuration.

**Structure**:

```
parent-project/
├── pom.xml                    # Parent POM
├── common-lib/
│   ├── pom.xml                # Module POM
│   └── src/
├── web-api/
│   ├── pom.xml                # Module POM
│   └── src/
└── cli-tool/
    ├── pom.xml                # Module POM
    └── src/
```

**Parent pom.xml**:

```xml
<project>
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>parent-project</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>

    <!-- Modules -->
    <modules>
        <module>common-lib</module>
        <module>web-api</module>
        <module>cli-tool</module>
    </modules>

    <!-- Shared properties -->
    <properties>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
    </properties>

    <!-- Shared dependency versions -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.slf4j</groupId>
                <artifactId>slf4j-api</artifactId>
                <version>2.0.9</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

**Module pom.xml** (web-api/pom.xml):

```xml
<project>
    <modelVersion>4.0.0</modelVersion>

    <!-- Parent reference -->
    <parent>
        <groupId>com.example</groupId>
        <artifactId>parent-project</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>web-api</artifactId>
    <packaging>jar</packaging>

    <dependencies>
        <!-- Depend on sibling module -->
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>common-lib</artifactId>
            <version>${project.version}</version>
        </dependency>

        <!-- Inherit version from parent -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
        </dependency>
    </dependencies>
</project>
```

**Build all modules**:

```bash
# From parent directory
mvn clean install

# Build specific module
mvn -pl web-api clean package

# Build module and dependencies
mvn -pl web-api -am clean package
```

## Gradle

Gradle is a flexible build tool using Groovy or Kotlin DSL for configuration. It's faster than Maven with incremental builds and build caching.

### Project Structure

Gradle follows Maven conventions but is more flexible.

**Standard layout** (same as Maven):

```
myproject/
├── build.gradle               # Build configuration (Groovy DSL)
├── settings.gradle            # Project settings
├── gradlew                    # Gradle Wrapper (Unix)
├── gradlew.bat                # Gradle Wrapper (Windows)
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── src/
│   ├── main/
│   │   ├── java/
│   │   └── resources/
│   └── test/
│       ├── java/
│       └── resources/
└── build/                     # Build output (generated)
    ├── classes/
    ├── libs/
    └── reports/
```

### Basic build.gradle

Configure builds using Groovy DSL (or Kotlin DSL with build.gradle.kts).

**Minimal build.gradle**:

```groovy
plugins {
    id 'java'
}

group = 'com.example'
version = '1.0.0'

sourceCompatibility = '21'
targetCompatibility = '21'

repositories {
    mavenCentral()
}

dependencies {
    // Compile dependencies
    implementation 'org.slf4j:slf4j-api:2.0.9'
    implementation 'ch.qos.logback:logback-classic:1.4.11'

    // Test dependencies
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.1'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

test {
    useJUnitPlatform()
}
```

**Kotlin DSL** (build.gradle.kts):

```kotlin
plugins {
    java
}

group = "com.example"
version = "1.0.0"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.slf4j:slf4j-api:2.0.9")
    implementation("ch.qos.logback:logback-classic:1.4.11")

    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.test {
    useJUnitPlatform()
}
```

### Gradle Tasks and Build Lifecycle

Gradle uses tasks instead of lifecycle phases. Tasks can depend on other tasks.

**Common tasks**:

| Task            | Description                            | Similar to Maven        |
| --------------- | -------------------------------------- | ----------------------- |
| **clean**       | Delete build directory                 | mvn clean               |
| **compileJava** | Compile source code                    | mvn compile             |
| **test**        | Run unit tests                         | mvn test                |
| **build**       | Full build (compile, test, assemble)   | mvn package             |
| **jar**         | Create JAR file                        | mvn package             |
| **assemble**    | Assemble outputs without running tests | mvn package -DskipTests |
| **check**       | Run tests and verification tasks       | mvn verify              |

**Common commands**:

```bash
# List available tasks
./gradlew tasks

# Clean build output
./gradlew clean

# Compile source code
./gradlew compileJava

# Run tests
./gradlew test

# Full build (compile, test, package)
./gradlew clean build

# Build without tests
./gradlew build -x test

# Run specific task
./gradlew jar
```

### Dependency Configurations

Gradle uses configurations instead of scopes for dependency management.

**Dependency configurations**:

| Configuration          | Description                                        | Maven Equivalent |
| ---------------------- | -------------------------------------------------- | ---------------- |
| **implementation**     | Compile-time dependency (not exposed to consumers) | compile          |
| **api**                | Compile-time dependency (exposed to consumers)     | compile          |
| **compileOnly**        | Compile-time only (not in runtime classpath)       | provided         |
| **runtimeOnly**        | Runtime only (not needed for compilation)          | runtime          |
| **testImplementation** | Test compile and runtime                           | test             |
| **testCompileOnly**    | Test compile only                                  | test (provided)  |
| **testRuntimeOnly**    | Test runtime only                                  | test (runtime)   |

**Example**:

```groovy
dependencies {
    // API dependencies (exposed to consumers of this library)
    api 'com.fasterxml.jackson.core:jackson-databind:2.16.1'

    // Implementation dependencies (internal only)
    implementation 'org.apache.commons:commons-lang3:3.14.0'

    // Compile-only (provided by runtime environment)
    compileOnly 'javax.servlet:javax.servlet-api:4.0.1'

    // Runtime-only
    runtimeOnly 'com.h2database:h2:2.2.224'

    // Test dependencies
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.1'
    testImplementation 'org.mockito:mockito-core:5.8.0'
}
```

### Gradle Wrapper

Gradle Wrapper ensures consistent Gradle version across all developers and CI environments.

**Generate wrapper**:

```bash
# Generate wrapper with specific Gradle version
gradle wrapper --gradle-version 8.5
```

**Use wrapper** (instead of gradle command):

```bash
# Unix/Mac
./gradlew build

# Windows
gradlew.bat build
```

**Benefits**:

- **Version consistency**: All developers use same Gradle version
- **No installation**: Wrapper downloads Gradle automatically
- **CI friendly**: No Gradle pre-installation required

### Custom Tasks

Define custom build tasks using Groovy DSL.

**Example tasks**:

```groovy
// Task with dependencies
tasks.register('hello') {
    doLast {
        println 'Hello from Gradle!'
    }
}

// Task that depends on other tasks
tasks.register('buildAndDeploy') {
    dependsOn build
    doLast {
        println 'Deploying application...'
        // Deployment logic
    }
}

// Task with configuration
tasks.register('generateDocs', Javadoc) {
    source = sourceSets.main.allJava
    classpath = configurations.compileClasspath
    destinationDir = file("$buildDir/docs")
}

// Task with input/output (for incremental builds)
tasks.register('processResources', Copy) {
    from 'src/main/resources'
    into "$buildDir/processed-resources"
    filter { line -> line.replaceAll('@VERSION@', project.version) }
}
```

**Run custom task**:

```bash
./gradlew hello
./gradlew buildAndDeploy
./gradlew generateDocs
```

### Multi-Project Builds

Gradle supports multi-project builds similar to Maven multi-module projects.

**Structure**:

```
parent-project/
├── settings.gradle            # Define subprojects
├── build.gradle               # Root build configuration
├── common-lib/
│   ├── build.gradle
│   └── src/
├── web-api/
│   ├── build.gradle
│   └── src/
└── cli-tool/
    ├── build.gradle
    └── src/
```

**settings.gradle**:

```groovy
rootProject.name = 'parent-project'

include 'common-lib'
include 'web-api'
include 'cli-tool'
```

**Root build.gradle** (shared configuration):

```groovy
subprojects {
    apply plugin: 'java'

    group = 'com.example'
    version = '1.0.0'

    sourceCompatibility = '21'

    repositories {
        mavenCentral()
    }

    dependencies {
        testImplementation 'org.junit.jupiter:junit-jupiter:5.10.1'
    }

    test {
        useJUnitPlatform()
    }
}
```

**Subproject build.gradle** (web-api/build.gradle):

```groovy
dependencies {
    // Depend on sibling project
    implementation project(':common-lib')

    // Project-specific dependencies
    implementation 'org.springframework.boot:spring-boot-starter-web:3.2.1'
}
```

**Build all projects**:

```bash
# Build all subprojects
./gradlew build

# Build specific project
./gradlew :web-api:build

# Build project with dependencies
./gradlew :web-api:build --include-build common-lib
```

### Gradle vs Maven

**Comparison**:

| Feature              | Maven                         | Gradle                                 |
| -------------------- | ----------------------------- | -------------------------------------- |
| **Configuration**    | XML (pom.xml)                 | Groovy or Kotlin DSL                   |
| **Build speed**      | Moderate                      | Fast (incremental builds, caching)     |
| **Flexibility**      | Convention-based, inflexible  | Highly flexible, extensible            |
| **Learning curve**   | Easier (standard conventions) | Steeper (more concepts)                |
| **Dependency DSL**   | XML verbose                   | Concise DSL                            |
| **Multi-module**     | Good support                  | Excellent support                      |
| **Plugin ecosystem** | Huge, mature                  | Growing, modern                        |
| **IDE support**      | Excellent                     | Excellent                              |
| **Build cache**      | No                            | Yes (build cache, task output caching) |

**Choose Maven when**:

- Standard Java project with conventional structure
- Team prefers explicit XML configuration
- Enterprise environment with established Maven infrastructure

**Choose Gradle when**:

- Need build flexibility and customization
- Build performance is critical (large projects)
- Android development (Gradle is the standard)
- Prefer concise DSL over XML

## Dependency Management Best Practices

### Use Bill of Materials (BOM)

BOM (Bill of Materials) manages consistent versions across related dependencies.

**Maven BOM**:

```xml
<dependencyManagement>
    <dependencies>
        <!-- Spring Boot BOM -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <!-- No version needed - inherited from BOM -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

**Gradle BOM**:

```groovy
dependencies {
    // Import BOM
    implementation platform('org.springframework.boot:spring-boot-dependencies:3.2.1')

    // No version needed
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

### Pin Dependency Versions

Explicitly specify versions to ensure reproducible builds.

**Maven** (properties for version management):

```xml
<properties>
    <jackson.version>2.16.1</jackson.version>
    <junit.version>5.10.1</junit.version>
</properties>

<dependencies>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>${jackson.version}</version>
    </dependency>

    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-core</artifactId>
        <version>${jackson.version}</version>
    </dependency>
</dependencies>
```

**Gradle** (extra properties):

```groovy
ext {
    jacksonVersion = '2.16.1'
    junitVersion = '5.10.1'
}

dependencies {
    implementation "com.fasterxml.jackson.core:jackson-databind:${jacksonVersion}"
    testImplementation "org.junit.jupiter:junit-jupiter:${junitVersion}"
}
```

### Minimize Dependencies

Only include dependencies actually needed. Each dependency adds:

- **Security risk**: More libraries = more vulnerabilities
- **Size**: Larger artifacts and memory footprint
- **Complexity**: More transitive dependencies to manage
- **Compatibility**: Increased chance of conflicts

**Audit dependencies**:

```bash
# Maven: Check for unused dependencies
mvn dependency:analyze

# Gradle: Display dependency insight
./gradlew dependencyInsight --dependency jackson-databind
```

### Check for Vulnerabilities

Regularly scan dependencies for known security vulnerabilities.

**Maven** (OWASP Dependency Check):

```xml
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>9.0.9</version>
    <executions>
        <execution>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

```bash
mvn dependency-check:check
```

**Gradle** (Dependency Check):

```groovy
plugins {
    id 'org.owasp.dependencycheck' version '9.0.9'
}

dependencyCheck {
    format = 'HTML'
}
```

```bash
./gradlew dependencyCheckAnalyze
```

## Build Reproducibility

### Lock Dependency Versions

Lock dependency versions to ensure same dependencies across builds.

**Maven** (lock file plugin):

```bash
# Generate lock file
mvn io.github.chains-project:maven-lockfile:generate

# Validate against lock file
mvn io.github.chains-project:maven-lockfile:validate
```

**Gradle** (built-in dependency locking):

```groovy
dependencyLocking {
    lockAllConfigurations()
}
```

```bash
# Generate lock files
./gradlew dependencies --write-locks

# Verify using lock files (default behavior)
./gradlew build
```

### Use Dependency Cache

Configure dependency caching for faster builds.

**Maven** (local repository):

```bash
# Default local repository
~/.m2/repository

# Custom repository location
mvn -Dmaven.repo.local=/path/to/repo install
```

**Gradle** (build cache):

```groovy
// gradle.properties
org.gradle.caching=true
org.gradle.parallel=true
```

```bash
# Enable build cache for single build
./gradlew build --build-cache
```

## CI/CD Integration

### Maven in CI

**GitHub Actions example**:

```yaml
name: Maven Build

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
          cache: "maven"

      - name: Build with Maven
        run: mvn clean verify
```

### Gradle in CI

**GitHub Actions example**:

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
        with:
          cache-read-only: false

      - name: Build with Gradle
        run: ./gradlew build

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: build/test-results/
```

## Related Content

- [CI/CD Pipelines](/en/learn/software-engineering/programming-languages/java/in-the-field/ci-cd) - Continuous integration and deployment patterns
- [Linting and Formatting](/en/learn/software-engineering/programming-languages/java/in-the-field/linting-and-formatting) - Code quality tools integration
- [Security Practices](/en/learn/software-engineering/programming-languages/java/in-the-field/security-practices) - Dependency vulnerability scanning
- [Docker and Kubernetes](/en/learn/software-engineering/programming-languages/java/in-the-field/docker-and-kubernetes) - Containerizing Java applications
- [Building CLI Applications](/en/learn/software-engineering/programming-languages/java/in-the-field/cli-app) - Creating command-line tools
