---
description: "Covers borderline tier cases and why link checkers, the social media maker, structured makers, the E2E test developer, and the file manager sit at their assigned tiers."
when_to_use: Use when an agent's task profile does not cleanly match one model tier, or when checking why a specific existing agent was assigned its tier.
---

# Special Considerations — Borderline Cases and Tier Assignments

## Borderline Cases

Some agents straddle tier boundaries. When uncertain:

1. **Analyze the core loop** -- what does the agent do repeatedly? If the core loop is rule application, use execution-grade even if setup requires some reasoning.
2. **Consider the failure mode** -- if the agent picks a wrong approach, how bad is the outcome? Higher-stakes failures justify a higher tier.
3. **Start lower, promote if needed** -- begin with execution-grade; promote to planning-grade only if quality issues emerge in practice, and to ultra only on the recorded evidence the ultra grade requires.

## Link Checkers as Fast-Tier

Link checker agents (docs-link-checker, apps-ayokoding-www-link-checker) use the fast tier despite being categorized as checkers (green). This is because their validation is purely mechanical (HTTP status code checking), not rule-based reasoning. The checker color reflects their role in the maker-checker-fixer workflow, while the model reflects their cognitive requirements.

## Social Media Maker as Execution-Grade

The social-linkedin-post-maker uses execution-grade despite being a "maker" agent. This is because LinkedIn post generation follows a rigid template and tone guide, making it a structured pattern-following task rather than creative content creation.

## Structured Makers as Execution-Grade

Several maker agents use execution-grade because their output is structured by tight skills with well-defined rubrics -- every `apps-ayokoding-www-*-maker` and `apps-ose-www-content-maker`, plus docs-maker, readme-maker, agent-maker, and repo-workflow-maker. Each has an execution-grade checker and execution-grade fixer in its maker-checker-fixer trio, and the skill pins down most decisions. The governance trios -- `rules-*`, `specs-*`, `plan-*` -- sit a grade higher for the reason given under Model Tiers — Execution-Grade. Contrast with planning-grade makers (plan-maker, docs-tutorial-maker, swe-ui-maker) where the creative work is open-ended, pedagogically demanding, or multi-concern.

## Code Maker as Execution-Grade

The swe-code-maker writes production application code yet uses execution-grade. It loads each project's stack packs from the repository inventory, so the stack standards, the stack skills, and the requirement already settle the approach, and applying them cycle by cycle is rule-following. A requirement that leaves a design decision open goes back to its owner instead of raising the tier.

## File Manager as Fast-Tier

The docs-file-manager uses the fast tier despite being categorized as a fixer (yellow). This is because its operations are deterministic file manipulation (`git mv`, `git rm`, find-and-replace link updates) with no judgment calls. The `agent-developing-agents` skill cites it as the canonical fast-tier example.
