---
title: Beginner
date: 2026-02-02T00:00:00+07:00
draft: false
weight: 10000001
description: "Examples 1-30: F# fundamentals from Hello World to higher-order functions (0-40% coverage)"
tags: ["f-sharp", "tutorial", "by-example", "beginner", "functional-programming"]
---

This beginner tutorial covers F#'s foundational syntax and functional-first paradigm through 30 heavily annotated examples. Each example demonstrates core concepts with detailed inline comments explaining the functional approach.

## Example 1: Hello World and F# Interactive

F# is a functional-first language that compiles to .NET bytecode. You can run F# code interactively using F# Interactive (FSI) or compile it to executables.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Source Code<br/>program.fs]:::blue --> B[F# Compiler<br/>fsc]:::orange
    A --> C[F# Interactive<br/>fsi]:::teal
    B --> D[Executable<br/>program.exe]:::orange
    C --> E[REPL Output]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 1: Hello World and F# Interactive
// => F# uses // for single-line comments

printfn "Hello, World!"  // => printfn prints to stdout with newline
                          // => Outputs: Hello, World!
                          // => No semicolons required (unlike C#)
```

**Key Takeaway**: F# uses `printfn` for formatted output with automatic newline. The language emphasizes expressions over statements, and semicolons are optional.

**Why It Matters**: F# Interactive (FSI) enables rapid prototyping and REPL-driven development similar to Python, but with .NET's type safety and performance. Developers use FSI for testing algorithms, exploring APIs, and verifying logic interactively before committing to a full compile cycle. In production teams, FSI scripts serve as executable documentation and exploratory tools. The tight feedback loop accelerates development compared to traditional compile-run-debug cycles common in Java or C#.

## Example 2: Immutable Values with let

F# defaults to immutability - values bound with `let` cannot be changed. This eliminates entire classes of bugs related to unexpected mutations.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[let x = 10]:::blue --> B[Immutable Binding]:::orange
    B --> C[Cannot reassign x]:::teal
    A --> D[let x = 20<br/>New binding<br/>shadows old]:::purple

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 2: Immutable Values with let
let x = 10               // => x is bound to 10 (type: int, inferred)
                         // => IMMUTABLE - cannot reassign x

// x <- 20                // => ERROR: cannot mutate immutable binding
                         // => F# compiler rejects mutation by default

let x = 20               // => SHADOWING: creates NEW binding
                         // => Previous x (10) is no longer accessible
                         // => New x is 20 in current scope

printfn "%d" x           // => Outputs: 20
                         // => %d is format specifier for integers
```

**Key Takeaway**: Use `let` for immutable bindings (default in F#). Shadowing creates new bindings; it doesn't mutate existing values.

**Why It Matters**: Immutability by default prevents many concurrency bugs, as immutable data can be safely shared across threads without locks. F#'s compiler-enforced immutability makes concurrent code safer than C# or Java equivalents without sacrificing .NET interoperability. Production systems benefit from elimination of the entire category of "race conditions on shared state" bugs, reducing incident rates in concurrent microservices and improving reasoning about code correctness during code review.

## Example 3: Type Inference

F#'s type inference system deduces types from usage, reducing boilerplate while maintaining full static typing.

```fsharp
// Example 3: Type Inference
let age = 30             // => age is int (inferred from literal 30)
                         // => No type annotation needed

let name = "Alice"       // => name is string (inferred from string literal)
                         // => F# infers most precise type

let pi = 3.14            // => pi is float (inferred from decimal literal)
                         // => float is 64-bit IEEE 754 (like double in C#)

let isValid = true       // => isValid is bool (inferred from boolean literal)
                         // => true/false are lowercase keywords

printfn "%d %s %.2f %b" age name pi isValid
                         // => Outputs: 30 Alice 3.14 true
                         // => %d=int, %s=string, %.2f=float (2 decimals), %b=bool
```

**Key Takeaway**: F# infers types from literals and operations. Explicit type annotations are rarely needed for local bindings.

**Why It Matters**: Type inference reduces code verbosity compared to Java or C# while maintaining compile-time safety, enabling developers to write concise yet statically-typed code. OCaml and Haskell pioneered this approach; F# brings it to .NET with full tooling support including IntelliSense, refactoring, and error highlighting. Teams switching from Java report 30-40% less type annotation boilerplate, allowing focus on domain logic rather than type declarations.

## Example 4: Basic Types

F# provides standard primitive types compatible with .NET's Common Type System.

```fsharp
// Example 4: Basic Types
let intValue: int = 42   // => int (32-bit signed integer)
                         // => Explicit type annotation with : type

let longValue = 42L      // => long (64-bit, suffix L)
                         // => Type inferred from suffix

let floatValue = 3.14    // => float (64-bit IEEE 754)
                         // => Default for decimal literals

let doubleValue = 3.14   // => Same as float (F# float IS .NET double)
                         // => No separate double type in F#

let charValue = 'A'      // => char (16-bit Unicode character)
                         // => Single quotes for characters

let stringValue = "text" // => string (immutable UTF-16 sequence)
                         // => Double quotes for strings

let byteValue = 255uy    // => byte (unsigned 8-bit, suffix uy)
                         // => Range: 0-255

printfn "%d %d %.2f %c %s %d" intValue longValue floatValue charValue stringValue byteValue
                         // => Outputs: 42 42 3.14 A text 255
```

**Key Takeaway**: F# types map directly to .NET types. Use suffixes (L, uy) for specific numeric types. `float` in F# equals `double` in C#.

**Why It Matters**: Full .NET type compatibility enables seamless interop with C# libraries and APIs while maintaining F#'s functional programming benefits. Teams can adopt F# incrementally within existing .NET codebases: add an F# project to a C# solution, call existing libraries directly, and gradually migrate domain logic. This reduces adoption risk compared to full rewrites, making F# practical for enterprise teams with existing .NET investments.

## Example 5: Functions

Functions are first-class values in F# - they can be assigned to variables, passed as arguments, and returned from other functions.

```fsharp
// Example 5: Functions
let add x y = x + y      // => Function definition with two parameters
                         // => Type inferred: int -> int -> int (curried)
                         // => Parameters x and y are ints (from + operator)

let result = add 3 5     // => Function application (no parentheses)
                         // => result is 8

printfn "%d" result      // => Outputs: 8

let greet name =         // => Function with one parameter
    sprintf "Hello, %s!" name
                         // => sprintf returns formatted string (no printing)
                         // => Type: string -> string

let message = greet "Bob"
                         // => message is "Hello, Bob!" (type: string)

printfn "%s" message     // => Outputs: Hello, Bob!
```

**Key Takeaway**: Functions are defined with `let name params = body`. No `return` keyword - last expression is the return value.

**Why It Matters**: First-class functions enable functional programming patterns like map, filter, and reduce used in data processing pipelines. F# functions compose cleanly without side effects, making code easier to test in isolation: a pure function with the same inputs always produces the same outputs, eliminating environmental dependencies that complicate unit tests. This property is fundamental to reliable, predictable software systems.

## Example 6: Function Composition

The `>>` operator composes functions left-to-right, creating pipelines that transform data through multiple stages.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Input: 5]:::blue --> B[double<br/>x * 2]:::orange
    B --> C[Result: 10]:::teal
    C --> D[addTen<br/>x + 10]:::orange
    D --> E[Final: 20]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 6: Function Composition
let double x = x * 2     // => Doubles input (int -> int)
                         // => double 5 returns 10

let addTen x = x + 10    // => Adds 10 to input (int -> int)
                         // => addTen 10 returns 20

let doubleThenAddTen = double >> addTen
                         // => Composition operator >> (left-to-right)
                         // => Creates NEW function: int -> int
                         // => Equivalent to: fun x -> addTen (double x)

let result = doubleThenAddTen 5
                         // => Applies: double 5 = 10, then addTen 10 = 20
                         // => result is 20

printfn "%d" result      // => Outputs: 20
```

**Key Takeaway**: Use `>>` to compose functions left-to-right. Composition creates new functions without intermediate variables.

**Why It Matters**: Function composition enables point-free style and data transformation pipelines where intermediate steps are named without requiring intermediate variables. F# compilers optimize composed functions into efficient native code without allocation overhead, making functional pipelines as fast as imperative loops. In data-intensive applications, composed transformations run at the same speed as hand-written loops while remaining far easier to modify and test independently.

## Example 7: Piping with |>

The pipe operator `|>` feeds values through function chains, making data transformations read naturally from top to bottom.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[5]:::blue --> B[|> double]:::orange
    B --> C[10]:::teal
    C --> D[|> addTen]:::orange
    D --> E[20]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 7: Piping with |>
let double x = x * 2     // => Same double function from Example 6

let addTen x = x + 10    // => Same addTen function

let result = 5           // => Start with value 5
             |> double   // => Pipe to double: 5 |> double = double 5 = 10
             |> addTen   // => Pipe to addTen: 10 |> addTen = addTen 10 = 20
                         // => Final result is 20

printfn "%d" result      // => Outputs: 20
                         // => Same as doubleThenAddTen 5
```

**Key Takeaway**: `|>` passes the left value as the last parameter to the right function. Pipelines read top-to-bottom like Unix pipes.

**Why It Matters**: Piping eliminates nested function calls and intermediate variables, making data transformations more readable and easier to debug by tracing values through each stage. Pipelines like `data |> filter |> map |> aggregate` clearly show transformation steps compared to nested imperative loops. In production, developers can add `|> tap (printfn "%A")` stages for debugging without restructuring code, then remove them before deployment.

## Example 8: Pattern Matching Basics

Pattern matching is F#'s primary control flow mechanism, replacing if/else chains with declarative case handling.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[match number]:::blue --> B{Pattern?}:::orange
    B -->|1| C[One]:::teal
    B -->|2| D[Two]:::teal
    B -->|_| E[Other]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 8: Pattern Matching Basics
let describe number =    // => Function taking int parameter
    match number with    // => match expression (F#'s primary conditional)
    | 1 -> "One"         // => Pattern: literal 1, result: "One"
                         // => -> separates pattern from result
    | 2 -> "Two"         // => Pattern: literal 2, result: "Two"
    | _ -> "Other"       // => _ is wildcard pattern (matches anything)
                         // => Must be EXHAUSTIVE (covers all cases)
                         // => Type: int -> string

let result1 = describe 1 // => Matches first pattern, result1 is "One"
let result2 = describe 2 // => Matches second pattern, result2 is "Two"
let result3 = describe 99// => Matches wildcard, result3 is "Other"

printfn "%s %s %s" result1 result2 result3
                         // => Outputs: One Two Other
```

**Key Takeaway**: Use `match value with | pattern -> result` for branching. Patterns must be exhaustive - compiler enforces this.

**Why It Matters**: Exhaustive pattern matching catches unhandled cases at compile time, preventing runtime errors in production. The compiler forces developers to handle all possibilities explicitly - when new cases are added to a discriminated union, all match expressions must be updated or compilation fails. This prevents the common bug of adding a new enum value but forgetting to handle it in a switch statement, a frequent source of subtle runtime errors.

## Example 9: Lists

F# lists are immutable, singly-linked sequences. They're the primary collection type for functional programming.

```fsharp
// Example 9: Lists
let numbers = [1; 2; 3; 4; 5]
                         // => List literal syntax: [element; element; ...]
                         // => Type: int list (immutable)
                         // => Semicolons separate elements

let empty = []           // => Empty list
                         // => Type: 'a list (generic placeholder)

let cons = 0 :: numbers  // => :: is cons operator (prepend)
                         // => Creates NEW list: [0; 1; 2; 3; 4; 5]
                         // => Original numbers is unchanged

let head = List.head numbers
                         // => Gets first element: 1
                         // => Throws exception if list is empty

let tail = List.tail numbers
                         // => Gets all elements except first: [2; 3; 4; 5]
                         // => Returns list (not element)

printfn "%A" numbers     // => Outputs: [1; 2; 3; 4; 5]
                         // => %A is generic format specifier
printfn "%A" cons        // => Outputs: [0; 1; 2; 3; 4; 5]
printfn "%d" head        // => Outputs: 1
printfn "%A" tail        // => Outputs: [2; 3; 4; 5]
```

**Key Takeaway**: Lists are immutable sequences. Use `::` to prepend, `List.head` for first element, `List.tail` for rest.

**Why It Matters**: Immutable lists enable safe concurrent processing and structural sharing, where `tail` operations share memory with the original list without copying. F# shares unchanged list portions across operations, using significantly less memory than copying entire arrays in imperative languages while maintaining O(1) prepend performance. Event sourcing systems store event histories as immutable lists, benefiting from structural sharing when processing millions of events.

## Example 10: Recursion

Recursion is the primary iteration mechanism in functional programming, replacing loops with function calls.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[sum #91;1;2;3#93;]:::blue --> B{List empty?}:::orange
    B -->|Yes| C[Return 0]:::teal
    B -->|No| D[head + sum tail]:::purple
    D --> E[1 + sum #91;2;3#93;]:::brown
    E --> F[1 + 2 + sum #91;3#93;]:::brown
    F --> G[1 + 2 + 3 + 0 = 6]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
    style F fill:#CA9161,stroke:#000,color:#fff
    style G fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 10: Recursion
let rec sum list =       // => rec keyword enables recursion
                         // => Function can call itself
    match list with      // => Pattern match on list structure
    | [] -> 0            // => Base case: empty list returns 0
                         // => Terminates recursion
    | head :: tail ->    // => Recursive case: decompose into head and tail
        head + sum tail  // => Add head to sum of remaining elements
                         // => Recursive call with smaller list

let result = sum [1; 2; 3; 4; 5]
                         // => sum [1;2;3;4;5]
                         // => = 1 + sum [2;3;4;5]
                         // => = 1 + 2 + sum [3;4;5]
                         // => = 1 + 2 + 3 + sum [4;5]
                         // => = 1 + 2 + 3 + 4 + sum [5]
                         // => = 1 + 2 + 3 + 4 + 5 + sum []
                         // => = 1 + 2 + 3 + 4 + 5 + 0 = 15

printfn "%d" result      // => Outputs: 15
```

**Key Takeaway**: Use `rec` keyword for recursive functions. Pattern match on data structure, handle base case first.

**Why It Matters**: F# optimizes tail recursion into loops, making recursive code as efficient as imperative loops without stack overflow risk. The compiler transforms tail-recursive functions into while loops internally, enabling processing of million-element lists with constant stack space. This is critical for functional-style processing of large datasets where recursive algorithms are natural but stack depth would cause exceptions in non-optimized implementations.

## Example 11: List.map - Transforming Collections

`List.map` applies a function to every element, returning a new list. It's the functional equivalent of a for-each loop with transformation.

```fsharp
// Example 11: List.map - Transforming Collections
let numbers = [1; 2; 3; 4; 5]
                         // => Input list: [1; 2; 3; 4; 5]

let doubled = List.map (fun x -> x * 2) numbers
                         // => fun x -> x * 2 is anonymous function (lambda)
                         // => List.map applies function to each element
                         // => Creates NEW list: [2; 4; 6; 8; 10]
                         // => Original numbers unchanged

let squares = numbers |> List.map (fun x -> x * x)
                         // => Piping version (same as above)
                         // => squares is [1; 4; 9; 16; 25]

printfn "%A" doubled    // => Outputs: [2; 4; 6; 8; 10]
printfn "%A" squares    // => Outputs: [1; 4; 9; 16; 25]
```

**Key Takeaway**: `List.map` transforms each element independently. Use lambda `fun x -> expression` for inline functions.

**Why It Matters**: Mapping operations are automatically parallelizable and compose cleanly with other collection operations. F# can convert collection operations to parallel execution when beneficial, processing large datasets faster on multi-core systems. In ETL pipelines, `List.map` transformations on record batches are trivially parallelizable using `Array.Parallel.map`, achieving near-linear speedup on multi-core servers without restructuring the transformation logic.

## Example 12: List.filter - Selecting Elements

`List.filter` selects elements matching a predicate, returning a new list with only matching items.

```fsharp
// Example 12: List.filter - Selecting Elements
let numbers = [1; 2; 3; 4; 5; 6; 7; 8; 9; 10]
                         // => Input list: 1 through 10

let evens = List.filter (fun x -> x % 2 = 0) numbers
                         // => Predicate: x % 2 = 0 (even numbers)
                         // => List.filter keeps elements where predicate is true
                         // => evens is [2; 4; 6; 8; 10]

let greaterThanFive = numbers |> List.filter (fun x -> x > 5)
                         // => Piping version
                         // => Predicate: x > 5
                         // => greaterThanFive is [6; 7; 8; 9; 10]

printfn "%A" evens      // => Outputs: [2; 4; 6; 8; 10]
printfn "%A" greaterThanFive
                         // => Outputs: [6; 7; 8; 9; 10]
```

**Key Takeaway**: `List.filter` selects elements where predicate returns true. Predicates are functions returning bool.

**Why It Matters**: Filter operations compose cleanly with map and fold to create efficient data processing pipelines. E-commerce systems filter product catalogs by availability, apply price calculations, then map to display models - processing millions of SKUs as a single pipeline expression. The composability eliminates intermediate collection allocations when using `Seq.filter` instead of `List.filter`, reducing memory pressure for large datasets.

## Example 13: List.fold - Aggregating Values

`List.fold` reduces a list to a single value by repeatedly applying a function with an accumulator.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Initial: 0]:::blue --> B[Fold step 1<br/>0 + 1 = 1]:::orange
    B --> C[Fold step 2<br/>1 + 2 = 3]:::orange
    C --> D[Fold step 3<br/>3 + 3 = 6]:::orange
    D --> E[Result: 6]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 13: List.fold - Aggregating Values
let numbers = [1; 2; 3; 4; 5]
                         // => Input list

let sum = List.fold (fun acc x -> acc + x) 0 numbers
                         // => List.fold takes: function, initial value, list
                         // => fun acc x -> acc + x is accumulator function
                         // => acc is accumulator (running total)
                         // => x is current element
                         // => Initial value: 0
                         // => Process: 0 + 1 = 1, 1 + 2 = 3, 3 + 3 = 6, etc.
                         // => sum is 15

let product = numbers |> List.fold (fun acc x -> acc * x) 1
                         // => Initial value: 1 (multiplicative identity)
                         // => Process: 1 * 1 = 1, 1 * 2 = 2, 2 * 3 = 6, etc.
                         // => product is 120

printfn "%d" sum        // => Outputs: 15
printfn "%d" product    // => Outputs: 120
```

**Key Takeaway**: `List.fold` accumulates values left-to-right. Start with appropriate initial value (0 for sum, 1 for product).

**Why It Matters**: Fold is the most general list operation - map and filter can be implemented using fold, making it the fundamental building block of collection processing. Financial applications use fold to calculate running totals, averages, weighted sums, and complex aggregations over transaction streams without mutable state. The accumulator pattern makes each processing step explicit, simplifying audit trails and debugging of financial calculations.

## Example 14: Tuples

Tuples group multiple values of different types into a single composite value without defining a named type.

```fsharp
// Example 14: Tuples
let pair = (1, "one")    // => Tuple with 2 elements: int * string
                         // => Type: int * string (read as "int times string")
                         // => Immutable

let triple = (1, "one", true)
                         // => Tuple with 3 elements: int * string * bool
                         // => Type: int * string * bool

let x, y = pair          // => Tuple deconstruction (pattern matching)
                         // => x is 1 (int)
                         // => y is "one" (string)

let first = fst pair     // => fst gets first element of 2-tuple
                         // => first is 1

let second = snd pair    // => snd gets second element of 2-tuple
                         // => second is "one"
                         // => fst/snd only work with 2-tuples

printfn "%A" pair        // => Outputs: (1, "one")
printfn "%d %s" x y      // => Outputs: 1 one
printfn "%d %s" first second
                         // => Outputs: 1 one
```

**Key Takeaway**: Tuples use `(value1, value2, ...)` syntax. Deconstruct with `let x, y = tuple` or use `fst`/`snd` for pairs.

**Why It Matters**: Tuples provide lightweight data grouping without the ceremony of defining named classes or records. Functions commonly return tuples for multiple values: `tryParse` returns `(bool * int)` indicating success and parsed value, avoiding exceptions for parsing failures. Pattern matching deconstructs tuple results naturally. Coordinate systems, key-value pairs, and function results with metadata all benefit from tuple representation for concise, readable code.

## Example 15: Records

Records are immutable named data structures with labeled fields. They're F#'s primary data modeling tool.

```fsharp
// Example 15: Records
type Person = {          // => Record type definition
    Name: string         // => Field Name of type string
    Age: int             // => Field Age of type int
}                        // => Records are immutable by default

let alice = {            // => Record construction
    Name = "Alice"       // => Field initialization with =
    Age = 30             // => All fields must be initialized
}                        // => Type: Person

let bob = { alice with Name = "Bob" }
                         // => Copy-and-update syntax
                         // => Creates NEW record copying alice
                         // => Updates Name field to "Bob"
                         // => Age remains 30 (from alice)
                         // => Original alice unchanged

printfn "%s is %d" alice.Name alice.Age
                         // => Dot notation for field access
                         // => Outputs: Alice is 30
printfn "%s is %d" bob.Name bob.Age
                         // => Outputs: Bob is 30
```

**Key Takeaway**: Records provide named fields with structural equality. Use `{ record with Field = value }` to create modified copies.

**Why It Matters**: Records are immutable value types that prevent accidental sharing bugs in concurrent code. They generate automatic structural equality, comparison, and ToString implementations, reducing boilerplate compared to C# classes requiring manual overrides. Domain models as records - `type Order = { Id: OrderId; Total: decimal; Status: OrderStatus }` - make business entities self-documenting while ensuring thread safety through immutability. Record copy-and-update enables clean state transitions in event-driven architectures.

## Example 16: Discriminated Unions

Discriminated unions (DUs) define types that can be one of several named cases, each potentially carrying different data.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    A[Shape type]:::blue --> B[Circle of float]:::orange
    A --> C[Rectangle of float * float]:::teal
    A --> D[Triangle of float * float * float]:::purple

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 16: Discriminated Unions
type Shape =             // => Discriminated union definition
    | Circle of radius: float
                         // => Case: Circle carrying float value
                         // => Named field: radius
    | Rectangle of width: float * height: float
                         // => Case: Rectangle carrying tuple of floats
    | Triangle of a: float * b: float * c: float
                         // => Case: Triangle carrying 3 floats

let circle = Circle(radius = 5.0)
                         // => Construct Circle case
                         // => Type: Shape

let rect = Rectangle(width = 4.0, height = 3.0)
                         // => Construct Rectangle case

let describeShape shape =// => Function matching on union cases
    match shape with
    | Circle(r) -> sprintf "Circle with radius %.1f" r
                         // => Extract radius as r
    | Rectangle(w, h) -> sprintf "Rectangle %.1fx%.1f" w h
                         // => Extract width and height
    | Triangle(a, b, c) -> sprintf "Triangle sides %.1f, %.1f, %.1f" a b c

printfn "%s" (describeShape circle)
                         // => Outputs: Circle with radius 5.0
printfn "%s" (describeShape rect)
                         // => Outputs: Rectangle 4.0x3.0
```

**Key Takeaway**: Discriminated unions model mutually exclusive choices. Pattern matching extracts case-specific data safely.

**Why It Matters**: Discriminated unions eliminate null reference errors and impossible state combinations by making valid states the only representable states. Financial systems model trades as `type Trade = Buy of Amount | Sell of Amount`, making it impossible to represent invalid states. The compiler enforces exhaustive handling when processing each case, preventing missed edge cases. Scott Wlaschin's "making illegal states unrepresentable" principle is best embodied through discriminated unions.

## Example 17: Option Type - Null Safety

The `Option` type represents values that may or may not exist, replacing null with a type-safe alternative.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05
graph TD
    A[Option type]:::blue --> B[Some of value]:::orange
    A --> C[None]:::orange

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 17: Option Type - Null Safety
let someValue = Some 42  // => Option with value: Some 42
                         // => Type: int option

let noValue = None       // => Option with no value: None
                         // => Type: 'a option (generic)

let printOption opt =    // => Function handling option
    match opt with       // => Pattern match on option cases
    | Some value ->      // => Some case: extract value
        printfn "Value: %d" value
    | None ->            // => None case: no value present
        printfn "No value"

printOption someValue    // => Outputs: Value: 42
printOption noValue      // => Outputs: No value

let doubled = Option.map (fun x -> x * 2) someValue
                         // => Option.map applies function if Some
                         // => doubled is Some 84
let doubledNone = Option.map (fun x -> x * 2) noValue
                         // => doubledNone is None (map short-circuits)

printfn "%A" doubled     // => Outputs: Some 84
printfn "%A" doubledNone // => Outputs: None
```

**Key Takeaway**: Use `Option` instead of null. Pattern match on `Some`/`None` to handle both cases explicitly.

**Why It Matters**: Option types eliminate null reference exceptions through compile-time safety, addressing what Tony Hoare called his "billion-dollar mistake." F#'s option type forces developers to handle missing values explicitly via pattern matching - there is no way to accidentally use a None value without the compiler objecting. In production F# codebases that avoid nullable types, entire categories of null pointer exceptions simply do not occur, dramatically reducing error rates.

## Example 18: Unit Type

The `unit` type represents "no meaningful value" - similar to `void` in C# but is an actual value.

```fsharp
// Example 18: Unit Type
let printMessage msg =   // => Function taking string, returning unit
    printfn "%s" msg     // => printfn returns unit (no meaningful result)
                         // => Type: string -> unit

let result = printMessage "Hello"
                         // => result is () (unit value)
                         // => Outputs: Hello
                         // => Type: unit

let unitValue = ()       // => Explicit unit value
                         // => () is both the type name and value

printfn "%A" result      // => Outputs: ()
                         // => %A formats unit as ()
```

**Key Takeaway**: `unit` represents functions executed for side effects. `()` is the single value of type `unit`.

**Why It Matters**: Unit makes side effects explicit in type signatures, creating a clear separation between pure computational functions and effectful operations. Functions returning `unit` signal they're executed for effects (printing, I/O, mutations), not computation. This distinction improves code comprehension and testability: pure functions returning values are trivially testable, while `unit`-returning functions require more careful testing of side effects. The type system documents intent without comments.

## Example 19: String Manipulation

F# provides extensive string operations with immutability guarantees.

```fsharp
// Example 19: String Manipulation
let text = "Hello, World!"
                         // => Immutable string

let upper = text.ToUpper()
                         // => Creates NEW string in uppercase
                         // => upper is "HELLO, WORLD!"
                         // => Original text unchanged

let lower = text.ToLower()
                         // => lower is "hello, world!"

let substring = text.Substring(0, 5)
                         // => Extract substring from index 0, length 5
                         // => substring is "Hello"

let replaced = text.Replace("World", "F#")
                         // => Replace substring
                         // => replaced is "Hello, F#!"

let parts = text.Split(',')
                         // => Split by delimiter
                         // => parts is ["Hello"; " World!"] (string array)

let concatenated = "Hello" + " " + "F#"
                         // => String concatenation with +
                         // => concatenated is "Hello F#"

printfn "%s" upper       // => Outputs: HELLO, WORLD!
printfn "%s" substring   // => Outputs: Hello
printfn "%A" parts       // => Outputs: [|"Hello"; " World!"|]
```

**Key Takeaway**: String methods create new strings (immutable). Use `+` for concatenation, `.Split()` for parsing.

**Why It Matters**: Immutable strings prevent bugs from unexpected mutations and enable safe sharing across threads without defensive copying. The .NET string intern pool optimizes memory usage for repeated string values, making F# string operations as efficient as mutable alternatives. In web APIs processing thousands of concurrent requests, immutable string headers and paths can be safely shared across thread boundaries without synchronization overhead.

## Example 20: Arrays

Arrays are mutable, fixed-size collections optimized for index-based access. Unlike lists, they allow in-place updates.

```fsharp
// Example 20: Arrays
let numbers = [|1; 2; 3; 4; 5|]
                         // => Array literal: [| elements |]
                         // => Type: int[] (mutable)
                         // => Fixed size after creation

let first = numbers.[0]  // => Index access with .[index]
                         // => first is 1
                         // => Zero-based indexing

numbers.[0] <- 10        // => MUTATION: Update element at index 0
                         // => <- is assignment operator
                         // => numbers is now [|10; 2; 3; 4; 5|]

let doubled = Array.map (fun x -> x * 2) numbers
                         // => Array.map (like List.map)
                         // => Creates NEW array: [|20; 4; 6; 8; 10|]

let evens = Array.filter (fun x -> x % 2 = 0) numbers
                         // => Array.filter (like List.filter)
                         // => evens is [|10; 2; 4|]

printfn "%A" numbers     // => Outputs: [|10; 2; 3; 4; 5|]
printfn "%A" doubled     // => Outputs: [|20; 4; 6; 8; 10|]
```

**Key Takeaway**: Arrays use `[| ... |]` syntax. Access with `.[index]`, mutate with `.[index] <- value`.

**Why It Matters**: Arrays provide O(1) random access critical for algorithms like binary search, numerical computing, and image processing. While mutable (unlike most F# types), arrays interoperate seamlessly with .NET libraries and enable zero-copy interop with unmanaged code through `Span<T>` and `Memory<T>`. Scientific computing libraries like MathNet.Numerics use arrays internally for matrix operations, making F# viable for high-performance numerical computing without performance penalties.

## Example 21: Sequences (Lazy Evaluation)

Sequences (`seq`) are lazily evaluated collections that compute elements on demand, enabling efficient processing of large or infinite data.

```fsharp
// Example 21: Sequences (Lazy Evaluation)
let numbers = seq { 1 .. 10 }
                         // => Sequence expression: seq { start .. end }
                         // => Type: seq<int> (IEnumerable<int>)
                         // => Elements NOT computed yet (lazy)

let evens = numbers
            |> Seq.filter (fun x -> x % 2 = 0)
                         // => Lazy filter: predicate NOT applied yet
            |> Seq.map (fun x -> x * 2)
                         // => Lazy map: function NOT applied yet
                         // => Pipeline builds computation plan

let result = Seq.toList evens
                         // => Forces evaluation: now computes elements
                         // => result is [4; 8; 12; 16; 20]

let infinite = Seq.initInfinite (fun i -> i * i)
                         // => INFINITE sequence: 0, 1, 4, 9, 16, ...
                         // => Lazy evaluation prevents memory overflow

let firstTen = infinite |> Seq.take 10 |> Seq.toList
                         // => Take first 10 elements from infinite sequence
                         // => firstTen is [0; 1; 4; 9; 16; 25; 36; 49; 64; 81]

printfn "%A" result      // => Outputs: [4; 8; 12; 16; 20]
printfn "%A" firstTen    // => Outputs: [0; 1; 4; 9; 16; 25; 36; 49; 64; 81]
```

**Key Takeaway**: Sequences evaluate lazily - operations build a computation plan executed when results are consumed.

**Why It Matters**: Lazy evaluation enables processing infinite sequences and large datasets without loading all data into memory simultaneously. Streaming log processors use `Seq` to analyze gigabyte files consuming only kilobytes of RAM, as only the current pipeline stage is evaluated at any time. Real-time data processing pipelines benefit from lazy evaluation to handle unbounded streams of sensor data, financial ticks, or event logs without memory constraints.

## Example 22: Mutable Values (Rare Cases)

F# supports mutable bindings with the `mutable` keyword for performance-critical scenarios, though immutability is preferred.

```fsharp
// Example 22: Mutable Values (Rare Cases)
let mutable counter = 0  // => mutable keyword allows reassignment
                         // => counter is 0 (type: int)

counter <- counter + 1   // => Reassignment with <-
                         // => counter is now 1

counter <- counter + 1   // => counter is now 2

printfn "%d" counter     // => Outputs: 2

// Prefer immutable approach:
let increment x = x + 1  // => Pure function (no mutation)
let c0 = 0               // => Immutable binding
let c1 = increment c0    // => c1 is 1
let c2 = increment c1    // => c2 is 2

printfn "%d" c2          // => Outputs: 2
                         // => Same result, immutable approach preferred
```

**Key Takeaway**: Use `mutable` sparingly. Prefer immutable values and functions for most code. Mutate only when performance requires it.

**Why It Matters**: Mutable values enable optimization in performance-critical code paths like tight numerical loops and game physics where immutable allocation overhead is measurable. F# developers use mutable state sparingly, isolating it to identified performance hotspots through profiling, while keeping business logic purely functional for testability and correctness. This pragmatic approach achieves both functional correctness and C-like performance where needed.

## Example 23: For Loops

F# supports imperative for loops for side effects, though functional operations (map, filter, fold) are preferred.

```fsharp
// Example 23: For Loops
let mutable sum = 0      // => Mutable accumulator

for i in 1 .. 5 do       // => for loop: i in range 1 to 5 (inclusive)
    sum <- sum + i       // => Mutation in loop body
                         // => Loop iterations: i=1 (sum=1), i=2 (sum=3), etc.

printfn "Sum: %d" sum    // => Outputs: Sum: 15

// Functional equivalent (preferred):
let functionalSum = [1..5] |> List.sum
                         // => No mutation, List.sum aggregates
                         // => functionalSum is 15

printfn "Functional sum: %d" functionalSum
                         // => Outputs: Functional sum: 15

// For loop with step:
for i in 0 .. 2 .. 10 do // => Step 2: 0, 2, 4, 6, 8, 10
    printfn "%d" i       // => Outputs: 0 2 4 6 8 10 (on separate lines)
```

**Key Takeaway**: Use `for i in start .. end` for imperative loops. Prefer functional operations for transformations.

**Why It Matters**: For loops with side effects are the right tool for inherently sequential I/O operations like writing database records, sending emails, or printing progress output. Using functional abstractions for pure side-effect sequences adds complexity without benefit. In practice, F# code uses for loops for I/O coordination and functional operations for data transformation, choosing the right abstraction for each context rather than dogmatically avoiding all loops.

## Example 24: While Loops

While loops enable imperative iteration based on conditions, useful for stateful scenarios.

```fsharp
// Example 24: While Loops
let mutable i = 0        // => Mutable loop counter
let mutable sum = 0      // => Mutable accumulator

while i < 5 do           // => while loop: continue while condition true
    sum <- sum + i       // => Accumulate current i
    i <- i + 1           // => Increment counter
                         // => Iterations: i=0 (sum=0), i=1 (sum=1), i=2 (sum=3), etc.

printfn "Sum: %d" sum    // => Outputs: Sum: 10

// Functional equivalent with recursion (preferred):
let rec sumTo n acc =    // => Tail-recursive function
    if n < 0 then acc    // => Base case
    else sumTo (n - 1) (acc + n)
                         // => Recursive case (tail call)

let recursiveSum = sumTo 4 0
                         // => recursiveSum is 10
                         // => Same result, no mutation

printfn "Recursive sum: %d" recursiveSum
                         // => Outputs: Recursive sum: 10
```

**Key Takeaway**: While loops require mutable state. Prefer tail recursion for functional iteration without mutation.

**Why It Matters**: While loops are appropriate for I/O loops like reading until EOF, polling external resources, or interfacing with event-driven imperative APIs that require stateful iteration. F# compilers optimize tail recursion to equivalent while loops, so recursive solutions perform identically without mutable state. The choice between while loops and tail recursion is often stylistic - both compile to the same IL code while recursion avoids mutable variables.

## Example 25: If Expressions

F# `if` is an expression that returns a value, unlike statements in imperative languages.

```fsharp
// Example 25: If Expressions
let x = 10

let description =        // => if expression returns a value
    if x > 0 then        // => Condition: x > 0
        "positive"       // => true branch: returns "positive"
    elif x < 0 then      // => elif for additional conditions
        "negative"       // => returns "negative"
    else                 // => else is REQUIRED (must handle all cases)
        "zero"           // => false branch: returns "zero"
                         // => Type: string
                         // => description is "positive"

printfn "%s" description // => Outputs: positive

// Inline usage:
let abs = if x >= 0 then x else -x
                         // => One-line if expression
                         // => abs is 10

printfn "%d" abs         // => Outputs: 10
```

**Key Takeaway**: `if` is an expression returning values. Both branches must return the same type. `else` is required.

**Why It Matters**: Expression-based control flow eliminates uninitialized variables and ensures all code paths return values, preventing a common source of bugs in imperative languages. F# compilers verify branch type consistency at compile time, catching mismatches like returning `int` from one branch and `string` from another. This makes refactoring safer: adding a new condition branch requires returning the same type, immediately flagging inconsistencies.

## Example 26: Match Expressions (Advanced)

Match expressions handle complex patterns including guards, when clauses, and nested structures.

```fsharp
// Example 26: Match Expressions (Advanced)
let describe x =         // => Function pattern matching on value
    match x with         // => Match expression evaluates patterns in order
    | 0 -> "zero"        // => Literal pattern: matches exactly 0
    | 1 | 2 | 3 ->       // => OR pattern: matches 1, 2, or 3
        "small"          // => All three cases return "small"
    | n when n > 0 ->    // => Guard clause: when condition must be true
        "positive"       // => n is bound to the matched value (e.g., 100)
    | n when n < 0 ->    // => Another guard: captures negative values
        "negative"       // => n is bound to negative value (e.g., -5)
    | _ -> "other"       // => Wildcard (unreachable in this example)
                         // => Compiler warns if this case is unreachable

printfn "%s" (describe 0)    // => Outputs: zero
printfn "%s" (describe 2)    // => Outputs: small
printfn "%s" (describe 100)  // => Outputs: positive
printfn "%s" (describe -5)   // => Outputs: negative
```

**Key Takeaway**: Use `when` clauses for conditional patterns. OR patterns (`|`) match multiple cases with the same handler.

**Why It Matters**: Pattern matching with guards replaces complex nested if/else chains with declarative case handling that reads like specification. Parsers and compilers use pattern matching extensively to handle syntax variations - the structure of match expressions mirrors the grammar being parsed. Studies show pattern matching reduces bug density compared to equivalent switch statements because exhaustiveness checking prevents missed cases and guards make conditions explicit.

## Example 27: Type Annotations

While F# infers types, explicit annotations improve readability and constrain function signatures.

```fsharp
// Example 27: Type Annotations
let add (x: int) (y: int) : int =
                         // => Explicit parameter types: int
                         // => Explicit return type: int
    x + y                // => Function body

let result = add 3 5     // => result is 8

let greet (name: string) : string =
                         // => string parameter, string return
    sprintf "Hello, %s!" name

let message = greet "Alice"
                         // => message is "Hello, Alice!"

// Generic type annotation:
let identity<'T> (x: 'T) : 'T =
                         // => Generic type parameter 'T
                         // => Takes 'T, returns 'T
    x                    // => Returns input unchanged

let num = identity 42    // => Type inference: 'T = int
let str = identity "hi"  // => Type inference: 'T = string

printfn "%d" result      // => Outputs: 8
printfn "%s" message     // => Outputs: Hello, Alice!
printfn "%d %s" num str  // => Outputs: 42 hi
```

**Key Takeaway**: Annotate parameters with `(param: type)`, return types with `: type` after parameters. Use `'T` for generic type parameters.

**Why It Matters**: Explicit type annotations at module boundaries document intent, serve as inline API documentation, and prevent unintended generalization that could break callers. Public library functions benefit from annotations for IntelliSense help text and type-checking at call sites. Internal implementation functions rely on inference for conciseness. This hybrid approach balances documentation with brevity, following established F# library design guidelines.

## Example 28: Lambda Expressions (fun)

Lambda expressions (`fun`) create anonymous functions inline, commonly used with higher-order functions.

```fsharp
// Example 28: Lambda Expressions (fun)
let double = fun x -> x * 2
                         // => Lambda: fun param -> body
                         // => Type: int -> int (inferred)
                         // => Equivalent to: let double x = x * 2

let result = double 5    // => result is 10

// Multi-parameter lambda:
let add = fun x y -> x + y
                         // => Multiple parameters: fun p1 p2 -> body
                         // => Type: int -> int -> int

let sum = add 3 5        // => sum is 8

// Lambdas in higher-order functions:
let doubled = [1; 2; 3] |> List.map (fun x -> x * 2)
                         // => Anonymous function passed to List.map
                         // => doubled is [2; 4; 6]

// Lambda with pattern matching:
let describeOpt = fun opt ->
    match opt with
    | Some v -> sprintf "Value: %d" v
    | None -> "No value"

printfn "%s" (describeOpt (Some 42))
                         // => Outputs: Value: 42

printfn "%d" result      // => Outputs: 10
printfn "%A" doubled     // => Outputs: [2; 4; 6]
```

**Key Takeaway**: Lambdas use `fun param -> body` syntax. They're expressions that create function values.

**Why It Matters**: Lambdas enable inline function definitions without the overhead of naming simple, single-use transformations. Data processing pipelines use lambdas extensively to express transformations concisely. However, complex lambdas exceeding 2-3 lines should be extracted to named functions for testability and readability. The guideline: use lambdas for obvious inline operations, named functions for reusable or complex logic.

## Example 29: Partial Application

F# functions are curried by default - multi-parameter functions can be partially applied to create specialized functions.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[add: int -> int -> int]:::blue --> B[addFive = add 5<br/>int -> int]:::orange
    B --> C[addFive 3<br/>Returns 8]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 29: Partial Application
let add x y = x + y      // => Function with 2 parameters
                         // => Type: int -> int -> int (curried)

let addFive = add 5      // => Partial application: fix x = 5
                         // => addFive has type: int -> int
                         // => Waiting for y parameter

let result = addFive 3   // => Apply remaining parameter y = 3
                         // => result is 8 (5 + 3)

// Partial application with List.map:
let multiply x y = x * y // => Type: int -> int -> int

let multiplyByTwo = multiply 2
                         // => Fix first parameter: x = 2
                         // => Type: int -> int

let doubled = [1; 2; 3; 4; 5] |> List.map multiplyByTwo
                         // => Pass partially applied function
                         // => doubled is [2; 4; 6; 8; 10]

printfn "%d" result      // => Outputs: 8
printfn "%A" doubled     // => Outputs: [2; 4; 6; 8; 10]
```

**Key Takeaway**: Applying fewer arguments than a function takes creates a new function waiting for remaining arguments.

**Why It Matters**: Partial application enables function specialization without boilerplate wrapper functions or closures. Configuration-driven functions like `validateWith rules input` can be partially applied to create `validateOrder = validateWith orderRules` and reused throughout a codebase. Pipeline stages are commonly partially applied: `List.map (formatWith locale)` reads clearly when `formatWith locale` is a partially applied formatter. This is the F# idiom for dependency injection without OOP ceremony.

## Example 30: Currying and Higher-Order Functions

Higher-order functions take functions as parameters or return functions, enabling powerful abstractions.

```fsharp
// Example 30: Currying and Higher-Order Functions
let apply f x = f x      // => Higher-order function: takes function f and value x
                         // => Applies f to x
                         // => Type: ('a -> 'b) -> 'a -> 'b (generic)

let double x = x * 2     // => Function to pass

let result = apply double 5
                         // => apply double 5 = double 5 = 10
                         // => result is 10

// Function returning function:
let makeAdder n =        // => Takes int, returns function
    fun x -> x + n       // => Returns lambda capturing n
                         // => Type: int -> (int -> int)

let addTen = makeAdder 10
                         // => addTen is function adding 10
                         // => Type: int -> int

let value = addTen 5     // => value is 15

// Composing higher-order functions:
let compose f g =        // => Function composition
    fun x -> f (g x)     // => Returns lambda applying g then f
                         // => Type: ('b -> 'c) -> ('a -> 'b) -> ('a -> 'c)

let addOne x = x + 1     // => int -> int
let multiplyByTwo x = x * 2
                         // => int -> int

let addOneThenDouble = compose multiplyByTwo addOne
                         // => Compose: double(addOne(x))
                         // => Type: int -> int

let composed = addOneThenDouble 5
                         // => addOne 5 = 6, multiplyByTwo 6 = 12
                         // => composed is 12

printfn "%d" result      // => Outputs: 10
printfn "%d" value       // => Outputs: 15
printfn "%d" composed    // => Outputs: 12
```

**Key Takeaway**: Higher-order functions abstract over behavior. Functions can capture values (closures) and return specialized functions.

**Why It Matters**: Higher-order functions enable generic algorithms, strategies, and design patterns without class hierarchies. Dependency injection in F# uses higher-order functions: `makeHandler (db: IDatabase) = fun request -> processRequest db request` creates configured handlers without mutable global state or IoC containers. This functional DI pattern is simpler than OOP-style constructor injection while achieving the same testability and composability goals.

---

## Next Steps

Continue to **Intermediate** (Examples 31-60) to learn:

- Advanced pattern matching and active patterns
- Object-oriented features (classes, interfaces)
- Async/await for asynchronous programming
- Computation expressions (monads)
- Type providers for data access
- Interop with C# and .NET libraries

These 30 beginner examples cover **0-40% of F#'s features**, establishing the functional-first foundation. The remaining 60% (intermediate and advanced) builds on these fundamentals with production patterns and advanced type system features.
