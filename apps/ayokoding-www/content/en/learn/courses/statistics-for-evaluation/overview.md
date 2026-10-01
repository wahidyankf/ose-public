---
title: "Overview"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Evaluating AI Output — Essentials](../evaluating-ai-output-essentials/overview.md)
  (you must have a pass rate in hand before its uncertainty is a meaningful question);
  [Just Enough Python](../just-enough-python/learning/overview.md) for fully type-annotated Python; [Data
  Structures and Algorithms Essentials](../data-structures-and-algorithms-essentials/overview.md)
  for loops, arrays, and the cost of a resampling procedure. No prior statistics course is assumed
  -- this topic starts from arithmetic with proportions and builds up.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13**; `numpy`, `scipy`,
  `statsmodels`, `scikit-learn`, and `krippendorff` -- a pinned, CVE-clean-at-authoring statistical
  toolchain, used deliberately **after** each quantity has first been computed from its definition
  in plain Python; a text editor. Every example runs offline against synthetic or committed label
  data -- no model calls, no keys, no network access required to run any script in this topic.
- **Assumed knowledge**: arithmetic with proportions and percentages; reading a table of labeled
  cases; writing a loop in Python. Calculus is not required anywhere in this topic.

## Why this exists -- the big idea

**The problem before the solution**: eval results get reported as bare numbers -- "the judge agrees
85% of the time," "the new prompt scores 3 points higher" -- and both are frequently meaningless.
Eighty-five percent agreement on a task where one label occurs 80% of the time is barely better
than a coin weighted to the majority; a 3-point difference on forty cases is indistinguishable from
noise. Without the statistics, an eval suite produces confident, precise, reproducible, and wrong
decisions. **The one idea worth keeping if you forget everything else**: a number without an
interval is an opinion, and agreement that is not corrected for chance is not agreement.

**Cross-cutting big ideas, taught here and reused for the rest of this curriculum's AI track**:
`correctness-vs-pragmatism` -- quantified uncertainty is how you make a decision you can defend
without proof; `abstraction-and-its-cost` -- every summary statistic discards structure, and you
must know which structure.

This topic is **scoped by a single rule**: a technique earns a place here only if
`Evaluating AI Systems in Depth` -- `[Unverified]`
not yet present in the AyoKoding course library on disk, so no link is given here -- cannot be
taught honestly without it. Judge concordance, significance testing, sampling design, and honest
uncertainty reporting all clear that bar; nothing else does.

> **Scope guard -- this is not a general statistics course.** Regression, causal inference, and
> experiment design for product A/B testing are **out of scope here** and belong to
> `analytics-and-experimentation` -- `[Unverified]`
> not yet present in the AyoKoding course library on disk, so no link is given here -- which is a
> sibling course, not a substitute: it shares some of the same machinery (proportions, intervals,
> significance tests) but answers a different question -- "did this product change move a business
> metric" -- rather than "can this eval result be trusted." If a statistical technique does not
> change an eval decision, it is out of scope here by construction. An engineer who wants regression
> modeling, causal inference, or a full experiment-design curriculum for shipping product changes
> should read `analytics-and-experimentation` instead of expecting this topic to cover it.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 46 runnable, heavily annotated worked examples, grouped
  by theme rather than by fixed Beginner/Intermediate/Advanced bands (this topic's concepts are
  concept-centric, not syntax-tiered):
  - **Theme A -- [Uncertainty on a Rate](./learning/theme-a-uncertainty-on-a-rate.md)** (ex 01-12) --
    why a pass rate is a sample proportion with sampling error, confidence intervals from their
    definition and from a pinned library, the normal approximation's small-n failure mode, and a
    reporting helper that makes a bare number impossible to ship.
  - **Theme B -- [Sampling](./learning/theme-b-sampling.md)** (ex 13-20) -- random vs. convenience
    vs. stratified sampling, reweighting an oversampled rare stratum, a sampling-frame mismatch, and
    a written sample-size plan for a real eval set.
  - **Theme C -- [Agreement and Judge Concordance](./learning/theme-c-agreement-and-judge-concordance.md)**
    (ex 21-34) -- why raw percent agreement overstates, chance-corrected coefficients from their
    definition and from a pinned library, choosing the right coefficient, judge concordance as an
    inter-rater-agreement problem, and the human-agreement ceiling a judge is compared against.
  - **Theme D -- [Comparing Runs and Gating on Them](./learning/theme-d-comparing-runs-and-gating-on-them.md)**
    (ex 35-46) -- paired vs. unpaired comparison, significance vs. practical importance, the
    bootstrap for statistics with no closed form, the multiple-comparisons trap, a suite's noise
    floor decomposed into its two variance sources, and a capstone-scale worked example tying every
    concept together.
  - **[Capstone](./learning/capstone/overview.md)** -- a complete statistically defensible
    evaluation report for one real shipping decision: a justified sampling plan, small-n-appropriate
    intervals, chance-corrected judge concordance against a measured human ceiling, a paired
    comparison corrected for multiple comparisons, and a regression bar derived from a measured
    noise floor.

Every worked example is a complete, self-contained, fully type-annotated runnable file colocated
under `learning/code/` (or, where a diagram is the clearer medium, a captioned, WCAG-accessible
Mermaid diagram under `learning/artifacts/`), actually executed to capture its documented output --
every printed number in this topic's pages is a genuine, captured transcript, never a fabricated
one. Every quantity with a name (an interval, a coefficient, a test statistic) is computed **twice**
-- once from its definition in plain Python so you see what it is, then once via the pinned
statistical library so you know what to call in practice -- with the two verified equal.

- **[Drilling](./drilling/overview.md)** -- the spaced-repetition companion: recall Q&A across all
  twenty-four concepts, applied problems, self-contained code katas, a self-check checklist, and
  elaborative-interrogation prompts.

## The 24 concepts this topic covers

- **co-01 · A number without an interval** -- a point estimate reported alone invites a decision the
  data cannot support; the interval is the part that carries the information. Examples 1, 11, 12,
  35, 46.
- **co-02 · Pass rate as a proportion** -- an eval pass rate is a sample proportion estimating an
  unknown true rate, which is what makes all of the following apply. Examples 1, 2, 3, 13.
- **co-03 · Sampling error** -- the same system re-measured on a different sample gives a different
  rate; that spread is quantifiable, not mysterious. Examples 1, 3.
- **co-04 · Confidence interval on a rate** -- an interval expresses the range of true rates
  consistent with what you observed. Examples 4, 7, 10, 11.
- **co-05 · Small-n interval methods** -- the normal approximation misbehaves at small n and near 0
  or 1; Wilson and Clopper-Pearson intervals are the corrective. Examples 5, 6.
- **co-06 · How many cases do I need** -- required sample size follows from the effect you need to
  detect and the precision you need. Examples 7, 8, 9, 20, 40.
- **co-07 · Sampling strategy** -- random, stratified, and convenience samples estimate different
  things. Examples 13, 14, 15, 18, 19.
- **co-08 · Stratified sampling for rare modes** -- rare failure modes need deliberate oversampling
  plus reweighting, or they are invisible at any feasible sample size. Examples 15, 16, 17, 19, 20.
- **co-09 · Raw percent agreement overstates** -- two raters agreeing 85% of the time on a skewed
  task have demonstrated almost nothing. Examples 21, 22, 23, 25.
- **co-10 · Chance-corrected agreement** -- agreement coefficients subtract the agreement expected by
  chance. Examples 10, 23, 24, 25.
- **co-11 · Choosing an agreement coefficient** -- rater count, label type, and missing data each
  call for a different coefficient. Examples 26, 27, 28.
- **co-12 · The prevalence problem** -- chance-corrected coefficients behave badly when one label
  dominates, so prevalence is reported alongside. Examples 12, 29, 34.
- **co-13 · Agreement has an interval too** -- an agreement coefficient is itself an estimate.
  Example 30.
- **co-14 · Judge concordance** -- measuring an automated judge against human labels is an
  inter-rater-agreement problem. Examples 31, 34.
- **co-15 · Concordance is per question** -- concordance is estimated separately for each criterion.
  Example 32.
- **co-16 · Human ceiling** -- human-human agreement is the ceiling any judge can be expected to
  reach. Examples 33, 34.
- **co-17 · Comparing two runs** -- "is B better than A" is a hypothesis test, not a comparison of
  two printed numbers. Examples 35, 36.
- **co-18 · Paired comparison** -- the paired test is far more sensitive than treating runs as
  independent samples. Examples 10, 37, 38.
- **co-19 · Significance vs. practical importance** -- a statistically detectable difference can be
  too small to act on, and vice versa. Examples 9, 39, 40.
- **co-20 · Bootstrap resampling** -- resampling approximates the sampling distribution of almost any
  statistic without a closed form. Examples 30, 41, 42.
- **co-21 · Multiple comparisons** -- testing many criteria at once manufactures apparent wins.
  Examples 43, 44.
- **co-22 · Noise floor of a suite** -- re-running an unchanged stochastic system produces a
  distribution, and its spread is the floor below which no regression bar can sit. Example 45.
- **co-23 · Variance from stochastic generation** -- repeat runs of the same case are a distinct
  variance source from case-to-case sampling. Example 45.
- **co-24 · Reporting honestly** -- the reportable unit is the estimate, its interval, the sample
  size, and the method. Examples 12, 20, 29, 34, 46.

## Tensions & trade-offs -- when NOT to reach for this

- **Rigor vs. sample size you actually have**: most of these techniques want more labeled cases than
  a team has budget to produce. The honest response is a wider interval and a more cautious claim,
  not a narrower method -- but there is a real point where the sample is too small to support any
  decision and the correct action is to collect more, not to compute harder.
- **Chance correction vs. interpretability**: a chance-corrected coefficient is the right statistic
  and is much harder to explain to a stakeholder than "they agreed 85% of the time." Report both,
  and expect to spend the explanation.
- **Bootstrap vs. closed form**: the bootstrap works on almost any statistic and needs no
  distributional assumption, at the cost of compute and of a false sense of security on tiny
  samples -- resampling forty cases does not manufacture information that forty cases do not
  contain.
- **When NOT to reach for this topic**: if the eval decision is "does this parse against the
  schema," there is no uncertainty to quantify and no statistic to compute. Do not attach an
  interval to a deterministic result.
- **When NOT to reach for statistics at all**: an effect visible to the naked eye across every case
  does not need a test. Significance testing is for the ambiguous middle, and reaching for it on an
  obvious result is ceremony that delays the fix.
- **What this topic deliberately does not cover**: regression modeling, causal inference, and
  product-experiment design. Those live in `analytics-and-experimentation`, which shares some
  machinery but answers a different question.

## Accuracy notes

> Dated per this topic's own accuracy-note discipline: every volatile, version-pinned, or
> market-dependent fact below is flagged or dated here rather than stated unqualified in the stable
> spine above.

- 2026-07-26 -- **durable spine**: every technique in this topic predates LLMs by decades.
  Chance-corrected agreement coefficients, binomial confidence intervals, the bootstrap, and paired
  significance tests are settled classical statistics. Nothing here has a vendor, a version, or a
  deprecation risk -- which is precisely why this topic is safe to place in a spine while framework
  material is not.
- 2026-07-26 -- the named agreement coefficients and significance tests are real, distinct
  techniques with the following publication years: **Scott's pi 1955, Cohen's kappa 1960, Fleiss's
  kappa 1971, Krippendorff's alpha circa 1970, McNemar's test 1947**
  (source: Wikipedia "Fleiss' kappa" / "McNemar's test" / "Krippendorff's alpha" --
  https://en.wikipedia.org/wiki/Fleiss%27_kappa ; accessed 2026-07-22, carried over from this
  topic's syllabus source). The Wilson and Clopper-Pearson binomial intervals and the bootstrap
  percentile interval likewise predate LLMs; their exact years are `[Unverified]` here -- treat as
  unverified until a primary reference is read.
- 2026-07-26 -- **contested, taught as contested**: there is no consensus threshold for "acceptable"
  kappa, and the widely circulated verbal scales (poor/fair/moderate/substantial) are conventions
  from a single paper, not results. This topic teaches reporting the coefficient with its interval
  and justifying a threshold against the stakes of the decision, and explicitly teaches that the
  verbal scales are conventions rather than findings.
- 2026-07-26 -- **volatile, version-pinned**: this topic's worked-example transcripts were captured
  against **Python 3.13.12**, `numpy==2.5.1`, `scipy==1.18.0`, `statsmodels==0.14.6`,
  `scikit-learn==1.9.0`, and `krippendorff==0.8.2` -- already-superseded patch releases by the time
  you read this, pinned CVE-clean at authoring per this repo's dependency-bump policy. Re-verify the
  printed transcripts if re-running the examples against later versions. In particular,
  `statsmodels.stats.proportion.proportion_confint`'s **default `method` is `"normal"`** -- the
  normal approximation this topic teaches learners to avoid at small n -- and it silently clips the
  result to `[0, 1]`, which hides rather than fixes the small-n failure mode Example 5 demonstrates;
  re-verify this default has not changed before citing it in a later revision.
- 2026-07-26 -- no model IDs, prices, or benchmark numbers appear anywhere in this topic's spine by
  design; there is nothing here to go stale.

---

Next: [Learning Overview](./learning/overview.md) →
