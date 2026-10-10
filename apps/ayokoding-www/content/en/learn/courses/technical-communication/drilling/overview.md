---
title: "Overview"
date: 2026-07-16T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Technical Communication topic: recall first,
then applied judgment, then hands-on artifact repair, then a checklist to confirm real automaticity,
and finally why/why-not prompts that test whether you can explain the reasoning, not just produce the
artifact. Every answer is hidden in a `<details>` block; try each item yourself before opening it.

This topic has no runnable interpreter -- every drill below is a document-repair drill instead of a
code fix, verified the same observable-property way this topic's worked scenarios were verified (a
field present, a claim matched to its literal first sentence, a name present in both a diagram and its
prose), not by running anything.

## Recall Q&A

Seventeen short-answer questions, one per concept (`co-01` through `co-17`). Answer from memory, then
check.

**Q1 (co-01 -- reader-first-bluf).** What must appear in a document's literal first sentence for it
to satisfy BLUF, and why does that matter for a reader who never finishes reading it?

<details>
<summary>Answer</summary>

The decision and the ask. A reader who stops after the first sentence -- which is most readers, most
of the time -- still gets the one thing they actually needed; a reader who has to read further to
find it either stops before they get there or resents the time it cost.

</details>

**Q2 (co-02 -- inverted-pyramid).** What test proves a document is ordered by importance rather than
by discovery order?

<details>
<summary>Answer</summary>

A reader who stops after the first two paragraphs still has the document's conclusion. Supporting
detail sinks to the bottom, where a reader who doesn't need it can skip it.

</details>

**Q3 (co-03 -- thirty-second-skim-test).** What three elements alone must yield a document's decision
and next action for it to pass the skim test?

<details>
<summary>Answer</summary>

Headings, bolded phrases, and first sentences -- read only those, nothing else, within about thirty
seconds, and the decision plus the next action should both be present.

</details>

**Q4 (co-04 -- design-doc-rfc-structure).** Name the six elements a design doc/RFC must state, and
the one rule that keeps its Open Questions section honest.

<details>
<summary>Answer</summary>

Problem, context, options considered, decision, trade-offs, and open questions. The rule: no item in
Open Questions may be phrased as a decision already made (and, symmetrically, no already-decided item
should hide inside it).

</details>

**Q5 (co-05 -- rfc-review-process).** What actually earns an RFC its "Accepted" status, and what is
NOT enough on its own?

<details>
<summary>Answer</summary>

Every open question raised during review carries an explicit resolved-or-deferred annotation. Simply
posting the document is not enough -- an RFC nobody commented on has not earned "Accepted."

</details>

**Q6 (co-06 -- adr-one-decision-format).** What test tells you an ADR should split into two records?

<details>
<summary>Answer</summary>

It records more than one decision. An ADR is well-formed only if it captures exactly one decision with
its context and consequences -- a second, unrelated decision folded in is a sign to split it.

</details>

**Q7 (co-07 -- adr-lifecycle-status).** What happens to an ADR's own text when the decision changes,
and what happens instead?

<details>
<summary>Answer</summary>

The original text is never edited. A new ADR is written, the old one's status field updates to
"Superseded by ADR-000X," and the new one states that it supersedes the old -- a link in both
directions.

</details>

**Q8 (co-08 -- adr-colocation-immutability).** Where should an ADR live, and why does that matter more
than which wiki space is "correct"?

<details>
<summary>Answer</summary>

In the same repository as the code it governs, dated, and never edited after acceptance. Colocation
ties the document's discoverability to the exact place a future reader is most likely already looking
-- the code itself -- rather than requiring them to know which wiki space to search.

</details>

**Q9 (co-09 -- pr-description-structure).** Name the four elements a PR description needs, and what
the fourth one does for a large diff.

<details>
<summary>Answer</summary>

What, why, how verified, and where to look first. The fourth element directs a reviewer's limited
attention to the riskiest part of the diff instead of spreading it evenly across every changed file.

</details>

**Q10 (co-10 -- blameless-postmortem-structure).** What four things does a well-formed postmortem
have, and what must its root cause trace to?

<details>
<summary>Answer</summary>

A timeline, an impact statement, a root cause, and owned follow-ups, all in actor-neutral language.
The root cause must trace to a systemic condition -- a missing safeguard, an untested assumption --
never to an individual's mistake.

</details>

**Q11 (co-11 -- diagrams-as-communication).** What two things must be true for a diagram to earn its
place?

<details>
<summary>Answer</summary>

A reader must be able to state the flow or structure faster from the diagram than from equivalent
prose, and every name the diagram uses must also appear in the surrounding prose, and vice versa.

</details>

**Q12 (co-12 -- c4-model-levels).** What specific failure mode does co-12 warn about, and what's the
fix?

<details>
<summary>Answer</summary>

One diagram overloaded to answer two different readers' questions at once -- for example, a context
diagram that also shows internal containers. The fix: stay at exactly one C4 level per diagram.

</details>

**Q13 (co-13 -- rfc2119-keyword-precision).** What single formatting rule does RFC 8174 add to RFC
2119's keywords, and why does it matter?

<details>
<summary>Answer</summary>

The keywords (MUST, SHOULD, MAY, and their negatives) carry this precise meaning only when written in
ALL CAPS -- a lowercase "should" in the same document reads as ordinary English, not as the RFC 2119
keyword, so the capitalization itself is load-bearing.

</details>

**Q14 (co-14 -- editing-cut-hedging-filler).** Is editing for hedging and filler about removing
content or removing dilution, and what's the test for whether an edit succeeded?

<details>
<summary>Answer</summary>

Removing dilution, not content -- editing is removal, not addition. The test: every remaining
sentence still reads as a complete, standalone claim, with every hedge (I think, sort of) and filler
word (just, really, basically) gone.

</details>

**Q15 (co-15 -- audience-register-match).** What is actually different between an executive-register
and an engineer-register version of the same update, and what stays the same?

<details>
<summary>Answer</summary>

Vocabulary, level of technical detail, and framing differ, each calibrated to what that audience
needs to decide or do next. The underlying decision or fact being communicated stays identical --
it's the same truth, written twice.

</details>

**Q16 (co-16 -- doc-proportionality).** What determines whether a decision deserves a PR comment or a
full RFC?

<details>
<summary>Answer</summary>

The decision's stakes and reversibility -- not habit or a team's default format. A reversible,
low-stakes call gets a lightweight artifact; an expensive-to-reverse, high-stakes call gets the full
RFC/ADR treatment.

</details>

**Q17 (co-17 -- doc-rot-close-to-code).** What three properties keep a document from rotting, and what
makes a stale wiki page dangerous rather than just outdated?

<details>
<summary>Answer</summary>

Dated, version-controlled, and colocated with the code it describes. A stale wiki page is dangerous,
not merely outdated, because it reads with exactly the same confident, authoritative tone whether it
is accurate today or two years stale -- a reader has no way to tell just by reading it.

</details>

## Applied scenarios

Eleven scenarios. Each is self-contained -- everything you need is in the prompt itself, no other page
required. Decide which concept and which move applies, then check.

**AS1.** A design doc's Open Questions section includes: "Should we backfill existing invoices with
UUIDs? (Yes, we've decided to backfill all invoices over the next release.)" What's wrong, and what
should replace it?

<details>
<summary>Answer</summary>

This item is not actually open -- the parenthetical is a decision already made, misfiled as a
question (co-04's rule: no undecided item stated as a decision, and symmetrically, no decided item
hidden inside Open Questions). It should be promoted to its own Decision statement elsewhere in the
doc, leaving Open Questions to contain only genuinely undecided items.

</details>

**AS2.** An SRE drafts "ADR-014: Migrate to Managed Postgres AND Adopt a New Deploy Pipeline." A
reviewer flags it before merging. What's the concern?

<details>
<summary>Answer</summary>

It fails co-06's one-decision rule -- two unrelated decisions (a database migration, a deploy-pipeline
change) are folded into one record. If the deploy pipeline changes again later, the ADR's status field
has no clean way to represent "half of this record is superseded, half isn't." It should split into
ADR-014 and ADR-015.

</details>

**AS3.** A team says its old ADR-009 "Use polling for order sync" is "basically obsolete now, we do
webhooks," but nobody has updated the file, and a code comment still cites ADR-009 as current. What's
broken, and how should it be fixed?

<details>
<summary>Answer</summary>

This violates co-07's lifecycle rule -- a changed decision must produce a new ADR that supersedes the
old one, with the old one's status field updated to "Superseded by ADR-0XX." The fix: write the new
ADR recording the webhook decision, mark ADR-009's status as superseded and link forward, and update
the code comment to cite the new ADR.

</details>

**AS4.** A junior engineer stores a "Payment Gateway Integration ADR" in a Google Doc titled "PayFlow
Notes (draft, WIP)," shared with the team via a Slack link. What does this violate?

<details>
<summary>Answer</summary>

Co-08's colocation-and-immutability rule twice over -- it doesn't live in the repository next to the
code it governs (a future reader of the payment-gateway code has no way to discover it), and "draft,
WIP" in a shared Google Doc invites ongoing silent edits rather than a dated, immutable record. It
should be a dated, accepted ADR file in the repository.

</details>

**AS5.** A PR titled "Fix stuff" with the description "see commit messages" touches 22 files across
three services. What's wrong, and what should the description contain?

<details>
<summary>Answer</summary>

It fails co-09 entirely -- no what, why, how-verified, or where-to-look-first, and "see commit
messages" pushes the work of reconstructing the change back onto the reviewer. For a 22-file,
three-service diff, the "where to look first" element matters most: the author should name the one or
two files carrying genuinely new logic, distinct from the mechanical changes elsewhere.

</details>

**AS6.** A postmortem reads: "Priya forgot to check the rate limit before deploying, causing the
outage." What's the blameless-writing violation, and how should this be rewritten?

<details>
<summary>Answer</summary>

This violates co-10 twice -- it names an individual, and it stops at "forgot," a personal-mistake
framing rather than a systemic one. A blameless rewrite asks why the deploy process didn't structurally
catch a missing rate-limit check (a 5-whys chain, per Worked Scenario 20) and lands on a systemic gap
-- for example, "the deploy checklist has no required rate-limit-capacity step" -- with an owned
follow-up to add one.

</details>

**AS7.** An architecture diagram shows Service A calling Service B directly, but the prose next to it
describes Service A publishing an event that Service C (not pictured) consumes and then calls Service
B. What's wrong?

<details>
<summary>Answer</summary>

This violates co-11's consistency rule -- Service C is named in the prose but missing from the
diagram, and the diagram shows a direct call that doesn't match the prose's described event-driven
flow at all. The diagram should be corrected to show Service C and the actual event-publish
relationship, matching the prose exactly in both directions.

</details>

**AS8.** A requirements doc states: "Passwords should be hashed before storage, and sessions should
probably expire after some reasonable time." A new engineer implements weak hashing and an unbounded
session, reasoning "the doc didn't say I had to do otherwise." Where's the failure, and what's the
fix?

<details>
<summary>Answer</summary>

This is co-13's exact failure mode -- "should" and "should probably" leave the requirement's actual
strength ambiguous, and the engineer's reading, while defensible given the vague wording, was not what
the author intended. The fix: "Passwords MUST be hashed with argon2id or equivalent before storage.
Sessions MUST expire after 24 hours of inactivity" -- ALL-CAPS RFC 2119 keywords stating the exact,
unambiguous requirement strength.

</details>

**AS9.** A 40-page "Q3 Platform Strategy" RFC is written and shipped to decide whether to rename a
single feature flag from `beta_checkout` to `new_checkout_flow`. What's wrong, and what artifact
should have been used instead?

<details>
<summary>Answer</summary>

This violates co-16's proportionality rule -- a trivially reversible, single-file rename does not need
a 40-page RFC; the review attention it consumed was borrowed from a future decision that actually
needed that scrutiny. A one-line PR comment or, at most, a short PR description would have been
proportionate.

</details>

**AS10.** A weekly update to a VP opens with three paragraphs of sprint-retro detail before finally
stating, in the fourth paragraph, "we shipped the checkout redesign and it's meeting the SLA." What's
wrong, and what's the fix?

<details>
<summary>Answer</summary>

This fails both co-01 (the decision/outcome isn't in the first sentence) and co-02 (a reader who stops
after two paragraphs has no conclusion, only retro detail). The fix: open with "Checkout redesign
shipped and is meeting its SLA" as the first sentence, and move the sprint-retro detail below it, in
descending order of importance.

</details>

**AS11.** A "C4 Container Diagram" for a chat app shows only three big boxes -- "Frontend," "Backend,"
"Database" -- with unlabeled arrows between them, and the team uses this single diagram for both a
new-engineer onboarding doc and a production on-call runbook. What's wrong?

<details>
<summary>Answer</summary>

This fails co-12 in two ways: the boxes name no technology (what is "Backend" actually built with, and
what protocol connects it to "Frontend"?), and using one under-detailed diagram for both onboarding
(which may only need context-level detail) and an on-call runbook (which needs real container-level
detail with technology and protocol) forces one artifact to serve two different readers' questions
poorly. Each container needs its technology named, and the two audiences likely need two diagrams at
two different C4 levels.

</details>

## Artifact recreation drills

Six before/after document-repair drills. Each gives a flawed, self-contained mocked artifact -- spot
and fix the flaw yourself, then compare against the "after" version and its root-cause explanation.

### Drill 1 -- status update that buries the decision

**Before**:

> Spent the morning digging into why the checkout page's conversion rate dipped 2% starting Tuesday.
> First checked whether it was a deploy -- nothing shipped that day. Then checked the A/B test
> dashboard -- no experiment changes either. Eventually found that the new "estimated delivery date"
> widget was rendering a blank date for international addresses due to a timezone-parsing bug, which
> is probably scaring off checkout for those customers. I think we should roll it back today.

<details>
<summary>Model fix and root cause</summary>

**After**:

> **Decision needed today: roll back the "estimated delivery date" widget.** It renders a blank date
> for international addresses (a timezone-parsing bug), which correlates with Tuesday's 2% checkout
> conversion dip. No deploy or A/B test change explains the dip -- this widget is the confirmed cause.

**Root cause**: the decision and the ask are stated only in the final sentence, after three paragraphs
of investigation narrative -- co-01 requires both to appear in the literal first sentence. A reader
scanning a busy channel is likely to miss the ask entirely.

</details>

### Drill 2 -- ADR with no status field

**Before**:

```text
ADR-022: Use a Circuit Breaker for the Payments-Gateway Client

Context: the payments gateway occasionally times out under its own load, and a slow client-side
retry loop compounds the problem by holding connections open.

Decision: wrap the payments-gateway client in a circuit breaker (5 consecutive failures trips
it; 30-second cooldown before a half-open retry).

Consequences: requires a new dependency; adds one new failure mode (a false-positive trip) to
monitor for.
```

<details>
<summary>Model fix and root cause</summary>

**After**: add a `Status: Accepted` line (with a date) directly beneath the title, before Context.

**Root cause**: co-07 requires every ADR to carry a status field -- without one, a future reader has
no way to tell whether this decision is still live, was rejected after review, or has since been
superseded by a later ADR. The context/decision/consequences content alone is not enough; the
lifecycle state is a required, separate element.

</details>

### Drill 3 -- PR description missing "where to look first"

**Before** (a 12-file diff): "What: refactors the order-fulfillment pipeline's retry logic. Why: the
old retry logic didn't back off, causing thundering-herd retries during partner outages. How verified:
existing test suite passes."

<details>
<summary>Model fix and root cause</summary>

**After**: add a fourth element -- "Where to look first: `fulfillment/retry_policy.py`'s new
`compute_backoff()` function. The other 11 files are call-site updates threading the new backoff
parameter through; this is the only file with new logic."

**Root cause**: co-09 requires all four elements, not three -- what, why, and how-verified alone leave
a reviewer facing 12 files with no guidance on where the actual risk is concentrated, and likely to
spread limited review attention evenly across all of them instead of concentrating it where it's
needed.

</details>

### Drill 4 -- postmortem with blame language

**Before**: "Root cause: the on-call engineer didn't notice the disk was filling up because they were
handling a different ticket at the time. They should have been more attentive."

<details>
<summary>Model fix and root cause</summary>

**After**: "Root cause (5 whys): disk usage alerting only fires at 95% full, leaving a narrow window
between alert and actual exhaustion; the on-call engineer had no earlier warning to act on while
already engaged with a separate, concurrent incident. Systemic root cause: no alert exists at an
earlier utilization threshold (e.g., 80%) that would give on-call time to act even while handling
something else."

**Root cause of the drill itself**: the "before" version violates co-10 -- it names an individual and
frames the cause as a personal attentiveness failure ("should have been more attentive") rather than
tracing to a systemic gap (the alerting threshold itself). A blameless rewrite asks why the system
didn't make the problem visible earlier, not why a person didn't notice it sooner.

</details>

### Drill 5 -- diagram missing a component the prose describes

**Before**: prose states "a failed payment triggers a webhook to the Fraud Review service, which can
either approve or escalate to a human reviewer queue," but the accompanying diagram shows only
`Payment Service --> Fraud Review Service`, with no human reviewer queue node at all.

<details>
<summary>Model fix and root cause</summary>

**After**: add a `Human Reviewer Queue` node and an `escalates to` edge from Fraud Review Service to
it, matching the prose exactly.

**Root cause**: co-11 requires every name the prose uses to also appear in the diagram, and vice
versa. A reader relying on the diagram alone would conclude escalation to a human reviewer doesn't
exist in this system -- a materially incomplete picture that looks authoritative precisely because it
is a diagram.

</details>

### Drill 6 -- vague requirement language in a schema contract

**Before**: "The `webhook_signature` header should probably be validated before trusting the payload,
and clients should ideally retry on a 5xx with some backoff."

<details>
<summary>Model fix and root cause</summary>

**After**: "Consumers MUST validate the `webhook_signature` header before trusting the payload.
Clients SHOULD retry on a 5xx response using exponential backoff."

**Root cause**: co-13 requires ALL-CAPS RFC 2119 keywords for unambiguous requirement strength --
"should probably" and "should ideally" leave a reader to guess whether skipping the behavior is a
minor style deviation or a security gap. Signature validation is genuinely non-negotiable (MUST);
retry behavior is a recommendation with room for judgment (SHOULD) -- the rewrite makes that
distinction explicit instead of blurring both into the same vague register.

</details>

## Self-check checklist

Confirm each item without checking the concepts page first. If you hesitate, that concept needs
another pass.

- [ ] I can state a document's decision and ask from its literal first sentence alone, or recognize
      when a first sentence fails to carry both. (co-01)
- [ ] I can reorder a discovery-order document so a reader who stops after two paragraphs still has
      the conclusion. (co-02)
- [ ] I can run the thirty-second skim test on my own document -- headings, bold, first sentences
      only -- and tell whether it yields the decision and next action. (co-03)
- [ ] I can write a design doc/RFC with all six required elements, keeping Open Questions honestly
      separate from decided items. (co-04)
- [ ] I can tell the difference between an RFC that was merely posted and one that actually earned
      "Accepted" through a real review cycle. (co-05)
- [ ] I can write an ADR that records exactly one decision, and recognize when a draft should split
      into two. (co-06)
- [ ] I can supersede an ADR correctly -- new record, old record's status updated, links in both
      directions, no silent edit. (co-07)
- [ ] I can explain why an ADR belongs in the repository next to the code it governs, dated and
      immutable, rather than in a wiki. (co-08)
- [ ] I can write a PR description with all four elements, including a "where to look first" pointer
      for a large diff. (co-09)
- [ ] I can write a postmortem's timeline, impact, root cause, and follow-ups in actor-neutral
      language, with a root cause that traces to a systemic gap. (co-10)
- [ ] I can judge whether a diagram earns its place over prose, and check that every name in one
      appears in the other. (co-11)
- [ ] I can pick the right C4 level for a given reader's question and keep a diagram from mixing two
      levels. (co-12)
- [ ] I can rewrite a vague requirement using ALL-CAPS RFC 2119 keywords with the correct strength.
      (co-13)
- [ ] I can edit a hedged, filler-laden paragraph down to standalone claims without changing its
      meaning. (co-14)
- [ ] I can write two versions of the same update, matched to two different audiences' vocabulary and
      detail level. (co-15)
- [ ] I can match an artifact's weight to a decision's actual stakes and reversibility, in both
      directions (not over- or under-documenting). (co-16)
- [ ] I can explain why a dated, colocated document resists rot in a way a wiki page cannot, even when
      both happen to be accurate today. (co-17)
- [ ] I can explain, in one sentence, why a design doc's job is a decision that ships and holds rather
      than an exhaustive treatise that tries to resolve every open question before it can ship.
      (`correctness-vs-pragmatism`)
- [ ] I can explain, in one sentence, why a well-scoped ADR or RFC keeps one decision cross-linked to
      its neighbors instead of inlining everything into one sprawling document. (`coupling-vs-cohesion`)

## Elaborative interrogation and self-explanation

Six why/why-not prompts, tied to this topic's two Cross-Cutting Big-Idea tags. Answer each in your own
words before opening the model explanation.

**E1 (`correctness-vs-pragmatism`).** Why does this topic insist an RFC's Open Questions section
should stay explicitly unresolved rather than pushing the author to force an answer to every question
before shipping?

<details>
<summary>Model explanation</summary>

An RFC that refuses to ship until every conceivable question is answered never ships -- pragmatism
means capturing the trade-off that matters now and naming what remains genuinely open, not achieving
false completeness. Forcing a premature answer to a genuinely undecided question produces an answer
nobody actually believes, which is worse for the document's trustworthiness than an honest "undecided,
deferred, tracked as a follow-up."

</details>

**E2 (`correctness-vs-pragmatism`).** Why is an ADR deliberately not required to reproduce the RFC's
full deliberation (the distillation pattern) -- isn't that throwing away important context?

<details>
<summary>Model explanation</summary>

The ADR's job is durable, cheap citability, not completeness -- the RFC it always links back to
preserves the full deliberation for whoever genuinely needs it. Pragmatism here means matching each
document's completeness to how often it is actually consulted: most future readers only need "what was
decided and why it still holds," and making that answer cheap to get is what keeps people actually
citing the decision instead of skipping the reference entirely.

</details>

**E3 (`correctness-vs-pragmatism`).** Doc proportionality (co-16) says a reversible, low-stakes
decision should get a lightweight artifact -- why frame this as a pragmatic trade-off rather than
simply "always document less"?

<details>
<summary>Model explanation</summary>

It is not "always document less" -- a genuinely high-stakes, hard-to-reverse decision still gets the
full RFC/ADR treatment, in full. The pragmatism is calibration in both directions: under-documenting a
genuinely hard decision is just as much a proportionality failure as over-documenting a trivial one.
The discipline this topic teaches is matching weight to stakes, not minimizing weight on principle.

</details>

**E4 (`coupling-vs-cohesion`).** Why does this topic describe a design doc that also tries to be the
ADR, the runbook, and the onboarding guide as a "low-cohesion document"?

<details>
<summary>Model explanation</summary>

Cohesion, in code, means a module does one coherent thing. A document trying to do four unrelated jobs
at once -- deliberation record, decision record, operational runbook, onboarding material -- bundles
concerns that each have a different audience, a different update cadence, and a different lifecycle;
editing the runbook content risks silently changing the decision record sitting right next to it in
the same file. Splitting into separate documents is the documentation equivalent of decomposing a
low-cohesion module into focused ones.

</details>

**E5 (`coupling-vs-cohesion`).** How does co-06's "one decision per ADR" rule relate to coupling
rather than just "keep documents short"?

<details>
<summary>Model explanation</summary>

An ADR recording two decisions couples their lifecycles together -- you cannot mark one superseded
without the document somehow representing that only half of it actually changed, and its single status
field structurally cannot hold two different lifecycle states at once. One-decision-per-ADR decouples
each decision's lifecycle from every other decision's, for exactly the same reason a class doing two
unrelated things resists being safely changed or replaced independently of the other thing it does.

</details>

**E6 (`coupling-vs-cohesion`).** The C4 model (co-12) insists a context diagram and a container
diagram stay separate rather than one diagram showing both. How is that a coupling argument, not just
"don't overcrowd the picture"?

<details>
<summary>Model explanation</summary>

A combined diagram couples two different readers' concerns -- an executive asking "what does this talk
to" and an engineer asking "how is this built" -- into one artifact. A change relevant only at the
container level (adding a new internal service) forces re-touching the same diagram a context-level
reader also depends on, and vice versa. Separate diagrams at separate levels let each reader's
question, and each diagram's own update cadence, change independently -- the same benefit co-16 and
co-06 give the document formats themselves.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) &middot; Next:
[Computer Science Foundations](../../computer-science-foundations/learning/overview.md) →
