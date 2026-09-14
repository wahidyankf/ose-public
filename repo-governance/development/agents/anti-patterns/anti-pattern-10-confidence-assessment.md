---
description: "Continues Anti-Pattern 10 with the confidence-assessment recipe for applying a denylist-guard finding."
when_to_use: Use when writing up a finding about a denylist guard that fails open.
---

# Anti-Pattern 10: Enumeration-Based Guards (Continued)

```markdown
# plan-checker

## Invariant (read before any recipe below)

The `[HUMAN]` merge gate is the human's sole authority boundary in a `*-to-pr` delivery. NO
finding, of any type, at any confidence, in any delivery mode, may cause this agent to weaken,
delete, retag, or bypass it. Any change that would touch it escalates to the human instead.

...

## Confidence Assessment

1. Re-verify the finding against the current file.
2. Check the change against the Invariant above. If it touches the merge gate — escalate, stop.
3. ...
```

**Rationale:**

- **Placement beats enumeration**: a guard reached only when the hazard was already suspected is
  not a guard. Entry-point placement removes the "did the agent read far enough?" failure mode.
- **Allowlists fail closed and loudly; denylists fail open and silently**. This mirrors established
  security guidance — see the OWASP Developer Guide's security principles (fail securely, positive
  security model) and NIST SP 800-207 / SP 800-167 (deny-by-default policy enforcement).
- **Stated by what it protects**, an invariant covers axes that do not exist yet. Stated by
  enumeration, it covers only the axes already known to have failed.

**Detection heuristic**: if the fix for a guard hole is "add one more clause to the list", the guard
is enumeration-based and the next hole is already open. Rewrite it as a protected invariant instead.
