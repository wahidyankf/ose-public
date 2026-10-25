---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns recognition into recall: twenty-four questions covering all sixteen concepts, eight applied problems drawn from real maintenance work, eight hands-on katas with before-and-after solutions, a twenty-four-item self-check, and six design trade-off prompts with model answers. Work the questions closed-book, then check against the detail blocks; run every kata in the harness. The method is retrieval first and verification second: answer from memory, read the model answer, then close the gap by running the mapped example and predicting its output before looking. A question you answer correctly twice, a week apart, is learned; anything else is merely read. For the katas, follow the same loop every time: run the starter and name the smell in one sentence, write your version without peeking at the reference, run it, then diff against the committed solution and account for every difference — a difference you cannot explain is a habit you have not learned yet. Keep a personal log of which questions you miss; the second pass through this page should take half the time of the first, and the items still red on the third pass are the ones to turn into flashcards.

## Recall Q&A

Answer each question from memory before opening its detail block: say the answer aloud in one or two sentences, then check. The questions follow the course order — control flow and errors first, libraries and tooling next, reading code last — so a missed question points at the level worth reworking.

### Q1 (co-01): When is an implicit truthiness test correct, and when must the comparison be explicit?

<details><summary>Answer</summary>

Implicit tests are correct for presence versus absence: empty collections, empty strings, and None as missing. Explicit comparisons take over where falsy values are legitimate data — `count is not None` when zero counts, `flag is True` when only the real boolean passes. The rule is intent: presence asks implicitly, sentinel values compare explicitly.

</details>

### Q2 (co-01): What does the else clause of a for loop mean, and when does it run?

<details><summary>Answer</summary>

It means the loop finished without break — the search failed, the validation passed every item. It runs after exhaustion, never after break, which makes it the absence branch of search loops. The common misreading is failure; the truth is completion without interruption.

</details>

### Q3 (co-02): Why does the success path belong in else rather than inside try?

<details><summary>Answer</summary>

Statements inside try inherit its handlers, so success code that raises gets misattributed to the risky call. Else places success outside handler reach, which makes each handler name exactly one operation. Narrow try blocks keep reports trustworthy.

</details>

### Q4 (co-02): What does raise from add to an exception, and when is from None appropriate?

<details><summary>Answer</summary>

From links the new error to its cause via **cause**, so the traceback shows both — spark first, wrapper second. From None deliberately suppresses the context, used only when the inner error is an implementation detail that would mislead. Default to chaining; suppress visibly and rarely.

</details>

### Q5 (co-03): Why is a comprehension preferable to an accumulator loop for map-filter work?

<details><summary>Answer</summary>

It states input, condition, and mapping in one left-to-right expression instead of spreading them across initialization, loop, condition, and append. The loop runs in C rather than per-item bytecode, roughly doubling speed. Expand back to a loop when the body needs side effects or debugging.

</details>

### Q6 (co-03): When should you reach for setdefault, and when for defaultdict?

<details><summary>Answer</summary>

Setdefault fits one-off groupings where the default belongs next to the use; defaultdict fits hot paths where one factory serves the whole mapping. Both remove the if-key-absent branch. The deeper rule is policy placement: local at the call, global at construction.

</details>

### Q7 (co-04): What three arguments should a text open name, and why?

<details><summary>Answer</summary>

Encoding (utf-8, never the platform default), newline control (empty string for csv work), and an errors policy (strict for data that must be right, replace for logs that must survive). Together they make text I/O deterministic across machines instead of correct by accident.

</details>

### Q8 (co-04): Why must csv files open with newline empty, and what breaks without it?

<details><summary>Answer</summary>

The csv module owns line-ending translation; when the file object also translates, rows gain phantom blank lines on some platforms. Newline empty hands endings entirely to the module. The breakage is platform-specific, which is why the rule must be unconditional.

</details>

### Q9 (co-05): Why must every datetime be timezone-aware, and where does UTC belong?

<details><summary>Answer</summary>

Naive arithmetic across zones silently ignores offsets, and DST transitions turn stored naive stamps into lies. Aware datetimes convert explicitly and refuse naive-aware comparison instead of guessing. UTC is the storage and arithmetic zone; local zones are display-only at the edges.

</details>

### Q10 (co-05): Which clock answers which question: time, monotonic, perf_counter?

<details><summary>Answer</summary>

Wall time (time) stamps human moments; monotonic measures durations because it never steps backward; perf_counter benchmarks with the highest resolution. Mixing them produces negative durations after NTP steps. Stamp with wall, subtract with monotonic.

</details>

### Q11 (co-06): What belongs at module top level, and what must the **name** guard hold?

<details><summary>Answer</summary>

Top level holds definitions only — imports, constants, functions — so importing never acts. The guard holds orchestration: parse, call, print, exit. The split makes every module both import-safe library and runnable program.

</details>

### Q12 (co-06): What does a package **init** decide, and what must it never contain?

<details><summary>Answer</summary>

It decides the public surface: which names users import from the package root. It never contains logic, because package import runs it first and logic there slows every import while hiding behavior. Re-export curated names and **all**; nothing else.

</details>

### Q13 (co-07): What three properties make a requirements pin trustworthy?

<details><summary>Answer</summary>

Exact versions (==, never ranges), hash digests per artifact (--require-hashes), and installation with --no-deps so nothing unrecorded enters. Together they make reinstalls bit-identical and upgrades reviewable diffs rather than silent drift.

</details>

### Q14 (co-07): Why single-source the project version, and where should it live?

<details><summary>Answer</summary>

Scattered versions disagree — setup says one thing, docs another — and releases half-happen. One line in pyproject.toml names the version; runtime and scripts derive it via importlib.metadata and tomllib. Bumps touch one line and cannot half-apply.

</details>

### Q15 (co-08): Why organize tests as TestCase classes with setUp fixtures?

<details><summary>Answer</summary>

Classes share state through the instance: setUp rebuilds mutable fixtures per method, test\_ methods assert one behavior each, and the runner reports per-method results. Fresh fixtures make tests order-independent, which is also what makes them safe to parallelize.

</details>

### Q16 (co-08): When do you patch, and where must the patch target live?

<details><summary>Answer</summary>

Patch true boundaries — network, disk, time, services — so unit suites stay fast and deterministic, keeping one real integration test per adapter. Target the name where it is looked up (the importer namespace), not where it is defined, or the stub never intercepts.

</details>

### Q17 (co-09): When are threads the right model, and what ordering rule keeps them deterministic?

<details><summary>Answer</summary>

Threads fit I/O-shaped waits that release the GIL — network, disk, sleep — never CPU work. Preassigned result slots plus joining every thread before reading make output order fixed regardless of scheduling. Keep thread bodies tiny and exception-aware.

</details>

### Q18 (co-10): What does a TypeVar express that duplicated concrete functions cannot?

<details><summary>Answer</summary>

The relationship between input and output types — same T in, same T out — checked at every call site from one implementation. Bounds document requirements like sortability. Erasure keeps runtime simple: generics guide checkers and readers, never dispatch.

</details>

### Q19 (co-11): What three properties do frozen dataclasses give records?

<details><summary>Answer</summary>

Field-wise equality, stable hashing for sets and dict keys, and mutation refusal — shared records become always-safe. The entity-versus-value split follows: lifecycles mutate with identity, measurements freeze as values. Model values frozen, entities mutable.

</details>

### Q20 (co-15): When does an idiom switch forms, and what triggers each switch?

<details><summary>Answer</summary>

Comprehensions expand to loops when debugging needs statements; generators materialize to lists when results are reused; slots come off when shapes genuinely grow; frozen records evolve by replace, never by thawing. The trigger is always context change: the form follows the new constraint, without guilt and without delay.

</details>

### Q21 (co-12): What belongs in a CI quality floor, and in what order?

<details><summary>Answer</summary>

Compile every file first (py_compile, milliseconds, total), then lint for style, then types for contracts, then tests for behavior. Each layer assumes the ones below. Broken syntax must never consume test minutes or reach deploy.

</details>

### Q22 (co-13): What three declarations make a ctypes call trustworthy, and what graduates beyond ctypes?

<details><summary>Answer</summary>

Argtypes plus restype (lying types corrupt silently), mapped host exceptions for foreign failures, and reviewed ownership of anything crossing the boundary. Callback-heavy, complex, or hot paths graduate to real extensions; ctypes serves simple stable ABIs.

</details>

### Q23 (co-14): What does each PEP 8 casing signal, and why does the distinction matter?

<details><summary>Answer</summary>

Snake for functions and variables, UPPER_SNAKE for constants, CapWords for classes, leading underscore for private. Shape answers what-kind before words answer what, which halves name decoding and makes every codebase read alike.

</details>

### Q24 (co-16): What is the systematic method for reading unfamiliar idiomatic code?

<details><summary>Answer</summary>

Read inside-out following evaluation order, name each intermediate type aloud, predict the output before running, and account for every difference. Map each construct to its known idiom and question deviations. Predictions that fail locate the exact misunderstanding.

</details>

## Applied problems

Work each problem in a scratch file before checking the mapped example: write the non-idiomatic form first so the contrast is concrete, then convert and run both. The first problem retrains the accent directly; the next three force error-handling choices under different failure rates; problems five through seven practice replacing hand-rolled code with the standard library; the last one writes the pinning story a real project needs. Timebox each problem to thirty minutes: if the conversion is not working by then, run the mapped example, study its shape, and retry the problem from a blank file. The retry matters more than the first attempt, because the second pass reveals which part of the idiom failed to transfer.

### Problem 1: Rewrite the accent

The function below loops `for i in range(len(rows)): process(rows[i])` and checks `if name != ''`. Rewrite it with enumerate and truthiness, then state what each change removes: the index arithmetic, the triple naming, and the literal comparison. Run both versions, confirm identical output, and state where the difference would start to matter at volume.

### Problem 2: Choose the handler: missing config key

A service reads an optional `timeout` key that is absent in most deployments. Choose between try-except KeyError, dict.get with a default, and an `if key in` branch. Justify the choice from absence frequency and handler cost, implement the winner, and show the absent-key path in the transcript.

### Problem 3: Choose the handler: corrupt payload

An importer parses rows where one in a thousand is malformed and must be skipped with a logged line number. Choose between EAFP per row, upfront validation of the whole file, and abort-on-first-error. Justify from the error rate and the partial-results requirement, then collect the bad rows with line numbers instead of aborting.

### Problem 4: Choose the handler: failed payment charge

A charge function can fail for insufficient funds (retry with another method) or unknown account (page support). Choose between returning error codes, raising one exception type, and raising a two-leaf hierarchy. Justify from caller branching needs, then implement with except clauses per kind so retry and paging policies stay distinct.

### Problem 5: Find the stdlib replacement: manual CSV

A helper splits lines on commas and breaks on quoted fields. Replace it with csv.DictReader, list the three behaviors gained (quoting, embedded newlines, header keying), and prove the quoted-field case now parses, showing the header keying in the same run.

### Problem 6: Find the stdlib replacement: hand-rolled timing

A script stamps durations with wall time and occasionally logs negative elapsed values after NTP steps. Replace the clock with monotonic for durations while keeping wall stamps for display, and explain why each clock owns its question, including what breaks when the two clocks swap roles.

### Problem 7: Find the stdlib replacement: copy-pasted retry

Three functions each implement retry with slightly different backoff bugs. Factor the policy into one helper (or decorator) with attempts, delay, and retryable exceptions as parameters, then convert all three call sites and delete the duplicates, keeping one parameterized helper with tests for each call site.

### Problem 8: Design the pin for a new dependency

A project gains its first third-party dependency. Write the requirements line with an exact pin and hash placeholder, the install command with --require-hashes --no-deps, and the pyproject floor entry. State what breaks on upgrade day if any piece is missing, with the exact error each gap produces.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Write your version before peeking at the reference, then diff and account for every difference. Work them in order: error style and testing first, because honesty about failure underlies everything; standard-library replacements next, because they remove the most code; records, managers, and logging last, because each isolates one production judgement. Run the reference in the harness after diffing: your version and the reference must both exit green, and any output difference is a behavior difference to explain, not a formatting quirk to ignore.

### Kata 01: Convert Error-as-Value to Exceptions

(Concepts: co-02.)

Prove the error style first: run the starter and watch failure masquerade as data, then match the reference that raises a typed error the caller can handle.

**`drilling/code/kata-01-error-style-conversion/before/starter.py`**:

```python
# => Kata 1 starter: failure disguised as data.
def find_price(items, name):  # => returns None when the item is missing
    for item_name, price in items:  # => linear scan over the pairs
        if item_name == name:  # => match returns the price
            return price  # => success path returns a number
    return None  # => failure path returns None: the disguise


catalog = [("lamp", 60), ("chair", 45)]  # => two items on record
print(find_price(catalog, "lamp"))  # => 60: success looks normal
print(find_price(catalog, "desk"))  # => None: failure looks like data
print(find_price(catalog, "desk") + 10)  # => CRASHES: None + 10 raises
```

**`drilling/code/kata-01-error-style-conversion/after/solution.py`**:

```python
# => Kata 1 solution: failure raises, typed and loud.
class UnknownItem(LookupError):  # => WHY domain: callers catch exactly this
    pass  # => the type carries the meaning


def find_price(items, name):  # => raises instead of returning None
    for item_name, price in items:  # => same scan, honest failure mode
        if item_name == name:  # => match still returns the price
            return price  # => success unchanged: numbers out
    raise UnknownItem(name)  # => WHY raise: misuse fails at the call site


catalog = [("lamp", 60), ("chair", 45)]  # => two items on record
print(find_price(catalog, "lamp"))  # => Output: 60, success unchanged
try:  # => the failure path, handled by the caller
    find_price(catalog, "desk")  # => raises: no silent None anymore
except UnknownItem as err:  # => typed catch: the contract proven
    print("unknown:", err)  # => Output: unknown: desk
```

**Output** (`drilling/code/kata-01-error-style-conversion/expected/main.stdout.txt`):

```text
60
unknown: desk
```

### Kata 02: Turn a Print Check into a TestCase

(Concepts: co-08.)

Prove the testing habit first: run the starter and notice the manual print nobody asserts, then match the reference that turns the check into a TestCase the runner enforces.

**`drilling/code/kata-02-unittest-first/before/starter.py`**:

```python
# => Kata 2 starter: an eyeball check nobody reruns.
def total(items):  # => the function under a manual check
    return sum(items)  # => plain sum, presumed correct


print(total([1, 2, 3]))  # => eyeball: is that 6? check by staring
print(total([]))  # => eyeball: 0 looks right, move on
```

**`drilling/code/kata-02-unittest-first/after/solution.py`**:

```python
# => Kata 2 solution: the checks run under the standard runner.
import unittest  # => WHY runner: enforced on every run, not eyeballed


def total(items):  # => the same function, now guarded
    return sum(items)  # => plain sum, proven correct


class TestTotal(unittest.TestCase):  # => WHY class: the standard shape
    def test_several(self):  # => the first eyeball, made permanent
        self.assertEqual(total([1, 2, 3]), 6)  # => pinned: 6, not eyeballed

    def test_empty(self):  # => WHY second: the edge the eyeball skipped
        self.assertEqual(total([]), 0)  # => empty sums to zero


suite = unittest.TestLoader().loadTestsFromTestCase(TestTotal)  # => collected
result = unittest.TestResult()  # => deterministic capture, no timing
suite.run(result)  # => enforced: failures raise the exit
print("ran:", result.testsRun)  # => Output: ran: 2, both enforced
print("ok:", result.wasSuccessful())  # => Output: ok: True
```

**Output** (`drilling/code/kata-02-unittest-first/expected/main.stdout.txt`):

```text
ran: 2
ok: True
```

### Kata 03: Replace Hand-Split CSV with the csv Module

(Concepts: co-04.)

Prove the stdlib first: run the starter against the quoted field and watch the columns shift, then match the reference that parses with the csv module.

**`drilling/code/kata-03-stdlib-csv/before/starter.py`**:

```python
# => Kata 3 starter: split breaks on the quoted comma.
def parse_line(line):  # => naive split on every comma
    return line.strip().split(",")  # => quoted commas split too: the bug


print(parse_line("ada,98"))  # => ['ada', '98']: clean rows work
print(parse_line('"grace, r.",100'))  # => 3 pieces: the quoted comma split
```

**`drilling/code/kata-03-stdlib-csv/after/solution.py`**:

```python
# => Kata 3 solution: the module owns quoting and headers.
import csv  # => WHY stdlib: the format implemented once, correctly
import io  # => WHY StringIO: demo rows without fixture files

rows = 'name,score\nada,98\n"grace, r.",100\n'  # => header plus two rows
reader = csv.DictReader(io.StringIO(rows))  # => WHY DictReader: keyed by header
parsed = list(reader)  # => materialized for the transcript
print(len(parsed))  # => Output: 2, quoted comma kept whole
print(parsed[1]["name"])  # => Output: grace, r., quoting handled
print(parsed[1]["score"])  # => Output: 100, columns aligned
```

**Output** (`drilling/code/kata-03-stdlib-csv/expected/main.stdout.txt`):

```text
2
grace, r.
100
```

### Kata 04: Replace String Paths with pathlib

(Concepts: co-04.)

Prove the path object first: read the starter string surgery and name its platform assumptions, then match the reference that joins and dissects with pathlib.

**`drilling/code/kata-04-pathlib-upgrade/before/starter.py`**:

```python
# => Kata 4 starter: string surgery with platform assumptions.
def join(base, name):  # => concatenation with a hardcoded separator
    return base + "/" + name  # => breaks on Windows, doubles on trailing slash


def stem(path):  # => suffix chop by splitting on dots
    return path.split("/")[-1].split(".")[0]  # => three splits, three assumptions


print(join("/data", "a.txt"))  # => /data/a.txt: works here, today
print(stem("/data/archive.tar.gz"))  # => archive: wrong, double suffix lost
```

**`drilling/code/kata-04-pathlib-upgrade/after/solution.py`**:

```python
# => Kata 4 solution: paths as objects, structure as methods.
from pathlib import PurePosixPath  # => WHY pure: computes, never touches disk

base = PurePosixPath("/data")  # => the directory as an object
print(base / "a.txt")  # => Output: /data/a.txt, join reads as join
full = PurePosixPath("/data/archive.tar.gz")  # => the double-suffix case
print(full.name)  # => Output: archive.tar.gz, no splitting needed
print(full.suffixes)  # => Output: ['.tar', '.gz'], both suffixes kept
print(full.stem)  # => Output: archive.tar, outer suffix removed only
```

**Output** (`drilling/code/kata-04-pathlib-upgrade/expected/main.stdout.txt`):

```text
/data/a.txt
archive.tar.gz
['.tar', '.gz']
archive.tar
```

### Kata 05: Replace the Accumulator with a Comprehension

(Concepts: co-03, co-15.)

Prove the expression first: run the starter accumulator and count its moving parts, then match the reference that states the same transform as one comprehension.

**`drilling/code/kata-05-comprehension-upgrade/before/starter.py`**:

```python
# => Kata 5 starter: four lines for one transformation.
def big_squares(limit):  # => accumulator version of filter-plus-map
    out = []  # => empty result waiting to be filled
    for n in range(limit):  # => explicit loop over the range
        if n % 2 == 0:  # => condition separated from the result
            out.append(n * n)  # => method call per item
    return out  # => assembled elsewhere from parts


print(big_squares(8))  # => [0, 4, 16, 36]: correct but scattered
```

**`drilling/code/kata-05-comprehension-upgrade/after/solution.py`**:

```python
# => Kata 5 solution: the mapping as one expression.
def big_squares(limit):  # => the same contract, one expression
    return [
        n * n for n in range(limit) if n % 2 == 0
    ]  # => WHY one line: map plus filter


print(big_squares(8))  # => Output: [0, 4, 16, 36], identical result
print(big_squares(0))  # => Output: [], empty input stays clean
print(len(big_squares(100)))  # => Output: 50, half of one hundred kept
```

**Output** (`drilling/code/kata-05-comprehension-upgrade/expected/main.stdout.txt`):

```text
[0, 4, 16, 36]
[]
50
```

### Kata 06: Replace the Dict Record with a Dataclass

(Concepts: co-11.)

Prove the record first: run the starter dict and watch a typo key pass silently, then match the reference that freezes the shape in a dataclass.

**`drilling/code/kata-06-dataclass-record/before/starter.py`**:

```python
# => Kata 6 starter: dicts accept typos silently.
def make_item(sku, stock):  # => dict factory with string keys
    return {"sku": sku, "stock": stock}  # => any key goes, typos included


lamp = make_item("lamp", 4)  # => correct construction
print(lamp["stok"])  # => CRASHES: typo key raises KeyError at use
```

**`drilling/code/kata-06-dataclass-record/after/solution.py`**:

```python
# => Kata 6 solution: the shape frozen at construction time.
from dataclasses import dataclass  # => WHY dataclass: records without boilerplate


@dataclass(frozen=True)  # => WHY frozen: values, comparable, hashable
class Item:  # => the record with declared fields
    sku: str  # => identifier field, typed
    stock: int  # => count field, typed


lamp = Item("lamp", 4)  # => construction checks the field names
print(lamp.sku)  # => Output: lamp, attribute access documents intent
print(lamp.stock)  # => Output: 4, no string keys to mistype
other = Item("lamp", 4)  # => separately built, equal contents
print(lamp == other)  # => Output: True, values compare by fields
```

**Output** (`drilling/code/kata-06-dataclass-record/expected/main.stdout.txt`):

```text
lamp
4
True
```

### Kata 07: Replace try-finally with a Context Manager

(Concepts: co-02.)

Prove the pairing first: read the starter try-finally and trace every exit, then match the reference that brackets the same region with a context manager.

**`drilling/code/kata-07-manager-upgrade/before/starter.py`**:

```python
# => Kata 7 starter: the pairing spans the whole body.
log = []  # => stand-in for an acquired resource


def work():  # => manual acquire plus release
    log.append("acquire")  # => setup inline with the logic
    try:  # => body plus cleanup interleaved
        log.append("work")  # => the actual work, one line here
    finally:  # => release must be remembered on every path
        log.append("release")  # => paired by discipline, not structure


work()  # => run the paired region
print(log)  # => ['acquire', 'work', 'release']: correct by care
```

**`drilling/code/kata-07-manager-upgrade/after/solution.py`**:

```python
# => Kata 7 solution: the pairing is two adjacent lines.
from contextlib import contextmanager  # => WHY decorator: protocol in one function

log = []  # => the same stand-in resource


@contextmanager  # => acquire-yield-release becomes a with block
def session():  # => the bracketed region, named once
    log.append("acquire")  # => WHY entry: runs before the body
    try:  # => WHY finally: exit survives body exceptions
        yield "handle"  # => the body runs here
    finally:  # => structural pairing, not discipline
        log.append("release")  # => guaranteed on every exit path


with session() as handle:  # => WHY with: the pairing visible
    log.append("work")  # => the body between acquire and release
print(log)  # => Output: ['acquire', 'work', 'release'], correct by structure
print(handle)  # => Output: handle, the yielded value bound
```

**Output** (`drilling/code/kata-07-manager-upgrade/expected/main.stdout.txt`):

```text
['acquire', 'work', 'release']
handle
```

### Kata 08: Replace Diagnostic Prints with logging

(Concepts: co-12.)

Prove the level first: run the starter prints and notice diagnostics mixed with results, then match the reference that routes events through logging.

**`drilling/code/kata-08-logging-upgrade/before/starter.py`**:

```python
# => Kata 8 starter: diagnostics pollute the result stream.
def total(items):  # => pure function with chatty prints
    print("computing...")  # => diagnostic on stdout: pollutes results
    result = sum(items)  # => the actual work, one line
    print(f"got {result}")  # => second diagnostic mixed with data
    return result  # => callers parsing stdout see three lines


print(total([1, 2]))  # => three lines where one belongs
```

**`drilling/code/kata-08-logging-upgrade/after/solution.py`**:

```python
# => Kata 8 solution: events on stderr, data on stdout.
import io  # => WHY capture: the transcript pins the record bytes
import logging  # => WHY logging: levels plus routing

stream = io.StringIO()  # => handler target for the demonstration
handler = logging.StreamHandler(stream)  # => diagnostics flow here
handler.setFormatter(
    logging.Formatter("%(levelname)s %(message)s")
)  # => WHY fixed: stable shape
log = logging.getLogger("kata8")  # => WHY named: records carry origin
log.addHandler(handler)  # => the single configured route
log.setLevel(logging.INFO)  # => gate set once at the boundary


def total(items):  # => the same function, quiet on stdout
    log.info("computing")  # => event, not print: routable and gatible
    return sum(items)  # => result returns; diagnostics stay aside


print(total([1, 2]))  # => Output: 3, stdout carries data only
print(repr(stream.getvalue()))  # => Output: 'INFO computing\n', events aside
```

**Output** (`drilling/code/kata-08-logging-upgrade/expected/main.stdout.txt`):

```text
3
'INFO computing\n'
```

## Self-check checklist

Mark each item only when you can demonstrate it without notes: run the mapped example, predict the output, then explain the why to someone else. An item you can perform but not explain is half learned — revisit the lesson section before marking it done. Review unchecked items weekly: the list doubles as a spaced-repetition schedule, and items that stay unchecked for a month point at the course sections worth re-reading end to end.

1. [ ] I can test presence with truthiness and name the cases that need explicit comparison.
2. [ ] I can write search loops with for-else instead of flag variables.
3. [ ] I can pair index and item with enumerate and state when range is still correct.
4. [ ] I can iterate parallel collections with zip and choose strict mode deliberately.
5. [ ] I can express map-filter work as comprehensions and name the nesting limit.
6. [ ] I can read absent keys with dict.get and attach the default to the lookup.
7. [ ] I can group rows with setdefault or defaultdict and justify the placement.
8. [ ] I can unpack sequences with star targets and keep indexes for positional data.
9. [ ] I can structure try blocks with else and finally in their correct roles.
10. [ ] I can choose EAFP over pre-checks and name the trust-boundary exception.
11. [ ] I can chain exceptions with raise from and suppress context only deliberately.
12. [ ] I can design a shallow exception hierarchy with one base and typed leaves.
13. [ ] I can bracket acquire-release pairs with with and write a correct context manager.
14. [ ] I can swallow expected errors narrowly with suppress without hiding bugs.
15. [ ] I can open text files with explicit encoding, newline, and errors policy.
16. [ ] I can parse and write CSV with headers, quoting, and the newline rule intact.
17. [ ] I can serialize canonical JSON and validate deserialized input at the boundary.
18. [ ] I can match irregular text with compiled, named-group patterns and know when not to.
19. [ ] I can format tables and numbers with format specs instead of manual spacing.
20. [ ] I can build aware datetimes, store UTC, and measure with the correct clock.
21. [ ] I can lay out modules and packages with curated, logic-free surfaces.
22. [ ] I can pin dependencies exactly with hashes and verify the environment programmatically.
23. [ ] I can test with unittest, mock at boundaries, and isolate file tests in tempdirs.
24. [ ] I can read unfamiliar idiomatic code inside-out and predict before running.

## Elaborative interrogation & self-explanation

For each prompt, write your answer before reading the model: name the design choice, name the rejected alternative, and state the concrete trigger that switches between them. The model answers are checks, not substitutes — an answer that matches in conclusion but not in reasoning still needs work. Argue both sides first: the strongest test of understanding is stating the rejected alternative case so fairly that its supporters would accept the summary, then showing the trigger that still decides against it.

### Prompt 1: Why exceptions instead of error codes — and why not always?

Exceptions separate the happy path from handling, travel to the handler that can act, and carry typed information; error codes interleave checks with logic and get ignored. But exceptions are not control flow: hot-path expected outcomes (missing keys, absent rows) deserve get-with-default or sentinel returns, because raising for the common case is slow and noisy. Use exceptions for the genuinely exceptional and total functions for the routine.

### Prompt 2: Why freeze records — and when must they stay mutable?

Frozen records give value semantics: field equality, stable hashing, aliasing safety, which unlock sets, memoization, and fearless sharing. But entities with lifecycles — sessions accumulating state, builders assembling results, caches evicting entries — mutate by nature, and freezing them forces replace-churn that obscures the lifecycle. Freeze values that are measured; mutate entities that live. The mistake in both directions is modeling one as the other.

### Prompt 3: Why mock at all — and what does mocking hide?

Mocking isolates the unit from slow, flaky, or unavailable boundaries so suites run in seconds and deterministically, which is what keeps developers running them. But mocks encode assumptions about the boundary that drift: the stub answers per last quarter API while production moved on, and the suite stays green around a broken integration. The balance is one real test per adapter plus mocks above it — neither all-mocked confidence theater nor all-live flakiness.

### Prompt 4: Why generators for pipelines — and when do lists win?

Generators hold one item per stage regardless of volume, composing into constant-memory pipelines that also express infinite streams. But single-use iteration surprises: consumed generators silently yield nothing twice, debugging lazily is harder, and small reusable results get recomputed per pass. Materialize when the result is small, reused, or debugged; stream when volume is large or unbounded. The choice is lifecycle, not loyalty.

### Prompt 5: Why the standard library first — and when do you adopt a dependency?

Stdlib needs no install, no pin review, no supply-chain trust, and every reader already knows it — the cheapest correct answer for solved problems. But the library ends where hard problems begin: data frames, web frameworks, date arithmetic at scale all deserve maintained dependencies. Adopt when the problem exceeds stdlib scope, the dependency is maintained and pinned, and its API stability justifies the trust. Default stdlib, graduate deliberately.

### Prompt 6: Why pin exactly with hashes — and what is the cost of the discipline?

Exact pins with hashes make installs bit-identical across machines and time, turn upgrades into reviewable diffs, and verify artifacts against supply-chain tampering. The cost is upgrade friction: every bump is a deliberate act with digest collection, and emergency patches wait on process. The alternative — floating ranges — trades that friction for silent drift and irreproducible environments. Pay the pinning cost on purpose; the drift cost arrives uninvited.
