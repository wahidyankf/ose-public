---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Software Engineering Practices topic: recall
first, then applied judgment, then hands-on repetition, then a checklist to confirm real
automaticity, and finally why/why-not prompts that test whether you can explain the reasoning, not
just follow the checklist. Every answer is hidden in a `<details>` block; try each item yourself
before opening it.

Every drill below is self-contained and deterministic: every git/`gh`-CLI transcript is a
plausible, hand-constructed, internally consistent transcript -- no live network call and no
dependency on a real GitHub repository or pull request existing, the same convention this topic's
own worked examples follow -- and every artifact-repair drill uses a mocked changelog entry, ADR,
tech-debt entry, postmortem, or PR description, verified the same observable-property way this
topic's worked examples were verified (a category matching Keep a Changelog's six, a status field
present, an owner named), not by running anything against a live service.

## Recall Q&A

Twenty-three short-answer questions, one per concept (`co-01` through `co-23`). Answer from
memory, then check.

**Q1 (co-01 -- trunk-based-vs-feature-branch).** What trade-off does a short-lived, frequently
integrated branch make against a long-lived feature branch, and what two properties of a team
should drive the choice?

<details>
<summary>Answer</summary>

Trunk-based development trades release isolation for a lower merge-conflict cost -- integrating
small, frequent changes to trunk means conflicts are caught and resolved while they're still
small. The right choice depends on team size and release cadence, not fashion or trend.

</details>

**Q2 (co-02 -- conventional-commits).** What is the exact grammar Conventional Commits defines, and
what two independent ways can a commit signal a breaking change?

<details>
<summary>Answer</summary>

`<type>[optional scope]: <description>`, e.g. `fix(parser): handle empty input`. A breaking change
is signaled either by a `!` right after the type/scope (`feat(api)!: drop v1 endpoint`) or by a
`BREAKING CHANGE:` footer -- either one independently marks the commit as breaking.

</details>

**Q3 (co-03 -- semantic-versioning).** What SemVer bump does a bugfix, a backward-compatible new
feature, and a backward-incompatible change each get?

<details>
<summary>Answer</summary>

PATCH, MINOR, and MAJOR, respectively -- SemVer's MAJOR.MINOR.PATCH scheme ties the bump directly
to the kind of change: incompatible (MAJOR), backward-compatible addition (MINOR), or
backward-compatible fix (PATCH).

</details>

**Q4 (co-04 -- changelog-discipline).** Name Keep a Changelog's six fixed categories, and where
does a new entry live until the next tagged release?

<details>
<summary>Answer</summary>

Added, Changed, Deprecated, Removed, Fixed, Security. Every new entry lives under an
`## [Unreleased]` heading until a tagged release moves the whole section under a dated version
heading.

</details>

**Q5 (co-05 -- code-review-etiquette).** What two things must a review comment do, per established
reviewer/author guidance, to count as well-formed?

<details>
<summary>Answer</summary>

Name whether it's blocking or a nit, so the author knows what must be resolved before merge versus
what's optional, and stay prompt and respectful of the author -- feedback aimed at the code, never
the person.

</details>

**Q6 (co-06 -- pr-hygiene-and-size).** What size bar does Google's review guide cite as
"reasonable," and what does scoping a PR to one concern buy a reviewer?

<details>
<summary>Answer</summary>

Roughly ~100 lines is reasonable, ~1000 too large -- a non-absolute guideline, not a hard rule.
Scoping to one concern lets a reviewer state the PR's single purpose in one sentence and review it
faster, more thoroughly, and roll it back more safely if it turns out to be wrong.

</details>

**Q7 (co-07 -- pr-workflow-with-gh-cli).** Name the three `gh pr` subcommands this topic drives the
review loop with, and what each one does.

<details>
<summary>Answer</summary>

`gh pr create` opens a new pull request from the terminal; `gh pr review` (with `--approve`,
`--request-changes`, or `--comment`) posts a review; `gh pr view` (with `--comments` or `--json`)
inspects a PR's state and comment history -- together they close the review loop without ever
leaving the CLI.

</details>

**Q8 (co-08 -- ci-pipeline-stages).** What are a minimal pipeline's three ordered stages, and why
does stage order matter?

<details>
<summary>Answer</summary>

Lint, then test, then build -- gated (each stage only runs if the previous one succeeded), and
ordered cheapest-and-fastest first so a failure is caught and stops the pipeline as early and
cheaply as possible, before the most expensive stage ever runs.

</details>

**Q9 (co-09 -- quality-gates).** What's the difference between a required check and a check that
should demote to a warning?

<details>
<summary>Answer</summary>

A required check blocks a merge on failure -- reserved for whatever actually protects production.
A lower-value check (a style nit, for example) should demote to a warning rather than block, so
gates protect what matters without ossifying into pure ceremony that blocks merges over trivia.

</details>

**Q10 (co-10 -- pre-commit-hooks).** What file drives the `pre-commit` framework, and what does it
catch that CI alone would catch later and more expensively?

<details>
<summary>Answer</summary>

`.pre-commit-config.yaml`. It catches a class of defect -- trailing whitespace, a lint violation,
an unformatted file -- locally, before the commit ever completes or reaches CI, which is cheaper
and faster feedback than waiting for the same defect to fail a CI run minutes later.

</details>

**Q11 (co-11 -- test-pyramid-as-practice).** In day-to-day review, what shape should the pyramid
have, and what should a reviewer do when a change skews it?

<details>
<summary>Answer</summary>

Many fast (unit) tests at the base, fewer slow (integration/e2e) tests toward the top. A reviewer
should name the skew explicitly when a change adds a disproportionate number of slow tests relative
to fast ones, flagging it as a design choice worth discussing, not silently approving it.

</details>

**Q12 (co-12 -- coverage-as-signal-not-target).** What is a coverage percentage actually a proxy
for, and what failure mode does turning it into a hard merge-gate target invite?

<details>
<summary>Answer</summary>

A proxy for testedness -- how much code a test suite executes -- not proof of correctness. Turning
it into a hard target (e.g. "100% coverage required to merge") invites assertion-free tests written
purely to execute lines and satisfy the number, a textbook Goodhart's-law failure.

</details>

**Q13 (co-13 -- systematic-debugging-practice).** What's the disciplined loop this topic teaches
for debugging, and what does bisection add to it?

<details>
<summary>Answer</summary>

Hypothesize, change one thing, observe -- a disciplined loop applied before reaching for a fix,
rather than guessing and patching. `git bisect` adds a way to halve an unknown regression's search
space with each step, turning a linear scan through dozens of commits into a logarithmic number of
test runs.

</details>

**Q14 (co-14 -- refactoring-cadence).** What does this topic argue beats a deferred, big-bang
rewrite, and on what two dimensions?

<details>
<summary>Answer</summary>

Continuous small refactors, folded into ordinary feature work, beat a deferred big-bang rewrite on
both risk (a small refactor is easy to verify and revert; a month-long rewrite risks losing
behavior nobody remembered to re-test) and cost (small, frequent changes stay cheap; a deferred
rewrite accumulates cost and risk the longer it waits).

</details>

**Q15 (co-15 -- boy-scout-rule).** What size should a boy-scout-rule cleanup stay, and why should
it not become a separate crusade?

<details>
<summary>Answer</summary>

A tiny, incidental improvement -- rename one poorly-named variable you happen to touch while fixing
an unrelated bug, nothing more. Keeping it tiny (and often its own small commit) keeps the change
reviewable and prevents an unrelated, sprawling rewrite from hiding inside what should be a focused
fix.

</details>

**Q16 (co-16 -- technical-debt-tracking).** What does a well-formed tech-debt log entry name,
beyond just describing the shortcut?

<details>
<summary>Answer</summary>

The shortcut's Fowler quadrant (prudent/reckless x deliberate/inadvertent) and a named owner --
naming the quadrant and owner keeps the debt a visible, prioritizable backlog item instead of a
silent tax nobody is accountable for paying down.

</details>

**Q17 (co-17 -- documentation-as-code).** What three properties keep documentation from rotting the
way a separate wiki page does?

<details>
<summary>Answer</summary>

Colocated with the code it describes, versioned in the same repository, and reviewed in the same
PR that changes the behavior it documents -- all three together resist the drift a separate wiki,
updated on its own schedule (or never), invites.

</details>

**Q18 (co-18 -- adr-as-engineering-practice).** What two-question test decides whether a change
earns an ADR?

<details>
<summary>Answer</summary>

Is it hard to reverse, and is it architecturally significant? Both questions must pass -- a
hard-to-reverse but purely cosmetic change, or an easily reversible architectural experiment, does
not earn one; only a change that is both hard to reverse AND changes the system's own structure
does.

</details>

**Q19 (co-19 -- estimation-pitfalls-and-noestimates).** What does an hour-based estimate fake, and
what does the #NoEstimates critique actually ask?

<details>
<summary>Answer</summary>

A precision that does not exist -- an hour figure looks confident without the team actually having
grounds for that confidence this early. #NoEstimates does not ban estimating outright; it asks
whether some decisions (prioritization, forecasting) can be made well without an estimate step at
all, e.g. by slicing work smaller and counting throughput instead.

</details>

**Q20 (co-20 -- pairing-and-mobbing).** What does pairing or mobbing trade away, what does it buy
in return, and when is that trade worth it?

<details>
<summary>Answer</summary>

Solo throughput -- two or more people working one problem is slower in raw output than each working
separately. In return it buys shared context and fewer defects, a trade worth making for high-risk
or unfamiliar work where the cost of a defect or of siloed knowledge outweighs the throughput lost.

</details>

**Q21 (co-21 -- definition-of-done).** What does an explicit Definition of Done gate, and per whose
framing?

<details>
<summary>Answer</summary>

When work actually counts as finished -- an explicit, shared checklist (tests pass, docs updated,
reviewed) gates that moment, per the Scrum Guide's framing, rather than "finished" meaning
something different to whoever happens to be asked.

</details>

**Q22 (co-22 -- feature-flags-as-a-release-decoupler).** What does a release toggle decouple, and
name one other toggle category with a different lifespan.

<details>
<summary>Answer</summary>

It decouples deploy from release -- code merges to trunk disabled, shippable at any time, and gets
turned on independently of when it was deployed, which is exactly what enables trunk-based
development (co-01) in the first place. Other categories: an ops toggle (a kill switch, a short
operational lifespan), an experiment toggle (an A/B test, lives until the experiment concludes), or
a permission toggle (long-lived, gates a feature by user segment).

</details>

**Q23 (co-23 -- incident-hygiene-and-blameless-response).** What is the ordered sequence of an
incident response, and what must a postmortem's language avoid?

<details>
<summary>Answer</summary>

Detect, then mitigate, then root-cause -- restore service before fully understanding why it broke.
The write-up must use blameless, actor-neutral language that traces the cause to a systemic gap (a
missing guard, an untested assumption), never to an individual's mistake.

</details>

## Applied scenarios

Nineteen scenarios. Each is self-contained -- everything you need is in the prompt itself, no other
page required. Decide which concept and which move applies, then check.

**AS1.** A 4-person startup ships to production several times a day with no external release
mandate. A 12-person team ships on a mandated quarterly release train tied to a regulator's
certification window. Pick trunk-based or feature-branch for each, and name the property that
drives each pick.

<details>
<summary>Answer</summary>

The 4-person startup: trunk-based -- frequent shipping and a small team make integration-conflict
cost the dominant risk, and there's no external release-isolation requirement to trade against it.
The 12-person team: a longer-lived branching model fits better -- the quarterly, regulator-tied
release train genuinely needs release isolation, and a larger team can absorb the coordination cost
of longer-lived branches more easily than it can absorb shipping uncertified work (co-01).

</details>

**AS2.** Three commits land since the last tag: `fix(auth): correct token expiry check`,
`feat(auth): add refresh-token support`, and `feat(auth)!: remove the deprecated /v1/login
endpoint`. What SemVer bump does the release get, and why?

<details>
<summary>Answer</summary>

MAJOR. Even though two of the three commits alone would only justify PATCH and MINOR, the third
commit's `!` marker signals a breaking change, and SemVer's rule is that the bump matches the
HIGHEST-severity change present in the release, not an average or a majority vote (co-02, co-03).

</details>

**AS3.** A 340-line diff touches the payments retry logic and, in the same commit, fixes an
unrelated typo in a README three directories away. Should this ship as one PR or be split, and how?

<details>
<summary>Answer</summary>

Split into two PRs. The payments retry change and the README typo fix are two unrelated concerns
bundled into one diff -- co-06 requires a PR scoped to one concern, and a reviewer approving the
payments logic has no clean way to separately evaluate (or, if needed, revert) the incidental typo
fix. The typo fix alone is small enough to ship as its own trivial PR or a tiny follow-up commit.

</details>

**AS4.** A CI workflow has two checks: the repository's own `pytest` suite, and a third-party
smoke test against a partner's staging environment that fails intermittently roughly once every 20
runs for reasons unrelated to this repository's code. Which should be a required, merge-blocking
check, and which should demote to a warning?

<details>
<summary>Answer</summary>

The repository's own `pytest` suite should be required -- it directly protects this codebase's
correctness. The flaky third-party smoke test should demote to a warning: co-09 reserves
merge-blocking status for a check that actually protects production, and a check that fails ~5% of
the time for reasons outside this repository's control would otherwise routinely block unrelated,
correct changes.

</details>

**AS5.** A reviewer leaves two comments on the same PR: "nit: these two imports could be
alphabetized" and "this function doesn't handle an empty list -- it will raise `IndexError` in
production." Classify each, and explain why the classification matters to the author.

<details>
<summary>Answer</summary>

The import-ordering comment is a nit -- optional, stylistic, safe to merge without addressing. The
empty-list comment is blocking -- it describes a real production crash, and per co-05, an author
needs to know from the comment itself which one must be resolved before merge and which one can be
deferred or ignored without holding up the PR.

</details>

**AS6.** A PR reports 98% line coverage on a new `apply_discount()` function. The only new test is:
`def test_apply_discount(): apply_discount(cart, 0.1)` -- no `assert` anywhere in the test body.
What's wrong?

<details>
<summary>Answer</summary>

This is co-12's exact failure mode -- the coverage tool only measures whether a line EXECUTED, not
whether its behavior was actually checked. A test with no assertion at all can hit every line
`apply_discount()` has and report near-100% coverage while verifying literally nothing about
correctness; the high number is measuring the wrong thing entirely.

</details>

**AS7.** A regression is present somewhere in the 60 commits merged since the last release, and the
failure is intermittent, reproducing on roughly 1 run in 5. Should you reach for `git bisect`, and
what does the intermittent failure rate change about how you'd use it?

<details>
<summary>Answer</summary>

Yes, `git bisect` is still the right tool -- `ceil(log2(60)) = 6` steps versus up to 60 for a
one-at-a-time scan. The intermittency changes HOW each step is judged: a single test run per commit
is not reliable evidence at a ~20% false-negative rate, so each bisect step should run the
reproduction check several times (or use `git bisect run` with a script that retries and reports
"bad" only on a majority of failing runs) before marking a commit good or bad (co-13).

</details>

**AS8.** A PR titled "fix null-pointer crash in `get_user_profile()`" contains a one-line fix to
the actual bug, plus 180 additional lines renaming variables and reformatting whitespace throughout
the entire file, unrelated to the crash. What's wrong?

<details>
<summary>Answer</summary>

This violates co-15's boy-scout-rule scope -- a boy-scout cleanup is meant to stay a tiny,
incidental improvement to code you're already touching, not a 180-line drive-by rewrite riding
along with an unrelated one-line fix. It also violates co-06's PR-hygiene rule: bundling the fix
and the rewrite makes the actual crash fix harder to review and impossible to revert independently
of the cosmetic changes. The fix: ship the one-line crash fix alone; propose the broader cleanup as
its own separate PR if it's worth doing at all.

</details>

**AS9.** Three logged tech-debt items: (1) a missing integration test added six days ago on a
rarely-changed module, (2) a hardcoded config value added eight months ago that has caused three
separate production incidents when forgotten during deploys, (3) a TODO comment added yesterday
with no described impact. Rank them for prioritization.

<details>
<summary>Answer</summary>

(2) first, (3) or (1) after. Co-16's prioritization rule ranks by ONGOING FRICTION, not recency --
item (2) is the oldest of the three but has caused three actual production incidents, which is
concrete, recurring, measurable cost. Item (1) is recent and has caused zero known problems on a
rarely-changed module -- low ongoing friction regardless of freshness. Item (3) has no described
impact at all and should be clarified (or dropped) before it can be ranked meaningfully.

</details>

**AS10.** Three changes land in the same sprint: (a) swap the message queue from RabbitMQ to a
managed cloud queue service, (b) add a null check before dereferencing an optional field, (c)
change a background job's polling interval from 30 seconds to 4 hours. Which earns an ADR?

<details>
<summary>Answer</summary>

Only (a). Applying co-18's two-question test: (b) is trivially reversible (revert one line) and not
architecturally significant. (c) LOOKS more consequential than (b), but a polling-interval config
value is also a single-line, instantly reversible change with no structural impact on the system.
(a) fails both tests in the ADR-earning direction -- swapping the message queue technology touches
every producer and consumer, is expensive to undo once consumers depend on the new queue's
semantics, and changes the system's own messaging architecture.

</details>

**AS11.** A product manager asks an engineer to estimate, in hours, a three-week, poorly-scoped
integration with a payment provider the team has never used before. What should the engineer's
response be?

<details>
<summary>Answer</summary>

Push back on the hour figure specifically, per co-19 -- an hour estimate for unfamiliar,
poorly-scoped work fakes a precision the team cannot actually have yet. A better response proposes
a #NoEstimates-style alternative: spend a short, timeboxed spike to reduce the unknowns first, then
slice the integration into small, independently shippable pieces and track actual throughput
instead of committing to a specific hour figure up front.

</details>

**AS12.** Two tasks are on the board: a CRUD endpoint the team has built a dozen times before in
this exact codebase, and a first-time integration with an unfamiliar third-party payment API that
no one on the team has used. Pick pairing or solo for each, and justify.

<details>
<summary>Answer</summary>

The CRUD endpoint: solo -- well-understood, low-risk, low-novelty work where pairing's throughput
cost isn't justified by a defect or knowledge-sharing benefit that's unlikely to matter here. The
unfamiliar payment integration: pairing (or mobbing if the risk is high enough) -- unfamiliar,
higher-risk work is exactly where co-20's trade of solo throughput for shared context and fewer
defects pays off, especially since nobody on the team currently holds this knowledge alone.

</details>

**AS13.** A PR is merged to trunk and its CI pipeline is green. Is this task "done" per a
well-formed Definition of Done, and what's the difference between "done" and "done-done"?

<details>
<summary>Answer</summary>

Not necessarily "done-done." Per co-21, "done" typically means the code is merged and passing its
checks; "done-done" additionally means it's deployed AND observed to be behaving correctly in
production (monitored). A team's Definition of Done should state explicitly which of the two a
given checklist item is asking for -- "merged" and "verified working in production" are two
different claims, and conflating them is how a merged-but-unmonitored regression slips through
unnoticed.

</details>

**AS14.** A team wants a toggle that (a) hides an incomplete checkout redesign until it's ready to
launch, and separately, a toggle that (b) lets on-call instantly disable a misbehaving
recommendation widget without waiting for a deploy. Name the toggle category for each.

<details>
<summary>Answer</summary>

(a) is a release toggle -- exactly co-22's release/deploy decoupling use case, ships to trunk
disabled and flips on at launch. (b) is an ops toggle (a kill switch) -- a short-lived,
operationally triggered flag meant to be flipped instantly during an incident, not tied to a
planned launch date.

</details>

**AS15.** An incident timeline reads: 14:02 alert fires, 14:04 on-call restarts the affected
service (service recovers), 14:35 root cause identified (a memory leak in a recently deployed
dependency), 15:10 permanent fix merged. Does this sequence follow co-23's expected order?

<details>
<summary>Answer</summary>

Yes -- detect (14:02), mitigate (14:04, the restart, which restores service quickly without yet
understanding WHY), then root-cause (14:35), then a permanent fix (15:10). This is the correct
order: service was restored in two minutes without waiting 33 more minutes to first understand the
root cause, which is exactly the sequencing co-23 prescribes -- mitigate first, investigate after
service is already restored.

</details>

**AS16.** A transcript shows: `gh pr create --title "fixes" --body "" --base main`, followed
immediately by `gh pr merge 91 --squash`, with no `gh pr review` command anywhere in the transcript.
What's missing from this workflow?

<details>
<summary>Answer</summary>

A review step -- co-07's PR workflow closes the loop with `gh pr create`, `gh pr review`
(request-changes or approve), and `gh pr view`, but this transcript jumps straight from creating
the PR to merging it with no review command at all. Merging with no recorded review also violates
co-05's review-etiquette expectation that a change gets reviewed before it lands, not just opened
and self-merged.

</details>

**AS17.** A changelog entry reads: `### Improved` -- "`Client.fetch()` is faster." What's wrong,
and which of Keep a Changelog's six categories should it actually use?

<details>
<summary>Answer</summary>

"Improved" is not one of Keep a Changelog's six fixed categories (Added, Changed, Deprecated,
Removed, Fixed, Security) -- co-04 requires exactly one of those six. A performance change to
existing behavior maps to `Changed`, and the bullet itself should also name the specific,
verifiable change ("now streams large payloads instead of buffering them fully") rather than a
vague "faster" claim with no verifiable detail.

</details>

**AS18.** A team has a `.pre-commit-config.yaml` with a formatting hook and wants to decide whether
to also wire `pre-commit run --all-files` as a required CI check, given every engineer already runs
`pre-commit install` locally. What should they decide, and why?

<details>
<summary>Answer</summary>

Wire it as a required CI check too, not local-only. Local hooks (co-10) catch most violations
before a commit, but nothing forces every contributor to actually run `pre-commit install` (a
one-time, easy-to-skip step, per Drill 5 below) or to keep their local hook versions current; a
required CI check (co-09) is the backstop that guarantees the SAME rules apply uniformly, whether
or not any individual engineer's local setup is current.

</details>

**AS19.** A PR under review adds fifteen new integration tests that spin up a real database and
zero new unit tests, for logic that could mostly be tested without touching a database at all.
What should a reviewer flag?

<details>
<summary>Answer</summary>

The test-pyramid shape (co-11) -- fifteen new slow, database-backed tests with no new fast unit
tests inverts the "many fast, few slow" shape the pyramid recommends. A reviewer should name this
explicitly and ask which of the fifteen could be rewritten as fast unit tests against the
underlying logic directly, reserving the genuinely-needs-a-real-database cases for the smaller set
of integration tests that actually require one.

</details>

## Hands-on drills

Ten before/after repetition drills: five repair a flawed git/`gh`-CLI transcript or CI/hook config,
five repair a flawed non-code artifact (a changelog entry, an ADR, a tech-debt log entry, a
postmortem, a PR description). Fix each "before" yourself, then compare against the "after" and its
root-cause explanation.

### Drill 1 -- a commit message that doesn't parse as any Conventional Commits type

**Before**:

```text
$ git add parser.py
$ git commit -m "fixed the bug where empty input crashed the parser"
[main 4a1c9de] fixed the bug where empty input crashed the parser
 1 file changed, 3 insertions(+), 1 deletion(-)
$ git log -1 --pretty=%s
fixed the bug where empty input crashed the parser
```

<details>
<summary>Model fix and root cause</summary>

**After**:

```text
$ git add parser.py
$ git commit -m "fix(parser): handle empty input without crashing"
[main 4a1c9de] fix(parser): handle empty input without crashing
 1 file changed, 3 insertions(+), 1 deletion(-)
$ git log -1 --pretty=%s
fix(parser): handle empty input without crashing
```

**Root cause**: the before message has no `type(scope): description` structure at all -- co-02
requires a leading type token (`fix`, `feat`, and so on), an optional parenthesized scope, and a
colon before the description. Tooling that derives a SemVer bump or a changelog entry directly from
commit history (co-02, co-03, co-04) has nothing to parse from the before message; the after
message both documents intent for a human AND stays machine-parseable.

</details>

### Drill 2 -- `gh pr create` against the wrong base branch with an empty body

**Before**:

```text
$ git push -u origin feature/rate-limit-retry
$ gh pr create --title "add retry with backoff" --body "" --base develop
Creating pull request for feature/rate-limit-retry into develop in acme/api-gateway

https://github.com/acme/api-gateway/pull/88
{
  "baseRefName": "develop",
  "number": 88,
  "title": "add retry with backoff"
}
```

<details>
<summary>Model fix and root cause</summary>

**After**:

```text
$ gh pr close 88 --comment "reopening against the correct base"
$ gh pr create --title "fix(gateway): add retry with exponential backoff" \
    --body "What: retries a failed upstream call up to 3 times with exponential backoff.
Why: a transient 503 was previously surfaced straight to the caller with no retry.
How verified: new unit tests in test_retry.py, all green." \
    --base main
Creating pull request for feature/rate-limit-retry into main in acme/api-gateway

https://github.com/acme/api-gateway/pull/89
{
  "baseRefName": "main",
  "number": 89,
  "title": "fix(gateway): add retry with exponential backoff"
}
```

**Root cause**: two separate violations stacked in one transcript -- `--base develop` targets a
branch that isn't this trunk-based team's actual integration branch (co-01), so the PR would never
land where CI and teammates expect it to; and an empty `--body` gives a reviewer no what/why/
how-verified to start from (co-06). The fix retargets the real trunk (`main`) and fills in a real
description.

</details>

### Drill 3 -- a linear commit-by-commit scan instead of `git bisect`

**Before**:

```text
$ git log --oneline main..HEAD | wc -l
37
$ git checkout HEAD~1 -- . && python3 -m pytest -q test_totals.py
$ git checkout HEAD~2 -- . && python3 -m pytest -q test_totals.py
$ git checkout HEAD~3 -- . && python3 -m pytest -q test_totals.py
# ... continuing one commit at a time, up to 37 checks in the worst case
```

<details>
<summary>Model fix and root cause</summary>

**After**:

```text
$ git bisect start
$ git bisect bad HEAD
$ git bisect good main
Bisecting: 18 revisions left to test after this (roughly 5 steps)
[c481aa2] chore: unrelated change 19
$ python3 -m pytest -q test_totals.py && git bisect good || git bisect bad
Bisecting: 9 revisions left to test after this (roughly 4 steps)
...
# converges in ceil(log2(37)) = 6 steps, not up to 37
```

**Root cause**: a one-at-a-time linear scan costs up to 37 test runs in the worst case; `git
bisect` halves the remaining search space on every step, converging in `ceil(log2(37)) = 6` steps
(co-13) -- the same regression, an order of magnitude fewer test runs, because bisection is the
correct tool for "which of N commits introduced this," not a manual walk through every candidate.

</details>

### Drill 4 -- a CI pipeline with no stage gating

**Before** (`ci.yml`):

```yaml
name: ci
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: ruff check .
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: pytest -q
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: python -m build
```

<details>
<summary>Model fix and root cause</summary>

**After**:

```yaml
name: ci
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: ruff check .
  test:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: pytest -q
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: python -m build
```

**Root cause**: without `needs:`, all three jobs launch in parallel the instant the workflow
triggers -- `build` runs (and burns compute) even when `lint` has already failed, exactly the
expensive-stage-runs-anyway problem co-08 warns against. Adding `needs: lint` to `test` and
`needs: test` to `build` makes each stage genuinely GATED, not merely listed in the same file, so a
lint failure now stops the pipeline before test or build ever start -- also protecting co-09's
required-check guarantee, since a required check on `build` alone would otherwise never even see
the lint failure.

</details>

### Drill 5 -- a pre-commit config present but never installed

**Before**:

```text
$ ls .pre-commit-config.yaml
.pre-commit-config.yaml
$ printf 'bad_var = 1   \n' > sloppy.py
$ git add .pre-commit-config.yaml sloppy.py
$ git commit -m "chore: add pre-commit config"
[main 9c2ab31] chore: add pre-commit config
 2 files changed, 6 insertions(+)
$ git show --stat HEAD | grep sloppy
 sloppy.py | 1 +
```

<details>
<summary>Model fix and root cause</summary>

**After**:

```text
$ pre-commit install
pre-commit installed at .git/hooks/pre-commit
$ printf 'bad_var = 1   \n' > sloppy.py
$ git add sloppy.py
$ git commit -m "chore: add sloppy module"
trim trailing whitespace.................................................Failed
- files were modified by this hook
$ git add sloppy.py
$ git commit -m "chore: add sloppy module"
trim trailing whitespace.................................................Passed
[main a71f204] chore: add sloppy module
 1 file changed, 1 insertion(+)
```

**Root cause**: `.pre-commit-config.yaml` merely declares which hooks to run -- co-10 requires a
separate, one-time `pre-commit install` step to actually wire `.git/hooks/pre-commit` to invoke the
framework. A config file sitting in the repo with no install step is inert, which is exactly why
`sloppy.py`'s trailing whitespace made it straight into the before transcript's commit; the fix
runs the install step once, after which every future commit runs the hooks automatically.

</details>

### Drill 6 -- a changelog entry using categories Keep a Changelog doesn't define

**Before**:

```text
## [Unreleased]

### Improved

- `Client.fetch()` is now faster for large payloads.

### Bugs

- Fixed a crash when `timeout` was negative.
```

<details>
<summary>Model fix and root cause</summary>

**After**:

```text
## [Unreleased]

### Changed

- `Client.fetch()` now streams large payloads instead of buffering them fully in memory.

### Fixed

- `Client.fetch(timeout=-1)` now raises `ValueError` at call time instead of hanging indefinitely.
```

**Root cause**: "Improved" and "Bugs" are not among Keep a Changelog 1.1.0's six fixed categories
(Added, Changed, Deprecated, Removed, Fixed, Security) -- co-04 requires every entry to use exactly
one of the six. "Improved" maps to `Changed` (existing behavior altered, not new); "Bugs" maps to
`Fixed`. The rewrite also tightens each bullet to state the specific, verifiable change rather than
a vague performance claim with nothing to check it against.

</details>

### Drill 7 -- an ADR written for a trivial, easily reversible change

**Before**:

```text
# ADR-0007: rename calc_tot() to calculate_total()

## Status
Accepted

## Context
The function name calc_tot() was hard to read during a recent onboarding session.

## Decision
Rename calc_tot() to calculate_total() across the codebase.

## Consequences
The codebase is slightly more readable.
```

<details>
<summary>Model fix and root cause</summary>

**After**: no ADR at all -- the rename ships as a single, self-explanatory commit:

```text
git commit -m "refactor(billing): rename calc_tot to calculate_total for readability"
```

**Root cause**: co-18's two-question test -- hard to reverse, AND architecturally significant --
fails on both counts here. A rename is a single-commit (or IDE-rename-tool) revert, and it changes
nothing about the system's structure. Writing an ADR for it does the opposite of an ADR's job: it
buries the genuinely significant decisions (a database swap, a new consistency model) in noise,
exactly the failure mode the ADR-trigger-decision worked example warns against. A clear commit
message is the entire "decision record" a change this small ever needs.

</details>

### Drill 8 -- a tech-debt log entry missing its quadrant and owner

**Before**:

```text
Shortcut: skipped writing integration tests for the new discount-calculation path
because the release deadline was the next morning. TODO: add tests later.
```

<details>
<summary>Model fix and root cause</summary>

**After**:

```text
Debt: discount-calculation path (checkout/discounts.py) has unit tests only, no
integration coverage against the real pricing service.
Quadrant: prudent + deliberate (Fowler) -- a conscious, reasoned trade-off made
under a real deadline, not a mistake.
Owner: @priya
Mitigation: add integration tests against a pricing-service test double before the
next feature touches this path; tracked as ISSUE-482.
```

**Root cause**: "TODO: add tests later" with no owner and no named quadrant is exactly the
silent-tax failure mode co-16 warns about -- a TODO with no owner competes with every other
priority and reliably loses. Naming the quadrant (prudent/deliberate, not reckless/inadvertent)
also matters: it records that this was a reasoned trade-off under real deadline pressure, not a
mistake, which changes how a future reader should weigh paying it down.

</details>

### Drill 9 -- a postmortem draft that names an individual

**Before**:

```text
Jordan pushed a hotfix directly to main, bypassing the CI pipeline, which shipped
an unformatted, untested change that broke the build for the rest of the team for
20 minutes. Jordan should have run the pipeline before pushing.
```

<details>
<summary>Model fix and root cause</summary>

**After**:

```text
A hotfix was pushed directly to main, bypassing the CI pipeline, shipping an
unformatted, untested change that broke the build for the rest of the team for 20
minutes. The repository's branch protection did not require the lint-test-build
pipeline to pass before a push to main could land -- any push, by any team member,
on any day, could equally have bypassed it.

Fix: branch protection on main now requires the lint-test-build pipeline (co-08) to
pass before any push (including a hotfix) can land, no exceptions (shipped same
day).
```

**Root cause**: "Jordan should have run the pipeline" attributes a systemic gap -- no branch
protection actually enforcing the required check (co-09) -- to an individual's judgment call under
pressure. Naming the actual gap both satisfies co-23's actor-neutral rule AND produces a fix (turn
on required-check branch protection) that prevents the SAME failure for every future team member,
not just a request that Jordan personally be more careful next time.

</details>

### Drill 10 -- a PR description bundling three unrelated concerns

**Before**:

```text
What: fixes the flaky checkout test, refactors the retry helper to use functools,
and bumps requests from 2.31 to 2.32.
Why: all three were sitting in my branch already.
How verified: CI is green.
```

<details>
<summary>Model fix and root cause</summary>

**After** (split into three PRs, one shown):

```text
What: fixes test_checkout_flow's flaky assertion by waiting on the actual async
callback instead of a fixed sleep.
Why: the test failed intermittently in CI (roughly 1 in 20 runs) because a 200ms
sleep sometimes wasn't long enough on a loaded runner.
How verified: reran the fixed test 50 times locally with no failures; CI green.
Where to look first: test_checkout_flow.py's new await_callback() helper -- the
only file with new logic.
```

**Root cause**: "all three were sitting in my branch already" is not a scoping rationale -- co-06
requires a PR scoped to ONE concern, and bundling a flaky-test fix, an unrelated refactor, and a
dependency bump means none of the three can be reviewed, approved, or reverted independently if
only one turns out to be wrong. Splitting into three PRs (one shown) also lets each description
state a genuine why and a where-to-look-first, instead of one vague, shared justification covering
all three unrelated changes.

</details>

## Self-check checklist

Confirm each item without checking the learning track first. If you hesitate, that concept needs
another pass.

- [ ] I can explain the trade-off trunk-based development makes against long-lived feature
      branches, and name the two properties (team size, release cadence) that should decide
      between them. (co-01)
- [ ] I can write a Conventional Commits message with the correct `type(scope): description`
      grammar and mark a breaking change with `!` or a `BREAKING CHANGE:` footer. (co-02)
- [ ] I can assign the correct SemVer bump (MAJOR/MINOR/PATCH) to a described API change. (co-03)
- [ ] I can write a changelog entry under `## [Unreleased]` using one of Keep a Changelog's six
      fixed categories. (co-04)
- [ ] I can label a review comment as blocking versus a nit and explain what prompt, respectful
      feedback requires. (co-05)
- [ ] I can scope a pull request to one concern and judge whether its size is reasonable against
      the ~100-line guideline. (co-06)
- [ ] I can drive a full review loop with `gh pr create`, `gh pr review`, and `gh pr view` from the
      terminal. (co-07)
- [ ] I can order a minimal CI pipeline's stages (lint, test, build) and explain why gating and
      stage order both matter. (co-08)
- [ ] I can classify a check as a required, merge-blocking gate versus one that should demote to a
      warning. (co-09)
- [ ] I can explain what `.pre-commit-config.yaml` and `pre-commit install` each do, and why both
      are required before hooks actually run. (co-10)
- [ ] I can name the test pyramid's "many fast, few slow" shape and flag a PR that skews it during
      review. (co-11)
- [ ] I can explain why a coverage percentage is a signal, not a target, and name the
      assertion-free-test failure mode that results from treating it as one. (co-12)
- [ ] I can apply the hypothesize-change-one-thing-observe debugging loop and choose `git bisect`
      over a linear scan when it's justified. (co-13)
- [ ] I can explain why continuous small refactors folded into feature work beat a deferred
      big-bang rewrite, on both risk and cost. (co-14)
- [ ] I can apply the boy-scout rule as a tiny, incidental cleanup without letting it grow into an
      unrelated rewrite. (co-15)
- [ ] I can log a tech-debt item with its Fowler quadrant, a named owner, and a concrete
      mitigation. (co-16)
- [ ] I can explain why documentation colocated with its code, versioned, and reviewed in the same
      PR resists the drift a separate wiki invites. (co-17)
- [ ] I can apply the two-question test (hard to reverse, architecturally significant) to decide
      whether a change earns an ADR. (co-18)
- [ ] I can explain what an hour-based estimate fakes and what the #NoEstimates critique actually
      proposes instead. (co-19)
- [ ] I can decide when pairing or mobbing's trade of solo throughput for shared context and fewer
      defects is worth making. (co-20)
- [ ] I can write a Definition of Done checklist and distinguish "done" from "done-done." (co-21)
- [ ] I can name a feature-flag category (release, ops, experiment, permission) for a given use
      case and explain what a release toggle decouples. (co-22)
- [ ] I can sequence an incident response as detect-then-mitigate-then-root-cause and write its
      postmortem in blameless, actor-neutral language. (co-23)
- [ ] I can explain, in one sentence, why a CI gate's strictness should be dialed to a change's
      actual blast radius rather than maximized uniformly across every repo.
      (`correctness-vs-pragmatism`)
- [ ] I can explain, in one sentence, why trunk-based development and small, single-concern pull
      requests cut merge coupling the same way a clean module boundary cuts compile-time coupling.
      (`coupling-vs-cohesion`)

## Elaborative interrogation and self-explanation

Eight why/why-not prompts, drawn from this topic's Tensions & Trade-offs and Lineage sections and
tied to its two Cross-Cutting Big-Idea tags. Answer each in your own words before opening the model
explanation.

**E1 (`correctness-vs-pragmatism`).** Why does this topic frame a CI gate's strictness as something
to "dial to the blast radius" rather than maximize uniformly across every repo?

<details>
<summary>Model explanation</summary>

Every gate -- review, CI, required coverage -- trades throughput for safety. Maxing it everywhere
treats a solo throwaway prototype the same as a shared production system, which is pure drag on the
former and doesn't even guarantee safety on the latter if the ceremony is generic rather than
targeted. Pragmatism here means calibration: dial the strictness of review/CI/coverage to what's
actually at stake if the change breaks, not applying one fixed policy regardless of context -- the
same discipline the Tensions section names directly ("the skill is dialing ceremony to the blast
radius, not maxing or zeroing it").

</details>

**E2 (`correctness-vs-pragmatism`).** Why does this topic insist a coverage percentage is only ever
a signal, never a target -- what specifically breaks the moment coverage becomes a merge gate's
pass/fail number?

<details>
<summary>Model explanation</summary>

Goodhart's law: the moment a measure becomes a target, it stops being a good measure. A developer
under deadline pressure facing "100% coverage or the PR is blocked" has a direct incentive to write
a test that executes every line without asserting anything meaningful, because the merge gate
rewards the number, not the testedness the number was originally supposed to proxy for -- exactly
the assertion-free-test failure mode co-12's worked example demonstrates directly.

</details>

**E3 (`correctness-vs-pragmatism`).** Trunk-based development versus long-lived feature branches or
GitFlow -- why does this topic refuse to declare one universally correct?

<details>
<summary>Model explanation</summary>

Because the right answer genuinely depends on context -- team size, release cadence, and review
culture -- not on which model happens to be fashionable. Trunk-based optimizes integration
frequency and small diffs at the cost of needing feature flags to hide incomplete work; GitFlow
optimizes release isolation at the cost of merge hell as branches age. Pragmatism means picking
based on the team's actual coordination shape, which is exactly why AS1 above reaches two different
answers for two differently-shaped teams instead of one universal rule.

</details>

**E4 (`correctness-vs-pragmatism`).** Why is `git bisect` framed as a pragmatic tool for
search-space reduction rather than a substitute for actually forming a hypothesis first?

<details>
<summary>Model explanation</summary>

Bisect halves an unknown regression's search space, but it only tells you WHICH commit broke
something, not WHY -- the hypothesize-then-verify loop is still required to actually understand and
fix the root cause once bisect narrows it down. Reaching for bisect without first framing what
you'd expect to find turns a disciplined debugging practice into blind commit-flipping; the tool is
pragmatic exactly because it's paired with a hypothesis at each step, not a replacement for having
one.

</details>

**E5 (`coupling-vs-cohesion`).** How does this topic frame trunk-based development and small PRs as
cutting "merge coupling," and what does that have to do with code-level coupling?

<details>
<summary>Model explanation</summary>

Every long-lived branch is a form of coupling -- two developers' in-flight work can silently drift
out of sync the longer both branches live before merging, the same way two tightly coupled modules
can't change independently without breaking each other. Trunk-based development with small,
frequent merges keeps that coupling window short, the same way a clean module boundary keeps a
compile-time dependency narrow; both trade some short-term convenience (working in isolation,
deferring integration) for keeping the actual coupling small and cheap to resolve.

</details>

**E6 (`coupling-vs-cohesion`).** Why does a PR scoped to one concern (co-06) count as a cohesion
argument, not merely a "keep it short" style preference?

<details>
<summary>Model explanation</summary>

A PR bundling three unrelated concerns -- a bug fix, an unrelated refactor, a dependency bump -- is
low-cohesion in the same sense a class doing three unrelated things is: reviewing it, reverting it,
or bisecting a future regression to it all become harder, because the unrelated concerns can't be
evaluated or rolled back independently. Scoping to one concern is the change-management equivalent
of decomposing a low-cohesion module into focused ones -- Drill 10 above shows exactly this failure
and its fix.

</details>

**E7 (`coupling-vs-cohesion`).** Feature flags decouple deploy from release -- how is that literally
a coupling argument, not just a deployment convenience?

<details>
<summary>Model explanation</summary>

Without a flag, "merge to trunk" and "customers see this feature" are the SAME event, tightly
coupled -- you cannot do one without the other. A flag breaks that coupling into two independently
controllable events: code can merge (and be tested in trunk) long before it's turned on for anyone,
and it can be turned off again (an ops toggle) without a redeploy. That's exactly what makes
trunk-based development viable for incomplete work in the first place -- the flag is the
coupling-breaking mechanism co-01 depends on, not a nice-to-have.

</details>

**E8 (`coupling-vs-cohesion` / Lineage).** The Lineage section says each practice in this topic is
"scar tissue" from a specific expensive failure -- what practical test does that give you for
deciding whether to adopt a new practice, versus adopting it because it's "on a checklist"?

<details>
<summary>Model explanation</summary>

Name the specific failure mode the practice actually prevents -- CI prevents the integration hell
of big-bang merges; conventional commits and trunk-based dev prevent the review-and-conflict cost
long-lived branches produced at scale; blameless postmortems prevent people hiding incidents out of
fear of blame -- and ask whether your context is actually exposed to that failure. A practice
adopted "because it's standard" without that check is exactly the over-ceremony the Tensions
section warns a solo prototype doesn't need; the lineage test is what turns "always do X" into "do
X because of the specific thing it protects against."

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) &middot; Next:
[Agentic Coding](../../agentic-coding/learning/overview.md) →
