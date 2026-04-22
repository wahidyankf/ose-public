# Business Rationale

## Decision

Relicense `ose-public` from FSL-1.1-MIT (product apps/specs) + MIT (libs) to **uniform MIT**
across all directories.

## Rationale

The FSL-1.1-MIT license was adopted on 2026-04-04 to protect against commercial competitors
repackaging the platform during early growth. The business assessment has changed: the risks FSL
was meant to mitigate are outweighed by the strategic advantages of full MIT openness — particularly
as the software industry shifts toward AI-driven development and the "building block economy."

### Risks of Open-Sourcing (Acknowledged)

These risks are real and must be accepted as part of the strategic tradeoff:

- **Competitor cloning**: Open code makes it trivially easy for competitors to point AI agents at
  the repository and replicate features into their own products.
- **Self-hosting and lost revenue**: Potential customers may fork and self-host rather than pay.
  Monetization must come from infrastructure, data, and services — not from code exclusivity.
- **Amplified security exposure**: Open code allows AI-assisted vulnerability scanning at scale.
  Security hygiene becomes a continuous operational requirement, not a one-time gate.
- **Fork instability**: Community forks and customizations may break in unexpected ways, generating
  support burden if users misattribute their own instability to the core platform.

### Why the Benefits Outweigh the Risks

#### 1. Eliminating the Niche Feature Burden

Traditional enterprise software (Salesforce, Retool, AWS) wins by becoming a feature monopoly —
building every conceivable feature so that customers cannot migrate without losing the one obscure
function a single internal team depends on. This "feature paradox" locks customers in but creates
enormous engineering debt: bloated platforms that must maintain thousands of features used by fewer
than 1% of the customer base.

Full MIT lets OSE Platform escape this trap. The strategy: provide a minimal, highly reliable set
of building blocks and let customers use AI to build their own bespoke customizations. This
dramatically reduces maintenance burden — the platform can confidently decline obscure feature
requests without losing accounts.

#### 2. Outsourced R&D via Community Forks

When the community forks and customizes the platform for specific niches, they perform free R&D.
Maintainers can monitor these forks, identify working proofs of concept, and cherry-pick the most
successful ideas to integrate back into the mainline. This is only possible when the license permits
unrestricted forking — FSL's competing-use restriction suppresses exactly this dynamic.

#### 3. AI Agents Prefer Open, Well-Documented Tools

Independent research consistently shows that AI models recommend, use, and compose open, free, and
well-documented modular components over closed commercial software. As software development shifts
toward AI-driven "factories" where agents wire tools together, open-source solutions see structural
adoption advantages. FSL-licensed code is less likely to be selected by AI agents building on top
of the platform — MIT removes this friction entirely.

#### 4. Product Stickiness via Open Frontend, Paid Backend

The highest-leverage business model for open source: let users deeply customize the open-source
layer (forking UI, workflows, integrations) while they pay for backend infrastructure, servers, and
data storage. This creates exceptional stickiness — users who have molded the open-source layer to
their exact needs have no reason to migrate off the paid backend. FSL prevented this by restricting
what users could do with the frontend code.

### Market Context: The Shift to Building Blocks

The historical market winners (AWS, Salesforce, Retool) dominated through brute-force feature
accumulation. Newer market winners (e.g., Vercel) took a different path: provide an exceptionally
smooth core experience for a specific use case and act as a modular foundation where customers
"plug in with code." If the platform doesn't do something, users write code to connect a
specialized third-party tool rather than waiting for a native feature.

The analysis is that the monolithic, feature-maximalist model is being disrupted. The market
winners of the next wave will be those who provide minimal, highly reliable building blocks and
make it effortless for customers (and their AI agents) to generate and integrate their own custom
solutions on top.

OSE Platform's mission — democratizing Sharia-compliant enterprise systems — is better served by
positioning as a building-block foundation than as a closed feature monopoly. MIT is the license
for that positioning.

## Impact

- **GitHub**: Repository license indicator changes from "Other" back to "MIT".
- **Contributors**: No legal barriers — standard MIT terms apply everywhere.
- **Downstream users**: Can freely use all code, including product apps and specs, for any purpose.
- **AI agent discoverability**: MIT-licensed code is structurally preferred by AI tooling.
- **ose-primer**: Already MIT throughout — no change needed.

## Affected Roles

- **Maintainer-as-developer**: Executes the delivery checklist — replaces LICENSE files, patches
  configuration, rewrites documentation.
- **Maintainer-as-licensor**: Owns the relicensing decision and is responsible for its legal and
  strategic consequences.
- **plan-executor agent**: Runs the delivery checklist step-by-step.
- **plan-execution-checker agent**: Verifies that all acceptance criteria are met after execution.

## Non-Goals

Business-scope items explicitly out of scope:

- **`ose-primer` relicensing**: Already MIT throughout — no change needed.
- **`ose-infra` relicensing**: Separate repository; not in scope for this plan.
- **Third-party LICENSE files**: `archived/ayokoding-web-hugo/LICENSE` (Xin 2023 MIT) must remain
  unchanged.
- **Retroactive edits to `plans/done/`**: Historical plan records are frozen and may retain FSL
  references as accurate historical context.
- **Changing the business model**: This decision is about license terms only; revenue model,
  deployment model, and product roadmap are unchanged.

## Success Metrics

- _Observable fact_: `grep -r "FSL\|Functional Source License" --include="*.md" .` returns zero
  results outside `plans/done/` and `plans/in-progress/2026-04-22__mit-license-reversion/`.
- _Observable fact_: `grep '"license"' package.json` returns `"MIT"`.
- _Observable fact_: `head -3 LICENSE` shows `MIT License`.
- _Observable fact_: GitHub repository license indicator shows "MIT" after the PR merges.
- _Judgment call_: Contributors and downstream users encounter no FSL-specific legal friction when
  reading the repository license headers.

## Business Risks

| Risk                                                                              | Mitigation                                                                                            |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Competitor cloning: open code enables trivial AI-assisted replication             | Accepted as strategic tradeoff — competitive moat shifts to infrastructure, data, and service quality |
| Self-hosting and lost revenue: potential customers may fork rather than pay       | Accepted — monetization model shifts to backend infrastructure and services, not code exclusivity     |
| Amplified security exposure: open code enables AI-assisted vulnerability scanning | Accepted — security hygiene treated as continuous operational requirement                             |
| Fork instability: community forks may generate misattributed support burden       | Accepted — maintain clear documentation that forked variants are unsupported                          |
| Accidental omission: a LICENSE file missed during execution remains FSL           | Mitigated by Phase 6 grep validation and plan-execution-checker review                                |
| Documentation drift: an FSL reference overlooked in a governance doc              | Mitigated by Phase 6 grep validation covering all `*.md` files                                        |

## References

- [A letter to tech CEOs — Theo (t3.gg), YouTube](https://www.youtube.com/watch?v=G1xqTjoihfo)
  (accessed 2026-04-22) — analysis of open-source risks/benefits, the feature paradox, AI agent
  preference for open tools, and the shift from monolithic feature monopolies to the
  building-block economy. Core input for the strategic rationale above.
