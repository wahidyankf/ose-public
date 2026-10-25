---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to Dart In Depth: recall first, then applied judgement, then hands-on repetition, then a checklist, then a why and why-not pass to confirm real automaticity rather than recognition. Every answer hides in a `<details>` block; try each item yourself before opening it.

## Recall Q&A

Twenty-four short-answer questions covering each of co-01 to co-16. Answer from memory, then check. Star the ones you miss and repeat them after a day; spaced repetition only works when the misses decide what comes back.

### Q1 (co-01): Why does the guard clause come before the happy path in Example 1?

<details><summary>Answer</summary>

Failures handled first leave the success path at the margin with no nesting, so readers meet the normal flow without holding failure conditions in mind. Early returns turn preconditions into exits instead of indentation.

</details>

### Q2 (co-01): When do you reach for a counted for over a for-in loop?

<details><summary>Answer</summary>

When the position itself matters: neighbors, windows, and parallel walks need the index, as Example 2 shows. For-in cannot overrun and stays the default for whole-collection reads.

</details>

### Q3 (co-02): Why is a sealed Result preferable to exceptions for expected failure?

<details><summary>Answer</summary>

Expected failures are data the type system can track: callers switch on Success and Failure instead of catching, as Example 14 shows. Exceptions stay for the unexpected path, not the anticipated miss.

</details>

### Q4 (co-02): What does rethrow preserve that throwing a new exception destroys?

<details><summary>Answer</summary>

The original stack trace: rethrow keeps the trace pointing at the true failure site while the handler only adds its note, as Example 11 shows. A new throw would indict the handler instead.

</details>

### Q5 (co-03): What does putIfAbsent guarantee that lookup-then-set cannot?

<details><summary>Answer</summary>

Atomicity of intent in one call: existing entries stay untouched and missing ones seed from the closure, as Example 6 shows. The two-step dance invites a change between the check and the write.

</details>

### Q6 (co-03): Why do where, map, and fold cost one pass no matter how many stages they name?

<details><summary>Answer</summary>

They return lazy Iterables: no stage computes until the terminal operation pulls, as Example 8 shows. Intermediate lists are never built, so the pipeline stays one pass end to end.

</details>

### Q7 (co-04): When does StringBuffer beat string concatenation?

<details><summary>Answer</summary>

In any loop or multi-append assembly: concatenation copies the whole string per addition while the buffer appends and materializes once, as Example 18 shows. Reports and ledgers always go through the buffer.

</details>

### Q8 (co-04): Where do JSON casts belong, and why only there?

<details><summary>Answer</summary>

Inside fromJson: the dynamic boundary stays one function wide, as Example 20 shows. Casts scattered across call sites fail in many places; casts in fromJson fail in exactly one.

</details>

### Q9 (co-05): Why store UTC and render local?

<details><summary>Answer</summary>

The instant and its clothes are different facts: UTC storage keeps scheduling math right across zones while hand-built stamps render for humans, as Example 22 shows. Mixing them corrupts durations and ordering.

</details>

### Q10 (co-06): What can a part file see that an importer cannot?

<details><summary>Answer</summary>

Its library's privates: parts share scope with the library and are never imported directly, as Example 28 shows. Importers see one surface while the workshop spreads across files.

</details>

### Q11 (co-06): What does an export barrel buy the import block?

<details><summary>Answer</summary>

One import per idea instead of one per file: the barrel resells inner surfaces while workshops multiply behind it, as Example 29 shows. Readers meet ideas, not file counts.

</details>

### Q12 (co-07): What three lines does every pubspec pin, and why?

<details><summary>Answer</summary>

Name, SDK range, and dependency versions: identity, toolchain, and outsiders, as Example 30 shows. Unpinned projects rot by drift; the pubspec is the one file stating what the code was proven against.

</details>

### Q13 (co-08): Why must the first test run be red?

<details><summary>Answer</summary>

A test that never failed proves nothing: red-first is the evidence the green actually checks the behavior, as Example 35 shows. The stub run demonstrates the test can catch the bug it guards.

</details>

### Q14 (co-08): Why freeze time as a parameter instead of calling DateTime.now in logic?

<details><summary>Answer</summary>

Untestable time is a choice: parameters freeze instants for tests while production passes the live clock once, as Example 44 shows. Logic that reads the clock reads a new answer every run.

</details>

### Q15 (co-09): Where does an async failure surface: at the call or at the await?

<details><summary>Answer</summary>

At the await: the Future holds the failure until something asks for the value, as Example 17 shows. One error channel serves both sync and async when try wraps the await.

</details>

### Q16 (co-09): When does Future.wait beat sequential awaits?

<details><summary>Answer</summary>

For independent branches: wait starts them together and gathers in order, as Example 56 shows. Sequential awaits serialize what could run together, charging the sum instead of the slowest.

</details>

### Q17 (co-10): What does a bound add that an unbounded type parameter lacks?

<details><summary>Answer</summary>

Usable shape: unbounded T can only be held, while T extends num promises addition to the body, as Example 47 shows. Bounds turn containers into algorithms the compiler checks at call sites.

</details>

### Q18 (co-11): Why do canonical values require final fields?

<details><summary>Answer</summary>

Sharing is safe only over immutable state: const builds collapse equal values into one object, as Example 48 shows. A mutable canonical value would change under every sharer at once.

</details>

### Q19 (co-11): What breaks when == is overridden without hashCode?

<details><summary>Answer</summary>

Sets and map keys: equal objects landing in different buckets duplicate and misroute, as Example 51 shows. The contract is same type, same fields, joined hash — all three, always.

</details>

### Q20 (co-12): What does dart analyze catch that tests cannot?

<details><summary>Answer</summary>

The typo, the dead branch, the impossible type: static facts about code that never runs, as Examples 64 and 68 show. Tests prove behaviors; the analyzer proves the text itself.

</details>

### Q21 (co-13): How do native callbacks cross into Dart at the interop boundary?

<details><summary>Answer</summary>

Through the same StreamController bridge as any callback API: pushes add in, the stream pulls out in order, as Examples 61 and 74 survey. The runtimes differ but the pattern is one.

</details>

### Q22 (co-14): How do shared case rules pay for themselves?

<details><summary>Answer</summary>

Readers parse kind from shape: types read UpperCamel, members lowerCamel, files snake_case, as Example 65 shows. Violations read as friction long before anyone names the rule.

</details>

### Q23 (co-15): In which two spots is laziness the performance idiom?

<details><summary>Answer</summary>

Iterable pipelines that never build intermediate lists, as Example 8 shows, and sync-star generators that produce only pulled values, as Kata 08 shows. Both pay per use, never per possibility.

</details>

### Q24 (co-16): What is the five-line drill, and what does it test that green runs cannot?

<details><summary>Answer</summary>

What, idiom, refused failure, cost, breaking change per sample, as Example 78 shows. It tests ownership: code that runs but cannot be explained is borrowed, not learned.

</details>

## Applied problems

Eight judgement calls a working Dart developer makes weekly. Write your answer before opening the model; the model is one good shape, not the only shape.

### A1: Rewrite the translated loop

The function below was translated from a language without for-in and carries its old habits. Rewrite it with for-in, a guard clause, and join so it reads as Dart:

<!-- harness: illustration -->

```dart
String greetAll(List<String> names) {
  var out = '';
  for (var i = 0; i < names.length; i++) {
    if (names[i] != '') {
      out = out + 'hello, ' + names[i] + ';';
    }
  }
  return out;
}
```

Model answer: filter empties with where, map to greetings, join with semicolons — `names.where((n) => n.isNotEmpty).map((n) => 'hello, $n').join(';')`. The index, the accumulator, and the nesting all leave; the pipeline says what the loop meant.

### A2: Choose the error shape: bad file

A config file is missing at startup. Do you throw, return a Result, or exit with a message? Model answer: throw or return up to the startup boundary, then answer once with the filename attached (Examples 11 and 13). Missing config is unexpected at the layer that reads it, so it travels; the boundary owns the single answering sentence.

### A3: Choose the error shape: bad row

One ledger row in ten thousand fails to parse. Do you abort the import? Model answer: no — return the failure as data per row (Examples 14 and 73) and report addressed skips beside receipts, exactly the capstone shape. Expected partial failure is data, and aborting ten thousand honest rows for one bad line is the wrong trade.

### A4: Choose the error shape: bad argument

A public function receives a negative sack count it cannot serve. Throw or assert? Model answer: assert in development when the caller is internal and the contract is documented (Example 16); throw a typed exception when the caller is external input. Asserts vanish in production, so they guard contracts, never user input.

### A5: Replace the hand-rolled helper

A teammate wrote a 15-line function that groups rows by crop with flags and branches. Replace it with the standard-library shape and name what you removed. Model answer: fold with update and ifAbsent (Examples 6 and 32, Kata 06). Removed: the containsKey branch, the seeding special case, and the flag bookkeeping — the map owns all three now.

### A6: Table the boundary

A discount applies at twelve sacks and above. Write the edge table that pins it, naming each row's reason. Model answer: rows for 0, 1, 11, 12, 13 with wants false, false, false, true, true (Example 39). The cruel neighbor 11 and the boundary 12 are the rows that earn their keep; 0 and 1 prove the floor, 13 proves surplus stays full.

### A7: Pin the version claim

A lesson says a package resolves to 2.10.0 under a ^2.4.0 range. Show the check that proves it without running pub. Model answer: parse triples, filter to the caret floor below the next major, sort numerically, pick the newest allowed (Example 31). The check fails loudly if text sorting ever crowns 2.4.0 over 2.10.0.

### A8: Flatten the pyramid

A function nests three null checks to name a packer site, burying the answer three indents deep. Flatten it and state the rule. Model answer: one ?? chain with a null-aware lookup (Example 15, Kata 04). The rule: fallbacks read left to right in one line, and the happy path never sits deeper than the function body.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Make the starter match before peeking. Work them in order: the throw-to-Result and table-test katas first, because failure shapes and test tables underlie everything; the join, null-chain, wrap, and group katas next, because they train the four reflexes daily Dart demands; the freeze and laziness katas after, because they isolate one design judgement each.

### Kata 01: Convert Throw to Result

(Concepts: co-02.)

The starter validates with throw; rewrite it to return Results like Example 14 teaches. The solution keeps both paths honest.

**Before** (`drilling/code/kata-01-convert-throw-to-result/before/starter.dart`):

```dart
// Starter: validation by throw. The bug: negatives crash the caller.
// => throw on negative: callers cannot recover without a catch boundary
// => rewrite: return Result<int> like Example 14, Success or Failure
void main() {
  // => valid input works: the bug hides until the negative arrives
  print(check(12)); // => prints, then the next call explodes below
  // => BUG: negative input throws: no value to check, only a catch
  print(check(-4)); // => throws: crash path, not a contract
}

// check throws on negatives: the throw-as-validation anti-pattern.
// => BUG: caller input reaches throw: a crash path, not a contract
int check(int sacks) {
  // => negative input throws: the exact shape Example 14 replaces
  if (sacks < 0) throw Exception('negative sacks'); // => BUG: catch or crash
  // => valid input returns: the only path that survives the throw above
  return sacks; // => surviving path: the shape every call should share
}
```

**After** (`drilling/code/kata-01-convert-throw-to-result/after/solution.dart`):

```dart
// Solution: validation by Result return. Throw is gone from the path.
// => Result<int> out: Success carries counts, Failure carries reasons
// => negatives return data: callers switch, exactly like Example 14
void main() {
  // => valid input succeeds: the value flows through the Success arm
  print(describe(check(12))); // => Output: 12 sacks, checked
  // => negative input fails as data: the Failure arm renders the reason
  print(describe(check(-4))); // => Output: refused: negative sacks
}

// Result carries success with a value or failure with a reason, sealed.
sealed class Result<T> {
  // => const base: results build as cheaply as the values they carry
  const Result();
}

// Success wraps the checked count: the valid path, typed and flowing.
final class Success<T> extends Result<T> {
  // => the value: present exactly when validation passed
  final T value; // => final: results never change after they settle
  // => const constructor: successes build at compile time
  const Success(this.value);
}

// Failure wraps the refusal reason: decided here, rendered by callers.
final class Failure<T> extends Result<T> {
  // => the reason: written where the failure is known, read where shown
  final String reason; // => final: reasons never change after they settle
  // => const constructor: failures build as cheaply as successes
  const Failure(this.reason);
}

// check validates without throwing: negatives return, never crash.
// => negatives are data: Failure carries the refusal with its evidence
Result<int> check(int sacks) {
  // => negative input fails as data: the refusal travels as a value
  if (sacks < 0)
    return const Failure('negative sacks'); // => checked, not caught
  // => valid input succeeds: the count flows through the Success arm
  return Success(sacks); // => Success<int>: the caller switches on this
}

// describe renders either arm: receipt for success, refusal for failure.
String describe(Result<int> result) {
  // => exhaustive switch: the sealed base forces both arms, no default
  return switch (result) {
    // => the compiler checks no arm is missing
    // => Success arm: the value binds into the checked sentence
    Success(value: final sacks) => '$sacks sacks, checked',
    // => Failure arm: the reason renders beside the refusal word
    Failure(reason: final reason) => 'refused: $reason',
  };
}
```

**Output** (`drilling/code/kata-01-convert-throw-to-result/expected/main.stdout.txt`):

```text
12 sacks, checked
refused: negative sacks
```

### Kata 02: Write the First Table Test

(Concepts: co-08.)

The starter bills freight with no tests; pin it with the table shape from Examples 39 and 41. The solution proves four bills with zero fixtures.

**Before** (`drilling/code/kata-02-write-first-table-test/before/starter.dart`):

```dart
// Starter: freight billing with no tests. The bug: nothing pins the rule.
// => untested arithmetic: the next edit can silently rebill every wagon
// => rewrite: table-test freightTotal like Examples 39 and 41 demand
void main() {
  // => the bill prints: correct today, unproven tomorrow, fragile forever
  print(freightTotal([10, 20], 3)); // => 90: trusted, never checked
}

// freightTotal bills wagons times rate: pure, correct, and untested.
// => BUG: no test pins it: any edit below ships on hope, not proof
int freightTotal(List<int> wagons, int rate) {
  // => fold sums the loads: the whole billing rule in two lines
  final sacks = wagons.fold(0, (sum, w) => sum + w); // => 30 for the demo
  // => rate multiplies: correct, and completely unguarded by any test
  return sacks * rate; // => 90: right until someone changes the fold
}
```

**After** (`drilling/code/kata-02-write-first-table-test/after/solution.dart`):

```dart
// Solution: the billing rule pinned by a table test, failing-first.
// => one test, four rows: empty, single, multi, and the free-rate edge
// => the table is the specification: new edges cost one row, never rewrites
// => tiny harness: test ticks on green, expect throws loud on red
var _passed = 0; // => the counter: every green test ticks it once

// test runs one named case: body first, tick and print after.
void test(String name, void Function() body) {
  // => the behavior runs inside: throws on failure, ticks on green
  body(); // => red never ticks: the count line below stays honest
  // => tick, then print: green tests count themselves out loud
  _passed++; // => one more billing fact proven where it passed
  print('  ok: $name'); // => indented ok: the green line per behavior
}

// expect checks one equality: actual against want, failures loud.
void expect(Object? actual, Object? want) {
  // => equal passes silent: unequal throws with both values named
  assert(actual == want, 'want $want, got $actual'); // => the whole matcher
}

// freightTotal bills wagons times rate: pure, proven, and pinned now.
int freightTotal(List<int> wagons, int rate) {
  // => fold sums the loads: the rule the table below pins row by row
  final sacks = wagons.fold(0, (sum, w) => sum + w); // => zero wagons: zero
  // => rate multiplies the sum: the pricing policy in one operator
  return sacks * rate; // => pinned: the table fails first on any drift
}

void main() {
  // => the bill table: loads, rate, want; edges included, folklore ended
  final rows = [
    // => one row per shape the billing rule must honor
    [<int>[], 3, 0], // => empty wagons bill zero: the floor edge
    [
      [10],
      3,
      30
    ], // => single wagon: the simple middle
    [
      [10, 20],
      3,
      90
    ], // => multi: the fold earns its keep here
    [
      [10, 20],
      0,
      0
    ], // => free hauling: the zero-rate policy edge
  ];
  // => one test, four rows: the loop proves every edge through one expect
  test('freight bills by table', () {
    // => each row calls the pure core: no fixtures, no state, no clock
    for (final row in rows) {
      // => row walks the table top to bottom
      // => positional reads: loads, rate, want, in row order, cast once
      expect(freightTotal(row[0] as List<int>, row[1] as int), row[2]);
    }
  });
  // => the count line: four bills proven with zero fixtures built
  print('passed: $_passed'); // => Output: passed: 1
}
```

**Output** (`drilling/code/kata-02-write-first-table-test/expected/main.stdout.txt`):

```text
  ok: freight bills by table
passed: 1
```

### Kata 03: Replace the Hand-Rolled Join

(Concepts: co-04.)

The starter joins with a loop and a separator flag; replace it with join like Example 25 teaches. The solution keeps every edge the loop earned.

**Before** (`drilling/code/kata-03-replace-hand-rolled-join/before/starter.dart`):

```dart
// Starter: hand-rolled join. The bug: flags and indexes around one call.
// => separator flag: first-iteration logic no reader can skim past
// => rewrite: names.join(', ') like Example 25, one call, no flag
void main() {
  // => three crops join here: the flag below decides every comma by hand
  print(joinCrops(['oat', 'tea', 'rice'])); // => oat,tea,rice, if flags align
}

// joinCrops concatenates with commas: correct, and needlessly manual.
// => BUG: hand-rolled separator: the exact loop join() already owns
String joinCrops(List<String> crops) {
  // => the accumulator starts empty: every comma below is deliberated
  var out = ''; // => empty: the first crop must skip the separator
  // => first flag: tracks whether a comma is owed before the next crop
  var first = true; // => mutable flag: the reader's tax on every pass
  // => each crop appends: comma first unless the flag says otherwise
  for (final crop in crops) {
    // => for-in: the loop join replaces
    // => flag check per crop: separator logic repeated, never reused
    if (!first) out += ','; // => commas between, never before the first
    // => crop appends: the only line the stdlib version keeps
    out += crop; // => oat, then ,tea, then ,rice, flag permitting
    // => flag clears: exactly once, or every comma doubles from here
    first = false; // => one missed reset corrupts the whole line
  }
  // => the joined line: right today, fragile on every future edit
  return out; // => oat,tea,rice: earned the hard way, kept the risky way
}
```

**After** (`drilling/code/kata-03-replace-hand-rolled-join/after/solution.dart`):

```dart
// Solution: the standard-library join replaces the flag-and-loop.
// => one call: join owns separators, flags, and edges together
// => empty lists join to '': the edge the hand-rolled loop had to earn
void main() {
  // => three crops join in one call: no flag, no index, no deliberation
  print(['oat', 'tea', 'rice'].join(',')); // => Output: oat,tea,rice
  // => the empty edge joins to '': bracketed so no line ends in a space
  print('empty:[${<String>[].join(',')}]'); // => Output: empty:[]
  // => custom separators ride free: the pipe sign renders the same list
  print(['oat', 'tea'].join(' | ')); // => Output: oat | tea
}
```

**Output** (`drilling/code/kata-03-replace-hand-rolled-join/expected/main.stdout.txt`):

```text
oat,tea,rice
empty:[]
oat | tea
```

### Kata 04: Flatten the Null Pyramid

(Concepts: co-02.)

The starter nests three null checks into a pyramid; flatten it with the ?? chain from Example 15. The solution reads in one flat line.

**Before** (`drilling/code/kata-04-flatten-null-checks/before/starter.dart`):

```dart
// Starter: nested null checks. The bug: the happy path sits three deep.
// => pyramid of doom: each missing value indents the answer further
// => rewrite: ?? chain like Example 15, one line, happy path at margin
void main() {
  // => three lookups: stocked, missing crop, missing ledger entirely
  print(label('Sari', {'Sari': 'east'})); // => east: buried three deep
  // => missing packer falls to the crew: nested three levels to say so
  print(label(null, {'Sari': 'east'})); // => crew: correct, unreadable
}

// label names the packer site: correct, and nested past all skimming.
// => BUG: pyramid nesting: each ?? below replaces one whole level here
String? label(String? packer, Map<String, String>? sites) {
  // => level one: no packer means the crew, decided three lines early
  if (packer != null) {
    // => packer present: descend for the site lookup
    // => level two: no ledger means the crew too, one indent deeper
    if (sites != null) {
      // => ledger present: descend for the site itself
      // => level three: the site or the crew, at maximum indentation
      if (sites.containsKey(packer)) {
        // => deepest question of the three
        // => the happy path: three indents from the margin, found at last
        return sites[packer]; // => east: earned through the whole pyramid
      } else {
        // => known packer, unknown site: the crew, deeply nested
        return 'crew'; // => fallback one of three identical sentences
      }
    } else {
      // => no ledger at all: the crew, at indent level two
      return 'crew'; // => fallback two of three identical sentences
    }
  } else {
    // => no packer at all: the crew, at indent level one
    return 'crew'; // => fallback three of three identical sentences
  }
}
```

**After** (`drilling/code/kata-04-flatten-null-checks/after/solution.dart`):

```dart
// Solution: one ?? chain replaces the three-level pyramid.
// => fallbacks read left to right: packer, site, crew, in one line
// => happy path at the margin: no indent deeper than the function body
void main() {
  // => stocked packer resolves the site: the chain's first link holds
  print(label('Sari', {'Sari': 'east'})); // => Output: east
  // => missing packer skips to the crew: the chain's last link answers
  print(label(null, {'Sari': 'east'})); // => Output: crew
  // => missing ledger skips the middle: null-aware lookup, same answer
  print(label('Sari', null)); // => Output: crew
}

// label names the packer site through one fallback chain, flat and total.
// => sites?[packer] is null when the ledger or the entry is missing
// => ?? picks crew exactly when the left side resolves to null
String label(String? packer, Map<String, String>? sites) {
  // => packer null means crew before lookup: the chain's first fallback
  // => lookup null means crew after: the chain's second fallback, same line
  return packer == null ? 'crew' : (sites?[packer] ?? 'crew'); // => flat
}
```

**Output** (`drilling/code/kata-04-flatten-null-checks/expected/main.stdout.txt`):

```text
east
crew
crew
```

### Kata 05: Wrap Failures with Context

(Concepts: co-02.)

The starter rethrows the raw parse failure with no line number; wrap it in the custom exception shape from Example 13. The solution addresses every failure.

**Before** (`drilling/code/kata-05-wrap-with-context/before/starter.dart`):

```dart
// Starter: bare rethrow loses context. The bug: which line broke?
// => raw FormatException: the handler learns nothing about the ledger line
// => rewrite: custom exception with line number, like Example 13
void main() {
  // => two ledger lines: the second carries a bad count, anonymously
  final lines = ['oat,12', 'tea,many']; // => many is not a count, line two
  // => parse throws raw: the catch below cannot name the guilty line
  try {
    // => parseAll throws on 'many': context-free, line number lost
    print(parseAll(lines)); // => never prints: line two throws first
  } catch (e) {
    // => the handler asks which line: the failure stays silent
    // => BUG: no line number: operators guess between line one and two
    print('bad ledger: $e'); // => names the failure, never its address
  }
}

// parseAll parses every ledger line: raw throws, context-free.
// => BUG: int.parse throws bare: the line number never joins the failure
List<int> parseAll(List<String> lines) {
  // => indexed loop: the line number exists here, then gets discarded
  final counts = <int>[]; // => parsed counts accumulate in order
  // => each line splits and parses: the throw below forgets its address
  for (var i = 0; i < lines.length; i++) {
    // => i knows the line number
    // => split on comma: count text rides right of the comma
    final parts = lines[i].split(','); // => parts[1] is the count text
    // => BUG: bare parse: 'many' throws with no line number attached
    counts.add(int.parse(parts[1])); // => line two throws here, anonymously
  }
  // => the counts return: reached only when every line parses cleanly
  return counts; // => unreachable in the demo: line two always throws
}
```

**After** (`drilling/code/kata-05-wrap-with-context/after/solution.dart`):

```dart
// Solution: the failure carries its line number and bad text.
// => BadLine names the failure: line plus text, typed for handlers
// => handlers decide by fields: skip, fix, or abort, with the address
void main() {
  // => two ledger lines: the second carries a bad count, now addressed
  final lines = ['oat,12', 'tea,many']; // => many is not a count, line two
  // => parseAll throws addressed: the catch below learns the line number
  try {
    // => line two throws with its address: BadLine(2, 'many'), data-rich
    print(parseAll(lines)); // => never prints: line two throws addressed
  } on BadLine catch (e) {
    // => the custom class: fields arrive typed
    // => line and text print: operators walk straight to ledger line two
    print('line ${e.line}: ${e.text}'); // => Output: line 2: many
  }
}

// BadLine names a ledger failure with its address: line plus bad text.
// => implements Exception: on-catch clauses name it like Example 13
// => const: failures build as cheap values at the throw site
class BadLine implements Exception {
  // => final address: the line number, one-based for human readers
  final int line; // => one-based: ledger line two, not index one
  // => final evidence: the bad text exactly as the ledger wrote it
  final String text; // => 'many': the count that refused to parse
  // => const constructor: address plus evidence, built at the throw
  const BadLine(this.line, this.text);
}

// parseAll parses every ledger line: addressed throws, context-rich.
// => try around int.parse: the raw failure converts at its address
List<int> parseAll(List<String> lines) {
  // => indexed loop: i+1 is the human line number the failure carries
  final counts = <int>[]; // => parsed counts accumulate in order
  // => each line splits and parses: throws below carry line and text
  for (var i = 0; i < lines.length; i++) {
    // => i+1 addresses the failure
    // => split on comma: count text rides right of the comma
    final parts = lines[i].split(','); // => parts[1] is the count text
    // => convert the raw throw: catch names the line, throws the address
    try {
      // => the risky parse: 'many' throws FormatException, caught below
      counts.add(int.parse(parts[1])); // => line two throws here, addressed
    } on FormatException {
      // => no binding: the address matters, not fields
      // => throw addressed: line number plus bad text, typed for handlers
      throw BadLine(i + 1, parts[1]); // => line 2, 'many': operators guided
    }
  }
  // => the counts return: reached only when every line parses cleanly
  return counts; // => unreachable in the demo: line two always throws
}
```

**Output** (`drilling/code/kata-05-wrap-with-context/expected/main.stdout.txt`):

```text
line 2: many
```

### Kata 06: Group with Fold, Not by Hand

(Concepts: co-03.)

The starter groups with a containsKey branch per row; replace it with update and ifAbsent from Examples 6 and 32. The solution drops the branch entirely.

**Before** (`drilling/code/kata-06-group-with-fold/before/starter.dart`):

```dart
// Starter: grouping by hand. The bug: containsKey branches per row.
// => branch per row: lookup, test, then set, spelled out every time
// => rewrite: update with ifAbsent like Examples 6 and 32, one call
void main() {
  // => four rows group into three totals: branched, correct, verbose
  print(group([
    ['oat', 12],
    ['tea', 4],
    ['oat', 8]
  ])); // => oat 20, tea 4
}

// group totals sacks per crop: branched lookups, spelled out by hand.
// => BUG: containsKey dance: the update call below owns this whole shape
Map<String, int> group(List<List<Object>> rows) {
  // => the totals start empty: every crop below is a first sighting
  final totals = <String, int>{}; // => crop to running total, hand-filled
  // => each row branches: present adds, absent seeds, decided by hand
  for (final row in rows) {
    // => for-in: every row visits the branch
    // => key and count cast once: the row's two facts, typed for use
    final crop = row[0] as String; // => the crop name for this row
    // => count cast: the sacks this row contributes to the total
    final sacks = row[1] as int; // => the contribution, typed int
    // => BUG: the branch update already owns: lookup, test, then set
    if (totals.containsKey(crop)) {
      // => seen before: add to the total
      // => present adds: read, add, write, three steps for one idea
      totals[crop] = totals[crop]! + sacks; // => oat climbs 12 then 20
    } else {
      // => absent seeds: the first sighting starts the total here
      totals[crop] = sacks; // => tea seeds at 4, oat seeded at 12
    }
  }
  // => the totals return: right, and three times longer than the idiom
  return totals; // => {oat: 20, tea: 4}: earned through the branch
}
```

**After** (`drilling/code/kata-06-group-with-fold/after/solution.dart`):

```dart
// Solution: one update call groups every row, branch-free.
// => update with ifAbsent: seed or add in a single map call
// => the branch disappears: the map owns the present-absent decision
void main() {
  // => four rows group into three totals: one call per row, no branch
  print(group([
    ['oat', 12],
    ['tea', 4],
    ['oat', 8]
  ])); // => Output: {oat: 20, tea: 4}
}

// group totals sacks per crop: the update idiom, branch-free and total.
// => update decides present-vs-absent: the map's job, not the loop's
Map<String, int> group(List<List<Object>> rows) {
  // => the totals start empty: update seeds every first sighting itself
  final totals = <String, int>{}; // => crop to running total, map-filled
  // => each row updates: add when present, seed when absent, one call
  for (final row in rows) {
    // => for-in: every row visits the update
    // => key and count cast once: the row's two facts, typed for use
    final crop = row[0] as String; // => the crop name for this row
    // => update owns the branch: present adds, absent seeds, decided inside
    totals.update(crop, (sum) => sum + (row[1] as int),
        ifAbsent: () => row[1] as int); // => oat ends at 20, tea at 4
  }
  // => the totals return: the idiom's whole answer in one less branch
  return totals; // => {oat: 20, tea: 4}: earned the short way
}
```

**Output** (`drilling/code/kata-06-group-with-fold/expected/main.stdout.txt`):

```text
{oat: 20, tea: 4}
```

### Kata 07: Freeze the Class

(Concepts: co-11.)

The starter mutates order fields so repricing destroys history; freeze it with finals and copyWith from Examples 49 and 50. The solution keeps every version.

**Before** (`drilling/code/kata-07-freeze-the-class/before/starter.dart`):

```dart
// Starter: mutable order. The bug: repricing destroys the old price.
// => var fields: every method below can rewrite history by accident
// => rewrite: final fields plus copyWith like Examples 49 and 50
void main() {
  // => the order opens at thirty: the history the reprice will destroy
  final order = Order('oat', 12, 30); // => mutable: price about to move
  // => reprice mutates: the thirty is gone, no version keeps it
  order.reprice(25); // => history destroyed: thirty lives nowhere now
  // => prints twenty-five: correct now, unprovable against before
  print(order.price); // => 25: the after without a before beside it
}

// Order holds a purchase line: mutable, history-destroying, convenient.
// => BUG: var price: reprice below rewrites what happened, not what is
class Order {
  // => var crop: mutable identity, reassignable by any method, anytime
  var crop = ''; // => BUG: identity should freeze, like Example 49
  // => var sacks: mutable count, drifting under every future edit
  var sacks = 0; // => BUG: counts should freeze at writing time
  // => var price: the history-destroyer, repriced without a trace
  var price = 0; // => BUG: derivation should keep every version
  // => constructor assigns: the only honest lines in a mutable class
  Order(this.crop, this.sacks, this.price); // => fields set, then exposed
  // => reprice mutates: the old price vanishes with no version kept
  void reprice(int next) => price = next; // => BUG: derivation over mutation
}
```

**After** (`drilling/code/kata-07-freeze-the-class/after/solution.dart`):

```dart
// Solution: frozen fields with copyWith derivation keep every version.
// => final fields: construction sets them, nothing moves them after
// => copyWith derives: repricing returns the next version, keeps this one
void main() {
  // => the order opens at thirty: frozen, versioned, keeps forever
  const order = Order('oat', 12, 30); // => const: the starting fact
  // => reprice derives: thirty stays in order, twenty-five in repriced
  final repriced = order.copyWith(price: 25); // => new version, old intact
  // => both versions print: before beside after, history preserved
  print('${order.price} then ${repriced.price}'); // => Output: 30 then 25
}

// Order is one frozen purchase line: changes derive, never mutate.
// => all fields final: copyWith is the only evolution path, by design
class Order {
  // => final facts: crop, count, price, frozen at construction time
  final String crop; // => what is bought: never changes for this line
  final int sacks; // => how many: fixed when the line is written
  final int price; // => at what price: repriced by derivation, not edit
  // => const constructor: order lines start as compile-time facts
  const Order(this.crop, this.sacks, this.price); // => frozen at birth
  // => copyWith derives: null keeps mine, values take the replacement
  Order copyWith({String? crop, int? sacks, int? price}) {
    // => each field keeps its own unless the caller names a replacement
    return Order(
        crop ?? this.crop,
        sacks ?? this.sacks, // => crop, sacks
        price ?? this.price); // => price: the derived version's news
  }
}
```

**Output** (`drilling/code/kata-07-freeze-the-class/expected/main.stdout.txt`):

```text
30 then 25
```

### Kata 08: Generate Lazily

(Concepts: co-03, co-15.)

The starter builds the whole route eagerly before any stop reads; replace it with the sync-star shape from Example 60. The solution costs one value at a time.

**Before** (`drilling/code/kata-08-generate-lazily/before/starter.dart`):

```dart
// Starter: eager route list. The bug: every stop builds before any reads.
// => full list first: thousand-stop routes pay a thousand before mile one
// => rewrite: sync* generator like Example 60, one stop per pull
void main() {
  // => the route builds whole: four stops allocated before the first read
  print(route()); // => [mill, depot, stall, home]: all eager, all at once
}

// route builds every stop eagerly: simple, and wasteful at scale.
// => BUG: eager list: readers pay for stops they may never visit
List<String> route() {
  // => the whole route allocates: four strings before any reader arrives
  final stops = <String>[]; // => empty, then filled wholesale below
  // => stop by stop, all eager: mill, depot, stall, home, every time
  stops.add('mill'); // => allocated whether visited or not
  // => second stop eager too: the pattern repeats per stop, always all
  stops.add('depot'); // => paid upfront: laziness would defer this
  // => third and fourth: the whole journey, built before mile one
  stops.add('stall'); // => stall waits in memory for its eventual turn
  // => home last: the full price paid before the first mile is walked
  stops.add('home'); // => four allocations, zero reads so far
  // => the whole list returns: every stop built, few perhaps visited
  return stops; // => eager answer: complete, and completely upfront
}
```

**After** (`drilling/code/kata-08-generate-lazily/after/solution.dart`):

```dart
// Solution: sync* yields one stop per pull, lazily and cheaply.
// => no list builds: stops exist only as the reader requests them
// => firstWhere pulls two: mill, depot, then the generator rests, done
void main() {
  // => the route generates: nothing exists until the pull below asks
  final stops = route(); // => no stop built yet: generation waits for pull
  // => toList pulls all four: mill, depot, stall, home, in order, on demand
  print(stops.toList()); // => Output: [mill, depot, stall, home]
  // => firstWhere pulls two: mill, then depot satisfies, generator rests
  print(route().firstWhere((s) => s.startsWith('d'))); // => Output: depot
}

// route yields the delivery stops one at a time: lazy by construction.
// => sync*: yield pauses until the next pull, resuming exactly there
// => the body runs on pull: no reader, no stops, no cost anywhere
Iterable<String> route() sync* {
  // => first yield: pauses here until the reader requests stop two
  yield 'mill'; // => the route start: pulled first, always
  // => second yield: resumes on request, pauses again right after
  yield 'depot'; // => pulled second: firstWhere rests the generator here
  // => third yield: reached only by readers pulling past depot
  yield 'stall'; // => toList pulls through: this yield runs for the list
  // => final yield: the route end, pulled last by complete collection
  yield 'home'; // => home: the fourth arrival closing the route
}
```

**Output** (`drilling/code/kata-08-generate-lazily/expected/main.stdout.txt`):

```text
[mill, depot, stall, home]
depot
```

## Self-check checklist

Twenty-four promises, one per line. Read each aloud; only tick the ones you can prove with an example number from the course. Unproven ticks are recognition, not automaticity.

- [ ] I can use guard clauses, for-in, and switch without fallthrough instead of translated control flow (co-01).

- [ ] I can pick the loop shape that fits: for-in for values, counted for for positions, forEach for function bodies (co-01).

- [ ] I can return expected failures as sealed Results and reserve exceptions for the unexpected (co-02).

- [ ] I can order on-catch arms narrowest first and rethrow when the layer cannot answer (co-02).

- [ ] I can group with update and ifAbsent and transform with lazy where-map-fold pipelines (co-03).

- [ ] I can choose lists for order, maps for ledgers, and sets for membership questions (co-03).

- [ ] I can build text with StringBuffer and shape it with trim, split, case conversion, and join (co-04).

- [ ] I can round-trip JSON through toJson and fromJson with casts in exactly one place (co-04).

- [ ] I can store instants in UTC, measure with difference and Duration, and render stamps by hand (co-05).

- [ ] I can split libraries with part files and resell surfaces through export barrels (co-06).

- [ ] I can prefix imports and admit names with show while hiding the rest (co-06).

- [ ] I can pin name, SDK range, and dependency versions in the pubspec and compare versions numerically (co-07).

- [ ] I can write failing-first tests with the group-test-expect shape and tabled edges (co-08).

- [ ] I can isolate IO behind fakes and freeze clocks as parameters (co-08).

- [ ] I can chain Futures with then and catchError and gather branches with Future.wait (co-09).

- [ ] I can reshape streams with operators and bridge callbacks through StreamController (co-09).

- [ ] I can parameterize functions and classes over T and bound T when the body needs a shape (co-10).

- [ ] I can freeze instances with final and const and derive new values with copyWith (co-11).

- [ ] I can compare by value with == and hashCode so sets and map keys obey facts (co-11).

- [ ] I can keep files formatted, analyzer-clean, and lint-pinned through analysis options (co-12).

- [ ] I can recognize the controller bridge as the interop pattern for native and script callbacks (co-13).

- [ ] I can case every identifier by its kind and document every public member with doc comments (co-14).

- [ ] I can reach for the lazy shape first: pipelines, generators, and const builds over eager copies (co-15).

- [ ] I can explain any idiomatic sample in five lines: what, idiom, refused failure, cost, breaking change (co-16).

## Elaborative interrogation & self-explanation

Six why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer. Argue against the model before reading it; the disagreement is where the learning lives.

### W1: Why do expected failures travel as Results while unexpected ones throw?

<details><summary>Model answer</summary>

Results track anticipated misses in the type system so callers switch instead of catching, while throws mark paths the code never planned for. The rejected alternative — throwing for a stocked-or-not lookup — forces every caller into catch blocks for a question the ledger already answers as data.

</details>

### W2: Why does the testing cluster mirror package:test instead of teaching it directly?

<details><summary>Model answer</summary>

The harness pins stdlib-only runtimes with no lockfile, so package:test cannot install; the mirror teaches the group-test-expect shape with asserts so the later jump is vocabulary. The rejected alternative — skipping tests for these courses — would leave the most transferable habit untaught.

</details>

### W3: Why do toolchain examples print fixed words instead of raw tool output?

<details><summary>Model answer</summary>

Tool chatter embeds versions and paths that drift across releases and machines; grepping the verdict into fixed words keeps the golden transcript byte-stable. The rejected alternative — recording raw analyze text — would red the harness on every analyzer release without a single behavior changing.

</details>

### W4: Why keep the capstone shell to three verbs with no branches?

<details><summary>Model answer</summary>

Branches decide, and decisions deserve tests: the shell stays untestable-thin while the pure core holds every behavior asserts can reach. The rejected alternative — parsing inside main — would hide the most failure-prone logic exactly where no test file looks.

</details>

### W5: Why flatten with ?? instead of nesting null checks that read more explicitly?

<details><summary>Model answer</summary>

Nesting buries the happy path one indent per missing value while the chain reads fallbacks left to right at the margin. The rejected alternative — the pyramid — scales indentation with uncertainty until the answer sits too deep to skim.

</details>

### W6: Why not run isolates in the concurrency survey?

<details><summary>Model answer</summary>

Isolates spawn OS threads whose scheduling and startup costs fight byte-determinism; Futures and streams teach the coordination shapes with fixed order and instant completion. The rejected alternative — a spawned isolate per example — would trade the survey's determinism for realism no lesson here needs.

</details>
