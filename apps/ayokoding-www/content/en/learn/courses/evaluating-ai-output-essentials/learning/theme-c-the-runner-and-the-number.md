---
title: "Theme C: The Runner and the Number"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 30
---

Examples 23-34 assemble Theme A's dataset and Theme B's scorers into **co-07 -- the eval runner**:
load cases, call the system, score each one, reduce the results to one comparable pass rate, and
report per-case detail alongside it. Because a real model is stochastic (**co-08**), this theme
shows repeating trials to detect flaky cases and applying an n-of-k threshold instead of averaging
flakiness into a comfortably-looking number. It also brings **co-11 -- cost and latency
accounting** into the same run as the pass rate, so a quality win never gets reported without its
price, and closes with **co-09**'s first committed run artefact, plus proof the identical runner
works equally well as an ordinary pytest suite. Every code-medium example's real, runnable
**Python 3.13** file lives under `learning/code/ex-NN-*/`, run for real with genuine captured
output. (See this topic's [References](../overview.md#references) for the exact patch
version captured.)

---

### Worked Example 23: Minimal Eval Runner

_ex-23 &middot; exercises co-07_

**Context**: **co-07 -- the eval runner** is the whole loop in five lines: load the dataset, call
the system, score each output against its own declared scorer, record the verdict, and report a
pass rate. This example runs the full twelve-case dataset end to end against a mocked "prompt v1"
system, with one case deliberately wrong.

```python
# learning/code/ex-23-minimal-eval-runner/minimal_runner.py
"""Worked Example 23: Minimal Eval Runner."""  # => co-07: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import json  # => co-03: JSONL needs nothing beyond the standard library's own json module
import re  # => co-05: backs the regex and numeric_tolerance scorer entries below
from pathlib import Path  # => co-03: locates dataset.jsonl relative to this script, not the caller's cwd

DATASET_PATH = Path(__file__).parent / "dataset.jsonl"  # => co-03: the twelve-case fixed gate this runner exercises
NUMBER_PATTERN = re.compile(r"-?\d+(?:\.\d+)?")  # => co-05: shared by the numeric_tolerance scorer below

SYSTEM_ANSWERS = {  # => co-01: "prompt v1" -- the mocked system-under-test's canned answer for each case id
    "case-01": "New Nimbus accounts start with 15 GB of free storage.",  # => co-01: correct
    "case-02": "Nimbus Pro includes 200 GB of storage.",  # => co-01: correct
    "case-03": "Yes, Nimbus supports two-factor authentication for account security.",  # => co-01: correct
    "case-04": "The Nimbus app shipped on iOS first.",  # => co-01: correct
    "case-05": "The Free plan accepts files up to 5 GB in size.",  # => co-01: correct
    "case-06": "The Pro plan accepts files up to 50 GB in size.",  # => co-01: correct
    "case-07": "Share links expire automatically after 30 days.",  # => co-01: correct
    "case-08": "Free-plan email support targets a 24-hour first response.",  # => co-01: correct
    "case-09": "Deleted files stay in trash for 30 days before permanent deletion.",  # => co-01: correct
    "case-10": "pro only",  # => co-01: correct, short classification-style output
    "case-11": "The public REST API is available on the Free plan too.",  # => co-01: WRONG -- it's Pro-only
    "case-12": "Files are encrypted at rest using AES-256.",  # => co-01: correct
}  # => co-01: closes SYSTEM_ANSWERS -- eleven correct, one deliberately wrong


def score(scorer_name: str, output: str, expected: str) -> bool:  # => co-05: the same four-entry registry idea from ex-19
    if scorer_name == "exact_match":  # => co-05: dispatch branch 1
        return output.strip().lower() == expected.strip().lower()  # => co-05: normalized equality
    if scorer_name == "substring":  # => co-05: dispatch branch 2
        return expected in output  # => co-05: the fact just has to appear somewhere
    if scorer_name == "regex":  # => co-05: dispatch branch 3
        return re.search(expected, output) is not None  # => co-05: expected doubles as the pattern text
    match = NUMBER_PATTERN.search(output)  # => co-05: dispatch branch 4 (numeric_tolerance) -- find the first number
    return match is not None and abs(float(match.group()) - float(expected)) <= 1.0  # => co-05: within +-1 tolerance


if __name__ == "__main__":  # => co-07: entry point -- runs only when this file executes directly, not on import
    cases = [json.loads(line) for line in DATASET_PATH.read_text(encoding="utf-8").splitlines() if line.strip()]  # => co-03
    results: list[bool] = []  # => co-07: one verdict per case, in dataset order
    for case in cases:  # => co-07: the whole runner, in five lines -- load, call, score, record, report
        output = SYSTEM_ANSWERS[case["id"]]  # => co-01: "call the system" -- mocked, offline, no API key
        verdict = score(case["scorer"], output, case["expected"])  # => co-05: apply the case's own declared scorer
        results.append(verdict)  # => co-07: record this case's pass/fail
        print(f"{case['id']}: {'PASS' if verdict else 'FAIL'}")  # => co-07: one printed line per case, end to end
    pass_rate = sum(results) / len(results)  # => co-07: the single headline number -- fraction of cases passing
    print(f"Pass rate: {pass_rate:.2%} ({sum(results)}/{len(results)})")  # => co-07: prints the headline number
    assert len(results) == 12, "the runner must produce one verdict per dataset case"  # => co-07: sanity check
    assert sum(results) == 11, "exactly eleven of twelve cases must pass against this fixed dataset"  # => co-07
    print("MATCH: dataset loaded, system called, scorer applied, pass rate reported -- end to end")  # => co-07
    # => co-07: this IS the eval gate -- everything from here is refining pass rate, repeat runs, and comparison
```

**Run**: `python3 minimal_runner.py`

**Output**:

```text
case-01: PASS
case-02: PASS
case-03: PASS
case-04: PASS
case-05: PASS
case-06: PASS
case-07: PASS
case-08: PASS
case-09: PASS
case-10: PASS
case-11: FAIL
case-12: PASS
Pass rate: 91.67% (11/12)
MATCH: dataset loaded, system called, scorer applied, pass rate reported -- end to end
```

**Verify**: the runner produces one verdict per case (12 total), catches the one deliberately wrong
case (`case-11`), and reports a pass rate of exactly `91.67%` (11/12), satisfying co-07's rule that
the full load-call-score-report loop runs end to end and reports one comparable number.

**Key takeaway**: the entire eval runner is five lines of control flow -- everything else in this
theme (repeat trials, cost, latency, artefacts) is refinement layered on top of this same loop, not
a different loop.

**Why It Matters**: `case-11` failing here is not a bug in the runner -- it is the runner doing its
job, catching a real defect (the mocked system claims Free-plan API access, which is wrong) that a
vibe check on any other single case would never have surfaced. A vibe check would have missed it
entirely because the flawed claim reads fluently and plausibly on its own; only checking it against
the fixed dataset's declared expected value exposed the gap.

---

### Worked Example 24: Pass Rate

_ex-24 &middot; exercises co-07_

**Context**: continuing co-07 -- reducing a list of per-case verdicts to one pass rate is the
number that actually gets compared across runs. This example checks the arithmetic on a perfect
run, a mixed run, and the degenerate empty-run edge case.

```python
# learning/code/ex-24-pass-rate/pass_rate.py
"""Worked Example 24: Pass Rate."""  # => co-07: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic


def pass_rate(verdicts: list[bool]) -> float:  # => co-07: reduces N booleans to ONE comparable number
    """Return the fraction of True verdicts in `verdicts`; 0.0 for an empty list."""  # => co-07: documents pass_rate's contract -- no runtime output, just sets its __doc__
    if not verdicts:  # => co-07: an empty run has no cases to divide by -- define it as 0.0, not a crash
        return 0.0  # => co-07: fail-safe default rather than a ZeroDivisionError
    return sum(verdicts) / len(verdicts)  # => co-07: True counts as 1, False as 0 -- sum() IS the pass count


if __name__ == "__main__":  # => co-07: entry point -- runs only when this file executes directly, not on import
    all_pass = [True, True, True, True]  # => co-07: a perfect run
    mixed = [True, True, False, True, False]  # => co-07: three passes, two fails -- the common case
    empty: list[bool] = []  # => co-07: the degenerate, zero-case run
    all_pass_rate = pass_rate(all_pass)  # => co-07: 4/4
    mixed_rate = pass_rate(mixed)  # => co-07: 3/5
    empty_rate = pass_rate(empty)  # => co-07: defined as 0.0, never a crash
    print(f"all_pass -> {all_pass_rate:.2%}")  # => co-07: prints the perfect-run rate
    print(f"mixed -> {mixed_rate:.2%}")  # => co-07: prints the common-case rate
    print(f"empty -> {empty_rate:.2%}")  # => co-07: prints the degenerate-case rate
    assert all_pass_rate == 1.0, "a perfect run must reduce to exactly 1.0"  # => co-07: confirms the ceiling
    assert mixed_rate == 0.6, "three passes out of five must reduce to exactly 0.6"  # => co-07: confirms the arithmetic
    assert empty_rate == 0.0, "an empty run must reduce to 0.0, never raise"  # => co-07: confirms the edge case
    print("MATCH: one number, reproducibly computed, is what actually gets compared across runs")  # => co-07
    # => co-07: a wall of per-case output tells you WHAT changed; the pass rate is what tells you IF it got better
```

**Run**: `python3 pass_rate.py`

**Output**:

```text
all_pass -> 100.00%
mixed -> 60.00%
empty -> 0.00%
MATCH: one number, reproducibly computed, is what actually gets compared across runs
```

**Verify**: `pass_rate([])` returns `0.0` without raising, and `pass_rate(mixed)` returns exactly
`0.6`, satisfying co-07's rule that pass rate is a well-defined, reproducible reduction including
its degenerate empty-list case.

**Key takeaway**: handling the empty-list edge case explicitly (rather than letting a
`ZeroDivisionError` propagate) is a small detail that matters the first time a filtered subset of a
dataset genuinely has zero matching cases.

**Why It Matters**: pass rate is the one number Theme D's baseline/candidate comparisons hinge on
-- and Example 25 immediately shows why the pass rate alone is not enough on its own to act on.
Handling the empty-run edge case explicitly is what keeps that comparison from silently breaking
the first time a filtered subset of cases has nothing to divide by.

---

### Worked Example 25: Per-Case Report

_ex-25 &middot; exercises co-07_

**Context**: continuing co-07 -- the pass rate says _if_ something changed; a per-case report says
exactly _which_ case and _why_, carrying the scorer's own reason (from ex-18's `Verdict`) straight
through to the report.

```python
# learning/code/ex-25-per-case-report/per_case_report.py
"""Worked Example 25: Per-Case Report."""  # => co-07: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

from typing import NamedTuple  # => co-05: a typed record for one row of the report


class CaseResult(NamedTuple):  # => co-07: one row of the per-case report -- id, verdict, AND why
    case_id: str  # => co-07: which case this row describes
    passed: bool  # => co-07: the pass/fail decision
    reason: str  # => co-05: WHY -- carried straight from the scorer's own Verdict (ex-18)


RESULTS = [  # => co-07: a small, fixed run's worth of per-case results -- three pass, two fail
    CaseResult("case-01", True, "found required fact '15 GB'"),  # => co-07: row 1 -- pass
    CaseResult("case-02", True, "found required fact '200 GB'"),  # => co-07: row 2 -- pass
    CaseResult("case-08", False, "missing required pattern '24-hour'"),  # => co-07: row 3 -- fail, with its own reason
    CaseResult("case-11", False, "expected 'Pro', found no mention of a plan"),  # => co-07: row 4 -- fail, different reason
    CaseResult("case-12", True, "found required fact 'AES-256'"),  # => co-07: row 5 -- pass
]  # => co-07: closes RESULTS


def render_report(results: list[CaseResult]) -> str:  # => co-07: turns the list into one printable, scannable table
    """Render one line per case: id, PASS/FAIL, and its reason."""  # => co-07: documents render_report's contract -- no runtime output, just sets its __doc__
    lines = [f"{r.case_id:<10} {'PASS' if r.passed else 'FAIL':<5} {r.reason}" for r in results]  # => co-07: one row per case
    return "\n".join(lines)  # => co-07: joined into one multi-line report string


if __name__ == "__main__":  # => co-07: entry point -- runs only when this file executes directly, not on import
    report = render_report(RESULTS)  # => co-07: build the whole table in one call
    print(report)  # => co-07: prints the full per-case report
    failing_ids = [r.case_id for r in RESULTS if not r.passed]  # => co-05: which cases need attention, by id
    print(f"Failing cases: {failing_ids}")  # => co-05: prints exactly which cases to open next
    assert failing_ids == ["case-08", "case-11"], "exactly two named cases must fail, with reasons attached"  # => co-05
    print("MATCH: every failure is traceable straight from the report, with no need to re-run anything")  # => co-07
    # => co-07: the pass rate says IF something regressed; the per-case report says exactly WHICH case and WHY
```

**Run**: `python3 per_case_report.py`

**Output**:

```text
case-01    PASS  found required fact '15 GB'
case-02    PASS  found required fact '200 GB'
case-08    FAIL  missing required pattern '24-hour'
case-11    FAIL  expected 'Pro', found no mention of a plan
case-12    PASS  found required fact 'AES-256'
Failing cases: ['case-08', 'case-11']
MATCH: every failure is traceable straight from the report, with no need to re-run anything
```

**Verify**: `render_report(RESULTS)` prints five rows each with a distinct reason, and
`failing_ids` equals exactly `["case-08", "case-11"]`, satisfying co-07's rule that a failure is
traceable to its exact case and reason directly from the report.

**Key takeaway**: the pass rate and the per-case report answer two different questions -- "did it
get better?" and "what exactly broke, and why?" -- and a runner that only reports the former forces
someone to re-run and re-instrument the eval just to answer the latter.

**Why It Matters**: this per-case shape is exactly what Theme D's `diff_runs` (ex-37 onward)
compares between a baseline and a candidate -- a per-case regression is only nameable because each
case's result was recorded individually, not just folded into the aggregate rate. Without recording
each case's own reason, a team investigating a regression would have to re-run the eval by hand and
guess which of dozens of cases actually changed.

---

### Worked Example 26: Run It Twice

_ex-26 &middot; exercises co-08_

**Context**: continuing co-08 -- because the runner may be scoring a genuinely stochastic system,
running the identical evaluation twice can land on two different pass rates. This example runs the
same four-case eval at two different seeds and confirms the rates differ.

```python
# learning/code/ex-26-run-it-twice/run_it_twice.py
"""Worked Example 26: Run It Twice."""  # => co-08: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import random  # => co-08: stands in for the model's own internal sampling randomness
import zlib  # => co-08: crc32 gives a STABLE hash across runs -- Python's builtin hash() is randomized per-process for str

CASES = {  # => co-08: four cases -- each entry is (correct phrasing, one flawed phrasing, how often it's flawed)
    "case-01": ("15 GB", "a generous amount", 0.0),  # => co-08: never flaky -- always answers correctly
    "case-02": ("200 GB", "plenty of space", 0.0),  # => co-08: never flaky -- always answers correctly
    "case-08": ("24-hour", "same-day", 0.5),  # => co-08: FLAKY -- roughly half the time it drops the exact figure
    "case-11": ("Pro", "every plan", 0.5),  # => co-08: FLAKY -- roughly half the time it over-generalizes
}  # => co-08: closes CASES


def mock_model_answer(case_id: str, *, seed: int) -> str:  # => co-08: one mocked, seeded call per case
    """Return the correct phrasing unless this seed's roll lands inside this case's flaw rate."""  # => co-08: documents mock_model_answer's contract -- no runtime output, just sets its __doc__
    correct, flawed, flaw_rate = CASES[case_id]  # => co-08: unpack this case's behavior profile
    rng = random.Random(zlib.crc32(f"{case_id}-{seed}".encode()))  # => co-08: reproducible PER (case, seed), varying ACROSS seeds
    return flawed if rng.random() < flaw_rate else correct  # => co-08: the "sample" -- deterministic given case_id and seed


def run_eval(seed: int) -> float:  # => co-07: one full pass over CASES, reduced to a single pass rate
    """Run every case once at this seed and return the resulting pass rate."""  # => co-07: documents run_eval's contract -- no runtime output, just sets its __doc__
    verdicts = [mock_model_answer(cid, seed=seed) == CASES[cid][0] for cid in CASES]  # => co-07: correct-phrasing check per case
    return sum(verdicts) / len(verdicts)  # => co-07: reduce the run to one comparable number


if __name__ == "__main__":  # => co-08: entry point -- runs only when this file executes directly, not on import
    run_1_rate = run_eval(seed=1)  # => co-08: "run 1" of the SAME eval, over the SAME fixed dataset
    run_2_rate = run_eval(seed=2)  # => co-08: "run 2" -- identical setup, a later, independent sampling
    print(f"Run 1 pass rate: {run_1_rate:.2%}")  # => co-08: prints run 1's headline number
    print(f"Run 2 pass rate: {run_2_rate:.2%}")  # => co-08: prints run 2's headline number
    rates_differ = run_1_rate != run_2_rate  # => co-08: the exact symptom co-08 warns about
    print(f"Pass rates differ across runs: {rates_differ}")  # => co-08: True -- a single run's number is not yet evidence
    assert rates_differ, "two runs of a stochastic eval must NOT always land on the same pass rate"  # => co-08
    print("MATCH: a single run's pass rate is a sample, not a certainty -- re-running is the cheapest check available")  # => co-08
    # => co-08: never accept or reject a change on ONE run's number alone -- ex-27 and ex-28 build on exactly this
```

**Run**: `python3 run_it_twice.py`

**Output**:

```text
Run 1 pass rate: 75.00%
Run 2 pass rate: 50.00%
Pass rates differ across runs: True
MATCH: a single run's pass rate is a sample, not a certainty -- re-running is the cheapest check available
```

**Verify**: `run_eval(seed=1)` returns `75.00%` while `run_eval(seed=2)` returns `50.00%` over the
identical four-case set, satisfying co-08's rule that two runs of a stochastic eval do not always
land on the same pass rate.

**Key takeaway**: the seeded randomness here uses `zlib.crc32` on a formatted string, not Python's
built-in `hash()` -- `hash()` on strings is randomized per process by default, which would have
made this "reproducible" demo silently non-reproducible across separate invocations.

**Why It Matters**: a single pass rate from a single run is a sample from a distribution, exactly
like Example 2's single model call was -- accepting or rejecting a real prompt change on one run's
number alone risks reacting to sampling noise rather than a genuine change in behavior. Treating a
single number as final, without a second run to check it against, is how a stochastic system's
ordinary noise gets mistaken for either a real improvement or a real regression.

---

### Worked Example 27: Flaky-Case Detection

_ex-27 &middot; exercises co-08_

**Context**: continuing co-08 -- repeating every case across multiple trials (not just repeating
the whole run once) pinpoints exactly which cases are unreliable, rather than only knowing the
aggregate rate moved.

```python
# learning/code/ex-27-flaky-case-detection/flaky_case_detection.py
"""Worked Example 27: Flaky-Case Detection."""  # => co-08: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import random  # => co-08: stands in for the model's own internal sampling randomness
import zlib  # => co-08: crc32 gives a STABLE hash across runs -- Python's builtin hash() is randomized per-process for str

CASES = {  # => co-08: three cases -- two rock-solid, one genuinely flaky
    "case-01": ("15 GB", "a generous amount", 0.0),  # => co-08: never flaky
    "case-08": ("24-hour", "same-day", 0.5),  # => co-08: FLAKY -- flips roughly half the time
    "case-12": ("AES-256", "strong encryption", 0.0),  # => co-08: never flaky
}  # => co-08: closes CASES
TRIAL_COUNT = 5  # => co-08: five repeat trials -- cheap, and enough to expose a 50% flip rate


def mock_model_answer(case_id: str, *, trial: int) -> str:  # => co-08: one mocked, seeded call per (case, trial)
    """Return the correct phrasing unless this trial's roll lands inside this case's flaw rate."""  # => co-08: documents mock_model_answer's contract -- no runtime output, just sets its __doc__
    correct, flawed, flaw_rate = CASES[case_id]  # => co-08: unpack this case's behavior profile
    rng = random.Random(zlib.crc32(f"{case_id}-{trial}".encode()))  # => co-08: reproducible PER (case, trial), varying ACROSS trials
    return flawed if rng.random() < flaw_rate else correct  # => co-08: the "sample" for this specific trial


if __name__ == "__main__":  # => co-08: entry point -- runs only when this file executes directly, not on import
    verdicts_by_case: dict[str, list[bool]] = {cid: [] for cid in CASES}  # => co-08: accumulates every trial's verdict, per case
    for trial in range(TRIAL_COUNT):  # => co-08: repeat the SAME cases TRIAL_COUNT times
        for case_id in CASES:  # => co-08: one call per case, per trial
            correct_phrasing = CASES[case_id][0]  # => co-08: this case's own correct phrasing
            output = mock_model_answer(case_id, trial=trial)  # => co-08: this trial's sampled answer
            verdicts_by_case[case_id].append(output == correct_phrasing)  # => co-08: record this trial's pass/fail

    print(f"Verdicts across {TRIAL_COUNT} trials:")  # => co-08: states the trial count up front
    flaky_cases: list[str] = []  # => co-08: accumulates every case whose verdict flips at least once
    for case_id, verdicts in verdicts_by_case.items():  # => co-08: inspect each case's own trial-by-trial history
        print(f"  {case_id}: {verdicts}")  # => co-08: prints the raw per-trial verdict list
        is_flaky = len(set(verdicts)) > 1  # => co-08: flaky iff BOTH True and False appear across the trials
        if is_flaky:  # => co-08: only cases that actually flipped get flagged
            flaky_cases.append(case_id)  # => co-08: record this case as flaky
    print(f"Flaky cases: {flaky_cases}")  # => co-08: prints exactly which cases need n-of-k handling (ex-28)
    assert flaky_cases == ["case-08"], "exactly the deliberately-flaky case must be flagged"  # => co-08
    print("MATCH: repeat trials expose exactly the one case whose verdict is not yet reliable")  # => co-08
    # => co-08: a case that flips across identical trials is telling you something the single-run pass rate hid
```

**Run**: `python3 flaky_case_detection.py`

**Output**:

```text
Verdicts across 5 trials:
  case-01: [True, True, True, True, True]
  case-08: [True, False, False, False, False]
  case-12: [True, True, True, True, True]
Flaky cases: ['case-08']
MATCH: repeat trials expose exactly the one case whose verdict is not yet reliable
```

**Verify**: five trials over `case-08` produce both `True` and `False` verdicts while `case-01`
and `case-12` produce five identical verdicts each, so `flaky_cases` ends up exactly `["case-08"]`,
satisfying co-08's rule that repeat trials pinpoint exactly which case is unreliable.

**Key takeaway**: two rock-solid cases and one flaky case can average into a pass rate that looks
merely "a little lower" -- only per-case trial history reveals that the lowered rate is entirely
attributable to a single unreliable case, not a general regression.

**Why It Matters**: knowing _which_ case is flaky (not just that the aggregate moved) is what makes
Example 28's n-of-k threshold possible -- you can only apply a per-case reliability rule to a case
you have already identified as unreliable. Without this per-case breakdown, a team investigating a
lowered pass rate would have no way to tell a single unreliable case apart from a genuine, broad
regression across the whole dataset.

---

### Worked Example 28: N-of-K Pass Criterion

_ex-28 &middot; exercises co-08_

**Context**: continuing co-08 -- once a case's trial history is known, a written n-of-k threshold
(at least `k` of `n` trials must pass) turns "sometimes right" into an honest fail, instead of
letting it blend into a comfortable-looking average.

```python
# learning/code/ex-28-n-of-k-pass-criterion/n_of_k.py
"""Worked Example 28: N-of-K Pass Criterion."""  # => co-08: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

TRIAL_VERDICTS = {  # => co-08: the same trial-by-trial history ex-27 produced, reused here as a fixture
    "case-01": [True, True, True, True, True],  # => co-08: 5/5 -- rock solid
    "case-08": [True, True, False, False, False],  # => co-08: 2/5 -- the flaky case
    "case-12": [True, True, True, True, True],  # => co-08: 5/5 -- rock solid
}


def passes_n_of_k(verdicts: list[bool], *, k: int) -> bool:  # => co-07: a case counts as passing only above a threshold
    """Pass iff at least `k` of `verdicts` are True."""  # => co-07: documents passes_n_of_k's contract -- no runtime output, just sets its __doc__
    return sum(verdicts) >= k  # => co-07: a strict count, not a majority-of-half rule


if __name__ == "__main__":  # => co-08: entry point -- runs only when this file executes directly, not on import
    threshold_k = 4  # => co-02: a WRITTEN decision -- require at least 4 of 5 trials to pass, not just "most"
    print(f"Requiring at least {threshold_k} of 5 trials to pass")  # => co-02: states the threshold up front
    case_verdicts: dict[str, bool] = {}  # => co-08: one final n-of-k verdict per case
    for case_id, trials in TRIAL_VERDICTS.items():  # => co-08: apply the SAME threshold to every case, uniformly
        final_verdict = passes_n_of_k(trials, k=threshold_k)  # => co-07: reduce 5 trial results to one final verdict
        case_verdicts[case_id] = final_verdict  # => co-08: record this case's final, threshold-applied verdict
        print(f"  {case_id}: {sum(trials)}/5 passed -> final verdict {final_verdict}")  # => co-08: prints the reduction
    assert case_verdicts["case-01"] is True, "5/5 must clear a 4-of-5 threshold"  # => co-08: confirms the solid case
    assert case_verdicts["case-08"] is False, "2/5 must NOT clear a 4-of-5 threshold"  # => co-08: confirms the flaky case fails
    assert case_verdicts["case-12"] is True, "5/5 must clear a 4-of-5 threshold"  # => co-08: confirms the other solid case
    print("MATCH: the flaky case is correctly failed, without needing a single perfectly-stable trial")  # => co-08
    # => co-08: n-of-k turns "sometimes right" into an honest fail, instead of averaging it into a comfortable pass rate
```

**Run**: `python3 n_of_k.py`

**Output**:

```text
Requiring at least 4 of 5 trials to pass
  case-01: 5/5 passed -> final verdict True
  case-08: 2/5 passed -> final verdict False
  case-12: 5/5 passed -> final verdict True
MATCH: the flaky case is correctly failed, without needing a single perfectly-stable trial
```

**Verify**: `passes_n_of_k(TRIAL_VERDICTS["case-08"], k=4)` returns `False` (2/5 does not clear a
4-of-5 threshold) while both rock-solid cases return `True`, satisfying co-08's rule that a written
n-of-k threshold turns an unreliable case into an honest, explicit fail.

**Key takeaway**: `k=4` is co-02's discipline applied to reliability -- it is a written decision,
not an implicit "well, it usually works," and any team could substitute their own `k` for their own
risk tolerance.

**Why It Matters**: n-of-k is the mechanism this course recommends over simply lowering the bar
until flakiness disappears from view -- a case that only clears 2 of 5 trials is genuinely
unreliable, and hiding that inside an averaged pass rate would ship it as if it were not. Silently
averaging a flaky case's failures into the overall rate is how a team ships a case that only works
40% of the time while believing their eval is still green.

---

### Worked Example 29: Seed-and-Temperature Note

_ex-29 &middot; exercises co-08_

**Context**: continuing co-08 -- lowering a model's sampling temperature reduces variance but does
not eliminate it. This example runs the same flaky case at high and low temperature across 200
trials each and confirms the flip count shrinks, but never reaches exactly zero.

```python
# learning/code/ex-29-seed-and-temperature-note/temperature_note.py
"""Worked Example 29: Seed-and-Temperature Note."""  # => co-08: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import random  # => co-08: stands in for the model's own internal sampling randomness

BASE_FLAW_RATE = 0.5  # => co-08: this case's flaw rate at maximum sampling temperature (temperature = 1.0)
TRIAL_COUNT = 200  # => co-08: enough trials that a rate near zero is still distinguishable from truly zero


def flips_at_temperature(temperature: float, *, trials: int) -> int:  # => co-08: counts flawed outputs at a given temperature
    """Run `trials` mocked calls at `temperature` and count how many produced the flawed answer."""  # => co-08: documents flips_at_temperature's contract -- no runtime output, just sets its __doc__
    effective_flaw_rate = BASE_FLAW_RATE * temperature  # => co-08: lower temperature scales the flaw rate DOWN, not to zero
    rng = random.Random(7)  # => co-08: one fixed seed reused across BOTH temperatures -- isolates temperature as the only variable
    return sum(1 for _ in range(trials) if rng.random() < effective_flaw_rate)  # => co-08: count trials that landed on "flawed"


if __name__ == "__main__":  # => co-08: entry point -- runs only when this file executes directly, not on import
    high_temp_flips = flips_at_temperature(temperature=1.0, trials=TRIAL_COUNT)  # => co-08: high temperature -- maximal variance
    low_temp_flips = flips_at_temperature(temperature=0.1, trials=TRIAL_COUNT)  # => co-08: low temperature -- reduced variance
    print(f"High temperature (1.0): {high_temp_flips}/{TRIAL_COUNT} flawed outputs")  # => co-08: prints the high-temp count
    print(f"Low temperature (0.1): {low_temp_flips}/{TRIAL_COUNT} flawed outputs")  # => co-08: prints the low-temp count
    assert low_temp_flips < high_temp_flips, "lowering temperature must reduce the flip count"  # => co-08: confirms the reduction
    assert low_temp_flips > 0, "lowering temperature must NOT drive the flip count to exactly zero"  # => co-08: confirms the caveat
    print("MATCH: lower temperature reduces variance, but 0.1 is not 0.0 -- some flips remain")  # => co-08
    # => co-08: "we lowered the temperature" is not a substitute for run-it-twice -- it shrinks the risk, it does not remove it
```

**Run**: `python3 temperature_note.py`

**Output**:

```text
High temperature (1.0): 110/200 flawed outputs
Low temperature (0.1): 11/200 flawed outputs
MATCH: lower temperature reduces variance, but 0.1 is not 0.0 -- some flips remain
```

**Verify**: `flips_at_temperature(temperature=1.0, ...)` produces 110/200 flawed outputs against
`flips_at_temperature(temperature=0.1, ...)`'s 11/200 -- a real reduction, but never zero,
satisfying co-08's rule that lowering temperature reduces but does not eliminate variance.

**Key takeaway**: a 10x reduction in temperature produced roughly a 10x reduction in flip count
here, but the flip count never crossed zero -- some genuine randomness always remains at any
non-zero temperature.

**Why It Matters**: "we already lowered the temperature" is a real risk-reduction, not a
justification for skipping Example 26's run-it-twice discipline -- a low-temperature system is
still a stochastic one, just a less noisy one. Treating a lower temperature as sufficient on its
own is how a team quietly reintroduces the exact risk Example 26 demonstrated, just with smaller,
harder-to-notice odds.

---

### Worked Example 30: Record Tokens and Cost

_ex-30 &middot; exercises co-11_

**Context**: **co-11 -- cost and latency accounting** means every case's token usage and dollar
cost are recorded in the same run as its pass/fail verdict, not discovered later in a bill. This
example estimates tokens and cost for two cases using a mocked, offline token estimator.

```python
# learning/code/ex-30-record-tokens-and-cost/tokens_and_cost.py
"""Worked Example 30: Record Tokens and Cost."""  # => co-11: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

CASES = {  # => co-11: case id -> (prompt text, output text) -- what actually got sent and returned
    "case-01": ("How much free storage does Nimbus give?", "New Nimbus accounts start with 15 GB of free storage."),  # => co-11: case 1
    "case-02": ("How much storage does Nimbus Pro include?", "Nimbus Pro includes 200 GB of storage."),  # => co-11: case 2
}  # => co-11: closes CASES
PRICE_PER_TOKEN = 0.000002  # => co-11: placeholder rate, not a confirmed market rate -- read the real one from config, never hard-code it in production


def estimate_tokens(text: str) -> int:  # => co-11: a mocked, offline token estimate -- no real tokenizer call needed
    """Approximate token count as roughly 1.3 tokens per whitespace-separated word."""  # => co-11: documents estimate_tokens's contract -- no runtime output, just sets its __doc__
    word_count = len(text.split())  # => co-11: a simple, deterministic proxy for a real tokenizer
    return round(word_count * 1.3)  # => co-11: rounds to a whole token count


def cost_for_case(prompt: str, output: str) -> tuple[int, float]:  # => co-11: tokens AND their dollar cost, together
    """Return (total_tokens, cost_usd) for one case's prompt + output."""  # => co-11: documents cost_for_case's contract -- no runtime output, just sets its __doc__
    total_tokens = estimate_tokens(prompt) + estimate_tokens(output)  # => co-11: prompt tokens plus completion tokens
    cost_usd = total_tokens * PRICE_PER_TOKEN  # => co-11: tokens times the per-token rate
    return total_tokens, cost_usd  # => co-11: returns this computed value to the caller


if __name__ == "__main__":  # => co-11: entry point -- runs only when this file executes directly, not on import
    total_tokens_all = 0  # => co-11: accumulates tokens across every case in this run
    total_cost_all = 0.0  # => co-11: accumulates cost across every case in this run
    for case_id, (prompt, output) in CASES.items():  # => co-11: one estimate per case, alongside its own pass/fail
        tokens, cost = cost_for_case(prompt, output)  # => co-11: this case's own tokens and cost
        total_tokens_all += tokens  # => co-11: running total across the whole run
        total_cost_all += cost  # => co-11: running total across the whole run
        print(f"{case_id}: {tokens} tokens, ${cost:.6f}")  # => co-11: prints this case's own tokens and cost
    print(f"Run totals: {total_tokens_all} tokens, ${total_cost_all:.6f}")  # => co-11: prints the whole run's totals
    assert total_tokens_all > 0, "a non-empty run must report a positive token total"  # => co-11: sanity check
    assert total_cost_all > 0.0, "a non-empty run must report a positive cost total"  # => co-11: sanity check
    print("MATCH: every case's tokens and cost are recorded in the SAME run as its pass/fail verdict")  # => co-11
    # => co-11: a quality win that costs 4x more per case is a decision to make deliberately, not something to discover in a bill
```

**Run**: `python3 tokens_and_cost.py`

**Output**:

```text
case-01: 22 tokens, $0.000044
case-02: 18 tokens, $0.000036
Run totals: 40 tokens, $0.000080
MATCH: every case's tokens and cost are recorded in the SAME run as its pass/fail verdict
```

**Verify**: both cases report positive token and cost totals, and the run total (`40` tokens,
`$0.000080`) equals the sum of the per-case values, satisfying co-11's rule that cost is tracked
per case and aggregated in the same run as the pass/fail verdicts.

**Key takeaway**: `PRICE_PER_TOKEN` here is a placeholder, not a confirmed market rate -- it stands
in for whatever rate a real provider actually charges at the time of the run, a volatile fact the
example deliberately keeps out of any stable claim.

**Why It Matters**: recording cost alongside pass rate, in the same run, is what makes Example 32's
quality/cost trade-off report possible without a separate reconciliation step against a billing
dashboard days later. Discovering a cost regression only after a monthly bill arrives is far more
expensive to diagnose than seeing it flagged, per case, in the same run that measured quality.

---

### Worked Example 31: Record Latency

_ex-31 &middot; exercises co-11_

**Context**: continuing co-11 -- recording both the mean and the 95th-percentile (p95) latency
exposes an outlier the mean alone hides. This example computes both over twelve fixed, mocked
per-case latencies.

```python
# learning/code/ex-31-record-latency/latency.py
"""Worked Example 31: Record Latency."""  # => co-11: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import statistics  # => co-11: quantiles need nothing beyond the standard library's own statistics module

CASE_LATENCIES_MS = {  # => co-11: mocked, fixed per-case latencies in milliseconds -- no live network call needed
    "case-01": 420, "case-02": 455, "case-03": 402, "case-04": 610,  # => co-11: cases 1-4 -- mostly fast
    "case-05": 398, "case-06": 441, "case-07": 415, "case-08": 590,  # => co-11: cases 5-8 -- one more slow outlier
    "case-09": 407, "case-10": 388, "case-11": 433, "case-12": 449,  # => co-11: cases 9-12 -- back to typical speed
}  # => co-11: closes CASE_LATENCIES_MS -- twelve fixed, reproducible latency samples


def p95(latencies_ms: list[int]) -> float:  # => co-11: the 95th percentile -- the near-worst-case, not the average
    """Return the 95th-percentile value of `latencies_ms`."""  # => co-11: documents p95's contract -- no runtime output, just sets its __doc__
    return statistics.quantiles(latencies_ms, n=100)[94]  # => co-11: n=100 quantiles -- index 94 is the 95th percentile cut


if __name__ == "__main__":  # => co-11: entry point -- runs only when this file executes directly, not on import
    latencies = list(CASE_LATENCIES_MS.values())  # => co-11: this run's twelve latency samples, in dataset order
    mean_latency = statistics.mean(latencies)  # => co-11: the average -- easily hidden by one slow outlier
    p95_latency = p95(latencies)  # => co-11: the tail -- what most users near the slow end actually experience
    print(f"Mean latency: {mean_latency:.1f} ms")  # => co-11: prints the average
    print(f"p95 latency: {p95_latency:.1f} ms")  # => co-11: prints the near-worst-case figure
    assert mean_latency < p95_latency, "the p95 figure must sit above the mean whenever an outlier exists"  # => co-11
    print("MATCH: the p95 figure exposes the outlier the mean alone would hide")  # => co-11
    # => co-11: recording BOTH mean and p95 alongside pass rate is what turns "it feels slower" into a comparable number
```

**Run**: `python3 latency.py`

**Output**:

```text
Mean latency: 450.7 ms
p95 latency: 617.0 ms
MATCH: the p95 figure exposes the outlier the mean alone would hide
```

**Verify**: `mean_latency` (450.7ms) sits well below `p95_latency` (617.0ms), satisfying co-11's
rule that the p95 figure exposes the tail an average alone hides.

**Key takeaway**: 450.7ms sounds fine on its own -- it is the p95 figure, not the mean, that
reveals a meaningful fraction of cases are actually taking 617ms or more.

**Why It Matters**: mean and p95 latency, recorded in the same run as pass rate and cost, are what
Example 32's trade-off report needs to state a candidate's full cost -- not just its dollar cost,
but its user-facing responsiveness too. A candidate that looks fine on the mean but regresses badly
on p95 is exactly the kind of change that reads well in a summary and then generates real user
complaints in production.

---

### Worked Example 32: Quality/Cost Trade-off Report

_ex-32 &middot; exercises co-11_

**Context**: continuing co-11 -- pass rate, cost, and latency reported together turn a quality win
into an explicit trade-off decision, not a free lunch. This example reports all three deltas
between a baseline and a candidate whose pass rate improves by 17 points at 4x the cost and nearly
double the latency.

```python
# learning/code/ex-32-quality-cost-tradeoff-report/tradeoff_report.py
"""Worked Example 32: Quality/Cost Trade-off Report."""  # => co-11: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

from typing import NamedTuple  # => co-11: a typed record for one run's combined quality/cost/latency summary


class RunSummary(NamedTuple):  # => co-11: pass rate, cost, and latency -- reported TOGETHER, never separately
    pass_rate: float  # => co-07: the headline quality number
    cost_usd: float  # => co-11: the headline cost number, for the SAME run
    p95_latency_ms: float  # => co-11: the headline latency number, for the SAME run


BASELINE = RunSummary(pass_rate=0.83, cost_usd=0.012, p95_latency_ms=480.0)  # => co-09: "prompt v1" -- the current shipped version
CANDIDATE = RunSummary(pass_rate=1.00, cost_usd=0.048, p95_latency_ms=910.0)  # => co-09: "prompt v2" -- a proposed change


def render_tradeoff(baseline: RunSummary, candidate: RunSummary) -> str:  # => co-11: one report, three deltas, side by side
    """Render pass-rate, cost, and latency deltas between `baseline` and `candidate`."""  # => co-11: documents render_tradeoff's contract -- no runtime output, just sets its __doc__
    pass_delta = candidate.pass_rate - baseline.pass_rate  # => co-07: the quality change
    cost_ratio = candidate.cost_usd / baseline.cost_usd  # => co-11: the cost change, as a multiplier
    latency_delta = candidate.p95_latency_ms - baseline.p95_latency_ms  # => co-11: the latency change, in milliseconds
    return (  # => co-11: assembles the three deltas into one printable report
        f"Pass rate: {baseline.pass_rate:.0%} -> {candidate.pass_rate:.0%} ({pass_delta:+.0%})\n"  # => co-07: quality line
        f"Cost: ${baseline.cost_usd:.3f} -> ${candidate.cost_usd:.3f} ({cost_ratio:.1f}x)\n"  # => co-11: cost line
        f"p95 latency: {baseline.p95_latency_ms:.0f}ms -> {candidate.p95_latency_ms:.0f}ms ({latency_delta:+.0f}ms)"  # => co-11: latency line
    )  # => co-11: closes the assembled report string


if __name__ == "__main__":  # => co-11: entry point -- runs only when this file executes directly, not on import
    report = render_tradeoff(BASELINE, CANDIDATE)  # => co-11: build the whole trade-off report in one call
    print(report)  # => co-11: prints all three deltas together
    quality_improved = CANDIDATE.pass_rate > BASELINE.pass_rate  # => co-07: is this candidate a quality win?
    cost_regressed = CANDIDATE.cost_usd >= 4 * BASELINE.cost_usd  # => co-11: is this candidate a real cost regression?
    print(f"Quality improved: {quality_improved} | Cost regressed 4x+: {cost_regressed}")  # => co-11: states both facts plainly
    assert quality_improved, "the candidate must genuinely improve pass rate for this scenario"  # => co-07: confirms the win
    assert cost_regressed, "the candidate must genuinely cost 4x or more for this scenario"  # => co-11: confirms the trade
    print("MATCH: a 17-point quality win paid for with a 4x cost increase is a DECISION, not a free lunch")  # => co-11
    # => co-11: without this report, only the pass-rate line would ship the change -- the cost line is what makes it a choice
```

**Run**: `python3 tradeoff_report.py`

**Output**:

```text
Pass rate: 83% -> 100% (+17%)
Cost: $0.012 -> $0.048 (4.0x)
p95 latency: 480ms -> 910ms (+430ms)
Quality improved: True | Cost regressed 4x+: True
MATCH: a 17-point quality win paid for with a 4x cost increase is a DECISION, not a free lunch
```

**Verify**: `render_tradeoff(BASELINE, CANDIDATE)` reports all three deltas together (`+17%`
pass-rate, `4.0x` cost, `+430ms` latency), satisfying co-11's rule that a quality win is reported
alongside its full cost, not in isolation.

**Key takeaway**: a report that showed only the pass-rate line ("83% to 100%!") would make this
candidate look like an unambiguous win -- the cost and latency lines are what turn it into an
informed trade-off a team can actually decide on.

**Why It Matters**: this is the exact report shape Theme D's `compare.py` (and the capstone's
`compare.py`) build on -- a candidate is never accepted on pass rate alone, and cost/latency
reporting is how "alone" gets caught before a decision is made. Skipping this combined report is
how a team ships a candidate that technically passes on pass rate alone while quietly tripling its
per-case cost or doubling its response time.

---

### Worked Example 33: Results as a Committed Artefact

_ex-33 &middot; exercises co-09_

**Context**: **co-09** needs a stable baseline to compare against, and a run's results only serve
that role if writing them is genuinely reproducible -- the same results must serialize to the same
bytes every time. This example writes a fixed result set to disk twice and confirms the two writes
are byte-identical.

```python
# learning/code/ex-33-results-as-a-committed-artefact/results_artefact.py
"""Worked Example 33: Results as a Committed Artefact."""  # => co-07: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import json  # => co-07: the artefact format needs nothing beyond the standard library's own json module
from pathlib import Path  # => co-07: locates results.json relative to this script, not the caller's cwd

RESULTS_PATH = Path(__file__).parent / "results.json"  # => co-09: the committed artefact THIS run produces
FIXED_RESULTS: dict[str, object] = {  # => co-07: a small, fixed run's worth of results -- deterministic, not sampled
    "run_id": "prompt-v1-baseline",  # => co-09: names WHICH version of the system produced this artefact
    "pass_rate": 0.9167,  # => co-07: the headline number from ex-23's run
    "cases": {"case-01": "PASS", "case-11": "FAIL"},  # => co-07: a trimmed per-case snapshot for this example
}  # => co-07: closes FIXED_RESULTS


def write_results(path: Path, results: dict[str, object]) -> None:  # => co-09: persist the run's results to disk
    """Write `results` to `path` as pretty-printed, deterministically-ordered JSON."""  # => co-09: documents write_results's contract -- no runtime output, just sets its __doc__
    path.write_text(json.dumps(results, indent=2, sort_keys=True) + "\n", encoding="utf-8")  # => co-09: sort_keys -- same input, same bytes, every time


if __name__ == "__main__":  # => co-07: entry point -- runs only when this file executes directly, not on import
    write_results(RESULTS_PATH, FIXED_RESULTS)  # => co-09: "run 1" -- writes the artefact to disk
    first_write = RESULTS_PATH.read_text(encoding="utf-8")  # => co-09: read back exactly what run 1 wrote
    write_results(RESULTS_PATH, FIXED_RESULTS)  # => co-09: "run 2" -- writes the SAME artefact again
    second_write = RESULTS_PATH.read_text(encoding="utf-8")  # => co-09: read back exactly what run 2 wrote
    print(first_write)  # => co-09: prints the committed artefact's exact contents
    reproducible = first_write == second_write  # => co-09: byte-for-byte identical, not just "similar"
    print(f"Byte-identical across two writes: {reproducible}")  # => co-09: prints the reproducibility check
    assert reproducible, "the same results must serialize to byte-identical JSON on every write"  # => co-09
    print("MATCH: results.json is a reproducible artefact another engineer can open and re-check by hand")  # => co-07
    # => co-09: a comparison (ex-37) is only trustworthy if the baseline it compares against is itself a stable, committed file
```

**Run**: `python3 results_artefact.py`

**Output**:

```text
{
  "cases": {
    "case-01": "PASS",
    "case-11": "FAIL"
  },
  "pass_rate": 0.9167,
  "run_id": "prompt-v1-baseline"
}

Byte-identical across two writes: True
MATCH: results.json is a reproducible artefact another engineer can open and re-check by hand
```

**Verify**: writing `FIXED_RESULTS` to disk twice produces byte-identical file contents
(`first_write == second_write`), satisfying co-09's rule that a committed results artefact
serializes reproducibly.

**Key takeaway**: `sort_keys=True` is the one detail making this reproducible -- without it, dict
key ordering (which Python guarantees only reflects insertion order, not a canonical one) could
vary the JSON's byte layout between otherwise-identical writes.

**Why It Matters**: this `results.json` file is the exact shape Theme D's baseline/candidate
comparison reads from -- a comparison against a baseline that is not itself reproducible would be
comparing against a moving target. Comparing a candidate against a baseline file that changes shape
or ordering between reads would produce a diff that looks meaningful but is really just noise from
the serialization itself.

---

### Worked Example 34: Runner as a Pytest Suite

_ex-34 &middot; exercises co-05_

**Context**: continuing co-05 -- the identical eval runner works equally well expressed as an
ordinary pytest suite, with `pytest.mark.parametrize` driving one test per dataset case and
pytest's own `assert` acting as the pass/fail gate -- no separate eval framework needed.

```python
# learning/code/ex-34-runner-as-a-pytest-suite/test_eval_gate.py
"""Worked Example 34: Runner as a Pytest Suite."""  # => co-05: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import json  # => co-03: JSONL needs nothing beyond the standard library's own json module
import re  # => co-05: backs the regex and numeric_tolerance scorer entries below
from pathlib import Path  # => co-03: locates dataset.jsonl relative to this file, not pytest's own cwd

import pytest  # => co-05: no separate eval framework -- ordinary pytest IS the runner

DATASET_PATH = Path(__file__).parent / "dataset.jsonl"  # => co-03: the same twelve-case fixed gate as ex-23
NUMBER_PATTERN = re.compile(r"-?\d+(?:\.\d+)?")  # => co-05: shared by the numeric_tolerance scorer below
SYSTEM_ANSWERS = {  # => co-01: the same mocked "prompt v1" answers as ex-23, unchanged
    "case-01": "New Nimbus accounts start with 15 GB of free storage.",  # => co-01: correct
    "case-02": "Nimbus Pro includes 200 GB of storage.",  # => co-01: correct
    "case-03": "Yes, Nimbus supports two-factor authentication.",  # => co-01: correct
    "case-04": "The Nimbus app shipped on iOS first.",  # => co-01: correct
    "case-05": "The Free plan accepts files up to 5 GB in size.",  # => co-01: correct
    "case-06": "The Pro plan accepts files up to 50 GB in size.",  # => co-01: correct
    "case-07": "Share links expire automatically after 30 days.",  # => co-01: correct
    "case-08": "Free-plan email support targets a 24-hour first response.",  # => co-01: correct
    "case-09": "Deleted files stay in trash for 30 days.",  # => co-01: correct
    "case-10": "pro only",  # => co-01: correct, short classification-style output
    "case-11": "The public REST API is available on the Free plan too.",  # => co-01: WRONG -- it's Pro-only
    "case-12": "Files are encrypted at rest using AES-256.",  # => co-01: correct
}  # => co-01: closes SYSTEM_ANSWERS -- eleven correct, one deliberately wrong


def score(scorer_name: str, output: str, expected: str) -> bool:  # => co-05: the same four-entry registry as ex-23
    if scorer_name == "exact_match":  # => co-05: dispatch branch 1
        return output.strip().lower() == expected.strip().lower()  # => co-05: normalized equality
    if scorer_name == "substring":  # => co-05: dispatch branch 2
        return expected in output  # => co-05: the fact just has to appear somewhere
    if scorer_name == "regex":  # => co-05: dispatch branch 3
        return re.search(expected, output) is not None  # => co-05: expected doubles as the pattern text
    match = NUMBER_PATTERN.search(output)  # => co-05: dispatch branch 4 (numeric_tolerance)
    return match is not None and abs(float(match.group()) - float(expected)) <= 1.0  # => co-05: within +-1 tolerance


def _load_cases() -> list[dict[str, str]]:  # => co-03: loads the dataset ONCE, at collection time
    """Load the committed dataset.jsonl for use as pytest.mark.parametrize's own case list."""  # => co-03: documents _load_cases's contract -- no runtime output, just sets its __doc__
    return [json.loads(line) for line in DATASET_PATH.read_text(encoding="utf-8").splitlines() if line.strip()]  # => co-03


@pytest.mark.parametrize("case", _load_cases(), ids=lambda c: c["id"])  # => co-07: ONE test function, TWELVE reported test results
def test_case_passes_its_own_scorer(case: dict[str, str]) -> None:  # => co-07: this IS the eval, expressed as a pytest test
    """Each dataset case must pass the scorer it declares for itself."""  # => co-07: documents test_case_passes_its_own_scorer's contract -- no runtime output, just sets its __doc__
    output = SYSTEM_ANSWERS[case["id"]]  # => co-01: "call the system" -- mocked, offline, no API key
    verdict = score(case["scorer"], output, case["expected"])  # => co-05: apply this case's own declared scorer
    assert verdict, f"{case['id']} failed its {case['scorer']} scorer"  # => co-07: pytest's own assert IS the pass/fail gate
```

**Run**: `python3 -m pytest test_eval_gate.py -q`

**Output**:

```text
..........F.                                                             [100%]
=================================== FAILURES ===================================
___________________ test_case_passes_its_own_scorer[case-11] ___________________
test_eval_gate.py:51: in test_case_passes_its_own_scorer
    assert verdict, f"{case['id']} failed its {case['scorer']} scorer"  # => co-07: pytest's own assert IS the pass/fail gate
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
E   AssertionError: case-11 failed its substring scorer
E   assert False
1 failed, 11 passed in 0.01s
```

**Verify**: `pytest.mark.parametrize` produces exactly 12 reported test results (`case-01`
through `case-12`), and the run reports `1 failed, 11 passed` with `test_case_passes_its_own_scorer[case-11]`
named as the failure, satisfying co-05's rule that the identical dataset/scorer pairing works as
an ordinary pytest suite with no separate eval framework.

**Key takeaway**: nothing about this file needed a purpose-built "eval framework" -- a
`pytest.mark.parametrize`-driven test IS an eval runner, complete with per-case pass/fail reporting
and CI integration that pytest already provides for free.

**Why It Matters**: Theme D's capstone-adjacent work and CI gating both build on exactly this
observation -- a light eval gate that reuses the same pytest infrastructure a team already runs on
every pull request costs nothing extra to wire into CI, unlike standing up a separate eval
pipeline. Standing up a separate eval framework only to duplicate what CI already runs on every
pull request is exactly the kind of avoidable cost this course's cheap, deterministic approach is
built to eliminate.

---

← Previous: [Theme B: Scorers That Cost Nothing](./theme-b-scorers-that-cost-nothing.md) &middot;
Next: [Theme D: Using the Gate on a Real Change](./theme-d-using-the-gate-on-a-real-change.md) →
