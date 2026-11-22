---
description: Defines consumer correctness and its three demands.
when_to_use: Use for a quick working definition before applying the principle.
---

# What

**Consumer correctness** means a surface is designed so its consumer — a user, a caller, or a
future maintainer — finds it hard to misuse and easy to recover.

It makes three demands:

- **Descriptive errors**: a failure names its cause and the fix, not just a code.
- **Exact names**: one thing keeps one name on every surface that carries it.
- **No silent behavior**: nothing invalid is accepted, defaulted, or ignored quietly.

A surface is consumer-correct when misuse fails loudly at the point of error. Terseness is not a
virtue when it hides the cause.
