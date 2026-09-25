---
description: "Defines the execution-grade tier: agents that declare sonnet for structured, execution-heavy work."
when_to_use: Use when deciding whether a new agent should declare the execution-grade (sonnet) model tier.
---

# Model Tiers — Execution-Grade

**When to use**: Rule-based validation, applying validated fixes from audit reports, template-driven output, and structured pattern-following tasks.

**Cognitive profile**: Strong pattern recognition, reliable rule application, structured output generation, systematic validation against defined criteria.

**Task characteristics**:

- Validating content against a defined checklist or ruleset
- Applying fixes identified by a prior audit (checker output drives fixer input)
- Generating output from templates with variable substitution
- Following a documented procedure step-by-step
- Tasks where correctness means conforming to explicit rules, not inventing solutions

**Agent examples**:

- **Content and code checkers** -- validate content against conventions using defined rulesets and produce structured audit reports (docs-checker, docs-tutorial-checker, docs-software-engineering-separation-checker, readme-checker, repo-workflow-checker, swe-code-checker, swe-ui-checker, ci-checker, apps-\*-checker). The governance checkers -- `rules-*`, `specs-*`, `plan-*`, `harness-*` -- sit at planning-grade instead, because a wrong call there propagates across the repository rather than one file
- **Most fixers** -- apply corrections from checker audit reports following documented fix procedures (docs-fixer, docs-tutorial-fixer, docs-software-engineering-separation-fixer, readme-fixer, repo-workflow-fixer, swe-ui-fixer, ci-fixer, apps-\*-fixer). Each governance fixer follows its checker's grade
- **social-linkedin-post-maker** -- generates social media posts following a defined template and tone guidelines
- **Structured makers** -- makers with tight, well-defined skills that pin down most decisions, making them rule-following rather than open-ended creation (docs-maker, readme-maker, agent-maker, repo-workflow-maker, apps-ose-www-content-maker, and every `apps-ayokoding-www-*-maker`)
- **Testers and converters** -- agents whose sweep is enumerated rather than invented: `web-*-tester` and api-exploratory-tester work through a fixed charter and cite ground truth; `pdf-to-md-*` follows a chunked extract-and-verify procedure; repo-setup-manager runs a five-step sequence with an acceptance condition per step
- **swe-code-maker**, **swe-code-fixer** -- build code and apply findings test-first under the adopted stack standards and skills, which settle the approach; an open design decision goes back to its owner rather than raising the tier

**Frontmatter**: Specify `model: sonnet` explicitly.

```yaml
---
name: docs-checker
description: Expert documentation validator...
tools: [Read, Glob, Grep, Write, Bash]
model: sonnet
effort: xhigh
color: green
---
```
