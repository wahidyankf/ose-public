# Step 8 (8.1-8.4): Software Docs Principle Alignment, Cross-References, Naming, Structure

**Deterministic-gate annotation**: file naming (8.3), frontmatter shape and heading hierarchy
(8.4), and README index integrity (8.7) are enforced by the deterministic `./rhino md` gate
(`naming`, `frontmatter`, `heading-hierarchy`, `readme-index` validators) — not in the preflight
envelope. Re-evaluate only content accuracy, principle-alignment judgement, and cross-doc
terminology consistency.

**Scope**: `docs/explanation/software-engineering/` (~265 files, ~345k lines) — the authoritative
software design/coding-standards reference.

## 8.1 Governance Principle Alignment

Read each doc's frontmatter `principles:` field; check topic-appropriate citations (security docs
need explicit-over-implicit and automation-over-manual; architecture docs need
simplicity-over-complexity and explicit-over-implicit; development-practice docs need
automation-over-manual; testing docs need automation-over-manual and reproducibility).
**CRITICAL**: broken principle reference (file doesn't exist). **HIGH**: missing a critical
principle. **MEDIUM**: missing a recommended principle. **LOW**: enhancement suggestion only.

## 8.2 Cross-Reference Completeness

Build a bidirectional reference map between software docs and `repo-governance/`; validate targets
exist, links use `.md` extension, anchors resolve; check that a software-doc→governance reference
implies a reciprocal governance→software-doc listing (e.g. an F# doc referencing the governance FP
pattern doc should be listed in that doc's "Language Support"). **CRITICAL**: broken link (404).
**HIGH**: one-way reference when bidirectional expected. **MEDIUM**: missing internal
cross-reference within software docs. **LOW**: optional enhancement.

## 8.3 File Naming Convention Adherence

Plain kebab-case filenames (`idioms.md`, `railway-oriented-error-handling.md`); directory hierarchy
encodes category; `README.md` and `templates/` are the only exceptions; files live in the correct
directory for their topic. **CRITICAL**: file in wrong directory. **HIGH**: non-kebab-case
filename. **MEDIUM**: over-specified name when the directory already encodes the category. **LOW**:
minor naming variation still in kebab-case.

## 8.4 Document Structure Pattern Consistency

Validate against each language's own `README.md` index (not a fixed list — TypeScript typically
needs `idioms.md`/`best-practices.md`/`anti-patterns.md`; F#/Rust typically need
`coding-standards.md` and other `*-standards.md` files; every language needs `README.md`); every
framework doc (React, Giraffe, Axum) needs a README with an architecture-integration section. Frontmatter required fields: `title`, `description`, `category` ("software"),
`subcategory`, `tags` (non-empty), `principles` (recommended). Heading hierarchy: single H1, proper
nesting (never H2→H4 skip). **CRITICAL**: missing a core document per the language's own README
index. **HIGH**: invalid/missing required frontmatter field. **MEDIUM**: heading hierarchy
violation. **LOW**: missing optional frontmatter field.
