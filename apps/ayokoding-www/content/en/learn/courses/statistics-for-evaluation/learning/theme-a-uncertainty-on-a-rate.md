---
title: "Theme A: Uncertainty on a Rate"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 10
---

Examples 1-12 build the case that a pass rate is a sample proportion of an unknown true rate
(co-02), not the truth itself: the same unchanged system gives different numbers on two runs
(co-03), that spread shrinks predictably with n (co-03), and a confidence interval turns that spread
into a defensible range (co-04). The normal approximation -- the textbook default -- breaks exactly
where eval datasets live: small n, rates near 0 or 1 (co-05); Wilson and Clopper-Pearson are the
fix. The theme closes with the design question "how many cases do I need" (co-06) and a reporting
helper that makes a bare number structurally impossible to ship (co-24). Every code-medium example's
real, runnable **Python 3.13** file lives under `learning/code/ex-NN-*/`, run for real against the
pinned statistical toolchain (`numpy==2.5.1`, `scipy==1.18.0`, `statsmodels==0.14.6`) to capture
genuine output. (See this topic's [References](../overview.md#references) for the exact
pinned versions.)

---

### Worked Example 1: Two Runs, Two Numbers

_ex-01 &middot; exercises co-03, co-02_

**Context**: **co-03 -- sampling error** is the spread you get when the exact same, unchanged
system is measured on two different samples. This example re-runs one fixed, unchanging system
against two independently-drawn 40-case samples and shows the two pass rates differ, even though
nothing about the system itself changed.

```python
# learning/code/ex-01-two-runs-two-numbers/two_runs.py
"""Worked Example 1: Two Runs, Two Numbers."""  # => co-03: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import random  # => co-03: stands in for drawing two independent samples of the same unchanged system

TRUE_PASS_RATE = 0.85  # => co-02: the system's real, unobservable pass rate -- fixed and UNCHANGED across both runs
SAMPLE_SIZE = 40  # => co-03: how many cases each run draws -- a typical small eval-set size


def run_eval(true_rate: float, n: int, *, seed: int) -> float:  # => co-02: simulates one eval run against the SAME system
    """Draw n Bernoulli(true_rate) trials and return the observed pass rate."""  # => co-02: documents run_eval's contract -- no runtime output, just sets its __doc__
    rng = random.Random(seed)  # => co-03: a fresh generator per run -- seed stands in for "which cases happened to be sampled"
    passes = sum(1 for _ in range(n) if rng.random() < true_rate)  # => co-02: one Bernoulli draw per case, summed
    return passes / n  # => co-02: the OBSERVED pass rate -- a sample proportion, not the true rate itself


if __name__ == "__main__":  # => co-03: entry point -- runs only when this file executes directly, not on import
    rate_run_1 = run_eval(TRUE_PASS_RATE, SAMPLE_SIZE, seed=1)  # => co-03: "run 1" -- same system, same n, different sample
    rate_run_2 = run_eval(TRUE_PASS_RATE, SAMPLE_SIZE, seed=2)  # => co-03: "run 2" -- same system, same n, DIFFERENT sample
    print(f"True (unobservable) pass rate: {TRUE_PASS_RATE:.2%}")  # => co-02: the ground truth this demo controls
    print(f"Run 1 observed pass rate: {rate_run_1:.2%}")  # => co-03: run 1's number
    print(f"Run 2 observed pass rate: {rate_run_2:.2%}")  # => co-03: run 2's DIFFERENT number
    difference = abs(rate_run_1 - rate_run_2)  # => co-03: the spread between two runs of an UNCHANGED system
    print(f"Difference between two runs of the SAME unchanged system: {difference:.2%}")  # => co-03
    assert rate_run_1 != rate_run_2, "two independent samples of the same system must differ for this demo to make its point"  # => co-03
    print("MATCH: the system never changed, yet the two numbers differ -- that spread is sampling error, not a bug")  # => co-03
    # => co-02,co-03: a pass rate is a sample proportion of an unknown true rate -- re-sampling moves the number even when nothing else does
```

**Run**: `python3 two_runs.py`

**Output**:

```text
True (unobservable) pass rate: 85.00%
Run 1 observed pass rate: 92.50%
Run 2 observed pass rate: 80.00%
Difference between two runs of the SAME unchanged system: 12.50%
MATCH: the system never changed, yet the two numbers differ -- that spread is sampling error, not a bug
```

**Verify**: `run_eval(TRUE_PASS_RATE, 40, seed=1)` returns `92.50%` while `run_eval(TRUE_PASS_RATE,
40, seed=2)` returns `80.00%` on the identical, unchanged `TRUE_PASS_RATE`, satisfying co-03's rule
that re-sampling alone moves the observed number.

**Key takeaway**: seeing two different pass rates does not, by itself, mean the system changed --
sampling error alone produces that spread.

**Why It Matters**: every later worked example in this theme exists to answer the question this
example raises: how big is that spread, and can it be quantified rather than eyeballed? Skipping
this question is how a team mistakes an unchanged system's own sampling noise for a real regression
or a real improvement.

---

### Worked Example 2: Pass Rate Is an Estimate

_ex-02 &middot; exercises co-02_

**Context**: continuing co-02 -- a pass rate is a sample proportion **estimating** an unknown true
rate, not the true rate itself. This example runs the same eval thousands of independent times and
shows that while no single run's number equals the true rate, the average across many runs
converges to it -- the defining property of an unbiased estimator.

```python
# learning/code/ex-02-pass-rate-is-an-estimate/pass_rate_estimate.py
"""Worked Example 2: Pass Rate Is an Estimate."""  # => co-02: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import random  # => co-02: draws many independent samples to reveal the estimator's own behavior
import statistics  # => co-02: averages many observed pass rates to approximate the true rate

TRUE_PASS_RATE = 0.73  # => co-02: the system's real, unobservable pass rate -- known here only because this is a simulation
SAMPLE_SIZE = 50  # => co-02: cases per single eval run
NUM_REPEATS = 4000  # => co-02: how many independent runs to average over -- large enough for the law of large numbers to bite


def observed_pass_rate(true_rate: float, n: int, *, seed: int) -> float:  # => co-02: ONE run -- what a team actually sees
    """Draw n Bernoulli(true_rate) trials and return the sample proportion that passed."""  # => co-02: documents observed_pass_rate's contract -- no runtime output, just sets its __doc__
    rng = random.Random(seed)  # => co-02: a fresh generator per run
    passes = sum(1 for _ in range(n) if rng.random() < true_rate)  # => co-02: count of Bernoulli successes in this run
    return passes / n  # => co-02: the sample proportion -- a single run's ESTIMATE of the true rate, not the true rate itself


if __name__ == "__main__":  # => co-02: entry point -- runs only when this file executes directly, not on import
    one_run = observed_pass_rate(TRUE_PASS_RATE, SAMPLE_SIZE, seed=0)  # => co-02: what a single team actually observes, once
    print(f"True (unobservable) pass rate: {TRUE_PASS_RATE:.4f}")  # => co-02: the ground truth this simulation controls
    print(f"One run's observed pass rate: {one_run:.4f}")  # => co-02: a single sample proportion -- one team's whole evidence
    many_runs = [observed_pass_rate(TRUE_PASS_RATE, SAMPLE_SIZE, seed=i) for i in range(NUM_REPEATS)]  # => co-02: thousands of INDEPENDENT teams running the same eval
    average_of_runs = statistics.mean(many_runs)  # => co-02: the estimator's own long-run behavior -- what "unbiased" means
    print(f"Average pass rate across {NUM_REPEATS} independent runs: {average_of_runs:.4f}")  # => co-02: converges toward the true rate
    gap_to_truth = abs(average_of_runs - TRUE_PASS_RATE)  # => co-02: how close the LONG-RUN average lands to the true rate
    print(f"Gap between the long-run average and the true rate: {gap_to_truth:.4f}")  # => co-02: should be small -- the estimator is unbiased
    assert gap_to_truth < 0.01, "the average of many independent pass-rate estimates must land close to the true rate"  # => co-02
    print("MATCH: no single run equals the true rate, but the estimator is unbiased across many runs")  # => co-02
    # => co-02: a pass rate IS a sample proportion of an unknown true rate -- treating one run's number as the truth itself is the mistake
```

**Run**: `python3 pass_rate_estimate.py`

**Output**:

```text
True (unobservable) pass rate: 0.7300
One run's observed pass rate: 0.6400
Average pass rate across 4000 independent runs: 0.7297
Gap between the long-run average and the true rate: 0.0003
MATCH: no single run equals the true rate, but the estimator is unbiased across many runs
```

**Verify**: a single run (`seed=0`) reports `0.6400`, nine points away from the true `0.7300`, while
the average across 4000 independent runs lands at `0.7297` -- a gap of only `0.0003` -- satisfying
co-02's rule that the pass-rate estimator is unbiased even though any one draw of it is noisy.

**Key takeaway**: "the eval says 64%" and "the true rate is 73%" are both compatible with the exact
same system -- one run's number is a single noisy draw from an estimator, not a measurement of the
truth with no error bar.

**Why It Matters**: this is the conceptual foundation every later example in this theme quantifies
further. Confusing "what I observed" with "what is true" is the root cause of the exact overreach
this course's overview warns against -- reporting a bare number as if it carries no uncertainty.

---

### Worked Example 3: Simulate Sampling Error

_ex-03 &middot; exercises co-03_

**Context**: continuing co-03 -- sampling error is quantifiable, and its size follows a predictable
pattern as sample size grows. This example draws repeated samples at four sample sizes (10, 40,
160, 640) from the same true rate and measures how much the observed pass rate spreads at each
size.

```python
# learning/code/ex-03-simulate-sampling-error/sampling_error.py
"""Worked Example 3: Simulate Sampling Error."""  # => co-03: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import random  # => co-03: draws repeated samples at each sample size
import statistics  # => co-03: measures the spread (population standard deviation) of the resulting pass rates

TRUE_PASS_RATE = 0.85  # => co-03: the system's real, unobservable pass rate -- fixed across every sample size tested
SAMPLE_SIZES = (10, 40, 160, 640)  # => co-03: quadrupling n each step -- sampling error should shrink roughly like 1/sqrt(n)
REPEATS_PER_SIZE = 200  # => co-03: independent draws per sample size, enough to estimate the spread itself precisely


def observed_pass_rate(true_rate: float, n: int, *, seed: int) -> float:  # => co-03: ONE simulated eval run at size n
    """Draw n Bernoulli(true_rate) trials and return the observed pass rate."""  # => co-03: documents observed_pass_rate's contract -- no runtime output, just sets its __doc__
    rng = random.Random(seed)  # => co-03: a fresh generator per (size, repeat) draw
    passes = sum(1 for _ in range(n) if rng.random() < true_rate)  # => co-03: count of Bernoulli successes
    return passes / n  # => co-03: this run's observed pass rate


if __name__ == "__main__":  # => co-03: entry point -- runs only when this file executes directly, not on import
    spreads: dict[int, float] = {}  # => co-03: sample size -> spread (pstdev) of observed pass rates at that size
    for n in SAMPLE_SIZES:  # => co-03: one spread measurement per candidate sample size
        rates = [observed_pass_rate(TRUE_PASS_RATE, n, seed=1000 * n + i) for i in range(REPEATS_PER_SIZE)]  # => co-03: many independent runs at this n
        spread = statistics.pstdev(rates)  # => co-03: how much the observed rate bounces around, at this n
        spreads[n] = spread  # => co-03: record it for the shrink-rate check below
        bar = "#" * round(spread * 400)  # => co-03: a plain-text bar -- longer bar means more sampling error at this n
        print(f"n={n:>4} | spread={spread:.4f} | {bar}")  # => co-03: prints size, spread, and its ASCII-bar visualization
    assert spreads[SAMPLE_SIZES[0]] > spreads[SAMPLE_SIZES[-1]], "spread must shrink as n grows"  # => co-03: the qualitative claim
    ratio_10_to_640 = spreads[10] / spreads[640]  # => co-03: sqrt(640/10) = 8 is the theoretical shrink factor for a 64x larger n
    print(f"Spread ratio (n=10 / n=640): {ratio_10_to_640:.2f} (theoretical 1/sqrt(n) factor: {(640 / 10) ** 0.5:.2f})")  # => co-03
    assert 6.0 < ratio_10_to_640 < 10.0, "the shrink ratio must be close to the theoretical sqrt(n) factor"  # => co-03: sanity-checks the simulation itself
    print("MATCH: sampling error shrinks roughly like 1/sqrt(n) -- quantifiable, not mysterious")  # => co-03
    # => co-03: this is WHY a confidence interval (ex-04 onward) has a width that depends on n, not just on the observed rate
```

**Run**: `python3 sampling_error.py`

**Output**:

```text
n=  10 | spread=0.1140 | ##############################################
n=  40 | spread=0.0604 | ########################
n= 160 | spread=0.0317 | #############
n= 640 | spread=0.0131 | #####
Spread ratio (n=10 / n=640): 8.73 (theoretical 1/sqrt(n) factor: 8.00)
MATCH: sampling error shrinks roughly like 1/sqrt(n) -- quantifiable, not mysterious
```

**Verify**: the spread at `n=10` (`0.1140`) is roughly `8.73` times the spread at `n=640`
(`0.0131`), close to the theoretical `sqrt(64)=8.00` factor for a 64-fold increase in `n`,
satisfying co-03's rule that sampling error shrinks predictably, at a `1/sqrt(n)` rate.

**Key takeaway**: sampling error is not a vague notion of "noise" -- it shrinks at a specific,
predictable rate as n grows, which is exactly what a confidence interval formula encodes.

**Why It Matters**: this `1/sqrt(n)` shape is the mechanism behind every interval-width and
sample-size calculation in the rest of this theme (ex-04, ex-07, ex-08). A team that does not
internalize this shape tends to either over-collect cases well past the point of diminishing return,
or under-collect and mistake a too-small sample's noise for a real signal.

---

### Worked Example 4: Interval From Definition

_ex-04 &middot; exercises co-04_

**Context**: **co-04 -- confidence interval on a rate** turns the sampling error ex-03 quantified
into a defensible range of true rates consistent with what was observed. This example computes the
normal-approximation interval both from its textbook formula in plain Python and from the pinned
`statsmodels` library, and verifies the two agree exactly.

```python
# learning/code/ex-04-interval-from-definition/interval_from_definition.py
"""Worked Example 4: Interval From Definition."""  # => co-04: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import math  # => co-04: sqrt for the standard error, no third-party dependency needed for the from-definition half

from statsmodels.stats.proportion import proportion_confint  # => co-04: the pinned library's own binomial-interval function

PASSES = 34  # => co-04: cases the system passed
TOTAL = 40  # => co-04: cases attempted -- a typical small eval-set size
Z_95 = 1.959963984540054  # => co-04: the two-sided 95% critical value of the standard normal distribution -- a fixed constant


def normal_interval_from_definition(passes: int, total: int, *, z: float) -> tuple[float, float]:  # => co-04: the textbook formula, in code
    """Return the normal-approximation confidence interval p_hat +/- z * standard_error."""  # => co-04: documents normal_interval_from_definition's contract -- no runtime output, just sets its __doc__
    p_hat = passes / total  # => co-04: the point estimate -- the observed pass rate itself
    standard_error = math.sqrt(p_hat * (1 - p_hat) / total)  # => co-04: how much p_hat is expected to vary run to run, from ex-03's own spread
    margin = z * standard_error  # => co-04: the interval's half-width
    return p_hat - margin, p_hat + margin  # => co-04: returns this computed value to the caller


if __name__ == "__main__":  # => co-04: entry point -- runs only when this file executes directly, not on import
    p_hat = PASSES / TOTAL  # => co-04: the point estimate this interval is centered on
    print(f"Point estimate: {PASSES}/{TOTAL} = {p_hat:.4f}")  # => co-04: the bare number ex-01's overview warns is not yet enough
    lo_def, hi_def = normal_interval_from_definition(PASSES, TOTAL, z=Z_95)  # => co-04: computed from the textbook formula directly
    print(f"From definition: [{lo_def:.4f}, {hi_def:.4f}]")  # => co-04: the interval this file derives itself
    lo_lib, hi_lib = proportion_confint(PASSES, TOTAL, method="normal")  # => co-04: the SAME computation, called from the pinned library
    print(f"From statsmodels (method='normal'): [{lo_lib:.4f}, {hi_lib:.4f}]")  # => co-04: the library's answer to the identical question
    assert math.isclose(lo_def, lo_lib, abs_tol=1e-9), "the from-definition lower bound must match the library's"  # => co-04
    assert math.isclose(hi_def, hi_lib, abs_tol=1e-9), "the from-definition upper bound must match the library's"  # => co-04
    print("MATCH: the hand-derived interval and the library's interval agree to within floating-point precision")  # => co-04
    # => co-04: this interval says the true pass rate is plausibly anywhere from ~70% to ~96% -- NOT that it is exactly 85%
```

**Run**: `python3 interval_from_definition.py`

**Output**:

```text
Point estimate: 34/40 = 0.8500
From definition: [0.7393, 0.9607]
From statsmodels (method='normal'): [0.7393, 0.9607]
MATCH: the hand-derived interval and the library's interval agree to within floating-point precision
```

**Verify**: `normal_interval_from_definition(34, 40, z=Z_95)` and `proportion_confint(34, 40,
method='normal')` both return `[0.7393, 0.9607]`, matching to within `1e-9`, satisfying co-04's rule
that the from-definition and library computations of the same interval agree.

**Key takeaway**: the confidence interval is not a black box the library invents -- it is
`point_estimate ± critical_value * standard_error`, a formula short enough to write from scratch and
verify against the tool you will actually call in practice.

**Why It Matters**: this from-definition-then-library pattern repeats through the rest of this
course; understanding this one interval's formula makes every later interval (Wilson,
Clopper-Pearson, and the coefficients in Theme C) a variation on the same idea rather than a new
black box to memorize.

---

### Worked Example 5: The Normal Approximation Breaks

_ex-05 &middot; exercises co-05_

**Context**: **co-05 -- small-n interval methods** exist because the normal approximation
misbehaves exactly where eval datasets live: small n, rates near 0 or 1. This example computes the
raw, unclipped normal-approximation interval near a 95% pass rate on 40 cases and shows its upper
bound exceeds 1.0 -- a probability greater than 100%. It also shows the library's own convenience
clip silently hides that breakage rather than fixing it.

```python
# learning/code/ex-05-normal-approximation-breaks/normal_approximation_breaks.py
"""Worked Example 5: The Normal Approximation Breaks."""  # => co-05: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import math  # => co-05: sqrt for the from-definition standard error

from statsmodels.stats.proportion import proportion_confint  # => co-05: the pinned library's own binomial-interval function

PASSES = 38  # => co-05: near-ceiling performance -- exactly the regime the normal approximation struggles with
TOTAL = 40  # => co-05: still a small n -- eval datasets are almost always this size or smaller
Z_95 = 1.959963984540054  # => co-05: the two-sided 95% critical value of the standard normal distribution


def normal_interval_unclipped(passes: int, total: int, *, z: float) -> tuple[float, float]:  # => co-05: the RAW textbook formula, no safety clip
    """Return p_hat +/- z * standard_error, exactly as the formula gives it -- may exceed [0, 1]."""  # => co-05: documents normal_interval_unclipped's contract -- no runtime output, just sets its __doc__
    p_hat = passes / total  # => co-05: the point estimate -- 0.95 here, right at the edge of the possible range
    standard_error = math.sqrt(p_hat * (1 - p_hat) / total)  # => co-05: shrinks toward zero as p_hat approaches 0 or 1 -- part of the problem
    margin = z * standard_error  # => co-05: the interval's half-width
    return p_hat - margin, p_hat + margin  # => co-05: UNCLIPPED -- may land outside the valid [0, 1] probability range


if __name__ == "__main__":  # => co-05: entry point -- runs only when this file executes directly, not on import
    p_hat = PASSES / TOTAL  # => co-05: 0.95 -- near the boundary where the normal approximation is known to misbehave
    print(f"Point estimate: {PASSES}/{TOTAL} = {p_hat:.4f}")  # => co-05: a rate near the ceiling, on a small n
    lo_def, hi_def = normal_interval_unclipped(PASSES, TOTAL, z=Z_95)  # => co-05: the raw, unclipped formula result
    print(f"From definition (unclipped): [{lo_def:.4f}, {hi_def:.4f}]")  # => co-05: prints the interval as the formula actually computes it
    assert hi_def > 1.0, "the unclipped normal-approximation upper bound must extend past the valid [0, 1] range"  # => co-05: the breakage this example demonstrates
    print(f"Upper bound exceeds 1.0 by {hi_def - 1.0:.4f} -- a probability greater than 100% is nonsense")  # => co-05: names the nonsensical result explicitly

    lo_lib, hi_lib = proportion_confint(PASSES, TOTAL, method="normal")  # => co-05: the SAME computation, called from the pinned library
    print(f"From statsmodels (method='normal'): [{lo_lib:.4f}, {hi_lib:.4f}]")  # => co-05: the library's own answer
    assert hi_lib == 1.0, "statsmodels silently clips the normal-approximation upper bound to 1.0"  # => co-05: the library hides the symptom rather than fixing it
    print("MATCH: the raw formula breaks past 1.0; the library's convenience clip HIDES that breakage rather than fixing it")  # => co-05
    # => co-05: clipping to [0, 1] is not a fix -- it silently discards the information that the method itself misbehaved here; ex-06 is the actual fix
```

**Run**: `python3 normal_approximation_breaks.py`

**Output**:

```text
Point estimate: 38/40 = 0.9500
From definition (unclipped): [0.8825, 1.0175]
Upper bound exceeds 1.0 by 0.0175 -- a probability greater than 100% is nonsense
From statsmodels (method='normal'): [0.8825, 1.0000]
MATCH: the raw formula breaks past 1.0; the library's convenience clip HIDES that breakage rather than fixing it
```

**Verify**: `normal_interval_unclipped(38, 40, z=Z_95)` returns an upper bound of `1.0175`, exceeding
the valid `[0, 1]` range, while `proportion_confint(38, 40, method='normal')` silently returns
`1.0000` -- a clip, not a correction -- satisfying co-05's rule that the normal approximation
genuinely breaks at small n near a boundary, and that clipping conceals rather than fixes it.

**Key takeaway**: a library that silently clips a broken interval to `[0, 1]` is not solving the
small-n problem -- it is hiding evidence that the method itself needs replacing.

**Why It Matters**: this is exactly the accuracy-note this topic flags about `statsmodels`'
`proportion_confint` default: `method="normal"` is the default, and it is the one method this
course teaches you to distrust at small n. Ex-06 is the actual fix, not a cosmetic patch.

---

### Worked Example 6: Wilson and Clopper-Pearson

_ex-06 &middot; exercises co-05_

**Context**: continuing co-05 -- Wilson and Clopper-Pearson intervals are constructed to stay within
`[0, 1]` by design, not by clipping. This example computes both on the exact same near-ceiling data
that broke the normal approximation in ex-05, and confirms both stay genuinely inside the valid
range.

```python
# learning/code/ex-06-wilson-and-clopper-pearson/wilson_and_clopper_pearson.py
"""Worked Example 6: Wilson and Clopper-Pearson."""  # => co-05: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

from statsmodels.stats.proportion import proportion_confint  # => co-05: the pinned library's own binomial-interval function, three methods compared

PASSES = 38  # => co-05: the SAME near-ceiling data ex-05 showed breaking the normal approximation
TOTAL = 40  # => co-05: the SAME small n


if __name__ == "__main__":  # => co-05: entry point -- runs only when this file executes directly, not on import
    p_hat = PASSES / TOTAL  # => co-05: the point estimate this interval is centered on
    print(f"Point estimate: {PASSES}/{TOTAL} = {p_hat:.4f}")  # => co-05: the same 0.95 that broke the normal approximation

    lo_normal, hi_normal = proportion_confint(PASSES, TOTAL, method="normal")  # => co-05: the BROKEN method, for direct comparison
    print(f"normal (broken, clipped): [{lo_normal:.4f}, {hi_normal:.4f}]")  # => co-05: repeats ex-05's clipped result for contrast

    lo_wilson, hi_wilson = proportion_confint(PASSES, TOTAL, method="wilson")  # => co-05: the Wilson score interval -- the standard small-n corrective
    print(f"wilson: [{lo_wilson:.4f}, {hi_wilson:.4f}]")  # => co-05: the Wilson interval's bounds
    assert 0.0 <= lo_wilson and hi_wilson <= 1.0, "the Wilson interval must stay within the valid [0, 1] range"  # => co-05: the property ex-05's normal interval lacked

    lo_beta, hi_beta = proportion_confint(PASSES, TOTAL, method="beta")  # => co-05: the Clopper-Pearson (exact, beta-distribution-based) interval
    print(f"clopper-pearson (beta): [{lo_beta:.4f}, {hi_beta:.4f}]")  # => co-05: the Clopper-Pearson interval's bounds
    assert 0.0 <= lo_beta and hi_beta <= 1.0, "the Clopper-Pearson interval must stay within the valid [0, 1] range"  # => co-05: same property, different method

    assert hi_wilson < 1.0, "Wilson must give a genuinely sub-1.0 upper bound, not a clip"  # => co-05: distinguishes a real fix from a cosmetic clip
    assert hi_beta < 1.0, "Clopper-Pearson must give a genuinely sub-1.0 upper bound, not a clip"  # => co-05: same distinction
    print("MATCH: both Wilson and Clopper-Pearson stay in [0, 1] by CONSTRUCTION, not by clipping a broken result")  # => co-05
    # => co-05: Clopper-Pearson is provably conservative (coverage >= 95%); Wilson is closer to exactly 95% on average -- both are correct where 'normal' is not
```

**Run**: `python3 wilson_and_clopper_pearson.py`

**Output**:

```text
Point estimate: 38/40 = 0.9500
normal (broken, clipped): [0.8825, 1.0000]
wilson: [0.8350, 0.9862]
clopper-pearson (beta): [0.8308, 0.9939]
MATCH: both Wilson and Clopper-Pearson stay in [0, 1] by CONSTRUCTION, not by clipping a broken result
```

**Verify**: `proportion_confint(38, 40, method='wilson')` returns `[0.8350, 0.9862]` and
`method='beta'` returns `[0.8308, 0.9939]` -- both genuinely below `1.0`, unlike the `normal`
method's clipped `1.0000` -- satisfying co-05's rule that these two methods fix the small-n failure
by construction.

**Key takeaway**: Wilson and Clopper-Pearson are not "the normal interval, but safer" -- they are
different formulas whose valid range is a structural property, not a post-hoc clip.

**Why It Matters**: this topic uses Wilson as its default interval method from here forward (see
ex-11, ex-12) precisely because eval datasets are almost always small and often sit near a
ceiling -- exactly the regime this example demonstrates the normal approximation cannot be trusted
in.

---

### Worked Example 7: Interval Width vs. n

_ex-07 &middot; exercises co-04, co-06_

**Context**: **co-06 -- how many cases do I need** starts with understanding how interval width
actually shrinks as n grows. This example computes the Wilson interval's width at seven sample
sizes, holding the pass rate fixed, and shows the shrinkage has diminishing returns -- each doubling
of n buys a smaller width reduction than the last.

```python
# learning/code/ex-07-interval-width-vs-n/interval_width_vs_n.py
"""Worked Example 7: Interval Width vs. n."""  # => co-04: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

from statsmodels.stats.proportion import proportion_confint  # => co-04: the pinned library's own binomial-interval function

PASS_RATE = 0.85  # => co-06: held fixed across every n below -- only the sample size changes
SAMPLE_SIZES = (10, 20, 40, 80, 160, 320, 640)  # => co-06: doubling each step, spanning a small eval set to a large one


if __name__ == "__main__":  # => co-06: entry point -- runs only when this file executes directly, not on import
    widths: list[float] = []  # => co-04: one Wilson-interval width per sample size, for the diminishing-return check below
    for n in SAMPLE_SIZES:  # => co-06: one interval computation per candidate sample size
        passes = round(PASS_RATE * n)  # => co-06: keep the observed rate fixed near 0.85 at every n
        lo, hi = proportion_confint(passes, n, method="wilson")  # => co-04: the well-behaved small-n interval from ex-06
        width = hi - lo  # => co-04: the interval's full width -- what a reader actually cares about
        widths.append(width)  # => co-04: recorded for the shrink-rate check below
        bar = "#" * round(width * 200)  # => co-04: a plain-text bar -- longer bar means a wider, less informative interval
        print(f"n={n:>4} | width={width:.4f} | {bar}")  # => co-04: prints size, width, and its ASCII-bar visualization
    assert widths[0] > widths[-1], "interval width must shrink as n grows"  # => co-04: the qualitative claim
    halving_index = next(i for i in range(1, len(widths)) if widths[i] < widths[0] / 2)  # => co-06: where width first drops below half its n=10 value
    print(f"Width first drops below half its n=10 value at n={SAMPLE_SIZES[halving_index]}")  # => co-06: names the diminishing-return point
    last_gain = widths[-2] - widths[-1]  # => co-06: the width saved by the LAST doubling (320 -> 640)
    first_gain = widths[0] - widths[1]  # => co-06: the width saved by the FIRST doubling (10 -> 20)
    print(f"Width saved by 10->20: {first_gain:.4f} | width saved by 320->640: {last_gain:.4f}")  # => co-06: shows diminishing returns
    assert first_gain > last_gain, "the first doubling must buy more width reduction than the last doubling"  # => co-06: the diminishing-return claim itself
    print("MATCH: each doubling of n buys a shrinking amount of extra precision -- diminishing, not free")  # => co-06
    # => co-04,co-06: this shape is WHY ex-08 asks 'how many cases for THIS effect' instead of 'as many cases as possible'
```

**Run**: `python3 interval_width_vs_n.py`

**Output**:

```text
n=  10 | width=0.4532 | ###########################################################################################
n=  20 | width=0.3081 | ##############################################################
n=  40 | width=0.2201 | ############################################
n=  80 | width=0.1562 | ###############################
n= 160 | width=0.1106 | ######################
n= 320 | width=0.0782 | ################
n= 640 | width=0.0553 | ###########
Width first drops below half its n=10 value at n=40
Width saved by 10->20: 0.1451 | width saved by 320->640: 0.0229
MATCH: each doubling of n buys a shrinking amount of extra precision -- diminishing, not free
```

**Verify**: interval width shrinks from `0.4532` at `n=10` to `0.0553` at `n=640`; the first
doubling (`10→20`) saves `0.1451` of width, while the last doubling (`320→640`) saves only `0.0229`,
satisfying co-06's rule that width reduction has diminishing returns as `n` grows.

**Key takeaway**: doubling your dataset does not halve your interval's width -- the return on each
additional case shrinks, which is exactly what a `1/sqrt(n)` relationship predicts.

**Why It Matters**: this diminishing-return shape is the reason "collect as many cases as possible"
is not a sampling plan -- ex-08 shows how to solve for the specific n a target precision actually
requires, instead of over- or under-collecting by guesswork.

---

### Worked Example 8: How Many Cases Do I Need for This Effect

_ex-08 &middot; exercises co-06_

**Context**: continuing co-06 -- required sample size follows from the effect you need to detect
and the precision you need, and it is a design question answered **before** collecting data. This
example solves for the exact n needed to achieve a ±5-point interval on an anticipated 85% pass
rate, then verifies that collecting exactly that many cases actually achieves the target.

```python
# learning/code/ex-08-how-many-cases-for-this-effect/how_many_cases.py
"""Worked Example 8: How Many Cases Do I Need For This Effect."""  # => co-06: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import math  # => co-06: ceil -- a sample size must be a whole number of cases

from statsmodels.stats.proportion import proportion_confint, samplesize_confint_proportion  # => co-06: the pinned library's sample-size solver

ANTICIPATED_RATE = 0.85  # => co-06: the pass rate the team expects, from a pilot run or a prior eval
TARGET_HALF_WIDTH = 0.05  # => co-06: the precision demanded -- "I want the interval within +/-5 points"


if __name__ == "__main__":  # => co-06: entry point -- runs only when this file executes directly, not on import
    raw_n = samplesize_confint_proportion(proportion=ANTICIPATED_RATE, half_length=TARGET_HALF_WIDTH, alpha=0.05, method="normal")  # => co-06: solves the CI-width formula for n
    print(f"Solved n (continuous): {raw_n:.2f}")  # => co-06: the exact real-valued solution to the width equation
    required_n = math.ceil(raw_n)  # => co-06: round UP -- a fractional case cannot be collected, and rounding down would miss the target
    print(f"Required n (rounded up to a whole case count): {required_n}")  # => co-06: the number a team actually plans to collect
    assert required_n == 196, "the required n for this anticipated rate and target half-width must be 196"  # => co-06: pins the exact planning number

    passes_at_required_n = round(ANTICIPATED_RATE * required_n)  # => co-06: what collecting exactly required_n cases would look like
    lo, hi = proportion_confint(passes_at_required_n, required_n, method="normal")  # => co-06: the SAME normal method this n was solved for
    achieved_half_width = (hi - lo) / 2  # => co-06: verify the PLANNED n actually delivers the target precision
    print(f"Achieved half-width at n={required_n}: {achieved_half_width:.4f} (target was {TARGET_HALF_WIDTH})")  # => co-06
    assert achieved_half_width <= TARGET_HALF_WIDTH + 1e-3, "collecting the solved n must actually achieve the target half-width"  # => co-06: closes the loop

    smaller_n = required_n - 100  # => co-06: a plausible temptation -- "let's just collect fewer cases"
    lo_small, hi_small = proportion_confint(round(ANTICIPATED_RATE * smaller_n), smaller_n, method="normal")  # => co-06: what a shortcut n actually buys
    print(f"With only n={smaller_n}, half-width would be: {(hi_small - lo_small) / 2:.4f} -- misses the {TARGET_HALF_WIDTH} target")  # => co-06
    assert (hi_small - lo_small) / 2 > TARGET_HALF_WIDTH, "an under-sized n must miss the precision target"  # => co-06: names the shortcut's real cost
    print("MATCH: the required n is a design question answered BEFORE collecting, not a guess made after")  # => co-06
    # => co-06: this is the number a sampling plan (ex-20) states and justifies, in writing, before a single case is drawn
```

**Run**: `python3 how_many_cases.py`

**Output**:

```text
Solved n (continuous): 195.91
Required n (rounded up to a whole case count): 196
Achieved half-width at n=196: 0.0497 (target was 0.05)
With only n=96, half-width would be: 0.0706 -- misses the 0.05 target
MATCH: the required n is a design question answered BEFORE collecting, not a guess made after
```

**Verify**: `samplesize_confint_proportion(proportion=0.85, half_length=0.05, ...)` solves to
`195.91`, rounded up to `196`; collecting `196` cases achieves an actual half-width of `0.0497`
(within target), while collecting only `96` achieves `0.0706` (misses target), satisfying co-06's
rule that the required n is solvable in advance and an under-sized n provably misses the goal.

**Key takeaway**: "how many cases do I need" has an exact numeric answer once you state the effect
and precision you want -- it is arithmetic, not a judgment call.

**Why It Matters**: skipping this calculation is how teams either burn budget collecting far more
cases than any decision needs, or ship a decision on a dataset provably too small for the precision
they are implicitly claiming -- ex-20's sampling plan makes this calculation the FIRST step, not an
afterthought.

---

### Worked Example 9: Forty Cases Cannot See It

_ex-09 &middot; exercises co-06, co-19_

**Context**: **co-19 -- significance vs. practical importance** starts here with the opposite
failure: a real, meaningful effect that a too-small sample simply cannot detect. This example
simulates a genuine 12-point improvement between two systems and shows it is invisible most of the
time at `n=40`, and reliably detected at `n=400`.

```python
# learning/code/ex-09-forty-cases-cannot-see-it/forty_cases_cannot_see_it.py
"""Worked Example 9: Forty Cases Cannot See It."""  # => co-19: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import random  # => co-06: draws each simulated system's cases

from statsmodels.stats.proportion import proportions_ztest  # => co-19: the pinned library's own two-proportion significance test

TRUE_RATE_BASELINE = 0.78  # => co-19: system A's real, unobservable pass rate
TRUE_RATE_CANDIDATE = 0.90  # => co-19: system B's real, unobservable pass rate -- a genuine 12-point improvement
ILLUSTRATION_SEED = 9  # => co-06: a specific, fixed seed pair used for the single-run illustration below


def draw_passes(true_rate: float, n: int, *, seed: int) -> int:  # => co-06: one simulated eval run's pass COUNT
    """Draw n Bernoulli(true_rate) trials and return the number that passed."""  # => co-06: documents draw_passes's contract -- no runtime output, just sets its __doc__
    rng = random.Random(seed)  # => co-06: a fresh generator per (system, n, seed) draw
    return sum(1 for _ in range(n) if rng.random() < true_rate)  # => co-06: count of Bernoulli successes


def run_significance_test(n: int, *, seed: int) -> float:  # => co-19: one full A/B test at sample size n -- returns its p-value
    """Draw n cases for each system and return the two-proportion z-test p-value."""  # => co-19: documents run_significance_test's contract -- no runtime output, just sets its __doc__
    passes_a = draw_passes(TRUE_RATE_BASELINE, n, seed=seed * 2)  # => co-06: system A's simulated pass count at this n
    passes_b = draw_passes(TRUE_RATE_CANDIDATE, n, seed=seed * 2 + 1)  # => co-06: system B's simulated pass count at this n
    _, p_value = proportions_ztest([passes_a, passes_b], [n, n])  # => co-19: the real, genuine 12-point effect, tested at this n
    return p_value  # => co-19: returns this computed value to the caller


if __name__ == "__main__":  # => co-19: entry point -- runs only when this file executes directly, not on import
    p_at_40 = run_significance_test(40, seed=ILLUSTRATION_SEED)  # => co-19: ONE specific illustrative run at the small size
    p_at_400 = run_significance_test(400, seed=ILLUSTRATION_SEED)  # => co-19: the SAME true effect, the SAME seed family, ten times the cases
    print(f"n=40  -> p-value {p_at_40:.4f} ({'significant' if p_at_40 < 0.05 else 'NOT significant'})")  # => co-19: prints the small-n verdict
    print(f"n=400 -> p-value {p_at_400:.4f} ({'significant' if p_at_400 < 0.05 else 'NOT significant'})")  # => co-19: prints the large-n verdict
    assert p_at_40 >= 0.05, "the illustrative n=40 run must fail to detect the real effect"  # => co-19: the invisible-at-n=40 claim
    assert p_at_400 < 0.05, "the illustrative n=400 run must detect the same real effect"  # => co-19: the visible-at-n=400 claim

    trials = 500  # => co-19: repeats for the Monte Carlo detection-rate check below -- one illustrative run could be a fluke either way
    detections_40 = sum(1 for t in range(1000, 1000 + trials) if run_significance_test(40, seed=t) < 0.05)  # => co-19: how OFTEN n=40 catches this real effect
    detections_400 = sum(1 for t in range(1000, 1000 + trials) if run_significance_test(400, seed=t) < 0.05)  # => co-19: how often n=400 catches it
    print(f"Detection rate across {trials} independent trials: n=40 -> {detections_40 / trials:.1%} | n=400 -> {detections_400 / trials:.1%}")  # => co-19
    assert detections_40 / trials < 0.5, "n=40 must detect this real effect LESS than half the time across repeated trials"  # => co-19
    assert detections_400 / trials > 0.95, "n=400 must detect the same real effect in almost every trial"  # => co-19
    print("MATCH: the SAME real 12-point effect is invisible most of the time at n=40, and reliable at n=400")  # => co-19
    # => co-06,co-19: a non-significant result at n=40 is not 'no effect' -- it is 'not enough cases to see this effect', which ex-40 revisits
```

**Run**: `python3 forty_cases_cannot_see_it.py`

**Output**:

```text
n=40  -> p-value 0.1045 (NOT significant)
n=400 -> p-value 0.0000 (significant)
Detection rate across 500 independent trials: n=40 -> 30.6% | n=400 -> 100.0%
MATCH: the SAME real 12-point effect is invisible most of the time at n=40, and reliable at n=400
```

**Verify**: the identical 12-point true effect (78% vs. 90%) yields `p=0.1045` at `n=40` (not
significant) and `p<0.0001` at `n=400` (significant); across 500 repeated trials, `n=40` detects it
only `30.6%` of the time while `n=400` detects it `100.0%` of the time, satisfying co-19's rule that
a real effect can be routinely invisible at a too-small n.

**Key takeaway**: "not significant" at `n=40` does not mean "no effect" -- it can just as easily mean
"not enough cases to see this specific effect," and this example's own real, planted 12-point effect
proves the distinction.

**Why It Matters**: this is the single most common misreading of a non-significant eval result --
treating "the test didn't detect a difference" as "there is no difference." Ex-40 in Theme D returns
to this exact confusion from the opposite direction: a large observed difference that is still not
statistically supportable at a small n.

---

### Worked Example 10: Overlapping Intervals Are Not a Test

_ex-10 &middot; exercises co-04, co-18_

**Context**: **co-18 -- paired comparison** is far more sensitive than eyeballing two independent
intervals for overlap, because it uses the fact that both systems ran on the exact same cases. This
example constructs 50 paired cases where baseline and candidate's independent-style Wilson intervals
overlap, yet the paired McNemar test -- which uses the pairing directly -- finds a significant
difference.

```python
# learning/code/ex-10-overlapping-intervals-are-not-a-test/overlapping_intervals.py
"""Worked Example 10: Overlapping Intervals Are Not a Test."""  # => co-18: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

from statsmodels.stats.contingency_tables import mcnemar  # => co-18: the pinned library's own PAIRED significance test
from statsmodels.stats.proportion import proportion_confint  # => co-04: the pinned library's own binomial-interval function

N = 50  # => co-04: fifty paired cases -- baseline and candidate run on the IDENTICAL cases
BOTH_PASS = 29  # => co-18: cases where baseline AND candidate both passed
ONLY_BASELINE_PASSED = 3  # => co-18: cases where baseline passed but candidate REGRESSED
ONLY_CANDIDATE_PASSED = 13  # => co-18: cases where baseline failed but candidate FIXED it
BOTH_FAIL = 5  # => co-18: cases where both still fail -- BOTH_PASS + ONLY_BASELINE_PASSED + ONLY_CANDIDATE_PASSED + BOTH_FAIL must equal N


if __name__ == "__main__":  # => co-18: entry point -- runs only when this file executes directly, not on import
    assert BOTH_PASS + ONLY_BASELINE_PASSED + ONLY_CANDIDATE_PASSED + BOTH_FAIL == N, "the four paired-outcome counts must sum to N"  # => co-04: sanity check on the fixture
    baseline_passes = BOTH_PASS + ONLY_BASELINE_PASSED  # => co-04: baseline's OWN total pass count, ignoring pairing
    candidate_passes = BOTH_PASS + ONLY_CANDIDATE_PASSED  # => co-04: candidate's OWN total pass count, ignoring pairing
    print(f"Baseline: {baseline_passes}/{N} = {baseline_passes / N:.2%} | Candidate: {candidate_passes}/{N} = {candidate_passes / N:.2%}")  # => co-04

    lo_b, hi_b = proportion_confint(baseline_passes, N, method="wilson")  # => co-04: baseline's interval, treating the two runs as INDEPENDENT samples
    lo_c, hi_c = proportion_confint(candidate_passes, N, method="wilson")  # => co-04: candidate's interval, same (wrong) independence assumption
    print(f"Baseline Wilson CI:  [{lo_b:.4f}, {hi_b:.4f}]")  # => co-04: prints baseline's unpaired-style interval
    print(f"Candidate Wilson CI: [{lo_c:.4f}, {hi_c:.4f}]")  # => co-04: prints candidate's unpaired-style interval
    intervals_overlap = lo_c <= hi_b  # => co-04: the naive eyeball check a team might reach for
    print(f"Intervals overlap: {intervals_overlap}")  # => co-04: True here -- looks like "maybe no real difference"
    assert intervals_overlap, "the two independent-style intervals must overlap for this demo to make its point"  # => co-04: the setup this example needs

    table = [[BOTH_PASS, ONLY_BASELINE_PASSED], [ONLY_CANDIDATE_PASSED, BOTH_FAIL]]  # => co-18: the 2x2 PAIRED contingency table McNemar actually needs
    result = mcnemar(table, exact=True)  # => co-18: uses ONLY the discordant pairs -- where baseline and candidate actually disagreed
    print(f"Paired McNemar test: statistic={result.statistic}, p-value={result.pvalue:.4f}")  # => co-18: the test that actually respects the pairing
    assert result.pvalue < 0.05, "the paired McNemar test must find a significant difference despite the overlapping unpaired intervals"  # => co-18
    print("MATCH: overlapping unpaired intervals said 'maybe no difference' -- the paired test says 'yes, significant difference'")  # => co-18
    # => co-04,co-18: eyeballing two intervals for overlap ignores that the SAME cases were measured twice; McNemar uses that pairing directly, and is far more sensitive
```

**Run**: `python3 overlapping_intervals.py`

**Output**:

```text
Baseline: 32/50 = 64.00% | Candidate: 42/50 = 84.00%
Baseline Wilson CI:  [0.5014, 0.7586]
Candidate Wilson CI: [0.7149, 0.9166]
Intervals overlap: True
Paired McNemar test: statistic=3.0, p-value=0.0213
MATCH: overlapping unpaired intervals said 'maybe no difference' -- the paired test says 'yes, significant difference'
```

**Verify**: baseline's Wilson interval `[0.5014, 0.7586]` and candidate's `[0.7149, 0.9166]` overlap
(`0.7149 < 0.7586`), yet the paired McNemar test on the same data returns `p=0.0213`, satisfying
co-18's rule that a paired test can find significance where an unpaired eyeball check sees only
overlap.

**Key takeaway**: "the intervals overlap" is not a statistical test -- it is a rough, unpaired
heuristic that throws away exactly the information (which cases flipped, in which direction) a
paired test uses directly.

**Why It Matters**: ex-37 and ex-38 in Theme D build the paired test's own machinery in detail; this
example exists first to show precisely what is lost by skipping it -- a team eyeballing overlapping
bars here would wrongly conclude "no clear winner" on data that a proper paired test calls
significant.

---

### Worked Example 11: A Pass-Rate Figure With Intervals

_ex-11 &middot; exercises co-01, co-24_

**Context**: **co-01 -- a number without an interval** is an opinion; this example builds a small
reporting figure for three prompt variants, each with its own pass count and its own sample size,
and confirms every row states its point estimate, interval, sample size, and method -- never a bare
percentage.

```python
# learning/code/ex-11-interval-figure/interval_figure.py
"""Worked Example 11: A Pass-Rate Figure With Intervals."""  # => co-01: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

from statsmodels.stats.proportion import proportion_confint  # => co-04: the pinned library's own binomial-interval function

VARIANTS = {  # => co-24: three prompt variants, each with its own pass count and its own n -- eval sets are rarely all the same size
    "prompt-v1 (baseline)": (30, 40),  # => co-24: (passes, n) -- a genuinely small pilot eval set
    "prompt-v2": (36, 40),  # => co-24: same n as the baseline -- directly comparable
    "prompt-v3": (58, 70),  # => co-24: a DIFFERENT n -- collected later, on a larger dataset
}  # => co-24: closes VARIANTS


def render_row(name: str, passes: int, n: int) -> str:  # => co-01: renders ONE labeled row of the figure -- estimate, bar, interval, n, method
    """Return one printable row: the point estimate, an ASCII bar, and the labeled Wilson interval."""  # => co-01: documents render_row's contract -- no runtime output, just sets its __doc__
    p_hat = passes / n  # => co-04: this variant's own point estimate
    lo, hi = proportion_confint(passes, n, method="wilson")  # => co-05: Wilson -- the small-n-appropriate method every row uses, uniformly
    bar = "#" * round(p_hat * 40)  # => co-01: a plain-text bar proportional to the point estimate
    return f"{name:<22} | {bar:<40} | {p_hat:.2%}  CI=[{lo:.2%}, {hi:.2%}]  n={n}  method=wilson"  # => co-24: EVERY field the reporting discipline demands, in one row


if __name__ == "__main__":  # => co-01: entry point -- runs only when this file executes directly, not on import
    print("Pass rate by prompt variant (95% Wilson interval, labeled with n and method):")  # => co-24: states the method up front, once, for the whole figure
    rows = [render_row(name, passes, n) for name, (passes, n) in VARIANTS.items()]  # => co-01: one rendered row per variant
    for row in rows:  # => co-01: prints the whole figure, one labeled row per variant
        print(row)  # => co-01: the figure itself -- this IS the artifact a reader would see
    for row in rows:  # => co-24: every row must carry n and method, never just a bar and a percentage
        assert "n=" in row and "method=wilson" in row, "every row must state its own n and its own method"  # => co-24
    print("MATCH: every bar is labeled with its own point estimate, interval, n, and method -- no row is a bare number")  # => co-01
    # => co-01,co-24: a figure of bars with no interval invites reading noise as a real ranking; this figure structurally cannot omit the interval
```

**Run**: `python3 interval_figure.py`

**Output**:

```text
Pass rate by prompt variant (95% Wilson interval, labeled with n and method):
prompt-v1 (baseline)   | ##############################           | 75.00%  CI=[59.81%, 85.81%]  n=40  method=wilson
prompt-v2              | ####################################     | 90.00%  CI=[76.95%, 96.04%]  n=40  method=wilson
prompt-v3              | #################################        | 82.86%  CI=[72.38%, 89.91%]  n=70  method=wilson
MATCH: every bar is labeled with its own point estimate, interval, n, and method -- no row is a bare number
```

**Verify**: `render_row` for `prompt-v2` produces `90.00% CI=[76.95%, 96.04%] n=40 method=wilson`,
every field present in one string, satisfying co-24's rule that a reported figure is never just a
bar and a percentage.

**Key takeaway**: prompt-v2's `90.00%` looks clearly ahead of prompt-v3's `82.86%` as bare numbers,
but their intervals (`[76.95%, 96.04%]` vs. `[72.38%, 89.91%]`) overlap substantially -- the figure
itself keeps that honestly visible instead of hiding it behind a ranked bar chart.

**Why It Matters**: a chart of bars with no error bars is the single most common way an eval result
gets overclaimed in a slide deck -- this figure's row format makes that overclaim structurally
harder to produce, because the interval is part of the row, not an optional footnote.

---

### Worked Example 12: A Reporting Helper -- Estimate, Interval, n, Method

_ex-12 &middot; exercises co-24, co-01_

**Context**: continuing co-24 -- the reportable unit is the estimate, its interval, the sample size,
and the method; a number stripped of those cannot be checked by a reader. This example builds a
small typed record that every pass-rate report in this course routes through, so a bare float can
never escape it.

```python
# learning/code/ex-12-report-estimate-interval-n-method/reporting_helper.py
"""Worked Example 12: A Reporting Helper -- Estimate, Interval, n, Method."""  # => co-24: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

from dataclasses import dataclass  # => co-24: a typed record -- every field below is REQUIRED, none optional

from statsmodels.stats.proportion import proportion_confint  # => co-04: the pinned library's own binomial-interval function


@dataclass(frozen=True)  # => co-24: frozen -- a reported figure is a fact about a completed run, not something later code can quietly mutate
class ReportedRate:  # => co-24: the reportable unit this whole course insists on -- never just a percentage
    estimate: float  # => co-01: the point estimate itself
    ci_low: float  # => co-04: the interval's lower bound
    ci_high: float  # => co-04: the interval's upper bound
    n: int  # => co-24: the sample size this estimate rests on
    method: str  # => co-24: the exact method used to compute the interval -- "wilson", "beta", never left implicit

    def __str__(self) -> str:  # => co-24: how this record prints -- every field visible, every time
        return f"{self.estimate:.2%} CI=[{self.ci_low:.2%}, {self.ci_high:.2%}] n={self.n} method={self.method}"  # => co-24: a bare number CANNOT escape this format


def report_rate(passes: int, n: int, *, method: str = "wilson") -> ReportedRate:  # => co-24: the ONE function every pass-rate report in this course routes through
    """Compute a pass rate and package it with its interval, n, and method -- never returns a bare float."""  # => co-24: documents report_rate's contract -- no runtime output, just sets its __doc__
    estimate = passes / n  # => co-01: the point estimate
    ci_low, ci_high = proportion_confint(passes, n, method=method)  # => co-04: the interval, computed with the STATED method
    return ReportedRate(estimate=estimate, ci_low=ci_low, ci_high=ci_high, n=n, method=method)  # => co-24: returns this computed value to the caller -- ALWAYS all four fields


if __name__ == "__main__":  # => co-24: entry point -- runs only when this file executes directly, not on import
    report = report_rate(34, 40)  # => co-24: a normal-sized eval run
    print(f"Report: {report}")  # => co-24: prints every required field, via ReportedRate.__str__
    assert isinstance(report, ReportedRate), "report_rate must always return a ReportedRate, never a bare float"  # => co-24: the type-level guarantee

    tiny_report = report_rate(9, 10)  # => co-05: a near-ceiling, very small n -- exactly where Wilson matters most
    print(f"Tiny-n report: {tiny_report}")  # => co-24: the same four fields, at a much smaller n
    assert tiny_report.n == 10 and tiny_report.method == "wilson", "n and method must be exactly what was passed in, never inferred silently"  # => co-24
    assert 0.0 <= tiny_report.ci_low <= tiny_report.estimate <= tiny_report.ci_high <= 1.0, "the interval must bracket the estimate and stay in [0, 1]"  # => co-04
    print("MATCH: both reports carry estimate, interval, n, and method -- neither can be quoted as a bare percentage")  # => co-24
    # => co-01,co-04,co-24: this is the function every LATER worked example in this course calls to print a pass rate -- never print(f'{rate:.0%}') alone again
```

**Run**: `python3 reporting_helper.py`

**Output**:

```text
Report: 85.00% CI=[70.93%, 92.94%] n=40 method=wilson
Tiny-n report: 90.00% CI=[59.58%, 98.21%] n=10 method=wilson
MATCH: both reports carry estimate, interval, n, and method -- neither can be quoted as a bare percentage
```

**Verify**: `report_rate(34, 40)` returns a `ReportedRate` whose `str()` is `85.00% CI=[70.93%,
92.94%] n=40 method=wilson`, and `report_rate(9, 10)` returns one whose interval genuinely brackets
its estimate and stays within `[0, 1]`, satisfying co-24's rule that the reportable unit always
carries all four required fields.

**Key takeaway**: making the interval, n, and method **structurally required** fields of a typed
record -- not optional kwargs a caller can omit -- is a cheap, durable way to make a bare-number
report a type error instead of a bad habit.

**Why It Matters**: this function is the one every later theme in this course reaches for whenever a
pass rate needs printing (Theme C's concordance report, Theme D's comparison report, and the
capstone's own final report all build on this exact pattern) -- closing Theme A on the tool that
makes "a number without an interval" (co-01) structurally hard to ship again.

---

← Previous: [Overview](./overview.md) &middot; Next: [Theme B: Sampling](./theme-b-sampling.md) →
