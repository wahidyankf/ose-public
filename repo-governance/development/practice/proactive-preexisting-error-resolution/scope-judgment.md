---
description: How to size a discovered preexisting-error fix as small (fix inline), medium (its own commit in the current session), or large (a plan)
when_to_use: Use when deciding how big a change to make in response to a discovered preexisting error.
---

# Scope Judgment

## Small Fixes (fix inline)

These require no separate commit and no deliberation:

- Broken links in documentation
- Incorrect or outdated configuration values
- Dead imports or unused variables created by a previous refactor
- Typos in error messages or comments
- Minor validation gaps (empty string edge cases, null checks)

Fix these as part of your current work. They take seconds to minutes.

## Medium Fixes (fix in a separate commit)

These warrant their own commit but belong in the current session:

- Broken tests (failing or flaking)
- Incorrect implementations that produce wrong results on valid inputs
- Incorrect contracts between modules
- Environment configuration that fails on standard inputs

Fix these within the current session. Write a commit message that references the preexisting bug, for example: `fix(user-service): validate empty strings in user input (preexisting bug)`.

## Large Fixes (create a plan and execute it)

These require more than a single commit:

- Architectural problems where the wrong abstraction is used throughout a module
- Systemic configuration issues affecting multiple services
- Test suites with fundamental structural problems (testing implementation instead of behaviour)

Create a plan in `plans/in-progress/` and begin executing it. The presence of a plan does not defer the work — it organizes it. Execution starts immediately.

## Defects in Pinned Upstream Tools

A defect in HIPPO or RHINO is never patched here, whatever its size. It follows
[Upstream Tool Defects](../../workflow/upstream-tool-defects.md): a two-pager at its owner while the
work continues on a workaround, or a bug-fix plan at its owner when it blocks the work with no
workaround. FERRET is built in this repository, so its defects take the sizes above.
