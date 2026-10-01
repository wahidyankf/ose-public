---
description: "Workflows for AyoKoding learning-content quality and AI benchmark data refreshes."
when_to_use: "Use when routing to a workflow that validates an AyoKoding tutorial type's quality or refreshes the AI benchmark data."
---

# AyoKoding Web Workflows

Use these workflows when AyoKoding learning content needs an independent quality pass, or when the AI benchmark data needs a refresh. They connect a learning goal to checks for factual accuracy, clarity, and working links, and carry a benchmark data update from research to the live page.

## Purpose

These workflows define **WHEN and HOW to validate ayokoding-web content** and **how to refresh and release its AI benchmark data**, orchestrating multiple agents in sequence to ensure content quality, factual accuracy, and link validity, and to land each data refresh on `main` and, when the release is approved, in production.

## Scope

**✅ Workflows Here:**

- General content quality validation (facts, links)
- By-example tutorial quality validation
- Annotated-concept tutorial quality validation (standard and leadership no-code sub-mode)
- Primer ("Just Enough X") tutorial quality validation
- AI benchmark data refresh and release (research, PR, deploy, clean-up)
- Multi-agent orchestration for ayokoding-web
- Iterative check-fix-verify cycles

**❌ Not Included:**

- Single-agent operations (use agents directly)
- ose-web (has separate workflows)
- Non-workflow documentation (that's conventions/)

## Workflows

- [ayokoding-web-swe-by-example-quality-gate](./ayokoding-web-swe-by-example-quality-gate.md) — Iterative Maker-Checker-Fixer quality gate for by-example tutorials, validating coverage, example count, annotation density, and the mandatory Examples-by-Level section. Use after creating or updating by-example tutorials, before publishing them, or periodically to confirm tutorial quality remains high.
- [ayokoding-web-annotated-concept-quality-gate](./ayokoding-web-annotated-concept-quality-gate.md) — Iterative Maker-Checker-Fixer quality gate for Annotated-concept tutorials, validating worked-example count, annotation density, mode integrity, and diagram accessibility. Use after creating or updating Annotated-concept tutorials, before publishing them to ayokoding-web, or periodically to confirm existing tutorial quality.
- [ayokoding-web-primer-quality-gate](./ayokoding-web-primer-quality-gate.md) — Iterative Maker-Checker-Fixer quality gate for Primer ("Just Enough X") tutorials, validating example count, annotation density, and scope discipline. Use after creating or updating a Primer tutorial, before publishing it, or when a primer's dependent topics change and its scope needs re-verification.
- [ayokoding-web-general-quality-gate](./ayokoding-web-general-quality-gate.md) — Fully automated quality gate that validates ayokoding-web content quality, factual accuracy, and links in parallel, then applies fixes iteratively until zero findings. Use after creating or updating ayokoding-web content, before deploying to production, or periodically to confirm content quality and accuracy.
- [ayokoding-web-in-the-field-quality-gate](./ayokoding-web-in-the-field-quality-gate.md) — Iterative Maker-Checker-Fixer quality gate for in-the-field production guides, validating guide count, standard-library-first ordering, annotation density, and production code quality. Use after creating or updating in-the-field production guides, before publishing them, or periodically to confirm production code quality.
- [ayokoding-web-ai-benchmark-refresh](./ayokoding-web-ai-benchmark-refresh.md) — Refreshes the AyoKoding AI benchmark data (roster, independent results, API prices), lands it on main through one PR, releases it to production, and tears down the work's artifacts. Use when the AI benchmark data is stale, a model or price change must be published, or a scheduled dataset refresh is due.

## Related Documentation

- [Workflows Index](../README.md) - All orchestrated workflows
- [By Concept Tutorial Convention](../../conventions/tutorials/by-concept.md) - Content conventions these workflows enforce
- [By Example Tutorial Convention](../../conventions/tutorials/swe-by-example.md) - By-example standards
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core workflow pattern
