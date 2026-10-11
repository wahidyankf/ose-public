---
title: "Capstone"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

## The capstone: a statistically defensible evaluation report

The capstone produces a complete, statistically defensible evaluation report for one real decision
from [Evaluating AI Systems In Depth](/en/learn/courses/evaluating-ai-systems-in-depth) --
should this candidate change ship? Every claim in the final report carries its own uncertainty, every agreement
number is chance-corrected and read against the human ceiling, the run comparison is paired and
corrected for multiple comparisons, and the regression bar is derived from a measured noise floor
rather than chosen by feel. Every script lives under `learning/capstone/code/`, fully
type-annotated, and was actually run against **Python 3.13** to capture the output shown below.

- **Step 1 -- [`sampling-plan.md`](./sampling-plan.md) + `sample.py`**: a written sampling plan with
  a justified n, and a stratified, reweighted sample. Ties together co-06, co-07, co-08, co-24.
- **Step 2 -- `agreement.py`**: chance-corrected human-human agreement and per-criterion judge
  concordance, each with a bootstrap interval, each read beside its label prevalence and the human
  ceiling. Ties together co-09-co-16, co-24.
- **Step 3 -- `compare.py`**: a paired comparison of candidate against baseline across every
  criterion, corrected for multiple comparisons, separating statistical detectability from
  practical importance. Ties together co-17-co-19, co-21.
- **Step 4 -- `noise_floor.py` + [`report.md`](./report.md)**: the suite's own measured noise
  floor, decomposed into its two variance sources, a regression bar derived from it, and the
  assembled final report. Ties together co-20, co-22, co-23, co-24.

**Concepts exercised**: co-01-co-24 -- every concept this topic teaches, converging on one
recommendation traceable to the statistics, never to a bare point estimate.

---

## Step 1: sample.py -- a justified sampling plan, reweighted

**Context**: Theme A's ex-08/ex-20 and Theme B's ex-15/ex-16 built sample-size planning and
stratified reweighting separately. This step combines both into one written plan (see
[`sampling-plan.md`](./sampling-plan.md) for the plan itself) and a synthetic, three-stratum
population where the true overall rate is known -- so the reweighted estimate's own accuracy can be
verified against ground truth, not merely asserted.

```python
# learning/capstone/code/sample.py
"""Capstone Step 1: Sampling Plan and Reweighted Sample."""  # => co-06,co-07,co-08: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import math  # => co-06: ceil -- a sample size must be a whole number of cases
import random  # => co-07: builds the synthetic population and draws the stratified sample
import statistics  # => co-06: stdev -- verifies the plan's achieved precision by simulation
from dataclasses import dataclass, field  # => co-24: the SAME typed SamplingPlan record as ex-20

from statsmodels.stats.proportion import samplesize_confint_proportion  # => co-06: the pinned library's own sample-size solver, per ex-08/ex-20

# => co-07,co-08: this eval's population is NOT uniform -- one common case type plus two rare, harder edge-case types
STRATA_SIZES = {"general": 5000, "edge-case-formatting": 300, "edge-case-safety": 150}  # => co-08: population counts per stratum -- very unequal, the SAME shape as Theme B's ex-15
STRATA_RATES = {"general": 0.85, "edge-case-formatting": 0.60, "edge-case-safety": 0.55}  # => co-08: each stratum's own true pass rate -- the rare strata are also the HARDER ones
STRATA_N = {"general": 200, "edge-case-formatting": 60, "edge-case-safety": 60}  # => co-08: deliberately WEIGHT-PROPORTIONAL oversampling -- more from the dominant stratum, enough from each rare one to see it


@dataclass(frozen=True)  # => co-24: frozen -- a written plan is a commitment made BEFORE collecting data
class SamplingPlan:  # => co-24: the four required fields, per ex-20
    target_effect: str  # => co-06: what the plan is trying to be able to detect or estimate
    target_precision: float  # => co-06: the interval half-width the plan is designed to achieve
    strata: tuple[str, ...] = field(default_factory=tuple)  # => co-08: named strata this plan deliberately oversamples
    required_n: int = 0  # => co-06: the resulting UNSTRATIFIED reference sample size -- computed, not guessed


def build_stratum(rate: float, size: int, *, seed: int) -> list[bool]:  # => co-08: one stratum's own fixed population
    """Build a stratum population of size `size`, each True (pass) with probability rate."""  # => co-08: documents build_stratum's contract -- no runtime output, just sets its __doc__
    rng = random.Random(seed)  # => co-08: one fixed generator per stratum
    return [rng.random() < rate for _ in range(size)]  # => co-08: one Bernoulli draw per case in this stratum


def draw_reweighted_estimate(population_by_stratum: dict[str, list[bool]], n_per_stratum: dict[str, int], *, trial_seed: int) -> float:  # => co-08: one full stratified-draw-then-reweight cycle
    """Draw n_per_stratum[s] cases from each stratum and return the population-share-reweighted estimate."""  # => co-08: documents draw_reweighted_estimate's contract -- no runtime output, just sets its __doc__
    total_pop = sum(len(cases) for cases in population_by_stratum.values())  # => co-08: total population size, across all strata
    stratum_means: dict[str, float] = {}  # => co-08: each stratum's own sample-based estimate, this trial
    for i, (stratum, cases) in enumerate(population_by_stratum.items()):  # => co-08: draws THIS trial's sample from every stratum
        sample = random.Random(trial_seed * 1000 + i).sample(cases, n_per_stratum[stratum])  # => co-08: this stratum's own draw, this trial
        stratum_means[stratum] = sum(sample) / len(sample)  # => co-08: this stratum's own sample mean, this trial
    return sum(stratum_means[s] * (len(population_by_stratum[s]) / total_pop) for s in population_by_stratum)  # => co-08: weight each stratum's mean by its REAL population share


if __name__ == "__main__":  # => co-24: entry point -- runs only when this file executes directly, not on import
    unstratified_raw_n = samplesize_confint_proportion(proportion=0.83, half_length=0.05, alpha=0.05, method="normal")  # => co-06: the SIMPLE reference n, ignoring strata -- an anchor, not the final plan
    unstratified_n = math.ceil(unstratified_raw_n)  # => co-06: round UP -- a fractional case cannot be collected
    plan = SamplingPlan(  # => co-24: the written plan, BEFORE any data is drawn
        target_effect="candidate-vs-baseline overall pass-rate estimate for the ship decision",  # => co-06: states WHAT the plan supports
        target_precision=0.05,  # => co-06: "I need the overall estimate within +/-5 points"
        strata=tuple(STRATA_SIZES.keys()),  # => co-08: the three strata this plan deliberately oversamples
        required_n=unstratified_n,  # => co-06: the unstratified anchor -- the actual stratified plan below allocates MORE than this, on purpose
    )
    print(f"Target effect: {plan.target_effect}")  # => co-06: states the effect explicitly, first
    print(f"Target precision (half-width): {plan.target_precision}")  # => co-06: states the precision explicitly
    print(f"Strata: {plan.strata}")  # => co-08: states the strata explicitly
    print(f"Unstratified reference n: {plan.required_n}")  # => co-06: the anchor figure
    total_planned_n = sum(STRATA_N.values())  # => co-08: the ACTUAL total this plan draws, across all three strata
    print(f"Actual stratified allocation: {STRATA_N} (total n={total_planned_n})")  # => co-08: MORE than the unstratified anchor, because the rare strata need dedicated coverage too

    population_by_stratum = {s: build_stratum(STRATA_RATES[s], size, seed=100 + i) for i, (s, size) in enumerate(STRATA_SIZES.items())}  # => co-08: the fixed synthetic population this whole file draws from
    total_pop = sum(STRATA_SIZES.values())  # => co-08: total population size
    true_overall_rate = sum(sum(cases) for cases in population_by_stratum.values()) / total_pop  # => co-08: the population's own TRUE overall rate -- KNOWN here because this is synthetic data, used to verify recovery below
    print(f"(Synthetic ground truth, for verification only) true overall population rate: {true_overall_rate:.4f}")  # => co-08

    achieved_estimates = [draw_reweighted_estimate(population_by_stratum, STRATA_N, trial_seed=t) for t in range(500)]  # => co-06: simulates 500 independent draws AT the planned allocation, to check the plan's own achieved precision
    achieved_stdev = statistics.stdev(achieved_estimates)  # => co-06: the spread of the reweighted estimate, across those 500 simulated draws
    achieved_half_width = 1.96 * achieved_stdev  # => co-06: the approximate 95% half-width this ALLOCATION actually achieves
    print(f"Simulated achieved 95% half-width at this allocation: {achieved_half_width:.4f}")  # => co-06: verifies the plan's OWN precision claim, by simulation
    assert achieved_half_width <= plan.target_precision * 1.10, "the planned allocation must achieve close to its own stated target precision"  # => co-06: the plan-is-justified claim

    stratum_samples = {s: random.Random(500 + i).sample(cases, STRATA_N[s]) for i, (s, cases) in enumerate(population_by_stratum.items())}  # => co-08: ONE actual observed sample, at the planned allocation
    stratum_means = {s: sum(sample) / len(sample) for s, sample in stratum_samples.items()}  # => co-08: each stratum's own observed mean
    naive_pooled = sum(sum(sample) for sample in stratum_samples.values()) / sum(len(sample) for sample in stratum_samples.values())  # => co-08: the WRONG shortcut -- ignores each stratum's real population share
    reweighted_estimate = sum(stratum_means[s] * (STRATA_SIZES[s] / total_pop) for s in STRATA_SIZES)  # => co-08: the population-share-reweighted estimate, per ex-16
    print(f"Naive pooled estimate: {naive_pooled:.4f} | Reweighted estimate: {reweighted_estimate:.4f}")  # => co-08

    naive_error = abs(naive_pooled - true_overall_rate)  # => co-08: how far the naive estimate misses the KNOWN synthetic truth
    reweighted_error = abs(reweighted_estimate - true_overall_rate)  # => co-08: how far the reweighted estimate misses the KNOWN synthetic truth
    print(f"Naive error: {naive_error:.4f} | Reweighted error: {reweighted_error:.4f}")  # => co-08
    assert reweighted_error < naive_error, "on synthetic data with a known population rate, reweighting must recover it more accurately than naive pooling"  # => co-08: the recovery claim this step's own acceptance criterion requires
    print("MATCH: this plan's allocation achieves its own stated precision by simulation, and the reweighted estimate recovers the known synthetic population rate more accurately than naive pooling")  # => co-08
    # => co-06,co-07,co-08: this is the artifact sampling-plan.md narrates -- a plan justified BEFORE data collection, and a reweighted estimate verified against a KNOWN synthetic truth, not merely asserted to work
```

**Run**: `python3 sample.py`

**Output**:

```text
Target effect: candidate-vs-baseline overall pass-rate estimate for the ship decision
Target precision (half-width): 0.05
Strata: ('general', 'edge-case-formatting', 'edge-case-safety')
Unstratified reference n: 217
Actual stratified allocation: {'general': 200, 'edge-case-formatting': 60, 'edge-case-safety': 60} (total n=320)
(Synthetic ground truth, for verification only) true overall population rate: 0.8250
Simulated achieved 95% half-width at this allocation: 0.0441
Naive pooled estimate: 0.7250 | Reweighted estimate: 0.8087
Naive error: 0.1000 | Reweighted error: 0.0162
MATCH: this plan's allocation achieves its own stated precision by simulation, and the reweighted estimate recovers the known synthetic population rate more accurately than naive pooling
```

**Acceptance criteria**: the simulated achieved 95% half-width (`0.0441`) sits at or below the
plan's own `0.05` target precision, satisfying co-06's rule that a sampling plan's n is justified by
simulation, not merely asserted. On the synthetic population with a known true rate (`0.8250`), the
reweighted estimate's error (`0.0162`) is smaller than the naive pooled estimate's error (`0.1000`),
satisfying co-08's rule that reweighting recovers a known population rate more accurately than
ignoring stratum weights.

**Key takeaway**: a sampling plan is defensible when its own precision claim is checked by
simulation before data collection, and a reweighted estimate is defensible when it is verified
against a KNOWN ground truth, not merely computed and trusted.

**Why It Matters**: this is the evidence [`sampling-plan.md`](./sampling-plan.md) cites for its own
`n=320` allocation -- a plan that states a number without this kind of justification is a guess
wearing the shape of a plan.

---

## Step 2: agreement.py -- chance-corrected concordance against the human ceiling

**Context**: Theme C built every piece of this step separately -- chance correction (ex-24),
choosing the right coefficient (ex-26), prevalence reporting (ex-29), bootstrap intervals (ex-30),
and the human ceiling (ex-33). This step runs all three of this decision's real rubric criteria
through the full pipeline at once, verifying every coefficient twice along the way.

```python
# learning/capstone/code/agreement.py
"""Capstone Step 2: Chance-Corrected Agreement and Judge Concordance."""  # => co-09,co-10,co-14: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import math  # => co-10: isclose -- verifies every coefficient's from-definition and library values agree
import random  # => co-14: builds three criteria's rating fixtures -- the SAME hidden-truth pattern as ex-31 through ex-34
from dataclasses import dataclass  # => co-24: forces every criterion's result through one typed shape -- no bare numbers escape
from typing import TypedDict  # => co-24: gives every criterion's params a precise, per-field int/float type -- not a widened union

import numpy as np  # => co-13: scipy's bootstrap operates on numpy arrays, paired by index
from scipy.stats import bootstrap  # => co-13: puts an interval on each criterion's judge-vs-human kappa
from sklearn.metrics import cohen_kappa_score  # => co-10: the pinned library's own chance-corrected coefficient


class CriterionParams(TypedDict):  # => co-24: the exact shape generate_ratings expects -- n and seed genuinely int, the rest genuinely float
    n: int  # => co-24: item count, always a whole number
    seed: int  # => co-24: the fixture's own random seed, always a whole number
    truth_pass_rate: float  # => co-24: a probability -- always a float
    human_noise: float  # => co-24: a probability -- always a float
    judge_noise: float  # => co-24: a probability -- always a float


CRITERIA: dict[str, CriterionParams] = {  # => co-14,co-15: THREE rubric criteria this eval decision actually needs judged -- each with its own difficulty
    "correctness": {"n": 50, "seed": 21, "truth_pass_rate": 0.80, "human_noise": 0.05, "judge_noise": 0.18},  # => co-15: the most objective criterion
    "safety": {"n": 50, "seed": 22, "truth_pass_rate": 0.90, "human_noise": 0.03, "judge_noise": 0.22},  # => co-15: high-stakes, high-prevalence "pass"
    "tone": {"n": 50, "seed": 23, "truth_pass_rate": 0.65, "human_noise": 0.12, "judge_noise": 0.30},  # => co-15: the most subjective, noisiest criterion
}  # => co-15: closes the three-criterion table this whole file iterates over below


def generate_ratings(n: int, *, seed: int, truth_pass_rate: float, human_noise: float, judge_noise: float) -> tuple[list[str], list[str], list[str]]:  # => co-14: the SAME generator pattern as ex-31 through ex-34
    """Return (human1, human2, judge) labels, each an independently noisy read of a hidden truth."""  # => co-14: documents the contract -- no runtime output, just sets its __doc__
    truth_rng = random.Random(seed)  # => co-14: the hidden, unobservable true pass/fail for each item
    truth = [truth_rng.random() < truth_pass_rate for _ in range(n)]  # => co-14: no rater, human or judge, ever sees this list directly

    def noisy(flip_probability: float, rater_seed: int) -> list[str]:  # => co-14: one rater's own noisy read of the hidden truth
        rater_rng = random.Random(rater_seed)  # => co-14: one fresh generator per rater
        return ["pass" if (t if rater_rng.random() >= flip_probability else not t) else "fail" for t in truth]  # => co-14: flips the truth with the stated probability

    human1 = noisy(human_noise, seed * 10 + 1)  # => co-14: first human rater's labels
    human2 = noisy(human_noise, seed * 10 + 2)  # => co-14: second human rater's labels -- for the human ceiling
    judge = noisy(judge_noise, seed * 10 + 3)  # => co-14: the LLM judge's labels
    return human1, human2, judge  # => co-14: three label lists, all index-aligned to the same hidden items


def cohen_kappa_from_definition(rater_x: list[str], rater_y: list[str]) -> float:  # => co-10: the SAME textbook formula as ex-24, reused for every coefficient this file computes
    """Return Cohen's kappa: (observed_agreement - chance_agreement) / (1 - chance_agreement)."""  # => co-10: documents cohen_kappa_from_definition's contract -- no runtime output, just sets its __doc__
    n = len(rater_x)  # => co-10: item count
    observed = sum(1 for x, y in zip(rater_x, rater_y) if x == y) / n  # => co-10: the raw agreement
    p_x = rater_x.count("pass") / n  # => co-10: rater X's own marginal probability of "pass"
    p_y = rater_y.count("pass") / n  # => co-10: rater Y's own marginal probability of "pass"
    chance = p_x * p_y + (1 - p_x) * (1 - p_y)  # => co-10: the chance-expected agreement, per ex-23
    return (observed - chance) / (1 - chance)  # => co-10: the chance correction


def kappa_statistic(rater_a: np.ndarray, rater_b: np.ndarray, axis: int = -1) -> np.ndarray | float:  # => co-13: the SAME vectorized bootstrap statistic as ex-30/ex-34
    """Compute Cohen's kappa for one pair of label arrays, or one row per resample."""  # => co-13: documents the contract -- no runtime output, just sets its __doc__
    if rater_a.ndim == 1:  # => co-13: the plain, non-vectorized case
        return cohen_kappa_score(rater_a, rater_b)  # => co-13: a single float
    out = np.empty(rater_a.shape[0])  # => co-13: one kappa slot per bootstrap resample row
    for i in range(rater_a.shape[0]):  # => co-13: scipy calls this function once per batch
        out[i] = cohen_kappa_score(rater_a[i], rater_b[i])  # => co-13: this resample's own kappa
    return out  # => co-13: one kappa value per resample


@dataclass(frozen=True)  # => co-24: immutable -- a report field cannot be silently overwritten after construction
class ConcordanceReport:  # => co-24: the FULL reportable unit for one criterion's judge concordance, per ex-34
    criterion: str  # => co-15: WHICH question this concordance answers -- never pooled across criteria
    n: int  # => co-06: how many items this estimate rests on
    prevalence: float  # => co-12: rater_a's own "pass" rate -- required context for reading the kappa
    judge_human_kappa: float  # => co-14: the point estimate
    ci_low: float  # => co-13: the bootstrap interval's lower bound
    ci_high: float  # => co-13: the bootstrap interval's upper bound
    human_ceiling_kappa: float  # => co-16: the human-human reference point
    method: str  # => co-24: names the coefficient AND the interval method


def build_report(criterion: str, params: CriterionParams) -> ConcordanceReport:  # => co-24: assembles one criterion's FULL report, verifying every coefficient twice along the way
    """Build a ConcordanceReport, verifying every coefficient from-definition and via the library."""  # => co-24: documents build_report's contract -- no runtime output, just sets its __doc__
    human1, human2, judge = generate_ratings(**params)  # => co-14: this criterion's own fixture
    n = params["n"]  # => co-06: item count

    kappa_def = cohen_kappa_from_definition(judge, human1)  # => co-10: computed from the formula directly
    kappa_lib = cohen_kappa_score(judge, human1)  # => co-10: computed via the pinned library
    assert math.isclose(kappa_def, kappa_lib, abs_tol=1e-9), f"{criterion}: judge-vs-human kappa must match between definition and library"  # => co-10: computed twice, verified equal

    ceiling_def = cohen_kappa_from_definition(human1, human2)  # => co-10: the human-human ceiling, from the formula
    ceiling_lib = cohen_kappa_score(human1, human2)  # => co-10: the human-human ceiling, via the library
    assert math.isclose(ceiling_def, ceiling_lib, abs_tol=1e-9), f"{criterion}: human ceiling kappa must match between definition and library"  # => co-10: computed twice, verified equal

    prevalence = human1.count("pass") / n  # => co-12: rater_a's own "pass" rate

    judge_arr = np.array(judge)  # => co-13: scipy's bootstrap resamples paired arrays by matching indices
    human1_arr = np.array(human1)  # => co-13: must stay index-aligned with judge_arr
    result = bootstrap(  # => co-13: resamples (item, item) pairs with replacement
        (judge_arr, human1_arr),
        kappa_statistic,
        paired=True,
        vectorized=True,
        confidence_level=0.95,
        n_resamples=2000,
        method="percentile",
        rng=np.random.default_rng(params["seed"]),  # => co-13: the SAME bootstrap procedure as ex-30/ex-34
    )  # => co-13: closes the bootstrap() call -- every keyword above is a deliberate, named choice
    low, high = result.confidence_interval  # => co-13: unpacks the interval's two ends

    return ConcordanceReport(  # => co-24: every field populated -- no bare number leaves this function
        criterion=criterion,  # => co-15: which question this concordance answers
        n=n,  # => co-06: how many items this estimate rests on
        prevalence=prevalence,  # => co-12: rater_a's own "pass" rate
        judge_human_kappa=kappa_def,  # => co-14: the point estimate
        ci_low=low,  # => co-13: the interval's lower bound
        ci_high=high,  # => co-13: the interval's upper bound
        human_ceiling_kappa=ceiling_def,  # => co-16: the human-human reference point
        method="cohen_kappa (definition + library, verified equal), bootstrap 95% percentile CI",  # => co-24: names the coefficient AND the interval method
    )  # => co-24: closes the ConcordanceReport constructor -- all eight fields supplied, none deferred


if __name__ == "__main__":  # => co-24: entry point -- runs only when this file executes directly, not on import
    reports = [build_report(name, params) for name, params in CRITERIA.items()]  # => co-15: one full report per criterion, computed separately

    for r in reports:  # => co-24: prints every field, per criterion -- never a pooled "judge quality" number
        print(  # => co-24: the exact per-criterion row this capstone's own report.md later tabulates
            f"[{r.criterion}] n={r.n} prevalence={r.prevalence:.4f} judge_kappa={r.judge_human_kappa:.4f} "  # => co-24: leading half -- WHICH criterion, n, prevalence
            f"95% CI=[{r.ci_low:.4f}, {r.ci_high:.4f}] human_ceiling={r.human_ceiling_kappa:.4f}"  # => co-24: trailing half -- interval and ceiling
        )  # => co-24: closes the print() call

    for r in reports:  # => co-16,co-24: the checks this step's own acceptance criteria require
        assert r.ci_low < r.judge_human_kappa < r.ci_high, f"{r.criterion}: the point estimate must sit inside its own interval"  # => co-13
        assert r.judge_human_kappa < r.human_ceiling_kappa, f"{r.criterion}: the judge must sit below the human ceiling"  # => co-16
    print("MATCH: every criterion's judge-vs-human kappa AND human-ceiling kappa were each verified from-definition against the pinned library, and every judge kappa sits below its own human ceiling")  # => co-24
    # => co-09,co-10,co-11,co-12,co-13,co-14,co-15,co-16,co-24: this is the agreement half of the capstone's evidence -- every named coefficient computed twice, interval-bounded, and read against the human ceiling, never a bare number
```

**Run**: `python3 agreement.py`

**Output**:

```text
[correctness] n=50 prevalence=0.7800 judge_kappa=0.6050 95% CI=[0.3070, 0.8517] human_ceiling=0.7506
[safety] n=50 prevalence=0.8000 judge_kappa=0.6939 95% CI=[0.4489, 0.8963] human_ceiling=0.7191
[tone] n=50 prevalence=0.6600 judge_kappa=0.3112 95% CI=[0.0476, 0.5600] human_ceiling=0.3761
MATCH: every criterion's judge-vs-human kappa AND human-ceiling kappa were each verified from-definition against the pinned library, and every judge kappa sits below its own human ceiling
```

**Acceptance criteria**: every criterion's judge-human kappa is verified equal from-definition and
via the library (co-10), each carries a bootstrap interval that brackets its own point estimate
(co-13), each is reported beside its label prevalence (co-12), and every judge kappa
(`0.6050`/`0.6939`/`0.3112`) sits below its own human-human ceiling
(`0.7506`/`0.7191`/`0.3761`) rather than against perfect agreement (co-16). All hold, matching the
captured output above.

**Key takeaway**: "the judge agrees with humans" is unreportable as a single number -- it takes
three criteria, three prevalences, three intervals, and three human ceilings, and none of the three
criteria's numbers may be pooled into one.

**Why It Matters**: `tone`'s judge kappa (`0.3112`) is barely half of `correctness`'s (`0.6050`) --
a ship decision that trusted the judge equally on both criteria would be badly miscalibrated on
`tone`, exactly the failure per-criterion concordance reporting exists to prevent.

---

## Step 3: compare.py -- a corrected, paired, materiality-aware comparison

**Context**: Theme D built pairing (ex-37/38), significance-vs-importance (ex-39/40), and
multiple-comparisons correction (ex-43/44) separately. This step runs all three rubric criteria's
paired comparisons at once, deliberately planting one real effect and one phantom, to verify the
corrected pipeline tells them apart.

```python
# learning/capstone/code/compare.py
"""Capstone Step 3: Paired Comparison, Corrected for Multiple Comparisons."""  # => co-17,co-18,co-21: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import random  # => co-18: builds three paired baseline/candidate criteria -- one real effect, one phantom, one true negative
from dataclasses import dataclass  # => co-24: forces every criterion's comparison result through one typed shape
from typing import TypedDict  # => co-24: gives every criterion's params a precise, per-field type

from statsmodels.stats.contingency_tables import mcnemar  # => co-18: the paired significance test, per ex-37/ex-38
from statsmodels.stats.multitest import multipletests  # => co-21: the multiple-comparisons correction, per ex-44

MATERIALITY_THRESHOLD = 0.05  # => co-19: this team's own stated bar for "worth acting on"


class CriterionCompareParams(TypedDict):  # => co-24: the exact shape build_paired_dataset expects
    n: int  # => co-24: item count, always a whole number
    seed: int  # => co-24: this criterion's own fixture seed, always a whole number
    baseline_rate: float  # => co-24: baseline's true pass rate on this criterion
    candidate_rate: float  # => co-24: candidate's true pass rate on this criterion -- EQUAL to baseline_rate plants a phantom-only scenario
    correlation: float  # => co-24: how strongly baseline/candidate verdicts share per-item difficulty


# => co-17,co-21: three criteria this eval decision needs compared -- deliberately PLANTED with a known ground truth, to verify the pipeline finds what is real and rejects what is not
CRITERIA: dict[str, CriterionCompareParams] = {  # => co-24: named per criterion, per co-15 -- never one pooled comparison
    "correctness": {"n": 50, "seed": 1, "baseline_rate": 0.60, "candidate_rate": 0.88, "correlation": 0.8},  # => co-17: a PLANTED REAL improvement -- candidate's true rate is genuinely higher
    "safety": {"n": 50, "seed": 202, "baseline_rate": 0.90, "candidate_rate": 0.90, "correlation": 0.6},  # => co-21: a PLANTED PHANTOM -- IDENTICAL true rates, no real difference exists
    "tone": {"n": 50, "seed": 1, "baseline_rate": 0.65, "candidate_rate": 0.65, "correlation": 0.8},  # => co-21: a true negative -- IDENTICAL true rates, included for contrast against the phantom
}  # => co-24: closes the three-criterion table this whole file iterates over below


def build_paired_dataset(n: int, *, seed: int, baseline_rate: float, candidate_rate: float, correlation: float) -> tuple[list[bool], list[bool]]:  # => co-18: the SAME paired-fixture shape as ex-37/ex-38/ex-46
    """Build paired baseline/candidate outcomes over n SHARED items, correlated by per-item difficulty."""  # => co-18: documents build_paired_dataset's contract -- no runtime output, just sets its __doc__
    rng = random.Random(seed)  # => co-18: drives each item's shared difficulty draw
    baseline: list[bool] = []  # => co-18: baseline's verdict, one per item
    candidate: list[bool] = []  # => co-18: candidate's verdict on the SAME item, one per item
    for _ in range(n):  # => co-18: one shared item at a time
        difficulty_draw = rng.random()  # => co-18: this item's own shared difficulty draw
        baseline_pass = difficulty_draw < baseline_rate  # => co-18: baseline's verdict on this exact item
        if rng.random() < correlation:  # => co-18: most of the time, candidate's verdict shares baseline's own difficulty read
            candidate_pass = difficulty_draw < candidate_rate  # => co-18: correlated verdict
        else:  # => co-18: occasionally, an independent draw instead
            candidate_pass = rng.random() < candidate_rate  # => co-18: an independent verdict
        baseline.append(baseline_pass)  # => co-18: records this item's baseline verdict
        candidate.append(candidate_pass)  # => co-18: records this item's candidate verdict, SAME item, SAME index
    return baseline, candidate  # => co-18: two same-length, index-aligned lists


@dataclass(frozen=True)  # => co-24: immutable -- a comparison result cannot be silently edited
class CriterionComparison:  # => co-24: EVERY field one criterion's paired comparison needs, gathered together
    criterion: str  # => co-15: which criterion this comparison answers for
    n: int  # => co-06: how many paired items
    baseline_rate: float  # => co-02: baseline's own point estimate
    candidate_rate: float  # => co-02: candidate's own point estimate
    gap: float  # => co-17: the observed gap
    mcnemar_p: float  # => co-18: the paired test's own p-value, UNCORRECTED
    corrected_significant: bool  # => co-21: whether this criterion survives multiple-comparisons correction
    material: bool  # => co-19: whether the gap clears this team's own materiality bar, separate from significance


if __name__ == "__main__":  # => co-24: entry point -- runs only when this file executes directly, not on import
    raw_results: list[tuple[str, int, float, float, float, float]] = []  # => co-18: one row per criterion, before correction
    for criterion, params in CRITERIA.items():  # => co-17: compares EVERY criterion the SAME way
        baseline, candidate = build_paired_dataset(**params)  # => co-18: this criterion's own paired data
        n = params["n"]  # => co-06: item count
        baseline_rate = sum(baseline) / n  # => co-02: baseline's own point estimate
        candidate_rate = sum(candidate) / n  # => co-02: candidate's own point estimate
        gap = candidate_rate - baseline_rate  # => co-17: the observed gap

        both_pass = sum(1 for b, c in zip(baseline, candidate) if b and c)  # => co-18: concordant pairs
        both_fail = sum(1 for b, c in zip(baseline, candidate) if not b and not c)  # => co-18: concordant pairs
        baseline_only = sum(1 for b, c in zip(baseline, candidate) if b and not c)  # => co-18: candidate regressed
        candidate_only = sum(1 for b, c in zip(baseline, candidate) if not b and c)  # => co-18: candidate improved
        table = [[both_pass, baseline_only], [candidate_only, both_fail]]  # => co-18: the 2x2 table McNemar's test uses
        mcnemar_p = mcnemar(table, exact=False, correction=True).pvalue  # => co-18: the UNCORRECTED paired p-value

        raw_results.append((criterion, n, baseline_rate, candidate_rate, gap, mcnemar_p))  # => co-18: stored for correction below
        print(f"[{criterion}] baseline={baseline_rate:.4f} candidate={candidate_rate:.4f} gap={gap:+.4f} uncorrected_p={mcnemar_p:.4f}")  # => co-17,co-18

    pvalues = [r[5] for r in raw_results]  # => co-21: every criterion's own uncorrected p-value, in order
    reject_bonferroni, _, _, _ = multipletests(pvalues, alpha=0.05, method="bonferroni")  # => co-21: the multiple-comparisons correction, per ex-44

    comparisons = [  # => co-24: assembles the FULL typed comparison for every criterion
        CriterionComparison(  # => co-24: no bare gap or bare p-value leaves this constructor
            criterion=criterion,  # => co-15: which criterion this comparison answers for
            n=n,  # => co-06: how many paired items
            baseline_rate=baseline_rate,  # => co-02: baseline's own point estimate
            candidate_rate=candidate_rate,  # => co-02: candidate's own point estimate
            gap=gap,  # => co-17: the observed gap
            mcnemar_p=mcnemar_p,  # => co-18: the paired test's own p-value, uncorrected
            corrected_significant=bool(rejected),  # => co-21: whether this criterion survives correction
            material=abs(gap) > MATERIALITY_THRESHOLD,  # => co-19: whether the gap clears materiality, separate from significance
        )  # => co-24: closes the CriterionComparison constructor -- all eight fields supplied
        for (criterion, n, baseline_rate, candidate_rate, gap, mcnemar_p), rejected in zip(raw_results, reject_bonferroni)  # => co-24: pairs each raw result with its own corrected verdict, in order
    ]  # => co-24: closes the list comprehension -- one CriterionComparison per criterion tested

    for c in comparisons:  # => co-19,co-21: prints the FULL, corrected, materiality-aware verdict per criterion
        print(f"[{c.criterion}] corrected_significant={c.corrected_significant} material={c.material}")  # => co-19,co-21

    correctness = next(c for c in comparisons if c.criterion == "correctness")  # => co-17: the PLANTED real effect
    safety = next(c for c in comparisons if c.criterion == "safety")  # => co-21: the PLANTED phantom
    tone = next(c for c in comparisons if c.criterion == "tone")  # => co-21: the true negative, for contrast

    assert correctness.corrected_significant and correctness.material, "the planted REAL effect (correctness) must survive correction AND clear materiality"  # => co-17,co-19,co-21: the pipeline must find what is real
    assert not safety.corrected_significant, "the planted PHANTOM (safety, identical true rates) must NOT survive correction"  # => co-21: the pipeline must reject what is not real
    assert not tone.corrected_significant, "the true negative (tone, identical true rates) must stay non-significant"  # => co-21: the boring control case
    print("MATCH: the corrected pipeline finds the planted real effect (correctness) significant and material, and rejects the planted phantom (safety) despite its uncorrected p < 0.05")  # => co-17,co-18,co-19,co-21
    # => co-17,co-18,co-19,co-21,co-24: this is the comparison half of the capstone's evidence -- paired, corrected for testing three criteria at once, and read against materiality, never a bare uncorrected p-value
```

**Run**: `python3 compare.py`

**Output**:

```text
[correctness] baseline=0.7200 candidate=0.9600 gap=+0.2400 uncorrected_p=0.0033
[safety] baseline=0.9200 candidate=0.8000 gap=-0.1200 uncorrected_p=0.0412
[tone] baseline=0.7600 candidate=0.8000 gap=+0.0400 uncorrected_p=0.7237
[correctness] corrected_significant=True material=True
[safety] corrected_significant=False material=True
[tone] corrected_significant=False material=False
MATCH: the corrected pipeline finds the planted real effect (correctness) significant and material, and rejects the planted phantom (safety) despite its uncorrected p < 0.05
```

**Acceptance criteria**: `safety`'s uncorrected p-value (`0.0412`) crosses the ordinary `0.05`
threshold despite `baseline_rate == candidate_rate` (a planted phantom, no real difference), and
Bonferroni correction across all three criteria correctly reclassifies it as not significant
(co-21). `correctness`'s planted real effect survives correction AND clears the `0.05` materiality
threshold (co-17, co-19). All hold, matching the captured output and the script's own asserts.

**Key takeaway**: an uncorrected `p < 0.05` on any ONE of several tested criteria is not yet
evidence of a real difference -- `safety`'s own phantom proves the correction step is not
optional, even with only three criteria tested.

**Why It Matters**: this is the exact evidence [`report.md`](./report.md) cites for recommending
against a `safety`-only justification while still recommending the ship on `correctness`'s own
merits -- a decision the uncorrected numbers alone would have gotten wrong in the opposite
direction (trusting `safety`'s phantom, or under-weighting `correctness`'s real, corrected win).

---

## Step 4: noise_floor.py -- a measured regression bar

**Context**: Theme D's ex-45 built the noise-floor decomposition technique on a standalone
fixture. This step applies it to THIS candidate's own "correctness" eval set, deriving a regression
bar the final [`report.md`](./report.md) uses instead of a chosen-by-feel threshold.

```python
# learning/capstone/code/noise_floor.py
"""Capstone Step 4: Noise Floor and Regression Bar."""  # => co-22,co-23: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import math  # => co-22: sqrt -- converts variance into a stdev-scaled regression bar
import random  # => co-22: builds the population and draws both the generation-noise and case-sampling simulations
import statistics  # => co-22: pvariance -- population variance over each simulated distribution
from dataclasses import dataclass  # => co-24: forces the final noise-floor report through one typed shape

POPULATION_SIZE = 400  # => co-22: a realistic-sized pool of real cases, for THIS capstone's own candidate system
N = 50  # => co-22: the SAME eval-set size compare.py used for the "correctness" criterion
K_REGENERATIONS = 1000  # => co-23: how many times the SAME fixed cases are re-generated
M_RESAMPLES = 1000  # => co-22: how many DIFFERENT case samples are drawn


@dataclass(frozen=True)  # => co-24: immutable -- a measured noise floor is a fact about the suite, not something later code edits
class NoiseFloorReport:  # => co-24: EVERY field the noise-floor measurement needs, gathered together
    n: int  # => co-06: how many cases each simulated eval run draws
    generation_variance: float  # => co-23: variance from stochastic generation alone, cases held fixed
    case_sampling_variance: float  # => co-22: variance from which cases got sampled alone
    total_variance: float  # => co-22,co-23: the SPREAD a team would actually observe re-running the whole eval
    noise_floor_stdev: float  # => co-22: the standard deviation of that spread
    regression_bar: float  # => co-22: the derived threshold -- a gap below this could be ordinary noise, not a real regression


if __name__ == "__main__":  # => co-22: entry point -- runs only when this file executes directly, not on import
    population_rng = random.Random(9)  # => co-22: builds the fixed population every sample below draws from
    population_p = [population_rng.betavariate(7, 3) for _ in range(POPULATION_SIZE)]  # => co-22: each case's own TRUE pass PROBABILITY -- the SAME technique as ex-45
    print(f"Population: {POPULATION_SIZE} cases, mean true pass probability {statistics.mean(population_p):.4f}")  # => co-22

    fixed_sample_rng = random.Random(50)  # => co-23: fixes ONE specific eval set -- reused for the generation-noise measurement below
    fixed_indices = fixed_sample_rng.sample(range(POPULATION_SIZE), N)  # => co-23: the exact 50 cases this candidate's "correctness" eval set contains
    fixed_p = [population_p[i] for i in fixed_indices]  # => co-23: these cases' own true pass probabilities, held fixed

    generation_rates: list[float] = []  # => co-23: one pass rate per re-run of the SAME fixed cases
    for k in range(K_REGENERATIONS):  # => co-23: re-generates the SAME fixed cases, over and over -- exactly like re-running an unchanged candidate
        gen_rng = random.Random(9000 + k)  # => co-23: a fresh generation draw each time
        outcomes = [gen_rng.random() < p for p in fixed_p]  # => co-23: each case's outcome THIS regeneration
        generation_rates.append(sum(outcomes) / N)  # => co-23: this regeneration's own pass rate
    generation_variance_empirical = statistics.pvariance(generation_rates)  # => co-23: pure generation noise, cases held fixed
    generation_variance_closed_form = sum(p * (1 - p) for p in fixed_p) / (N**2)  # => co-23: the EXACT closed form, per ex-45
    print(f"Generation variance: empirical={generation_variance_empirical:.6f} closed-form={generation_variance_closed_form:.6f}")  # => co-23: computed twice, same discipline as every other coefficient in this capstone

    case_sampling_means: list[float] = []  # => co-22: one mean TRUE probability per DIFFERENT case sample
    for m in range(M_RESAMPLES):  # => co-22: draws a DIFFERENT set of 50 cases each time, from the SAME population
        sample_rng = random.Random(8000 + m)  # => co-22: this resample's own case draw
        sample_idx = sample_rng.sample(range(POPULATION_SIZE), N)  # => co-22: which cases this resample happens to contain
        sample_p = [population_p[i] for i in sample_idx]  # => co-22: those cases' own TRUE probabilities -- isolates case-sampling variance alone
        case_sampling_means.append(statistics.mean(sample_p))  # => co-22: this resample's own mean true probability
    case_sampling_variance_empirical = statistics.pvariance(case_sampling_means)  # => co-22: the SPREAD across different case samples, generation noise removed

    total_rates: list[float] = []  # => co-22,co-23: one pass rate per DIFFERENT case sample, EACH ALSO freshly generated
    for m in range(M_RESAMPLES):  # => co-22: a DIFFERENT case sample every time, exactly like real repeated eval runs
        total_sample_rng = random.Random(7000 + m)  # => co-22: this run's own case draw
        total_idx = total_sample_rng.sample(range(POPULATION_SIZE), N)  # => co-22: which cases this run happens to contain
        total_p = [population_p[i] for i in total_idx]  # => co-22: those cases' own true probabilities
        total_gen_rng = random.Random(6000 + m)  # => co-23: this run's own fresh generation
        total_outcomes = [total_gen_rng.random() < p for p in total_p]  # => co-23: each case's actual outcome THIS run
        total_rates.append(sum(total_outcomes) / N)  # => co-22,co-23: this run's own observed pass rate
    total_variance_empirical = statistics.pvariance(total_rates)  # => co-22,co-23: the SPREAD an unchanged, re-run candidate would actually show
    sum_of_components = generation_variance_empirical + case_sampling_variance_empirical  # => co-22,co-23: the decomposition's own internal-consistency check
    print(f"Case-sampling variance: {case_sampling_variance_empirical:.6f}")  # => co-22
    print(f"Total variance: {total_variance_empirical:.6f} | Sum of components: {sum_of_components:.6f}")  # => co-22,co-23

    noise_floor_stdev = math.sqrt(total_variance_empirical)  # => co-22: converts the measured total variance into a standard-deviation-scale figure
    regression_bar = 2 * noise_floor_stdev  # => co-22: a gap smaller than TWICE this system's own noise floor could plausibly be ordinary re-run noise, not a real regression
    report = NoiseFloorReport(  # => co-24: every field populated -- no bare regression bar leaves this function
        n=N,  # => co-06: how many cases each simulated eval run draws
        generation_variance=generation_variance_empirical,  # => co-23: variance from stochastic generation alone
        case_sampling_variance=case_sampling_variance_empirical,  # => co-22: variance from which cases got sampled alone
        total_variance=total_variance_empirical,  # => co-22,co-23: both sources combined
        noise_floor_stdev=noise_floor_stdev,  # => co-22: the standard deviation of that spread
        regression_bar=regression_bar,  # => co-22: the derived threshold, not chosen by feel
    )  # => co-24: closes the NoiseFloorReport constructor -- all six fields supplied, none deferred
    print(f"Noise floor stdev: {report.noise_floor_stdev:.4f} | Derived regression bar: {report.regression_bar:.4f}")  # => co-22: the ONE number a ship decision compares its own gap against

    assert abs(generation_variance_empirical - generation_variance_closed_form) / generation_variance_closed_form < 0.10, "generation variance must match its closed form closely"  # => co-23
    assert abs(total_variance_empirical - sum_of_components) / sum_of_components < 0.20, "total variance must be close to the sum of its two components"  # => co-22,co-23
    assert report.regression_bar < 0.24, "compare.py's own planted real effect (a 0.24 gap on correctness) must clear this measured regression bar"  # => co-22: ties this file's output directly to compare.py's own result
    print("MATCH: this candidate's own measured noise floor derives a regression bar well below compare.py's planted 0.24 real-effect gap -- that gap is not explainable by ordinary re-run noise alone")  # => co-22,co-23
    # => co-22,co-23,co-24: a regression bar CHOSEN by feel is a guess -- this one is DERIVED from a measured decomposition of this exact candidate's own re-run variance, which is what report.md cites
```

**Run**: `python3 noise_floor.py`

**Output**:

```text
Population: 400 cases, mean true pass probability 0.6986
Generation variance: empirical=0.003562 closed-form=0.003695
Case-sampling variance: 0.000334
Total variance: 0.004241 | Sum of components: 0.003896
Noise floor stdev: 0.0651 | Derived regression bar: 0.1303
MATCH: this candidate's own measured noise floor derives a regression bar well below compare.py's planted 0.24 real-effect gap -- that gap is not explainable by ordinary re-run noise alone
```

**Acceptance criteria**: the empirical generation variance (`0.003562`) matches its closed form
(`0.003695`) within `10%` (co-23), the empirical total variance (`0.004241`) matches the sum of its
two components (`0.003896`) within `20%` (co-22, co-23), and the derived regression bar (`0.1303`)
sits below `compare.py`'s own planted `0.24` real-effect gap on `correctness` (co-22). All hold,
matching the captured output and the script's own asserts.

**Key takeaway**: a regression bar derived from a measured decomposition of THIS candidate's own
re-run noise is a fundamentally different claim than a bar picked because "5 points felt like
enough" -- and here, it is comfortably smaller than the real, planted effect, confirming the
`correctness` gap is not noise.

**Why It Matters**: this is the final piece [`report.md`](./report.md) assembles alongside Step 2's
agreement evidence and Step 3's corrected comparison -- together, the three form one statistically
defensible recommendation, none of the three pieces sufficient alone.

---

← Previous: [Theme D: Comparing Runs and Gating on Them](../theme-d-comparing-runs-and-gating-on-them.md)
&middot; Next: [Drilling](../../drilling/overview.md) →
