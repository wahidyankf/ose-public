# Step 0.5: Consume Deterministic Preflight

**Inputs**: `preflight-report` plus, for `rules-quality-gate`, exact `delegated-gate-ids` and the
lifecycle evidence ledger. The report path points to `local-tmp/repo-governance-audit/repo-governance-audit__*.json`,
produced by the orchestrating workflow (`repo-governance/workflows/rules/rules-quality-gate.md`)
running the declared Rhino governance checks.

**Procedure**:

1. Read the preflight JSON.
2. Validate the envelope against the producer's documented schema and recorded Rhino version. In
   quality-gate context, a missing or incompatible schema is a technical domain failure.
   Standalone invocation retains the defensive full-scan fallback.
3. Extract findings: parse `result.categories[]` (`name`, `command`, `passed`, `findings[]`) and
   `result.skipped_false_positives[]`.
4. Populate the ownership sets. In `rules-quality-gate`, the preflight is already filtered to
   retain layer coherence and traceability; they are domain findings. Vendor and word-budget
   predicates arrive only through exact delegated IDs and remain outside the audit finding count.

   | Retained category    | Domain portion                                    |
   | -------------------- | ------------------------------------------------- |
   | `layer-coherence`    | Step 7 layer coherence                            |
   | `traceability-audit` | Step 7 Vision/Principles/Conventions traceability |

   **Not in this envelope**: file naming, frontmatter shape, emoji codepoints, heading hierarchy,
   README index integrity, license presence, and agent/skill verbatim duplication run under the
   sibling `./rhino md`, `convention`, and `harness` subcommands (pre-commit/CI gates) — the
   per-step "deterministic-gate annotation" notes say which gate owns each.

5. Embed retained findings under `## Deterministic Domain Findings`; they count at their declared
   criticality. Record delegated IDs/evidence in a separate lifecycle ledger, never as findings.
6. Re-validation optimization: compute `sha256(preflight-json-bytes)`. If identical to the prior
   iteration's hash (stored at `local-tmp/.preflight-hash-<uuid-chain>`), reuse the prior
   deterministic-findings section unchanged and only re-evaluate AI-only categories; store the new
   hash for next time.

**On failure in quality-gate context**: retained preflight failure is a technical domain failure.
Missing/stale lifecycle evidence is `pending`. Never substitute a local rerun or AI imitation.
**Standalone context** retains the previous defensive full-scan fallback.
