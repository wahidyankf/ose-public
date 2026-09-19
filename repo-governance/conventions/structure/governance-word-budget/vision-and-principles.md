---
description: Vision alignment, principles implemented, and related conventions for the governance word-budget gate.
when_to_use: Use when you need the rationale (vision/principles) behind the word-budget convention, or its list of related conventions.
---

# Governance Word-Budget Convention — Vision and Principles

## Vision Supported

This convention serves the [Open Sharia Enterprise Vision](../../../vision/open-sharia-enterprise.md)
by ensuring governance rules embedded in instruction files stay reliably loaded, not silently
dropped past a harness limit.

## Principles Implemented/Respected

- **[Progressive Disclosure](../../../principles/content/progressive-disclosure.md)**: the sole
  sanctioned remediation for word-budget violations.
- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**:
  thresholds are declared explicitly in `repo-config.yml`, not embedded in the validator binary.
- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**:
  every enforcement point is automated.
- **[Reproducibility First](../../../principles/software-engineering/reproducibility.md)**: the word
  count is deterministic.

## How the Count Is Taken

Two properties of the measure surprise authors, and both were observed while extending the covered
surfaces:

- **YAML frontmatter counts.** One governance file measured 414 words before its required
  `title`/`description`/`when_to_use`/`tags` block was prepended and 505 after, with the body
  unchanged. Measure after the frontmatter exists, not before.
- **The validator's count is authoritative.** Platform `wc -w` implementations can disagree with
  the validator's Unicode whitespace splitting. Only the validator's number determines the gate
  result, so quote that one when a margin is tight.

Run `./rhino governance word-budget validate` rather than `wc -w` whenever the answer decides
whether a file lands.

## Related Conventions

- [Governance Word-Budget Remediation](../governance-word-budget-remediation.md) — enforcement
  points, the progressive-disclosure fix, and forbidden anti-fixes
- [Deterministic vs AI Validation Split](../deterministic-vs-ai-validation-split.md)
- [Governance Vendor-Independence Convention](../governance-vendor-independence.md)
- [Multi-Harness Binding Convention](../multi-harness-binding.md)
