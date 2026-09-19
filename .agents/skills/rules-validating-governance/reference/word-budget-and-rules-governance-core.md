# Steps 6-7: Governance Word Budget and Rules Governance (Contradictions Through Layer Coherence)

## Step 6: Governance Word Budget — Delegated

Word budgets for `AGENTS.md`, `CLAUDE.md`, and every other auto-loaded instruction surface are
owned by the deterministic `./rhino governance word-budget validate` gate (wired at pre-push, CI,
and as `governance-word-budget` in the `repo-governance audit` preflight, once armed). Thresholds
live only in the `governance-word-budget:` section of `repo-config.yml` — never restate them here,
since a second copy drifts from config and produces contradictory verdicts.

Under `rules-quality-gate`, word counting is delegated by exact gate ID. Record evidence in the
lifecycle ledger; if it is missing/stale, mark `pending` and do not count words. Continue only
qualitative concerns a mechanical gate cannot measure (needless restatement, duplicate reachable
content, or all-at-once complexity). Standalone invocation retains its configured fallback.

**Remediation guidance**: the only sanctioned fix is progressive disclosure (inline content →
one-line summary + `See` link) — call out forbidden anti-fixes (deleting rules, dense compression,
splitting into another auto-loaded file) if observed. Compare the before/after obligation, named
audience qualifier, strength, scope, boundaries, exceptions, pass/violation conditions, and
enforcement disposition; any weakening, generalization, omission, or ambiguity is HIGH even when
the counter passes. Material qualifiers such as “junior engineer fresh from bootcamp with no
professional work experience” must remain explicit. See
[Governance Word-Budget Convention](../../../../repo-governance/conventions/structure/governance-word-budget.md).

## Step 7: Rules Governance Validation

**Ownership annotations**: consume retained traceability and layer-coherence findings without
AI-rederiving them. Delegate vendor-neutrality and license presence when their exact registry IDs
are supplied. Re-evaluate contradictions, inaccuracies, semantic inconsistencies, and terminology
alignment because those remain domain judgement.

**Scope**: all governance layers (`vision/`, `principles/`, `conventions/`, `development/`,
`workflows/`, `.claude/agents/**/*.md` content/cross-layer consistency only — frontmatter
shape/naming/mirror parity belong to `Rhino harness` and `harness-compatibility-checker`),
`repository-governance-architecture.md`, `repo-governance/README.md`, `docs/explanation/README.md`.

1. **Contradictions**: cross-reference principle definitions against implementations, check
   conventions against each other, verify practices don't contradict the conventions they claim to
   implement, compare vision statements across documents.
2. **Inaccuracies**: validate file path references, agent/skill name references against actual
   files, layer-numbering consistency (0-5), frontmatter requirements against actual usage.
3. **Inconsistencies**: terminology alignment (e.g. "Principles Implemented" vs "Principles
   Respected"), cross-reference completeness, index-vs-directory-contents match, README-vs-detail
   alignment.
4. **Traceability**: every Principle needs "Vision Supported"; every Convention needs "Principles
   Implemented/Respected"; every Development practice needs BOTH "Principles" AND "Conventions"
   sections; every Workflow needs correct agent references.
5. **Layer Coherence**: Vision→Principles→Conventions/Development→Agents→Workflows, each layer
   properly governing/implementing the layer(s) below.
6. **Propagation Consolidation**: for each changed rule subject, verify every rule and
   discoverability surface has a keep, amend, merge, delete, relocate, or supersede verdict and a
   surviving canonical home. A kept redundancy needs a rationale; merge/delete must preserve every
   distinct obligation and necessary discovery path. Do not demand repository-wide cleanup.
