---
title: "Beginner Examples"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 10
---

Start here with no earlier F# lesson required. Each script runs independently: save the code as `main.fsx` and run `dotnet fsi main.fsx`. Predict the result before running it; each printed value provides a quick check.

## Example 1: Print a value

Start with one expression and a formatted console result. printfn writes a line; %s formats a
string.

```fsharp
// => printfn writes a line; %s formats a string.
let greeting = "Hello, F#!"
// => The binding supplies the value for the placeholder.
printfn "%s" greeting
```

**Observe:** Running the script prints:

```text
Hello, F#!
```

**Key takeaway:** A visible result is the smallest useful feedback loop.

**Why It Matters:** F# scripts run directly with dotnet fsi, so you can try a language feature without creating a
project first. A visible result is the smallest useful feedback loop. The format placeholder checks
the value type, which catches some mistakes before the program runs. Change the greeting and check
that only the formatted value changes.

## Example 2: Immutable bindings and shadowing

A second let creates a new binding with the same name. The first value remains immutable.

```fsharp
// => The first value remains immutable.
let advanced =
    // => The first score is 7 inside the expression scope.
    let score = 7
    // => This inner binding shadows score without changing the first value.
    let score = score + 3
    // => Return the newly bound score, which is 10.
    score
// => The expression returns the latest binding.
printfn "%d" advanced
```

**Observe:** Running the script prints:

```text
10
```

**Key takeaway:** Most F# data is easier to reason about when each binding keeps its value.

**Why It Matters:** Shadowing helps describe successive calculation stages while avoiding hidden state changes. Most F#
data is easier to reason about when each binding keeps its value. When a reader sees score after the
second binding, the value is 10; the earlier 7 was never modified. Add a third shadowing binding and
trace which value each binding reads.

## Example 3: Explicit type annotations

Show how an annotation states the intended input and result types. The parameter and return type are
both int.

```fsharp
// => The parameter and return type are both int.
let double (value: int) : int = value * 2
// => Calling the function produces another int.
let answer = double 6
// => Print the computed answer.
printfn "%d" answer
```

**Observe:** Running the script prints:

```text
12
```

**Key takeaway:** Inference usually keeps F# code concise, but an annotation is valuable at a public boundary or where the intended numeric type is unclear.

**Why It Matters:** Here the contract is explicit: callers supply an int and receive an int. Inference usually keeps F#
code concise, but an annotation is valuable at a public boundary or where the intended numeric type
is unclear. The compiler rejects an incompatible argument before execution. Pass a string argument
and inspect the compiler diagnostic before restoring the script.

## Example 4: Arithmetic expressions

Evaluate a calculation using normal operator precedence. Multiplication happens before addition.

```fsharp
// => Multiplication happens before addition.
let total = 2 + 3 * 4
// => Parentheses change the grouping.
let grouped = (2 + 3) * 4
// => The two results are 14 and 20.
printfn "%d, %d" total grouped
```

**Observe:** Running the script prints:

```text
14, 20
```

**Key takeaway:** Expressions return values, so a calculation can feed a binding without a separate assignment step.

**Why It Matters:** Operator precedence still matters. Expressions return values, so a calculation can feed a binding
without a separate assignment step. Naming both results makes the distinction between default
precedence and explicit grouping visible, which prevents subtle errors in pricing, scoring, and
other arithmetic. Remove the parentheses and predict which arithmetic result changes.

## Example 5: String interpolation

Embed a value in a readable string expression. A dollar-prefixed string interpolates the name.

```fsharp
// => A dollar-prefixed string interpolates the name.
let name = "Ayu"
// => The expression inside braces supplies the value.
let message = $"Hello, {name}!"
// => The result is Hello, Ayu!.
printfn "%s" message
```

**Observe:** Running the script prints:

```text
Hello, Ayu!
```

**Key takeaway:** Interpolation is useful when a short message combines fixed text with a value.

**Why It Matters:** Keep interpolation at the presentation boundary; retain structured values during calculations.
Interpolation is useful when a short message combines fixed text with a value. The braces show
exactly which expression is inserted, and the compiler still checks that the expression is valid F#.
Interpolate an integer expression and observe how it is rendered.

## Example 6: If expressions

Choose one of two values with a conditional expression. Both branches produce a string.

```fsharp
// => Both branches produce a string.
let temperature = 31
// => An if expression must produce one compatible result type.
let label = if temperature >= 30 then "hot" else "mild"
// => This prints hot.
printfn "%s" label
```

**Observe:** Running the script prints:

```text
hot
```

**Key takeaway:** F# if is an expression, so its chosen value can be bound directly.

**Why It Matters:** The two branches must have compatible types; that rule catches accidental combinations such as
returning a number in one branch and text in the other. F# if is an expression, so its chosen value
can be bound directly. Use this shape for a small binary decision. Change the threshold and predict
which branch now supplies the label.

## Example 7: Curried functions

Pass arguments one at a time to a function. add receives left, then right, and returns their sum.

```fsharp
// => add receives left, then right, and returns their sum.
let add left right = left + right
// => Spaces apply the two arguments in order.
let answer = add 2 5
// => The result is 7.
printfn "%d" answer
```

**Observe:** Running the script prints:

```text
7
```

**Key takeaway:** Curried parameters are central to ordinary F# functions.

**Why It Matters:** Calling add 2 produces another function that still needs right; calling that with 5 produces 7.
Curried parameters are central to ordinary F# functions. Understanding this explains both normal
function calls and why partial application works without special syntax. Evaluate add 2 by itself in
FSI and inspect the function value it returns.

## Example 8: Partial application

Fix one argument to create a specialized function. add is a two-argument curried function.

```fsharp
// => add is a two-argument curried function.
let add left right = left + right
// => Fix the first argument and keep the second open.
let addTax = add 10
// => Applying the remaining argument yields 35.
printfn "%d" (addTax 25)
```

**Observe:** Running the script prints:

```text
35
```

**Key takeaway:** Partial application turns a general operation into a focused one without creating a wrapper function.

**Why It Matters:** The specialized function retains the fixed argument. Partial application turns a general operation
into a focused one without creating a wrapper function. This is useful when configuring a
transformation once and passing it into List.map, a pipeline, or another higher-order function.
Change the fixed tax argument while leaving the final call unchanged.

## Example 9: Lambda expressions

Define a short function at the point of use. fun introduces an unnamed function.

```fsharp
// => fun introduces an unnamed function.
let square = fun value -> value * value
// => The function can still be bound and reused.
let result = square 4
// => This prints 16.
printfn "%d" result
```

**Observe:** Running the script prints:

```text
16
```

**Key takeaway:** A lambda is helpful when behavior is short and local.

**Why It Matters:** It is still a first-class function, so it can be stored, called, or passed elsewhere. A lambda is
helpful when behavior is short and local. Use a named let binding when the behavior carries domain
meaning or will be reused in several places. Pass square to List.map and compare the result with a
named function.

## Example 10: Tuples and destructuring

Group two related values without defining a new type. A comma creates a two-item tuple.

```fsharp
// => A comma creates a two-item tuple.
let location = (3, 8)
// => Pattern binding extracts each position.
let x, y = location
// => This prints 3, 8.
printfn "%d, %d" x y
```

**Observe:** Running the script prints:

```text
3, 8
```

**Key takeaway:** Tuples are compact for a small fixed group whose positions are obvious in context.

**Why It Matters:** Destructuring exposes those positions at once. Tuples are compact for a small fixed group whose
positions are obvious in context. When the values need durable names, such as customer ID and
status, a record is clearer because field names remain attached to the data. Swap the tuple
positions and explain why the two names receive different values.

## Example 11: List literals

Create an immutable ordered collection. Semicolons separate list items.

```fsharp
// => Semicolons separate list items.
let scores = [4; 7; 9]
// => List.length reads without changing the list.
let count = List.length scores
// => The list contains three items.
printfn "%d" count
```

**Observe:** Running the script prints:

```text
3
```

**Key takeaway:** An F# list is immutable and preserves order.

**Why It Matters:** It is well suited to small collections and recursive processing. An F# list is immutable and
preserves order. Because operations produce new lists, callers can retain the original data safely.
For indexed mutation or large random-access workloads, choose an array instead. Add another score
and predict the new count before running.

## Example 12: Cons and the empty list

Build a new list by prepending a head. [] is the empty list.

```fsharp
// => [] is the empty list.
let tail = [2; 3]
// => :: adds 1 at the front without changing tail.
let values = 1 :: tail
// => This prints [1; 2; 3].
printfn "%A" values
```

**Observe:** Running the script prints:

```text
[1; 2; 3]
```

**Key takeaway:** The cons operator reveals the recursive structure of a list: one head followed by a tail.

**Why It Matters:** It is cheap to add an item at the front, and pattern matching can take a list apart the same way.
The cons operator reveals the recursive structure of a list: one head followed by a tail. The old
tail stays available because no mutation occurs. Prepend another item and confirm that tail still
prints the same list.

## Example 13: Integer ranges

Generate a short inclusive sequence of numbers. The range includes both endpoints.

```fsharp
// => The range includes both endpoints.
let oneToFour = [1..4]
// => A step of two selects odd numbers.
let odds = [1..2..7]
// => The two lists are printed side by side.
printfn "%A; %A" oneToFour odds
```

**Observe:** Running the script prints:

```text
[1; 2; 3; 4]; [1; 3; 5; 7]
```

**Key takeaway:** Range syntax avoids manually listing predictable integer values.

**Why It Matters:** Its endpoints are inclusive, which matters when counting iterations. Range syntax avoids manually
listing predictable integer values. A third term gives a step, making a small arithmetic progression
readable. For unbounded or lazily generated data, use a sequence instead. Change the step and verify
the inclusive endpoint behavior, including the final value.

## Example 14: Arrays and indexed access

Read an item from a mutable indexed collection. [| |] creates an array, distinct from a list.

```fsharp
// => [| |] creates an array, distinct from a list.
let colors = [|"red"; "blue"|]
// => Index zero reads the first item.
let first = colors.[0]
// => This prints red.
printfn "%s" first
```

**Observe:** Running the script prints:

```text
red
```

**Key takeaway:** Arrays provide constant-time indexed access and can be updated in place.

**Why It Matters:** The .[index] syntax makes indexing explicit. Arrays provide constant-time indexed access and can be
updated in place. Use an array when indexing or mutation is part of the problem; prefer immutable
lists or sequences when a series of transformations communicates the intent better. Read index one,
then compare an array with the list syntax from the previous lesson.

## Example 15: Sequences

Describe values lazily and then request only a few. seq describes a range without making a list
first.

```fsharp
// => seq describes a range without making a list first.
let numbers = seq { 1..1000000 }
// => take requests only the first three values.
let firstThree = numbers |> Seq.take 3 |> Seq.toList
// => This prints [1; 2; 3].
printfn "%A" firstThree
```

**Observe:** Running the script prints:

```text
[1; 2; 3]
```

**Key takeaway:** A sequence can produce values on demand, so a consumer can stop early.

**Why It Matters:** This helps with large or streamed inputs. A sequence can produce values on demand, so a consumer can
stop early. A sequence may recompute when enumerated again; convert to a list or array when you need
a stable materialized snapshot for repeated use. Increase the source range while keeping take 3 and
observe the same output.

## Example 16: Records with named fields

Model one product with descriptive field names. A record type gives fields fixed names and types.

```fsharp
// => A record type gives fields fixed names and types.
type Product = { Name: string; Price: decimal }
// => The field labels make construction readable.
let item = { Name = "Notebook"; Price = 12.50m }
// => Dot access reads the named field.
printfn "%s: %M" item.Name item.Price
```

**Observe:** Running the script prints:

```text
Notebook: 12.50
```

**Key takeaway:** A record is preferable to a tuple when meaning depends on names.

**Why It Matters:** The type says exactly what a Product contains, and construction names every field. A record is
preferable to a tuple when meaning depends on names. Records support structural equality and
immutable data flow, making them useful for domain values passed between small functions. Change
Price and see which record field the formatter reads.

## Example 17: Record copy and update

Create a changed record while retaining the original. The original record remains available.

```fsharp
// => The original record remains available.
type Product = { Name: string; Price: decimal }
// => Keep the original 12.50 price for comparison after the copy.
let original = { Name = "Notebook"; Price = 12.50m }
// => with copies every field except the one named here.
let discounted = { original with Price = 10.00m }
// => The prices are 12.50 and 10.00.
printfn "%M, %M" original.Price discounted.Price
```

**Observe:** Running the script prints:

```text
12.50, 10.00
```

**Key takeaway:** Copy and update is the idiomatic way to derive a record with one changed field.

**Why It Matters:** It does not mutate the original record. Copy and update is the idiomatic way to derive a record with
one changed field. This is valuable in state transitions: a caller can compare old and new values,
and other code holding the old value is unaffected. Print the whole original and discounted records
to confirm both values persist.

## Example 18: Discriminated union cases

Represent a value that is one of several legal shapes. Each case may carry its own data.

```fsharp
// => Each case may carry its own data.
type Shape = Circle of float | Rectangle of float * float
// => Construct the Circle case with its radius.
let shape = Circle 2.0
// => %A prints the case and payload.
printfn "%A" shape
```

**Observe:** Running the script prints:

```text
Circle 2.0
```

**Key takeaway:** A union makes alternatives explicit in the type.

**Why It Matters:** A Shape can be a Circle or Rectangle, so callers cannot invent an unsupported third shape. A union
makes alternatives explicit in the type. Each case carries only the data it needs. Pattern matching
then handles the legal cases with compiler assistance. Construct Rectangle and inspect how its
payload differs from Circle.

## Example 19: Pattern matching on cases

Select behavior from the shape of a union value. The union describes both accepted shapes.

```fsharp
// => The union describes both accepted shapes.
type Shape = Circle of float | Rectangle of float * float
// => Each branch extracts the case payload.
let area shape =
    // => Compare the union case before extracting its payload.
    match shape with
    // => Use radius 2.0 when the Circle case is selected.
    | Circle radius -> System.Math.PI * radius * radius
    // => Multiply the rectangle dimensions when that case is selected.
    | Rectangle(width, height) -> width * height
// => A 3 by 4 rectangle has area 12.
printfn "%.0f" (area (Rectangle(3.0, 4.0)))
```

**Observe:** Running the script prints:

```text
12
```

**Key takeaway:** Pattern matching combines a case check with safe extraction of its data.

**Why It Matters:** Each branch returns the same result type. Pattern matching combines a case check with safe
extraction of its data. When a new case is added, the compiler can warn that this match needs
attention. That is more reliable than scattering string tags and casts through a program. Try both
cases and predict which branch computes each area.

## Example 20: Option for expected absence

Represent a lookup that may have no value. Some contains a value; None means no match.

```fsharp
// => Some contains a value; None means no match.
let findEven values = values |> List.tryFind (fun value -> value % 2 = 0)
// => The first even number is present.
let found = findEven [1; 3; 4]
// => This prints Some 4.
printfn "%A" found
```

**Observe:** Running the script prints:

```text
Some 4
```

**Key takeaway:** Option makes absence visible in a function signature.

**Why It Matters:** The caller must consider Some and None instead of assuming a value exists. Option makes absence
visible in a function signature. Use it when only presence matters. When a failure needs an
explanation, such as why parsing failed, Result is a better fit. Try a list of odd values and handle
its None result explicitly.

## Example 21: Result for explained failure

Return either a value or a useful error message. The domain rule rejects negative quantities.

```fsharp
// => The domain rule rejects negative quantities.
let quantity value = if value >= 0 then Ok value else Error "negative quantity"
// => The error remains data rather than an exception.
let checkedValue = quantity -2
// => This prints Error "negative quantity".
printfn "%A" checkedValue
```

**Observe:** Running the script prints:

```text
Error "negative quantity"
```

**Key takeaway:** Result records an expected failure with information the caller can show or act on.

**Why It Matters:** Both success and error are cases in one type, so handling is explicit. Result records an expected
failure with information the caller can show or act on. Reserve exceptions for faults that cannot be
handled as normal domain outcomes, such as an unavailable dependency. Pass a valid value and compare
the Ok shape to the error case.

## Example 22: Pipeline operator

Read a transformation from source to result. Each stage receives the previous stage's value.

```fsharp
// => Each stage receives the previous stage's value.
let answer =
    // => Begin with the four source integers.
    [1; 2; 3; 4]
    // => Retain 2 and 4 because only those values are even.
    |> List.filter (fun value -> value % 2 = 0)
    // => Square the retained values to obtain 4 and 16.
    |> List.map (fun value -> value * value)
// => The even squares are 4 and 16.
printfn "%A" answer
```

**Observe:** Running the script prints:

```text
[4; 16]
```

**Key takeaway:** The pipeline operator sends a value to a function on its right.

**Why It Matters:** It makes a sequence of transformations read in data-flow order. The pipeline operator sends a value
to a function on its right. Each stage still returns a new value; the notation does not imply
mutation. Name a complex stage instead of stacking hard-to-read lambdas. Swap filter and map, then
decide whether the result still means even squares.

## Example 23: Function composition

Build one transformation from two smaller functions. Both functions accept and return int.

```fsharp
// => Both functions accept and return int.
let double value = value * 2
// => The second function adds one after doubling.
let addOne value = value + 1
// => >> applies double, then addOne.
let transform = double >> addOne
// => Transforming 3 produces 7.
printfn "%d" (transform 3)
```

**Observe:** Running the script prints:

```text
7
```

**Key takeaway:** Composition packages a stable sequence of functions into one reusable function.

**Why It Matters:** The forward operator >> reads left to right, while a pipeline starts with a concrete value.
Composition packages a stable sequence of functions into one reusable function. Choose composition
when you want to pass the combined behavior elsewhere; choose a pipeline for a particular value.
Reverse the composition order and calculate the new result by hand.

## Example 24: Map without mutation

Transform every item into a new list. map calls the function once for each item.

```fsharp
// => map calls the function once for each item.
let doubled = [2; 4; 6] |> List.map (fun value -> value * 2)
// => The original literals remain unchanged.
let result = doubled
// => This prints [4; 8; 12].
printfn "%A" result
```

**Observe:** Running the script prints:

```text
[4; 8; 12]
```

**Key takeaway:** Map preserves the number and order of items while changing each value.

**Why It Matters:** It expresses a transformation without an index or accumulator. Map preserves the number and order of
items while changing each value. A useful question is whether every input item should yield exactly
one output item; if not, filter, choose, or collect may fit better. Change one input item and
explain why the output list keeps the same length.

## Example 25: Filter with a predicate

Keep only items that satisfy a condition. The predicate returns true for positive values.

```fsharp
// => The predicate returns true for positive values.
let positives = [-2; 0; 3; 5] |> List.filter (fun value -> value > 0)
// => Filter retains the original order.
let result = positives
// => This prints [3; 5].
printfn "%A" result
```

**Observe:** Running the script prints:

```text
[3; 5]
```

**Key takeaway:** Filter can remove items but never changes the retained values.

**Why It Matters:** The predicate should answer a clear yes-or-no question. Filter can remove items but never changes
the retained values. This is useful for selecting eligible rows, valid inputs, or visible items
before a later transformation, while keeping the source collection intact. Change the predicate to
include zero and note which values remain.

## Example 26: Fold an aggregate

Accumulate one result from a list. The initial total is zero.

```fsharp
// => The initial total is zero.
let total = [4; 5; 6] |> List.fold (fun sum value -> sum + value) 0
// => The accumulator advances once per item.
let result = total
// => This prints 15.
printfn "%d" result
```

**Observe:** Running the script prints:

```text
15
```

**Key takeaway:** Fold is the general tool for reducing a collection to one accumulated state.

**Why It Matters:** Here that state is a sum. Fold is the general tool for reducing a collection to one accumulated
state. The explicit initial value handles an empty list and states the result type. Prefer
specialized functions such as List.sum when they express the same intent more directly. Change the
initial accumulator to 10 and predict the final total.
