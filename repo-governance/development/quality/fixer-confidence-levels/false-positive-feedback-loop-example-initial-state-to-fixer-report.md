---
description: "A worked feedback-loop example: initial state through fixer report."
when_to_use: "Use for the first half of a worked feedback-loop example."
---

# False Positive Feedback Loop: Example (part 1)

## Example Feedback Loop

**Initial State:**

```
rules-checker flags:
  - VIOLATION: 15 agent files have YAML comments in frontmatter
```

**Fixer Re-validation:**

```
repo-workflow-fixer re-validates:
  - Extracts frontmatter from each file
  - Searches isolated frontmatter for # symbols
  - Result: 0 actual violations found (all # symbols in markdown body)
  - Confidence: FALSE_POSITIVE for all 15 findings
```

**Fixer Report:**

````markdown
## False Positives Detected (15)

FAIL: All agent files - Frontmatter comment detection

- **Checker finding:** Agent frontmatter contains YAML comment (# symbol)
- **Re-validation:** Extracted frontmatter, no # found (only in markdown body)
- **Conclusion:** FALSE POSITIVE
- **Reason:** Checker searched entire file instead of just frontmatter section
- **Recommendation:** Update checker to use:
  ```bash
  awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' file.md | grep "#"
  ```
````

- **Impact:** Eliminates all 15 false positives in this run
