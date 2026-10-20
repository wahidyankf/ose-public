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

Hermes Agent calls out to an editor, a shell, or the file system through discrete tool calls, and each call is logged with its arguments. The model matters because the invocation path decides what the agent can observe and change: a read-only call cannot corrupt state, while a shell call can. Every example in this course starts from a shell invocation and inspects the result with Python, so the invocation model is the one constant across all 78 examples. When a session surprises you, the first question is always which tool was invoked, with what arguments, and whether that call was necessary at all.

</details>

### Q2 (co-01): How does Hermes decide between acting directly and delegating to a subagent?

<details>
<summary>Model answer</summary>

Hermes acts directly for single-file, reversible changes and delegates when workstreams are independent enough to run in parallel. Delegation costs context and coordination, so the rule is simple: delegate coherent chunks with clear interfaces, never fragments that need constant cross-talk. The examples on multi-file changes show the boundary clearly: a rename across ten files is one direct task, while a migration plus its test rewrite splits into two. If you cannot state the interface between the chunks, keep the work in one session.

</details>

### Q3 (co-02): What does a permission scope control, and what happens on a miss?

<details>
<summary>Model answer</summary>

A permission scope controls which tools the agent may call without asking, evaluated as an ordered allow/deny table where the first match wins and no match means deny. On a miss the tool call is refused before anything executes, and the refusal names the rule so the session can route to approval or re-permit narrowly. The closed-by-default design means new or unlisted tools fail safe. The examples drill this repeatedly because permission is the layer that turns a powerful model into a safe assistant rather than a liability.

</details>

### Q4 (co-02): Why is 'ask' a separate decision from 'allow' and 'deny'?

<details>
<summary>Model answer</summary>

Ask inserts the human exactly where judgement lives while keeping the session moving everywhere else. Allow is for read-mostly, low-blast-radius calls like test runners; deny is for destructive or exfiltrating calls that must never auto-run; ask covers the middle ground of mutations a human should see once. The examples show tiered rules, such as docs edits allowed while code edits ask, because matching strictness to blast radius keeps reviews fast without making them meaningless.

</details>

### Q5 (co-03): What lives inside a session scope, and what resets between sessions?

<details>
<summary>Model answer</summary>

Inside a session scope sit the repo root the agent may touch, the conversation history it reasons over, and the permission table it enforces. Between sessions the working memory resets unless it was explicitly persisted to files, which is why the recovery examples restart from a written summary rather than a full log. Scope is a path prefix plus a policy: inside the root the agent may act subject to permissions, outside it must ask. Engineers who scope sessions to one package keep both context bills and blast radius small.

</details>

### Q6 (co-03): Why do long sessions get worse, and what do you do about it?

<details>
<summary>Model answer</summary>

Long sessions accumulate stale context: dead-end attempts, superseded plans, and full-file reads that bury the signal the next decision needs. The agent starts pattern-matching on its own exhaust instead of the task, which is when loops and confident mistakes multiply. The fix is structural, not motivational: snapshot the diffs, write a short summary of decisions, and restart scoped to the remaining work. The recovery cluster demonstrates this as a playbook because willpower never beats a context budget.

</details>

### Q7 (co-04): What four slots make a task brief submittable?

<details>
<summary>Model answer</summary>

Task, scope, done condition, and guardrails. The task names one verb plus one object; the scope names the files the agent may touch; the done condition names the check that proves the work finished; the guardrails name budgets, approvals, and reversibility limits. A brief scoring four of four on the scorer is submittable, and anything less is a rewrite, not a run. The examples prove vagueness is measurable: a one-line wish scores one of four, which is why rewriting beats hoping.

</details>

### Q8 (co-04): When should you rebrief instead of continuing?

<details>
<summary>Model answer</summary>

Rebrief when the agent drifts outside scope, when the done condition no longer matches what you actually want, or when a loop repeats the same action three times. Continuing a drifted session spends tokens arguing with momentum; a rebrief narrows the scope and restarts the task with the lesson priced in. The auth-refactor example shows the canonical trigger: files appearing that the brief never named. Drift is a rebrief event, not a failure, and treating it that way keeps sessions cheap.

</details>

### Q9 (co-05): What does plan-then-act buy you that direct execution does not?

<details>
<summary>Model answer</summary>

A plan you can veto is cheaper than a diff you must revert. Plan-then-act surfaces the goal, the steps, and the file blast radius before anything changes, which gives the human an approve-or-veto decision at the cheapest point in the loop. Direct execution skips that decision and bills you for the revert instead. The examples show small plans approving fast and wide plans splitting into phases, because the file count tells you the risk before the diff does.

</details>

### Q10 (co-05): How do you review a proposed plan well?

<details>
<summary>Model answer</summary>

Check three things in order: does the goal match the brief, do the steps sequence sensibly with proof at the end, and is the file list approved as stated. Count files first, because blast radius decides how carefully you read the steps. Veto plans that touch migration-shaped work without a backup step, and split plans whose file count trips your threshold. The veto example demonstrates the key move: reject early, split into phases, and let each phase carry its own done condition.

</details>

### Q11 (co-06): What do you read first in a diff, and why?

<details>
<summary>Model answer</summary>

Read removed lines first, then the file list, then additions. Removed lines carry the most risk because deleted checks fail open silently, while additions are at least visible as new behavior. The file list tells you whether the change stayed in scope; an unnamed file is scope creep until proven otherwise. Small diffs earn full reads line by line, and large ones earn the slow review with a checklist. The examples make this mechanical so it survives time pressure.

</details>

### Q12 (co-06): When do you reject a diff instead of requesting changes?

<details>
<summary>Model answer</summary>

Reject when the diff skipped its repro test, when it rewrites modules the brief never named, or when its size mixes risk layers like schema plus logic plus tests. Requesting changes fits small, scoped gaps; rejection fits structural problems where patching the patch preserves a bad shape. The pricing-rewrite example shows the canonical reject: three modules rewritten with no failing test first. A rejection with a reason plus a narrowed rebrief costs less than three rounds of tweaks.

</details>

### Q13 (co-07): What is a tool-use trace, and how do you read one?

<details>
<summary>Model answer</summary>

A tool-use trace is the agent's own record of which tool it called, with what arguments, and why, in call order. Read it oldest-first, checking each step against its stated reason: a read should precede the edit it informs, and a test should follow the edit it proves. Flag steps whose reason does not match their action, then open the diff behind the flagged edit. The examples train this as a rhythm, read, edit, test, because deviations from that order are where bluffs hide.

</details>

### Q14 (co-07): How do you tell a correct step from a plausible-looking wrong one?

<details>
<summary>Model answer</summary>

Verify the step against something outside the agent's own claims: the file must exist on disk, the line numbers must match the content, and the test it cites must actually run. Plausible-wrong steps share tells, edits to files never read, confident summaries of code with the details slightly off, and tests that collect zero items. The hallucinated-file example is the drill: check existence first, because everything downstream of a ghost file is fiction.

</details>

### Q15 (co-08): What are the three most common failure modes, and what signals each?

<details>
<summary>Model answer</summary>

Stuck loops repeat one action with identical failures and signal themselves through repeat counts; wrong-file fixes edit confidently while the bug lives in a caller the trace never opened; unsafe proposals attempt destructive or exfiltrating calls and signal through a single policy denial. Loops are counted, wrong-file fixes are found by widening the read, and unsafe proposals halt at one. The failure cluster gives each mode a frozen history so you can practice the diagnosis before an incident provides one.

</details>

### Q16 (co-08): How do you distinguish a stuck loop from a flaky test?

<details>
<summary>Model answer</summary>

Count repeats and vary nothing: identical actions with identical failures is a loop, while identical actions with alternating results is flakiness. A loop needs interruption and a rebrief because the mental model is wrong; flakiness needs quarantine of the test because the code may be fine. The alternating-results example is the drill: three runs with mixed outcomes exonerate the edit and convict the test. Re-running a loop never fixes it, and rewriting code for a flaky test never stabilizes it.

</details>

### Q17 (co-09): What is the safe recovery order, and why that order?

<details>
<summary>Model answer</summary>

Interrupt, snapshot, re-brief. Interrupt stops the spend first because every further turn bills you; snapshot preserves the diffs on a branch because killed sessions keep only what was saved; re-brief narrows the scope with the lesson priced in because restarting the same brief replays the same loop. The order matters: snapshotting after interrupting is safe, but interrupting without snapshotting destroys evidence. The examples print this order so it is muscle memory before you need it.

</details>

### Q18 (co-09): What do you preserve from a dead session, and what do you discard?

<details>
<summary>Model answer</summary>

Preserve the diffs, the decision summary, and the rule the postmortem produced; discard the full log, the dead-end attempts, and the superseded plans. Diffs are work, summaries are lessons, and everything else is exhaust that would re-bill you in context tokens on restart. The restart example shows the shape: a short summary plus open diffs restart faster and think clearer than a full-history replay. Sessions are cheap to start and expensive to carry, so carry little.

</details>

### Q19 (co-10): How do you price a session, and which tokens dominate?

<details>
<summary>Model answer</summary>

Multiply input tokens by the input price plus output tokens by the output price, per thousand, then divide by turns for the per-turn rate and compare against the brief's budget. Output tokens dominate because they bill at multiples of the input rate, so verbose agents tax you twice. The worked ledgers make this concrete: equal token counts still skew toward output spend. Price mid-session, not after, because budgets only steer when the meter is still running.

</details>

### Q20 (co-10): What budget controls actually work during a session?

<details>
<summary>Model answer</summary>

Three controls work: a dollar ceiling stated in the brief, a turn tripwire that halts for re-scope, and a narrow scope that cuts input tokens on every turn. Dollar ceilings convert runaway loops into stopped ones; tripwires catch sessions that feel productive while the meter runs; scoping prevents the spend instead of policing it. The tripwire example shows the canonical halt at thirty turns without a green test. Controls stated up front steer; controls added after only explain.

</details>

### Q21 (co-11): What makes a multi-file change coherent rather than scattered?

<details>
<summary>Model answer</summary>

One shared invariant across every touched file. Coherent diffs change implementation, callers, and tests together around a single statement that must stay true, while scattered diffs touch files no invariant connects. The totals example shows the shape: cart, totals, and tests all serving one rounding rule. Review coherence by naming the invariant first, then checking each file serves it. Files that serve nothing named are scope creep wearing a diff costume.

</details>

### Q22 (co-12): What is a test gate, and where does it sit in the loop?

<details>
<summary>Model answer</summary>

A test gate is a run that must pass before the work counts as done: repro test before the fix, full suite after it. It sits at both ends of the change, proving the bug existed and proving the fix did not break neighbors. The flaky-test example shows why the gate must demand repeats: a single green run proves luck, three in a row prove stability. Agents that write their own tests still answer to the gate, because the gate, not the agent, defines finished.

</details>

### Q23 (co-13): What belongs in the config file, and what must never go there?

<details>
<summary>Model answer</summary>

The config file holds the model choice, sandbox mode, session scope, retry budgets, and namespaced extension settings: everything that makes sessions reproducible and reviewable. Secrets never go there in plain text; keys arrive through the environment and are redacted from traces. The validation example shows the shape: required keys fail fast when missing, and one extra knob demonstrates layering. Config is the part of the agent you can diff, which is exactly why it carries the reproducibility burden.

</details>

### Q24 (co-15): What makes a tool comparison fair, and what invalidates one?

<details>
<summary>Model answer</summary>

A fair comparison freezes one shared task, fixed criteria, and identical budgets before any tool runs, then scores every cell from evidence rather than memory. Moving goalposts, vendor-supplied demos, and unpriced runs each invalidate the result in a different way: shifted tasks, selected strengths, and hidden spend. The scorecard examples freeze all three so readers can re-weight the totals and disagree honestly. An unfair comparison is worse than none, because a rigged table borrows the authority of arithmetic for a decision already made.

</details>

### Q25 (co-16): Where must a human approve, and what can safely run without one?

<details>
<summary>Model answer</summary>

Humans approve mutations with irreversible or money-shaped consequences: schema changes, deploys, broad edits, and anything the permission table routes to ask. Reads, scoped test runs, plan proposals, and receipted summaries run freely because their blast radius is bounded and their outputs are reviewable. The boundary moves with the brief's guardrails, not with mood, which is why the ask mode exists as a first-class decision rather than a failure of autonomy. Unsupervised speed is the reward for scoped tasks, never the default for open ones.

</details>

### Q26 (co-14): When is an extension worth installing, and when is it overhead?

<details>
<summary>Model answer</summary>

Install when one capability serves repeated tasks, like diff summaries for every review, and skip when the need is one-off or the base tool already covers it. Extensions earn their keep in saved turns and must be priced like any other session cost; a summarizer that shrinks every later context window pays for itself quickly. The cost-check example shows the accounting. Pin the version and namespace the settings, because unpinned extensions drift on their own schedule.

</details>

## Applied problems

### Problem 1: Write a submittable brief for a real task you own

Pick a task from your current board and write the four slots: one verb plus one object, the exact directories in scope, the command that proves done, and two guardrails. Score it with the brief scorer shape from the examples: anything under four of four gets rewritten, not run. Bring the brief to review and defend each slot in one sentence. The point is transfer: the scorer leaves the course with you, but the habit of filling all four slots has to survive first contact with a real deadline.

### Problem 2: Spot the unsafe permission grant in a ten-row table

You are given a permission table with one row that allows the general shell while trying to look narrow. Find it, explain the blast radius in concrete terms by naming what an agent could exfiltrate or destroy, and rewrite the table so the intended workflow still passes. Then state the ordering principle you applied: broad denies first, narrow allows after. Unsafe rows hide behind plausible names, so read every row as an attacker would, not as the author intended.

### Problem 3: Diagnose a stuck-loop trace and write the recovery order

You are given a twelve-step trace where one edit repeats four times with identical failures. Count the repeats, name the wrong assumption the loop implies, then write the interrupt, snapshot, re-brief sequence with the exact commands you would run. Finally, state what you preserve and what you discard on restart. Diagnosis without a recovery order is commentary; the deliverable is the next three commands, not the theory of loops.

### Problem 4: Price last week's sessions and set next week's budget

Reconstruct three sessions from their traces and ledgers: total the turns, split input from output tokens, and compute the spend at the course's pinned rates. Rank the sessions by dollars per merged diff and write the one-paragraph review you would send your team. Then set next week's per-task budget with a tripwire value and defend both numbers. Cost review is a team skill, and the artifact is the budget, not the arithmetic.

### Problem 5: Review a pricing diff and approve or reject it with reasons

You are given a three-module pricing diff with no repro test and a passing suite. Decide approve or reject, cite the exact lines that decided it, and state what the author must change for the next round. If you reject, write the narrowed rebrief the next session should run. Pricing code fails silently and compounds, so the bar is deliberately higher than your instinct; practice saying no with the receipts attached.

### Problem 6: Reproduce a rounding bug before fixing it

Write the failing test first for a one-cent cart drift, run it to watch it fail, and only then change the implementation. Record the red output, the fix, and the green output as a triple, and explain why the red run was load-bearing rather than ceremonial. Skipping the repro is the most common shortcut in agent work and the most expensive; this drill makes the red run a habit by grading it as the deliverable.

### Problem 7: Scope a session for a billing change and defend the boundary

Draw the session scope for a change touching invoices, and justify every directory inside and outside the line. State what happens when the agent proposes a file outside, including which rule fires and what the human sees. Then price the scope decision in tokens: estimate what the wider alternative would cost per turn. Scoping is architecture, and the defense paragraph is the design doc; write it before the session, not after the incident.

### Problem 8: Compare Hermes against a peer on your own task

Freeze a task from your own repo, run both tools with the same brief, and fill the scorecard across repro, fix, tests, and cost. Declare the winner per criterion, then write the dated verdict with the versions and prices you used. If the peer wins a criterion, say so on the record. The drill is honesty under your own data: comparisons that cannot survive your own task are marketing, and the dated verdict is what lets next quarter re-check you.

## Code katas

Each kata is a small repair drill with a starting point and a reference solution. Open the `before/kata.py` starter, do the task, then compare against `after/kata.py` and run it with `python3 after/kata.py` from inside the kata directory. The recorded output is the bar your version must meet or beat. The eight katas mirror the named course drills: write a scoped task brief; review a proposed multi-file diff; recover a stuck session without data loss; fix a permission table; price a session; plan before acting; resolve a plugin for the job; compare two tools on one task.

### Kata 1: Scoped Task Brief

Turn the vague request 'speed up checkout' into a four-slot brief the agent cannot wiggle out of. The after version names the metric, the directory, the measurement window, and two guardrails; the brief-score line moves from 1 of 4 to 4 of 4.

**Before** (`drilling/code/kata-01-scoped-task-brief/before/kata.py`)

```python
# Kata starter: fill the four contract slots, then compare with after/kata.py.
# => The task names one verb plus one object.
task = ""  # => TODO: name the task
# => The scope names the files the agent may touch.
scope = ""  # => TODO: bound the scope
# => The done condition is the check that proves the work finished.
done = ""  # => TODO: state the done condition
# => Guardrails name what must not happen during the task.
guardrails = []
# => Score the four slots exactly like the worked examples do.
# => Four of four is submittable; less means rewrite the brief.
score = sum(
    [bool(task), bool(scope), bool(done), bool(guardrails)]
)  # => count filled slots
# => Print the score so the starting point is on the record.
print("brief-score:", score, "of 4")  # => Output grades the starter
```

**After** (`drilling/code/kata-01-scoped-task-brief/after/kata.py`)

```python
# Kata 1: Scoped Task Brief
# => A task brief is a contract: scope, done condition, guardrails.
# => Vague prompts breed confident wrong work; the brief prevents it.
# => The shim scores a brief, standing in for your own review.
task = "cut p95 checkout latency under 800ms"  # => one verb plus one object, never a paragraph
scope = "src/checkout/"  # => the files the agent may touch
done = "k6 p95 under 800ms for 10 minutes"  # => the check that proves the work finished
# => Guardrails are named limits: budget, approval, reversibility.
# => Each guardrail below is one string the scorer can see.
# => Limits turn advice into enforcement the session cannot skip.
guardrails = [
    "no schema change",
    "budget 25 turns",
]  # => the limits attached to this task
# => The scorer checks four slots: task, scope, done, guardrails.
# => A missing slot is not style, it is an unenforceable contract.
score = 0  # => count of contract slots actually filled
score += 1 if task else 0  # => a named task earns one point
score += 1 if scope else 0  # => a named scope earns one point
score += 1 if done else 0  # => a done condition earns one point
score += 1 if guardrails else 0  # => guardrails earn the last point
# => Four of four is submittable; less means rewrite the brief.
print("brief-score:", score, "of 4")  # => Output grades the contract
# => The verdict names the bar so the reader can reuse it.
print("submittable:", score == 4)  # => True only when complete
```

**Output** (`drilling/code/kata-01-scoped-task-brief/expected/main.stdout.txt`):

```text
brief-score: 4 of 4
submittable: True
```

### Kata 2: Review Multi File Diff

Decide whether a three-file coupon diff earns a fast approval or a slow review. The after version adds the missing test file to the count; the lines-changed total crosses from a guess to a computed number.

**Before** (`drilling/code/kata-02-review-multi-file-diff/before/kata.py`)

```python
# Kata starter: list the touched files, then compare with after/kata.py.
# => Each entry pairs a path with added and removed counts.
files = []  # => TODO: list the touched files
# => Total the change before deciding how carefully to read it.
added = sum(a for _, a, _ in files)  # => every added line proposed
removed = sum(r for _, _, r in files)  # => every removed line proposed
# => Name the slow-review threshold your team agreed on.
threshold = 100  # => lines above this earn the slow read
# => Print the surface size so the reading plan is explicit.
print("lines-changed:", added + removed)  # => Output sizes the review
```

**After** (`drilling/code/kata-02-review-multi-file-diff/after/kata.py`)

```python
# Kata 2: Review Multi File Diff
# => Never trust a diff you have not read: the agent drafts, you verify.
# => The shim freezes one proposed diff as added/removed line counts.
# => Counts cannot replace reading, but they route your attention.
files = [
    ("src/coupon.py", 22, 11),
    ("src/pricing.py", 9, 6),
    ("tests/test_coupon.py", 26, 4),
]  # => path plus added and removed counts
# => Total the change: big diffs deserve slower, closer review.
added = sum(a for _, a, _ in files)  # => every added line proposed
removed = sum(r for _, _, r in files)  # => every removed line proposed
# => A file the brief never named is scope creep until proven otherwise.
print("files-touched:", len(files))
# => Added plus removed is the review surface you must actually read.
print("lines-changed:", added + removed)  # => the surface size
# => Over the threshold means split the change or pair-review it.
big = (added + removed) > 100  # => True routes to slow review
# => The flag tells you how to read, not whether to merge.
print("needs-slow-review:", big)  # => Output is the reading plan
```

**Output** (`drilling/code/kata-02-review-multi-file-diff/expected/main.stdout.txt`):

```text
files-touched: 3
lines-changed: 78
needs-slow-review: False
```

### Kata 3: Recover Stuck Session

Detect the third identical queue edit and run the safe recovery order without losing the branch work. The after version counts repeats instead of eyeballing them; the recover line states the interrupt, snapshot, re-brief order.

**Before** (`drilling/code/kata-03-recover-stuck-session/before/kata.py`)

```python
# Kata starter: record the session history, then compare with after/kata.py.
# => History is oldest-first so repeats are countable.
actions = []  # => TODO: paste the session history
# => Name the action you suspect is repeating without progress.
stuck_on = ""  # => TODO: name the suspect action
# => Count repeats of the suspect action across the history.
repeats = sum(1 for a in actions if a == stuck_on)  # => repeat count
# => Print the evidence before declaring the session stuck.
print("repeats:", repeats)  # => Output is the evidence
```

**After** (`drilling/code/kata-03-recover-stuck-session/after/kata.py`)

```python
# Kata 3: Recover Stuck Session
# => A stuck loop repeats one action hoping for a different result.
# => The shim freezes an action history and counts the repeats.
# => Detecting the loop is step one; the recovery preserves work.
actions = [
    "edit src/queue.py",
    "run tests",
    "edit src/queue.py",
    "run tests",
    "edit src/queue.py",
]  # => the session history, oldest first
stuck_on = "edit src/queue.py"  # => the action repeating without progress
# => Count repeats of the suspect action across the whole history.
repeats = sum(1 for a in actions if a == stuck_on)  # => repeat count
# => The limit comes from the brief: bounded retries, then escalate.
stuck = repeats >= 3  # => True declares the session stuck
# => Name the count first so the log shows evidence, not alarm.
print("repeats:", repeats)
# => The recovery order matters: interrupt, snapshot, then redirect.
print("stuck:", stuck)  # => True starts the recovery playbook
# => Work already done is snapshotted before anything is cancelled.
print("recover: interrupt, snapshot, re-brief")  # => the safe order
```

**Output** (`drilling/code/kata-03-recover-stuck-session/expected/main.stdout.txt`):

```text
repeats: 3
stuck: True
recover: interrupt, snapshot, re-brief
```

### Kata 4: Permission Table Fix

Close the hole that lets the general shell through while keeping the test runner allowed. The after version puts the broad deny first and the narrow allow after it; first-match order does the rest.

**Before** (`drilling/code/kata-04-permission-table-fix/before/kata.py`)

```python
# Kata starter: write the policy table, then compare with after/kata.py.
# => First match wins, so order the rows deliberately.
rules = []  # => TODO: write the allow/deny rows
# => Name the tool call the agent is attempting.
tool = ""  # => TODO: name the attempted tool
# => Closed by default: no match means deny.
decision = "deny"  # => closed default before any rule
# => Walk the table and keep the first matching decision.
# => Later rows never override the first hit for the same tool.
for name, verdict in rules:  # => scan rows in listed order
    # => The first hit freezes the answer for this attempt.
    if name == tool:  # => this row governs the attempt
        decision = verdict  # => first match wins
        break  # => stop scanning once decided
# => Print the verdict the approval flow would consume.
print("decision:", decision)  # => Output is allow or deny
```

**After** (`drilling/code/kata-04-permission-table-fix/after/kata.py`)

```python
# Kata 4: Permission Table Fix
# => The shim models permissions as an ordered allow/deny table.
# => First match wins, exactly like Hermes evaluates its own rules.
# => Order matters more than count: broad allows go last, not first.
rules = [
    ("shell", "deny"),
    ("shell:pytest", "allow"),
    ("edit", "ask"),
]  # => the policy table, read top to bottom
tool = "shell:pytest"  # => the tool call the agent is attempting
# => Walk the table and keep the first matching decision.
# => No match means deny: closed by default beats open by accident.
decision = "deny"  # => closed default before any rule matches
for name, verdict in rules:  # => scan rules in listed order
    # => Compare this row against the attempted tool call.
    # => The first hit freezes the answer; later rows are ignored.
    if name == tool:  # => this row governs the attempt
        decision = verdict  # => first match wins, loop stops caring
        break  # => stop scanning once the answer is fixed
# => Print the decision plus the tool so logs stay attributable.
print("tool:", tool)  # => Output names what was attempted
# => The verdict line is what the approval flow would consume.
print("decision:", decision)  # => Output is allow or deny
```

**Output** (`drilling/code/kata-04-permission-table-fix/expected/main.stdout.txt`):

```text
tool: shell:pytest
decision: allow
```

### Kata 5: Price the Session

Price a twelve-turn trace against its one-dollar budget and name the over-budget verdict. The after version separates input and output pricing; the over-budget line becomes a gate a script can consume.

**Before** (`drilling/code/kata-05-price-the-session/before/kata.py`)

```python
# Kata starter: freeze the session ledger, then compare with after/kata.py.
# => Turns count agent loop iterations, not wall-clock minutes.
turns = 0  # => TODO: count the turns
# => Input and output tokens bill at different rates.
tokens_in = 0  # => TODO: count input tokens
tokens_out = 0  # => TODO: count output tokens
# => Prices are per thousand tokens, matching vendor price pages.
# => Input is cheap and output is dear: keep them separate.
cost = tokens_in / 1000 * 0.003 + tokens_out / 1000 * 0.015  # => session spend
# => Print the spend with four decimals; cents hide drift.
print("session-cost: %.4f" % cost)  # => Output is dollars
```

**After** (`drilling/code/kata-05-price-the-session/after/kata.py`)

```python
# Kata 5: Price the Session
# => Every agent turn spends tokens; tokens spend real money.
# => Hermes bills input and output at different rates, like peers.
# => The shim freezes one session ledger so the math is checkable.
turns = 12  # => agent loop iterations this session took
tokens_in = 30000  # => prompt plus context tokens consumed
tokens_out = 10000  # => completion tokens the agent produced
# => Prices are per thousand tokens, matching vendor price pages.
# => Input is cheap, output is dear: that asymmetry shapes prompts.
cost = tokens_in / 1000 * 0.003 + tokens_out / 1000 * 0.015  # => session spend
# => Per-turn cost spots runaway loops faster than any total can.
per_turn = cost / turns  # => average spend per iteration
# => The budget is stated up front in the brief, never discovered.
over = cost > 1.00  # => True means stop and re-scope now
# => Print money with four decimals: cents hide multi-dollar drift.
print("session-cost: %.4f" % cost)  # => Output is dollars
# => The verdict is binary so a gate script can consume it.
print("over-budget:", over)  # => True halts the session
```

**Output** (`drilling/code/kata-05-price-the-session/expected/main.stdout.txt`):

```text
session-cost: 0.2400
over-budget: False
```

### Kata 6: Plan Before Act

Write the plan for a two-file notification change and get its blast radius approved first. The after version lists files before steps are debated; the file count becomes the approve-or-veto surface.

**Before** (`drilling/code/kata-06-plan-before-act/before/kata.py`)

```python
# Kata starter: state the goal and files, then compare with after/kata.py.
# => One sentence the whole plan serves.
goal = ""  # => TODO: state the goal
# => Files are the approve-or-veto surface: list them first.
files = []  # => TODO: list the files
# => Steps print in order so review follows the sequence.
steps = []  # => TODO: list the proposed steps
# => Print the blast radius before anyone argues about steps.
print("files:", len(files))  # => Output sizes the blast radius
```

**After** (`drilling/code/kata-06-plan-before-act/after/kata.py`)

```python
# Kata 6: Plan Before Act
# => Plan-then-act: the agent proposes steps before touching files.
# => A plan you can veto beats a diff you must revert.
# => The shim freezes one proposed plan for a stated goal.
goal = "add email receipts"  # => the task in one sentence
steps = ["draft template", "wire sender", "run tests"]  # => the proposed plan, in order
files = ["src/notify.py", "tests/test_notify.py"]
# => A plan is reviewable only when its blast radius is listed.
# => Count the files before you argue about the steps.
print("goal:", goal)  # => Output states the task
# => Numbered steps print in order so review follows the sequence.
print("steps:", len(steps))  # => how many moves the plan makes
# => The file list is the approve-or-veto surface.
print("files:", len(files))  # => Output sizes the blast radius
```

**Output** (`drilling/code/kata-06-plan-before-act/expected/main.stdout.txt`):

```text
goal: add email receipts
steps: 3
files: 2
```

### Kata 7: Plugin for the Job

Resolve a schema-graph capability to its provider without installing anything new. The after version matches on capability instead of brand name; the setting echoes back namespaced.

**Before** (`drilling/code/kata-07-plugin-for-the-job/before/kata.py`)

```python
# Kata starter: write the registry, then compare with after/kata.py.
# => Names mapped to the capability each plugin provides.
plugins = []  # => TODO: write the registry rows
# => Match on the capability the task needs, not the brand name.
want = ""  # => TODO: name the needed capability
# => Empty means no provider, which is itself an honest answer.
found = ""  # => empty means no provider yet
# => Scan the registry in order and keep the first provider.
# => Order is a feature: curated registries list trusted providers first.
for name, provides in plugins:  # => scan the registry
    # => Capabilities describe work; names describe vendors.
    if provides == want:  # => this plugin can do the job
        found = name  # => record the provider
        break  # => first match wins
# => Print the provider so the trace shows who did the work.
print("provider:", found or "none")  # => Output names the plugin
```

**After** (`drilling/code/kata-07-plugin-for-the-job/after/kata.py`)

```python
# Kata 7: Plugin for the Job
# => Extensions add tools Hermes itself never shipped with.
# => The shim models a registry: names mapped to capabilities.
# => A missing capability is a lookup miss, never a silent stub.
plugins = [
    ("db-viewer", "schema-graph"),
    ("review-bot", "diff-summary"),
]  # => the frozen extension registry
want = "schema-graph"  # => the capability this task needs
# => Search the registry for a plugin providing the capability.
# => First provider wins; ties are a config smell worth naming.
found = ""  # => empty means no provider, which is itself an answer
for name, provides in plugins:  # => scan the registry in order
    # => Match on the capability, not the plugin's brand name.
    # => Capabilities describe work; names describe vendors.
    if provides == want:  # => this plugin can do the job
        found = name  # => record the provider and stop looking
        break  # => first match wins by registry order
# => Hermes merges extension settings under the plugin's own key.
# => Namespacing keeps two plugins from fighting over one knob.
merged = {"db-viewer.depth": "3"}  # => namespaced extension setting
# => Print the provider so the trace shows who did the work.
print("provider:", found or "none")  # => Output names the plugin
# => The setting echoes back so mis-merges surface immediately.
print("setting:", merged)  # => Output shows the merged knob
```

**Output** (`drilling/code/kata-07-plugin-for-the-job/expected/main.stdout.txt`):

```text
provider: db-viewer
setting: {'db-viewer.depth': '3'}
```

### Kata 8: Compare Two Tools

Score Hermes against one peer on the shared coupon task across repro, fix, and tests. The after version freezes the scorecard before comparing; the totals line lets a reader re-weight and disagree.

**Before** (`drilling/code/kata-08-compare-two-tools/before/kata.py`)

```python
# Kata starter: freeze tools and criteria, then compare with after/kata.py.
# => The same task for every tool, or the table lies.
tools = []  # => TODO: name the contending tools
# => Criteria are fixed before scoring, never fitted after.
criteria = []  # => TODO: name what good means
# => Every cell filled before comparing; totals only order debate.
scores = {}  # => TODO: fill the frozen scorecard
# => Print every total so a reader can re-weight and disagree.
totals = {t: sum(scores[t]) for t in tools}  # => one total per tool
# => The best total is reported, then interrogated per criterion.
print("totals:", totals)  # => Output shows the whole table
```

**After** (`drilling/code/kata-08-compare-two-tools/after/kata.py`)

```python
# Kata 8: Compare Two Tools
# => One agent tool teaches habits; two teach judgement.
# => Compare on a shared repeatable task, never on marketing claims.
# => The shim freezes one scorecard so the method is auditable.
tools = ["hermes", "tool-b"]  # => the contenders on the identical task
criteria = ["repro", "fix", "tests"]  # => what good means, fixed before scoring
# => Scores are frozen integers: Hermes is scored like its peers.
# => Freezing the numbers keeps the example honest about being a demo.
scores = {  # => tool mapped to one score per criterion
    "hermes": [2, 2, 2],  # => hermes on each criterion
    "tool-b": [2, 1, 2],  # => tool-b on each criterion
}  # => scorecard closed: every cell filled before comparing
# => Totals decide nothing alone; they only order the discussion.
totals = {t: sum(scores[t]) for t in tools}  # => one total per tool
# => The best total is reported, then interrogated criterion by criterion.
best = max(tools, key=lambda t: totals[t])  # => highest total wins
# => Print every total so the reader can re-weight and disagree.
print("totals:", totals)  # => Output shows the whole table
# => The winner line states the verdict the table supports.
print("best-total:", best)  # => Output names the top scorer
```

**Output** (`drilling/code/kata-08-compare-two-tools/expected/main.stdout.txt`):

```text
totals: {'hermes': 6, 'tool-b': 5}
best-total: hermes
```

## Self-check checklist

- [ ] I can state where Hermes keeps its settings and which keys a session cannot start without.
- [ ] I can choose a sandbox mode for a task and defend the choice by blast radius.
- [ ] I can draw a session scope and predict the verdict for any proposed file action.
- [ ] I can write a task brief that scores four of four on task, scope, done, and guardrails.
- [ ] I can write a done condition that a script could check without human judgement.
- [ ] I can demand a plan before any file changes and veto one that is too wide.
- [ ] I can read a tool-use trace oldest-first and flag the first suspect step.
- [ ] I can tell a correct step from a plausible-looking wrong one using outside evidence.
- [ ] I can read a diff removed-lines-first and name what each deletion risks.
- [ ] I can reject a diff that skipped its repro test and write the narrowed rebrief.
- [ ] I can size a multi-file diff and choose fast approval or slow review by threshold.
- [ ] I can state the shared invariant that makes a multi-file change coherent.
- [ ] I can price a session from its turn and token counts at pinned rates.
- [ ] I can set a dollar ceiling and a turn tripwire that actually halt a session.
- [ ] I can join a trace to its ledger and name the priciest step.
- [ ] I can count repeats in an action history and declare a session stuck at the limit.
- [ ] I can snapshot work to a branch before interrupting a stuck session.
- [ ] I can restart from a written summary instead of replaying a full log.
- [ ] I can resolve a needed capability to its plugin provider from the registry.
- [ ] I can disable a misbehaving plugin through config while keeping its logs.
- [ ] I can freeze a shared task and score two tools on it without moving the goalposts.
- [ ] I can write a dated verdict with versions, prices, and access dates.
- [ ] I can state the shim's simplifications so nobody mistakes it for the live product.
- [ ] I can run the full loop unsupervised on a scoped task and show the receipts.

## Elaborative interrogation & self-explanation

Each prompt names a design choice from this course and the alternative the course rejected. Answer before reading the model: the comparison is the learning.

### Why 1: Why does this course validate the config file before anything else, and why not start with a first task directly?

<details>
<summary>Model answer</summary>

Starting with a task feels faster, but an unvalidated config makes every later surprise ambiguous: is the failure the agent's reasoning or your setup. Validating first separates the two failure domains for the price of one cheap check, and the validated file becomes the baseline every later session diffs against. The rejected alternative, task-first onboarding, optimizes the demo at the cost of every debugging hour that follows, which is why this course, and the harness, gates on layout before running anything.

</details>

### Why 2: Why closed-by-default permissions instead of open-by-default with a blocklist, and when would you loosen them?

<details>
<summary>Model answer</summary>

Blocklists fail on every tool the author never imagined, while closed-by-default fails safe on all of them; the asymmetry favors deny because the cost of one exfiltration dwarfs a thousand approval clicks. Loosening is still right for well-understood, read-mostly surfaces like test runners, where the workflow cost is real and the blast radius is small. The rejected alternative, permissive defaults with after-the-fact audits, converts every new tool into a silent incident waiting for its review cycle.

</details>

### Why 3: Why demand a repro test before the fix rather than accepting a green suite after it?

<details>
<summary>Model answer</summary>

A green suite after the fix proves the code passes, not that the bug existed or that this change fixed it; only the red run connects the symptom to the patch. Without the repro, a coincidental green, a skipped test, or a hallucinated file can all masquerade as success, exactly the failure the trace-reading examples train you to catch. The rejected alternative, fix-first with suite-after, is faster per task and wrong at exactly the moments that matter, which is why the checklist treats a missing repro as a rejection, not a nit.

</details>

### Why 4: Why restart stuck sessions from a summary instead of continuing with full history?

<details>
<summary>Model answer</summary>

Full history re-bills you for every dead end in tokens while burying the live signal under stale plans the agent keeps pattern-matching on; summaries keep decisions and discard exhaust. Continuing feels like preserving context, but most of that context is the record of being wrong, which actively steers the next attempt back into the loop. The rejected alternative, persisting everything, optimizes sentiment over arithmetic, and the token ledger in the cost examples shows exactly what that sentiment costs per turn.

</details>

### Why 5: Why compare tools on a frozen shared task instead of each tool's favorite demo?

<details>
<summary>Model answer</summary>

Favorite demos measure marketing budgets, not engineering fit: each vendor showcases the shape its tool already handles. A frozen shared task with fixed criteria forces every contender through the same repro, fix, and test gates, which surfaces real differences in trace quality, diff size, and cost. The rejected alternative, demo-driven selection, feels thorough while letting every tool win its own category, which is why the dated verdict, not the feature matrix, is this course's standard of proof.

</details>

### Why 6: Why does every example drive a fixture shim instead of the live Hermes Agent?

<details>
<summary>Model answer</summary>

Live tools drift: versions, defaults, and prices change between minor releases, which would rot every recorded output within months and break the harness determinism the course promises. The shim freezes behavior so a reader two years from now sees the same run this page records, while the dated References section carries the currency risk in text instead of code. The rejected alternative, live-driven examples, trades durable reproducibility for momentary realism, and a course that cannot reproduce its own outputs teaches nothing twice.

</details>
