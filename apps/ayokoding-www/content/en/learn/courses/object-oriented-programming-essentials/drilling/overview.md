---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Object-Oriented Programming Essentials topic:
five fixed drills that force active recall instead of passive re-reading. Work through them in
order -- short-answer recall first, then scenario judgment, then hands-on repetition, then a
checklist to confirm real automaticity, and finally why/why-not prompts that test whether you can
explain the reasoning, not just execute the syntax. Every answer is hidden in a `<details>` block;
try each item yourself before opening it. Together, the five drills below touch every one of this
topic's 17 concepts and cite specific examples spanning all 80 worked examples in the Beginner,
Intermediate, and Advanced tiers.

## Recall Q&A

Seventeen short-answer questions, one per concept (`co-01` through `co-17`). Answer from memory,
then check.

**Q1 (co-01 -- class-and-instance).** What does calling a class like a function actually do, and
what is the smallest possible proof that it genuinely built a new object?

<details>
<summary>Answer</summary>

It constructs a new instance -- the class acts as a factory, and `__init__` runs automatically as
part of that construction, assigning onto `self` to give the new object its own state. The smallest
proof is `type(d) is Dog`: confirming the built object's exact type is the class that constructed it
(Example 1).

</details>

**Q2 (co-02 -- encapsulation).** Why does routing every balance change through `deposit`/`withdraw`
methods, rather than allowing direct field assignment, matter for correctness?

<details>
<summary>Answer</summary>

Uncontrolled field access lets any code path set `account.balance = -50` directly if the field is
public and unguarded. Routing every mutation through a method turns "balance never goes negative"
into a rule the class itself enforces in one place, rather than a convention every caller must
remember (Examples 15-17).

</details>

**Q3 (co-03 -- identity-vs-equality).** What is the difference between `is` and `==`, and when do two
independently constructed objects of the same class differ on the two checks?

<details>
<summary>Answer</summary>

`is` compares object identity (the same address in memory); `==` compares value, via `__eq__`. Two
separately constructed `Dog("Rex")` objects are never `is` each other, and are only `==` each other
once the class defines what "equal" means -- before that, `==` silently falls back to identity too
(Examples 10-12).

</details>

**Q4 (co-04 -- repr-and-str).** What is the difference between `__repr__` and `__str__`, and which
one does `print()` prefer?

<details>
<summary>Answer</summary>

`__repr__` gives an unambiguous, developer-facing string (ideally one that round-trips through
`eval()`); `__str__` gives a readable, end-user-facing string. `print()` calls `str()`, which prefers
`__str__` when defined and falls back to `__repr__` when it is not (Examples 8-9, 53).

</details>

**Q5 (co-05 -- eq-and-hash).** What happens to a class's `__hash__` the moment it defines `__eq__`
alone, and why does that matter for sets and dict keys?

<details>
<summary>Answer</summary>

Python sets `__hash__ = None` automatically, making every instance unhashable -- attempting to place
one in a `set` or use it as a dict key raises `TypeError` (Example 35). Sets and dicts rely on
`hash()` to bucket objects before `__eq__` ever runs a comparison, so a class overriding equality
that still wants to live inside a `set` must define a consistent `__hash__` explicitly too
(Example 34).

</details>

**Q6 (co-06 -- dataclass-value-object).** Name three `@dataclass` options and what each one changes.

<details>
<summary>Answer</summary>

`frozen=True` makes every field read-only after construction and (with the default `eq=True`)
auto-generates a `__hash__`; `slots=True` (Python 3.10+) drops the per-instance `__dict__`, rejecting
undeclared attribute assignment; `order=True` adds `__lt__`/`__le__`/`__gt__`/`__ge__` for tuple-style
comparisons. `field(default_factory=...)` is a fourth worth knowing: it gives a fresh mutable default
per instance instead of one shared object (Examples 20-25, 36, 39, 40).

</details>

**Q7 (co-07 -- properties).** How does `@property` let a class start with a plain field and later add
validation without breaking any caller's code?

<details>
<summary>Answer</summary>

`@property` exposes a computed or guarded value through ordinary attribute syntax (`obj.attr`, never
`obj.attr()`), and a matching setter enforces invariants on assignment. Because the external syntax
never changes, a class can grow from a stored field into a validated or computed one with zero
changes at any call-site (Examples 29-32).

</details>

**Q8 (co-08 -- inheritance).** What does `super().__init__(...)` do, and what does `isinstance` return
for a subclass instance checked against its base class?

<details>
<summary>Answer</summary>

`super().__init__(...)` calls the base class's constructor from inside the subclass's own
`__init__`, chaining base and subclass construction into one call. `isinstance(cat, Animal)` is
`True` for every `Cat` instance, regardless of how many subclassing levels separate `Cat` from
`Animal` (Examples 41, 42, 46).

</details>

**Q9 (co-09 -- method-overriding).** What happens when a subclass defines a method with the same name
as one on its base class, and how does a subclass call the base version anyway?

<details>
<summary>Answer</summary>

The subclass's method completely shadows the base implementation -- overriding is Python's default,
with no explicit keyword required. To augment rather than fully replace the base behavior, the
override calls `super().method_name()` explicitly inside its own body (Examples 43-44).

</details>

**Q10 (co-10 -- polymorphism).** What does looping over a `list[Animal]` holding mixed subclasses and
calling `.speak()` on each element actually dispatch to?

<details>
<summary>Answer</summary>

Each element's own class's `.speak()` implementation, decided entirely by that object's runtime
type -- one call-site, one method name, a different method body per element. This is what lets a new
subclass plug in later with zero changes to the loop itself (Example 45).

</details>

**Q11 (co-11 -- abstraction-abc).** What happens if you try to instantiate `abc.ABC` subclass that
has not implemented all of its `@abstractmethod`s, and when does that failure occur?

<details>
<summary>Answer</summary>

Instantiation raises `TypeError` immediately, at construction time -- not the first time the missing
method is actually called. This is a much tighter feedback loop than a plain base class with an
unimplemented method, which only fails whenever that method happens to be invoked (Examples 59-60).

</details>

**Q12 (co-12 -- duck-typing).** How does a function decide whether an argument is acceptable under
duck typing, and what does `typing.Protocol` add on top of that?

<details>
<summary>Answer</summary>

Purely by the methods the argument actually has -- a function calling `.area()` accepts any object
exposing an `.area()` method, regardless of its declared base class (Example 26). `typing.Protocol`
formalizes that exact structural contract so a static checker (`pyright`) can verify it ahead of
runtime, with `@runtime_checkable` additionally enabling `isinstance()` checks against it
(Example 56).

</details>

**Q13 (co-13 -- composition-over-inheritance).** Why does `Stack(list)` leak the wrong interface, and
what is the composition-based fix?

<details>
<summary>Answer</summary>

Subclassing `list` inherits every list method, including `insert()`, which a stack was never meant
to expose -- `s.insert(0, 99)` breaks the "push/pop at one end only" guarantee (Example 65). The fix
holds a `list` as a private collaborator (`self._items`) instead of subclassing it, exposing only
`push`/`pop`/`peek` -- `insert` simply does not exist on the refactored class (Example 66).

</details>

**Q14 (co-14 -- class-vs-instance-attributes).** What is the mutable-class-attribute bug, and what
one-line change fixes it?

<details>
<summary>Answer</summary>

Declaring `items: list[str] = []` directly on the class body creates ONE list shared by every
instance -- mutating it through one instance is visible through every other instance of the same
class. The fix moves the list literal inside `__init__` (`self.items: list[str] = []`), so every
instance genuinely gets its own fresh list (Example 51).

</details>

**Q15 (co-15 -- classmethod-and-staticmethod).** What is the difference between `@classmethod` and
`@staticmethod`, and why can only one of them return the correct subclass type from a factory method?

<details>
<summary>Answer</summary>

`@classmethod` receives `cls` -- whichever class the method was actually called on -- while
`@staticmethod` receives neither `self` nor `cls`, behaving as a plain namespaced function. Only
`@classmethod` can build `cls()` instead of hardcoding a class name, which is what lets a factory
method return the calling subclass's own type automatically (Examples 47-49).

</details>

**Q16 (co-16 -- encapsulation-conventions).** What is the practical difference between a single
leading underscore and a double leading underscore on an attribute name?

<details>
<summary>Answer</summary>

A single underscore (`_balance`) is a convention only -- external code can still reach it, but doing
so is a documented violation of the class's contract. A double underscore (`__pin`) triggers Python's
name mangling, rewriting the attribute to `_ClassName__pin` internally -- the unmangled name genuinely
does not exist and raises `AttributeError` if accessed directly from outside the class (Examples 18-19).

</details>

**Q17 (co-17 -- invariant-enforcement).** Why is validating an invariant only inside `__init__` not
actually sufficient, and what is the stronger claim a property-based test makes?

<details>
<summary>Answer</summary>

If a later setter or mutating method can still push the object past the same boundary, the invariant
only held "at construction time," not always -- every path that changes state needs the identical
check (Examples 16-17, 52, 71, 77). A property-based test throws hundreds of randomized inputs
(rather than a couple of hand-picked edge cases) at the same invariant, which is a meaningfully
stronger claim that no input reaches an invalid state (Example 80).

</details>

## Applied problems

Eleven scenarios. Each describes a task without naming the construct -- decide which OOP feature
solves it, then check.

**AP1.** Two `Dog` objects are built independently from the same constructor arguments, and you need
a function that can loop over an arbitrary list of them, verifying each one's `name` field is set
correctly without any of them sharing state.

<details>
<summary>Answer</summary>

Nothing extra is needed -- this is exactly what instance attributes already guarantee: every
`Dog(...)` call runs `__init__` fresh, assigning `self.name` onto that one object's own namespace.
Looping over a `list[Dog]` and reading `.name` off each element never risks cross-contamination,
because no instance attribute is ever shared unless explicitly declared on the class instead
(Examples 5, 27).

</details>

**AP2.** A debugging session needs a `print(obj)` call to show something genuinely useful -- ideally
a string that could be pasted back into the REPL to reconstruct the exact same object -- rather than
Python's default `<Point object at 0x...>`.

<details>
<summary>Answer</summary>

Define `__repr__` to return the constructor-call form (e.g. `f"Point(x={self.x}, y={self.y})"`).
`print()` uses `str()`, which falls back to `__repr__` when `__str__` is absent, and a repr shaped
like the constructor call is directly paste-able back into a REPL to reproduce the object
(Examples 8, 53).

</details>

**AP3.** Two `Money` objects built from the same amount and currency should compare as the same
value, even though they are two separate objects in memory -- and a `@dataclass` version should get
this behavior automatically, with no hand-written method.

<details>
<summary>Answer</summary>

Define `__eq__` comparing the relevant fields (Example 12), or use `@dataclass`, which
auto-generates `__eq__` from the declared fields with no hand-written code needed at all
(Example 22) -- the dataclass version can never silently drift out of sync with the fields the way a
hand-written `__eq__` risks after a field is added later.

</details>

**AP4.** A `Config` dataclass needs a field that starts as an empty list for every instance, but a
plain `= []` default on the field declaration is exactly the bug this topic warns about elsewhere.

<details>
<summary>Answer</summary>

`field(default_factory=list)`, not `= []` directly on the field. Unlike a plain class body, `@dataclass`
actually raises `ValueError` at class-definition time if you try a mutable default directly -- the
`default_factory` calls its callable fresh for every new instance, giving each one its own list
(Example 24).

</details>

**AP5.** A `Rectangle`'s `area` should always reflect its current `width` and `height`, read with
plain attribute syntax (`r.area`, never `r.area()`), and never stored as a field that could drift out
of sync after a resize.

<details>
<summary>Answer</summary>

`@property` on an `area` method -- it computes the value fresh on every access, so it is
structurally impossible for it to go stale relative to `width`/`height` (Example 32). A plain stored
field would need to be manually recomputed on every resize; a computed property cannot forget.

</details>

**AP6.** A `Cat(Animal)` subclass needs its own extra constructor argument (e.g. `breed`) while still
running all of `Animal`'s original field-setting logic, without duplicating that logic.

<details>
<summary>Answer</summary>

`Cat.__init__` calls `super().__init__(name)` first (chaining into `Animal`'s constructor), then sets
its own additional field (`self.breed = breed`) afterward. This reuses `Animal`'s logic exactly once
rather than copy-pasting it into `Cat` (Examples 42, 44).

</details>

**AP7.** A `describe(shape)` function needs to accept both a `Circle` and a `Square` -- two classes
with no common ancestor beyond `object` -- purely because both happen to define an `.area()` method,
and a static checker should still be able to verify the call is safe.

<details>
<summary>Answer</summary>

Duck typing alone (Example 26) makes this work at runtime with zero declared relationship between
`Circle` and `Square`. `typing.Protocol` (Example 56) formalizes the exact same contract
(`class HasArea(Protocol): def area(self) -> float: ...`) so `pyright` can verify `describe`'s
argument is safe ahead of time, without either shape class declaring any inheritance from the
protocol at all.

</details>

**AP8.** A `Date` class needs both an alternative constructor that parses a string
(`Date.from_string("2026-01-01")`) and a completely stateless helper (`Date.is_leap(2028)`) that
needs neither an instance nor the class itself to compute its answer.

<details>
<summary>Answer</summary>

`@classmethod` for `from_string` (it needs `cls` to build and return the actual `Date`);
`@staticmethod` for `is_leap` (it is a plain function that only happens to live inside `Date`'s
namespace for organizational purposes, needing neither `self` nor `cls`) (Examples 47-48).

</details>

**AP9.** A codebase has several `Shape` implementations (`Circle`, `Square`, and later a third one
added by someone else entirely), and a single `total_area(shapes)` function needs to keep working
correctly the day that third implementation is added, with zero changes to `total_area` itself.

<details>
<summary>Answer</summary>

Define `Shape` as an `abc.ABC` with an abstract `area()` method, and type `total_area`'s parameter
against `Shape` (or, more loosely, against duck typing). Every concrete implementation is forced to
supply `area()` at construction time (Examples 59-60), and the call-site dispatches polymorphically
to whichever implementation it receives (Examples 61-62) -- a brand-new subclass plugs in with zero
edits to `total_area`.

</details>

**AP10.** A `Service` class needs a `Logger` collaborator, but tests need to substitute a fake logger
that records calls instead of printing them, without subclassing `Service` or `Logger` at all.

<details>
<summary>Answer</summary>

Inject the collaborator through the constructor, typed against an interface rather than a concrete
class (`def __init__(self, logger: SupportsLog) -> None: self.logger = logger`). A test passes a fake
implementing the same structural contract, and `Service` never needs to know or care that it received
a fake instead of the real `Logger` (Examples 67-70).

</details>

**AP11.** A `Shape` base class wants every subclass automatically tracked in a lookup table by name,
the moment each subclass is defined -- with no manual registration call required anywhere in any
subclass.

<details>
<summary>Answer</summary>

`__init_subclass__` on the base class, fired automatically by Python at every subclass's
class-definition time, not at instantiation. `Shape.registry[cls.__name__] = cls` inside it
registers every subclass with zero code required in `Circle` or `Square` themselves (Example 78) --
the same mechanism a full domain model (Example 79) and a property-based invariant test (Example 80)
both build on top of.

</details>

## Code katas

Eight hands-on repetition drills. Each is a before/after `.py` file colocated under
`drilling/code/`. Every "before" script is a real, runnable Python program that misapplies the
concept being drilled -- run it yourself, diagnose the bug from the observed behavior, fix it from
memory, then compare your fix against the "after" script and the model solution before checking your
work against the actually-executed output shown.

### Kata 1 -- mutable class-level attribute

_relates to co-14, Example 51_

**Task.** Two `Cart` instances should never share items -- adding an item to one cart must never
appear in a second, freshly constructed cart. The version below is broken: `items` is declared
directly on the class body, so every instance shares the exact same list.

**Before** (`drilling/code/kata-01-mutable-class-attr/before/kata.py`)

```python
"""Kata 1 (before): a shared, mutable class-level list attribute."""


class Cart:
    items: list[str] = []  # declared on the CLASS -- shared by every instance

    def add(self, item: str) -> None:
        self.items.append(item)


a = Cart()
b = Cart()
a.add("apple")
print(b.items)
```

**Observed (buggy) output** (captured by actually running the script above):

```text
['apple']
```

**After** (`drilling/code/kata-01-mutable-class-attr/after/kata.py`)

```python
"""Kata 1 (after): a fresh list per instance, built inside __init__."""


class Cart:
    def __init__(self) -> None:
        self.items: list[str] = []  # a fresh list, built per instance

    def add(self, item: str) -> None:
        self.items.append(item)


a = Cart()
b = Cart()
a.add("apple")
print(b.items)
```

<details>
<summary>Model solution</summary>

```python
class Cart:
    def __init__(self) -> None:
        # THE FIX: build the list INSIDE __init__, not on the class body.
        self.items: list[str] = []  # => a genuinely fresh list, per instance

    def add(self, item: str) -> None:
        self.items.append(item)  # => now mutates only THIS instance's own list


a = Cart()
b = Cart()
a.add("apple")
print(b.items)  # => b never saw a's item -- Output: []
```

**Root cause**: `items: list[str] = []` on the class body evaluates the `[]` literal exactly **once**,
at class-definition time -- every instance that never explicitly shadows it shares that one list
object. Building the list inside `__init__` guarantees a fresh object per instance.

**Run**: `python3 kata.py`

**Output**:

```text
[]
```

</details>

### Kata 2 -- `__eq__` without `__hash__`

_relates to co-05, Example 35_

**Task.** `Point` instances need to compare equal by value AND live inside a `set`. The version
below defines `__eq__` alone, which silently sets `__hash__ = None` -- building a set of `Point`s
crashes with `TypeError`.

**Before** (`drilling/code/kata-02-eq-without-hash/before/kata.py`)

```python
"""Kata 2 (before): __eq__ defined alone -- silently makes the class unhashable."""


class Point:
    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y


points = {Point(1, 2), Point(1, 2)}  # type: ignore
print(points)
```

**Observed (buggy) output** (captured by actually running the script above -- it crashes):

```text
Traceback (most recent call last):
  File ".../kata-02-eq-without-hash/before/kata.py", line 15, in <module>
    points = {Point(1, 2), Point(1, 2)}
             ^^^^^^^^^^^^^^^^^^^^^^^^^^
TypeError: unhashable type: 'Point'
```

**After** (`drilling/code/kata-02-eq-without-hash/after/kata.py`)

```python
"""Kata 2 (after): a __hash__ consistent with __eq__, restoring hashability."""


class Point:
    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self) -> int:
        return hash((self.x, self.y))


points = {Point(1, 2), Point(1, 2)}
print(len(points))
```

<details>
<summary>Model solution</summary>

```python
class Point:
    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    # THE FIX: a __hash__ CONSISTENT with __eq__ -- equal objects must hash equal.
    def __hash__(self) -> int:
        return hash((self.x, self.y))  # => the same tuple-of-fields the eq comparison uses


points = {Point(1, 2), Point(1, 2)}  # => now hashable -- two equal Points dedupe to one
print(len(points))  # => Output: 1
```

**Root cause**: defining `__eq__` alone tells Python "this class has custom equality," and Python's
data model responds by disabling the default identity-based `__hash__` entirely, since a class that
redefines equality has almost certainly broken the default hash's consistency guarantee too. Adding
an explicit `__hash__` derived from the same fields `__eq__` compares restores the contract.

**Run**: `python3 kata.py`

**Output**:

```text
1
```

</details>

### Kata 3 -- mutating a frozen dataclass

_relates to co-06, Example 36_

**Task.** `move_right` should return a new `Point` shifted one unit right, but the version below
tries to mutate the field of a `frozen=True` dataclass directly, which always raises.

**Before** (`drilling/code/kata-03-frozen-dataclass-mutation/before/kata.py`)

```python
"""Kata 3 (before): assigning a frozen dataclass field as if it were a plain mutable object."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Point:
    x: int
    y: int


def move_right(p: Point) -> None:
    p.x = p.x + 1  # type: ignore  # looks like a normal mutation -- but Point is frozen


p = Point(1, 2)
move_right(p)
print(p)
```

**Observed (buggy) output** (captured by actually running the script above -- it crashes):

```text
Traceback (most recent call last):
  File ".../kata-03-frozen-dataclass-mutation/before/kata.py", line 17, in <module>
    move_right(p)
  File ".../kata-03-frozen-dataclass-mutation/before/kata.py", line 13, in move_right
    p.x = p.x + 1
dataclasses.FrozenInstanceError: cannot assign to field 'x'
```

**After** (`drilling/code/kata-03-frozen-dataclass-mutation/after/kata.py`)

```python
"""Kata 3 (after): construct a NEW Point instead of mutating the frozen one."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Point:
    x: int
    y: int


def move_right(p: Point) -> Point:
    return Point(p.x + 1, p.y)  # returns a NEW, still-frozen Point


p = Point(1, 2)
p = move_right(p)
print(p)
```

<details>
<summary>Model solution</summary>

```python
def move_right(p: Point) -> Point:
    # THE FIX: return a brand-new, still-frozen Point -- never mutate the input.
    return Point(p.x + 1, p.y)  # => a fresh instance, the original p is untouched


p = Point(1, 2)
p = move_right(p)  # => rebinds the NAME p to the new instance
print(p)  # => Output: Point(x=2, y=2)
```

**Root cause**: `frozen=True` makes every field read-only after `__init__` completes -- any later
`p.x = ...` raises `dataclasses.FrozenInstanceError`, a subclass of `AttributeError`, regardless of
where the assignment happens. The fix embraces immutability: build and return a new instance instead
of trying to change the existing one.

**Run**: `python3 kata.py`

**Output**:

```text
Point(x=2, y=2)
```

</details>

### Kata 4 -- an ABC subclass that forgets a method

_relates to co-11, Example 60_

**Task.** `Square` should be a concrete, instantiable `Shape`. The version below forgets to
implement the abstract `area()` method, so instantiating it fails immediately.

**Before** (`drilling/code/kata-04-abc-incomplete-subclass/before/kata.py`)

```python
"""Kata 4 (before): a Shape subclass that forgets to implement the abstract method."""

import abc


class Shape(abc.ABC):
    @abc.abstractmethod
    def area(self) -> float: ...


class Square(Shape):
    def __init__(self, side: float) -> None:
        self.side = side

    # forgot to implement area()


s = Square(3.0)  # type: ignore
print(s.area())
```

**Observed (buggy) output** (captured by actually running the script above -- it crashes):

```text
Traceback (most recent call last):
  File ".../kata-04-abc-incomplete-subclass/before/kata.py", line 18, in <module>
    s = Square(3.0)  # type: ignore
TypeError: Can't instantiate abstract class Square without an implementation for abstract method 'area'
```

**Version note**: this exact message text applies to Python 3.12+. Python 3.10 and 3.11 raise the
same `TypeError` at the same line but with older wording:
`TypeError: Can't instantiate abstract class Square with abstract method area`. Either way, `Square()`
crashes immediately with a `TypeError` -- only the message text changed, not the behavior.

**After** (`drilling/code/kata-04-abc-incomplete-subclass/after/kata.py`)

```python
"""Kata 4 (after): Square implements the required area() method."""

import abc


class Shape(abc.ABC):
    @abc.abstractmethod
    def area(self) -> float: ...


class Square(Shape):
    def __init__(self, side: float) -> None:
        self.side = side

    def area(self) -> float:
        return self.side**2


s = Square(3.0)
print(s.area())
```

<details>
<summary>Model solution</summary>

```python
class Square(Shape):
    def __init__(self, side: float) -> None:
        self.side = side

    # THE FIX: implement every abstract method the base class declares.
    def area(self) -> float:
        return self.side**2  # => now a COMPLETE Shape -- instantiation succeeds


s = Square(3.0)
print(s.area())  # => Output: 9.0
```

**Root cause**: `abc.ABC` plus `@abstractmethod` makes instantiation itself the enforcement point --
Python raises `TypeError` the moment `Square(3.0)` runs, listing exactly which abstract method is
still missing, rather than waiting for the first call to `.area()` to fail somewhere else entirely.

**Run**: `python3 kata.py`

**Output**:

```text
9.0
```

</details>

### Kata 5 -- naive inheritance leaks the wrong interface

_relates to co-13, Examples 65-66_

**Task.** `Stack` should only expose `push`/`pop_top` -- but the version below subclasses `list`
directly, which also hands out `insert()`, silently breaking the "push/pop at one end only"
guarantee a stack is supposed to make.

**Before** (`drilling/code/kata-05-naive-inheritance-to-composition/before/kata.py`)

```python
"""Kata 5 (before): Stack(list) leaks the full list interface, including insert()."""


class Stack(list[int]):
    def push(self, item: int) -> None:
        self.append(item)

    def pop_top(self) -> int:
        return self.pop()


s = Stack()
s.push(1)
s.push(2)
s.insert(0, 99)  # never meant to be part of a stack's interface
print(list(s))
```

**Observed (buggy) output** (captured by actually running the script above):

```text
[99, 1, 2]
```

**After** (`drilling/code/kata-05-naive-inheritance-to-composition/after/kata.py`)

```python
"""Kata 5 (after): Stack HOLDS a list instead of BEING one -- insert() is simply gone."""


class Stack:
    def __init__(self) -> None:
        self._items: list[int] = []

    def push(self, item: int) -> None:
        self._items.append(item)

    def pop_top(self) -> int:
        return self._items.pop()


s = Stack()
s.push(1)
s.push(2)
print(s._items)
print(hasattr(s, "insert"))
```

<details>
<summary>Model solution</summary>

```python
class Stack:
    def __init__(self) -> None:
        # THE FIX: HOLD a list as a private collaborator instead of subclassing list.
        self._items: list[int] = []

    def push(self, item: int) -> None:
        self._items.append(item)

    def pop_top(self) -> int:
        return self._items.pop()


s = Stack()
s.push(1)
s.push(2)
print(s._items)  # => Output: [1, 2]
print(hasattr(s, "insert"))  # => Output: False -- the leak is simply gone
```

**Root cause**: `class Stack(list[int])` is-a list, inheriting every list method whether wanted or
not. Composition (`self._items: list[int] = []`) makes the relationship has-a instead: the class
chooses exactly which operations to re-expose (`push`/`pop_top`), and everything else the underlying
list can do stays private.

**Run**: `python3 kata.py`

**Output**:

```text
[1, 2]
False
```

</details>

### Kata 6 -- reaching past name mangling

_relates to co-16, Example 19_

**Task.** `Wallet` stores a PIN behind a double-underscore attribute. The version below tries to
read it directly from outside the class using the literal, unmangled name -- which does not exist.

**Before** (`drilling/code/kata-06-name-mangling-misuse/before/kata.py`)

```python
"""Kata 6 (before): reaching for a double-underscore attribute by its unmangled name."""


class Wallet:
    def __init__(self, pin: str) -> None:
        self.__pin = pin


w = Wallet("1234")
print(w.__pin)  # type: ignore
```

**Observed (buggy) output** (captured by actually running the script above -- it crashes):

```text
Traceback (most recent call last):
  File ".../kata-06-name-mangling-misuse/before/kata.py", line 10, in <module>
    print(w.__pin)
AttributeError: 'Wallet' object has no attribute '__pin'
```

**After** (`drilling/code/kata-06-name-mangling-misuse/after/kata.py`)

```python
"""Kata 6 (after): use the class's own sanctioned accessor instead of poking at __pin."""


class Wallet:
    def __init__(self, pin: str) -> None:
        self.__pin = pin

    def check_pin(self, guess: str) -> bool:
        return guess == self.__pin


w = Wallet("1234")
print(w.check_pin("1234"))
```

<details>
<summary>Model solution</summary>

```python
class Wallet:
    def __init__(self, pin: str) -> None:
        self.__pin = pin

    # THE FIX: expose a sanctioned METHOD instead of reaching for the mangled field directly.
    def check_pin(self, guess: str) -> bool:
        return guess == self.__pin  # => inside the class, __pin still reads normally


w = Wallet("1234")
print(w.check_pin("1234"))  # => Output: True
```

**Root cause**: `self.__pin` inside the class body is silently rewritten by Python to
`self._Wallet__pin` -- the literal name `__pin` genuinely does not exist as an attribute on the
instance from outside the class. The fix is not to reach for the mangled spelling; it is to expose a
method the class itself controls.

**Run**: `python3 kata.py`

**Output**:

```text
True
```

</details>

### Kata 7 -- an invariant missing from a setter

_relates to co-17, Example 52_

**Task.** `Temperature` should never hold a value below absolute zero. The version below checks that
rule inside `__init__` only -- a later direct assignment bypasses the guard entirely.

**Before** (`drilling/code/kata-07-invariant-missing-on-setter/before/kata.py`)

```python
"""Kata 7 (before): invariant checked in __init__ but NOT on later mutation."""


class Temperature:
    def __init__(self, celsius: float) -> None:
        if celsius < -273.15:
            raise ValueError("below absolute zero")
        self.celsius = celsius


t = Temperature(20.0)
t.celsius = -300.0  # bypasses the constructor's guard entirely
print(t.celsius)
```

**Observed (buggy) output** (captured by actually running the script above -- an invalid value is
silently accepted):

```text
-300.0
```

**After** (`drilling/code/kata-07-invariant-missing-on-setter/after/kata.py`)

```python
"""Kata 7 (after): the SAME invariant enforced by a property setter too."""


class Temperature:
    def __init__(self, celsius: float) -> None:
        self.celsius = (
            celsius  # routes through the property setter below, even in __init__
        )

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value


t = Temperature(20.0)
try:
    t.celsius = -300.0
except ValueError as exc:
    print(exc)
```

<details>
<summary>Model solution</summary>

```python
class Temperature:
    def __init__(self, celsius: float) -> None:
        self.celsius = celsius  # even the constructor routes through the property setter

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        # THE FIX: the SAME guard, now enforced on every assignment, not just construction.
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value


t = Temperature(20.0)
try:
    t.celsius = -300.0  # => now routes through the setter -- the guard fires here too
except ValueError as exc:
    print(exc)  # => Output: below absolute zero
```

**Root cause**: checking an invariant only inside `__init__` only protects the moment of
construction -- any later direct attribute assignment bypasses that check entirely. Moving the same
guard into a `@property` setter makes every assignment, including the one inside `__init__` itself,
go through the identical validation.

**Run**: `python3 kata.py`

**Output**:

```text
below absolute zero
```

</details>

### Kata 8 -- a classmethod factory that hardcodes its class

_relates to co-15, Examples 47, 49_

**Task.** `Animal.create()` should return an instance of whichever class it was actually called
on. The version below hardcodes `Animal()` inside the classmethod body, so calling it on `Cat`
still, incorrectly, returns a plain `Animal`.

**Before** (`drilling/code/kata-08-classmethod-hardcoded-class/before/kata.py`)

```python
"""Kata 8 (before): a classmethod factory hardcodes the base class name."""


class Animal:
    @classmethod
    def create(cls) -> "Animal":
        return (
            Animal()
        )  # hardcoded -- ignores whichever class create() was actually called on


class Cat(Animal):
    pass


c = Cat.create()
print(type(c).__name__)
```

**Observed (buggy) output** (captured by actually running the script above):

```text
Animal
```

**After** (`drilling/code/kata-08-classmethod-hardcoded-class/after/kata.py`)

```python
"""Kata 8 (after): cls() adapts to whichever class create() was actually called on."""

from typing import TypeVar

T = TypeVar("T", bound="Animal")


class Animal:
    @classmethod
    def create(cls: type[T]) -> T:
        return cls()  # adapts to the CALLING class


class Cat(Animal):
    pass


c = Cat.create()
print(type(c).__name__)
```

<details>
<summary>Model solution</summary>

```python
from typing import TypeVar

T = TypeVar("T", bound="Animal")


class Animal:
    @classmethod
    # THE FIX: cls() instead of a hardcoded Animal() -- cls IS whichever class this ran on.
    def create(cls: type[T]) -> T:
        return cls()  # => builds THIS class, not always Animal


class Cat(Animal):
    pass


c = Cat.create()
print(type(c).__name__)  # => Output: Cat
```

**Root cause**: hardcoding the base class name inside a `@classmethod` throws away the exact piece
of information `cls` exists to carry -- which class the method was actually called on. `cls()`
always builds the calling class; `Animal()` always builds `Animal`, no matter which subclass called
`create()`.

**Run**: `python3 kata.py`

**Output**:

```text
Cat
```

</details>

## Self-check checklist

Confirm each item without checking the manual first. If you hesitate, that concept needs another
pass.

- [ ] I can construct a class instance and prove `type(instance) is TheClass` from memory. (co-01)
- [ ] I can explain why routing every state change through a method, rather than exposing a public
      field, makes an invariant enforceable in one place. (co-02)
- [ ] I can explain the difference between `is` and `==`, and predict when two equal-looking objects
      differ on both checks. (co-03)
- [ ] I can write a `__repr__` that round-trips through `eval()` and explain when `print()` prefers
      `__str__` over it. (co-04)
- [ ] I can explain exactly what happens to `__hash__` the moment a class defines `__eq__` alone,
      and how to fix it. (co-05)
- [ ] I can name at least three `@dataclass` options (`frozen`, `slots`, `order`,
      `default_factory`) and what each one changes. (co-06)
- [ ] I can write a `@property` with a validating setter and explain why the external attribute
      syntax never has to change. (co-07)
- [ ] I can write a subclass that calls `super().__init__(...)` to chain construction with its base
      class. (co-08)
- [ ] I can explain the difference between fully overriding a method and calling `super()` inside
      the override to augment it. (co-09)
- [ ] I can explain how one call-site dispatches to a different method body per element in a mixed
      `list[Base]`. (co-10)
- [ ] I can explain why an incomplete `abc.ABC` subclass fails at instantiation time, not at the
      first call to the missing method. (co-11)
- [ ] I can write a `typing.Protocol` and explain what it adds on top of plain duck typing. (co-12)
- [ ] I can explain why `Stack(list)` leaks the wrong interface and how composition fixes it. (co-13)
- [ ] I can predict the mutable-class-attribute bug from a class body alone, without running the
      code. (co-14)
- [ ] I can explain the difference between `@classmethod` and `@staticmethod`, and why only one can
      return the correct subclass type from a factory. (co-15)
- [ ] I can explain what a double leading underscore actually does to an attribute name, and predict
      the resulting mangled name. (co-16)
- [ ] I can explain why validating an invariant only in `__init__` is not sufficient, and name every
      other entry point that needs the same check. (co-17)
- [ ] I can explain, in one sentence, why bundling state with the operations that guard it is the
      core idea this whole topic teaches. (`taming-state`)
- [ ] I can explain, in one sentence, why composition keeps coupling narrower than inheritance does.
      (`coupling-vs-cohesion`)

## Elaborative interrogation & self-explanation

Six why/why-not prompts. Answer each in your own words before opening the model explanation.

**E1.** Why does Python disable the default `__hash__` the moment a class defines `__eq__` alone,
instead of just leaving the original identity-based `__hash__` in place?

<details>
<summary>Model explanation</summary>

The eq/hash contract requires that two objects comparing equal must also hash equal -- otherwise a
`set` or `dict` could hold two "equal" entries that a lookup can never find each other through,
because they land in different hash buckets. The default, identity-based `__hash__` hashes by object
address, which is completely inconsistent with any custom `__eq__` that compares by value: two
distinct `Money(500, "USD")` objects would be `==` but hash differently. Rather than silently ship a
broken contract, Python disables the default hash entirely the moment `__eq__` is overridden, forcing
the class author to either declare the type genuinely unhashable (by omission) or supply a consistent
`__hash__` explicitly (Example 34) -- which is exactly `taming-state`: making it structurally
impossible for the eq/hash invariant to quietly drift out of sync.

</details>

**E2.** Why does `abc.ABC` reject instantiation at construction time, rather than only failing later
when the missing abstract method is actually called?

<details>
<summary>Model explanation</summary>

Failing at the first actual call to a missing method means the bug surfaces far from where it was
introduced -- potentially deep inside unrelated code, long after the incomplete class was defined.
`abc.ABC` moves that feedback to the earliest possible moment: the instant `Square(3.0)` runs,
Python already knows every abstract method the class was required to implement and can check the
full list immediately, reporting exactly which one is missing (Example 60). This is a direct instance
of `taming-state` applied to a class's own definition, not just its instance data: an incomplete
`Shape` implementation is treated as an invalid state the type system itself refuses to let exist,
rather than a runtime landmine waiting to be stepped on later.

</details>

**E3.** Why does subclassing `list` directly (`class Stack(list[int])`) count as a design smell, even
though it is less code than the composition-based fix?

<details>
<summary>Model explanation</summary>

Inheritance is an all-or-nothing relationship: `Stack(list[int])` inherits every single method `list`
defines, whether or not any of them make sense for a stack's contract. `insert(0, 99)` genuinely
breaks the "push/pop at one end only" guarantee a stack promises, and there is no way to selectively
un-inherit just that one method (Example 65). Composition (Example 66) trades a few extra lines of
delegation for the ability to expose exactly the methods that belong, and none that don't -- this is
`coupling-vs-cohesion` directly: the composed `Stack` is more narrowly coupled to `list` (only
`append`/`pop` are ever called on it internally) and more cohesive as a type (every public method it
exposes genuinely belongs to "being a stack").

</details>

**E4.** Why does Python's name mangling rewrite `self.__pin` to `self._Wallet__pin` instead of
making the attribute genuinely, unconditionally private the way some other languages do?

<details>
<summary>Model explanation</summary>

Python's "we're all consenting adults" design philosophy deliberately trades compiler-enforced
privacy for convention plus a narrower, more surgical mechanism: name mangling exists primarily to
avoid accidental name collisions between a base class's private attribute and a subclass's own
attribute of the same name, not to make an attribute truly unreachable from outside (Example 19). A
single leading underscore (`_balance`) already communicates "internal, don't touch" to every reader;
`__pin`'s mangling adds one more layer specifically for the subclass-collision case, while still
leaving `obj._Wallet__pin` technically reachable for a determined (and clearly rule-breaking) caller.

</details>

**E5.** Why is validating an invariant only inside `__init__` a genuinely incomplete implementation
of "this object can never be invalid," rather than merely a stylistic gap?

<details>
<summary>Model explanation</summary>

An invariant is a claim about every state the object can ever be in, not just the state it starts
in. If a setter or a mutating method can push `celsius` below absolute zero after construction, the
class never actually enforced "always valid" -- it enforced "valid at the one moment `__init__`
happened to run" (Kata 7). `taming-state` requires closing every path that changes state, not just
the most obvious one: `__init__`, `__post_init__`, every property setter, and every method that
mutates state all need the identical check (Examples 16-17, 30, 52, 71, 77), which is exactly why
Example 80's property-based test throws hundreds of randomized inputs at the same invariant --
a couple of hand-picked test cases only prove the paths a test author happened to think of, not every
path that actually exists.

</details>

**E6.** Why does a `@classmethod` factory need `cls()` instead of the class's own literal name to
correctly support subclassing, when both spellings look nearly identical in the method body?

<details>
<summary>Model explanation</summary>

`cls` is the one piece of information a `@classmethod` receives that a `@staticmethod` or a
module-level function cannot: exactly which class the method was actually called on, whether that is
`Animal` itself or some subclass like `Cat` several levels down (Examples 47, 49). Writing `Animal()`
literally discards that information and always builds the same fixed class, no matter which subclass
the method was invoked through (Kata 8) -- `cls()` is what makes a factory method genuinely
subclass-aware, and it is the exact mechanism this topic's capstone payment methods rely on
implicitly by never hardcoding a concrete class where an interface or `cls` would do instead.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) · Next:
[Project Management](../../project-management/learning/overview.md) →
