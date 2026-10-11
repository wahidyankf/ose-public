---
title: "Overview"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Statistics for Evaluation topic: recall first,
then applied judgment, then a hands-on kata, then a self-check checklist, then
elaborative-interrogation prompts that ask _why_, not just _what_. Every answer is hidden in a
`<details>` block; try each item yourself before opening it.

Every kata below is self-contained and deterministic -- hand-constructed fixtures only, no live
model call, no network, and no dependency on this topic's own worked-example or capstone code.

## Recall Q&A

Twenty-four short-answer questions, one per concept (`co-01` through `co-24`). Answer from memory,
then check.

**Q1 (co-01 -- a number without an interval).** Why does a point estimate reported alone invite a
decision the data cannot support?

<details>
<summary>Answer</summary>

Because a single number hides exactly how much it could plausibly move on a different sample --
without the interval, a reader has no way to tell whether "83% pass rate" means "we are confident
it is close to 83%" or "it could genuinely be anywhere from 70% to 95%." The interval is the part
that actually carries the information a decision needs.

</details>

**Q2 (co-02 -- pass rate as a proportion).** Why does treating an eval pass rate as a sample
proportion matter, rather than just treating it as a fixed fact about the system?

<details>
<summary>Answer</summary>

Because a proportion computed from n cases is an ESTIMATE of an unknown true rate, not the true rate
itself -- a different sample of the same size, drawn from the same system, would give a slightly
different number. Every technique in this topic (intervals, sample-size planning, significance
tests) only makes sense once the pass rate is recognized as an estimate with its own uncertainty.

</details>

**Q3 (co-03 -- sampling error).** What is sampling error, and why is it not a sign that something is
wrong with the eval?

<details>
<summary>Answer</summary>

Sampling error is the spread you get from re-measuring the same true rate on a different sample --
it is quantifiable and expected, not a bug. Two runs of the same system against two different
40-case samples can legitimately land a few points apart with nothing wrong at all; the question
sampling error answers is "how large a spread is expected by chance alone."

</details>

**Q4 (co-04 -- confidence interval on a rate).** What does a confidence interval on a rate actually
express?

<details>
<summary>Answer</summary>

The range of true rates that are statistically consistent with what you observed, at a stated
confidence level -- not "the true rate is definitely in this range," but "if you repeated this
sampling procedure many times, an interval built this way would contain the true rate that
proportion of the time."

</details>

**Q5 (co-05 -- small-n interval methods).** Why does the normal approximation misbehave at small n
or near 0/1, and what fixes it?

<details>
<summary>Answer</summary>

The normal approximation assumes the sampling distribution of a proportion is symmetric and
bell-shaped, which breaks down when n is small or the true rate sits near the boundary (0 or 1) --
it can even produce an interval that extends past 0 or 1, or one silently clipped to `[0, 1]` that
hides rather than fixes the failure. The Wilson and Clopper-Pearson interval methods are built to
stay well-behaved in exactly these conditions.

</details>

**Q6 (co-06 -- how many cases do I need).** What does a required sample size actually follow from?

<details>
<summary>Answer</summary>

The effect size you need to be able to detect and the precision (interval half-width) you need to
achieve -- "how many cases" is not a guess or a round number, it is the output of a calculation that
takes those two inputs, and it should be computed and written down before data collection, not
reverse-engineered afterward to justify whatever sample happened to be collected.

</details>

**Q7 (co-07 -- sampling strategy).** Why do random, stratified, and convenience samples estimate
different things, even at the same n?

<details>
<summary>Answer</summary>

Because each strategy determines WHICH cases end up in the sample, and that selection process can
itself bias the estimate independent of sample size -- a convenience sample (e.g., "the last 40
requests I happened to have logs for") is not a random draw from the true population, so no amount
of increasing n fixes the bias baked into how the cases were chosen in the first place.

</details>

**Q8 (co-08 -- stratified sampling for rare modes).** Why does a rare failure mode need deliberate
oversampling plus reweighting, rather than just a bigger random sample?

<details>
<summary>Answer</summary>

Because a random sample draws cases from a rare stratum in roughly proportion to its tiny population
share -- at any feasible sample size, that stratum's own estimate would rest on too few cases to be
meaningful. Deliberately oversampling the rare stratum, then reweighting its contribution back down
to its true population share when computing the overall estimate, gets visibility on the rare mode
without distorting the overall number.

</details>

**Q9 (co-09 -- raw percent agreement overstates).** Why can two raters agreeing 85% of the time on a
skewed task have demonstrated almost nothing?

<details>
<summary>Answer</summary>

Because on a task where one label dominates (say, 80% of items are genuinely "pass"), two raters
could each independently guess "pass" most of the time and land near 85% raw agreement purely by
chance, without either rater doing any real discrimination between pass and fail. Raw agreement does
not subtract out how much agreement chance alone would produce.

</details>

**Q10 (co-10 -- chance-corrected agreement).** What does a chance-corrected agreement coefficient
actually compute?

<details>
<summary>Answer</summary>

`(observed agreement - chance-expected agreement) / (1 - chance-expected agreement)` -- it starts
from raw agreement, subtracts what chance alone would produce given each rater's own marginal label
distribution, then rescales so the result is 0 at chance-level agreement and 1 at perfect agreement.

</details>

**Q11 (co-11 -- choosing an agreement coefficient).** Name at least two factors that determine which
chance-corrected coefficient is the right one for a given agreement problem.

<details>
<summary>Answer</summary>

Rater count (two raters vs. more than two -- Cohen's kappa vs. Fleiss' kappa), and label type
(nominal vs. ordinal -- plain kappa vs. a weighted/ordinal variant that penalizes a near-miss less
than a wild miss). Missing data is a third factor -- Krippendorff's alpha handles incomplete rating
matrices that plain kappa cannot.

</details>

**Q12 (co-12 -- the prevalence problem).** Why can a chance-corrected coefficient behave badly when
one label dominates, and what's the fix?

<details>
<summary>Answer</summary>

When one label's prevalence is extreme (near 0% or 100%), the chance-expected agreement term is
already very high, which can shrink the coefficient toward zero or even negative even when raw
agreement is high and the raters are behaving sensibly -- a coefficient near zero on a 90%-prevalence
task does not necessarily mean the raters disagree badly. The fix is to always report label
prevalence alongside the coefficient, not to abandon chance correction.

</details>

**Q13 (co-13 -- agreement has an interval too).** Why does an agreement coefficient need its own
confidence interval, the same way a pass rate does?

<details>
<summary>Answer</summary>

Because a coefficient is itself computed from a finite sample of rated items -- it is an estimate of
an unknown true agreement level, subject to the same sampling error a pass rate is. Reporting a bare
kappa of 0.60 without an interval hides whether that 0.60 is a precise estimate or one that could
plausibly be anywhere from 0.30 to 0.85 on a small sample.

</details>

**Q14 (co-14 -- judge concordance).** Why is "does the judge agree with humans" framed as an
inter-rater-agreement problem, rather than as a simple accuracy question?

<details>
<summary>Answer</summary>

Because there is no single objective ground truth to score the judge's accuracy against -- both the
judge and the human are raters, each producing their own fallible read of an item, and the question
"do these two raters' verdicts agree, beyond what chance would produce" is exactly the
chance-corrected-agreement problem this topic already built the tools for.

</details>

**Q15 (co-15 -- concordance is per question).** Why must judge concordance be estimated separately
for each rubric criterion, rather than pooled into one "judge quality" number?

<details>
<summary>Answer</summary>

Because a judge's reliability genuinely differs by criterion -- an objective criterion like
correctness is far easier for a judge to assess consistently than a subjective one like tone, and
pooling both into one number would hide exactly the criterion where the judge should be trusted
least.

</details>

**Q16 (co-16 -- human ceiling).** What is the human-agreement ceiling, and why is a judge compared
against it rather than against perfect agreement?

<details>
<summary>Answer</summary>

The human-agreement ceiling is the chance-corrected agreement between two independent human raters
on the same items -- it is the best agreement level realistically achievable on a task, because even
two careful humans do not agree perfectly on a genuinely subjective criterion. Comparing a judge
against perfect agreement (kappa = 1.0) sets an unreachable bar; comparing it against the measured
human ceiling asks the fair question, "does the judge do about as well as a second human would?"

</details>

**Q17 (co-17 -- comparing two runs).** Why is "is B better than A" a hypothesis test, not a
comparison of two printed numbers?

<details>
<summary>Answer</summary>

Because both A's and B's pass rates are themselves noisy estimates -- a difference of a few points
between two runs could be the real effect of the change, or it could be sampling noise that would
vanish or reverse on a re-run. A hypothesis test asks specifically whether the observed gap is larger
than sampling noise alone would plausibly produce.

</details>

**Q18 (co-18 -- paired comparison).** Why is a paired test far more sensitive than treating two runs
as independent samples?

<details>
<summary>Answer</summary>

Because a paired test (like McNemar's) looks at how EACH SHARED CASE'S verdict changed from baseline
to candidate, which cancels out the variance that comes from item-to-item difficulty -- an unpaired
test throws that per-item information away and only compares two aggregate rates, which is much
noisier and needs a larger gap or a larger n to detect the same real effect.

</details>

**Q19 (co-19 -- significance vs. practical importance).** Give an example of how a statistically
detectable difference can still be too small to act on, and the reverse.

<details>
<summary>Answer</summary>

A huge eval set (n = 8000) can detect a genuinely real but tiny gap (0.85 vs. 0.862, p = 0.0015) that
is statistically significant yet falls below a team's stated materiality threshold and is not worth
shipping for. The reverse: a real, meaningful gap (0.70 vs. 0.78) can fail to reach significance on a
too-small eval set (n = 25, p = 0.71) purely from insufficient power, even though it would clearly
matter if properly measured -- the fix there is a larger n, computed via power analysis, not
concluding "no effect."

</details>

**Q20 (co-20 -- bootstrap resampling).** What problem does bootstrap resampling solve that a closed-
form formula cannot?

<details>
<summary>Answer</summary>

It approximates the sampling distribution of almost any statistic -- a median, a kappa coefficient,
a custom aggregate -- by resampling the observed data with replacement many times and recomputing the
statistic each time, which works even when no closed-form formula for that statistic's standard
error exists (as is the case for a median or for kappa).

</details>

**Q21 (co-21 -- multiple comparisons).** Why does testing many criteria at once manufacture apparent
wins, and what corrects for it?

<details>
<summary>Answer</summary>

Because each individual test carries some chance (typically 5%) of a false positive on its own, and
testing many criteria multiplies that chance across the whole batch -- with enough criteria tested,
finding at least one "significant" result by pure luck becomes likely even when nothing real changed
anywhere. Corrections like Bonferroni or Benjamini-Hochberg adjust the significance threshold to
account for how many tests were run.

</details>

**Q22 (co-22 -- noise floor of a suite).** What is a suite's noise floor, and why does it set a floor
below which no regression bar can sit?

<details>
<summary>Answer</summary>

The noise floor is the spread you would observe just from re-running an UNCHANGED, stochastic system
repeatedly -- some amount of run-to-run variation exists even with zero real change. A regression bar
smaller than this measured noise floor would flag ordinary noise as a regression on every run,
producing false alarms regardless of whether anything actually changed.

</details>

**Q23 (co-23 -- variance from stochastic generation).** How does generation variance differ from
case-sampling variance, and why does separating them matter?

<details>
<summary>Answer</summary>

Generation variance comes from re-running the SAME fixed cases and getting a different outcome each
time (the system's own stochastic behavior); case-sampling variance comes from drawing a DIFFERENT
set of cases from the same population each time. They are measured by holding the other source fixed
in turn, and separating them matters because they suggest different fixes -- high generation variance
points at the system's own instability, high case-sampling variance points at needing a bigger or
more representative eval set.

</details>

**Q24 (co-24 -- reporting honestly).** What four things must a reportable statistical unit always
carry together?

<details>
<summary>Answer</summary>

The estimate, its interval, the sample size (n), and the method used to compute it. Any of the four
missing turns a defensible statistic back into an unreportable bare number -- this is the single
discipline every worked example and the whole capstone report in this topic enforces without
exception.

</details>

## Applied problems

Eight scenarios spanning the whole topic. Each describes a realistic situation without naming the
specific concept -- decide what applies and why, then check your reasoning against the worked
solution. Every scenario below is invented for this drill and does not reuse any function, fixture,
or domain from the 46 worked examples or the capstone.

**AP1.** A team reports "our judge agrees with human raters 88% of the time" on a safety-pass
criterion where 92% of real items are labeled "pass." A stakeholder is impressed. Should they be?

<details>
<summary>Worked solution</summary>

No -- with 92% prevalence, a judge that always outputs "pass" regardless of the actual item would
already agree with human raters roughly 92% of the time, MORE than the reported 88%. Raw percent
agreement on a skewed task overstates how much real discrimination is happening (co-09); the team
needs to report a chance-corrected coefficient (co-10) alongside the prevalence (co-12), not the raw
agreement rate alone.

</details>

**AP2.** An engineer runs a candidate prompt against a baseline once each on 30 held-out cases,
observes 76.7% vs. 63.3%, and ships the candidate the same afternoon based on that single
comparison. What's missing before this comparison is trustworthy?

<details>
<summary>Worked solution</summary>

A significance test, not just two printed numbers (co-17) -- at n = 30, a gap this size could easily
be sampling noise rather than a real effect, and if the same 30 cases were used for both runs
(paired), a paired test like McNemar's (co-18) would be both more appropriate and more sensitive
than treating the two runs as unrelated samples.

</details>

**AP3.** A team tests 15 separate rubric criteria after a prompt change, finds exactly one criterion
with p = 0.041, and ships the change citing that one significant improvement. What's the flaw in this
reasoning?

<details>
<summary>Worked solution</summary>

Testing 15 criteria at once (co-21) makes finding at least one nominally significant result by pure
chance likely, even if nothing real changed on any criterion. The team needs a multiple-comparisons
correction (Bonferroni or Benjamini-Hochberg) applied across all 15 tests before trusting that one
"win" -- an uncorrected p = 0.041 out of 15 tests is exactly the kind of phantom result correction is
designed to catch.

</details>

**AP4.** A judge's concordance with human raters is reported as kappa = 0.55 for BOTH a
"factual-correctness" criterion and a "helpfulness-tone" criterion, and a team concludes the judge is
"moderately reliable overall." What's wrong with pooling the two this way?

<details>
<summary>Worked solution</summary>

Concordance must be estimated per criterion, never pooled (co-15) -- even if the two numbers happen
to coincide at 0.55, the underlying reliability, sample sizes, human ceilings, and confidence
intervals for "factual-correctness" and "helpfulness-tone" could look completely different on
inspection. A single "0.55 overall" number could paper over one criterion where the judge is
excellent and another where it is barely above chance.

</details>

**AP5.** An eval set contains 500 cases overall, but a specific edge-case failure mode of interest
occurs in only about 2% of real traffic. A random 100-case sample from the full population is drawn
to evaluate a candidate, and the edge case appears in exactly 2 of the 100 sampled cases. Is this
sample adequate to say anything about the candidate's behavior on that edge case?

<details>
<summary>Worked solution</summary>

No -- 2 cases is far too few to support any claim about that stratum's own pass rate (co-08). This is
exactly the case for deliberate stratified oversampling: draw a fixed minimum number of cases FROM
that rare stratum specifically (say, 40-60), evaluate the candidate on those, then reweight that
stratum's own estimate back down to its true 2% population share when computing any OVERALL rate --
naive random sampling at any feasible total n leaves the rare stratum invisible.

</details>

**AP6.** A team measures their eval suite's pass rate on the SAME unchanged candidate, five separate
times, over a week, and gets 0.81, 0.84, 0.79, 0.83, 0.80 -- a spread of 5 points with zero code
changes. A junior engineer asks whether the eval suite is broken. Is it?

<details>
<summary>Worked solution</summary>

Not necessarily broken -- this spread could simply be the suite's own measured noise floor (co-22),
the expected variation from re-running a stochastic system unchanged. The team should decompose that
5-point spread into its generation-variance and case-sampling-variance components (co-23) if the eval
set itself also varies between runs, derive a regression bar from the measured spread, and only then
judge whether a future candidate's gap against baseline clears that bar or falls inside ordinary
noise.

</details>

**AP7.** A report states: "the candidate's pass rate improved from the baseline." No numbers,
intervals, sample sizes, or methods are given anywhere in the two-page document. A reviewer is asked
to approve the ship decision based on this report. What should the reviewer require before signing
off?

<details>
<summary>Worked solution</summary>

Every claim in the report needs its estimate, interval, n, and method (co-24) -- "improved" with no
supporting numbers is not a reportable claim at all under this topic's discipline. The reviewer
should require, at minimum: the baseline and candidate point estimates with intervals, the sample
size the comparison rests on, whether the comparison was paired, the test used and its p-value (or
corrected p-value, if multiple criteria were tested), and whether the gap clears a stated materiality
threshold -- not just statistical significance.

</details>

**AP8.** An LLM judge scores a candidate's outputs against a rubric with n = 12 items only, because
that's all the human-labeled data the team has budget for this sprint. The reported kappa is 0.71
with no interval. A stakeholder asks whether 0.71 is "good." How should the team respond?

<details>
<summary>Worked solution</summary>

The honest response is to compute and report the interval before answering "is it good" at all
(co-13) -- at n = 12, a bootstrap or exact interval around kappa = 0.71 will likely be very wide (the
point estimate could plausibly reflect a true kappa anywhere from moderate to near-perfect
agreement), and the team should say so rather than presenting 0.71 as a precise measurement. There is
also no universal threshold for "good" kappa (this topic teaches the verbal scales as convention, not
finding) -- the right response names both the interval's width and that any threshold needs
justifying against the decision's own stakes, not a borrowed rule of thumb.

</details>

## Code katas

Five self-contained exercises. Every kata runs on hand-constructed, in-memory data using only the
Python 3.13 standard library -- no live model call, no network, and no dependency on this topic's own
worked-example or capstone files, so every kata is runnable anywhere Python 3.13 with `pytest` is
installed. (`math` and `statistics` are standard-library-only; no pinned statistical package is
required for any kata below.)

### Kata 1 -- A confidence interval on a proportion, from scratch

Write `normal_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]` that returns
the normal-approximation 95% confidence interval on a proportion, using only `math`. Construct three
cases of your own -- one with `n = 200` and a rate near 0.5, one with `n = 15` and a rate near 0.5,
one with `n = 15` and a rate near 0.05 -- and confirm the small-n, extreme-rate case's interval
either extends outside `[0, 1]` or comes uncomfortably close to it, demonstrating the exact failure
mode co-05 names (Wilson or Clopper-Pearson would not have this problem).

### Kata 2 -- Cohen's kappa, from its definition

Write `cohen_kappa(rater_a: list[str], rater_b: list[str]) -> float` implementing
`(observed - chance) / (1 - chance)` directly, with no library import. Construct three label-pair
fixtures of your own (each at least 20 items): one where the two raters agree perfectly, one where
they agree exactly at chance level given their own marginal label rates (deliberately construct
this), and one skewed fixture (90%+ one label) where raw agreement is high but your computed kappa is
noticeably lower. Confirm your kappa is 1.0, approximately 0.0, and clearly below the raw agreement
rate, respectively (co-09, co-10).

### Kata 3 -- McNemar's test, from its 2x2 table

Write `mcnemar_statistic(both_pass: int, baseline_only: int, candidate_only: int, both_fail: int) ->
float` computing the (continuity-corrected) chi-squared statistic
`(|baseline_only - candidate_only| - 1) ** 2 / (baseline_only + candidate_only)`. Construct two
paired fixtures of your own: one with a large discordant-pair imbalance (e.g., 2 baseline-only vs. 18
candidate-only) and one with a small, balanced imbalance (e.g., 9 vs. 11). Confirm the first
fixture's statistic is clearly larger than the second's, and explain in one sentence why the RAW pass
rates of the two fixtures could look identical while their McNemar statistics differ sharply (co-18).

### Kata 4 -- A minimal bootstrap confidence interval

Write `bootstrap_ci(data: list[float], statistic: Callable[[list[float]], float], n_resamples: int =
1000, seed: int = 0) -> tuple[float, float]` that resamples `data` with replacement `n_resamples`
times, computes `statistic` on each resample, and returns the 2.5th and 97.5th percentiles using only
`random` and `statistics`. Test it on a hand-constructed list of 20 numbers using `statistics.median`
as the statistic, and confirm the returned interval brackets the sample's own median (co-20).

### Kata 5 -- Bonferroni correction, applied by hand

Write `bonferroni_reject(pvalues: list[float], alpha: float = 0.05) -> list[bool]` that rejects the
null hypothesis for test `i` only if `pvalues[i] < alpha / len(pvalues)`. Construct a list of 5
p-values of your own where exactly one value would be "significant" under an uncorrected `alpha =
0.05` threshold but that same value does NOT survive your Bonferroni correction (i.e., pick a
p-value between `alpha / 5` and `alpha`). Confirm your function returns `[False, False, False, False,
False]` for that list, demonstrating co-21's exact failure mode.

## Self-check checklist

Confirm each item without checking the learning track first. If you hesitate, that concept needs
another pass.

- [ ] I can explain why a point estimate without an interval invites an unsupportable decision.
      (co-01)
- [ ] I can explain why an eval pass rate is a sample proportion, not a fixed fact. (co-02)
- [ ] I can explain what sampling error is and why it is expected, not a bug. (co-03)
- [ ] I can state what a confidence interval on a rate actually expresses. (co-04)
- [ ] I can name the small-n interval methods and why the normal approximation fails at small n or
      near 0/1. (co-05)
- [ ] I can state what a required sample size follows from. (co-06)
- [ ] I can explain why random, stratified, and convenience sampling estimate different things at
      the same n. (co-07)
- [ ] I can explain why a rare failure mode needs deliberate oversampling plus reweighting. (co-08)
- [ ] I can explain why raw percent agreement overstates agreement on a skewed task. (co-09)
- [ ] I can write out the chance-corrected agreement formula from memory. (co-10)
- [ ] I can name at least two factors that determine the right agreement coefficient to use. (co-11)
- [ ] I can explain the prevalence problem and its fix. (co-12)
- [ ] I can explain why an agreement coefficient needs its own confidence interval. (co-13)
- [ ] I can explain why judge concordance is an inter-rater-agreement problem, not an accuracy
      question. (co-14)
- [ ] I can explain why concordance must be estimated per criterion, never pooled. (co-15)
- [ ] I can explain the human-agreement ceiling and why a judge is compared against it, not against
      perfect agreement. (co-16)
- [ ] I can explain why "is B better than A" is a hypothesis test, not a number comparison. (co-17)
- [ ] I can explain why a paired test is more sensitive than an unpaired one. (co-18)
- [ ] I can give an example of significance without importance, and importance without
      significance. (co-19)
- [ ] I can explain what problem bootstrap resampling solves. (co-20)
- [ ] I can explain why testing many criteria at once manufactures apparent wins, and name a
      correction. (co-21)
- [ ] I can explain what a suite's noise floor is and why it bounds any regression bar. (co-22)
- [ ] I can explain the difference between generation variance and case-sampling variance. (co-23)
- [ ] I can name the four things a reportable statistical unit must always carry together. (co-24)

## Elaborative interrogation & self-explanation

Six prompts that ask you to explain WHY, connecting two or more concepts, rather than recall a
single fact. Write your own answer before checking the discussion.

**E1.** Chance-corrected agreement (co-10) and the prevalence problem (co-12) can pull in opposite
directions on the same dataset -- correcting for chance can make a coefficient LOOK worse on a
skewed task even when raters are behaving identically to how they would on a balanced task. Why does
this topic insist on reporting prevalence alongside the coefficient, rather than choosing a
different coefficient that avoids the effect entirely?

<details>
<summary>Discussion</summary>

Because there is no coefficient that is both chance-corrected AND immune to prevalence's effect on
its own scale -- the prevalence sensitivity is a mathematical consequence of correcting for chance in
the first place, not a flaw specific to one formula. Reporting prevalence alongside the coefficient
lets a reader interpret a low kappa correctly: "the coefficient is low partly because the label
distribution is skewed, not necessarily because the raters disagree badly" -- context the number
cannot carry by itself.

</details>

**E2.** Both co-16 (human ceiling) and co-19 (significance vs. importance) involve comparing a
measured number against a REFERENCE point rather than against an absolute standard. What's the
structural similarity between "compare the judge against the measured human ceiling, not perfect
agreement" and "compare a gap against a materiality threshold, not just statistical significance"?

<details>
<summary>Discussion</summary>

Both replace an unreachable or arbitrary absolute bar (perfect agreement; "any nonzero effect
matters") with a bar DERIVED from the actual system or decision at hand (what two humans actually
achieve; what this team has stated is worth acting on). In both cases, the absolute bar would set an
unrealistic or irrelevant standard, while the derived bar answers the question that actually matters
for the decision being made.

</details>

**E3.** This topic teaches computing every named statistic TWICE -- once from its definition in
plain Python, once via the pinned library -- and verifying the two agree. Why is that discipline
worth the extra code, rather than simply trusting the library?

<details>
<summary>Discussion</summary>

Computing from definition first forces genuine understanding of what the statistic IS, not just
which function call produces it -- a reader who only ever calls `cohen_kappa_score` never sees why it
subtracts a chance term. Verifying the two agree also catches a real class of error: passing
arguments in the wrong order, using the wrong variant of a coefficient, or misreading a library's
own default parameter (as this topic's References flag for `proportion_confint`'s default
method) -- errors that would otherwise silently produce a plausible-looking but wrong number.

</details>

**E4.** Co-18 (paired comparison) and co-21 (multiple comparisons) both involve running MORE than
one statistical test around the same decision, yet one increases sensitivity (pairing) while the
other increases the risk of a false positive (testing many criteria). Why do these two facts not
contradict each other?

<details>
<summary>Discussion</summary>

Pairing is about HOW a single comparison is structured (using per-item information to cancel
noise), while the multiple-comparisons problem is about HOW MANY separate comparisons are being
tested at once (each one carrying its own chance of a false positive). A single paired test on one
criterion is more sensitive than an unpaired test on that same criterion; running that same paired
test independently across fifteen criteria still needs a correction, because pairing improves each
individual test's power without changing how many independent chances at a false positive the batch
of fifteen tests creates.

</details>

**E5.** Co-08 (stratified sampling for rare modes) and co-22/co-23 (noise floor decomposition) both
involve deliberately separating a population or a variance into named components rather than
treating it as one undifferentiated whole. What failure does this "decompose first" instinct guard
against in both cases?

<details>
<summary>Discussion</summary>

In both cases, treating the whole as undifferentiated hides a component that matters. A single
overall sample size can be adequate for the dominant stratum while leaving a rare, high-stakes
stratum invisible; a single overall noise-floor number can hide whether the spread comes mostly from
the system's own stochastic generation (suggesting the system itself needs attention) or from which
cases happened to get sampled (suggesting the eval set needs attention). Decomposing first is what
lets the right fix be identified, rather than a generic "collect more data" response applied to a
problem that a bigger sample alone would not actually solve.

</details>

**E6.** This topic's own scope guard states that a technique earns a place here only if
`evaluating-ai-systems-in-depth` cannot be taught honestly without it, explicitly excluding
regression, causal inference, and product-experiment design even though those share machinery
(proportions, intervals, significance tests) with what this topic DOES teach. Why is scoping by "does
this change an eval decision" the right boundary, rather than scoping by "is this a statistics
technique used in evaluation work broadly"?

<details>
<summary>Discussion</summary>

Scoping by shared machinery would make this topic balloon into a general statistics course with no
natural stopping point -- nearly any statistical technique COULD conceivably touch an eval pipeline
somewhere. Scoping by "does this change whether an eval result can be trusted" keeps every technique
here directly load-bearing for the one decision this topic exists to support, and cleanly hands off
techniques that answer a genuinely different question (did a product change move a business metric)
to `analytics-and-experimentation`, which shares the machinery but not the purpose.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md)
