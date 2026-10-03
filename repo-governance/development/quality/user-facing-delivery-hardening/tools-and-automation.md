---
description: "The agents and gates that enforce these sixteen rules."
when_to_use: "Use when locating the automated enforcement for one of the sixteen rules."
---

# Tools and Automation

- **Playwright MCP**: per-breakpoint, per-locale visual sign-off against `assets/` mockups.
  Screenshots saved to `evidence/` and referenced in `delivery.md` per the
  [Evidence Capture Convention](.././evidence-capture.md).
- **`swe-web-tester` (exploratory charter) / `swe-usability-tester` / `swe-web-tester` (design charter)** (the
  [`ux-review-fix-planning`](../../../workflows/quality/ux-review-fix-planning.md) triad): the
  near-end three-tester round against the running web UI (Rule 15); runs across ALL supported locales;
  surfaces EWT-### (correctness) / UWT-### (usability) / DWT-### (design-fidelity) findings plus SG-###
  spec-gap / USS-### spec-suggestion proposals; saves screenshots to the plan's `evidence/` folder.
  Each tester supports a selectable **`output-mode`** input: `local-tmp` (default; writes ephemeral
  findings), `plan` (requires literal authorization), or `delivery` (appends findings into an
  existing plan's `delivery.md`). For the Rule-15 in-place append, invoke each
  tester with **`output-mode: delivery`** and the executing plan's `plan-path`; this is the single
  mechanism that produces the "Rule-15 three-tester retest follow-ups" section in `delivery.md`.
- **`swe-api-tester` (exploratory charter)**: the API-surface counterpart to the web triad — the near-end
  `swe-api-tester` (exploratory charter) round against the running REST or GraphQL API (Rule 16); HTTP/curl-driven,
  never a browser; surfaces `AET-###` (contract / functional / status-code / error-envelope / auth /
  consistency / pagination / performance / GraphQL-schema) findings plus `SG-###` spec-gap proposals;
  saves redacted request/response captures to the plan's `evidence/` folder. Supports the same
  selectable **`output-mode`** input; for the Rule-16 in-place append, invoke it with
  **`output-mode: delivery`** and the executing plan's `plan-path` — the single mechanism that produces
  the "Rule-16 API exploratory-test retest follow-ups" section in `delivery.md`. A single specialist
  (no triad, no dedicated workflow) because the API surface has one exploratory lens.
- **`plan-maker`**: emits the delivery steps for Rules 1–8, the rule-15 three-tester-retest step for
  web-UI feature-change plans (with a locale-coverage note and evidence-capture steps), and the rule-16
  api-exploratory retest step for API feature-change plans.
- **`plan-checker`**: flags missing visual-parity gate, raw-value mockup colors, presence-only
  ordering tests, missing per-breakpoint responsive steps, missing evidence-capture steps, missing
  locale coverage, a missing rule-15 three-tester-retest step on web-UI feature-change plans, and a
  missing rule-16 api-exploratory-retest step on API feature-change plans.
- **`plan-execution-checker`**: verifies the production visual sign-off and deploy-config smoke
  test were recorded before archival; verifies evidence/ screenshots exist and are referenced in
  delivery.md; verifies the rule-15 three-tester retest round ran across all locales and that every
  rule-15 EWT/UWT/DWT defect checkbox is fixed (ticked) before archival; verifies the rule-16
  api-exploratory retest ran and every rule-16 `AET-###` defect checkbox is fixed (ticked) before
  archival — an unfixed defect finding at archival time is a HIGH finding; SG-### spec-gap proposals and
  USS-### spec-suggestions may be triaged or deferred.
