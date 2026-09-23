---
description: "A quick-reference summary table of all eleven anti-patterns."
when_to_use: "Use for a quick-reference summary of all anti-patterns."
---

# Summary of Anti-Patterns

| Anti-Pattern              | Problem                              | Solution                          |
| ------------------------- | ------------------------------------ | --------------------------------- |
| **Manual Quality Checks** | Inconsistent, forgotten              | Automated git hooks               |
| **No Prioritization**     | Equal treatment of issues            | Criticality levels                |
| **Blind Fixes**           | Incorrect automated changes          | Confidence assessment             |
| **Deleting Content**      | Knowledge loss                       | Content preservation              |
| **Running All Tests**     | Slow pre-push                        | Affected tests only               |
| **Ad-Hoc Validation**     | Inconsistent patterns                | Standardized methodology          |
| **Ignoring Criticality**  | Random fix order                     | Priority-based execution          |
| **No CI Quality Gates**   | Bad code merges                      | Fail build on violations          |
| **Undocumented Rules**    | Unclear purpose                      | Document rules and rationale      |
| **Format All Files**      | Slow, unintended changes             | Staged-path gate for staged files |
| **Mixing Test Levels**    | HTTP in integration; real DB in unit | Follow three-level boundaries     |
