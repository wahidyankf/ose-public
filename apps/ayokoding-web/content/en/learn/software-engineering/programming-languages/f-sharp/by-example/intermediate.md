---
title: Intermediate
date: 2026-02-02T00:00:00+07:00
draft: false
weight: 10000002
description: "Examples 31-60: F# intermediate patterns covering async workflows, computation expressions, type providers, and production patterns (40-75% coverage)"
tags:
  ["f-sharp", "tutorial", "by-example", "intermediate", "functional-programming", "async", "computation-expressions"]
---

This intermediate tutorial covers F#'s production-ready patterns and advanced functional features through 30 heavily annotated examples. Topics include async workflows, computation expressions, type providers, active patterns, and object programming within F#'s functional-first paradigm.

## Example 31: Async Workflows - Basic Asynchrony

Async workflows enable non-blocking I/O and concurrency using F#'s async/let! syntax, similar to async/await in C#.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[async block]:::blue --> B[async.Sleep 1000]:::orange
    B --> C[let! waits<br/>non-blocking]:::teal
    C --> D[return value]:::orange

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 31: Async Workflows - Basic Asynchrony
let asyncOperation = async {
                         // => async { ... } creates async computation
                         // => Type: Async<string>
    printfn "Starting operation..."
                         // => Executes synchronously
    do! Async.Sleep 1000 // => do! awaits async computation (non-blocking)
                         // => Sleeps for 1000ms without blocking thread
    printfn "Operation completed"
                         // => Executes after sleep completes
    return "Result"      // => return produces async result
}                        // => Workflow is NOT executed yet (lazy)

let result = asyncOperation |> Async.RunSynchronously
                         // => Async.RunSynchronously executes workflow
                         // => BLOCKS current thread until completion
                         // => result is "Result" (type: string)
                         // => Outputs: Starting operation... (1s delay) Operation completed

printfn "%s" result      // => Outputs: Result
```

**Key Takeaway**: Async workflows use `async { ... }` with `let!`/`do!` for awaiting. `Async.RunSynchronously` executes the workflow.

**Why It Matters**: Async workflows enable efficient I/O operations without blocking threads, allowing a single thread pool to handle thousands of concurrent connections. In ASP.NET Core services, replacing synchronous database calls with `async { let! result = db.QueryAsync() ... }` dramatically increases throughput under load. Thread-per-request models hit OS thread limits around 1,000-2,000 concurrent requests; async workflows scale to tens of thousands on the same hardware.

## Example 32: Async Parallel Execution

`Async.Parallel` executes multiple async operations concurrently, improving throughput for independent tasks.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Start]:::blue --> B[Task 1: 500ms]:::orange
    A --> C[Task 2: 500ms]:::orange
    A --> D[Task 3: 500ms]:::orange
    B --> E[All complete<br/>~500ms total]:::teal
    C --> E
    D --> E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 32: Async Parallel Execution
let task1 = async {      // => First async task (type: Async<string>)
    do! Async.Sleep 500  // => Simulates 500ms I/O without blocking thread
    return "Task 1"      // => Returns result string
}

let task2 = async {      // => Second async task (independent of task1)
    do! Async.Sleep 500  // => Also 500ms I/O
    return "Task 2"      // => Returns "Task 2" after sleep
}

let task3 = async {      // => Third async task (independent)
    do! Async.Sleep 500  // => Also 500ms I/O
    return "Task 3"      // => Returns "Task 3" after sleep
}

let parallelExecution = async {
                         // => Outer async workflow combining tasks
    let! results = [task1; task2; task3]
                   |> Async.Parallel
                         // => Async.Parallel runs all tasks concurrently
                         // => Returns Async<string[]>
                         // => let! awaits all tasks to complete
                         // => Total time: ~500ms (NOT 1500ms sequential)
    return results       // => results is [|"Task 1"; "Task 2"; "Task 3"|]
}

let allResults = parallelExecution |> Async.RunSynchronously
                         // => Async.RunSynchronously blocks current thread
                         // => allResults is string array with 3 elements

printfn "%A" allResults  // => Outputs: [|"Task 1"; "Task 2"; "Task 3"|]
```

**Key Takeaway**: `Async.Parallel` executes async computations concurrently. Total time equals longest task, not sum of all tasks.

**Why It Matters**: Parallel async operations dramatically improve throughput for I/O-bound workloads where tasks don't depend on each other. Web scrapers fetch multiple pages concurrently using `Async.Parallel`, achieving near-linear speedup with task count. Microservices calling multiple downstream APIs in parallel reduce response latency from sum-of-calls to max-of-calls. Semaphore controls limit concurrency to respect rate limits while maintaining parallel execution where permitted.

## Example 33: Task Expressions (F# 6.0+)

Task expressions provide direct interop with .NET Task-based APIs using `task { ... }` computation expression.

```fsharp
// Example 33: Task Expressions (F# 6.0+)
open System.Threading.Tasks

let taskOperation = task {
                         // => task { ... } creates Task<'T>
                         // => Directly compatible with C# async/await
    printfn "Starting task..."
                         // => Executes synchronously
    do! Task.Delay(1000) // => do! awaits Task (not Async)
                         // => Task.Delay is .NET task-based delay
    printfn "Task completed"
    return 42            // => return produces Task<int>
}                        // => Type: Task<int>

let result = taskOperation.Result
                         // => .Result blocks until task completes
                         // => result is 42
                         // => Outputs: Starting task... (1s delay) Task completed

printfn "%d" result      // => Outputs: 42

// Task composition:
let composedTask = task {
    let! x = taskOperation
                         // => let! awaits Task<int>
                         // => x is 42
    let! y = task { return x * 2 }
                         // => Nested task expression
                         // => y is 84
    return x + y         // => Returns 126
}

let composedResult = composedTask.Result
                         // => composedResult is 126

printfn "%d" composedResult
                         // => Outputs: 126
```

**Key Takeaway**: Use `task { ... }` for .NET Task interop. It's faster than `async { ... }` for Task-based APIs.

**Why It Matters**: Task expressions eliminate the overhead of converting between F# `Async<'T>` and .NET `Task<'T>`, which requires allocation and scheduling costs at each boundary. ASP.NET Core, Entity Framework, and gRPC all use Task-based APIs natively. Migrating hot paths from `async` to `task` expressions can reduce allocation pressure in high-throughput scenarios. Most new F# projects targeting ASP.NET Core prefer `task` for direct framework compatibility.

## Example 34: Computation Expressions Basics - Maybe Builder

Computation expressions enable custom control flow syntax. The "maybe" builder handles Option types declaratively.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[maybe builder]:::blue --> B{let! Some v?}:::orange
    B -->|Some| C[Continue with v]:::teal
    B -->|None| D[Short-circuit: None]:::orange
    C --> E[return Some result]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 34: Computation Expressions Basics - Maybe Builder
type MaybeBuilder() =    // => Computation expression builder for Option
    member _.Bind(x, f) =// => Bind: handles let! syntax
                         // => x: option<'a>, f: 'a -> option<'b>
        match x with
        | Some v -> f v  // => Some: continue with unwrapped value
        | None -> None   // => None: short-circuit entire computation

    member _.Return(x) = // => Return: handles return syntax
        Some x           // => Wraps value in Some

let maybe = MaybeBuilder()
                         // => Create builder instance

let divide x y =         // => Safe division returning option
    if y = 0 then None   // => Division by zero: None
    else Some (x / y)    // => Valid division: Some result

let computation = maybe {
    let! a = divide 10 2 // => a is 5 (10/2, unwrapped from Some)
                         // => If divide returned None, entire computation returns None
    let! b = divide 20 4 // => b is 5 (20/4)
    let! c = divide 30 a // => c is 6 (30/5)
    return a + b + c     // => Returns Some 16 (5+5+6)
}                        // => computation is Some 16

printfn "%A" computation // => Outputs: Some 16

let failedComputation = maybe {
    let! a = divide 10 2 // => a is 5
    let! b = divide 20 0 // => divide returns None (div by zero)
                         // => Computation short-circuits here
    return a + b         // => Never reached
}                        // => failedComputation is None

printfn "%A" failedComputation
                         // => Outputs: None
```

**Key Takeaway**: Computation expressions provide custom control flow. `let!` unwraps values, `return` wraps results. Builders define semantics.

**Why It Matters**: Computation expressions eliminate nested match statements that grow exponentially with each additional optional step in a workflow. Railway-oriented programming uses builders to chain operations that may fail - each `let! value = optionalOp()` automatically short-circuits on failure. Real payment processing flows validate card, check balance, authorize, and debit in a single clean expression chain, with any failure returning an error without explicit branching at each step.

## Example 35: Sequence Expressions

Sequence expressions (`seq { ... }`) generate lazy sequences using yield syntax, similar to C# iterators.

```fsharp
// Example 35: Sequence Expressions
let numbers = seq {      // => seq { ... } creates lazy sequence
    yield 1              // => yield produces single element
                         // => Element NOT computed until consumed
    yield 2
    yield 3
}                        // => Type: seq<int> (IEnumerable<int>)

printfn "%A" (numbers |> Seq.toList)
                         // => Forces evaluation: [1; 2; 3]

// Range syntax:
let range = seq { 1 .. 10 }
                         // => Lazy range from 1 to 10
                         // => Equivalent to Seq.init

printfn "%A" (range |> Seq.take 5 |> Seq.toList)
                         // => Takes first 5: [1; 2; 3; 4; 5]

// yield! for sub-sequences:
let combined = seq {     // => Combining sequences
    yield 0              // => Single element: 0
    yield! [1; 2; 3]     // => yield! flattens sequence
                         // => Yields 1, then 2, then 3
    yield! seq { 4 .. 6 }// => Yields 4, 5, 6
    yield 7              // => Single element: 7
}                        // => combined is [0; 1; 2; 3; 4; 5; 6; 7] (lazy)

printfn "%A" (combined |> Seq.toList)
                         // => Outputs: [0; 1; 2; 3; 4; 5; 6; 7]

// Conditional yield:
let evens = seq {        // => Conditional element generation
    for i in 1 .. 10 do  // => Loop through range
        if i % 2 = 0 then // => Condition
            yield i      // => Yield only even numbers
}                        // => evens is [2; 4; 6; 8; 10] (lazy)

printfn "%A" (evens |> Seq.toList)
                         // => Outputs: [2; 4; 6; 8; 10]
```

**Key Takeaway**: Sequence expressions use `yield` for elements, `yield!` for sub-sequences. Evaluation is lazy until consumption.

**Why It Matters**: Sequence expressions enable generator-style programming for large or infinite data sources, yielding elements on demand without materializing the entire collection. Log parsers yield filtered lines lazily, processing gigabyte log files with kilobytes of memory. Data pipeline generators produce batches of database records for processing without loading entire tables. The `yield!` syntax for sub-sequences enables composing generators hierarchically.

## Example 36: Option Computation - Railway-Oriented Programming

Option-based computation expressions enable safe chaining of operations that might fail without explicit null checks.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Input strings"] -->|"tryParseInt"| B{"Parse OK?"}
    B -->|"Some value"| C{"tryParseInt 2"}
    B -->|"None"| Z["None (short-circuit)"]
    C -->|"Some value"| D{"tryParseInt 3"}
    C -->|"None"| Z
    D -->|"Some value"| E{"tryDivide"}
    D -->|"None"| Z
    E -->|"Some result"| F["Some result"]
    E -->|"None (div/0)"| Z

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#DE8F05,stroke:#000,color:#000
    style E fill:#DE8F05,stroke:#000,color:#000
    style F fill:#029E73,stroke:#000,color:#fff
    style Z fill:#CC78BC,stroke:#000,color:#000
```

```fsharp
// Example 36: Option Computation - Railway-Oriented Programming
let tryParseInt (s: string) =
                         // => Parse string to int option (type: string -> int option)
    match System.Int32.TryParse(s) with
    | (true, value) -> Some value
                         // => Success: Some int (e.g., Some 10)
    | (false, _) -> None // => Failure: None (e.g., for "abc")

let tryDivide x y =      // => Safe division (type: int -> int -> int option)
    if y = 0 then None   // => Division by zero: None
    else Some (x / y)    // => Valid division: Some result

type OptionBuilder() =   // => Builder for option computation expression chaining
    member _.Bind(x, f) =// => Bind: implements let! syntax
        match x with
        | Some v -> f v  // => Continue if Some, passing value to continuation
        | None -> None   // => Short-circuit: propagate None
    member _.Return(x) = Some x
                         // => Return: wraps value in Some

let option = OptionBuilder()
                         // => Create builder instance for option { } syntax

let calculate input1 input2 input3 = option {
                         // => Chain of operations that might fail
    let! num1 = tryParseInt input1
                         // => Parse first input; short-circuits if not valid int
    let! num2 = tryParseInt input2
                         // => Parse second input; short-circuits if invalid
    let! num3 = tryParseInt input3
                         // => Parse third input; short-circuits if invalid
    let! sum = Some (num1 + num2)
                         // => Sum always succeeds (trivially wrapped in Some)
    let! result = tryDivide sum num3
                         // => Divide sum by third number
                         // => Short-circuits with None if num3 is 0
    return result        // => Final result: Some result (success path)
}

let success = calculate "10" "20" "5"
                         // => 10 + 20 = 30, 30 / 5 = 6
                         // => success is Some 6

let parseFailure = calculate "abc" "20" "5"
                         // => First parse fails (tryParseInt "abc" = None)
                         // => parseFailure is None (short-circuit at num1)

let divZeroFailure = calculate "10" "20" "0"
                         // => Division by zero (tryDivide 30 0 = None)
                         // => divZeroFailure is None (short-circuit at result)

printfn "%A" success     // => Outputs: Some 6
printfn "%A" parseFailure// => Outputs: None
printfn "%A" divZeroFailure
                         // => Outputs: None
```

**Key Takeaway**: Option builders chain operations that may fail. First failure short-circuits entire computation, returning None.

**Why It Matters**: Railway-oriented programming eliminates defensive programming boilerplate by treating failure as a first-class concern in the type system. Payment processing pipelines validate card, check balance, authorize transaction, and debit account using option or result chains - any step returning `None` or `Error` automatically skips remaining steps. This makes error handling declarative and exhaustive, compared to try/catch chains that can accidentally swallow exceptions.

## Example 37: Result Type - Explicit Error Handling

The Result type carries explicit error information instead of None, providing context for failures.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Result type]:::blue --> B[Ok of value]:::teal
    A --> C[Error of error]:::orange

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 37: Result Type - Explicit Error Handling
type Result<'T, 'TError> =
                         // => Generic result type (built-in in F# 4.1+, no need to define)
    | Ok of 'T           // => Success case carrying value of type 'T
    | Error of 'TError   // => Failure case carrying error of type 'TError

let tryParseInt (s: string) : Result<int, string> =
                         // => Returns Ok int or Error string (explicit signature)
    match System.Int32.TryParse(s) with
    | (true, value) -> Ok value
                         // => Success: Ok with parsed value (e.g., Ok 20)
    | (false, _) -> Error (sprintf "Cannot parse '%s' as int" s)
                         // => Failure: Error with descriptive message (e.g., Error "Cannot parse 'abc' as int")

let tryDivide x y : Result<int, string> =
                         // => Safe division returning Result
    if y = 0 then Error "Division by zero"
                         // => Error case with human-readable reason
    else Ok (x / y)      // => Success case with integer quotient

type ResultBuilder() =   // => Builder class for result { } computation expression
    member _.Bind(x, f) =// => Bind: handles let! syntax
        match x with
        | Ok v -> f v    // => Continue pipeline with success value v
        | Error e -> Error e
                         // => Short-circuit: propagate first error
    member _.Return(x) = Ok x
                         // => Return: wraps value in Ok

let result = ResultBuilder()
                         // => Create builder instance

let calculate input1 input2 = result {
                         // => result { } computation expression
    let! num1 = tryParseInt input1
                         // => Parse first input; short-circuits with Error if invalid
    let! num2 = tryParseInt input2
                         // => Parse second input; short-circuits with Error if invalid
    let! quotient = tryDivide num1 num2
                         // => Divide; short-circuits with Error if division by zero
    return quotient      // => Success path: return Ok quotient
}

let success = calculate "20" "4"
                         // => All steps succeed: 20/4 = 5
                         // => success is Ok 5

let parseError = calculate "abc" "4"
                         // => tryParseInt "abc" returns Error
                         // => parseError is Error "Cannot parse 'abc' as int"

let divZeroError = calculate "20" "0"
                         // => tryDivide 20 0 returns Error
                         // => divZeroError is Error "Division by zero"

printfn "%A" success     // => Outputs: Ok 5
printfn "%A" parseError  // => Outputs: Error "Cannot parse 'abc' as int"
printfn "%A" divZeroError// => Outputs: Error "Division by zero"
```

**Key Takeaway**: Result type carries both success (Ok) and failure (Error) with context. Use Result for explicit error information.

**Why It Matters**: Result types provide structured error handling without exceptions, making error paths as explicit as success paths in the type system. Microservices return `Result<Data, ApiError>` with specific error codes like `ValidationFailed`, `Unauthorized`, or `NotFound`, enabling clients to handle each case programmatically. Unlike exceptions that bypass type checking, Result forces all callers to acknowledge possible failures at compile time, eliminating unhandled error scenarios.

## Example 38: Type Providers - JSON

Type providers generate types from external schemas at compile time, providing IntelliSense for JSON structures. Type providers are a core F# compiler feature - the mechanism is built into the F# language. However, `JsonProvider` and `CsvProvider` implementations come from the community library FSharp.Data, which is not part of the standard library.

**Why Not Core Features?** The F# compiler provides the type provider mechanism as a language feature, but does not bundle pre-built providers for JSON/CSV. FSharp.Data is the canonical .NET community library implementing these providers. Install it with `dotnet add package FSharp.Data` or use `#r "nuget: FSharp.Data"` in F# scripts.

```fsharp
// Example 38: Type Providers - JSON
#r "nuget: FSharp.Data"  // => Reference FSharp.Data NuGet package
                         // => Provides JsonProvider, CsvProvider, HtmlProvider
                         // => Required: not in F# standard library

open FSharp.Data           // => Open FSharp.Data namespace

type WeatherData = JsonProvider<"""
    {
        "temperature": 22.5,
        "humidity": 65,
        "conditions": "sunny"
    }
""">                     // => JsonProvider generates types from sample JSON
                         // => Creates WeatherData type with typed properties
                         // => Compilation reads schema: temperature=float, humidity=int, conditions=string
                         // => IntelliSense available for all fields

let jsonString = """
    {
        "temperature": 18.3,
        "humidity": 72,
        "conditions": "cloudy"
    }
"""                      // => JSON string to parse at runtime

let weather = WeatherData.Parse(jsonString)
                         // => Parse JSON string into typed WeatherData object
                         // => weather has compile-time type-checked properties
                         // => Runtime validates JSON matches schema

printfn "Temperature: %.1f°C" weather.Temperature
                         // => weather.Temperature is float (type-safe access)
                         // => Outputs: Temperature: 18.3°C

printfn "Humidity: %d%%" weather.Humidity
                         // => weather.Humidity is int (type-safe)
                         // => Outputs: Humidity: 72%

printfn "Conditions: %s" weather.Conditions
                         // => weather.Conditions is string (type-safe)
                         // => Outputs: Conditions: cloudy

// Array handling:
type WeatherArray = JsonProvider<"""
    [
        { "city": "Jakarta", "temp": 28.5 },
        { "city": "Bandung", "temp": 22.0 }
    ]
""">                     // => JsonProvider supports JSON arrays
                         // => Infers element types from sample array

let citiesJson = """
    [
        { "city": "Jakarta", "temp": 29.1 },
        { "city": "Bandung", "temp": 21.5 },
        { "city": "Surabaya", "temp": 30.2 }
    ]
"""                      // => Actual data (different from sample)

let cities = WeatherArray.Parse(citiesJson)
                         // => cities is typed array of city objects
                         // => Each element has .City (string) and .Temp (float)

for city in cities do    // => Iterate over typed array with IntelliSense
    printfn "%s: %.1f°C" city.City city.Temp
                         // => Outputs: Jakarta: 29.1°C
                         // =>          Bandung: 21.5°C
                         // =>          Surabaya: 30.2°C
```

**Key Takeaway**: JsonProvider generates types from sample JSON. Provides compile-time safety and IntelliSense for JSON data.

**Why It Matters**: Type providers eliminate manual DTO class definitions and runtime reflection overhead, generating compile-time types directly from data schemas. API clients using `JsonProvider` get immediate compile errors when upstream JSON schemas change, catching breaking changes in CI/CD before deployment. This dramatically reduces the feedback cycle for schema changes from "production alert" to "build failure", turning runtime errors into compile-time errors in data-intensive F# applications.

**Note**: Type providers are a core F# compiler feature, but `JsonProvider`/`CsvProvider` implementations come from the FSharp.Data community library. The F# standard library does not include pre-built providers for JSON/CSV - FSharp.Data is the canonical .NET library for these providers. Install with `#r "nuget: FSharp.Data"` in scripts or add the NuGet package to your project.

## Example 39: Type Providers - CSV

CSV type provider generates strongly-typed accessors for CSV data with automatic type inference.

**Why Not Core Features?** `CsvProvider` is provided by the FSharp.Data community library, not the F# standard library. Type providers are a core F# compiler mechanism, but FSharp.Data implements the specific JSON/CSV/HTML/XML providers. Add `#r "nuget: FSharp.Data"` in scripts or `<PackageReference Include="FSharp.Data" Version="6.x" />` in your project file.

```fsharp
// Example 39: Type Providers - CSV
open FSharp.Data              // => FSharp.Data NuGet library (not standard library)

type StockData = CsvProvider<"""
    Date,Symbol,Open,Close,Volume
    2024-01-01,AAPL,180.50,182.30,50000000
    2024-01-02,AAPL,182.00,181.50,48000000
""">                     // => CsvProvider generates types from sample CSV
                         // => Infers types: Date=string, Open=float, Volume=int
                         // => Compile-time type generation from sample data

let csvData = """
Date,Symbol,Open,Close,Volume
2024-01-03,GOOGL,140.25,142.10,25000000
2024-01-04,GOOGL,142.50,141.80,23000000
2024-01-05,MSFT,380.00,385.50,30000000
"""                      // => Actual CSV data to parse at runtime

let stocks = StockData.Parse(csvData)
                         // => Parse CSV string into typed StockData collection
                         // => Returns object with .Rows property

for row in stocks.Rows do
                         // => Iterate over typed rows with IntelliSense
    printfn "%s: %s - Open: %.2f, Close: %.2f, Volume: %d"
        row.Date         // => Type: string (inferred from sample column)
        row.Symbol       // => Type: string
        row.Open         // => Type: float (inferred from sample)
        row.Close        // => Type: float
        row.Volume       // => Type: int (inferred from sample)
                         // => Outputs:
                         // => 2024-01-03: GOOGL - Open: 140.25, Close: 142.10, Volume: 25000000
                         // => 2024-01-04: GOOGL - Open: 142.50, Close: 141.80, Volume: 23000000
                         // => 2024-01-05: MSFT - Open: 380.00, Close: 385.50, Volume: 30000000

// Aggregation with type safety:
let totalVolume = stocks.Rows
                  |> Seq.sumBy (fun row -> row.Volume)
                         // => Seq.sumBy: sum by key (type: int)
                         // => totalVolume is 78000000

let avgClose = stocks.Rows
               |> Seq.averageBy (fun row -> row.Close)
                         // => Seq.averageBy: average by key (type: float)
                         // => avgClose is 156.466667

printfn "Total Volume: %d" totalVolume
                         // => Outputs: Total Volume: 78000000
printfn "Avg Close: %.2f" avgClose
                         // => Outputs: Avg Close: 156.47
```

**Key Takeaway**: CsvProvider infers column types from sample data. Provides strongly-typed row access with IntelliSense.

**Why It Matters**: CSV type providers eliminate brittle string-index based access and manual type parsing, generating strongly-typed row accessors with IntelliSense support. Financial analysts processing trading data catch column name typos like `row.Volumne` at compile time instead of runtime. Teams integrating with data vendors benefit from automatic type inference: `CsvProvider` detects that `Volume` is integer and `Open` is float without manual schema definitions, reducing integration code significantly.

## Example 40: Units of Measure

Units of measure add dimension checking to numeric types, preventing unit mismatch errors at compile time.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[float with unit]:::blue --> B[Compile-time checking]:::orange
    B --> C[m + m = OK]:::teal
    B --> D[m + kg = ERROR]:::orange

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 40: Units of Measure
[<Measure>] type m       // => Define meter unit
[<Measure>] type kg      // => Define kilogram unit
[<Measure>] type s       // => Define second unit

let distance = 100.0<m>  // => 100 meters (type: float<m>)
                         // => Unit annotation: <unit>

let mass = 75.0<kg>      // => 75 kilograms (type: float<kg>)

let time = 10.0<s>       // => 10 seconds (type: float<s>)

let speed = distance / time
                         // => Division: m / s = m/s
                         // => speed is 10.0<m/s> (type: float<m/s>)
                         // => Derived unit automatically inferred

printfn "Speed: %.1f m/s" speed
                         // => Outputs: Speed: 10.0 m/s

// let invalid = distance + mass
                         // => COMPILE ERROR: Cannot add m and kg
                         // => Type mismatch caught at compile time

let totalDistance = distance + 50.0<m>
                         // => Adding same units: OK
                         // => totalDistance is 150.0<m>

// Force calculation (unit erased):
let energy = mass * (speed * speed)
                         // => kg * (m/s)^2 = kg·m²/s²
                         // => Type: float<kg m^2/s^2>
                         // => Dimensional analysis automatic

printfn "Kinetic energy: %.1f J" (float energy)
                         // => float casts away units
                         // => Outputs: Kinetic energy: 7500.0 J

// Generic units:
let double (x: float<'u>) : float<'u> =
                         // => Generic unit parameter 'u
                         // => Function preserves units
    x * 2.0              // => Multiplying by unitless float preserves unit

let doubleDistance = double distance
                         // => doubleDistance is 200.0<m>
let doubleMass = double mass
                         // => doubleMass is 150.0<kg>

printfn "Double distance: %.1f m" doubleDistance
                         // => Outputs: Double distance: 200.0 m
```

**Key Takeaway**: Units of measure prevent dimension errors. Define with `[<Measure>] type`, annotate with `<unit>`. Generic units use `'u`.

**Why It Matters**: Units of measure can prevent catastrophic unit conversion errors at compile time - the Mars Climate Orbiter failure (pound-force vs. newtons) cost $328 million. Physics simulations and engineering calculations use units to eliminate conversion errors, with the compiler rejecting invalid operations like adding meters to kilograms. Aerospace, medical device, and financial systems use units of measure to guarantee dimensional consistency throughout calculation chains.

## Example 41: Active Patterns - Single-Case

Single-case active patterns create custom pattern matching extractors, enabling declarative decomposition.

```fsharp
// Example 41: Active Patterns - Single-Case
let (|EmailParts|) (email: string) =
                         // => Single-case active pattern
                         // => (|PatternName|) defines pattern
                         // => Always succeeds (no None case, unlike partial patterns)
    let parts = email.Split('@')
                         // => Split email at @ character
    if parts.Length = 2 then
        (parts.[0], parts.[1])
                         // => Return (username, domain) tuple
    else
        ("", "")         // => Invalid email: return empty strings

let analyzeEmail email = // => Function using active pattern
    match email with
    | EmailParts(user, domain) ->
                         // => EmailParts pattern extracts user and domain
                         // => Pattern ALWAYS matches (single-case)
        sprintf "User: %s, Domain: %s" user domain

let result1 = analyzeEmail "john@example.com"
                         // => result1 is "User: john, Domain: example.com"

let result2 = analyzeEmail "invalid-email"
                         // => result2 is "User: , Domain: " (empty parts)

printfn "%s" result1     // => Outputs: User: john, Domain: example.com
printfn "%s" result2     // => Outputs: User: , Domain:

// Parameterized single-case pattern:
let (|Multiplied|) multiplier value =
                         // => Pattern with parameter (multiplier)
                         // => Takes multiplier, applies to value
    value * multiplier   // => Returns multiplied value (extracted value)

let describeMultiple value =
    match value with
    | Multiplied 2 doubled ->
                         // => Multiplied 2 applies: doubled = value * 2
                         // => doubled is bound to value*2 result
        sprintf "Doubled: %d" doubled
    | _ -> ""            // => Other multipliers (not needed here)

let result3 = describeMultiple 5
                         // => 5*2 = 10
                         // => result3 is "Doubled: 10"

printfn "%s" result3     // => Outputs: Doubled: 10
```

**Key Takeaway**: Single-case patterns use `(|Name|) params`. They always match and extract values for pattern matching.

**Why It Matters**: Single-case patterns enable domain-specific decomposition that makes complex parsing and extraction logic read declaratively. HTTP request parsers extract headers, query strings, and bodies using custom patterns, making routing code read like specifications: `match request with | AuthenticatedRequest (user, body) -> processAuthorized user body`. This abstraction hides parsing complexity behind patterns, improving code readability and enabling pattern reuse across multiple match expressions.

## Example 42: Active Patterns - Multi-Case

Multi-case active patterns enable custom matching with multiple outcomes, like enhanced switch statements.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    A[match value]:::blue --> B{Active Pattern}:::orange
    B -->|Even| C[Handle even]:::teal
    B -->|Odd| D[Handle odd]:::purple

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 42: Active Patterns - Multi-Case
let (|Even|Odd|) value = // => Multi-case active pattern: returns one of two cases
                         // => (|Case1|Case2|...|) syntax for multi-case
    if value % 2 = 0 then Even
                         // => Even case (no associated data)
    else Odd             // => Odd case (no associated data)

let describe value =     // => Function using custom Even/Odd pattern
    match value with     // => Exhaustive pattern match (only Even/Odd cases)
    | Even ->            // => Matches if (|Even|Odd|) returns Even
        sprintf "%d is even" value
    | Odd ->             // => Matches if (|Even|Odd|) returns Odd
        sprintf "%d is odd" value

printfn "%s" (describe 10)
                         // => Outputs: 10 is even
printfn "%s" (describe 7)
                         // => Outputs: 7 is odd

// Multi-case with data:
let (|Positive|Negative|Zero|) value =
                         // => Three-case pattern with associated data
    if value > 0 then Positive value
                         // => Positive case carries original value
    elif value < 0 then Negative -value
                         // => Negative case carries absolute value (negated)
    else Zero            // => Zero case (no associated data)

let describeNumber value =
    match value with
    | Positive v ->      // => Extract positive value into v (e.g., v=42)
        sprintf "+%d (positive)" v
    | Negative v ->      // => Extract absolute value into v (e.g., v=15 for -15)
        sprintf "-%d (negative)" v
    | Zero ->            // => Zero case (no data to extract)
        "0 (zero)"

printfn "%s" (describeNumber 42)
                         // => Outputs: +42 (positive)
printfn "%s" (describeNumber -15)
                         // => Outputs: -15 (negative)
printfn "%s" (describeNumber 0)
                         // => Outputs: 0 (zero)

// Parameterized multi-case:
let (|DivisibleBy|NotDivisibleBy|) divisor value =
                         // => Pattern with extra parameter (divisor)
    if value % divisor = 0 then
                         // => Check if value is divisible by divisor
        DivisibleBy (value / divisor)
                         // => Carries quotient as associated data
    else
        NotDivisibleBy   // => Not divisible (no associated data)

let checkDivisibility value =
    match value with
    | DivisibleBy 3 quotient ->
                         // => Parameterized: DivisibleBy 3 tests divisibility by 3
                         // => quotient bound to value/3 if divisible
        sprintf "%d / 3 = %d" value quotient
    | NotDivisibleBy ->  // => Not divisible by 3
        sprintf "%d not divisible by 3" value

printfn "%s" (checkDivisibility 15)
                         // => Outputs: 15 / 3 = 5
printfn "%s" (checkDivisibility 7)
                         // => Outputs: 7 not divisible by 3
```

**Key Takeaway**: Multi-case patterns use `(|Case1|Case2|...)`. Cases can carry data. All cases must be covered in match.

**Why It Matters**: Active patterns enable domain-specific matching that extends pattern matching beyond the type system with computed classifications. Compiler lexers classify tokens using active patterns: `| Keyword str -> handleKeyword str | Identifier name -> handleId name | IntLiteral n -> handleInt n`. This makes complex classification logic exhaustively checkable by the compiler. Domain-driven designs use active patterns to match business rule conditions in declarative, self-documenting match expressions.

## Example 43: List Comprehensions Advanced

List comprehensions combine filtering, mapping, and generation in concise syntax.

```fsharp
// Example 43: List Comprehensions Advanced
let squares = [ for x in 1 .. 10 -> x * x ]
                         // => List comprehension with map
                         // => for x in range -> expression
                         // => squares is [1; 4; 9; 16; 25; 36; 49; 64; 81; 100]

printfn "%A" squares     // => Outputs: [1; 4; 9; 16; 25; 36; 49; 64; 81; 100]

// Filtering with if:
let evenSquares = [ for x in 1 .. 10 do
                        if x % 2 = 0 then
                            yield x * x ]
                         // => Conditional yield
                         // => evenSquares is [4; 16; 36; 64; 100]

printfn "%A" evenSquares // => Outputs: [4; 16; 36; 64; 100]

// Multiple generators (cartesian product):
let pairs = [ for x in 1 .. 3 do
                  for y in 1 .. 3 do
                      yield (x, y) ]
                         // => Nested loops create pairs
                         // => pairs is [(1,1); (1,2); (1,3); (2,1); (2,2); (2,3); (3,1); (3,2); (3,3)]

printfn "%A" pairs       // => Outputs: [(1, 1); (1, 2); (1, 3); (2, 1); (2, 2); (2, 3); (3, 1); (3, 2); (3, 3)]

// Complex comprehension:
let pythagoreanTriples = [
    for a in 1 .. 20 do
        for b in a .. 20 do
            for c in b .. 20 do
                if a*a + b*b = c*c then
                    yield (a, b, c) ]
                         // => Find Pythagorean triples (a²+b²=c²)
                         // => Nested loops with filtering
                         // => pythagoreanTriples is [(3,4,5); (5,12,13); (6,8,10); ...]

printfn "%A" pythagoreanTriples
                         // => Outputs: [(3, 4, 5); (5, 12, 13); (6, 8, 10); (8, 15, 17); (9, 12, 15); (12, 16, 20)]

// Comprehension with function calls:
let lengths = [ for str in ["hello"; "world"; "F#"] -> str.Length ]
                         // => Map strings to lengths
                         // => lengths is [5; 5; 2]

printfn "%A" lengths     // => Outputs: [5; 5; 2]
```

**Key Takeaway**: List comprehensions use `[ for x in source -> expr ]` for mapping, `yield` for conditional inclusion. Multiple `for` clauses create nested iterations.

**Why It Matters**: Comprehensions provide concise, readable syntax for complex list generation and transformation. Data scientists generate hyperparameter combinations for grid search using nested comprehensions, creating thousands of test configurations in 3-4 lines. Cartesian product generation, Pythagorean triple finding, and combinatorial enumeration all become one-liners. The declarative syntax reduces the risk of off-by-one errors common in equivalent nested for-loop implementations.

## Example 44: Set and Map Collections

Sets provide efficient membership testing; Maps enable key-value lookups with immutability.

```fsharp
// Example 44: Set and Map Collections
let set1 = Set.ofList [1; 2; 3; 4; 5]
                         // => Set from list (duplicates removed)
                         // => Type: Set<int> (immutable, ordered)

let set2 = Set.ofList [4; 5; 6; 7; 8]
                         // => Second set

let union = Set.union set1 set2
                         // => Union: all elements from both sets
                         // => union is {1; 2; 3; 4; 5; 6; 7; 8}

let intersection = Set.intersect set1 set2
                         // => Intersection: elements in both
                         // => intersection is {4; 5}

let difference = Set.difference set1 set2
                         // => Difference: elements in set1 but not set2
                         // => difference is {1; 2; 3}

printfn "Union: %A" union
                         // => Outputs: Union: set [1; 2; 3; 4; 5; 6; 7; 8]
printfn "Intersection: %A" intersection
                         // => Outputs: Intersection: set [4; 5]
printfn "Difference: %A" difference
                         // => Outputs: Difference: set [1; 2; 3]

let contains = Set.contains 3 set1
                         // => Membership test (O(log n))
                         // => contains is true

printfn "Contains 3: %b" contains
                         // => Outputs: Contains 3: true

// Map collection:
let map = Map.ofList [("Alice", 30); ("Bob", 25); ("Charlie", 35)]
                         // => Map from key-value pairs
                         // => Type: Map<string, int> (immutable)

let aliceAge = Map.find "Alice" map
                         // => Lookup value by key (throws if not found)
                         // => aliceAge is 30

let bobAge = Map.tryFind "Bob" map
                         // => Safe lookup returning option
                         // => bobAge is Some 25

let unknownAge = Map.tryFind "Dave" map
                         // => Key not found
                         // => unknownAge is None

let updatedMap = Map.add "Dave" 28 map
                         // => Add new key-value (creates new map)
                         // => Original map unchanged
                         // => updatedMap has 4 entries

let removedMap = Map.remove "Alice" updatedMap
                         // => Remove key (creates new map)
                         // => removedMap has 3 entries (Bob, Charlie, Dave)

printfn "Alice's age: %d" aliceAge
                         // => Outputs: Alice's age: 30
printfn "Bob's age: %A" bobAge
                         // => Outputs: Bob's age: Some 25
printfn "Unknown age: %A" unknownAge
                         // => Outputs: Unknown age: None
printfn "Map size: %d" (Map.count removedMap)
                         // => Outputs: Map size: 3
```

**Key Takeaway**: Sets provide set operations (union, intersection, difference) with fast membership testing. Maps provide immutable key-value storage.

**Why It Matters**: Sets eliminate duplicates efficiently for large datasets and enable mathematical set operations used throughout computing. Search engines store unique document IDs as sets, with union/intersection operations implementing boolean search queries (AND/OR/NOT) in O(n log n) time. Immutable sets use structural sharing to reduce memory when creating derived sets. Maps provide fast key-value lookup for caches, indexes, and configuration stores with O(log n) access time.

## Example 45: Generic Functions

Generic functions work with any type using type parameters, enabling code reuse without duplication.

```fsharp
// Example 45: Generic Functions
let identity x = x       // => Generic function (type inferred)
                         // => Type: 'a -> 'a (generic type parameter)
                         // => Works with any type

let intValue = identity 42
                         // => Type inference: 'a = int
                         // => intValue is 42

let stringValue = identity "hello"
                         // => Type inference: 'a = string
                         // => stringValue is "hello"

printfn "%d" intValue    // => Outputs: 42
printfn "%s" stringValue // => Outputs: hello

// Explicit type parameters:
let swap<'a, 'b> (x: 'a, y: 'b) : ('b * 'a) =
                         // => Generic function with 2 type parameters
                         // => 'a and 'b can be different types
    (y, x)               // => Returns swapped tuple

let swapped = swap (1, "two")
                         // => swapped is ("two", 1)
                         // => Type: string * int

printfn "%A" swapped     // => Outputs: ("two", 1)

// Generic list operations:
let first<'T> (list: 'T list) : 'T option =
                         // => Generic list function
    match list with
    | [] -> None         // => Empty list: None
    | head :: _ -> Some head
                         // => Non-empty: Some first element

let firstInt = first [1; 2; 3]
                         // => firstInt is Some 1 (type: int option)

let firstString = first ["a"; "b"; "c"]
                         // => firstString is Some "a" (type: string option)

let firstEmpty = first []
                         // => firstEmpty is None (type: 'a option)

printfn "%A" firstInt    // => Outputs: Some 1
printfn "%A" firstString // => Outputs: Some "a"
printfn "%A" firstEmpty  // => Outputs: None

// Constrained generics (SRTP - Statically Resolved Type Parameters):
let inline add x y = x + y
                         // => inline enables static resolution
                         // => Works with any type supporting +
                         // => Type: ^a -> ^a -> ^a when ^a : (static member (+) : ^a * ^a -> ^a)

let intSum = add 1 2     // => intSum is 3 (int)
let floatSum = add 1.5 2.5
                         // => floatSum is 4.0 (float)
let stringConcat = add "hello" " world"
                         // => stringConcat is "hello world" (string)

printfn "%d" intSum      // => Outputs: 3
printfn "%.1f" floatSum  // => Outputs: 4.0
printfn "%s" stringConcat// => Outputs: hello world
```

**Key Takeaway**: Generic functions use type parameters `'a`, `'b`. Use `inline` for operator-generic functions requiring static resolution.

**Why It Matters**: Generics eliminate code duplication across types, enabling algorithms and data structures that work correctly for any type while maintaining full compile-time type safety. F#'s standard library implements all collection operations generically, providing the same `List.map`, `Array.filter`, and `Seq.fold` for every element type. SRTP (statically resolved type parameters) extend generics to operator-constrained functions, enabling type-safe numeric algorithms that work for int, float, and decimal without boxing.

## Example 46: Function Recursion Patterns

Recursion patterns include direct recursion, mutual recursion, and continuation-passing style.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[factorial 5]:::blue --> B[5 * factorial 4]:::orange
    B --> C[5 * 4 * factorial 3]:::orange
    C --> D[5 * 4 * 3 * factorial 2]:::orange
    D --> E[5 * 4 * 3 * 2 * 1]:::teal
    E --> F[Result: 120]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
    style F fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 46: Function Recursion Patterns
let rec factorial n =    // => Standard recursion (NOT tail-recursive)
                         // => rec keyword enables self-reference
    if n <= 1 then 1     // => Base case
    else n * factorial (n - 1)
                         // => Recursive case (multiplication AFTER call)
                         // => Stack frame accumulates: n * (n-1) * ... * 1

let result1 = factorial 5
                         // => 5 * 4 * 3 * 2 * 1 = 120
                         // => result1 is 120

printfn "Factorial 5: %d" result1
                         // => Outputs: Factorial 5: 120

// Mutual recursion:
let rec isEven n =       // => rec in first function of mutually recursive pair
    if n = 0 then true
    elif n = 1 then false
    else isOdd (n - 1)   // => Calls isOdd (defined next)

and isOdd n =            // => and connects mutually recursive functions
    if n = 0 then false
    elif n = 1 then true
    else isEven (n - 1)  // => Calls isEven

let evenResult = isEven 10
                         // => evenResult is true
let oddResult = isOdd 7  // => oddResult is true

printfn "10 is even: %b" evenResult
                         // => Outputs: 10 is even: true
printfn "7 is odd: %b" oddResult
                         // => Outputs: 7 is odd: true

// Pattern matching in recursion:
let rec sumList list =   // => Recursive list sum
    match list with
    | [] -> 0            // => Base case: empty list
    | head :: tail ->    // => Recursive case: decompose list
        head + sumList tail
                         // => Add head to sum of tail

let listSum = sumList [1; 2; 3; 4; 5]
                         // => 1 + 2 + 3 + 4 + 5 = 15
                         // => listSum is 15

printfn "List sum: %d" listSum
                         // => Outputs: List sum: 15
```

**Key Takeaway**: Use `rec` for self-referencing functions. Use `and` for mutually recursive functions. Pattern matching common in recursive list processing.

**Why It Matters**: Recursion provides natural expression for tree/graph algorithms where iteration would require explicit stack management. Compilers traverse abstract syntax trees recursively using pattern matching - the code structure mirrors the data structure. JSON parsers, HTML processors, and expression evaluators all benefit from recursive descent. Mutual recursion (`rec`/`and`) enables state machines and grammar rules that reference each other directly, matching formal grammar specifications.

## Example 47: Tail Recursion

Tail recursion enables efficient recursion without stack overflow by optimizing tail calls to loops.

```fsharp
// Example 47: Tail Recursion
let rec factorialTail n acc =
                         // => Tail-recursive factorial
                         // => acc is accumulator (carries result)
    if n <= 1 then acc   // => Base case: return accumulator
    else factorialTail (n - 1) (n * acc)
                         // => Recursive call is LAST operation (tail position)
                         // => Compiler optimizes to while loop (no stack growth)

let factorial n = factorialTail n 1
                         // => Wrapper with initial accumulator

let result1 = factorial 5
                         // => Call sequence:
                         // => factorialTail 5 1
                         // => factorialTail 4 5    (5*1)
                         // => factorialTail 3 20   (4*5)
                         // => factorialTail 2 60   (3*20)
                         // => factorialTail 1 120  (2*60)
                         // => Returns 120
                         // => result1 is 120

printfn "Factorial 5: %d" result1
                         // => Outputs: Factorial 5: 120

let result2 = factorial 10000
                         // => Large input (would stack overflow without tail call)
                         // => Runs efficiently with constant stack space

printfn "Factorial 10000 computed"
                         // => Outputs: Factorial 10000 computed

// Tail-recursive list sum:
let rec sumListTail list acc =
                         // => Tail-recursive sum with accumulator
    match list with
    | [] -> acc          // => Base case: return accumulator
    | head :: tail ->
        sumListTail tail (acc + head)
                         // => Recursive call in tail position
                         // => Accumulator carries running sum

let sumList list = sumListTail list 0
                         // => Wrapper with initial accumulator

let listSum = sumList [1; 2; 3; 4; 5]
                         // => Call sequence:
                         // => sumListTail [1;2;3;4;5] 0
                         // => sumListTail [2;3;4;5] 1   (0+1)
                         // => sumListTail [3;4;5] 3     (1+2)
                         // => sumListTail [4;5] 6       (3+3)
                         // => sumListTail [5] 10        (6+4)
                         // => sumListTail [] 15         (10+5)
                         // => Returns 15
                         // => listSum is 15

printfn "List sum: %d" listSum
                         // => Outputs: List sum: 15
```

**Key Takeaway**: Tail recursion requires recursive call as last operation. Use accumulator parameter to carry state. Compiler optimizes to loops.

**Why It Matters**: Tail recursion prevents stack overflow for deep recursion by compiling to efficient while loops internally. Parsers processing deeply nested JSON (1000+ levels) or deeply recursive data structures use tail-recursive descent without stack limit concerns. The CLR stack typically supports around 1,000-10,000 frames before overflow; tail call optimization enables effectively unlimited recursion depth. Use accumulator parameters to convert non-tail recursive functions to tail-recursive equivalents.

## Example 48: Mutual Recursion

Mutual recursion enables functions calling each other, useful for state machines and alternating patterns.

```fsharp
// Example 48: Mutual Recursion
let rec processEven n =  // => Processes even state (rec required for mutual)
    if n = 0 then        // => Base case: both functions terminate at 0
        printfn "Done"
    else
        printfn "Even: %d" n
                         // => Print even number
        processOdd (n - 1)
                         // => Transition to odd state (calls sibling function)

and processOdd n =       // => Processes odd state (and keyword for mutual recursion)
    if n = 0 then        // => Base case
        printfn "Done"
    else
        printfn "Odd: %d" n
                         // => Print odd number
        processEven (n - 1)
                         // => Transition to even state (calls back to processEven)

processEven 5            // => Start with even state (n=5)
                         // => Outputs:
                         // => Even: 5
                         // => Odd: 4
                         // => Even: 3
                         // => Odd: 2
                         // => Even: 1
                         // => Done

// Mutual recursion for expression evaluation:
type Expr =              // => Recursive discriminated union for expressions
    | Number of int      // => Terminal: literal number
    | Add of Expr * Expr // => Non-terminal: left + right
    | Multiply of Expr * Expr
                         // => Non-terminal: left * right

let rec evalExpr expr =  // => Evaluate expression (main evaluator)
    match expr with
    | Number n -> n      // => Base case: return number
    | Add(left, right) ->
        evalTerm left + evalTerm right
                         // => Addition: evaluate both sides via evalTerm
    | Multiply(left, right) ->
        evalExpr left * evalExpr right
                         // => Multiplication: direct recursion to evalExpr

and evalTerm term =      // => Evaluate term (for operator precedence)
    evalExpr term        // => Calls back to evalExpr
                         // => Demonstrates mutual recursion pattern

let expression = Add(Number 10, Multiply(Number 5, Number 3))
                         // => 10 + (5 * 3) as expression tree

let result = evalExpr expression
                         // => Evaluates to 10 + 15 = 25
                         // => result is 25

printfn "Result: %d" result
                         // => Outputs: Result: 25
```

**Key Takeaway**: Use `and` to define mutually recursive functions. Each function can reference the others.

**Why It Matters**: Mutual recursion models state machines and formal grammars naturally, where functions represent states or grammar rules that reference each other. Recursive descent parsers define mutually recursive functions mirroring grammar productions: `parseStatement` calls `parseExpression`, which calls `parsePrimary`, which calls `parseStatement` for nested blocks. This structure directly encodes grammar rules in code, making parsers maintainable when grammar changes and enabling straightforward extension with new syntax.

## Example 49: Memoization

Memoization caches function results to avoid redundant computation, trading memory for speed.

```fsharp
// Example 49: Memoization
let memoize f =          // => Generic memoization function
    let cache = System.Collections.Generic.Dictionary<_, _>()
                         // => Mutable cache (side effect)
    fun x ->             // => Returns memoized function
        match cache.TryGetValue(x) with
        | (true, result) ->
                         // => Cache hit: return cached result
            printfn "Cache hit for %A" x
            result
        | (false, _) ->  // => Cache miss: compute and store
            printfn "Computing %A" x
            let result = f x
                         // => Call original function
            cache.[x] <- result
                         // => Store in cache
            result

let rec fib n =          // => Naive Fibonacci (exponential time)
    if n <= 1 then n
    else fib (n - 1) + fib (n - 2)
                         // => Recomputes same values many times

let fibMemo = memoize fib
                         // => Memoized Fibonacci

let result1 = fibMemo 10 // => First call: computes fib(10)
                         // => Outputs: Computing 10, Computing 9, ... (many computations)
                         // => result1 is 55

let result2 = fibMemo 10 // => Second call: cache hit
                         // => Outputs: Cache hit for 10
                         // => result2 is 55 (instant)

printfn "Fib(10): %d" result1
                         // => Outputs: Fib(10): 55
printfn "Fib(10) cached: %d" result2
                         // => Outputs: Fib(10) cached: 55

// Memoized expensive computation:
let expensiveCompute n = // => Simulates expensive operation
    System.Threading.Thread.Sleep(1000)
                         // => Sleep 1 second
    n * n                // => Return result

let memoizedCompute = memoize expensiveCompute

let r1 = memoizedCompute 5
                         // => First call: sleeps 1s, computes
                         // => Outputs: Computing 5
                         // => r1 is 25 (after 1s)

let r2 = memoizedCompute 5
                         // => Second call: instant (cached)
                         // => Outputs: Cache hit for 5
                         // => r2 is 25 (instant)

printfn "Result 1: %d" r1
                         // => Outputs: Result 1: 25
printfn "Result 2: %d" r2
                         // => Outputs: Result 2: 25
```

**Key Takeaway**: Memoization caches expensive computations. Use dictionary to map inputs to results. Trade memory for speed.

**Why It Matters**: Memoization dramatically improves performance for recursive algorithms with overlapping subproblems. Dynamic programming solutions for knapsack, edit distance, and sequence alignment use memoization to reduce exponential time complexity to polynomial. The generic `memoize` function works with any pure function, making it reusable across algorithm implementations. Cache-aside patterns in production systems memoize expensive database lookups or computation-heavy operations with configurable TTL.

## Example 50: Module Organization

Modules organize related functions and types, providing namespacing and encapsulation.

```fsharp
// Example 50: Module Organization
module MathUtils =       // => Module declaration
                         // => Groups related functionality

    let add x y = x + y  // => Public function (default)

    let multiply x y = x * y

    let private helper x =
                         // => Private function (module-scoped)
                         // => Not accessible outside module
        x * 2

    let double x = helper x
                         // => Public function using private helper

module StringUtils =     // => Separate module

    let toUpper (s: string) = s.ToUpper()

    let toLower (s: string) = s.ToLower()

    let concat (strings: string list) =
        System.String.Join(", ", strings)

// Using modules:
let sum = MathUtils.add 10 20
                         // => Qualified access: Module.function
                         // => sum is 30

let product = MathUtils.multiply 5 6
                         // => product is 30

let doubled = MathUtils.double 7
                         // => Uses private helper internally
                         // => doubled is 14

// let invalid = MathUtils.helper 10
                         // => COMPILE ERROR: helper is private

let upper = StringUtils.toUpper "hello"
                         // => upper is "HELLO"

let combined = StringUtils.concat ["F#"; "is"; "great"]
                         // => combined is "F#, is, great"

printfn "Sum: %d" sum    // => Outputs: Sum: 30
printfn "Upper: %s" upper// => Outputs: Upper: HELLO

// Opening modules for unqualified access:
open MathUtils           // => Opens module for unqualified access

let sum2 = add 15 25     // => No MathUtils. prefix needed
                         // => sum2 is 40

printfn "Sum2: %d" sum2  // => Outputs: Sum2: 40

// Nested modules:
module Geometry =        // => Parent module

    module Circle =      // => Nested module
        let area radius = System.Math.PI * radius * radius
        let circumference radius = 2.0 * System.Math.PI * radius

    module Rectangle =   // => Another nested module
        let area width height = width * height
        let perimeter width height = 2.0 * (width + height)

let circleArea = Geometry.Circle.area 5.0
                         // => Nested module access
                         // => circleArea is ~78.54

let rectPerimeter = Geometry.Rectangle.perimeter 4.0 6.0
                         // => rectPerimeter is 20.0

printfn "Circle area: %.2f" circleArea
                         // => Outputs: Circle area: 78.54
printfn "Rectangle perimeter: %.2f" rectPerimeter
                         // => Outputs: Rectangle perimeter: 20.00
```

**Key Takeaway**: Use `module Name` to organize code. Functions are public by default, use `private` for internal helpers. Access with `Module.function` or `open Module`.

**Why It Matters**: Modules provide namespacing and encapsulation without the overhead of class definitions, reducing boilerplate in functional codebases. Large F# projects organize thousands of functions into hierarchical modules like `Domain.Pricing.Calculate` and `Infrastructure.Database.Queries` with clear boundaries. The `private` keyword restricts visibility to module scope, enforcing information hiding. `open` declarations at file scope reduce verbosity while maintaining namespace clarity.

## Example 51: Namespaces

Namespaces group modules at higher level, similar to C# namespaces, for large-scale organization.

```fsharp
// Example 51: Namespaces
namespace MyCompany.Utils
                         // => Namespace declaration at file top
                         // => Applies to all modules in this file

module StringHelpers =   // => Module within namespace (fully qualified: MyCompany.Utils.StringHelpers)
    let reverse (s: string) =
                         // => Reverse string characters
        s.ToCharArray() |> Array.rev |> System.String
                         // => ToCharArray -> reverse array -> create string

    let capitalize (s: string) =
        if s.Length = 0 then s
                         // => Empty string: return unchanged
        else s.[0..0].ToUpper() + s.[1..]
                         // => Uppercase first char + rest unchanged

module MathHelpers =     // => Another module in same namespace
    let square x = x * x // => x squared
    let cube x = x * x * x
                         // => x cubed

// Using namespaced modules:
open MyCompany.Utils     // => Open namespace (enables module-qualified access)

let reversed = StringHelpers.reverse "hello"
                         // => reversed is "olleh"

let capitalized = StringHelpers.capitalize "world"
                         // => capitalized is "World"

let squared = MathHelpers.square 7
                         // => squared is 49

printfn "Reversed: %s" reversed
                         // => Outputs: Reversed: olleh
printfn "Capitalized: %s" capitalized
                         // => Outputs: Capitalized: World
printfn "Squared: %d" squared
                         // => Outputs: Squared: 49

// Alternative: open specific module:
open MyCompany.Utils.StringHelpers
                         // => Opens specific module (enables unqualified access)

let rev2 = reverse "F#"  // => No StringHelpers. prefix needed
                         // => rev2 is "#F"

printfn "Reversed F#: %s" rev2
                         // => Outputs: Reversed F#: #F
```

**Key Takeaway**: Use `namespace Company.Product.Component` for top-level organization. Namespaces contain modules, modules contain functions.

**Why It Matters**: Namespaces prevent naming conflicts in large multi-team codebases and .NET assemblies. Enterprise applications use hierarchical namespaces like `Contoso.Trading.Execution` and `Contoso.Trading.Reporting` to isolate components, enabling parallel development without function name collisions. Namespaces also improve discoverability through IDE tools - `Ctrl+.` in Visual Studio navigates namespace hierarchies efficiently. F# namespaces map directly to .NET namespaces, ensuring interop with C# consumers.

## Example 52: Signature Files (.fsi)

Signature files define public interfaces, hiding implementation details and enabling encapsulation.

```fsharp
// Example 52: Signature Files (.fsi)
// File: Calculator.fsi (signature/interface file)
(*
module Calculator

val add : int -> int -> int
                         // => Public function signature
                         // => Only declared functions are public

val multiply : int -> int -> int
                         // => Another public function

// Note: subtract is NOT declared in signature
// Therefore it's PRIVATE to implementation
*)

// File: Calculator.fs (implementation file)
module Calculator

let add x y = x + y      // => Public (in signature)

let multiply x y = x * y // => Public (in signature)

let subtract x y = x - y // => PRIVATE (not in signature)
                         // => Only accessible within module

let addThenMultiply x y z =
                         // => Public function using private helper
    let sum = add x y    // => Can use both public and private functions
    let diff = subtract sum 10
                         // => Uses private subtract
    multiply diff z

// Usage (in another file):
// open Calculator

// let r1 = add 10 20    // => OK: add is public
// let r2 = multiply 5 6 // => OK: multiply is public
// let r3 = subtract 10 5// => ERROR: subtract not in signature (private)

printfn "Module defined (signature example)"
                         // => Outputs: Module defined (signature example)

// Demonstration (within same file for example):
let publicResult = Calculator.add 15 25
                         // => publicResult is 40

let composedResult = Calculator.addThenMultiply 10 20 3
                         // => (10+20-10) * 3 = 60
                         // => composedResult is 60

printfn "Public result: %d" publicResult
                         // => Outputs: Public result: 40
printfn "Composed result: %d" composedResult
                         // => Outputs: Composed result: 60
```

**Key Takeaway**: Signature files (.fsi) declare public API. Implementation files (.fs) define all functions. Only functions in signature are public.

**Why It Matters**: Signature files enable information hiding critical for stable library design - the most important software engineering principle for long-term maintainability. Public APIs expose minimal surface area while implementations evolve freely using private helpers. When signature files define the contract, internal refactoring cannot accidentally break callers. .fsi files also serve as authoritative API documentation, showing exactly what's public with precise type signatures.

## Example 53: Object Programming - Classes

F# supports OOP for .NET interop and when mutation is necessary, though functional style preferred.

```fsharp
// Example 53: Object Programming - Classes
type Person(name: string, age: int) =
                         // => Class definition with primary constructor
                         // => Constructor parameters: name, age

    let mutable currentAge = age
                         // => Private mutable field
                         // => let bindings in class are private

    member this.Name = name
                         // => Public property (getter only)
                         // => this is self-reference

    member this.Age = currentAge
                         // => Property exposing private field

    member this.HaveBirthday() =
                         // => Method with side effect (unit return)
        currentAge <- currentAge + 1
                         // => Mutate private state
        printfn "%s is now %d" name currentAge

    member this.Greet() =// => Method returning string
        sprintf "Hello, I'm %s, aged %d" name currentAge

// Using class:
let alice = Person("Alice", 30)
                         // => Create instance using constructor

printfn "%s" (alice.Greet())
                         // => Outputs: Hello, I'm Alice, aged 30

alice.HaveBirthday()     // => Call method (side effect)
                         // => Outputs: Alice is now 31

printfn "Age after birthday: %d" alice.Age
                         // => Outputs: Age after birthday: 31

// Class with additional constructors:
type Rectangle(width: float, height: float) =
    member this.Width = width
    member this.Height = height
    member this.Area = width * height
                         // => Computed property

    new(side: float) =   // => Additional constructor (square)
        Rectangle(side, side)
                         // => Delegates to primary constructor

let rect = Rectangle(4.0, 6.0)
                         // => Uses primary constructor

let square = Rectangle(5.0)
                         // => Uses additional constructor (square)

printfn "Rectangle area: %.1f" rect.Area
                         // => Outputs: Rectangle area: 24.0
printfn "Square area: %.1f" square.Area
                         // => Outputs: Square area: 25.0
```

**Key Takeaway**: Classes use `type Name(params) =` with members. Use `mutable` for mutable state. Prefer functional style; use classes for .NET interop.

**Why It Matters**: Classes enable F# seamless integration with OOP-heavy .NET frameworks and existing C# codebases. F# code implements ASP.NET Core controllers, Entity Framework models, and WPF ViewModels using class syntax while keeping domain and business logic in functional style. Teams adopt F# incrementally by adding F# class libraries to C# projects, leveraging functional correctness for algorithms while maintaining OOP-compatible interfaces for framework integration.

## Example 54: Object Programming - Interfaces

Interfaces define contracts for classes, enabling polymorphism and dependency injection.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[IShape interface]:::blue --> B[Circle implements]:::orange
    A --> C[Rectangle implements]:::teal
    B --> D[Area method]:::orange
    C --> E[Area method]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 54: Object Programming - Interfaces
type IShape =            // => Interface definition (contract, no implementation)
    abstract member Area : unit -> float
                         // => Abstract method signature: unit -> float
    abstract member Perimeter : unit -> float
                         // => Another abstract method signature

type Circle(radius: float) =
                         // => Class implementing IShape (radius is constructor param)
    interface IShape with // => Explicit interface implementation block
        member this.Area() =
            System.Math.PI * radius * radius
                         // => Area = π * r² (captures radius from constructor)
        member this.Perimeter() =
            2.0 * System.Math.PI * radius
                         // => Perimeter = 2πr

type Rectangle(width: float, height: float) =
                         // => Another IShape implementation
    interface IShape with
        member this.Area() =
            width * height // => Area = width * height
        member this.Perimeter() =
            2.0 * (width + height)
                         // => Perimeter = 2 * (w + h)

// Using interfaces:
let circle = Circle(5.0) :> IShape
                         // => Create Circle then upcast to IShape with :>
                         // => circle type is now IShape (not Circle)

let rect = Rectangle(4.0, 6.0) :> IShape
                         // => rect type is IShape (not Rectangle)

let shapes = [ circle; rect ]
                         // => Polymorphic list: both elements are IShape

for shape in shapes do   // => Iterate over IShape list (polymorphic dispatch)
    printfn "Area: %.2f, Perimeter: %.2f"
        (shape.Area())   // => Virtual dispatch: calls Circle.Area or Rectangle.Area
        (shape.Perimeter())
                         // => Outputs:
                         // => Area: 78.54, Perimeter: 31.42  (circle)
                         // => Area: 24.00, Perimeter: 20.00  (rectangle)

// Interface with properties:
type IPerson =           // => Interface with property signatures
    abstract member Name : string
                         // => Property (read-only, no unit parameter)
    abstract member Age : int
                         // => Another property

type Employee(name: string, age: int, salary: float) =
                         // => Implements IPerson plus has extra Salary member
    interface IPerson with
        member this.Name = name  // => Property implementation
        member this.Age = age    // => Property implementation

    member this.Salary = salary
                         // => Additional member NOT in IPerson interface

let emp = Employee("Bob", 35, 75000.0)
                         // => Concrete Employee instance

let person = emp :> IPerson
                         // => Upcast to IPerson (loses Salary visibility)

printfn "Person: %s, %d" person.Name person.Age
                         // => Outputs: Person: Bob, 35

// printfn "Salary: %.0f" person.Salary
                         // => COMPILE ERROR: Salary not in IPerson interface
```

**Key Takeaway**: Interfaces use `abstract member`. Classes implement with `interface IName with`. Upcast to interface with `:>`.

**Why It Matters**: Interfaces enable dependency injection and testability by abstracting dependencies behind contracts. Application layers depend on `IRepository` or `IEmailService` interfaces instead of concrete implementations, allowing test doubles to replace real databases or external services during unit testing. F# object expressions (Example 55) create lightweight interface implementations without class boilerplate, making DI in F# more concise than equivalent C# patterns.

## Example 55: Object Expressions

Object expressions create interface implementations inline without defining named classes.

```fsharp
// Example 55: Object Expressions
type ILogger =           // => Interface for logging
    abstract member Log : string -> unit
                         // => Log takes string, returns unit (void)

// Object expression implementing interface:
let consoleLogger =      // => Create ILogger implementation inline
    { new ILogger with   // => Object expression syntax: { new IType with ... }
        member this.Log(message) =
                         // => Implement interface member inline
            printfn "[LOG] %s" message }
                         // => Body: print message with [LOG] prefix
                         // => consoleLogger type: ILogger

consoleLogger.Log("Application started")
                         // => Outputs: [LOG] Application started

// Object expression with state:
let createCounter() =    // => Factory returning interface implementation
    let mutable count = 0// => Captured mutable state (closure variable)
    { new System.IDisposable with
                         // => Implement standard IDisposable interface
        member this.Dispose() =
                         // => Dispose member: called when resource released
            count <- count + 1
                         // => Increment captured counter (mutable state)
            printfn "Disposed %d times" count }
                         // => Returns IDisposable with captured state

let counter1 = createCounter()
                         // => counter1 type: IDisposable

counter1.Dispose()       // => Outputs: Disposed 1 times
counter1.Dispose()       // => Outputs: Disposed 2 times

let counter2 = createCounter()
                         // => Separate instance with own count (new closure)

counter2.Dispose()       // => Outputs: Disposed 1 times

// Passing object expression to function:
let useLogger (logger: ILogger) message =
                         // => Accepts any ILogger implementation
    logger.Log(message)  // => Dispatch through interface (polymorphic call)

useLogger consoleLogger "Processing data"
                         // => Outputs: [LOG] Processing data

useLogger
    { new ILogger with
                         // => Inline object expression as function argument
        member this.Log(msg) =
                         // => Different implementation: ERROR prefix
            printfn "[ERROR] %s" msg }
    "Something failed"   // => Inline object expression as argument
                         // => Outputs: [ERROR] Something failed
```

**Key Takeaway**: Object expressions use `{ new IInterface with members }` to create inline implementations without named classes.

**Why It Matters**: Object expressions enable lightweight, inline interface implementations without requiring named class definitions, reducing ceremony for single-use adapters and test doubles. GUI frameworks receive event listeners as object expressions without polluting namespaces with single-use classes. Unit tests create mock dependencies inline: `{ new IRepository with member _.GetUser id = Some testUser }` in a single line. This pattern is particularly valuable for testing code that depends on interfaces.

## Example 56: Discriminated Unions Advanced - Recursive Types

Recursive discriminated unions model tree and list structures naturally.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    A[BinaryTree]:::blue --> B[Empty]:::orange
    A --> C[Node of value * left * right]:::teal
    C --> D[Left subtree]:::purple
    C --> E[Right subtree]:::purple

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```fsharp
// Example 56: Discriminated Unions Advanced - Recursive Types
type BinaryTree<'T> =    // => Generic binary tree
    | Empty              // => Leaf case: no value
    | Node of value: 'T * left: BinaryTree<'T> * right: BinaryTree<'T>
                         // => Branch case: value + two subtrees
                         // => RECURSIVE: contains BinaryTree

// Building tree:
let tree =
    Node(10,             // => Root value: 10
        Node(5,          // => Left subtree root: 5
            Node(3, Empty, Empty),
                         // => Left-left: 3 (leaf)
            Node(7, Empty, Empty)),
                         // => Left-right: 7 (leaf)
        Node(15,         // => Right subtree root: 15
            Empty,       // => Right-left: empty
            Node(20, Empty, Empty)))
                         // => Right-right: 20 (leaf)

// Tree traversal (inorder):
let rec inorder tree =   // => Recursive tree traversal
    match tree with
    | Empty -> []        // => Base case: empty tree
    | Node(value, left, right) ->
        (inorder left) @ [value] @ (inorder right)
                         // => Inorder: left, value, right
                         // => @ is list concatenation

let sorted = inorder tree
                         // => sorted is [3; 5; 7; 10; 15; 20]
                         // => Inorder traversal of BST yields sorted sequence

printfn "Inorder: %A" sorted
                         // => Outputs: Inorder: [3; 5; 7; 10; 15; 20]

// Tree operations:
let rec contains value tree =
                         // => Search tree for value
    match tree with
    | Empty -> false     // => Not found
    | Node(v, left, right) ->
        if value = v then true
                         // => Found
        elif value < v then contains value left
                         // => Search left subtree
        else contains value right
                         // => Search right subtree

let has7 = contains 7 tree
                         // => has7 is true
let has99 = contains 99 tree
                         // => has99 is false

printfn "Contains 7: %b" has7
                         // => Outputs: Contains 7: true
printfn "Contains 99: %b" has99
                         // => Outputs: Contains 99: false

// Custom list type (demonstrating recursion):
type MyList<'T> =        // => Custom list implementation
    | Nil                // => Empty list
    | Cons of head: 'T * tail: MyList<'T>
                         // => Cons cell (like ::)

let myList = Cons(1, Cons(2, Cons(3, Nil)))
                         // => [1; 2; 3] in custom list

let rec myLength list =  // => Length function
    match list with
    | Nil -> 0           // => Empty: length 0
    | Cons(_, tail) ->   // => Cons: 1 + length of tail
        1 + myLength tail

let len = myLength myList
                         // => len is 3

printfn "MyList length: %d" len
                         // => Outputs: MyList length: 3
```

**Key Takeaway**: Recursive DUs reference themselves in case definitions. Perfect for tree/list structures. Pattern matching decomposes recursively.

**Why It Matters**: Recursive discriminated unions naturally model hierarchical data structures like trees, grammars, and nested documents. Compilers represent abstract syntax trees as recursive DUs, with pattern matching traversing them naturally - the code reads like grammar rules. JSON parsers model data as `type Json = JNull | JBool of bool | JNumber of float | JString of string | JArray of Json list | JObject of (string * Json) list`, enabling recursive processing with exhaustive case coverage.

## Example 57: Record Update Syntax - with Keyword

Records support functional updates creating new records with modified fields while sharing unchanged fields.

```fsharp
// Example 57: Record Update Syntax - with Keyword
type Person = {          // => Record type with four fields
    FirstName: string    // => String field
    LastName: string     // => String field
    Age: int             // => Integer field
    City: string         // => String field
}

let alice = {            // => Create initial record
    FirstName = "Alice"  // => Assign string field
    LastName = "Smith"   // => Assign string field
    Age = 30             // => Assign int field
    City = "Jakarta"     // => Assign string field
}                        // => alice type: Person (immutable record)

printfn "%A" alice       // => Outputs: { FirstName = "Alice"; LastName = "Smith"; Age = 30; City = "Jakarta" }

// Update single field:
let aliceOlder = { alice with Age = 31 }
                         // => { record with Field = newValue } syntax
                         // => Copy alice, change Age to 31
                         // => FirstName, LastName, City unchanged
                         // => Original alice unmodified (immutable)

printfn "%A" aliceOlder  // => Outputs: { FirstName = "Alice"; LastName = "Smith"; Age = 31; City = "Jakarta" }

// Update multiple fields:
let aliceMoved = { alice with Age = 32; City = "Bandung" }
                         // => Multiple fields separated by semicolon
                         // => Copy alice, change Age and City
                         // => FirstName, LastName unchanged

printfn "%A" aliceMoved  // => Outputs: { FirstName = "Alice"; LastName = "Smith"; Age = 32; City = "Bandung" }

// Chaining updates:
let aliceRenamed = { alice with FirstName = "Alicia" }
                         // => Change first name; new record created

let aliceRenamedMoved = { aliceRenamed with City = "Surabaya" }
                         // => Chain updates (immutable style): base is aliceRenamed

printfn "%A" aliceRenamedMoved
                         // => Outputs: { FirstName = "Alicia"; LastName = "Smith"; Age = 30; City = "Surabaya" }

// Original unchanged:
printfn "Original alice: %A" alice
                         // => Outputs: Original alice: { FirstName = "Alice"; LastName = "Smith"; Age = 30; City = "Jakarta" }
                         // => All updates created NEW records; alice unchanged

// Functional state management:
let updateAge person newAge =
                         // => Generic update function (works on any Person)
    { person with Age = newAge }
                         // => Returns new Person with updated Age field

let aliceAt35 = updateAge alice 35
                         // => aliceAt35 is new record with Age=35

printfn "Alice at 35: %A" aliceAt35
                         // => Outputs: Alice at 35: { FirstName = "Alice"; LastName = "Smith"; Age = 35; City = "Jakarta" }
```

**Key Takeaway**: Use `{ record with Field = value }` to create updated copies. Original record unchanged. Multiple fields updatable.

**Why It Matters**: Record update syntax enables functional state management where each state transition produces a new immutable state, preserving history without additional infrastructure. Redux-style state stores use record updates to produce new application states, naturally supporting time-travel debugging and undo/redo since previous states are never mutated. Event sourcing systems apply event records to state records using `{ state with ... }` syntax, making each transition explicit and reversible.

## Example 58: Pattern Matching Guards

Guards add conditional logic to pattern matching, enabling fine-grained case discrimination.

```fsharp
// Example 58: Pattern Matching Guards
let categorizeNumber n = // => Function classifying numbers into ranges
    match n with
    | 0 -> "zero"        // => Literal pattern: exactly 0
    | n when n < 0 ->    // => Guard: when condition
        "negative"       // => n is bound, accessible in guard expression
    | n when n < 10 ->   // => Another guard: 1-9
        "small positive" // => n bound to matched value (e.g., 7)
    | n when n < 100 ->  // => Guard: 10-99
        "medium positive"// => n is bound to value in range
    | _ ->               // => Wildcard: all remaining (>=100)
        "large positive"

printfn "%s" (categorizeNumber 0)
                         // => Outputs: zero
printfn "%s" (categorizeNumber -5)
                         // => Outputs: negative
printfn "%s" (categorizeNumber 7)
                         // => Outputs: small positive
printfn "%s" (categorizeNumber 50)
                         // => Outputs: medium positive
printfn "%s" (categorizeNumber 200)
                         // => Outputs: large positive

// Guards with deconstruction:
let analyzeList list =   // => Guards can combine with list deconstruction
    match list with
    | [] -> "empty"      // => Empty list pattern
    | [x] when x > 0 ->  // => Single-element list with guard: positive
        "single positive"
    | [x] when x < 0 ->  // => Single element: negative
        "single negative"
    | [x] ->             // => Single element (any value, x=0 here)
        "single zero"
    | head :: tail when head = 0 ->
                         // => Deconstruct AND guard: starts with 0
        "starts with zero"
    | head :: tail when List.length tail > 5 ->
                         // => Guard calling function: long list (>6 total)
        "long list"
    | _ ->               // => Catch-all remaining cases
        "other list"

printfn "%s" (analyzeList [])
                         // => Outputs: empty
printfn "%s" (analyzeList [5])
                         // => Outputs: single positive
printfn "%s" (analyzeList [-3])
                         // => Outputs: single negative
printfn "%s" (analyzeList [0; 1; 2])
                         // => Outputs: starts with zero
printfn "%s" (analyzeList [1; 2; 3; 4; 5; 6; 7])
                         // => Outputs: long list

// Complex guards:
let analyzePair (x, y) = // => Guards on tuple deconstruction
    match (x, y) with
    | (a, b) when a = b ->
                         // => Both equal: a and b bound from tuple
        "equal"          // => Returns "equal" for (5,5), (0,0), etc.
    | (a, b) when a + b = 10 ->
                         // => Sum guard: a+b must equal 10
        "sum to 10"      // => Matches (3,7), (8,2), etc.
    | (a, b) when a > b ->
                         // => First larger: a > b
        "first larger"   // => Matches (8,3), (10,2), etc.
    | _ ->               // => Remaining: second >= first
        "second larger or equal"

printfn "%s" (analyzePair (5, 5))
                         // => Outputs: equal
printfn "%s" (analyzePair (3, 7))
                         // => Outputs: sum to 10
printfn "%s" (analyzePair (8, 3))
                         // => Outputs: first larger
```

**Key Takeaway**: Use `when` clause after pattern for conditional matching. Guards can reference bound values and call functions.

**Why It Matters**: Pattern matching guards enable complex conditional matching that reads like natural language specifications without deeply nested if/else chains. Business rule engines express discount policies declaratively: `| Order amount when amount > 10000 -> ApplyBulkDiscount | Order amount when amount > 1000 -> ApplyTierDiscount`. Guards combine with deconstruction patterns to express complex conditions on extracted values, making rule logic self-documenting and exhaustively checked by the compiler.

## Example 59: Function Patterns - Pattern Matching in Parameters

Functions can pattern match directly in parameter position, eliminating explicit match expressions.

```fsharp
// Example 59: Function Patterns - Pattern Matching in Parameters
let isEmptyList = function
                         // => function keyword enables pattern matching
                         // => Equivalent to: fun list -> match list with
    | [] -> true         // => Empty list case: returns true
    | _ -> false         // => Non-empty case: returns false

printfn "[] empty: %b" (isEmptyList [])
                         // => Outputs: [] empty: true
printfn "[1] empty: %b" (isEmptyList [1])
                         // => Outputs: [1] empty: false

// Multiple cases:
let describeList = function
                         // => function with multiple patterns
    | [] -> "empty"      // => Empty list: returns "empty"
    | [x] -> sprintf "single: %d" x
                         // => Single element list: binds x, returns "single: x"
    | [x; y] -> sprintf "pair: %d, %d" x y
                         // => Two-element list: binds x and y
    | head :: tail -> sprintf "list starting with %d" head
                         // => Head :: tail pattern: binds head and tail

printfn "%s" (describeList [])
                         // => Outputs: empty
printfn "%s" (describeList [42])
                         // => Outputs: single: 42
printfn "%s" (describeList [1; 2])
                         // => Outputs: pair: 1, 2
printfn "%s" (describeList [1; 2; 3; 4])
                         // => Outputs: list starting with 1

// Pattern matching with tuples:
let addPair = function   // => Pattern match on tuple argument
    | (x, y) -> x + y    // => Deconstruct tuple in pattern; returns sum

let sum = addPair (10, 20)
                         // => sum is 30

printfn "Sum: %d" sum    // => Outputs: Sum: 30

// Multiple parameters with pattern matching:
let rec listSum list =   // => Recursive list sum using match expression
    match list with
    | [] -> 0            // => Base case: empty list sums to 0
    | head :: tail -> head + listSum tail
                         // => Recursive case: head + sum of tail

// Equivalent using function keyword:
let rec listSum2 = function
                         // => Same logic as listSum but with function keyword
    | [] -> 0            // => Base case
    | head :: tail -> head + listSum2 tail
                         // => Recursive: identical behavior to listSum

let total1 = listSum [1; 2; 3; 4; 5]
                         // => total1 is 15
let total2 = listSum2 [1; 2; 3; 4; 5]
                         // => total2 is 15 (same result, different syntax)

printfn "Total1: %d" total1
                         // => Outputs: Total1: 15
printfn "Total2: %d" total2
                         // => Outputs: Total2: 15

// Option pattern:
let describeOption = function
                         // => Pattern match on option type
    | Some value -> sprintf "Value: %d" value
                         // => Some case: unwraps value and formats
    | None -> "No value" // => None case: returns placeholder string

printfn "%s" (describeOption (Some 42))
                         // => Outputs: Value: 42
printfn "%s" (describeOption None)
                         // => Outputs: No value
```

**Key Takeaway**: Use `function` keyword for single-parameter pattern matching. Eliminates explicit match expression. Concise for simple matches.

**Why It Matters**: The `function` keyword reduces boilerplate for single-argument pattern matching functions, making list processing and option handling more concise. Consistent use of `function | [] -> ... | head :: tail -> ...` across a codebase creates recognizable patterns that experienced F# developers read fluently. The pattern is particularly valued for short utility functions where the explicit `match x with` form adds ceremony without clarity. Functions with `function` compose naturally with `|>` pipelines.

## Example 60: Collection Functions - choose, collect, partition, groupBy

Advanced collection functions enable complex transformations beyond map/filter/fold.

```fsharp
// Example 60: Collection Functions - choose, collect, partition, groupBy
let numbers = [1; 2; 3; 4; 5; 6; 7; 8; 9; 10]

// choose: map + filter combined
let evenSquares = numbers
                  |> List.choose (fun x ->
                      if x % 2 = 0 then Some (x * x)
                                     // => Keep even, square it
                      else None)     // => Discard odd
                         // => choose applies function returning option
                         // => Keeps only Some values, unwraps them
                         // => evenSquares is [4; 16; 36; 64; 100]

printfn "Even squares: %A" evenSquares
                         // => Outputs: Even squares: [4; 16; 36; 64; 100]

// collect: flatMap (map + flatten)
let pairs = [1; 2; 3]
            |> List.collect (fun x ->
                [x; x * 10])
                         // => Each element produces list
                         // => collect flattens results
                         // => pairs is [1; 10; 2; 20; 3; 30]

printfn "Pairs: %A" pairs
                         // => Outputs: Pairs: [1; 10; 2; 20; 3; 30]

let nestedFlattened = [[1; 2]; [3; 4]; [5; 6]]
                      |> List.collect id
                         // => id is identity function (returns input)
                         // => Flattens nested lists
                         // => nestedFlattened is [1; 2; 3; 4; 5; 6]

printfn "Flattened: %A" nestedFlattened
                         // => Outputs: Flattened: [1; 2; 3; 4; 5; 6]

// partition: split into two lists based on predicate
let evens, odds = numbers |> List.partition (fun x -> x % 2 = 0)
                         // => Returns tuple (true list, false list)
                         // => evens is [2; 4; 6; 8; 10]
                         // => odds is [1; 3; 5; 7; 9]

printfn "Evens: %A" evens
                         // => Outputs: Evens: [2; 4; 6; 8; 10]
printfn "Odds: %A" odds  // => Outputs: Odds: [1; 3; 5; 7; 9]

// groupBy: group elements by key
let grouped = numbers
              |> List.groupBy (fun x -> x % 3)
                         // => Groups by remainder when divided by 3
                         // => Returns (key * element list) list
                         // => grouped is [(0, [3;6;9]); (1, [1;4;7;10]); (2, [2;5;8])]

for (key, group) in grouped do
    printfn "Mod 3 = %d: %A" key group
                         // => Outputs:
                         // => Mod 3 = 1: [1; 4; 7; 10]
                         // => Mod 3 = 2: [2; 5; 8]
                         // => Mod 3 = 0: [3; 6; 9]

// Combining operations:
let result = numbers
             |> List.filter (fun x -> x > 3)
                         // => Keep > 3: [4; 5; 6; 7; 8; 9; 10]
             |> List.partition (fun x -> x % 2 = 0)
                         // => Split: ([4;6;8;10], [5;7;9])
             |> fun (evens, odds) ->
                 (List.sum evens, List.sum odds)
                         // => Sum each partition
                         // => result is (28, 21)

printfn "Sums (evens, odds): %A" result
                         // => Outputs: Sums (evens, odds): (28, 21)

// Real-world example: processing transaction data
type Transaction = { Id: int; Amount: float; Category: string }

let transactions = [
    { Id = 1; Amount = 100.0; Category = "Food" }
    { Id = 2; Amount = 50.0; Category = "Transport" }
    { Id = 3; Amount = 200.0; Category = "Food" }
    { Id = 4; Amount = 75.0; Category = "Entertainment" }
    { Id = 5; Amount = 150.0; Category = "Food" }
]

let totalsByCategory = transactions
                       |> List.groupBy (fun t -> t.Category)
                         // => Group by category
                       |> List.map (fun (category, txns) ->
                           (category, txns |> List.sumBy (fun t -> t.Amount)))
                         // => Sum amounts per category
                       |> Map.ofList
                         // => Convert to map for lookup

for kvp in totalsByCategory do
    printfn "%s: %.2f" kvp.Key kvp.Value
                         // => Outputs:
                         // => Food: 450.00
                         // => Transport: 50.00
                         // => Entertainment: 75.00
```

**Key Takeaway**: `choose` combines map+filter, `collect` flattens mapped results, `partition` splits by predicate, `groupBy` groups by key function.

**Why It Matters**: Advanced collection functions eliminate manual loop and accumulator patterns, expressing complex data transformations declaratively. Financial reporting pipelines group transactions by category, partition by date range, flatten nested collections with `collect`, and filter with `choose` in a single pipeline expression. This replaces 50+ lines of imperative accumulation code with 3-4 readable pipeline stages. The resulting code is easier to modify when reporting requirements change.

---

## Next Steps

Continue to **Advanced** (Examples 61-90+) to learn:

- Advanced async patterns (cancellation tokens, parallel workflows)
- Metaprogramming with quotations
- Computation expression builders (custom workflows)
- Type-level programming
- Advanced interop (P/Invoke, COM)
- Performance optimization patterns
- Concurrency primitives (agents, MailboxProcessor)
- LINQ expression integration
- Advanced type providers

These 30 intermediate examples (Examples 31-60) cover **40-75% of F#'s features**, building on beginner fundamentals with production-ready patterns. The remaining 25-60% (advanced) covers specialized features for expert scenarios.
