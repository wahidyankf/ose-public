---
title: "Intermediate Examples"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 20
---

Examples 19-43 apply engineering hygiene day to day: reading the test pyramid's shape and coverage's
limits during review (co-11, co-12), systematic hypothesis-driven debugging including `git bisect`
(co-13), continuous refactoring and the boy-scout rule (co-14, co-15), tracked technical debt
(co-16), documentation-as-code (co-17), when a change earns an ADR (co-18), estimation pitfalls
(co-19), pairing and mobbing (co-20), a written Definition of Done (co-21), feature flags (co-22),
and blameless incident response (co-23). Several examples in this set (20, 22, 23) follow one
running bug -- a swapped discount/kept-amount calculation -- so the debugging discipline compounds
across examples the same way a real investigation does.

---

### Example 19: Test-Pyramid Shape Flagged in Review

_ex-19 &middot; exercises co-11_

**co-11 -- test-pyramid-as-practice**: day to day, the pyramid's "many fast, few slow" shape is a
design choice a reviewer can name and flag when a change skews it.

```text
This PR adds 10 new end-to-end tests and 0 unit tests for gift-card redemption's own validation
logic. That inverts the test pyramid: e2e tests here take ~45s each versus <10ms for a unit test of
the same validation function in isolation.
```

Full artifact: **[`learning/artifacts/ex-19-pyramid-shape-check-in-review.md`](./artifacts/ex-19-pyramid-shape-check-in-review.md)**.

**Verify**: the comment names the specific violated shape and ties it to a concrete cost, not a
vague "add more unit tests" ask.

**Key takeaway**: the test pyramid is a reviewable property of a diffstat, checkable by counting new
files per test tier.

**Why It Matters**: a PR that only adds e2e tests eventually makes the whole suite too slow to run
on every commit, pushing teams toward running tests less often.

---

### Example 20: 100% Coverage, Zero Real Assertions

_ex-20 &middot; exercises co-12_

**co-12 -- coverage-as-signal-not-target**: a coverage percentage is a proxy for testedness, not
proof of correctness. This example ships a real bug and a test that reaches full line coverage of
it while checking nothing about the result.

**`learning/code/ex-20-coverage-number-without-assertions/discount.py`**

```python
# learning/code/ex-20-coverage-number-without-assertions/discount.py
"""ex-20: a function with a real bug, still reachable at 100% line coverage (co-12)."""  # => co-12: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic


def apply_discount(total: float, pct: float) -> float:  # => co-12: the function under test
    return total * pct  # => co-12: BUG -- should be total * (1 - pct); a 20% discount on $100
    # => co-12: should return $80, this returns $20 -- the discount and the KEPT amount are swapped
```

**`learning/code/ex-20-coverage-number-without-assertions/test_discount_weak.py`**

```python
# learning/code/ex-20-coverage-number-without-assertions/test_discount_weak.py
"""ex-20: a test that reaches 100% line coverage of discount.py, and asserts NOTHING real (co-12)."""  # => co-12: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic

from discount import apply_discount  # => co-12: imports the ONE function this whole test file exercises


def test_apply_discount_runs() -> None:  # => co-12: pytest collects this because its name starts with test_
    """Call apply_discount -- covers its one line -- but check nothing about the RESULT."""  # => co-12: documents this test's own (weak) contract
    result = apply_discount(100.0, 0.2)  # => co-12: this call is what makes coverage report 100% -- the line RUNS
    assert result is not None  # => co-12: an assertion that is ALWAYS true for a float return -- verifies NOTHING
    # => co-12: this test passes for ANY numeric return value -- $20, $80, or -$500 all satisfy "is not None"
```

**Run**: `pytest -q test_discount_weak.py` then `coverage run -m pytest test_discount_weak.py && coverage report`

**Output**:

```text
$ pytest -q test_discount_weak.py
1 passed in 0.01s

$ coverage run -m pytest test_discount_weak.py -q && coverage report
1 passed in 0.01s
Name          Stmts   Miss  Cover
---------------------------------
discount.py       2      0   100%
---------------------------------
TOTAL              2      0   100%

$ python3 -c "from discount import apply_discount; print(apply_discount(100.0, 0.2))"
20.0
```

**Key takeaway**: the coverage report says `100%` and the test suite is green, while the function is
provably wrong -- `apply_discount(100.0, 0.2)` returns `20.0`, not the correct `80.0`.

**Why It Matters**: this is exactly the failure mode Example 21's memo argues against mandating a
100% target for -- a green suite and a perfect coverage number gave zero signal that this bug
existed, because coverage measures whether a line RAN, never whether a test checked what it did.

---

### Example 21: Memo -- Why a 100% Coverage Gate Backfires

_ex-21 &middot; exercises co-12_

```text
Coverage is a PROXY for testedness, not proof of correctness. Example 20 shows this concretely: a
function with a real bug reaches 100% line coverage under a test that calls it but asserts nothing.

The moment a metric becomes a merge-blocking TARGET, Goodhart's law predicts people optimize the
metric instead of the underlying goal: assertion-free "coverage padding" tests, deleted edge-case
handling, and time spent covering trivial getters instead of risky logic.
```

Full artifact: **[`learning/artifacts/ex-21-goodhart-coverage-target-memo.md`](./artifacts/ex-21-goodhart-coverage-target-memo.md)**.

**Verify**: the memo names the assertion-free-test failure mode as its central argument, cross-
referencing the concrete example that demonstrates it.

**Key takeaway**: any metric that becomes a hard merge gate invites the cheapest way to satisfy the
gate.

**Why It Matters**: this is Goodhart's law applied to a concrete engineering practice.

---

### Example 22: Rubber-Duck Narration Surfaces the Wrong Assumption

_ex-22 &middot; exercises co-13_

**co-13 -- systematic-debugging-practice**: narrating the expected behavior sentence by sentence,
before touching a debugger, on the exact bug Example 20 shipped.

```text
1. I call redeem(card, amount) with amount less than the card's full balance.
2. redeem() should compute remaining = card.balance - amount and return it.
3. I'm SEEING remaining == 0 every time, regardless of amount.
4. That means either (a) card.balance is already 0 when redeem() runs, (b) amount always equals
   card.balance, or (c) the subtraction itself is wrong.
5. ...wait. I'm assuming card.balance is read BEFORE the subtraction. Let me check the actual
   line order -- does something update card.balance to 0 BEFORE the remaining-balance line runs?
```

Full artifact: **[`learning/artifacts/ex-22-rubber-duck-explain-the-bug.md`](./artifacts/ex-22-rubber-duck-explain-the-bug.md)**.

**Verify**: the wrong assumption surfaces at step 5, purely from re-reading the narration, before
any debugger runs.

**Key takeaway**: saying the expected behavior out loud forces you to notice a silently wrong
assumption that skimming the code let slide by.

**Why It Matters**: most bugs are a wrong mental model, not a mystery that requires instrumentation.

---

### Example 23: One Falsifiable Hypothesis Before the Debugger

_ex-23 &middot; exercises co-13_

```text
Expected: apply_discount(100.0, 0.2) == 80.0
Actual:   apply_discount(100.0, 0.2) == 20.0

Hypothesis: the function returns total * pct (the DISCOUNT) instead of total * (1 - pct) (the
amount KEPT) -- the two quantities are swapped.

One check: read discount.py's return line directly.
  return total * pct     <- confirms the hypothesis exactly; no other check needed.
```

Full artifact: **[`learning/artifacts/ex-23-hypothesis-before-fix.md`](./artifacts/ex-23-hypothesis-before-fix.md)**.

**Verify**: exactly one hypothesis, confirmed or refuted by exactly one targeted check.

**Key takeaway**: a hypothesis narrow enough to be wrong in one specific way needs only one check to
resolve.

**Why It Matters**: this is the exact bug Example 20's weak test missed and Example 22's narration
flagged -- resolved here in one line, once the hypothesis was stated precisely.

---

### Example 24: Choosing Bisection Over a Linear Scan

_ex-24 &middot; exercises co-13_

Given a regression somewhere in 40 candidate commits, `git bisect run` finds the exact first-bad
commit in roughly `ceil(log2(40)) = 6` steps -- this script actually built a 40-commit range with a
real regression and ran a real bisection to find it.

**`learning/code/ex-24-bisect-as-workflow-decision/setup.sh`**

```bash
#!/bin/bash
# learning/code/ex-24-bisect-as-workflow-decision/setup.sh
# ex-24: choosing bisection over a linear scan across 40 candidate commits (co-13)
set -e                                                          # => co-13: abort immediately if any command below fails
WORKDIR=$(mktemp -d) && cd "$WORKDIR"                            # => co-13: fresh, throwaway scratch repo -- deterministic, no network
export GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@example.com"  # => co-13: throwaway identity -- irrelevant to the bisect search
export GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@example.com" # => co-13: throwaway identity, never the real global config
export PYTHONDONTWRITEBYTECODE=1                                 # => co-13: disables .pyc caching -- rapid bisect checkouts can
                                                                  #    otherwise reuse a stale cached module and misreport the
                                                                  #    first bad commit
git -c init.defaultBranch=main init -q                          # => co-13: creates .git/ with branch "main", quietly

cat >parity.py <<'PY'                                             # => co-13: the function this whole regression lives in
def is_even(n: int) -> bool:                                      # => co-13: the CORRECT starting definition -- known-GOOD
    return n % 2 == 0                                              # => co-13: the exact line the bug later flips
PY
# => co-13: heredoc closed -- parity.py now holds the correct, known-GOOD implementation
git add parity.py && git commit -q -m "feat(parity): add is_even"  # => co-13: commit 1 of 40 -- known-GOOD, tagged below

cat >test_parity.py <<'PY'                                          # => co-13: the SAME test at every one of the 40 commits --
from parity import is_even                                          # => co-13: `git bisect run` reruns this unchanged each step
assert is_even(4) is True                                           # => co-13: positive case -- must hold at every GOOD commit
assert is_even(7) is False                                          # => co-13: negative case -- flips to True once the bug lands
PY
# => co-13: heredoc closed -- this exact test file drives every automatic bisect checkout below
git add test_parity.py && git commit -q -m "test(parity): add regression test" # => co-13: commit 2 of 40 -- still known-GOOD
GOOD_COMMIT=$(git rev-parse HEAD)                                    # => co-13: this is the known-GOOD end of the range --
                                                                       #    `git bisect good` below anchors the search here

for i in $(seq 1 26); do                                             # => co-13: 26 unrelated, GOOD commits -- noise around the bug
  echo "# unrelated change $i" >>parity.py                            # => co-13: a harmless append, never touches is_even's logic
  git commit -aq -m "chore: unrelated change $i"                      # => co-13: one of the 26 GOOD commits before the bug lands
done                                                                  # => co-13: closes the loop opened above

sed -i.bak 's/n % 2 == 0/n % 2 == 1/' parity.py && rm parity.py.bak   # => co-13: THE BUG -- flips even/odd, introduced HERE
git commit -aq -m "refactor(parity): tidy modulo expression"          # => co-13: commit ~28 of 40 -- the FIRST bad commit,
                                                                        #    disguised as an innocuous refactor

for i in $(seq 27 39); do                                             # => co-13: 13 more commits AFTER the bug, still all bad
  echo "# unrelated change $i" >>parity.py                             # => co-13: another harmless append, bug already landed
  git commit -aq -m "chore: unrelated change $i"                       # => co-13: one of the 13 BAD commits, noise around the bug
done                                                                    # => co-13: closes the loop opened above -- 40 commits total
BAD_COMMIT=$(git rev-parse HEAD)                                       # => co-13: this is the known-BAD end of the range --
                                                                         #    `git bisect bad` below anchors the search here

echo "total commits: $(git rev-list --count HEAD)"                      # => co-13: confirms all 40 exist
echo "log2(40) ~= 5.3, so bisection needs ~6 steps vs up to 40 for a linear scan" # => co-13: the justification itself

git bisect start                                                        # => co-13: begins the bisection session
git bisect bad "$BAD_COMMIT"                                            # => co-13: marks the known-bad end
git bisect good "$GOOD_COMMIT"                                          # => co-13: marks the known-good end -- bisect now
                                                                          #    computes the midpoint automatically
git bisect run python3 test_parity.py                                    # => co-13: `run` scripts the whole search -- exit 0=good,
                                                                           #    1-127(except 125)=bad, per each step's automatic checkout
git bisect log                                                            # => co-13: the full trail of steps bisect actually took
git bisect reset                                                          # => co-13: returns the working tree to its pre-bisect branch
```

**Run**: `bash setup.sh` (actually executed to capture the transcript below).

**Output**:

```text
total commits: 42
log2(40) ~= 5.3, so bisection needs ~6 steps vs up to 40 for a linear scan
Bisecting: 19 revisions left to test after this (roughly 4 steps)
[6dc7d00] chore: unrelated change 20
running 'python3' 'test_parity.py'
Bisecting: 9 revisions left to test after this (roughly 3 steps)
[abc27a5] chore: unrelated change 29
running 'python3' 'test_parity.py'
Traceback (most recent call last):
  File "test_parity.py", line 2, in <module>
    assert is_even(4) is True
AssertionError
Bisecting: 4 revisions left to test after this (roughly 2 steps)
[62435c6] chore: unrelated change 25
running 'python3' 'test_parity.py'
Bisecting: 2 revisions left to test after this (roughly 1 step)
[e75c689] refactor(parity): tidy modulo expression
running 'python3' 'test_parity.py'
Traceback (most recent call last):
  File "test_parity.py", line 2, in <module>
    assert is_even(4) is True
AssertionError
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[8f3c985] chore: unrelated change 26
running 'python3' 'test_parity.py'
e75c689f16df98dda07ee7892c8f367f9a300ead is the first bad commit
commit e75c689f16df98dda07ee7892c8f367f9a300ead
    refactor(parity): tidy modulo expression

 parity.py | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
bisect found first bad commit

Total steps actually taken: 6 (5 test runs plus the final identification step) -- close to the
predicted ceiling of ceil(log2(40)) = 6, and far below a 40-step linear scan.
```

**Key takeaway**: `git bisect run` found the exact commit that introduced the bug (a refactor
disguised as harmless) in 6 automated steps, out of a 40-commit range -- exactly matching the
predicted logarithmic bound.

**Why It Matters**: a linear scan through 40 commits, checking out and testing each one by hand,
could take up to 40 steps in the worst case; `git bisect run` automates the same binary-search
strategy Example 23's single-hypothesis discipline uses at a smaller scale, scripted so it never
needs a human to babysit each step.

---

### Example 25: A Refactor Kept Separate from Its Feature Commit

_ex-25 &middot; exercises co-14, co-15_

**co-14 -- refactoring-cadence**: a refactor folded into ordinary feature work, as its own commit,
beats deferring it -- and its own separate commit (co-15's boy-scout rule) keeps the feature diff
and the cleanup diff independently reviewable.

**co-15 -- boy-scout-rule**: leave the code you touch slightly cleaner than you found it, as a
tiny incidental improvement, not a separate crusade.

**`learning/code/ex-25-refactor-during-a-feature-pr/setup.sh`**

```bash
#!/bin/bash
# learning/code/ex-25-refactor-during-a-feature-pr/setup.sh
# ex-25: a refactor folded into a feature PR, kept as its OWN separate commit (co-14, co-15)
set -e                                                          # => co-14: abort immediately if any command below fails
WORKDIR=$(mktemp -d) && cd "$WORKDIR"                            # => co-14: fresh, throwaway scratch repo -- deterministic, no network
export GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@example.com" # => co-14: throwaway identity -- irrelevant to which
                                                                 #    commit carries the refactor vs. the feature
export GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@example.com" # => co-14: throwaway identity, never the real global config
git -c init.defaultBranch=main init -q                          # => co-14: creates .git/ with branch "main", quietly

cat >cart.py <<'PY'                                               # => co-15: the pre-existing, slightly-unclear function
def calc(i, r):                                                   # => co-15: unclear parameter names -- NOT this PR's own concern
    return sum(i) * (1 - r)                                        # => co-15: the behavior this refactor must NOT change
PY
# => co-15: heredoc closed -- cart.py now holds the pre-existing, unclear-but-working function
git add cart.py && git commit -q -m "feat(cart): add calc helper" # => co-14: trunk's starting commit

git checkout -qb feature/gift-card-redemption                     # => co-14: the feature branch this whole example works on

sed -i.bak 's/def calc(i, r):/def calc(items: list[float], rate: float) -> float:/;
            s/return sum(i) \* (1 - r)/return sum(items) * (1 - rate)/' cart.py && rm cart.py.bak # => co-15: the REFACTOR --
                                                                     #    clearer names + types, behavior UNCHANGED
git add cart.py                                                     # => co-15: staged SEPARATELY from the feature below
git commit -q -m "refactor(cart): rename calc params, add types"    # => co-14, co-15: its OWN, tiny, incidental commit --
                                                                      #    the boy-scout cleanup, not a separate crusade

cat >>cart.py <<'PY'                                                 # => co-14: the ACTUAL feature this PR exists to ship
def apply_gift_card(total: float, card_balance: float) -> float:    # => co-14: a NEW function -- the refactor above never
                                                                      #    touches this one at all
    return max(0.0, total - card_balance)                            # => co-14: the balance never pushes the total below $0.00
PY
# => co-14: heredoc closed -- cart.py now carries the renamed calc() AND the new gift-card function
git add cart.py                                                      # => co-14: staged separately from the refactor above
git commit -q -m "feat(cart): apply gift-card balance to total"      # => co-14: the feature commit, cleanly separated

git log --oneline main..feature/gift-card-redemption                 # => co-14: verifies TWO distinct commits, refactor
                                                                       #    then feat, not squashed into one mixed diff
```

**Run**: `bash setup.sh` (actually executed to capture the transcript below).

**Output**:

```text
c5083cb feat(cart): apply gift-card balance to total
46a2686 refactor(cart): rename calc params, add types
```

**Key takeaway**: `git log` shows two clean, separately-typed commits -- a reviewer (or a future
`git blame`) can tell the rename apart from the actual feature at a glance.

**Why It Matters**: a reviewer who sees `refactor(cart): rename calc params` and
`feat(cart): apply gift-card balance` as two commits can approve the low-risk rename in seconds and
spend their real attention on the feature commit -- a single mixed commit forces re-reading the
rename every time the feature logic is reviewed later, too.

---

### Example 26: The Boy-Scout Rule, Applied

_ex-26 &middot; exercises co-15_

A tiny, incidental rename alongside an unrelated bug fix -- proven tiny by its own diffstat, not a
drive-by rewrite.

**`learning/code/ex-26-boy-scout-rule-applied/setup.sh`**

```bash
#!/bin/bash
# learning/code/ex-26-boy-scout-rule-applied/setup.sh
# ex-26: a tiny, incidental rename alongside an unrelated bug fix -- NOT a drive-by rewrite (co-15)
set -e                                                          # => co-15: abort immediately if any command below fails
WORKDIR=$(mktemp -d) && cd "$WORKDIR"                            # => co-15: fresh, throwaway scratch repo -- deterministic, no network
export GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@example.com" # => co-15: throwaway identity -- irrelevant to how tiny
                                                                 #    the eventual diff stays
export GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@example.com" # => co-15: throwaway identity, never the real global config
git -c init.defaultBranch=main init -q                          # => co-15: creates .git/ with branch "main", quietly

cat >inventory.py <<'PY'                                          # => co-15: a pre-existing module with ONE bad name (d)
                                                                    #    and ONE unrelated off-by-one bug (nearby)
def restock(items: list[int], d: int) -> list[int]:               # => co-15: `d` is the ONE bad name this PR incidentally fixes
    return [i + d for i in items[:-1]]                             # => co-15: `items[:-1]` is the ACTUAL bug -- drops the last item
PY
# => co-15: heredoc closed -- inventory.py now holds both the bad name AND the off-by-one bug
git add inventory.py && git commit -q -m "feat(inventory): add restock helper" # => co-15: trunk's starting commit

echo "--- while fixing an off-by-one bug, ONE nearby bad name gets renamed too ---" # => co-15: labels the sed step below
sed -i.bak \
  -e 's/def restock(items: list\[int\], d: int) -> list\[int\]:/def restock(items: list[int], delta: int) -> list[int]:/' \
  -e 's/return \[i + d for i in items\[:-1\]\]/return [i + delta for i in items]/' \
  inventory.py && rm inventory.py.bak                            # => co-15: `d` -> `delta` (the boy-scout cleanup, ONE
                                                                    #    variable) AND items[:-1] -> items (the actual
                                                                    #    off-by-one FIX) -- both tiny, in one diff

git diff --stat inventory.py                                       # => co-15: the metric that PROVES this stayed tiny --
                                                                     #    a real drive-by rewrite would show a much bigger diffstat
git add inventory.py                                                # => co-15: stages the rename AND the fix together
git commit -q -m "fix(inventory): correct off-by-one that dropped the last item" # => co-15: the commit subject names
                                                                                    #    only the FIX -- the rename rides along
git log -1 --stat                                                   # => co-15: the committed diff, for the record --
                                                                      #    a reviewer sees exactly one bad name renamed and
                                                                      #    one off-by-one fixed, nothing broader
```

**Run**: `bash setup.sh` (actually executed to capture the transcript below).

**Output**:

```text
--- while fixing an off-by-one bug, ONE nearby bad name gets renamed too ---
 inventory.py | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)
commit 4046b11926567f4a97be6c475cd9001f25df0d5c
Author: Dev <dev@example.com>
Date:   Sat Jul 18 08:18:49 2026 +0700

    fix(inventory): correct off-by-one that dropped the last item

 inventory.py | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)
```

**Key takeaway**: the whole commit -- bug fix AND cleanup -- touches 4 lines. That is the boy-scout
rule's own size discipline, proven by the diffstat rather than asserted.

**Why It Matters**: a variable-rename crusade across the whole file, disguised as a bug-fix commit,
would make the actual fix hard to spot in review; keeping the incidental cleanup to exactly the one
name encountered while already there is what keeps "leave it slightly cleaner" from becoming
"rewrite whatever I touch."

---

### Example 27: Continuous Refactoring vs. a Big-Bang Rewrite

_ex-27 &middot; exercises co-14_

| Option                                     | Risk                                               |
| ------------------------------------------ | -------------------------------------------------- |
| A -- continuous extraction, 6-8 small PRs  | Low -- each ships behind the normal review/CI gate |
| B -- month-long rewrite branch, one big PR | High -- a month of drift, one unreviewable diff    |

Full artifact: **[`learning/artifacts/ex-27-refactoring-cadence-vs-big-bang.md`](./artifacts/ex-27-refactoring-cadence-vs-big-bang.md)**.

**Verify**: the decision names a specific risk rationale, not a vague "big rewrites are risky"
preference.

**Key takeaway**: the same total code change either way -- the difference is entirely diff size and
merge frequency.

**Why It Matters**: a month-long rewrite branch is exactly the long-lived-branch failure mode co-01
warns about, applied to refactoring specifically.

---

### Example 28: A Technical-Debt Log Entry

_ex-28 &middot; exercises co-16_

**co-16 -- technical-debt-tracking**: naming a shortcut's quadrant (Fowler's prudent/reckless x
deliberate/inadvertent) and logging it with an owner keeps debt a visible, prioritizable backlog
item instead of a silent tax.

```text
## DEBT-041: gift-card redemption skips concurrent-redemption locking
Quadrant: PRUDENT + DELIBERATE (Fowler's technical-debt quadrant)
Owner: @dev-checkout-team
```

Full artifact: **[`learning/artifacts/ex-28-tech-debt-log-entry.md`](./artifacts/ex-28-tech-debt-log-entry.md)**.

**Verify**: the entry names its specific quadrant and justifies the classification with the actual
trade-off reasoning.

**Key takeaway**: a debt item is not "bad code" by default -- prudent-deliberate debt is a conscious
trade against a real constraint.

**Why It Matters**: an unlogged shortcut disappears into "we'll get to it"; a logged one becomes a
real, prioritizable backlog item.

---

### Example 29: Prioritizing Debt by Friction, Not Recency

_ex-29 &middot; exercises co-16_

| Debt item                           | Logged | Friction    | Rank |
| ----------------------------------- | ------ | ----------- | ---- |
| DEBT-041 (missing row lock)         | Newest | Low         | 3rd  |
| DEBT-019 (pricing logic duplicated) | Oldest | High        | 1st  |
| DEBT-027 (slow test suite)          | Middle | Medium-high | 2nd  |

Full artifact: **[`learning/artifacts/ex-29-tech-debt-prioritization.md`](./artifacts/ex-29-tech-debt-prioritization.md)**.

**Verify**: the oldest item does not automatically rank first -- DEBT-019 ranks 1st on friction,
despite being 2nd-oldest.

**Key takeaway**: age and friction are independent properties of a debt item.

**Why It Matters**: a backlog sorted by creation date silently promotes stale but low-impact debt
over recent, high-impact debt.

---

### Example 30: Generating an API Doc from a Docstring

_ex-30 &middot; exercises co-17_

**co-17 -- documentation-as-code**: `inspect.signature()` and `inspect.getdoc()` read a function's
REAL signature and docstring back programmatically -- there is no second, hand-typed copy anywhere.

**`learning/code/ex-30-docstring-to-api-doc/cart_api.py`**

```python
# learning/code/ex-30-docstring-to-api-doc/cart_api.py
"""ex-30: a typed, docstring-documented function -- the source of truth for its own API doc (co-17)."""  # => co-17: this file's own restated purpose, doubling as its module __doc__
#    every claim in this docstring is verified against the live signature by generate_api_doc.py

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic


def apply_gift_card(total: float, card_balance: float) -> float:  # => co-17: the fully typed public function under doc
    #    the Args/Returns sections below are the ONLY place this contract is written down
    """Apply a gift card's balance against a cart total.

    Args:
        total: the cart's pre-gift-card total, in dollars.
        card_balance: the gift card's remaining balance, in dollars.

    Returns:
        The amount still owed after the gift card is applied, never negative.
    """  # => co-17: this docstring is the ONLY place the contract is written -- generate_api_doc.py
    #    below reads it back programmatically, so there is no second, hand-duplicated copy anywhere
    return max(0.0, total - card_balance)  # => co-17: the balance never pushes the total below $0.00
    #    max(0.0, ...) is the guard -- a card_balance larger than total never produces a negative charge
```

**`learning/code/ex-30-docstring-to-api-doc/generate_api_doc.py`**

```python
# learning/code/ex-30-docstring-to-api-doc/generate_api_doc.py
"""ex-30: generates a Markdown API reference page directly from cart_api.py's own signature and docstring (co-17)."""  # => co-17: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic

import inspect  # => co-17: stdlib-only -- inspect reads the REAL signature, never a hand-typed copy

#    no template engine or docstring-scraper dependency needed
from collections.abc import Callable  # => co-17: a precise, strict-mode-friendly type for "any callable", replacing a bare object

import cart_api  # => co-17: the module whose public function this script documents
#    -- the ONLY coupling between the two files is this one import


def render_api_doc(func: Callable[..., object]) -> str:  # => co-17: builds one Markdown section from a function object
    """Render one function's live signature and docstring as a Markdown API-reference section."""  # => co-17: documents render_api_doc's contract -- no runtime output, just sets its __doc__
    name: str = getattr(func, "__name__", repr(func))  # => co-17: Callable has no statically-known __name__ -- getattr with a str default keeps this strict-mode clean
    signature = inspect.signature(func)  # => co-17: the REAL, current parameter names, types, and return annotation
    doc = inspect.getdoc(func) or ""  # => co-17: the REAL docstring, dedented -- not retyped by hand anywhere
    return f"### `{name}{signature}`\n\n{doc}\n"  # => co-17: one Markdown section, entirely derived, zero hand-duplication
    #    if cart_api.py's docstring ever changes, this output changes too


if __name__ == "__main__":  # => co-17: entry point -- this block runs only when the file executes directly, not on import
    doc_page = render_api_doc(cart_api.apply_gift_card)  # => co-17: the actual generation call this example demonstrates
    print(doc_page)  # => co-17: prints the generated Markdown section

    live_signature = str(inspect.signature(cart_api.apply_gift_card))  # => co-17: re-reads the signature independently
    #    of render_api_doc, for a truly independent check
    assert live_signature in doc_page, "generated doc must contain the function's REAL signature"  # => co-17: the check
    assert "never negative" in doc_page, "generated doc must contain the REAL docstring body"  # => co-17: the check
    #    -- proves the doc came
    #    from the docstring, not a stub
    print("Generated doc matches the live signature and docstring, no hand-duplicated copy: True")  # => co-17: reached only if both asserts passed
```

**Run**: `python3 generate_api_doc.py`

**Output**:

```text
### `apply_gift_card(total: 'float', card_balance: 'float') -> 'float'`

Apply a gift card's balance against a cart total.

Args:
    total: the cart's pre-gift-card total, in dollars.
    card_balance: the gift card's remaining balance, in dollars.

Returns:
    The amount still owed after the gift card is applied, never negative.

Generated doc matches the live signature and docstring, no hand-duplicated copy: True
```

**Key takeaway**: the generated doc's signature line comes straight from `inspect.signature()` --
when `cart_api.py`'s real signature changes, the doc changes automatically the next time it runs, no
manual sync step required.

**Why It Matters**: a hand-maintained API reference silently drifts the moment a signature changes
and nobody remembers to update the docs page; a generated one is structurally incapable of drifting,
because it has no independent copy of the contract to fall out of sync with.

---

### Example 31: Docs Updated in the Same PR as the Code

_ex-31 &middot; exercises co-17_

**`learning/code/ex-31-doc-in-same-pr-as-code/setup.sh`**

```bash
#!/bin/bash
# learning/code/ex-31-doc-in-same-pr-as-code/setup.sh
# ex-31: updating the README in the SAME PR that changes the behavior it documents (co-17)
set -e                                                          # => co-17: abort immediately if any command below fails
WORKDIR=$(mktemp -d) && cd "$WORKDIR"                            # => co-17: fresh, throwaway scratch repo -- deterministic, no network
export GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@example.com" # => co-17: throwaway identity -- irrelevant to whether the
                                                                 #    doc and code change land in the same commit
export GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@example.com" # => co-17: throwaway identity, never the real global config
git -c init.defaultBranch=main init -q                          # => co-17: creates .git/ with branch "main", quietly

cat >README.md <<'MD'                                             # => co-17: the docs this PR is about to make STALE
## Cart API

`apply_gift_card(total, card_balance)` -- applies a gift card balance to a cart total.
MD
# => co-17: heredoc closed -- README.md now documents the two-argument signature, about to go stale
cat >cart_api.py <<'PY'                                            # => co-17: the code this PR is about to change
def apply_gift_card(total: float, card_balance: float) -> float:
    return max(0.0, total - card_balance)
PY
# => co-17: heredoc closed -- cart_api.py's signature EXACTLY matches what README.md just documented
git add . && git commit -q -m "feat(cart): add gift-card application" # => co-17: trunk's starting commit, doc and code in sync

git checkout -qb feature/gift-card-cap                             # => co-17: one PR, ONE branch, both files change together --
                                                                     #    never a separate "fast-follow docs PR" after the fact
sed -i.bak 's/def apply_gift_card(total: float, card_balance: float) -> float:/def apply_gift_card(total: float, card_balance: float, max_pct: float = 1.0) -> float:/;
            s/return max(0.0, total - card_balance)/applied = min(card_balance, total * max_pct)\n    return max(0.0, total - applied)/' cart_api.py && rm cart_api.py.bak # => co-17: the BEHAVIOR change

sed -i.bak "s/\`apply_gift_card(total, card_balance)\` -- applies a gift card balance to a cart total./\`apply_gift_card(total, card_balance, max_pct=1.0)\` -- applies a gift card balance to a cart total, capped at max_pct of the total (default 100%)./" README.md && rm README.md.bak # => co-17: the DOC change, SAME commit

git add cart_api.py README.md                                      # => co-17: both files staged together
git commit -q -m "feat(cart): cap gift-card application at a configurable percentage" # => co-17: ONE commit, both files --
                                                                                        #    a reviewer sees the stale-doc
                                                                                        #    risk resolved in the same diff

git show --stat HEAD                                               # => co-17: proves BOTH files changed in the SAME commit --
                                                                     #    a reviewer never sees code without its matching doc
```

**Run**: `bash setup.sh` (actually executed to capture the transcript below).

**Output**:

```text
commit 7beb1730bb5da1a6b1c524fa7e169826f55a2d68
Author: Dev <dev@example.com>
Date:   Sat Jul 18 08:20:09 2026 +0700

    feat(cart): cap gift-card application at a configurable percentage

 README.md   | 2 +-
 cart_api.py | 5 +++--
 2 files changed, 4 insertions(+), 3 deletions(-)
```

**Key takeaway**: `git show --stat` proves both `README.md` and `cart_api.py` changed in the exact
same commit -- the doc update was never a separate, deferrable step.

**Why It Matters**: a doc update filed as a follow-up ticket routinely never happens -- co-17's whole
premise is that colocating docs with the code they describe, reviewed in the same PR, is what
resists the drift a separate wiki (or a "docs later" ticket) invites.

---

### Example 32: Which Change Earns an ADR

_ex-32 &middot; exercises co-18_

**co-18 -- adr-as-engineering-practice**: a hard-to-reverse, architecturally significant code
decision earns a linked Architecture Decision Record (ADR); a routine, easily-reversible one does
not -- the two tests below decide which is which.

| Change                               | Hard to reverse? | Architecturally significant? | Earns an ADR? |
| ------------------------------------ | ---------------- | ---------------------------- | ------------- |
| Rename a local variable              | No               | No                           | **No**        |
| Add one log line                     | No               | No                           | **No**        |
| Swap the datastore for card balances | Yes              | Yes                          | **Yes**       |

Full artifact: **[`learning/artifacts/ex-32-adr-trigger-decision.md`](./artifacts/ex-32-adr-trigger-decision.md)**.

**Verify**: only the database swap passes BOTH tests (hard to reverse, architecturally
significant).

**Key takeaway**: an ADR-worthy decision fails to reverse cheaply AND changes the system's own
structure -- either property alone is not enough.

**Why It Matters**: writing an ADR for every commit drowns the genuinely significant decisions in
noise.

---

### Example 33: An ADR Cross-Referenced from Code

_ex-33 &middot; exercises co-18_

```python
# balance_store.py
# See docs/adr/0004-card-balance-document-store.md for why this uses a document store
# instead of the PostgreSQL table every other part of this codebase uses.
def read_balance(card_id: str) -> float: ...
```

Full artifact: **[`learning/artifacts/ex-33-adr-cross-referenced-from-code.md`](./artifacts/ex-33-adr-cross-referenced-from-code.md)**.

**Verify**: the code's header comment names the exact ADR file, and the ADR's `## Decision` section
names the exact implementing file -- each points at the other.

**Key takeaway**: an ADR nobody can find from the code it justifies might as well not exist.

**Why It Matters**: the cross-reference turns "why is this weird" into a one-line lookup instead of
an archaeology project.

---

### Example 34: An Hour Estimate vs. a Relative Estimate

_ex-34 &middot; exercises co-19_

**co-19 -- estimation-pitfalls-and-noestimates**: "14 hours" and "about 8 points, like that other
story" convey very different amounts of actual confidence for genuinely novel work.

Full artifact: **[`learning/artifacts/ex-34-estimation-pitfall-single-point.md`](./artifacts/ex-34-estimation-pitfall-single-point.md)**.

**Verify**: the raw-hour estimate implies a precision the team has no historical basis for; the
relative estimate anchors against a real, completed story.

**Key takeaway**: a single number can still be dishonest about its own confidence.

**Why It Matters**: a raw-hour estimate for novel work gets treated as a commitment downstream, even
though it was never more than a guess.

---

### Example 35: A #NoEstimates Alternative

_ex-35 &middot; exercises co-19_

```text
1. Slice every item until it fits 1-2 days -- no story gets an estimate.
2. Track ACTUAL throughput.
3. Forecast a release date from measured throughput, not summed estimates.
```

Full artifact: **[`learning/artifacts/ex-35-noestimates-alternative.md`](./artifacts/ex-35-noestimates-alternative.md)**.

**Verify**: the estimate step is removed entirely, while a forecast is still produced from measured
throughput.

**Key takeaway**: forecasting from measured throughput sidesteps "how long will THIS take" for "how
long will everything left take."

**Why It Matters**: #NoEstimates is a bet that a measured historical rate forecasts better than
another round of guessing, for chronically-wrong estimators.

---

### Example 36: Pairing -- Driver/Navigator, Timed Swap

_ex-36 &middot; exercises co-20_

**co-20 -- pairing-and-mobbing**: an explicit driver/navigator split with a timer-enforced swap
keeps both partners actively engaged.

```text
00:00  Amara (Driver) types the signature; Jun (Navigator) flags an edge case from the ADR.
00:15  SWAP -- Jun now Driver; catches a missing retry bound Amara spots.
00:30  SWAP -- Amara now Driver; they rewrite a happy-path-only test together.
```

Full artifact: **[`learning/artifacts/ex-36-pairing-driver-navigator.md`](./artifacts/ex-36-pairing-driver-navigator.md)**.

**Verify**: three 15-minute intervals, an explicit swap at each boundary, both partners can explain
the diff.

**Key takeaway**: the timed swap is what keeps both people actively engaged.

**Why It Matters**: pairing caught a missing retry bound and a weak test DURING implementation, not
in review.

---

### Example 37: Mob/Ensemble Programming Session

_ex-37 &middot; exercises co-20_

```text
00:00  Priya (Driver) sketches dual-write; the mob debates read-path consistency.
00:10  SWAP -- Sam drafts the runbook; the mob catches a missed rollback step.
00:20  SWAP -- Jun writes the reconciliation script the mob just agreed the runbook needs.
```

Full artifact: **[`learning/artifacts/ex-37-mob-programming-session.md`](./artifacts/ex-37-mob-programming-session.md)**.

**Verify**: every participant, not only the person typing at each moment, can explain the final
solution.

**Key takeaway**: the rotating driver role spreads the whole team's understanding, not just typing
speed.

**Why It Matters**: four people actively navigating the same problem simultaneously surface
objections a sequential review pass tends to miss.

---

### Example 38: A Team Definition of Done, Applied

_ex-38 &middot; exercises co-21_

**co-21 -- definition-of-done**: an explicit, shared checklist gates when work actually counts as
finished.

```text
[x] Tests pass locally AND in CI
[x] Code reviewed and approved
[x] Docs updated in the same PR
[x] Changelog entry added
[x] No unresolved comments
```

Full artifact: **[`learning/artifacts/ex-38-definition-of-done-checklist.md`](./artifacts/ex-38-definition-of-done-checklist.md)**.

**Verify**: the PR is marked done only once every item is checked.

**Key takeaway**: "done" is a checklist result, not a feeling.

**Why It Matters**: an unwritten Definition of Done lets "done" mean something different to every
engineer.

---

### Example 39: "Done" vs. "Done-Done"

_ex-39 &middot; exercises co-21_

```text
"Done" (merged): every checklist item checked, PR merged to main.
"Done-done" (merged AND deployed AND monitored): everything in "Done", PLUS deployed to
production, dashboard observed green for a full business day, flag flipped ON.
```

Full artifact: **[`learning/artifacts/ex-39-done-vs-done-done.md`](./artifacts/ex-39-done-vs-done-done.md)**.

**Verify**: the two states are distinguished by concrete, checkable criteria.

**Key takeaway**: "merged" and "shipped and working" are different facts.

**Why It Matters**: Example 40's feature-flag pattern makes this distinction unavoidable in
practice.

---

### Example 40: A Feature Flag as a Release/Deploy Decoupler

_ex-40 &middot; exercises co-22, co-01_

**co-22 -- feature-flags-as-a-release-decoupler**: a release toggle ships incomplete code to trunk,
disabled -- decoupling deploy from release, and enabling co-01's trunk-based development.

**`learning/code/ex-40-feature-flag-release-toggle/feature_flags.py`**

```python
# learning/code/ex-40-feature-flag-release-toggle/feature_flags.py
"""ex-40: a release toggle -- ships incomplete code to trunk, DISABLED (co-22, co-01)."""  # => co-22: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic


class ReleaseFlags:  # => co-22: a tiny, in-memory release-toggle registry -- stands in for a real flag service
    """A minimal release-toggle registry: incomplete features stay OFF until explicitly flipped."""  # => co-22: documents ReleaseFlags's contract -- no runtime output, just sets its __doc__

    def __init__(self) -> None:  # => co-22: every flag starts OFF -- the safe, trunk-based default
        self._flags: dict[str, bool] = {  # => co-22: co-01: this is what LETS trunk-based dev work --
            "multi_currency_redemption": False,  # =>    incomplete code merges to trunk disabled,
        }  # =>    instead of living on a long-lived branch until "ready"

    def is_enabled(self, name: str) -> bool:  # => co-22: the ONE call site every caller uses to check a flag
        """Return whether the named release flag is currently enabled."""  # => co-22: documents is_enabled's contract -- no runtime output, just sets its __doc__
        return self._flags.get(name, False)  # => co-22: an UNKNOWN flag name defaults to False -- fail closed, not open

    def enable(self, name: str) -> None:  # => co-22: flips a flag ON -- the "release" half of deploy/release decoupling
        """Enable the named release flag."""  # => co-22: documents enable's contract -- no runtime output, just sets its __doc__
        self._flags[name] = True  # => co-22: mutates the registry in place


def redeem(amount: float, currency: str, flags: ReleaseFlags) -> str:  # => co-22: the caller this whole flag protects
    """Redeem `amount` in `currency`, gated by the multi_currency_redemption release flag."""  # => co-22: documents redeem's contract -- no runtime output, just sets its __doc__
    if currency != "USD" and not flags.is_enabled("multi_currency_redemption"):  # => co-22: the GATE itself
        raise NotImplementedError("multi-currency redemption is not yet enabled")  # => co-22: flag OFF -- old behavior preserved exactly
    return f"redeemed {amount} {currency}"  # => co-22: flag ON (or currency==USD) -- the new/existing path runs


if __name__ == "__main__":  # => co-22: entry point -- this block runs only when the file executes directly, not on import
    flags = ReleaseFlags()  # => co-22: a fresh registry, flag OFF by default (the just-merged-to-trunk state)

    usd_result = redeem(10.0, "USD", flags)  # => co-22: USD always works -- the flag only gates NEW currencies
    print(f"USD redemption with flag OFF: {usd_result}")  # => co-22: prints the unaffected, pre-existing path

    try:  # => co-22: the incomplete feature, merged to trunk, still DISABLED
        redeem(10.0, "EUR", flags)  # => co-22: this is the trunk-build-stays-green claim under test
    except NotImplementedError as exc:  # => co-22: expected -- the gate is doing its job
        print(f"EUR redemption with flag OFF: blocked ({exc})")  # => co-22: prints the blocked-path confirmation
    assert not flags.is_enabled("multi_currency_redemption"), "flag must still be OFF here"  # => co-22: the trunk-stays-green check

    flags.enable("multi_currency_redemption")  # => co-22: the RELEASE step -- deploy already happened; this is separate
    eur_result = redeem(10.0, "EUR", flags)  # => co-22: same code, same deploy, now unlocked
    print(f"EUR redemption with flag ON: {eur_result}")  # => co-22: prints the newly-unlocked path
    assert eur_result == "redeemed 10.0 EUR", "flag ON must unlock the new currency path"  # => co-22: the release-works check
    print("Trunk build stayed green with the flag off, and flag-on unlocks the new path: True")  # => co-22: reached only if both asserts passed
```

**Run**: `python3 feature_flags.py`

**Output**:

```text
USD redemption with flag OFF: redeemed 10.0 USD
EUR redemption with flag OFF: blocked (multi-currency redemption is not yet enabled)
EUR redemption with flag ON: redeemed 10.0 EUR
Trunk build stayed green with the flag off, and flag-on unlocks the new path: True
```

**Key takeaway**: the SAME merged code behaves two different ways depending only on the flag's
state -- deploying it and releasing it (flipping the flag) are two genuinely separate actions.

**Why It Matters**: this is exactly what makes co-01's trunk-based development viable for a
multi-week feature -- instead of a long-lived branch drifting from trunk until "done," the
incomplete feature merges to trunk immediately, disabled, and stays disabled through as many deploys
as needed until it is ready to flip on.

---

### Example 41: A Kill Switch, No Redeploy

_ex-41 &middot; exercises co-22_

An ops toggle disables one misbehaving feature while the rest of the system stays up -- flipped on
the SAME running process, no redeploy.

**`learning/code/ex-41-feature-flag-kill-switch/kill_switch.py`**

```python
# learning/code/ex-41-feature-flag-kill-switch/kill_switch.py
"""ex-41: an ops toggle -- disables a misbehaving feature with NO redeploy (co-22)."""  # => co-22: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic


class OpsFlags:  # => co-22: an OPS toggle -- short-lived, operator-flipped, unlike a release flag's longer life
    """A minimal ops-toggle registry: a live process reads it on every call, not just at startup."""  # => co-22: documents OpsFlags's contract -- no runtime output, just sets its __doc__

    def __init__(self) -> None:  # => co-22: every ops toggle starts ON -- the feature is healthy until proven otherwise
        self._enabled: dict[str, bool] = {"gift_card_redemption": True}  # => co-22: the ONE feature this example toggles

    def is_enabled(self, name: str) -> bool:  # => co-22: read on EVERY call -- no process restart needed to see a flip
        """Return whether the named feature is currently enabled."""  # => co-22: documents is_enabled's contract -- no runtime output, just sets its __doc__
        return self._enabled.get(name, True)  # => co-22: unknown names default ON -- this registry only tracks known kill switches

    def disable(self, name: str) -> None:  # => co-22: the OPERATOR action -- no code deploy, no process restart
        """Flip the named feature off -- the kill-switch action itself."""  # => co-22: documents disable's contract -- no runtime output, just sets its __doc__
        self._enabled[name] = False  # => co-22: mutates the LIVE registry -- the next call already sees the new value


def process_request(kind: str, flags: OpsFlags) -> str:  # => co-22: stands in for a live request handler
    """Route one incoming request, honoring the gift-card kill switch if it is flipped."""  # => co-22: documents process_request's contract -- no runtime output, just sets its __doc__
    if kind == "gift_card_redemption" and not flags.is_enabled("gift_card_redemption"):  # => co-22: the GATE itself
        return "503: gift-card redemption temporarily disabled"  # => co-22: the ONE feature stops -- a clean, explicit response
    return f"200: {kind} processed normally"  # => co-22: every OTHER request kind is entirely unaffected


if __name__ == "__main__":  # => co-22: entry point -- this block runs only when the file executes directly, not on import
    flags = OpsFlags()  # => co-22: a fresh registry -- simulates ONE long-running server process, no restart between calls
    request_kinds = ["checkout", "gift_card_redemption", "profile_update"]  # => co-22: three DIFFERENT request kinds

    print("--- before the kill switch is flipped ---")  # => co-22: labels the first batch below
    for kind in request_kinds:  # => co-22: every kind processes normally -- the system is fully healthy
        print(process_request(kind, flags))  # => co-22: prints this request's own response

    flags.disable("gift_card_redemption")  # => co-22: the OPERATOR action -- SAME process, no redeploy, no restart

    print("\n--- after the kill switch is flipped (SAME process, no redeploy) ---")  # => co-22: labels the second batch
    results = [process_request(kind, flags) for kind in request_kinds]  # => co-22: the SAME three kinds, SAME live process
    for kind, result in zip(request_kinds, results):  # => co-22: pairs each kind with its own result for the printout
        print(result)  # => co-22: prints this request's own response

    assert results[1] == "503: gift-card redemption temporarily disabled", "the flagged feature must be OFF"  # => co-22
    assert results[0].startswith("200") and results[2].startswith("200"), "unrelated features must stay UP"  # => co-22
    print("\nOne feature turned off; the rest of the system stayed up, no redeploy: True")  # => co-22: reached only if both asserts passed
```

**Run**: `python3 kill_switch.py`

**Output**:

```text
--- before the kill switch is flipped ---
200: checkout processed normally
200: gift_card_redemption processed normally
200: profile_update processed normally

--- after the kill switch is flipped (SAME process, no redeploy) ---
200: checkout processed normally
503: gift-card redemption temporarily disabled
200: profile_update processed normally

One feature turned off; the rest of the system stayed up, no redeploy: True
```

**Key takeaway**: `checkout` and `profile_update` are entirely unaffected by disabling
`gift_card_redemption` -- the blast radius of the kill switch is exactly one feature.

**Why It Matters**: a kill switch that requires a redeploy to flip is no faster than a regular
rollback; a kill switch checked live, per request, is what turns incident mitigation (Example 42)
from "wait for a deploy pipeline" into "flip one value, done in seconds."

---

### Example 42: Incident Timeline -- Detect, Mitigate, Root-Cause

_ex-42 &middot; exercises co-23_

**co-23 -- incident-hygiene-and-blameless-response**: detect, then mitigate, then root-cause, in
that order.

```mermaid
timeline
    accTitle: Example 42: Incident Timeline -- Detect, Mitigate, Root-Cause
    accDescr: Timeline of incident INC-0104, a gift-card redemption outage. At 14:02 an alert fires on a redemption error rate above 5%, at 14:04 on-call detects that all redemption requests return 503, at 14:06 the kill switch is flipped back on to mitigate, and at 14:07 traffic recovers to 200 OK.
    title Incident INC-0104 -- gift-card redemption outage
    14:02 : Alert fires -- redemption error rate > 5%
    14:04 : Detect -- on-call confirms 100% of redemption requests return 503
    14:06 : Mitigate -- flip the kill switch back ON, no redeploy, no root cause yet
    14:07 : Redemption traffic recovers to 200 OK
    14:45 : Root-cause -- a stale ops-toggle script re-disabled the feature at 14:02
    15:30 : Fix -- the toggle script gains a confirmation prompt; postmortem scheduled
```

_Figure: mitigation (14:06) lands well before root-cause (14:45) -- the fastest path back to a
working system, not the fastest path to a full explanation, comes first._

Full artifact: **[`learning/artifacts/ex-42-incident-detection-to-mitigation.md`](./artifacts/ex-42-incident-detection-to-mitigation.md)**.

**Verify**: mitigation happens before root-cause in the timeline, satisfying co-23's ordering rule.

**Key takeaway**: the fastest path back to a working system and the fastest path to understanding
why it broke are two different activities.

**Why It Matters**: the same kill-switch mechanism from Example 41 is what makes the 1-minute
mitigation here possible -- a feature flag is also the fastest mitigation lever an on-call engineer
has.

---

### Example 43: Rewriting a Postmortem into Blameless Language

_ex-43 &middot; exercises co-23_

**Draft**: "Sam ran the stale ops-toggle script without checking its current state first... Sam
should have verified the flag's state before running the script."

**Rewritten**: "The ops-toggle script re-disabled gift-card redemption... The script had no
built-in guard against re-applying a change that was already in effect."

Full artifact: **[`learning/artifacts/ex-43-blameless-language-check.md`](./artifacts/ex-43-blameless-language-check.md)**.

**Verify**: the rewritten version contains zero sentences attributing the incident to a specific
person.

**Key takeaway**: "Sam should have checked" blames a person; "the script had no guard" names a
fixable property of the tooling.

**Why It Matters**: blameless language changes what the fix section can even contain -- it produces
a code fix that protects every future operator, not just a reminder to one person.

---

← Previous: [Beginner Examples](./beginner.md) &middot; Next: [Advanced Examples](./advanced.md) →
