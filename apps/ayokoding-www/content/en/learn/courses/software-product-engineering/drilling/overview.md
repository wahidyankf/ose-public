---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Software Product Engineering topic: recall
first, then applied judgment, then hands-on artifact repair, then a checklist to confirm real
automaticity, and finally why/why-not prompts that test whether you can explain the reasoning, not
just produce the artifact. Every answer is hidden in a `<details>` block; try each item yourself
before opening it.

This topic has no runnable interpreter -- every drill below is a decision-artifact repair drill
instead of a code fix, verified the same observable-property way this topic's worked scenarios were
verified (an arithmetic recomputation, a claim matched against a stated rule, a name present in
both a diagram and its prose), not by running anything. Every scenario or artifact below is
self-contained and illustrative -- Kestrel is a fictional product, and no quoted number or
interview finding is a real transcript.

## Recall Q&A

Twenty-six short-answer questions, one per concept (`co-01` through `co-26`). Answer from memory,
then check.

**Q1 (co-01 -- outcome-vs-output).** What test distinguishes an outcome statement from an output
statement, and why does the distinction matter for a roadmap review?

<details>
<summary>Answer</summary>

Remove every feature noun from the statement -- if a testable behavior claim still stands (a
change in what a user _does_), it's outcome-framed; if nothing is left, it was only ever an output
claim. The distinction matters because a roadmap full of shipped features says nothing about
whether the business or the user is actually better off.

</details>

**Q2 (co-02 -- problem-before-solution).** What three things does a well-formed problem statement
name, and what must it deliberately withhold?

<details>
<summary>Answer</summary>

The user, the circumstance, and the desired outcome. It deliberately withholds the solution, so
the space of possible answers stays open for whoever reads it next, not just the person who wrote
it.

</details>

**Q3 (co-03 -- jobs-to-be-done).** What's the unit of analysis in Jobs-to-be-Done, and what three
elements does a well-formed job story contain?

<details>
<summary>Answer</summary>

The circumstance/job the customer is making progress against -- not their demographic profile. A
job story names the circumstance ("when **_"), the motivation ("I want to_**"), and the expected
progress ("so I can \_\_\_").

</details>

**Q4 (co-04 -- customer-discovery-interviewing).** What's the core rule of the Mom Test, and why do
direct "would you use X?" questions fail it?

<details>
<summary>Answer</summary>

Ask about a person's real past behavior and specifics; never pitch the idea or ask them to predict
the future. "Would you use X?" fails because it costs the respondent nothing to say a kind,
non-committal "yes" -- that answer predicts nothing about real adoption.

</details>

**Q5 (co-05 -- continuous-discovery-opportunity-solution-tree).** What four layers does an
opportunity-solution tree have, and what test tells you a solution is orphaned?

<details>
<summary>Answer</summary>

Outcome, opportunities, solutions, and assumption tests. A solution is orphaned if it doesn't trace
upward through exactly one opportunity to the stated outcome.

</details>

**Q6 (co-06 -- riskiest-assumption-and-four-big-risks).** Name the four big risks, and state the
discipline for choosing which one to test first.

<details>
<summary>Answer</summary>

Value, usability, feasibility, and business-viability risk. The discipline: test the _riskiest_ --
most uncertain -- of the four most cheaply first, not the risk the team happens to be most
comfortable estimating (often feasibility).

</details>

**Q7 (co-07 -- rice-prioritization).** State the RICE formula and the four units a well-formed
score must state.

<details>
<summary>Answer</summary>

`(Reach × Impact × Confidence) ÷ Effort`. Reach: a count over a stated time window. Impact: a
discrete scale (this topic uses Intercom's 3/2/1/0.5/0.25). Confidence: a percentage. Effort:
person-months.

</details>

**Q8 (co-08 -- moscow-prioritization).** What does "Won't" mean in MoSCoW, and what's the risk of
misreading it?

<details>
<summary>Answer</summary>

"Not this timebox" -- not a permanent rejection. Misreading it as "never" can make a contributor
whose idea landed in "Won't" feel rejected outright and disengage from bringing future ideas
forward.

</details>

**Q9 (co-09 -- impact-effort-matrix).** What's the impact-effort matrix good for, and what's its
limitation compared to RICE?

<details>
<summary>Answer</summary>

A fast, five-minute first-pass triage across many candidate items to surface quick wins. Its
limitation: it's a coarse folk tool with no scored comparability -- it can't distinguish finely
between two items that land in the same quadrant the way a RICE score can.

</details>

**Q10 (co-10 -- kano-model).** Name the three practically load-bearing Kano categories this topic
teaches and each one's presence-vs-satisfaction shape.

<details>
<summary>Answer</summary>

Must-be (absence dissatisfies severely; presence is merely neutral), performance (linear: more is
steadily better, less is steadily worse), and attractive (presence delights; absence causes no
dissatisfaction, since it was never expected).

</details>

**Q11 (co-11 -- cost-of-delay-and-wsjf).** State the WSJF formula, and explain why it can rank a
short, urgent job ahead of a longer job with a bigger absolute payoff.

<details>
<summary>Answer</summary>

`WSJF = Cost of Delay ÷ Duration`. It ranks by value delivered _per unit of time the team is
committed to it_, not by absolute payoff alone -- a short job with the same or lower Cost of Delay
as a long job returns that value with far less time tied up.

</details>

**Q12 (co-12 -- mvp-as-hypothesis-test).** What does "minimum" qualify in an MVP, and give an
example of an MVP that isn't shippable code at all.

<details>
<summary>Answer</summary>

It qualifies the _hypothesis under test_ -- the learning bet -- not the smallest version of the
final shippable product. A concierge service or a landing page with a waitlist can be a valid MVP
even though neither is real, working code.

</details>

**Q13 (co-13 -- build-measure-learn-pivot-or-persevere).** What's the unit of progress in
Build-Measure-Learn, and what two decisions can follow a measurement?

<details>
<summary>Answer</summary>

Validated learning, not features shipped. A measurement leads to either pivot (change direction)
or persevere (double down) -- and, as Worked Scenario 17 shows, different parts of the same bet can
receive different verdicts.

</details>

**Q14 (co-14 -- iterative-incremental-delivery).** What two properties must a delivery increment
have to count as a real slice, rather than an arbitrary fragment of one big release?

<details>
<summary>Answer</summary>

It ships independently useful value on its own, and it returns a signal distinct from every other
slice's signal.

</details>

**Q15 (co-15 -- ab-experimentation-hypothesis-and-guardrail).** What three things must a
trustworthy A/B experiment design name?

<details>
<summary>Answer</summary>

Exactly one hypothesis, exactly one primary (OEC) metric, and at least one guardrail metric
distinct from the primary.

</details>

**Q16 (co-16 -- feature-flag-toggle-taxonomy).** Name the four feature-flag toggle categories and
their expected lifespan pattern.

<details>
<summary>Answer</summary>

Release (short-lived, removed after full rollout), experiment (short-lived, removed after the
experiment concludes), ops (long-lived, an operational kill switch), and permission (long-lived,
tied to a customer entitlement).

</details>

**Q17 (co-17 -- north-star-and-input-metrics).** How does a north-star metric differ from an OMTM?

<details>
<summary>Answer</summary>

A north-star is durable and doesn't rotate as the team's focus changes -- it stays the company's
single measure of delivered value. An OMTM (One Metric That Matters) is deliberately stage-specific
and temporary, rotating as the team's current focus shifts.

</details>

**Q18 (co-18 -- aarrr-funnel).** Name the five AARRR stages in order, and state the practical value
of mapping a product onto them.

<details>
<summary>Answer</summary>

Acquisition, Activation, Retention, Referral, Revenue. The practical value: it locates exactly
where a product's funnel is leaking, so the fix targets the right stage instead of a vague "growth
is slow."

</details>

**Q19 (co-19 -- heart-framework).** What is the Goals -> Signals -> Metrics chain for, and what
failure does it help prevent?

<details>
<summary>Answer</summary>

It ties a chosen metric back to a stated product goal via an observable signal, rather than a
metric being picked because it's easy to chart. This helps prevent Goodharting (co-22): a metric
with no goal behind it invites gaming the first time it's inconvenient.

</details>

**Q20 (co-20 -- activation-and-retention).** Why can't "logged in once" be a valid activation
definition?

<details>
<summary>Answer</summary>

It doesn't represent a first _genuine value_ moment -- a login costs the user almost nothing and
doesn't correspond to the product actually replacing whatever process it's meant to replace. A
valid activation definition needs to be precise and falsifiable, tied to real delivered value.

</details>

**Q21 (co-21 -- vanity-vs-actionable-metrics).** What test distinguishes an actionable metric from
a vanity metric?

<details>
<summary>Answer</summary>

A stated change in an actionable metric would trigger a specific, named decision. A vanity metric
is one where no plausible change in its value would change what the team does next.

</details>

**Q22 (co-22 -- goodhart-metric-gaming).** State Goodhart's Law in Strathern's phrasing, and name
the fix this topic teaches.

<details>
<summary>Answer</summary>

"When a measure becomes a target, it ceases to be a good measure." The fix: pair every target
metric with a guardrail metric and ongoing judgment, rather than optimizing the target metric
blindly.

</details>

**Q23 (co-23 -- writing-specs-and-pr-faq).** What's the point of writing the press release before
building the feature it describes?

<details>
<summary>Answer</summary>

It forces early, cheap clarity on customer value -- a weak or unclear value proposition becomes
obvious while writing a compelling announcement is still hard, which is far cheaper to discover
before the build than after it.

</details>

**Q24 (co-24 -- dual-track-discovery-and-delivery).** What anti-pattern does "dual-track discovery
and delivery" guard against?

<details>
<summary>Answer</summary>

Splitting into a separate "discovery team" and "delivery team," where one group hands pre-decided
requirements to another. The guard: one continuous, cross-functional team performs both discovery
and delivery at once.

</details>

**Q25 (co-25 -- shaping-and-appetite).** What does "appetite" mean in Shape Up, and what's a
circuit-breaker for?

<details>
<summary>Answer</summary>

Appetite is a fixed time budget set _before_ the problem is shaped -- not an estimate derived from
the scope. A circuit-breaker is a pre-agreed fallback: what happens if the work isn't done when the
appetite runs out, so unfinished work stops on schedule instead of silently overrunning.

</details>

**Q26 (co-26 -- engineer-product-design-collaboration).** Give a concrete example from this topic of
an engineer's feasibility input changing what got built, not just how long it took.

<details>
<summary>Answer</summary>

Worked Scenario 16's greedy-scheduler alternative -- instead of a 6-week ML pipeline, an engineer
proposed a 1-week rule-based scheduler capturing roughly 80% of the demonstrated value. This
changed the _shape_ of the MVP, not merely its timeline.

</details>

## Applied scenarios

Sixteen scenarios. Each is self-contained -- everything you need is in the prompt itself, no other
page required. Decide which concept and which move applies, then check.

**AS1.** A dashboard summary says "We shipped 14 features this quarter." A board member asks "so
what?" What single follow-up question exposes whether this is output or outcome, and what would a
good answer sound like?

<details>
<summary>Answer</summary>

"What changed in what customers actually do because of them?" A good answer names a measured
behavior change (co-01) -- a bad one restates the feature list, which is exactly the output framing
the question is meant to expose.

</details>

**AS2.** A support-escalated request reads: "Build a Slack integration for shift alerts." Write a
one-sentence check for whether this request has smuggled in a solution.

<details>
<summary>Answer</summary>

Check for a named channel or technology in the "problem" statement -- "Slack" is present, so a
solution has already been chosen (co-02). The real, unwritten problem is probably closer to
"employees don't reliably see time-sensitive shift alerts," which admits far more possible
solutions than Slack alone.

</details>

**AS3.** Two managers ask for the same "bulk shift edit" feature. One runs a 5-person cafe, one
runs a 40-person warehouse. Why might a single JTBD-based job story still serve both, where a
persona split by company size might not?

<details>
<summary>Answer</summary>

JTBD's unit of analysis is the circumstance, not headcount or role (co-03). If both managers hit
the same circumstance -- rebuilding an entire week's schedule after a big change -- the same job
story applies regardless of company size; a persona-by-headcount approach could easily miss that
shared circumstance.

</details>

**AS4.** A team runs 20 discovery interviews, but every question was phrased "what would you like
to see in a scheduling app?" What's the compounding problem here, tying together two concepts?

<details>
<summary>Answer</summary>

This is a Mom Test violation (co-04) -- asking for a wishlist, not real past behavior. The
compounding cost: any opportunity-solution tree (co-05) built from these answers now rests on
unvalidated wishes rather than real, evidenced opportunities.

</details>

**AS5.** A team is about to spend three sprints building an ML fraud-detection layer for
shift-swap approvals before confirming anyone wants automated approval at all. Which risk are they
skipping, and what's the fix?

<details>
<summary>Answer</summary>

They're skipping value risk in favor of jumping straight to feasibility (co-06) -- the risk
engineers are usually most comfortable estimating. The fix: concierge-test the value question
first, cheaply, before committing real ML engineering time.

</details>

**AS6.** A backlog of three items all cluster in the same "quick win" quadrant on an impact-effort
chart. What should the team do next, and why can't the chart alone decide the final order?

<details>
<summary>Answer</summary>

RICE-score the three tied items for a finer-grained, comparable ranking (co-07, co-09). The 2x2 is
a coarse, five-minute triage tool -- it can distinguish quadrants but not fine differences within
one quadrant.

</details>

**AS7.** A team spends a full sprint polishing "app never crashes" from 99.9% to 99.99% uptime,
expecting a satisfaction boost. What Kano mistake did they make?

<details>
<summary>Answer</summary>

They treated a must-be feature as if it were a performance feature (co-10). Past the "meets the
expected bar" threshold, further investment in a must-be feature returns almost nothing in
satisfaction -- that same sprint spent on a performance or attractive feature would likely have
paid off more.

</details>

**AS8.** Two jobs both have a Cost of Delay of 20. Job A takes 1 week; Job B takes 4 weeks. Which
does WSJF rank first, and why?

<details>
<summary>Answer</summary>

Job A: `WSJF = 20 ÷ 1 = 20`, versus Job B's `20 ÷ 4 = 5` (co-11). Same absolute urgency, but Job A
delivers that value while tying up the team for far less time.

</details>

**AS9.** A team ships a "minimum" feature that's actually a fully-polished, production-grade v1,
taking four months, before testing any hypothesis. What's the MVP violation, and what should have
happened instead?

<details>
<summary>Answer</summary>

"Minimum" should have qualified the hypothesis under test, not the finished product (co-12). A
cheaper, faster test -- possibly not even shippable code -- should have preceded the four-month
build to confirm the underlying bet before spending that much time on it.

</details>

**AS10.** A team plans one big-bang release combining five unrelated features, arguing "it's more
efficient to ship them together." What does this destroy, and why does it matter?

<details>
<summary>Answer</summary>

It destroys distinct signals per feature (co-14). If the combined release underperforms, the team
has no way to attribute that result to any one of the five features -- unlike thin, independent
slices, which each would have returned their own interpretable signal.

</details>

**AS11.** An experiment ships with three "primary" metrics: signups, session length, and NPS. Two
improve; one regresses. What's broken, and what should the team have decided beforehand?

<details>
<summary>Answer</summary>

This violates the "exactly one OEC" rule (co-15). The team should have picked one primary metric in
advance and treated the other two as secondary or guardrail metrics, with an explicit rule for
which one wins if they disagree -- decided before the results came in, not after.

</details>

**AS12.** An engineer wants to delete an old `legacy_billing_rollback` flag because "it's been in
the code for two years, must be dead." What should they check first?

<details>
<summary>Answer</summary>

Check its toggle category (co-16) before deleting anything. If it's an ops-category kill switch, a
long lifespan is by design, not evidence it's dead -- verify actual current usage and a named owner
before removing it.

</details>

**AS13.** A north-star metric ("weekly active teams") has been flat for two quarters while every
input metric the team tracks is trending up. What should the team suspect?

<details>
<summary>Answer</summary>

Suspect Goodharting on the input metrics (co-22) -- the levers are being optimized in a way that no
longer actually rolls up into the north-star, or the Goals -> Signals -> Metrics chain (co-19) tying
those inputs back to real value has quietly broken.

</details>

**AS14.** A product's Acquisition and Activation numbers are both healthy, but Retention drops off
a cliff in week 3. Where should the team focus, and where should they explicitly _not_ focus?

<details>
<summary>Answer</summary>

Focus on week-2/week-3 retention drivers -- precisely defining and investigating what changes for a
user right before they drop off (co-20). Don't focus on the signup funnel or the activation flow
(co-18); both AARRR stages before retention are already confirmed healthy, so effort there is
misplaced.

</details>

**AS15.** A team wants to ship a risky, expensive-to-reverse pricing change with "we're pretty sure
it'll be fine" as the only documented reasoning. Name two techniques from this topic that would
force sharper thinking before the change ships.

<details>
<summary>Answer</summary>

A PR-FAQ (co-23), which forces stating the customer problem and answering the hardest objections
before a single line ships; and a Shape Up pitch with a stated appetite and circuit-breaker
(co-25), which forces naming a concrete fallback instead of an open-ended "we'll figure it out"
commitment.

</details>

**AS16.** A "discovery team" hands a fully-specified spec to a separate "delivery team," with no
engineer present for any of the interviews. Name the two things most likely to go wrong.

<details>
<summary>Answer</summary>

This violates dual-track discovery and delivery (co-24) -- a hand-off between two teams instead of
one continuous cross-functional team -- and it denies engineers early feasibility input (co-26).
The delivery team ends up as order-takers, and any cheaper, feasible alternative an engineer might
have surfaced early (as in Worked Scenario 16) never gets the chance to change the spec.

</details>

## Artifact recreation drills

Eight before/after decision-artifact repair drills. Each gives a flawed, self-contained mocked
artifact -- spot and fix the flaw yourself, then compare against the "after" version and its
root-cause explanation.

### Drill 1 -- a feature ticket with no outcome

**Before**: "Add a bulk shift-copy feature so managers can duplicate last week's schedule in one
click."

<details>
<summary>Model fix and root cause</summary>

**After**: "Managers who run the same weekly shift pattern build next week's full schedule in
under 2 minutes, instead of re-entering every shift by hand."

**Root cause**: the "before" version states a feature, not an outcome -- co-01 requires a testable
behavior claim (time saved, effort avoided) to survive after every feature noun is removed. The
"before" ticket, stripped of "bulk shift-copy," leaves nothing behind.

</details>

### Drill 2 -- a RICE score with an arithmetic error

**Before**: "Reach = 200 users/quarter, Impact = 2 (high), Confidence = 50%, Effort = 4
person-months. RICE score: 200."

<details>
<summary>Model fix and root cause</summary>

**After**: RICE = (200 × 2 × 0.5) ÷ 4 = 200 ÷ 4 = **50**, not 200.

**Root cause**: co-07 requires the arithmetic to actually equal `(Reach × Impact × Confidence) ÷
Effort` -- the "before" version appears to have skipped the division by Effort entirely, silently
inflating the score fourfold.

</details>

### Drill 3 -- a "Won't" reworded as a permanent rejection

**Before**: a PM tells an engineer, "We're never doing SSO -- it's in the Won't bucket."

<details>
<summary>Model fix and root cause</summary>

**After**: "SSO is a Won't for this release -- not this timebox, not permanently rejected. It's
back on the table at the next quarterly planning cycle."

**Root cause**: co-08 requires "Won't" to be explicitly scoped to the current release, not implied
or stated as a permanent verdict. The "before" phrasing risks the engineer disengaging from an idea
that was only ever deferred, not killed.

</details>

### Drill 4 -- a WSJF sequence that ignores duration

**Before**: "Job A has the highest Cost of Delay (40), so it goes first. Job B (Cost of Delay 30)
goes second."

<details>
<summary>Model fix and root cause</summary>

**After**: without each job's Duration, no WSJF sequencing is possible at all -- co-11 requires the
_ratio_ `Cost of Delay ÷ Duration`, not raw Cost of Delay alone. If Job A takes 8 weeks (WSJF = 5)
and Job B takes 2 weeks (WSJF = 15), Job B actually sequences first despite its lower Cost of
Delay.

**Root cause**: sequencing by Cost of Delay alone (ignoring Duration) is exactly the mistake WSJF
is designed to correct -- it silently favors big, slow jobs over quick, almost-as-urgent ones.

</details>

### Drill 5 -- an "MVP" that's a full production build

**Before**: "Our MVP for the loyalty-points feature: a fully designed, three-tier points system
with a redemption catalog, fraud detection, and a partner-integration API, shipping in four
months."

<details>
<summary>Model fix and root cause</summary>

**After**: a two-week concierge test -- manually track points for 20 volunteer teams in a
spreadsheet and email them a weekly summary -- to confirm anyone actually wants a loyalty-points
system before building any of the three tiers.

**Root cause**: co-12 requires "minimum" to qualify the hypothesis under test, not the smallest
version of the eventual finished product. The "before" version is a full build wearing the label
"MVP" without actually testing anything cheaply first.

</details>

### Drill 6 -- an A/B experiment with no guardrail

**Before**: "Hypothesis: a redesigned pricing page increases upgrade conversion. Primary metric:
upgrade conversion rate."

<details>
<summary>Model fix and root cause</summary>

**After**: add a guardrail -- for example, "30-day refund-request rate must not increase" -- a
must-not-regress metric distinct from the primary, guarding against a redesign that boosts
conversions by creating confusion or buyer's remorse.

**Root cause**: co-15 requires at least one guardrail alongside the single hypothesis and primary
metric. Without one, a version that increases conversion while quietly increasing refunds could
ship as an unqualified "win."

</details>

### Drill 7 -- an activation definition that's too loose

**Before**: "A team is 'activated' once they create an account."

<details>
<summary>Model fix and root cause</summary>

**After**: "A team is 'activated' once a manager publishes their first complete weekly schedule
within 3 days of signing up" -- measured as a timestamp delta with a stated threshold.

**Root cause**: co-20 requires an activation definition to name the first _genuine value_ moment,
not merely account creation. Creating an account costs a user almost nothing and doesn't
correspond to the product delivering any real value yet.

</details>

### Drill 8 -- a PR-FAQ that dodges the hard question

**Before FAQ section**: "_Q: What's the pricing?_ A: Standard plan pricing applies. _Q: When does
it launch?_ A: Next quarter."

<details>
<summary>Model fix and root cause</summary>

**After**: add the question the team is actually nervous about -- for example, "_Q: What happens
to a customer's existing data if they don't opt in before the deadline?_" -- and answer it
honestly, even if the honest answer is uncomfortable.

**Root cause**: co-23 requires the FAQ to answer the reader's most likely objections or risks, not
only easy, comfortable questions. A FAQ that only answers questions with flattering answers has
skipped the entire point of writing one before the build.

</details>

## Self-check checklist

Confirm each item without checking the concepts page first. If you hesitate, that concept needs
another pass.

- [ ] I can rewrite a feature-framed ticket as an outcome statement that survives having every
      feature noun removed. (co-01)
- [ ] I can write a problem statement that names the user, circumstance, and outcome while
      withholding any specific solution. (co-02)
- [ ] I can write a job story with all three required elements: circumstance, motivation, expected
      progress. (co-03)
- [ ] I can write and audit interview questions against the Mom Test, catching opinions,
      hypotheticals, and future predictions. (co-04)
- [ ] I can build an opportunity-solution tree where every solution traces to an opportunity and
      every opportunity traces to the outcome. (co-05)
- [ ] I can name all four big risks for a given bet and justify which one is riskiest. (co-06)
- [ ] I can compute a RICE score correctly and state every factor's unit. (co-07)
- [ ] I can bucket a backlog into MoSCoW, correctly scoping every "Won't" to the current release.
      (co-08)
- [ ] I can place initiatives on an impact-effort grid and correctly identify the quick-win
      quadrant. (co-09)
- [ ] I can classify a feature into must-be, performance, or attractive and justify it by its
      presence-vs-satisfaction shape. (co-10)
- [ ] I can compute WSJF and sequence jobs by the resulting ratio, not by raw Cost of Delay alone.
      (co-11)
- [ ] I can scope an MVP around a stated hypothesis rather than around "the smallest version of the
      final product." (co-12)
- [ ] I can write a Build-Measure-Learn writeup stating the hypothesis, the measurement, and a
      justified pivot-or-persevere call. (co-13)
- [ ] I can slice a release into increments that each ship standalone value and return a distinct
      signal. (co-14)
- [ ] I can design an A/B experiment with exactly one hypothesis, one primary metric, and at least
      one guardrail. (co-15)
- [ ] I can classify a feature flag into release, experiment, ops, or permission and state its
      expected lifespan. (co-16)
- [ ] I can distinguish a durable north-star metric from a stage-specific OMTM. (co-17)
- [ ] I can map a product's lifecycle onto the five AARRR stages with a concrete event per stage.
      (co-18)
- [ ] I can fill a HEART row where the goal, signal, and metric are all present and mutually
      consistent. (co-19)
- [ ] I can write a precise, falsifiable activation or retention definition, not a vague proxy.
      (co-20)
- [ ] I can distinguish an actionable metric from a vanity metric by whether a change in it would
      trigger a decision. (co-21)
- [ ] I can diagnose a Goodharted metric, naming the specific gaming path and a concrete
      countermeasure. (co-22)
- [ ] I can write a PR-FAQ whose FAQ section answers the reader's hardest objections, not just easy
      ones. (co-23)
- [ ] I can recognize a discovery/delivery hand-off anti-pattern and explain the continuous,
      single-team alternative. (co-24)
- [ ] I can write a Shape Up pitch with a fixed appetite and a named circuit-breaker. (co-25)
- [ ] I can point to a specific moment where an engineer's feasibility input changed what got
      built, not just how fast it shipped. (co-26)
- [ ] I can explain, in one sentence, why an MVP is correctly incomplete rather than a compromise
      on quality. (`correctness-vs-pragmatism`)
- [ ] I can explain, in one sentence, why product deciding "what" and engineering deciding "how" is
      too simple a rule for how strong products actually get built. (`mechanism-vs-policy`)

## Elaborative interrogation and self-explanation

Six why/why-not prompts, tied to this topic's two Cross-Cutting Big-Idea tags. Answer each in your
own words before opening the model explanation.

**E1 (`correctness-vs-pragmatism`).** Why is an MVP correctly _incomplete_ rather than a compromise
on quality?

<details>
<summary>Model explanation</summary>

An MVP's job is to test a specific hypothesis as cheaply as possible, not to be a smaller, worse
version of the eventual finished product. "Incomplete" here means scoped precisely to the question
under test -- everything else is deliberately absent, not sloppily missing. Calling that a "quality
compromise" mistakes the MVP's actual goal (fast, cheap validated learning) for the finished
product's goal (durable, polished value), which it was never trying to be yet.

</details>

**E2 (`correctness-vs-pragmatism`).** Why does testing the riskiest assumption cheaply, rather than
exhaustively de-risking everything before committing, count as rigor rather than corner-cutting?

<details>
<summary>Model explanation</summary>

Exhaustively de-risking every assumption before committing to anything is not more rigorous --
it's a different, more expensive way of avoiding the one question that actually matters most.
Rigor here means correctly identifying which uncertainty is most load-bearing (the riskiest
assumption) and resolving _that one_ first, cheaply -- pragmatism in service of getting to a
trustworthy answer fast, not an excuse to skip real validation altogether.

</details>

**E3 (`correctness-vs-pragmatism`).** Why does a "Won't" in MoSCoW deliberately leave a door open
rather than making a firm final call?

<details>
<summary>Model explanation</summary>

A MoSCoW pass is a scoping decision for one specific, time-boxed release -- it is not, and was
never meant to be, a permanent verdict on an idea's merit. Pragmatism means matching the strength
of the call to what's actually being decided: capacity for _this_ timebox is genuinely limited and
worth deciding firmly; the idea's long-term worth is a separate question this particular pass isn't
equipped to answer, so it stays open rather than being falsely closed.

</details>

**E4 (`mechanism-vs-policy`).** Why does this topic insist engineers belong in scoping
conversations rather than simply executing a handed-down spec?

<details>
<summary>Model explanation</summary>

Product decides the "what" and engineering builds the "how," but the how is not free information --
an engineer's feasibility knowledge can reveal that a cheaper mechanism achieves nearly the same
policy goal, or that a seemingly simple policy hides an expensive mechanism cost nobody scoping in
isolation could see. Keeping engineers out of scoping treats mechanism as a black box that policy
never has to consult, which throws away exactly the information most likely to change the policy
decision itself.

</details>

**E5 (`mechanism-vs-policy`).** How does the cheaper greedy-scheduler alternative (Worked Scenario 16) illustrate mechanism informing policy, rather than the reverse?

<details>
<summary>Model explanation</summary>

The original policy decision (build an ML-based suggestion feature) was made before anyone had
surfaced that a much cheaper mechanism (a rule-based greedy scheduler) could deliver most of the
same value. Once an engineer supplied that mechanism-level fact, the policy itself changed -- the
MVP's actual scope shifted -- rather than mechanism simply executing whatever policy had already
locked in. Information flowed upward from "how it could be built" into "what gets built," not only
downward.

</details>

**E6 (`mechanism-vs-policy`).** Why is "product decides what, engineering decides how" too simple a
rule, per this topic's own teaching?

<details>
<summary>Model explanation</summary>

The rule assumes the "what" can be fully decided before anyone consults the "how," but co-26 and
Worked Scenario 16 both show the how can cheaply reveal a better what -- a feasibility-aware
alternative can turn a six-week bet into a one-week bet carrying almost the same learning value.
Treating the two as strictly sequential and separately owned forecloses exactly the collaboration
that produces the strongest, cheapest-to-test version of a product decision.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) &middot; Next:
[Engineering Management](../../engineering-management/learning/overview.md) →
