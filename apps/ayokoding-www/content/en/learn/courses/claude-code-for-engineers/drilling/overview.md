---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to Claude Code for Engineers: recall first, then applied judgement, then hands-on repetition, then a checklist, then a why and why-not pass to confirm real automaticity rather than recognition. Every answer hides in a `<details>` block; try each item yourself before opening it.

## Recall Q&A

Twenty-four short-answer questions, one per concept group below. Answer from memory, then check. Star the ones you miss and repeat them after a day; spaced repetition only works when the misses decide what comes back.

### Q1 (co-01): How do you prove Claude Code is installed and new enough?

<details><summary>Answer</summary>

Run `claude --version`, parse the printed number, and compare it to the oldest release your docs describe.

</details>

### Q2 (co-02): Which tool calls need no approval inside your directories?

<details><summary>Answer</summary>

Read-only calls such as file reads and search stay silent; edits, shell commands, and web calls ask first.

</details>

### Q3 (co-03): How do you get yesterday's session back?

<details><summary>Answer</summary>

Reopen it by name with the resume flag, or continue the most recent conversation when recency is enough.

</details>

### Q4 (co-04): What three fields does every task brief need?

<details><summary>Answer</summary>

Scope naming the files, a done condition a command can check, and guardrails naming the no-go rules.

</details>

### Q5 (co-05): Why ask for a plan before any edit?

<details><summary>Answer</summary>

A written plan costs a fraction of an execution and reveals misunderstandings while they are still cheap to fix.

</details>

### Q6 (co-06): What is the actual deliverable of an agent session?

<details><summary>Answer</summary>

The diff is; review its stat, scope, and every hunk, never the prose description alone.

</details>

### Q7 (co-07): What do you read first when a session surprises you?

<details><summary>Answer</summary>

The tool-use trace: the ordered tool calls are what actually happened, prose aside.

</details>

### Q8 (co-08): Name three stuck-session fingerprints

<details><summary>Answer</summary>

Repeating actions, scope drift across files, and failures nobody answered.

</details>

### Q9 (co-09): What survives an interrupt?

<details><summary>Answer</summary>

Committed and checkpointed work survives; only the volatile current draft is at stake.

</details>

### Q10 (co-10): What are the countable currencies of a session?

<details><summary>Answer</summary>

Turns taken and tokens consumed, input and output separately.

</details>

### Q11 (co-11): What makes a multi-file change coherent?

<details><summary>Answer</summary>

Every touched file names the same new symbols: definition, import, and test agree.

</details>

### Q12 (co-12): When may a change merge?

<details><summary>Answer</summary>

Only behind a green suite, and stronger still after witnessing red turn green.

</details>

### Q13 (co-13): Which settings layer wins when several set one key?

<details><summary>Answer</summary>

The highest present layer in managed, command line, project local, shared project, user order.

</details>

### Q14 (co-14): When do you package know-how as a skill or hook?

<details><summary>Answer</summary>

After the third repetition of the same instructions; triggers mirror task language.

</details>

### Q15 (co-15): What must you fix before comparing two agents?

<details><summary>Answer</summary>

One shared task received verbatim plus a frozen scoring rubric with run counts.

</details>

### Q16 (co-16): Which steps always wait for a person?

<details><summary>Answer</summary>

Migrations, deploys, permission changes, and anything in the never-allow class.

</details>

### Q17 (co-02): Where do remembered approvals live and why audit them?

<details><summary>Answer</summary>

In the repository local settings file, applying to future sessions; audit them because they accumulate silently.

</details>

### Q18 (co-03): What survives compaction?

<details><summary>Answer</summary>

Decisions, open items, and names; deliberation chatter is summarized away.

</details>

### Q19 (co-04): Why send errors back verbatim?

<details><summary>Answer</summary>

Paraphrases discard line numbers, codes, and identifiers that the fix needs.

</details>

### Q20 (co-07): Thinking lines versus tool calls: which proves action?

<details><summary>Answer</summary>

Only tool calls prove action; thinking lines record intent and can be wrong.

</details>

### Q21 (co-10): What turns repeated turns nearly free?

<details><summary>Answer</summary>

A stable context prefix that the cache reuses instead of re-reading.

</details>

### Q22 (co-12): How do you grade a test the agent wrote itself?

<details><summary>Answer</summary>

Break the code on purpose and check the test notices; tautologies prove nothing.

</details>

### Q23 (co-13): What does a managed ceiling protect?

<details><summary>Answer</summary>

Non-negotiable policy such as sandbox posture, which no lower layer may loosen.

</details>

### Q24 (co-15): What travels stapled to every published verdict?

<details><summary>Answer</summary>

Its limits: run counts, task scope, and stand-in shims used.

</details>

## Applied problems

Eight judgement problems drawn from real session shapes. Work each on paper before comparing.

### Problem 1: Write a task brief with a clear done condition

Task: fix the login retry delay, which users report as a three-second hang after the third attempt. Draft scope naming the exact files, a done condition one command can check, and one guardrail. A strong answer names one file, `pytest -q` exiting zero, and forbids schema changes. A weak answer says make login faster, which no command can verify and every reader interprets differently.

### Problem 2: Spot the unsafe permission grant

Rule list: allow exec npm test, allow edit repo-wide, allow exec with a wildcard. Flag the wildcard and the repo-wide edit for narrowing; keep the test command. For each flagged rule, write its replacement: a narrower path or a prompt-first fallback. Standing permissions should stand for a stated reason, and neither flagged rule has one.

### Problem 3: Diagnose a stuck-loop trace

Trace: edit, test FAIL, edit, test FAIL on the same file, with identical failure lines twice. Name the repeat fingerprint, interrupt the session, and restart from the last green step with the failing output pasted verbatim. Then write the one-line post-mortem rule the next session inherits.

### Problem 4: Scope a session that must not wander

Task touches login.py only, but the fix may tempt refactors in auth.py. Write the allow-list, set manual mode, and state where the run halts if a migration step appears. Name the human-owned step explicitly so the halt names its waiter instead of stalling vaguely.

### Problem 5: Budget a ten-task session on six turns

Order the ten tasks by value first, because the budget only works on a sorted list. Run the first six, and report the waiting four with a new budget request. Arithmetic does not negotiate, and visible waiting lists beat silently dropped work every time.

### Problem 6: Review a three-hunk diff with one intruder

Scope covers two files; the third hunk edits migrations. Accept two hunks with verdicts, reject the third with its reason, and restate scope for the retry. Record what you inspected per hunk so the next reviewer inherits evidence rather than an overall impression.

### Problem 7: Recover a session that edited the wrong file

Revert the intruding edit first, restate scope second, retry third. Never stack new work on pollution. Then diagnose the brief: which sentence allowed the misreading, and how would you rewrite it so the next session cannot wander the same way?

### Problem 8: Set up a fair two-agent comparison

Fix the shared task verbatim, freeze the rubric weights, run each side twice, and publish means with ranges plus safety events. Attach the limits: run counts, task scope, and stand-in shims. A verdict without its limits is a slogan, and slogans do not survive contact with the next release.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Make the starter match before peeking. Work them in order: the brief kata first, because every later kata assumes you can write one; the review and recovery katas next, because they train the two reflexes stuck sessions demand; the audit, diagnosis, budget, and settings katas after, because they isolate one judgement each; the comparison kata last, because it assembles the whole method into a single verdict with limits.

### Kata 01: Write a Scoped Task Brief

(Concepts: co-04.)

Turn the vague request below into a brief with scope, a checkable done condition, and one guardrail. Start from the starter, which holds the vague version, and match the reference shape.

**Before** (`drilling/code/kata-01-write-a-scoped-task-brief/before/starter.py`):

```python
# => Kata starter: complete the brief fields below.
# => Run the reference solution to see the target shape.
BRIEF = {"scope": "", "done": ""}  # => TODO: fill scope and done
GUARD = ""  # => TODO: name one no-go rule


def complete(brief, guard):  # => TODO: return True when all three read clearly
    return False  # => TODO: replace with the real check
```

**After** (`drilling/code/kata-01-write-a-scoped-task-brief/after/solution.py`):

```python
# => Kata reference: a complete scoped task brief.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The brief is fixed data; no agent reads it here.

# => WHY this shape: three fields remove vagueness mechanically.
# => Scope names the file so hands cannot wander.
# => Done names the command so finish is testable.
# => Guard names the limit so review has teeth.
# => Non-empty strings are the minimum viable clarity.
# => Reference stays plain; clarity needs no ornament.
# => Compare starters field by field, not by feel.
# => Missing fields fail loudly instead of drifting.
# => Briefs written here transfer to live sessions directly.

BRIEF = {
    "scope": "login.py",
    "done": "pytest -q exits 0",
}  # => scope plus checkable proof
GUARD = "no schema change"  # => the one no-go rule


def complete(brief, guard):  # => True when scope, done, and guard read clearly
    fields = [
        brief.get("scope"),
        brief.get("done"),
        guard,
    ]  # => the three required readings
    return all(
        isinstance(f, str) and len(f) > 0 for f in fields
    )  # => every field non-empty


def main():  # => confirm the reference brief is complete
    print(
        "brief:", BRIEF["scope"], "|", BRIEF["done"]
    )  # => Output: the scope and done line
    print("guard:", GUARD)  # => Output: guard: no schema change
    print("complete:", complete(BRIEF, GUARD))  # => Output: complete: True


main()  # => run once; compare your starter against this shape
```

**Output** (`drilling/code/kata-01-write-a-scoped-task-brief/expected/main.stdout.txt`):

```text
brief: login.py | pytest -q exits 0
guard: no schema change
complete: True
```

**Key takeaway**: A complete brief states scope, checkable done, and one guardrail before any agent sees it.

**Why it matters**: Brief-writing is the highest-leverage typing you do in an agent session. This kata isolates the skill: given vagueness, produce the three fields that remove it. Repeat it with your own tasks until the shape comes out without thinking. The reference solution is deliberately plain; clarity needs no ornament. When every brief you write looks like this one, your sessions will start converging instead of wandering.

### Kata 02: Review a Proposed Multi-File Diff

(Concepts: co-06, co-11.)

Verdict each hunk of the proposed change below against the stated scope. Start from the starter's unreviewed hunks and match the reference verdicts.

**Before** (`drilling/code/kata-02-review-a-proposed-multi-file-diff/before/starter.py`):

```python
# => Kata starter: verdict each hunk below.
# => Run the reference solution to see the target verdicts.
HUNKS = [
    "login.py: add check",
    "auth.py: import check",
    "schema.sql: alter",
]  # => three hunks
SCOPE = ["login.py", "auth.py"]  # => the brief covers two files


def review(hunks, scope):  # => TODO: return one True/False per hunk
    return []  # => TODO: replace with per-hunk verdicts
```

**After** (`drilling/code/kata-02-review-a-proposed-multi-file-diff/after/solution.py`):

```python
# => Kata reference: per-hunk verdicts against the scope.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Hunks are fixed data; nothing is merged here.

# => WHY per hunk: overall glow hides the intruding file.
# => Membership checks beat aesthetic judgement.

HUNKS = [
    "login.py: add check",
    "auth.py: import check",
    "schema.sql: alter",
]  # => three hunks
SCOPE = ["login.py", "auth.py"]  # => the brief covers two files


def review(hunks, scope):  # => verdict every hunk against the scope
    verdicts = []  # => one verdict per hunk, in order
    for hunk in hunks:  # => walk hunks top to bottom, none skipped
        verdicts.append(hunk.split(":")[0] in scope)  # => file membership decides
    return verdicts  # => True, True, False for these hunks


def main():  # => print each hunk beside its verdict
    verdicts = review(HUNKS, SCOPE)  # => two approvals, one rejection
    for hunk, ok in zip(HUNKS, verdicts):  # => walk hunks with verdicts
        print(ok, hunk)  # => Output: True/False beside each hunk


main()  # => run once; compare your starter against these verdicts
```

**Output** (`drilling/code/kata-02-review-a-proposed-multi-file-diff/expected/main.stdout.txt`):

```text
True login.py: add check
True auth.py: import check
False schema.sql: alter
```

**Key takeaway**: Every hunk gets its own verdict; scope membership decides, glow does not.

**Why it matters**: Hunk-by-hunk review is a motor skill as much as a principle. This kata trains the motion on a small diff: read the file name first, check membership, record the verdict, move on. The schema hunk is the trap for skimmers who approve by overall impression. Practice here and the reflex transfers to hundred-hunk sessions. Reviewers who verdict per hunk sleep better and revert less.

### Kata 03: Recover a Stuck Session Without Data Loss

(Concepts: co-09, co-08.)

The session below loops on a failing edit with committed work behind it. Interrupt it, keep the committed win, and restart from the last green step. Start from the starter and match the reference recovery.

**Before** (`drilling/code/kata-03-recover-a-stuck-session-without-data-loss/before/starter.py`):

```python
# => Kata starter: recover the stuck session below.
# => Run the reference solution to see the target recovery.
HISTORY = [("t1", True), ("t2", False), ("t2", False)]  # => one green, then a loop
COMMITTED = ["t1"]  # => the win already checkpointed


def recover(history, committed):  # => TODO: return kept work plus restart point
    return [], None  # => TODO: replace with the real recovery
```

**After** (`drilling/code/kata-03-recover-a-stuck-session-without-data-loss/after/solution.py`):

```python
# => Kata reference: interrupt, keep, and restart from green.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => History is fixed data; nothing restarts here.
HISTORY = [("t1", True), ("t2", False), ("t2", False)]  # => one green, then a loop
COMMITTED = ["t1"]  # => the win already checkpointed


def recover(history, committed):  # => keep wins, restart at last green
    kept = list(committed)  # => committed work survives the interrupt
    greens = [t for t, ok in history if ok]  # => green steps in order
    point = greens[-1] if greens else None  # => t1 is the restart point
    return kept, point  # => the honest recovery pair


def main():  # => run the reference recovery once
    kept, point = recover(HISTORY, COMMITTED)  # => keep t1, restart at t1
    print("kept:", kept)  # => Output: kept: ['t1']
    print("restart at:", point)  # => Output: restart at: t1


main()  # => run once; compare your starter against this recovery
```

**Output** (`drilling/code/kata-03-recover-a-stuck-session-without-data-loss/expected/main.stdout.txt`):

```text
kept: ['t1']
restart at: t1
```

**Key takeaway**: Interrupt the loop, keep committed wins, and restart at the last green step.

**Why it matters**: Recovery has an order and the order is the skill: interrupt stops the bleeding, kept work bounds the loss, and the green restart point aims the fresh attempt. This kata drills the sequence on a tiny history so the motion is automatic when a real session burns budget. Hesitation is the expensive part of recovery, not the recovery itself. Practice the interrupt until your finger reaches for it early.

### Kata 04: Audit Remembered Permission Rules

(Concepts: co-02.)

The settings file below accumulated remembered rules across sessions. Audit it: list every rule and flag the one that grants too much. Start from the starter and match the reference audit.

**Before** (`drilling/code/kata-04-audit-remembered-permission-rules/before/starter.py`):

```python
# => Kata starter: audit the remembered rules below.
# => Run the reference solution to see the target audit.
RULES = [
    "allow exec: npm test",
    "allow edit: /repo/**",
    "allow exec: rm *",
]  # => three rules


def audit(rules):  # => TODO: return flagged rules with reasons
    return []  # => TODO: replace with the real audit
```

**After** (`drilling/code/kata-04-audit-remembered-permission-rules/after/solution.py`):

```python
# => Kata reference: audit remembered rules, flag the overbroad one.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Rules are fixed data; nothing is permitted here.

# => WHY flag breadth: wildcards grant futures nobody reviewed.
# => Deletion commands never earn standing approval.

RULES = [
    "allow exec: npm test",
    "allow edit: /repo/**",
    "allow exec: rm *",
]  # => three rules


def risky(rule):  # => a rule is risky when it names wildcards or removal
    return "*" in rule or rule.startswith("allow edit: /")  # => breadth or deletion


def audit(rules):  # => flag risky rules, keep the tight ones
    return [(r, risky(r)) for r in rules]  # => one pair per rule


def main():  # => audit three remembered rules
    for rule, flag in audit(RULES):  # => walk each rule with its flag
        print(flag, rule)  # => Output: False/True beside each rule


main()  # => run once; compare your starter against this audit
```

**Output** (`drilling/code/kata-04-audit-remembered-permission-rules/expected/main.stdout.txt`):

```text
False allow exec: npm test
True allow edit: /repo/**
True allow exec: rm *
```

**Key takeaway**: Audit every remembered rule; flag wildcards and deletions for removal or narrowing.

**Why it matters**: Standing permissions decay: the rule that was prudent in March is overbroad by October. This kata trains the audit eye on three rules where one plainly overreaches. The wildcard edit and the removal command are the shapes to memorize, because real settings files hide them among dozens of innocent entries. Audit on a schedule, not on suspicion. Suspicion arrives after the incident; schedules arrive before it.

### Kata 05: Diagnose a Trace and Name the Mode

(Concepts: co-07, co-08.)

The trace below hides one dominant failure fingerprint. Score repeats, drift, and ignored errors, then name the mode. Start from the starter and match the reference diagnosis.

**Before** (`drilling/code/kata-05-diagnose-a-trace-and-name-the-mode/before/starter.py`):

```python
# => Kata starter: score the trace and name its mode.
# => Run the reference solution to see the target diagnosis.
TRACE = ["edit a.py", "test FAIL", "edit b.py", "test FAIL"]  # => four trace lines


def diagnose(trace):  # => TODO: return the dominant fingerprint name
    return ""  # => TODO: replace with repeat, drift, or ignored
```

**After** (`drilling/code/kata-05-diagnose-a-trace-and-name-the-mode/after/solution.py`):

```python
# => Kata reference: score three fingerprints, name the winner.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The trace is fixed data; nothing is diagnosed for real.

# => WHY arithmetic first: scores separate before insight arrives.
# => Matching pairs signal loops without listening to excuses.
# => Unanswered failures point at feedback, not effort.
# => Distinct targets reveal drift across the repo.
# => Treat the winner; symptoms mislead.
# => The motion transfers to traces of any length.

TRACE = ["edit a.py", "test FAIL", "edit b.py", "test FAIL"]  # => four trace lines


def fingerprints(trace):  # => score repeats, drift, and ignored errors
    repeats = sum(
        1 for i in range(1, len(trace)) if trace[i] == trace[i - 2]
    )  # => matching pairs
    ignored = sum(1 for t in trace if "FAIL" in t)  # => failures nobody answered
    drift = len(
        {t.split()[1] for t in trace if " " in t}
    )  # => distinct targets touched
    return {
        "repeat": repeats,
        "ignored": ignored,
        "drift": drift,
    }  # => the three scores


def diagnose(trace):  # => the top fingerprint names the failure mode
    return max(fingerprints(trace), key=fingerprints(trace).get)  # => repeat wins here


def main():  # => diagnose the four-line trace once
    print("marks:", fingerprints(TRACE))  # => Output: marks: the three scores
    print("mode:", diagnose(TRACE))  # => Output: mode: repeat


main()  # => run once; compare your starter against this diagnosis
```

**Output** (`drilling/code/kata-05-diagnose-a-trace-and-name-the-mode/expected/main.stdout.txt`):

```text
marks: {'repeat': 2, 'ignored': 2, 'drift': 3}
mode: drift
```

**Key takeaway**: Score repeats, drift, and ignored errors; the top fingerprint names the failure mode.

**Why it matters**: Diagnosis is arithmetic before it is insight. This kata drills the scoring motion until the three fingerprints separate cleanly in your reading: matching pairs signal loops, distinct targets signal drift, unanswered failures signal ignored errors. The trace here repeats its failing pair three times, which makes repeat the mode to treat: interrupt first. Treat the winner and the session usually unblocks within a turn.

### Kata 06: Budget a Session That Must Land

(Concepts: co-10.)

The task list below exceeds its turn budget. Decide which tasks run now and which wait, then report the bill. Start from the starter and match the reference budget.

**Before** (`drilling/code/kata-06-budget-a-session-that-must-land/before/starter.py`):

```python
# => Kata starter: budget the tasks below against five turns.
# => Run the reference solution to see the target budget.
TASKS = ["fix", "test", "docs", "refactor", "deploy", "notify", "log"]  # => seven tasks
BUDGET = 5  # => five turns available


def budget(tasks, cap):  # => TODO: return the tasks that run now
    return []  # => TODO: replace with the first five tasks
```

**After** (`drilling/code/kata-06-budget-a-session-that-must-land/after/solution.py`):

```python
# => Kata reference: first five tasks run, the rest wait.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Tasks are fixed data; nothing is scheduled here.
TASKS = ["fix", "test", "docs", "refactor", "deploy", "notify", "log"]  # => seven tasks
BUDGET = 5  # => five turns available


def budget(tasks, cap):  # => the first cap tasks run now
    return list(tasks[:cap])  # => fix through deploy run now


def waiting(tasks, cap):  # => the remainder waits for a new budget
    return list(tasks[cap:])  # => notify and log wait


def main():  # => budget seven tasks against five turns
    print("now:", budget(TASKS, BUDGET))  # => Output: now: the first five tasks
    print("waiting:", waiting(TASKS, BUDGET))  # => Output: waiting: ['notify', 'log']


main()  # => run once; compare your starter against this budget
```

**Output** (`drilling/code/kata-06-budget-a-session-that-must-land/expected/main.stdout.txt`):

```text
now: ['fix', 'test', 'docs', 'refactor', 'deploy']
waiting: ['notify', 'log']
```

**Key takeaway**: Spend the budget on the first tasks in priority order; waiting tasks get a new budget, not stolen turns.

**Why it matters**: Budgeting is triage with numbers. This kata drills the cut: seven tasks, five turns, no negotiation with arithmetic. The discipline transfers directly to real sessions where the tenth turn feels as reasonable as the second. Ordering is the prerequisite skill, because the budget only works when the list is already sorted by value. Sort first, cut second, and report both lists so the waiting work stays visible.

### Kata 07: Resolve a Settings Conflict

(Concepts: co-13.)

One key is set in three layers below with conflicting values. Walk the precedence order and declare the winner. Start from the starter and match the reference resolution.

**Before** (`drilling/code/kata-07-resolve-a-settings-conflict/before/starter.py`):

```python
# => Kata starter: resolve the key below across layers.
# => Run the reference solution to see the target resolution.
LAYERS = ["managed", "cli", "local", "project", "user"]  # => highest first
VALUES = {"user": "allow", "project": "ask", "cli": "deny"}  # => three competing values


def resolve(layers, values):  # => TODO: return the winning layer and value
    return None, None  # => TODO: replace with the real walk
```

**After** (`drilling/code/kata-07-resolve-a-settings-conflict/after/solution.py`):

```python
# => Kata reference: highest present layer wins the key.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Layers are fixed data; no settings are read here.
LAYERS = ["managed", "cli", "local", "project", "user"]  # => highest first
VALUES = {"user": "allow", "project": "ask", "cli": "deny"}  # => three competing values


def resolve(layers, values):  # => walk highest first, first present wins
    for layer in layers:  # => managed down to user, in order
        if layer in values:  # => cli is the first present layer here
            return layer, values[layer]  # => the winning pair
    return None, None  # => unset everywhere means the default


def main():  # => resolve one key across three layers
    layer, value = resolve(LAYERS, VALUES)  # => cli wins with deny
    print("layer:", layer)  # => Output: layer: cli
    print("value:", value)  # => Output: value: deny


main()  # => run once; compare your starter against this walk
```

**Output** (`drilling/code/kata-07-resolve-a-settings-conflict/expected/main.stdout.txt`):

```text
layer: cli
value: deny
```

**Key takeaway**: Walk layers highest-first; the first present value wins and proximity never outranks precedence.

**Why it matters**: Precedence disputes feel personal because each layer has an author who feels authoritative. This kata makes the walk mechanical: start at managed, descend, stop at the first value. The command-line flag wins here over project and user layers, which surprises everyone exactly once. After that, surprise becomes procedure. Debugging config means walking, not arguing; the order settles every contest the same way.

### Kata 08: Score Two Agents on One Task

(Concepts: co-15.)

Both agents below attempted the shared task with recorded turns, tokens, and correctness. Score them on the frozen rubric and publish the verdict with its limits. Start from the starter and match the reference score.

**Before** (`drilling/code/kata-08-score-two-agents-on-one-task/before/starter.py`):

```python
# => Kata starter: score both agents on the rubric below.
# => Run the reference solution to see the target verdict.
RUBRIC = {"correct": 50, "scope": 20, "turns": 20, "safe": 10}  # => frozen weights
A = {"correct": 50, "scope": 20, "turns": 12, "safe": 10}  # => this tool
B = {"correct": 0, "scope": 14, "turns": 16, "safe": 10}  # => the peer stumbled


def score(row, rubric):  # => TODO: total one side under frozen weights
    return 0  # => TODO: replace with the real total
```

**After** (`drilling/code/kata-08-score-two-agents-on-one-task/after/solution.py`):

```python
# => Kata reference: frozen rubric, correctness-gated verdict.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Scores are fixed data; no agent ran here.

# => WHY frozen weights: post-hoc scoring flatters favorites.
# => Limits travel with verdicts or verdicts mislead.

RUBRIC = {"correct": 50, "scope": 20, "turns": 20, "safe": 10}  # => frozen weights
A = {"correct": 50, "scope": 20, "turns": 12, "safe": 10}  # => this tool
B = {"correct": 0, "scope": 14, "turns": 16, "safe": 10}  # => the peer stumbled


def score(row, rubric):  # => total one side under the frozen weights
    return sum(row[k] for k in rubric)  # => 92 for A, 40 for B


def verdict(a, b, rubric):  # => higher frozen score wins, limits attached
    sa, sb = score(a, rubric), score(b, rubric)  # => both totals computed
    name = "A" if sa >= sb else "B"  # => A wins here
    return "%s wins %d to %d (2 runs each, one task)" % (
        name,
        sa,
        sb,
    )  # => verdict plus limits


def main():  # => score both sides and publish with limits
    print("scores:", score(A, RUBRIC), score(B, RUBRIC))  # => Output: scores: 92 40
    print(verdict(A, B, RUBRIC))  # => Output: the verdict with its limits


main()  # => run once; compare your starter against this verdict
```

**Output** (`drilling/code/kata-08-score-two-agents-on-one-task/expected/main.stdout.txt`):

```text
scores: 92 40
A wins 92 to 40 (2 runs each, one task)
```

**Key takeaway**: Total both sides under frozen weights; publish the winner with run counts and scope attached.

**Why it matters**: Scoring closes the comparison loop this course opened: shared task, frozen rubric, repeated runs, published limits. This kata compresses the whole method into one exercise where the peer's zero on correctness decides before style is even discussed. The verdict line carries its limits because numbers without context become slogans. Practice the full ceremony here and real tool choices get easier, calmer, and harder to regret.

## Self-check checklist

Twenty-four can-do items, at least one per concept. Check only what you have actually done in a real session, not what you merely recognize from reading.

- [ ] 1. (co-01) I can verify the installed release with the version command.
- [ ] 2. (co-01) I can pick the right installer for a new machine.
- [ ] 3. (co-02) I can predict which calls prompt and which stay silent.
- [ ] 4. (co-02) I can audit remembered rules in the local settings file.
- [ ] 5. (co-02) I can draw a sandbox boundary that fits the task.
- [ ] 6. (co-03) I can resume a named session and continue the latest one.
- [ ] 7. (co-03) I can compact a long session without losing open items.
- [ ] 8. (co-03) I can budget a context window across its claimants.
- [ ] 9. (co-04) I can write a brief with scope, checkable done, and guardrails.
- [ ] 10. (co-04) I can keep prompts to one task per turn.
- [ ] 11. (co-05) I can demand a written plan before execution.
- [ ] 12. (co-06) I can review a diff hunk by hunk against scope.
- [ ] 13. (co-06) I can reject one hunk while keeping the rest.
- [ ] 14. (co-07) I can summarize a tool-use trace per tool in order.
- [ ] 15. (co-07) I can export a transcript with roles for review.
- [ ] 16. (co-08) I can name a loop from its repetition and interrupt it.
- [ ] 17. (co-08) I can refuse never-allow actions without debate.
- [ ] 18. (co-09) I can restart from the last green checkpoint with the lesson.
- [ ] 19. (co-10) I can count turns and tokens per task and find the dearest.
- [ ] 20. (co-10) I can cap a refinement loop by attempts.
- [ ] 21. (co-11) I can check a multi-file change for shared symbols.
- [ ] 22. (co-12) I can hold a merge shut until the suite is green.
- [ ] 23. (co-13) I can resolve a key across all five settings layers.
- [ ] 24. (co-14) I can package a repeated workflow as a command or hook.

## Elaborative interrogation & self-explanation

Six why and why-not prompts. Each names a design choice and a rejected alternative, with a model answer.

### W1: Why does this course insist on reads before writes, and why not trust the agent's summary of a file instead?

Reads give the agent the file's actual conventions and edge cases; summaries compress away the details edits depend on. Rejected alternative: trusting summaries saves turns but produces blind edits that break imports and duplicate logic. The rule survives because the cost of one read is tiny beside one bad edit.

### W2: Why plan-then-act instead of letting a well-briefed agent run straight through?

The plan exposes misunderstandings while they are cheap and inserts your judgement before irreversible steps. Rejected alternative: straight-through execution saves one approval turn but spends many more reverting confident wrong work. Approval placement matters more than approval count.

### W3: Why cap turns and attempts rather than letting a converging session finish naturally?

Caps convert sunk cost into decision points and force rebriefing when the approach is wrong. Rejected alternative: unbounded retries feel productive but spiral, billing turns for motion instead of progress. A session that needs a thirteenth turn usually needed a better brief at turn one.

### W4: Why compare agents on one shared task instead of letting each shine on its home ground?

Shared tasks isolate tool differences from task differences, which is the only comparison that informs choice. Rejected alternative: home-ground tasks flatter each agent and produce verdicts that do not transfer. Fairness constraints feel artificial and are exactly what make the numbers mean something.

### W5: Why do remembered approvals deserve audits when each one was reasonable at the time?

Standing permissions accumulate across sessions and contexts, quietly widening access beyond its original reason. Rejected alternative: trusting past judgement forever confuses a decision with a policy. Quarterly audits take minutes and catch the rule nobody remembers granting.

### W6: Why witness red before accepting green instead of accepting a passing suite at face value?

A test that never failed may guard nothing, so its green proves nothing about the fix. Rejected alternative: accepting green directly saves the red step but accepts decoration as evidence. The failure is the price of trust, and it is cheap.
