---
title: "Theme C: Humans in the Loop, Friction, and Recovery"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 30
---

Scenarios 23-33 design the layer that sits between an honest uncertainty signal (Theme B) and a
recoverable outcome: human review engineered as the product itself (co-11), costed honestly against
the vigilance decrement Scenario 7 first traced (co-12), friction that scales with an action's
actual consequence rather than applying uniformly (co-13), a preview that converts an irreversible
action into a reviewable one (co-14), and undo that is worth more than a marginal accuracy gain
(co-15). The theme closes with the correction affordance that recovers the user in the moment and
feeds the next error-analysis pass (co-24).

---

### Worked Scenario 23: Review as the Product

**Context**: Exercises co-11. Nimbus drafts a contract-renewal reminder email; Priya reviews and
sends it. This scenario measures whether the review step is actually faster than Priya writing the
reminder herself, which is the test that determines whether "review" is a real product or a
ceremony.

**Decision artifact**:

> **Review-flow timing -- draft-and-review vs. write-from-scratch**
>
> - **Write from scratch**: Priya locates the contract, extracts the renewal date and party
>   details, and drafts the reminder email herself. Measured average: 6 minutes 40 seconds.
> - **Nimbus draft + review**: Nimbus produces a structured draft (Scenario 20's per-field
>   structure, each field cited); Priya checks the three cited fields and either approves or edits.
>   Measured average: 1 minute 15 seconds.
> - **Conclusion**: the review step is roughly 5x faster than the unaided task, satisfying co-11's
>   bar for treating review as the intended workflow rather than a compliance gate layered on top of
>   it.

**Verify**: the review-flow time is measured, not estimated, and is meaningfully faster than the
unaided-task time -- satisfying co-11's rule that review-as-product requires review to actually be
faster than doing the work.

**Key takeaway**: Review only earns the label "the product" if it is measurably faster than the
alternative -- a review step that merely feels thorough, without being timed against the
unaided task, has not actually demonstrated its value.

**Why It Matters**: This timing discipline is what separates Scenario 23 from Scenario 26's review
theatre later in this theme -- the same review UI can be a genuine product or empty ceremony
depending entirely on whether it clears this timing bar, which is why measuring it is not optional. Any team proposing a new human-in-the-loop feature should run this exact comparison before shipping it, because a review flow that has never been timed against its unaided alternative is an unverified claim, not a demonstrated one.

---

### Worked Scenario 24: Review That Costs More Than Doing

**Context**: Exercises co-11 and co-12. A different Nimbus feature -- auto-summarizing customer
support tickets for a manager's weekly digest -- failed this exact timing test. This scenario
measures the failure and redesigns it.

**Decision artifact**:

> **Review-cost failure and redesign**
>
> - **Original design**: Nimbus generates a free-text paragraph summarizing each of forty weekly
>   tickets; the manager reads each summary against the original ticket thread to confirm accuracy
>   before including it in the digest. Measured average review time: 3 minutes 10 seconds per ticket
>   -- longer than reading the original ticket thread directly (2 minutes 20 seconds).
> - **Diagnosis**: the free-text summary format (unlike Scenario 20's structured fields) gave the
>   manager nothing cheap to check against -- verifying a paragraph summary required essentially
>   re-reading the source anyway.
> - **Redesign**: switch to a structured summary (status, key blocker, next action, each with a
>   direct quote citation from the thread) -- re-measured review time: 55 seconds per ticket,
>   clearing the value-add bar.

**Verify**: the original design's measured review time exceeds the unaided-reading time it was meant
to replace, and the redesign's re-measured time clears it -- satisfying co-11 and co-12's rule that
a review step destroying its own value proposition must be redesigned, not quietly accepted.

**Key takeaway**: A review step is not automatically valuable just because a human is in the loop --
if reviewing costs more than doing the underlying work, the feature has saved the user nothing, and
the honest fix is redesigning the output's verifiability (co-10), not lowering the review bar.

**Why It Matters**: This is the concrete instance of the tension this course's overview names
explicitly -- a feature whose output must be fully checked has saved the user nothing but typing.
The fix here came from applying Theme B's structured-output pattern to the review step itself, which
is exactly how co-10 and co-11 compose in practice.

---

### Worked Scenario 25: Vigilance-Decrement Mitigation

**Context**: Exercises co-12 and co-05. Continuing Scenario 7's fifty-item review trace, this
scenario designs concrete mitigations for the point of collapse identified there (roughly item
15-20) and states each mitigation's own cost.

**Decision artifact**:

| Mitigation                      | Mechanism                                                                                                | Cost                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Smaller batch size (10, not 50) | Splits the session before the collapse point identified in Scenario 7.                                   | More context-switching between batches; slightly lower total throughput per hour.      |
| Random re-audit sampling        | 1-in-10 already-approved items are silently re-shown later in the session for a second check.            | Adds review volume; requires tracking which items were sampled and comparing verdicts. |
| Forced-attention checkpoint     | Every 12th item requires an active field-by-field confirmation click, not a single "approve all" action. | Adds friction to every session, including ones where it turns out not to be needed.    |

**Verify**: each mitigation names its own concrete cost, not only its benefit -- satisfying co-12's
rule that a vigilance-decrement mitigation that ignores its own cost is not a complete design.

**Key takeaway**: Every mitigation for the vigilance decrement trades some throughput or convenience
for restored scrutiny -- there is no free fix, only a choice about which cost a given review
workflow can afford.

**Why It Matters**: This table gives Marcus's review flow (Scenario 7) concrete, costed options
rather than a vague instruction to "pay more attention." Reviewing this cost table alongside
Scenario 23's timing bar is what lets a team choose a mitigation without accidentally recreating
Scenario 24's failure -- adding so much friction that review once again costs more than doing the
work.

---

### Worked Scenario 26: Review Theatre

**Context**: Exercises co-12 and co-11. A Nimbus approval gate requires a manager's sign-off before
any auto-generated vendor payment reminder is sent. This scenario audits whether the gate provides
real safety.

**Decision artifact**:

> **Review-theatre audit -- vendor-payment-reminder approval gate**
>
> - **Observed behaviour**: session recordings across 30 approvals show a median time-to-click of
>   1.8 seconds between the approval screen loading and the "Approve" button being clicked -- not
>   enough time to read the reminder's contents, let alone verify them against the vendor record.
> - **Root cause**: the gate exists as a policy checkbox ("a human approved this") with no design
>   pressure making genuine review the path of least resistance -- clicking "Approve" immediately is
>   easier than reading first, and nothing in the interface changes that.
> - **Verdict**: this gate provides no real safety and adds a full business day of delay to every
>   reminder, for a check that is not actually happening.
> - **Redesign direction**: apply Scenario 20's structured, per-field citation format so a genuine
>   1-minute review becomes practical, then measure again before re-certifying the gate as real
>   review.

**Verify**: the audit is based on measured time-to-click across real sessions, not an assumption,
and states a concrete verdict (no real safety provided) -- satisfying co-12 and co-11's rule that a
review step's legitimacy is an empirical question, not a policy assertion.

**Key takeaway**: A review gate that exists on paper but is not designed to make genuine review
practical provides the appearance of safety and the reality of pure delay -- and the two are
distinguishable only by measuring actual reviewer behaviour.

**Why It Matters**: This audit technique -- measuring time-to-click against a plausible reading
time -- is a cheap, repeatable check any team can run on an existing approval gate to tell review
theatre from review-as-product (Scenario 23) before investing further in either direction. Any existing approval gate in a product is worth auditing this same way at least once -- gates decay into theatre quietly, without any single visible incident marking the moment they stopped providing real protection.

---

### Worked Scenario 27: Consequence-Scaled Friction Table

**Context**: Exercises co-13. Nimbus can take five distinct actions on a user's behalf, ranging from
displaying a read-only summary to sending an external email. This scenario maps every action's
required confirmation level to its actual reversibility and blast radius.

**Decision artifact**:

| Action                                       | Reversibility                         | Blast radius                                 | Required confirmation                                                                    |
| -------------------------------------------- | ------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Display a read-only summary                  | Fully reversible (nothing changed)    | None -- affects only the current view.       | None.                                                                                    |
| Save a draft to the user's own workspace     | Fully reversible (user can delete it) | Low -- private to the user.                  | None; auto-saved with a visible undo toast.                                              |
| Update an internal tracking field            | Reversible via edit history (co-15)   | Low -- internal record only.                 | Single click, no modal.                                                                  |
| Schedule a calendar reminder for a colleague | Reversible (can be cancelled)         | Medium -- affects another person's calendar. | One confirmation step, showing exactly what will be scheduled (co-14).                   |
| Send an external email to a vendor           | Irreversible once delivered           | High -- external, contractual visibility.    | Explicit preview-and-diff (co-14) plus a typed confirmation, no default "send" shortcut. |

**Verify**: every row's required confirmation level is justified by that row's own stated
reversibility and blast radius, and no two rows with meaningfully different consequences share the
same confirmation level -- satisfying co-13's rule.

**Key takeaway**: Confirmation level is a function of two independent properties -- how reversible
an action is, and how far its effects reach -- and mapping every action against both, explicitly,
is what prevents friction from being applied uniformly.

**Why It Matters**: This table is the direct rebuttal to Scenario 28's uniform-friction failure --
it demonstrates that friction can be precisely targeted rather than either "confirm everything" or
"confirm nothing," once an action's actual consequence is named rather than assumed. Building this table also forces a team to enumerate every action a feature can actually take, which frequently surfaces an action nobody had explicitly designed friction for at all.

---

### Worked Scenario 28: Uniform Friction Fails

**Context**: Exercises co-13. Before Scenario 27's table existed, an earlier Nimbus revision required
the identical confirmation modal for every one of the five actions, including the read-only summary
display. This scenario documents what happened to user behaviour.

**Decision artifact**:

> **Uniform-friction failure log**
>
> - **Design**: every action, from displaying a summary to sending an external email, required
>   clicking "Confirm" on an identical modal.
> - **Observed behaviour**: users developed a reflex of clicking "Confirm" immediately upon seeing
>   the modal, regardless of the action underneath it -- the modal for sending an external email was
>   clicked through with the same speed as the modal for displaying a summary.
> - **Consequence**: one vendor email was sent with an incorrect payment amount, confirmed by the
>   exact same reflexive click that had, correctly, confirmed dozens of harmless read-only actions
>   before it.
> - **Root cause**: applying identical friction to every action trained users to treat the
>   confirmation step as noise, which erased its value for the one action -- sending external
>   email -- that genuinely needed it.

**Verify**: the log traces a concrete incident (the wrong-amount vendor email) directly to the
uniform-friction design, and states the specific behavioural mechanism (a trained reflexive click)
responsible -- satisfying co-13's rule.

**Key takeaway**: Friction spent uniformly is friction spent nowhere -- a confirmation step that
never varies in weight trains users to click through it regardless of what is actually at stake.

**Why It Matters**: This incident is what motivated Scenario 27's table in the first place, and it
is a direct, concrete illustration of the trade-off named in this course's own overview: friction
is a scarce resource, and spending it uniformly leaves none, functionally, for the action that
needed it most. The specific incident here -- a wrong payment amount confirmed by reflex -- is the kind of failure that looks, in hindsight, like a training or attention problem, when the interface's own uniform friction design was the actual root cause.

---

### Worked Scenario 29: Preview and Diff

**Context**: Exercises co-14. Building on Scenario 27's highest-friction row, this scenario designs
the preview-and-diff step for Nimbus's external-vendor-email action, and shows a case where it
catches an error a plain confirmation dialog would have missed.

**Decision artifact**:

> **Preview-and-diff design -- external vendor email**
>
> - **What it shows before send**: the exact recipient address, subject line, and full email body,
>   with the specific payment amount and due date visually highlighted (not merely mentioned in
>   passing text) against the source record they were drawn from.
> - **Caught case**: Nimbus drafted an email stating "$4,500" as the payment amount; the highlighted
>   field, shown beside the source contract's actual figure ("$5,400" -- the digits transposed),
>   made the discrepancy visible at a glance. Priya caught it in the preview and corrected it before
>   sending.
> - **Why a plain confirmation dialog would have missed this**: a generic "Send this email? [Confirm]"
>   dialog does not surface the specific field values at all -- catching a transposed digit requires
>   the exact field being shown, highlighted, and compared to its source, which is what a diff view
>   does and a confirmation dialog does not.

**Verify**: the design names the specific field-level highlight that caught the transposed-digit
error, and the design is contrasted against what a generic confirmation dialog would have shown
instead -- satisfying co-14's rule that a preview must show the exact change, not merely describe
the action.

**Key takeaway**: A confirmation dialog asks "do you want to do this?" -- a diff view asks "is this
specific value correct?" -- and only the second question is capable of catching a transposed digit
or any other field-level error.

**Why It Matters**: This is co-14's concrete payoff: converting an irreversible action (an email,
once sent, cannot be unsent) into a genuinely reviewable one by showing exactly what will change,
not merely that something will. The same mechanism generalizes to any structured action a feature can take on a user's behalf -- scheduling, updating a record, or modifying a file all benefit from the same field-level, before#47;after treatment.

---

### Worked Scenario 30: Undo Beats Accuracy

**Context**: Exercises co-15. Nimbus's product team has a fixed engineering budget and must choose
between two investments: a model fine-tune projected to raise summary accuracy from 96% to 97%, or
building complete undo for the internal-tracking-field update action (Scenario 27's third row).
This scenario compares the two.

**Decision artifact**:

> **Investment comparison -- marginal accuracy vs. complete undo**
>
> - **Option A -- accuracy fine-tune**: projected cost, six engineer-weeks; projected benefit, 1
>   percentage point higher accuracy, reducing errors from roughly 4-in-100 to roughly 3-in-100 --
>   but every remaining error is still unrecoverable without a manual fix.
> - **Option B -- complete undo for tracking-field updates**: projected cost, two engineer-weeks;
>   projected benefit, every error (all 3-4 in 100, today and after any future model change) becomes
>   a one-click, fully reversible fix with no manual database correction required.
> - **Decision**: Option B. It costs less, and its value compounds across every future error the
>   feature will ever produce, while Option A's value is capped at a single percentage point and
>   erodes the moment a future model update changes the error distribution again.

**Verify**: the comparison states both options' cost and the scope of what each fixes (a fraction of
future errors vs. all of them, forever), and the decision follows directly from that comparison --
satisfying co-15's rule that undo is usually both cheaper and more valuable than a marginal accuracy
gain.

**Key takeaway**: A marginal accuracy improvement fixes a fraction of future errors once; complete
undo fixes all of them, every time, for a comparable or lower engineering cost -- which is why undo
is very often the better investment.

**Why It Matters**: This comparison is the concrete argument behind co-15's general claim, made with
real, comparable engineering costs rather than an abstract preference -- exactly the kind of
trade-off analysis a real product team would need to make this decision defensibly. Framing the choice explicitly as a cost-versus-scope comparison also gives a product team language to defend the decision to stakeholders who might otherwise default to assuming accuracy work is always the higher-priority investment.

---

### Worked Scenario 31: Partial Undo Is a Trap

**Context**: Exercises co-15. Nimbus's first attempt at undo for the tracking-field update reversed
the field's value but did not reverse a side-effect notification that had already been sent to a
colleague. This scenario documents the resulting incorrect mental model.

**Decision artifact**:

> **Partial-undo incident log**
>
> - **What "undo" did**: reverted the tracking field's displayed value to its prior state.
> - **What "undo" did not do**: the colleague-notification event, triggered the moment the field was
>   first updated, had already been sent and was not retracted or followed up by any corrective
>   message.
> - **User's incorrect mental model**: Priya, having clicked "Undo," believed the entire action had
>   been reversed -- including the notification -- and took no further action to correct her
>   colleague's now-stale information.
> - **Consequence**: the colleague acted on the stale notification for two days before discovering
>   the discrepancy independently.
> - **Fix**: undo must either reverse every effect of the original action (including the
>   notification, via a correction message) or explicitly tell the user which effects it could not
>   reverse -- never imply completeness it does not have.

**Verify**: the incident log identifies the specific effect (the notification) undo failed to
reverse, and states the user's resulting incorrect belief and its real-world consequence --
satisfying co-15's rule that undo must be complete, not partial.

**Key takeaway**: An undo that reverses some effects but not all of them is worse than no undo at
all, because it creates false confidence that the action has been fully reversed when it has not.

**Why It Matters**: This is the sharpest illustration of why co-15 insists on "complete" reversal,
not merely "some" reversal -- Scenario 30's investment case only holds if the undo actually built is
complete; a partial undo delivers Option B's engineering cost without its promised safety benefit. Any team building undo for a multi-effect action should inventory every side effect before claiming completeness -- a notification, a downstream webhook, or a cached copy are all easy to miss until an incident like this one exposes the gap.

---

### Worked Scenario 32: Correction Affordance

**Context**: Exercises co-24 and co-15. This scenario designs the in-context way a user corrects a
wrong Nimbus answer, distinct from undo (which reverses an action Nimbus took) -- this is about
correcting the answer itself.

**Decision artifact**:

> **Correction-affordance design -- Nimbus answer correction**
>
> - **Trigger**: an inline "This isn't right" link beside every answer, always visible, not hidden
>   behind a menu.
> - **Flow**: clicking it opens a small form asking for the correct value and, optionally, why the
>   original was wrong; submitting immediately updates what the user sees (recovering the user in
>   the moment) and logs the correction with the original answer, the user's correction, and the
>   source citation Nimbus had used.
> - **What makes this a recovery path, not just a feedback form**: the user's own view is corrected
>   immediately, before any backend reprocessing -- they are not left waiting on a fix to see
>   accurate information.

**Verify**: the design confirms the user's own view is corrected immediately upon submission (not
only logged for later), satisfying co-15's recovery requirement, and confirms the correction is
logged with enough context (original answer, correction, citation) to be usable later, satisfying
co-24's requirement.

**Key takeaway**: A correction affordance does two jobs at once -- it recovers the current user
immediately, and it captures a structured, reusable record of exactly what went wrong for whoever
analyzes errors next.

**Why It Matters**: This scenario is the bridge into Scenario 33 -- a correction that only recovers
the current user and is then discarded wastes exactly the signal that would prevent the same
mistake from recurring for the next user who asks the same question. Making the affordance always visible, rather than buried behind a menu, also signals to the user that the product expects to be wrong sometimes -- reinforcing the honest first-contact framing Scenario 4 established.

---

### Worked Scenario 33: Feedback Into Error Analysis

**Context**: Exercises co-24. This scenario routes the corrections captured in Scenario 32 into
Nimbus's next error-analysis pass, closing the loop back into the eval work this course's
prerequisite courses cover.

**Decision artifact**:

> **Correction-routing plan**
>
> - **Weekly aggregation**: every logged correction (Scenario 32) is pulled into a weekly review,
>   grouped by which of Scenario 2's six failure modes it matches.
> - **Promotion rule**: any correction pattern recurring three or more times in a single week is
>   promoted to a new, permanent case in the eval dataset the light eval gate runs against -- the
>   exact mechanism `evaluating-ai-output-essentials`'s co-10 "regression cases from real bugs"
>   describes.
> - **Closes the loop into**:
>   [Evaluating AI Systems In Depth](../../evaluating-ai-systems-in-depth/learning/overview.md)'s
>   error-analysis workflow --
>   for corrections that recur but do not fit a simple, addable eval case.

**Verify**: the plan names a concrete promotion threshold (three or more recurrences in a week) and
a specific destination for each promoted correction (the eval dataset), satisfying co-24's rule that
a correction affordance must feed somewhere a later pass can actually use it.

**Key takeaway**: A correction is most valuable the second time it prevents the same mistake --
which only happens if it is routed somewhere systematic, not merely stored.

**Why It Matters**: This scenario is the explicit seam between this course's product-design patterns
and the measurement discipline of `evaluating-ai-output-essentials` and `evaluating-ai-systems-in-depth`
-- product patterns surface and recover from failures; the eval courses turn recurring failures into
permanent, measured regression tests, and this correction-routing plan is the mechanism that
connects the two. A team implementing this routing plan should revisit the promotion threshold periodically -- three recurrences a week may be too strict for a low-traffic feature or too lax for a high-stakes one, and the right number is itself a product decision.

---

← Previous: [Theme B: Uncertainty, Confidence, and Provenance](./theme-b-uncertainty-confidence-and-provenance.md) &middot; Next: [Theme D: Degradation, Latency, and the Launch Decision](./theme-d-degradation-latency-and-the-launch-decision.md) →
