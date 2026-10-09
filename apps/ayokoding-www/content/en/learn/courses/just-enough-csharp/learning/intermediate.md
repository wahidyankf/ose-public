---
title: "Intermediate Examples"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 20
---

Most snippets are complete `Program.cs` files for a console project. Run them with `dotnet run` after replacing the generated source; the NuGet example also includes the package-install command its source requires.

## Example 27: define an interface

_ex-27 · exercises co-08_

The interface declares an `Area` contract without choosing how a shape calculates it. `Square` provides the calculation promised by the interface.

```csharp
IShape shape = new Square(3); // => interface reference holds a Square of side 3
Console.WriteLine(shape.Area()); // => Output: 9

interface IShape // => declares a shape contract
{
    int Area(); // => implementers must supply an integer area
}

class Square(int side) : IShape // => Square promises IShape.Area
{
    public int Area() => side * side; // => side 3 yields area 9
}
```

**Key takeaway:** an interface specifies capabilities that callers can depend on independently of concrete types.

**Why it matters:** Contracts let application code accept a useful abstraction rather than being
coupled to one implementation. A caller can request a useful capability without knowing whether it
comes from memory, a file, or a test double. That boundary keeps infrastructure details out of the
consumer. Define the smallest interface the caller needs; a broad interface that mirrors a whole
concrete class is harder to substitute meaningfully.

## Example 28: implement an interface

_ex-28 · exercises co-08_

`FixedClock` satisfies every member of `IClock`, so it can be used through the interface reference. The call through `IClock` reaches `FixedClock.Now` and returns `noon`.

```csharp
IClock clock = new FixedClock(); // => interface reference holds the fixed clock
Console.WriteLine(clock.Now()); // => Output: noon

interface IClock // => declares the clock contract
{
    string Now(); // => implementers return a string
}

class FixedClock : IClock // => FixedClock implements IClock
{
    public string Now() => "noon"; // => returns the fixed time noon
}
```

**Key takeaway:** `: IClock` commits a class to provide the interface's promised behavior.

**Why it matters:** Concrete implementations can be exchanged for test doubles or platform-specific
services without changing callers. A concrete class promises to implement every member of its
interface, so callers can use it through the contract. Another implementation can provide
deterministic data for tests or a different platform service. The example keeps the implementation
small to show the substitution point before dependency injection adds configuration.

## Example 29: default interface member

_ex-29 · exercises co-08_

The interface supplies `Greet`'s default body, so an implementer can inherit behavior it does not override. The empty `Greeter` class relies on the interface body for the called member.

```csharp
IGreeter greeter = new Greeter(); // => implementation inherits default
Console.WriteLine(greeter.Greet()); // => Output: hello

interface IGreeter // => declares the greeting contract
{
    string Greet() => "hello"; // => default body returns hello
}

class Greeter : IGreeter { } // => inherits the default greeting
```

**Key takeaway:** default interface members can evolve a contract without forcing every existing implementation to add boilerplate.

**Why it matters:** This is a compatibility tool; use it for coherent defaults, not to hide
substantial implementation logic in interfaces. A default member can add a coherent operation to an
interface without forcing every existing implementation to change immediately. The convenience has a
cost: behavior in an interface may hide work from readers expecting only a contract. Use it for a
truly shared default and keep substantial logic in a named implementation.

## Example 30: base inheritance

_ex-30 · exercises co-09_

`Dog` derives from `Animal` and reads its protected name through the base-class relationship. The derived constructor passes its name to the base constructor.

```csharp
var dog = new Dog("Milo"); // => Dog passes Milo into its Animal base
Console.WriteLine(dog.Describe()); // => Output: animal:Milo

class Animal(string name) // => captures a name in the base type
{
    protected string Name { get; } = name; // => derived types can read Name
}

class Dog(string name) : Animal(name) // => passes name to Animal
{
    public string Describe() => "animal:" + Name; // => combines the base name with a prefix
}
```

**Key takeaway:** inheritance reuses a shared base contract while allowing a derived type to add focused behavior.

**Why it matters:** A meaningful "is-a" relationship can remove duplication; interfaces are usually
safer for independently varying behavior. A base class is useful when derived types truly share
identity and behavior, not merely one similarly named method. Inheritance couples the derived type
to the base implementation, so changing the base can affect every subclass. Prefer an interface when
callers need a capability that unrelated types may implement independently.

## Example 31: virtual override

_ex-31 · exercises co-09_

The call dispatches to `Dog.Sound` even though the variable is statically typed as `Animal`. The virtual member provides the extension point that `Dog` overrides.

```csharp
Animal animal = new Dog(); // => Animal variable contains a Dog instance
Console.WriteLine(animal.Sound()); // => Output: bark

class Animal // => declares the base sound behavior
{
    public virtual string Sound() => "?"; // => virtual member can be overridden
}

class Dog : Animal // => inherits from Animal
{
    public override string Sound() => "bark"; // => replaces base sound with bark
}
```

**Key takeaway:** `virtual` opens a base member for polymorphism, and `override` replaces it in a derived type.

**Why it matters:** Polymorphic dispatch keeps callers stable while individual subclasses supply
their own behavior. A base-typed variable can refer to a derived object, and a virtual call reaches
the override chosen by that runtime object. This lets a caller stay stable while variants supply
different behavior. Trace both the declared type and constructed type when predicting output; the
declared type alone is insufficient.

## Example 32: define a record

_ex-32 · exercises co-12_

The positional record creates immutable value-like data with generated properties and a primary constructor. The output adds the two components, showing how callers can read them without writing property definitions.

```csharp
var point = new Point(2, 3); // => record contains X 2 and Y 3
Console.WriteLine(point.X + point.Y); // => Output: 5

record Point(int X, int Y); // => generates X and Y components
```

**Key takeaway:** a record is a concise default for data whose identity is its contained values.

**Why it matters:** Records make messages, results, and configuration clearer by putting immutable
data at the center. A record collects data whose identity is its values, such as a message, result,
or configuration snapshot. The compiler provides useful equality and display behavior from its
components. That makes records convenient across application boundaries, while an entity with
mutable lifecycle and hidden invariants may fit a class better.

## Example 33: record value equality

_ex-33 · exercises co-12_

Two separately constructed records compare equal because their corresponding values are equal. The equality comparison checks record components rather than object identity.

```csharp
var first = new Point(1, 2); // => first record contains coordinates 1 and 2
var second = new Point(1, 2); // => second record has equal coordinates in a separate instance
Console.WriteLine(first == second); // => Output: True

record Point(int X, int Y); // => generates components used by equality
```

**Key takeaway:** record equality answers "do these values describe the same data?" rather than "are these the same allocation?".

**Why it matters:** Value equality makes assertions, deduplication, and change detection match how
data is normally understood. Two separately constructed records compare equal when their components
compare equal. That aligns assertions and change detection with the data people care about, rather
than object allocation history. When records contain mutable referenced members, equality can still
be surprising, so choose component types with stable value semantics where possible.

## Example 34: record with copy

_ex-34 · exercises co-12_

The `with` expression produces a new record with only `X` changed, leaving the original intact. Printing both X values shows that the original survives the copy unchanged.

```csharp
var first = new Point(1, 2); // => original record retains X 1
var moved = first with { X = 5 }; // => copy changes X to 5 while keeping Y 2
Console.WriteLine(first.X + ":" + moved.X); // => Output: 1:5

record Point(int X, int Y); // => generates components retained by the copy
```

**Key takeaway:** `with` supports non-destructive updates to immutable record data.

**Why it matters:** Copying a changed value avoids surprising observers that still hold the original
record. A with expression produces a changed record while leaving the original available. A UI state
transition can therefore preserve the prior value for comparison, undo, or another observer. The
copy is shallow for referenced components; a mutable nested object may still be shared, so this
syntax alone does not guarantee deep immutability.

## Example 35: positional record deconstruction

_ex-35 · exercises co-12_

The positional record exposes a matching deconstructor, so its two components can bind to local variables. The two deconstructed locals receive the record components in positional order.

```csharp
var point = new Point(3, 4); // => record contains X 3 and Y 4
var (x, y) = point; // => x receives 3 and y receives 4
Console.WriteLine(x + y); // => Output: 7

record Point(int X, int Y); // => generates a positional deconstructor
```

**Key takeaway:** deconstruction extracts named parts of a value without repetitive property-access syntax.

**Why it matters:** It is useful at a local boundary, but retaining the record can be clearer when
its domain meaning matters. Deconstruction can make a local calculation concise when only the
components matter. It also removes the record's domain name from the immediate code, so use it where
the meaning remains obvious. When several components travel through a workflow, keeping the record
intact may communicate intent better than separate variables.

## Example 36: struct value semantics

_ex-36 · exercises co-26_

Copying the `Vec` struct creates independent data; mutating `right` cannot alter `left`. The output reads the original after the copy changes, exposing value semantics.

```csharp
var left = new Vec { X = 1 }; // => left starts with X 1
var right = left; // => right receives its own Vec value
right.X = 2; // => only right changes its X to 2
Console.WriteLine(left.X); // => Output: 1

struct Vec // => declares a value type
{
    public int X { get; set; } // => mutable X belongs to each copy
}
```

**Key takeaway:** structs are value types, so assignment and parameter passing copy their value by default.

**Why it matters:** Small immutable value objects are a good struct fit; large or mutable structs
can make copies costly and confusing. A struct assignment copies its value, which suits small
immutable quantities such as a point or measurement. The copied value can be changed independently
when the struct allows mutation. Large or mutable structs create hidden copy costs and confusing
updates, so keep the design small and use a class when shared identity is needed.

## Example 37: struct versus class

_ex-37 · exercises co-26, co-03_

The same `X` mutation leaves the copied struct unchanged but changes the object seen through a class alias. The output contrasts independent struct storage with shared class state.

```csharp
var value = new Vec { X = 1 }; // => creates the original Vec value
var valueCopy = value; // => copies the Vec value
valueCopy.X = 2; // => valueCopy changes while value stays at X 1
var reference = new Box { X = 1 }; // => creates one Box object
var alias = reference; // => points to that same Box
alias.X = 2; // => alias changes the Box seen through reference
Console.WriteLine(value.X + ":" + reference.X); // => Output: 1:2

struct Vec // => declares value semantics
{
    public int X { get; set; } // => X can change on a Vec copy
}

class Box // => declares reference semantics
{
    public int X { get; set; } // => X mutation is visible through an alias
}
```

**Key takeaway:** choose a struct for independent value semantics and a class when shared identity is intentional.

**Why it matters:** This distinction determines whether a later mutation is isolated or observed by
every holder of the value. Two variables holding a struct have independent copies, while two
variables holding one class instance share a reference. The example places those outcomes side by
side to make later mutations visible. This distinction matters when passing models between layers:
decide whether a change should stay local or be observed by every holder.

## Example 38: generic method

_ex-38 · exercises co-15_

The method's type parameter flows from the input sequence to its returned first element. The compiler uses the input element type to determine the method result type.

```csharp
Console.WriteLine(First(new[] { "a", "b" })); // => Output: a
static T First<T>(IEnumerable<T> xs) => xs.First(); // => type flows through
```

**Key takeaway:** `T` lets one method preserve type information for many element types without casts.

**Why it matters:** Generic helpers reduce duplication while keeping incorrect type combinations out
of a build. A generic method states that its inputs and output share a type relationship without
being fixed to one concrete element type. This preserves compile-time checks and avoids repeated
overloads or Object casts. The helper remains useful for strings and other types, while invalid
combinations fail before a program launches.

## Example 39: generic class

_ex-39 · exercises co-15_

`Box<int>` captures a concrete type argument, so its `Value` property is known to be an `int`. The property returns the same typed value passed into the constructor.

```csharp
var box = new Box<int>(7); // => Box<int> contains the integer 7
Console.WriteLine(box.Value); // => Output: 7

class Box<T>(T value) // => captures the typed constructor value
{
    public T Value { get; } = value; // => property keeps type T
}
```

**Key takeaway:** a generic class carries its type parameter across stored state and operations.

**Why it matters:** Type-parameterized containers are reusable without sacrificing the safety of
strongly typed members. A generic class keeps its member type consistent across construction and
retrieval. A Box<int> cannot accidentally return a string to a caller expecting an integer. This is
the same principle used by everyday collections and typed repositories. The example strips away
storage details so that type preservation is the visible lesson.

## Example 40: generic constraint

_ex-40 · exercises co-15_

The `IComparable<T>` constraint guarantees that the generic method may call `CompareTo` on its inputs. The constraint makes the comparison legal inside the generic method body.

```csharp
Console.WriteLine(Max(2, 5)); // => Output: 5
static T Max<T>(T a, T b) // => returns whichever comparable input is larger
    where T : IComparable<T> => a.CompareTo(b) > 0 ? a : b; // => CompareTo selects 5 over 2 under the type constraint
```

**Key takeaway:** `where T : ...` states the capability a type parameter must provide.

**Why it matters:** Constraints turn an otherwise cryptic generic implementation requirement into a
compiler-enforced contract. A constraint tells the compiler which operations a type parameter must
support. Without it, an implementation that calls those operations would not compile, even if every
current caller happened to pass a suitable type. Keep constraints as narrow as the algorithm needs
so useful future types can still participate.

## Example 41: LINQ query where

_ex-41 · exercises co-16_

Query syntax filters the source with a `where` clause before selecting each matching value. Enumeration evaluates the filter and produces only matching items.

```csharp
var xs = new[] { -1, 2, 3 }; // => input has one negative and two positive values
var positive = from x in xs where x > 0 select x; // => query retains 2 and 3 when enumerated
Console.WriteLine(string.Join(",", positive)); // => Output: 2,3
```

**Key takeaway:** `from`/`where`/`select` reads like a data query over any `IEnumerable<T>`.

**Why it matters:** Query syntax is often the clearest form when a transformation has several
clauses to read top-to-bottom. Query syntax can read like a small data request with selection and
projection clauses. It is useful when several clauses should be read top to bottom. The result still
follows LINQ execution rules; writing query syntax does not automatically materialize it. Check when
enumeration occurs if the source can later change.

## Example 42: LINQ query select

_ex-42 · exercises co-16_

The `select` clause projects each source string into an uppercase result while preserving the query's shape. Each source item becomes a projected result when the query is enumerated.

```csharp
var xs = new[] { "ada", "lin" }; // => lowercase input contains ada and lin
var upper = from x in xs select x.ToUpper(); // => projection creates ADA and LIN when enumerated
Console.WriteLine(string.Join(",", upper)); // => Output: ADA,LIN
```

**Key takeaway:** projection creates a new sequence of the values a caller actually needs.

**Why it matters:** Projecting early prevents later layers from depending on more source data than
they require. Projection chooses which data leaves a query. Returning only the label or score a
report needs reduces coupling to the source object's other fields. It can also make a later change
easier because consumers depend on a smaller shape. Keep selection and projection order clear so the
resulting element type is predictable.

## Example 43: LINQ method where

_ex-43 · exercises co-17_

The `Where` extension method receives a predicate lambda and yields only values that satisfy it. The predicate controls membership while the source collection remains intact.

```csharp
var xs = new[] { 1, 2, 3, 4 }; // => input contains two even numbers
var even = xs.Where(x => x % 2 == 0); // => predicate retains 2 and 4 when enumerated
Console.WriteLine(string.Join(",", even)); // => Output: 2,4
```

**Key takeaway:** method-syntax `Where` expresses filtering as a composable operation on a sequence.

**Why it matters:** Method syntax composes naturally with extension methods and is the foundation
for most day-to-day LINQ pipelines. Method syntax chains extension methods directly and works well
with short filters and transformations. Each stage should express one rule, and the terminal
operation determines when a deferred sequence is evaluated. This style is common in day-to-day C#
code, so recognizing Where early helps you read larger pipelines.

## Example 44: LINQ method orderby

_ex-44 · exercises co-17_

`OrderBy` produces an ordered view of the source using the key selected by its lambda. The selected key determines the sequence returned at enumeration time.

```csharp
var xs = new[] { "Lin", "Ada" }; // => source order is Lin then Ada
var ordered = xs.OrderBy(x => x); // => ordered enumeration yields Ada then Lin
Console.WriteLine(string.Join(",", ordered)); // => Output: Ada,Lin
```

**Key takeaway:** ordering is explicit and non-mutating: the original array remains in its original order.

**Why it matters:** Sorting at a report boundary makes presentation order intentional instead of
relying on incidental input order. An explicit OrderBy makes a report's display order intentional
rather than trusting the source collection's current arrangement. LINQ sorting remains deferred
until enumeration, but it must consider the sequence to produce ordered output. Put sorting near the
report boundary and define tie-breaking when equal keys must have stable relative order.

## Example 45: LINQ chain

_ex-45 · exercises co-17_

The chain filters, transforms, and orders values as three readable stages of one query. Read each extension call from left to right to track the values reaching the final output.

```csharp
var xs = new[] { 3, 1, 2 }; // => source starts in order 3, 1, 2
var result = xs.Where(x => x > 1).Select(x => x * 10).OrderBy(x => x); // => filter, multiply, then sort yields 20, 30
Console.WriteLine(string.Join(",", result)); // => Output: 20,30
```

**Key takeaway:** each LINQ operator returns a sequence that the next operator can refine.

**Why it matters:** Separating pipeline stages makes business rules easier to inspect and change
without interleaving loops and temporary state. A chain can state filtering, transformation, and
ordering without mutable temporary lists. That makes the business rule easier to inspect when each
stage remains short. If the chain grows difficult to debug, name intermediate results or extract a
method. Predict the intermediate values before looking only at the final printed list.

## Example 46: deferred execution

_ex-46 · exercises co-18_

The query does not read `xs` until it is enumerated, so the later `3` is included in its output. The output includes an item added after query construction, proving the timing.

```csharp
var xs = new List<int> { 1, 2 }; // => mutable list begins with 1 and 2
var query = xs.Where(x => x > 1); // => query has not enumerated the source yet
xs.Add(3); // => source now contains 1, 2, and 3
Console.WriteLine(string.Join(",", query)); // => Output: 2,3
```

**Key takeaway:** many LINQ operators describe a query now and execute it later when a consumer iterates it.

**Why it matters:** A deferred Where query stores a recipe and reads its source when it is
enumerated. If a mutable collection changes before that point, the result can change too;
enumerating twice may repeat the work. That matters for a report that must describe one stable
moment. Materialize with ToList at the intended boundary, and keep the source or its elements
immutable when a deeper snapshot is required.

Microsoft explains enumeration timing in [LINQ deferred execution](https://learn.microsoft.com/en-us/dotnet/standard/linq/deferred-execution-lazy-evaluation).

## Example 47: immediate execution

_ex-47 · exercises co-18_

`ToList` materializes the filtered values before the source changes, creating a stable snapshot. The later source mutation cannot change the already materialized list.

```csharp
var xs = new List<int> { 1, 2 }; // => source begins with 1 and 2
var snapshot = xs.Where(x => x > 1).ToList(); // => snapshot immediately stores only 2
xs.Add(3); // => source changes after snapshot creation
Console.WriteLine(string.Join(",", snapshot)); // => Output: 2
```

**Key takeaway:** materializers such as `ToList` force a deferred query to run at a chosen moment.

**Why it matters:** A snapshot is useful when later mutations must not alter a report, response, or
multi-pass calculation. ToList executes the query now and stores the observed elements in a separate
list. A later mutation of the source does not change that list's membership, which helps a report
remain stable across multiple reads. The snapshot is shallow: mutable objects inside it may still
change, so consider element immutability too.

## Example 48: lambda expression

_ex-48 · exercises co-19_

A lambda creates a callable value that doubles whichever integer is supplied to it. Calling the lambda with a value applies the same multiplication each time.

```csharp
Func<int, int> doubleIt = x => x * 2; // => delegate doubles its integer argument
Console.WriteLine(doubleIt(4)); // => Output: 8
```

**Key takeaway:** `x => x * 2` is a compact function definition whose parameter and return types are checked.

**Why it matters:** Lambdas let behavior travel as data into APIs such as LINQ without inventing
one-off named methods. A lambda passes a small behavior to another method without declaring a named
method used only once. The compiler still checks its parameters and result against the expected
delegate type. Use a descriptive parameter name and keep the body brief; complex rules deserve a
named function so their intent can be reviewed and tested.

## Example 49: Func delegate

_ex-49 · exercises co-19_

`Func<string, int>` states that the delegate accepts a string and produces an integer result. The delegate signature makes both the argument and result types explicit.

```csharp
Func<string, int> length = text => text.Length; // => delegate maps text to its length
Console.WriteLine(length("C#")); // => Output: 2
```

**Key takeaway:** `Func<...>` represents a callback with a return value.

**Why it matters:** Explicit delegate signatures document what a higher-order API needs from its
caller. Here `Func<string, int>` accepts text and returns its integer length; `length("C#")`
therefore prints `2`. A method receiving this delegate can call it without knowing how the
length was calculated. This shape is useful for transformation and calculation hooks. A named
delegate or interface may be clearer if the callback needs several related operations or state.

## Example 50: Action delegate

_ex-50 · exercises co-19_

`Action<string>` carries an effectful callback that accepts text and returns no result. The callback writes its input when invoked rather than producing a return value.

```csharp
Action<string> show = text => Console.WriteLine(text); // => callback writes supplied text without returning a value
show("saved"); // => Output: saved
```

**Key takeaway:** `Action<...>` models work performed for its side effect rather than for a returned value.

**Why it matters:** Event handlers and configurable notifications commonly need this no-result
callback shape. Action<T> represents a callback that accepts a value and returns no result, such as
a notification hook. The absence of a return value should be intentional; errors still need handling
rather than disappearing inside a callback. If the operation is asynchronous, use a Task-returning
delegate so callers can await completion and observe failures.

## Example 51: lambda in LINQ

_ex-51 · exercises co-19, co-17_

The lambda passed to `Select` extracts one initial from each name in the source sequence. The projection converts every full name into one output character.

```csharp
var names = new[] { "Ada", "Lin" }; // => source names start with A and L
var initials = names.Select(name => name[0]); // => projection yields the A and L characters
Console.WriteLine(string.Join(",", initials)); // => Output: A,L
```

**Key takeaway:** LINQ lambdas define the per-element rule while the operator controls the iteration.

**Why it matters:** This separation clarifies whether a bug belongs in the transformation rule or in
the collection traversal. The lambda supplies the per-element transformation, while LINQ handles
traversal and collection. That separation lets you check whether a wrong result comes from the
expression or from which elements enter the pipeline. Keep the lambda pure when possible, because
hidden side effects make deferred and repeated enumeration harder to reason about.

## Example 52: list of records

_ex-52 · exercises co-12, co-14_

The list stores immutable `Point` records, then LINQ projects their X coordinates into a report. The report reads record properties without changing the source records.

```csharp
var points = new List<Point> { new(1, 2), new(3, 4) }; // => records contain X coordinates 1 and 3
Console.WriteLine(string.Join(",", points.Select(p => p.X))); // => Output: 1,3

record Point(int X, int Y); // => defines the two projected coordinates
```

**Key takeaway:** records and generic collections combine typed data modeling with ordinary sequence operations.

**Why it matters:** This is the common shape of in-memory application data before it is filtered or
rendered. A list of records is a common in-memory shape for a report: each record carries a named
row of data, and the list preserves an order for processing. LINQ can then filter or project without
mutating the original values. This small model is enough to practice the language before introducing
database or UI frameworks.

## Example 53: interface polymorphism

_ex-53 · exercises co-08, co-09_

The `IShape[]` holds different implementations, and each call dispatches to the matching `Area` method. The square returns its exact area; this integer-only circle example uses 3 as an approximation for pi.

```csharp
IShape[] shapes = [new Square(2), new Circle(1)]; // => array holds Square and Circle behind one interface
Console.WriteLine(string.Join(",", shapes.Select(x => x.Area()))); // => Output: 4,3

interface IShape // => declares the shared shape contract
{
    int Area(); // => each shape supplies area
}

class Square(int x) : IShape // => implements the square area
{
    public int Area() => x * x; // => side 2 produces area 4
}

class Circle(int x) : IShape // => implements the circle area
{
    public int Area() => x * x * 3; // => approximates πr² using 3 for π; radius 1 gives 3
}
```

**Key takeaway:** a collection of interface values can invoke one shared operation across heterogeneous types.

**Why it matters:** Interface polymorphism lets new implementations join an existing workflow
without a growing type-switch. An interface-typed collection can hold several implementations and
call the same capability on each. Adding a new implementation does not require a growing series of
type tests in the caller. This works best when the interface describes a real shared operation and
each implementation honors the same observable contract.

## Example 54: NuGet package command

_ex-54 · exercises co-25_

Add a package to the project before importing its API. This example uses Humanizer, then calls its `ToWords` extension method. The package reference supplies the extension method used by the final expression.

```bash
dotnet add package Humanizer --version 2.14.1
```

```csharp
using Humanizer; // => brings ToWords into extension-method lookup

Console.WriteLine(3.ToWords()); // => Output: three
```

Run `dotnet run` after the add command; restore resolves the package and the import compiles.

**Key takeaway:** `dotnet add package` records a dependency in the project file so restore can make its APIs available.

**Why it matters:** The package command records Humanizer as a versioned project dependency, so
another machine can restore the same API before compiling the example. A using directive only
shortens a namespace; it cannot fetch an absent package. Review whether a dependency earns its build
and maintenance cost, then keep its version visible in the project file. Remove a package if the
feature no longer uses it.
