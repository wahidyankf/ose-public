---
description: "Worked examples of resolving a CI blocker correctly."
when_to_use: "Use for a concrete example of a proper CI-blocker fix."
---

# Examples

## PASS: Fixing a preexisting blocker

```
Developer: I'm implementing a new feature in organiclever-www.
           Running test:quick, I see that organiclever-be has
           a failing typecheck due to a stale codegen output.

Action:
1. Run `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:codegen` to regenerate types
2. Run `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:typecheck` to confirm it passes
3. Commit: "fix(organiclever-be): regenerate types from updated contract"
4. Continue with organiclever-www feature work
```

## FAIL: Bypassing the blocker

```
Developer: I'm implementing a new feature in organiclever-www.
           Running test:quick, I see that organiclever-be has
           a failing typecheck. That's not my project.

Action: git push --no-verify
Result: Broken code reaches remote. CI fails for everyone.
```

## FAIL: Deferring the fix

```
Developer: I see the preexisting failure. I'll create a ticket
           to fix it later. For now, I'll skip that project's tests.

Action: Adds skip() to failing tests, pushes.
Result: Test coverage decreases. The failure is hidden, not fixed.
        The ticket sits in the backlog indefinitely.
```

## PASS: Multiple preexisting issues

```
Developer: I encounter three preexisting issues across two projects.

Action:
1. Fix issue 1: "fix(project-a): resolve stale snapshot after v3 upgrade"
2. Fix issue 2: "fix(project-a): add missing null check in validator"
3. Fix issue 3: "fix(project-b): update import path after module rename"
4. Verify all three projects pass
5. Continue with original feature work
```
