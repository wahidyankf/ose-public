# Plans-Only Review Route

Treat a PR as plans-only only when its entire hand-authored diff consists of `plans/**` documents,
required indexes, and required non-executable assets those documents reference: binary mockups,
exported images, or editable diagram/design sources under plan-local `assets/`. Executable source
or scripts, runtime/build/tool configuration or manifests, tests or fixtures, runnable prototypes,
unreferenced assets, and unrelated files force the standard route even inside a plan directory.
Use the ownership registry by file and region: ignore only wholly generated files and generated
regions; vendored files and hand-authored regions participate. Recompute every cycle.

Record the ordinary risk tier. For `lite` and `full`, select exactly these specialists plus
`pr-review-checker` as coordinator:

- `pr-review-security-checker` — run the primary mandatory probe for real secrets, credentials, or
  other values that grant access, using the canonical
  [system-secret boundary](../../../../repo-governance/conventions/security/secrets-and-env-standards/hard-iron-rule-no-secrets-in-committed-files.md).
- `swe-architect` (Lens mode) — review architecture and design decisions made by the plan.
- `pr-review-logic-checker` — review domain intent and Gherkin acceptance-criteria completeness.
- `pr-review-docs-checker` — review the plan as the shipping artifact for substantive quality and
  completeness.
- `pr-review-governance-checker` — review mechanical conformance to repository rules.

For `trivial`, select no specialists. The coordinator runs one generalist pass: execute the same
primary security probe first, then cover architecture/design, domain intent and Gherkin,
documentation quality, and governance conformance. All five concerns remain covered in one pass.

Suppress findings that merely complain that eventual implementation artifacts are absent from the
plans-only PR. Later implementation correctness belongs to the PR that ships that implementation;
the plan's own architecture, domain criteria, contradictions, omissions, and rule violations remain
in scope.

Record the plans-only verdict, primary probe, and every selected or skipped specialist in the
human-readable review-route record. For every non-plans-only PR, the standard risk-tier route and
Content-Type Applicability Filter remain in force.
