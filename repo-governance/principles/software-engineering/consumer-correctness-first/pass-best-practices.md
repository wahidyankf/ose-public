---
description: Five best practices for consumer-correct surfaces.
when_to_use: Use when designing a new API, CLI flag, error, or configuration value.
---

# PASS: Best Practices

1. **Name the cause and the fix** in every error a consumer can act on.
2. **Keep one exact name** for one thing across flags, keys, docs, and errors.
3. **Fail loudly at the point of misuse**; never accept, default, or ignore quietly.
4. **Prefer the descriptive option** when terse and descriptive differ, even when it is longer.
5. **Document every default** visibly where the value is set, including what invalid input does.
