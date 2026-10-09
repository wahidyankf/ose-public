---
title: "Advanced Examples"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 30
---

Each snippet is a complete `Program.cs` for a console project. Run it with `dotnet run` after replacing the generated source; the final example points to the complete capstone project and its test suite.

## Example 55: switch expression

_ex-55 · exercises co-20_

This `switch` expression returns a value by selecting the matching relational-pattern arm. Since 82 satisfies the first arm, the expression yields `distinction`.

```csharp
var score = 82; // => 82 satisfies the first relational arm
var result = score switch // => classifies score 82
{
    >= 80 => "distinction", // => 82 satisfies this arm, yielding distinction
    >= 50 => "pass", // => scores 50 through 79 yield pass
    _ => "retry", // => scores below 50 yield retry
};
Console.WriteLine(result); // => Output: distinction
```

**Key takeaway:** a `switch` expression maps a value to exactly one result and makes its fallback arm explicit.

**Why it matters:** Pattern arms scale more clearly than nested conditionals when a domain has
several classifications to maintain. A switch expression selects one result from several pattern
arms, keeping a classification rule in one place. It reads more clearly than nested ternaries once
the cases multiply. Check the fallback arm carefully: it should represent a deliberate rule for
unmatched input rather than silently hiding a new domain state.

## Example 56: is pattern

_ex-56 · exercises co-20_

The type pattern both verifies that `value` is an `int` and binds that integer as `number`. Inside the true branch, `number` is already typed as `int`.

```csharp
object value = 7; // => boxed integer 7 can bind to an int pattern
if (value is int number) // => binds the matched integer as number
    Console.WriteLine(number * 2); // => Output: 14
```

**Key takeaway:** `is int number` replaces a type check plus cast with one safe, scoped binding.

**Why it matters:** Type patterns make runtime shape checks explicit without risking invalid casts.
An is pattern tests the runtime type and introduces a typed variable only in the matching branch.
This avoids an unsafe cast after inspecting a broad object value. It is useful at a boundary that
genuinely receives several shapes; within a strongly typed domain model, prefer preserving the more
specific type earlier.

## Example 57: property pattern

_ex-57 · exercises co-20_

The property pattern checks `Point.X` declaratively without manually reading the property first. A point with X equal to zero takes the `axis` branch regardless of Y.

```csharp
var point = new Point(0, 4); // => Point has X 0 and Y 4
Console.WriteLine(point is { X: 0 } ? "axis" : "other"); // => Output: axis

record Point(int X, int Y); // => provides X and Y for the property pattern
```

**Key takeaway:** property patterns match values by the members relevant to the decision.

**Why it matters:** They keep classification logic close to the data shape and avoid nested
property-check conditionals. A property pattern states a condition about an object's members without
a chain of temporary variables. It can make a short classification easy to scan, such as deciding
whether a point lies on an axis. Keep patterns shallow enough that readers can still tell which
property failed to match.

## Example 58: tuple pattern

_ex-58 · exercises co-20_

The tuple switch matches both coordinates together, including a discard for any vertical move. The first coordinate selects the vertical arm, while `_` accepts any second coordinate.

```csharp
var move = (0, 1); // => tuple holds coordinates 0 and 1
var label = move switch // => matches both tuple positions
{
    (0, 0) => "still", // => origin maps to still
    (0, _) => "vertical", // => first coordinate 0 maps to vertical
    _ => "other", // => remaining moves map to other
}; // => vertical arm wins for this tuple
Console.WriteLine(label); // => Output: vertical
```

**Key takeaway:** tuple patterns classify several related values in one ordered set of cases.

**Why it matters:** Matching a combined state prevents a maze of conditions that forget how
individual values interact. A tuple pattern treats two related inputs as one classification
decision. This helps when the result depends on a combination, such as direction and amount, rather
than either value alone. Write explicit arms for meaningful combinations and review the fallback so
an unhandled state does not receive a misleading label.

## Example 59: try and catch

_ex-59 · exercises co-21_

The risky parse throws `FormatException`, and the matching `catch` turns that failure into a controlled result. The catch runs for the parse failure and prints `invalid`.

```csharp
try // => begins the protected parse
{
    int.Parse("nope"); // => throws FormatException for nonnumeric text
} // => FormatException transfers control to catch
catch (FormatException) // => handles only format errors
{
    Console.WriteLine("invalid"); // => Output: invalid
}
```

**Key takeaway:** `try` encloses the operation that can fail, while `catch` handles the expected failure type.

**Why it matters:** Narrow exception handling preserves useful failure information without letting
malformed input terminate a whole workflow. A catch block should handle a failure it can translate
into a useful outcome. In this example malformed numeric text becomes a clear message instead of
terminating the command. Narrow the protected operation and exception type; a broad catch can
accidentally disguise a programming defect as ordinary bad input.

## Example 60: specific exception

_ex-60 · exercises co-21_

The catch names `InvalidOperationException`, so it handles the known closed-state failure without swallowing unrelated errors. The exception message survives through the named catch variable.

```csharp
try // => begins the protected operation
{
    throw new InvalidOperationException("closed"); // => throws with the message closed
} // => InvalidOperationException transfers control to catch
catch (InvalidOperationException error) // => binds the matching exception as error
{
    Console.WriteLine(error.Message); // => Output: closed
}
```

**Key takeaway:** catch the most specific exception that the local code can genuinely recover from.

**Why it matters:** Specific catches keep programming defects and infrastructure failures visible
instead of misreporting them as normal input problems. Catching InvalidOperationException separately
makes the expected failure visible without also swallowing unrelated faults. That distinction
matters when an application reports an input problem to a user but should still surface a broken
invariant for investigation. Add context at the boundary where the caller can act, not at every
stack frame.

## Example 61: finally block

_ex-61 · exercises co-21_

The `finally` block runs after the protected work regardless of whether that work completes or throws. The two print statements reveal the order of normal work and cleanup.

```csharp
try // => runs protected work before cleanup
{
    Console.WriteLine("work"); // => Output: work
}
finally // => runs even if protected work throws
{
    Console.WriteLine("cleanup"); // => Output: cleanup
}
```

**Key takeaway:** `finally` is the guaranteed cleanup path associated with a `try` block.

**Why it matters:** Reliable cleanup protects resource lifetimes when an operation has more than one
exit path. Finally runs when control leaves the try block, including after an exception, which makes
it suitable for cleanup that must happen on several paths. Prefer using and await using for
disposable resources when available, because they encode the lifetime more directly. This example
isolates the ordering before resources add complexity.

## Example 62: custom exception

_ex-62 · exercises co-21_

`BalanceException` names a domain-specific failure, and the catch preserves its explanatory message. The custom type lets the catch distinguish this failure from other exceptions.

```csharp
try // => begins the protected withdrawal
{
    throw new BalanceException("insufficient"); // => throws the domain-specific error
} // => BalanceException transfers control to catch
catch (BalanceException e) // => handles this exception type
{
    Console.WriteLine(e.Message); // => Output: insufficient
}

class BalanceException(string message) : Exception(message); // => passes the message to Exception
```

**Key takeaway:** a custom exception type distinguishes a meaningful domain failure from generic runtime errors.

**Why it matters:** Callers can handle an expected business rule separately from parsing, network,
or programming failures. A named exception type lets callers distinguish a business rule failure
from parsing or infrastructure faults. The caller can translate that one case into a helpful
response while preserving other failures for diagnosis. Create a custom type when callers truly need
this distinction; a unique message string alone is a fragile contract.

## Example 63: throw expression

_ex-63 · exercises co-21, co-11_

The null-coalescing expression either supplies a valid input or throws immediately at the boundary. Because the input is null, the throw expression runs before `name` is assigned.

```csharp
string? input = null; // => nullable input is currently missing
try // => begins the null guard
{
    var name = input ?? throw new ArgumentNullException(); // => null input triggers the throw expression
} // => throw expression transfers control to catch
catch (ArgumentNullException) // => handles the missing argument
{
    Console.WriteLine("required"); // => Output: required
}
```

**Key takeaway:** `?? throw` states that a required value must be present before subsequent code runs.

**Why it matters:** Failing close to the invalid input prevents nullable uncertainty from spreading
through unrelated logic. A throw expression can reject invalid construction at the point where a
value is required. That leaves the object with a clear invariant and prevents nullable uncertainty
from leaking into every later method. State the reason in the exception and test the invalid path,
because a compact expression can otherwise hide an important failure rule.

## Example 64: async method

_ex-64 · exercises co-22_

The `async Task` method awaits its operation and completes only after writing its result. The caller waits for the method task to finish before its own completion.

```csharp
await ReportAsync(); // => caller waits until done has been printed
static async Task ReportAsync() // => returns a Task for this operation
{
    await Task.Delay(1); // => yields until the delay completes
    Console.WriteLine("done"); // => Output: done
}
```

**Key takeaway:** an `async Task` represents asynchronous completion without a result value.

**Why it matters:** Returning `Task` lets callers await the real completion boundary instead of
guessing when background work ends. A Task-returning method exposes completion to its caller, which
can await it and observe a failure. A void-returning asynchronous helper would make that boundary
harder to control outside event handlers. The example uses a tiny delay to make the sequence
visible; real asynchronous work commonly waits on I/O rather than consuming a worker thread while it
waits.

The [C# asynchronous programming guide](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/) explains task completion and awaiting.

## Example 65: await a task

_ex-65 · exercises co-22_

`await` pauses this method's continuation until `ReadAsync` supplies its text result. The caller then prints `ready` as a string rather than handling a `Task<string>` directly.

```csharp
var text = await ReadAsync(); // => await unwraps the returned text ready
Console.WriteLine(text); // => Output: ready
static async Task<string> ReadAsync() // => returns a Task of string
{
    await Task.Delay(1); // => yields before producing text
    return "ready"; // => supplies ready to the caller
}
```

**Key takeaway:** awaiting `Task<T>` unwraps its eventual `T` while preserving asynchronous control flow.

**Why it matters:** Awaiting keeps result-dependent code ordered without blocking a thread during
I/O or other asynchronous work. Await pauses the method until its task completes, then continues
with a result or propagates the task's failure. This keeps dependent steps in the right order
without a blocking wait. It does not mean every operation is parallel; two consecutive awaits can
still be sequential when the second depends on the first.

## Example 66: async return value

_ex-66 · exercises co-22_

The method computes an integer asynchronously and returns its eventual value as `Task<int>`. `await` unwraps the task result so the caller receives the integer five.

```csharp
var sum = await AddAsync(2, 3); // => await unwraps the integer result 5
Console.WriteLine(sum); // => Output: 5
static async Task<int> AddAsync(int a, int b) // => returns a Task of int
{
    await Task.Delay(1); // => yields before computing the sum
    return a + b; // => returns 2 + 3 to the caller
}
```

**Key takeaway:** `Task<T>` makes both the pending operation and its eventual result part of the method signature.

**Why it matters:** The type forces callers to decide when and where to await a result instead of
accidentally treating it as immediate. Task<T> tells callers that a value will arrive after
asynchronous work completes. They cannot safely use that value as if it were an immediate T; they
need an await boundary. This matters in service and UI code where a missing await can expose
incomplete work or unobserved failures.

## Example 67: non-blocking await

_ex-67 · exercises co-22_

The caller starts `LaterAsync`, prints `started`, and then awaits its result. This guarantees the displayed order of the two print statements, regardless of whether the short delay has already completed.

```csharp
var task = LaterAsync(); // => task begins before started is printed
Console.WriteLine("started"); // => Output: started
Console.WriteLine(await task); // => Output: finished
static async Task<string> LaterAsync() // => starts an operation returning a string task
{
    await Task.Delay(1); // => awaits a short delay before returning
    return "finished"; // => supplies finished after the delay
}
```

**Key takeaway:** `await` can suspend an async method when its task is incomplete; it does not require blocking the caller's thread.

**Why it matters:** This behavior keeps responsive applications free to process other work while an
asynchronous dependency is pending. While a method awaits an incomplete task, its caller's thread
need not remain blocked on that wait. A UI can remain responsive or a server can serve other work.
The two print statements show their own source order. A one-millisecond delay cannot reliably
prove that the task was still pending when `started` printed, and async work need not create a new
thread.

## Example 68: multiple awaits

_ex-68 · exercises co-22_

The second call starts after the first await and print, so these independent operations run sequentially. Both awaited calls finish in source order, producing `one` before `two`.

```csharp
Console.WriteLine(await StepAsync("one")); // => Output: one
Console.WriteLine(await StepAsync("two")); // => Output: two
static async Task<string> StepAsync(string x) // => returns the input after an asynchronous delay
{
    await Task.Delay(1); // => first call completes before the second starts
    return x; // => returns the current label
}
```

**Key takeaway:** consecutive awaits impose order; start independent tasks before awaiting them together when concurrency is intended.

**Why it matters:** Separating sequential work from independent work helps select `await` or
`Task.WhenAll` for the correct semantics. Consecutive awaits express a dependency when the second
operation needs the first result or must follow it. Independent tasks can be started first and
joined later, but doing that changes failure and concurrency behavior. This example makes the
sequence explicit so you can decide whether the operations truly depend on each other.

## Example 69: Task.WhenAll

_ex-69 · exercises co-22_

`Task.WhenAll` waits for both independent fetches and returns their results in the input task order. The output preserves the order in which the two tasks were supplied.

```csharp
var values = await Task.WhenAll(GetAsync(1), GetAsync(2)); // => both task results become available together
Console.WriteLine(string.Join(",", values)); // => Output: 1,2
static async Task<int> GetAsync(int x) // => returns one integer asynchronously
{
    await Task.Delay(1); // => both tasks may advance before the join
    return x; // => returns each task input
}
```

**Key takeaway:** `Task.WhenAll` expresses that several operations may run concurrently but must all complete before continuing.

**Why it matters:** Task.WhenAll provides one completion point for independently started operations
and returns results in the input task order. This can reduce elapsed time when each task waits on
separate work, while still giving the caller a clear place to observe failure. Concurrency is
bounded by real resources, so a service should avoid launching an unlimited set of requests and
should carry cancellation where appropriate.

## Example 70: async exception

_ex-70 · exercises co-22, co-21_

The exception stored in the faulted task is rethrown at the `await`, where the caller can handle it. The catch surrounds the await because that is where the task failure surfaces.

```csharp
try // => begins protected asynchronous work
{
    await FailAsync(); // => rethrows the task failure at await
} // => faulted task rethrows at the await
catch (InvalidOperationException) // => handles the expected operation error
{
    Console.WriteLine("handled"); // => Output: handled
}
static async Task FailAsync() // => returns a task that will fault
{
    await Task.Delay(1); // => yields before the failure
    throw new InvalidOperationException(); // => faults with InvalidOperationException
}
```

**Key takeaway:** asynchronous exceptions follow the task and are observed by awaiting it.

**Why it matters:** Putting the `try`/`catch` around `await` handles the actual asynchronous failure
rather than only task creation. An exception raised inside a task is observed when the task is
awaited. A try block around task creation alone may miss the later failure. Place the catch at the
await boundary that has enough context to decide whether to retry, report, or propagate, and catch
the specific expected exception.

The [C# asynchronous programming guide](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/) explains how awaited tasks surface exceptions.

## Example 71: LINQ aggregate

_ex-71 · exercises co-17_

`Sum` reduces the sequence of integers to one total using LINQ's aggregate operation. The output verifies the total calculated over the source elements.

```csharp
var values = new[] { 1, 2, 3 }; // => three integers sum to 6
Console.WriteLine(values.Sum()); // => Output: 6
```

**Key takeaway:** aggregation turns many values into one result, such as a total, count, minimum, or maximum.

**Why it matters:** Aggregates make report calculations declarative and avoid manual accumulator
loops when the intent is standard. Aggregate expresses a fold over a sequence with a seed and
accumulator. A total or report calculation can use it without a manually updated local variable,
making the combination rule explicit. For common numeric sums, Sum may read more clearly; this
example teaches the general aggregation shape used by other calculations.

## Example 72: generic LINQ combination

_ex-72 · exercises co-15, co-17_

The generic method filters null class references and returns the remaining elements as a typed LINQ sequence. The type constraint limits this helper to reference types that can be null.

```csharp
Console.WriteLine(string.Join(",", NonNull(new string?[] { "a", null, "b" }))); // => Output: a,b
static IEnumerable<T> NonNull<T>(IEnumerable<T?> xs) // => returns an enumerable of non-null T
    where T : class => xs.Where(x => x is not null).Select(x => x!); // => filters nulls before the non-null assertion
```

**Key takeaway:** generics and LINQ compose when a reusable query must preserve the caller's element type.

**Why it matters:** A single null-filtering helper can serve many reference types without weakening
results to `object` or casts. A generic helper can filter nulls while preserving the element type of
the remaining values. That keeps callers from converting everything to object and casting later.
State the constraint that makes nullable reference handling valid, and test both present and missing
inputs so the helper does not silently lose valid data.

## Example 73: record pattern match

_ex-73 · exercises co-12, co-20_

The switch inspects the record's `Ok` property and chooses a result without manually unpacking the record. The `Ok` property decides which switch arm supplies the displayed status.

```csharp
var result = new Result(true, "saved"); // => record has Ok true and Message saved
Console.WriteLine( // => writes the selected switch result
    result switch // => inspects the Result record
    {
        { Ok: true } => "ok", // => true Ok chooses ok
        _ => "retry", // => other states choose retry
    }
); // => Output: ok

record Result(bool Ok, string Message); // => defines the Ok and Message properties
```

**Key takeaway:** property patterns let records participate directly in domain-state decisions.

**Why it matters:** Pattern matching keeps result handling exhaustive-looking and close to the shape
that produced it. A record pattern can classify a data shape and bind the values a branch needs.
This keeps a result's data close to the handling rule and avoids repeated casts or property checks.
Review unmatched cases explicitly; an apparently exhaustive switch may still need a fallback when
its input type permits other values.

## Example 74: nullable LINQ

_ex-74 · exercises co-05, co-17_

The query filters null entries before dereferencing each remaining name to calculate its length. The filtered sequence contains only values safe for the following length projection.

```csharp
string?[] names = ["Ada", null, "Lin"]; // => array includes one null among two names
var sizes = names.Where(x => x is not null).Select(x => x!.Length); // => filter removes null before reading lengths
Console.WriteLine(string.Join(",", sizes)); // => Output: 3,3
```

**Key takeaway:** establish non-nullness with `Where` before projecting nullable elements into non-null operations.

**Why it matters:** Null-safe sequence processing prevents one incomplete record from turning a
whole report into a runtime failure. A nullable projection should decide how missing elements affect
a report: skip them, use a fallback, or surface an error. The example chooses a safe rule before
formatting the sequence, preventing one absent value from crashing the entire output. Make that
choice visible because silently dropping records may be wrong for auditing or billing.

## Example 75: generic interface

_ex-75 · exercises co-08, co-15_

`IRepository<string>` describes a storage seam whose returned elements remain strongly typed. The generic type argument carries the element type through the interface call.

```csharp
IRepository<string> repo = new MemoryRepository<string>(["Ada"]); // => repository contains the string Ada
Console.WriteLine(repo.All().Single()); // => Output: Ada

interface IRepository<T> // => declares a typed repository contract
{
    IEnumerable<T> All(); // => returns elements of type T
}

class MemoryRepository<T>(IEnumerable<T> xs) : IRepository<T> // => generic class satisfies the repository contract
{
    public IEnumerable<T> All() => xs; // => returns the captured sequence
}
```

**Key takeaway:** a generic interface gives one abstraction a consistent contract across many domain types.

**Why it matters:** Typed repository seams make swapping storage implementations possible without
reducing everything to untyped objects. A generic repository interface preserves the record type
across storage implementations. A caller can depend on a typed capability while tests provide a
deterministic in-memory version. Keep the interface small and aligned with the consumer's needs;
broad generic repositories can obscure domain rules and leak storage assumptions.

## Example 76: async LINQ pipeline

_ex-76 · exercises co-22, co-17_

The program awaits the asynchronous fetch before applying a normal in-memory LINQ filter to its result. The predicate retains 2 and 3 from the returned array, so the output demonstrates where the async boundary ends.

```csharp
var values = await FetchAsync(); // => await yields the fetched array 1, 2, 3
Console.WriteLine(string.Join(",", values.Where(x => x > 1))); // => Output: 2,3
static async Task<int[]> FetchAsync() // => returns an asynchronous integer array
{
    await Task.Delay(1); // => yields before the array is available
    return [1, 2, 3]; // => supplies 1, 2, and 3
}
```

**Key takeaway:** await the asynchronous boundary first, then use LINQ over the materialized values unless an async-query API is intended.

**Why it matters:** Keeping the async boundary visible avoids implying that ordinary
`IEnumerable<T>` operators themselves perform asynchronous I/O. Fetching values is asynchronous, but
ordinary IEnumerable<T> LINQ operators in the example run after the awaited array arrives. That
distinction matters when reading a pipeline: Where does not itself perform network I/O here. Keep
the await close to the fetch and name the in-memory transformation separately when the boundary is
easy to confuse.

## Example 77: domain model slice

_ex-77 · exercises co-07, co-12, co-08_

The record carries a notification value, the interface defines delivery, and the class supplies one concrete delivery behavior. The call site depends on the interface while the concrete class writes the notice.

```csharp
INotifier notifier = new ConsoleNotifier(); // => interface reference holds ConsoleNotifier
notifier.Send(new Notice("Saved")); // => Output: Saved

record Notice(string Text); // => stores the notification text

interface INotifier // => declares delivery through an interface
{
    void Send(Notice n); // => accepts a Notice value
}

class ConsoleNotifier : INotifier // => concrete class supplies the Send behavior
{
    public void Send(Notice n) => Console.WriteLine(n.Text); // => prints the notice text
}
```

**Key takeaway:** records, interfaces, and classes each have distinct roles in a small domain model.

**Why it matters:** Separating data from a capability and its implementation keeps future delivery
channels from leaking into the model. A domain record can hold data while an interface describes a
capability and a class provides the effectful implementation. This separation lets a future UI or
storage adapter change without rewriting the core data shape. The example is intentionally small so
you can see which part owns each decision before adding a framework.

## Example 78: capstone CLI

_ex-78 · exercises co-05, co-12, co-16, co-08, co-22, co-01_

The complete capstone combines a nullable-aware lookup, records, a query-syntax LINQ report, an interface seam, and an awaited operation. The missing lookup remains null and is omitted from the report by the query filter.

```csharp
ICatalog catalog = new MemoryCatalog([new Product("A", "Adapter")]); // => stores one available product in the catalog
var products = await Task.WhenAll([catalog.FindAsync("A"), catalog.FindAsync("missing")]); // => waits for found and missing lookups
var report = from product in products where product is not null select product.Name; // => keeps only found products in the report
Console.WriteLine(string.Join(",", report)); // => Output: Adapter

record Product(string Id, string Name); // => defines product ID and name

interface ICatalog // => declares nullable lookup contract
{
    Task<Product?> FindAsync(string id); // => missing IDs return null
}

sealed class MemoryCatalog(IEnumerable<Product> products) : ICatalog // => implements the catalog contract
{
    public Task<Product?> FindAsync(string id) => // => returns a Task of nullable Product
        Task.FromResult(products.SingleOrDefault(product => product.Id == id)); // => looks up one matching product or null
}
```

Run the complete project with `dotnet run --project capstone/code/CatalogReport/CatalogReport.csproj` and its assertions with `dotnet test capstone/code/CatalogReport.Tests/CatalogReport.Tests.csproj`.

**Key takeaway:** the capstone composes the primer's type, abstraction, query, and async tools into one verifiable CLI boundary.

**Why it matters:** The CLI capstone composes nullable lookup, records, LINQ, an interface, and an
awaited operation into one visible report. Isolated syntax snippets cannot show every interaction: a
missing product, wrong sort order, or unresolved task can appear only when the pieces meet. Run its
tests, change an ID, and trace the output back through the interface and query to check that the
contracts still agree.
