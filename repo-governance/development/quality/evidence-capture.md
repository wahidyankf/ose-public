---
description: Standards for capturing UI, HTTP, non-HTTP API, and console evidence during plan execution
when_to_use: "Use when capturing, naming, or referencing testing evidence during plan execution."
---

# Evidence Capture Convention

This convention defines where testing evidence lives and how it must be named, formatted, and referenced from `delivery.md` so a reviewer can verify a claim without re-running the test.

## Documents

- [Principles and Conventions Implemented/Respected](./evidence-capture/principles-and-conventions-implemented-respected.md) — Principles and conventions this convention implements. Use when tracing this convention to the principles/conventions behind it.
- [The Rule](./evidence-capture/the-rule.md) — The rule requiring evidence capture for testing performed during plan execution. Use when you need the exact wording of the evidence-capture rule.
- [Evidence Folder Location](./evidence-capture/evidence-folder-location.md) — Where captured evidence lives within a plan folder. Use when deciding where to save a screenshot or API wire result during plan execution.
- [What Goes Where](./evidence-capture/what-goes-where.md) — Which evidence type goes in which file/folder, and what delivery.md must reference. Use when unsure which evidence file to save a specific artifact into.
- [Screenshot Conventions](./evidence-capture/screenshot-conventions.md) — Naming, format, and content requirements for captured screenshots. Use when naming or capturing a screenshot as plan evidence.
- [API Wire Evidence Conventions](./evidence-capture/curl-api-evidence-conventions.md) — How to capture and format HTTP curl or non-HTTP native-client evidence. Use when recording API wire proof.
- [Locale Testing Evidence Requirements](./evidence-capture/locale-testing-evidence-requirements.md) — The evidence bar for locale/i18n testing across supported languages. Use when verifying a locale-sensitive feature and capturing its evidence.
- [What plan-execution-checker Validates](./evidence-capture/what-plan-execution-checker-validates.md) — What the plan-execution-checker agent inspects in captured evidence. Use when you need to know what evidence the plan-execution-checker gate inspects.
- [Examples](./evidence-capture/examples.md) — Worked examples of correctly captured evidence. Use when you need a concrete example of properly captured evidence.
- [Related Documentation](./evidence-capture/related-documentation.md) — Cross-references to related verification and plan conventions. Use when you need a related convention on verification or plan structure.

## Relationship to Other Conventions

- **[Manual Behavioural Verification](./manual-behavioural-verification.md)** — defines WHAT to verify;
  this convention defines WHERE to record the verification evidence.
- **[User-Facing Delivery Hardening Convention](./user-facing-delivery-hardening.md)** — Rule 1
  (per-breakpoint, per-locale visual sign-off) and Rule 10 (production visual sign-off before archival)
  both require the evidence trail defined here.
- **[Plans Organization Convention](../../conventions/structure/plans.md)** — plan folder structure,
  lifecycle (in-progress → done), and the evidence/ subfolder naming.
- **[Temporary Files Convention](../infra/temporary-files.md)** — evidence/ in a plan folder is NOT a
  temporary file; it is committed and permanent. Use local-tmp/ for scratch work only.
