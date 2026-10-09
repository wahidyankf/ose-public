---
title: "Advanced Examples"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 30
---

Compose core features in reports and verification examples. Examples 69–71 are runnable JUnit Maven projects; example 72 compares compilation with a standalone assertion. The capstone applies JUnit to a task board. Example 80 requires Java 25.

## Example 53: grouping collector

**Purpose:** GroupingBy partitions records according to a classifier function. The classifier chooses a key for each record, and groupingBy collects records under those keys.

```java
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
public final class Example53 {
    record Task(String name, boolean done) {} // => done is the grouping key
    // => The done component decides which Boolean group receives each task.
    public static void main(String[] args) {
        Map<Boolean, List<Task>> groups = List.of(new Task("read", false), new Task("write", true))
        // => The input contains one false task and one true task.
                .stream().collect(Collectors.groupingBy(Task::done)); // => false and true groups
                // => The false key maps to the read task list.
                // => The true key maps to the write task list.
        System.out.println(groups.get(false).get(0).name()); // => prints read from the false group
        // => Lookup by false selects the unfinished group.
        // => Index zero then selects its first task name.
    }
}
```

Run from the `learning/` directory: `cd code/ex-53-grouping-collector && javac Example53.java && java Example53`.

Expected output:

```text
read
```

**Try it:** Add another open task and inspect its group.

**Key takeaway:** Grouping makes categories available for reports and summaries.

**Why it matters:** GroupingBy classifies stream elements and collects each category into a list. A
task dashboard can use that shape to show open and completed work separately without
hand-maintaining two mutable buckets. The example groups by a boolean component and reads one group.
For presentation, consider a richer status type and handle groups that may be absent rather than
assuming every category exists.

## Example 54: stream flatmap

**Purpose:** flatMap turns each nested list into a stream and flattens their elements. Each inner list becomes a stream, and flatMap joins their elements into one result sequence.

```java
import java.util.List;
public final class Example54 {
    public static void main(String[] args) {
        List<String> words = List.of(List.of("red", "blue"), List.of("green")) // => two inner lists
        // => The outer list has two elements, each itself a list.
                .stream().flatMap(List::stream).toList(); // => each inner list contributes its words
                // => flatMap removes one level of nesting.
        System.out.println(words); // => [red, blue, green]
        // => Encounter order remains red, blue, green.
    }
}
```

Run from the `learning/` directory: `cd code/ex-54-stream-flatmap && javac Example54.java && java Example54`.

Expected output:

```text
[red, blue, green]
```

**Try it:** Add an empty inner list and predict the result.

**Key takeaway:** Flattening is useful when one input contains several outputs.

**Why it matters:** FlatMap is for one input that produces several outputs, such as a project
containing several tasks or a list containing several lists. Map alone would preserve nesting and
leave a list of lists. This example opens each inner list as a stream and flattens the elements into
one result. The empty inner-list case is a useful check because it should contribute nothing.

## Example 55: stream sorted

**Purpose:** sorted creates an ordered stream result from unsorted inputs. The sorted stage rearranges the values before the terminal operation collects them.

```java
import java.util.List;
public final class Example55 {
    public static void main(String[] args) {
        List<Integer> ascending = List.of(3, 1, 2).stream().sorted().toList(); // => [1, 2, 3]
        // => The source order is 3, 1, 2.
        // => Natural Integer order produces 1, 2, 3.
        System.out.println(ascending); // => [1, 2, 3]
        // => toList evaluates the sorted pipeline before printing.
    }
}
```

Run from the `learning/` directory: `cd code/ex-55-stream-sorted && javac Example55.java && java Example55`.

Expected output:

```text
[1, 2, 3]
```

**Try it:** Add a repeated number and inspect its position.

**Key takeaway:** Sort explicitly when downstream output order matters.

**Why it matters:** Sorting a stream establishes a deliberate order before collecting the result.
This matters in user-facing reports and deterministic tests, where incidental input order may vary
between callers. The example sorts three integers so the expected list is easy to verify. Sorting
also has a cost and must inspect its input, so use it when order is actually a requirement.

## Example 56: stream distinct

**Purpose:** distinct removes duplicate elements according to equality. The distinct stage keeps the first element of each equality group in encounter order.

```java
import java.util.List;
public final class Example56 {
    public static void main(String[] args) {
        List<String> unique = List.of("a", "b", "a").stream().distinct().toList(); // => [a, b]
        // => The first and last elements compare equal.
        // => The second a is dropped; b stays.
        System.out.println(unique); // => [a, b]; encounter order preserved here
        // => The collected list contains two distinct values.
    }
}
```

Run from the `learning/` directory: `cd code/ex-56-stream-distinct && javac Example56.java && java Example56`.

Expected output:

```text
[a, b]
```

**Try it:** Change a string's case and inspect whether it remains.

**Key takeaway:** Deduplication depends on the element's equality rule.

**Why it matters:** Distinct removes repeated elements according to equality, not visual similarity
or a custom notion of duplicate. In a tag list, duplicate strings disappear; values that differ in
case remain unless you normalize them first. The example uses ordered input, making the preserved
first encounters visible. Choose the equality or normalization rule to match the domain before
deduplicating.

## Example 57: sealed visitor

**Purpose:** An exhaustive visitor function renders every sealed Result variant. The rendering function handles every permitted Result subtype in one exhaustive switch.

```java
public final class Example57 {
    sealed interface Result permits Ok, Missing {}
    // => Only Ok and Missing are direct Result variants.
    record Ok(String value) implements Result {}
    // => Ok carries a String payload for rendering.
    record Missing() implements Result {}
    // => Missing has no payload, so it renders a fixed label.
    static String render(Result result) {
        // => The method must produce text for either variant.
        return switch (result) {
            // => The switch expression chooses a result from the runtime record type.
            case Ok(var value) -> "value:" + value; // => unwrap Ok payload
            // => The record pattern binds the Ok component to value.
            case Missing ignored -> "missing"; // => no payload to unwrap
        };
    }
    public static void main(String[] args) {
        System.out.println(render(new Missing())); // => missing
        // => A Missing instance selects the second case.
    }
}
```

Run from the `learning/` directory: `cd code/ex-57-sealed-visitor && javac Example57.java && java Example57`.

Expected output:

```text
missing
```

**Try it:** Add another permitted result and update the switch.

**Key takeaway:** A visitor keeps one operation over variants in one place.

**Why it matters:** A visitor-style function can put one operation over a sealed hierarchy in a
single switch. A report that renders results benefits because every allowed variant has a visible
branch and a newly permitted variant causes a compile-time reminder. The example handles success and
missing output. Keep the function focused; a large collection of unrelated operations may belong
nearer the model.

## Example 58: nested record pattern

**Purpose:** Nested record patterns extract a city through Person and Address in one case. The nested pattern binds city through the outer Person and inner Address records.

```java
public final class Example58 {
    record Address(String city) {}
    // => The inner record contributes the city component.
    record Person(String name, Address address) {}
    // => The outer record holds an Address as one component.
    public static void main(String[] args) {
        Object value = new Person("Ada", new Address("London")); // => nested Address
        // => The declared type Object does not hide the runtime Person shape.
        String city = switch (value) {
            // => The matching case yields the city String.
            case Person(var name, Address(var place)) -> place; // => place is London
            // => The nested Address pattern binds place to London.
            default -> "unknown";
            // => A value of another runtime type would take this fallback.
        };
        System.out.println(city); // => London
    }
}
```

Run from the `learning/` directory: `cd code/ex-58-nested-record-pattern && javac Example58.java && java Example58`.

Expected output:

```text
London
```

**Try it:** Change the city and inspect the output.

**Key takeaway:** Nested patterns help read structured immutable values.

**Why it matters:** Nested record patterns let one switch case inspect a value inside another record
without a chain of temporary variables and casts. A person with an address is a small example of a
structured value common in domain models. The case extracts the city while preserving a fallback for
unrelated inputs. Avoid deep patterns if named accessors would make the rule easier to read.

## Example 59: generic bounded method

**Purpose:** A bounded generic method calculates an average using Number conversion. Each input Number is converted for arithmetic while the list keeps its more precise element type.

```java
import java.util.List;
public final class Example59 {
    static <T extends Number> double average(List<T> numbers) {
        // => Integer and Double lists both satisfy this bound.
        return numbers.stream().mapToDouble(Number::doubleValue).average().orElse(0); // => 0 for empty input
        // => Each Number becomes a double for averaging.
        // => An empty list yields fallback 0 rather than an absent result.
    }
    public static void main(String[] args) {
        System.out.println(average(List.of(2, 4))); // => 3.0
        // => The two integer inputs average to 3.0.
    }
}
```

Run from the `learning/` directory: `cd code/ex-59-generic-bounded-method && javac Example59.java && java Example59`.

Expected output:

```text
3.0
```

**Try it:** Call average with a list of Double values.

**Key takeaway:** A bound lets one algorithm serve related numeric types.

**Why it matters:** A bounded generic method can operate on several number subtypes while retaining
a useful compile-time restriction. The average calculation accepts Integer and Double lists because
Number exposes doubleValue. The example also chooses zero for an empty stream, a policy a real
application should review. If an empty average is invalid, return OptionalDouble or signal a failure
instead.

## Example 60: optional in stream

**Purpose:** Optional.stream contributes zero or one elements to a surrounding stream. An empty Optional contributes no stream element, while a present one contributes exactly one.

```java
import java.util.List;
import java.util.Optional;
public final class Example60 {
    public static void main(String[] args) {
        List<Optional<String>> values = List.of(Optional.of("Ada"), Optional.empty()); // => one present, one absent
        // => The second Optional has no contained String.
        // => The input list still has two Optional elements.
        List<String> present = values.stream().flatMap(Optional::stream).toList(); // => [Ada]
        // => Optional.stream emits Ada and emits nothing for empty.
        System.out.println(present); // => [Ada]; empty option contributes no element
        // => The resulting list has one element, not a null placeholder.
    }
}
```

Run from the `learning/` directory: `cd code/ex-60-optional-in-stream && javac Example60.java && java Example60`.

Expected output:

```text
[Ada]
```

**Try it:** Add another empty and another present Optional.

**Key takeaway:** Flattening optional results removes absence without null checks.

**Why it matters:** Optional.stream contributes either one value or no values, which makes a stream
of optional lookups easy to flatten. A batch operation can collect successful lookups while leaving
absent results out of the final list. The example includes both states so the output proves the
behavior. If missing records need reporting, preserve their identifiers instead of silently
discarding them.

## Example 61: exception in stream

**Purpose:** A parser catches NumberFormatException inside the mapping boundary. The parsing boundary catches invalid numeric text and turns that item into the chosen fallback.

```java
import java.util.List;
public final class Example61 {
    static int parse(String text) {
        // => The helper converts each input String to an int.
        try { return Integer.parseInt(text); } // => valid digits become int
        catch (NumberFormatException problem) { return 0; } // => explicit local fallback
        // => Only malformed text takes the zero fallback.
    }
    public static void main(String[] args) {
        int sum = List.of("2", "bad", "3").stream().mapToInt(Example61::parse).sum(); // => 2 + 0 + 3
        // => The mapped values are 2, 0, and 3.
        System.out.println(sum); // => 5
        // => The terminal sum yields 5 after fallback conversion.
    }
}
```

Run from the `learning/` directory: `cd code/ex-61-exception-in-stream && javac Example61.java && java Example61`.

Expected output:

```text
5
```

**Try it:** Replace the invalid text with a valid digit.

**Key takeaway:** Make fallback behavior explicit when processing imperfect input.

**Why it matters:** A stream pipeline may encounter malformed input, and a parsing failure needs an
explicit policy. This example converts bad text to zero inside a named parser, letting the pipeline
finish and making the fallback visible. In financial or validation code, treating malformed text as
zero could be wrong; use a result or error report when callers need to know which input failed.

## Example 62: custom exception

**Purpose:** A custom exception gives an invalid task a domain-specific failure name. The custom exception names the invalid-task condition for callers that need to distinguish it.

```java
public final class Example62 {
    static final class InvalidTaskException extends RuntimeException {
        // => The domain-specific type distinguishes this failure.
        InvalidTaskException(String message) { super(message); }
        // => The base exception stores the supplied diagnostic text.
    }
    static void validate(String name) {
        // => Validation completes normally only for nonblank names.
        if (name.isBlank()) throw new InvalidTaskException("blank task name"); // => rejects whitespace
        // => Space-only input satisfies isBlank.
    }
    public static void main(String[] args) {
        try { validate(" "); }
        // => The call fails before control leaves the try block normally.
        catch (InvalidTaskException problem) { System.out.println(problem.getMessage()); } // => blank task name
        // => The handler prints the exception's stored message.
    }
}
```

Run from the `learning/` directory: `cd code/ex-62-custom-exception && javac Example62.java && java Example62`.

Expected output:

```text
blank task name
```

**Try it:** Call validate with a valid name and compare paths.

**Key takeaway:** Specific failures are easier for callers to catch and diagnose.

**Why it matters:** A custom exception gives callers a specific failure type for an invalid task
rather than a generic RuntimeException. This can help an application boundary translate the failure
into an actionable message while still preserving a stack trace. The example keeps construction and
catch local so the type is easy to inspect. Define custom failures only when the distinction helps a
caller act.

## Example 63: immutable record collection

**Purpose:** List.copyOf creates an unmodifiable list of record values. The copied list retains its elements but rejects later attempts to add or remove items.

```java
import java.util.List;
public final class Example63 {
    record Task(String name) {}
    // => The record's name component is a final field.
    public static void main(String[] args) {
        List<Task> source = List.of(new Task("read")); // => one record value
        // => The source already contains a record with name read.
        List<Task> snapshot = List.copyOf(source); // => add/remove operations fail
        // => copyOf does not make mutable component objects deeply immutable.
        System.out.println(snapshot); // => [Task[name=read]]
        // => The record-generated toString exposes the name component.
    }
}
```

Run from the `learning/` directory: `cd code/ex-63-immutable-record-collection && javac Example63.java && java Example63`.

Expected output:

```text
[Task[name=read]]
```

**Try it:** Try adding an item to the copied list.

**Key takeaway:** Immutable snapshots prevent accidental collection mutation.

**Why it matters:** A record's components are fixed after construction, and List.copyOf provides an
unmodifiable list view of its elements. Together they suit a snapshot passed between code that
should read rather than alter a report. The example copies a one-task list and prints it. Note that
an unmodifiable collection does not make mutable elements deeply immutable; the element type still
matters.

## Example 64: record as map key

**Purpose:** Record equality and hashCode make a newly constructed coordinate a usable map lookup key. A new coordinate with equal components produces the same hash and equality result as the stored key.

```java
import java.util.Map;
public final class Example64 {
    record Coordinate(int x, int y) {}
    // => The generated equals and hashCode use both coordinates.
    public static void main(String[] args) {
        Map<Coordinate, String> labels = Map.of(new Coordinate(2, 3), "desk"); // => record key uses its components
        // => The stored key has x=2 and y=3.
        System.out.println(labels.get(new Coordinate(2, 3))); // => desk; record value key
        // => The lookup creates a separate but equal key object.
        // => The matching hash and equality locate desk.
    }
}
```

Run from the `learning/` directory: `cd code/ex-64-record-as-map-key && javac Example64.java && java Example64`.

Expected output:

```text
desk
```

**Try it:** Change one coordinate and observe the lookup result.

**Key takeaway:** Value keys allow lookup by data, not object identity.

**Why it matters:** A record's generated equals and hashCode make equal component values behave as
equal map keys. That means a caller can construct a new Coordinate and find a label stored under an
earlier equal Coordinate. The example demonstrates that lookup. For map keys, avoid mutable
components whose equality or hash behavior can change after insertion.

## Example 65: enum with fields

**Purpose:** An enum may carry fields and expose behavior through methods. Each enum constant carries its own score, which the method exposes without a separate lookup table.

```java
public final class Example65 {
    enum Priority {
        LOW(1), HIGH(5); // => each constant has its own score
        // => HIGH carries score 5; LOW carries score 1.
        private final int score;
        // => The score is fixed when each constant is constructed.
        Priority(int score) { this.score = score; } // => LOW stores 1, HIGH stores 5
        // => The constructor receives the literal from each constant.
        int score() { return score; }
        // => The accessor returns the constant's stored number.
    }
    public static void main(String[] args) {
        System.out.println(Priority.HIGH.score()); // => 5
        // => HIGH selects its own 5 rather than LOW's 1.
    }
}
```

Run from the `learning/` directory: `cd code/ex-65-enum-with-fields && javac Example65.java && java Example65`.

Expected output:

```text
5
```

**Try it:** Add a medium priority with a score.

**Key takeaway:** Enums can keep per-option data with the named constants.

**Why it matters:** An enum can attach fixed data to each constant, such as the score used to rank a
priority. Keeping the score with the constant reduces scattered conditionals that might disagree
about the same policy. The example exposes the value through a method. If scores are configurable at
runtime, an enum field alone may be too rigid; choose representation according to the policy's
owner.

## Example 66: interface default method

**Purpose:** A default interface method reuses behavior based on a required abstract method. The default label method reuses the name supplied by each implementation of the abstract method.

```java
public final class Example66 {
    interface Named {
        // => The contract requires every implementor to provide name().
        String name();
        // => The abstract method supplies data to the default method.
        default String label() { return "task:" + name(); } // => prefixes implementor name
    }
    record Task(String name) implements Named {} // => supplies name()
    // => The generated record accessor satisfies the contract.
    public static void main(String[] args) {
        System.out.println(new Task("read").label()); // => task:read
        // => The inherited default method calls Task.name().
    }
}
```

Run from the `learning/` directory: `cd code/ex-66-interface-default-method && javac Example66.java && java Example66`.

Expected output:

```text
task:read
```

**Try it:** Add another Named implementation and call label.

**Key takeaway:** Default methods can share behavior across implementors.

**Why it matters:** A default interface method can offer shared behavior in terms of an abstract
method every implementation provides. This keeps a simple label rule in one contract while record
implementations supply their own names. The example works through Task, but another Named type can
reuse label too. Add defaults sparingly so an interface remains a clear contract rather than a large
base class.

## Example 67: gc object lifecycle

**Purpose:** An object remains reachable while at least one live reference points to it. The alias remains a live reference after the original variable is cleared, so the object stays reachable.

```java
public final class Example67 {
    public static void main(String[] args) {
        Object task = new Object(); // => reachable through task
        Object alias = task;        // => second reference to same object
        // => task and alias compare identical by reference.
        task = null;                // => object still reachable through alias
        // => Clearing one reference does not clear the other.
        System.out.println(alias != null); // => true; alias still references the object
        // This does not promise when, or whether, garbage collection runs.
    }
}
```

Run from the `learning/` directory: `cd code/ex-67-gc-object-lifecycle && javac Example67.java && java Example67`.

Expected output:

```text
true
```

**Try it:** Clear alias too, then reason about reachability without timing GC.

**Key takeaway:** Reachability is useful to understand, but GC timing is not guaranteed.

**Why it matters:** Garbage collection depends on reachability, not on assigning null to one
particular variable. In the example, alias still points to the object after task is cleared, so the
object remains reachable through that reference. A production program should release unneeded
references, but it must not assume an exact collection moment. The JVM chooses when to reclaim
eligible memory.

## Example 68: heap vs stack

**Purpose:** Primitive assignment copies a value; reference assignment copies a reference to one object. Changing the referenced object's field is visible through either alias; changing a copied primitive is independent.

```java
public final class Example68 {
    static final class Box { int value; }
    public static void main(String[] args) {
        int number = 1; // => original primitive remains 1
        int copy = number; // => primitive value copied
        // => The assignment copies the value 1.
        Box first = new Box();
        // => The new Box initially has int field value zero.
        Box alias = first; // => reference value copied; both refer to one object
        // => Both variables refer to that same Box.
        copy++; // => copy becomes 2; number remains 1
        alias.value = 2; // => first.value also becomes 2
        // => The field write is visible through first.
        System.out.println(number + ":" + first.value); // => 1:2
        // Avoid treating JVM storage layout as a Java language guarantee.
    }
}
```

Run from the `learning/` directory: `cd code/ex-68-heap-vs-stack && javac Example68.java && java Example68`.

Expected output:

```text
1:2
```

**Try it:** Change alias.value and copy again, then compare originals.

**Key takeaway:** Different assignment semantics explain many mutation surprises.

**Why it matters:** Java assignment copies a primitive value or a reference value, with different
effects when later code mutates an object. Incrementing copy leaves number unchanged, while writing
through alias changes the object observed through first. This example makes both outcomes visible in
one print. The Java language does not promise a simple universal stack-versus-heap placement rule
for every value.

## Example 69: junit test basic

**Purpose:** A testable pure add method has an observable result that an assertion can verify. The assertion checks the returned sum from the pure add method against a known expected value.

```java
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

final class Example69Test {
    static int add(int left, int right) { return left + right; } // => add(2, 3) is 5
    // => The method has no shared state or side effects.

    @Test // => JUnit discovers this method
    // => JUnit invokes addsTwoNumbers as a test.
    void addsTwoNumbers() {
        assertEquals(5, add(2, 3)); // => expected 5, actual 5
        // => The first argument is expected and the second is actual.
        // => Changing add's arithmetic would make this assertion fail.
    }
}
```

This is a Maven project: the source is under `src/test/java/`, and its `pom.xml` declares the required compiler and test plugins.

```xml
<!-- => The Maven POM namespace identifies the project model that Maven reads. -->
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <!-- => This declares Maven POM model version 4.0.0, not the Java release. -->
  <modelVersion>4.0.0</modelVersion>
  <!-- => groupId names the publishing group in the project coordinates. -->
  <groupId>org.ayokoding</groupId>
  <!-- => artifactId identifies this JUnit lesson project. -->
  <artifactId>primer-junit-example-69</artifactId>
  <!-- => This is the example artifact version, separate from plugin versions. -->
  <version>1.0.0</version>
  <properties>
    <!-- => The compiler targets Java 21 language and platform APIs. -->
    <!-- => The generated class files remain compatible with Java 21 runtimes. -->
    <maven.compiler.release>21</maven.compiler.release>
    <!-- => Source decoding is fixed to UTF-8 across different machines. -->
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <!-- => The JUnit Jupiter version is declared once for the dependency below. -->
    <!-- => Pinning 6.0.1 keeps test behavior consistent across builds. -->
    <junit.version>6.0.1</junit.version>
  </properties>
  <dependencies>
    <!-- => junit-jupiter provides the test annotations and assertion APIs. -->
    <!-- => The dependency version reuses junit.version rather than repeating a number. -->
    <!-- => Test scope keeps JUnit off the application runtime classpath. -->
    <!-- => JUnit discovers the basic add assertion as a test. -->
    <dependency><groupId>org.junit.jupiter</groupId><artifactId>junit-jupiter</artifactId><version>${junit.version}</version><scope>test</scope></dependency>
  </dependencies>
  <build><plugins>
    <!-- => The compiler plugin compiles sources at the declared Java release. -->
    <!-- => Version 3.14.1 is pinned independently of the application version. -->
    <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-compiler-plugin</artifactId><version>3.14.1</version></plugin>
    <!-- => Surefire discovers and runs test classes during mvn test. -->
    <!-- => Its pinned 3.5.4 version supports the chosen JUnit platform. -->
    <!-- => A failed assertion makes the Maven test phase fail. -->
    <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-surefire-plugin</artifactId><version>3.5.4</version></plugin>
  </plugins></build>
</project>
```

Run from the `learning/` directory: `mvn -f code/ex-69-junit-test-basic/pom.xml test`.

Expected result: Maven reports a successful test run with 1 passing test case.

**Try it:** Change the expected value to see the failure.

**Key takeaway:** Small deterministic methods are easy to verify with JUnit.

**Why it matters:** A testable method has a result that can be checked without relying on a human
reading console output. The JUnit assertion here proves the idea with add, and Maven runs it
automatically. The capstone applies the same test structure to a task board. When you change a
calculation, an automated expected-value assertion catches a regression more reliably than a program
that only prints a label.

## Example 70: junit assertions

**Purpose:** An equality assertion should compare the behavior's actual result with a known expectation. The test fails when the produced label differs from the expected text, exposing a behavioral change.

```java
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;

final class Example70Test {
    static String label(String name) {
        // => This helper returns a label for valid input.
        if (name.isBlank()) throw new IllegalArgumentException("blank name"); // => space-only input fails
        // => Blank input takes the exceptional path.
        return "task:" + name; // => label("read") is task:read
        // => read becomes task:read.
    }

    @Test
    // => JUnit runs both assertions in one test method.
    void checksSuccessAndFailure() {
        assertEquals("task:read", label("read")); // => checks returned value
        // => The expected label is compared to the helper result.
        assertThrows(IllegalArgumentException.class, () -> label(" ")); // => checks failure type
        // => The lambda delays the invalid call until assertThrows runs it.
        // => The assertion checks exception type, not message.
    }
}
```

This is a Maven project: the source is under `src/test/java/`, and its `pom.xml` declares the required compiler and test plugins.

```xml
<!-- => The Maven POM namespace identifies the project model that Maven reads. -->
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <!-- => This declares Maven POM model version 4.0.0, not the Java release. -->
  <modelVersion>4.0.0</modelVersion>
  <!-- => groupId names the publishing group in the project coordinates. -->
  <groupId>org.ayokoding</groupId>
  <!-- => artifactId identifies this JUnit lesson project. -->
  <artifactId>primer-junit-example-70</artifactId>
  <!-- => This is the example artifact version, separate from plugin versions. -->
  <version>1.0.0</version>
  <properties>
    <!-- => The compiler targets Java 21 language and platform APIs. -->
    <!-- => The generated class files remain compatible with Java 21 runtimes. -->
    <maven.compiler.release>21</maven.compiler.release>
    <!-- => Source decoding is fixed to UTF-8 across different machines. -->
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <!-- => The JUnit Jupiter version is declared once for the dependency below. -->
    <!-- => Pinning 6.0.1 keeps test behavior consistent across builds. -->
    <junit.version>6.0.1</junit.version>
  </properties>
  <dependencies>
    <!-- => junit-jupiter provides the test annotations and assertion APIs. -->
    <!-- => The dependency version reuses junit.version rather than repeating a number. -->
    <!-- => Test scope keeps JUnit off the application runtime classpath. -->
    <!-- => JUnit runs the value and exception assertions. -->
    <dependency><groupId>org.junit.jupiter</groupId><artifactId>junit-jupiter</artifactId><version>${junit.version}</version><scope>test</scope></dependency>
  </dependencies>
  <build><plugins>
    <!-- => The compiler plugin compiles sources at the declared Java release. -->
    <!-- => Version 3.14.1 is pinned independently of the application version. -->
    <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-compiler-plugin</artifactId><version>3.14.1</version></plugin>
    <!-- => Surefire discovers and runs test classes during mvn test. -->
    <!-- => Its pinned 3.5.4 version supports the chosen JUnit platform. -->
    <!-- => A failed assertion makes the Maven test phase fail. -->
    <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-surefire-plugin</artifactId><version>3.5.4</version></plugin>
  </plugins></build>
</project>
```

Run from the `learning/` directory: `mvn -f code/ex-70-junit-assertions/pom.xml test`.

Expected result: Maven reports a successful test run with 1 passing test case.

**Try it:** Change the label implementation and inspect assertion failure.

**Key takeaway:** Assertions protect behavior rather than only exercising code.

**Why it matters:** Assertions compare actual behavior with an expected result and fail loudly when
they differ. A passing process that never checks its result can give false confidence, especially
after a refactor. The example uses a label to make both values easy to see. In the capstone JUnit
suite, assertion methods report the same kind of mismatch with better test discovery and
diagnostics.

## Example 71: junit parameterized

**Purpose:** Running the same assertion over multiple inputs exposes boundary cases. Each parameter supplies another input and expected result to the same assertion body.

```java
import static org.junit.jupiter.api.Assertions.assertFalse;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

final class Example71Test {
    static boolean valid(String name) { return !name.isBlank(); } // => empty, space, tab are false
    // => Whitespace-only strings are invalid by this rule.

    @ParameterizedTest
    // => JUnit repeats the method for each supplied value.
    @ValueSource(strings = {"", " ", "\t"}) // => three test invocations
    // => The inputs cover empty, space-only, and tab-only text.
    void rejectsBlankNames(String name) {
        // => Each invocation receives one value as name.
        assertFalse(valid(name)); // => runs once for each ValueSource input
        // => All three inputs must produce false.
        // => A future validation change that accepts one input fails that invocation.
    }
}
```

This is a Maven project: the source is under `src/test/java/`, and its `pom.xml` declares the required compiler and test plugins.

```xml
<!-- => The Maven POM namespace identifies the project model that Maven reads. -->
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <!-- => This declares Maven POM model version 4.0.0, not the Java release. -->
  <modelVersion>4.0.0</modelVersion>
  <!-- => groupId names the publishing group in the project coordinates. -->
  <groupId>org.ayokoding</groupId>
  <!-- => artifactId identifies this JUnit lesson project. -->
  <artifactId>primer-junit-example-71</artifactId>
  <!-- => This is the example artifact version, separate from plugin versions. -->
  <version>1.0.0</version>
  <properties>
    <!-- => The compiler targets Java 21 language and platform APIs. -->
    <!-- => The generated class files remain compatible with Java 21 runtimes. -->
    <maven.compiler.release>21</maven.compiler.release>
    <!-- => Source decoding is fixed to UTF-8 across different machines. -->
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <!-- => The JUnit Jupiter version is declared once for the dependency below. -->
    <!-- => Pinning 6.0.1 keeps test behavior consistent across builds. -->
    <junit.version>6.0.1</junit.version>
  </properties>
  <dependencies>
    <!-- => junit-jupiter provides the test annotations and assertion APIs. -->
    <!-- => The dependency version reuses junit.version rather than repeating a number. -->
    <!-- => Test scope keeps JUnit off the application runtime classpath. -->
    <!-- => JUnit supplies the parameterized test and its values. -->
    <dependency><groupId>org.junit.jupiter</groupId><artifactId>junit-jupiter</artifactId><version>${junit.version}</version><scope>test</scope></dependency>
  </dependencies>
  <build><plugins>
    <!-- => The compiler plugin compiles sources at the declared Java release. -->
    <!-- => Version 3.14.1 is pinned independently of the application version. -->
    <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-compiler-plugin</artifactId><version>3.14.1</version></plugin>
    <!-- => Surefire discovers and runs test classes during mvn test. -->
    <!-- => Its pinned 3.5.4 version supports the chosen JUnit platform. -->
    <!-- => A failed assertion makes the Maven test phase fail. -->
    <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-surefire-plugin</artifactId><version>3.5.4</version></plugin>
  </plugins></build>
</project>
```

Run from the `learning/` directory: `mvn -f code/ex-71-junit-parameterized/pom.xml test`.

Expected result: Maven reports a successful test run with 3 passing test cases.

**Try it:** Remove one `@ValueSource` input and observe the test count change; then restore it.

**Key takeaway:** Parameterized cases make related examples easier to maintain.

**Why it matters:** Related boundary cases should be checked together so a fix for one input does
not leave another broken. The example rejects both an empty string and whitespace; the JUnit
parameterized test runs the same rule over all three inputs in this Maven project. Include valid
cases too, because a validator that rejects everything would satisfy only the negative checks.

## Example 72: build run test

**Purpose:** A build, run, and test loop distinguishes compilation from behavioral verification. Compilation checks whether code is valid; the test assertion checks whether square returns the required value.

```java
public final class Example72 {
    static int square(int number) { return number * number; }
    // => square(4) computes 4 × 4.
    public static void main(String[] args) {
        int actual = square(4); // => 16
        // => The assertion below checks the returned value, not compilation.
        if (actual != 16) throw new AssertionError("expected 16, got " + actual); // => fails if behavior changes
        System.out.println("build, run, assertion passed"); // => only after the check succeeds
        // => The message is reached only if actual equals 16.
    }
}
```

Run from the `learning/` directory: `cd code/ex-72-build-run-test && javac Example72.java && java Example72`.

Expected output:

```text
build, run, assertion passed
```

**Try it:** Break square and observe the assertion error.

**Key takeaway:** A successful build is not proof that behavior is correct.

**Why it matters:** The build, run, and test loop checks different properties of a change.
Compilation says syntax and types are acceptable; an assertion says one behavior meets a chosen
expectation. The square function here can compile even if its formula is wrong, which is why the
output check matters. In a Maven project, keep both steps in a repeatable test command.

## Example 73: streams pipeline full

**Purpose:** A complete stream pipeline filters, maps, then reduces numbers into a total. The filter removes unwanted values before map transforms survivors and reduce combines them.

Each stage receives the values produced by the previous stage:

```mermaid
graph LR
    accTitle: Filter, map, and reduce pipeline
    accDescr: The list 1, 2, 3, 4 is filtered to 2, 4, mapped to 20, 40, and reduced to the total 60.
    A["1, 2, 3, 4"]:::blue -->|filter even| B["2, 4"]:::orange
    B -->|multiply by 10| C["20, 40"]:::teal
    C -->|sum| D["60"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

```java
import java.util.List;
public final class Example73 {
    public static void main(String[] args) {
        int total = List.of(1, 2, 3, 4).stream()
        // => The stream starts with four integers.
                .filter(number -> number % 2 == 0) // => 2, 4
                // => The odd values 1 and 3 are removed.
                .map(number -> number * 10) // => 20, 40
                // => The surviving values become 20 and 40.
                .reduce(0, Integer::sum); // => 60
                // => The identity 0 and two mapped values produce 60.
        System.out.println(total); // => 60
    }
}
```

Run from the `learning/` directory: `cd code/ex-73-streams-pipeline-full && javac Example73.java && java Example73`.

Expected output:

```text
60
```

**Try it:** Remove the filter and predict the new total.

**Key takeaway:** Pipeline order changes the result, so each stage deserves scrutiny.

**Why it matters:** Pipeline stages execute in order, and changing that order can change a result.
Here the stream selects even numbers, multiplies them, and reduces them to a total. The terminal
reduce produces the final value. A real report should keep each stage simple enough to inspect and
test; use intermediate names when a long chain obscures the business rule.

## Example 74: sealed plus pattern full

**Purpose:** A sealed hierarchy and record patterns produce an exhaustive display function. The sealed type tells the compiler every possible branch that the display switch must handle.

```java
public final class Example74 {
    sealed interface Result permits Found, Missing {}
    // => The switch knows the complete set of direct variants.
    record Found(String value) implements Result {}
    // => Found carries a value for uppercasing.
    record Missing() implements Result {}
    // => Missing carries no text and needs a fallback.
    static String display(Result result) {
        // => The method returns a String for either result shape.
        return switch (result) {
            // => A matching case supplies the return value.
            case Found(var value) -> value.toUpperCase(); // => ready becomes READY
            // => The pattern binds ready from Found("ready").
            case Missing ignored -> "unavailable"; // => missing fallback
        };
    }
    public static void main(String[] args) {
        System.out.println(display(new Found("ready"))); // => READY
        // => The Missing branch is skipped for this input.
    }
}
```

Run from the `learning/` directory: `cd code/ex-74-sealed-plus-pattern-full && javac Example74.java && java Example74`.

Expected output:

```text
READY
```

**Try it:** Display Missing and inspect the fallback.

**Key takeaway:** The compiler can help keep a variant-based report complete.

**Why it matters:** A sealed result model can carry success data without pretending that missing
data has the same shape. A pattern switch then renders every permitted variant, and the compiler
helps flag a new variant left untreated. The example uppercases a found value and uses a clear
missing label. This combination is useful for small explicit outcome models at application
boundaries.

## Example 75: generics collections streams

**Purpose:** A generic helper preserves the list's element type while using a stream operation. The helper returns a list with the same element type as its input while dropping the first value.

```java
import java.util.List;
public final class Example75 {
    static <T> List<T> withoutFirst(List<T> values) {
        // => T links the input and output element types.
        return values.stream().skip(1).toList(); // => drops first, preserves T
        // => skip(1) removes draft from this two-item input.
    }
    public static void main(String[] args) {
        System.out.println(withoutFirst(List.of("draft", "ready"))); // => [ready]
        // => The inferred T is String here.
        // => The result still contains ready.
    }
}
```

Run from the `learning/` directory: `cd code/ex-75-generics-collections-streams && javac Example75.java && java Example75`.

Expected output:

```text
[ready]
```

**Try it:** Call withoutFirst on a List<Integer>.

**Key takeaway:** Small generic operations can compose without losing type information.

**Why it matters:** A generic helper can transform a collection while preserving the element type
for callers. Removing the first element works for String and Integer lists without Object casts, and
the stream result is unmodifiable. The example assumes the caller accepts an empty result when the
input has at most one element. Make such edge-case behavior clear in a reusable API.

## Example 76: full primer slice

**Purpose:** Records, sealed states, a switch, and a stream combine into a two-task report. The stream collects names only from Open tasks, and the switch supplies readable state labels.

```java
import java.util.List;
public final class Example76 {
    sealed interface State permits Open, Done {}
    // => Only Open and Done may directly implement State.
    record Open() implements State {}
    // => Open has no extra component values.
    record Done() implements State {}
    // => Done has no extra component values.
    record Task(String name, State state) {}
    // => Each task pairs a name with one state variant.
    static String render(Task task) {
        // => The helper turns a task into readable text.
        return switch (task.state()) {
            // => The switch selects behavior from runtime state.
            case Open ignored -> task.name() + ": open"; // => read: open
            // => The Open arm uses the task name read.
            case Done ignored -> task.name() + ": done"; // => write: done
            // => The Done arm uses the task name write.
        };
    }
    public static void main(String[] args) {
        List<Task> tasks = List.of(new Task("read", new Open()), new Task("write", new Done()));
        // => The input has one task in each state.
        tasks.stream().map(Example76::render).forEach(System.out::println); // => two lines in input order
        // => The terminal operation prints both rendered tasks.
    }
}
```

Run from the `learning/` directory: `cd code/ex-76-full-primer-slice && javac Example76.java && java Example76`.

Expected output:

```text
read: open
write: done
```

**Try it:** Add one more Open task and predict report order.

**Key takeaway:** A small slice shows how language features work together.

**Why it matters:** A small domain slice shows how records, sealed states, switches, and streams
cooperate. Each Task carries a name and one allowed state; render translates state into text, and
the stream produces lines for the report. The example keeps two tasks so the path is easy to trace.
When extending it, test both variants and the final ordering requirement.

## Example 77: integration build test

**Purpose:** A pure sorted report is checked against an expected list in a local assertion. Sorting before the assertion makes the expected report independent of the input order.

```java
import java.util.List;
public final class Example77 {
    static List<String> report(List<String> names) { return names.stream().sorted().toList(); } // => alphabetical report
    // => The helper leaves its input untouched.
    public static void main(String[] args) {
        List<String> actual = report(List.of("zebra", "alpha")); // => [alpha, zebra]
        // => The report is sorted independently of input order.
        if (!actual.equals(List.of("alpha", "zebra"))) throw new AssertionError(actual); // => checks expected order
        // => A wrong order causes an assertion failure.
        System.out.println(actual); // => [alpha, zebra]
    }
}
```

Run from the `learning/` directory: `cd code/ex-77-integration-build-test && javac Example77.java && java Example77`.

Expected output:

```text
[alpha, zebra]
```

**Try it:** Reverse the input and confirm the result stays sorted.

**Key takeaway:** Integration examples should check output, not merely print success.

**Why it matters:** An integration-style example should verify the result of composing operations
rather than merely print that a test ran. The report sorts input names, and the assertion compares
the whole output list with a known expectation. That catches both wrong content and wrong order. The
capstone Maven tests apply the same idea to a richer task model and error cases.

## Example 78: capstone java primer

**Purpose:** A task board filters open tasks, maps names, sorts them, and asserts the final report. The capstone report includes open task names only, sorted so its assertion is deterministic.

```java
import java.util.List;
public final class Example78 {
    sealed interface State permits Open, Done {}
    // => The permitted states make the model closed.
    record Open() implements State {}
    // => Open has no payload; it marks a task as included.
    record Done() implements State {}
    // => Done has no payload; it marks a task as excluded.
    record Task(String name, State state) {}
    // => Each record stores a name and state.
    static List<String> openTaskNames(List<Task> tasks) {
        // => The report accepts any list of Task values.
        return tasks.stream().filter(task -> task.state() instanceof Open) // => keeps zebra, alpha
        // => Filtering removes the task named done.
                .map(Task::name).sorted().toList(); // => [alpha, zebra]
                // => The report sorts names after projection.
    }
    public static void main(String[] args) {
        var tasks = List.of(new Task("zebra", new Open()), new Task("done", new Done()),
        // => The input contains two Open tasks and one Done task.
                new Task("alpha", new Open()));
        var actual = openTaskNames(tasks); // => [alpha, zebra]
        // => The output is [alpha, zebra] regardless of input order.
        if (!actual.equals(List.of("alpha", "zebra"))) throw new AssertionError(actual); // => verifies report
        // => A missing or unsorted name fails the check.
        System.out.println(actual); // => [alpha, zebra]
    }
}
```

Run from the `learning/` directory: `cd code/ex-78-capstone-java-primer && javac Example78.java && java Example78`.

Expected output:

```text
[alpha, zebra]
```

**Try it:** Add a done task and verify it does not appear.

**Key takeaway:** The primer capstone brings model, query, and verification together.

**Why it matters:** The capstone-sized example combines a sealed state, record tasks, a stream
filter, sorting, and an assertion. It verifies that only open tasks appear in alphabetical order,
while a completed task is excluded. The separate Maven capstone adds JUnit tests and validation to
this same idea. Keeping the slice small helps you locate which feature owns a wrong result.

## Example 79: single file source run

**Purpose:** Single-file source launch compiles and runs a named Java class without a separate javac step. The java source-file command compiles in memory and starts the named class in one step.

```java
public class Hello { // => the launcher finds this named class
    public static void main(String[] args) {
        System.out.println("hello from a single source file"); // => source launch output
        // => The launcher compiles this source before main prints.
    }
}
```

Run from the `learning/` directory: `cd code/ex-79-single-file-source-run && java Hello.java`.

Expected output:

```text
hello from a single source file
```

**Try it:** Run java Hello.java, then compare with javac plus java.

**Key takeaway:** Source launch is convenient for a small disposable program.

**Why it matters:** Single-file source launch is useful for a disposable Java program because the
launcher compiles source in memory and runs its main method without a separate javac command. That
shortens the feedback loop for a tiny experiment. A project with dependencies, tests, and repeatable
packaging still benefits from a build tool; choose the run mode for the work's size.

## Example 80: compact source instance main

**Purpose:** Java 25 compact source files allow an instance main method without a class declaration. On JDK 25, the launcher finds the instance main in a compact source file without a declared class.

```java
// Java 25 finalized compact source files and instance main methods (JEP 512).
void main() { // => Java 25 finds this instance entry point
    IO.println("hello from compact source"); // => source launch output
}
```

Run from the `learning/` directory: `cd code/ex-80-compact-source-instance-main && java CompactHello.java # JDK 25+`.

Expected output:

```text
hello from compact source
```

**Try it:** Run java CompactHello.java on JDK 25.

**Key takeaway:** The shorter form reduces ceremony for very small programs.

**Why it matters:** Compact source files and instance main methods reduce ceremony for a tiny Java
25 program. The launcher supplies the surrounding class mechanics, so the file can begin with void
main and print directly. This is convenient for learning or small scripts, while named classes
remain useful when an application grows. Use a JDK that supports the finalized Java 25 feature.

[JEP 512](https://openjdk.org/jeps/512) documents the finalized Java 25 compact-source form.
