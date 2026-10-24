---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to C# In Depth: recall first, then applied judgement, then hands-on repetition, then a checklist, then a why and why-not pass to confirm real automaticity rather than recognition. Every answer hides in a `<details>` block; try each item yourself before opening it.

## Recall Q&A

Twenty-four short-answer questions covering each of co-01 to co-16. Answer from memory, then check. Star the ones you miss and repeat them after a day; spaced repetition only works when the misses decide what comes back.

### Q1 (co-01): Why does the guard clause come before the happy path in Example 1?

<details><summary>Answer</summary>

Failures handled first leave the success path at the margin with no nesting, so readers meet the normal flow without holding failure conditions in mind. Early returns turn preconditions into exits instead of indentation.

</details>

### Q2 (co-01): When do you reach for a switch expression instead of an if-else ladder?

<details><summary>Answer</summary>

When one value faces several ordered mappings, as in Example 2: the switch expression lists patterns top-down with one value per arm and no fallthrough, while ladders nest and repeat the variable. Add the discard arm for the fallback.

</details>

### Q3 (co-13): Why ask the runtime for type sizes instead of hardcoding them?

<details><summary>Answer</summary>

Hardcoded sizes drift across platforms while Marshal answers the truth the native side sees, as in Example 69. The DllImport fragment shows where those sizes get spent; guessing at the boundary corrupts memory silently far from the declaration.

</details>

### Q4 (co-02): Why is the Try-pattern preferable to exceptions for expected failure?

<details><summary>Answer</summary>

The boolean return keeps every failure path explicit and local: the caller branches exactly where the call happened instead of catching from layers away. Example 10 shows both branches; ignoring the false is a visible choice, not luck.

</details>

### Q5 (co-02): When do you wrap with an inner exception, and when is it wrong to wrap?

<details><summary>Answer</summary>

Wrap once per layer boundary to add context while keeping the cause reachable, as in Example 13. Wrapping every line buries the signal in repetition; wrap where the failure crosses a layer, never inside tight loops over the same error.

</details>

### Q6 (co-02): How do exception filters and plain catches divide the sorting work?

<details><summary>Answer</summary>

Filters answer recognition (does this failure match, Example 11); plain catches answer remainder (everything the filters skipped). Match content with when-clauses, react to the rest with the unfiltered arm, and let unmatched failures keep traveling.

</details>

### Q7 (co-14): What do the three C# casings encode at a glance?

<details><summary>Answer</summary>

Role and access: PascalCase for types and members, camelCase for locals and parameters, underscore-camelCase for private fields, as in Example 64. Uniform casing removes spelling debates from reviews and makes unfamiliar code read like the standard library.

</details>

### Q8 (co-03): What does deferred execution mean for a Where-Select pipeline?

<details><summary>Answer</summary>

Nothing runs until enumeration: the query only describes, and late source changes still count, as in Example 6. Materialize deliberately with ToList when you need a snapshot, and never assume the source is untouched or already consumed.

</details>

### Q9 (co-03): Why pass StringComparer.Ordinal to OrderBy?

<details><summary>Answer</summary>

The default comparison follows the current culture, so the same sort prints different orders on different machines. Ordinal compares code points, as in Example 7, turning sorting into a pure function of the data that tests and transcripts can pin.

</details>

### Q10 (co-03): How does TryGetValue improve on the indexer plus Contains?

<details><summary>Answer</summary>

It folds membership and value into one call with no exception path, as in Example 5. The indexer throws on misses and Contains-then-index reads twice; TryGetValue answers both questions atomically and keeps the miss branch an ordinary outcome.

</details>

### Q11 (co-04): When does StringBuilder beat string concatenation?

<details><summary>Answer</summary>

Whenever appends happen in a loop, as in Example 18: concatenation allocates per plus for quadratic garbage, while the builder amortizes growth and freezes once with ToString. For a fixed handful of joins, interpolation stays clearer.

</details>

### Q12 (co-04): What do named regex groups buy over numbered ones?

<details><summary>Answer</summary>

Field-like reads that survive pattern edits, as in Example 20: `Groups["dish"]` keeps meaning while group numbers shift with every added parenthesis. Names turn the match into a small record the reader understands without counting.

</details>

### Q13 (co-05): When do you reach for DateOnly and TimeOnly over DateTime?

<details><summary>Answer</summary>

When the value is a day or a time of day with no zone story, as in Example 23: opening hours and due dates stop carrying phantom midnights. Each type does its own arithmetic, so calendar steps and window measures stay separate and exact.

</details>

### Q14 (co-05): Why does DateTimeOffset beat DateTime for fixed instants?

<details><summary>Answer</summary>

The offset travels with the value, so UTC and epoch conversions are pure arithmetic with no time-zone database, as in Example 25. Bare local times force every reader to guess the intended zone; anchored instants convert exactly on every machine.

</details>

### Q15 (co-06): What does one-type-per-file buy a small project?

<details><summary>Answer</summary>

Findability by name in editors, reviews, and stack traces, as in Example 27: the SDK globs every file automatically, so splitting costs no bookkeeping. One story per file keeps diffs focused and merges off shared files.

</details>

### Q16 (co-06): How do public, internal, and private divide a type's surface?

<details><summary>Answer</summary>

Public invites the world, internal shares across one assembly, private hides inside the type, as in Example 28. Default to the narrowest that works: every widened member is a promise to maintain, and narrow surfaces keep refactors possible.

</details>

### Q17 (co-07): Why do the course units carry zero PackageReferences?

<details><summary>Answer</summary>

The base class library already covers the taught ground, so restore stays a no-op and builds work offline, as in Example 31. Every dependency spends supply-chain budget; the standard library first keeps that budget for proven gaps only.

</details>

### Q18 (co-15): When does freezing a dictionary pay for itself?

<details><summary>Answer</summary>

When reads dominate and the table stops changing after startup, as in Example 53: FrozenDictionary snapshots the builder into a read-optimized shape with no lock tax. Menus, routes, and configuration freeze once and serve hot; mutating tables stay unfrozen.

</details>

### Q19 (co-08): What are the three phases of every check, and what breaks when they tangle?

<details><summary>Answer</summary>

Arrange, act, assert, as in Example 35. Tangled phases point failures nowhere: setup mixed with assertions hides which promise broke. The rhythm separates input, behavior, and promise so red lines name their cause.

</details>

### Q20 (co-09): Why sort shared results before printing in parallel examples?

<details><summary>Answer</summary>

Thread completion order varies run to run, so unsorted prints leak timing into the transcript, as Examples 58 and 60 show. Collect concurrently, then OrderBy before printing: the work stays parallel while the output stays pinned.

</details>

### Q21 (co-10): What does a generic constraint promise the method body?

<details><summary>Answer</summary>

Exactly the operations the body may use: `new()` unlocks construction in Example 46, `IComparable<T>` unlocks choosing in Example 45. Reading constraints first tells you what a generic method demands before you study what it does.

</details>

### Q22 (co-11): How do with-expressions keep shared records safe?

<details><summary>Answer</summary>

They build variations as new values instead of mutating the original, as in Example 50: the promo price cannot leak into regular receipts because the original survives untouched. Non-destructive updates make immutable data safe by construction.

</details>

### Q23 (co-12): What does the warnings-as-errors gate prove about null handling?

<details><summary>Answer</summary>

That every dereference earned its guard: with nullable analysis on, unguarded touches warn, and the gate promotes warnings to errors, as in Example 62. Passing code has proven its null story at compile time instead of crashing at runtime.

</details>

### Q24 (co-16): What is the fastest way to read an unfamiliar idiomatic sample?

<details><summary>Answer</summary>

Top-down following traffic, as in Example 78: entry verb first, then dispatch arms, then helpers, then leaves. Constructors enumerate births for types, asserts name promises for tests, stages divide pipelines; each shape has one reading order that spends attention where it matters.

## Applied problems

Eight judgement problems with no single right answer; each names the examples its reasoning depends on. Work them on paper before discussing: the point is the trade, not the pick.

### P1: Translate the Java-shaped order service

A teammate ports a Java order service line by line: checked-exception signatures become throws everywhere, getters stay `getDish()` methods, and constants live in an unsealed static class with public fields. Rewrite its three worst habits into idiomatic C# and justify each change with an example. (Examples 1, 9, 64.)

<details><summary>Answer</summary>

Replace throws-for-expected with the Try-pattern, convert getters to PascalCase properties, and seal the constants holder with get-only properties. Each change trades translation fidelity for the idiom the standard library itself uses.

</details>

### P2: Choose the error shape for three failures

A receipt printer faces three failures: a missing order file, a malformed quantity on line four, and a printer jam mid-job. Assign each failure to throw, Try-pattern, or cancellation, and say where its handler lives. (Examples 9, 10, 16, 56.)

<details><summary>Answer</summary>

Missing file throws at the edge because callers cannot proceed; malformed quantity answers false per line because typos are expected; the jam honors a cancellation token because the job must stand down mid-flight. One boundary catch translates all three.

</details>

### P3: Replace the hand-rolled helpers

A utilities file holds `JoinStrings`, `ParseOrZero`, and `DistinctKeepOrder`, each twenty lines with a subtle bug. Find the standard-library member that replaces each one, name the example that teaches it, and explain what the hand version risked. (Examples 18, 10, 6.)

<details><summary>Answer</summary>

StringBuilder or string.Join replaces the joiner; int.TryParse replaces the parser; LINQ Distinct replaces the deduplicator. Each hand version risked the exact bug the standard member already fixed: quadratic concat, thrown parses, and order loss.

</details>

### P4: Pick the collection for three jobs

An order board needs a work queue with many writers, a price table read ten thousand times per minute, and an audit trail that never mutates. Assign Channel, FrozenDictionary, and record-plus-list, and say what each rejects. (Examples 53, 59, 50.)

<details><summary>Answer</summary>

Channel carries the queue because writers and readers separate cleanly; FrozenDictionary serves the prices because reads dominate a frozen table; records in a list hold the audit because value equality plus immutability makes history trustworthy. Each rejects the mutable default that fits none of the three.

</details>

### P5: Split the god class

A 900-line `OrderManager` parses files, prices dishes, prints receipts, and emails customers, with three constructors nobody calls. Propose the file split, the access lines, and which constructor survives, citing the layout examples. (Examples 27, 28, 73.)

<details><summary>Answer</summary>

Split into Parser, Pricer, Printer, and Notifier with one public type per file; keep parsing internals private and the receipt shape public; keep the constructor that names every required field and chain the convenience one to it. The split trades one navigable file for four reviewable ones.

</details>

### P6: Tame the flaky suite

A suite fails every third run: shared static menu mutated across checks, timing-based asserts on parallel totals, and a slow audit everyone skips by deleting it. Prescribe the fixture, determinism, and opt-out fixes with examples. (Examples 43, 57, 42.)

<details><summary>Answer</summary>

Per-check fixtures through using end the shared mutation; lock-guarded or Interlocked totals with sorted prints end the timing flakes; SLOW_TESTS-gated SKIP records the audit instead of deleting it. Each fix trades convenience for determinism the transcript can pin.

</details>

### P7: Review the clever pipeline

A colleague chains seven LINQ calls with side effects inside Select, a culture-sensitive OrderBy, and a ToList in the middle nobody explains. Rewrite it stage by stage, flag the side effect, pin the comparer, and justify the materialization point. (Examples 6, 7, 71.)

<details><summary>Answer</summary>

Side effects leave Select for foreach because queries must stay pure; Ordinal pins the sort across machines; the single ToList sits where enumeration must snapshot, not mid-chain by accident. The rewrite trades clever density for stages a stranger can number.

</details>

### P8: Survey the native boundary

A feature needs one call into a vendor sequencing library: struct layouts, string encodings, and error codes must cross the managed edge. List what Marshal answers, what the attributes declare, and what stays managed, citing the interop survey. (Examples 69, 76.)

<details><summary>Answer</summary>

Marshal sizes every struct the native side reserves; DllImport plus marshaling attributes declare the entry and encodings; parsing, pricing, and totaling stay managed and tested. The survey trades a full interop course for recognition plus exact sizes at the edge.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Make the starter match before peeking: type the fix yourself, run it with the command in its `run.yaml`, and compare your transcript against the recorded one line by line. Work them in order: the error-shape and first-check katas first, because failure idioms and check rhythm underlie everything; the split, flatten, nullable, and LINQ katas next, because they train the four reflexes daily C# demands; the record and using katas after, because they isolate one design judgement each. Repeat any kata you peeked at after two days: the second attempt should need no reference at all, and the moment it does not, the reflex has moved from recognition into automaticity where production code can rely on it.

### Kata 01: Throw to Try Pattern

(Concepts: co-02.)

The starter parses with int.Parse; rewrite it with int.TryParse like Example 10 teaches, printing bad lines instead of throwing. The solution keeps both paths honest.

**Before** (`drilling/code/kata-01-throw-to-try-pattern/before/Starter.cs`):

```csharp
// Starter: quantity parsed with int.Parse. The bug: bad input throws.
// => rewrite with int.TryParse following Example 10, printing bad lines plainly
string[] orders = { "12", "abc", "30" }; // => two good quantities, one typo
foreach (string raw in orders) // => the loop the rewrite keeps, crash-free
{
    Console.WriteLine($"serving {int.Parse(raw)}"); // => BUG: abc throws FormatException here
}
```

**After** (`drilling/code/kata-01-throw-to-try-pattern/after/Solution.cs`):

```csharp
// Solution: quantity parsed with int.TryParse. Bad input prints, never throws.
// => Try-pattern from Example 10: false means expected failure, handled inline
string[] orders = { "12", "abc", "30" }; // => two good quantities, one typo
foreach (string raw in orders) // => the same loop shape, now crash-free
{
    // => TryParse answers true plus the value, or false with value zero
    if (int.TryParse(raw, out int qty)) // => qty receives 12, then 30
    {
        Console.WriteLine($"serving {qty}"); // => Output: serving 12, then serving 30
    }
    else // => false means bad input: an expected failure, not an exception
    {
        Console.WriteLine($"bad order: {raw}"); // => Output: bad order: abc
    }
}
```

**Output** (`drilling/code/kata-01-throw-to-try-pattern/expected/main.stdout.txt`):

```text
serving 12
bad order: abc
serving 30
```

### Kata 02: Write First Check

(Concepts: co-08.)

The starter computes a total with no check; wrap it in the Check helper from Example 35 and make it pass. The solution pins the promised 37000.

**Before** (`drilling/code/kata-02-write-first-check/before/Starter.cs`):

```csharp
// Starter: Total has no check. The gap: nothing pins the promised 37000.
// => write the Check from Example 35 around Total, then make it pass
int Total() => new List<int> { 12000, 25000 }.Sum(); // => the behavior to pin
Console.WriteLine(Total()); // => prints 37000 today: a check would keep it so
```

**After** (`drilling/code/kata-02-write-first-check/after/Solution.cs`):

```csharp
// Solution: Total pinned by a Check. The promise 37000 now has a guard.
// => arrange-act-assert from Example 35: one helper, honest PASS lines
int total = new List<int> { 12000, 25000 }.Sum(); // => act: the behavior under check
Check(total == 37000, "total sums two lines"); // => assert: 37000 is the promise

// => Check helper: PASS prints, FAIL throws with the promise name
void Check(bool condition, string name) // => local function: promise plus name
{
    // => false throws: the transcript stops at the first broken promise
    if (!condition) // => the promise decides here, synchronously
    {
        throw new Exception($"FAIL: {name}"); // => FAIL names the broken promise
    }
    Console.WriteLine($"PASS: {name}"); // => Output: PASS: total sums two lines
}
```

**Output** (`drilling/code/kata-02-write-first-check/expected/main.stdout.txt`):

```text
PASS: total sums two lines
```

### Kata 03: Replace Hand Rolled Split

(Concepts: co-04.)

The starter walks characters by hand to split commas; replace the loop with string.Split like Example 31 teaches. The solution prints the same dishes through one call.

**Before** (`drilling/code/kata-03-replace-hand-rolled-split/before/Starter.cs`):

```csharp
// Starter: hand-rolled splitter walks characters. The smell: framework does this.
// => replace the loop below with string.Split following Example 31
string line = "rice,rendang,sambal"; // => three dishes separated by commas
var dishes = new List<string>(); // => the loop below fills this by hand
string current = ""; // => accumulates characters between commas
foreach (char c in line) // => hand walk: every character inspected manually
{
    if (c == ',') // => comma ends the current dish
    {
        dishes.Add(current); // => flush the accumulation into the list
        current = ""; // => restart the accumulation after each comma
    }
    else // => ordinary character: join the current dish
    {
        current += c; // => string concat per character: slow and noisy
    }
}
dishes.Add(current); // => flush the trailing dish after the loop
Console.WriteLine(string.Join("|", dishes)); // => rice|rendang|sambal, the hard way
```

**After** (`drilling/code/kata-03-replace-hand-rolled-split/after/Solution.cs`):

```csharp
// Solution: string.Split replaces the hand walk. Same dishes, one call.
// => standard library from Example 31: Split with no empty entries
string line = "rice,rendang,sambal"; // => three dishes separated by commas

// => one call returns the three dishes: the loop above retires entirely
string[] dishes = line.Split(',', StringSplitOptions.RemoveEmptyEntries); // => framework split, exact
Console.WriteLine(string.Join("|", dishes)); // => Output: rice|rendang|sambal
```

**Output** (`drilling/code/kata-03-replace-hand-rolled-split/expected/main.stdout.txt`):

```text
rice|rendang|sambal
```

### Kata 04: Flatten Nested Checks

(Concepts: co-01, co-14.)

The starter nests the answer two levels deep; flatten it with a guard plus switch like Example 68 teaches. The solution prints the same 50000 from the margin.

**Before** (`drilling/code/kata-04-flatten-nested-checks/before/Starter.cs`):

```csharp
// Starter: nested checks bury the answer two levels deep. The smell: the pyramid.
// => flatten with a guard clause and a switch following Example 68
int Price(string dish, int qty) // => nested version: answer hides inside
{
    if (qty > 0) // => level one: quantity must be positive
    {
        if (dish == "rendang") // => level two: dish must match
        {
            return 25000 * qty; // => answer two levels deep
        }
    }
    return 0; // => failure value far from its conditions
}
Console.WriteLine(Price("rendang", 2)); // => 50000 today, nested tomorrow
```

**After** (`drilling/code/kata-04-flatten-nested-checks/after/Solution.cs`):

```csharp
// Solution: guard plus switch at the margin. Same answers, flat shape.
// => flat rewrite from Example 68: guards exit, the switch answers
int Price(string dish, int qty) // => flat version: same answers, no pyramid
{
    // => guard first: bad quantity exits before any dish logic runs
    if (qty <= 0) // => inverted condition: failure returns immediately
    {
        return 0; // => early exit keeps the rest flat
    }
    return dish switch // => one expression answers at the left margin
    {
        "rendang" => 25000 * qty, // => the only dish this kitchen prices
        _ => 0, // => unknown dishes total zero, flatly
    };
}
Console.WriteLine(Price("rendang", 2)); // => Output: 50000
```

**Output** (`drilling/code/kata-04-flatten-nested-checks/expected/main.stdout.txt`):

```text
50000
```

### Kata 05: Nullable Annotate Order

(Concepts: co-12.)

The starter hides a null behind a null-forgiving lie; annotate the lookup with string question-mark and guard the call site like Example 62 teaches. The solution reports the miss honestly.

**Before** (`drilling/code/kata-05-nullable-annotate-order/before/Starter.cs`):

```csharp
// Starter: lookup returns string with no null story. The gap: callers guess.
// => annotate with string? and guard at the call site following Example 62
string Find(string dish) // => no ? : the signature hides the missing case
{
    return dish == "rendang" ? dish : null!; // => BUG: null! lies to the compiler
}
Console.WriteLine(Find("rendang")); // => prints today, explodes on "sushi".Length
```

**After** (`drilling/code/kata-05-nullable-annotate-order/after/Solution.cs`):

```csharp
// Solution: string? plus a guard. Missing dishes are honest, never explosive.
// => nullable idiom from Example 62: the ? carries the missing case openly
string? Find(string dish) // => string? admits null: the lookup may miss
{
    return dish == "rendang" ? dish : null; // => honest null, honestly typed
}

// => the guard below is load-bearing: dereference only after the null check
string? maybe = Find("sushi"); // => null: the missing dish, typed as missing
Console.WriteLine($"missing: {maybe is null}"); // => Output: missing: True
Console.WriteLine($"found: {Find("rendang")!.Length} letters"); // => Output: found: 7 letters
```

**Output** (`drilling/code/kata-05-nullable-annotate-order/expected/main.stdout.txt`):

```text
missing: True
found: 7 letters
```

### Kata 06: LINQify the Loop

(Concepts: co-03, co-10.)

The starter accumulates by hand over a price lookup; replace the loop with Select plus Sum like Examples 6 and 71 teach. The solution totals in one expression.

**Before** (`drilling/code/kata-06-linqify-the-loop/before/Starter.cs`):

```csharp
// Starter: hand accumulation loop totals the order. The smell: Sum exists.
// => replace the loop with Where plus Sum following Examples 6 and 71
var prices = new Dictionary<string, int>
{
    ["rice"] = 12000,
    ["rendang"] = 25000,
    ["sambal"] = 5000,
}; // => fixed menu
var order = new List<string> { "rice", "rendang", "rice" }; // => two rice plus rendang
int total = 0; // => accumulator the loop below grows by hand
foreach (string dish in order) // => hand walk over the order lines
{
    total += prices[dish]; // => add each looked-up price manually
}
Console.WriteLine(total); // => 49000 today, one expression tomorrow
```

**After** (`drilling/code/kata-06-linqify-the-loop/after/Solution.cs`):

```csharp
// Solution: Sum over looked-up prices. Same total, one expression.
// => LINQ pipeline from Examples 6 and 71: shape, then materialize
var prices = new Dictionary<string, int>
{
    ["rice"] = 12000,
    ["rendang"] = 25000,
    ["sambal"] = 5000,
}; // => fixed menu
var order = new List<string> { "rice", "rendang", "rice" }; // => two rice plus rendang

// => Select looks up each price, Sum totals: the loop above retires entirely
Console.WriteLine(order.Select(dish => prices[dish]).Sum()); // => Output: 49000
```

**Output** (`drilling/code/kata-06-linqify-the-loop/expected/main.stdout.txt`):

```text
49000
```

### Kata 07: Record Replaces Class

(Concepts: co-11.)

The starter hand-writes Equals plus GetHashCode for a plate; replace the class with a record like Example 51 teaches. The solution answers True in one line.

**Before** (`drilling/code/kata-07-record-replaces-class/before/Starter.cs`):

```csharp
// Starter: class with hand-written equality. The smell: records do this free.
// => replace with a record following Example 51 and delete the Equals pair
Console.WriteLine(new Plate("rice", 2).Equals(new Plate("rice", 2))); // => True today, one line tomorrow

class Plate // => hand equality: sixteen lines for what one record line gives
{
    public string Dish; // => mutable field, like Example 49 warned about
    public int Qty; // => second field the equality below must remember

    public Plate(string dish, int qty)
    {
        Dish = dish;
        Qty = qty;
    } // => constructor assigns both

    public override bool Equals(object? o) => o is Plate p && p.Dish == Dish && p.Qty == Qty; // => hand field compare

    public override int GetHashCode() => HashCode.Combine(Dish, Qty); // => hand hash to match
}
```

**After** (`drilling/code/kata-07-record-replaces-class/after/Solution.cs`):

```csharp
// Solution: a record replaces the hand equality. Same True, one line.
// => value equality from Example 51: same fields means equal, free
Console.WriteLine(new Plate("rice", 2) == new Plate("rice", 2)); // => Output: True

// => record declaration follows the statement in single-file order
record Plate(string Dish, int Qty); // => positional record: equality by value, free
```

**Output** (`drilling/code/kata-07-record-replaces-class/expected/main.stdout.txt`):

```text
True
```

### Kata 08: Using Closes the Writer

(Concepts: co-01.)

The starter opens a StreamWriter and never disposes it; wrap it in using like Example 8 teaches so the flush is guaranteed. The solution reads the note back as proof.

**Before** (`drilling/code/kata-08-using-closes-the-writer/before/Starter.cs`):

```csharp
// Starter: StreamWriter never disposed. The leak: the flush may never land.
// => wrap in using following Example 8 so disposal is guaranteed
var writer = new System.IO.StreamWriter("note.txt"); // => opened, never closed below
writer.WriteLine("rice x2"); // => sits in the buffer: flush uncertain
Console.WriteLine("wrote note.txt"); // => claims the write without guaranteeing it
```

**After** (`drilling/code/kata-08-using-closes-the-writer/after/Solution.cs`):

```csharp
// Solution: using guarantees the flush. Same note, certain landing.
// => using from Example 8: Dispose flushes and closes on block exit
using (var writer = new System.IO.StreamWriter("note.txt")) // => the writer the block owns
{
    writer.WriteLine("rice x2"); // => lands in the file when the block exits
} // => Dispose flushes here: the note below is guaranteed, not hoped
Console.WriteLine(System.IO.File.ReadAllText("note.txt").Trim()); // => Output: rice x2
```

**Output** (`drilling/code/kata-08-using-closes-the-writer/expected/main.stdout.txt`):

```text
rice x2
```

## Self-check checklist

Twenty-four "I can" items, at least one per concept. Check each honestly; any unchecked item points back to its example for another pass.

- [ ] I can write a guard clause that refuses bad input before the happy path starts (co-01, Example 1).
- [ ] I can choose a switch expression over an if-ladder for ordered mappings (co-01, Example 2).
- [ ] I can throw for contract violations and catch the exact type at the edge (co-02, Examples 9, 16).
- [ ] I can apply the Try-pattern for expected failures like parsing (co-02, Example 10).
- [ ] I can sort failures with exception filters and wrap once per layer (co-02, Examples 11, 13).
- [ ] I can look values up with TryGetValue without throwing on misses (co-03, Example 5).
- [ ] I can build deferred Where-Select pipelines and materialize with ToList (co-03, Example 6).
- [ ] I can sort with an explicit ordinal comparer plus ThenBy tiebreaks (co-03, Example 7).
- [ ] I can build text with StringBuilder and shape it with interpolation (co-04, Examples 18, 19).
- [ ] I can scan text with Regex matches and named groups (co-04, Example 20).
- [ ] I can round-trip small files and JSON with the standard library (co-04, Examples 21, 22).
- [ ] I can compute with DateOnly, TimeOnly, TimeSpan, and DateTimeOffset (co-05, Examples 23, 24, 25).
- [ ] I can organize code with file-scoped namespaces and one type per file (co-06, Examples 26, 27).
- [ ] I can draw access lines with public, internal, and private (co-06, Example 28).
- [ ] I can ship stdlib-only projects and pin versions and frameworks (co-07, Examples 30, 31, 32).
- [ ] I can write arrange-act-assert checks with named helpers (co-08, Examples 35, 38).
- [ ] I can prove failure paths with throws-checks and failing-first pairs (co-08, Examples 36, 39).
- [ ] I can await tasks, fan out with WhenAll, and cancel with tokens (co-09, Examples 54, 55, 56).
- [ ] I can guard shared state with locks, concurrent tables, and Interlocked (co-09, Examples 57, 58, 61).
- [ ] I can write generic methods with constraints that name their powers (co-10, Examples 45, 46).
- [ ] I can choose structs for copies, classes for sharing, and records for values (co-11, Examples 49, 51).
- [ ] I can pass nullable analysis plus warnings-as-errors with scoped pragmas (co-12, Examples 62, 63).
- [ ] I can read interop sizes from the runtime and arguments from the command line (co-13, Examples 69, 70).
- [ ] I can read idiomatic samples top-down by verbs, stages, and asserts (co-16, Examples 71, 74, 78).

## Elaborative interrogation & self-explanation

Six why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer. Argue both sides before reading: the rejected alternative must lose for a reason you can state, and your statement should survive being read aloud to a teammate without embarrassment. These prompts close the course: if every choice below feels obvious, the sixteen concepts have compounded into judgement.

### E1: Why throw for empty orders but return false for bad quantities?

The choice pairs Example 9 with Example 10; the rejected alternative throws for both or returns false for both.

<details><summary>Model answer</summary>

Empty orders violate the method contract, which callers cannot predict, so throwing is honest; bad quantities arrive from user typing, which is routine, so false keeps the loop cheap. Throwing for typos would pay exception costs on the hottest path, while false for contract violations would let corruption travel as data.

</details>

### E2: Why List plus frozen snapshot instead of one mutable table everywhere?

The choice pairs Example 4 with Example 53; the rejected alternative shares one Dictionary for menus, tallies, and hot lookups alike.

<details><summary>Model answer</summary>

Lists grow ergonomically for building, while frozen tables read fastest for serving; one mutable table pays growth tax on reads and shares mutation hazards across roles. Splitting by lifecycle keeps construction handy and hot paths lock-free.

</details>

### E3: Why hand-rolled checks instead of the standard test runner?

The choice spans Examples 35 through 44; the rejected alternative fetches test packages and runs `dotnet test`.

<details><summary>Model answer</summary>

The runner needs packages this offline course never fetches, while the hand-rolled Check teaches the identical arrange-act-assert rhythm with zero supply chain. Real projects graduate to the runner; the convention transfers unchanged because the shape, not the tool, is the lesson.

</details>

### E4: Why records for tickets but classes for kitchens?

The choice pairs Examples 49 and 51 with Example 64; the rejected alternative makes everything a class or everything a record.

<details><summary>Model answer</summary>

Tickets compare by content, so records give value equality free; kitchens hold identity and behavior, so classes give reference semantics. All-class forces hand equality everywhere, while all-record forbids the mutable identity long-lived services need.

</details>

### E5: Why channels plus locks instead of raw threads with shared lists?

The choice spans Examples 57 through 60; the rejected alternative spawns threads that Append to one shared list.

<details><summary>Model answer</summary>

Channels separate producers from consumers without shared mutation, and locks or atomics serialize the updates that must share; raw threads over one list race on every append. Structured primitives make the sharing explicit and the transcript sortable, while raw threads hide both.

</details>

### E6: Why read code top-down instead of diving into helpers first?

The choice is Example 78 against bottom-up curiosity; the rejected alternative starts at Price and climbs toward Run.

<details><summary>Model answer</summary>

Top-down spends attention where traffic flows, reaching leaves only when the path demands them; bottom-up studies leaves whose importance is unknown until the callers arrive. Entry-first reading builds the map before the details, so each helper lands in a known slot instead of floating free.

</details>
