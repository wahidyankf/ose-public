---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Just Enough Python primer: five fixed drills
that force active recall instead of passive re-reading. Work through them in order -- short-answer
recall first, then scenario judgment, then hands-on repetition, then a checklist to confirm real
automaticity, and finally why/why-not prompts that test whether you can explain the reasoning, not
just execute the syntax. Every answer is hidden in a `<details>` block; try each item yourself
before opening it.

## Recall Q&A

Twenty-five short-answer questions, one per concept (`co-01` through `co-25`). Answer from memory,
then check.

**Q1 (co-01 -- running-python).** Name the three ways CPython can run code, and which one needs no
saved file at all.

<details>
<summary>Answer</summary>

A saved script (`python3 file.py`), an inline one-liner (`python3 -c "..."`), and the interactive
REPL (`python3` with no arguments). The `-c` flag and the REPL both need no saved file -- the REPL
additionally needs no argument at all.

</details>

**Q2 (co-02 -- virtual-environments).** What does `python3 -m venv .venv` create, and what problem
does it solve?

<details>
<summary>Answer</summary>

A per-project Python environment under `.venv/`, with its own interpreter path and package
installation location. A typical CPython `venv` also bootstraps `pip`, when that component is
available. The isolation lets projects install different versions of the same dependency without
colliding in one shared environment.

</details>

**Q3 (co-03 -- formatting-and-linting).** What does `black` (or `ruff format`) do that `ruff check`
does not, and vice versa?

<details>
<summary>Answer</summary>

`black`/`ruff format` rewrites code into a canonical, deterministic **style** -- spacing, line
breaks, quote style -- with no judgment about correctness. `ruff check` **lints**: it flags likely
bugs and smells (an unused import, an undefined name) without reformatting anything. Formatting and
linting are two distinct, complementary passes.

</details>

**Q4 (co-04 -- variables-and-binding).** What does it mean that Python names are "references bound
to objects," and what does that imply about rebinding?

<details>
<summary>Answer</summary>

A name is just a label pointing at an object in memory, created by `=`, not a typed storage slot.
Because Python is dynamically typed, the same name can be rebound to point at a value of a
completely different type later in the same scope -- the type lives on the object, never on the
name.

</details>

**Q5 (co-05 -- primitive-types).** Name four basic value types in this primer and the singleton
value used to mean "no value."

<details>
<summary>Answer</summary>

`int`, `float`, `str`, and `bool` (for example `3`, `1.5`, `"x"`, and `True`). The singleton value
`None` has type `NoneType`, which you can inspect with `type(None)`.

</details>

**Q6 (co-06 -- type-hints).** Do type hints enforce value types at runtime? What can inspect or
check them?

<details>
<summary>Answer</summary>

No. An annotation such as `x: int` does not stop a later assignment of a `str` at runtime
(Example 84 shows this). Annotations are metadata that runtime tools can inspect. A separate
static type checker such as `pyright` reads them and reports mismatches without running the code.

</details>

**Q7 (co-07 -- operators).** What does `//` compute, and how is it different from `/`?

<details>
<summary>Answer</summary>

`//` is floor division -- it discards the remainder and always rounds toward negative infinity,
returning an `int` when both operands are `int`. For two `int` operands, `/` is true division and
returns a `float`, even when they divide evenly.

</details>

**Q8 (co-08 -- strings-and-fstrings).** What does the trailing `=` inside an f-string's `{}` do
(e.g. `f"{value=}"`)?

<details>
<summary>Answer</summary>

It prints both the literal source text of the expression and its value, joined by `=` -- e.g.
`f"{value=}"` for `value = 42` prints `value=42`, with no manual `f"value: {value}"` needed.

</details>

**Q9 (co-09 -- lists).** What does `.append()` return, and what is the classic bug that follows
from misunderstanding that?

<details>
<summary>Answer</summary>

`None` -- `.append()` mutates the list in place and returns nothing. The classic bug is writing
`nums = nums.append(4)`, which discards the entire list, replacing it with `None`.

</details>

**Q10 (co-10 -- tuples).** Why are tuples hashable (when their elements are) but lists never are?

<details>
<summary>Answer</summary>

Hashability requires a value's hash to never change for as long as it's used as a dict key or set
element. Tuples are immutable, so their hash is stable for their entire lifetime. Lists are mutable
-- a list's contents (and therefore its hash) could change after insertion, which would break
lookups, so Python disallows hashing them entirely.

</details>

**Q11 (co-11 -- dictionaries).** What ordering guarantee do Python dicts make, and since which
version?

<details>
<summary>Answer</summary>

Since Python 3.7, dicts preserve **insertion order** as a language guarantee, not merely an
implementation detail -- `.items()`/`.keys()`/`.values()` always iterate in the order keys were
first inserted.

</details>

**Q12 (co-12 -- sets).** What is a set's average-case membership-test complexity, and how does that
compare to a list's?

<details>
<summary>Answer</summary>

O(1) average case for a set, versus O(n) for a list -- a set is the right tool whenever the
recurring question is "have I seen this value before?" rather than "in what order did I see these?"

</details>

**Q13 (co-13 -- slicing).** In `nums[1:4]`, is index `4` included in the result? What is the
one-liner to reverse any sequence?

<details>
<summary>Answer</summary>

No -- `stop` is always exclusive in a slice, so `nums[1:4]` returns indices `1, 2, 3` only.
`nums[::-1]` (empty start, empty stop, step `-1`) reverses common sliceable sequences such as a
list, tuple, or string.

</details>

**Q14 (co-14 -- comprehensions).** What is the one syntactic difference between a set comprehension
and a dict comprehension, both written with `{}`?

<details>
<summary>Answer</summary>

A colon. `{expr for x in iterable}` (no colon) builds a set; `{key_expr: value_expr for x in
iterable}` (with a colon) builds a dict -- the braces alone don't distinguish them.

</details>

**Q15 (co-15 -- conditionals).** Name at least four values that are falsy in a Python `if`
condition besides `False` itself.

<details>
<summary>Answer</summary>

Any four of: `0`, `0.0`, `""` (empty string), `[]` (empty list), `{}` (empty dict), `set()` (empty
set), `None` -- Python treats "empty" broadly as falsy, unlike languages with a narrower falsy set.

</details>

**Q16 (co-16 -- loops).** What does `zip()` do when its inputs have different lengths?

<details>
<summary>Answer</summary>

It silently stops at the **shortest** input, with no error and no warning -- pairing continues only
as far as the shortest iterable allows.

</details>

**Q17 (co-17 -- functions).** How many values can a single Python `return` statement hand back at
once, and what syntax makes that possible?

<details>
<summary>Answer</summary>

More than one -- a bare comma-separated expression after `return` (e.g. `return a, b`) implicitly
builds a tuple, which the caller can then unpack into separate names in one assignment.

</details>

**Q18 (co-18 -- variadic-args).** What Python type does `*args` collect its values into, and what
type does `**kwargs` use?

<details>
<summary>Answer</summary>

`*args` collects extra positional arguments into a `tuple`; `**kwargs` collects extra keyword
arguments into a `dict` keyed by the argument names.

</details>

**Q19 (co-19 -- lambdas-and-scope).** What keyword lets a nested function **mutate** (not just
read) a variable from its immediately enclosing function's scope?

<details>
<summary>Answer</summary>

`nonlocal`. Without it, an assignment like `count += 1` inside a nested function creates a brand-new
local variable instead of mutating the enclosing one, and raises `UnboundLocalError` the moment a
read happens before that new local is ever assigned.

</details>

**Q20 (co-20 -- modules-and-imports).** What does the `if __name__ == "__main__":` guard actually
check, and why does that make it safe to put script logic under it?

<details>
<summary>Answer</summary>

It checks whether `__name__` equals the string `"__main__"`, which is true only when the file is run
directly (`python3 file.py`), never when the file is imported by another module (where `__name__`
instead equals the module's own name). That lets one file serve as both an importable library and a
runnable script with no unwanted side effects on import.

</details>

**Q21 (co-21 -- exceptions).** What is the difference in behavior between `try`/`except`/`else` and
`try`/`except`/`finally`?

<details>
<summary>Answer</summary>

`else` runs only if the `try` block raised no exception at all. `finally` runs unconditionally --
whether the `try` block succeeded, raised a caught exception, or even let an uncaught exception
propagate past the whole block -- making it the right place for guaranteed cleanup.

</details>

**Q22 (co-22 -- files-and-io).** What does opening a file inside a `with` block guarantee, even if
an exception is raised partway through reading or writing?

<details>
<summary>Answer</summary>

That the file closes automatically on the way out of the block, exception or not -- the same
guarantee `finally` provides, built directly into `open()`'s context-manager protocol
(`__enter__`/`__exit__`).

</details>

**Q23 (co-23 -- json-serialization).** What is the difference between `json.dumps`/`json.loads` and
`json.dump`/`json.load` (no trailing `s`)?

<details>
<summary>Answer</summary>

The `s`-suffixed pair works on **strings** in memory (`dumps` serializes to a `str`, `loads` parses
a `str`). The non-`s` pair works directly on an **open file object** (`dump` writes to it, `load`
reads from it) -- otherwise, they perform the identical serialize/parse operation.

</details>

**Q24 (co-24 -- classes).** What does `@dataclass` generate automatically from a class's annotated
fields?

<details>
<summary>Answer</summary>

`__init__` (a constructor accepting each field as a parameter) and `__repr__` (a readable
string representation) -- both derived purely from the class body's type-annotated field
declarations, with no method bodies written by hand.

</details>

**Q25 (co-25 -- static-type-checking).** Can `pyright` and `python3` disagree about whether a given
file has a problem? Give the concrete example this primer uses to prove it.

<details>
<summary>Answer</summary>

Yes. Example 84 passes a `str` where a parameter is annotated `int`: `python3` runs the file to
completion and exits `0`, because it never checks type hints at runtime, while `pyright` reports
exactly one `reportArgumentType` error on that exact call, because it checks the annotation
statically without running anything. Both tools are "right" -- they check different things.

</details>

## Applied problems

Eleven scenarios. Each describes a task without naming the construct -- decide which Python feature
or standard-library API solves it, then check.

**AP1.** A function needs to accept a list parameter that callers can optionally omit, and every
call that omits it should start from a genuinely fresh, empty list -- never one left over from a
previous call.

<details>
<summary>Answer</summary>

Default the parameter to `None`, not `[]`, then build the real empty list inside the function body:
`def f(items: list[str] | None = None) -> list[str]: items = items if items is not None else []`.
A mutable default argument (`= []`) is evaluated exactly once, at function-definition time, and
reused by every call that omits the argument -- Kata 1 demonstrates this bug directly.

</details>

**AP2.** You're reading an optional field out of a config dict, and a missing key should silently
fall back to a sensible default instead of crashing the whole program.

<details>
<summary>Answer</summary>

`config.get("field", default_value)` instead of `config["field"]`. `[]` raises `KeyError` on a
missing key; `.get(key, default)` returns `default` instead, with no `try`/`except` needed.

</details>

**AP3.** A function receives a list and needs to produce a **modified copy** for the caller, while
guaranteeing the caller's original list is completely untouched, even though lists are mutable and
assignment only creates a new reference to the same object.

<details>
<summary>Answer</summary>

Call `.copy()` (or the slice `[:]`) before mutating: `backup = original.copy()`. Plain assignment
(`backup = original`) creates a second name pointing at the exact same list object -- mutating
through either name is visible through both, exactly the aliasing bug Kata 3 demonstrates.

</details>

**AP4.** A data-parsing loop needs to skip individual bad records and keep processing the rest,
without silently hiding genuine bugs unrelated to bad input (like a typo'd variable name).

<details>
<summary>Answer</summary>

Catch the narrowest exception type the risky operation can actually raise (e.g. `except ValueError:`
around `int(raw)`), never a bare `except:` or `except Exception:`. A bare `except` also swallows
unrelated bugs that happen to raise inside the same block -- Kata 4 shows the difference between
silently swallowing every error and reporting exactly what was skipped.

</details>

**AP5.** You need to build ten small callables in a loop, and each one must remember the **specific
value** the loop variable held at the iteration that created it -- not whatever the loop variable
happens to hold by the time any of them is actually called.

<details>
<summary>Answer</summary>

Capture the loop variable as a default argument: `lambda i=i: i` instead of `lambda: i`. A `lambda`
(or any nested function) closes over the loop variable **by reference**, not by the value it held at
creation time -- by the time the loop finishes and any closure runs, the shared variable holds its
final value for every one of them, unless a default argument captures each iteration's value
explicitly (Kata 5).

</details>

**AP6.** You serialize a dict with integer keys to JSON, and after reading it back, looking up the
same integer key you started with raises `KeyError`.

<details>
<summary>Answer</summary>

JSON object keys are always strings -- `json.dumps` silently converts every `int` dict key to its
string form, and there is no JSON-native way to preserve the original type. Convert the keys back
explicitly after loading: `{int(k): v for k, v in restored.items()}` (Kata 6's fix).

</details>

**AP7.** You build a generator expression, sum it, and then need the count of the same filtered
values -- but a second pass over the same generator variable produces `0` every time, as if it were
suddenly empty.

<details>
<summary>Answer</summary>

A generator is a **single-pass** iterator -- once fully consumed (by `sum()`, a `for` loop, or
anything else that drains it), it stays exhausted forever; a second iteration attempt simply yields
nothing. Materialize it into a list first (`[n for n in ... ]` instead of `(n for n in ...)`) if you
need to iterate the same values more than once (Kata 7).

</details>

**AP8.** A package's own internal module needs to import a sibling module by its full package path
(`from pkg.util import shout`), and it works fine via `python3 -m pkg.main` but crashes with
`ModuleNotFoundError` when run directly as `python3 pkg/main.py`.

<details>
<summary>Answer</summary>

Run it as a module with `-m` from the package's **parent** directory (`python3 -m pkg.main`), not as
a direct script path. Running `python3 pkg/main.py` puts `pkg/` itself (not its parent) on
`sys.path`, so Python has no way to resolve `pkg` as a top-level package from inside its own
directory (Kata 8).

</details>

**AP9.** A CLI needs a purely optional, no-value-required switch -- present on the command line
means one behavior, absent means the default behavior -- with no separate value to parse after the
flag.

<details>
<summary>Answer</summary>

`parser.add_argument("--flag", action="store_true")`. `store_true` flags need no following value:
present sets `args.flag` to `True`, absent leaves it `False` -- this is `argparse`'s idiomatic
boolean-switch shape (Example 62).

</details>

**AP10.** You want to wrap a low-level exception (e.g. a `ValueError` from parsing) in a more
meaningful, higher-level exception for your caller, without losing the original diagnostic detail
from the traceback.

<details>
<summary>Answer</summary>

`raise NewError("higher-level message") from original_err`, inside the `except` block that caught
the original. The `from` clause chains the original exception into the new one's traceback with a
clear "the above exception was the direct cause of" separator, so both diagnostics stay visible
(Example 66).

</details>

**AP11.** A function's logic is simple and pure, and you want to be confident it keeps working
correctly as the codebase changes, without manually re-running it by hand after every edit.

<details>
<summary>Answer</summary>

Write a `pytest` test: a function named `test_*` with a plain `assert` inside, in a file `pytest`
can discover automatically (Example 74). Pure functions -- same input always produces the same
output, no side effects -- are the easiest kind to test in isolation, which is exactly why this
repository's own functional-core convention prefers them.

</details>

## Code katas

Eight hands-on repetition drills. Each is a before/after `.py` file (or file set) colocated under
`drilling/code/`. Every "before" script is a real, runnable Python program that misapplies the
concept being drilled -- run it yourself, diagnose the bug from the observed behavior, fix it from
memory, then compare your fix against the "after" script and the model solution before checking your
work against the actually-executed output shown.

### Kata 1 -- mutable default argument

**Task.** `add_item(item, cart)` should return a fresh one-item cart on every call that omits
`cart` -- two separate calls with no `cart` argument must never share state. The version below is
broken: a second call sees the first call's item still sitting in `cart`, because the default list
was only ever created once.

**Before** (`drilling/code/kata-01-mutable-default-arg/before/kata.py`)

```python
"""Kata 1 (before): a shared, mutable default argument."""


def add_item(item: str, cart: list[str] = []) -> list[str]:
    cart.append(item)
    return cart


print(add_item("apple"))
print(add_item("banana"))
```

**Observed (buggy) output** (captured by actually running the script above):

```text
['apple']
['apple', 'banana']
```

**After** (`drilling/code/kata-01-mutable-default-arg/after/kata.py`)

```python
"""Kata 1 (after): a fresh list per call, built inside the function body."""


def add_item(item: str, cart: list[str] | None = None) -> list[str]:
    if cart is None:
        cart = []
    cart.append(item)
    return cart


print(add_item("apple"))
print(add_item("banana"))
```

<details>
<summary>Model solution</summary>

```python
def add_item(item: str, cart: list[str] | None = None) -> list[str]:
    # THE FIX: default to None (an immutable sentinel), never a mutable literal.
    if cart is None:
        cart = []  # => a BRAND-NEW list, built fresh on every call that omits cart
    cart.append(item)
    return cart


print(add_item("apple"))  # => a fresh cart -- Output: ['apple']
print(add_item("banana"))  # => ANOTHER fresh cart, unrelated to the first -- Output: ['banana']
```

**Root cause**: `cart: list[str] = []` evaluates the `[]` literal exactly **once**, at
function-definition time, not on every call -- every call that omits `cart` shares that same one
list object, so mutations from one call are visible on the next. Defaulting to `None` and building
the real list inside the function body guarantees a fresh object every time.

**Run**: `python3 kata.py`

**Output**:

```text
['apple']
['banana']
```

</details>

### Kata 2 -- dict `.get()` vs. `[]`

**Task.** `settings` holds only a `"theme"` key. Reading an absent key with `[]` should not crash
the whole program when a sensible default is available instead. The version below uses `[]` on a
key that was never set.

**Before** (`drilling/code/kata-02-dict-get-vs-index/before/kata.py`)

```python
"""Kata 2 (before): [] on a possibly-missing key."""

settings: dict[str, str] = {"theme": "dark"}
print(settings["timeout"])
```

**Observed (buggy) output** (captured by actually running the script above -- it crashes):

```text
Traceback (most recent call last):
  File ".../kata-02-dict-get-vs-index/before/kata.py", line 4, in <module>
    print(settings["timeout"])
          ~~~~~~~~^^^^^^^^^^^
KeyError: 'timeout'
```

**After** (`drilling/code/kata-02-dict-get-vs-index/after/kata.py`)

```python
"""Kata 2 (after): .get() with an explicit default."""

settings: dict[str, str] = {"theme": "dark"}
print(settings.get("timeout", "30"))
```

<details>
<summary>Model solution</summary>

```python
settings: dict[str, str] = {"theme": "dark"}
# THE FIX: .get(key, default) never raises -- it returns default on a miss instead.
print(settings.get("timeout", "30"))  # => "timeout" was never set -- falls back to "30"
```

**Root cause**: `settings["timeout"]` uses `[]` lookup, which raises `KeyError` the instant the key
is absent -- there is no way to supply a fallback with `[]` syntax alone. `.get(key, default)` is the
built-in, no-`try`/`except`-needed alternative whenever a missing key has a sensible default.

**Run**: `python3 kata.py`

**Output**:

```text
30
```

</details>

### Kata 3 -- list copy vs. alias

**Task.** `backup` should be an independent copy of `original` -- mutating `backup` must never
change `original`. The version below assigns `backup = original` directly, which does not copy
anything at all.

**Before** (`drilling/code/kata-03-list-copy-alias/before/kata.py`)

```python
"""Kata 3 (before): assignment aliases the same list object."""

original: list[int] = [1, 2, 3]
backup = original
backup.append(4)
print(original)
```

**Observed (buggy) output** (captured by actually running the script above -- `original` was never
supposed to change):

```text
[1, 2, 3, 4]
```

**After** (`drilling/code/kata-03-list-copy-alias/after/kata.py`)

```python
"""Kata 3 (after): an explicit copy leaves the original untouched."""

original: list[int] = [1, 2, 3]
backup = original.copy()
backup.append(4)
print(original)
print(backup)
```

<details>
<summary>Model solution</summary>

```python
original: list[int] = [1, 2, 3]
backup = original.copy()  # => THE FIX: .copy() builds a genuinely NEW list, not a second reference
backup.append(4)  # => mutates ONLY backup's own, independent list
print(original)  # => untouched -- Output: [1, 2, 3]
print(backup)  # => Output: [1, 2, 3, 4]
```

**Root cause**: `backup = original` binds a second name to the exact same list **object** -- it is
not a copy, it is an alias. Mutating through `backup` (via `.append()`) is visible through
`original` too, because there was only ever one list all along. `.copy()` (or the equivalent
`original[:]` slice) is what actually allocates a new, independent list.

**Run**: `python3 kata.py`

**Output**:

```text
[1, 2, 3]
[1, 2, 3, 4]
```

</details>

### Kata 4 -- exception swallow

**Task.** `parse_all` should skip individually unparseable values while reporting what it skipped
-- not silently discard the information that anything went wrong at all. The version below catches
`Exception` broadly and does nothing with it, hiding every failure equally.

**Before** (`drilling/code/kata-04-exception-swallow/before/kata.py`)

```python
"""Kata 4 (before): a bare except silently swallows every error."""


def parse_all(raw_values: list[str]) -> list[int]:
    parsed: list[int] = []
    for raw in raw_values:
        try:
            parsed.append(int(raw))
        except Exception:
            pass
    return parsed


print(parse_all(["1", "two", "3"]))
```

**Observed (buggy) output** (captured by actually running the script above -- correct numbers, but
zero indication that `"two"` was ever a problem):

```text
[1, 3]
```

**After** (`drilling/code/kata-04-exception-swallow/after/kata.py`)

```python
"""Kata 4 (after): catch only ValueError, and report what was skipped."""


def parse_all(raw_values: list[str]) -> list[int]:
    parsed: list[int] = []
    skipped: list[str] = []
    for raw in raw_values:
        try:
            parsed.append(int(raw))
        except ValueError:
            skipped.append(raw)
    if skipped:
        print(f"skipped invalid values: {skipped}")
    return parsed


print(parse_all(["1", "two", "3"]))
```

<details>
<summary>Model solution</summary>

```python
def parse_all(raw_values: list[str]) -> list[int]:
    parsed: list[int] = []
    skipped: list[str] = []
    for raw in raw_values:
        try:
            parsed.append(int(raw))
        except ValueError:  # => THE FIX: narrow to ValueError, not every Exception
            skipped.append(raw)  # => records what was skipped instead of discarding it
    if skipped:
        print(f"skipped invalid values: {skipped}")  # => Output line 1: skipped invalid values: ['two']
    return parsed


print(parse_all(["1", "two", "3"]))  # => Output line 2: [1, 3]
```

**Root cause**: `except Exception:` with a bare `pass` catches and discards **every** failure mode
equally -- a genuine bug elsewhere in the loop body would be silenced exactly as quietly as an
expected bad-input value. Narrowing to `except ValueError:` (the only exception `int(raw)` can
actually raise here) and recording what was skipped keeps the failure visible without crashing the
whole loop.

**Run**: `python3 kata.py`

**Output**:

```text
skipped invalid values: ['two']
[1, 3]
```

</details>

### Kata 5 -- loop variable closure

**Task.** `makers` should be a list of five callables, each remembering its **own** iteration's `i`
value when called later. The version below has every lambda capture the same shared loop variable
by reference, so all five report whatever `i` ended up as after the loop finished.

**Before** (`drilling/code/kata-05-loop-variable-closure/before/kata.py`)

```python
"""Kata 5 (before): every lambda captures the SAME loop variable, by reference."""

makers = [lambda: i for i in range(3)]
print([m() for m in makers])
```

**Observed (buggy) output** (captured by actually running the script above -- every closure reports
`2`, the loop's final value of `i`, not each one's own iteration):

```text
[2, 2, 2]
```

**After** (`drilling/code/kata-05-loop-variable-closure/after/kata.py`)

```python
"""Kata 5 (after): a default argument captures each i's VALUE at definition time."""

makers = [lambda i=i: i for i in range(3)]
print([m() for m in makers])
```

<details>
<summary>Model solution</summary>

```python
# THE FIX: `i=i` as a default argument captures i's CURRENT value at each lambda's
# own creation time, instead of a live reference to the one shared loop variable.
makers = [lambda i=i: i for i in range(3)]
print([m() for m in makers])  # => each closure now has its OWN i -- Output: [0, 1, 2]
```

**Root cause**: a closure captures an enclosing variable **by reference**, not by the value it held
at the moment the closure was created -- all three lambdas share the exact same `i`, which keeps
changing as the comprehension's loop continues, and settles at `2` once the loop finishes. Binding
`i` as a default argument (`lambda i=i: i`) evaluates and freezes that specific iteration's value at
definition time, since default argument values ARE evaluated once, immediately, unlike the lambda
body itself.

**Run**: `python3 kata.py`

**Output**:

```text
[0, 1, 2]
```

</details>

### Kata 6 -- JSON int-keys roundtrip

**Task.** `scores` uses `int` keys. After a JSON serialize-then-parse roundtrip, looking up the
same `int` key that was in the original dict should still work. The version below does not survive
the roundtrip, because JSON has no integer-key concept at all.

**Before** (`drilling/code/kata-06-json-int-keys-roundtrip/before/kata.py`)

```python
"""Kata 6 (before): int dict keys silently become str keys after a JSON roundtrip."""

import json

scores: dict[int, str] = {1: "gold", 2: "silver", 3: "bronze"}
restored = json.loads(json.dumps(scores))
print(restored[1])
```

**Observed (buggy) output** (captured by actually running the script above -- it crashes):

```text
Traceback (most recent call last):
  File ".../kata-06-json-int-keys-roundtrip/before/kata.py", line 7, in <module>
    print(restored[1])
          ~~~~~~~~^^^
KeyError: 1
```

**After** (`drilling/code/kata-06-json-int-keys-roundtrip/after/kata.py`)

```python
"""Kata 6 (after): convert the restored keys back to int right after loading."""

import json

scores: dict[int, str] = {1: "gold", 2: "silver", 3: "bronze"}
raw_restored: dict[str, str] = json.loads(json.dumps(scores))
restored: dict[int, str] = {int(key): value for key, value in raw_restored.items()}
print(restored[1])
```

<details>
<summary>Model solution</summary>

```python
scores: dict[int, str] = {1: "gold", 2: "silver", 3: "bronze"}
raw_restored: dict[str, str] = json.loads(json.dumps(scores))
# THE FIX: rebuild the dict with int() keys immediately after loading -- a
# comprehension (co-14), converting every key back from str to int explicitly.
restored: dict[int, str] = {int(key): value for key, value in raw_restored.items()}
print(restored[1])  # => Output: gold
```

**Root cause**: JSON object keys are always strings by specification -- `json.dumps` silently
stringifies every `int` key (`1` becomes `"1"`), and `json.loads` has no way to know it should
convert `"1"` back to `1` on the way in, since JSON alone carries no type information about what a
key "should" be. Any code relying on `int` dict keys surviving a JSON roundtrip must convert them
back explicitly.

**Run**: `python3 kata.py`

**Output**:

```text
gold
```

</details>

### Kata 7 -- generator exhausted

**Task.** `evens` should be iterable more than once -- summing it, then counting it, should both
see the same three -- no, wait: the same **filtered values** each time. The version below uses a
generator expression, which can only be drained once.

**Before** (`drilling/code/kata-07-generator-exhausted/before/kata.py`)

```python
"""Kata 7 (before): a generator can only be iterated once."""

evens = (n for n in range(4) if n % 2 == 0)
total = sum(evens)
count = sum(1 for _ in evens)
print(total, count)
```

**Observed (buggy) output** (captured by actually running the script above -- `count` should be `2`,
matching the two even values, `0` and `2`):

```text
2 0
```

**After** (`drilling/code/kata-07-generator-exhausted/after/kata.py`)

```python
"""Kata 7 (after): materialize into a list to iterate it more than once."""

evens = [n for n in range(4) if n % 2 == 0]
total = sum(evens)
count = sum(1 for _ in evens)
print(total, count)
```

<details>
<summary>Model solution</summary>

```python
# THE FIX: [n for n in ...] (a list comprehension) materializes every value up
# front, instead of (n for n in ...) (a generator expression), which is lazy and
# single-pass -- once fully consumed by the first sum(), it stays exhausted.
evens = [n for n in range(4) if n % 2 == 0]
total = sum(evens)  # => first full pass -- Output component: 2 (0 + 2)
count = sum(1 for _ in evens)  # => a SECOND full pass -- still works on a list
print(total, count)  # => Output: 2 2
```

**Root cause**: a generator expression is a single-pass iterator -- once `sum(evens)` fully drains
it, every later iteration attempt (even a completely different `for` loop over the same name) yields
nothing at all, silently, with no error. A list comprehension materializes every value into memory up
front, so it can be iterated as many times as needed.

**Run**: `python3 kata.py`

**Output**:

```text
2 2
```

</details>

### Kata 8 -- package-relative import

**Task.** `pkg/main.py` should be able to import its sibling `pkg/util.py` via the package-qualified
`from pkg.util import shout`. The version below runs `main.py` as a direct script path, which breaks
that import even though the code itself is correct.

**Before** (`drilling/code/kata-08-package-relative-import/before/pkg/main.py`)

```python
"""Kata 8 (before): run directly with `python3 pkg/main.py` -- breaks the package import."""

from pkg.util import shout

print(shout("hello"))
```

**Observed (buggy) output** (captured by actually running `python3 pkg/main.py` from the directory
containing `pkg/` -- it crashes):

```text
Traceback (most recent call last):
  File ".../kata-08-package-relative-import/before/pkg/main.py", line 3, in <module>
    from pkg.util import shout
ModuleNotFoundError: No module named 'pkg'
```

**After** (`drilling/code/kata-08-package-relative-import/after/pkg/main.py`)

```python
"""Kata 8 (after): run with `python3 -m pkg.main` from the parent of pkg/."""

from pkg.util import shout

print(shout("hello"))
```

<details>
<summary>Model solution</summary>

```python
# pkg/main.py -- UNCHANGED from the buggy version -- the fix is entirely in HOW this file is run.
from pkg.util import shout

print(shout("hello"))  # => Output: HELLO!
```

**Root cause**: running `python3 pkg/main.py` directly puts `pkg/`'s own directory on `sys.path`,
not its **parent** -- so Python has no way to resolve `pkg` as a top-level package from inside
`pkg/`'s own directory, and `from pkg.util import shout` fails with `ModuleNotFoundError`. Running
`python3 -m pkg.main` from `pkg/`'s parent directory instead puts that **parent** on `sys.path`,
where `pkg` correctly resolves as a package (Example 64's exact `python3 -m app` shape, applied
here to diagnose a real failure mode instead of the happy path).

**Run**: `python3 -m pkg.main` (from the directory containing `pkg/`)

**Output**:

```text
HELLO!
```

</details>

## Self-check checklist

Confirm each item without checking the manual first. If you hesitate, that concept needs another
pass.

- [ ] I can name Python's three ways to run code and pick the fastest one for a quick one-off check.
      (co-01)
- [ ] I can create a venv, install a package into it, and explain why `pip install` outside a venv
      is a problem worth avoiding. (co-02)
- [ ] I can explain the difference between what `black`/`ruff format` does and what `ruff check`
      does, without conflating the two. (co-03)
- [ ] I can predict what happens when the same name is rebound to a value of a different type, and
      explain why that's legal in Python. (co-04)
- [ ] I can name all five primitive types and their literal syntax from memory. (co-05)
- [ ] I can write a fully type-annotated function signature and explain why `python3` itself never
      enforces it. (co-06)
- [ ] I can predict the result of `//`, `%`, and `**` on a pair of integers without running them.
      (co-07)
- [ ] I can build an f-string with a format spec (`:.2f`) and the debug specifier (`{x=}`) from
      memory. (co-08)
- [ ] I can explain why `nums = nums.append(4)` is a bug, not a style choice. (co-09)
- [ ] I can explain why a tuple is hashable but a list never is. (co-10)
- [ ] I can iterate a dict with `.items()` and state Python's ordering guarantee since 3.7. (co-11)
- [ ] I can explain when a set's O(1) membership test beats a list's O(n) scan. (co-12)
- [ ] I can write a slice with a negative step and predict its exact result without running it.
      (co-13)
- [ ] I can write all four comprehension forms (list, dict, set, generator) and explain the one
      character that separates a set comprehension from a dict comprehension. (co-14)
- [ ] I can name at least four falsy values in Python besides `False` itself. (co-15)
- [ ] I can predict what `zip()` does when its inputs have different lengths. (co-16)
- [ ] I can write a function returning multiple values and unpack them at the call site. (co-17)
- [ ] I can write a function using both `*args` and `**kwargs` and state their exact runtime types.
      (co-18)
- [ ] I can explain why a closure captures its enclosing variable by reference, and how to work
      around that in a loop. (co-19)
- [ ] I can explain exactly what `if __name__ == "__main__":` checks and why it's safe to guard
      script logic with it. (co-20)
- [ ] I can chain `raise ... from err` to wrap one exception in another without losing the original
      traceback. (co-21)
- [ ] I can explain what guarantee a `with open(...)` block makes that a bare `open()` call does
      not. (co-22)
- [ ] I can state the difference between `json.dumps`/`loads` and `json.dump`/`load`. (co-23)
- [ ] I can explain what `@dataclass` generates automatically and why it's a legitimate shortcut,
      not "cheating." (co-24)
- [ ] I can name a concrete case where `pyright` and `python3` disagree about whether a file has a
      problem, and explain why both are right. (co-25)
- [ ] I can explain, in one sentence, why Python's high-level built-ins buy readable code at a
      runtime cost you spend deliberately. (`abstraction-and-its-cost`)
- [ ] I can explain, in one sentence, why Python's optional, unenforced type hints are a pragmatic
      trade-off rather than a design flaw. (`correctness-vs-pragmatism`)

## Elaborative interrogation & self-explanation

Six why/why-not prompts. Answer each in your own words before opening the model explanation.

**E1.** Why does a mutable default argument (`def f(x=[]):`) get evaluated exactly once, at
function-definition time, instead of fresh on every call the way most people intuitively expect?
Tie your answer to `abstraction-and-its-cost`.

<details>
<summary>Model explanation</summary>

A `def` statement is itself an expression that runs once, at the moment Python first reads it --
every part of the signature, including default-argument expressions, is evaluated right then and
bound into the function object as a fixed attribute, not re-evaluated on every subsequent call.
That's a direct instance of `abstraction-and-its-cost`: Python's default-argument syntax buys a
concise way to express "this parameter is optional, and here's its fallback value" in one line, but
the cost is that the fallback is computed once and reused, which is invisible and surprising exactly
when that fallback happens to be mutable. The idiomatic `None`-sentinel workaround (Kata 1) is not a
language wart to route around quietly -- it's the deliberate, well-known pattern every experienced
Python developer reaches for once they understand the trade being made.

</details>

**E2.** Why does Python choose to make type hints optional and unenforced at runtime, rather than
making a type-hint mismatch a hard runtime error the way a statically-typed language would? Tie your
answer to `correctness-vs-pragmatism`.

<details>
<summary>Model explanation</summary>

Making every type-hint mismatch a runtime error would turn Python into a fundamentally different,
statically-typed language -- one where you cannot run a single line of code until every annotation
in the file (and everything it imports) is provably consistent. Python instead lets you ship and run
code immediately, then layer static verification (`pyright`) on top as a separate, optional step you
invoke deliberately, exactly when you want that stronger guarantee. Example 84 makes the trade
concrete: `repeat_label("3", 2)` runs to completion and produces sensible-looking output despite the
type mismatch, while `pyright` still catches the underlying bug -- the language prioritizes
"pragmatic, runnable now" over "provably correct before anything runs," and hands you a separate
tool for correctness on your own schedule.

</details>

**E3.** Why does a Python closure capture its enclosing variable by reference rather than by
snapshotting its value at the moment the closure was created?

<details>
<summary>Model explanation</summary>

If closures captured a frozen copy of a variable's value at creation time, a counter-style closure
(Example 41) could never see its own later mutations reflected -- every `count += 1` inside the
inner function would be updating a private copy invisible to anything outside it, defeating the
entire point of a closure holding onto live, ongoing state. Capturing by reference is what lets a
closure's returned function keep mutating the _same_ variable across repeated calls. The cost only
becomes visible in a loop (Kata 5): every closure built inside that loop shares the _one_ loop
variable, which is why binding it explicitly as a default argument is the correct, well-known
workaround, not a language flaw to avoid Python over.

</details>

**E4.** Why does JSON have no native concept of a non-string dict key, forcing every `int` (or other
non-string) key through a silent string conversion on serialization?

<details>
<summary>Model explanation</summary>

JSON's own specification defines an "object" as a set of string-keyed name/value pairs -- there is
no alternate object syntax for a non-string key anywhere in the format, because JSON was designed as
a small, language-agnostic interchange format, and not every target language even has Python's
notion of an arbitrarily-typed hashable key. `json.dumps` has to pick _some_ behavior for a
non-string Python key, and silently coercing it to its string form (rather than raising an error) is
the pragmatic choice that keeps most real-world serialization working without extra ceremony -- the
cost, Kata 6's whole point, is that a round-trip through JSON is lossy for key _type_, even when it's
lossless for every value.

</details>

**E5.** Why is a generator expression single-pass -- exhausted forever after one full iteration --
rather than reusable the way a list is?

<details>
<summary>Model explanation</summary>

A generator produces its values lazily, one at a time, computing each one only when actually
requested and immediately discarding the machinery needed to produce the _previous_ one -- it never
holds the full sequence in memory at once, which is precisely the memory-efficiency benefit
`abstraction-and-its-cost` highlights for generator expressions over list comprehensions (Example
33). That efficiency is only possible because a generator does not remember where it started: once
its internal position reaches the end, there's no stored sequence left to "rewind" to the beginning
of. Trading the ability to re-iterate for near-zero memory overhead is the entire reason a generator
exists as a distinct concept from a list in the first place -- Kata 7's fix (materializing into a
list) is choosing the opposite trade-off deliberately, not fixing a bug in generators.

</details>

**E6.** Why does running a file as `python3 pkg/main.py` resolve imports differently from running
the same file as `python3 -m pkg.main`, even though it's the exact same source code either way?

<details>
<summary>Model explanation</summary>

`python3 <path>` adds the directory _containing that file_ to `sys.path[0]`, treating the file as a
standalone script with no package context at all -- from inside `pkg/`'s own directory, there is no
way to resolve `pkg` as an importable name, since `pkg` isn't a subdirectory of anywhere on
`sys.path`. `python3 -m <module>` works differently by design: it resolves `pkg.main` as a dotted
module path relative to the **current working directory**, adding that directory (the parent of
`pkg/`) to `sys.path` instead, where `pkg` correctly exists as a subdirectory. The two invocation
styles are not interchangeable for any file inside a real package -- `-m` is the one that actually
understands package structure, which is why Example 64 introduces `python3 -m app` for exactly this
reason before Kata 8 shows what breaks without it.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md)
