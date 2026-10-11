---
title: "Overview"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Evaluating AI Output -- Essentials](../../evaluating-ai-output-essentials/overview.md)
  -- you must have a pass rate in hand before its uncertainty is a meaningful question; [Just Enough
  Python](../../just-enough-python/learning/overview.md) for fully type-annotated Python; [Data Structures and
  Algorithms Essentials](../../data-structures-and-algorithms-essentials/overview.md) for loops,
  arrays, and the cost of a resampling procedure. No prior statistics course is assumed.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13**; a pinned, CVE-clean-at-authoring
  statistical toolchain (`numpy`, `scipy`, `statsmodels`, `scikit-learn`, `krippendorff`), used
  deliberately AFTER each quantity is first computed from its definition in plain Python; a text
  editor. Every example runs offline against synthetic or committed label data.
- **Assumed knowledge**: arithmetic with proportions and percentages; reading a table of labeled
  cases; writing a loop in Python.

## Why this exists -- the big idea

**The problem before the solution**: eval results get reported as bare numbers, and both examples
above are frequently meaningless without their own context -- 85% judge-human agreement on a task
where one label occurs 80% of the time is barely better than always guessing the majority label; a
3-point pass-rate difference on forty cases is indistinguishable from noise. **The one idea worth
keeping if you forget everything else**: a number without an interval is an opinion, and agreement
that is not corrected for chance is not agreement.

## Confirm your toolchain

Every worked example in this topic runs against the following pinned toolchain, actually installed
and verified before any transcript below was captured:

```text
$ python3 --version
Python 3.13.12
$ python3 -m pip install -r learning/code/requirements.txt
$ python3 -c "import numpy, scipy, statsmodels, sklearn, krippendorff; print('statistical toolchain OK')"
statistical toolchain OK
```

_Captured 2026-07-26 -- these are point-in-time patch versions, not a durable claim; see this
topic's [References](../overview.md#references) if you are reading this after a later patch
has shipped._

Every code-bearing worked example is a complete, self-contained, fully type-annotated runnable
file colocated under `learning/code/` with its own `requirements.txt`, actually executed to
capture its documented output -- every printed number in this topic's pages is a genuine, captured
transcript, never a fabricated one. Every quantity with a name (an interval, a coefficient, a test
statistic) is computed **twice** -- once from its definition in plain Python, once via the pinned
library -- with the two verified equal via `math.isclose`. Every worked example is independently
runnable with no cross-example imports; the capstone's four files are the sole exception, importing
from one another as one small project.

## How this topic's examples are organized

This topic's 46 worked examples group by theme, not by fixed Beginner/Intermediate/Advanced bands
-- the concepts here are concept-centric, not syntax-tiered.

- **[Theme A -- Uncertainty on a Rate](./theme-a-uncertainty-on-a-rate.md)** (Examples 1-12) -- a
  pass rate is a sample proportion with sampling error, confidence intervals from their definition
  and from a pinned library, the normal approximation's small-n failure mode, Wilson and
  Clopper-Pearson as the corrective, interval width against n, and a reporting helper that makes a
  bare number impossible to ship.
- **[Theme B -- Sampling](./theme-b-sampling.md)** (Examples 13-20) -- random vs. convenience vs.
  stratified sampling, a rare failure mode invisible at small n, reweighting an oversampled
  stratum, a sampling-frame mismatch, and a written sample-size plan for a real eval set.
- **[Theme C -- Agreement and Judge Concordance](./theme-c-agreement-and-judge-concordance.md)**
  (Examples 21-34) -- why raw percent agreement overstates, chance-corrected coefficients from
  their definition and from a pinned library, choosing the right coefficient across rater count and
  label type, the prevalence problem, judge concordance as an inter-rater-agreement problem per
  criterion, and the human-agreement ceiling a judge is compared against.
- **[Theme D -- Comparing Runs and Gating on Them](./theme-d-comparing-runs-and-gating-on-them.md)**
  (Examples 35-46) -- paired vs. unpaired comparison, McNemar's test from its definition,
  significance vs. practical importance in both directions, the bootstrap for statistics with no
  closed form, the multiple-comparisons trap and its correction, a suite's noise floor decomposed
  into its two variance sources, and a capstone-scale worked example tying every concept together
  into one defensible ship decision.
- **[Capstone](./capstone/overview.md)** -- a complete statistically defensible evaluation report
  for one real shipping decision: a justified, reweighted sampling plan; per-criterion judge
  concordance against a measured human ceiling; a paired comparison corrected for multiple
  comparisons; and a regression bar derived from a measured noise floor.

## Read more

- **Ellen R. Girden & Robert Kabacoff -- Evaluating Research Articles from Start to Finish** --
  accessible treatment of significance vs. practical importance, the distinction Theme D's
  ex-39/ex-40 exercise directly.
- **Klaus Krippendorff -- Content Analysis: An Introduction to Its Methodology** -- the primary
  reference for Krippendorff's alpha, the most general chance-corrected coefficient this topic
  teaches (Theme C).
- **Wikipedia -- "Cohen's kappa"**, **"Fleiss' kappa"**, **"McNemar's test"** -- accessible
  secondary references cross-checked in this topic's [References](../overview.md#references).
  <https://en.wikipedia.org/wiki/Cohen%27s_kappa>

---

← Previous: [Overview](../overview.md) &middot; Next: [Theme A: Uncertainty on a Rate](./theme-a-uncertainty-on-a-rate.md) →
