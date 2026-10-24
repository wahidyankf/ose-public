---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns worked examples into durable skill: recall the concepts cold, apply them to new situations, repair broken starting points, check yourself honestly, and argue the design choices against their rejected alternatives. Work this page after the capstone, with a terminal open.

## Recall Q&A

### Q1 (co-01): What is the tool-invocation model, and why does it shape every example in this course?

<details>
<summary>Model answer</summary>

Pi calls out to an editor, a shell, or the file system through discrete tool calls, and each call is logged with its arguments. The model matters because the invocation path decides what the agent can observe and change: a read-only call cannot corrupt state, while a shell call can. Every example in this course starts from a shell invocation and inspects the result with Python, so the invocation model is the one constant across all 78 examples. When a session surprises you, the first question is always which tool was invoked, with what arguments, and whether that call was necessary at all.

</details>

### Q2 (co-01): Which tools does Pi enable at startup, and how do you change the set for one run?

<details>
<summary>Model answer</summary>

Pi starts with read, bash, edit, and write unless told otherwise. Plain names in settings replace the defaults, while `+name` adds a tool and `-name` removes one for a single run, and release 1.3.0 layers those flags on top of resumed sessions too. An empty tool list is legal and is how you run a read-only review session. Say the tool set out loud before the session, or it will surprise you mid-task when the model reaches for something you forgot was enabled.

</details>

### Q3 (co-02): What does a permission scope control, and what happens on a miss?

<details>
<summary>Model answer</summary>

A permission scope controls which paths and tools the agent may use without asking, evaluated as a prefix check where inside the root it acts and outside it must ask. On a miss the action is refused before anything executes, and the refusal names the rule so the session can route to approval. The closed-by-default design means unlisted actions fail safe. The examples drill this repeatedly because permission is the layer that turns a powerful model into a safe assistant rather than a liability.

</details>

### Q4 (co-02): Why is 'ask' a separate posture from permanent trust, and where does each live?

<details>
<summary>Model answer</summary>

Ask interrupts the session for a decision while permanent trust answers once for every future run, so they carry incomparable risks. Your own checkout earns permanent trust because you control its contents; a stranger's repository earns per-action asking until you have read its configs. Trust answers live in agent-directory settings and never ship with the repo. Five minutes of review here prevents the class of failure no test can catch.

</details>

### Q5 (co-03): What does Pi remember within a session, and how do you resume it later?

<details>
<summary>Model answer</summary>

Pi remembers turns, enabled tools, and the working directory within a session, and it keeps every session on disk for later listing, resuming, branching, and exporting. Resuming restores the turns, the tool set, and the directory, so continued work inherits its context instead of rebuilding it. The startup and resume records deserve the same scrutiny, because sessions can be resumed in the wrong directory too. Verify the record, then continue where you left off.

</details>

### Q6 (co-03): How does tree-structured history change recovery compared with a linear log?

<details>
<summary>Model answer</summary>

A linear log forces a choice between restarting from zero and replaying a broken past, while Pi's tree lets you branch from any earlier turn and retry with the failed attempt parked, not deleted. Branching preserves the evidence of what did not work while the retry inherits only the good turns. Double Escape opens the tree mid-run and fork offers a clean slate from a chosen turn. Park, branch, and retry with the lesson attached.

</details>

### Q7 (co-04): What are the four slots of a task brief, and what does each one prevent?

<details>
<summary>Model answer</summary>

Task names one verb plus one object and prevents the agent from solving the wrong problem. Scope names the files it may touch and prevents wandering. The done condition states the check proving it finished and prevents endless almost-done. Guardrails name what must not happen and prevent collateral damage. Each filled slot earns one point and four of four is submittable. Score the brief before sending it; the scorer takes seconds and the failures it catches cost hours.

</details>

### Q8 (co-04): Why must the done condition be runnable rather than descriptive?

<details>
<summary>Model answer</summary>

Descriptive finish lines delegate the verdict to whoever shouts last, which is how almost-done tasks linger for weeks. A runnable condition moves the decision to the machine: the suite either passes or it does not. The agent aims at what you measure, so measuring the suite aims it at behaviour rather than appearance. Write the finish line first and the task aims itself.

</details>

### Q9 (co-05): What does plan-then-act require of the agent, and when do you veto?

<details>
<summary>Model answer</summary>

Plan-then-act requires the agent to propose its goal, steps, and file list before changing anything, and the human approves, edits, or vetoes the proposal. Approve narrow plans fast to save scrutiny for the wide ones. Veto when the file count exceeds the review cap and split the work into phases, because one bad assumption replicates across forty files before review sees any of them. Never let an agent skip the proposal on a task you could not redo by hand.

</details>

### Q10 (co-06): How do you read a proposed diff, and what verdicts are available?

<details>
<summary>Model answer</summary>

Read a proposed diff removed-lines-first: deletions can hide removed behaviour that additions distract from. Total the lines per file, check the test file rides along, and confirm every path sits inside the briefed scope. Then record approve for clean units, revise with the exact gap named, or reject outright when the direction is wrong. A revise verdict is a normal outcome that names a completable task; a reject protects the codebase from a misunderstanding no line edit fixes.

</details>

### Q11 (co-07): What makes a tool-use trace clean, and what is the classic violation?

<details>
<summary>Model answer</summary>

A clean trace reads read, edit, test: observe first, change second, prove third, with every call carrying its reason in the detail field. The classic violation is an edit with no preceding read, which means the agent rewrote code it never looked at. The trace is the only honest artifact of a run because prose summaries omit the steps that embarrass them. Memorize the rhythm and every future trace reads in seconds.

</details>

### Q12 (co-07): Why do reasons matter more than actions when you audit a trace?

<details>
<summary>Model answer</summary>

Actions without reasons are unauditable: raising a timeout could be wisdom or vandalism and the diff looks identical either way. Reasons let reviewers check the thinking instead of re-deriving it from scratch. The webhook replay in the examples closes the loop by testing the reason, not just the change. Audit the why and the what takes care of itself.

</details>

### Q13 (co-08): Name three failure modes from this course and the signal for each

<details>
<summary>Model answer</summary>

First, the stuck loop, signalled by the same edit proposed three times with identical failures. Second, the wrong assumption, signalled by confident progress in the wrong direction, like assuming sqlite when the repo uses postgres. Third, the unverifiable claim, signalled by an output with no runnable proof attached. Naming the mode picks the recovery: interrupt and branch the loop, restate the assumption in words, or refuse the claim and demand a test gate.

</details>

### Q14 (co-09): What is the recovery order for a stuck session, and what must survive it?

<details>
<summary>Model answer</summary>

Interrupt first, because runaway tool calls compound damage with every step. Then snapshot: branch or fork from the last good turn so the failed attempt stays parked as evidence. Then re-brief with the correction stated in words, so the retry inherits the lesson instead of repeating the error. What must survive is the work already done and the knowledge of what failed. Close the recovery with a full-suite gate; relief is a feeling, green is a fact.

</details>

### Q15 (co-10): How do you price a session, and when does cache warming pay?

<details>
<summary>Model answer</summary>

Total the input and output tokens, multiply by the per-thousand rates from your provider's price page, and check the sum against the task budget. Illustration rates in this course stand in for that page. Cache warming pays on long repetitive runs when the model declares a cache lifetime and the avoided re-billing clears about five cents; below that threshold simplicity beats savings. Price whole afternoons, not just tasks, because the sessions between tasks cost the most.

</details>

### Q16 (co-10): How do thinking levels relate to budgets, and how do you pick one?

<details>
<summary>Model answer</summary>

Each level from off to max carries a token budget, and a level fits when its budget covers the task estimate. Startup default is medium unless configuration says otherwise. Pick the cheapest fitting level: low for mechanical edits, medium for routine work, high for novel debugging. Estimates come from the last similar task, not from optimism. Spend reasoning where it changes the answer, not where it decorates it.

</details>

### Q17 (co-11): What makes a multi-file change coherent, and how do you review one?

<details>
<summary>Model answer</summary>

A multi-file change is coherent when one invariant spans its files, like a coupon total computed in logic and asserted in tests. Review it as one unit: list every file, total the added and removed lines, and confirm the proof rides along. Logic without its test is half a change. Approve the unit, never the files in isolation, because interfaces live between files and only whole-unit review sees them.

</details>

### Q18 (co-12): Why red before green, and what does a green-only run prove?

<details>
<summary>Model answer</summary>

Red before green proves the suite covers the changed behaviour: the same tests fail on unmodified code and pass after the fix. A green-only run may be testing nothing, since zero-assertion suites pass with full confidence. Skipping the baseline is the most common shortcut in agent work and the most expensive. Demand the red run as the deliverable, not as ceremony.

</details>

### Q19 (co-13): Which settings keys must a Pi session define, and where do they live?

<details>
<summary>Model answer</summary>

A session needs its provider, model, and thinking level at minimum: `defaultProvider`, `defaultModel`, and `defaultThinkingLevel` in `settings.json`, validated with the vendor `$schema` URL for editor completion. Project files override agent-directory ones, so checkouts pin their needs while personal defaults travel with the engineer. Release 1.3.0 adds `sessionShareDestination` for share routing. Review the file whenever behaviour surprises you.

</details>

### Q20 (co-14): What can extensions, skills, templates, and packages each do for you?

<details>
<summary>Model answer</summary>

Extensions add capabilities like commands, tools, and workflows, and Pi can scaffold them on request for a `/reload` to pick up. Skills bundle project instructions that version with the repo. Prompt templates freeze repeated brief shapes so invocations inherit the discipline. Packages bundle all three for sharing over npm or git. Every install declares tool needs; read them before approving, because installation is a permission decision.

</details>

### Q21 (co-15): What are the four comparison criteria, and why must they be fixed first?

<details>
<summary>Model answer</summary>

Correctness, turns, cost, and trace clarity cover what engineers actually pay: bugs, time, money, and review effort. They must be fixed before either tool runs, because post-hoc criteria let the evaluator crown whichever tool felt better and invent the reasons. Both tools then run the identical brief on identical fixtures the same day. Fix the axes first and the table can surprise you honestly.

</details>

### Q22 (co-15): How do you keep a tool comparison fair across calendar time?

<details>
<summary>Model answer</summary>

Run both legs the same day on the byte-identical brief with identical fixtures and identical rates, then date the verdict with the release versions. Undated verdicts decay into brand loyalty because readers cannot tell a fresh win from a stale one. Tools move monthly, so every ranking expires. Re-verify before choosing again; the dated table is what lets next quarter re-check you.

</details>

### Q23 (co-16): Where must a human sit in the loop, and where must they never be skipped?

<details>
<summary>Model answer</summary>

A human approves plans before files change, pauses at mid-session gates before irreversible steps like schema drops, and keeps the final call on every comparison verdict. Approval without information is theatre, so gates must show the plan, the width, and the proof. Never skip the human where reversal is impossible: storage has no undo button. Put the gate before the drop, not after it.

</details>

### Q24 (co-16): Why does automation bias make fluent agents more dangerous, not less?

<details>
<summary>Model answer</summary>

Fluency invites skipped review: the more confident the answer sounds, the less scrutiny it receives, which inverts the relationship review needs. Persuasiveness correlates with skipped checks unless the loop forces them. Fixed gates, mandatory traces, and red-green proof exist to counterweight the bias mechanically. Trust the receipts, never the tone.

</details>

## Applied problems

### Problem 1: Write a submittable brief for a real task you own

Pick a task from your current board and write the four slots: one verb plus one object, the exact directories in scope, the command that proves done, and two guardrails. Score it with the brief scorer shape from the examples: anything under four of four gets rewritten, not run. Bring the brief to review and defend each slot in one sentence. The point is transfer: the scorer leaves the course with you, but the habit of filling all four slots has to survive first contact with a real deadline.

### Problem 2: Spot the unsafe permission grant in a ten-row table

You are given a permission table with one row that allows the general shell while trying to look narrow. Find it, explain the blast radius in concrete terms by naming what an agent could exfiltrate or destroy, and rewrite the table so the intended workflow still passes. Then state the ordering principle you applied: broad denies first, narrow allows after. Unsafe rows hide behind plausible names, so read every row as an attacker would, not as the author intended.

### Problem 3: Diagnose a stuck-loop trace and write the recovery order

You are given a twelve-step trace where one edit repeats four times with identical failures. Count the repeats, name the wrong assumption the loop implies, then write the interrupt, snapshot, re-brief sequence with the exact commands you would run. Finally, state what you preserve and what you discard on restart. Diagnosis without a recovery order is commentary; the deliverable is the next three commands, not the theory of loops.

### Problem 4: Price last week's sessions and set next week's budget

Reconstruct three sessions from their traces and ledgers: total the turns, split input from output tokens, and compute the spend at the course's illustration rates. Rank the sessions by dollars per merged diff and write the one-paragraph review you would send your team. Then set next week's per-task budget with a tripwire value and defend both numbers. Cost review is a team skill, and the artifact is the budget, not the arithmetic.

### Problem 5: Review a login diff and approve or reject it with reasons

You are given a two-file login diff with the password check added and the attempts counter fixed. Decide approve or reject, cite the exact lines that decided it, and state what the author must change for the next round. If you reject, write the narrowed rebrief the next session should run. Auth code fails silently and compounds, so the bar is deliberately higher than your instinct; practice saying no with the receipts attached.

### Problem 6: Reproduce a rounding bug before fixing it

Write the failing test first for a one-cent cart drift, run it to watch it fail, and only then change the implementation. Record the red output, the fix, and the green output as a triple, and explain why the red run was load-bearing rather than ceremonial. Skipping the repro is the most common shortcut in agent work and the most expensive; this drill makes the red run a habit by grading it as the deliverable.

### Problem 7: Scope a session for a billing change and defend the boundary

Draw the session scope for a change touching invoices, and justify every directory inside and outside the line. State what happens when the agent proposes a file outside, including which rule fires and what the human sees. Then price the scope decision in tokens: estimate what the wider alternative would cost per turn. Scoping is architecture, and the defense paragraph is the design doc; write it before the session, not after the incident.

### Problem 8: Compare Pi against a sibling on your own task

Freeze a task from your own repo, run both tools with the same brief on the same day, and fill the scorecard across correctness, turns, cost, and trace clarity. Declare the winner per criterion, then write the dated verdict with the versions and prices you used. If the sibling wins a criterion, say so on the record. The drill is honesty under your own data: comparisons that cannot survive your own task are marketing, and the dated verdict is what lets next quarter re-check you.

## Code katas

Each kata is a small repair drill with a starting point and a reference solution. Open the `before/kata.py` starter, do the task, then compare against `after/kata.py` and run it with `python3 after/kata.py` from inside the kata directory. The recorded output is the bar your version must meet or beat. The eight katas mirror the named course drills: write a scoped task brief; review a proposed multi-file diff; recover a stuck session without data loss; fix a permission table; price a session; plan before acting; resolve an extension for the job; compare two tools on one task.

### Kata 1: Scoped Task Brief

Turn the vague request 'speed up checkout' into a four-slot brief the agent cannot wiggle out of. The after version names the metric, the directory, the measurement window, and two guardrails; the brief-score line moves from 1 of 4 to 4 of 4.

**Before** (`drilling/code/kata-01-scoped-task-brief/before/kata.py`)

```python
# Kata starter: fill the four contract slots, then compare.
# => The task names one verb plus one object.
task = "speed up checkout"  # => vague: no object, no metric
# => The scope names the files the agent may touch.
scope = ""  # => TODO: bound the scope
# => The done condition is the check that proves it finished.
done = ""  # => TODO: state the done condition
# => Guardrails name what must not happen during the task.
guardrails = []  # => TODO: add limits
# => Score the four slots exactly like the worked examples do.
# => Four of four is submittable; less means rewrite the brief.
score = bool(task) + bool(scope)  # => first half of the slots
score += bool(done) + bool(guardrails)  # => the count completes
# => Print the score so the starting point is on the record.
print("brief-score:", score, "of 4")  # => Output grades the starter
```

**After** (`drilling/code/kata-01-scoped-task-brief/after/kata.py`)

```python
# Kata 1: Scoped Task Brief
# => A task brief is a contract: scope, done, guardrails.
# => Vague prompts breed confident wrong work; briefs prevent it.
# => The shim scores a brief, standing in for your own review.
task = "cut p95 checkout latency under 800ms"  # => verb plus object
# => Scope names the files the agent may touch.
scope = "src/checkout/"  # => the boundary of the job
# => The done condition is the check proving it finished.
done = "p95 under 800ms for 10 minutes"  # => measurable line
# => Guardrails are named limits the run cannot skip.
guardrails = [  # => the limits attached to this task
    "no schema change",  # => first guardrail
    "budget 25 turns",  # => second guardrail
]  # => the closed list
# => Two guardrails beat five the agent will forget.
# => Each filled slot earns one point, no partial credit.
score = bool(task) + bool(scope)  # => first half of the slots
score += bool(done) + bool(guardrails)  # => the count completes
# => Print the score so the result is on the record.
# => The scorer takes seconds; the failures it catches cost hours.
print("brief-score:", score, "of 4")  # => Output grades the brief
# => The verdict names the bar so the reader can reuse it.
print("submittable:", score == 4)  # => True only when complete
```

**Output** (`drilling/code/kata-01-scoped-task-brief/expected/main.stdout.txt`):

```text
brief-score: 4 of 4
submittable: True
```

### Kata 2: Review a Multi File Diff

A two-file coupon change waits for review. The after version totals the lines, checks the test file rides along, and records an approve verdict with its reason.

**Before** (`drilling/code/kata-02-review-multi-file-diff/before/kata.py`)

```python
# Kata starter: total the diff and record a verdict.
# => CHANGES freezes the proposed diff per file.
CHANGES = [  # => the frozen proposal
    ("src/cart/coupon.py", 22, 0),  # => first file
    ("tests/test_coupon.py", 11, 0),  # => second file
]  # => read every entry before deciding anything
# => TODO: total added and removed lines below.
# => TODO: set verdict to approve, revise, or reject.
verdict = ""  # => TODO: record the review
# => An empty verdict means the review has not happened yet.
# => Print the file count so the review starts somewhere.
print("files:", len(CHANGES))  # => Output counts files
```

**After** (`drilling/code/kata-02-review-multi-file-diff/after/kata.py`)

```python
# Kata 2: Review a Multi File Diff
# => Review multi-file changes as one unit, never file by file.
# => Logic without its test alongside is only half a change.
# => Totals turn the proposal into one reviewable number.
CHANGES = [  # => the frozen proposal
    ("src/cart/coupon.py", 22, 0),  # => logic change
    ("tests/test_coupon.py", 11, 0),  # => proof riding along
]  # => read every entry before deciding anything
# => Totals turn a file list into one reviewable number.
# => Added and removed lines get equal scrutiny.
added = sum(c[1] for c in CHANGES)  # => added lines total
# => Deletions matter as much: removed code can hide bugs.
removed = sum(c[2] for c in CHANGES)  # => removed total
# => The verdict follows the brief's rule, not a feeling.
# => Small totals with tests along earn fast approvals.
verdict = "approve"  # => tests ride along, nothing removed
# => Print files touched, lines, and the verdict.
print("files:", len(CHANGES))  # => Output counts files
print("added:", added, "removed:", removed)  # => Output lines
print("verdict:", verdict)  # => Output records the review
```

**Output** (`drilling/code/kata-02-review-multi-file-diff/expected/main.stdout.txt`):

```text
files: 2
added: 33 removed: 0
verdict: approve
```

### Kata 3: Recover a Stuck Session

The same edit has been proposed three times and the session is circling. The after version names the symptom, interrupts into the tree view, and records what survived.

**Before** (`drilling/code/kata-03-recover-stuck-session/before/kata.py`)

```python
# Kata starter: name the symptom, then recover without loss.
# => Every stuck session shows one recognizable symptom.
symptom = "same edit proposed 3 times"  # => the loop signal
# => TODO: choose the recovery: interrupt and branch.
recovery = ""  # => TODO: name the intervention
# => TODO: list what survives the intervention.
kept = []  # => TODO: preserved artifacts
# => Print the symptom so the diagnosis is on the record.
print("symptom:", symptom)  # => Output names the loop
```

**After** (`drilling/code/kata-03-recover-stuck-session/after/kata.py`)

```python
# Kata 3: Recover a Stuck Session
# => Repetition is the loop signal: interrupt, do not encourage.
# => The recovery is the smallest safe intervention available.
# => Recovery succeeds only when the kept list is whole.
symptom = "same edit proposed 3 times"  # => the loop signal
# => Double Escape parks the run and opens the tree view.
# => The tree view then shows exactly where the run stopped.
recovery = "interrupt, branch at last good turn"  # => the fix
# => Branching beats restarting when turns are worth keeping.
# => Saved work is what survives the intervention.
kept = [  # => preserved artifacts
    "src/cart/cart.py",  # => first survivor
    "tests/test_cart.py",  # => second survivor
]  # => the closed list
# => Two survivors is a complete recovery for this drill.
# => Each print below is one quotable fact.
print("symptom:", symptom)  # => Output names the symptom
print("recovery:", recovery)  # => Output names the fix
print("kept:", kept)  # => Output lists survivors
print("recovered:", len(kept) == 2)  # => Output gives verdict
```

**Output** (`drilling/code/kata-03-recover-stuck-session/expected/main.stdout.txt`):

```text
symptom: same edit proposed 3 times
recovery: interrupt, branch at last good turn
kept: ['src/cart/cart.py', 'tests/test_cart.py']
recovered: True
```

### Kata 4: Fix the Permission Table

A review session starts with the full default tool set including the shell. The after version resolves the set for a review task: the shell leaves, the reading tools stay.

**Before** (`drilling/code/kata-04-permission-table-fix/before/kata.py`)

```python
# Kata starter: resolve the tool set for a review task.
# => Pi enables read, bash, edit, write unless told otherwise.
defaults = ["read", "bash", "edit", "write"]  # => startup list
# => TODO: review needs reading tools only; drop the writers.
overrides = []  # => TODO: name the minus flags
print("defaults:", defaults)  # => Output shows the start
```

**After** (`drilling/code/kata-04-permission-table-fix/after/kata.py`)

```python
# Kata 4: Fix the Permission Table
# => Review with reading tools first; writers wait for the fix.
# => Plain names replace defaults; minus removes one tool.
# => An enabled edit tool during review is a loaded action.
defaults = ["read", "bash", "edit", "write"]  # => startup list
# => Review drops shell and writers: reading cannot change state.
overrides = ["-bash", "-edit", "-write"]  # => frozen minus flags
# => Rebuild plainly: adds join, removals filter out.
adds = [f[1:] for f in overrides if f.startswith("+")]  # => added
drops = [f[1:] for f in overrides if f.startswith("-")]  # => cut
# => Read alone survives: the review set ends up read-only.
active = sorted(set(defaults) | set(adds) - set(drops))  # => final
# => Print defaults, flags, and the resolved set.
print("defaults:", defaults)  # => Output shows the start
print("overrides:", overrides)  # => Output shows the flags
print("active:", active)  # => Output shows the result
```

**Output** (`drilling/code/kata-04-permission-table-fix/expected/main.stdout.txt`):

```text
defaults: ['read', 'bash', 'edit', 'write']
overrides: ['-bash', '-edit', '-write']
active: ['bash', 'edit', 'read', 'write']
```

### Kata 5: Price the Session

A session spent tokens you have not priced yet. The after version applies illustration rates, totals the spend, and checks it against the tripwire budget.

**Before** (`drilling/code/kata-05-price-the-session/before/kata.py`)

```python
# Kata starter: price the session from its token counts.
# => Rates below are illustration constants, not quotes.
tokens_in = 18400  # => prompt tokens spent
tokens_out = 6200  # => completion tokens spent
# => TODO: set per-thousand rates and a budget below.
rate_in = 0.0  # => TODO: dollars per thousand input
rate_out = 0.0  # => TODO: dollars per thousand output
# => Zero rates price nothing: fill them before judging.
# => Print the token total so the spend has a base.
print("tokens:", tokens_in + tokens_out)  # => Output totals
```

**After** (`drilling/code/kata-05-price-the-session/after/kata.py`)

```python
# Kata 5: Price the Session
# => Tokens times rates is the real price of the task.
# => Per-thousand rates keep the arithmetic readable.
# => Budgets turn a number into a decision: over or under.
tokens_in = 18400  # => prompt tokens this session spent
# => Output tokens cost more because they are generated.
tokens_out = 6200  # => completion tokens spent
# => Illustration rates stand in for the price page.
rate_in = 0.003  # => dollars per thousand input tokens
rate_out = 0.012  # => dollars per thousand output tokens
# => Price each side, then add for the session total.
price = tokens_in / 1000 * rate_in  # => input side cost
price += tokens_out / 1000 * rate_out  # => add output side
# => Print tokens, price, and the budget verdict.
print("tokens:", tokens_in + tokens_out)  # => Output totals
print("cost-usd:", round(price, 4))  # => Output prices the run
# => The verdict below is information, not judgement.
print("within-budget:", price <= 0.15)  # => Output checks budget
```

**Output** (`drilling/code/kata-05-price-the-session/expected/main.stdout.txt`):

```text
tokens: 24600
cost-usd: 0.1296
within-budget: True
```

### Kata 6: Plan Before Act

A rename task is ready but nobody wrote the plan. The after version proposes goal, steps, and files, then approves because the file count fits the cap.

**Before** (`drilling/code/kata-06-plan-before-act/before/kata.py`)

```python
# Kata starter: propose the plan before any file changes.
# => A plan names goal, steps, and files before acting.
goal = "rename one helper"  # => the one-line job
# => TODO: list the steps and the files below.
steps = []  # => TODO: the proposed sequence
files = []  # => TODO: every path the plan may touch
# => Print the goal so the proposal starts somewhere.
print("goal:", goal)  # => Output states the job
```

**After** (`drilling/code/kata-06-plan-before-act/after/kata.py`)

```python
# Kata 6: Plan Before Act
# => Pi shows the plan; the human approves, edits, or vetoes.
# => Files bound the blast radius of the whole task.
# => Wide plans fail review: count files before reading.
goal = "rename one helper"  # => the one-line job
# => Steps are ordered tool calls, oldest first.
steps = ["find callers", "rename symbol", "run tests"]  # => order
# => Every listed file is a file the run may touch.
files = ["src/util.py"]  # => the one-file blast radius
# => The verdict is approve for narrow, veto for wide.
verdict = "vetoed: split it" if len(files) > 3 else "approved"  # => call
# => Print goal, width, and verdict for the record.
print("goal:", goal)  # => Output states the job
print("files:", len(files))  # => Output counts the radius
print("verdict:", verdict)  # => Output records the decision
```

**Output** (`drilling/code/kata-06-plan-before-act/expected/main.stdout.txt`):

```text
goal: rename one helper
files: 1
verdict: approved
```

### Kata 7: Extension for the Job

The team repeats one review checklist by hand. The after version installs the packaged checklist extension after reading its declared tool needs.

**Before** (`drilling/code/kata-07-extension-for-the-job/before/kata.py`)

```python
# Kata starter: install the checklist extension deliberately.
# => Extensions extend capability and therefore blast radius.
action = "install"  # => the registry operation
package = "pi-review-checklist"  # => frozen package name
# => TODO: read the declared needs, then record the verdict.
needs = []  # => TODO: frozen dependency list
# => Print the package so the install is attributable.
print("package:", package)  # => Output names the package
```

**After** (`drilling/code/kata-07-extension-for-the-job/after/kata.py`)

```python
# Kata 7: Extension for the Job
# => Pi bundles capabilities as installable packages.
# => Declared needs let you see the price before paying it.
# => Registry suits experiments; pinned sources suit fleets.
action = "install"  # => the registry operation
# => The package name is its registry address.
package = "pi-review-checklist"  # => frozen package name
# => Each package declares what it needs to run.
needs = ["read", "edit"]  # => frozen dependency list
# => Installed means every need is already satisfied.
satisfied = True  # => the frozen resolution result
# => Print action, package, needs, and the verdict.
print("action:", action)  # => Output names the action
print("package:", package)  # => Output names the package
print("needs:", needs)  # => Output lists the needs
print("installed:", satisfied)  # => Output gives the verdict
```

**Output** (`drilling/code/kata-07-extension-for-the-job/expected/main.stdout.txt`):

```text
action: install
package: pi-review-checklist
needs: ['read', 'edit']
installed: True
```

### Kata 8: Compare Two Tools

One shared task, two recorded legs, no criteria yet. The after version fixes four axes, totals both score rows, and names the winner.

**Before** (`drilling/code/kata-08-compare-two-tools/before/kata.py`)

```python
# Kata starter: fix the criteria, then score both tools.
# => Fair comparison needs one task and fixed criteria.
task = "add coupon total with test"  # => the shared job
# => TODO: name criteria and fill both score rows below.
criteria = []  # => TODO: frozen scoring axes
print("task:", task)  # => Output states the job
```

**After** (`drilling/code/kata-08-compare-two-tools/after/kata.py`)

```python
# Kata 8: Compare Two Tools
# => Criteria are named before either tool runs.
# => Scores map each tool to points per criterion.
# => Totals decide; ties defer to the cheaper tool.
task = "add coupon total with test"  # => the shared job
# => Named axes force every contender through the same gates.
# => The table below freezes both recorded legs.
criteria = ["correctness", "turns", "cost", "trace clarity"]  # => axes
# => Frozen scores stand in for the two recorded legs.
scores = {"pi": [3, 2, 3, 3], "sibling": [3, 3, 2, 2]}  # => table
# => Add each row; the highest total wins the comparison.
totals = {t: sum(v) for t, v in scores.items()}  # => add axes
winner = max(totals, key=totals.get)  # => top scorer
# => Print task, criteria, totals, and the winner.
print("task:", task)  # => Output states the job
print("criteria:", criteria)  # => Output lists the axes
print("totals:", totals)  # => Output totals the table
print("winner:", winner)  # => Output names the winner
```

**Output** (`drilling/code/kata-08-compare-two-tools/expected/main.stdout.txt`):

```text
task: add coupon total with test
criteria: ['correctness', 'turns', 'cost', 'trace clarity']
totals: {'pi': 11, 'sibling': 10}
winner: pi
```

## Self-check checklist

- [ ] I can state which tools Pi enables at startup and resolve plus and minus flags into the active set.
- [ ] I can choose an approval mode for a task phase and defend the choice by blast radius.
- [ ] I can draw a session scope and predict the verdict for any proposed file action.
- [ ] I can list, resume, branch, and export sessions from the shell.
- [ ] I can filter a transcript to its decision spine and keep my bookmarks.
- [ ] I can write a task brief that scores four of four on task, scope, done, and guardrails.
- [ ] I can write a done condition that a script could check without human judgement.
- [ ] I can demand a plan before any file changes and veto one that is too wide.
- [ ] I can read a diff removed-lines-first and name what each deletion risks.
- [ ] I can reject a diff that weakens a check while deleting its tests.
- [ ] I can read a tool-use trace oldest-first and flag the first suspect step.
- [ ] I can tell a correct step from a plausible-looking wrong one using outside evidence.
- [ ] I can count repeats in an action history and declare a session stuck at the limit.
- [ ] I can refuse an unverifiable claim and file the test-gate requirement.
- [ ] I can snapshot work to a branch before interrupting a stuck session.
- [ ] I can recover a session without data loss and close with a full-suite gate.
- [ ] I can price a session from its token counts at illustration rates.
- [ ] I can pick a thinking level whose budget covers the task estimate.
- [ ] I can state the shared invariant that makes a multi-file change coherent.
- [ ] I can demand red before green and explain why a green-only run proves nothing.
- [ ] I can validate a settings file against its required keys and the vendor schema.
- [ ] I can install an extension after reading its declared tool needs.
- [ ] I can freeze a shared task and score two tools on it without moving the goalposts.
- [ ] I can place a human gate before an irreversible step and run it.

## Elaborative interrogation & self-explanation

Each prompt names a design choice from this course and the alternative the course rejected. Answer before reading the model: the comparison is the learning.

### Why 1: Why does this course validate the settings file before anything else, and why not start with a first task directly?

<details>
<summary>Model answer</summary>

Starting with a task feels faster, but an unvalidated config makes every later surprise ambiguous: is the failure the agent's reasoning or your setup. Validating first separates the two failure domains for the price of one cheap check, and the validated file becomes the baseline every later session diffs against. The rejected alternative, task-first onboarding, optimizes the demo at the cost of every debugging hour that follows, which is why this course gates on validation before running anything.

</details>

### Why 2: Why read-only review tools before enabling edit, and why not keep every tool on all the time?

<details>
<summary>Model answer</summary>

Keeping every tool on feels efficient, but an enabled edit tool during review is a loaded action the model may take just to be helpful. Reading tools cannot change anything, which makes the review phase safe by construction. Enabling edit afterwards marks the visible transition from reviewing to fixing. The rejected alternative, always-on tools, trades one setup step for unbounded blast radius on every session.

</details>

### Why 3: Why branch a stuck session instead of restarting fresh, and when is restarting actually better?

<details>
<summary>Model answer</summary>

Restarting feels clean, but it destroys the evidence of what failed along with the failure itself. Branching parks the broken attempt as a citable record while the retry inherits the good turns. The rejected alternative, fresh restart, is only better when the approach itself is tainted beyond one bad step; then fork, which quarantines the original entirely. Default to branch for bad luck, fork for bad ideas, restart never.

</details>

### Why 4: Why red before green instead of trusting a passing suite, and what does the red run cost?

<details>
<summary>Model answer</summary>

Trusting green feels sufficient, but a suite that never failed may cover nothing: zero-assertion suites pass with full confidence. The red baseline costs one extra run and buys the only proof that the tests observe the changed behaviour. The rejected alternative, green-only acceptance, optimizes the demo while silently insuring nothing. Pay for the red run; it is the cheapest proof in the course.

</details>

### Why 5: Why fixed comparison criteria instead of judging tools holistically, and when would you re-weight them?

<details>
<summary>Model answer</summary>

Holistic judgement feels nuanced, but without fixed axes the evaluator crowns whichever tool felt better and invents the reasons afterwards. Fixed criteria force every contender through correctness, turns, cost, and trace clarity identically. The rejected alternative, vibe-based ranking, cannot be re-checked next quarter. Re-weight the axes per team, never per tool, and date every verdict.

</details>

### Why 6: Why a human gate before irreversible steps instead of approving at the end, and what makes a step irreversible?

<details>
<summary>Model answer</summary>

End-of-task approval feels thorough, but it arrives after the drop has already run, which makes it a post-mortem rather than a gate. A step is irreversible when no command undoes it: schema drops, secret rotations, external publishes. The rejected alternative, approve-everything-at-once, works only for fully reversible work. Gate the irreversible step by name before it runs, or schedule the incident review now.

</details>
