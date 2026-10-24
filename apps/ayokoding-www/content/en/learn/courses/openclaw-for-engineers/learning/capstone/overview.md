---
title: "Capstone"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

## Goal

Ship one small repository task through the fixture OpenClaw end to end: brief it in four parts, propose a plan with a human checkpoint, execute the trace, review the diffs against the size rule, pass the test gate, and write down what you had to correct. The capstone reuses nothing you have not already practised — briefs from Examples 26–34, plan-then-act from Examples 12 and 30, trace reading from Examples 9 and 45, diff review from Examples 11, 35, and 41, test gates from Example 36, and the correction habit from every recovery example.

## The task

The digest directory needs per-file word counts. The brief states the goal (add word counts to the digest), the scope (the digest directory only), the done condition (the digest shows counts and its tests pass), and the guardrail (touch no channel configuration). The plan lists five entries — read, propose, checkpoint, apply, test — and the human approves the proposed diff before anything applies. The trace runs four tool calls in plan order. Both diffs stay under the ten-line size rule. The three-check test gate passes fully: counts render, links resolve, and no channel file was touched.

## The trace

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
flowchart LR
    accTitle: Capstone flow
    accDescr: Flowchart with 5 nodes and 4 connections. Nodes: brief, plan, checkpoint, trace and diffs, test gate. Connections: brief to plan, plan to checkpoint, checkpoint to trace and diffs, trace and diffs to test gate.
    A["brief"]:::blue --> B["plan"]:::teal
    B --> C["checkpoint"]:::orange
    C --> D["trace and diffs"]:::purple
    D --> E["test gate"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,stroke-width:2px,color:#FFFFFF
    classDef orange fill:#DE8F05,stroke:#000000,stroke-width:2px,color:#000000
    classDef teal fill:#029E73,stroke:#000000,stroke-width:2px,color:#000000
    classDef purple fill:#CC78BC,stroke:#000000,stroke-width:2px,color:#000000
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/capstone/code/capstone.py`**

```python
# => Capstone: one repository task end to end on the fixture shim.
# => Brief, plan, trace, diffs, test gate, and a written judgement.
brief = {"goal": "add word counts to the digest", "scope": "digest/", "done": "digest shows counts and tests pass", "guardrails": "touch no channel config"}  # => the four-part brief for the whole task
# => every later step cites this brief
print("brief goal: " + brief["goal"])  # => Output: brief goal: add word counts to the digest
plan = ["read digest/", "propose diff", "CHECKPOINT", "apply", "test"]  # => plan-then-act for the multi-step task
# => the checkpoint precedes any apply
print("plan steps: %d" % (len(plan) - 1))  # => Output: plan steps: 4
approved = True  # => fixture: the human approves the proposed diff
# => approval is explicit
trace = ["read digest/today.md", "exec wc -w digest/today.md", "write digest/today.md", "exec link-checker"]  # => the four fixture tool calls executed
# => trace order matches the plan
print("trace calls: %d" % len(trace))  # => Output: trace calls: 4
diffs = {"digest/today.md": 6, "digest/index.md": 4}  # => changed-line counts for the two files
# => both files stay under the size limit
small = all(c <= 10 for c in diffs.values())  # => per-file size rule from Example 11
# => small is True
print("diffs small: " + str(small))  # => Output: diffs small: True
gate = [("counts render", True), ("links resolve", True), ("no channel touched", True)]  # => three test-gate checks with results
# => all three pass here
passed = sum(1 for _, ok in gate if ok)  # => count the green checks
# => passed is 3
print("gate: %d of %d" % (passed, len(gate)))  # => Output: gate: 3 of 3
corrections = ["scoped the brief after a vague first draft", "vetoed one exec with chained flags", "re-ran the gate after fixing a link"]  # => the maker's three honest corrections
# => judgement names real interventions
for c in corrections:  # => state each correction plainly
    print("corrected: " + c)  # => Output: three corrected lines
shipped = approved and small and (passed == len(gate))  # => ship only on approval, size, and a green gate
# => shipped is True
print("shipped: " + str(shipped))  # => Output: shipped: True
```

**Output** (`learning/capstone/code/expected/main/capstone.stdout.txt`):

```text
brief goal: add word counts to the digest
plan steps: 4
trace calls: 4
diffs small: True
gate: 3 of 3
corrected: scoped the brief after a vague first draft
corrected: vetoed one exec with chained flags
corrected: re-ran the gate after fixing a link
shipped: True
```

## Judgement: what the maker corrected

Three corrections, stated plainly. First, the opening brief was a vague one-liner — add word counts — and only became sendable after gaining scope, a checkable done condition, and the channel guardrail. Second, the first proposed trace included an `exec` call with chained flags that the argument screen from Example 15 refuses; the plan was corrected before the checkpoint, not after the damage. Third, the gate initially failed its link check because the new digest page was not in the index; the fix was one index line, and the re-run passed fully. Nothing here was left as the agent first proposed it.

## Shim limits

The fixture shim compresses reality in four ways the live tool does not: traces arrive complete instead of streaming, approvals resolve instantly instead of waiting on a human, costs are fixture numbers instead of metered tokens, and the gateway never has a bad day. The discipline transfers anyway — brief in parts, checkpoint before apply, verify before trust — because every habit the capstone rehearses is about the operator, not the shim. When the live tool surprises you, the References in the [learning overview](../overview.md) show where to check what changed.
