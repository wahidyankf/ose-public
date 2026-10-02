---
description: How each workflow step defines failure behaviour, and the five common error-handling patterns (fail fast, continue, retry, user intervention, fallback).
when_to_use: Use when defining what a workflow step should do when it fails.
---

# Error Handling

Each step defines failure behaviour:

```markdown
**On failure**:

- Retry 3 times with exponential backoff
- If still failing, proceed to user review
- User can: skip step, retry manually, terminate workflow
```

Common patterns:

- **Fail fast**: Terminate workflow immediately
- **Continue**: Log error, proceed to next step
- **Retry**: Attempt step again (with limits)
- **User intervention**: Ask user how to proceed
- **Fallback**: Execute alternative step
