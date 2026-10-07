---
description: >-
  Fixes how Python tests are layered and measured, and forbids a test that depends on how deep the interpreter's C
  recursion reaches before giving up.
when_to_use: >-
  Use when writing, placing, or measuring the tests of a Python project, or when a test needs input the interpreter
  refuses as too deeply nested.
---

# Tests

[Back to Python Standards](../python-standards.md)

Suites are separated by layer. A fixture that creates a temporary directory or sets an environment variable reaches a
boundary the unit layer excludes, so a test using one is integration, as
[Test Boundaries and Gates](../../../behaviour-driven-development.md) classifies it. Example: pytest, whose `tmp_path`
and `monkeypatch.setenv` are integration tools in this sense.

Coverage is measured with branch measurement on, in the unit run. A partial branch that cannot be taken is excluded with
its reason, per [Meaningful Coverage](../../testing/meaningful-coverage.md). Example: coverage.py with `branch = true`
and `fail_under` ([branch coverage](https://coverage.readthedocs.io/en/latest/branch.html)). Any floor is recorded under
[Layers and Adapters](../../../behaviour-driven-development.md).

## Recursion Depth

A test that needs the interpreter to give up on deeply nested input forces that give-up for the one exact input it
feeds, through a test double around the parser, rather than choosing an input deep enough to trigger it.

Reason: the depth at which CPython's C code gives up depends on the C stack the thread has left, so it differs by
platform and stack size. CPython 3.14's JSON scanner gave up near 43,000 levels on an 8 MiB macOS arm64 stack and near
52,000 on an 8 MiB linux/amd64 stack, so an input chosen on one machine read to its end and raised a different error on
another, and a test passed locally and failed in CI.

The rule is followed when a test reaches the give-up through a double that raises for its exact input, and violated
when a test builds nested input of a chosen depth and expects the interpreter to raise. Example: FERRET's
`tests/support/decoder.py` `gives_up_on`, which makes `json.loads` raise `RecursionError` for one document only.
