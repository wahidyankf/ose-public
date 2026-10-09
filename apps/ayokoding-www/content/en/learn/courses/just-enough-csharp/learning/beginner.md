---
title: "Beginner Examples"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 10
---

Most snippets are complete `Program.cs` files for a console project. Run them with `dotnet run` after replacing the generated source. Examples that teach project creation, test execution, nullable configuration, or compiler diagnostics include the required command or project-file fragment as well.

## Example 1: dotnet new console

_ex-01 · exercises co-01_

`dotnet new console` creates the project and its top-level `Program.cs`; this recipe verifies both artifacts instead of printing the command name. The generated source is a useful baseline before changing language features.

```bash
dotnet new console --output CsharpPrimer
dotnet run --project CsharpPrimer
```

The generated `Program.cs` contains:

```csharp
Console.WriteLine("Hello, World!"); // => Output: Hello, World!
```

The generated program prints `Hello, World!` and gives the next examples a real project home.

**Key takeaway:** `dotnet new console` scaffolds a compilable console application, not just a source file.

**Why it matters:** Starting from the SDK template establishes the project metadata that builds,
tests, package references, and editor tooling all use. The generated project is a known working
baseline. Keep its project file with Program.cs when sharing the example, because another developer
needs the target framework and build settings to reproduce it. Edit the source only after the first
launch succeeds, so setup problems and code problems stay distinguishable.

## Example 2: dotnet run

_ex-02 · exercises co-01_

`dotnet run` builds the current project when needed and launches its entry point in one command. The printed number confirms that the edited source, rather than a stale build, ran.

```csharp
var answer = 42; // => 42 is inferred as int
Console.WriteLine(answer); // => Output: 42
```

**Key takeaway:** `dotnet run` is the shortest feedback loop for a console project.

**Why it matters:** Running through the SDK keeps the command line, project configuration, and
source code on the same path used by CI. The SDK launch command verifies that the project compiles
and its entry point starts, which is the shortest useful feedback loop for a CLI. It does not prove
the answer is correct. Compare the printed value with the expected result, and add a test when that
behavior becomes part of a shared workflow.

## Example 3: dotnet test command

_ex-03 · exercises co-01_

`dotnet test` builds a test project and executes its discovered tests. Create the SDK test project, replace its generated test, then run the command. The assertion checks a calculated value, so a wrong sum makes the test fail.

```bash
dotnet new xunit --output CsharpPrimer.Tests
```

Save this as `CsharpPrimer.Tests/UnitTest1.cs`:

```csharp
using Xunit; // => imports xUnit Fact and Assert

public sealed class ArithmeticTests // => groups the arithmetic test
{
    [Fact] // => marks this method for test discovery
    public void AddsTwoNumbers() => Assert.Equal(5, 2 + 3); // => passes when 2 + 3 equals 5
}
```

```bash
dotnet test CsharpPrimer.Tests/CsharpPrimer.Tests.csproj
```

The final command reports one passing test.

**Key takeaway:** `dotnet test` is the repeatable way to build and verify an automated test project.

**Why it matters:** A test command is useful only when it executes an assertion whose pass/fail
result can protect a later change. The xUnit template supplies discovery and assertion support, but
the check is meaningful only when a named test actually runs. Change the expected value temporarily
and confirm the test fails. That red result proves a future behavior change would be noticed rather
than disappearing behind a successful compile.

## Example 4: top-level statements

_ex-04 · exercises co-02_

Top-level statements let a small program state its work directly, while the compiler supplies the entry point. The local variable and output are still ordinary statements executed in order.

```csharp
var message = "top-level"; // => no Main class needed
Console.WriteLine(message); // => Output: top-level
```

**Key takeaway:** a console app needs one entry point, not necessarily a hand-written `Main` method.

**Why it matters:** Removing ceremonial startup code keeps small utilities and learning examples
focused on their behavior. The compiler still creates an entry point; it merely lets a short program
omit the surrounding Main declaration. This is useful for an exploratory command or teaching
example. If startup begins coordinating several services, extract named methods and types so the
order and responsibilities remain easy to inspect.

## Example 5: var inference

_ex-05 · exercises co-04_

`var` asks the compiler to infer a local type from the expression on the right. Calling `GetType` reveals the concrete runtime type inferred for this literal.

```csharp
var number = 42; // => compiler infers int
Console.WriteLine(number.GetType().Name); // => Output: Int32
```

**Key takeaway:** inference preserves static typing; `number` is still an `int`.

**Why it matters:** Use `var` when the initializer makes the type obvious, so declarations stay
concise without becoming vague. Inference happens at compile time, so the variable is not
dynamically typed. Changing the initializer can change the inferred type and make a later method
call invalid. Read both sides of the declaration during review, especially when a refactor replaces
a simple literal with a factory call.

## Example 6: int, string, and bool

_ex-06 · exercises co-04_

The three declarations model a quantity, text, and a decision with their built-in C# types. The final line converts each typed value to text only when composing the output.

```csharp
int count = 3; // => count holds the integer 3
string label = "ready"; // => label holds the text ready
bool enabled = true; // => enabled is a Boolean true
Console.WriteLine(label + ":" + count + ":" + enabled); // => Output: ready:3:True
```

**Key takeaway:** choose a type that expresses the kind of value, not merely how it will be printed.

**Why it matters:** Correct primitive types give the compiler useful checks before richer domain
types are introduced. Each declaration communicates which operations are valid: a count can be
added, text can be displayed, and a flag can choose a branch. A domain value with stricter rules may
later deserve its own type, but these basic types let the compiler catch category mistakes in the
first small program.

## Example 7: value-type copy

_ex-07 · exercises co-03_

Assigning an `int` copies its value, so changing the second variable cannot affect the first. The unchanged first value makes the copy visible after the second assignment.

```csharp
var first = 1; // => first starts at 1
var second = first; // => second receives an independent copy of 1
second = 2; // => only second changes
Console.WriteLine(first); // => Output: 1
```

**Key takeaway:** value-type assignment creates independent values.

**Why it matters:** Knowing when data is copied prevents accidental shared-state assumptions in
calculations and structs. The copy is independent, so assigning a new value to the second variable
leaves the first unchanged. This contrasts with references to mutable class instances in the next
example. Prefer small immutable structs when copy semantics represent the domain; large mutable
structs can make repeated copying costly and confusing.

## Example 8: reference-type alias

_ex-08 · exercises co-03_

Assigning a class value copies its reference, so both variables point at the same `Counter` object. Reading through `first` reveals the mutation performed through `second`.

```csharp
var first = new Counter(); // => first refers to one mutable Counter
var second = first; // => second aliases that same Counter
second.Value = 2; // => the shared Counter now stores 2
Console.WriteLine(first.Value); // => Output: 2

class Counter // => mutable reference type shared by both variables
{
    public int Value { get; set; } // => setter changes the shared object
}
```

**Key takeaway:** reference assignment aliases an object; mutation through either alias is shared.

**Why it matters:** Alias awareness is essential when mutable model objects cross service or UI
boundaries. A second variable can point to the same Counter, so mutation through either name is
visible through both. This is useful when shared state is intentional, but surprising when a caller
expected a snapshot. Define who owns mutable models at service and UI boundaries, or return
immutable records when sharing should be safe.

## Example 9: enable nullable analysis

_ex-09 · exercises co-05_

Nullable reference types are activated at project scope. Put this property in the console project's `.csproj`, then compile the nullable-aware source. The non-nullable declaration permits a direct `Length` access without a warning.

```xml
<PropertyGroup>
  <Nullable>enable</Nullable>
</PropertyGroup>
```

```csharp
string name = "Ada"; // => non-nullable string under enabled analysis
Console.WriteLine(name.Length); // => Output: 3
```

`dotnet build` now performs null-state analysis for every reference type in the project.

**Key takeaway:** `<Nullable>enable</Nullable>` makes non-nullability the default contract instead of an opt-in convention.

**Why it matters:** Enabling nullable analysis across a project makes possible missing references
visible to the compiler before they become runtime dereferences. It does not enforce non-null values
at runtime, so input from a file, service, or user still needs validation. Work through each warning
by adding a guard, fallback, or stronger boundary contract. Suppressing every warning would make the
build quiet while leaving the unsafe path intact.

Microsoft documents the compiler-only behavior in [Nullable reference types](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/null-safety/nullable-reference-types).

## Example 10: nullable annotation

_ex-10 · exercises co-05_

The `?` annotation declares that the absent value is part of this variable's contract. The coalescing expression uses `guest` only because `name` is null.

```csharp
string? name = null; // => reference may be absent
Console.WriteLine(name ?? "guest"); // => Output: guest
```

**Key takeaway:** `string?` communicates possible absence, while `??` supplies an intentional fallback.

**Why it matters:** Expressing absence in the type makes callers confront it instead of relying on
informal null conventions. A `string?` makes a potentially missing result visible to callers, while
non-nullable `string` states the intended contract under analysis. Neither syntax checks external
data at runtime. Validate at the point where untrusted data enters and decide whether absence is
ordinary, exceptional, or deserving of a user-visible fallback.

## Example 11: null analysis warning

_ex-11 · exercises co-05_

The compiler warns when a nullable value is dereferenced without a preceding null check. Build this source with Example 9's nullable configuration enabled. The warning identifies the dereference rather than the nullable declaration itself.

```csharp
string? name = Console.ReadLine(); // => input may return null
Console.WriteLine(name.Length); // => CS8602 warning: possible null dereference
```

```bash
dotnet build
```

The build succeeds with the diagnostic unless the project elects to treat warnings as errors.

**Key takeaway:** a nullable annotation propagates uncertainty until the code proves the value is present.

**Why it matters:** Reading the warning at the dereference site leads to an explicit guard or
fallback, rather than a latent `NullReferenceException`. Flow analysis follows guards through
branches, allowing a safe dereference after the compiler knows a value is present. Keep that check
near the use so later edits do not create a new unguarded path. This is especially useful for
dictionary lookups and service responses that can legitimately be absent.

## Example 12: null-forgiving operator

_ex-12 · exercises co-06_

The null-forgiving operator tells the compiler to treat a value as present; it does not prove that the runtime value is non-null. The explicit non-null value makes this demonstration safe even though `!` has no runtime effect.

```csharp
string? name = "Ada"; // => locally proven present
Console.WriteLine(name!.Length); // => Output: 3
// => ! suppresses analysis, not a runtime null check
```

**Key takeaway:** `!` changes null-state analysis only; it does not add a runtime check.

**Why it matters:** Reserve `!` for a documented invariant; a guard is safer whenever that invariant
can fail. The operator suppresses a warning without adding a runtime check. If the value is actually
null, the next dereference still throws. Use it only when another enforced invariant proves
presence; otherwise write the guard and choose a missing-value outcome that gives the caller useful
information.

## Example 13: string interpolation

_ex-13 · exercises co-23_

String interpolation embeds an expression directly in a string literal. The expression is evaluated before the final string is printed.

```csharp
var name = "Ada"; // => name supplies Ada to the interpolation
Console.WriteLine($"Hi {name}"); // => Output: Hi Ada
```

**Key takeaway:** prefixing a string literal with `$` lets braces contain the values being formatted.

**Why it matters:** Interpolation makes a message template readable when fixed text and several
values belong together. A reviewer can see the intended order without following a chain of
concatenations, and formatting expressions can be kept close to their labels. The resulting string
is still ordinary text, not a safe query or shell argument. Use parameterized APIs or
context-appropriate encoding when values cross those boundaries.

## Example 14: string methods

_ex-14 · exercises co-23_

Core `string` methods return transformed or inspected text without mutating the original string. Observe which method creates new text and which method answers a question about the source.

```csharp
var text = "ready,steady"; // => comma separates the two words in the source
var parts = text.ToUpper().Split(','); // => transforms and splits
Console.WriteLine($"{parts[1]}:{text.Contains(",")}"); // => Output: STEADY:True
```

**Key takeaway:** `ToUpper`, `Split`, and `Contains` respectively transform, partition, and inspect text.

**Why it matters:** These operations are the basic vocabulary for parsing user input and shaping
text for display without hidden mutation. Methods such as `ToUpper` and `Split` return new values,
so they do not alter the original input held by another variable. Normalize according to the domain:
case folding may help a search key but harm a person's displayed name. This example isolates
operations before they are combined into a parser or validation rule.

## Example 15: declare a namespace

_ex-15 · exercises co-24_

A namespace gives `Badge` a qualified identity instead of leaving it in the global scope. The fully qualified construction names exactly which `Badge` type is used.

```csharp
Console.WriteLine(new Primer.Badge().Name); // => Output: C#

namespace Primer // => qualifies the Badge type as Primer.Badge
{
    public class Badge // => public type inside Primer
    {
        public string Name => "C#"; // => getter returns C#
    }
}
```

**Key takeaway:** namespaces organize related types and prevent unrelated names from colliding.

**Why it matters:** A namespace gives related types a discoverable identity and lets unrelated teams
reuse short type names without collision. It helps readers locate a model or service as a codebase
grows, while imports keep callers concise. A namespace is an organization tool, not a security or
deployment boundary. Choose names from stable responsibilities rather than reflecting every
temporary folder or runtime layer.

## Example 16: using directive

_ex-16 · exercises co-24_

A `using` directive makes extension methods in an imported namespace available by their short names. The imported namespace lets the extension call use method syntax on its receiver.

```csharp
using System.Linq; // => imports LINQ extension methods such as Count

Console.WriteLine(new[] { 1, 2, 3 }.Count()); // => Output: 3
```

**Key takeaway:** `using System.Linq` brings LINQ's `Count` extension method into scope.

**Why it matters:** Imports keep source readable, but limiting them to needed namespaces keeps
dependencies apparent. A using directive shortens a type name but does not install a package or fix
an absent project reference. That distinction matters when code builds in one environment and fails
in another. Keep the package declaration, project dependency, and source import aligned so a
teammate can reproduce the build.

## Example 17: define a class

_ex-17 · exercises co-07_

The class combines a named piece of state with the objects created from its definition. The object initializer assigns the property before its value is printed.

```csharp
var card = new Card { Title = "Inbox" }; // => initializer stores Inbox in the new Card
Console.WriteLine(card.Title); // => Output: Inbox

class Card // => defines the mutable Card model
{
    public string Title { get; set; } = ""; // => property starts as an empty string
}
```

**Key takeaway:** a class defines the shape and behavior shared by each instance created with `new`.

**Why it matters:** Classes become the boundary for cohesive application responsibilities, not
merely bags of fields. A class with one clear responsibility is easier to test than a type that
mixes storage, presentation, and input parsing. This first declaration shows the shape before more
behavior is added. As a program grows, group operations by the decision they own rather than adding
unrelated methods to a convenient class.

## Example 18: class constructor

_ex-18 · exercises co-07_

The primary constructor requires the `User` name at creation and exposes it as read-only state. Passing `Ada` supplies the constructor parameter captured by the read-only property.

```csharp
var user = new User("Ada"); // => required construction state
Console.WriteLine(user.Name); // => Output: Ada

class User(string name) // => captures the required name argument
{
    public string Name { get; } = name; // => getter exposes the captured name
}
```

**Key takeaway:** constructors establish invariants before an object can be used.

**Why it matters:** Required construction data prevents partially initialized objects from leaking
through an application. Passing required data at construction time avoids an object that exists
briefly in an invalid or incomplete state. A constructor can reject bad values before callers obtain
the instance. Keep external input validation at the boundary and preserve core invariants in the
type, so every creation path agrees.

## Example 19: instance method

_ex-19 · exercises co-07_

The instance method reads the `Meter`'s state and returns a calculation associated with that object. Calling `Next` computes four from the stored three without mutating the meter.

```csharp
var meter = new Meter(3); // => constructor captures the starting value 3
Console.WriteLine(meter.Next()); // => Output: 4

class Meter(int value) // => captures the initial meter value
{
    public int Next() => value + 1; // => returns 3 + 1 without changing value
}
```

**Key takeaway:** instance methods place behavior next to the state they operate on.

**Why it matters:** Cohesive methods make a model easier to reason about and test than scattered
procedural logic. The method names a behavior that belongs with the object's state, giving callers a
stable operation instead of access to scattered implementation details. If several UI or service
callers need the same label, one method prevents different copies of the formatting rule from
drifting apart.

## Example 20: auto-property

_ex-20 · exercises co-10_

An auto-property lets the compiler manage storage while the type exposes a public get/set contract. The later assignment changes the same object whose property the output reads.

```csharp
var item = new Item(); // => Name starts as an empty string
item.Name = "Review"; // => Name now stores Review on the same object
Console.WriteLine(item.Name); // => Output: Review

class Item // => declares the item type
{
    public string Name { get; set; } = ""; // => getter and setter store the assigned name
}
```

**Key takeaway:** `{ get; set; }` is appropriate for mutable state whose storage needs no custom logic yet.

**Why it matters:** Properties give a stable public surface even if validation or computed behavior
is added later. A property exposes a named contract even when storage is compiler-generated. You can
later add validation or compute a result without changing the caller's member name, though such
behavior changes still need tests. Choose setter accessibility deliberately; public mutation should
be a conscious part of the model.

## Example 21: init-only property

_ex-21 · exercises co-10_

An `init` accessor accepts an object-initializer value but rejects later reassignment. The initializer sets `Id` while construction is still allowed to write it.

```csharp
var item = new Item { Id = 7 }; // => allowed at construction
Console.WriteLine(item.Id); // => Output: 7

class Item // => declares the item type
{
    public int Id { get; init; } // => Id can be set during initialization
}
```

**Key takeaway:** `{ get; init; }` supports convenient construction while preserving immutable state afterward.

**Why it matters:** Immutable configuration and message data are safer to share because their values
cannot change unexpectedly. The property can be assigned during object initialization but not
reassigned afterward through that member. This reduces accidental changes to messages and
configuration after they are shared. It does not deeply freeze an object stored inside the property,
so mutable nested values still need an ownership decision.

## Example 22: expression-bodied member

_ex-22 · exercises co-11_

The expression-bodied property computes area directly from the constructor values. Reading `Area` evaluates `w * h` without storing a separate area field.

```csharp
var box = new Box(3, 4); // => constructor receives width 3 and height 4
Console.WriteLine(box.Area); // => Output: 12

class Box(int w, int h) // => captures width 3 and height 4
{
    public int Area => w * h; // => computes 3 * 4 on access
}
```

**Key takeaway:** `=>` is concise when a member has one clear expression and no additional steps.

**Why it matters:** Compact derived values read like their mathematical definition while remaining
normal properties to callers. The short syntax works best when the value is a transparent
calculation from existing state. It remains an ordinary property or method to callers. When a
computation gains branching, side effects, or expensive work, use a block body and a descriptive
name so brevity does not conceal cost.

## Example 23: define an enum

_ex-23 · exercises co-13_

An enum names a closed set of integral values; a `switch` makes every state decision visible. The `Ready` arm maps the chosen enum member to `start`.

```csharp
var state = Status.Ready; // => Ready is the enum member being classified
var message = state switch // => selects an arm from the current Status
{
    Status.Ready => "start", // => Ready maps to start
    Status.Loading => "wait", // => Loading maps to wait
    Status.Failed => "retry", // => Failed maps to retry
    _ => "retry", // => unknown numeric status maps to retry
};
Console.WriteLine(message); // => Output: start

enum Status // => defines named status values
{
    Loading, // => underlying value 0
    Ready, // => selected named value
    Failed, // => underlying value 2
}
```

**Key takeaway:** an enum replaces magic numeric or string state markers with a type-checked vocabulary.

**Why it matters:** Switching over named states makes incomplete or unexpected state handling much
easier to find during review. An enum narrows a status to declared constants, preventing an
accidental free-form spelling from entering ordinary control flow. A switch expression can then map
each state to output, but its runtime coverage still needs review when the enum changes. If variants
carry different data, use a richer model rather than stretching one enum.

## Example 24: array

_ex-24 · exercises co-14_

The array stores a fixed-length ordered sequence and uses a zero-based index for retrieval. The retrieved item occupies the index counted from zero.

```csharp
int[] values = [1, 2, 3]; // => array has three indexed elements
Console.WriteLine(values[1]); // => Output: 2
```

**Key takeaway:** arrays are best when the collection size and element type are known and stable.

**Why it matters:** Array indexing is fast and direct, but callers must respect its fixed bounds. An
array fits a known-size sequence with positional access, such as a fixed set of readings. Access
outside its zero-based bounds throws, so callers need a valid index or a loop over its length.
Choose a list instead when adding and removing items is part of normal work.

## Example 25: generic list

_ex-25 · exercises co-14_

`List<string>` grows as names are added while preserving the element type and insertion order. The declared element type prevents adding a value of an unrelated type.

```csharp
var names = new List<string> { "Ada" }; // => list starts with one string, Ada
names.Add("Lin"); // => list now contains Ada followed by Lin
Console.WriteLine(string.Join(",", names)); // => Output: Ada,Lin
```

**Key takeaway:** `List<T>` is the general-purpose mutable sequence for values of one known type.

**Why it matters:** Generic collections move type mistakes to compile time instead of requiring
casts at every use. A List<string> tells the compiler and readers which element type to expect, so a
retrieved value needs no cast before string operations. Lists preserve order and can grow. When
multiple callers share one, decide whether they may mutate it or whether to expose a read-only view.

## Example 26: dictionary

_ex-26 · exercises co-14_

The dictionary associates the `pen` key with its price and retrieves the value by that key. The lookup uses a string key rather than an array position.

```csharp
var prices = new Dictionary<string, int> { ["pen"] = 2 }; // => pen maps to the integer price 2
Console.WriteLine(prices["pen"]); // => Output: 2
```

**Key takeaway:** `Dictionary<TKey, TValue>` models lookup by a unique key rather than by positional index.

**Why it matters:** Keyed lookup is a natural fit for IDs and codes, but missing keys need
deliberate handling in production code. A Dictionary maps keys to values and avoids scanning an
entire sequence for repeated ID lookups. Its indexer throws for an absent key, while TryGetValue
makes absence a branch the caller must handle. Use stable key equality and sort entries explicitly
when presentation order matters.
