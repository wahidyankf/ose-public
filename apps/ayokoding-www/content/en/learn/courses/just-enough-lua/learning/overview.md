---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Nvim](../../just-enough-nvim/learning/overview.md) -- you should
  be comfortable opening, editing, and saving files before writing and running Lua scripts.
- **Tools & environment**: a macOS/Linux terminal; the standalone **`lua`** interpreter installed
  (verify with `lua -v`) for running scripts outside Neovim. Lua is licensed **MIT**, a Tier-1
  free-to-teach license (Neovim bundles its embedded Lua under the same MIT terms).
- **Assumed knowledge**: basic terminal use. No prior programming language is required -- this is a
  first language for some readers.

## Why this exists -- the big idea

[Extending Neovim](../../extending-neovim/learning/overview.md) configures Neovim in Lua, and
learning the config language and the editor-extension concept at the same time doubles the
difficulty -- so this primer gets you just enough Lua first, before you ever touch a `.lua` config
file. The one idea worth keeping if you forget everything else: a single structure, the **table**,
is Lua's array, map, object, and module all at once -- master the table and the rest of the
language is small.

**Cross-cutting big idea**: `abstraction-and-its-cost` -- Lua's one universal abstraction (the
table) buys you a tiny, learnable language, and the price is the specialized types (real arrays,
sets, structs, hash maps) a bigger language would hand you for free. Every design choice this
primer covers traces back to that trade.

## Install and run your first script

Install the standalone Lua interpreter for your platform (macOS: `brew install lua`;
Debian/Ubuntu: install your distribution's current `lua5.x` package, or build from source at
[lua.org/download.html](https://www.lua.org/download.html)), then confirm the version:

```text
$ lua -v
Lua 5.5.0  Copyright (C) 1994-2025 Lua.org, PUC-Rio
```

Lua's current major release is **5.5.0** (released 2025-12-22); the 5.4 line's latest patch is
**5.4.8**. Both are far ahead of the Lua dialect Neovim itself embeds -- more on that gap below.

**A note on "Output" blocks**: `print()` joins multiple values with a literal tab character, and
a handful of examples produce a trailing space before their final newline. Every "Output" block in
this primer was captured by actually running the script it follows, but this page's own markdown
rendering normalizes tabs to single spaces and trims trailing whitespace for readability. Trust the
`.lua` script's own `-- =>` annotations and, best of all, `lua example.lua` on your own machine for
the byte-exact bytes -- the visible "Output" block is a faithful _reading_ of that output, not
always a byte-for-byte terminal capture.

Every example in this primer is a complete, self-contained `.lua` file colocated under
`learning/code/`. The command you will run for almost every one of them is exactly this:

```text
lua example.lua
```

**Two families of exceptions, both deliberate and both teaching co-18** (Neovim's embedded Lua
dialect):

- **Example 72** demonstrates the global `unpack()` function that exists in Lua 5.1 (and in
  LuaJIT, which targets 5.1 semantics) but was removed from standalone Lua 5.2 onward. Run it with
  `luajit example.lua` instead of `lua example.lua` -- running it with plain `lua` reproduces the
  exact error a Neovim-only assumption would cause outside Neovim.
- **Examples 78-84** call the `vim.*` API, which only exists inside a running Neovim process --
  there is no standalone equivalent. Open Neovim and run `:luafile example.lua` from inside the
  example's directory (or use `nvim --headless -c "luafile example.lua" -c "qa!"` to run one
  non-interactively).

## How this primer is organized

- **Beginner** (Examples 1-26) -- core syntax and expressions: the eight basic types, `nil`/`false`
  truthiness, local-vs-global scoping, arithmetic, string basics, comparisons, the `and`/`or`
  idioms, control flow (`if`/`for`/`while`/`repeat`), and the table literal's two faces (array and
  map).
- **Intermediate** (Examples 27-58) -- varargs, the `table` library (`insert`/`remove`/`concat`/
  `sort`), the `string` library's `format`/`sub`/`find`/`match`/`gmatch`/`gsub`, generic-`for`
  iterators, closures, recursion and higher-order functions, metatables for defaults,
  inheritance-style fallback, `__tostring`, and operator overloading, modules via `require`, and
  basic `pcall` error handling.
- **Advanced** (Examples 59-84) -- the rest of error handling (`error` with non-string values,
  `assert`, `xpcall` with a traceback handler, error levels), the remaining metamethods (`__eq`,
  `__call`), a full prototype-based OOP class/inheritance/override chain, coroutines end to end,
  the Lua-5.1-vs-later dialect gap Neovim actually lives in, and the seven `vim.*` API calls
  (table merging, mapping, keymaps, options, buffer lines, inspection, string splitting) every
  later Neovim-extension topic leans on.

Every example cites the concept (`co-NN`) it exercises, and every claim about Lua's versions,
license, and Neovim's embedded dialect traces to `lua.org`, `luajit.org`, and Neovim's own
`runtime/doc`/`runtime/lua` sources, web-verified 2026-07-12 and re-confirmed 2026-07-14.

## Scope: just enough, not comprehensive

This is a **Primer**, not a comprehensive Lua reference: it covers exactly the language surface
[Extending Neovim](../../extending-neovim/learning/overview.md) depends on, and deliberately
excludes LPeg, the `utf8` library, `string.pack`/`string.unpack`, `os.date` formatting, file and
process I/O beyond the `io.write` calls already shown, `__newindex`/`__lt`/`__le` and the rest of
the metamethod family beyond what OOP and operator
overloading require, weak tables, userdata, the C API, and LuaRocks package management. If a Lua
feature is not exercised by a later topic in this journey, it is out of scope here on purpose, not
by oversight.

---

← Previous: [Just Enough Nvim](../../just-enough-nvim/learning/advanced.md) · Next:
[Beginner Examples](./beginner.md) →
