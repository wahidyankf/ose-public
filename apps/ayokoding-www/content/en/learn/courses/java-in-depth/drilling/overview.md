---
title: Overview
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to Java In Depth: recall first, then applied judgement, then hands-on repetition, then a checklist, then a why and why-not pass to confirm real automaticity rather than recognition. Every answer hides in a `<details>` block; try each item yourself before opening it.

## Recall Q&A

Twenty-four short-answer questions covering each of co-01 to co-16. Answer from memory, then check. Star the ones you miss and repeat them after a day; spaced repetition only works when the misses decide what comes back.

### Q1 (co-01): Why does the switch expression beat the statement switch for choosing values?

<details><summary>Answer</summary>

Arrow arms make fallthrough unrepresentable and the expression form forces exhaustiveness through default, as in Example 1. The statement switch needed a break per branch and invited silent slide-through; the expression turns the compiler into the exhaustiveness checker.

</details>

### Q2 (co-01): When do you use the enhanced for loop, and when do you keep the index?

<details><summary>Answer</summary>

Iterate elements with the enhanced for loop whenever the position is not data, as in Example 2. Keep the indexed form only when the position itself matters, printing ranks or writing parallel arrays; indexes elsewhere spend reader attention on bounds that are never the point.

</details>

### Q3 (co-02): Why do guard clauses come before the happy path instead of nesting inside validation?

<details><summary>Answer</summary>

Failures handled first leave the success path at the margin with no nesting, as in Example 3. Early returns turn preconditions into exits instead of indentation, so readers meet each refusal once and then forget it.

</details>

### Q4 (co-02): What does try-with-resources guarantee that try-finally only promised?

<details><summary>Answer</summary>

Header-declared resources close on every exit path in reverse declaration order, as in Example 9. The old finally shape asked every author to remember the close in every path; the header makes the leak unwritable instead of merely discouraged.

</details>

### Q5 (co-02): When do you chain the cause, and what is lost when you translate without one?

<details><summary>Answer</summary>

Chain the cause whenever a failure crosses a layer boundary, as in Example 11. Translating without the cause orphans the stack trace: the layer message survives but every downstream diagnosis guesses at the root the handler can no longer walk to with getCause.

</details>

### Q6 (co-03): What single call keeps map counting to one line, and why does printing need TreeMap?

<details><summary>Answer</summary>

getOrDefault treats missing keys as zero so the tally is one put line, as in Example 5. Printing needs a TreeMap copy because HashMap iteration order is unspecified; the sorted view makes map output deterministic on every run.

</details>

### Q7 (co-03): Why does the stream pipeline end with sorted before collecting for transcripts?

<details><summary>Answer</summary>

Parallel or unordered sources would otherwise print in schedule order, as in Examples 8 and 60. Sorted before collect restores a deterministic order, so the transcript proves the transformation instead of recording the scheduler's mood.

</details>

### Q8 (co-04): When does a text block beat concatenation, and what sets its margin?

<details><summary>Answer</summary>

Text blocks win for multi-line templates where the source should look like the output, as in Example 18. The closing delimiter's indentation sets the stripped margin, so code nests freely without indenting the output; formatted fills the placeholders after the strip.

</details>

### Q9 (co-04): Why do file reads state UTF-8 explicitly, and what proves the roundtrip?

<details><summary>Answer</summary>

Omitting the charset adopts the machine default and corrupts non-ASCII text on exactly the irreproducible machines, as in Example 21. Comparing what came back with what went in and printing the boolean proves fidelity mechanically instead of asking a human to eyeball text.

</details>

### Q10 (co-05): Why must time tests parse fixed instants instead of reading the clock?

<details><summary>Answer</summary>

Instant.now injects the wall clock into the transcript so reruns disagree, as in Example 24. Fixed parses make spans deterministic and assertable; Duration arithmetic then stays inside the type with factories naming their units instead of magic sixties.

</details>

### Q11 (co-06): What makes a package boundary real rather than conventional?

<details><summary>Answer</summary>

Package-private visibility enforced by the compiler, as in Example 27. The commented subtotal call marks the line: uncommenting breaks the build, which proves importers cannot depend on what they cannot see; moving a class grants it the new package's secrets.

</details>

### Q12 (co-06): When does a module descriptor earn its two lines?

<details><summary>Answer</summary>

When the codebase grows multiple teams, versioned boundaries, or a public API with internals worth hiding, as in Example 28. Small programs skip modules honestly; the descriptor lifts package lines to link time so consumers compile against the promise instead of the classpath's global reachability.

</details>

### Q13 (co-07): Why do exact pins beat ranges, and what is stdlib-only in this argument?

<details><summary>Answer</summary>

Ranges re-resolve to newest and break builds with no code change, while exact pins make resolution a lookup, as in Example 31. Stdlib-only is the extreme pinning strategy with no moving parts at all, which is why this course ships zero dependencies.

</details>

### Q14 (co-08): What earns a check the right to be trusted: the PASS line or something else?

<details><summary>Answer</summary>

The red-first witness plus boundary rows, as in Examples 38, 41, and 42. A PASS line proves the check ran; the failing test watched red before the fix proves it can fail; zero-one-many rows prove the boundaries hold. Trust needs all three, never the green alone.

</details>

### Q15 (co-08): Why do file tests belong in temp dirs, and what must assertions avoid?

<details><summary>Answer</summary>

Shared fixtures collide across parallel runs and poison reruns with residue, as in Example 40. Temp dirs privatize the writable case; assertions must target contents and counts, never temp paths, because unique names differ per run and would make transcripts disagree.

</details>

### Q16 (co-09): How do you keep concurrent output deterministic?

<details><summary>Answer</summary>

Separate parallel work from ordered presentation: own slots per worker and join before printing, collect futures in submission order, sort after parallel mapping, as in Examples 54, 56, and 60. Scheduling decides arrival order; joins, ordered handles, and sorted terminals decide output order.

</details>

### Q17 (co-09): Who ends a BlockingQueue stream, and why bounded over unbounded?

<details><summary>Answer</summary>

The producer ends it with a poison pill the consumer recognizes, as in Example 58. Bounded queues push back at a reason-about-able size while unbounded ones absorb bursts as limitless memory growth; pills terminate without flags, interrupts, or timeout guessing.

</details>

### Q18 (co-10): What decides a type parameter's bound, and how tight should it be?

<details><summary>Answer</summary>

The capability the generic code actually uses, as in Examples 46 and 47. PECS bounds wildcards by direction at APIs; Comparable bounds admit exactly the orderable types max needs. Bounds admit every compatible flavor and nothing else; tighter than use excludes callers, looser reintroduces casts.

</details>

### Q19 (co-11): When do you copy at the trust edge, and what does the copy buy?

<details><summary>Answer</summary>

Whenever outside data enters constructors or methods you keep, as in Example 50. List.copyOf snapshots defeat post-handoff caller mutation, clone covers arrays, and null rejection at entry keeps hostile data from ambushing iteration; snapshots share freely on the way out because immutability shares safely.

</details>

### Q20 (co-12): What do -Xlint:all -Werror buy, and how do you adopt them on legacy code?

<details><summary>Answer</summary>

They promote every warning to a build failure at the exact line, as in Example 66. Adopt by enabling for new files first and ratcheting touched files, never by silencing warnings with annotations that outlive understanding; green under -Werror is the merge gate.

</details>

### Q21 (co-13): Where do deployment values enter, and where must secrets never ride?

<details><summary>Answer</summary>

Values enter through -D flags and environment variables with code defaults covering bare runs, as in Example 69. Secrets never ride command lines because process listings, history, and CI logs expose them; passwords belong in permissioned files or secret stores, regions and batch names ride flags safely.

</details>

### Q22 (co-14): What four rules keep names honest, and what is the abbreviation policy?

<details><summary>Answer</summary>

Methods as verb phrases, variables as role-plus-unit nouns, constants as loud upper snake, loop variables naming their element, as in Example 62. Abbreviate only the universally known; spell domain words out, because member beats mbr in every search, log, and page.

</details>

### Q23 (co-15): When does StringBuilder pay, and when is plus already fine?

<details><summary>Answer</summary>

Builders pay inside loops where plus copies the growing string per pass, as in Example 63. Plus stays fine for single expressions the compiler rewrites automatically; the identical-text verdict proves switching preserves behavior, so apply the builder wherever a loop builds text.

</details>

### Q24 (co-16): What is the four-pass route over an unfamiliar program, and what does each pass answer?

<details><summary>Answer</summary>

Entry first for the feed and the call, stages second for the named phases, helpers third for rules and parsing, lines fourth and last, as in Example 78. Each pass answers one question, what runs, in what phases, by what rules, doing what exactly; details wait until the map demands them.

</details>

## Applied problems

Eight applied problems. Each names a real situation and the course habit that solves it; work them with an editor open and check your answer against the named example before moving on.

### Problem 1: Rewrite the translated accent

Take a C-style Java method full of indexed loops, null-returning lookups, and string-path concatenation. Rewrite it with the enhanced for loop from Example 2, Optional returns from Example 13, and Path operations from Example 21. List every line that changed shape and name which change a Java reader parses fastest.

### Problem 2: Choose the failure shape

Three failures: a missing dues file, a negative amount in a feed line, and an unknown member at settlement. Decide for each whether it is a checked layer exception (Example 11), an unchecked validation refusal (Example 14), or a typed absence (Example 13), and write the one-line justification the code reviewer will read.

### Problem 3: Replace the hand-rolled helper

Find comma-splitting used for quoted CSV, += in a loop building a report, and points-only sorting in one program. Replace each with the quote-aware walk from Example 22, StringBuilder from Example 63, and the thenComparing tiebreak from Example 7, then show the outputs are identical.

### Problem 4: Flatten the admission check

Take a four-level nested validator (member, line shape, amount, region) and rewrite it with guard clauses per Example 3. List every input that changes verdict and prove the list is empty by running both versions over the same table.

### Problem 5: Bound the parallel settlement

A program starts one thread per dues line with no limit. Convert it to the fixed pool from Example 55, collect with invokeAll in order, and shut down in finally. Explain where the old version exhausts threads first and what the bound costs in code.

### Problem 6: Pin the untested parser

Pick the least-tested pure function in your own code and write the table test from Example 38 for it: five rows including empty, corrupt, negative, and boundary inputs. Run it red-first by asserting a wrong want once, then fix the want per Example 41.

### Problem 7: Audit the swallowed causes

Grep your code for catch blocks that translate without chaining. For each, either chain the cause per Example 11 or attach the rationale comment per Example 67. Count how many were accidents versus reviewed decisions.

### Problem 8: Read a stranger's settler

Open any batch-processing class you did not write and answer without running it: what does the entry promise, where do skips go, what does the summary count? Check your answers by running it against a five-line fixture like Example 78, then note which pass answered each question.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Make the starter match before peeking. Work them in order: the error-shape and test katas first, because absence policy and assertion habits underlie everything; the join, flatten, wrap, and counter katas next, because they train the four reflexes daily Java demands; the generics and tiebreak katas after, because they isolate one design judgement each.

### Kata 01: Throw to Optional

(Concepts: co-02.)

The starter explodes on unknown members; return Optional instead like Example 13 teaches at the boundary. The solution resolves absence with orElse at the call site.

**Before** (`drilling/code/kata-01-throw-to-optional/before/Starter.java`):

```java
// Starter: absence by throwing. The smell: a lookup that explodes
// forces every caller to try-catch a question with a calm answer.
// Your task: return Optional<Integer> instead; resolve at the call site.
import java.util.Map; // => the lookup table under repair

public class Starter {

  // => the imperfect starting point, fixed in After
  static final Map<String, Integer> DUES = Map.of("sari", 50, "budi", 75); // => fixed fixture ledger

  static int duesOf(String member) {
    // => explodes on absence: the shape to fix
    Integer got = DUES.get(member); // => null when the member is unknown
    if (got == null) {
      // => null check every caller must repeat
      throw new IllegalArgumentException("unknown member: " + member); // => explosion for a calm question
    } // => past this line the value exists
    return got; // => unboxed answer for known members
  } // => starter ends: throwing lookup, callers beware

  public static void main(String[] args) {
    // => runs only for known members today
    System.out.println("sari: " + duesOf("sari")); // => prints 50, never faces absence
  } // => main ends: absence untested, explosion waiting
} // => fix me: Optional out, orElse at the call site
```

**After** (`drilling/code/kata-01-throw-to-optional/after/Solution.java`):

```java
// Solution: absence as a typed answer. The lookup returns
// Optional, and the call site resolves with orElse: no explosion.
// Fixed from Starter: throwing lookup became a calm question.
import java.util.Map; // => the lookup table, unchanged
import java.util.Optional; // => the honest absent-or-present wrapper

public class Solution {

  // => the reference solution, green in the harness
  static final Map<String, Integer> DUES = Map.of("sari", 50, "budi", 75); // => same fixture ledger

  static Optional<Integer> duesOf(String member) {
    // => absence in the type: callers answer it
    return Optional.ofNullable(DUES.get(member)); // => null becomes empty, values stay present
  } // => helper ends: no null, no throw, ever

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println("sari: " + duesOf("sari").orElse(0)); // => Output: sari: 50
    System.out.println("dewi: " + duesOf("dewi").orElse(0)); // => Output: dewi: 0, absent reads as zero
    System.out.println("present: " + duesOf("budi").isPresent()); // => Output: present: true
  } // => main ends: absence handled, nothing thrown
} // => solved: callers choose defaults, the lookup stays calm
```

**Output** (`drilling/code/kata-01-throw-to-optional/expected/main.stdout.txt`):

```text
sari: 50
dewi: 0
present: true
```

### Kata 02: First Check Suite

(Concepts: co-08.)

The starter prints an unwitnessed total; pin empty, single, and many with asserts like Example 35. The solution runs under -ea so the contracts arm every time.

**Before** (`drilling/code/kata-02-first-check-suite/before/Starter.java`):

```java
// Starter: untested arithmetic. The smell: total works today by
// luck, and no check will notice the day it drifts by one.
// Your task: add assert contracts for empty, single, and many;
// run with -ea so the contracts arm every time.
public class Starter {

  // => the imperfect starting point, fixed in After
  static int total(int[] amounts) {
    // => correct today, unwitnessed
    int sum = 0; // => accumulator starts at the identity
    for (int amount : amounts) {
      // => every figure added once
      sum += amount; // => plain addition, no witness
    } // => loop ends with the settled sum
    return sum; // => returned unwitnessed
  } // => starter ends: behavior without proof

  public static void main(String[] args) {
    // => prints one answer, proves nothing
    System.out.println("total: " + total(new int[] { 50, 75 })); // => prints 125, asserts nothing
  } // => main ends: untested, drifting risk accepted
} // => fix me: assert empty, single, and many under -ea
```

**After** (`drilling/code/kata-02-first-check-suite/after/Solution.java`):

```java
// Solution: contracts pinned with assert. Empty, single, and many
// each hold an assertion, and -ea arms them on every harness run.
// Fixed from Starter: printing became proving.
public class Solution {

  // => the reference solution, green in the harness
  static int total(int[] amounts) {
    // => the domain under contract, unchanged
    int sum = 0; // => accumulator starts at the identity
    for (int amount : amounts) {
      // => every figure added once
      sum += amount; // => plain addition, witnessed below
    } // => loop ends with the settled sum
    return sum; // => the total the assertions certify
  } // => helper ends: arithmetic only, checks live with callers

  public static void main(String[] args) {
    // => run with -ea: assertions enabled
    assert total(new int[] { 50, 75, 25 }) == 150; // => many: the headline contract
    assert total(new int[] {}) == 0; // => empty: identity, not crash
    assert total(new int[] { 100 }) == 100; // => single: passes through unchanged
    System.out.println("contracts hold: 3 of 3"); // => Output: contracts hold: 3 of 3
  } // => main ends: silence meant green, the print confirms it
} // => solved: three contracts, zero unwitnessed arithmetic
```

**Output** (`drilling/code/kata-02-first-check-suite/expected/main.stdout.txt`):

```text
contracts hold: 3 of 3
```

### Kata 03: Hand-rolled Join

(Concepts: co-04.)

The starter joins with a flag, a loop, and plus; replace all three with String.join like Example 63's economics demand. The solution proves identical text in one call.

**Before** (`drilling/code/kata-03-hand-rolled-join/before/Starter.java`):

```java
// Starter: joining by hand. The smell: a loop with an isFirst flag
// restates what String.join already says in one call.
// Your task: replace the loop with String.join and prove identical text.
import java.util.List; // => the lines joined two ways

public class Starter {

  // => the imperfect starting point, fixed in After
  static String join(List<String> lines) {
    // => hand-rolled joining with a flag
    String out = ""; // => accumulator starts empty
    boolean first = true; // => flag tracks the separator state
    for (String line : lines) {
      // => every line visited with ceremony
      if (!first) {
        // => separator before every line but the first
        out += "\n"; // => manual separator, easy to misplace
      } // => branch ends: separator handled by hand
      out += line; // => plus per pass: quadratic besides
      first = false; // => flag flips after the first line
    } // => loop ends: joined, but the long way
    return out; // => correct text, hand-rolled cost
  } // => starter ends: flags and plus where a library fits

  public static void main(String[] args) {
    // => prints the hand-rolled text
    System.out.print(join(List.of("sari:50", "budi:75"))); // => prints two lines, joined by hand
  } // => main ends: correct, but not standard
} // => fix me: String.join("\n", lines) says the same in one call
```

**After** (`drilling/code/kata-03-hand-rolled-join/after/Solution.java`):

```java
// Solution: joining with the standard library. One String.join
// call replaces the flag, the loop, and the quadratic plus chain.
// Fixed from Starter: hand-rolled joining became one library call.
import java.util.List; // => the lines joined the standard way

public class Solution {

  // => the reference solution, green in the harness
  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> lines = List.of("sari:50", "budi:75", "citra:25"); // => fixed three-line feed
    String report = String.join("\n", lines); // => the library join: separator once, no flags
    System.out.println(report); // => Output: the three dues lines
    System.out.println("lines: " + report.lines().count()); // => Output: lines: 3
  } // => main ends: standard join, identical text, linear cost
} // => solved: the library owned the separator all along
```

**Output** (`drilling/code/kata-03-hand-rolled-join/expected/main.stdout.txt`):

```text
sari:50
budi:75
citra:25
lines: 3
```

### Kata 04: Flatten Nested Checks

(Concepts: co-01.)

The starter buries its work three indentations deep; guard-clause each refusal like Example 3. The solution keeps every verdict while the work sits at the margin.

**Before** (`drilling/code/kata-04-flatten-nested-checks/before/Starter.java`):

```java
// Starter: validation staircase. The smell: three nested ifs bury
// the work three indentations deep; readers hold every condition.
// Your task: guard-clause each failure so the work sits at the margin.
public class Starter {

  // => the imperfect starting point, fixed in After
  static String tag(String member, int amount) {
    // => nested validation around one line of work
    if (member != null) {
      // => level one: null check opens the staircase
      if (!member.isBlank()) {
        // => level two: blank check narrows further
        if (amount >= 0) {
          // => level three: sign check buries the work
          return member + ":" + amount; // => the work, three levels deep
        } else {
          // => level three failure, indented with it
          return "error: negative"; // => refusal far from the door
        } // => level three ends
      } else {
        // => level two failure
        return "error: blank"; // => refusal two levels deep
      } // => level two ends
    } else {
      // => level one failure
      return "error: null"; // => refusal at maximum nesting
    } // => staircase ends: work buried, refusals scattered
  } // => starter ends: valid shape, unreadable depth

  public static void main(String[] args) {
    // => exercises the staircase once
    System.out.println(tag("sari", 50)); // => prints sari:50 from three deep
  } // => main ends: correct, but nested
} // => fix me: three guards, then the work at the margin
```

**After** (`drilling/code/kata-04-flatten-nested-checks/after/Solution.java`):

```java
// Solution: guards at the door, work at the margin. Each refusal
// exits immediately, so the tag builds at zero nesting.
// Fixed from Starter: the staircase became three flat guards.
public class Solution {

  // => the reference solution, green in the harness
  static String tag(String member, int amount) {
    // => flat validation around one line of work
    if (member == null) {
      // => guard one: missing input refused at the door
      return "error: null"; // => exit with the failure text
    } // => past this line member is provably non-null
    if (member.isBlank()) {
      // => guard two: whitespace refused next
      return "error: blank"; // => exit with the failure text
    } // => past this line the member prints cleanly
    if (amount < 0) {
      // => guard three: negative refused last
      return "error: negative"; // => exit with the failure text
    } // => past this line the amount adds safely
    return member + ":" + amount; // => the work, at the left margin
  } // => helper ends: three exits, one flat success

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println(tag("sari", 50)); // => Output: sari:50
    System.out.println(tag(null, 50)); // => Output: error: null
    System.out.println(tag("  ", 50)); // => Output: error: blank
    System.out.println(tag("budi", -5)); // => Output: error: negative
  } // => main ends: one success, three flat refusals
} // => solved: the door refuses, the margin works
```

**Output** (`drilling/code/kata-04-flatten-nested-checks/expected/main.stdout.txt`):

```text
sari:50
error: null
error: blank
error: negative
```

### Kata 05: Chain the Cause

(Concepts: co-02.)

The starter translates without a cause and broadens the throws; narrow the type and chain like Example 11. The solution witnesses message and cause class together.

**Before** (`drilling/code/kata-05-chain-the-cause/before/Starter.java`):

```java
// Starter: orphaned translation. The smell: the NumberFormatException
// is caught and replaced, so the stack trace dies at the boundary.
// Your task: chain the cause so handlers see both layer and root.
public class Starter {

  // => the imperfect starting point, fixed in After
  static int load(String text) throws Exception {
    // => broad throws: the first smell beside the lost cause
    try {
      // => the low-level attempt speaking integers
      return Integer.parseInt(text); // => may throw NumberFormatException
    } catch (NumberFormatException e) {
      // => caught, then orphaned below
      throw new Exception("bad amount: " + text); // => replacement without a cause: trace lost
    } // => catch ends: the original vanishes here
  } // => starter ends: translated, but orphaned

  public static void main(String[] args) throws Exception {
    // => broad throws inherited upward
    System.out.println("amount: " + load("50")); // => prints 50, never faces corruption
  } // => main ends: honest only on the happy path
} // => fix me: specific type plus (message, cause), narrow throws
```

**After** (`drilling/code/kata-05-chain-the-cause/after/Solution.java`):

```java
// Solution: translation with the cause chained. The layer message
// names dues while getCause keeps the parse failure reachable.
// Fixed from Starter: orphaned replacement became honest chaining.
public class Solution {

  // => the reference solution, green in the harness
  static class LedgerException extends Exception {

    // => checked: callers face the layer failure
    LedgerException(String message, Throwable cause) {
      // => cause mandatory, never null
      super(message, cause); // => the chain link handlers walk
    } // => constructor ends: message plus cause, always paired
  } // => domain type ends: one layer, one failure

  static int load(String text) throws LedgerException {
    // => narrow throws: exactly this layer's failure
    try {
      // => the low-level attempt speaking integers
      return Integer.parseInt(text); // => may throw NumberFormatException
    } catch (NumberFormatException e) {
      // => translate, never swallow
      throw new LedgerException("bad dues amount: '" + text + "'", e); // => layer message plus cause
    } // => catch ends: the original travels as getCause
  } // => helper ends: one failure type leaves this layer

  public static void main(String[] args) {
    // => the entry point the harness runs
    try {
      // => the layer boundary where the failure is answered
      System.out.println("amount: " + load("50")); // => Output: amount: 50
      load("xx"); // => corrupt cell: translated with cause
      System.out.println("unreachable"); // => skipped: translation threw first
    } catch (LedgerException e) {
      // => the single type this layer raises
      System.out.println("ledger: " + e.getMessage()); // => Output: ledger: bad dues amount: 'xx'
      System.out.println("cause: " + e.getCause().getClass().getSimpleName()); // => Output: cause: NumberFormatException
    } // => catch ends: message and cause both witnessed
  } // => main ends: the chain intact end to end
} // => solved: layers translate, causes travel
```

**Output** (`drilling/code/kata-05-chain-the-cause/expected/main.stdout.txt`):

```text
amount: 50
ledger: bad dues amount: 'xx'
cause: NumberFormatException
```

### Kata 06: Lock-free Counter

(Concepts: co-09.)

The starter races four threads through a plain int; count with AtomicInteger and join like Example 61. The solution prints exactly 400 on every run.

**Before** (`drilling/code/kata-06-lock-free-counter/before/Starter.java`):

```java
// Starter: shared count without a guard. The smell: four threads add
// one hundred each into a plain int, and increments vanish silently.
// Your task: count with AtomicInteger, join every thread, print 400.
// NOTE: this starter may print less than 400; that loss is the lesson.
public class Starter {

  // => the imperfect starting point, fixed in After
  static int settled = 0; // => shared, unguarded: increments race here

  public static void main(String[] args) throws InterruptedException {
    // => joins without guards
    Thread[] crew = new Thread[4]; // => handles for joining later
    for (int i = 0; i < crew.length; i++) {
      // => launch loop, identical work
      crew[i] = new Thread(() -> {
        // => each worker adds one hundred
        for (int k = 0; k < 100; k++) {
          // => one hundred increments per worker
          settled++; // => read-modify-write: the race lives here
        } // => worker loop ends, some increments lost
      }); // => worker defined: racing by construction
      crew[i].start(); // => workers race from here
    } // => launch ends: four hundred increments, fewer landings
    for (Thread worker : crew) {
      // => joins wait, but cannot unlose losses
      worker.join(); // => all workers done, total short
    } // => join ends: the loss already happened
    System.out.println("settled: " + settled); // => often below 400: the witnessed race
  } // => main ends: joined, but short
} // => fix me: AtomicInteger plus joins print exactly 400
```

**After** (`drilling/code/kata-06-lock-free-counter/after/Solution.java`):

```java
// Solution: lock-free counting with AtomicInteger. Compare-and-set
// hardware lands every increment, and joins order the transcript.
// Fixed from Starter: the raced int became an atomic plus joins.
import java.util.concurrent.atomic.AtomicInteger; // => the lock-free counter

public class Solution {

  // => the reference solution, green in the harness
  public static void main(String[] args) throws InterruptedException {
    // => joins are interruptibly checked
    AtomicInteger settled = new AtomicInteger(); // => shared counter, atomic increments
    Thread[] crew = new Thread[4]; // => handles for joining later
    for (int i = 0; i < crew.length; i++) {
      // => launch loop, identical work
      crew[i] = new Thread(() -> {
        // => each worker settles one hundred
        for (int k = 0; k < 100; k++) {
          // => one hundred increments per worker
          settled.incrementAndGet(); // => atomic: no lost update, no lock
        } // => worker loop ends: its hundred counted
      }); // => worker defined: counting only
      crew[i].start(); // => workers count alongside each other
    } // => launch ends: four hundred increments in flight
    for (Thread worker : crew) {
      // => join loop: wait for every worker
      worker.join(); // => returns only after that worker's hundred
    } // => join ends: all four hundred increments complete
    System.out.println("settled: " + settled.get()); // => Output: settled: 400
  } // => main ends: lock-free total exact
} // => solved: atomics land, joins order
```

**Output** (`drilling/code/kata-06-lock-free-counter/expected/main.stdout.txt`):

```text
settled: 400
```

### Kata 07: One Max for All

(Concepts: co-10.)

The starter copies max per type; bound one generic max like Example 47. The solution serves both call sites from a single Comparable-bounded method.

**Before** (`drilling/code/kata-07-one-max-for-all/before/Starter.java`):

```java
// Starter: duplicated maxima. The smell: maxInt and maxString share
// every line but their types; the third type will copy them again.
// Your task: one bounded generic max over Comparable, both call sites kept.
public class Starter {

  // => the imperfect starting point, fixed in After
  static int maxInt(int a, int b) {
    // => integers only: first copy
    return a >= b ? a : b; // => comparison hardwired to int
  } // => first copy ends: correct, but narrow

  static String maxString(String a, String b) {
    // => strings only: second copy
    return a.compareTo(b) >= 0 ? a : b; // => same shape, other type
  } // => second copy ends: duplication witnessed

  public static void main(String[] args) {
    // => exercises both copies once
    System.out.println("max int: " + maxInt(50, 75)); // => prints 75 via the first copy
    System.out.println("max string: " + maxString("budi", "sari")); // => prints sari via the second copy
  } // => main ends: duplicated, but green
} // => fix me: max(T extends Comparable<T>) serves both call sites
```

**After** (`drilling/code/kata-07-one-max-for-all/after/Solution.java`):

```java
// Solution: one bounded max for every ordered type. The Comparable
// bound buys compareTo without casts; both call sites share it.
// Fixed from Starter: two copies became one bounded method.
public class Solution {

  // => the reference solution, green in the harness
  static <T extends Comparable<T>> T max(T a, T b) {
    // => bounded: ordered types only, all welcome
    return a.compareTo(b) >= 0 ? a : b; // => the bound guarantees compareTo exists
  } // => helper ends: one method, every ordered type

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println("max int: " + max(50, 75)); // => Output: max int: 75
    System.out.println("max string: " + max("budi", "sari")); // => Output: max string: sari
    System.out.println("one method: true"); // => Output: one method: true
  } // => main ends: two flavors, one implementation
} // => solved: bounds reuse, copies retire
```

**Output** (`drilling/code/kata-07-one-max-for-all/expected/main.stdout.txt`):

```text
max int: 75
max string: sari
one method: true
```

### Kata 08: Tiebreak Ranks

(Concepts: co-11.)

The starter ranks by points alone so ties follow arrival; break ties by name like Example 7. The solution prints the same board for every input order.

**Before** (`drilling/code/kata-08-tiebreak-ranks/before/Starter.java`):

```java
// Starter: points-only ranking. The smell: tied riders print in
// arrival order, so reruns with reshuffled input reshuffle the board.
// Your task: thenComparing by name so ties break deterministically.
import java.util.ArrayList; // => the sortable roster
import java.util.Comparator; // => the single-key ordering under repair
import java.util.List; // => interface on the left as always

public class Starter {

  // => the imperfect starting point, fixed in After
  record Rider(String name, int points) {} // => name plus points, ties unbroken

  public static void main(String[] args) {
    // => ranks by points alone
    List<Rider> board = new ArrayList<>(
      List.of(
        // => tied leaders arrive budi-first
        new Rider("budi", 12), // => tied leader one
        new Rider("sari", 12), // => tied leader two
        new Rider("ada", 9)
      )
    ); // => clear third
    board.sort(Comparator.comparingInt(Rider::points).reversed()); // => points only: ties keep arrival order
    for (Rider r : board) {
      // => the board reads budi before sari today
      System.out.println(r.name() + ": " + r.points()); // => order depends on arrival, not rules
    } // => loop ends: correct points, accidental tie order
  } // => main ends: ranked, but not deterministically
} // => fix me: thenComparing(Rider::name) settles every tie
```

**After** (`drilling/code/kata-08-tiebreak-ranks/after/Solution.java`):

```java
// Solution: points first, names break ties. The composed ordering
// ranks fully by rule, so reshuffled input prints the same board.
// Fixed from Starter: arrival-order ties became name-order ties.
import java.util.ArrayList; // => the sortable roster
import java.util.Comparator; // => the composed ordering vocabulary
import java.util.List; // => interface on the left as always

public class Solution {

  // => the reference solution, green in the harness
  record Rider(String name, int points) {} // => name plus points, ties broken by rule

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<Rider> board = new ArrayList<>(
      List.of(
        // => tied leaders arrive budi-first
        new Rider("budi", 12), // => tied leader, alphabetical second
        new Rider("sari", 12), // => tied leader, alphabetical first
        new Rider("ada", 9)
      )
    ); // => clear third on points
    board.sort(
      Comparator.comparingInt(Rider::points)
        .reversed() // => points first, highest wins
        .thenComparing(Rider::name)
    ); // => ties break alphabetically, deterministic
    for (Rider r : board) {
      // => the board reads by rule now
      System.out.println(r.name() + ": " + r.points()); // => Output: sari:12, budi:12, ada:9
    } // => loop ends: ranking rule visible in the order
    System.out.println("tiebreak: name"); // => Output: tiebreak: name
  } // => main ends: ranked by rule, stable across shuffles
} // => solved: ties break by name on every input order
```

**Output** (`drilling/code/kata-08-tiebreak-ranks/expected/main.stdout.txt`):

```text
budi: 12
sari: 12
ada: 9
tiebreak: name
```

## Self-check checklist

Twenty-four self-check items, at least one per concept from co-01 to co-16. Read each aloud as a promise: if you hesitate on any item, return to its example before calling the course done.

- [ ] I can choose switch expressions over statement switches and cover every input with default. (co-01).
- [ ] I can iterate elements with the enhanced for loop and keep indexes for positional data only. (co-01).
- [ ] I can close resources with try-with-resources in reverse order on every exit path. (co-02).
- [ ] I can chain causes across layers so handlers see the layer message and the root failure. (co-02).
- [ ] I can place checked failures on environmental conditions and unchecked on caller bugs. (co-02).
- [ ] I can tally with getOrDefault and print maps through sorted views for stable order. (co-03).
- [ ] I can express filter-transform-collect as pipelines with sorted terminals. (co-03).
- [ ] I can shape multi-line output with text blocks and align tables with format verbs. (co-04).
- [ ] I can move file text with explicit UTF-8 and assert roundtrips mechanically. (co-04).
- [ ] I can model machine spans with fixed Instants and Durations, never a live clock in tests. (co-05).
- [ ] I can draw package API lines with public types and keep internals package-private. (co-06).
- [ ] I can declare module exports and launch on the module path for multi-team codebases. (co-06).
- [ ] I can pin exact versions in descriptors and verify requests against the lock. (co-07).
- [ ] I can pin contracts with asserts under -ea and tables over shared checks. (co-08).
- [ ] I can isolate file tests in temp dirs and prove suites red-first before green. (co-08).
- [ ] I can join threads, collect futures in order, and sort after parallel mapping. (co-09).
- [ ] I can guard shared totals with synchronized or atomics and end queue streams with pills. (co-09).
- [ ] I can bound generics by direction with PECS and by capability with Comparable. (co-10).
- [ ] I can model values as validated records and snapshot caller data with copyOf at trust edges. (co-11).
- [ ] I can hold builds green under -Xlint:all -Werror and document contracts with Javadoc. (co-12).
- [ ] I can inject config through -D flags with defaults and call out via ProcessBuilder safely. (co-13).
- [ ] I can name methods as verbs and variables as role-plus-unit nouns with domain words spelled out. (co-14).
- [ ] I can build loop text with StringBuilder, size collections upfront, and flag with EnumSet. (co-15).
- [ ] I can read unfamiliar programs entry-first in four passes and name each stage aloud. (co-16).

## Elaborative interrogation & self-explanation

Six why and why-not prompts. Each names a design decision and the rejected alternative; answer from your own experience first, then compare with the model answer. The goal is judgement transfer, not memorization.

### E1: Why does Java check some exceptions and leave others unchecked, and what breaks if you check everything?

<details><summary>Model answer</summary>

Checked failures force every caller to answer conditions preparation cannot prevent, at the cost of handling ceremony; unchecked failures fail fast at caller bugs without taxing transitive callers. Model answer: checking everything taxes careful callers for one bad feed and teaches catch-and-ignore; checking nothing lets environmental failures ambush. The split assigns each failure to the party that can answer it, per Example 15.

</details>

### E2: Why do immutable snapshots beat defensive discipline, and when do you still copy?

<details><summary>Model answer</summary>

Snapshots make mutation impossible instead of merely discouraged, at the cost of an allocation per snapshot. Model answer: List.of and records remove the bug class, while copyOf at trust edges stops caller-side aliases; you still copy where mutation is genuinely required, converting to ArrayList once rather than synchronizing forever, per Examples 6 and 50.

</details>

### E3: Why does the standard library win over a dependency for text, time, and sorting, and where does it end?

<details><summary>Model answer</summary>

The standard library ships zero-install determinism with versioned stability, at the cost of narrower features. Model answer: text blocks, java.time, and comparators cover daily work with nothing to audit; dependencies win for genuinely hard problems like web frameworks and test engines, where the library ends and the ecosystem begins, per Examples 18 through 25.

</details>

### E4: Why do narrow package APIs compose better than wide ones, and what breaks when a package grows?

<details><summary>Model answer</summary>

Narrow APIs minimize the surface importers can depend on, at the cost of more types to discover. Model answer: two-method Cart survives internal rewrites while wide utility packages freeze every helper into compatibility; when a package grows, split by responsibility and seal outcomes, per Examples 27 and 49.

</details>

### E5: Why sort before printing instead of asserting on arrival order in concurrent programs?

<details><summary>Model answer</summary>

Arrival order belongs to the scheduler and changes per run, while sorted order belongs to the program and holds everywhere. Model answer: sorted terminals and ordered future collection decouple overlap from presentation, so transcripts prove transformation rather than recording scheduling; asserting arrival order tests the scheduler, not the code, per Examples 54 through 60.

</details>

### E6: Why is a failing-first test worth the extra red step, and when is it theater?

<details><summary>Model answer</summary>

The red step proves the test can fail, converting later green from hope to evidence, at the cost of one deliberate failure run. Model answer: red-first certifies the fix per Example 41; it turns to theater when the red asserts a tautology the fix cannot affect, so pair every red with a boundary row that genuinely discriminates.

</details>
