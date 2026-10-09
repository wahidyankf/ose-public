---
title: "Intermediate Examples"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 20
---

These examples build on the previous level. Each script runs independently: save the code as `main.fsx` and run `dotnet fsi main.fsx`. Predict the result before running it; each printed value provides a quick check.

## Example 27: Recursive functions

Define a function that calls itself on a smaller input. rec makes the function name available in its
own body.

```fsharp
// => rec makes the function name available in its own body.
let rec factorial n =
    // => The base case stops recursion at zero or one.
    if n <= 1 then 1
    // => Multiply by the factorial of the smaller input.
    else n * factorial (n - 1)
// => The result for 5 is 120.
printfn "%d" (factorial 5)
```

**Observe:** Running the script prints:

```text
120
```

**Key takeaway:** Recursion handles a problem by solving a smaller instance of the same problem.

**Why It Matters:** The base case stops repeated calls. Recursion handles a problem by solving a smaller instance of the
same problem. This direct factorial is easy to read for small inputs; for large inputs, consider an
accumulator or a library function because deep recursion and integer overflow matter. Run factorial
0 and identify the base case that returns the answer.

## Example 28: Tail-recursive accumulation

Move the running result into an accumulator. The inner loop carries the total forward.

```fsharp
// => The inner loop carries the total forward.
let sumTo n =
    // => The inner loop carries the next number and current sum.
    let rec loop current total =
        // => Return the sum once the next number exceeds n.
        if current > n then total
        // => Advance the number and include it in the new sum.
        else loop (current + 1) (total + current)
    // => Start counting at one with a zero total.
    loop 1 0
// => Summing 1 through 4 gives 10.
printfn "%d" (sumTo 4)
```

**Observe:** Running the script prints:

```text
10
```

**Key takeaway:** A tail call is the final operation in the recursive branch, allowing the compiler to avoid building up pending work.

**Why It Matters:** The accumulator stores the answer so far. A tail call is the final operation in the recursive
branch, allowing the compiler to avoid building up pending work. This pattern is useful when a clear
recursive solution could otherwise consume stack space on a long input. Trace the accumulator after
each call for n equal to three.

## Example 29: For loops at the effect boundary

Repeat a console action for a fixed range. The loop iterates over each integer in the range.

```fsharp
// => The loop iterates over each integer in the range.
for number in 1..3 do
    // => Printing is an intentional side effect.
    printfn "%d" number
```

**Observe:** Running the script prints:

```text
1
2
3
```

**Key takeaway:** F# supports imperative loops when the goal is an effect, such as printing or writing to a mutable buffer.

**Why It Matters:** The loop itself produces unit rather than a collection. F# supports imperative loops when the goal
is an effect, such as printing or writing to a mutable buffer. For building transformed data, a list
or sequence comprehension often communicates the result more directly. Change the range endpoint and
count the number of printed values.

## Example 30: Mutable local state

Use explicit mutation in a small local loop. mutable permits assignment to this binding.

```fsharp
// => mutable permits assignment to this binding.
let mutable total = 0
// => <- changes the existing binding on each iteration.
for value in [2; 3; 4] do
    // => Assignment updates the existing total for each input value.
    total <- total + value
// => This prints 9.
printfn "%d" total
```

**Observe:** Running the script prints:

```text
9
```

**Key takeaway:** Mutation is available, but the mutable keyword makes it visible at the declaration.

**Why It Matters:** Keep mutable state local so callers can still reason about the result as a value. Mutation is
available, but the mutable keyword makes it visible at the declaration. For this simple sum,
List.sum is shorter; the example shows syntax needed for stateful interop or tight loops. Replace
the loop with List.sum and compare where mutation is visible.

## Example 31: Choose present results

Filter and transform with one option-returning function. None drops an odd value; Some keeps a
doubled even value.

```fsharp
// => None drops an odd value; Some keeps a doubled even value.
let transformed =
    // => Only four concrete integers enter the transformation.
    [1; 2; 3; 4]
    // => Even numbers become doubled Some values; odd numbers become None.
    |> List.choose (fun value -> if value % 2 = 0 then Some(value * 2) else None)
// => This prints [4; 8].
printfn "%A" transformed
```

**Observe:** Running the script prints:

```text
[4; 8]
```

**Key takeaway:** Choose combines filtering and mapping when each input may yield zero or one output.

**Why It Matters:** The option return type makes that cardinality clear. Choose combines filtering and mapping when each
input may yield zero or one output. It is useful for parsing a list and retaining only successful
values, although discarding parse errors is appropriate only when errors do not matter. Return Some
for odd values and predict the resulting list.

## Example 32: Pairwise neighbors

Turn a list into adjacent pairs. pairwise overlaps neighboring values.

```fsharp
// => pairwise overlaps neighboring values.
let changes = [3; 7; 6] |> List.pairwise
// => Map each pair to the difference between its members.
let differences = changes |> List.map (fun (left, right) -> right - left)
// => This prints [4; -1].
printfn "%A" differences
```

**Observe:** Running the script prints:

```text
[4; -1]
```

**Key takeaway:** Pairwise expresses a common relationship between neighboring measurements.

**Why It Matters:** It avoids manual indexes and off-by-one checks. Pairwise expresses a common relationship between
neighboring measurements. The result has one fewer item than the input, because a single value has
no neighbor to compare with. Use it for deltas, transitions, or detecting rising values. Try a
one-element input and explain why there are no adjacent pairs.

## Example 33: Group by a key

Partition values into groups with the same derived key. The key is whether each number is even.

```fsharp
// => The key is whether each number is even.
let groups = [1; 2; 3; 4] |> List.groupBy (fun value -> value % 2 = 0)
// => Group keys appear in first-seen order.
let oddGroup = groups |> List.find (fun (key, _) -> not key) |> snd
// => This prints [1; 3].
printfn "%A" oddGroup
```

**Observe:** Running the script prints:

```text
[1; 3]
```

**Key takeaway:** GroupBy collects values with equal keys and preserves their order within each group.

**Why It Matters:** It is useful before counting, aggregating, or displaying categories. GroupBy collects values with
equal keys and preserves their order within each group. Do not rely on a group position when the key
is what matters; this example finds the group by its Boolean key. Change the key function and
inspect how the group labels change.

## Example 34: Maps for keyed lookup

Look up a key without assuming it exists. Map.ofList creates an immutable key-value map.

```fsharp
// => Map.ofList creates an immutable key-value map.
let prices = Map.ofList ["tea", 3; "coffee", 5]
// => tryFind returns Some or None.
let found = Map.tryFind "tea" prices
// => This prints Some 3.
printfn "%A" found
```

**Observe:** Running the script prints:

```text
Some 3
```

**Key takeaway:** Map is an immutable collection for lookup by comparable keys.

**Why It Matters:** A missing key is normal, so Map.tryFind returns option. Map is an immutable collection for lookup by
comparable keys. This keeps absence explicit and avoids an exception at the call site. When new
entries are added, the original map remains available. Look up a missing key and handle the
resulting None.

## Example 35: Sets for uniqueness

Keep each distinct value once. Set.ofList removes duplicates.

```fsharp
// => Set.ofList removes duplicates.
let unique = Set.ofList ["go"; "fsharp"; "go"]
// => contains tests membership, not position.
let hasFsharp = Set.contains "fsharp" unique
// => This prints true and count 2.
printfn "%b, %d" hasFsharp (Set.count unique)
```

**Observe:** Running the script prints:

```text
true, 2
```

**Key takeaway:** A set models membership and uniqueness.

**Why It Matters:** It can replace a list search when the question is whether a value is present. A set models
membership and uniqueness. The ordering of a set follows its comparer, so do not use it to preserve
input order. This distinction matters for user-facing lists. Add another duplicate and confirm the
set count still reflects unique values.

## Example 36: Match guards

Add a condition to an otherwise matching pattern. The guard checks the extracted number.

```fsharp
// => The guard checks the extracted number.
let label value =
    // => Test each option case in order.
    match value with
    // => A present number greater than zero takes this branch.
    | Some number when number > 0 -> "positive"
    // => Other present numbers, including zero, reach this branch.
    | Some _ -> "non-positive"
    // => None reaches the final branch, so the match is complete.
    | None -> "missing"
// => This prints positive.
printfn "%s" (label (Some 3))
```

**Observe:** Running the script prints:

```text
positive
```

**Key takeaway:** A guard narrows a pattern with a Boolean condition.

**Why It Matters:** Its position matters: cases are tested in order, and a later case can handle values the guard
rejects. A guard narrows a pattern with a Boolean condition. Include a fallback for each remaining
shape so the function handles every input and avoids a match-failure exception. Try zero and trace
which later branch handles it after the guard fails.

## Example 37: Active patterns

Give a reusable name to a classification used in matches. The active pattern classifies an integer
into one of two cases.

```fsharp
// => The active pattern classifies an integer into one of two cases.
let (|Even|Odd|) value = if value % 2 = 0 then Even else Odd
// => The match reads in domain terms.
let describe value = match value with Even -> "even" | Odd -> "odd"
// => This prints odd.
printfn "%s" (describe 7)
```

**Observe:** Running the script prints:

```text
odd
```

**Key takeaway:** An active pattern lets a match use a meaningful classification without adding a new stored union value.

**Why It Matters:** The classifier runs during matching. An active pattern lets a match use a meaningful classification
without adding a new stored union value. Use it when the same decomposition improves several
matches; an ordinary if expression is simpler for a one-off Boolean decision. Match several values
and confirm each reaches exactly one active-pattern case.

## Example 38: Exception handling

Catch a specific exception at the boundary that can respond. Int32.Parse raises FormatException for
invalid text.

```fsharp
// => Int32.Parse raises FormatException for invalid text.
let parseOrZero text =
    // => Parsing invalid text raises the specific format error.
    try System.Int32.Parse text
    // => This handler turns only FormatException into the fallback zero.
    with :? System.FormatException -> 0
// => The fallback is explicit in this small example.
printfn "%d" (parseOrZero "not-a-number")
```

**Observe:** Running the script prints:

```text
0
```

**Key takeaway:** Exceptions can arise from .NET APIs.

**Why It Matters:** Catch the specific failure you can handle and decide what outcome makes sense to the caller.
Exceptions can arise from .NET APIs. A silent zero fallback would be risky in real input processing
because zero could be valid; the next example uses TryParse to preserve success information. Try a
valid number and compare this fallback approach with TryParse.

## Example 39: TryParse for untrusted text

Convert text without using an exception for an expected invalid input. TryParse returns a success
flag and parsed value as a tuple in F#.

```fsharp
// => TryParse returns a success flag and parsed value as a tuple in F#.
let parse (text: string) =
    // => TryParse returns both a success flag and a value.
    match System.Int32.TryParse text with
    // => A successful parse becomes Some of its integer.
    | true, value -> Some value
    // => Invalid text becomes None instead of an exception.
    | false, _ -> None
// => This prints None for invalid input.
printfn "%A" (parse "twelve")
```

**Observe:** Running the script prints:

```text
None
```

**Key takeaway:** Parsing user input is an expected success-or-failure operation.

**Why It Matters:** TryParse avoids throwing for ordinary invalid text, and the option result makes absence explicit.
Parsing user input is an expected success-or-failure operation. If the caller needs a diagnostic,
convert the failure into an Error case with context about the rejected input. Parse zero and
distinguish Some 0 from None at the caller.

## Example 40: Bind dependent Result steps

Continue only when the previous step succeeded. Each step returns Result<int,string>.

```fsharp
// => Each step returns Result<int,string>.
let positive value = if value > 0 then Ok value else Error "not positive"
// => The second rule rejects 10 and larger after the first rule succeeds.
let underTen value = if value < 10 then Ok value else Error "too large"
// => bind skips the next step after Error.
let checkedValue = positive 12 |> Result.bind underTen
// => This prints Error "too large".
printfn "%A" checkedValue
```

**Observe:** Running the script prints:

```text
Error "too large"
```

**Key takeaway:** Result.bind composes operations where the next step itself may fail.

**Why It Matters:** It avoids nested matches for each validation step while preserving the first error. Result.bind
composes operations where the next step itself may fail. Keep each validation small and named so the
order and meaning remain visible. Use Result.map when the next function cannot fail. Make the first
step fail and verify that the second step is skipped.

## Example 41: Map a successful Result

Transform the success value without changing an error. Result.map calls the function only for Ok.

```fsharp
// => Result.map calls the function only for Ok.
let original: Result<int, string> = Ok 4
// => The error type stays string.
let doubled = original |> Result.map (fun value -> value * 2)
// => This prints Ok 8.
printfn "%A" doubled
```

**Observe:** Running the script prints:

```text
Ok 8
```

**Key takeaway:** Mapping a Result separates a pure transformation from error handling.

**Why It Matters:** The Error case passes through unchanged; the function runs only for Ok. Mapping a Result separates a
pure transformation from error handling. This is useful for formatting, projection, or arithmetic
after a successful parse. It keeps the failure path intact instead of inventing a fallback value.
Replace Ok 4 with Error text and confirm the mapper is not called.

## Example 42: Default an Option at the edge

Choose a fallback only where absence can be resolved. None represents the missing preference.

```fsharp
// => None represents the missing preference.
let selected: string option = None
// => defaultValue resolves absence for display.
let label = selected |> Option.defaultValue "Guest"
// => This prints Guest.
printfn "%s" label
```

**Observe:** Running the script prints:

```text
Guest
```

**Key takeaway:** Option.defaultValue is useful when a caller has a legitimate default.

**Why It Matters:** Apply it near the place that needs a concrete value, not immediately after every optional lookup;
early defaulting can hide meaningful absence. Option.defaultValue is useful when a caller has a
legitimate default. Here the display boundary chooses Guest while the underlying preference remains
None. Change the fallback only, leaving the original optional value untouched.

## Example 43: Nested record values

Compose named data structures from smaller records. Address and Customer each name their fields.

```fsharp
// => Address and Customer each name their fields.
type Address = { City: string; Postcode: string }
// => A Customer owns a complete Address value.
type Customer = { Name: string; Address: Address }
// => Construct the nested value explicitly.
let customer = { Name = "Ayu"; Address = { City = "Bandung"; Postcode = "40111" } }
// => Dot access follows the nested fields.
printfn "%s" customer.Address.City
```

**Observe:** Running the script prints:

```text
Bandung
```

**Key takeaway:** Nested records keep related fields together while retaining strong names.

**Why It Matters:** They make a larger value easier to construct and update in parts. Nested records keep related fields
together while retaining strong names. A Customer still contains a complete Address, so functions
can receive the smaller record when they only need location data. Read Name as well as City and
identify which record supplies each field.

## Example 44: Recursive union for a tree

Let a union case contain values of its own type. Add contains two Expr children.

```fsharp
// => Add contains two Expr children.
type Expr = Number of int | Add of Expr * Expr
// => The expression is a tree, not a computed answer yet.
let expression = Add(Number 2, Number 3)
// => The printed shape shows both child nodes.
printfn "%A" expression
```

**Observe:** Running the script prints:

```text
Add (Number 2, Number 3)
```

**Key takeaway:** Recursive unions model trees whose nodes can contain smaller nodes of the same type.

**Why It Matters:** An expression tree separates the structure of a calculation from evaluating it. Recursive unions
model trees whose nodes can contain smaller nodes of the same type. This allows a later function to
interpret, transform, or display the same tree in different ways. Nest another Add node and sketch
the resulting tree before printing it.

## Example 45: Evaluate a recursive union

Use a total recursive match to interpret a small tree. The recursive union defines leaf and branch
nodes.

```fsharp
// => The recursive union defines leaf and branch nodes.
type Expr = Number of int | Add of Expr * Expr
// => Every case returns an int.
let rec evaluate expression =
    // => Inspect whether the node is a leaf or an addition branch.
    match expression with
    // => A Number leaf evaluates to its stored integer.
    | Number value -> value
    // => Evaluate both children before adding their answers.
    | Add(left, right) -> evaluate left + evaluate right
// => The nested expression evaluates to 6.
printfn "%d" (evaluate (Add(Number 1, Add(Number 2, Number 3))))
```

**Observe:** Running the script prints:

```text
6
```

**Key takeaway:** Evaluation follows the tree structure: a leaf yields its value, and a branch evaluates both children before combining them.

**Why It Matters:** The match is exhaustive for this union. Evaluation follows the tree structure: a leaf yields its
value, and a branch evaluates both children before combining them. This is the core idea behind
interpreters, compilers, and rules engines, presented here with only two cases. Add one leaf and
trace the order in which recursive calls return.

## Example 46: Modules as namespaces for functions

Group related operations under one name. A module keeps these functions together.

```fsharp
// => A module keeps these functions together.
module Pricing =
    // => The fee is added to the supplied amount.
    let addFee fee amount = amount + fee
    // => This second function doubles an amount without state.
    let doubleAmount amount = amount * 2
// => Qualify a function with the module name.
printfn "%d" (Pricing.addFee 3 10)
```

**Observe:** Running the script prints:

```text
13
```

**Key takeaway:** Modules organize values and functions without requiring a class instance.

**Why It Matters:** A qualified call tells the reader which group owns the operation. Modules organize values and
functions without requiring a class instance. Use a module for cohesive stateless behavior; split an
oversized module when its functions no longer share a clear responsibility. Qualify the second
Pricing function and confirm both calls stay in the module.

## Example 47: Members on a record

Attach a derived operation to a data type. The member computes from record fields.

```fsharp
// => The member computes from record fields.
type Rectangle =
    // => These two named fields hold the rectangle dimensions.
    { Width: int; Height: int }
    // => Area is calculated from the current width and height.
    member this.Area = this.Width * this.Height
// => Construction still uses ordinary record syntax.
let shape = { Width = 3; Height = 4 }
// => The derived property is 12.
printfn "%d" shape.Area
```

**Observe:** Running the script prints:

```text
12
```

**Key takeaway:** A member can express a natural property of a type while the record retains value semantics.

**Why It Matters:** This keeps a derived value close to its fields. A member can express a natural property of a type
while the record retains value semantics. For operations that combine several independent types, a
plain function may keep dependencies clearer than a member. Change Width and observe that Area is
derived from the new fields.

## Example 48: Interfaces for a small contract

Implement a .NET interface on a simple type. The interface describes one behavior.

```fsharp
// => The interface describes one behavior.
type ILabel = abstract member Text: string
// => The class supplies that behavior.
type Item(name: string) =
    // => The explicit implementation exposes the stored name as Text.
    interface ILabel with member _.Text = name
// => Upcast to use the interface contract.
let label = Item("book") :> ILabel
// => This prints book.
printfn "%s" label.Text
```

**Observe:** Running the script prints:

```text
book
```

**Key takeaway:** F# can implement .NET interfaces when a framework or API expects one.

**Why It Matters:** The interface exposes behavior without exposing the concrete Item type. F# can implement .NET
interfaces when a framework or API expects one. Keep a small functional core as plain functions and
values; use interfaces where they improve a boundary or support interoperability. Change the
concrete class while calling through the same interface contract.

## Example 49: Classes and constructors

Store constructor input in a small object. The constructor accepts a name.

```fsharp
// => The constructor accepts a name.
type Greeter(name: string) =
    // => Each Greeter uses the name captured by its own constructor.
    member _.Greet() = $"Hello, {name}"
// => Create an instance and call its method.
let greeter = Greeter("Ayu")
// => This prints Hello, Ayu.
printfn "%s" (greeter.Greet())
```

**Observe:** Running the script prints:

```text
Hello, Ayu
```

**Key takeaway:** Classes are available when identity, encapsulation, or .NET APIs call for an object.

**Why It Matters:** Constructor parameters can be captured by members. Classes are available when identity,
encapsulation, or .NET APIs call for an object. For immutable domain data alone, a record is usually
simpler and supports structural equality without additional boilerplate. Construct two greeters and
check that each captures its own distinct input name.

## Example 50: Update an array item

Show the difference between array mutation and list transformation. An array's elements can change
in place.

```fsharp
// => An array's elements can change in place.
let counters = [|1; 2; 3|]
// => The indexed assignment changes element one.
counters.[1] <- 5
// => This prints [|1; 5; 3|].
printfn "%A" counters
```

**Observe:** Running the script prints:

```text
[|1; 5; 3|]
```

**Key takeaway:** Array mutation is useful when an algorithm needs indexed updates or a .NET API expects an array.

**Why It Matters:** The assignment affects anyone sharing that array reference, unlike List.map, which returns a new
collection. Array mutation is useful when an algorithm needs indexed updates or a .NET API expects
an array. Keep the mutation within a clear boundary when possible. Print the array before and after
assignment to locate the state change.

## Example 51: Dictionary interop

Call a mutable .NET collection from F#. System.Collections.Generic.Dictionary is a .NET type.

```fsharp
// => System.Collections.Generic.Dictionary is a .NET type.
let counts = System.Collections.Generic.Dictionary<string, int>()
// => Indexer assignment stores one entry.
counts.["tea"] <- 2
// => TryGetValue returns a success flag and value.
let found, value = counts.TryGetValue "tea"
// => This prints true, 2.
printfn "%b, %d" found value
```

**Observe:** Running the script prints:

```text
true, 2
```

**Key takeaway:** F# works directly with .NET libraries, including mutable collections.

**Why It Matters:** A Dictionary can suit a high-update boundary, while F# Map offers immutable keyed values. F# works
directly with .NET libraries, including mutable collections. The TryGetValue result makes missing
keys explicit; do not read the returned value unless the success flag is true. Look up a missing
dictionary key and inspect the success flag.

## Example 52: Generic function inference

Write one function that works for different list element types. The compiler infers a generic input
list.

```fsharp
// => The compiler infers a generic input list.
let countItems items = List.length items
// => Both calls reuse the same function.
let words = countItems ["red"; "blue"]
// => The same generic function also counts integer items.
let numbers = countItems [1; 2; 3]
// => This prints 2, 3.
printfn "%d, %d" words numbers
```

**Observe:** Running the script prints:

```text
2, 3
```

**Key takeaway:** A function does not need a type parameter declaration when its operations work for any element type.

**Why It Matters:** The compiler infers the most general useful signature. A function does not need a type parameter
declaration when its operations work for any element type. Genericity here is safe because
List.length never inspects an item; it only counts list nodes. Pass a list of records and confirm
countItems still compiles unchanged.
