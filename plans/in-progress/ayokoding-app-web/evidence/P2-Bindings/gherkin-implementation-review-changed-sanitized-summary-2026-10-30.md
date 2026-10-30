# Gherkin Implementation Review — Sanitized Summary (changed scope, final)

- Scope: `changed`, owners `ayokoding-web` (+ `ayokoding-web-e2e`). Only two files changed since
  the full-scope final: the E2E tools adapter rewrite to the plan-004 current codec and four
  current-codec focused tests. All other verdicts are carried untouched.
- Changed rows: the 10 tools E2E rows (B1–B5, T1–T5), previously all FAIL against retired
  fake-engine URLs. Now: **8 PASS / 2 PARTIAL / 0 FAIL**.
  PASS: B1, B2, B3, B5, T1, T2, T3, T4 (current-codec URLs, shared-data figures
  GPT-6 Sol/Grok 4.7/GPT-5.6 Sol, SGD 4,718/846 USD/SWE I, data-count=93, empty/fallback/invalid
  states). PARTIAL: B4, T5 (first Thens observe production; second Thens assert proxies, not the
  named provenance evidence, which production does not expose on these paths).
- Changed-scope gate criterion (zero unresolved changed-row FAILs): **MET**. All 10 prior NEW
  FAILs are overturned.
- Carried without re-judgment: 12 FAIL, 56 PARTIAL, 10 valid EXEMPTs on untouched code.
  Full-matrix status therefore remains FAIL; this scope clears only the E2E tools regression.
- Runtime proof (post-fix log, cited): `ayokoding-web-e2e:test:e2e` exits 0 — 243
  generated-corpus specs + 30 focused specs passed, zero failures, chromium/firefox/webkit.
- Advisories: B4/T5 need production provenance markers or reworded scenarios to reach PASS; the
  shared cross-implementation step only exercises the benchmark vector (nil marginal value for T1).
- Full per-row ledger with exact locations:
  `local-tmp/plan/ayokoding-app-web/P2-Bindings/gherkin-implementation-review__changed-final-2026-10-30.md`.
