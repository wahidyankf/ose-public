---
title: "Beginner Examples"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 10
---

Examples 1-28 cover running Python three ways, virtual environments, `black`/`ruff`, the primitive
types and type hints, operators, f-strings and string methods, the four built-in collections (lists,
tuples, dicts, sets), slicing, conditionals, and loops. Every example is a complete, self-contained
`.py` file (or small file set) colocated under `learning/code/`; run each one with `python3 <file>.py`
from inside its own directory unless a caption says otherwise.

---

### Example 1: Hello Script

_ex-01 &middot; exercises co-01_

The very first Python program most people write, and the one this whole primer's "universal run
command" is built around. `print()` is Python's most-used built-in function -- it writes its
arguments to standard output, separated by a single space, followed by a newline.

**`learning/code/ex-01-hello-script/example.py`**

```python
"""Example 1: Hello Script."""

print("Hello, world!")  # => calls the built-in print() with one string argument
# => Output: Hello, world!
```

**Run**: `python3 example.py`

**Output**:

```text
Hello, world!
```

**Key takeaway**: `python3 <file>.py` is the one command this entire primer builds on; `print()` is
the fastest way to see a value.

**Why it matters**: Every other example in this primer starts from this same command. There is no
compile step, no project scaffold, and no build tool between you and running code -- CPython reads a
file and executes it top to bottom. That immediacy is why Python works so well as a first language and
as a default scripting tool: you can hand someone a `.py` file and trust `python3` can run it with zero
ceremony.

---

### Example 2: Run Inline Code

_ex-02 &middot; exercises co-01_

Besides a saved file, CPython can run a snippet directly from the command line with `-c`, or drop you
into an interactive REPL with no arguments at all. This example's file shows the equivalent script
form; the point is that all three forms run identical Python.

**`learning/code/ex-02-run-inline-code/example.py`**

```python
"""Example 2: Run Inline Code (same body as `python3 -c "print(6 * 7)"`)."""

print(6 * 7)  # => evaluates 6 * 7 first, then prints the result
# => Output: 42
```

**Run**: `python3 -c "print(6 * 7)"` (or `python3 example.py` -- both produce the same output)

**Output**:

```text
42
```

**Key takeaway**: `python3 -c "<code>"` runs a snippet with no file at all; `python3` alone opens the
interactive REPL.

**Why it matters**: Quick one-liners -- checking a calculation, testing a regex, inspecting a module's
attributes -- don't need a saved file. Knowing all three entry points (script, `-c`, REPL) up front
means you reach for the fastest one instead of always creating a throwaway file.

---

### Example 3: Create Venv Install

_ex-03 &middot; exercises co-02_

`python3 -m venv` creates an isolated per-project interpreter whose `pip` installs dependencies
without touching the system Python. This example creates one, installs `pytest` into it, and proves
the install worked by importing `pytest` from inside that exact venv.

**`learning/code/ex-03-create-venv-install/check_pytest.py`**

```python
"""Example 3: Create Venv Install -- run inside the venv after `pip install pytest`."""

# Resolves ONLY inside the venv's site-packages, not the system Python.
import pytest

# Proves the venv's pip install worked.
print(f"pytest {pytest.__version__} importable")
# => Output: pytest <installed-version> importable
```

**Run** (captured for real -- every line below is genuine, not fabricated):

```text
$ python3 -m venv .venv
$ .venv/bin/pip install pytest
[... pip install output ...]
$ .venv/bin/pip show pytest
Name: pytest
Version: 9.1.1
Summary: pytest: simple powerful testing with Python
...
$ .venv/bin/python check_pytest.py
pytest 9.1.1 importable
```

**Key takeaway**: `python3 -m venv .venv` creates the environment; `.venv/bin/pip` and `.venv/bin/python`
(not the bare `pip`/`python3` commands) are how you use it.

**Why it matters**: Without a venv, every project's dependencies collide in one global Python
installation -- two projects needing different versions of the same package cannot coexist. A venv per
project is the default hygiene this book assumes for every later Python topic, exactly mirroring what
this repository's own `.venv`-based Python tooling does.

---

### Example 4: Format With Black

_ex-04 &middot; exercises co-03_

`black` auto-formats Python source to a canonical style, deterministically, with no configuration
decisions to make. This example ran `black` against a deliberately misformatted file and captured the
real transcript.

**Before** (saved locally as `messy.py` to reproduce this transcript -- not itself a tracked file in
this repository, since this repo's own pre-commit hook runs `ruff format` on every committed `.py`
file and would normalize it before it could ever be committed misformatted):

```python
"""Example 4: Format With Black -- deliberately misformatted input."""


def   add(a,b):  # => defines add with two positional parameters a and b
    # => Adds two numbers and returns the sum.
    return a+b


print(add(1,2))  # => calls add(1, 2), which returns 3
# => Output: 3
```

**Run** (captured for real):

```text
$ black messy.py
reformatted messy.py

All done! ✨ 🍰 ✨
1 file reformatted.
$ black messy.py
All done! ✨ 🍰 ✨
1 file left unchanged.
```

**`learning/code/ex-04-format-with-black/add.py`** (the same file, after formatting -- this is what
is actually committed alongside this page)

```python
"""Example 4: Format With Black -- deliberately misformatted input."""


def add(a, b):  # => defines add with two positional parameters a and b
    # => Adds two numbers and returns the sum.
    return a + b


print(add(1, 2))  # => calls add(1, 2), which returns 3
# => Output: 3
```

**Key takeaway**: the first `black` run reports `1 file reformatted`; every run after that reports
`1 file left unchanged` -- `black` is idempotent.

**Why it matters**: This repository gates every commit on formatted code (via `ruff format`, a
Black-compatible formatter), so `black`'s deterministic, opinionated style is not a matter of personal
taste to argue about in review -- it is a fixed point every contributor converges to automatically.
Running `black` (or an equivalent formatter) before committing is a habit, not a style choice.

---

### Example 5: Lint With Ruff

_ex-05 &middot; exercises co-03_

`ruff` lints for errors and smells -- unused imports, undefined names, and dozens of other rules --
far faster than older Python linters, and is the linter this repository's own pre-commit gates
do not yet run on `.py` content, though `ruff format` does. This example's file has a genuine unused
import.

**`learning/code/ex-05-lint-with-ruff/bad.py`**

```python
"""Example 5: Lint With Ruff -- deliberately has an unused import."""

# Never referenced below -- ruff's F401 rule flags exactly this.
import json  # => imports the json module but never uses it (deliberately unused)


def greet(name: str) -> str:  # => defines greet, takes name, returns a str
    return f"hello {name}"  # => builds and returns "hello Ada" when called below


print(greet("Ada"))  # => calls greet("Ada"), prints "hello Ada"
# => Output: hello Ada -- the SCRIPT runs fine; ruff still flags it
```

**Run**: `ruff check bad.py`

**Output** (captured by actually running `ruff check` against the file above):

```text
F401 [*] `json` imported but unused
 --> bad.py:4:8
  |
3 | # Never referenced below -- ruff's F401 rule flags exactly this.
4 | import json  # => imports the json module but never uses it (deliberately unused)
  |        ^^^^
  |
help: Remove unused import: `json`

Found 1 error.
[*] 1 fixable with the `--fix` option.
```

**Exit code**: non-zero (`$?` is `1`).

**Key takeaway**: `ruff check` finds problems `python3` itself would never catch -- the script above
runs and prints correctly despite the dead import.

**Why it matters**: A script running successfully proves nothing about its cleanliness. `ruff check`
(and its `--fix` flag, which would remove the unused import automatically) is what catches this class
of small rot before it accumulates -- exactly the linting discipline `black`/`ruff` and `pyright`
together enforce on every Python example in this book (DD-39).

---

### Example 6: int And float

_ex-06 &middot; exercises co-04, co-05, co-06_

`int` and `float` are two of Python's five primitive types. A name is a reference bound to a value by
assignment (`=`), and Python is dynamically typed -- the type lives on the value, not the variable --
but this book annotates every binding with a type hint anyway, for the reader's benefit and for
`pyright`.

**`learning/code/ex-06-int-and-float/example.py`**

```python
"""Example 6: int And float."""

count: int = 3  # => an int literal, no decimal point
ratio: float = 1.5  # => a float literal -- the decimal point makes it a float
print(count, ratio)  # => print() joins multiple args with a single space
# => Output: 3 1.5
```

**Run**: `python3 example.py`

**Output**:

```text
3 1.5
```

**Key takeaway**: a literal with a decimal point is a `float`; without one, it is an `int` -- the type
hint documents this, `pyright` verifies it, but nothing stops you from writing untyped Python too.

**Why it matters**: Every Python example in this book type-annotates every binding (DD-39), not
because Python requires it -- it does not -- but because the annotation is free documentation that a
type checker can verify. Reading annotated code is reading code that tells you its own contract.

---

### Example 7: bool And None

_ex-07 &middot; exercises co-05, co-06_

`bool` and `None` round out Python's primitive types. `bool` is technically a subclass of `int`
(`True == 1`, `False == 0`), and `None` is the language's one-and-only "no value" singleton.

**`learning/code/ex-07-bool-and-none/example.py`**

```python
"""Example 7: bool And None."""

flag: bool = True  # => bool is a subclass of int, but prints as True/False
nothing: None = None  # => None is Python's one-and-only "no value" singleton
print(flag, nothing)  # => Output: True None
```

**Run**: `python3 example.py`

**Output**:

```text
True None
```

**Key takeaway**: `True`/`False` are capitalized keywords, not strings; `None` (also capitalized) is
the only value of type `NoneType`.

**Why it matters**: A function with no explicit `return` returns `None`, and `None` is the value most
Python codebases use to signal "absent" or "not yet set" -- Example 76's chained `.get(...)` defaults
and Example 36's default arguments both lean on this same primitive.

---

### Example 8: Arithmetic Operators

_ex-08 &middot; exercises co-07_

Python's arithmetic operators include two that surprise readers coming from other languages:
`//` (floor division, always rounds toward negative infinity) and `**` (exponentiation, not `^`,
which is bitwise XOR in Python).

**`learning/code/ex-08-arithmetic-operators/example.py`**

```python
"""Example 8: Arithmetic Operators."""

print(7 // 2)  # => floor division, discards the remainder -- Output: 3
print(7 % 2)  # => modulo -- the remainder left over from 7 // 2 -- Output: 1
print(2**5)  # => exponentiation, 2 to the power of 5 -- Output: 32
```

**Run**: `python3 example.py`

**Output**:

```text
3
1
32
```

**Key takeaway**: `/` always returns a `float` (true division); `//` returns the floored quotient;
`**` is exponentiation.

**Why it matters**: Confusing `^` for exponentiation is one of the most common early Python mistakes
for readers arriving from C-family languages, where `^` is exponentiation in some contexts and XOR in
others. In Python, `^` is always bitwise XOR -- `**` is the only exponentiation operator.

---

### Example 9: Comparison Operators

_ex-09 &middot; exercises co-07_

`==` compares values, `<`/`>` compare ordering, and `!=` is not-equal -- all return a `bool`.

**`learning/code/ex-09-comparison-operators/example.py`**

```python
"""Example 9: Comparison Operators."""

# print() accepts multiple positional arguments and joins them with spaces.
# Python has six comparison operators total: < > <= >= == !=.
print(
    3 < 5,  # => strictly less-than -- True (bool)
    3 == 3,  # => value equality -- True (bool)
    4 != 4,  # => not-equal -- False, since 4 does equal 4 (bool)
)  # => Output: True True False
```

**Run**: `python3 example.py`

**Output**:

```text
True True False
```

**Key takeaway**: `==` checks value equality (not identity -- that's `is`, see Example 25's
truthiness note and later `is`/`is not` usage); comparisons chain the way you would expect.

**Why it matters**: These three operators cover the vast majority of conditional logic this primer
writes from Example 24 onward. Getting `==` vs `is` right early avoids a whole class of subtle bugs
later, when comparing against `None` (idiomatically `is None`, not `== None`).

---

### Example 10: Boolean Operators

_ex-10 &middot; exercises co-07_

`and`, `or`, and `not` combine boolean expressions -- spelled as words, not symbols like `&&`/`||`/`!`
in many other languages.

**`learning/code/ex-10-boolean-operators/example.py`**

```python
"""Example 10: Boolean Operators."""

# print() accepts multiple positional arguments and joins them with spaces.
# and/or/not are Python's three boolean operators (no bitwise-only forms needed here).
print(
    True and False,  # => and is True only if BOTH sides are True -- False
    True or False,  # => or is True if EITHER side is True -- True
    not True,  # => not flips a bool -- False
)  # => Output: False True False
```

**Run**: `python3 example.py`

**Output**:

```text
False True False
```

**Key takeaway**: `and`/`or`/`not` are English keywords in Python, not symbolic operators.

**Why it matters**: `and`/`or` also **short-circuit** and return one of their actual operands (not
always a `bool`) -- a property Example 76's chained `.get(...)` and idioms elsewhere in the ecosystem
lean on. This example only shows the boolean-result case; the short-circuit/value-returning behavior
is worth remembering as you read other people's Python.

---

### Example 11: f-string Interpolation

_ex-11 &middot; exercises co-08_

f-strings (`f"..."`) embed expressions directly inside string literals with `{}` -- the modern,
readable way to build strings from variables, replacing older `%`-formatting and `.format()` calls.

**`learning/code/ex-11-fstring-interpolation/example.py`**

```python
"""Example 11: f-string Interpolation."""

name: str = "Ada"  # => name is "Ada" (type: str)
age: int = 36  # => age is 36 (type: int)
print(f"{name} is {age}")  # => {name} and {age} are replaced by their current values
# => Output: Ada is 36
```

**Run**: `python3 example.py`

**Output**:

```text
Ada is 36
```

**Key takeaway**: anything inside `{}` in an f-string is evaluated as a Python expression, then
converted to its string form and inserted.

**Why it matters**: f-strings appear in nearly every later example in this primer that produces
human-readable output -- CLI messages (Examples 61-63), error messages (Example 65), and log-style
output (Example 79) all build on this exact syntax.

---

### Example 12: f-string Formatting

_ex-12 &middot; exercises co-08_

A format spec after `:` inside an f-string controls presentation -- decimal places, width, alignment
-- without any string manipulation of your own.

**`learning/code/ex-12-fstring-formatting/example.py`**

```python
"""Example 12: f-string Formatting."""

pi: float = 3.14159
# :.2f is a format spec -- fixed-point, 2 digits after the decimal.
print(f"{pi:.2f}")  # => Output: 3.14
```

**Run**: `python3 example.py`

**Output**:

```text
3.14
```

**Key takeaway**: `:.2f` means "fixed-point notation, 2 digits after the decimal point" -- the format
spec mini-language covers width, alignment, sign, thousands separators, and more.

**Why it matters**: Example 83's `describe()` function uses this exact `:.2f` spec to format a
computed price -- rounding for display is a different concern from rounding the underlying value
(that's `round()`, used in the capstone), and f-string format specs are the display-side tool.

---

### Example 13: String Methods

_ex-13 &middot; exercises co-08_

Strings ship with dozens of built-in methods; `.upper()`, `.strip()`, and `.split()` cover the most
common cleanup-and-tokenize workflow.

**`learning/code/ex-13-string-methods/example.py`**

```python
"""Example 13: String Methods."""

raw: str = "  a b c  "
# repr() makes the leading/trailing spaces visible as explicit quote characters --
# a plain print() here would produce the same spaces, just invisible on the page.
print(repr(raw.upper()))  # => .upper() keeps whitespace -- Output: '  A B C  '
print(repr(raw.strip()))  # => .strip() trims leading/trailing space -- Output: 'a b c'
print(raw.strip().split())  # => .split() splits on any whitespace run
# => Output: ['a', 'b', 'c']
```

**Run**: `python3 example.py`

**Output**:

```text
'  A B C  '
'a b c'
['a', 'b', 'c']
```

**Key takeaway**: string methods return a **new** string (or list) -- strings are immutable, so none
of these mutate `raw` in place.

**Why it matters**: `.split()` with no arguments is the single most common way to tokenize
whitespace-delimited text in Python, and it appears again inside the capstone's own light data
cleanup. `.strip()` before `.split()` avoids an empty leading/trailing token from surrounding
whitespace.

---

### Example 14: List Basics

_ex-14 &middot; exercises co-09_

A `list` is an ordered, mutable sequence -- the default "give me a growable collection" type in
Python.

**`learning/code/ex-14-list-basics/example.py`**

```python
"""Example 14: List Basics."""

nums: list[int] = [1, 2, 3]  # => a mutable, ordered sequence literal
nums.append(4)  # => appends in place -- no reassignment needed
print(nums)  # => Output: [1, 2, 3, 4]
```

**Run**: `python3 example.py`

**Output**:

```text
[1, 2, 3, 4]
```

**Key takeaway**: `list[int]` is the modern (PEP 585, Python 3.9+) built-in generic syntax -- no
`from typing import List` needed.

**Why it matters**: `.append()` mutates the list in place and returns `None` -- a common beginner bug
is writing `nums = nums.append(4)`, which discards the list entirely. Lists back nearly every
collection example from here through the capstone.

---

### Example 15: List Index Mutate

_ex-15 &middot; exercises co-09_

Index assignment (`nums[i] = value`) replaces one element in place -- only possible because lists are
mutable, unlike tuples (Example 17).

**`learning/code/ex-15-list-index-mutate/example.py`**

```python
"""Example 15: List Index Mutate."""

nums: list[int] = [1, 2, 3]  # => nums is [1, 2, 3] (type: list[int])
# Lists are mutable -- index assignment changes the list in place, no new list created.
nums[0] = 9  # => index assignment replaces the element in place -- lists are mutable
print(nums)  # => Output: [9, 2, 3]
```

**Run**: `python3 example.py`

**Output**:

```text
[9, 2, 3]
```

**Key takeaway**: `list[i] = value` is a mutation, not a rebinding -- every other reference to the
same list object sees the change too (Drilling Kata 3 explores exactly this).

**Why it matters**: This is the root of a whole class of real bugs: two names pointing at the same
mutable list, where mutating through one name is visible through the other. Understanding mutation
versus rebinding here pays off directly in Drilling Kata 3.

---

### Example 16: Tuple Unpacking

_ex-16 &middot; exercises co-10_

A `tuple` is an ordered, **immutable** sequence -- most often used for a fixed-size group of related
values, and readily unpacked into separate names in one statement.

**`learning/code/ex-16-tuple-unpacking/example.py`**

```python
"""Example 16: Tuple Unpacking."""

pair: tuple[int, int] = (10, 20)  # => a fixed-size, immutable sequence literal
x, y = pair  # => unpacks pair's two elements into x and y in one statement
print(x, y)  # => Output: 10 20
```

**Run**: `python3 example.py`

**Output**:

```text
10 20
```

**Key takeaway**: `x, y = pair` unpacks by position -- the number of names on the left must match the
tuple's length exactly, or Python raises a `ValueError`.

**Why it matters**: Tuple unpacking is how Example 39's `divmod`-style function returns two values at
once, and how the for-loop header in Example 19's `.items()` iteration destructures each key-value
pair.

---

### Example 17: Tuple Immutable

_ex-17 &middot; exercises co-10, co-21_

Attempting to assign into a tuple index raises `TypeError` at runtime -- immutability is enforced, not
just a convention.

**`learning/code/ex-17-tuple-immutable/example.py`**

```python
"""Example 17: Tuple Immutable."""

point: tuple[int, int] = (1, 2)  # => point is (1, 2) (type: tuple[int, int])
try:  # => wraps the mutation attempt so we can catch the expected error
    # Tuples are immutable -- item assignment always raises TypeError.
    point[0] = 9  # type: ignore[index]  # => raises TypeError before this line completes
except TypeError:  # => catches exactly the error tuples raise on item assignment
    print("immutable")  # => Output: immutable
```

**Run**: `python3 example.py`

**Output**:

```text
immutable
```

**Key takeaway**: tuples reject `__setitem__` entirely -- there is no way to mutate one in place, only
to build a new tuple.

**Why it matters**: Immutability is exactly what makes a tuple **hashable** (when its elements are
hashable too) and therefore safe to use as a dictionary key or a set element -- a capability plain
lists never have, since a mutable object's hash would change as it mutates.

---

### Example 18: Dict Basics

_ex-18 &middot; exercises co-11_

A `dict` maps keys to values -- Python's workhorse for anything key-value-shaped, including every
JSON object this primer reads or writes later.

**`learning/code/ex-18-dict-basics/example.py`**

```python
"""Example 18: Dict Basics."""

ages: dict[str, int] = {"Ada": 36}  # => a key-value mapping literal
print(ages["Ada"])  # => [] looks up the value for the "Ada" key -- Output: 36
```

**Run**: `python3 example.py`

**Output**:

```text
36
```

**Key takeaway**: `dict[str, int]` (PEP 585) documents the key and value types; `[]` lookup on a
missing key raises `KeyError` (Drilling Kata 2 explores the safer `.get()` alternative).

**Why it matters**: Dicts are how this primer represents every JSON object once parsed (Examples
55-58, 69, 72, and the capstone), because JSON objects and Python dicts share the same
key-value shape almost exactly.

---

### Example 19: Dict Iterate Items

_ex-19 &middot; exercises co-11, co-16_

`.items()` yields `(key, value)` pairs in insertion order -- the standard way to loop over both a
dict's keys and values together.

**`learning/code/ex-19-dict-iterate-items/example.py`**

```python
"""Example 19: Dict Iterate Items."""

counts: dict[str, int] = {"a": 1, "b": 2}  # => counts is {"a": 1, "b": 2}
# .items() yields (key, value) pairs, in insertion order.
for key, value in counts.items():  # => unpacks each (key, value) pair per iteration
    print(f"{key}={value}")  # => Output: a=1 then b=2
```

**Run**: `python3 example.py`

**Output**:

```text
a=1
b=2
```

**Key takeaway**: since Python 3.7, dicts preserve insertion order as a language guarantee, not an
implementation detail -- `.items()` always walks in that same order.

**Why it matters**: `.keys()` and `.values()` are the single-field counterparts to `.items()`; all
three appear across this primer whenever a dict needs to be iterated rather than looked up by a single
key.

---

### Example 20: Set Dedup

_ex-20 &middot; exercises co-12_

A `set` holds unique elements with no defined order -- constructing one from a list is the idiomatic
way to deduplicate.

**`learning/code/ex-20-set-dedup/example.py`**

```python
"""Example 20: Set Dedup."""

seen: set[int] = set([1, 1, 2, 3, 3])  # => set() drops duplicates -- keeps {1, 2, 3}
print(len(seen))  # => Output: 3
```

**Run**: `python3 example.py`

**Output**:

```text
3
```

**Key takeaway**: `set(iterable)` drops duplicates automatically -- five input values collapse to
three unique ones.

**Why it matters**: Set membership testing (`x in some_set`) is O(1) on average, versus O(n) for a
list -- a set is the right tool whenever the question is "have I seen this before?" rather than "in
what order did I see these?"

---

### Example 21: Set Operations

_ex-21 &middot; exercises co-12_

`|` (union) and `&` (intersection) combine two sets algebraically, mirroring set theory notation
directly.

**`learning/code/ex-21-set-operations/example.py`**

```python
"""Example 21: Set Operations."""

left: set[int] = {1, 2, 3}  # => left is {1, 2, 3} (type: set[int])
right: set[int] = {2, 3, 4}  # => right is {2, 3, 4} (type: set[int])
# Sets are unordered, so sorted() gives deterministic output for printing.
print(sorted(left | right))  # => union -- every element in either set -- [1, 2, 3, 4]
print(sorted(left & right))  # => intersection -- only elements in both -- [2, 3]
```

**Run**: `python3 example.py`

**Output**:

```text
[1, 2, 3, 4]
[2, 3]
```

**Key takeaway**: `sorted()` wraps each set result because sets have no defined iteration order --
sorting makes the output deterministic for display and for testing.

**Why it matters**: `-` (difference) and `^` (symmetric difference) round out the set-operator family,
not shown here since they follow the identical pattern; `|`/`&` alone already cover the vast majority
of real set-comparison needs.

---

### Example 22: Slice List

_ex-22 &middot; exercises co-13_

`[start:stop:step]` slicing extracts a subrange from any sequence -- lists, tuples, and strings alike
-- and a negative `step` walks backward.

**`learning/code/ex-22-slice-list/example.py`**

```python
"""Example 22: Slice List."""

nums: list[int] = [0, 1, 2, 3, 4]  # => nums is [0, 1, 2, 3, 4] (type: list[int])
# Slicing never mutates nums -- each print below returns a brand-new list.
print(nums[1:4])  # => [start:stop] -- indices 1, 2, 3 (stop is exclusive) -- [1, 2, 3]
print(nums[::-1])  # => a step of -1 walks the whole list backward -- [4, 3, 2, 1, 0]
```

**Run**: `python3 example.py`

**Output**:

```text
[1, 2, 3]
[4, 3, 2, 1, 0]
```

**Key takeaway**: `stop` in a slice is always exclusive; `nums[::-1]` (empty start, empty stop, step
`-1`) is the idiomatic one-liner to reverse a sequence.

**Why it matters**: Slicing never raises `IndexError` for an out-of-range `start`/`stop` (unlike
single-index access) -- it silently clamps to the sequence's actual bounds, which makes it forgiving
for exploratory data work but worth knowing explicitly.

---

### Example 23: Slice String

_ex-23 &middot; exercises co-13_

Strings slice exactly like lists, character by character.

**`learning/code/ex-23-slice-string/example.py`**

```python
"""Example 23: Slice String."""

word: str = "python"  # => word is "python" (type: str)
# Strings slice exactly like lists -- slicing never mutates the original string.
print(word[0:3])  # => characters 0, 1, 2 (stop is exclusive) -- "pyt"
```

**Run**: `python3 example.py`

**Output**:

```text
pyt
```

**Key takeaway**: string slicing follows the identical `[start:stop:step]` rules as list slicing --
one mental model for every sequence type.

**Why it matters**: Because strings are also immutable sequences, every slicing rule from Example 22
(exclusive stop, negative-step reversal, forgiving out-of-range bounds) applies here without
modification.

---

### Example 24: if/elif/else

_ex-24 &middot; exercises co-15_

`if`/`elif`/`else` branches on boolean expressions, evaluated top to bottom -- the first matching
branch runs, and the rest are skipped.

**`learning/code/ex-24-if-elif-else/example.py`**

```python
"""Example 24: if/elif/else."""


def classify(n: int) -> str:  # => defines classify, takes an int, returns a str
    # Exactly one branch below runs per call -- elif/else are mutually exclusive.
    if n < 0:  # => checked first -- only one branch below ever runs
        return "negative"  # => returns immediately, skipping elif/else
    elif n == 0:  # => checked only if the first condition was False
        return "zero"  # => returns immediately, skipping else
    else:  # => catches everything else -- every positive n
        return "positive"  # => runs only when both prior conditions were False


for value in (-2, 0, 5):  # => exercises all three branches in one pass
    print(classify(value))  # => Output: negative, then zero, then positive
```

**Run**: `python3 example.py`

**Output**:

```text
negative
zero
positive
```

**Key takeaway**: Python has no `switch`/`case` statement in this style -- `if`/`elif`/`else` (or
`match`, out of this primer's scope) is the idiomatic multi-branch construct.

**Why it matters**: `elif` (not `else if`) is Python's own keyword for a chained conditional -- using
`else: if ...:` instead works but adds an unnecessary indentation level for every additional branch.

---

### Example 25: Truthiness

_ex-25 &middot; exercises co-15_

Python's truthiness rule treats several "empty-like" values as falsy: `0`, `""`, `[]`, `{}`, `set()`,
and `None`, alongside `False` itself -- everything else is truthy.

**`learning/code/ex-25-truthiness/example.py`**

```python
"""Example 25: Truthiness."""

# Empty collections, 0, "", and None are all falsy; everything else is truthy.
items: list[int] = []  # => an empty list -- falsy in a boolean context
if items:  # => equivalent to `if bool(items):` -- False for an empty collection
    print("has items")  # => never runs -- items is empty, so the condition is False
else:  # => runs because items is falsy
    print("empty")  # => Output: empty
```

**Run**: `python3 example.py`

**Output**:

```text
empty
```

**Key takeaway**: `if items:` is equivalent to `if bool(items):`, and an empty collection's `bool()`
is always `False`.

**Why it matters**: Unlike Lua's narrow two-value falsy rule, Python treats "empty" broadly as falsy
-- writing `if some_list:` instead of `if len(some_list) > 0:` is the idiomatic, Pythonic style, and
this primer uses it throughout.

---

### Example 26: for + range

_ex-26 &middot; exercises co-16_

`range(start, stop)` generates a sequence of integers lazily, with `stop` exclusive -- the standard way
to loop a fixed number of times.

**`learning/code/ex-26-for-range/example.py`**

```python
"""Example 26: for + range."""

# range(start, stop) is a lazy sequence -- stop is never included.
total: int = 0  # => total is 0 (type: int) -- the running-sum accumulator
for n in range(1, 6):  # => range(1, 6) yields 1, 2, 3, 4, 5 -- stop is exclusive
    total += n  # => accumulates a running sum across the loop
print(total)  # => 1+2+3+4+5 -- Output: 15
```

**Run**: `python3 example.py`

**Output**:

```text
15
```

**Key takeaway**: `range(1, 6)` yields `1, 2, 3, 4, 5` -- five values, not six -- because `stop` is
always exclusive, exactly like slicing.

**Why it matters**: `range()` produces values lazily (one at a time) rather than building a full list
in memory -- `range(1_000_000)` costs almost nothing until you actually iterate it, unlike
`list(range(1_000_000))`.

---

### Example 27: while Loop

_ex-27 &middot; exercises co-16_

`while` loops on a condition rather than a fixed count -- useful whenever the number of iterations
isn't known in advance.

**`learning/code/ex-27-while-loop/example.py`**

```python
"""Example 27: while Loop."""

# while loops require an explicit exit condition -- for loops handle known ranges instead.
n: int = 3  # => n is 3 (type: int) -- the loop counter
while n >= 0:  # => keeps looping as long as the condition stays True
    print(n)  # => Output: 3, then 2, then 1, then 0
    n -= 1  # => must shrink n each pass, or the loop never ends
```

**Run**: `python3 example.py`

**Output**:

```text
3
2
1
0
```

**Key takeaway**: the loop body must change something the condition depends on (`n -= 1` here), or the
`while` loop never terminates.

**Why it matters**: `for` is idiomatic whenever you're iterating a known collection or count;
`while` is idiomatic when the stopping condition depends on runtime state (a sentinel value, user
input, or -- as here -- a countdown).

---

### Example 28: enumerate + zip

_ex-28 &middot; exercises co-16_

`enumerate()` pairs each element with its index; `zip()` pairs elements from multiple iterables
positionally -- both replace manual index-tracking with a direct, readable loop header.

**`learning/code/ex-28-enumerate-zip/example.py`**

```python
"""Example 28: enumerate + zip."""

# enumerate pairs each element with its index, starting from 0.
for index, letter in enumerate(["a", "b"]):
    print(index, letter)  # => Output: 0 a, then 1 b

# zip pairs elements positionally; it stops at the shortest input.
for number, letter in zip([1, 2], ["x", "y"]):
    print(number, letter)  # => Output: 1 x, then 2 y
```

**Run**: `python3 example.py`

**Output**:

```text
0 a
1 b
1 x
2 y
```

**Key takeaway**: `enumerate(iterable, start=N)` accepts an optional start index (Example 79 uses
`start=1` for 1-based line numbers); `zip()` silently stops at the shorter of its inputs, with no
error.

**Why it matters**: Manually tracking an index with a separate counter variable (`i = 0; ...; i += 1`)
is a common anti-pattern in code written by someone new to Python -- `enumerate()` and `zip()` remove
the need for it almost entirely, and both appear again later in this primer (Example 79 for
`enumerate`; nothing later reuses `zip` directly, but the pattern generalizes to any parallel-iteration
need).

---

← Previous: [Overview](./overview.md) · Next: [Intermediate Examples](./intermediate.md) →
