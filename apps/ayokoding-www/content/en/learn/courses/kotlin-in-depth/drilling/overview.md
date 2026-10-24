---
title: Overview
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to Kotlin In Depth: recall first, then applied judgement, then hands-on repetition, then a checklist, then a why and why-not pass to confirm real automaticity rather than recognition. Every answer hides in a `<details>` block; try each item yourself before opening it.

## Recall Q&A

Twenty-four short-answer questions covering each of co-01 to co-16. Answer from memory, then check. Star the ones you miss and repeat them after a day; spaced repetition only works when the misses decide what comes back.

### Q1 (co-01): When does the when-expression beat an if-else chain for choosing values?

<details><summary>Answer</summary>

Arrow arms make fallthrough unrepresentable and the expression form forces exhaustiveness through else, as in Example 1. The if-else chain repeats the target on every branch and invites one branch to assign something else; the when turns the compiler into the exhaustiveness checker.

</details>

### Q2 (co-01): When do you use ranges, and when do you keep the indexed loop?

<details><summary>Answer</summary>

State intervals with `..`, `until`, and `downTo` whenever the bound is data, as in Example 4. Keep the indexed form only when the position itself matters, printing ranks or writing parallel arrays, as in Example 2; indexes elsewhere spend reader attention on bounds that are never the point.

</details>

### Q3 (co-02): What does use guarantee that try-finally only promised?

<details><summary>Answer</summary>

Header-adjacent `use` blocks close every resource on every exit path in reverse order, as in Example 9. The old finally shape asked every author to remember the close in every path; the `use` block makes the leak unwritable instead of merely discouraged.

</details>

### Q4 (co-02): When do you wrap disappointment in runCatching instead of throwing?

<details><summary>Answer</summary>

Wrap expected disappointments like parsing user-typed numbers into a Result value, as in Example 12. Throw for programming bugs and layer crossings with chained causes, as in Example 15; values travel beside successes, exceptions carry stack traces across layers.

</details>

### Q5 (co-02): When do sealed error hierarchies beat exceptions, and what does the compiler audit?

<details><summary>Answer</summary>

Model a fixed handful of failures as a sealed hierarchy when each failure needs a different recovery in the same function, as in Example 14. The compiler audits exhaustiveness: adding a fourth failure breaks every handler until it answers the new shape.

</details>

### Q6 (co-03): What single call keeps map counting to one line, and why does printing need toSortedMap?

<details><summary>Answer</summary>

`groupingBy { it }.eachCount()` folds the tally loop into one stage that cannot forget the zero case, as in Example 6. Printing needs a sorted view because encounter order is input order, not contract order; `toSortedMap` makes map output byte-stable on every run.

</details>

### Q7 (co-03): Why does every printed sort end with a tiebreak, and what proves the source untouched?

<details><summary>Answer</summary>

Equal keys keep encounter order without a tiebreak, so transcripts depend on fixture order, as in Examples 8 and 53. `thenBy` pins the tiebreak to a stated key, and printing the source afterwards proves sorts return new lists while inputs stay put.

</details>

### Q8 (co-04): When does a triple-quoted block beat concatenation, and what sets its margin?

<details><summary>Answer</summary>

Triple-quoted blocks win for multi-line templates where the source should look like the output, as in Example 18. `trimIndent` strips the shared indentation so code nests freely without indenting the output; `trimMargin` with `|` lets ragged lines choose their own margin.

</details>

### Q9 (co-04): Why do file reads state UTF-8 explicitly, and what proves the roundtrip?

<details><summary>Answer</summary>

Platform defaults differ between machines, so omitted charsets corrupt non-ASCII names in transit, as in Example 21. The roundtrip check `back == body` with non-ASCII fixture names proves both directions; a fixture of pure ASCII would prove nothing.

</details>

### Q10 (co-05): Why must time tests parse fixed instants instead of reading the clock?

<details><summary>Answer</summary>

Clocks build a different moment per run and turn transcripts into snowflakes the harness cannot match, as in Example 24. Parsed instants plus `Duration.between` compute windows as data; fixed inputs make temporal logic testable and transcripts byte-stable forever.

</details>

### Q11 (co-06): What makes a package boundary real rather than conventional?

<details><summary>Answer</summary>

A real boundary shows in imports and visibility: related files share one package and import exactly what they use, while internals stay reachable only within the module, as in Examples 27 and 28. Conventional boundaries (a folder with no package discipline) let every file reach every other and the imports prove nothing.

</details>

### Q12 (co-06): When does internal earn its keep over private and public?

<details><summary>Answer</summary>

Internal shares the module workshop (parsers, test helpers) across files while hiding it from dependents, as in Example 28. Private suits single-file machinery; public promises the surface. Reach for internal when two module files must collaborate without publishing to the world.

</details>

### Q13 (co-07): Why do exact pins beat ranges, and what is stdlib-only in this argument?

<details><summary>Answer</summary>

Ranges resolve differently next month and turn builds into weather; pins resolve identically until a human edits the table, as in Example 31. Stdlib-only means this course pins nothing of its own, yet still teaches the convention by parsing committed fixtures, as in Examples 31 and 32.

</details>

### Q14 (co-08): What earns a check the right to be trusted: the PASS line or something else?

<details><summary>Answer</summary>

The red run earns it: a check that never failed might assert nothing, so failing-test-first calibrates the instrument before it measures, as in Example 41. The PASS line then reads as specification and the lazy message names the contract for red days.

</details>

### Q15 (co-08): Why do file tests belong in temp dirs, and what must assertions avoid?

<details><summary>Answer</summary>

Course-tree writes pollute reruns with leftovers from crashed runs, so `createTempFile` gives each test a private path deleted in `finally`, as in Example 40. Assertions must avoid clocks, paths, timings, and addresses: fixed labels and counted bytes keep transcripts byte-stable.

</details>

### Q16 (co-09): How do you keep concurrent output deterministic?

<details><summary>Answer</summary>

Join every worker, then print from the main thread in a fixed order, sorting shared results first, as in Examples 54 and 59. Concurrency decides timing; joins plus sorting decide the transcript, so the same correct values print identically on every schedule.

</details>

### Q17 (co-09): Who ends a BlockingQueue stream, and why bounded over unbounded?

<details><summary>Answer</summary>

The poison pill ends it, traveling last so ordering guarantees it arrives after all data, as in Examples 57 and 60. Bounded queues state how far ahead producers may run, which keeps memory honest; unbounded queues turn a fast producer into a memory surprise.

</details>

### Q18 (co-10): What decides a type parameter's bound, and how tight should it be?

<details><summary>Answer</summary>

The body's operations decide: each operation must be justified by a bound on the declaration, as in Example 47. Choose the tightest bound that admits every intended caller; tight bounds move impossibilities into the compiler so tests cover behavior instead of misuse.

</details>

### Q19 (co-11): When do you copy at the trust edge, and what does the copy buy?

<details><summary>Answer</summary>

Copy shared collections with `toList` and update values with `copy` wherever ownership crosses a boundary, as in Examples 7 and 50. The copy buys time travel: earlier states stay intact for audit trails, and call order stops changing what shared data contains.

</details>

### Q20 (co-12): What do staged deprecations buy, and how do you adopt them on legacy callers?

<details><summary>Answer</summary>

WARNING announces with a working function, ERROR breaks stragglers, HIDDEN removes the symbol, so migration runs on a calendar instead of a flag day, as in Example 65. `ReplaceWith` automates the mechanical rewrite; adopt by migrating call sites stage by stage while the build stays green.

</details>

### Q21 (co-13): Where does the interop edge bite, and how do you pin it?

<details><summary>Answer</summary>

Java types arrive as platform types the compiler cannot verify, so pin nullability to an explicit type at the exact boundary line, as in Example 69. Compile each side with its own tool against the other's output, and validate outward-crossing arguments on the Kotlin side, as in Example 70.

</details>

### Q22 (co-14): What keeps names honest, and what is the abbreviation policy?

<details><summary>Answer</summary>

Names must read aloud as the domain speaks: `settleOutstanding`, never `processData`, as in Example 62. Domain abbreviations every reader shares stay; clever shortenings go. Automated checks cannot taste names, so the read-aloud test at review time is the whole enforcement.

</details>

### Q23 (co-15): When does buildString pay, and when is plus already fine?

<details><summary>Answer</summary>

Builders pay for loop-built strings where plus copies per iteration, turning quadratic work linear, as in Example 68. Plus stays for two-or-three-piece straight lines the compiler folds. The boundary is structural: loops and growing reports earn builders, single expressions keep plus.

</details>

### Q24 (co-16): What is the four-pass route over an unfamiliar program, and what does each pass answer?

<details><summary>Answer</summary>

Pass one reads `main` for the pipeline shape, pass two finds the data contract for what flows, pass three reads handlers for the routing, pass four goes one helper deep, as in Example 78. Each pass answers one question and ignores the rest, so the program fits working memory by the end.

</details>

## Applied problems

Eight applied judgement problems. Themes: rewrite a non-idiomatic Kotlin sample (translated from another language) into idiomatic Kotlin; choose the right error-handling approach for three different failure scenarios; find the standard-library function that replaces a hand-rolled helper. Write your answer before comparing with a peer's; the commentary names what a good answer covers.

### Problem 1: Rewrite the translated accent

A Java-translated dues reporter uses indexed loops, null returns for missing members, string paths for file reads, and a statement switch for tiering. Rewrite it into idiomatic Kotlin using element loops, nullable types with Elvis defaults, `File` with explicit charsets, and a when-expression. Name each accent you removed and the Kotlin habit that replaced it.

### Problem 2: Choose the failure shape

Three scenarios: a mistyped amount in interactive input, a missing fixture file in a test, a negative dues value from a corrupt import. Assign each one of runCatching-with-default, exception-with-chained-cause, or require-refusal, and defend each assignment in two sentences: why this shape fits this failure and what the other shapes would cost here.

### Problem 3: Replace the hand-rolled helper

A codebase carries three hand-rolled utilities: a join loop with a first-element flag, a tally loop with a containsKey check, and a max loop over a list. Replace each with its standard-library call (`joinToString`, `groupingBy.eachCount`, `maxOrNull`), then state for each what edge case the library handles that the loop fumbled or hid.

### Problem 4: Flatten the admission check

A four-level nested admission function validates member, amount, window, and tier in one ladder. Flatten it with guard clauses, then write the three-check boundary family (empty, single, many) for the resulting function. State which nesting level hid the most important refusal and why the flat order reads better.

### Problem 5: Bound the parallel settlement

Ten thousand dues lines must settle across workers with a byte-stable transcript. Choose partitions versus a guarded sink, a latch versus joins, and state exactly where the sort happens and why. Sketch the program in ten lines and mark the one line whose removal would make output nondeterministic.

### Problem 6: Pin the untested parser

A date parser is tested only on one happy path and reads the system zone. Write the boundary family (five shapes: good, blank, shapeless, unparsable, out-of-window), inject the zone and the clock as parameters, and pin the failure contracts for the three refusals. State which test would have caught the last production bug.

### Problem 7: Audit the swallowed causes

Three catch blocks translate failures without chaining: a file read, a config parse, and a settlement call. Rewrite each with a chained cause, then walk one chain aloud from transcript to root: which message names the layer, which names the root, and what the debugger does with each. State the one-line rule that prevents the next swallow.

### Problem 8: Read a stranger's settler

You receive a 200-line settlement program you have never seen. Perform the four passes (main shape, data contract, handler routing, one helper deep) and write one sentence per pass plus a fifth sentence stating the program's contract. Time yourself: the four sentences should take under fifteen minutes for this size.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Make the starter match before peeking. Work them in order: the error-shape and test katas first, because absence policy and assertion habits underlie everything; the join, flatten, wrap, and counter katas next, because they train the four reflexes daily Kotlin demands; the generics and tiebreak katas after, because they isolate one design judgement each.

### Kata 01: Throw to Result

(Concepts: co-02.)

Throwing on absence forces every caller to try-catch a calm question. Return the calm answer as a value instead: unknown members resolve to zero at the call site, and no stack unwinds for a question with a peaceful answer.

**Before** (`drilling/code/kata-01-throw-to-result/before/Starter.kt`):

```kotlin
// Starter: absence by throwing. The smell: a lookup that explodes
// forces every caller to try-catch a question with a calm answer.
// Your task: return zero for unknown members instead; resolve at the call site.
fun duesOf(member: String): Int { // => explodes on absence: the shape to fix
    val ledger = mapOf("sari" to 50, "budi" to 75) // => fixed fixture ledger
    return ledger[member] ?: throw IllegalArgumentException("unknown member: " + member) // => explosion for a calm question
} // => starter ends: throwing lookup, callers beware

fun main() { // => runs only for known members today
    println("sari: " + duesOf("sari")) // => prints 50, never faces absence
} // => main ends: absence untested, explosion waiting
// fix me: calm zero out, explosion never
```

**After** (`drilling/code/kata-01-throw-to-result/after/Solution.kt`):

```kotlin
// Solution: absence as a calm value. The lookup returns zero for
// unknown members, and the call site prints without ceremony.
// Fixed from Starter: throwing lookup became a calm default.
fun duesOf(member: String): Int { // => absence answered in the type's own way
    val ledger = mapOf("sari" to 50, "budi" to 75) // => same fixture ledger
    return ledger[member] ?: 0 // => calm zero: no throw, no try, no ceremony
} // => helper ends: questions stay questions, never explosions

fun main() { // => the entry point the harness runs
    println("sari: " + duesOf("sari")) // => Output: sari: 50
    println("dewi: " + duesOf("dewi")) // => Output: dewi: 0, absent reads as zero
    println("present: " + (duesOf("budi") == 75)) // => Output: present: true
} // => main ends: absence handled, nothing thrown
```

**Output** (`drilling/code/kata-01-throw-to-result/expected/main.stdout.txt`):

```text
sari: 50
dewi: 0
present: true
```

### Kata 02: First Check Suite

(Concepts: co-08.)

Printing values proves nothing when the expectation lives only in the reader's head. State the expectation as a check: booleans the toolchain evaluates on every run, with PASS lines that read as specifications and messages that name contracts on red days.

**Before** (`drilling/code/kata-02-first-check-suite/before/Starter.kt`):

```kotlin
// Starter: prints without expectations. The smell: values scroll by
// and correctness lives in the reader's head, unverified by anything.
// Your task: state three contracts with check plus PASS lines.
fun totalOf(dues: Map<String, Int>): Int = dues.values.sum() // => the unit, untested so far

fun main() { // => prints answers nobody verifies
    println(totalOf(mapOf("sari" to 50, "budi" to 75))) // => 125, allegedly
    println(totalOf(emptyMap())) // => 0, allegedly
} // => main ends: output without oracle, green by inspection
// fix me: check plus PASS lines, contracts named
```

**After** (`drilling/code/kata-02-first-check-suite/after/Solution.kt`):

```kotlin
// Solution: contracts as checks. Each boolean states what must hold,
// each PASS line reads as specification, each message names red days.
// Fixed from Starter: inspection became evaluation.
fun totalOf(dues: Map<String, Int>): Int = dues.values.sum() // => the unit under test, pure

fun main() { // => the entry point the harness runs, and the test runner
    check(totalOf(mapOf("sari" to 50, "budi" to 75)) == 125) { "two members total 125" } // => contract one, named
    println("PASS: two members total 125") // => Output: the first specification
    check(totalOf(emptyMap()) == 0) { "empty ledger settles zero" } // => contract two, the edge
    println("PASS: empty ledger settles zero") // => Output: the edge, pinned
    check(totalOf(mapOf("x" to 1, "y" to 2)) == 3) { "small ledger totals 3" } // => contract three
    println("PASS: small ledger totals 3") // => Output: the third specification
} // => main ends: three contracts, three verdicts, zero framework
```

**Output** (`drilling/code/kata-02-first-check-suite/expected/main.stdout.txt`):

```text
PASS: two members total 125
PASS: empty ledger settles zero
PASS: small ledger totals 3
```

### Kata 03: Hand-rolled Join

(Concepts: co-04.)

The standard library already joins: hand-rolled concatenation loops re-implement joinToString badly, usually with a trailing separator or a special-cased first element. Delete the loop, name the separator, and let the stdlib own the edge cases it already tested.

**Before** (`drilling/code/kata-03-hand-rolled-join/before/Starter.kt`):

```kotlin
// Starter: a hand-rolled join. The smell: the loop re-implements
// joinToString with a flag variable tracking the first element.
// Your task: replace the loop with joinToString and its separator.
fun joinMembers(members: List<String>): String { // => the loop to delete
    var out = "" // => accumulator plus flag: the two moving parts
    var first = true // => the flag joinToString makes unnecessary
    for (m in members) { // => hand iteration over a solved problem
        if (!first) out += ", " // => separator logic, hand-placed
        out += m // => copy per iteration, quadratic besides
        first = false // => flag maintenance, the tax on every reader
    } // => loop ends: correct, slow, and longer than the answer
    return out // => the answer joinToString gives in one call
} // => starter ends: working code that should not exist

fun main() { // => demonstrates the loop, separator and all
    println(joinMembers(listOf("sari", "budi"))) // => sari, budi, via the long road
} // => main ends: the flag variable's last stand
// fix me: joinToString with ", ", no loop, no flag
```

**After** (`drilling/code/kata-03-hand-rolled-join/after/Solution.kt`):

```kotlin
// Solution: the stdlib owns joining. One call names the separator;
// no loop, no flag, no trailing separator, no quadratic copying.
// Fixed from Starter: the loop became a library call.
fun joinMembers(members: List<String>): String { // => the separator as data
    return members.joinToString(", ") // => separators between, never trailing
} // => helper ends: one line where nine stood

fun main() { // => the entry point the harness runs
    println(joinMembers(listOf("sari", "budi", "citra"))) // => Output: sari, budi, citra
    println("empty: [" + joinMembers(emptyList()) + "]") // => Output: empty: []
    println("single: " + joinMembers(listOf("sari"))) // => Output: single: sari
} // => main ends: the edges the loop got right, kept by the library
```

**Output** (`drilling/code/kata-03-hand-rolled-join/expected/main.stdout.txt`):

```text
sari, budi, citra
empty: []
single: sari
```

### Kata 04: Flatten Nested Checks

(Concepts: co-01.)

Nested validation buries the happy path three indentations deep, where every reader must hold every condition to reach it. Return each refusal at the door instead: guards in, flat work after. Same decisions, one indentation, readers that survive contact with the third condition.

**Before** (`drilling/code/kata-04-flatten-nested-checks/before/Starter.kt`):

```kotlin
// Starter: nested validation. The smell: the real work sits three
// indentations deep and every reader holds every condition to reach it.
// Your task: return each refusal early; keep the happy path flat.
fun greet(name: String?): String { // => the ladder to flatten
    if (name != null) { // => level one: existence
        if (name.isNotBlank()) { // => level two: content
            if (name.length <= 20) { // => level three: size
                return "Hello, " + name + "!" // => the work, buried deep
            } else { // => else branches multiply with nesting
                return "error: too long" // => refusal three, far from its check
            } // => level three ends
        } else { // => refusal two, one level up from its check
            return "error: blank name" // => readers hold two conditions to arrive
        } // => level two ends
    } else { // => refusal one, farthest from its check
        return "error: missing name" // => readers hold everything to arrive
    } // => level one ends: the ladder complete, readability spent
} // => starter ends: correct decisions, exhausting shape

fun main() { // => exercises the ladder, all four rungs
    println(greet("Sari")) // => Hello, Sari!, via three levels
} // => main ends: one call down the ladder
// fix me: guards at the door, happy path flat
```

**After** (`drilling/code/kata-04-flatten-nested-checks/after/Solution.kt`):

```kotlin
// Solution: guards at the door. Each refusal returns immediately, so
// the happy path sits at the margin with no nesting around the work.
// Fixed from Starter: the ladder became three exits plus one greeting.
fun greet(name: String?): String { // => flat by construction, not by care
    if (name == null) return "error: missing name" // => refusal one, at the door
    if (name.isBlank()) return "error: blank name" // => refusal two, at the door
    if (name.length > 20) return "error: too long" // => refusal three, at the door
    return "Hello, " + name + "!" // => the work, flat and obvious
} // => helper ends: three exits, one greeting, zero nesting

fun main() { // => the entry point the harness runs
    println(greet(null)) // => Output: error: missing name
    println(greet("   ")) // => Output: error: blank name
    println(greet("Sari")) // => Output: Hello, Sari!
} // => main ends: every refusal and the success, each flat
```

**Output** (`drilling/code/kata-04-flatten-nested-checks/expected/main.stdout.txt`):

```text
error: missing name
error: blank name
Hello, Sari!
```

### Kata 05: Chain the Cause

(Concepts: co-02.)

Catching a failure and throwing a bare replacement orphans the diagnosis: the layer message survives but the root the debugger needs is gone. Chain the cause with the one-argument constructor and both stories travel: the outer message for the catching layer, the inner chain for whoever debugs it.

**Before** (`drilling/code/kata-05-chain-the-cause/before/Starter.kt`):

```kotlin
// Starter: the swallowed cause. The smell: the file error becomes a
// ledger message with no chain, so debuggers guess at the root.
// Your task: chain the cause; print both messages to prove it.
import java.io.File // => the file layer that reports first

class LedgerException(message: String) : Exception(message) // => no cause slot: the story ends here

fun loadLedger(path: String): String { // => translates file failures upward
    try { // => the file operation that can disappoint
        return File(path).readText(Charsets.UTF_8) // => missing fixture throws below
    } catch (e: Exception) { // => caught, then orphaned on the next line
        throw LedgerException("cannot settle " + path) // => the cause dropped: diagnosis guesses now
    } // => translation without receipt: the smell, one line
} // => starter ends: layer message only, root lost

fun main() { // => walks a chain that is not there
    try { // => the transcript tries to walk the chain
        loadLedger("no-such-ledger.txt") // => missing fixture, as designed
    } catch (e: LedgerException) { // => the ledger language arrives, alone
        println("ledger: " + e.message) // => the outer story, half the truth
    } // => main ends: one story where two belong
} // => fix me: chain the cause, walk both messages
```

**After** (`drilling/code/kata-05-chain-the-cause/after/Solution.kt`):

```kotlin
// Solution: translation with receipt. The ledger message names the
// layer, the chained cause names the root: two stories, one throw.
// Fixed from Starter: the orphaned cause travels again.
import java.io.File // => the file layer that reports first

class LedgerException(message: String, cause: Throwable?) : Exception(message, cause) // => the cause slot restored

fun loadLedger(path: String): String { // => translates file failures upward, receipt kept
    try { // => the file operation that can disappoint
        return File(path).readText(Charsets.UTF_8) // => missing fixture throws below
    } catch (e: Exception) { // => caught, then chained on the next line
        throw LedgerException("cannot settle " + path, e) // => both stories travel now
    } // => translation with receipt: the fix, one argument
} // => callers catch LedgerException and still reach the file error

fun main() { // => the entry point the harness runs
    try { // => the transcript walks the chain on purpose
        loadLedger("no-such-ledger.txt") // => missing fixture: the file layer complains
    } catch (e: LedgerException) { // => the ledger language arrives with its root
        println("ledger: " + e.message) // => Output: ledger: cannot settle no-such-ledger.txt
        println("cause: " + (e.cause?.javaClass?.simpleName ?: "none")) // => Output: cause: FileNotFoundException
    } // => both layers named, the story complete
} // => main ends: translation with the receipt kept
```

**Output** (`drilling/code/kata-05-chain-the-cause/expected/main.stdout.txt`):

```text
ledger: cannot settle no-such-ledger.txt
cause: FileNotFoundException
```

### Kata 06: Lock-free Counter

(Concepts: co-09.)

A plain variable shared across threads loses increments: two workers read-modify-write between each other's steps and one update silently overwrites the other. The atomic counter folds each increment into one indivisible step, and the latch proves the total after all workers finish. Shared mutation earns atomics; the transcript earns exactness.

**Before** (`drilling/code/kata-06-lock-free-counter/before/Starter.kt`):

```kotlin
// Starter: the racy counter. The smell: total is a plain var shared
// across ten threads, so increments interleave and updates vanish.
// Your task: AtomicInteger plus a latch; the total must read exactly 1000.
// NOTE: this starter never runs green; only the After solution runs.
import kotlin.concurrent.thread // => workers share the plain var below

var total = 0 // => shared and unguarded: the race lives here

fun main() { // => launches ten threads at one variable
    val workers = (1..10).map { // => ten workers, fixed roster
        thread { repeat(100) { total++ } } // => read-modify-write, interleaved
    } // => workers launched at the shared var
    workers.forEach { it.join() } // => joined, but the damage is done
    println("total: " + total) // => short of 1000 by a scheduler-chosen amount
} // => main ends: usually red, always untrustworthy
// fix me: AtomicInteger, latch, exact 1000
```

**After** (`drilling/code/kata-06-lock-free-counter/after/Solution.kt`):

```kotlin
// Solution: atomics plus a latch. Each increment is indivisible, the
// latch waits for all ten workers, and the total reads exactly 1000.
// Fixed from Starter: the race became an atomic plus a wait.
import java.util.concurrent.CountDownLatch // => waits for all workers, deterministically
import java.util.concurrent.atomic.AtomicInteger // => the indivisible counter
import kotlin.concurrent.thread // => one lambda per worker

fun main() { // => the entry point the harness runs
    val total = AtomicInteger(0) // => shared counter: atomic, never plain var
    val latch = CountDownLatch(10) // => ten workers to wait for
    repeat(10) { // => ten identical workers, fixed count
        thread { // => each worker adds its hundred, then counts down
            repeat(100) { total.incrementAndGet() } // => indivisible: no update lost between threads
            latch.countDown() // => this worker finished its full share
        } // => worker ends: a hundred added, one tick spent
    } // => all ten launched; the latch decides when reading is safe
    latch.await() // => completion as one ordered moment
    println("total: " + total.get()) // => Output: total: 1000, every run
} // => main ends: shared mutation through atomics, exact transcript
```

**Output** (`drilling/code/kata-06-lock-free-counter/expected/main.stdout.txt`):

```text
total: 1000
```

### Kata 07: One Max for All

(Concepts: co-10.)

Three type-specific maximums duplicate one idea across Int, String, and every type that follows. Bound a single generic by Comparable and the one function serves all orderable types: fix once, apply everywhere, and let unorderable callers fail at compile time instead of in a fourth copy.

**Before** (`drilling/code/kata-07-one-max-for-all/before/Starter.kt`):

```kotlin
// Starter: three maximums, one idea. The smell: each type gets its
// own copy, so every fix ships three times and the fourth type waits.
// Your task: one generic maxOfAll bounded by Comparable for all three.
fun maxInt(a: Int, b: Int): Int = if (a >= b) a else b // => copy one: integers

fun maxString(a: String, b: String): String = if (a >= b) a else b // => copy two: strings

fun maxLong(a: Long, b: Long): Long = if (a >= b) a else b // => copy three: longs, the pattern visible

fun main() { // => calls each copy once, triplicating the idea
    println(maxInt(50, 75)) // => 75, via the integer copy
    println(maxString("budi", "sari")) // => sari, via the string copy
} // => main ends: three copies, one idea, the tax itemized
// fix me: fun <T : Comparable<T>> maxOfAll, one function
```

**After** (`drilling/code/kata-07-one-max-for-all/after/Solution.kt`):

```kotlin
// Solution: one bound maximum. Comparable buys ordering for every
// type at once; unorderable callers fail at compile time, not in copy four.
// Fixed from Starter: three copies became one bound function.
fun <T : Comparable<T>> maxOfAll(a: T, b: T): T = if (a >= b) a else b // => the honest list: ordering needed, ordering stated

fun main() { // => the entry point the harness runs
    println(maxOfAll(50, 75)) // => Output: 75, integers through the generic
    println(maxOfAll("budi", "sari")) // => Output: sari, strings through the same generic
    println(maxOfAll(50L, 25L)) // => Output: 50, longs through the same generic
} // => main ends: one function, three types, zero copies
```

**Output** (`drilling/code/kata-07-one-max-for-all/expected/main.stdout.txt`):

```text
75
sari
50
```

### Kata 08: Tiebreak Ranks

(Concepts: co-03.)

Sorting by dues alone leaves equal-dues members in input order, so the transcript depends on how the fixture happened to list them. Chain thenBy with the member name and the ranking is total: equal dues break alphabetically, and the transcript is identical on every run. Tiebreaks are not polish but determinism.

**Before** (`drilling/code/kata-08-tiebreak-ranks/before/Starter.kt`):

```kotlin
// Starter: single-key ranking. The smell: equal dues keep input order,
// so the transcript depends on fixture order instead of stating its own.
// Your task: sortedWith compareByDescending dues thenBy name.
fun main() { // => ranks by dues alone, ties accidental
    val dues = mapOf("sari" to 50, "budi" to 75, "citra" to 75) // => budi and citra tie at 75
    val ranked = dues.keys.sortedByDescending { dues.getValue(it) } // => dues down, ties in encounter order
    println(ranked) // => [budi, citra]: true today, accidental by fixture order
} // => main ends: correct values, unpinned ties
// fix me: thenBy name, total ranking, stated order
```

**After** (`drilling/code/kata-08-tiebreak-ranks/after/Solution.kt`):

```kotlin
// Solution: the total ranking. Dues descend, names ascend inside ties,
// so equal members order by statement instead of by fixture accident.
// Fixed from Starter: accidental ties became a stated tiebreak.
fun main() { // => the entry point the harness runs
    val dues = mapOf("sari" to 50, "budi" to 75, "citra" to 75) // => the same tie at 75
    val ranked = dues.keys.sortedWith(compareByDescending<String> { dues.getValue(it) }.thenBy { it }) // => dues down, names up
    println(ranked) // => Output: [budi, citra, sari], stated not accidental
    println("tiebreak: name") // => Output: tiebreak: name
} // => main ends: total order, byte-stable transcript, ties pinned
```

**Output** (`drilling/code/kata-08-tiebreak-ranks/expected/main.stdout.txt`):

```text
[budi, citra, sari]
tiebreak: name
```

## Self-check checklist

Twenty-four "I can ..." items, at least one per concept. Check each honestly; uncheck and revisit the named example for every miss.

1. [ ] I can choose values with a when-expression and cover every input with else (co-01).
2. [ ] I can iterate elements directly and reserve indices for positions that are data (co-01).
3. [ ] I can flatten validation ladders into guard clauses with the cheapest check first (co-01).
4. [ ] I can state intervals as ranges and test membership with in instead of bound arithmetic (co-01).
5. [ ] I can close every resource with use and state UTF-8 on every file operation (co-02).
6. [ ] I can model absence with nullable types, traverse with ?., and default with ?: (co-02).
7. [ ] I can enforce contracts with require for callers and check for state, each messaged (co-02).
8. [ ] I can wrap expected disappointments in runCatching and resolve with getOrElse (co-02).
9. [ ] I can chain fallible stages with map and resolve both branches once with fold (co-02).
10. [ ] I can list fixed failure sets as sealed hierarchies and handle every arm in when (co-02).
11. [ ] I can count by key with groupingBy.eachCount and sort maps before printing (co-03).
12. [ ] I can rank with sortedBy, pin ties with thenBy, and keep sorts pure (co-03).
13. [ ] I can build multi-line text with triple-quoted blocks and trimIndent or trimMargin (co-04).
14. [ ] I can align tables with format verbs and quote-aware-parse CSV with a state machine (co-04).
15. [ ] I can parse fixed instants, compute with Duration, and zone only for display (co-05).
16. [ ] I can group files into packages, mark visibility, and keep the module boundary visible (co-06).
17. [ ] I can pin versions in a catalog and verify lock entries by shape (co-07).
18. [ ] I can state contracts with check, run them independently, and name failures (co-08).
19. [ ] I can build fresh fixtures per check and cover empty, single, and many (co-08).
20. [ ] I can share work across threads with atomics, guards, queues, and latches deterministically (co-09).
21. [ ] I can parameterize logic with generics and bound parameters by what the body uses (co-10).
22. [ ] I can carry data in data classes, update with copy, and snapshot lists at trust edges (co-11).
23. [ ] I can deprecate in stages, format mechanically, and defer work with sequences (co-12).
24. [ ] I can read any unfamiliar program in four passes and state its contract in one sentence (co-16).

## Elaborative interrogation & self-explanation

Six why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer. Cover the answer, argue both sides aloud, then compare: the argument is the learning, not the verdict.

### E1: Why does Kotlin mark absence with ? instead of permitting null everywhere, and what breaks if you force !! at every boundary?: Nullability in the type moves the absence decision from discipline to declaration: callers see which functions can come back empty and handle exactly those. Forcing `!!` at every boundary trades compile-time knowledge for runtime explosions and returns to the null-permissive world where every dereference is a guess. The rejected alternative (unchecked nulls) optimizes writing speed and taxes reading safety; Kotlin taxes the boundary once so every use after is free.?

Nullability in the type moves the absence decision from discipline to declaration: callers see which functions can come back empty and handle exactly those. Forcing `!!` at every boundary trades compile-time knowledge for runtime explosions and returns to the null-permissive world where every dereference is a guess. The rejected alternative (unchecked nulls) optimizes writing speed and taxes reading safety; Kotlin taxes the boundary once so every use after is free.

Rejected: permit null everywhere and assert non-null with !! wherever convenient.

### E2: Why do immutable values beat defensive discipline, and when do you still copy?: Values cannot be half-edited, so sharing them needs no locks, no timing arguments, and no happens-before stories; discipline asks every holder to behave and fails at the first careless one. Copies still cost at trust edges where producers keep mutating the original, which is why `toList` and `copy` exist: freeze the moment, share the frozen. The rejected alternative (shared mutable state plus careful conventions) works until the second author arrives.?

Values cannot be half-edited, so sharing them needs no locks, no timing arguments, and no happens-before stories; discipline asks every holder to behave and fails at the first careless one. Copies still cost at trust edges where producers keep mutating the original, which is why `toList` and `copy` exist: freeze the moment, share the frozen. The rejected alternative (shared mutable state plus careful conventions) works until the second author arrives.

Rejected: share mutable collections and rely on conventions not to mutate them.

### E3: Why does the standard library win over a dependency for text, time, and sorting, and where does it end?: The stdlib ships with the toolchain, carries no version to pin, and covers the daily ninety percent (joining, grouping, parsing instants, ranking) with tested code every reader knows. Dependencies earn their keep past that edge: real date arithmetic across zones, JSON binding, web serving. The rejected alternative (a dependency per task) trades one import for a version table, a lock, and a supply-chain entry per convenience.?

The stdlib ships with the toolchain, carries no version to pin, and covers the daily ninety percent (joining, grouping, parsing instants, ranking) with tested code every reader knows. Dependencies earn their keep past that edge: real date arithmetic across zones, JSON binding, web serving. The rejected alternative (a dependency per task) trades one import for a version table, a lock, and a supply-chain entry per convenience.

Rejected: adopt a library for every task the standard library already covers.

### E4: Why do narrow package APIs compose better than wide ones, and what breaks when a package grows?: Narrow APIs (one parser, one total) compose because callers combine small promises into new behavior without inheriting decisions they did not ask for. Wide packages accumulate helpers that share names, overlap duties, and change for one caller's reason while breaking another's. The rejected alternative (one `util` package for everything) optimizes finding code and taxes understanding it; dues-shaped packages optimize both.?

Narrow APIs (one parser, one total) compose because callers combine small promises into new behavior without inheriting decisions they did not ask for. Wide packages accumulate helpers that share names, overlap duties, and change for one caller's reason while breaking another's. The rejected alternative (one `util` package for everything) optimizes finding code and taxes understanding it; dues-shaped packages optimize both.

Rejected: grow one shared package until every helper lives in the same namespace.

### E5: Why sort before printing instead of asserting on arrival order in concurrent programs?: Arrival order is the scheduler's mood, not the program's contract: asserting on it turns green runs into luck and red runs into mysteries. Sorting states the contract (ranked output) and makes the transcript a property of the values, reproducible on every machine. The rejected alternative (asserting raw arrival order) tests the scheduler instead of the program and flakes exactly when confidence matters.?

Arrival order is the scheduler's mood, not the program's contract: asserting on it turns green runs into luck and red runs into mysteries. Sorting states the contract (ranked output) and makes the transcript a property of the values, reproducible on every machine. The rejected alternative (asserting raw arrival order) tests the scheduler instead of the program and flakes exactly when confidence matters.

Rejected: assert concurrent output in whatever order threads happen to finish.

### E6: Why is a failing-first test worth the extra red step, and when is it theater?: The red step calibrates the instrument: a check that never failed might assert nothing, and only the red run proves it can catch the bug it names. It becomes theater when the contract is trivially coupled to the implementation (testing the code against itself) or when the red is never actually run. Real calibration runs red, names the break, then earns its green; theater skips the run and keeps the ceremony.?

The red step calibrates the instrument: a check that never failed might assert nothing, and only the red run proves it can catch the bug it names. It becomes theater when the contract is trivially coupled to the implementation (testing the code against itself) or when the red is never actually run. Real calibration runs red, names the break, then earns its green; theater skips the run and keeps the ceremony.

Rejected: write checks only after the implementation and never watch them fail.
