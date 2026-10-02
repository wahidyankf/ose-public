---
description: States that workflow orchestration should not economize on tokens — reliable compaction handles context, so focus on correct thorough execution.
when_to_use: Use when tempted to shorten or skip workflow steps to save tokens.
---

# Token Budget Philosophy

**CRITICAL GUIDELINE**: When orchestrating workflows (`repo-governance/workflows/`), **do NOT think about token budget constraints**.

Workflows naturally consume more tokens than single agent invocations because they:

- Execute multiple agents in sequence
- Maintain state between steps
- Generate multiple reports
- Iterate until quality goals are met
- Handle conditional logic and parallel execution

**This is expected and acceptable.** The reliable compaction mechanism handles context management. Focus on correct, thorough workflow execution quality, not token usage.
