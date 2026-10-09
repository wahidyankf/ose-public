---
title: "Beginner Examples"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 10
---

Start with the build/run loop, values, objects, and everyday collections. Each example has a matching source file. Predict the output, run it, then make the suggested change.

## Example 1: maven project

**Purpose:** A Maven project records compiler and launch settings in `pom.xml` and keeps application source under `src/main/java/`. The POM sets Java 21 as the compilation target, while the exec plugin starts Example01 after compilation.

```java
// The POM next to this source sets the Java release and Maven exec plugin.
public final class Example01 {
    // => The public type name matches Example01.java, so Maven can load it by name.
    public static void main(String[] args) {
        // => The exec goal calls this entry point after the compile goal succeeds.
        System.out.println("This source compiles inside Maven or with javac."); // => The Maven exec goal prints this sentence after compilation.
    }
}
```

This is a Maven project: the source is under `src/main/java/`, and its `pom.xml` declares the required compiler and launch plugins.

```xml
<!-- => The Maven POM namespace identifies the project model that Maven reads. -->
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <!-- => This declares Maven POM model version 4.0.0, not the Java release. -->
  <modelVersion>4.0.0</modelVersion>
  <!-- => groupId names the publishing group in the project coordinates. -->
  <groupId>org.ayokoding</groupId>
  <!-- => artifactId distinguishes this example project inside the group. -->
  <!-- => Together with groupId and version, it forms the artifact coordinates. -->
  <artifactId>primer-example-01</artifactId>
  <!-- => This is the example artifact version, separate from plugin versions. -->
  <version>1.0.0</version>
  <properties>
    <!-- => The compiler targets Java 21 language and platform APIs. -->
    <!-- => The generated class files remain compatible with Java 21 runtimes. -->
    <maven.compiler.release>21</maven.compiler.release>
    <!-- => Source decoding is fixed to UTF-8 across different machines. -->
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <build><plugins>
    <!-- => The compiler plugin runs javac during the Maven compile phase. -->
    <!-- => Its version is pinned to 3.14.1 for repeatable builds. -->
    <!-- => It reads the Java release property declared above. -->
    <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-compiler-plugin</artifactId><version>3.14.1</version></plugin>
    <!-- => The exec plugin launches the compiled main class from the project. -->
    <!-- => Its version is pinned to 3.5.0 independently of the artifact version. -->
    <!-- => The command supplies exec.mainClass, so the POM needs no fixed application class. -->
    <plugin><groupId>org.codehaus.mojo</groupId><artifactId>exec-maven-plugin</artifactId><version>3.5.0</version></plugin>
  </plugins></build>
</project>
```

Run from the `learning/` directory: `mvn -f code/ex-01-maven-project/pom.xml compile exec:java -Dexec.mainClass=Example01`.

Expected output:

```text
This source compiles inside Maven or with javac.
```

**Try it:** Change the printed sentence and rerun this example's Maven command. Predict the new output before launch.

**Key takeaway:** Maven reads the POM to compile a conventional source tree and launch its entry point.

**Why it matters:** A Maven project records the compiler target and plugins, so another developer
can build the same source without guessing local flags. This small project keeps its class in the
conventional source directory and runs it through the build tool. Tests arrive in later JUnit
lessons, where the same project structure lets Maven discover them. Compare this project with the
capstone before adding more build configuration.

## Example 2: hello main

**Purpose:** The conventional public static main method is the entry point for this named Java class. The launcher calls this method, and the greeting combines a local name with fixed text.

```java
public final class Example02 {
    // => The public class is named Example02, matching the source filename.
    public static void main(String[] args) {
        // => The Java launcher starts execution at this method.
        String name = "Java"; // => name holds Java for the greeting.
        System.out.println("Hello, " + name + "!"); // => Hello, Java!
    }
}
```

Run from the `learning/` directory: `cd code/ex-02-hello-main && javac Example02.java && java Example02`.

Expected output:

```text
Hello, Java!
```

**Try it:** Change the greeting's name and predict the printed sentence.

**Key takeaway:** Recognizing the entry point helps you trace a small Java program.

**Why it matters:** The main method is where the Java launcher hands control to a conventional
application. When you investigate a small utility, finding this method reveals its first executable
statement and the arguments it can receive. The greeting shows how a value becomes visible through
standard output; changing that value gives immediate feedback before you study classes with more
behavior.

## Example 3: run build tool

**Purpose:** Compiling creates a class; running invokes main. A build tool can coordinate both steps for a project. Maven compiles the source before its exec goal starts Example03, showing the two phases in one command.

```java
// Run this class with the local Maven exec goal or directly with javac and java.
public final class Example03 {
    // => Maven compiles this named class from the conventional source directory.
    public static void main(String[] args) {
        // => The exec goal invokes main only after the source has compiled.
        System.out.println("Build and run both reached main."); // => Maven reached main after its compile phase.
    }
}
```

This is a Maven project: the source is under `src/main/java/`, and its `pom.xml` declares the required compiler and launch plugins.

```xml
<!-- => The Maven POM namespace identifies the project model that Maven reads. -->
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <!-- => This declares Maven POM model version 4.0.0, not the Java release. -->
  <modelVersion>4.0.0</modelVersion>
  <!-- => groupId names the publishing group in the project coordinates. -->
  <groupId>org.ayokoding</groupId>
  <!-- => artifactId distinguishes this example project inside the group. -->
  <!-- => Together with groupId and version, it forms the artifact coordinates. -->
  <artifactId>primer-example-03</artifactId>
  <!-- => This is the example artifact version, separate from plugin versions. -->
  <version>1.0.0</version>
  <properties>
    <!-- => The compiler targets Java 21 language and platform APIs. -->
    <!-- => The generated class files remain compatible with Java 21 runtimes. -->
    <maven.compiler.release>21</maven.compiler.release>
    <!-- => Source decoding is fixed to UTF-8 across different machines. -->
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <build><plugins>
    <!-- => The compiler plugin runs javac during the Maven compile phase. -->
    <!-- => Its version is pinned to 3.14.1 for repeatable builds. -->
    <!-- => It reads the Java release property declared above. -->
    <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-compiler-plugin</artifactId><version>3.14.1</version></plugin>
    <!-- => The exec plugin launches the compiled main class from the project. -->
    <!-- => Its version is pinned to 3.5.0 independently of the artifact version. -->
    <!-- => The command supplies exec.mainClass, so the POM needs no fixed application class. -->
    <plugin><groupId>org.codehaus.mojo</groupId><artifactId>exec-maven-plugin</artifactId><version>3.5.0</version></plugin>
  </plugins></build>
</project>
```

Run from the `learning/` directory: `mvn -f code/ex-03-run-build-tool/pom.xml compile exec:java -Dexec.mainClass=Example03`.

Expected output:

```text
Build and run both reached main.
```

**Try it:** Run this Maven command, then compile `Example03.java` directly in a temporary directory and compare the two outputs.

**Key takeaway:** Separating build from execution helps diagnose a failure's stage.

**Why it matters:** A program can compile successfully and still fail when it runs, so build and
execution are separate observations. The example gives you a tiny class whose main method is easy to
recognize. In a larger project, Maven coordinates compilation, tests, and launch settings; knowing
the stages lets you tell a compiler problem from an incorrect result or runtime exception.

## Example 4: primitives

**Purpose:** An int and a double participate in numeric promotion when combined in an expression. Because one operand is a double, the sum is evaluated as a double even though the other starts as an int.

```java
public final class Example04 {
    public static void main(String[] args) {
        int whole = 3;          // => 32-bit integer
        // => The left operand remains an int before the addition.
        double fraction = 2.5; // => floating-point number
        // => The double operand determines the promoted expression type.
        System.out.println(whole + fraction); // => 5.5, promoted to double
    }
}
```

Run from the `learning/` directory: `cd code/ex-04-primitives && javac Example04.java && java Example04`.

Expected output:

```text
5.5
```

**Try it:** Replace 2.5 with 2.0 and inspect the type of the result.

**Key takeaway:** Promotion rules affect calculations and API return types.

**Why it matters:** Java promotes operands in mixed numeric expressions according to their types,
and that choice affects the type and precision of the result. A calculation that silently uses
integer division, for example, can produce a surprising answer before it reaches a report. This
example isolates one promotion step so you can predict the printed value and choose explicit types
for future calculations.

## Example 5: boolean char

**Purpose:** A boolean holds a condition; a char holds one UTF-16 code unit, which is not every possible Unicode character. The printed condition comes from a boolean; the grade character is one code unit rather than an arbitrary Unicode character.

```java
public final class Example05 {
    public static void main(String[] args) {
        boolean ready = true; // => a two-valued condition
        // => The left side of && evaluates to true.
        char grade = 'A';     // => one UTF-16 code unit
        // => The comparison to 'A' also evaluates to true.
        System.out.println(ready && grade == 'A'); // => true
    }
}
```

Run from the `learning/` directory: `cd code/ex-05-boolean-char && javac Example05.java && java Example05`.

Expected output:

```text
true
```

**Try it:** Change the grade and predict the boolean output.

**Key takeaway:** Precise value types avoid mistaken assumptions in conditions and text.

**Why it matters:** Boolean values express decisions, while char values represent UTF-16 code units
rather than arbitrary user-perceived characters. That difference matters in validation code: a grade
comparison is simple, but a character-count rule for international text needs more care. Run this
small condition first, then remember the distinction when a program handles emoji, accented text, or
other Unicode input.

## Example 6: wrapper boxing

**Purpose:** Autoboxing wraps a primitive int in Integer, and unboxing extracts it again. The assignment to Integer boxes the number, and the later arithmetic expression unboxes it.

```java
public final class Example06 {
    public static void main(String[] args) {
        int primitive = 7; // => primitive holds the unboxed integer 7.
        Integer boxed = primitive; // => autoboxing into a reference
        // => The Integer reference can be null even though primitive cannot.
        int again = boxed;         // => unboxing into a primitive
        // => Unboxing a null Integer here would throw NullPointerException.
        System.out.println(again + 1); // => 8
    }
}
```

Run from the `learning/` directory: `cd code/ex-06-wrapper-boxing && javac Example06.java && java Example06`.

Expected output:

```text
8
```

**Try it:** Set boxed to null and observe where unboxing fails.

**Key takeaway:** Collections and generic APIs often require wrappers, so null awareness matters.

**Why it matters:** Generic collections hold reference types, so Java may box primitive numbers into
wrapper objects when values cross that boundary. The conversion is convenient, but unboxing a null
Integer throws at runtime. This example makes both directions visible with a single value. In real
code, inspect whether a wrapper can be absent before treating it as a primitive in arithmetic.

## Example 7: class def

**Purpose:** A class groups fields and behavior into objects, with each object holding its own field value. Each Task constructor call creates a separate object with its own name field.

```java
public final class Example07 {
    static final class Task {
        String name; // => instance field
        // => A new Task initially has null in this reference field.
    }
    public static void main(String[] args) {
        Task task = new Task(); // => new creates one Task with its own name field.
        task.name = "read"; // => Only this object’s name field becomes read.
        // => The field update does not change any other Task instance.
        System.out.println(task.name); // => prints the value assigned to this Task: read
        // => Reading the field from task sees its latest assigned value.
    }
}
```

Run from the `learning/` directory: `cd code/ex-07-class-def && javac Example07.java && java Example07`.

Expected output:

```text
read
```

**Try it:** Create a second Task and give it a different name.

**Key takeaway:** Classes let related state travel together through a program.

**Why it matters:** A class declaration defines a shape; each constructed object carries its own
instance fields. That distinction matters when several tasks exist at once: updating one task's name
must not silently change another's. This example begins with a visible field to show the storage
idea. Later examples put the field behind methods and constructor validation to protect the object's
invariant.

## Example 8: class methods

**Purpose:** An instance method reads its object's private state through this. Calling label reads the receiver's name, so two Task objects can return different labels.

```java
public final class Example08 {
    static final class Task {
        private final String name; // => Each Task stores one name that is set in its constructor.
        Task(String name) { this.name = name; } // => The constructor copies its argument into that object’s field.
        // => this.name identifies the field; plain name identifies the parameter.
        String label() { return "task:" + name; } // => instance method
        // => The method reads the receiver's private field without taking an argument.
    }
    public static void main(String[] args) {
        System.out.println(new Task("read").label()); // => task:read
        // => A fresh Task is constructed before label is called.
    }
}
```

Run from the `learning/` directory: `cd code/ex-08-class-methods && javac Example08.java && java Example08`.

Expected output:

```text
task:read
```

**Try it:** Call label on two tasks and compare their outputs.

**Key takeaway:** Methods provide a stable behavior boundary around object state.

**Why it matters:** A method attached to an object can compute a result from private state without
giving every caller direct write access. In a task model, that keeps label formatting in one place
instead of repeating string concatenation across a UI and tests. The example's output comes from
label, not from the caller knowing how the field is stored or formatted.

## Example 9: constructor

**Purpose:** A constructor can reject invalid arguments before an object becomes available. The constructor checks the input before storing it, preventing an invalid Task from escaping.

```java
public final class Example09 {
    static final class Task {
        private final String name;
        // => A successful constructor assigns this field exactly once.
        Task(String name) {
            // => The constructor runs before a caller can use the new object.
            if (name.isBlank()) throw new IllegalArgumentException("blank name"); // => A blank name cannot produce a Task.
            // => Whitespace-only input follows the exception branch.
            this.name = name; // => constructor establishes a valid object
            // => Only the validated input reaches the assignment.
        }
    }
    public static void main(String[] args) {
        System.out.println(new Task("read").name); // => prints the validated name read
        // => The valid read value survives construction.
    }
}
```

Run from the `learning/` directory: `cd code/ex-09-constructor && javac Example09.java && java Example09`.

Expected output:

```text
read
```

**Try it:** Try a blank name and inspect the exception.

**Key takeaway:** Valid construction reduces repeated checks in later methods.

**Why it matters:** Constructor validation establishes an invariant at the moment an object is
created. If blank task names were allowed, every later method would have to decide how to handle
them, and some caller might forget. Rejecting the invalid input early makes a valid Task easier to
trust. The example lets you try both paths and see where the failure is reported.

## Example 10: interface

**Purpose:** An interface defines a callable contract that a class implements. The Named variable exposes label without requiring the caller to know the implementing class.

```java
public final class Example10 {
    interface Named { String name(); } // => contract requires one method
    // => The interface describes a callable name without storing it.
    record Task(String name) implements Named {}
    // => The record-generated name() method satisfies Named.
    public static void main(String[] args) {
        Named item = new Task("read"); // => caller uses interface type
        // => The reference type limits calls to Named's contract.
        System.out.println("task:" + item.name()); // => task:read
    }
}
```

Run from the `learning/` directory: `cd code/ex-10-interface && javac Example10.java && java Example10`.

Expected output:

```text
task:read
```

**Try it:** Store Task in a Named variable and call label.

**Key takeaway:** Interfaces let a caller depend on behavior rather than a concrete class.

**Why it matters:** An interface states the operations a caller can rely on while leaving
implementation details to a class. A reporting function can accept Named objects without knowing
whether each name comes from a task, user, or test double. The example has only one implementation
to keep the contract visible; try a second implementation to see the reusable call boundary.

## Example 11: inheritance

**Purpose:** An overriding method is chosen from the runtime object even when the reference has a base type. A base-typed reference still invokes the override belonging to the object it holds.

```java
public final class Example11 {
    static class Task {
        // => The base type provides a label implementation.
        String label() { return "task"; } // => A plain Task reports task before any override.
    }
    static final class DoneTask extends Task {
        // => DoneTask inherits Task but supplies a different label.
        @Override String label() { return "done"; } // => replaces base behavior
    }
    public static void main(String[] args) {
        Task task = new DoneTask(); // => base reference, derived object
        // => The variable's static type is Task; the object's runtime type is DoneTask.
        System.out.println(task.label()); // => done
        // => Dispatch chooses DoneTask.label at runtime.
    }
}
```

Run from the `learning/` directory: `cd code/ex-11-inheritance && javac Example11.java && java Example11`.

Expected output:

```text
done
```

**Try it:** Switch the object to Task and compare labels.

**Key takeaway:** Dynamic dispatch makes polymorphic callers possible.

**Why it matters:** Overriding selects behavior from the actual object, even when code stores it
through a base-class reference. This is useful for a small family of related types whose callers
share a method but need variant behavior. It also means the declared reference type alone does not
tell you the output. Trace the constructed object and the override to predict the printed label.

## Example 12: record basic

**Purpose:** A record supplies named components and generated accessors for a data carrier. The generated accessor uses the component name, so task.name() reads the stored value.

```java
public final class Example12 {
    record Task(String name, int priority) {}
    // => The declaration generates accessors with the component names.
    public static void main(String[] args) {
        Task task = new Task("read", 1); // => The record components are read and 1.
        // => Component order is name first and priority second.
        System.out.println(task.name());     // => read; generated accessor
        System.out.println(task.priority()); // => 1
        // => The int accessor returns the stored priority without conversion.
    }
}
```

Run from the `learning/` directory: `cd code/ex-12-record-basic && javac Example12.java && java Example12`.

Expected output:

```text
read
1
```

**Try it:** Read both accessors, then construct a second value.

**Key takeaway:** Records express transparent data without manual boilerplate.

**Why it matters:** Records are suited to transparent data carriers because Java generates
accessors, equality, hashing, and a readable string form from declared components. A task summary
that merely holds a name and priority needs less ceremony than a mutable class with handwritten
accessors. The example focuses on reading components; use a class when hidden mutable lifecycle
behavior is the real model.

## Example 13: record equals

**Purpose:** Two records with equal components compare equal even when they are separate objects. The comparison checks record components, not whether the two variables refer to the same object.

```java
public final class Example13 {
    record Task(String name, int priority) {}
    // => Generated equals compares both components.
    public static void main(String[] args) {
        Task first = new Task("read", 1); // => first is one record instance.
        // => The first allocation has name read and priority 1.
        Task second = new Task("read", 1); // => second is a distinct instance with equal components.
        // => The second allocation has the same component values.
        System.out.println(first.equals(second)); // => true; component equality
    }
}
```

Run from the `learning/` directory: `cd code/ex-13-record-equals && javac Example13.java && java Example13`.

Expected output:

```text
true
```

**Try it:** Change one priority and predict equals.

**Key takeaway:** Value equality makes records useful for results, keys, and tests.

**Why it matters:** Record equality compares component values, which is useful when a test checks an
expected result or a map uses a record as a key. Two separately constructed values can represent the
same data without being the same object. This example isolates that rule by creating two records
with equal components. Change one component to see exactly which data controls equality.

## Example 14: enum basic

**Purpose:** An enum declares a closed set of named constants. The printed enum value is one of the constants declared in the Status type.

```java
public final class Example14 {
    enum Status { OPEN, DONE }
    // => Only these two named Status values can be selected.
    public static void main(String[] args) {
        Status status = Status.OPEN; // => status holds one of the declared enum constants.
        // => The variable's value is the OPEN constant, not the text "OPEN".
        System.out.println(status.name()); // => OPEN
        // => name() returns the identifier spelling of the constant.
    }
}
```

Run from the `learning/` directory: `cd code/ex-14-enum-basic && javac Example14.java && java Example14`.

Expected output:

```text
OPEN
```

**Try it:** Print both enum constants and inspect their names.

**Key takeaway:** Enums replace fragile free-form status strings.

**Why it matters:** Enums make a finite set of options explicit in source code and in the type
system. A task status written as an unrestricted string can be misspelled and still travel through
several layers before a branch notices. An enum constant cannot have an accidental spelling outside
its declaration. Use this form when the choices are controlled by the application and relatively
stable.

## Example 15: enum switch

**Purpose:** A switch expression maps each enum case to a value. Each Status case contributes one result value, which the switch expression assigns directly.

```java
public final class Example15 {
    enum Status { TODO, DONE }
    // => The switch must account for both declared constants.
    public static void main(String[] args) {
        Status status = Status.DONE; // => The DONE arm will supply the switch value.
        String message = switch (status) { // => message receives the selected arm’s String.
        // => A switch expression yields one String assigned to message.
            case TODO -> "open"; // => TODO would produce open.
            case DONE -> "closed"; // => DONE produces closed for this input.
            // => The active case yields closed; TODO is not evaluated.
        }; // => both enum values covered
        System.out.println(message); // => closed
    }
}
```

Run from the `learning/` directory: `cd code/ex-15-enum-switch && javac Example15.java && java Example15`.

Expected output:

```text
closed
```

**Try it:** Change the status from DONE to TODO.

**Key takeaway:** An exhaustive enum switch makes each state explicit.

**Why it matters:** A switch expression over an enum turns each declared status into an output
value. This makes a status-to-label rule easier to inspect than a chain of loosely related
conditions. When the enum gains a new constant, an exhaustive switch expression needs a
corresponding case. The example keeps just two states so you can test each result before adding more
behavior.

## Example 16: list basic

**Purpose:** A List preserves element order and permits access by zero-based index. The list retains insertion order, and get(0) selects its first element.

```java
import java.util.List;
public final class Example16 {
    public static void main(String[] args) {
        List<String> names = List.of("Ada", "Linus"); // => The unmodifiable list has two ordered elements.
        // => List.of rejects additions and preserves these positions.
        System.out.println(names.get(0)); // => Ada; zero-based access
        // => Index zero selects Ada, not Linus.
        System.out.println(names.size()); // => 2
        // => There are two elements even though the last index is one.
    }
}
```

Run from the `learning/` directory: `cd code/ex-16-list-basic && javac Example16.java && java Example16`.

Expected output:

```text
Ada
2
```

**Try it:** Request index one, then inspect the size.

**Key takeaway:** Indexed collections fit ordered data with positional access.

**Why it matters:** A List keeps a predictable encounter order and exposes elements by position,
which fits ordered input such as tasks shown in a user-selected sequence. Calling get with an index
outside the list fails, so code should not assume an element exists without checking the size. This
example makes indexing and size visible together before iteration hides the index.

## Example 17: list iterate

**Purpose:** A conventional indexed loop exposes both index and value. The loop counter identifies a position as well as the element stored there.

```java
import java.util.List;
public final class Example17 {
    public static void main(String[] args) {
        List<String> names = List.of("Ada", "Linus"); // => The list’s indexes are 0 and 1.
        // => size() is two, so the valid indexes are zero and one.
        for (int index = 0; index < names.size(); index++) { // => index visits 0, then 1.
        // => The strict less-than bound prevents get(2).
            System.out.println(index + ":" + names.get(index)); // => Each line pairs its zero-based index with its name.
            // => The index is available for both lookup and formatting.
        } // => 0:Ada, then 1:Linus
    }
}
```

Run from the `learning/` directory: `cd code/ex-17-list-iterate && javac Example17.java && java Example17`.

Expected output:

```text
0:Ada
1:Linus
```

**Try it:** Change the starting index and predict the output.

**Key takeaway:** Indexes matter when position is part of the requirement.

**Why it matters:** An indexed loop is appropriate when both the element and its position affect the
result. A numbered menu, for example, cannot be printed from values alone without tracking a
counter. This example shows exactly when the index changes and where it is used. Prefer the enhanced
for loop later when positions do not matter, because it removes index bookkeeping.

## Example 18: map basic

**Purpose:** A Map associates a unique key with a value. The lookup returns the value associated with a key, with no reliance on insertion position.

```java
import java.util.Map;
public final class Example18 {
    public static void main(String[] args) {
        Map<String, Integer> scores = Map.of("Ada", 9, "Linus", 7); // => Ada maps to 9 and Linus maps to 7.
        // => The key type is String and each value is Integer.
        System.out.println(scores.get("Ada")); // => 9; lookup by key
        // => An absent key would return null instead of a score.
        // => This lookup needs no scan by numeric position.
    }
}
```

Run from the `learning/` directory: `cd code/ex-18-map-basic && javac Example18.java && java Example18`.

Expected output:

```text
9
```

**Try it:** Look up an absent key and observe the returned null.

**Key takeaway:** Maps support fast key-based access when position is irrelevant.

**Why it matters:** A Map answers lookup questions by key, such as finding a score for a user name,
without searching an entire ordered list. The key must be chosen so it uniquely identifies the value
for this operation. Looking up a missing key may produce null; callers should handle that absence or
use a suitable method with a default. The example keeps one key and value visible.

## Example 19: set basic

**Purpose:** A Set keeps unique elements; this example creates an unmodifiable set. Repeated input does not create another set element, and Set.of also rejects later mutation.

```java
import java.util.Set;
public final class Example19 {
    public static void main(String[] args) {
        Set<String> tags = Set.of("java", "jvm"); // => two unique elements
        // => Set.of would reject a duplicate argument.
        // => The resulting set cannot be mutated.
        System.out.println(tags.size()); // => 2
        // => Size counts distinct elements, here two.
    }
}
```

Run from the `learning/` directory: `cd code/ex-19-set-basic && javac Example19.java && java Example19`.

Expected output:

```text
2
```

**Try it:** Try adding a duplicate in a new mutable set.

**Key takeaway:** Sets express uniqueness directly in the data structure.

**Why it matters:** A Set expresses uniqueness directly: adding the same tag twice should not create
two distinct tags. That is more reliable than letting duplicates collect in a list and remembering
to remove them in every caller. The Set.of form in this example is unmodifiable, which also prevents
accidental later mutation. Choose a different set implementation when insertion is required.

## Example 20: generic list

**Purpose:** The type argument String limits which elements this list can hold. The compiler knows the retrieved item is a String because the list declared that element type.

```java
import java.util.List;
public final class Example20 {
    public static void main(String[] args) {
        List<String> names = List.of("Ada", "Linus"); // => elements are String
        // => The element type is checked when the list is created and read.
        String first = names.get(0); // => no cast required
        // => A String assignment is valid without a runtime cast here.
        System.out.println(first.toUpperCase()); // => ADA
        // => String.toUpperCase returns a new uppercase value.
    }
}
```

Run from the `learning/` directory: `cd code/ex-20-generic-list && javac Example20.java && java Example20`.

Expected output:

```text
ADA
```

**Try it:** Try assigning an Integer to a String variable from the list.

**Key takeaway:** Generics move many type mistakes to compilation.

**Why it matters:** A generic List<String> promises its readers that elements have String behavior,
so callers can use string methods without a cast. The compiler rejects an incompatible element
before the program runs. This matters as data crosses method boundaries: a list typed only as Object
would push mistakes into runtime casts. The example ties declaration, retrieval, and method call
together.

## Example 21: for each

**Purpose:** An enhanced for loop visits each element without managing an index. The loop binds each stored name in turn without exposing a counter.

```java
import java.util.List;
public final class Example21 {
    public static void main(String[] args) {
        for (String name : List.of("Ada", "Linus")) { // => name becomes Ada, then Linus without an index variable.
        // => The enhanced loop supplies the next element each iteration.
            System.out.println(name.toUpperCase()); // => ADA, then LINUS
            // => The original list entries remain unchanged.
            // => This prints once for Ada and once for Linus.
        }
    }
}
```

Run from the `learning/` directory: `cd code/ex-21-for-each && javac Example21.java && java Example21`.

Expected output:

```text
ADA
LINUS
```

**Try it:** Add a third name and predict output order.

**Key takeaway:** Use this form when every item matters and positions do not.

**Why it matters:** The enhanced for loop removes manual index management when a task is simply to
visit each item. This reduces the chance of off-by-one errors and makes the transformation inside
the loop easy to spot. The example keeps its list small so the output order is obvious. Use an
indexed loop only when the position itself contributes to the result.

## Example 22: string methods

**Purpose:** String methods can normalize input before it is inspected. Trimming changes the string before length is measured, so surrounding spaces do not count.

```java
public final class Example22 {
    public static void main(String[] args) {
        String padded = "  Java  "; // => padded retains two spaces on each side.
        // => The source value has eight characters including spaces.
        String clean = padded.strip().toLowerCase(); // => "java"
        // => strip removes the outer spaces before lowercase conversion.
        System.out.println(clean.length()); // => 4
    }
}
```

Run from the `learning/` directory: `cd code/ex-22-string-methods && javac Example22.java && java Example22`.

Expected output:

```text
4
```

**Try it:** Change the surrounding whitespace and predict length.

**Key takeaway:** Text normalization prevents accidental mismatches in input handling.

**Why it matters:** String normalization can turn visually similar input into a consistent form
before comparison or storage. Leading spaces and letter case often matter less than the user's
intended text, but the correct normalization rule depends on the domain. This example demonstrates
strip and lowercase with a visible length check. Do not assume every text field should be normalized
in the same way.

## Example 23: try catch

**Purpose:** A try/catch handles an expected failure at the call site. The catch branch receives the expected exception and provides the fallback result.

```java
public final class Example23 {
    static int parse(String text) {
        // => The parser promises an int result or an unchecked failure.
        return Integer.parseInt(text); // => may throw NumberFormatException
        // => The string no number cannot be converted to an int.
    }
    public static void main(String[] args) {
        try {
            // => The call is inside the recovery boundary.
            System.out.println(parse("no number")); // => The parser throws before println receives a value.
        } catch (NumberFormatException problem) {
            // => Only the expected parse failure enters this handler.
            System.out.println("invalid number"); // => controlled failure message
            // => The fallback text is printed after the parse fails.
        }
    }
}
```

Run from the `learning/` directory: `cd code/ex-23-try-catch && javac Example23.java && java Example23`.

Expected output:

```text
invalid number
```

**Try it:** Change the availability flag to true and compare paths.

**Key takeaway:** A caller can turn a failure into a useful outcome.

**Why it matters:** A try/catch block is a boundary where a caller can decide what an exception
means to its operation. In a small file-reading task, a missing file might become a clear message
instead of an uncaught stack trace. The example uses a controlled failure so you can trace both the
thrown exception and its handling. Catch only failures you can handle meaningfully.

## Example 24: checked exception

**Purpose:** A checked IOException appears in the method declaration and must be handled or declared by callers. The method signature advertises IOException, and the caller must choose how to handle it.

```java
import java.io.IOException;
public final class Example24 {
    static String read(boolean available) throws IOException {
        // => The throws clause makes the checked failure visible to callers.
        if (!available) throw new IOException("missing"); // => checked failure
        // => False availability selects the failure path.
        return "data"; // => The successful branch returns data.
        // => True availability reaches this return instead.
    }
    public static void main(String[] args) throws IOException {
        // => The caller declares rather than catches IOException.
        System.out.println(read(true)); // => data; caller declares failure
    }
}
```

Run from the `learning/` directory: `cd code/ex-24-checked-exception && javac Example24.java && java Example24`.

Expected output:

```text
data
```

**Try it:** Call read with false and observe the declared failure path.

**Key takeaway:** Checked failures make certain recovery obligations visible in signatures.

**Why it matters:** Checked exceptions make certain failure possibilities part of a method's
signature. A caller must catch IOException or declare it, which forces the call site to acknowledge
that reading can fail. This example takes the declaration path to keep the successful result
visible. A production boundary may instead catch the failure and add context that helps the user
recover.

## Example 25: null handling

**Purpose:** A null reference must be handled before calling methods on it. The fallback branch runs because the reference is absent; calling a method on it would fail.

```java
import java.util.Objects;
public final class Example25 {
    public static void main(String[] args) {
        String possible = null; // => possible models an absent reference.
        // => No String object is reachable through possible.
        String fallback = Objects.requireNonNullElse(possible, "guest"); // => fallback becomes guest because possible is null.
        // => The fallback avoids dereferencing possible.
        System.out.println(fallback.toUpperCase()); // => GUEST
        // => The uppercase conversion operates on a non-null String.
    }
}
```

Run from the `learning/` directory: `cd code/ex-25-null-handling && javac Example25.java && java Example25`.

Expected output:

```text
GUEST
```

**Try it:** Replace null with a real value and compare the fallback.

**Key takeaway:** Explicit absence handling avoids a runtime dereference failure.

**Why it matters:** Null is a possible reference value, and calling a method on it throws
NullPointerException. A fallback is useful when absence is expected and a safe default exists, such
as a guest display name. The example makes that decision before calling toUpperCase. For important
missing data, choose an explicit error instead of hiding absence behind a misleading default.

## Example 26: equals vs identity

**Purpose:** Reference identity and value equality answer different questions. The two comparisons can disagree because object identity and character equality are different relations.

```java
public final class Example26 {
    public static void main(String[] args) {
        String first = new String("same"); // => first refers to a newly allocated String.
        // => new forces a distinct object instead of reusing a literal reference.
        String second = new String("same"); // => second refers to another String with equal characters.
        // => Both objects contain the same four characters.
        System.out.println(first == second);      // => false: different objects
        System.out.println(first.equals(second)); // => true: equal characters
    }
}
```

Run from the `learning/` directory: `cd code/ex-26-equals-vs-identity && javac Example26.java && java Example26`.

Expected output:

```text
false
true
```

**Try it:** Change one string's characters and compare both results.

**Key takeaway:** Choosing equals for values avoids accidental identity checks.

**Why it matters:** The == operator asks whether two references identify the same object, while
equals asks whether their values are equal under that type's contract. In tests and business rules
about text, value equality is normally the intended question. The example creates separate String
objects with the same characters so the two checks disagree. That disagreement makes the choice
concrete.
