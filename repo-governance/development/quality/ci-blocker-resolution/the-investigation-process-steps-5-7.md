---
description: "Steps 5-7: apply the fix, verify, audit an existing mitigation."
when_to_use: "Use when applying and verifying a fix for a CI blocker."
---

# The Investigation Process (Steps 5-7)

## Step 5: Apply the Fix

Fix the root cause with a minimal, correct change. Commit it separately:

```bash
# Fix the issue
# ... edit files ...

# Commit the preexisting fix separately
git add .
git commit -m "fix(project-name): resolve preexisting typecheck failure in shared types"

# Now continue with your feature work
```

## Step 6: Verify

Re-run the quality gates to confirm the fix resolves the failure — either the affected `test:quick`
target directly, or the full local pre-push gate set via the same shim `.husky/pre-push` invokes:

```bash
./hippo run --class transactional --disk-path . -- npm exec nx -- affected -t test:quick
# or, to run every registry-declared pre-push gate the hook runs, with each gate's output:
apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push
```

## Step 7: When a mitigation already exists and the symptom persists, audit the mitigation

A failure that a previous fix was supposed to prevent is **not** evidence that the failure is
unfixable infrastructure flake. It is first evidence that the mitigation does not do what its own
comment claims.

The specific trap: a mitigation that reserves, pre-installs, or pre-warms a named resource only
works if it names that resource in the **same vocabulary the consumer uses**. A `setup-rust`
pre-install step read each crate's `rust-version` and ran `rustup toolchain install 1.95.0`, while
the racing consumer — `cargo hack --rust-version` — resolves the floor to its major-minor form and
requests `rustup toolchain add 1.95`. rustup stores those as **distinct toolchains in distinct
directories**, so the mitigation satisfied nothing. It had been in place and passing review for
several phases while providing zero protection, and its failure mode was indistinguishable from the
original flake — which is why four prior occurrences were all filed as accepted infra flake.

**Do**: verify by observing the consumer's actual invocation (a stub on `PATH` that logs its
arguments, or the tool's own debug output), never by re-reading the mitigation's stated intent.

**Watch for silent no-ops in the mitigation itself.** The same step extracted versions with
`grep -rhoP`; BSD grep has no `-P`, so on macOS the loop iterated an empty list, installed nothing,
and still exited 0. A mitigation that cannot fail is a mitigation you cannot verify — prefer
portable constructs, and assert the mitigation produced a non-empty result.
