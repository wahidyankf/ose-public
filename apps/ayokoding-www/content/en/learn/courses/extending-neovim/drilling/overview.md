---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Extending Neovim topic: five fixed drills that
force active recall instead of passive re-reading. Work through them in order -- short-answer recall
first, then scenario judgment, then hands-on repetition, then a checklist to confirm real automaticity,
and finally why/why-not prompts that test whether you can explain the reasoning, not just execute the
API call. Every answer is hidden in a `<details>` block; try each item yourself before opening it.

Unlike the Just Enough Lua drilling page's `lua kata.lua` scripts, this topic has no standalone
interpreter -- keymaps, autocommands, LSP attachment, and Tree-sitter highlighting only exist inside a
running Neovim session. Every code kata below was verified with a real `nvim --headless` session against
the same Neovim v0.12.3 install this topic's worked examples used, exactly like `../learning/code/`'s own
`transcript.txt` convention.

## Recall Q&A

Eighteen short-answer questions, one per concept (`co-01` through `co-18`). Answer from memory, then
check.

**Q1 (co-01 -- init-lua-entrypoint).** Where does Neovim look for its single Lua entry point at startup,
and what does placing a `lua/` directory beside it do?

<details>
<summary>Answer</summary>

`init.lua` under `stdpath('config')` (`~/.config/nvim/init.lua` by default) -- the one file Neovim
sources every time it starts. A `lua/` directory placed beside it joins the `runtimepath`, which is what
makes every file inside it `require()`-able later.

</details>

**Q2 (co-02 -- options-vim-o-vs-opt).** Two accessors set editor options: `vim.o` and `vim.opt`. What's
the practical difference, and which option-flavor forces you to pick correctly?

<details>
<summary>Answer</summary>

`vim.o` gives direct scalar assignment for boolean/number/string values. `vim.opt` wraps the same options
in a Lua-table-like object supporting `:append()`/`:remove()`, which matters for options that are really
comma-separated lists under the hood -- assigning a list-like option with `vim.o` silently overwrites the
whole list instead of extending it.

</details>

**Q3 (co-03 -- global-and-scoped-variables).** Name the four scoped-variable wrappers this topic covers,
and which one holds the single most common variable any config sets.

<details>
<summary>Answer</summary>

`vim.g` (global), `vim.b` (buffer), `vim.w` (window), `vim.t` (tab) -- typed wrappers over Vim's
corresponding variable scopes. `vim.g.mapleader` is the most common `vim.g` example any config sets.

</details>

**Q4 (co-04 -- keymap-set).** What are `vim.keymap.set`'s four arguments, and what two different things
can `rhs` be?

<details>
<summary>Answer</summary>

`mode, lhs, rhs, opts`. `rhs` can be a string (an Ex command or another mapping) or a Lua function,
called directly with no command-line round trip.

</details>

**Q5 (co-05 -- autocommands).** Which two API calls pair up for event-driven config, and what does the
augroup's `clear = true` option prevent?

<details>
<summary>Answer</summary>

`vim.api.nvim_create_autocmd(event, opts)` paired with `vim.api.nvim_create_augroup(name, {clear =
true})`. `clear = true` wipes the group's prior entries before each re-source adds new ones -- without
it, autocommands silently pile up duplicates every time a config is re-sourced.

</details>

**Q6 (co-06 -- user-commands).** Name at least four fields `nvim_create_user_command`'s `opts` table
accepts, and name six fields its callback's argument table exposes.

<details>
<summary>Answer</summary>

Any four of `nargs`, `range`, `count`, `complete`, `desc`, `force`, `preview`, `addr`, plus generic
boolean `|command-attributes|` like `bang` and `bar`. The callback table exposes `args`, `bang`, `count`,
`fargs`, `line1`, `line2`, `mods`, `name`, `nargs`, `range`, `reg`, `smods`.

</details>

**Q7 (co-07 -- lua-module-system).** How does a dotted `require()` path map to a file on disk, and what
does `package.loaded` cache?

<details>
<summary>Answer</summary>

Subdirectories under `lua/` map to dotted paths (`lua/config/options.lua` becomes
`require('config.options')`); an `init.lua` inside a folder collapses that folder into one requireable
unit. Once required, a module is cached in `package.loaded` until something explicitly clears that entry.

</details>

**Q8 (co-08 -- plugin-management-vim-pack).** Which packpath side does `vim.pack.add` install a plugin
into, and what tracks installed state across restarts?

<details>
<summary>Answer</summary>

The **opt** side of the packpath (`site/pack/core/opt`), never a `start/` directory -- `vim.pack`
`:packadd`s it programmatically. A JSON `packlockfile` tracks installed state.

</details>

**Q9 (co-09 -- plugin-management-lazy-nvim).** Name the four lazy-loading triggers `lazy.nvim`'s
plugin-spec table supports, and what convention does an `opts` field trigger.

<details>
<summary>Answer</summary>

`event`, `cmd`, `ft`, `keys`. Setting `opts` on a spec tells `lazy.nvim` to call that plugin's own
`.setup(opts)` automatically once it loads -- a convention the plugin itself must actually support.

</details>

**Q10 (co-10 -- native-lsp-config).** What replaced `require('lspconfig').<name>.setup{...}`, and what
does the `'*'` wildcard target do?

<details>
<summary>Answer</summary>

The native pair `vim.lsp.config(name, cfg)` / `vim.lsp.enable(name)`. `vim.lsp.config('*', {...})` sets
shared defaults every subsequently enabled server inherits, without repeating them per server.

</details>

**Q11 (co-11 -- lsp-server-configs-and-lspconfig).** What is `nvim-lspconfig`'s role now, and how does
Neovim discover a user-authored server config?

<details>
<summary>Answer</summary>

`nvim-lspconfig` is a config-only registry supplying `lsp/<name>.lua` files that `vim.lsp.config`
auto-discovers on the `runtimepath`. A user-authored `lsp/<name>.lua` in a reader's own config is
discovered and merged the exact same way, with no plugin API involved.

</details>

**Q12 (co-12 -- lsp-attach-and-keymaps).** Which autocommand replaced the old `on_attach` callback, and
what two values does its callback receive directly?

<details>
<summary>Answer</summary>

`LspAttach`. Its callback receives the attaching client and the buffer number directly (via
`args.data.client_id` and `args.buf`), letting keymaps and behavior be scoped correctly per buffer.

</details>

**Q13 (co-13 -- default-lsp-keymaps).** Name at least five of the eight unconditional global LSP keymaps
Neovim 0.11+ ships out of the box.

<details>
<summary>Answer</summary>

Any five of `grn` (rename), `gra` (code action), `grr` (references), `gri` (implementation), `grt` (type
definition), `gO` (document symbols), `grx` (run codelens), `K` (hover).

</details>

**Q14 (co-14 -- diagnostics-config).** Which function controls diagnostic rendering, and name three of
its main knobs.

<details>
<summary>Answer</summary>

`vim.diagnostic.config(opts, namespace?)`. Any three of `virtual_text`, `signs`, `underline`, `float`,
`severity_sort`.

</details>

**Q15 (co-15 -- native-lsp-completion).** What does `vim.lsp.completion.enable`'s `autotrigger` option
do, and what third-party dependency does this remove?

<details>
<summary>Answer</summary>

`autotrigger = true` wires as-you-type completion directly into Neovim's built-in insert-mode completion
once a server attaches. This removes the hard dependency on a third-party completion plugin such as
`nvim-cmp`.

</details>

**Q16 (co-16 -- treesitter-highlighting).** Which five languages ship a bundled Tree-sitter parser with
automatic highlighting, and what happened to the original `nvim-treesitter` plugin?

<details>
<summary>Answer</summary>

C, Lua, Markdown, Vimscript, Vimdoc -- `vim.treesitter.start()` runs automatically for these via
Neovim's own bundled `ftplugin/` files. The historic `nvim-treesitter` plugin was archived 2026-04-03;
installing parsers for other languages now points to the active community fork's `:TSInstall` command.

</details>

**Q17 (co-17 -- treesitter-textobjects-and-queries).** Name the four `vim.treesitter.query` API
functions this topic covers, and the built-in object-select/sibling-navigation keys.

<details>
<summary>Answer</summary>

`parse`, `get`, `set`, `iter_captures`. `an`/`in` ("a node"/"in node") for object selection, `]n`/`[n`
for sibling navigation, plus `vim.treesitter.foldexpr()` for syntax-tree-based folding.

</details>

**Q18 (co-18 -- writing-a-custom-plugin-module).** What three pieces does a self-authored plugin module
need to be indistinguishable in shape from a third-party plugin?

<details>
<summary>Answer</summary>

A `require()`-able module exposing `M.setup(opts)`, an optional `plugin/*.lua` file for autoloading at
startup with no explicit `require()` call, and a `lua/<name>/health.lua` module integrating with
`:checkhealth`.

</details>

## Applied problems

Twelve scenarios. Each describes a task without naming the API -- decide which Neovim mechanism solves
it, then check. Every scenario is answerable by reasoning about the concepts alone -- no live Neovim
session is required to attempt one.

**AP1.** A growing `init.lua` already has `vim.opt.wildignore:append({ "*.pyc" })` in one section. A
teammate, editing a different section of the same file, wants to also exclude `node_modules` and writes
`vim.o.wildignore = "node_modules"`. What happens to the `*.pyc` entry, and what should they have written
instead?

<details>
<summary>Answer</summary>

`vim.o.wildignore = "node_modules"` assigns a scalar string outright, silently REPLACING whatever
`wildignore` already held -- the `*.pyc` entry is gone, with no error anywhere. They needed
`vim.opt.wildignore:append({ "node_modules" })` instead, which extends the existing list-like option
rather than overwriting it wholesale.

</details>

**AP2.** A formatter setting needs to vary per open file (Project A wants width 100, Project B wants
width 80), without one buffer's choice leaking into every other open buffer in the same session. Which
variable scope do you reach for, and what would go wrong with `vim.g` instead?

<details>
<summary>Answer</summary>

`vim.b` (buffer-scoped): `vim.b.formatter_width = 100` is visible only in the buffer that set it. Using
`vim.g` instead would make whichever buffer set it LAST win globally -- switching to Project B's buffer
would silently show Project A's width too, since a global variable is visible from every buffer at once.

</details>

**AP3.** You want `q` to close a floating help window, but only in help buffers -- binding `q` globally
would break Neovim's own macro-recording keystroke everywhere else. What two mechanisms combine to solve
this safely?

<details>
<summary>Answer</summary>

A `FileType` autocommand that fires only when the buffer's filetype becomes `help`, combined with
`vim.keymap.set`'s `buffer = args.buf` option inside that autocommand's callback. The mapping then exists
only in that one buffer; every other buffer's `q` keeps its built-in macro-recording behavior untouched.

</details>

**AP4.** A custom `:Upper` command should uppercase only the lines a user actually selected with a
Visual-mode range, not the whole buffer regardless of selection. Which `opts` field makes this possible,
and which two fields must the callback then actually read to honor it?

<details>
<summary>Answer</summary>

`{ range = true }` lets the command accept a Visual-selection or explicit line range. The callback must
then read `o.line1` and `o.line2` and apply its effect only to that span -- a callback that accepts
`range = true` but ignores `line1`/`line2` (operating on the whole buffer regardless) silently defeats
the entire point of accepting a range.

</details>

**AP5.** Two modules, `lua/a.lua` and `lua/b.lua`, are both `require()`-d from `init.lua`. `lua/a.lua`
does real setup work (builds a lookup table) the moment it loads. If `lua/b.lua` also calls
`require('a')` later in the same session, does `a.lua`'s setup work run a second time?

<details>
<summary>Answer</summary>

No. `require()` caches a module's return value in `package.loaded` the first time it runs; every
subsequent `require('a')` call, from anywhere in the config, returns that same cached table without
re-running the file. This is exactly what guarantees `a.lua` and `b.lua` share the identical table
instance, not two separately-initialized copies.

</details>

**AP6.** A plugin providing a rarely-used database GUI should never slow down every single Neovim
startup, but should still feel instant to open when a user does type its command. Which manager and
trigger fit this, and why does `lazy.nvim`'s `cmd` field beat `vim.pack` for this specific need?

<details>
<summary>Answer</summary>

`lazy.nvim` with a `cmd` trigger (`cmd = 'DBUI'`). The command registers as a real, callable,
tab-completable stub immediately at startup, but the plugin's actual module code doesn't load until that
command is typed for the first time. `vim.pack` has no equivalent command-triggered lazy-loading of its
own -- it installs and `:packadd`s a plugin's opt-side files, but does not defer loading behind a
specific Ex command the way `lazy.nvim`'s `cmd` spec field does.

</details>

**AP7.** Five different language servers all need the identical `capabilities` table and the identical
`root_markers = {'.git'}`. Writing this once per server means five nearly-identical
`vim.lsp.config(name, {...})` calls that could drift out of sync over time. What single call replaces
all five?

<details>
<summary>Answer</summary>

`vim.lsp.config('*', { capabilities = ..., root_markers = {'.git'} })`. The wildcard sets shared defaults
every subsequently enabled server inherits -- one call instead of five, with no drift risk from updating
five separate config tables whenever the shared setting needs to change.

</details>

**AP8.** A teammate hand-writes `vim.keymap.set('n', 'grn', vim.lsp.buf.rename, { buffer = bufnr })`
inside their own `LspAttach` autocommand, worried that rename won't work otherwise. Is this binding
necessary on Neovim 0.11+, and what happens if they skip it entirely?

<details>
<summary>Answer</summary>

No, it's redundant. Neovim 0.11+ ships `grn` (rename) as an unconditional global keymap the instant any
server attaches -- no custom binding required. Skipping it entirely, pressing `grn` still opens
`vim.lsp.buf.rename()`'s prompt with zero config.

</details>

**AP9.** A file has both an error and a warning on the same line. Without `severity_sort`, which one is
guaranteed to render on top, and what does turning it on change?

<details>
<summary>Answer</summary>

Neither is guaranteed -- without `severity_sort`, two diagnostics sharing one line render in whatever
order they were reported (effectively insertion order), so a low-severity hint could visually cover a
same-line error's sign or virtual text. Turning `severity_sort` on makes the error always outrank the
warning visually, regardless of which one Neovim happened to receive first.

</details>

**AP10.** A reader finds automatic completion (`autotrigger = true`) too aggressive and wants completion
only when they explicitly ask for it with Ctrl-Space, with no popup appearing while they simply type.
Which function do they bind to Ctrl-Space, and does it require `autotrigger` to be configured anywhere?

<details>
<summary>Answer</summary>

`vim.keymap.set('i', '<C-space>', vim.lsp.completion.get)`. Manual and automatic triggering are
independent -- `vim.lsp.completion.get` can be bound directly with no `autotrigger` configuration
anywhere in the config; the two features never depend on each other to function.

</details>

**AP11.** A reader's `.lua` files show syntax-aware highlighting the instant they open them, with zero
plugins installed -- but a `.rs` (Rust) file they open right after shows no highlighting at all. Is this
a bug, and what's the general two-step fix?

<details>
<summary>Answer</summary>

Not a bug -- Lua is one of the five languages (C, Lua, Markdown, Vimscript, Vimdoc) whose parser ships
bundled with Neovim, with automatic `vim.treesitter.start()` wired in by Neovim's own
`ftplugin/lua.lua`. Rust is not one of the five, so nothing highlights it automatically. The general fix:
install the parser via the active community fork's `:TSInstall rust` (the original
`nvim-treesitter/nvim-treesitter` has been archived since 2026-04-03), then add a `FileType` autocommand
calling `vim.treesitter.start(0, 'rust')` for languages Neovim's bundled `ftplugin/` files don't already
wire up.

</details>

**AP12.** A plugin author wants `:checkhealth myplugin` to report a per-check OK/ERROR result the same
way `:checkhealth` reports for any bundled Neovim component. Which file and which functions make this
work, and how does `:checkhealth` even find it?

<details>
<summary>Answer</summary>

`lua/<name>/health.lua` exposing `M.check()`, which internally calls `vim.health.start('myplugin')` to
open the report section and `vim.health.ok(...)`/`vim.health.error(...)` per individual check -- the
exact same functions core Neovim's own health checks use. `:checkhealth <name>` discovers and runs the
module purely from its location on the `runtimepath`, the identical discovery mechanism used for every
bundled and third-party health module.

</details>

## Code katas

Eight hands-on repetition drills. Each is a before/after `init.lua` pair (some with a small supporting
tree) colocated under `drilling/code/`, verified with a real `nvim --headless` session -- every "before"
config is a real, runnable Neovim config that misapplies the concept being drilled; every "after" config
is the fix. Run each yourself, diagnose the bug from the observed behavior, fix it from memory, then
compare your fix against the "after" listing and each kata's `transcript.txt` before checking your work
against the actually-executed output shown.

### Kata 1 -- mapleader ordering

**Task.** `<leader>w` should save the file, with `<leader>` resolving to `<Space>`. The version below is
broken: the keymap is created before `vim.g.mapleader` is set, so it silently binds to the wrong key
instead of erroring.

**Before** (`drilling/code/kata-01-mapleader-ordering/before/init.lua`)

```lua
vim.keymap.set('n', '<leader>w', ':w<CR>', { desc = 'Save file' })
vim.g.mapleader = ' '
```

**Observed (buggy) result** (captured by actually running the config above): `<space>w` has no mapping
at all; the mapping bound instead to `\w` (Neovim's default leader, backslash).

**After** (`drilling/code/kata-01-mapleader-ordering/after/init.lua`)

```lua
vim.g.mapleader = ' '
vim.keymap.set('n', '<leader>w', ':w<CR>', { desc = 'Save file' })
```

<details>
<summary>Model solution</summary>

```lua
vim.g.mapleader = ' '                            -- => THE FIX: must run BEFORE any <leader>-prefixed
                                                  -- => keymap (co-03) -- mapleader is resolved into the
                                                  -- => mapping's lhs at the exact moment vim.keymap.set runs
vim.keymap.set('n', '<leader>w', ':w<CR>', { desc = 'Save file' })
                                                  -- => now <leader> resolves to ' ' (co-04) -- the mapping
                                                  -- => is stored as a literal Space-prefixed lhs, <Space>w
```

**Root cause**: `<leader>` is substituted with whatever `vim.g.mapleader` currently holds at mapping
time, not at keypress time. The buggy version sets the keymap first, while `mapleader` still has its
default value (empty, which Neovim treats as backslash) -- reordering the two lines is the entire fix,
with no other change needed.

**Run**: `nvim --headless -u init.lua -c 'verbose map <space>w' -c 'verbose map \w' -c 'qa!'`

**Output** (before / after respectively -- see `transcript.txt` for the full captured run):

```text
No mapping found
n  \w          * :w<CR>
```

```text
n  <Space>w    * :w<CR>
No mapping found
```

</details>

### Kata 2 -- augroup idempotence

**Task.** Re-sourcing a config three times should still leave exactly one `BufWritePre` autocommand, not
three. The version below registers its autocommand with no augroup at all, so every re-source adds
another copy instead of replacing the prior one.

**Before** (`drilling/code/kata-02-augroup-idempotence/before/init.lua`)

```lua
local function setup()
  vim.api.nvim_create_autocmd('BufWritePre', { pattern = '*', command = 'echo "saving"' })
end

setup()
```

**Observed (buggy) result** (captured by actually running the config above, then re-sourcing it twice
more): three total loads leaves three separate `BufWritePre` autocommands, each of which would
independently echo `"saving"` on every write.

**After** (`drilling/code/kata-02-augroup-idempotence/after/init.lua`)

```lua
local function setup()
  local group = vim.api.nvim_create_augroup('MyConfig', { clear = true })
  vim.api.nvim_create_autocmd('BufWritePre', { group = group, pattern = '*', command = 'echo "saving"' })
end

setup()
```

<details>
<summary>Model solution</summary>

```lua
local function setup()
  local group = vim.api.nvim_create_augroup('MyConfig', { clear = true })
                                                  -- => THE FIX: { clear = true } (co-05) wipes MyConfig's
                                                  -- => prior entries at the TOP of every load, before the
                                                  -- => next line re-adds exactly one
  vim.api.nvim_create_autocmd('BufWritePre', { group = group, pattern = '*', command = 'echo "saving"' })
end

setup()
```

**Root cause**: an autocommand created with no `group` at all has nothing to clear it -- every re-source
of the config runs `nvim_create_autocmd` again, adding one more entry with no way to remove the old ones.
Wrapping the same call in an augroup created with `{ clear = true }` fixes this without touching the
autocommand itself.

**Run**: `nvim --headless -u init.lua -c 'source init.lua' -c 'source init.lua' -c "lua print(#vim.api.nvim_get_autocmds({event='BufWritePre'}))" -c 'qa!'`

**Output**: `3` (before) / `1` (after) -- three total loads either way (the initial load plus two
explicit re-sources).

</details>

### Kata 3 -- module reload cache

**Task.** After editing a required module's file on disk, `require()`-ing it again should pick up the
edit without restarting Neovim. The version below never clears the module's cache entry first, so the
second `require()` silently returns the stale, already-loaded value.

**Before** (`drilling/code/kata-03-module-reload-cache/before/init.lua`)

```lua
local mod1 = require('config.scratch')
print('first require:', mod1.value)

local target = vim.fn.stdpath('config') .. '/lua/config/scratch.lua'
vim.fn.writefile({ 'return { value = 2 }' }, target)

local mod2 = require('config.scratch')
print('second require (no cache clear):', mod2.value)
```

**Observed (buggy) output** (captured by actually running the config above, starting from
`lua/config/scratch.lua` holding `return { value = 1 }`):

```text
first require: 1
second require (no cache clear): 1
```

**After** (`drilling/code/kata-03-module-reload-cache/after/init.lua`)

```lua
local mod1 = require('config.scratch')
print('first require:', mod1.value)

local target = vim.fn.stdpath('config') .. '/lua/config/scratch.lua'
vim.fn.writefile({ 'return { value = 2 }' }, target)

package.loaded['config.scratch'] = nil
local mod2 = require('config.scratch')
print('second require (cache cleared first):', mod2.value)
```

<details>
<summary>Model solution</summary>

```lua
local mod1 = require('config.scratch')          -- => caches config.scratch in package.loaded (co-07)
print('first require:', mod1.value)              -- => Output: first require: 1

local target = vim.fn.stdpath('config') .. '/lua/config/scratch.lua'
vim.fn.writefile({ 'return { value = 2 }' }, target)
                                                  -- => simulates a live on-disk edit while Neovim runs

package.loaded['config.scratch'] = nil           -- => THE FIX: clears the cache entry FIRST
local mod2 = require('config.scratch')           -- => re-reads and re-runs the file from disk (co-07)
print('second require (cache cleared first):', mod2.value)
                                                  -- => Output: second require (cache cleared first): 2
```

**Root cause**: `require()` alone never re-reads an already-loaded module -- `package.loaded` still holds
the table from the first call, so a second `require()` with no cache clear returns that identical stale
object even though the on-disk file has changed. Clearing `package.loaded['config.scratch'] = nil` before
the second call is the entire fix.

**Run**: verified against an isolated `XDG_CONFIG_HOME` whose `nvim/` is this kata's `before/` or
`after/` tree (`nvim -u before/init.lua` alone does not add a sibling `lua/` to the runtimepath -- see
`transcript.txt` for why and the exact commands used).

**Output**: `1` then `1` (before) / `1` then `2` (after).

</details>

### Kata 4 -- vim.pack version pin

**Task.** A plugin install should resolve to one specific, reproducible commit, not "whatever the
default branch currently points to." The version below installs with a bare URL string, which has no
version field to inspect or reproduce later.

**Before** (`drilling/code/kata-04-pack-version-pin/before/init.lua`)

```lua
vim.pack.add({ 'https://github.com/sainnhe/gruvbox-material' })
```

**Observed (buggy) result** (captured by a genuine network `git clone` against the live repository):
`vim.pack.get({'gruvbox-material'})[1].spec.version` is `nil` -- there is no pinned version to point to,
only whatever commit the default branch's `HEAD` happened to be at install time.

**After** (`drilling/code/kata-04-pack-version-pin/after/init.lua`)

```lua
vim.pack.add({ { src = 'https://github.com/sainnhe/gruvbox-material', version = 'v1.0.0' } })
```

<details>
<summary>Model solution</summary>

```lua
vim.pack.add({                                   -- => THE FIX: a TABLE spec, not a bare URL string
  { src = 'https://github.com/sainnhe/gruvbox-material', version = 'v1.0.0' },
                                                  -- => version = 'v1.0.0' pins an exact tag (co-08) --
                                                  -- => vim.pack.get() reports it back as spec.version,
                                                  -- => plus the resolved commit as rev
})
```

**Root cause**: a bare URL string (`{'https://github.com/...'}`) has no `version` field at all -- there
is nothing to pin, so `vim.pack.add` tracks whatever the remote's default branch currently points to,
which can differ between machines or between runs. Switching to the table-spec form with an explicit
`version` field is the entire fix.

**Run**: `vim.pack.get({'gruvbox-material'})[1]` after each install -- see `transcript.txt` for the full
commands (both runs used isolated, throwaway `XDG_CONFIG_HOME`/`XDG_DATA_HOME` directories) and an
independent `git ls-remote` cross-check confirming the pinned tag's resolved commit matches exactly.

**Output**: `version field: nil` / `resolved rev: 11d779b2...` (before) vs. `version field: v1.0.0` /
`resolved rev: 1671e0ec...` (after).

</details>

### Kata 5 -- LspAttach buffer scope

**Task.** An LSP hover keymap (`K`) should exist only in buffers where a language server actually
attached. The version below binds it unconditionally at the top level, so it silently shadows Neovim's
built-in `K` (keyword-lookup) in every buffer, including plain text files with no server anywhere near
them.

**Before** (`drilling/code/kata-05-lspattach-buffer-scope/before/init.lua`)

```lua
vim.lsp.config('lua_ls', { cmd = { 'lua-language-server' }, filetypes = { 'lua' }, root_markers = { '.git' } })
vim.lsp.enable('lua_ls')

vim.keymap.set('n', 'K', vim.lsp.buf.hover, { desc = 'LSP hover' })
```

**Observed (buggy) result** (captured with a genuinely attached `lua-language-server`): `K` exists in
`scratch.lua` (where `lua_ls` attaches) AND, wrongly, in `scratch.txt` too -- a plain text buffer with no
server involved at all.

**After** (`drilling/code/kata-05-lspattach-buffer-scope/after/init.lua`)

```lua
vim.lsp.config('lua_ls', { cmd = { 'lua-language-server' }, filetypes = { 'lua' }, root_markers = { '.git' } })
vim.lsp.enable('lua_ls')

vim.api.nvim_create_autocmd('LspAttach', {
  callback = function(args)
    vim.keymap.set('n', 'K', vim.lsp.buf.hover, { buffer = args.buf, desc = 'LSP hover' })
  end,
})
```

<details>
<summary>Model solution</summary>

```lua
vim.api.nvim_create_autocmd('LspAttach', {       -- => THE FIX: bind INSIDE LspAttach (co-12), not at
  callback = function(args)                      -- => the top level
    vim.keymap.set('n', 'K', vim.lsp.buf.hover, { buffer = args.buf, desc = 'LSP hover' })
                                                  -- => buffer = args.buf (co-04, co-05) scopes K to ONLY
                                                  -- => the buffer that just attached
  end,
})
```

**Root cause**: `vim.keymap.set('n', 'K', ...)` with no `buffer` option is a global keymap, active in
every buffer the moment it's created -- regardless of whether any LSP client ever attaches there.
Wrapping the exact same call inside `LspAttach`'s callback, scoped with `buffer = args.buf`, is what
confines it to buffers a server genuinely attached to, exactly Example 39's own pattern applied to a
fresh bug.

**Run**: see `transcript.txt` for the full `nvim --headless` commands against both `scratch.lua` and
`scratch.txt`.

**Output**: `K in scratch.lua: true` / `K in scratch.txt: true` (before, bug) vs. `K in scratch.lua:
true` / `K in scratch.txt: false` (after, fixed).

</details>

### Kata 6 -- diagnostics list target

**Task.** A `<leader>xl` keymap described as "Diagnostics to loclist" should populate the current
window's location list. The version below calls `vim.fn.setqflist()` instead, which always targets the
single global quickfix list -- the opposite of what the keymap's own description promises.

**Before** (`drilling/code/kata-06-diagnostics-list-target/before/init.lua`)

```lua
vim.keymap.set('n', '<leader>xl', function()
  local diags = vim.diagnostic.get(0)
  local items = vim.diagnostic.toqflist(diags)
  vim.fn.setqflist({}, ' ', { title = 'Diagnostics', items = items })
  vim.cmd('copen')
end, { desc = 'Diagnostics to loclist' })
```

**Observed (buggy) result** (captured with a synthetic diagnostic set directly on the buffer, same
technique as Example 79): the entry lands in the global quickfix list, while the location list stays
empty.

**After** (`drilling/code/kata-06-diagnostics-list-target/after/init.lua`)

```lua
vim.keymap.set('n', '<leader>xl', vim.diagnostic.setloclist, { desc = 'Diagnostics to loclist' })
```

<details>
<summary>Model solution</summary>

```lua
vim.keymap.set('n', '<leader>xl', vim.diagnostic.setloclist, { desc = 'Diagnostics to loclist' })
                                                  -- => THE FIX: vim.diagnostic.setloclist (co-14) targets
                                                  -- => the CURRENT WINDOW's location list directly -- no
                                                  -- => manual toqflist()/setqflist() plumbing needed at all
```

**Root cause**: `vim.fn.setqflist()` always writes to the single, global quickfix list, no matter how the
items were gathered -- calling it from a function whose own `desc` promises "loclist" is a real, easy
mix-up between the two genuinely different list mechanisms this topic covers (Examples 78 and 79 sit
side by side specifically to make the contrast explicit). `vim.diagnostic.setloclist()` is the dedicated
function for the location list; reaching for it directly avoids the mix-up entirely.

**Run**: see `transcript.txt` for the full commands, including how the keymap's callback is invoked
directly via `maparg(...).callback()`.

**Output**: `loclist count: 0 qflist count: 1` (before, bug) vs. `loclist count: 1 qflist count: 0`
(after, fixed).

</details>

### Kata 7 -- Treesitter query merge

**Task.** A config author wants to ADD one custom highlight capture on top of Lua's bundled highlights
query, keeping every original capture. The version below calls `vim.treesitter.query.set()` directly
with only the new pattern, which REPLACES the entire compiled query outright instead of merging into it.

**Before** (`drilling/code/kata-07-treesitter-query-merge/before/init.lua`)

```lua
vim.treesitter.query.set('lua', 'highlights', '(identifier) @custom_ident')
```

**Observed (buggy) result** (captured by actually running the config above): the bundled Lua highlights
query drops from 37 distinct captures (this Neovim install's genuine baseline) down to exactly 1 --
keyword, string, comment, and number highlighting all silently disappear.

**After** (`drilling/code/kata-07-treesitter-query-merge/after/init.lua`)

```lua
local files = vim.treesitter.query.get_files('lua', 'highlights')
local original = table.concat(vim.fn.readfile(files[1]), '\n')
vim.treesitter.query.set('lua', 'highlights', original .. '\n(identifier) @custom_ident')
```

<details>
<summary>Model solution</summary>

```lua
local files = vim.treesitter.query.get_files('lua', 'highlights')
                                                  -- => THE FIX: locate the BUNDLED query's own source
                                                  -- => file first (co-17), instead of writing only the
                                                  -- => new pattern
local original = table.concat(vim.fn.readfile(files[1]), '\n')
                                                  -- => read the original query TEXT back into a string
vim.treesitter.query.set('lua', 'highlights', original .. '\n(identifier) @custom_ident')
                                                  -- => concatenate the custom pattern onto the END of the
                                                  -- => original -- nothing from the bundled query is lost
```

**Root cause**: `vim.treesitter.query.set(lang, name, query)` fully replaces a language's compiled query
-- it has no "merge" mode. Passing only the one new pattern discards everything the bundled query already
provided. Reading the bundled query's own source text first (`vim.treesitter.query.get_files`), then
appending the new pattern to it before calling `query.set()`, keeps every original capture and adds one
more.

**Run**: see `transcript.txt` for the full commands and a baseline (untouched) capture count for
cross-reference.

**Output**: `captures: 1` (before, bug) vs. `captures: 38` (after: the original 37 plus the new one) --
baseline, untouched: `captures: 37`.

</details>

### Kata 8 -- plugin setup opt-in

**Task.** A plugin's `MyPluginCmd` user command should only exist once a caller explicitly calls
`require('myplugin').setup()` -- never merely from `require()`-ing the module. The version below
registers the command at file (module) scope, so it leaks into existence the instant the module loads,
with no opt-in at all.

**Before** (`drilling/code/kata-08-plugin-setup-opt-in/before/lua/myplugin/init.lua`)

```lua
local M = {}

vim.api.nvim_create_user_command('MyPluginCmd', function() print('ran') end, {})

function M.setup(opts) end

return M
```

**Observed (buggy) result** (captured with an `init.lua` that calls `require('myplugin')` and
deliberately never calls `.setup()`): `MyPluginCmd` exists anyway.

**After** (`drilling/code/kata-08-plugin-setup-opt-in/after/lua/myplugin/init.lua`)

```lua
local M = {}

function M.setup(opts)
  vim.api.nvim_create_user_command('MyPluginCmd', function() print('ran') end, {})
end

return M
```

<details>
<summary>Model solution</summary>

```lua
local M = {}

function M.setup(opts)                           -- => THE FIX: registration moves INSIDE M.setup() (co-18)
  vim.api.nvim_create_user_command('MyPluginCmd', function() print('ran') end, {})
                                                  -- => now only runs once a caller explicitly opts in
end

return M
```

**Root cause**: any code written at a Lua module's file scope (outside every function) runs the instant
that module is `require()`-d -- module loading and `setup()` running are two genuinely separate steps
(co-18), and a plugin author who registers a command outside `M.setup()` accidentally couples the two,
handing every caller a side effect they never asked for. Moving the exact same
`nvim_create_user_command` call inside `M.setup()` is the entire fix.

**Run**: `init.lua` is identical in both `before/` and `after/` (`require('myplugin')`, `.setup()`
deliberately never called) -- see `transcript.txt` for the full commands.

**Output**: `true` (before, bug: leaked) vs. `false` (after, fixed: correctly absent).

</details>

## Self-check checklist

Confirm each item without checking `:help` first. If you hesitate, that concept needs another pass.

- [ ] I can locate or create `init.lua`, and explain what putting a `lua/` directory beside it does for
      `require()`. (co-01)
- [ ] I can choose correctly between `vim.o` and `vim.opt` for a given option, and predict when a scalar
      assignment silently overwrites a list. (co-02)
- [ ] I can pick the right scoped-variable wrapper (`vim.g`/`vim.b`/`vim.w`/`vim.t`) for a described need
      without hesitation. (co-03)
- [ ] I can write `vim.keymap.set` with a string `rhs` and a function `rhs`, and explain the difference
      in `:verbose map` output. (co-04)
- [ ] I can create an augroup-scoped autocommand and explain why `{ clear = true }` keeps re-sourcing
      idempotent. (co-05)
- [ ] I can define a user command with `nargs`, `range`, and `complete`, and read back
      `args`/`fargs`/`line1`/`line2` in its callback. (co-06)
- [ ] I can predict which file a dotted `require()` path resolves to, and explain why `package.loaded`
      caching means a live-edited file needs a cache clear before the next `require()` picks it up.
      (co-07)
- [ ] I can install, pin, update, and remove a plugin with `vim.pack.add`/`get`/`update`/`del` from
      memory. (co-08)
- [ ] I can write a `lazy.nvim` plugin spec with the right lazy-loading trigger (`event`/`cmd`/`ft`/
      `keys`) for a described need. (co-09)
- [ ] I can enable a language server with `vim.lsp.config` + `vim.lsp.enable`, and use the `'*'`
      wildcard for shared defaults. (co-10)
- [ ] I can explain `nvim-lspconfig`'s current config-only role, and author my own `lsp/<name>.lua`
      override. (co-11)
- [ ] I can bind a buffer-local LSP keymap inside `LspAttach`, scoped correctly to only attached
      buffers. (co-12)
- [ ] I can name at least five of Neovim's eight default global LSP keymaps without checking `:help`.
      (co-13)
- [ ] I can configure `vim.diagnostic.config`'s rendering knobs (`virtual_text`/`signs`/`underline`/
      `severity_sort`) for a described need. (co-14)
- [ ] I can wire native LSP completion with `autotrigger`, and explain why it needs no third-party
      completion plugin. (co-15)
- [ ] I can name the five bundled Treesitter parsers, and identify the correct installer for anything
      beyond them. (co-16)
- [ ] I can use the `vim.treesitter.query` API and the `an`/`in`, `]n`/`[n` built-ins to inspect or
      select syntax-aware regions. (co-17)
- [ ] I can package a self-authored Lua module with `setup(opts)`, an autoloading `plugin/` file, and a
      `health.lua` check. (co-18)
- [ ] I can explain, in one sentence, why vanilla Neovim is mechanism and my own plugins/LSP/keymaps are
      policy layered on top. (`mechanism-vs-policy`)
- [ ] I can explain, in one sentence, why LSP and Treesitter's language-agnostic uniformity is a
      deliberate trade, not a free lunch. (`abstraction-and-its-cost`)

## Elaborative interrogation & self-explanation

Six why/why-not prompts, each tied to one of this topic's two Cross-Cutting Big-Idea tags. Answer each in
your own words before opening the model explanation.

**E1 (`mechanism-vs-policy`).** Why does this topic teach `vim.pack` and `lazy.nvim` (plugin choice), LSP
server selection, and keymaps as separate, swappable layers on top of vanilla Neovim, instead of shipping
one "correct" opinionated config the way some editors do out of the box?

<details>
<summary>Model explanation</summary>

Vanilla Neovim (topic 1) is pure mechanism -- the modal grammar, motions, and text objects every config
sits on top of, identical no matter what's layered above it. Which plugins to install, which servers to
enable, which keys to bind is exactly the part that legitimately differs from developer to developer --
that's policy. Shipping one fixed opinionated config would collapse that distinction, forcing every
reader into someone else's policy choices; teaching the mechanism/policy boundary explicitly means a
reader can swap `vim.pack` for `lazy.nvim`, or `lua_ls` for a different server, without relearning
anything about how Neovim itself works underneath.

</details>

**E2 (`abstraction-and-its-cost`).** The LSP client speaks one protocol to every language server, and the
Treesitter query API speaks one capture interface to every bundled or installed grammar. What's the
concrete cost this topic pays for that uniformity, and where does it show up?

<details>
<summary>Model explanation</summary>

The cost is a layer of indirection between "I want X" and the server or parser actually doing the work
underneath. Concretely: Example 37's diagnostics did not disappear as expected in this exact
sandbox/version combination, even though the settings-merge itself genuinely reached the attached client
(`server_capabilities.diagnosticProvider` was `nil`) -- a language-agnostic abstraction still depends on
what the specific server underneath actually implements, and that gap is invisible until you check
`server_capabilities` directly, exactly what Examples 64 and 65 do for workspace symbols and inlay hints
rather than assuming a keymap "should" work.

</details>

**E3 (`mechanism-vs-policy`).** Why does Neovim 0.11+ ship default global LSP keymaps (`grn`, `gra`,
`grr`, ...) out of the box, instead of leaving every LSP keybinding entirely up to each config author's
own policy, the way Example 39's `LspAttach` pattern might suggest is the "correct" approach?

<details>
<summary>Model explanation</summary>

co-13's baseline keymaps are mechanism, not policy -- they guarantee any server that attaches gives a
reader a working baseline (rename, references, hover) with zero configuration, the same way modal
editing's motions work identically regardless of which plugins happen to be installed. `LspAttach`-scoped
custom keymaps remain the policy layer on top, for a reader who wants a DIFFERENT key than `grn`, or
additional behavior beyond the default set. The defaults don't remove that flexibility -- they just make
"did I forget to bind `grn`" no longer block basic productivity while a reader is still building their
own config's policy layer.

</details>

**E4 (`abstraction-and-its-cost`).** `vim.pack` and the active Treesitter fork both install code from
arbitrary git repositories with no vetting of what's inside. Why does this topic treat "plugin
management" as covered once install/pin/update/remove works, rather than also covering what the
installed code is doing?

<details>
<summary>Model explanation</summary>

This mirrors the LSP/Treesitter abstraction-and-its-cost trade at the tooling layer instead of the
protocol layer: `vim.pack.add({...})` or `lazy.nvim`'s spec table give a uniform installation mechanism
regardless of what a given repository's plugin actually contains -- exactly the uniformity that makes
plugin management learnable once and reusable for any plugin. The cost is that "installed and pinned"
says nothing about what a plugin's Lua code actually does at runtime; co-08's own verification method
(checking `vim.pack.get()`'s resolved `rev`, cross-checked against a real `git ls-remote`) confirms WHICH
commit installed, not WHAT that commit's code does -- a genuinely separate concern this topic's mechanism
does not cover.

</details>

**E5 (`mechanism-vs-policy`).** Example 47 shows Lua highlighting turned on with zero plugins and zero
config, purely from Neovim's own bundled `ftplugin/lua.lua`. Is that automatic behavior mechanism or
policy, and why does the answer matter for how a config author treats the other four bundled parsers?

<details>
<summary>Model explanation</summary>

It's mechanism -- Neovim's own runtime ships the decision to call `vim.treesitter.start()` for its five
bundled parsers (C, Lua, Markdown, Vimscript, Vimdoc), identically on every install, with no config
author choice involved at all. Recognizing this as mechanism (not something a reader's own config "did")
matters because it means a reader can trust these five languages will highlight correctly on any fresh
Neovim 0.12+ install with zero setup, while every other language remains a genuine POLICY decision --
which parser to install, and whether to write the `FileType` autocommand that starts it, exactly as
Example 49 does manually for Python.

</details>

**E6 (`abstraction-and-its-cost`).** co-18's whole promise is that a self-authored plugin module is
"indistinguishable in shape" from anything installed with `vim.pack` or `lazy.nvim`. What abstraction
makes that possible, and what's the cost of relying on it?

<details>
<summary>Model explanation</summary>

The Lua module system (co-07) -- `require()`-able files under `lua/`, an optional `plugin/` autoload
file, an `M.setup(opts)` convention -- is the uniform shape both third-party plugins and self-authored
code share; learning it once (Example 20's config split) pays off again for authoring (Examples 71-77).
The cost: that uniformity is purely structural, not behavioral -- Example 33 shows a real, reproducible
error when `opts = {}` assumes a plugin follows the `M.setup(opts)` convention and it does not (plenary's
own `__index`-based lazy-loading metatable resolves `.setup` to an unrelated submodule instead of a
callable function). Looking the same on disk never guarantees a plugin actually honors every convention
its shape implies -- Kata 8's own bug (a command leaking outside `setup()`) is the same lesson from the
opposite direction: the shape is only a promise a plugin author has to keep on purpose.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) · Next: [Capstone · Forge-Ready](../../capstone-forge-ready/overview.md) →
