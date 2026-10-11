---
title: "Overview"
date: 2026-07-17T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Functional Programming topic: five fixed drills
that force active recall instead of passive re-reading. Work through them in order -- short-answer
recall first, then scenario judgment, then hands-on repetition, then a checklist to confirm real
automaticity, and finally why/why-not prompts that test whether you can explain the reasoning, not
just execute the syntax. Every answer is hidden in a `<details>` block; try each item yourself before
opening it. Together, the five drills below touch every one of this topic's 28 concepts and cite
specific examples spanning all 80 worked examples in the Beginner, Intermediate, and Advanced tiers,
plus the capstone.

## Recall Q&A

Twenty-eight short-answer questions, one per concept. Answer from memory before opening each answer.

**Q1 (co-01 -- Pure Functions).** What does it mean for a function to be pure, and what does that
buy the caller?

<details>
<summary>Answer</summary>

A pure function's output depends ONLY on its arguments, and it produces no observable side effect --
no mutating an argument, no writing to a global, no printing, no touching a file or the network. Call
it twice with the same arguments and it always gives the same result, which makes it trivially safe to
call twice, safe to call from multiple threads, and easy to test with nothing but its arguments and its
return value (Example 1 contrasts `add_pure` against `add_impure`; Example 58 property-tests purity
itself across 200 generated inputs).

</details>

**Q2 (co-02 -- Side Effects and the Purity Boundary).** What exactly counts as a side effect, and why
does naming the purity boundary matter?

<details>
<summary>Answer</summary>

A side effect is anything a function does besides computing and returning a value -- printing, mutating
an argument the caller can see, writing a file, incrementing state outside the function's own scope.
Naming exactly where that boundary sits is a design decision, not an accident: a codebase that never
draws it lets side effects creep in anywhere, which is precisely what makes large imperative code hard
to test (Example 1's impure twin mutates a global as its side effect; Example 3 classifies three
functions and confirms only the pure one is flagged pure).

</details>

**Q3 (co-03 -- Referential Transparency).** What does "referentially transparent" mean concretely, and
what does it let a reader do?

<details>
<summary>Answer</summary>

A call is referentially transparent if it can be replaced by its own return value anywhere in the
program without changing what the program does -- `add(2, 3)` can always be replaced by `5`. This is
what makes equational reasoning possible: a reader can simplify an expression by substituting a call for
its value the same way they simplify algebra, without tracing side effects to check the substitution is
safe (Example 2 replaces a call with its literal value inside a larger expression and confirms the
output is unchanged).

</details>

**Q4 (co-04 -- Immutability).** Name two of this topic's stdlib tools for immutable data, and state
why "an object nobody can mutate" is valuable.

<details>
<summary>Answer</summary>

`tuple` and `frozenset` are built-in immutable containers; `@dataclass(frozen=True)` makes a custom
record immutable, raising `FrozenInstanceError` on an attempted attribute set; `types.MappingProxyType`
wraps a `dict` in a read-only view. An object nobody can mutate is always safe to hand to another
function, another thread, or another part of the codebase -- there is no way for that code to corrupt
what the caller still holds a reference to (Example 4 catches a `TypeError` on tuple mutation; Example 5
shows a frozen dataclass rejecting an attribute set).

</details>

**Q5 (co-05 -- Persistent Data and Structural Sharing).** What makes a data structure "persistent," and
why does structural sharing matter for its cost?

<details>
<summary>Answer</summary>

A persistent data structure keeps every old version reachable after an "update," because the update
never mutates anything -- it builds a new version that shares whatever structure didn't change with the
old one. Structural sharing is what makes immutability affordable: without it, every update would have
to deep-copy the entire structure, which is both slow and memory-hungry; sharing the unchanged parts can
keep an update as cheap as O(1) (Example 7's cons-list prepend; Example 59's persistent binary tree
update confirms the old root stays intact).

</details>

**Q6 (co-06 -- First-Class Functions).** What does it mean for functions to be "ordinary values" in
Python, and what does that make possible?

<details>
<summary>Answer</summary>

Functions in Python can be assigned to a variable, stored in a list or dict, passed as an argument, and
returned from another function, all without special syntax. Once functions are values, behavior itself
becomes something you can pass around, store, and compose -- the seed that higher-order functions,
closures, currying, composition, and decorators all grow from (Example 8 assigns a function to a
variable and calls through it; Example 9 stores several functions in a list and calls each in turn).

</details>

**Q7 (co-07 -- Higher-Order Functions).** What is a higher-order function, and what does it let you
factor apart from what?

<details>
<summary>Answer</summary>

A higher-order function takes another function as an argument, returns one, or both -- `apply(fn, x)`
returning `fn(x)` works identically whether `fn` doubles, squares, or does something else entirely,
because `apply` never needs to know what `fn` actually does. This factors "the shape of the computation"
apart from "what specifically happens at each step," the mechanism underneath decorators and
`map`/`filter`/`reduce` (Example 10's `apply(fn, x)` verified against two different functions).

</details>

**Q8 (co-08 -- Closures for Configuration).** What does a closure capture, and how is that different
from a parameter passed in fresh on every call?

<details>
<summary>Answer</summary>

A closure captures a variable from its enclosing scope and keeps using that captured value even after
the enclosing function has returned -- `multiplier(3)` returns a function that remembers `3` forever, so
`multiplier(3)(4)` multiplies by the captured `3`, not by something threaded through fresh each call.
This lets you "bake in" configuration once and get back a specialized function (Example 12's closure
captures a threshold; Example 32 contrasts a stateful closure counter against a pure fold, naming
exactly where each one's state lives).

</details>

**Q9 (co-09 -- Currying).** What does currying do to an n-argument function, and how is it distinct
from partial application (co-10)?

<details>
<summary>Answer</summary>

Currying turns an n-argument function into a chain of one-argument functions -- `add(a, b)` becomes
`add(a)(b)`, where `add(a)` returns a new one-argument function waiting for `b`. Currying is ALWAYS one
argument at a time by construction, while `functools.partial` can fix any number of arguments at once
in a single call (Example 17 hand-curries a 2-argument function; Example 62's `@curry` decorator
auto-curries by counting a function's arity).

</details>

**Q10 (co-10 -- Partial Application).** What does `functools.partial` do, and why reach for it over a
hand-written wrapping lambda?

<details>
<summary>Answer</summary>

Partial application fixes some of a function's arguments right now and returns a smaller function
waiting for the rest -- `functools.partial(pow, 2)` fixes the base at `2` and returns a one-argument
function computing `2**n`, no lambda or manual closure required. It is more discoverable to a reviewer
and composes cleanly with `functools.reduce` and decorator pipelines elsewhere in this topic (Example 18
verified to compute `2**n`; Example 33 chains several `partial` calls into a composed transform).

</details>

**Q11 (co-11 -- Function Composition).** What does `compose(f, g)` actually compute, and in what
order do `f` and `g` run?

<details>
<summary>Answer</summary>

`compose(f, g)` builds a new function so that calling it on `x` runs `g(x)` FIRST and feeds its result
into `f` -- it computes exactly `f(g(x))`, right-to-left relative to how the call is written. This is how
small, single-purpose functions become a pipeline without being fused into one large function body, each
piece staying independently testable (Example 19 verified to compute `f(g(x))`; Example 34's
`compose(*fns)` folds a whole list of functions with the application order verified).

</details>

**Q12 (co-12 -- Pipe Utilities).** How does `pipe(x, f, g)` differ from `compose(f, g)` in what it
reads like, given that both can compute the same thing?

<details>
<summary>Answer</summary>

`pipe(x, f, g)` reads left-to-right in the order it actually executes -- "start with `x`, apply `f`,
then apply `g`" -- instead of the inside-out reading order nested calls (or `compose`) require. `pipe`
and `compose` can compute the identical thing; the difference is purely a readability trade for a chain
of more than two or three steps (Example 20's `pipe(x, f, g)` verified equal to the nested-call
equivalent; Example 74 directly contrasts a deep `pipe` chain against nested calls on real data).

</details>

**Q13 (co-13 -- Map, Filter, Reduce).** Which loop pattern does each of `map`, `filter`, and `reduce`
replace, and why does recognizing that matter?

<details>
<summary>Answer</summary>

`map` applies a function to every element (replacing a "transform each item" loop), `filter` keeps only
the elements a predicate accepts (replacing a "collect matching items" loop), and `reduce` folds a
sequence to one accumulated value (replacing an "initialize then mutate a running total" loop). Together
they cover the overwhelming majority of "loop over a collection and do something" code without a single
mutable accumulator variable exposed to the caller (Example 13's `map`; Example 14's `filter`; Example
15's `reduce`; Example 37 chains all three for a data summary).

</details>

**Q14 (co-14 -- Recursion and Python's Missing TCO).** What specific limit does CPython's lack of
tail-call optimization put on deep recursion, and what are the two standard workarounds?

<details>
<summary>Answer</summary>

CPython, by explicit design choice, performs NO tail-call optimization -- a deeply recursive call still
grows the call stack one frame per call and eventually raises `RecursionError`, unlike languages that
optimize a self-tail-call into a loop automatically. The two standard workarounds are an explicit stack
or a trampoline (Example 44 converts a deep recursion into an explicit stack; Example 66 builds a
trampoline and verifies a deep recursion completes without ever raising `RecursionError`).

</details>

**Q15 (co-15 -- Lazy Evaluation and Generators).** What does "lazy" mean concretely for a Python
generator, and what does that make possible that an eager list cannot do?

<details>
<summary>Answer</summary>

A generator computes a value only when it is actually needed -- a generator expression builds no list
at all, and each value is produced on demand, one `next()` call at a time. That is what makes an
infinite sequence (like `itertools.count()`) usable in the first place, and it lets a pipeline over a
sequence of unknown or infinite size run without ever materializing that sequence in memory (Example 21
shows only pulled values are computed; Example 63 builds a lazy, infinite prime sieve).

</details>

**Q16 (co-16 -- The itertools Toolkit).** Name three `itertools` functions this topic uses, and what
do they all have in common?

<details>
<summary>Answer</summary>

`islice` takes a slice of any iterable (including an infinite one) without materializing it, `chain`
concatenates iterables, `accumulate` produces running totals, `groupby` groups consecutive equal keys,
`tee` splits one iterator into several independent ones, and `pairwise` yields consecutive element
pairs. Every one of them is itself lazy -- none build an intermediate list (Example 23 uses `islice`
over an infinite `count()`; Example 39 verifies prefix sums via `accumulate`).

</details>

**Q17 (co-17 -- Memoization).** Why is memoization only safe to apply to a PURE function, specifically?

<details>
<summary>Answer</summary>

Memoization caches a function's results keyed by its arguments, so a repeated call with the same
arguments returns the cached result instead of recomputing it -- which is only safe because the function
being cached is pure (co-01). Caching an impure function's result would silently return a stale value
(and any stale side effect) forever after the first call, even after whatever the function actually
depends on has changed (Example 25 puts `@lru_cache` on a recursive `fib` and confirms `cache_info()`
shows hits; Kata 8 reproduces the stale-cache bug directly by memoizing an impure lookup).

</details>

**Q18 (co-18 -- Decorators as Higher-Order Functions).** What is `@log_calls` on `def greet(): ...`
exactly equivalent to, spelled without the `@` syntax?

<details>
<summary>Answer</summary>

`@log_calls` on `def greet(): ...` is exactly `greet = log_calls(greet)` -- a decorator is a
higher-order function that takes a function and returns a wrapped replacement. Decorators let you attach
cross-cutting behavior (logging, caching, retrying, timing) to a function without touching that
function's own body, and `functools.wraps` preserves the wrapped function's `__name__` and metadata so
introspection still sees the original identity (Example 26 wraps a function with a logging decorator;
Example 43 confirms `functools.wraps` preserves `__name__`).

</details>

**Q19 (co-19 -- Point-Free Style).** What does "point-free" refer to, and what is the topic's stance
on how far to take it?

<details>
<summary>Answer</summary>

Point-free style expresses a transformation by composing functions together without ever naming the
argument the data flows through -- a pipeline built entirely from `compose`/`pipe` calls has no
`lambda x: ...` anywhere, because the "point" (the argument) is never explicitly written. This topic
treats it as one more tool, not a stylistic mandate -- taken too far it can obscure what's actually
happening (Example 35 rewrites a lambda pipeline point-free and confirms identical output; Example 73
builds a small point-free combinator library).

</details>

**Q20 (co-20 -- Algebraic Data Types in Python).** How does an ADT built from a union of frozen
dataclasses make illegal states unrepresentable?

<details>
<summary>Answer</summary>

`Circle | Square` (PEP 604 union syntax) says a `Shape` is EITHER a `Circle` or a `Square`, each
carrying only the fields relevant to that variant -- there is no way to construct a `Circle` with a
`side_length` field, because that field doesn't exist on `Circle` at all. This is a stronger guarantee
than one class with nullable fields, where nothing stops a `Circle` instance from also carrying a stray
field that means nothing (Example 45 models a shape as a union of frozen dataclasses and verifies each
variant).

</details>

**Q21 (co-21 -- Structural Pattern Matching).** What is the ONE fact to hold onto about Python's
`match`/`case` exhaustiveness, and how do you defend against it yourself?

<details>
<summary>Answer</summary>

Python's `match`/`case` (PEP 634) has NO compile-time exhaustiveness checking at the language level --
an unmatched value simply falls through with no error unless the developer adds an explicit wildcard
`case _` and raises there themselves. (A static type checker like pyright CAN flag a non-exhaustive
match over a fully-known closed union as a best-effort heuristic, but CPython itself enforces nothing at
runtime.) (Example 46 matches over the `Circle | Square` ADT with an explicit note on this gap; Kata 7
reproduces the silent fall-through directly by omitting both the new variant's case and the wildcard.)

</details>

**Q22 (co-22 -- The Option/Maybe Type).** What does a hand-rolled `Option` force the caller to do that
a bare `Optional[int]` return type does not?

<details>
<summary>Answer</summary>

A function returning `Optional[int]` still lets a caller forget the `None` check and crash later with a
"`NoneType` has no attribute" error, far from where the `None` actually originated. An `Option`-returning
function (`Some`/`Nothing`, hand-rolled and stdlib-only) forces the caller to unwrap the result
explicitly (or `map` through it), turning a possible runtime crash into a type-level obligation the
caller cannot silently skip (Example 48 builds `Some`/`Nothing` with `map`; Example 49 chains
`Option`-returning lookups and confirms short-circuit on the first miss).

</details>

**Q23 (co-23 -- The Result/Either Type).** What does a `Result` return type make visible to a caller
that an exception-raising function's signature does not?

<details>
<summary>Answer</summary>

`def parse(s: str) -> int` tells a caller nothing about whether it can raise; `def parse(s: str) ->
Result[int, str]` states the failure mode directly in the type the caller sees at the call site, without
reading the implementation. This makes failure an ordinary value you can `map` over, compose, and
inspect, instead of a special control-flow mechanism that unwinds the stack (Example 50 carries an error
as a value through a hand-rolled `Ok`/`Err`; Example 51 confirms a `Result` chain stops at the first
`Err`).

</details>

**Q24 (co-24 -- Railway-Oriented Error Handling).** What does railway-oriented programming replace,
and what handles the short-circuiting behavior instead?

<details>
<summary>Answer</summary>

Railway-oriented programming threads a `Result` through a pipeline of steps, replacing a pyramid of
nested `if err != nil` checks (or scattered `try`/`except` blocks) with a single linear chain that reads
top-to-bottom. The short-circuiting is handled once, by the `Result` type's own `and_then`/`map`
machinery, instead of being re-implemented by hand at every step (Example 52's validation pipeline
confirms one bad field short-circuits the rest; Kata 9 reproduces the crash that results when a
hand-written `and_then` skips checking for `Err` before calling the next step).

</details>

**Q25 (co-25 -- Functor Intuition).** What is the functor identity law, and what does it state
concretely about `map`?

<details>
<summary>Answer</summary>

The functor identity law states `container.map(identity) == container` -- mapping the identity function
over a container changes nothing but confirms `map` genuinely just "applies this function to whatever's
inside, however many things that is" (zero, one, or many), the exact same idea whether the container is
a `list`, `Some`, or `Nothing`. Recognizing the functor pattern lets you transfer intuition about list
`map` directly onto `Option`, `Result`, and any wrapped-value type you build (Example 53 shows the
identity law by example; Example 70 property-tests the identity and composition laws together).

</details>

**Q26 (co-26 -- Applicative Intuition).** What can an applicative combine that a plain `map`/functor
cannot, on its own?

<details>
<summary>Answer</summary>

`map`/functor only handles a function of ONE wrapped argument; an applicative is the natural next step
for combining SEVERAL independently-wrapped values with a multi-argument function --
`map2(add, Some(2), Some(3))` unwraps both `Option`s, calls `add(2, 3)`, and wraps the result back up as
`Some(5)`, short-circuiting to `Nothing` if either input is absent (Example 55's `map2` combines two
`Option`s; Example 71 builds an applicative that accumulates every validation error instead of stopping
at the first one).

</details>

**Q27 (co-27 -- Monad Intuition).** Why can't `map` alone chain functions that each return an
already-wrapped value, and what does `bind`/`and_then` add?

<details>
<summary>Answer</summary>

`map` applied to a function that itself returns a wrapped value produces a nested wrapper --
`Ok(5).map(lambda x: Ok(x + 1))` would give `Ok(Ok(6))`, not `Ok(6)`. `bind` (also called `and_then` or
`flat_map`) is the extra piece that flattens the result instead: `Ok(5).and_then(lambda x: Ok(x + 1))`
correctly returns `Ok(6)` (Example 51's `and_then` on `Result`; Example 72 shows left-identity,
right-identity, and associativity by example, the three monad laws made concrete).

</details>

**Q28 (co-28 -- Functional Core, Imperative Shell).** What does a functional-core/imperative-shell
split quarantine, and why does the core need no mocking to test?

<details>
<summary>Answer</summary>

A functional-core/imperative-shell design splits a program into a pure transformation core (parse,
transform, aggregate -- no I/O anywhere) surrounded by a thin imperative shell that holds every effect
(reading a file, writing output, talking to a network). The core is tested directly with no mocking,
because it has nothing to mock -- it is the same purity-boundary idea from co-02, made into a concrete
architectural pattern (Example 57 splits a CSV analyzer into a pure core and an I/O shell; Kata 10
reproduces a debug `print()` that leaks I/O into what was meant to be the pure core).

</details>

## Applied problems

Ten scenarios. Each describes a symptom without naming the concept -- decide which one applies, then
check.

**AP1.** A function has no `print` statements, mutates no arguments, and returns a value -- yet calling
it twice with the exact same arguments produces two different results, because internally it reads
`random.random()` to decide part of its output.

<details>
<summary>Answer</summary>

This is a purity violation (co-01, co-02) -- purity requires the OUTPUT to depend only on the
arguments, and reading ANY external, non-deterministic, or mutable state (not just writing to it) breaks
that guarantee just as thoroughly as printing or mutating an argument would (Example 1; Example 3; Kata
1's mutation-based variant of the same "hidden dependency" family).

</details>

**AP2.** A caller passes a `tuple` of settings into a function that reuses the SAME tuple safely across
three different threads, but a code reviewer objects that a `list` was used for the exact same purpose
in a sibling module and later blamed for a hard-to-reproduce bug.

<details>
<summary>Answer</summary>

This is an immutability question (co-04) -- a `tuple` cannot be mutated after construction, so handing
it to three threads is safe by construction; a `list` handed the same way is an accident waiting to
happen, because ANY of the three threads (or any other code holding the reference) can mutate it out
from under the others (Example 4; Kata 2's `dataclasses.replace` shows the safe way to "update" an
immutable record instead of mutating it in place).

</details>

**AP3.** Three UI validators are built inside a loop, one per configured threshold, and stored in a list
to call later -- but when they are all called afterward, EVERY one of them enforces the SAME threshold:
the last one in the loop.

<details>
<summary>Answer</summary>

This is closure late binding (co-08) -- a closure captures the VARIABLE, not a frozen snapshot of its
value at closure-creation time. By the time any of the three lambdas is called, the loop variable has
already reached its final value, and all three see that same final value; binding it as a default
argument at each iteration is the fix (Example 11; Example 12; Kata 3).

</details>

**AP4.** A three-step transform pipeline is built by composing three small functions, and the pipeline
PASSES its own unit tests (each step function tested in isolation), but the end-to-end output is wrong
-- inspection shows the steps ran in the opposite order the developer intended.

<details>
<summary>Answer</summary>

This is a composition-ordering mistake (co-11, co-12) -- `compose(f, g)` applies `g` FIRST then `f`
(right-to-left, mathematical convention), while `pipe(x, f, g)` applies `f` first then `g` (left-to-right,
reading order). Reaching for the wrong helper silently reverses execution order even though every
individual step is correct in isolation (Example 19; Example 20; Kata 4).

</details>

**AP5.** A `reduce`-based helper that tallies word frequency across a document works correctly on the
FIRST document ever passed to it in a test run, but on a SECOND, unrelated document it returns totals
that are visibly too high, as if it remembered the previous document's counts.

<details>
<summary>Answer</summary>

This is a mutable-default-argument leak (co-04, co-13) -- a mutable default argument (`counts={}`) is
created ONCE, at function-definition time, and every call that omits the argument shares that SAME dict
object. The `reduce` logic itself is correct; it is the accumulator it folds into that leaks across
calls (Example 15; Example 36; Kata 5).

</details>

**AP6.** A generator built to stream values from a large computed sequence is passed to one function
that sums the values, and then passed AGAIN to a second function that expects to also print each value
-- but the second function silently receives nothing at all, and no exception is ever raised.

<details>
<summary>Answer</summary>

This is generator exhaustion (co-15) -- a generator is a single-use, statefully-exhausted iterator; once
fully consumed by the sum, there is nothing left to yield on a second pass, and Python raises nothing to
flag the mistake, it simply produces an empty iteration (Example 21; Example 22; Kata 6).

</details>

**AP7.** A new variant is added to an existing closed set of dataclasses that form an ADT, and the
`match`/`case` evaluator that walks it keeps running without any error -- but silently returns `None`
for every value of the new variant, instead of the value the codebase actually expects.

<details>
<summary>Answer</summary>

This is `match`/`case`'s missing runtime exhaustiveness check (co-20, co-21) -- Python does not warn or
error at the LANGUAGE level when a `match` block fails to cover every variant of a closed union; an
unmatched value simply falls through, and with no explicit `case _:` raising an error, that fall-through
looks like a legitimate result instead of a caught bug (Example 45; Example 46; Example 67; Kata 7).

</details>

**AP8.** A price-lookup function is decorated with `@lru_cache` to "make it faster," and the very first
call after deployment returns the right price -- but every call for the rest of the process's lifetime
keeps returning that SAME first price, even after the underlying price table is updated at runtime.

<details>
<summary>Answer</summary>

This is memoization applied to an impure function (co-17, co-01) -- `lru_cache` is only safe on a
function whose result depends ONLY on its arguments; this function secretly reads a mutable,
externally-updated dict, so caching its result the first time freezes a value that was only ever correct
at that one instant (Example 25; Example 41; Kata 8).

</details>

**AP9.** A validation pipeline threading a hand-rolled `Result` type is supposed to stop at the FIRST
failing step and report only that one error, but a bug report shows it instead crashes with an unrelated
`AttributeError` deep inside a LATER step, on a value that was never a legitimate success in the first
place.

<details>
<summary>Answer</summary>

This is railway-oriented error handling done incorrectly (co-22, co-23, co-24) -- a correct
`and_then`/`bind` chain checks whether the PREVIOUS step returned `Ok`/`Some` before ever calling the
next step's function. Skip that check, and the next step receives the raw `Err`/`Nothing` wrapper as if
it were a success value; calling success-shaped code on it crashes instead of cleanly short-circuiting
(Example 51; Example 52; Kata 9).

</details>

**AP10.** A function named `analyze_report` is described in code review as "the pure core" of a small
tool, but the reviewer notices it cannot be unit-tested without redirecting `sys.stdout`, because it has
a debug `print()` statement buried three lines into its body.

<details>
<summary>Answer</summary>

This is a functional-core/imperative-shell boundary violation (co-28, co-02) -- a function that performs
I/O (even just a diagnostic `print`) is, by definition, no longer part of the pure core. The moment a
test needs to capture or redirect output to verify behavior, that is the signal the boundary has been
drawn in the wrong place, and the print call belongs in the imperative shell instead (Example 57;
Example 76; Kata 10).

</details>

## Code katas

Ten hands-on repetition drills. Each is a before/after `.py` file colocated under `drilling/code/`.
Every "before" script is a real, runnable Python program that misapplies the concept being drilled --
run it yourself, diagnose the bug from the observed behavior, fix it from memory, then compare your fix
against the "after" script and the model solution before checking your work against the
actually-executed output shown. Every kata script, both before and after, is fully type-annotated and
`pyright --strict` clean.

### Kata 1 -- purity: a function that looks pure secretly mutates its input

_relates to co-01, co-02, Example 1_

**Task.** `apply_discount(cart, rate)` should return a discounted cart WITHOUT changing the caller's
own list. The version below is broken: it mutates each `CartItem` in place, so calling it twice
compounds the discount onto itself instead of applying a fresh one each time.

**Before** (`drilling/code/kata-01-hidden-mutation-breaks-purity/before/kata.py`)

```python
"""Kata 1 (before): purity violation -- a function that looks pure secretly mutates its input."""

from dataclasses import dataclass


@dataclass  # => NOT frozen -- a mutable record, which is exactly what makes the bug below possible
class CartItem:
    name: str
    price: float


def apply_discount(cart: list[CartItem], rate: float) -> list[CartItem]:
    for item in cart:
        item.price *= rate  # SMELL: mutates each CartItem IN PLACE -- the caller's own data changes
    return cart


cart = [CartItem("pen", 10.0), CartItem("mug", 20.0)]
first_pass = apply_discount(cart, 0.9)
second_pass = apply_discount(cart, 0.9)  # meant to apply a FRESH 0.9 discount a second time
print([item.price for item in second_pass])
print(first_pass is second_pass)  # BUG: same object -- the discount compounded onto itself
```

**Observed (buggy) output** (captured by actually running the script above):

```text
[8.1, 16.2]
True
```

**After** (`drilling/code/kata-01-hidden-mutation-breaks-purity/after/kata.py`)

```python
"""Kata 1 (after): purity fix -- builds and returns NEW records, the caller's input is never touched."""

from dataclasses import dataclass, replace


@dataclass  # => still a plain mutable record -- the FIX is in apply_discount, not the type
class CartItem:
    name: str
    price: float


def apply_discount(cart: list[CartItem], rate: float) -> list[CartItem]:
    return [replace(item, price=item.price * rate) for item in cart]  # => new CartItem per element


cart = [CartItem("pen", 10.0), CartItem("mug", 20.0)]
first_pass = apply_discount(cart, 0.9)
second_pass = apply_discount(cart, 0.9)  # cart itself was never mutated, so this is a FRESH discount
print([item.price for item in second_pass])
print(first_pass is second_pass)  # different objects, and cart's own prices are untouched
```

<details>
<summary>Model solution</summary>

**Root cause**: `item.price *= rate` mutates the SAME `CartItem` objects the caller's `cart` list
holds references to. Two calls to `apply_discount` therefore compound: the second call discounts the
ALREADY-discounted prices, not the originals. Building a brand-new `CartItem` per element (via
`dataclasses.replace`) means the function only ever reads the input, never writes to it.

**Run**: `python3 kata.py`

**Output**:

```text
[9.0, 18.0]
False
```

</details>

### Kata 2 -- immutability: direct attribute assignment on a frozen dataclass

_relates to co-04, co-05, Example 5_

**Task.** `RetryConfig` is a frozen dataclass, so "updating" `retries` by direct assignment should be
impossible. The version below is broken: it tries anyway, and the program crashes instead of producing
an updated config.

**Before** (`drilling/code/kata-02-frozen-dataclass-replace/before/kata.py`)

```python
"""Kata 2 (before): immutability violation -- direct attribute assignment on a frozen dataclass."""

from dataclasses import dataclass


@dataclass(frozen=True)
class RetryConfig:
    retries: int
    timeout_seconds: float


config = RetryConfig(retries=1, timeout_seconds=5.0)
config.retries = 5  # type: ignore[misc]  # BUG: frozen dataclasses reject assignment -- raises at runtime
print(config)
```

**Observed (buggy) output** (captured by actually running the script above -- an uncaught crash):

```text
Traceback (most recent call last):
  ...
dataclasses.FrozenInstanceError: cannot assign to field 'retries'
```

**After** (`drilling/code/kata-02-frozen-dataclass-replace/after/kata.py`)

```python
"""Kata 2 (after): immutability fix -- dataclasses.replace() builds a NEW record, never mutates."""

from dataclasses import dataclass, replace


@dataclass(frozen=True)
class RetryConfig:
    retries: int
    timeout_seconds: float


config = RetryConfig(retries=1, timeout_seconds=5.0)
updated_config = replace(config, retries=5)  # => a NEW RetryConfig, config itself is untouched
print(config)
print(updated_config)
```

<details>
<summary>Model solution</summary>

**Root cause**: a frozen dataclass overrides `__setattr__` to reject any assignment after
`__init__`, at RUNTIME -- `# type: ignore[misc]` only silences pyright's static warning, it does not
change what the program does when actually run. `dataclasses.replace(config, retries=5)` is the correct
"update": it builds a NEW instance with the named fields overridden, leaving `config` itself completely
untouched.

**Run**: `python3 kata.py`

**Output**:

```text
RetryConfig(retries=1, timeout_seconds=5.0)
RetryConfig(retries=5, timeout_seconds=5.0)
```

</details>

### Kata 3 -- closures: every closure in the list captures the SAME loop variable

_relates to co-08, Example 11, Example 12_

**Task.** Three validators, one per threshold in `[10, 20, 30]`, should each enforce a DIFFERENT
threshold. The version below is broken: all three closures capture the SAME loop variable `t`, so by
the time any of them is called, `t` has already reached its final value.

**Before** (`drilling/code/kata-03-closure-late-binding/before/kata.py`)

```python
"""Kata 3 (before): closure violation -- every closure in the list captures the SAME loop variable."""

from typing import Callable

thresholds = [10, 20, 30]
validators: list[Callable[[int], bool]] = []
for t in thresholds:
    validators.append(lambda x: x > t)  # SMELL: captures the VARIABLE t, not its value at this point

print([v(15) for v in validators])  # every validator should differ; watch what actually happens
```

**Observed (buggy) output** (captured by actually running the script above):

```text
[False, False, False]
```

**After** (`drilling/code/kata-03-closure-late-binding/after/kata.py`)

```python
"""Kata 3 (after): closure fix -- a default argument binds EACH closure's own value at creation time."""

from typing import Callable

thresholds = [10, 20, 30]
validators: list[Callable[[int], bool]] = []
for t in thresholds:
    validators.append(lambda x, t=t: x > t)  # => t=t binds THIS iteration's value, not the variable

print([v(15) for v in validators])  # each validator now uses its own captured threshold
```

<details>
<summary>Model solution</summary>

**Root cause**: a closure captures the ENCLOSING VARIABLE, not a snapshot of its value at the moment
the lambda is defined. By the time `validators` is actually called (after the loop finishes), `t` holds
its LAST value (`30`) for all three lambdas equally. `lambda x, t=t: x > t` works because Python
evaluates a default-argument expression exactly ONCE, at the moment THAT lambda is created -- binding
each closure's own `t=t` default to that iteration's value permanently.

**Run**: `python3 kata.py`

**Output**:

```text
[True, False, False]
```

</details>

### Kata 4 -- composition: compose() runs right-to-left, not the intended reading order

_relates to co-11, co-12, Example 19, Example 20_

**Task.** `transform(5)` should compute "add one, THEN double" -- `(5 + 1) * 2 = 12`. The version
below is broken: `compose(add_one, double)` reads left-to-right like a `pipe` call, but `compose` itself
runs its SECOND argument first.

**Before** (`drilling/code/kata-04-compose-vs-pipe-order/before/kata.py`)

```python
"""Kata 4 (before): composition-order bug -- compose() runs right-to-left, not the intended order."""

from typing import Callable


def compose(f: Callable[[int], int], g: Callable[[int], int]) -> Callable[[int], int]:
    return lambda x: f(g(x))  # => g runs FIRST, then f -- right-to-left, mathematical convention


def add_one(x: int) -> int:
    return x + 1


def double(x: int) -> int:
    return x * 2


# INTENT: "add one, THEN double" -- reading compose(add_one, double) left to right like a pipe call.
transform = compose(add_one, double)  # SMELL: reads left-to-right but compose runs right-to-left
result = transform(5)  # BUG: double(5) runs FIRST giving 10, then add_one gives 11 -- not (5+1)*2=12
print(result)
```

**Observed (buggy) output** (captured by actually running the script above):

```text
11
```

**After** (`drilling/code/kata-04-compose-vs-pipe-order/after/kata.py`)

```python
"""Kata 4 (after): composition-order fix -- pipe() runs left-to-right, matching the reading order."""

from functools import reduce
from typing import Callable


def pipe(x: int, *fns: Callable[[int], int]) -> int:
    return reduce(lambda acc, fn: fn(acc), fns, x)  # => applies fns in ORDER, left to right


def add_one(x: int) -> int:
    return x + 1


def double(x: int) -> int:
    return x * 2


# INTENT: "add one, THEN double" -- pipe(5, add_one, double) reads AND runs left to right.
result = pipe(5, add_one, double)  # => add_one(5)=6 runs first, then double(6)=12
print(result)
```

<details>
<summary>Model solution</summary>

**Root cause**: `compose(f, g)` computes `f(g(x))` -- `g` ALWAYS runs first, regardless of how
natural the call `compose(add_one, double)` looks to read left to right. `pipe(x, *fns)` sidesteps the
whole ambiguity by reading AND executing in the same order: the first function argument after `x` is
the first one applied.

**Run**: `python3 kata.py`

**Output**:

```text
12
```

</details>

### Kata 5 -- map/filter/reduce: a mutable default argument silently shares ONE accumulator

_relates to co-04, co-13, Example 15, Example 36_

**Task.** `histogram(words)` should start counting from a fresh, empty dict every time the `counts`
argument is omitted. The version below is broken: two DIFFERENT, unrelated calls end up sharing the
SAME accumulator dict.

**Before** (`drilling/code/kata-05-mutable-default-accumulator/before/kata.py`)

```python
"""Kata 5 (before): a mutable default argument silently shares ONE accumulator across every call."""


def histogram(words: list[str], counts: dict[str, int] = {}) -> dict[str, int]:  # SMELL: mutable default
    for w in words:
        counts[w] = counts.get(w, 0) + 1  # BUG: mutates the SHARED default dict object in place
    return counts


first_doc = histogram(["a", "b", "a"])
print(first_doc)
second_doc = histogram(["c"])  # an UNRELATED document -- should start from a fresh, empty count
print(second_doc)  # BUG: "c" is mixed in with leftover counts from the first, unrelated call
```

**Observed (buggy) output** (captured by actually running the script above):

```text
{'a': 2, 'b': 1}
{'a': 2, 'b': 1, 'c': 1}
```

**After** (`drilling/code/kata-05-mutable-default-accumulator/after/kata.py`)

```python
"""Kata 5 (after): fix -- a None sentinel builds a FRESH dict on every call, reduce folds over it."""

from functools import reduce


def histogram(words: list[str], counts: dict[str, int] | None = None) -> dict[str, int]:
    start: dict[str, int] = counts if counts is not None else {}  # => fresh dict every call
    return reduce(lambda acc, w: {**acc, w: acc.get(w, 0) + 1}, words, start)  # => builds NEW dicts


first_doc = histogram(["a", "b", "a"])
print(first_doc)
second_doc = histogram(["c"])  # a fresh, empty accumulator every time the default is used
print(second_doc)  # correctly isolated from the first, unrelated call
```

<details>
<summary>Model solution</summary>

**Root cause**: Python evaluates a default argument expression exactly ONCE, at function-definition
time -- `{}` is created a single time, and the `before` version's loop MUTATES that single shared dict
in place on every call that omits `counts`. Using `None` as a sentinel and building a fresh `{}` inside
the body (or, as shown, folding with `functools.reduce` into a NEW dict each step) removes the shared
mutable target entirely.

**Run**: `python3 kata.py`

**Output**:

```text
{'a': 2, 'b': 1}
{'c': 1}
```

</details>

### Kata 6 -- laziness: a generator is iterated once, exhausted, then silently yields nothing again

_relates to co-15, Example 21, Example 22_

**Task.** `values` should be usable for a second pass after `sum()` consumes it once. The version
below is broken: `squared(...)` returns a single-use generator, and the second pass over the SAME
object silently produces nothing.

**Before** (`drilling/code/kata-06-generator-exhaustion/before/kata.py`)

```python
"""Kata 6 (before): a generator is iterated once, exhausted, then silently yields nothing again."""

from typing import Iterator


def squared(nums: list[int]) -> Iterator[int]:
    for n in nums:
        yield n * n  # => a lazy, single-use generator -- each value produced only on demand


values = squared([1, 2, 3])  # SMELL: ONE generator object, about to be consumed twice below
total = sum(values)  # first pass -- fully consumes/exhausts the generator
print(total)
remaining = list(values)  # BUG: the SAME exhausted generator -- nothing left to yield, no error raised
print(remaining)
```

**Observed (buggy) output** (captured by actually running the script above):

```text
14
[]
```

**After** (`drilling/code/kata-06-generator-exhaustion/after/kata.py`)

```python
"""Kata 6 (after): fix -- materialize a list when the SAME data is genuinely needed more than once."""

from typing import Iterator


def squared(nums: list[int]) -> Iterator[int]:
    for n in nums:
        yield n * n


values = list(squared([1, 2, 3]))  # => a list, not a generator -- safe to iterate as many times as needed
total = sum(values)  # first pass over the materialized list
print(total)
remaining = list(values)  # second pass -- the list still has every element, nothing was consumed
print(remaining)
```

<details>
<summary>Model solution</summary>

**Root cause**: a generator object tracks its own position and raises `StopIteration` once exhausted --
`sum(values)` fully drains it, so `list(values)` afterward has nothing left to pull and produces an
empty list with NO error to flag the mistake. Wrapping the generator in `list(...)` once, up front,
trades away the laziness (the whole sequence is now materialized in memory) in exchange for being safely
re-iterable as many times as needed -- the right trade whenever a value is genuinely consumed more than
once.

**Run**: `python3 kata.py`

**Output**:

```text
14
[1, 4, 9]
```

</details>

### Kata 7 -- pattern matching: a new ADT variant falls through match/case silently

_relates to co-20, co-21, Example 46, Example 67_

**Task.** `area(shape)` should compute an area for every `Shape` variant, including the newly-added
`Triangle`. The version below is broken: the `match` block has no `case` for `Triangle` and no
wildcard `case _`, so the function falls through and returns `None` instead of an area or an error.

**Before** (`drilling/code/kata-07-match-case-no-exhaustiveness/before/kata.py`)

```python
"""Kata 7 (before): a new ADT variant falls through match/case silently -- no compile-time warning."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Circle:
    radius: float


@dataclass(frozen=True)
class Square:
    side: float


@dataclass(frozen=True)
class Triangle:  # => a NEW variant added to the shape family after the evaluator below was written
    base: float
    height: float


Shape = Circle | Square | Triangle  # => the ADT now has THREE variants


def area(shape: Shape) -> float:  # type: ignore[misc]  # pyright statically flags what CPython won't
    match shape:  # type: ignore[misc]  # SMELL: no Triangle case, no wildcard -- pyright catches it, CPython doesn't
        case Circle(radius=r):
            return 3.14159 * r * r
        case Square(side=s):
            return s * s
    # BUG: falls through here for Triangle -- Python raises NOTHING, the function returns None


result = area(Triangle(base=4.0, height=3.0))  # a legitimate Shape value the evaluator never handles
print(result)  # BUG: prints None instead of raising or computing an area
```

**Observed (buggy) output** (captured by actually running the script above):

```text
None
```

**After** (`drilling/code/kata-07-match-case-no-exhaustiveness/after/kata.py`)

```python
"""Kata 7 (after): fix -- an explicit wildcard case raises instead of silently falling through."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Circle:
    radius: float


@dataclass(frozen=True)
class Square:
    side: float


@dataclass(frozen=True)
class Triangle:
    base: float
    height: float


Shape = Circle | Square | Triangle


def area(shape: Shape) -> float:
    match shape:
        case Circle(radius=r):
            return 3.14159 * r * r
        case Square(side=s):
            return s * s
        case Triangle(base=b, height=h):  # => the new variant now has its OWN branch
            return 0.5 * b * h
        case _:  # => a manual safety net for any FUTURE variant this evaluator hasn't been taught yet
            raise ValueError(f"unhandled shape variant: {shape!r}")


result = area(Triangle(base=4.0, height=3.0))
print(result)
```

<details>
<summary>Model solution</summary>

**Root cause**: Python's `match`/`case` has no LANGUAGE-level exhaustiveness check -- a `match` block
that doesn't cover every variant simply falls through with no error, and a function with no explicit
`return` on that path implicitly returns `None`. (Note: this specific example IS statically catchable --
pyright's `reportMatchNotExhaustive` correctly flags the `before` version, which is why it needs a
`# type: ignore` to demonstrate the runtime behavior at all; the underlying CPython runtime still
enforces nothing.) Adding both the missing `case Triangle(...)` branch AND a `case _:` wildcard that
raises makes any FUTURE unhandled variant a loud, immediate crash instead of a silent `None`.

**Run**: `python3 kata.py`

**Output**:

```text
6.0
```

</details>

### Kata 8 -- memoization: @lru_cache applied to an impure function freezes a stale value

_relates to co-17, co-01, Example 25, Example 41_

**Task.** `get_price("widget")` should always reflect the CURRENT contents of `prices`. The version
below is broken: `@lru_cache` treats `get_price` as if it were pure, so it caches the first result and
never notices `prices` changed.

**Before** (`drilling/code/kata-08-memoize-impure-function/before/kata.py`)

```python
"""Kata 8 (before): @lru_cache applied to an IMPURE function -- the cache freezes a stale value."""

from functools import lru_cache

prices: dict[str, float] = {"widget": 9.99}


@lru_cache  # SMELL: memoization is only safe on a PURE function -- this one reads mutable module state
def get_price(sku: str) -> float:
    return prices[sku]  # BUG: depends on `prices`, not just on `sku` -- not actually pure


first_lookup = get_price("widget")
print(first_lookup)
prices["widget"] = 14.99  # the underlying price table changes at runtime, as real price tables do
second_lookup = get_price("widget")
print(second_lookup)  # BUG: still 9.99 -- the cache never learns the price actually changed
```

**Observed (buggy) output** (captured by actually running the script above):

```text
9.99
9.99
```

**After** (`drilling/code/kata-08-memoize-impure-function/after/kata.py`)

```python
"""Kata 8 (after): fix -- no memoization on an impure lookup; the function always reads the current state."""

prices: dict[str, float] = {"widget": 9.99}


def get_price(sku: str) -> float:  # => no @lru_cache -- this function depends on prices, not just sku
    return prices[sku]


first_lookup = get_price("widget")
print(first_lookup)
prices["widget"] = 14.99  # the underlying price table changes at runtime
second_lookup = get_price("widget")
print(second_lookup)  # correctly reflects the updated price -- nothing was cached to go stale
```

<details>
<summary>Model solution</summary>

**Root cause**: `get_price`'s result depends on the MODULE-LEVEL `prices` dict, not just on its own
`sku` argument -- it is not actually pure, even though its signature looks like a simple lookup.
`@lru_cache` assumes purity and caches by argument alone, so once `get_price("widget")` is called once,
every LATER call with `"widget"` returns the frozen first result forever, regardless of what `prices`
does afterward. The fix is not a smarter cache; it's recognizing this function was never safe to
memoize in the first place.

**Run**: `python3 kata.py`

**Output**:

```text
9.99
14.99
```

</details>

### Kata 9 -- railway errors: a hand-written and_then skips the Err check before calling the next step

_relates to co-22, co-23, co-24, Example 51, Example 52_

**Task.** `and_then(first_step, double_it)` should propagate `first_step`'s `Err` untouched when
`first_step` already failed, never calling `double_it` at all. The version below is broken: it calls
`step(result.value)` unconditionally, even when `result` is an `Err` with no `.value` field.

**Before** (`drilling/code/kata-09-railway-skips-err-check/before/kata.py`)

```python
"""Kata 9 (before): a hand-written and_then forgets to check for Err before calling the next step."""

from dataclasses import dataclass
from typing import Callable, Generic, TypeVar

T = TypeVar("T")
E = TypeVar("E")
U = TypeVar("U")


@dataclass(frozen=True)
class Ok(Generic[T]):
    value: T


@dataclass(frozen=True)
class Err(Generic[E]):
    error: E


Result = Ok[T] | Err[E]


def and_then(result: Result[T, str], step: Callable[[T], Result[U, str]]) -> Result[U, str]:
    # SMELL: calls step() on result.value UNCONDITIONALLY -- never checks whether result is an Err first
    return step(result.value)  # type: ignore[union-attr]  # BUG: Err has no .value -- crashes on failure


def parse_positive(raw: str) -> Result[int, str]:
    n = int(raw)
    return Ok(n) if n > 0 else Err(f"{raw} is not positive")


def double_it(n: int) -> Result[int, str]:
    return Ok(n * 2)


first_step = parse_positive("-5")  # this is a legitimate FAILURE, not a bug in parse_positive itself
final = and_then(first_step, double_it)  # BUG: crashes with AttributeError instead of propagating Err
print(final)
```

**Observed (buggy) output** (captured by actually running the script above -- an uncaught crash):

```text
Traceback (most recent call last):
  ...
AttributeError: 'Err' object has no attribute 'value'
```

**After** (`drilling/code/kata-09-railway-skips-err-check/after/kata.py`)

```python
"""Kata 9 (after): fix -- and_then checks the variant BEFORE calling the next step, short-circuiting on Err."""

from dataclasses import dataclass
from typing import Callable, Generic, TypeVar

T = TypeVar("T")
E = TypeVar("E")
U = TypeVar("U")


@dataclass(frozen=True)
class Ok(Generic[T]):
    value: T


@dataclass(frozen=True)
class Err(Generic[E]):
    error: E


Result = Ok[T] | Err[E]


def and_then(result: Result[T, str], step: Callable[[T], Result[U, str]]) -> Result[U, str]:
    match result:  # => checks the variant FIRST, exactly once, before ever calling step()
        case Ok(value=v):
            return step(v)  # => only reachable when result actually succeeded
        case Err(error=e):
            return Err(e)  # => short-circuits -- step() is never called on a failure


def parse_positive(raw: str) -> Result[int, str]:
    n = int(raw)
    return Ok(n) if n > 0 else Err(f"{raw} is not positive")


def double_it(n: int) -> Result[int, str]:
    return Ok(n * 2)


first_step = parse_positive("-5")
final = and_then(first_step, double_it)  # correctly short-circuits, double_it is never called
print(final)
```

<details>
<summary>Model solution</summary>

**Root cause**: the broken `and_then` reaches for `result.value` before confirming `result` is
actually an `Ok` -- `Err` has an `.error` field, not `.value`, so the attribute access crashes the
instant a legitimate failure reaches it. Pattern-matching on `result`'s variant FIRST (`case Ok(value=v)`
vs. `case Err(error=e)`) makes the check impossible to skip: `step` is only ever called inside the `Ok`
branch, and an `Err` is returned untouched from the `Err` branch, exactly the short-circuit railway
semantics are supposed to guarantee.

**Run**: `python3 kata.py`

**Output**:

```text
Err(error='-5 is not positive')
```

</details>

### Kata 10 -- functional core: a debug print() leaks I/O into what should be the pure core

_relates to co-28, co-02, Example 57, Example 76_

**Task.** `parse_and_total(rows)` is meant to be the pure core of a small tool -- callable and
testable with zero I/O. The version below is broken: it has a debug `print()` buried inside it, so a
test that wants to verify its return value ALSO has to capture stdout to avoid noisy test output.

**Before** (`drilling/code/kata-10-print-leaks-into-core/before/kata.py`)

```python
"""Kata 10 (before): a debug print() leaks I/O into what is supposed to be the pure core."""

import io
from contextlib import redirect_stdout


def parse_and_total(rows: list[str]) -> int:  # meant to be the PURE core -- no I/O anywhere
    print(f"parsing {len(rows)} rows")  # SMELL: a debug print buried inside the "pure" core
    return sum(int(row) for row in rows)


rows = ["10", "20", "30"]
captured = io.StringIO()
with redirect_stdout(captured):  # BUG: a "pure" function should never need its stdout redirected
    total = parse_and_total(rows)
print(total)
print(repr(captured.getvalue()))  # BUG: proves the core actually performed I/O -- it isn't pure
```

**Observed (buggy) output** (captured by actually running the script above):

```text
60
'parsing 3 rows\n'
```

**After** (`drilling/code/kata-10-print-leaks-into-core/after/kata.py`)

```python
"""Kata 10 (after): fix -- the core stays pure; only the shell performs I/O, and only around the core."""

import io
from contextlib import redirect_stdout


def parse_and_total(rows: list[str]) -> int:  # => the pure core -- no print, no I/O of any kind
    return sum(int(row) for row in rows)


def run_shell(rows: list[str]) -> None:  # => the imperative shell -- the ONLY place logging happens
    print(f"parsing {len(rows)} rows")
    total = parse_and_total(rows)
    print(total)


rows = ["10", "20", "30"]
captured = io.StringIO()
with redirect_stdout(captured):
    total = parse_and_total(rows)  # calling the core directly needs NO stdout redirection to test
print(total)
print(repr(captured.getvalue()))  # empty -- the core performed no I/O, confirming it stayed pure
run_shell(rows)  # the shell is where logging + the final print belong -- the core stays silent
```

<details>
<summary>Model solution</summary>

**Root cause**: a `print()` call, even a "harmless" diagnostic one, is I/O -- the moment `parse_and_total`
performs it, the function is no longer pure, and any test of its RETURN VALUE also has to manage its
side effect (here, by redirecting stdout) to avoid polluting test output. Moving the print into a
separate `run_shell` function draws the functional-core/imperative-shell boundary explicitly: the core
is called directly with no redirection needed at all, and the shell is the ONLY place any output happens.

**Run**: `python3 kata.py`

**Output**:

```text
60
''
parsing 3 rows
60
```

</details>

## Self-check checklist

Work through this list without looking anything up. Every item should be something you can do from
memory, not something you'd need to search for.

**Purity, side effects, referential transparency, immutability, persistence**

- [ ] I can call a function twice with identical arguments and explain why a PURE function must give
      the same result both times, while an impure one might not (co-01).
- [ ] I can name the specific hidden effect that turns a pure-looking function into an impure one --
      printing, mutating an argument, reading external mutable state (co-02).
- [ ] I can replace a call with its own return value inside a larger expression and explain why that
      substitution is always safe for a referentially transparent function (co-03).
- [ ] I can reach for `tuple`, `frozenset`, `@dataclass(frozen=True)`, or `MappingProxyType` when data
      needs to be safe to hand to another thread or function (co-04).
- [ ] I can explain why structural sharing keeps a persistent update cheap, instead of requiring a full
      deep copy on every change (co-05).

**Functions as values: first-class, higher-order, closures, currying, composition, pipe**

- [ ] I can assign a function to a variable, store several in a list, and pass one as an argument,
      without any special syntax (co-06).
- [ ] I can write a higher-order function (like `apply(fn, x)`) that works identically regardless of
      what `fn` itself does (co-07).
- [ ] I can write a closure that captures a configuration value once and reuses it on every later call,
      and name exactly where that captured state lives (co-08).
- [ ] I can hand-curry a two-argument function into `f(a)(b)`, and explain how currying differs from
      partial application (co-09).
- [ ] I can reach for `functools.partial` instead of a hand-written wrapping lambda to fix some of a
      function's arguments (co-10).
- [ ] I can write `compose(f, g)` and correctly state that `g` runs FIRST, computing `f(g(x))` (co-11).
- [ ] I can write a `pipe(x, f, g)` helper that reads AND executes left to right, and explain when that
      readability trade is worth it over `compose` (co-12).

**Sequence transforms, recursion, laziness, itertools, memoization**

- [ ] I can recognize a hand-written accumulation loop as secretly a `map`, a `filter`, or a `reduce`,
      and rewrite it as one (co-13).
- [ ] I can state CPython's specific limit on deep recursion (no tail-call optimization,
      `RecursionError`) and name the two standard workarounds (co-14).
- [ ] I can write a generator that produces values on demand, and explain why that makes an infinite
      sequence usable at all (co-15).
- [ ] I can reach for `itertools.islice`, `chain`, `accumulate`, `groupby`, `tee`, or `pairwise` instead
      of hand-rolling the equivalent loop (co-16).
- [ ] I can explain why memoization is only safe on a function that is genuinely PURE, and reproduce
      what goes wrong when it's applied to one that isn't (co-17).

**Decorators, point-free style, ADTs, pattern matching**

- [ ] I can write a decorator, explain it as `greet = log_calls(greet)` spelled with `@`, and use
      `functools.wraps` to preserve the wrapped function's identity (co-18).
- [ ] I can rewrite a lambda-based pipeline in point-free style, and explain when doing so helps
      readability versus when it obscures it (co-19).
- [ ] I can model a "one of several shapes" value as a union of frozen dataclasses (an ADT), and
      explain what illegal state that construction makes unrepresentable (co-20).
- [ ] I can dispatch over an ADT's variants with `match`/`case`, and state precisely what Python's
      `match`/`case` does NOT check for me at the language level (co-21).

**Option/Result, railway errors, functor/applicative/monad**

- [ ] I can build and use a hand-rolled `Some`/`Nothing`, and explain what it forces a caller to do
      that a bare `Optional[int]` does not (co-22).
- [ ] I can build and use a hand-rolled `Ok`/`Err`, and explain what it makes visible in a function's
      signature that an exception does not (co-23).
- [ ] I can thread a `Result` through a multi-step pipeline so the FIRST failure short-circuits every
      remaining step (co-24).
- [ ] I can state the functor identity law (`container.map(identity) == container`) and explain what it
      confirms about `map`'s behavior (co-25).
- [ ] I can combine two independently-wrapped values with a multi-argument function (an applicative
      `map2`), and explain how that differs from chaining two `map` calls (co-26).
- [ ] I can chain functions that each return an already-wrapped value with `bind`/`and_then`, and
      explain why `map` alone would produce a nested wrapper instead (co-27).

**Functional core, imperative shell**

- [ ] I can split a small tool into a pure core (parse/transform/aggregate, zero I/O) and a thin
      imperative shell that holds every effect, and explain why the core needs no mocking to test
      (co-28).

## Elaborative interrogation & self-explanation

Nine why/why-not prompts. Answer in your own words before checking -- the goal is explaining the
reasoning, not reciting a definition.

**W1.** Why does this topic insist "push side effects to the edges and keep a pure core" instead of
"eliminate side effects entirely" -- given that a real program unavoidably has to read a file or print
something eventually?

<details>
<summary>Answer</summary>

Eliminating I/O is not actually an option for a program that has to do anything observable in the real
world -- the honest goal is `taming-state`: quarantining WHERE effects live instead of pretending they
don't exist. The functional-core/imperative-shell split (co-28) is the concrete architectural answer:
the core stays testable with zero mocking precisely because it holds none of the effects, and the shell
is small and thin precisely because it holds ALL of them, in one place a reviewer can scrutinize
directly.

</details>

**W2.** Why is `determinism-vs-emergence` -- purity buying deterministic, replayable behavior -- named
as one of this topic's cross-cutting big ideas, rather than treated as a property specific to co-01
alone?

<details>
<summary>Answer</summary>

Determinism shows up wherever purity does, under different names: memoization (co-17) is only safe
because a pure function's result is deterministic by argument; a persistent data structure's old version
(co-05) stays trustworthy because nothing about it can have silently changed; property-testing purity
itself (Example 58) is really testing determinism directly. Recognizing "this is the same
determinism-vs-emergence trade again" is what lets a developer transfer intuition from one FP feature to
an unfamiliar one.

</details>

**W3.** Why does the Tensions & trade-offs section of this topic's overview call insisting on purity
inside a tight numeric loop "dogma, not engineering," rather than treating purity as an unconditional
good?

<details>
<summary>Answer</summary>

`abstraction-and-its-cost` is the honest counterweight this topic names explicitly: immutability
allocates, and a persistent update that shares structure is still not free -- Example 75 measures this
cost numerically rather than asserting it. A tight numeric loop or a huge in-place buffer is a place an
imperative core is honestly faster, and pretending otherwise trades a real performance cost for a
principle that buys nothing concrete in that specific spot.

</details>

**W4.** Why does Kata 9's `and_then` crash with an `AttributeError` instead of just returning the wrong
value quietly, the way several of this topic's other katas do?

<details>
<summary>Answer</summary>

`Err` genuinely has no `.value` field -- it has `.error` instead -- so `step(result.value)` is not
merely logically wrong, it is a type-shape mismatch the moment `result` is actually an `Err`. Contrast
Kata 7, where the bug (a missing `match` case) produces a plausible-looking `None` instead of a crash:
some correctness bugs fail loudly by construction (a crash you cannot miss), and others fail silently by
construction (a wrong value indistinguishable from a right one) -- recognizing which failure MODE a bug
class produces is itself a useful skill.

</details>

**W5.** Why does Kata 7's note explicitly point out that pyright's `reportMatchNotExhaustive` DOES catch
the missing `Triangle` case statically, when co-21's own concept description says `match`/`case` has "no
compile-time exhaustiveness checking"?

<details>
<summary>Answer</summary>

Both statements are true at different levels: the Python LANGUAGE itself (CPython, at runtime) enforces
nothing about `match`/`case` exhaustiveness -- an unmatched value simply falls through. A separate,
optional STATIC TYPE CHECKER (pyright) can layer a best-effort exhaustiveness heuristic on top, but only
when it can see the union's FULL set of variants statically; anything that defeats that visibility (a
dynamically-constructed type, a variant defined in another module pyright isn't shown) removes the
safety net entirely. The topic's own maxim -- always add a `case _:` that raises -- is what makes the
guarantee hold regardless of which type checker (if any) a project runs.

</details>

**W6.** Why does co-24 (railway-oriented error handling) matter as its own named concept, when it is
"just" `and_then`/`bind` (co-27) applied in a sequence?

<details>
<summary>Answer</summary>

Railway-oriented programming names the SHAPE of the resulting code, not a new mechanism: a chain of
`and_then` calls reads top-to-bottom as one linear success path, with every failure mode handled ONCE by
the `Result` type's own machinery instead of re-implemented as a nested `if err != nil` pyramid at every
step. Naming the pattern is what lets a developer recognize "this messy nested-conditional code is
secretly a railway that hasn't been written as one yet" the next time they see it.

</details>

**W7.** Why does this topic's capstone (and Example 80) combine a functional core, `Result`-based
errors, AND an applicative combine into ONE tool, rather than demonstrating each pattern in a separate,
smaller example?

<details>
<summary>Answer</summary>

Each pattern in isolation (Examples 1-56) proves the mechanism works; the capstone proves the mechanisms
COMPOSE -- a real tool needs a pure core (co-28) that produces `Result`-typed rows (co-23), some of
which fail independently and need combining via an applicative that accumulates every error instead of
stopping at the first (co-26), all while the imperative shell stays the ONLY place touching a file. That
composition is the actual skill a production codebase demands, not any one pattern recited alone.

</details>

**W8.** Why does co-17 (memoization) explicitly require co-01 (purity) as a PRECONDITION, rather than
being a general-purpose "make any function faster" technique?

<details>
<summary>Answer</summary>

Memoization's entire correctness argument is "the same arguments always produce the same result, so
caching by argument is safe" -- which is EXACTLY the purity guarantee (co-01) and nothing else. Kata 8
demonstrates the failure directly: `@lru_cache` on a function reading mutable external state doesn't
just fail to speed anything up correctly, it actively returns WRONG, stale answers forever after the
first call, which is worse than not caching at all.

</details>

**W9.** Why does this topic teach functors, applicatives, and monads (co-25 to co-27) as "patterns you
recognize and use" rather than with the rigorous, law-checking treatment a category-theory course would
give them?

<details>
<summary>Answer</summary>

The topic's own scope note names this trade-off directly: a gentle, practical first exposure lets a
developer recognize the SAME shape (`map` on a list, `map` on an `Option`, `and_then` chaining
`Result`-returning steps) across libraries and languages immediately, which is the day-to-day payoff.
The deeper, law-checking rigor (why the functor laws must hold, what associativity actually guarantees)
is deliberately deferred to a later Type Systems topic -- teaching both at once here would spend this
topic's whole budget on formalism before a reader has even seen the patterns pay off in working code.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) &middot; Next: [Concurrency & Parallelism](../../concurrency-and-parallelism/learning/overview.md) →
