---
description: Worked pass/fail examples of the PR merge protocol - correct precondition-gated merges, premature merges, and a user-authorized gate bypass.
when_to_use: Use as a reference when unsure whether a specific merge decision matches or violates this protocol.
---

# Examples

## PASS: Correct agent behaviour -- preconditions hold, `[AI]` merges

```
Agent: All five merge preconditions hold for PR #42:

  (a) PR CI:          exact current head/base green
  (b) leak review:    harness-held current-head pass
  (c) branch vs main: up to date
  (d) conversations:  resolved
  (e) surface gates:  passed / explicitly exempt

Merging PR #42.
```

## FAIL: Incorrect agent behaviour -- merging before the preconditions hold

```
Agent: I created PR #42 and an earlier CI run is green. Merging now.
[merges without proving the run matches the current head and base -- precondition (a) unmet]
```

## FAIL: Incorrect agent behaviour -- merging with failing gates

```
Agent: PR #42 has a failing lint check, but the rest passed.
       Merging anyway to save time.
[merges despite failing PR CI -- precondition (a) unmet]
```

## FAIL: Incorrect agent behaviour -- carrying a bypass forward

```
User: [earlier] Merge PR #42 anyway despite test:coverage:behaviour.
Agent: [later, different PR] Reusing that bypass to merge PR #43.
```

## PASS: User explicitly bypasses a gate

```
Agent: PR #42 has all gates passing except test:coverage:behaviour, which
       failed because the new endpoint's Gherkin scenario is still
       being drafted in a follow-up task.

User: Merge it anyway, I will add the Gherkin scenario in the next commit.

Agent: Understood. Merging PR #42 with your explicit approval to
       bypass the test:coverage:behaviour gate for this instance.
```
