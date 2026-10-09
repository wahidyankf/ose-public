---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [1 · Just Enough Nvim](../../just-enough-nvim/learning/overview.md) -- you should
  be comfortable opening, editing, and saving files before writing and running Python scripts; the
  [Pass 0 forge capstone](../../capstone-forge-ready/overview.md) is recommended but not
  required.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.14** installed (`python3 --version`)
  with `venv` and `pip` available. Some Linux distributions package these separately, so follow
  your distribution's instructions if `python3 -m venv` or `python3 -m pip` fails. Install the
  `black`, `ruff`, and `pyright` CLIs in a virtual environment when you reach their examples.
- **Assumed knowledge**: basic terminal use. No prior Python is required -- this is the reader's Python
  starting point.

## Why this exists -- the big idea

Pass 1-3 build real software, and they need one default language you can read and run without
ceremony -- this primer makes Python that tool before the topics that lean on it. The one idea worth
keeping if you forget everything else: **Python is executable pseudocode** -- optimize for the reader
first; clarity is the whole point, and speed is bought back later only where measured.

**Cross-cutting big ideas**: `abstraction-and-its-cost` -- Python's high-level built-ins (lists, dicts,
comprehensions) buy readable code and charge runtime overhead you spend deliberately, not by default;
every comprehension in this primer is exactly that trade made visible.
`correctness-vs-pragmatism` -- Python's type hints are optional and unenforced at runtime (Example 84
proves it directly): the language lets you ship first and verify later with a separate tool
(`pyright`), rather than forcing "provably right" before anything runs at all. Both ideas recur
throughout this primer's worked examples, not just in this opening section.

## Install and run your first script

Install Python 3.14 from [python.org/downloads](https://www.python.org/downloads/) or your
platform's package manager, then confirm the version:

```text
$ python3 --version
Python 3.14.7
```

**A note on versions**: the captured outputs were produced with CPython **3.14.3**. The commands
and examples were also checked with **3.14.7**; output from version-printing commands naturally
depends on the tool you install. For current Python patch releases, see the
[official downloads page](https://www.python.org/downloads/). `black` **26.5.1**, `ruff` **0.15.21**,
and `pyright` **1.1.411** were used for the tool-specific examples when this course was authored;
their versions and diagnostic wording may change. Strict mode for `pyright` is set via config
(`"typeCheckingMode": "strict"`) or an inline `# pyright: strict` comment -- there is **no** `--strict`
CLI flag.

Every example in this primer is a complete, self-contained `.py` file (or small file set) colocated
under `learning/code/`. The command you will run for almost every one of them is exactly this:

```text
python3 example.py
```

**Exceptions, all deliberate**: Examples 2-5 demonstrate CLI workflows (`-c` inline execution, `venv`
creation, `black`, `ruff`) rather than a single script run; Examples 46, 47, 61-64, 73-75, 81-82 name
their file differently (`mod.py`, `cli.py`, a package under `app/`, and so on) because the filename
itself is part of what the example teaches -- each one states its exact run command in its own **Run**
line.

## How this primer is organized

- **Beginner** (Examples 1-28) -- running Python three ways, virtual environments, `black`/`ruff`,
  the primitive types and type hints, operators, f-strings and string methods, lists, tuples,
  dictionaries, sets, slicing, conditionals, and loops.
- **Intermediate** (Examples 29-60) -- comprehensions and generator expressions, functions (typed
  signatures, defaults, keyword args, `*args`/`**kwargs`, multiple returns), lambdas and closures,
  scope, modules and imports, exceptions, file I/O, JSON, and a first pass at classes.
- **Advanced** (Examples 61-84) -- `argparse` CLIs, multi-module packages, custom exception classes
  and exception chaining, dataclasses, ruff-clean typed signatures, generator functions, custom
  context managers, JSON pipelines, `pytest` unit tests, and static type checking with `pyright`
  (including the one case where `pyright` catches a bug that `python3` itself does not).

Every example cites the concept (`co-NN`) it exercises. For the language and environment rules,
use the [Python 3.14 documentation](https://docs.python.org/3.14/) and its
[virtual environment guide](https://docs.python.org/3.14/tutorial/venv.html).

## Scope: just enough, not comprehensive

This is a **Primer**, not a comprehensive Python reference: it covers exactly the language surface
Pass 1-3's Python-primary topics depend on, and deliberately excludes decorators beyond `@dataclass`,
`async`/`await`, metaclasses, descriptors, the full `typing` module (`Protocol`, `Generic`,
`overload`), packaging/distribution (`pyproject.toml`, wheels, publishing), threading/multiprocessing,
and C-extension interop. Full object-oriented Python is previewed here (Examples 59, 60, 65, 67, 71)
and gets its complete treatment in a later topic. If a Python feature is not exercised by a later
topic in this journey, it is out of scope here on purpose, not by oversight.

---

← Previous: [Pass 0 Capstone · Forge-Ready](../../capstone-forge-ready/overview.md) · Next:
[Beginner Examples](./beginner.md) →
