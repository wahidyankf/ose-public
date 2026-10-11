---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Agentic Coding topic: recall first, then applied
judgment, then hands-on repetition, then a checklist, then a why/why-not pass to confirm real
automaticity, not just recognition. Every answer is hidden in a `<details>` block; try each item
yourself before opening it.

Every item below is self-contained and deterministic -- mocked/hand-constructed session transcripts,
configs, and diffs only, no live agent call, no external service, and no dependency on this topic's
own worked-example files.

## Recall Q&A

Twenty-four short-answer questions, one per concept (`co-01` through `co-24`). Answer from memory,
then check.

**Q1 (co-01 -- what is agentic coding).** What distinguishes an agent from single-shot autocomplete
or snippet generation?

<details>
<summary>Answer</summary>

An agent autonomously reads a repo, plans, edits, runs tools, and iterates across multiple steps
without being re-prompted for each one; autocomplete produces one suggestion from local context and
stops.

</details>

**Q2 (co-02 -- the perceive/plan/act/observe loop).** Name the four phases of the ReAct-style
agentic loop, in order.

<details>
<summary>Answer</summary>

Perceive (observe current state), Plan (reason about the next step), Act (invoke a tool), Observe
(read the tool's result) -- then the loop repeats, reasoning again from the new observed state.

</details>

**Q3 (co-03 -- context-window fundamentals).** Why does "what is loaded" shape an agent's output
quality even when the model itself is unchanged?

<details>
<summary>Answer</summary>

The agent reasons only within a finite context-window budget -- a fact, file, or instruction that
never entered the context simply does not exist for that turn's reasoning, no matter how correct or
relevant it would have been.

</details>

**Q4 (co-04 -- context management).** Why is "load more files" not a safe default for improving an
agent's answer?

<details>
<summary>Answer</summary>

More context is not always better -- irrelevant files compete for the same finite budget and can get
cited or leaned on in an answer where a scoped, pruned context would have stayed on-topic. Curating
what enters (and pruning what does not) is a deliberate, ongoing decision.

</details>

**Q5 (co-05 -- prompting for code).** What four elements does a well-specified prompt state up
front, rather than leaving implicit?

<details>
<summary>Answer</summary>

Goal, constraints, an example, and acceptance criteria -- stated before generation starts, not
inferred after the fact from a vague ask.

</details>

**Q6 (co-06 -- instruction files).** What problem does a persistent repo-level instruction file
(AGENTS.md/CLAUDE.md) solve that a one-off prompt does not?

<details>
<summary>Answer</summary>

It is read automatically every session, so build/test commands and conventions do not need to be
re-told each time -- the knowledge persists at the repo level instead of living only in one
conversation's context.

</details>

**Q7 (co-07 -- tool use and function calling).** How does an agent act on the world, structurally,
rather than just producing text?

<details>
<summary>Answer</summary>

By invoking discrete, named tools (read file, run shell, edit) with structured parameters -- the
model emits a tool call, not free-form prose the human must manually translate into an action.

</details>

**Q8 (co-08 -- MCP).** What does MCP standardize, and what transport does it run over?

<details>
<summary>Answer</summary>

It standardizes how a host application connects an agent to external tools, resources, and prompts
across vendors -- an open protocol over JSON-RPC 2.0, with a Hosts/Clients/Servers architecture.

</details>

**Q9 (co-09 -- plan mode vs. act mode).** What is the one structural difference between plan mode and
act mode, and what sits between them?

<details>
<summary>Answer</summary>

Plan mode is read-only exploration; act mode is write-enabled execution. An explicit approval step
sits between them -- the agent does not silently transition from planning to editing.

</details>

**Q10 (co-10 -- subagents and orchestration).** What returns to the main session when a subagent
finishes a delegated task?

<details>
<summary>Answer</summary>

Only a summary -- the subagent's own exploration detail (its full tool-call trace) stays isolated in
its own context and never enters the main conversation.

</details>

**Q11 (co-11 -- permissions and guardrails).** Who enforces an allow/deny/ask permission rule -- the
model or the harness?

<details>
<summary>Answer</summary>

The harness -- permission rules constrain which tools, paths, or commands an agent may use, enforced
by the surrounding system, not by the model choosing to comply.

</details>

**Q12 (co-12 -- sandboxing and reversibility).** Name the two complementary risk-reduction tactics
this concept combines.

<details>
<summary>Answer</summary>

Isolating risky actions (an OS-level sandbox or container) and preferring small, independently
revertable steps over one large change -- containment of a single action, plus cheap undo across a
sequence of them.

</details>

**Q13 (co-13 -- verification discipline).** What three things happen before building on any agent
output, and how strict is the rule?

<details>
<summary>Answer</summary>

Read it, run the test suite, and review the diff -- before building on it. The rule is absolute:
never trust an unverified change, no matter how plausible it looks.

</details>

**Q14 (co-14 -- test-driven agent workflows).** What role does a failing test play when driving an
agent?

<details>
<summary>Answer</summary>

It is the acceptance bar -- the agent is driven to green through a red-green-refactor cycle, and
"done" is not claimed until the previously-failing test passes.

</details>

**Q15 (co-15 -- diff review).** What standard of scrutiny does an agent-generated diff get, relative
to a human contribution?

<details>
<summary>Answer</summary>

The exact same code-review scrutiny -- no lighter pass just because a tool produced it.

</details>

**Q16 (co-16 -- hallucination awareness).** What makes a hallucinated API call dangerous, and what is
the only thing that reliably catches it?

<details>
<summary>Answer</summary>

It is plausible, confident, and entirely nonexistent -- reading it does not reveal the problem,
because it looks correct. Only verification against a real source (running it, or checking the
actual API reference) catches it.

</details>

**Q17 (co-17 -- trust vs. verify calibration).** Give one example of work safe to delegate lightly,
and one that demands close review.

<details>
<summary>Answer</summary>

Boilerplate scaffolding or a mechanical refactor is safe to delegate lightly (a skim usually
suffices); security-sensitive logic, concurrency, or genuinely novel logic demands close, line-by-line
human review.

</details>

**Q18 (co-18 -- cost and token budgeting).** Why does a multi-turn agent session need an explicit
budget and stopping condition?

<details>
<summary>Answer</summary>

Every turn consumes tokens/cost -- without a stated ceiling and a defined stopping condition, an
iterative session can keep spending with no natural end, even after the marginal value of another
round has dropped.

</details>

**Q19 (co-19 -- prompt-injection risk).** What is the attack, concretely, and what kind of content
carries it?

<details>
<summary>Answer</summary>

Untrusted content the agent reads (a fetched web page, an issue, a file) can embed instructions
("ignore prior instructions...") that hijack the agent's goal -- unless a guardrail specifically
blocks instructions arriving through that channel from taking effect.

</details>

**Q20 (co-20 -- agent skills).** What is a skill, structurally, and what problem does it solve versus
re-pasting guidance each session?

<details>
<summary>Answer</summary>

A packaged, filesystem-based procedure (frontmatter plus instructions) the agent loads on demand --
it replaces re-deriving or re-pasting the same guidance every session with one named, reusable,
version-controlled artifact.

</details>

**Q21 (co-21 -- spec-driven development).** What changes about the agent's role when a spec is
written first?

<details>
<summary>Answer</summary>

The agent implements against an executable specification and acceptance criteria that already exist,
rather than the developer deriving the acceptance bar ad hoc from a one-off prompt after the fact.

</details>

**Q22 (co-22 -- when not to use agents).** What three qualities of a task should make you hesitate to
delegate it?

<details>
<summary>Answer</summary>

High-stakes, novel, or cheaply-unverifiable -- delegating trades understanding and safety for speed
the situation cannot actually afford, especially when the output cannot be tested or reviewed fast.

</details>

**Q23 (co-23 -- iterative refinement).** How should agent output be treated across multiple rounds,
rather than as a single request?

<details>
<summary>Answer</summary>

As a multi-round correction loop -- generate, review, feed back the specific gap, regenerate --
rather than expecting one-shot correctness from the first generation.

</details>

**Q24 (co-24 -- human-in-the-loop).** What does "human-in-the-loop" require at a risky boundary,
specifically?

<details>
<summary>Answer</summary>

An explicit human decision point -- a pause and a recorded approval -- rather than granting the agent
full autonomy end to end through every risky step in a session.

</details>

## Applied scenarios

Twelve scenarios. Each is self-contained -- everything you need is in the prompt itself, no other
page required. Decide which concept and which move applies, then check.

**AS1.** An agent session's transcript shows: read `config.py`, edit `config.py`, run tests, all
inside four minutes, with no plan stated up front and no test failure ever shown. A teammate says
"this looks fine, it's fast." What should you check before agreeing?

<details>
<summary>Answer</summary>

Whether the diff was actually reviewed and the test run's output actually inspected (co-13) --
speed and a clean-looking log are not evidence of correctness by themselves. "It ran" is not the
same claim as "it was verified."

</details>

**AS2.** A developer pastes ten files into an agent's context "just in case one of them is relevant"
before asking a narrow question about one function. The answer cites a helper from an unrelated file
that happens to share a similar name. What went wrong?

<details>
<summary>Answer</summary>

Unpruned context (co-04) -- loading everything "just in case" gave the model material to
(incorrectly) draw from, when a scoped context containing only the actually-relevant file would have
kept the answer on-topic.

</details>

**AS3.** A prompt reads: "fix the bug in the payment module." The first generated diff changes three
unrelated functions and does not fix the reported symptom. What's the root cause, and what should the
next prompt add?

<details>
<summary>Answer</summary>

A missing well-specified prompt (co-05) -- no stated goal beyond "fix the bug," no constraint on
scope, no acceptance criteria. The next prompt should name the exact symptom, the expected behavior,
and a test that currently fails and must pass.

</details>

**AS4.** Two engineers each have their own personal instruction file with a conflicting rule about
commit message format; the repo also has its own AGENTS.md with a third rule. An agent session
follows the personal file's rule. Is that necessarily wrong?

<details>
<summary>Answer</summary>

Not necessarily -- it depends on the harness's documented loading behavior (co-06), which is
harness-specific, not universal. The right response is to check that specific harness's docs
rather than assume any one layer always wins: Claude Code, for example, documents instruction
files as concatenated into context in a broadest-to-narrowest load order, and states plainly that a
genuine contradiction between layers is resolved arbitrarily, not by a fixed override (ex-08). The
deeper fix is the same regardless of harness -- a personal file and a repo file should not disagree
on a rule in the first place.

</details>

**AS5.** An agent's tool-call log shows: edit `models.py`, edit `views.py`, run shell `rm -rf
build/`, read `models.py`. A reviewer flags the log before the diff is even inspected. What's the
concern?

<details>
<summary>Answer</summary>

The first action was a write, not a read (co-07) -- no exploratory read preceded the edits, meaning
the agent acted on an assumed rather than an actually-observed file state, raising the odds of an
edit based on stale or wrong assumptions.

</details>

**AS6.** A team adds an MCP server exposing a company-internal docs search tool. After restart, the
agent's tool list is unchanged. What's the first thing to check?

<details>
<summary>Answer</summary>

Whether the MCP server config was actually registered and the host actually restarted/reconnected
(co-08) -- an unchanged tool list after a config change almost always means the host never picked up
the new server, not that the protocol itself is broken.

</details>

**AS7.** An agent proposes a plan for a five-file refactor, then, without any further prompt, starts
editing files immediately after presenting the plan. What's missing?

<details>
<summary>Answer</summary>

The explicit approval step between plan mode and act mode (co-09) -- a stated plan is not itself
consent to execute it; a human decision point should sit between "here's the plan" and the first
write.

</details>

**AS8.** A subagent dispatched to research a third-party API's rate limits returns a two-paragraph
summary to the main session. A teammate asks to see the subagent's full browsing history "to be
sure." Is that available, and should it be?

<details>
<summary>Answer</summary>

By design, no (co-10) -- only the summary crosses back into the main session's context; the raw
exploration stays isolated. If the summary is insufficiently sourced, the fix is asking the subagent
for citations, not reaching into its private trace.

</details>

**AS9.** A permission config allows the agent to write anywhere under `src/` but a diff shows a write
to `.github/workflows/deploy.yml`, and the session log shows it succeeded. What does this indicate?

<details>
<summary>Answer</summary>

Either the permission rule (co-11) has a gap (the deny/scope rule did not actually cover that path)
or it was never enforced for that call -- a permission model is only as good as its actual
enforcement; a documented rule that silently doesn't fire is worse than no rule, because it creates
false confidence.

</details>

**AS10.** An agent runs `curl | sh` from a fetched install script inside a sandboxed container with
no network egress to the host's real filesystem. The script fails loudly. Is this a verification
failure?

<details>
<summary>Answer</summary>

No (co-12) -- this is the sandbox doing its job: an untrusted, risky action was contained, and its
failure cost nothing outside the sandbox boundary. The concerning version of this scenario is the
same command run unsandboxed, with direct host access.

</details>

**AS11.** An agent's diff includes a new dependency import in `requirements.txt` that was never
mentioned in the prompt or the plan. The reviewer almost approves it because "the tests pass." What
should stop them?

<details>
<summary>Answer</summary>

Silent scope creep (co-15) -- passing tests confirm the tested behavior, not that every line of the
diff is in scope. An unexplained dependency addition should be flagged and either justified or
trimmed before merge, regardless of test status.

</details>

**AS12.** A five-turn agent session is still iterating on the same failing test at turn 5, each
attempt only slightly different from the last, cost climbing with no stated ceiling. What two
concepts does this scenario call for?

<details>
<summary>Answer</summary>

Cost-and-token budgeting (co-18) -- a stated ceiling should have triggered an escalation by now --
and human-in-the-loop (co-24): a session this deep into repeated near-misses on the same test is
exactly the situation that should pause for a human decision rather than continue silently spending.

</details>

## Hands-on repetition

Seven self-contained exercises. Each is deterministic and mocked -- construct your own small
inputs, no live agent call and no external service required for any of them.

### Drill 1 -- write a well-specified prompt for a real function

Pick any small pure function you have not yet written (e.g. `is_valid_isbn10(s: str) -> bool`). Write
a prompt stating its goal, one constraint, one example, and at least three acceptance-criteria
bullets, in the structure `ex-05 · minimal-well-specified-prompt` demonstrates. Confirm every bullet
you wrote is independently checkable as a single `assert` (co-05).

### Drill 2 -- label a loop from a transcript you did not write

Take any four-tool-call excerpt from this topic's worked examples (e.g. `ex-09` or `ex-10`) and, from
memory, label each entry Perceive/Plan/Act/Observe without looking at `ex-02`'s labeled version first.
Then compare (co-02).

### Drill 3 -- build a permission-config deny rule from scratch

Write a JSON permission config (your own shape, not copied from `ex-23`) that denies writes outside
one named subdirectory. Trace through it by hand against three paths you choose -- one inside the
allowed directory, two outside -- and confirm your rule blocks both out-of-scope paths (co-11).

### Drill 4 -- construct a hallucinated-API trap and catch it

Write one line of code calling a plausible-but-wrong stdlib method you invent yourself (different
from `ex-15`'s example). Run it, capture the real error, and write one sentence on what made it look
plausible before you ran it (co-16).

### Drill 5 -- write your own trust/verify log for three arbitrary changes

Invent three small hypothetical changes (a config tweak, a UI copy change, an auth check) and fill in
a trust/verify decision + one-line rationale for each, in the table shape `ex-48` and this topic's
capstone use. Confirm every risky row has a verify entry (co-17, co-24).

### Drill 6 -- red-green-refactor a function you invent

Pick a small function of your own choosing. Write the failing test first, run it (red, captured), a
minimal passing implementation (green, captured), then one small refactor with tests still green
(captured a third time) -- three real, captured transcripts, same shape as `ex-28` (co-14).

### Drill 7 -- draft a five-line AGENTS.md excerpt for a project you know

Write a minimal instruction-file excerpt (build command, test command, one convention) for any real
or hypothetical small project. State, in one sentence, what an agent session would do differently on
its first run with your file present versus absent (co-06).

## Self-check checklist

Confirm each item without checking the learning track first. If you hesitate, that concept needs
another pass.

- [ ] I can explain what distinguishes an agent from single-shot autocomplete. (co-01)
- [ ] I can name the four phases of the perceive/plan/act/observe loop, in order. (co-02)
- [ ] I can explain why context-window size directly shapes output quality. (co-03)
- [ ] I can explain why more loaded context is not automatically better. (co-04)
- [ ] I can name the four elements a well-specified prompt states up front. (co-05)
- [ ] I can explain what problem a persistent instruction file solves that a one-off prompt does not.
      (co-06)
- [ ] I can explain how an agent acts on the world structurally, via tool calls. (co-07)
- [ ] I can state what MCP standardizes and the transport it runs over. (co-08)
- [ ] I can state the one structural difference between plan mode and act mode. (co-09)
- [ ] I can explain what returns to the main session from a completed subagent task. (co-10)
- [ ] I can state who enforces a permission rule -- the harness, not the model. (co-11)
- [ ] I can name the two risk-reduction tactics sandboxing-and-reversibility combines. (co-12)
- [ ] I can name the three things verification discipline requires before building on agent output.
      (co-13)
- [ ] I can explain the role a failing test plays in a test-driven agent workflow. (co-14)
- [ ] I can state what standard of scrutiny an agent-generated diff gets. (co-15)
- [ ] I can explain what makes a hallucinated API call dangerous and what catches it. (co-16)
- [ ] I can give one example of safe-to-delegate-lightly work and one that demands close review.
      (co-17)
- [ ] I can explain why a multi-turn session needs an explicit budget and stopping condition. (co-18)
- [ ] I can explain the prompt-injection attack and what channel carries it. (co-19)
- [ ] I can explain what an agent skill is, structurally. (co-20)
- [ ] I can explain what changes when a spec is written before prompting. (co-21)
- [ ] I can name three qualities of a task that should make you hesitate to delegate it. (co-22)
- [ ] I can explain how agent output should be treated across multiple rounds. (co-23)
- [ ] I can state what human-in-the-loop requires at a risky boundary. (co-24)
- [ ] I can explain, in one sentence, why agents are a pragmatism engine but correctness stays the
      human's job via tests and review. (`correctness-vs-pragmatism`)
- [ ] I can explain, in one sentence, why the same prompt yielding different output means you manage
      a non-deterministic collaborator with context and verification, not a repeatable function.
      (`determinism-vs-emergence`)

## Elaborative interrogation and self-explanation

Six why/why-not prompts, tied to this topic's two Cross-Cutting Big-Idea tags. Answer each in your
own words before opening the model explanation.

**E1 (`correctness-vs-pragmatism`).** Why does this topic insist the agent drafts and the human
verifies, rather than trusting a sufficiently capable agent to self-verify its own output?

<details>
<summary>Model explanation</summary>

Self-verification by the same process that generated the output shares the same blind spots as the
generation itself -- a hallucinated API call is exactly as plausible to the generating model on a
second look as it was the first time. Verification needs an independent check (a real test run, a
real API reference, a human reading the diff) that does not share the generator's failure mode.

</details>

**E2 (`correctness-vs-pragmatism`).** Why is delegating boilerplate "safe to skim" (co-17) not a
contradiction of "never trust an unverified change" (co-13)?

<details>
<summary>Model explanation</summary>

A skim is still a verification step, calibrated to the actual risk of the content -- boilerplate has
a narrow, mechanical failure surface a fast skim reliably catches, unlike security-sensitive logic's
failure surface, which a skim does not reliably catch. Trust/verify calibration means matching the
verification's depth to the risk, not skipping verification for low-risk work.

</details>

**E3 (`correctness-vs-pragmatism`).** Why does this topic treat a partially-passing test suite (e.g.
five of seven tests green) as a rejected diff rather than "mostly done"?

<details>
<summary>Model explanation</summary>

Pragmatism is about matching effort to risk, not lowering the acceptance bar -- a partial pass still
means the stated acceptance criteria are not met, and building further work on top of a
known-incomplete change compounds the gap instead of closing it. "Mostly passing" is not a pragmatic
shortcut here; it is exactly the failure state co-13 exists to catch.

</details>

**E4 (`determinism-vs-emergence`).** Why does this topic recommend re-running the same prompt rather
than assuming a rejected first attempt means the task itself is impossible for the agent?

<details>
<summary>Model explanation</summary>

The same prompt can yield different output on different runs -- a single failed generation is one
sample from a non-deterministic process, not proof the task is unreachable. Iterative refinement
(co-23) treats a rejected attempt as one data point that should inform the next prompt (narrower
constraints, the specific failure fed back), not as a verdict on feasibility.

</details>

**E5 (`determinism-vs-emergence`).** Why does an identical-looking session transcript from two
different runs of "the same" prompt not guarantee the same tool-call sequence happened?

<details>
<summary>Model explanation</summary>

The agent's plan at each step is itself generated, not scripted -- non-determinism can surface in
which tool is called first, how many exploration reads happen, or which file gets edited first, even
when the final diff looks similar. Verification (co-13) has to check the actual resulting diff and
tests, not assume a prior run's path was retraced exactly.

</details>

**E6 (`determinism-vs-emergence`).** Why does cost-bounded iterative refinement (co-18, co-23) set a
budget instead of just "stopping when it looks converged"?

<details>
<summary>Model explanation</summary>

"Looks converged" is a judgment call made mid-loop, exactly when automation bias (this topic's
`overview.md` names it directly) is most likely to bias that judgment toward "good enough, stop
here." An explicit, pre-committed budget is a check set before the loop starts, immune to the loop's
own momentum -- it forces an escalation decision instead of an in-the-moment rationalization.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) &middot; Next: [Software Product Engineering](../../software-product-engineering/learning/overview.md) →
