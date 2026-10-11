---
title: "Overview"
date: 2026-07-13T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Just Enough Nvim primer: five fixed drills
that force active recall instead of passive re-reading. Work through them in order -- short-answer
recall first, then scenario judgment, then hands-on repetition, then a checklist to confirm real
automaticity, and finally why/why-not prompts that test whether you can explain the reasoning, not
just execute the keystroke. Every answer is hidden in a `<details>` block; try each item yourself
before opening it.

## Recall Q&A

Twenty short-answer questions, one per concept (`co-01` through `co-20`). Answer from memory, then
check.

**Q1 (co-01 -- modal-editing).** What does modal editing mean, and what key returns you to Normal
mode from any other mode?

<details>
<summary>Answer</summary>

Every keystroke's meaning depends on the current mode; `<Esc>` returns you to Normal mode, which
is the default "home" state you return to, not a special editing state. (The universal
escape-to-Normal, including from Terminal mode, is `<C-\><C-n>`.)

</details>

**Q2 (co-02 -- mode-taxonomy).** Name the five user-facing modes covered in this primer, plus the
internal mode entered between typing an operator like `d` and its motion.

<details>
<summary>Answer</summary>

Normal, Insert, Visual, Command-line, and Replace -- plus the internal Operator-pending mode,
entered the instant you type an operator (e.g., `d`) and exited the instant you supply its
motion or text object.

</details>

**Q3 (co-03 -- motions).** What do "inclusive", "exclusive", and "linewise" mean when classifying a
motion, and give one example of each.

<details>
<summary>Answer</summary>

Inclusive motions include the character/line the cursor lands on (e.g., `e`); exclusive motions
stop just before it (e.g., `w`); linewise motions operate on whole lines regardless of the
column (e.g., `gg`/`G`).

</details>

**Q4 (co-04 -- operator-motion-grammar).** Write the general grammar that composes an operator with
a motion or text object, and give one concrete example.

<details>
<summary>Answer</summary>

`{operator}{count}{motion|text-object}`. For example, `d3w` deletes three words, and `yi(` yanks
the text inside the nearest parentheses.

</details>

**Q5 (co-05 -- counts).** What does a numeric prefix do when placed before a motion or an
operator+motion?

<details>
<summary>Answer</summary>

It multiplies the following motion (or operator+motion): `3dw` deletes three words, `5j` moves
down five lines.

</details>

**Q6 (co-06 -- text-objects).** What is the difference between `iw` and `aw`, and name two other
`i`/`a` pairs from this primer?

<details>
<summary>Answer</summary>

`iw` selects just the word itself; `aw` selects the word plus one adjacent run of whitespace.
Other pairs taught here: `i(`/`a(` (parentheses), `i"`/`a"` (quotes), `it`/`at` (tags), `ip`/`ap`
(paragraphs).

</details>

**Q7 (co-07 -- registers).** Name the register categories covered in this primer and what each one
holds.

<details>
<summary>Answer</summary>

Named registers (`a`-`z`/`A`-`Z`, entirely user-controlled), numbered registers (`0`-`9`, an
automatic shifting history of yanks/deletes), and special registers: the unnamed register (`"`,
holds the most recent yank or delete), the yank register (`0`, always the most recent yank
specifically), and the black hole register (`_`, discards without touching any other register).

</details>

**Q8 (co-08 -- marks-and-jumplist).** What's the difference between jumping to a mark with `'a`
versus `` `a ``, and how does the jumplist differ from a mark?

<details>
<summary>Answer</summary>

`'a` jumps to the first non-blank character of mark `a`'s line; `` `a `` jumps to the mark's exact
line and column. The jumplist is a separate, automatic mechanism -- it records jump motions (not
manual bookmarks), so `<C-o>`/`<C-i>` step through jump history like browser back/forward, without
you ever having set a mark.

</details>

**Q9 (co-09 -- the-dot-repeat).** What does `.` repeat, and why does that make single-location
edits composable across a file?

<details>
<summary>Answer</summary>

`.` repeats the last change -- an insertion or an operator+motion -- verbatim at the new cursor
position. Because it needs no register or argument, you can move to a new spot and reapply the
identical edit with one keystroke, instead of retyping the whole change.

</details>

**Q10 (co-10 -- search-and-substitution).** What's the difference between the interactive search
commands (`/`, `?`, `n`, `N`) and the `:substitute` Ex command?

<details>
<summary>Answer</summary>

Search commands locate matches and move the cursor to them interactively, one at a time.
`:substitute` (`:s`) is a separate Ex command that performs pattern-based find/replace across a
range, with flags controlling scope (e.g., `g` for every match per line) and confirmation (e.g.,
`c` for a y/n/a/q prompt per replacement).

</details>

**Q11 (co-11 -- ex-command-ranges).** Name three different range forms an Ex command can accept
before the command itself.

<details>
<summary>Answer</summary>

Any three of: `.` (current line), `$` (last line), `%` (whole buffer), `'<,'>` (last Visual
selection), `/pat/,/pat2/` (a pattern range), or explicit line numbers like `10,20`.

</details>

**Q12 (co-12 -- the-global-command).** What does `:g/pattern/command` do, and what's the difference
between `:g` and `:g!` (or `:v`)?

<details>
<summary>Answer</summary>

`:g/pattern/command` is "search then act": it runs the given Ex command once on every line
matching `pattern` across a range (default: the whole buffer). `:g!` (equivalently `:v`) inverts
the match, acting on every line that does NOT match the pattern.

</details>

**Q13 (co-13 -- undo-tree).** Why isn't `u`/`<C-r>` alone enough to recover an abandoned edit, and
what does recover it?

<details>
<summary>Answer</summary>

`u`/`<C-r>` only walk a single linear stack, but every change actually branches a full undo tree;
once a new edit follows an undo, the old branch becomes unreachable by plain undo/redo. `g-`/`g+`
traverse the full tree, including abandoned branches, and `:undolist` shows the branch/change
numbers to navigate to.

</details>

**Q14 (co-14 -- macros).** Walk through the four pieces of the macro workflow: recording, stopping,
replaying once, and replaying with a count.

<details>
<summary>Answer</summary>

`q{register}` starts recording keystrokes into a register; a second `q` stops recording;
`@{register}` replays the recorded sequence once; a count placed before it (e.g., `5@a`) replays
it that many times, and `@@` repeats whichever macro was played most recently, without naming the
register again.

</details>

**Q15 (co-15 -- buffers-windows-tabs).** Define "buffer", "window", and "tab page" in one clause
each, and say how tab pages are identified.

<details>
<summary>Answer</summary>

A buffer is in-memory file text; a window is a viewport onto exactly one buffer; a tab page is a
collection of windows. Tab pages are identified purely by number (`tabpagenr()`), left to right
starting at 1 -- there is no built-in naming mechanism.

</details>

**Q16 (co-16 -- folding).** Name the six foldmethods, and what `zo`/`zc`/`za`/`zR`/`zM` each do.

<details>
<summary>Answer</summary>

The six foldmethods: manual, indent, marker, syntax, expr, diff. `zo` opens a fold, `zc` closes
it, `za` toggles it, `zR` opens every fold in the buffer, `zM` closes every fold to the top level.

</details>

**Q17 (co-17 -- quickfix-list).** What populates the quickfix list, how do you navigate it, and how
does the location list differ?

<details>
<summary>Answer</summary>

`:make`, `:grep`, or `:vimgrep` populate the single, global quickfix list; `:copen` opens its
window and `:cnext`/`:cprevious` step through the entries one at a time. The location list is the
identical mechanism, but scoped per-window instead of global.

</details>

**Q18 (co-18 -- netrw-file-explorer).** How do you open Neovim's built-in file browser, and what
can you do inside it without leaving the editor?

<details>
<summary>Answer</summary>

Run `:Explore` (or open a directory path directly) to open netrw. Inside it you can navigate
directories, create files, delete files, and rename files -- all without a plugin and without
leaving Neovim.

</details>

**Q19 (co-19 -- visual-mode-variants).** Distinguish `v`, `V`, and `<C-v>`, and say what `gv` and
`o` do inside Visual mode.

<details>
<summary>Answer</summary>

`v` selects characterwise, `V` selects linewise, `<C-v>` selects blockwise (a rectangular column
across lines). `gv` reselects the last Visual region after leaving Visual mode; `o` swaps which
end of the current selection is the active (moving) end.

</details>

**Q20 (co-20 -- terminal-mode-and-jobs).** What opens a terminal inside Neovim, and how do you
leave Terminal mode without killing the shell?

<details>
<summary>Answer</summary>

`:terminal` opens a real shell inside a buffer with its own Terminal mode, where keystrokes go to
the shell. `<C-\><C-n>` escapes to Normal mode -- the shell keeps running and its output buffer
persists like any other buffer, so you can scroll or yank its contents afterward.

</details>

## Applied problems

Twelve scenarios. Each describes a task without naming the command -- decide which keystroke or Ex
command solves it, then check.

**AP1.** A paragraph of prose has the same typo ("wierd") three separate times, but the same typo
also appears, correctly spelled elsewhere, nowhere else in the file (so a whole-file substitution
is not what you want -- you only want to touch this one paragraph). How do you scope a
substitution to just the paragraph you're looking at?

<details>
<summary>Answer</summary>

Select the paragraph in Visual mode (e.g., `V` then `}` to extend linewise to the paragraph's end),
then press `:` -- this auto-populates the command line with `'<,'>`, the range of the last Visual
selection. Append `s/wierd/weird/g<CR>`. Only the selected lines are substituted.

</details>

**AP2.** You need to copy one line to three separate far-apart locations in a file, deleting text
at each destination along the way without losing your copy of the original line.

<details>
<summary>Answer</summary>

Yank the line into a named register with `"ayy` instead of plain `yy` -- the unnamed register
still fills up with whatever you delete at each stop, but register `a` is untouched. Paste it at
each destination with `"ap`.

</details>

**AP3.** Deep in a long file, you jump with `/error<CR>` to find something, then jump again with
`G` to check the last line. Now you want to return to the exact spot -- same line, same column --
the search landed you at. Which key, and why does this already work even though you never set a
mark?

<details>
<summary>Answer</summary>

`<C-o>` steps backward through the jumplist to the previous jump location, landing at the exact
position the `/error` search left the cursor at. The jumplist records jump motions automatically
-- both `/` searches and `G` count as jumps -- so no manual `m{letter}` mark was ever needed.

</details>

**AP4.** You undo three edits in a row, then make a brand-new edit instead of redoing. A teammate
asks whether the three undone edits are gone forever. What do you tell them, and what recovers the
abandoned branch's text without discarding the new edit?

<details>
<summary>Answer</summary>

They're not gone: undo is a branching tree, not a linear stack, so the abandoned edits still exist
as an unreachable-by-plain-undo branch. `g-` steps backward through the full tree (including that
branch) and `g+` steps forward again; `:undolist` shows the branch/change numbers. Neither
discards the new edit's own branch -- the tree keeps both.

</details>

**AP5.** You need to prefix 200 lines in a file with the same literal text, and typing it 200 times
isn't realistic. What's the taught workflow, in roughly four keystrokes of setup plus one replay
command?

<details>
<summary>Answer</summary>

Record once with `qa`, perform the edit (e.g., `I<text><Esc>j`), stop with `q` -- that's the setup.
Replay the remaining 199 lines in one shot with `199@a` (a count placed before `@a`).

</details>

**AP6.** A log file mixes lines you want to keep and lines you want to discard; the ones to discard
all share a distinctive tag that never appears on lines you want to keep. What single command
removes every matching line in one pass, and what changes if you needed the opposite (keep only
the tagged lines, discard everything else)?

<details>
<summary>Answer</summary>

`:g/TAG/d` deletes every line containing "TAG". The inverse is `:g!/TAG/d` (equivalently
`:v/TAG/d`), which deletes every line that does NOT match "TAG", leaving only the tagged lines.

</details>

**AP7.** A project-wide search produces dozens of matches across many files, and you want to review
them one at a time, jumping straight to each file:line without manually opening every file.

<details>
<summary>Answer</summary>

`:vimgrep /pattern/ **/*` populates the quickfix list with every match. `:copen` opens the
quickfix window listing them all. `:cnext`/`:cprevious` step to each match's file and line in
turn.

</details>

**AP8.** While editing a file, you realize you need a brand-new sibling file in the same directory,
without leaving Neovim or touching the mouse.

<details>
<summary>Answer</summary>

`:Explore` opens netrw's directory listing for the current file's folder. Inside it, press `%` and
type a filename -- a new empty file is created and opened for editing immediately.

</details>

**AP9.** A function call has three arguments inside parentheses, and you want to replace only the
argument text, keeping the parentheses themselves intact.

<details>
<summary>Answer</summary>

`ci(` (or `ci)`) -- the `c` operator combined with the `i(` text object -- deletes only the text
between the parentheses and opens Insert mode there. `daw` would only remove one word plus
adjacent whitespace, not the whole argument list, and `dd` would delete the entire line, taking
the parentheses with it.

</details>

**AP10.** You've edited three separate buffers in the same session and want every modified one
written to disk in a single command, without switching to each in turn.

<details>
<summary>Answer</summary>

`:wa` writes every modified buffer in one command.

</details>

**AP11.** A large config file has several clearly delimited sections. You want to collapse all of
them to single summary lines while you scan the file, then reopen everything at once when you're
done.

<details>
<summary>Answer</summary>

`zM` closes every fold in the buffer down to the top level. `zR` opens every fold back up.

</details>

**AP12.** You need to run a one-off shell command (e.g., listing files) while keeping your current
buffer's edits intact, then get back to editing without losing the shell's output.

<details>
<summary>Answer</summary>

`:terminal` opens a real shell in its own buffer -- your edited buffer stays open, untouched,
elsewhere. Once the command finishes, `<C-\><C-n>` escapes Terminal mode back to Normal mode; the
output buffer persists, so you can scroll or yank it later.

</details>

## Code katas

Eight hands-on repetition drills. Each is a before/after text-file pair colocated under
`drilling/code/`. Open the "before" file in Neovim, perform the task from memory, and compare your
result against "after" before checking the model solution.

### Kata 1 -- rename in place

**Task.** `counters.txt` uses the variable name `count` three times. Rename every occurrence to
`total` in a single command.

**Before** (`drilling/code/kata-01-rename-in-place/before/counters.txt`)

```text
count = 1
count = 1
count = 1
```

**After** (`drilling/code/kata-01-rename-in-place/after/counters.txt`)

```text
total = 1
total = 1
total = 1
```

<details>
<summary>Model solution</summary>

```text
:%s/count/total/g<CR>   " => % ranges over the whole buffer (co-11); :s substitutes (co-10);
                         " => the trailing g flag replaces every match, not just the first, per line
:w<CR>                  " => saves counters.txt
```

</details>

### Kata 2 -- bulk delete a paragraph

**Task.** Delete the middle "draft" paragraph below -- both its lines, plus its trailing blank
line -- in a single command issued from inside the paragraph, leaving the two real paragraphs
separated by exactly one blank line.

**Before** (`drilling/code/kata-02-bulk-delete-paragraph/before/notes.txt`)

```text
Meeting notes -- Monday
Attendees: Alice, Bob

Draft only, ignore this section.
Remove entirely before publishing.

Final notes -- Tuesday
Attendees: Carol, Dan
```

**After** (`drilling/code/kata-02-bulk-delete-paragraph/after/notes.txt`)

```text
Meeting notes -- Monday
Attendees: Alice, Bob

Final notes -- Tuesday
Attendees: Carol, Dan
```

<details>
<summary>Model solution</summary>

```text
/Draft only<CR>   " => places the cursor anywhere inside the paragraph to remove
dap               " => "delete a paragraph" (co-06): removes both paragraph lines plus the
                  " => trailing blank line, leaving the two real paragraphs adjacent to one blank line
:w<CR>            " => saves notes.txt
```

</details>

### Kata 3 -- global cleanup

**Task.** Remove every `DEBUG` line from the log below in a single command, leaving only the `INFO`
lines.

**Before** (`drilling/code/kata-03-global-cleanup/before/log.txt`)

```text
INFO: server started
DEBUG: cache warmed
INFO: request received
DEBUG: cache hit
INFO: response sent
```

**After** (`drilling/code/kata-03-global-cleanup/after/log.txt`)

```text
INFO: server started
INFO: request received
INFO: response sent
```

<details>
<summary>Model solution</summary>

```text
:g/DEBUG/d<CR>   " => the global command (co-12): runs :d once on every line matching "DEBUG"
:w<CR>           " => saves log.txt
```

</details>

### Kata 4 -- capture and reuse a prefix

**Task.** Every label below keeps the correct `user` prefix but the wrong suffix (`Old` instead of
`New`). Fix all three in one substitution that captures and reuses the prefix instead of retyping
it.

**Before** (`drilling/code/kata-04-capture-prefix/before/labels.txt`)

```text
userOld
userOld
userOld
```

**After** (`drilling/code/kata-04-capture-prefix/after/labels.txt`)

```text
userNew
userNew
userNew
```

<details>
<summary>Model solution</summary>

```text
:%s/\(user\)Old/\1New/g<CR>   " => co-10: \(user\) captures the prefix into group 1;
                              " => \1 reinserts it, so only "Old" is replaced by "New"
:w<CR>                        " => saves labels.txt
```

</details>

### Kata 5 -- sequential numbering

**Task.** All four lines below read `item 0`. Turn them into `item 1`, `item 2`, `item 3`,
`item 4` -- sequential values, not all bumped to the same number.

**Before** (`drilling/code/kata-05-sequential-numbering/before/items.txt`)

```text
item 0
item 0
item 0
item 0
```

**After** (`drilling/code/kata-05-sequential-numbering/after/items.txt`)

```text
item 1
item 2
item 3
item 4
```

<details>
<summary>Model solution</summary>

```text
gg0            " => moves to line 1, column 1
f0             " => finds the digit '0' on that line, placing the cursor on it
<C-v>3j        " => blockwise-selects (co-19) the same column across all 4 lines
g<C-a>         " => sequential visual-block increment: each line's number increases by an
               " => incrementing amount (1, 2, 3, 4) instead of all becoming the same value
:w<CR>         " => saves items.txt
```

</details>

### Kata 6 -- macro reformat

**Task.** Prefix each of the three lines below with `-` and a space (a dash-space bullet prefix)
to turn the plain list into a bullet list, without typing the prefix three separate times.

**Before** (`drilling/code/kata-06-macro-reformat/before/list.txt`)

```text
apple
banana
cherry
```

**After** (`drilling/code/kata-06-macro-reformat/after/list.txt`)

```text
- apple
- banana
- cherry
```

<details>
<summary>Model solution</summary>

```text
gg                  " => moves to line 1
qa                  " => starts recording into register a (co-14)
I- <Esc>j           " => inserts the "- " prefix, returns to Normal mode, moves down one line
q                   " => stops recording; line 1 is already prefixed by the recording itself
2@a                 " => replays the macro on the 2 remaining lines
:w<CR>              " => saves list.txt
```

</details>

### Kata 7 -- undo tree recovery

**Task.** `status.txt` starts as `build pending`. Type an edit appending the word "broken", undo
it, then type a different edit appending the word "shipped" to reach the "after" state. Then prove
the abandoned "broken" branch still exists in the undo tree, without disturbing the "shipped" text
you just made.

**Before** (`drilling/code/kata-07-undo-tree-recovery/before/status.txt`)

```text
build pending
```

**After** (`drilling/code/kata-07-undo-tree-recovery/after/status.txt`)

```text
build pending shipped
```

<details>
<summary>Model solution</summary>

```text
A broken<Esc>   " => appends " broken"; buffer reads "build pending broken"
u               " => undoes it; buffer reverts to "build pending"
A shipped<Esc>  " => a NEW, different edit branches off the same base (co-13);
               " => buffer now reads "build pending shipped", matching after/status.txt
:w<CR>          " => saves status.txt
:undolist<CR>   " => lists both branches -- the abandoned " broken" change and the current
               " => " shipped" change both appear, proving neither was discarded by the other
```

Pressing `g-` once from here would step back through the tree to the abandoned "build pending
broken" state -- something plain `u` can no longer reach, since a new edit already replaced it on
the linear stack.

</details>

### Kata 8 -- netrw create file

**Task.** In the same directory as `readme.txt` (already on disk), create a brand-new, empty file
named `notes.txt`, without leaving Neovim or running a shell command.

**Before** (`drilling/code/kata-08-netrw-create-file/before/readme.txt`)

```text
Project readme placeholder.
```

**After** (`drilling/code/kata-08-netrw-create-file/after/readme.txt`, unchanged, plus a new
`drilling/code/kata-08-netrw-create-file/after/notes.txt`)

```text
Project readme placeholder.
```

<details>
<summary>Model solution</summary>

```text
:Explore<CR>       " => opens netrw's directory listing for the current file's folder (co-18)
%                   " => inside netrw, starts "create a new file"
notes.txt<CR>       " => names the new file; it's created empty and opened for editing
:w<CR>              " => writes the empty buffer, creating notes.txt on disk; readme.txt is
                    " => never touched
```

</details>

## Self-check checklist

Confirm each item without opening `:help` first. If you hesitate, that concept needs another pass.

- [ ] I can always identify my current mode and get back to Normal mode with a single keystroke,
      from any mode including Terminal mode. (co-01)
- [ ] I can name the five user-facing modes covered in this primer, plus the internal
      Operator-pending mode, without checking `:help`. (co-02)
- [ ] I can classify a motion as inclusive, exclusive, or linewise without checking `:help`.
      (co-03)
- [ ] I can compose `{operator}{count}{motion|text-object}` from memory for any operator taught in
      this primer (`d`, `c`, `y`, `>`, `<`, `gu`, `gU`). (co-04)
- [ ] I can prefix any motion or operator+motion with a count and predict exactly what it
      multiplies. (co-05)
- [ ] I can pick the right `i`/`a` text object (word, parens, quotes, tag, paragraph) for a
      described editing task without trial and error. (co-06)
- [ ] I can explain what's in the unnamed register, register `0`, and a numbered register after a
      sequence of yanks and deletes. (co-07)
- [ ] I can set and jump back to a mark, and explain why the jumplist recovers a search or `G`
      jump even without a mark. (co-08)
- [ ] I can predict exactly what `.` will do before pressing it, for any change I just made.
      (co-09)
- [ ] I can write a `:substitute` command with the right flags (`g`, `c`) for "replace all on this
      line" vs. "replace all in the file" vs. "confirm each one". (co-10)
- [ ] I can attach the right range (`.`, `%`, `'<,'>`, a line-number pair) to an Ex command without
      guessing. (co-11)
- [ ] I can write a `:g/pattern/command` and its inverse (`:g!` or `:v`) for a described bulk-edit
      task. (co-12)
- [ ] I can explain why undo is a tree, not a stack, and use `g-`/`g+` to reach a branch plain
      `u`/`<C-r>` can't. (co-13)
- [ ] I can record a macro, stop it, replay it once, replay it with a count, and repeat the last
      one with `@@`. (co-14)
- [ ] I can distinguish a buffer, a window, and a tab page, and navigate/write across all of them
      without looking anything up. (co-15)
- [ ] I can name all six foldmethods and toggle/open/close folds with `zo`/`zc`/`za`/`zR`/`zM`.
      (co-16)
- [ ] I can populate the quickfix list and walk it end to end with `:copen`/`:cnext`/`:cprevious`.
      (co-17)
- [ ] I can open netrw and create, delete, or rename a file from inside it, with no plugin.
      (co-18)
- [ ] I can choose the right Visual mode variant (`v`, `V`, `<C-v>`) for a described selection
      shape, and use `gv`/`o`. (co-19)
- [ ] I can open a terminal inside Neovim, run a command, and get back to Normal mode without
      killing the shell. (co-20)
- [ ] I can explain, in one sentence, why vanilla Neovim's keystroke grammar is "mechanism" and my
      own config and plugins would be "policy". (`mechanism-vs-policy`)

## Elaborative interrogation & self-explanation

Six why/why-not prompts. Answer each in your own words before opening the model explanation.

**E1.** Why does Neovim separate "moving/selecting" (Normal mode) from "inserting" (Insert mode)
instead of letting you type and navigate in the same mode, the way a typical GUI text editor does?

<details>
<summary>Model explanation</summary>

Separating the two frees every plain letter key to double as a movement or editing command in
Normal mode, instead of reserving it for literal insertion. That's what makes the
operator+motion+text-object grammar (co-04) possible at all: a single-mode editor needs modifier
keys or menus for everything beyond typing, whereas modal editing treats "moving is a first-class
action" as the default, letting a small vocabulary of keys compose densely.

</details>

**E2.** This primer teaches vanilla Neovim with zero plugins, deliberately deferring configuration,
LSP, and completion to the next two topics in this journey. Why draw that boundary here
specifically, rather than teaching a plugin-heavy setup from day one? Tie your answer to the
`mechanism-vs-policy` big idea.

<details>
<summary>Model explanation</summary>

Vanilla Neovim is pure mechanism: modes, motions, operators, text objects -- editing primitives
that stay identical no matter which plugins, colorscheme, or language server eventually sit on
top. Plugins, LSP, and personal keymaps are policy: configurable choices layered on top of that
mechanism, and every one of them still ultimately expresses itself through the same modal grammar.
Teaching mechanism first means the muscle memory built here (motions, dot-repeat, macros) transfers
unchanged into whatever policy layer comes next; teaching one person's plugin setup first would
tie the fundamentals to their specific choices, which is exactly the coupling `mechanism-vs-policy`
warns against.

</details>

**E3.** Why does `.` (dot-repeat) only repeat "the last change" rather than an arbitrary earlier
edit -- why not let it replay any of your last ten edits by index?

<details>
<summary>Model explanation</summary>

`.` is deliberately a single-slot repeat, not a history browser, because its entire value is
speed: press it once, right after moving, with nothing to select and no menu to navigate. If it
had to disambiguate among several past edits it would need an argument or a picker, reintroducing
the friction the operator+motion grammar exists to remove. Registers and macros already exist as
the mechanism for storing and replaying more than one thing (co-07, co-14); `.` stays narrow on
purpose, so it remains a zero-cost reflex for the single most common case: "do that again, here."

</details>

**E4.** Undo in Neovim is a branching tree (co-13), not the linear undo/redo stack most editors
expose. Why keep abandoned branches around at all, instead of discarding them the instant a new
edit supersedes them, the way a linear stack would?

<details>
<summary>Model explanation</summary>

Discarding an abandoned branch the moment you make a new edit would silently destroy work at
exactly the moment an editor should be most forgiving -- right after you second-guessed yourself.
A tree costs a little more bookkeeping (`:undolist`, `g-`/`g+` to navigate branches instead of a
single `u`), but it guarantees no edit becomes truly unrecoverable just because a different edit
followed it. That's a strictly stronger safety property traded for a marginally larger mental
model.

</details>

**E5.** `:g/pattern/command` (the global command, co-12) and `:%s/pattern/replacement/g` (a ranged
substitution) can both "do something to every matching line". Why does Neovim need both instead of
one general-purpose mechanism?

<details>
<summary>Model explanation</summary>

`:%s///g` is specialized for exactly one job -- pattern-based text replacement -- and does it in a
single pass. `:g` is a general "search then act" primitive: the action run per matching line can be
any Ex command at all, not just a substitution -- delete the line (`:g/pat/d`), append text
(`:g/^-/normal A;`), or even a nested `:s` scoped to that one line. `:g` is strictly more general
because it treats "which lines" and "what to do to them" as two independently composable pieces,
where `:s` bakes the two together for the single most common case.

</details>

**E6.** Why does the black hole register (`"_`) exist as a separate register instead of adding a
dedicated "delete without saving" command?

<details>
<summary>Model explanation</summary>

The register model (co-07) is already the single mechanism Neovim uses for every yank, delete, and
paste. Adding a standalone command would introduce a second, parallel way to express the same
conceptual action. Routing "don't touch the unnamed register" through the existing register syntax
(`"_dd` instead of a new verb) keeps the mechanism uniform: any operator that can target a named
register can target the black hole register for free, with no new command to learn or remember.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) · Next: [Just Enough Lua](../../just-enough-lua/learning/overview.md) →
