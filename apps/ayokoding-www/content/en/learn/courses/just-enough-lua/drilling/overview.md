---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Just Enough Lua primer: five fixed drills that
force active recall instead of passive re-reading. Work through them in order -- short-answer
recall first, then scenario judgment, then hands-on repetition, then a checklist to confirm real
automaticity, and finally why/why-not prompts that test whether you can explain the reasoning, not
just execute the syntax. Every answer is hidden in a `<details>` block; try each item yourself
before opening it.

## Recall Q&A

Eighteen short-answer questions, one per concept (`co-01` through `co-18`). Answer from memory,
then check.

**Q1 (co-01 -- dynamic-typing-eight-types).** Lua checks types on values at runtime, not on
variable declarations at compile time. What are the eight possible strings `type()` can return?

<details>
<summary>Answer</summary>

`nil`, `boolean`, `number`, `string`, `function`, `userdata`, `thread`, `table` -- every Lua value
is exactly one of these eight, and `type()` reports which one at runtime, on the value itself, not
on any variable declaration.

</details>

**Q2 (co-02 -- nil-and-false-are-falsy).** Which two values are falsy in a Lua `if` condition, and
what happens to `0` and `""`?

<details>
<summary>Answer</summary>

Only `nil` and `false` are falsy. Every other value -- including `0` and the empty string `""`,
both falsy in many other languages -- is truthy in Lua.

</details>

**Q3 (co-03 -- tables-are-the-only-data-structure).** What is Lua's one structured data type, and
name three different roles it plays.

<details>
<summary>Answer</summary>

The table. The same type builds arrays, records/maps, sets, and objects -- Lua has no separate
dictionary, struct, or list type.

</details>

**Q4 (co-04 -- array-part-vs-hash-part).** What makes a table a "sequence," and which two built-ins
walk it differently?

<details>
<summary>Answer</summary>

Contiguous integer keys starting at `1` form a sequence. `ipairs`/`#` walk only that array part in
ascending order; `pairs` walks every key, array part and hash part together, with no ordering
guarantee -- the two views diverge the moment the sequence has gaps or extra non-integer keys.

</details>

**Q5 (co-05 -- functions-are-first-class-values).** What does it mean that functions are
"first-class values" in Lua, and name two things you can do with a function besides call it
immediately?

<details>
<summary>Answer</summary>

Functions are ordinary values, exactly like numbers or tables. You can assign one to a variable or
table field, pass it as an argument to another function, and return it from a function.

</details>

**Q6 (co-06 -- lexical-scope-and-local).** What decides whether a Lua variable is global or local,
and how far does a `local` binding's visibility reach?

<details>
<summary>Answer</summary>

Only the explicit `local` keyword makes a variable local -- without it, an assignment always
touches the global table. A `local` is visible only inside its enclosing block and any function
defined inside that block.

</details>

**Q7 (co-07 -- closures-and-upvalues).** What is an upvalue, and why does it outlive the function
that declared it?

<details>
<summary>Answer</summary>

An upvalue is a `local` variable from an enclosing scope that a nested function references. Because
the nested function keeps that variable reachable, Lua keeps it alive as long as the closure itself
is reachable -- even after the outer function that originally declared it has already returned.

</details>

**Q8 (co-08 -- multiple-return-values).** How many values can one Lua `return` statement produce,
and what decides how many the caller actually keeps?

<details>
<summary>Answer</summary>

Any number. The calling context decides how many are kept: a single assignment slot keeps one, a
multiple-assignment or the middle of an argument list can keep more, and wrapping the call in extra
parentheses always truncates it to exactly one.

</details>

**Q9 (co-09 -- varargs-and-select).** What does a trailing `...` parameter do, and what can
`select('#', ...)` tell you that `#{...}` cannot reliably?

<details>
<summary>Answer</summary>

`...` lets a function accept any number of trailing arguments, retrievable via `...` itself or via
`select`. `select('#', ...)` reports the true argument count, including any `nil` arguments --
`#{...}` cannot reliably do this, since a table's length operator is undefined near `nil` holes.

</details>

**Q10 (co-10 -- metatables-and-metamethods).** What does `setmetatable` do, and name three
metamethods this primer covers.

<details>
<summary>Answer</summary>

`setmetatable(t, mt)` attaches `mt` as `t`'s metatable, a table of metamethod entries that
customize `t`'s behavior under indexing and operators. Any three of: `__index`, `__newindex`,
`__add`, `__call`, `__tostring`, `__eq`.

</details>

**Q11 (co-11 -- index-metamethod-prototype-oop).** What are the two possible kinds of value for
`__index`, and what happens on a failed lookup with each?

<details>
<summary>Answer</summary>

A table or a function. As a table, a failed lookup redirects to that table. As a function, it's
called as `fn(originalTable, missingKey)` to synthesize a value on demand. This single metamethod
is the mechanism Lua uses to emulate classes and prototype-style inheritance.

</details>

**Q12 (co-12 -- colon-syntax-for-methods).** What is `obj:method(args)` sugar for, and what
parameter does a colon-defined function implicitly receive?

<details>
<summary>Answer</summary>

`obj:method(args)` is sugar for `obj.method(obj, args)`. A function defined as
`function T:method() ... end` implicitly receives the calling table as its first parameter,
conventionally named `self`.

</details>

**Q13 (co-13 -- error-handling-with-pcall).** What kinds of values can `error()` raise, and what
does `pcall` turn a raised error into?

<details>
<summary>Answer</summary>

Any Lua value at all -- a string, a table, a number -- not only a string message. `pcall(f, ...)`
calls `f` in protected mode and converts a raised error into a `false, err` pair instead of
crashing, returning `true, results...` when `f` succeeds. `assert(v, message)` raises `message`
when `v` is falsy.

</details>

**Q14 (co-14 -- modules-and-require).** What does `require(name)` do the first time it's called for
a given `name`, and what happens on every call after that?

<details>
<summary>Answer</summary>

The first call searches `package.path` for a `name.lua` file, runs it exactly once, and caches
whatever value it returns in `package.loaded[name]`. Every subsequent `require(name)` call skips
re-running the file and returns that same cached value.

</details>

**Q15 (co-15 -- coroutines-cooperative-multitasking).** How do Lua coroutines decide when to switch
execution, and how does that differ from preemptive OS threads?

<details>
<summary>Answer</summary>

Coroutines only switch at explicit `yield`/`resume` points -- cooperative multitasking. Preemptive
OS threads, by contrast, can be interrupted and switched at essentially any instruction, which is
exactly the race-condition risk coroutines avoid by construction.

</details>

**Q16 (co-16 -- string-library-and-patterns).** What matching dialect do `find`/`match`/`gmatch`/
`gsub` use, and how does `string.format` work?

<details>
<summary>Answer</summary>

Lua patterns -- a lightweight, non-POSIX matching dialect with its own character-class syntax
(`%a`, `%d`, `%w`, `%s`, and their upper-case complements), distinct from full regular expressions.
`string.format` follows C's `printf`-style specifiers (`%s`, `%d`, `%f`, `%q`, and so on).

</details>

**Q17 (co-17 -- standard-libraries-overview).** Name at least five of the eight standard-library
tables this primer touches.

<details>
<summary>Answer</summary>

Any five of `string`, `table`, `math`, `os`, `io`, `coroutine`, `package`, `debug` -- core Lua
functionality beyond the language syntax itself is organized into these library tables.

</details>

**Q18 (co-18 -- luajit-and-lua51-in-neovim).** Which Lua dialect does Neovim's embedded interpreter
target, and name two concrete gaps from a modern standalone Lua.

<details>
<summary>Answer</summary>

Lua 5.1 semantics, via LuaJIT by default. Concrete gaps: the global `unpack()` function exists (not
only `table.unpack`), there's no `//` floor-division operator, and there's no `&`/`|`/`~`/`<<`/`>>`
bitwise-operator syntax (5.3+ only -- LuaJIT's `bit` module is the fallback). `goto`/`::label::` is
_not_ a gap -- LuaJIT enables it unconditionally as a Lua 5.2 extension.

</details>

## Applied problems

Twelve scenarios. Each describes a task without naming the construct -- decide which Lua feature or
API solves it, then check.

**AP1.** A config-loading function receives an arbitrary value pulled from a plugin's return table
and must branch differently depending on whether it turns out to be a table, a function to call
later, or a plain scalar, before deciding how to store it. Which built-in do you reach for, and
what is the complete, fixed set of strings it can return?

<details>
<summary>Answer</summary>

`type(value)`. It always returns exactly one of eight strings: `nil`, `boolean`, `number`,
`string`, `function`, `userdata`, `thread`, `table` -- there is no ninth possibility to branch on.

</details>

**AP2.** A search function returns the numeric index `0` to mean "insert here, at the very front"
-- a real, meaningful result, not an absence of one. A teammate wants to write
`if result then ... end` to guard against "nothing found," but worries that returning `0` will be
silently treated as "nothing." Are they right to worry?

<details>
<summary>Answer</summary>

No. In Lua, only `nil` and `false` are falsy; `0` is truthy just like any other number.
`if result then` only skips the branch when `result` is `nil` (or `false`), so a genuine `0` result
is handled correctly -- the teammate's instinct, correct in many other languages, does not apply
here.

</details>

**AP3.** You want a small command dispatcher: a table whose keys are command names typed by a user
(`"save"`, `"quit"`, `"reload"`) and whose values are the actual behavior to run for each one,
looked up and invoked directly from user input without a long `if`/`elseif` chain.

<details>
<summary>Answer</summary>

Because functions are first-class values, you can store them directly as table values:
`local commands = { save = function() ... end, quit = function() ... end }`, then dispatch with
`commands[input](...)` -- a plain table lookup followed by a call, no branching chain needed.

</details>

**AP4.** A small parser function needs to hand back both the value it parsed and a boolean flag
saying whether parsing actually succeeded, and it's called extremely often in a hot loop, so
allocating a fresh wrapper table on every single call is wasteful.

<details>
<summary>Answer</summary>

Return two separate values instead of a table: `return value, true` (or `return nil, false`). Lua
functions can return more than one value in a single `return` statement, and the caller captures
however many it assigns variables for, with zero allocation overhead for the extra return.

</details>

**AP5.** A plugin author writes and tests `local merged = x & y` against the standalone `lua`
binary on their laptop, then ships the same file as part of a Neovim keymap-loading module. Will
`x & y` work identically once that file actually runs inside Neovim?

<details>
<summary>Answer</summary>

Not necessarily. Neovim's embedded interpreter (LuaJIT by default) targets Lua 5.1 semantics, and
the `&`/`|`/`~`/`<<`/`>>` bitwise-operator _syntax_ only exists starting in Lua 5.3 -- it is simply
not valid syntax under Neovim's Lua. The author needs LuaJIT's `bit` module (e.g.
`bit.band(x, y)`) instead of the `&` operator inside Neovim.

</details>

**AP6.** A plugin's option table sometimes arrives written as the literal `{1, 2, 3}` and sometimes
as the more explicit `{[1] = 1, [2] = 2, [3] = 3}`. A reviewer asks whether these are secretly two
different kinds of table under the hood that need separate handling.

<details>
<summary>Answer</summary>

No -- they are exactly the same table. `{1, 2, 3}` is shorthand for assigning contiguous integer
keys `1`, `2`, `3` starting from the first position; writing those same keys explicitly with
`[1] =`/`[2] =`/`[3] =` produces an identical sequence, walkable by `ipairs` and measured by `#` the
same way either way.

</details>

**AP7.** Two separate `.lua` files, both `require`d into the same Neovim session, each declare a
variable named `opts` at their top level, but neither file uses the `local` keyword when doing so.
What actually happens the moment the second file loads, and how would you have prevented it?

<details>
<summary>Answer</summary>

Both `opts` assignments write to the same global table (`_G`), so the second file's `opts = ...`
silently overwrites the first file's value -- a real cross-file collision, not a hypothetical one.
Declaring `local opts = ...` in each file scopes the variable to that file alone and avoids the
collision entirely.

</details>

**AP8.** A logging wrapper needs to forward an arbitrary number of arguments -- including the
possibility of a `nil` in the middle of the list -- from its own caller through to a
`string.format`-style call, without silently losing any of them or miscounting how many there
actually were.

<details>
<summary>Answer</summary>

Declare the wrapper with a trailing `...` parameter, and use `select('#', ...)` (not `#{...}`) to
get the true, `nil`-inclusive argument count, then walk the arguments with `select(i, ...)` for
each index rather than trusting a packed table's length.

</details>

**AP9.** A `theme` table exposes named colors, and you want reading a color that was never
explicitly set -- say `theme.bg`, before any user override -- to fall back automatically to a
`defaults` table's value, with zero extra code at each call site.

<details>
<summary>Answer</summary>

`setmetatable(theme, { __index = defaults })`. Any read that misses a key directly on `theme`
chains through to `defaults` automatically, with no `if`/`or` check needed at the call site.

</details>

**AP10.** A small helper module returns a plain table of string-processing functions, and you want
callers to be able to write `helpers:trim(s)` so it reads like a method call, even though `helpers`
is really just an ordinary table.

<details>
<summary>Answer</summary>

Define the function to accept the table itself as its first parameter, e.g.
`function helpers:trim(s) ... end` (sugar for `function helpers.trim(self, s) ... end`). Colon-call
syntax always passes the table before the dot as the first argument, so the function's first
parameter must be prepared to receive it.

</details>

**AP11.** You're validating a plugin's option table at Neovim startup, and want a malformed table
to fall back to safe defaults with a logged warning, rather than let the malformed table's error
propagate and crash the whole editor session before it even finishes starting.

<details>
<summary>Answer</summary>

Wrap the validation/loading call in `pcall(load_options, raw_table)`. On success you get
`true, result`; on failure you get `false, err` instead of an uncaught error -- catch the `false`
case, log `err`, and fall back to defaults, letting the rest of startup continue.

</details>

**AP12.** A plugin needs to process a very large file one line at a time, pausing after each line
to hand control back to Neovim's event loop so the UI stays responsive, then resuming exactly where
it left off -- without threading callbacks through every processing step.

<details>
<summary>Answer</summary>

Wrap the line-processing loop in a coroutine and `coroutine.yield()` after each line; the caller
`coroutine.resume`s it to advance one line at a time whenever the event loop is free. Because
coroutines only switch at explicit `yield`/`resume` points, the pause-and-resume-later shape falls
out naturally, without a chain of callbacks.

</details>

## Code katas

Eight hands-on repetition drills. Each is a before/after `.lua` file pair colocated under
`drilling/code/`. Every "before" script is a real, runnable Lua program that misapplies the concept
being drilled -- run it yourself, diagnose the bug from the observed behavior, fix it from memory,
then compare your fix against the "after" script and the model solution before checking your work
against the actually-executed output shown.

### Kata 1 -- independent closures

**Task.** `make_counter()` should return a fresh, independent counting function every time it's
called -- two counters built from it must never share state. The version below is broken: both
counters returned by `make_counter_pair()` count the same shared value instead of counting
independently. Diagnose the bug, then fix it so a `make_counter()` factory produces genuinely
independent counters.

**Before** (`drilling/code/kata-01-independent-closures/before/kata.lua`)

```lua
local function make_counter_pair()
  n = 0
  local function counter()
    n = n + 1
    return n
  end
  return counter, counter
end

local a, b = make_counter_pair()
print(a(), a(), b(), b())
```

**Observed (buggy) output** (captured by actually running the script above):

```text
1 2 3 4
```

**After** (`drilling/code/kata-01-independent-closures/after/kata.lua`)

```lua
local function make_counter()
  local n = 0
  return function()
    n = n + 1
    return n
  end
end

local a = make_counter()
local b = make_counter()
print(a(), a(), b(), b())
```

<details>
<summary>Model solution</summary>

```lua
local function make_counter()          -- => a proper FACTORY: every call builds a fresh closure
  local n = 0                          -- => a NEW local n per call (co-06); n is this call's upvalue
  return function()                    -- => the returned closure captures THIS call's n, not a shared global (co-07)
    n = n + 1
    return n
  end
end

local a = make_counter()               -- => a's own private n, starting at 0
local b = make_counter()               -- => b's own, separate private n -- also starting at 0
print(a(), a(), b(), b())              -- => a advances its own n twice: 1, 2; b advances its own n twice: 1, 2
                                        -- => Output: 1    2    1    2
```

**Root cause**: the buggy version wrote `n = 0` with no `local` keyword, making `n` an accidental
global shared by every call to `counter()` -- and it returned the exact same closure twice instead
of building two separate ones. Both mistakes point at the same fix: give every counter its own
`local` state, created fresh inside a real factory function.

**Run**: `lua kata.lua`

**Output**:

```text
1 2 1 2
```

</details>

### Kata 2 -- array-part order

**Task.** A receipt printer must list items in the exact order they were added, then print the
total. The version below stores items in a map keyed by name and walks it with `pairs`, so the
printed order is not guaranteed to match insertion order (and can even change between runs). Fix it
so the order is always deterministic and matches the order items were added.

**Before** (`drilling/code/kata-02-array-part-order/before/kata.lua`)

```lua
local function build_receipt_buggy()
  local items = {}
  items["bread"] = 3
  items["milk"] = 2
  items["eggs"] = 4
  local total = 0
  for name, price in pairs(items) do
    print(name, price)
    total = total + price
  end
  print("total", total)
end

build_receipt_buggy()
```

**Observed (buggy) property** (verified by actually running the script above): `total` always
prints `9`, but the three item lines above it can print in any order -- `pairs` makes no ordering
promise (co-04), so the printed receipt is not reliably reproducible run to run.

**After** (`drilling/code/kata-02-array-part-order/after/kata.lua`)

```lua
local function build_receipt()
  local items = {
    { name = "bread", price = 3 },
    { name = "milk", price = 2 },
    { name = "eggs", price = 4 },
  }
  local total = 0
  for _, item in ipairs(items) do
    print(item.name, item.price)
    total = total + item.price
  end
  print("total", total)
end

build_receipt()
```

<details>
<summary>Model solution</summary>

```lua
local function build_receipt()
  local items = {                      -- => an ARRAY of records (co-03, co-04) -- contiguous integer keys from 1
    { name = "bread", price = 3 },     -- => items[1]
    { name = "milk", price = 2 },      -- => items[2]
    { name = "eggs", price = 4 },      -- => items[3]
  }
  local total = 0
  for _, item in ipairs(items) do      -- => ipairs guarantees ascending order over the array part (co-04)
    print(item.name, item.price)       -- => always prints bread, then milk, then eggs -- same order every run
    total = total + item.price
  end
  print("total", total)
end

build_receipt()
```

**Root cause**: storing each item as a separate map key (`items["bread"] = 3`) throws away the
order they were added in -- `pairs` (co-04) walks a table's hash part in unspecified order, so a
map is the wrong shape whenever order matters. Restructuring to an array of
`{name=..., price=...}` records, walked with `ipairs`, restores a guaranteed, reproducible order.

**Run**: `lua kata.lua`

**Output**:

```text
bread 3
milk 2
eggs 4
total 9
```

</details>

### Kata 3 -- metatable inheritance

**Task.** `Circle` should inherit `describe()` from a base `Shape` "class," reached through
`Circle`'s own instances via `__index`. The version below links `Circle`'s own missing fields to
`Shape`, but never wires `Circle` as its instances' own metatable -- so `Circle` instances can't
reach anything at all, not even `Circle`'s own methods, let alone `Shape`'s. Fix the missing link.

**Before** (`drilling/code/kata-03-metatable-inheritance/before/kata.lua`)

```lua
local Shape = {}
Shape.__index = Shape
function Shape.new(name) return setmetatable({ name = name }, Shape) end
function Shape:describe() return self.name .. " is a shape" end

local Circle = setmetatable({}, { __index = Shape })
function Circle.new(radius) return setmetatable({ name = "circle", radius = radius }, Circle) end

local c = Circle.new(5)
print(c:describe())
```

**Observed (buggy) output** (captured by actually running the script above -- it does not merely
print the wrong value, it crashes):

```text
lua: kata.lua:10: attempt to call a nil value (method 'describe')
```

**After** (`drilling/code/kata-03-metatable-inheritance/after/kata.lua`)

```lua
local Shape = {}
Shape.__index = Shape
function Shape.new(name) return setmetatable({ name = name }, Shape) end
function Shape:describe() return self.name .. " is a shape" end

local Circle = setmetatable({}, { __index = Shape })
Circle.__index = Circle
function Circle.new(radius) return setmetatable({ name = "circle", radius = radius }, Circle) end
function Circle:area() return math.floor(3.14159 * self.radius * self.radius) end

local c = Circle.new(5)
print(c:describe())
print(c:area())
```

<details>
<summary>Model solution</summary>

```lua
local Shape = {}
Shape.__index = Shape                  -- => Shape is its own instances' metatable (co-10, co-11)
function Shape.new(name) return setmetatable({ name = name }, Shape) end
function Shape:describe() return self.name .. " is a shape" end   -- => colon syntax (co-12): implicit self

local Circle = setmetatable({}, { __index = Shape })  -- => Circle's OWN missing fields fall through to Shape
Circle.__index = Circle                -- => THE FIX: Circle must ALSO be its own instances' metatable --
                                        -- => without this line, setmetatable(instance, Circle) wires the instance
                                        -- => to a Circle table whose __index was never set, so lookups go nowhere
function Circle.new(radius) return setmetatable({ name = "circle", radius = radius }, Circle) end
function Circle:area() return math.floor(3.14159 * self.radius * self.radius) end

local c = Circle.new(5)
print(c:describe())                    -- => missing on the instance, missing on Circle, found on Shape (co-11)
                                        -- => Output: circle is a shape
print(c:area())                        -- => found directly on Circle -- Output: 78
```

**Root cause**: `setmetatable({}, { __index = Shape })` only wires _Circle the table_ to fall back
to `Shape` -- it says nothing about what happens when a _Circle instance's_ own lookup fails. That
second link (`Circle.__index = Circle`) is what every OOP example in this primer's own material
relies on (co-11, co-12); skip it and instances of the "subclass" can't reach either their own
class's methods or the base class's.

**Run**: `lua kata.lua`

**Output**:

```text
circle is a shape
78
```

</details>

### Kata 4 -- pcall safe divide

**Task.** `divide(a, b)` should never let a division by zero produce a silent, wrong-looking
"success" -- it should raise a clean, structured error that a caller can catch and inspect. The
version below does neither: Lua's `/` operator never raises on division by zero, so a zero
denominator silently produces `inf` or `nan` instead of any kind of catchable signal.

**Before** (`drilling/code/kata-04-pcall-safe-divide/before/kata.lua`)

```lua
local function divide(a, b)
  return a / b
end

print(divide(10, 0))
print(divide(0, 0))
```

**Observed (buggy) output** (captured by actually running the script above):

```text
inf
nan
```

**After** (`drilling/code/kata-04-pcall-safe-divide/after/kata.lua`)

```lua
local function divide(a, b)
  if b == 0 then
    error({ code = "DIV_ZERO", message = "cannot divide " .. a .. " by zero" })
  end
  return a / b
end

local function safe_divide(a, b)
  local ok, result = pcall(divide, a, b)
  if ok then
    return result, nil
  else
    return nil, result
  end
end

local r1, err1 = safe_divide(10, 2)
print(r1, err1)

local r2, err2 = safe_divide(10, 0)
print(r2, err2 and err2.message)
```

<details>
<summary>Model solution</summary>

```lua
local function divide(a, b)
  if b == 0 then
    error({ code = "DIV_ZERO", message = "cannot divide " .. a .. " by zero" })
                                        -- => error()'s argument can be ANY value (co-13) -- here, a structured table
  end
  return a / b                         -- => Lua's / always performs true division, returning a float
end

local function safe_divide(a, b)
  local ok, result = pcall(divide, a, b)  -- => pcall (co-13) runs divide IN PROTECTED MODE with a, b as its args
  if ok then
    return result, nil                 -- => success: the quotient, and no error
  else
    return nil, result                 -- => failure: no value, and result IS the raised error table, untouched
  end
end

local r1, err1 = safe_divide(10, 2)
print(r1, err1)                        -- => Output: 5.0    nil

local r2, err2 = safe_divide(10, 0)
print(r2, err2 and err2.message)       -- => Output: nil    cannot divide 10 by zero
```

**Root cause**: Lua's arithmetic operators never raise errors on their own -- `10 / 0` is `inf`, not
a crash, and that `inf` will happily propagate through any later arithmetic, silently corrupting a
result far from where the real problem started. Checking `b == 0` explicitly and raising a
structured error through `error()`/`pcall()` converts that silent numeric edge case into an
explicit, catchable failure the caller has to handle on purpose.

**Run**: `lua kata.lua`

**Output**:

```text
5.0 nil
nil cannot divide 10 by zero
```

</details>

### Kata 5 -- varargs select average

**Task.** `average(...)` should compute the mean of every argument passed, treating a `nil`
argument as `0` but still _counting_ it as one of the values. The version below packs the arguments
into `{...}` and uses `#` to both loop and divide -- but a trailing `nil` makes `#` on that packed
table undercount, so the average comes out wrong.

**Before** (`drilling/code/kata-05-varargs-select-average/before/kata.lua`)

```lua
local function average(...)
  local args = { ... }
  local sum = 0
  for i = 1, #args do
    sum = sum + (args[i] or 0)
  end
  return sum / #args
end

print(average(4, 8, nil))
```

**Observed (buggy) output** (captured by actually running the script above -- the correct average
of three values, `4`, `8`, and `0`, is `4.0`, not this):

```text
6.0
```

**After** (`drilling/code/kata-05-varargs-select-average/after/kata.lua`)

```lua
local function average(...)
  local n = select('#', ...)
  local sum = 0
  for i = 1, n do
    local v = select(i, ...)
    sum = sum + (v or 0)
  end
  return sum / n
end

print(average(4, 8, nil))
```

<details>
<summary>Model solution</summary>

```lua
local function average(...)
  local n = select('#', ...)           -- => select('#', ...) (co-09) counts EVERY argument, including a trailing nil
  local sum = 0
  for i = 1, n do                      -- => loops the TRUE count, not a possibly-undercounted #{...}
    local v = select(i, ...)           -- => select(i, ...) reads back the i-th argument directly, no table needed
    sum = sum + (v or 0)               -- => a nil argument contributes 0 to the sum, but still counts toward n
  end
  return sum / n
end

print(average(4, 8, nil))              -- => n is 3 (co-09's whole point); sum is 4+8+0=12; 12/3
                                        -- => Output: 4.0
```

**Root cause**: `{4, 8, nil}` packs a table whose length near the trailing `nil` is exactly the
kind of case the Lua manual leaves undefined -- here it settles on `2`, silently dropping the third
argument from both the loop and the divisor. `select('#', ...)` sidesteps the whole problem by
counting the arguments directly, before they are ever packed into a table with a hole in it.

**Run**: `lua kata.lua`

**Output**:

```text
4.0
```

</details>

### Kata 6 -- string pattern config line

**Task.** `parse_line(line)` should split a `"key: value"` config line into its two parts,
tolerating the common case where there's a space after the colon. The version below requires the
value to start immediately after the colon with no space at all -- so a perfectly normal
`"theme: dark"` line fails to match entirely.

**Before** (`drilling/code/kata-06-pattern-config-line/before/kata.lua`)

```lua
local function parse_line(line)
  return line:match("(%a+):(%a+)")
end

print(parse_line("theme: dark"))
```

**Observed (buggy) output** (captured by actually running the script above):

```text
nil
```

**After** (`drilling/code/kata-06-pattern-config-line/after/kata.lua`)

```lua
local function parse_line(line)
  return line:match("(%a+):%s*(%a+)")
end

print(parse_line("theme: dark"))
print(parse_line("mode:fast"))
```

<details>
<summary>Model solution</summary>

```lua
local function parse_line(line)
  return line:match("(%a+):%s*(%a+)")  -- => %s* (co-16) matches ZERO OR MORE spaces between the colon and the value
end                                     -- => the two (%a+) captures are returned as two separate values

print(parse_line("theme: dark"))       -- => one space after the colon -- %s* consumes it -- Output: theme    dark
print(parse_line("mode:fast"))         -- => zero spaces after the colon -- %s* matches zero just as happily
                                        -- => Output: mode    fast
```

**Root cause**: the original pattern's second capture, `(%a+)`, demanded a letter _immediately_
after the colon -- it has no way to skip the single space in `"theme: dark"`, so the whole pattern
fails to match anywhere in the string and `string.match` returns `nil`. Inserting `%s*` between the
two captures makes that space optional without breaking the no-space case.

**Run**: `lua kata.lua`

**Output**:

```text
theme dark
mode fast
```

</details>

### Kata 7 -- coroutine generator

**Task.** `fib_gen()` should return a function that yields an endless sequence of Fibonacci
numbers, one per call, forever. The version below yields exactly once, outside of any loop, so the
coroutine runs to completion almost immediately instead of pausing and resuming indefinitely.

**Before** (`drilling/code/kata-07-coroutine-generator/before/kata.lua`)

```lua
local function fib_gen()
  return coroutine.wrap(function()
    local a, b = 0, 1
    coroutine.yield(a)
  end)
end

local gen = fib_gen()
print(gen())
print(gen())
print(gen())
```

**Observed (buggy) behavior** (captured by actually running the script above): the first call
prints the only value ever yielded, the second call prints a blank line as the wrapped function
quietly finishes, and the third call crashes the script outright:

```text
0

lua: kata.lua:11: cannot resume dead coroutine
```

**After** (`drilling/code/kata-07-coroutine-generator/after/kata.lua`)

```lua
local function fib_gen()
  return coroutine.wrap(function()
    local a, b = 0, 1
    while true do
      coroutine.yield(a)
      a, b = b, a + b
    end
  end)
end

local gen = fib_gen()
print(gen(), gen(), gen(), gen(), gen(), gen())
```

<details>
<summary>Model solution</summary>

```lua
local function fib_gen()
  return coroutine.wrap(function()     -- => coroutine.wrap (co-15) returns a plain callable function
    local a, b = 0, 1
    while true do                      -- => THE FIX: an unbounded loop keeps the coroutine alive across every
                                        -- => resume, instead of letting the wrapped function run to completion
      coroutine.yield(a)               -- => pauses here, handing a back to the caller, every single call
      a, b = b, a + b                  -- => advances to the next Fibonacci pair before the NEXT resume continues
    end
  end)
end

local gen = fib_gen()
print(gen(), gen(), gen(), gen(), gen(), gen())
                                        -- => six resumes, six yields, the loop never runs out
                                        -- => Output: 0    1    1    2    3    5
```

**Root cause**: `coroutine.yield(a)` with nothing after it inside the function body means the
wrapped function has nothing left to do the moment it's resumed a second time -- it simply falls
off the end and the coroutine dies. Wrapping the yield in `while true do ... end` (co-15) is what
turns "pause once" into "pause and resume forever," the same shape a true generator needs.

**Run**: `lua kata.lua`

**Output**:

```text
0 1 1 2 3 5
```

</details>

### Kata 8 -- module FIFO queue

**Task.** `queue.lua` should behave as a FIFO (first in, first out) queue: whichever item was
pushed _first_ must be the one `pop` returns first. The version below appends correctly but pops
from the wrong end, giving LIFO (stack) behavior instead.

**Before** (`drilling/code/kata-08-module-fifo-queue/before/queue.lua`)

```lua
local M = {}

function M.new() return { items = {} } end

function M.push(q, value)
  table.insert(q.items, value)
end

function M.pop(q)
  return table.remove(q.items)
end

return M
```

**Before** (`drilling/code/kata-08-module-fifo-queue/before/main.lua`)

```lua
local queue = require("queue")
local q = queue.new()
queue.push(q, "first")
queue.push(q, "second")
queue.push(q, "third")
print(queue.pop(q))
```

**Observed (buggy) output** (captured by actually running `lua main.lua` from inside `before/` --
the first item pushed was `"first"`, but this is what `pop` actually returns):

```text
third
```

**After** (`drilling/code/kata-08-module-fifo-queue/after/queue.lua`)

```lua
local M = {}

function M.new() return { items = {} } end

function M.push(q, value)
  table.insert(q.items, value)
end

function M.pop(q)
  return table.remove(q.items, 1)
end

return M
```

**After** (`drilling/code/kata-08-module-fifo-queue/after/main.lua`)

```lua
local queue = require("queue")
local q = queue.new()
queue.push(q, "first")
queue.push(q, "second")
queue.push(q, "third")
print(queue.pop(q))
print(queue.pop(q))
print(queue.pop(q))
```

<details>
<summary>Model solution</summary>

```lua
-- queue.lua -- a FIFO queue module (co-14's whole contract: this file RETURNS a table)
local M = {}

function M.new() return { items = {} } end     -- => a fresh, independent items table per queue instance (co-03)

function M.push(q, value)
  table.insert(q.items, value)         -- => appends to the end -- correct for either a stack or a queue (co-17)
end

function M.pop(q)
  return table.remove(q.items, 1)      -- => THE FIX: position 1 is the FRONT of the array -- true FIFO order
end                                     -- => (the buggy version called table.remove(q.items) with no position,
                                        -- => which removes the LAST element -- LIFO/stack behavior instead)

return M
```

```lua
-- main.lua -- exercises the fixed FIFO queue
local queue = require("queue")         -- => runs queue.lua once, caches its return value (co-14)
local q = queue.new()
queue.push(q, "first")
queue.push(q, "second")
queue.push(q, "third")
print(queue.pop(q))                    -- => Output: first
print(queue.pop(q))                    -- => Output: second
print(queue.pop(q))                    -- => Output: third
```

**Root cause**: `table.remove(t)` with no position argument always removes the _last_ element -- the
stack-pop idiom, not a queue's front-dequeue. Passing `1` explicitly
(`table.remove(q.items, 1)`) removes the first element instead, shifting everything else left by
one, which is exactly the FIFO behavior a queue needs.

**Run**: `lua main.lua` (from inside `after/`, so `require("queue")` finds `queue.lua` next to it)

**Output**:

```text
first
second
third
```

</details>

## Self-check checklist

Confirm each item without checking the manual first. If you hesitate, that concept needs another
pass.

- [ ] I can name Lua's eight basic types and predict what `type()` returns for any value, without
      checking the manual. (co-01)
- [ ] I can state Lua's truthiness rule from memory and never mistake `0` or `""` for falsy. (co-02)
- [ ] I can explain why Lua has exactly one structured data type and name at least three different
      roles a table plays. (co-03)
- [ ] I can distinguish a table's array part from its hash part and predict when `ipairs` and
      `pairs` will disagree. (co-04)
- [ ] I can pass a function as an argument, store one in a table field, and return one from another
      function without hesitation. (co-05)
- [ ] I can predict whether an assignment creates a global or a local, and explain why forgetting
      `local` is a common real bug. (co-06)
- [ ] I can build a closure that captures a local as an upvalue and explain why that upvalue
      survives after the enclosing function returns. (co-07)
- [ ] I can write a function that returns multiple values and predict exactly how many a given call
      site keeps. (co-08)
- [ ] I can write a vararg function and choose correctly between packing into `{...}` and using
      `select('#', ...)` when `nil`s are possible. (co-09)
- [ ] I can attach a metatable with `setmetatable` and name what at least three different
      metamethods customize. (co-10)
- [ ] I can build a two-level `__index` chain and predict exactly where a failed lookup will
      resolve. (co-11)
- [ ] I can write and call a colon-syntax method and explain what implicit parameter it receives.
      (co-12)
- [ ] I can wrap a risky call in `pcall`, branch on its `ok` flag, and raise a non-string error
      object when structured data matters. (co-13)
- [ ] I can write a module that returns a table and explain why requiring it twice never re-runs
      its top-level code. (co-14)
- [ ] I can create, resume, and yield a coroutine, and explain why it never races with the code
      that resumed it. (co-15)
- [ ] I can pick the right `string` library function (`find`/`match`/`gmatch`/`gsub`/`format`) for
      a described text-processing task. (co-16)
- [ ] I can name at least five of Lua's eight standard-library tables and what each one is for.
      (co-17)
- [ ] I can name at least two concrete syntax or API gaps between Neovim's embedded Lua and a
      modern standalone `lua` binary. (co-18)
- [ ] I can explain, in one sentence, why Lua charging you a single universal table abstraction is
      a deliberate trade, not a missing feature. (`abstraction-and-its-cost`)

## Elaborative interrogation & self-explanation

Six why/why-not prompts. Answer each in your own words before opening the model explanation.

**E1.** Why does Lua provide exactly one structured data type (the table) instead of separate
built-in types for arrays, sets, hash maps, and structs the way many other languages do? Tie your
answer to `abstraction-and-its-cost`.

<details>
<summary>Model explanation</summary>

One universal structure means every piece of the language that manipulates data -- function
arguments, module returns, object instances -- only ever has to reason about one shape. That is the
entire `abstraction-and-its-cost` trade this primer keeps returning to: a bigger language would
hand you a dedicated array type with contiguous storage, a dedicated set type with true O(1)
membership semantics, and a dedicated struct type with fixed fields, each specialized and each with
its own rules to learn. Lua instead charges you a single mental model -- "it's a table" -- and the
price is that you sometimes have to build the specialized behavior yourself (an insertion-ordered
map, for instance, is exactly Kata 2's "array of records" workaround) rather than reaching for a
built-in type that already guarantees it.

</details>

**E2.** Closures capture their upvalues by reference, not by copying the value at capture time -- so
two closures sharing the same enclosing scope see each other's mutations to a shared local. Why is
"by reference" the right default, rather than "by value"?

<details>
<summary>Model explanation</summary>

If closures copied their captured locals at creation time, a counter factory's `n` would be frozen
the instant the closure was created, and every subsequent `n = n + 1` inside the closure would be
mutating a private copy invisible to anything else -- useless for the exact "private mutable state"
pattern this primer's closure examples (and Kata 1) exist to demonstrate. Capturing by reference is
what lets a closure's returned function keep mutating the _same_ variable across calls, which is
the entire point: a closure is supposed to be a live, ongoing relationship with its enclosing
scope's variables, not a one-time snapshot of their values.

</details>

**E3.** Why does `require` cache a module's return value in `package.loaded` instead of re-running
the module file every time it's `require`d?

<details>
<summary>Model explanation</summary>

A module often does real setup work at load time -- building lookup tables, registering defaults,
running validation -- and re-running that work on every single `require` call across every file
that needs it would be both wasteful and, worse, would hand back a _different_ table instance to
each caller, breaking any code that relies on two modules sharing the same underlying state.
Caching guarantees `require("mymodule")` returns the identical table object everywhere it's called,
so mutating a field through one reference is visible through every other reference to that same
module -- exactly the shared-instance guarantee Kata 8's queue module (and this primer's own
intra-topic capstone) depends on.

</details>

**E4.** Why does Neovim deliberately freeze its embedded Lua at 5.1 semantics via LuaJIT, rather
than tracking the latest official PUC-Lua release the way most embedded-scripting integrations try
to?

<details>
<summary>Model explanation</summary>

LuaJIT's performance advantage over PUC-Lua's reference interpreter is a major reason Neovim chose
it in the first place, and LuaJIT itself has stayed locked to Lua 5.1 semantics with select 5.2
extensions layered on top (like `goto`) rather than chasing every later PUC-Lua release. Neovim
inherits that constraint rather than fighting it: picking a fixed, stable target means every plugin
author's Lua config keeps working identically across Neovim versions, instead of silently breaking
each time upstream Lua changes syntax or semantics. The cost, co-18's whole point, is that config
authors who only ever test against a modern standalone `lua` binary can write code that looks
perfectly valid there and simply does not run inside Neovim.

</details>

**E5.** Why does Lua's truthiness rule treat only `nil` and `false` as falsy, deliberately leaving
`0` and `""` truthy, unlike languages that treat all three as "empty" and therefore falsy?

<details>
<summary>Model explanation</summary>

Making `0` and `""` truthy keeps "is this value present" (nil-checking) and "is this value
zero/empty" (a value's own content) as two genuinely separate questions a Lua program can ask
independently, rather than collapsing them into one truthiness check the way falsy-`0` languages
do. That separation is exactly what makes the `x or default` idiom safe to use on a numeric field
that might legitimately be `0` -- a search-index result, a loop counter, a valid "zero"
configuration value -- without that valid `0` being mistaken for "nothing was set." The narrower
falsy set costs a small amount of memorization up front and buys back a large amount of correctness
later.

</details>

**E6.** Why does Lua build its entire OOP story out of ordinary tables and the `__index` metamethod
instead of shipping a dedicated `class` keyword the way most object-oriented languages do?

<details>
<summary>Model explanation</summary>

A dedicated `class` keyword would be an entirely new, special-cased language construct sitting on
top of everything else Lua already has -- but `__index`-as-table-redirect (co-11) is already the
general mechanism for "this lookup didn't find anything here, so try somewhere else," and a
class/instance relationship is just one particular use of that same mechanism. Reusing it instead
of inventing a parallel OOP subsystem keeps the language's surface area small -- exactly the
`abstraction-and-its-cost` trade again: no `class` keyword to learn, no separate inheritance syntax,
at the cost of a "class" being something you assemble yourself from tables and one metamethod
rather than something the language hands you fully formed.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) · Next:
[Extending Neovim](../../extending-neovim/learning/overview.md) →
