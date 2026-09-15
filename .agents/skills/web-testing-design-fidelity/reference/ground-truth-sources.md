# The Five Ground-Truth Sources (judged on the LIVE rendered page)

Document and apply all five, each judged against the **running** page:

1. **Committed plan-folder mockup assets** — the both-tier mockups the plan-doc UI-mockup convention
   requires (`./assets/ui-<screen>-…`), per
   [UI Mockups in Plan Docs](../../../../repo-governance/conventions/formatting/diagrams/ui-mockups-principles-and-scope.md#ui-mockups-in-plan-docs-principles-in-practice-and-scope).
   Compare the rendered page to these and report divergence as a `DWT-###` finding citing the mockup
   file.
2. **Design tokens / theme (colours, spacing, typography) at RUNTIME** — the **runtime counterpart** to
   `swe-ui-checker`'s static source check. Read computed styles on the live page and compare them to
   the theme tokens; an inline-overridden colour or off-scale spacing that the source check cannot see
   is a finding. **Must NOT duplicate** the static source-token audit — report the rendered symptom.
3. **Design-system primitives (the shared component library)** — flag **reinvented UI** the shared
   library already provides. The shared library is **`libs/web-ui`** in this repo (it is `libs/ts-ui`
   in the private sibling). A bespoke button/card/input that should have
   reused a `libs/web-ui` primitive is a finding — it fragments the design language.
4. **Optional external design source** — a Figma link or mockup URL passed **at invocation**. When
   provided, `WebFetch` it and compare the live page against it; when absent, skip this source (its
   absence is never a finding).
5. **General design best-practice / visual consistency / information density ("not cramped")** —
   grounded by delegating to `web-researcher` for current design-practice references (per the
   [Web Research Delegation Convention](../../../../repo-governance/conventions/writing/web-research-delegation.md)),
   so judgements cite a principle, not a vibe.
