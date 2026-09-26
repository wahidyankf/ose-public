---
description: "The rule permitting labelled time estimates in documentation, and the plan documents where estimates stay banned"
when_to_use: "Read this before writing or reviewing documentation that mentions how long something takes."
---

# No Time Estimates

**Time estimates are permitted in documentation, labelled as estimates.** Tutorials, how-to guides,
reference, explanations, and educational content may tell readers roughly how long something takes:

```markdown
Estimated time: 30-45 minutes, depending on your network speed.
```

State the figure as an estimate, never as a measurement or a promise. Coverage percentages remain the
way tutorials express **depth**; an estimate, where given, expresses **duration**.

**Where the ban applies**: plan documents only, as defined by the
[No Time Estimates principle](../../../principles/content/no-time-estimates.md).

PASS: **Good (Well-Structured Paragraphs)**:

```markdown
Authentication tokens provide secure access to protected resources. Each
token includes user identity, permissions, and expiration time.

Tokens expire after 1 hour of inactivity. Before expiration, clients can
request a new token using the refresh token endpoint. This extends the
session without requiring re-authentication.

Failed refresh attempts trigger automatic logout. The user must log in
again to continue. This security measure prevents unauthorized access
attempts.
```

FAIL: **Avoid (Wall of Text)**:

```markdown
Authentication tokens provide secure access to protected resources and
each token includes user identity, permissions, and expiration time and
tokens expire after 1 hour of inactivity so before expiration clients can
request a new token using the refresh token endpoint which extends the
session without requiring re-authentication but if refresh attempts fail
then automatic logout is triggered and the user must log in again to
continue which is a security measure that prevents unauthorized access
attempts.
```
