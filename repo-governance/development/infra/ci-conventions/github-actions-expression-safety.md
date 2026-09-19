---
description: Two GitHub Actions expression-injection and falsy-value antipatterns.
when_to_use: Use when a run step references a ${{ ... }} expression.
---

# Expression Safety

Two failure modes recur whenever a workflow step's `run:` block references a `${{ ... }}`
expression directly:

1. **Matrix/context values feeding a shell command must route through `env:`, never splice
   into `run:` directly.** `run: ./rhino gate run --surface <declared-surface>` lets a
   matrix value that contains shell metacharacters execute as shell code (GitHub's documented
   script-injection class for `pull_request`-triggered workflows, where matrix/context values can
   originate from untrusted input). Fix: set a step-level `env:` mapping the expression to a
   variable, then reference the **shell** variable in `run:`:

   ```yaml
   - run: ./rhino gate run --surface pull-request --base "$BASE_SHA" --head "$HEAD_SHA"
     env:
       GROUP_ID: ${{ matrix.group.group }}
   ```

   `Rhino`'s `gate validate` command enforces this pattern for **both** matrix values that
   currently reach the shell — `matrix.group.group` (via `validate_ci_matrix_contract`) and
   `matrix.group.doctor_tools` (via `validate_ci_doctor_bootstrap`), both in
   the pinned Rhino lifecycle validator. Each function requires the safe `env:`-indirected
   step **and** rejects a raw, unindirected splice of its matrix expression anywhere in the
   workflow's `run:` bodies — so any step referencing `matrix.group.group` or
   `matrix.group.doctor_tools` directly, without an `env:` indirection, fails validation, regardless
   of whether a compliant step is also present. Both checks are deliberately **name-agnostic**: any
   step-env variable name carrying the matrix expression is accepted, so a repo naming its variable
   `GATE_DOCTOR_TOOLS` rather than `DOCTOR_TOOLS` is not spuriously rejected.

2. **`condition && 0 || fallback` never evaluates to `0`.** GitHub Actions expressions use
   JavaScript-like short-circuit `&&`/`||`, and `0` (like `''` and `false`) is falsy — so
   `true && 0` produces `0`, but a trailing `|| fallback` then treats that `0` as falsy and
   substitutes `fallback` regardless of the left-hand condition. This is a well-known
   community-documented GHA antipattern, general to any expression choosing between a falsy value
   and a truthy fallback via `&&`/`||` chaining. Fix: reorder so the falsy value is never the
   right-hand operand of `&&` — negate the condition and swap the operands instead:
   `${{ condition-negated && fallback || 0 }}`. Manually truth-table any expression that produces
   `0`, `''`, or `false` on one branch before trusting it — a spot check against only the case
   that motivated the expression is not sufficient.
