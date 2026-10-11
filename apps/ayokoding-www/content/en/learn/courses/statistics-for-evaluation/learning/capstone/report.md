---
title: "Artifact: Evaluation Report"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 5
---

> The final assembled report Step 4 of the capstone produces -- every figure below carries its own
> estimate, interval, n, and method (co-24); no bare number appears anywhere in this document.
> Exercises co-01 through co-24, the full topic.

**Context**: this report answers one question -- should the candidate change described here ship?
-- for a fictional decision modeled on the kind [Evaluating AI Systems In Depth](/en/learn/courses/evaluating-ai-systems-in-depth)
covers in full. Every number below was produced by one of the capstone's four scripts, each of which
was actually run to capture the transcript it is cited from; none of the figures in this report were
typed in by hand.

## 1. Sample

Per [`sampling-plan.md`](./sampling-plan.md), this report's estimates rest on a stratified sample of
**n = 320** (`general`: 200, `edge-case-formatting`: 60, `edge-case-safety`: 60), reweighted by each
stratum's real population share, drawn under a plan whose own achieved-precision claim (a 95%
half-width of `0.0441`, against a stated `0.05` target) was checked by simulation before any data
was collected. **Method**: stratified random sampling with population-share reweighting (co-07,
co-08), justified n via `statsmodels.stats.proportion.samplesize_confint_proportion` (co-06).

## 2. Judge concordance

Three rubric criteria were judged, each measured separately -- concordance is never pooled across
criteria (co-15):

- **Correctness**: judge-human kappa = **0.6050**, 95% CI **[0.3070, 0.8517]**, n = 50, label
  prevalence 0.7800, human-human ceiling 0.7506. **Method**: Cohen's kappa (computed from
  definition and via `sklearn.metrics.cohen_kappa_score`, verified equal), bootstrap 95% percentile
  CI (`scipy.stats.bootstrap`, 2000 resamples).
- **Safety**: judge-human kappa = **0.6939**, 95% CI **[0.4489, 0.8963]**, n = 50, label prevalence
  0.8000, human-human ceiling 0.7191. Same method as above.
- **Tone**: judge-human kappa = **0.3112**, 95% CI **[0.0476, 0.5600]**, n = 50, label prevalence
  0.6600, human-human ceiling 0.3761. Same method as above.

Every one of the three judge kappas sits below its own criterion's human-human ceiling (co-16), the
expected pattern for a judge that is useful but imperfect. `tone`'s judge kappa (0.3112) is
substantially weaker than `correctness`'s (0.6050) and its own interval is wide (0.0476 to 0.5600) --
the `tone` judge's verdicts should be trusted less, and any decision leaning on `tone` alone should
say so explicitly.

## 3. Comparison against baseline

A paired comparison (co-18, McNemar's test) of candidate against baseline was run on all three
criteria at once, then corrected for testing three criteria simultaneously (co-21, Bonferroni,
family-wise alpha 0.05):

- **Correctness**: baseline **0.7200**, candidate **0.9600**, gap **+0.2400**, uncorrected
  p = **0.0033**, **survives correction** (corrected significant), and clears this report's own
  materiality threshold of 0.05 (co-19). **Method**: McNemar's test on paired outcomes,
  `statsmodels.stats.contingency_tables.mcnemar`, Bonferroni via
  `statsmodels.stats.multitest.multipletests`.
- **Safety**: baseline **0.9200**, candidate **0.8000**, gap **-0.1200**, uncorrected
  p = **0.0412** (crosses the uncorrected 0.05 threshold), but does **not** survive Bonferroni
  correction across the three criteria tested -- the true baseline and candidate rates on `safety`
  are, in fact, identical by this fixture's own construction, and the correction step correctly
  identifies the uncorrected result as a plausible false positive from testing multiple criteria
  at once (co-21).
- **Tone**: baseline **0.7600**, candidate **0.8000**, gap **+0.0400**, uncorrected p = **0.7237**,
  not significant either before or after correction, and below materiality regardless.

**This is the exact scenario multiple-comparisons correction exists for**: `safety`'s uncorrected
p-value alone would have looked like a real regression worth blocking the ship on. Correcting for
having tested three criteria at once reveals it does not survive scrutiny -- a decision made on the
uncorrected number would have been wrong.

## 4. Noise floor and regression bar

Rather than choose a regression bar by feel, this report derives one from a measured decomposition
of this exact candidate's own re-run variance (co-22, co-23), at the same n = 50 used for the
`correctness` comparison above:

- Generation variance (re-running the SAME 50 fixed cases repeatedly): empirical **0.003562**,
  matching its closed form (**0.003695**) within tolerance.
- Case-sampling variance (drawing DIFFERENT 50-case samples from the same population): **0.000334**.
- Total variance (both sources combined, as an unchanged candidate re-run end-to-end would actually
  show): **0.004241**, consistent with the sum of its two components (**0.003896**).
- Noise floor standard deviation: **0.0651**. Derived regression bar: **0.1303** (twice the noise
  floor standard deviation).

The `correctness` criterion's observed gap (**+0.2400**) is nearly double this measured regression
bar (**0.1303**) -- this gap is not explainable by this suite's own ordinary re-run noise.

## Recommendation

**Ship, on the `correctness` criterion's merits, with the `safety` regression rejected as a
statistical artifact and `tone` flagged for weaker judge trust.**

Reasoning, tying every section above together: the `correctness` gap (+0.2400, n = 320-informed
sample, McNemar p = 0.0033, corrected-significant, and 1.8x the measured regression bar of 0.1303)
is both statistically detectable after correction AND practically material (co-19). The apparent
`safety` regression (uncorrected p = 0.0412) does not survive multiple-comparisons correction and
should not block the ship. `tone`'s judge concordance (kappa 0.3112, well below its own human
ceiling of 0.3761, with a wide interval) means `tone`'s own eval numbers deserve less confidence
than `correctness`'s or `safety`'s, and this report flags that limitation explicitly rather than
silently treating all three criteria's numbers as equally trustworthy.

**Verify**: every figure in every section above carries an estimate, an interval or p-value, an n,
and a named method (co-24) -- grep this document for a number with none of the three, and you will
not find one.

**Key takeaway**: a defensible ship decision is not one final number -- it is a sampling plan
checked by simulation, per-criterion concordance read against a measured human ceiling, a paired
comparison corrected for testing multiple criteria at once, and a regression bar derived from
measured noise, assembled into one traceable argument.

**Why It Matters**: every individual technique in this report (an interval, a chance-corrected
coefficient, a paired test, a correction, a noise floor) was taught in isolation across Themes A
through D. This report is the proof that assembling them together, on one real decision, produces a
recommendation that survives the specific ways a naive version of this same decision would have
gone wrong -- trusting `safety`'s uncorrected p-value, pooling `tone`'s concordance with
`correctness`'s, or picking a regression bar by feel instead of measuring it.

---

← Previous: [Sampling Plan](./sampling-plan.md) &middot; Next: [Drilling](../../drilling/overview.md) →
