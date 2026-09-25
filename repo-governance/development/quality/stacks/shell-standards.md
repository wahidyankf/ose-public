---
description: >-
  Fixes the shell baseline beyond script mechanics: a dialect the static analyser supports or a named fallback, analyser
  and formatter gates, strict-mode gaps closed, quoted and validated input, small scripts, and behaviour tests without
  coverage.
when_to_use: >-
  Use when creating, configuring, or reviewing a shell script, or when choosing its dialect, deciding whether logic has
  outgrown shell, or testing a script.
---

# Shell Standards

This standard is canonical for shell as a stack. It inherits [Shell Scripts](../code/shell-scripts.md), which owns the
declared interpreter, strict mode, the executable bit, comments, JSON parsing, and output inspection, and it adds only
the choices a shell stack leaves open. A shell programming skill defers to both.

It implements Fail Closed,
[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md), and
[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md).

## Gates

- **Static analysis:** every script is analysed at the threshold [Lint Strictness](../cross-language-lint-strictness.md) sets,
  each directive that disables a check carrying its reason. Example: ShellCheck.
- **Format:** one formatter in diff mode over committed settings, failing on any change. Example: `shfmt -d`.
- **Unsupported dialect:** a script in a dialect the analyser cannot read passes the shell's own syntax check instead,
  and review carries what analysis would have caught. Example: ShellCheck reads sh, Bash, dash, and ksh but not Zsh
  ([SC1071](https://www.shellcheck.net/wiki/SC1071)), so a Zsh script runs `zsh -n`.

A repository script uses an analysable dialect unless the script exists to configure a shell that is not one.

## Strict Mode Has Gaps

Exit-on-error does not apply inside a condition, on the left of `&&` or `||`, or in a command substitution unless the
shell is told to inherit it, and `local x="$(cmd)"` reports the status of `local`, not of `cmd`
([BashFAQ 105](https://mywiki.wooledge.org/BashFAQ/105)). So:

- a function whose failure matters is not called only as a condition;
- a declaration and an assignment from a command substitution are separate statements; and
- a Bash script that relies on substitutions failing sets `shopt -s inherit_errexit`.

A Zsh script's strict mode is `ERR_EXIT`, `PIPE_FAIL`, and `NO_UNSET`
([options](https://zsh.sourceforge.io/Doc/Release/Options.html)).

## Type and Boundary Safety

Shell has no types, so [Type and Boundary Safety](../code/type-and-boundary-safety.md) maps to discipline at input:

- Every expansion is quoted, as `"${var}"`, and a list is an array, never a space-separated string.
- Arguments are checked for count and shape before any is used, and an operand taken from input follows `--`.
- `eval` and unquoted command construction are never used.
- In Bash, tests use `[[ ]]` and substitutions use `$( )`.

## Keep Scripts Small

Shell orchestrates commands; it is not where domain logic lives. A script that needs data structures beyond arrays,
arithmetic beyond counters, or grows past roughly a hundred lines moves its logic to a language with types and a unit
layer ([Shell Style Guide](https://google.github.io/styleguide/shellguide.html)). Within a script:

- variables inside functions are `local`; and
- a script longer than a few commands defines functions and ends in `main "$@"`.

## Tests

A shell test runs the script as its callers do and asserts on exit status, output, and effects. Each test works in
isolation per [Git Fixture Isolation](../git-fixture-isolation.md) and
Test Data Isolation, and is classified by the boundary it touches under
[Test Boundaries and Gates](../../behaviour-driven-development.md). Example: bats-core.

Shell coverage is never a gate. The available instruments report unreliably for shell
([kcov](https://raw.githubusercontent.com/SimonKagstrom/kcov/master/doc/kcov.1)), so no floor or surrogate figure is
recorded, per [Meaningful Coverage](../testing/meaningful-coverage.md). Behaviour tests over every documented exit path
carry the evidence instead.

## Documentation

A script's header comment says what it is for, as Shell Scripts requires. Its exit statuses and streams follow
[Command-Line Interface](../../../conventions/structure/command-line-interface.md) at the tier the adopter records for
it, and a script at the full bar documents its usage through help.

## Adopter Decisions

| Decision  | Option                           | Gains                                    | Costs                                    |
| --------- | -------------------------------- | ---------------------------------------- | ---------------------------------------- |
| test tool | a shell test framework           | tests read as the shell they exercise    | a dependency to pin                      |
|           | the repository's main test stack | one runner and one report for every test | each test spawns the script as a process |

Record the choice in the repository adapter [Stack Packs](../../../conventions/structure/stack-packs.md) defines.

## Enforcement

The analyser, the formatter, and the syntax check enforce the gates in the adopter's own hooks and pipeline. Review
applies quoting, input checks, the strict-mode gaps, and script size.
