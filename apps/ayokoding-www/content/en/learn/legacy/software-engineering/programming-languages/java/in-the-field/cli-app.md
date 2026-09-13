---
title: "Cli App"
date: 2026-02-03T00:00:00+07:00
draft: false
description: Comprehensive guide to building command-line applications in Java with argument parsing, input/output handling, and native compilation
weight: 10000029
tags: ["java", "cli", "command-line", "picocli", "graalvm", "terminal"]
---

## Why CLI Applications Matter

Command-line applications are essential for automation, DevOps tooling, build systems, and system administration. Java's portability and ecosystem make it excellent for building cross-platform CLI tools.

**Core Benefits**:

- **Automation**: Script repetitive tasks
- **DevOps tooling**: Build deployment pipelines
- **Data processing**: Transform and analyze files
- **System administration**: Manage infrastructure
- **Developer tools**: Create custom build and deployment tools

**Problem**: Building robust CLI apps requires argument parsing, error handling, configuration management, and proper exit codes - all tedious with raw System.out.

**Solution**: Use CLI frameworks and libraries to handle common patterns professionally.

## CLI Framework Comparison

| Framework              | Pros                                         | Cons                          | Use When                     |
| ---------------------- | -------------------------------------------- | ----------------------------- | ---------------------------- |
| **picocli**            | Annotation-based, feature-rich, autocomplete | Learning curve                | Complex CLI with subcommands |
| **Apache Commons CLI** | Simple, mature, lightweight                  | Verbose API, limited features | Simple argument parsing      |
| **JCommander**         | Annotation-based, simple                     | Less active development       | Medium complexity            |
| **Args4j**             | Lightweight, annotation-based                | Limited features              | Basic argument parsing       |
| **Raw args[]**         | No dependencies                              | Manual parsing, error-prone   | Trivial one-argument tools   |

**Recommendation**: Use picocli for production CLI applications - it's the modern standard with excellent GraalVM support.

**Recommended progression**: Start with raw args[] to understand CLI fundamentals → Learn System streams and exit codes → Use picocli for production CLIs.

## Standard Library CLI Basics

**Foundation**: Command-line argument parsing (args[] array, System streams, BufferedReader, exit codes) is covered in [by-example intermediate section](/en/learn/software-engineering/programming-languages/java/by-example/intermediate#cli-basics). This guide focuses on production CLI applications with picocli framework.

### Why Standard Library Approach is Limited

**Quick summary of standard library CLI basics:**

| Feature          | Standard Library                 | Use Case                  |
| ---------------- | -------------------------------- | ------------------------- |
| Args parsing     | `args[]` array with loops        | Simple positional args    |
| Options/flags    | Manual `-c`/`--count` matching   | Basic flags               |
| User input       | `BufferedReader(System.in)`      | Interactive prompts       |
| Output           | `System.out` / `System.err`      | Output and error messages |
| Exit codes       | `System.exit(0)` for success     | Signal to calling process |
| Stream direction | `>` stdout, `2>` stderr in shell | Pipe and redirect output  |

See [by-example intermediate section](/en/learn/software-engineering/programming-languages/java/by-example/intermediate#cli-basics) for detailed code examples.

**Critical limitations for production CLIs**:

- **Verbose parsing**: 50+ lines for basic option parsing
- **No type conversion**: Manual parseInt(), parseDouble() everywhere
- **No validation**: Must write custom validation logic
- **No automatic help**: Help text manually synchronized with code
- **No subcommands**: Difficult to organize complex CLIs (like git)
- **Error-prone**: Easy to miss edge cases (missing values, invalid types)
- **No auto-completion**: Cannot generate shell completion scripts
- **Poor maintainability**: Changes require updating parsing logic and help text

**Real-world complexity**:

```java
// A production CLI tool requires:
// - Multiple subcommands (init, build, deploy, status)
// => Organize related operations under parent commands
// => Example: git (commit, push, pull), docker (build, run, stop)
// - Options with short/long forms (-v/--verbose)
// => Support both POSIX (-v) and GNU (--verbose) conventions
// => Short forms enable quick typing, long forms improve script readability
// - Required vs optional parameters
// => Validate presence at runtime, not compile-time
// => Provide clear error messages for missing required args
// - Type conversion (String, int, File, URL)
// => Convert string arguments to typed Java objects automatically
// => Handle parsing errors with user-friendly messages
// - Input validation (ranges, formats, file existence)
// => Check constraints before processing (fail-fast principle)
// => Validate port ranges (1-65535), file existence, URL formats
// - Automatic help generation
// => Generate --help output from annotations/code structure
// => Keep documentation synchronized with implementation
// - Version information
// => Support --version flag for debugging and support
// => Include build timestamp and git commit hash in production
// - Shell completion scripts
// => Generate bash/zsh/fish completion for better UX
// => Enable tab-completion for subcommands and options
// - Error messages with suggestions
// => "Did you mean 'commit'?" for typos (Levenshtein distance)
// => Suggest correct usage when validation fails

// Standard library approach would require 500+ lines of boilerplate.
// => Manual parsing: if-else chains for each option
// => Manual validation: null checks, range checks, type conversions
// => Manual help text: synchronized with argument parsing logic
// => Error-prone: easy to miss edge cases or introduce bugs
// Frameworks solve this with annotations and automatic generation.
// => Declarative approach: describe structure, framework handles parsing
// => Type-safe: compile-time checking for option types
// => DRY principle: single source of truth for CLI structure
```

**When standard library is acceptable**:

- Simple utilities (1-2 arguments, no options)
- Learning CLI fundamentals
- No dependencies constraint (embedded systems)
- Trivial automation scripts

**For production**: Use picocli or Apache Commons CLI (covered next).

## picocli - Modern CLI Framework (External Library)

Picocli uses annotations to define CLI structure, handling parsing, validation, and help generation automatically.

### Basic Command Structure

**Pattern**:

```java
import picocli.CommandLine;
// => Picocli main class - CLI parser and executor
import picocli.CommandLine.*;
// => Import annotations (@Command, @Option, @Parameters)

@Command(name = "greet",
// => Command name used in CLI invocation: java GreetCommand
         description = "Greets users",
// => Shown in --help output for user guidance
         version = "1.0.0")
// => Displayed with --version flag, supports semantic versioning
class GreetCommand implements Runnable {
// => Runnable interface: picocli calls run() after parsing args
// => Alternative: Callable<Integer> for custom exit codes

    @Parameters(index = "0", description = "Name to greet")
// => Positional argument at index 0 (first argument after command)
// => Required by default - parsing fails if missing
    private String name;
// => Picocli injects parsed value via reflection
// => Type conversion from String[] args happens automatically

    @Option(names = {"-c", "--count"}, description = "Repetition count")
// => Named option with short (-c) and long (--count) forms
// => Optional - uses default value if not provided
    private int count = 1;
// => Default value 1 when --count omitted
// => Picocli parses String to int, fails on invalid numbers

    @Override
    public void run() {
// => Business logic after successful argument parsing
        for (int i = 0; i < count; i++) {
// => Repeat greeting 'count' times
            System.out.println("Hello, " + name + "!");
// => Output to stdout for normal output (not stderr)
        }
    }

    public static void main(String[] args) {
// => Entry point: java GreetCommand Alice --count 3
        int exitCode = new CommandLine(new GreetCommand()).execute(args);
// => CommandLine: parser + executor in one call
// => execute(): parses args, calls run(), returns exit code
// => Returns 0 on success, 2 on validation error, 1 on exception
        System.exit(exitCode);
// => Exit with code for shell scripts to check success/failure
// => Proper exit codes enable CLI composition in pipelines
    }
}
```

**Usage**:

```bash
java GreetCommand Alice
# Output: Hello, Alice!

java GreetCommand Alice --count 3
# Output:
# Hello, Alice!
# Hello, Alice!
# Hello, Alice!
```

**Before**: Manual args parsing with if/else chains
**After**: Declarative annotations with automatic validation

### Options and Parameters

**Options** (named arguments):

```java
@Option(names = {"-v", "--verbose"}, description = "Verbose output")
// => Boolean option: presence sets true, absence keeps false
// => No value required: --verbose is flag, not --verbose=true
boolean verbose;
// => Default false when omitted
// => Used to control log level or output detail

@Option(names = {"-o", "--output"}, description = "Output file")
// => File type: picocli converts String to File object
// => Does NOT validate existence - you control semantics
File outputFile;
// => Null when omitted (optional output file)
// => Check null to decide stdout vs file output

@Option(names = {"-p", "--port"}, defaultValue = "8080")
// => Numeric option with default value
// => String "8080" parsed to int automatically
int port;
// => Type conversion handles NumberFormatException
// => Use @Range(min=1, max=65535) to validate port range
```

**Parameters** (positional arguments):

```java
@Parameters(index = "0", description = "Source file")
// => First positional argument (index 0)
// => Required by default - command fails if missing
File source;
// => Converted from String path to File object
// => Validates format but not existence (check manually)

@Parameters(index = "1..*", description = "Target files")
// => Range notation: index 1 to end ("1..*")
// => Accepts one or more arguments after source
List<File> targets;
// => Multiple arguments collected into List<File>
// => Empty list if no arguments provided (arity default)
// => Use arity = "1..*" to require at least one target
```

**Problem**: Manual parsing requires index tracking and type conversion.

**Solution**: Picocli handles parsing, type conversion, and bounds checking automatically.

### Subcommands

Organize complex CLIs with subcommands (like git: `git commit`, `git push`).

**Pattern**:

```java
@Command(name = "db",
// => Parent command grouping related operations
         description = "Database operations",
// => Shown when user runs: java DbCommand --help
         subcommands = {MigrateCommand.class, SeedCommand.class})
// => Register subcommand classes for: db migrate, db seed
// => Picocli instantiates and routes to correct subcommand
class DbCommand {}
// => No implementation needed - just subcommand container
// => Could add shared options inherited by subcommands

@Command(name = "migrate", description = "Run migrations")
// => Subcommand invoked as: java DbCommand migrate
class MigrateCommand implements Runnable {
// => Runnable: run() called when subcommand matched
    @ParentCommand
// => Inject parent command instance for accessing shared state
// => Access parent options or configuration
    private DbCommand parent;
// => Populated after parsing, before run() executes

    @Override
    public void run() {
// => Migration execution logic
        System.out.println("Running migrations...");
// => Production: connect to DB, apply migration files
// => Check migration history table to avoid re-running
    }
}

@Command(name = "seed", description = "Seed database")
// => Separate subcommand: java DbCommand seed
class SeedCommand implements Runnable {
// => Independent implementation from MigrateCommand
    @Override
    public void run() {
        System.out.println("Seeding database...");
// => Production: insert test/demo data
// => Idempotent: check if data exists before inserting
    }
}
```

**Usage**:

```bash
java DbCommand migrate
java DbCommand seed
```

### Help Generation

Picocli generates help automatically from annotations.

**Pattern**:

```java
@Command(name = "app",
// => Command name for CLI invocation
         description = "Application CLI",
// => Brief description shown in help output
         mixinStandardHelpOptions = true)  // Adds --help and --version
// => Automatic help/version support without manual coding
// => --help: generated from annotations (description, parameters, options)
// => --version: uses version string from @Command annotation
// => Exit code 0 when --help/--version used (not error)
class App {}
// => Minimal command class - all functionality via mixins
// => Production: add Runnable/Callable for actual behavior
```

**Usage**:

```bash
java App --help
# Output:
# Usage: app [-hV] <command>
# Application CLI
#   -h, --help      Show this help message
#   -V, --version   Print version information
```

## Input/Output Handling

### Reading User Input

**Interactive prompts**:

```java
import java.io.*;
// => BufferedReader for efficient line-based input reading

BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
// => Wrap System.in (byte stream) with InputStreamReader (char stream)
// => BufferedReader adds readLine() method for line-based input
// => Buffering improves performance for interactive input

System.out.print("Enter name: ");
// => Prompt without newline (print, not println)
// => User types on same line as prompt
String name = reader.readLine();
// => Blocks until user presses Enter
// => Returns String without trailing newline
// => Returns null on EOF (Ctrl+D on Unix, Ctrl+Z on Windows)

System.out.print("Enter age: ");
// => Second prompt for numeric input
int age = Integer.parseInt(reader.readLine());
// => Manual type conversion from String to int
// => Throws NumberFormatException on invalid input
// => Production: wrap in try-catch and re-prompt on error
```

**With picocli interactive option**:

```java
@Option(names = {"-p", "--password"},
// => Password option supporting both CLI and interactive input
        description = "Password",
// => Shown in help text (don't leak sensitive defaults)
        interactive = true)  // Prompts if not provided
// => If --password omitted: prompts user interactively
// => If --password provided: uses CLI value (scripting)
// => Interactive mode hides input (no echo to terminal)
char[] password;
// => char[] instead of String for security
// => Strings are immutable and stay in memory longer
// => char[] can be zeroed after use: Arrays.fill(password, ' ')
// => Prevents password lingering in heap dumps
```

**Problem**: System.in reading is verbose and requires exception handling.

**Solution**: Use picocli's interactive options or helper methods.

### Writing Output

**Standard output**:

```java
System.out.println("Normal output");      // stdout
// => Standard output stream (file descriptor 1)
// => For data, results, primary command output
// => Redirectable: java App > output.txt
// => Pipeable: java App | grep "pattern"
System.err.println("Error output");       // stderr
// => Standard error stream (file descriptor 2)
// => For errors, warnings, progress indicators
// => Separate redirection: java App 2> errors.txt
// => Always visible even when stdout redirected
```

**Formatted output**:

```java
System.out.printf("Name: %s, Age: %d%n", name, age);
// => Formatted output with type-safe placeholders
// => %s: String format specifier
// => %d: decimal integer format specifier
// => %n: platform-independent newline (not \n)
// => Type checking: compile-time safety vs string concatenation
```

**File output**:

```java
try (PrintWriter writer = new PrintWriter(new FileWriter(outputFile))) {
// => try-with-resources: auto-close writer on exit (success or exception)
// => PrintWriter wraps FileWriter for convenient println() method
// => FileWriter opens file for writing (creates if not exists, truncates if exists)
    writer.println("Output line");
// => Write line with platform-independent newline
// => PrintWriter buffers for efficiency (flushes on close)
} catch (IOException e) {
// => Handle file access errors: permission denied, disk full, path invalid
    System.err.println("Error writing file: " + e.getMessage());
// => User-friendly error message to stderr
// => e.getMessage() provides specific error reason
    System.exit(1);
// => Exit with code 1 (general error) for shell script detection
// => Alternative: throw exception and let main() handle exit code
}
```

### Progress Indicators

**Simple progress**:

```java
for (int i = 0; i < total; i++) {
// => Loop through items to process
    processItem(i);
// => Do actual work for each item
    System.err.printf("\rProcessing: %d/%d", i + 1, total);
// => \r: carriage return (move cursor to line start)
// => Overwrites same line for dynamic progress
// => stderr: visible even when stdout redirected
// => i+1: display 1-based count for user (not 0-based)
}
System.err.println();  // New line after completion
// => Move cursor to new line after progress done
// => Prevents next output from overwriting progress line
```

**With ProgressBar library** (external):

```java
try (ProgressBar pb = new ProgressBar("Processing", total)) {
// => ProgressBar library (external dependency)
// => AutoCloseable: finishes bar display on close
// => "Processing": label shown with progress bar
// => total: maximum count for percentage calculation
    for (int i = 0; i < total; i++) {
// => Iterate through all items
        processItem(i);
// => Execute actual task for item
        pb.step();
// => Increment progress bar by one step
// => Updates visual bar, percentage, ETA automatically
// => Thread-safe for parallel processing
    }
}
// => Progress bar automatically finalized and moved to new line
```

## Exit Codes

Use standard exit codes to communicate success/failure to shell scripts.

**Standard exit codes**:

- **0**: Success
- **1**: General error
- **2**: Misuse of command
- **126**: Command cannot execute
- **127**: Command not found
- **128+n**: Fatal error signal n

**Pattern**:

```java
public static void main(String[] args) {
// => CLI entry point
    try {
        runApplication(args);
// => Execute main business logic
        System.exit(0);  // Success
// => Exit code 0: success for shell scripts
// => Shell: $? == 0 means success, non-zero means failure
    } catch (ValidationException e) {
// => Catch validation errors separately for specific exit code
        System.err.println("Error: " + e.getMessage());
// => User-friendly error message to stderr
        System.exit(2);  // Validation error
// => Exit code 2: misuse of command (standard convention)
// => Distinguishes user error from system error
    } catch (Exception e) {
// => Catch all other exceptions (unexpected errors)
        System.err.println("Unexpected error: " + e.getMessage());
// => Brief error message for users
        e.printStackTrace();
// => Stack trace to stderr for debugging
// => Production: log to file instead of console
        System.exit(1);  // General error
// => Exit code 1: general error (standard convention)
// => Indicates application failure to shell
    }
}
```

**With picocli**:

```java
public static void main(String[] args) {
// => CLI application entry point
    int exitCode = new CommandLine(new App()).execute(args);
// => new CommandLine(new App()): create parser for App command
// => execute(args): parse arguments and run command logic
// => Returns exit code: 0 success, 1 exception, 2 validation error
// => Picocli handles exception mapping to exit codes automatically
    System.exit(exitCode);
// => Exit JVM with appropriate code for shell script integration
// => Shell can check: if [ $? -eq 0 ]; then echo "success"; fi
}
```

**Problem**: Hardcoded System.exit() makes testing difficult.

**Solution**: Picocli returns exit codes, allowing tests to verify without actually exiting.

## Configuration Management

### Command-line Configuration

**Environment variables**:

```java
String dbUrl = System.getenv("DATABASE_URL");
// => Read environment variable DATABASE_URL
// => Returns null if variable not set in environment
// => Case-sensitive: DATABASE_URL != database_url
if (dbUrl == null) {
// => Check if environment variable was set
    dbUrl = "jdbc:postgresql:app";  // Default
// => Fallback to development default
// => Production: fail instead of defaulting (fail-fast)
// => 12-factor app: configuration via environment
}
```

**With picocli**:

```java
@Option(names = "--db-url",
// => CLI option for database URL
        description = "Database URL",
// => Help text shown in --help output
        defaultValue = "${DATABASE_URL:-jdbc:postgresql:app}")
// => Variable interpolation syntax (shell-like)
// => ${DATABASE_URL}: try environment variable first
// => :-jdbc:postgresql:app: fallback default (localhost, default port)
// => Picocli resolves at parse time (not compile time)
String dbUrl;
// => Resolved value injected after parsing
// => Precedence: CLI arg > env var > default value
```

### Configuration Files

**Properties files**:

```java
Properties props = new Properties();
// => Java properties file parser (key=value format)
try (InputStream input = new FileInputStream("config.properties")) {
// => try-with-resources: auto-close file on exit
// => FileInputStream: read bytes from config file
    props.load(input);
// => Parse properties file into key-value map
// => Format: db.url=jdbc:postgresql:app
    String dbUrl = props.getProperty("db.url");
// => Get value by key (dot notation for namespacing)
// => Returns null if key not found (check before use)
} catch (IOException e) {
// => Handle file not found, permission denied, corrupt file
    System.err.println("Error loading config: " + e.getMessage());
// => User-friendly error to stderr
// => Production: fail fast if config required, or use defaults
}
```

**YAML configuration** (with Jackson or SnakeYAML):

```java
ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
// => Jackson ObjectMapper configured for YAML parsing
// => YAMLFactory: parse YAML instead of JSON
// => Requires jackson-dataformat-yaml dependency
Config config = mapper.readValue(new File("config.yaml"), Config.class);
// => Parse YAML file and deserialize to Config POJO
// => Maps YAML keys to Java fields via Jackson annotations
// => Type-safe: compile-time checking for config structure
// => Throws IOException on file error, parsing error
```

### Configuration Precedence

**Standard precedence order** (highest to lowest):

1. Command-line arguments
2. Environment variables
3. Configuration file
4. Defaults

**Pattern**:

```java
String getValue(String cliArg, String envVar, String configKey, String defaultValue) {
// => Configuration precedence resolver
// => Standard precedence: CLI > env > config > default
    if (cliArg != null) return cliArg;
// => Highest priority: explicit CLI argument
// => User explicitly provided this value
    String env = System.getenv(envVar);
// => Read environment variable (12-factor app config)
    if (env != null) return env;
// => Second priority: environment variable
// => Deployment-specific configuration
    String config = loadFromConfig(configKey);
// => Load from config file (properties, YAML, etc.)
    if (config != null) return config;
// => Third priority: configuration file
// => Project-specific defaults
    return defaultValue;
// => Lowest priority: hardcoded default
// => Sensible fallback for development
}
```

## Error Handling

### User-Friendly Error Messages

**Before** (developer-focused):

```
Exception in thread "main" java.lang.NullPointerException
    at App.run(App.java:42)
```

**After** (user-focused):

```
Error: File 'data.csv' not found
Please check the file path and try again.
```

**Pattern**:

```java
try {
    processFile(file);
// => Execute file processing logic
} catch (FileNotFoundException e) {
// => Specific exception for missing file
// => More specific than IOException (catch order matters)
    System.err.println("Error: File '" + file + "' not found");
// => User-friendly error with filename context
// => Don't show stack trace for expected user errors
    System.err.println("Please check the file path and try again.");
// => Actionable guidance for user to fix problem
    System.exit(1);
// => Exit code 1: general error (file operation failed)
} catch (IOException e) {
// => General I/O errors: permission denied, corrupt file, disk error
    System.err.println("Error reading file: " + e.getMessage());
// => Show exception message for debugging
// => getMessage() provides specific error detail
    System.exit(1);
// => Exit code 1: general error
}
```

### Validation

**Input validation**:

```java
@Parameters(index = "0", description = "Port number")
// => First positional argument (required)
@CommandLine.Range(min = 1, max = 65535)  // Picocli validation
// => Automatic range validation at parse time
// => min=1: ports start at 1 (0 reserved)
// => max=65535: maximum 16-bit port number
// => Fails with clear error if out of range
int port;
// => Type conversion from String to int
// => Validated before run() executes (fail-fast)
```

**Custom validation**:

```java
if (!file.exists()) {
// => Validate file existence at runtime
// => Picocli converts string to File but doesn't check existence
    throw new ParameterException(
// => Picocli-specific exception for validation errors
        spec.commandLine(),
// => CommandLine instance for error reporting
// => spec: injected CommandSpec for context
        "File does not exist: " + file);
// => Error message shown to user
// => Picocli handles formatting and exit code (2)
}
```

## Testing CLI Applications

### Unit Testing Commands

**Pattern**:

```java
@Test
void testGreetCommand() {
// => Unit test for command logic (not CLI parsing)
    GreetCommand cmd = new GreetCommand();
// => Instantiate command directly (no CLI parsing)
    cmd.name = "Alice";
// => Set fields directly (bypass @Parameters parsing)
    cmd.count = 2;
// => Test with specific count value

    ByteArrayOutputStream out = new ByteArrayOutputStream();
// => Capture stdout to in-memory stream
    System.setOut(new PrintStream(out));
// => Redirect stdout to our capture stream
// => Original stdout: saved and can be restored

    cmd.run();
// => Execute command business logic
// => Output goes to captured stream, not console

    String output = out.toString();
// => Convert captured bytes to String
    assertThat(output).contains("Hello, Alice!");
// => Verify greeting message appears
    assertThat(output.split("\n")).hasSize(2);
// => Verify two lines (count=2)
// => Tests repetition logic
}
```

### Integration Testing with picocli

**Pattern**:

```java
@Test
void testCommandLineExecution() {
// => Integration test with full CLI parsing
    ByteArrayOutputStream out = new ByteArrayOutputStream();
// => Capture stdout
    ByteArrayOutputStream err = new ByteArrayOutputStream();
// => Capture stderr (for error messages)

    int exitCode = new CommandLine(new GreetCommand())
// => Create CommandLine parser for GreetCommand
        .setOut(new PrintWriter(out, true))
// => Redirect stdout to capture stream
// => true: auto-flush for immediate capture
        .setErr(new PrintWriter(err, true))
// => Redirect stderr to capture stream
        .execute("Alice", "--count", "2");
// => Execute with string arguments (simulates CLI)
// => Tests full pipeline: parsing → validation → execution
// => Returns exit code (0 success, 1 error, 2 validation)

    assertThat(exitCode).isEqualTo(0);
// => Verify successful execution
    assertThat(out.toString()).contains("Hello, Alice!");
// => Verify correct output was generated
}
```

### Testing Exit Codes

**Pattern**:

```java
@Test
void testInvalidArguments() {
// => Test error handling for invalid CLI input
    int exitCode = new CommandLine(new GreetCommand())
        .execute("--invalid-option");
// => Pass unrecognized option
// => Picocli detects unknown option during parsing
// => Does NOT call run() - fails before execution

    assertThat(exitCode).isEqualTo(2);  // Misuse of command
// => Exit code 2: validation/usage error
// => Standard convention for argument errors
// => Distinguishes user error (2) from application error (1)
}
```

## Native Compilation with GraalVM

GraalVM native-image compiles Java to native executable for faster startup and lower memory usage.

### Why Native Compilation

**Benefits**:

- **Fast startup**: Milliseconds instead of seconds
- **Low memory**: No JVM heap overhead
- **Single executable**: No JRE required
- **Smaller footprint**: Better for containers

**Trade-offs**:

- **Build time**: Native compilation is slow (minutes)
- **Reflection limitations**: Requires configuration
- **No dynamic class loading**: AOT compilation only

### Building Native Image

**Install GraalVM**:

```bash
sdk install java 21.0.1-graalce
sdk use java 21.0.1-graalce
```

**Compile to native**:

```bash
native-image -jar app.jar app
# Creates 'app' executable
```

**With Maven**:

```xml
<plugin>
<!-- => GraalVM Maven plugin for native compilation -->
    <groupId>org.graalvm.buildtools</groupId>
<!-- => Official GraalVM build tools -->
    <artifactId>native-maven-plugin</artifactId>
<!-- => Native image Maven integration -->
    <version>0.10.3</version>
<!-- => Plugin version (update regularly for fixes) -->
    <executions>
<!-- => Define when plugin executes -->
        <execution>
            <goals>
                <goal>compile-no-fork</goal>
<!-- => compile-no-fork: build native image without forking JVM -->
<!-- => Faster than 'compile' goal for single build -->
<!-- => Runs during package phase by default -->
            </goals>
        </execution>
    </executions>
</plugin>
<!-- => Usage: mvn -Pnative package -->
<!-- => Produces native executable in target/ directory -->
```

```bash
mvn -Pnative native:compile
```

### Reflection Configuration

GraalVM requires reflection metadata for classes used reflectively.

**Automatic detection** (during build):

```bash
java -agentlib:native-image-agent=config-output-dir=META-INF/native-image \
     -jar app.jar
```

**Manual configuration** (META-INF/native-image/reflect-config.json):

```json
[
  {
    "name": "com.example.Config",
    // => Fully qualified class name for reflection config
    // => Classes used via reflection must be registered
    "allDeclaredFields": true,
    // => Make all fields accessible via reflection
    // => Needed if Config fields accessed reflectively
    // => Example: JSON deserialization, dependency injection
    "allDeclaredMethods": true
    // => Make all methods accessible via reflection
    // => Required for frameworks calling methods dynamically
    // => Example: JUnit tests, bean property setters
  }
]
// => Place in: src/main/resources/META-INF/native-image/reflect-config.json
// => GraalVM reads this during native compilation
// => Without config: reflection fails at runtime with ClassNotFoundException
```

**Picocli native support**:

```java
@Command(name = "app")
// => Define CLI command structure
@GenerateNativeImage  // Picocli annotation for GraalVM
// => Automatic reflection config generation for picocli
// => Generates META-INF/native-image/ configuration
// => Eliminates manual reflection configuration
// => Picocli knows which classes need reflection
class App {}
// => Command class with native image support
// => Compile with: native-image --no-fallback -jar app.jar
```

## Best Practices

### 1. Use Standard Streams Correctly

**stdout** for normal output, **stderr** for errors and progress.

**Before**: All output to stdout
**After**: Data to stdout, errors/progress to stderr

### 2. Support Piping

Accept input from stdin, write output to stdout for Unix pipeline integration.

**Pattern**:

```java
BufferedReader reader;
// => Reader for either file or stdin
if (inputFile != null) {
// => Input file specified via CLI option
    reader = new BufferedReader(new FileReader(inputFile));
// => Read from file when --input provided
} else {
// => No input file: read from stdin
    reader = new BufferedReader(new InputStreamReader(System.in));
// => Unix pipeline support: cat data.txt | java App
// => Enables composition: java App1 | java App2 | java App3
}
// => Same BufferedReader API for both sources
// => Transparent to processing logic (abstraction)
```

### 3. Provide Version Information

Always include version flag for debugging.

**Pattern**:

```java
@Command(mixinStandardHelpOptions = true,
// => Add --help and --version options automatically
         version = "myapp 1.2.3")
// => Version string shown with --version flag
// => Format: appname version (semantic versioning)
// => Production: inject from build metadata (Git SHA, timestamp)
```

### 4. Handle Signals Gracefully

Clean up resources on SIGINT (Ctrl+C).

**Pattern**:

```java
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
// => Register shutdown hook for JVM termination
// => Triggered on: normal exit, SIGTERM, SIGINT (Ctrl+C)
// => NOT triggered on: kill -9, power loss, JVM crash
    System.err.println("\nShutting down gracefully...");
// => Inform user of graceful shutdown
// => \n: move to new line (user may have pressed Ctrl+C mid-line)
    cleanup();
// => Close resources: DB connections, files, network sockets
// => Flush buffers, save state, release locks
// => Keep shutdown logic fast (<1 second)
}));
// => Hook runs in separate thread during JVM shutdown
```

### 5. Use Color Sparingly

Color improves readability but must support plain terminals.

**With picocli ANSI colors**:

```java
System.out.println(Ansi.AUTO.string("@|green Success!|@"));
// => Picocli ANSI color support
// => @|green ...|@: markup for green text
// => Ansi.AUTO: detects terminal capability (colors if supported)
// => Graceful degradation: plain text on non-color terminals
System.err.println(Ansi.AUTO.string("@|red Error!|@"));
// => Red text for errors (visual distinction)
// => Accessibility: don't rely on color alone (use text too)
// => Example: "Error: ..." in red, but "Error:" label present
```

### 6. Make Commands Idempotent

Running the same command twice should be safe.

**Example**: `db migrate` should skip already-applied migrations.

### 7. Provide Dry-Run Mode

Allow users to preview changes without applying them.

**Pattern**:

```java
@Option(names = "--dry-run", description = "Preview changes without applying")
// => Safety flag for destructive operations
// => Common in deployment, migration, cleanup tools
boolean dryRun;
// => Boolean flag: presence = true, absence = false

if (!dryRun) {
// => Only apply changes in normal mode
    applyChanges();
// => Execute destructive operations
// => Example: delete files, modify database, deploy
}
// => In dry-run mode: log actions without executing
// => Production: always show what WOULD happen in dry-run
```

## Common CLI Patterns

### File Processing

**Pattern**:

```java
@Parameters(description = "Input files")
// => Variable-length positional arguments
// => Accepts: java App file1.txt file2.txt file3.txt
List<File> files;
// => Collected into List automatically
// => Empty list if no files provided

for (File file : files) {
// => Process each file sequentially
    processFile(file);
// => Independent processing per file
// => Production: add error handling to continue on failure
// => Don't let one bad file stop processing others
}
```

### Batch Operations

**Pattern**:

```java
@Option(names = {"-b", "--batch"}, description = "Batch size")
// => Configurable batch size for bulk operations
int batchSize = 100;
// => Default 100 items per batch
// => Balance: larger batches = fewer transactions, more memory

List<Item> batch = new ArrayList<>(batchSize);
// => Pre-allocate capacity to avoid resizing
for (Item item : items) {
// => Iterate all items to process
    batch.add(item);
// => Add to current batch
    if (batch.size() >= batchSize) {
// => Batch full: process and reset
        processBatch(batch);
// => Bulk operation: insert, update, API call
// => More efficient than one-at-a-time
        batch.clear();
// => Reset for next batch (reuse ArrayList)
    }
}
if (!batch.isEmpty()) {
// => Check for remaining items (partial batch)
    processBatch(batch);  // Process remaining
// => Don't lose last incomplete batch
}
```

### Watch Mode

**Pattern**:

```java
@Option(names = {"-w", "--watch"}, description = "Watch for changes")
// => Enable continuous monitoring mode
boolean watch;
// => Boolean flag for watch behavior

do {
// => do-while: always run at least once
    processFiles();
// => Execute file processing logic
// => Could use FileWatcher API for efficiency
    if (watch) {
// => Only sleep in watch mode
        Thread.sleep(1000);
// => Wait 1 second between iterations
// => Production: configurable poll interval
// => Alternative: use WatchService for event-driven monitoring
    }
} while (watch);
// => Loop if watch mode enabled
// => One-shot execution if watch=false
```

## Example: Complete CLI Application

**Real-world CSV processor**:

```java
@Command(name = "csvtool",
// => Command name for CLI: java csvtool data.csv
         description = "CSV processing tool",
// => Shown in --help output
         mixinStandardHelpOptions = true,
// => Auto-add --help and --version flags
         version = "1.0.0")
// => Version string for --version flag
class CsvTool implements Runnable {
// => Runnable: picocli calls run() after parsing

    @Parameters(description = "Input CSV file")
// => Required positional argument (first)
    File inputFile;
// => Type conversion: String path → File object

    @Option(names = {"-o", "--output"}, description = "Output file")
// => Optional output file (short and long forms)
    File outputFile;
// => Null if not provided → write to stdout

    @Option(names = {"-f", "--filter"}, description = "Filter column:value")
// => Optional filter in "column:value" format
    String filter;
// => Null if not provided → no filtering

    @Override
    public void run() {
// => Main command logic (called after parsing)
        try {
            processCsv();
// => Execute CSV processing
        } catch (IOException e) {
// => Handle file I/O errors
            System.err.println("Error: " + e.getMessage());
// => User-friendly error to stderr
            System.exit(1);
// => Exit code 1: general error
        }
    }

    private void processCsv() throws IOException {
// => CSV processing implementation
        try (BufferedReader reader = new BufferedReader(new FileReader(inputFile));
// => Read input CSV line by line
// => Auto-close reader on exit (try-with-resources)
             PrintWriter writer = outputFile != null
// => Conditional writer initialization
                 ? new PrintWriter(new FileWriter(outputFile))
// => Write to file if --output provided
                 : new PrintWriter(System.out)) {
// => Write to stdout if no --output (Unix pipeline support)

            String line;
            while ((line = reader.readLine()) != null) {
// => Read until EOF (null return)
                if (filter == null || matchesFilter(line)) {
// => Apply filter if provided, otherwise process all lines
                    writer.println(processLine(line));
// => Transform and write line
                }
            }
        }
// => Auto-close both reader and writer
    }

    private boolean matchesFilter(String line) {
// => Filter logic placeholder
        // Filter logic
// => Production: parse "column:value", split CSV, check match
        return true;
// => Accept all lines in this example
    }

    private String processLine(String line) {
// => Line transformation logic
        // Processing logic
// => Production: parse CSV, transform columns, format output
        return line.toUpperCase();
// => Simple transformation: uppercase all text
    }

    public static void main(String[] args) {
// => CLI entry point
        int exitCode = new CommandLine(new CsvTool()).execute(args);
// => Parse args, execute command, return exit code
        System.exit(exitCode);
// => Exit with code for shell integration
    }
}
```

## Related Content

### Core Java Topics

- **[Java Best Practices](/en/learn/software-engineering/programming-languages/java/in-the-field/best-practices)** - General coding standards
- **[Test-Driven Development](/en/learn/software-engineering/programming-languages/java/in-the-field/test-driven-development)** - Testing CLI apps

### External Resources

**CLI Frameworks**:

- [Picocli](https://picocli.info/) - Modern CLI framework
- [Apache Commons CLI](https://commons.apache.org/proper/commons-cli/) - Classic CLI parsing
- [JCommander](https://jcommander.org/) - Annotation-based parsing

**Native Compilation**:

- [GraalVM](https://www.graalvm.org/) - Native image compilation
- [GraalVM Native Image](https://www.graalvm.org/latest/reference-manual/native-image/) - Documentation

**Libraries**:

- [JLine](https://github.com/jline/jline3) - Terminal input/output
- [ProgressBar](https://github.com/ctongfei/progressbar) - Progress indicators
- [Jansi](https://github.com/fusesource/jansi) - ANSI color support

---

**Last Updated**: 2026-02-03
**Java Version**: 17+ (baseline), 21+ (recommended)
**Framework Versions**: Picocli 4.7.6, GraalVM 21.0.1
