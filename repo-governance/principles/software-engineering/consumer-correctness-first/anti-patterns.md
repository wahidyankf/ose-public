---
description: Four consumer-hostile anti-patterns and why each is bad.
when_to_use: Use when reviewing a surface that hides the cause, renames across boundaries, or stays silent.
---

# Anti-Patterns

1. **The bare code**: failing with `E42` or `invalid input` and no cause or fix. The consumer
   can see that something broke but not what or what to do.
2. **The drifting name**: calling one thing `id` in the API, `identifier` in the docs, and
   `key` in the error. Every crossing is a chance to mismatch.
3. **The silent default**: accepting a bad value and quietly substituting something else. The
   consumer believes the input took effect; it did not.
4. **The swallowed error**: catching a failure and continuing as if nothing happened. The
   symptom surfaces far from the cause, where it is hardest to diagnose.
