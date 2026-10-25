---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the OpenClaw for Engineers course: recall first, then applied judgement, then hands-on katas, then a checklist to confirm automaticity, and finally why and why-not prompts that test whether you can explain the reasoning. Every answer hides in a `<details>` block; try each item yourself before opening it.

## Recall Q&A

Twenty-four short-answer questions covering every concept (`co-01` through `co-16`). Answer from memory, then check.

**Q1 (co-01 — tool-invocation-model).** Which two CLI probes open every OpenClaw session, and what does each one tell you?

<details>
<summary>Answer</summary>

`openclaw --version` names the release you are driving; `openclaw doctor` checks the machine around it (runtime, config, gateway reachability). Both must read green before later steps mean anything.

</details>

**Q2 (co-13 — config-file).** Name the five top-level sections of `openclaw.json` and where the file lives.

<details>
<summary>Answer</summary>

`agents`, `channels`, `tools`, `models`, and `security`, under `~/.openclaw/`. Each setting lives in exactly one section.

</details>

**Q3 (co-04 — task-brief).** What are the four parts of a task brief, in order?

<details>
<summary>Answer</summary>

Goal, scope, done condition, and guardrails. A brief missing any part is not sendable.

</details>

**Q4 (co-02 — permission-scope).** In what order are deny, allow, and ask resolved, and which wins?

<details>
<summary>Answer</summary>

Deny first, then allow, then ask for anything unknown. Deny wins outright; unknown tools never run silently.

</details>

**Q5 (co-07 — tool-use-trace).** What three things does a trace record per call, and which question does the order answer?

<details>
<summary>Answer</summary>

Tool name, arguments, and sequence position. The order tells the story of what the agent actually did, as opposed to what its summary claims.

</details>

**Q6 (co-03 — session-and-context).** What three items must a resume bundle carry, and why all three?

<details>
<summary>Answer</summary>

Goal, completed steps, and the failure note. Without the goal the session drifts, without completed steps it repeats work, and without the failure note it repeats the failure.

</details>

**Q7 (co-05 — plan-then-act).** Where does the human checkpoint sit in plan-then-act, and what does approving it freeze?

<details>
<summary>Answer</summary>

Between the proposed plan and execution. Approval freezes the agreement: execution must match the approved plan exactly.

</details>

**Q8 (co-06 — diff-review).** What two gates must a multi-file proposal pass per file?

<details>
<summary>Answer</summary>

Per-file size (ten changed lines or fewer for auto-approval) and cross-file coherence (every referenced file must exist in the proposal or the repo).

</details>

**Q9 (co-08 — failure-mode).** What is the three-repeat rule, and what does crossing it declare?

<details>
<summary>Answer</summary>

Three consecutive identical failing tool calls declare the session stuck. Two retries are patience; three are a loop that will not self-rescue.

</details>

**Q10 (co-09 — recovery-step).** What is the checkpoint-interrupt-resume order, and why that order?

<details>
<summary>Answer</summary>

Checkpoint finished work first, then interrupt the loop, then resume the unfinished tail. Checkpointing first is what makes interruption safe.

</details>

**Q11 (co-10 — cost-and-budget).** Name two budget types from this course and what each caps.

<details>
<summary>Answer</summary>

Turn budgets cap how many agent turns a task may consume; spend limits cap session tokens and demand approval to cross. Either can be named; both halt instead of funding drift.

</details>

**Q12 (co-11 — multi-file-change).** What does atomic apply require, and what does it refuse?

<details>
<summary>Answer</summary>

All files approved or nothing applies. It refuses partial application: two approved files out of three means zero files applied.

</details>

**Q13 (co-12 — test-gate).** When may a change merge, and who provides the proof?

<details>
<summary>Answer</summary>

Only when every gate check passes. The agent provides the proof by running its own tests; the human reads the gate report, not the agent's assurance.

</details>

**Q14 (co-14 — extension-or-plugin).** What four parts make a skill loadable?

<details>
<summary>Answer</summary>

Name, inputs, tool guidance, and rules. All four must be present and validated before invocation.

</details>

**Q15 (co-15 — comparison-criteria).** Why must comparison weights be written before either tool runs?

<details>
<summary>Answer</summary>

Criteria written after the runs favour whoever already won. Pre-registered weights force honesty about what you value — here, correctness at half weight.

</details>

**Q16 (co-16 — human-in-the-loop).** Name three checkpoints where a human must approve before anything proceeds.

<details>
<summary>Answer</summary>

Any three of: plan approval, ask-policy tool approval, cost-limit crossing, multi-file apply, verdict publication. Each one pauses automation until a human says yes.

</details>

**Q17 (co-01 — tool-invocation).** What does a task invocation need besides the command, and what happens when one is missing?

<details>
<summary>Answer</summary>

A workspace and a goal. Missing any of the three, the task is refused before sending — never repaired mid-flight.

</details>

**Q18 (co-02 — permission-scope).** Why can a session override only tighten policy, never loosen it?

<details>
<summary>Answer</summary>

The merge rule takes deny from either side. One-directional tightening means sessions cannot leave permissions looser than they found them, so there is nothing to audit afterwards.

</details>

**Q19 (co-03 — session-and-context).** How do you verify that context actually carried forward between turns?

<details>
<summary>Answer</summary>

Number the turns and check that a later turn uses a specific earlier fact — the goal and the count, for example. Carried context is only real when a later turn depends on it.

</details>

**Q20 (co-07 — tool-use-trace).** How do you tell a correct step from a plausible-looking wrong one?

<details>
<summary>Answer</summary>

Check each step's file claim against the workspace listing. Confidence in prose never outweighs a missing file; one unverified claim fails the whole trace.

</details>

**Q21 (co-10 — cost-and-budget).** What must a true cost total include besides tokens, and why?

<details>
<summary>Answer</summary>

Review minutes, priced into the same units. The cheapest run with the heaviest review often costs most, and token-only totals hide that.

</details>

**Q22 (co-13 — config-file).** How do environment overlays relate to the base config, and what must stay true of the base?

<details>
<summary>Answer</summary>

Overlays layer on top and win on shared keys; the base itself is never mutated. The base stays common so environments differ only where they declare it.

</details>

**Q23 (co-14 — extension-or-plugin).** What three fields register a custom tool, and what happens to calls outside the policy?

<details>
<summary>Answer</summary>

Binary, argument policy, and default permission. Calls outside the policy are refused — the registration is a contract, not a suggestion.

</details>

**Q24 (co-04 — task-brief).** What makes a done condition checkable, and what do you do with one that is not?

<details>
<summary>Answer</summary>

It names an observable state a script could verify, like files present in a directory. Rewrite vague finish lines until a script could check them; never send "tidy up a bit" to an agent.

## Applied problems

Eight scenario problems. Diagnose each one, then check the model answer.

**A1. Write a task brief with a clear done condition.** The team asks OpenClaw to "clean up the docs directory". Write the four-part brief you would actually send.

<details>
<summary>Model answer</summary>

Goal: remove stale drafts from `docs/`. Scope: `docs/drafts/` only. Done: `docs/drafts/` holds zero files older than 30 days and the link checker passes. Guardrails: never delete before copying to `docs/archive/`, touch no code. The vague ask becomes sendable only when all four parts are present.

</details>

**A2. Spot the unsafe permission grant.** A teammate proposes `{"exec": "allow"}` globally plus a public channel with no access group, to "make the demo smoother". Name every problem.

<details>
<summary>Answer</summary>

Three problems. Global exec-allow removes the checkpoint from the most dangerous tool. The public channel without a group inherits whatever default applies instead of read-only. Together they let any public message trigger shell execution. Fix: exec to ask, public channel to an explicit read-only group.

</details>

**A3. Diagnose a stuck-loop trace.** A session shows `exec` failing six times in a row with the same missing-file error, then a seventh identical call starting. What is it, and what are your next two actions?

<details>
<summary>Answer</summary>

A stuck loop: six repeats far exceed the three-repeat rule. Checkpoint the finished steps first, then interrupt. Resume the tail only, with the missing file checked before any exec retry.

</details>

**A4. Judge a confident summary.** The agent reports "migration complete, all 12 files moved" but the trace shows eleven `move` calls and no verification step. What do you conclude, and what do you ask for?

<details>
<summary>Answer</summary>

The trace fails: the twelfth file has no move call and nothing verified the set. Treat the summary as unverified. Ask for a listing of the destination directory and a count before accepting the claim.

</details>

**A5. Price a cheap-looking run.** Tool A spent 5,000 tokens with 60 review minutes; tool B spent 8,400 tokens with 10 review minutes. At 100 tokens per review minute, which costs more to own, and by how much?

<details>
<summary>Answer</summary>

A totals 5,000 + 6,000 = 11,000; B totals 8,400 + 1,000 = 9,400. A costs 1,600 more to own despite cheaper tokens. Always price review labour beside tokens.

</details>

**A6. Route a failure to its recovery.** During one session you see: (1) the same `exec` retried five times, (2) a plan that assumes an empty archive which holds files, (3) a proposal to delete originals. Triage all three.

<details>
<summary>Answer</summary>

(1) is a loop: interrupt and resume the tail. (2) is a wrong assumption: surface it, correct the plan to merge without overwriting, then resume. (3) is unsafe: veto outright and continue with the surviving actions.

</details>

**A7. Review a scheduled brief.** A cron brief reads: schedule daily 08:00, scope `inbox.md`, no report target. Is it sendable? What is missing and why does it matter?

<details>
<summary>Answer</summary>

Not sendable: the report target is missing. Unwatched runs must report somewhere a human looks, or failures stay silent until they compound. Add `report: team-chat: digest` or equivalent before enabling the schedule.

</details>

**A8. Seal a comparison.** You must compare OpenClaw against a sibling tool on digest triage. List the four things you fix before either leg runs.

<details>
<summary>Answer</summary>

One shared brief id both legs execute; identical units for correctness, tokens, turns, and review findings; pre-registered weights summing to one; and a stamped re-run record. Anything left unsealed becomes the argument after the verdict.

## Code katas

Eight hands-on repairs. Each kata starts from the buggy `before` file and ends at the fixed `after` file; run the `after` file to confirm the repair. Work each kata in three passes for full effect. First, read only the problem statement and the `before` file, and predict the buggy output line by line before scrolling to it. Second, close the page and write your own fixed version from memory, then diff it against the `after` file to see what you missed. Third, run the `after` file yourself and confirm your output matches the recorded block byte for byte. The first pass trains prediction, the second trains recall, and the third trains verification — the same three muscles every example in this course was designed to build.

### Kata 1: Write a Scoped Task Brief

_kata-01 · exercises co-04_

The starting brief below sends an archive task with only a goal. Repair it so the brief carries all four parts and the send blocks until they are present.

**Before** (`drilling/code/kata-01-scoped-task-brief/before/kata.py`)

```python
# => Buggy: any single part makes the brief sendable.
# => An incomplete brief slips through.
brief = {"goal": "archive drafts"}  # => only the goal is stated
# => scope, done, and guardrails are missing
parts = ["goal", "scope", "done", "guardrails"]  # => the four required parts
sendable = any(p in brief for p in parts)  # => BUG: any() passes on one part alone
# => should require every part
print("parts present: %d of %d" % (sum(1 for p in parts if p in brief), len(parts)))  # => Output: parts present: 1 of 4
print("sendable: " + str(sendable))  # => Output: sendable: True, wrongly
```

The starting point runs and shows the bug:

```text
parts present: 1 of 4
sendable: True
```

**After** (`drilling/code/kata-01-scoped-task-brief/after/kata.py`)

```python
# => Fixed: every part must be present.
# => The incomplete brief now blocks.
brief = {"goal": "archive drafts"}  # => still only the goal is stated
# => the brief itself did not change
parts = ["goal", "scope", "done", "guardrails"]  # => the four required parts
sendable = all(p in brief for p in parts)  # => FIX: all() demands every part
# => one of four is not enough
print("parts present: %d of %d" % (sum(1 for p in parts if p in brief), len(parts)))  # => Output: parts present: 1 of 4
print("sendable: " + str(sendable))  # => Output: sendable: False, correctly
```

**Output** (`drilling/code/kata-01-scoped-task-brief/expected/main.stdout.txt`):

```text
parts present: 1 of 4
sendable: False
```

**Run**: `python3 after/kata.py` from inside `drilling/code/kata-01-scoped-task-brief/`.

---

### Kata 2: Review a Proposed Multi-File Diff

_kata-02 · exercises co-06, co-11_

The reviewer below approves every file under forty lines and never checks cross-file references. Repair it so size and coherence both gate approval.

**Before** (`drilling/code/kata-02-diff-review/before/kata.py`)

```python
# => Buggy: size alone decides, references unchecked.
# => An incoherent file is approved.
proposal = {"a.md": 5, "b.md": 45}  # => two proposed files with sizes
# => b.md cites a missing file
refs = {"a.md": [], "b.md": ["ghost.md"]}  # => b.md references absent ghost.md
# => coherence is never tested
for name, changed in proposal.items():  # => judge each file by size only
    ok = changed < 40  # => BUG: no coherence check at all
    # => b.md passes on size
    print(name + ": " + ("approved" if ok else "escalated"))  # => Output: both files approved, wrongly
```

The starting point runs and shows the bug:

```text
a.md: approved
b.md: escalated
```

**After** (`drilling/code/kata-02-diff-review/after/kata.py`)

```python
# => Fixed: coherence gates alongside size.
# => The incoherent file is escalated.
proposal = {"a.md": 5, "b.md": 45}  # => same two files, same sizes
# => facts did not change, judgement did
refs = {"a.md": [], "b.md": ["ghost.md"]}  # => b.md still cites absent ghost.md
# => now the reference is tested
repo = ["a.md", "b.md"]  # => files already in the repository
# => ghost.md is in neither set
for name, changed in proposal.items():  # => judge each file on both gates
    coherent = all(r in proposal or r in repo for r in refs[name])  # => FIX: every reference must exist
    # => b.md fails here
    ok = (changed <= 10) and coherent  # => small AND coherent wins
    # => a.md passes, b.md fails
    print(name + ": " + ("approved" if ok else "escalated"))  # => Output: a.md approved, b.md escalated
```

**Output** (`drilling/code/kata-02-diff-review/expected/main.stdout.txt`):

```text
a.md: approved
b.md: escalated
```

**Run**: `python3 after/kata.py` from inside `drilling/code/kata-02-diff-review/`.

---

### Kata 3: Recover a Stuck Session Without Data Loss

_kata-03 · exercises co-08, co-09_

The recovery below interrupts the loop but replays the whole task from scratch. Repair it so finished steps are kept and only the tail replays.

**Before** (`drilling/code/kata-03-stuck-recovery/before/kata.py`)

```python
# => Buggy: interrupt wipes the finished work.
# => The resume replays everything.
steps = ["read", "plan", "exec-loop", "report"]  # => the four fixture steps
done = ["read", "plan"]  # => two steps finished before the loop
# => finished work worth keeping
print("interrupted: True")  # => the operator stops the loop
replay = list(steps)  # => BUG: resume replays from scratch
# => finished steps run twice
print("replayed steps: %d" % len(replay))  # => Output: replayed steps: 4, wastefully
```

The starting point runs and shows the bug:

```text
interrupted: True
replayed steps: 4
```

**After** (`drilling/code/kata-03-stuck-recovery/after/kata.py`)

```python
# => Fixed: checkpoint keeps finished steps.
# => Only the unfinished tail replays.
steps = ["read", "plan", "exec-loop", "report"]  # => the same four fixture steps
# => facts did not change
done = ["read", "plan"]  # => the same two finished steps
# => checkpoint preserves them
print("interrupted: True")  # => the operator stops the loop
tail = [s for s in steps if s not in done]  # => FIX: replay only unfinished steps
# => tail is exec-loop and report
print("replayed steps: %d" % len(tail))  # => Output: replayed steps: 2, correctly
```

**Output** (`drilling/code/kata-03-stuck-recovery/expected/main.stdout.txt`):

```text
interrupted: True
replayed steps: 2
```

**Run**: `python3 after/kata.py` from inside `drilling/code/kata-03-stuck-recovery/`.

---

### Kata 4: Spot an Unsafe Permission Grant

_kata-04 · exercises co-02_

The policy below permits every tool it does not recognise. Repair it so unknown tools ask first and denied tools stay denied.

**Before** (`drilling/code/kata-04-permission-grant/before/kata.py`)

```python
# => Buggy: unknown tools run free.
# => The default is backwards.
allow = ["read", "exec"]  # => two explicitly allowed tools
deny = ["browser"]  # => one explicitly denied tool
requests = ["read", "browser", "cron"]  # => cron is unknown here
# => three fixture requests
for tool in requests:  # => resolve each request
    verdict = "allow" if tool not in deny else "deny"  # => BUG: anything not denied is allowed
    # => cron slips through
    print(tool + ": " + verdict)  # => Output: cron allowed, wrongly
```

The starting point runs and shows the bug:

```text
read: allow
browser: deny
cron: allow
```

**After** (`drilling/code/kata-04-permission-grant/after/kata.py`)

```python
# => Fixed: unknown tools ask first.
# => Deny still wins outright.
allow = ["read", "exec"]  # => same two allowed tools
# => facts did not change
deny = ["browser"]  # => same one denied tool
# => deny still wins first
requests = ["read", "browser", "cron"]  # => same three fixture requests
# => cron is still unknown
for tool in requests:  # => resolve each request
    verdict = "deny" if tool in deny else ("allow" if tool in allow else "ask")  # => FIX: deny, then allow, then ask
    # => cron now asks
    print(tool + ": " + verdict)  # => Output: read allow, browser deny, cron ask
```

**Output** (`drilling/code/kata-04-permission-grant/expected/main.stdout.txt`):

```text
read: allow
browser: deny
cron: ask
```

**Run**: `python3 after/kata.py` from inside `drilling/code/kata-04-permission-grant/`.

---

### Kata 5: Judge a Trace, Not Its Summary

_kata-05 · exercises co-07_

The verdict below trusts the agent's summary line. Repair it so the verdict checks each step's file claim against the workspace instead.

**Before** (`drilling/code/kata-05-trace-verdict/before/kata.py`)

```python
# => Buggy: the summary decides.
# => A confident lie passes.
summary = "all files archived successfully"  # => the agent's confident claim
# => prose, not evidence
workspace = ["inbox.md"]  # => the only file really present
# => archive.md is missing
trust = "successfully" in summary  # => BUG: verdict reads the prose
# => any confident summary passes
print("summary: " + summary)  # => Output: the confident claim
print("trust: " + str(trust))  # => Output: trust: True, wrongly
```

The starting point runs and shows the bug:

```text
summary: all files archived successfully
trust: True
```

**After** (`drilling/code/kata-05-trace-verdict/after/kata.py`)

```python
# => Fixed: file claims decide.
# => The missing file fails the trace.
claims = ["inbox.md", "archive.md"]  # => files the trace claims to touch
# => archive.md is the lie
workspace = ["inbox.md"]  # => the only file really present
# => ground truth, unchanged
bad = [f for f in claims if f not in workspace]  # => FIX: check claims against the listing
# => bad holds archive.md
print("unverified claims: " + ", ".join(bad))  # => Output: unverified claims: archive.md
print("trust: " + str(len(bad) == 0))  # => Output: trust: False, correctly
```

**Output** (`drilling/code/kata-05-trace-verdict/expected/main.stdout.txt`):

```text
unverified claims: archive.md
trust: False
```

**Run**: `python3 after/kata.py` from inside `drilling/code/kata-05-trace-verdict/`.

---

### Kata 6: Hold a Turn Budget

_kata-06 · exercises co-10_

The budget below lets the session run one turn past its cap before halting. Repair the comparison so the cap halts exactly at the limit.

**Before** (`drilling/code/kata-06-budget-guard/before/kata.py`)

```python
# => Buggy: the cap allows one extra turn.
# => Off-by-one funds the overrun.
budget = 3  # => at most three turns allowed
# => budget is one plain int
turns = ["a", "b", "c", "d"]  # => four fixture turns
# => one more than budget
used = 0  # => used counts consumed turns
for turn in turns:  # => replay each turn
    if used > budget:  # => BUG: halts a turn too late
        # => turn four slips through
        break  # => the late halt
    used += 1  # => consume the turn
    # => used reaches 4, over budget
print("used %d of %d" % (used, budget))  # => Output: used 4 of 3, overrun
```

The starting point runs and shows the bug:

```text
used 4 of 3
```

**After** (`drilling/code/kata-06-budget-guard/after/kata.py`)

```python
# => Fixed: the cap halts exactly at budget.
# => No turn runs past the limit.
budget = 3  # => same budget of three turns
# => the limit did not change
turns = ["a", "b", "c", "d"]  # => same four fixture turns
# => facts did not change
used = 0  # => used counts consumed turns
for turn in turns:  # => replay each turn
    if used >= budget:  # => FIX: halt exactly at the cap
        # => turn four never runs
        break  # => the on-time halt
    used += 1  # => consume the turn
    # => used stops at 3
print("used %d of %d" % (used, budget))  # => Output: used 3 of 3, held
```

**Output** (`drilling/code/kata-06-budget-guard/expected/main.stdout.txt`):

```text
used 3 of 3
```

**Run**: `python3 after/kata.py` from inside `drilling/code/kata-06-budget-guard/`.

---

### Kata 7: Repair a Broken Config Read

_kata-07 · exercises co-13_

The reader below crashes on a config that omits the models section. Repair it so a missing section reports a clear error naming the section.

**Before** (`drilling/code/kata-07-config-repair/before/kata.py`)

```python
# => Buggy: direct indexing crashes.
# => The user sees a KeyError, not guidance.
config = {"agents": {"model": "primary"}}  # => fixture config missing models
# => models section absent
try:  # => attempt the direct read that real code tried
    model = config["models"]["primary"]  # => BUG: KeyError on models
    # => the missing section raises
    print("model: " + model)  # => never reached on this config
    # => the handler runs instead
except KeyError as missing:  # => catch the crash the user would see
    # => missing names the absent section
    print("crashed: KeyError " + str(missing))  # => Output: crashed: KeyError 'models'
```

The starting point runs and shows the bug:

```text
crashed: KeyError 'models'
```

**After** (`drilling/code/kata-07-config-repair/after/kata.py`)

```python
# => Fixed: missing sections report clearly.
# => Guidance replaces the traceback.
config = {"agents": {"model": "primary"}}  # => same fixture config, still no models
# => facts did not change
section = config.get("models")  # => FIX: .get() returns None when absent
# => no exception is raised
ok = section is not None and "primary" in section  # => both levels must exist
# => ok is False here
print("models section present: " + str(section is not None))  # => Output: models section present: False
print("run: openclaw configure models")  # => the repair the message prescribes
# => guidance, not traceback
print("config readable: " + str(ok))  # => Output: config readable: False, clearly
```

**Output** (`drilling/code/kata-07-config-repair/expected/main.stdout.txt`):

```text
models section present: False
run: openclaw configure models
config readable: False
```

**Run**: `python3 after/kata.py` from inside `drilling/code/kata-07-config-repair/`.

---

### Kata 8: Fix an Unweighted Comparison

_kata-08 · exercises co-15_

The scorecard below adds raw tokens to correctness points, letting scale swamp quality. Repair it so weights applied to normalised scales decide the winner.

**Before** (`drilling/code/kata-08-comparison-scorecard/before/kata.py`)

```python
# => Buggy: raw totals decide.
# => Tokens swamp correctness.
legs = {"openclaw": {"correct": 1, "tokens": 8400}, "sibling": {"correct": 0, "tokens": 100}}  # => sibling is wrong but nearly free
# => raw totals favour the sibling
score = {t: v["correct"] + v["tokens"] for t, v in legs.items()}  # => BUG: adding points to tokens
# => scale decides, not quality
winner = min(score, key=score.get)  # => lowest raw total wins here
# => winner is the wrong sibling
print("openclaw raw: %d" % score["openclaw"])  # => Output: openclaw raw: 8401
print("sibling raw: %d" % score["sibling"])  # => Output: sibling raw: 100
print("winner: " + winner)  # => Output: winner: sibling, wrongly
```

The starting point runs and shows the bug:

```text
openclaw raw: 8401
sibling raw: 100
winner: sibling
```

**After** (`drilling/code/kata-08-comparison-scorecard/after/kata.py`)

```python
# => Fixed: weights on normalised scales decide.
# => Correctness outweighs cheap failure.
legs = {"openclaw": {"correct": 1.0, "tokens": 8400}, "sibling": {"correct": 0.0, "tokens": 100}}  # => same two legs, same numbers
# => facts did not change
worst = max(v["tokens"] for v in legs.values())  # => worse leg anchors the token scale
# => worst is 8400
scores = {}  # => scores collects weighted totals
for tool, v in legs.items():  # => score each leg the same way
    total = 0.8 * v["correct"] + 0.2 * (1.0 - v["tokens"] / worst)  # => FIX: correctness dominates the weight
    # => openclaw 0.8, sibling 0.198
    scores[tool] = total  # => record this leg's total
    print("%s: %.3f" % (tool, total))  # => Output: two normalised score lines
winner = max(scores, key=scores.get)  # => highest weighted score wins
# => winner is openclaw
print("winner: " + winner)  # => Output: winner: openclaw, correctly
```

**Output** (`drilling/code/kata-08-comparison-scorecard/expected/main.stdout.txt`):

```text
openclaw: 0.800
sibling: 0.198
winner: openclaw
```

**Run**: `python3 after/kata.py` from inside `drilling/code/kata-08-comparison-scorecard/`.

## Self-check checklist

Twenty-four "I can" items, at least one per concept. Check off only what you can do without re-reading.

- [ ] I can verify an OpenClaw install with version and doctor probes (co-01).
- [ ] I can choose between guided onboarding and the baseline flag (co-01).
- [ ] I can name the five config sections and edit the right one (co-13).
- [ ] I can resolve a model provider chain with ordered fallbacks (co-13).
- [ ] I can write a four-part task brief with a checkable done condition (co-04).
- [ ] I can read a tool-use trace and name the tool sequence (co-07).
- [ ] I can spot a plausible-wrong step by checking file claims (co-07).
- [ ] I can review a diff per file against the size rule (co-06).
- [ ] I can demand a plan and approve it before execution (co-05).
- [ ] I can verify session context carried across turns (co-03).
- [ ] I can store a fact in memory and prove later recall (co-03).
- [ ] I can resolve allow, deny, and ask for any tool request (co-02).
- [ ] I can tighten tool policy for one session without touching global (co-02).
- [ ] I can redact secrets from output before logging (co-02).
- [ ] I can dry-run a destructive plan and confirm zero changes (co-16).
- [ ] I can write a complete who-what-session audit entry (co-07).
- [ ] I can review a multi-file proposal for size and coherence (co-11).
- [ ] I can gate a change on its own tests passing (co-12).
- [ ] I can detect a stuck loop with the three-repeat rule (co-08).
- [ ] I can checkpoint, interrupt, and resume without loss (co-09).
- [ ] I can veto an unsafe action mid-task without hesitation (co-16).
- [ ] I can ledger tokens per turn and hold a budget (co-10).
- [ ] I can author a four-part skill and register a custom tool (co-14).
- [ ] I can run a sealed, weighted, caveated tool comparison (co-15).

## Elaborative interrogation & self-explanation

Six why and why-not prompts. Each names a design choice and a rejected alternative, with a model answer.

**E1. Why does this course verify the install with version plus doctor instead of just trying a task and seeing what happens?**

<details>
<summary>Model answer</summary>

Trying a task first conflates install problems with task problems: a failure could mean either, and debugging starts in the wrong bucket half the time. Version-plus-doctor separates the layers in seconds — the release is known, the probes are green — so every later failure is a task failure by elimination. The rejected alternative (just try it) feels faster once and costs an hour the first time the install is actually broken.

</details>

**E2. Why do task briefs require a checkable done condition instead of accepting a plain-language goal alone?**

<details>
<summary>Model answer</summary>

A goal alone leaves "done" as a negotiation the agent always wins by declaring victory. A checkable finish line ends the debate mechanically: files present or not, tests green or not. The rejected alternative (trust the goal) works until the first plausible-but-incomplete delivery, which ships because nobody defined what complete meant.

</details>

**E3. Why must session overrides only tighten policy, rather than allowing temporary widening with a promise to revert?**

<details>
<summary>Answer</summary>

Promised reverts are forgotten under pressure: the session ends, the widening persists, and the next task inherits power nobody approved. Tighten-only removes the failure mode by construction — there is no revert to forget because nothing ever loosened. The rejected alternative (widen-then-revert) trades a permanent guarantee for a sticky note.

</details>

**E4. Why does the course interrupt stuck loops at three repeats instead of letting the agent retry until its turn budget runs out?**

<details>
<summary>Answer</summary>

A loop that repeats identically three times has converged on failure; further retries spend budget proving it again. Interrupting at three converts the spend into a decision point — checkpoint, re-brief, resume — while budget remains for the corrected attempt. The rejected alternative (fund the loop to the cap) burns the budget that the recovery needed.

</details>

**E5. Why are comparisons sealed with a shared brief id and pre-registered weights instead of running each tool naturally and judging afterwards?**

<details>
<summary>Answer</summary>

Natural runs differ in task, budget, and recording, so the verdict compares anecdotes rather than tools; judging afterwards weights whatever the favourite won. The seal fixes inputs and the weights fix values before evidence exists, so differences in outcome belong to the tools. The rejected alternative (eyeball it) persuades only people who already agreed.

</details>

**E6. Why does every example run a fixture shim instead of calling the live OpenClaw binary with a test account?**

<details>
<summary>Answer</summary>

Live calls need network, keys, and an account the reader may not have, and their outputs drift with every release — the lesson would rot within months. The shim replays fixed outputs shaped like the real CLI, so each example runs identically years later with zero setup. The rejected alternative (live calls) teaches today's behaviour accurately once and teaches nothing repeatably ever after.
