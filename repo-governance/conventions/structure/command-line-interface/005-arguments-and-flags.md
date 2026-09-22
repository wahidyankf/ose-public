---
description: >-
  Fixes argument syntax against the published utility guidelines — the end-of-options delimiter, option-value forms,
  reserved flag names, and configuration precedence.
when_to_use: >-
  Use when adding a flag or positional argument, choosing a flag name, or deciding how configuration sources combine.
---

# Arguments and Flags

## The Published Guidelines Decide the Syntax

Argument syntax is not a design space. It was settled by the utility syntax guidelines in the base definitions of the
portable operating system standard, and a tool that deviates is harder to use for no benefit.

Three of those guidelines carry most of the weight:

- The first `--` that is not itself an option-argument ends the options. Every argument after it is an operand, **even
  if it begins with `-`**. Without this a caller cannot pass a file whose name starts with a dash, and cannot safely
  forward arguments it did not construct.
- An option and its value may be given as two separate arguments. This is the form a caller building a command from
  variables produces naturally.
- Single-character options may be grouped behind one `-` when at most the last of them takes a value.

## Reserved Names

These names mean one thing everywhere and are never reused for anything else.

| Flag           | Means                                                          |
| -------------- | -------------------------------------------------------------- |
| `-h`, `--help` | Print usage to standard output and exit `0`                    |
| `--version`    | Print the tool's name and version to standard output, exit `0` |
| `--output`     | Select an output format                                        |
| `--color`      | Control escape emission: `auto`, `always`, or `never`          |
| `--no-input`   | Never prompt                                                   |
| `--`           | End of options                                                 |

`-h` is accepted on every subcommand, not only at the top level, and a tool with a subcommand tree also accepts `help`
as a subcommand — see [Help and Discovery](008-help-and-discovery.md), which also fixes what a tool does when it is
invoked with no arguments at all. A caller who has navigated three levels into a subcommand tree is exactly the caller
who needs help, and making them return to the root to get it is a small cruelty repeated often.

`--help` and `--version` suppress the tool's normal function entirely. Once either is seen, other options and arguments
are ignored and no work is performed. Both print to standard output and exit successfully; this is what the established
coding standards for command-line programs require, and it is what every caller expects.

## Configuration Precedence

**Guidance rather than a fixed rule.** Unlike the rest of this module, the precedence order below rests on no source
this catalog was able to verify, so it is recommended and not asserted. A tool ordering its sources differently
conforms, provided it publishes the order it uses. The recommendation, nearest the invocation winning:

1. An explicit flag
2. An environment variable
3. A configuration file
4. The built-in default

What **is** required is that the order be published rather than merely implemented. A caller diagnosing a setting that
did not take effect is otherwise reduced to guessing, and that obligation needs no external source: it follows from this
contract's own premise that a caller should not have to read a tool to predict it.

Configuration, data, state, and cache files live where the base directory specification puts them: `$XDG_CONFIG_HOME`,
`$XDG_DATA_HOME`, `$XDG_STATE_HOME`, and `$XDG_CACHE_HOME`, defaulting to `$HOME/.config`, `$HOME/.local/share`,
`$HOME/.local/state`, and `$HOME/.cache`.

The fallback condition matters as much as the paths. Each variable falls back to its default when it is **either unset
or empty**, so an exported empty string is not an override. A tool that tests only for presence will treat an empty
variable as a path and resolve everything relative to nothing.
