---
title: "Capstone"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

## The capstone: a full professional workflow, end to end

**Goal**: take one small Python feature and run it through the full workflow this topic taught in
pieces -- TDD it on a feature branch, produce a clean conventional-commit history, wire a CI
pipeline that gates the change, and record an ADR -- ending with a green, reviewable change and its
decision trail. The feature is a per-transaction cap on loyalty-points redemption, continuing the
`loyalty`/gift-card narrative Examples 40-43, 49, and 54 already built: a compromised account can
currently zero out an entire cart with points in one transaction, and this capstone closes that gap.

Every script under `learning/capstone/code/` was actually run to capture the transcripts below --
**Python 3.13.14**, **ruff 0.15.17**, **pytest 9.1.1**, **git 2.55.0**, and **actionlint** (for
`ci.yml`) -- except the `gh`-driven review pass, shown as a mocked, hand-constructed, internally
consistent transcript, per this topic's own stated convention (no live network call, no dependency
on a real GitHub repository existing).

---

## Step 1: TDD the feature -- RED, GREEN, REFACTOR

**Context**: TDD's red-green-refactor loop is a prerequisite skill from
[Software Testing](../../../software-testing/learning/overview.md) -- this topic does not
re-teach TDD mechanics, only applies them inside the workflow this topic _does_ teach.
`redeem_points()` caps a single redemption at `MAX_REDEMPTION_FRACTION = 0.5` (50%) of the cart's
subtotal.

**`learning/capstone/code/tdd-and-history.sh`** (Step 1 portion):

```bash
echo "=== STEP 1a: RED -- a failing test against a not-yet-implemented stub ==="
cat >redemption.py <<'PY'
def redeem_points(cart_subtotal, points_requested):
    raise NotImplementedError
PY
cat >test_redemption.py <<'PY'
from redemption import redeem_points

def test_redeem_within_cap_succeeds():
    assert redeem_points(cart_subtotal=100.0, points_requested=40.0) == 40.0

def test_redeem_above_cap_raises():
    import pytest
    with pytest.raises(ValueError):
        redeem_points(cart_subtotal=100.0, points_requested=60.0)
PY
git add redemption.py test_redemption.py
git commit -q -m "wip: add test file and stub"
python3 -m pytest -q test_redemption.py || true
```

Full script (all three phases plus the history cleanup and SemVer derivation):
**`learning/capstone/code/tdd-and-history.sh`**.

**Output** (RED phase):

```text
FF                                                                       [100%]
=================================== FAILURES ===================================
_______________________ test_redeem_within_cap_succeeds ________________________
    def test_redeem_within_cap_succeeds():
>       assert redeem_points(cart_subtotal=100.0, points_requested=40.0) == 40.0
    def redeem_points(cart_subtotal, points_requested):
>       raise NotImplementedError
E       NotImplementedError
_________________________ test_redeem_above_cap_raises _________________________
E       NotImplementedError
2 failed in 0.01s
```

GREEN (minimal implementation) and REFACTOR (types + a named constant, `ruff format`-clean) both
pass `2 passed in 0.00s`, and `ruff check` reports `All checks passed!` -- the full transcript is in
**`learning/capstone/code/tdd-and-history-transcript.txt`**.
The final implementation lives in
**`learning/capstone/code/redemption.py`** and
**`learning/capstone/code/test_redemption.py`**.

**Verify**: `python3 -m pytest -q test_redemption.py` fails with `NotImplementedError` before the
implementation exists (RED), passes after the minimal implementation (GREEN), and still passes,
`ruff`-clean, after the refactor -- exactly the three phases the transcript shows, in that order.

**Key takeaway**: the test that specifies the 50% cap was written and confirmed FAILING before a
single line of real logic existed -- the test drove the implementation, not the other way around.

**Why It Matters**: a test written after the implementation can accidentally assert what the code
_does_ rather than what it _should_ do; writing it first and watching it fail for the right reason
(`NotImplementedError`, not an import error or a typo) is the only way to trust that the test can
actually catch a real regression later.

---

## Step 2: craft the history, and derive the release it implies

**Context**: the RED/GREEN/REFACTOR loop above naturally produces three low-signal `wip:` commits.
This step collapses them into two clean, correctly typed and scoped Conventional Commits (co-01,
co-02) -- the scriptable equivalent of an interactive-rebase squash-and-reword -- then derives the
SemVer bump and changelog entry that history implies (co-03, co-04), exactly as Example 45 did.

**`learning/capstone/code/tdd-and-history.sh`** (Step 2 portion):

```bash
git reset --mixed "$BASE"
git add test_redemption.py
git commit -q -m "test(loyalty): add failing test for capped points redemption"
git add redemption.py
git commit -q -m "feat(loyalty): cap points redemption at 50 percent of cart subtotal"
```

**Output**:

```text
=== messy history BEFORE cleanup (3 commits) ===
cd18e25 wip: refactor with types
3caa38d wip: make it pass
f5b5e5f wip: add test file and stub

=== STEP 2: collapse into a clean, conventional-commit history ===
=== clean history AFTER cleanup (2 commits) ===
3dedac0 feat(loyalty): cap points redemption at 50 percent of cart subtotal
acfd018 test(loyalty): add failing test for capped points redemption
TEST_SHA=acfd018
FEAT_SHA=3dedac0

=== deriving the SemVer bump and changelog entry from v1.0.0..HEAD ===
feat(loyalty): cap points redemption at 50 percent of cart subtotal
test(loyalty): add failing test for capped points redemption
highest-severity commit type present -> SemVer bump: MINOR (v1.0.0 -> v1.1.0)
--- derived changelog entry (test-only commits excluded, per Example 6) ---
## [1.1.0] - 2026-07-18

### Added

- A single points redemption is now capped at 50% of the cart subtotal, closing a fraud-detection
  gap where a compromised account's points could zero out an entire order in one transaction.
```

**Verify**: `git log --oneline` shows exactly two commits, each correctly typed (`test`, `feat`) and
scoped (`(loyalty)`); the derived bump is `MINOR` because the only release-facing commit type
present is `feat` (no `!` or `BREAKING CHANGE:` footer); the changelog entry lands under `### Added`
in the Keep a Changelog format, excluding the `test`-typed commit entirely.

**Key takeaway**: the same three-line derivation from Example 45 applies unchanged here -- a clean,
correctly typed commit history is not just tidier to read, it is the direct SOURCE of an accurate
release version and changelog, computed rather than guessed.

**Why It Matters**: this closes the loop between "history hygiene" and "release accuracy" -- a team
that skips commit-message discipline either has to reconstruct a changelog by hand later (slow,
error-prone) or ships a release with no changelog at all, both worse than deriving it for free from
commits that were already correctly typed.

### Self-review and PR (co-05, co-06, co-07)

Before wiring the CI gate, the branch goes through the terminal-driven review loop Examples 8, 9,
and 48 introduced separately -- applied here to this capstone's own change.

**`learning/capstone/code/pr-review.sh`**:

```bash
git diff --stat main feature/points-redemption-cap
gh pr create --title "feat(loyalty): cap points redemption at 50 percent" \
  --body "Adds a per-transaction redemption cap. See adr-0001.md for the decision record." --base main
gh pr review 201 --comment --body "nit: consider naming the error 'RedemptionCapExceededError' \
  instead of a bare ValueError -- not blocking, your call"
gh pr review 201 --approve --body "praise: the failing-test-first commit makes the intent easy to \
  follow. LGTM"
gh pr view 201 --json reviewDecision
```

Full script: **`learning/capstone/code/pr-review.sh`** (mocked `gh` output,
per this topic's own convention). Full transcript:
**`learning/capstone/code/pr-review-transcript.txt`**.

**Output** (excerpt):

```text
redemption.py      | 12 ++++++++++++
test_redemption.py |  9 +++++++++
2 files changed, 21 insertions(+)

✓ Commented on acme/checkout-service#201
✓ Approved acme/checkout-service#201

{
  "reviewDecision": "APPROVED"
}
```

**Verify**: the self-review diffstat (2 files, 21 lines) confirms the change stays small and
single-concern (co-06); the review comment is labeled `nit:`, not `blocking:` (co-05, per Example
52's convention); `reviewDecision` reads `APPROVED` only after both the comment and the approval, in
that order (co-07).

**Key takeaway**: a `nit`-labeled comment does not block the merge -- the author acknowledges it and
moves on, and the reviewer's approval still lands, exactly the severity-labeling discipline Example
52 named.

**Why It Matters**: this is the moment the review loop and the commit-history work meet -- a
reviewer reading a two-commit, correctly typed history (Step 2) can review the change faster and
more confidently than the same diff buried in three `wip:` commits would allow.

---

## Step 3: wire the CI gate, and prove it actually gates

**Context**: a lint -> test -> build pipeline (co-08) where each stage only runs if the one before
it passed (co-09), backed by the SAME `ruff` commands already run locally (co-10). Validated with
`actionlint` -- zero findings.

**`learning/capstone/code/ci.yml`**:

```yaml
name: ci
on:
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: pip install ruff
      - run: ruff check .
      - run: ruff format --check .

  test:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: pip install pytest
      - run: pytest -q

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: python -m py_compile redemption.py
```

Full annotated file: **`learning/capstone/code/ci.yml`**.

**Output** (the clean commit passes all three stages -- job list mocked, `ruff`/`pytest` output
genuinely executed):

```text
NAME              DESCRIPTION  ELAPSED  RESULT
ci / lint                       3s      ✓ pass
ci / test                       2s      ✓ pass
ci / build                      2s      ✓ pass
```

**Output** (a deliberately broken follow-up commit -- `MAX_REDEMPTION_FRACTION` mistakenly bumped
from `0.5` to `1.5` -- fails the gate; full transcript in
**`learning/capstone/code/ci-broken-commit-transcript.txt`**):

```text
NAME              DESCRIPTION  ELAPSED  RESULT
ci / lint                       4s      ✓ pass
ci / test                       3s      ✗ fail
ci / build                      -       ⊘ skipped (needs: test)

--- ci / test -- pytest -q ---
.F                                                                       [100%]
E       Failed: DID NOT RAISE ValueError
1 failed, 1 passed in 0.01s

error: the required check "ci / test" is failing -- this branch cannot be merged until it is fixed
```

**Verify**: the clean commit's `ci / lint`, `ci / test`, and `ci / build` all report `✓ pass`; the
broken commit's `ci / lint` still passes (the bug is a wrong constant, not a style violation), but
`ci / test` genuinely fails with `DID NOT RAISE ValueError` (real `pytest` output against the broken
`MAX_REDEMPTION_FRACTION = 1.5`), and `ci / build` never runs (`needs: test` was not satisfied).

**Key takeaway**: the pipeline's own `needs:` chain is what turns "lint passed" into "the whole
change is safe to merge" -- a lint-clean, logically wrong commit is caught at the `test` stage, one
stage before an expensive or irrelevant `build` step would have run for nothing.

**Why It Matters**: a CI pipeline that only runs one flat job cannot express "stop here, don't waste
time on the next stage" -- staged, gated jobs (co-08, co-09) fail fast and fail cheap, exactly the
behavior this deliberately-broken commit demonstrates.

---

## Step 4: record the decision

**Context**: a redemption cap is a hard-to-reverse, customer-facing business rule -- exactly the
kind of change Example 32's two-question test (does reversing this cost more than a day, does it
affect more than one team) says earns a linked ADR (co-18).

**`learning/capstone/code/adr-0001.md`** (excerpt):

```text
# ADR-0001: cap a single points redemption at 50% of the cart subtotal

## Status
Accepted

## Context
Loyalty points currently have no per-transaction redemption limit... Finance flagged this as
a fraud-detection blind spot...

## Decision
Cap a single redemption at MAX_REDEMPTION_FRACTION = 0.5 (50%) of the cart's pre-discount
subtotal, enforced in redeem_points() (redemption.py, commit 3dedac0, "feat(loyalty): cap
points redemption at 50 percent of cart subtotal")...

## Consequences
A customer redeeming points for a large chunk (but not all) of a purchase is unaffected...
```

Full document: **`learning/capstone/code/adr-0001.md`**.

**Verify**: the ADR's `## Decision` section names the exact implementing file (`redemption.py`) and
the exact commit SHA and subject (`3dedac0`, `feat(loyalty): cap points redemption at 50 percent of
cart subtotal`) that Step 2's own transcript produced -- the ADR references the real change, not a
hypothetical one.

**Key takeaway**: the ADR does not just record "we added a cap" -- it records the alternatives that
were rejected (no cap, a fixed-dollar cap, a full fraud service) and why, which is the part a future
reader actually needs and the part a commit message alone cannot carry.

**Why It Matters**: six months from now, an engineer wondering "why 50% and not some other number"
finds the answer, the rejected alternatives, and the exact commit that implemented it in one
document -- instead of re-litigating a decision that was already made deliberately.

---

## Concepts exercised

- [x] TDD red -> green -> refactor (co-11, co-13) -- Step 1.
- [x] A feature branch + clean conventional commits (co-01, co-02) -- Step 2.
- [x] A SemVer bump + changelog entry (co-03, co-04) -- Step 2.
- [x] Linting/formatting + pre-commit-equivalent gate (co-09, co-10) -- Steps 1 and 3.
- [x] A CI pipeline (lint -> test -> build) as a required check (co-08) -- Step 3.
- [x] An ADR (co-18) -- Step 4.
- [x] A self-review + review-etiquette pass (co-05, co-06, co-07) -- the "Self-review and PR"
      section between Steps 2 and 3.

**Done bar**: the pipeline gates the change end to end (a clean commit passes all three stages, a
broken commit is caught at `test` and never reaches `build`), the ADR documents the real decision
with the actual commit SHAs, and every concept in the checklist above is demonstrated with genuinely
executed output (except the mocked `gh` review pass, per this topic's stated convention).

---

← Previous: [Advanced Examples](../advanced.md) &middot; Next: [Drilling](../../drilling/overview.md)
→
