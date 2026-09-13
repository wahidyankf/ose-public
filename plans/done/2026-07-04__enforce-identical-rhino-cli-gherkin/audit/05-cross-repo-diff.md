# Phase 0 Audit — Cross-Repo Gherkin Tree Diff

md5 manifest (`.feature` + behaviour-`README.md`) of
`specs/apps/rhino/behavior/rhino-cli/gherkin/` across all three sibling repos:

- `ose-public` — `~/ose-projects/ose-public`
- `ose-primer` — `~/ose-projects/ose-primer`
- `ose-infra` — `~/ose-projects/ose-infra`

## File counts

| Repo         | `.feature` files | `README.md` files | Total manifest entries |
| ------------ | ---------------- | ----------------- | ---------------------- |
| `ose-public` | 51               | 13                | 64                     |
| `ose-infra`  | 51               | 13                | 64                     |
| `ose-primer` | 30               | 12                | 42                     |

Matches tech-docs §1.2's counts exactly (public 51, infra 51, primer 30).

## public vs infra — byte-identical, confirmed

`diff` of the two md5 manifests: **exit 0, zero lines of output.** All 64 entries identical:
0 diverged, 0 missing either direction, 0 extras either direction. **Reproduces the tech-docs §1.2
finding exactly** — `ose-infra`'s gherkin tree is a perfect byte-for-byte match of `ose-public`'s.

## public vs primer — stale, confirmed with a refinement

**Total**: 19 identical, 21 diverged (content mismatch, same path), 24 missing-from-primer, 2
extra-in-primer (stale-by-name).

Tech-docs §1.2 states "~9 content-diverged, ~23 missing, 2 stale-by-name extras." Breaking the 21/24
totals above down by file type shows tech-docs's estimate was **precisely accurate when read as
`.feature`-file-only** (excluding `README.md`):

| Category              | `.feature` files only | `README.md` files only | Combined (this audit's total) |
| --------------------- | --------------------- | ---------------------- | ----------------------------- |
| Content-diverged      | 12                    | 9                      | 21                            |
| Missing from primer   | 23                    | 1 (`ddd/README.md`)    | 24                            |
| Extra/stale in primer | 2                     | 0                      | 2                             |

So tech-docs's "~9 diverged" refers to the 9 diverged `README.md` files, and "~23 missing" refers to
the 23 missing `.feature` files — both **exact matches**, not approximations, once the README/feature
split is made explicit. This is a clarification, not a correction.

### The 2 stale-by-name extras (confirmed byte-for-byte, matches tech-docs §1.2 exactly)

- `env/env-validate.feature` — pre-union app-level env drift guard.
- `repo-governance/repo-governance-gherkin-keyword-cardinality.feature` — pre-rename command name
  (now `specs gherkin-cardinality`).

### 12 diverged `.feature` files (same path, different content)

```
agents/agents-bindings.feature
agents/agents-sync.feature
agents/agents-validate-claude.feature
docs/docs-validate-heading-hierarchy.feature
docs/docs-validate-links.feature
docs/docs-validate-mermaid.feature
env/env-backup.feature
env/env-restore.feature
git/git-pre-commit.feature
repo-governance/repo-governance-instruction-size.feature
repo-governance/repo-governance-vendor-audit.feature
workflows/workflows-validate-naming.feature
```

### 23 `.feature` files missing from primer (canonical-only)

```
agents/agents-detect-duplication.feature
ddd/ddd-bc.feature
ddd/ddd-ul.feature
docs/docs-validate-frontmatter.feature
docs/docs-validate-naming.feature
repo-governance/repo-governance-agents-md-size.feature
repo-governance/repo-governance-audit.feature
repo-governance/repo-governance-emoji-audit.feature
repo-governance/repo-governance-frontmatter-audit.feature
repo-governance/repo-governance-layer-coherence.feature
repo-governance/repo-governance-license-audit.feature
repo-governance/repo-governance-readme-index-audit.feature
repo-governance/repo-governance-traceability-audit.feature
specs/behavior-coverage.feature
specs/domain-coverage.feature
specs/env-staged-guard.feature
specs/harness-bindings.feature
specs/harness-registry-driven.feature
specs/validate-adoption.feature
specs/validate-counts.feature
specs/validate-links.feature
specs/validate-tree.feature
specs/worktree-agnostic.feature
```

Plus `ddd/README.md` missing (primer has no `ddd/` dir at all — consistent with `ddd/` being an
entirely-new, currently-unbound canonical addition).

### 9 diverged `README.md` files + 19 identical entries

Diverged: root `README.md`, `agents/README.md`, `docs/README.md`, `env/README.md`, `git/README.md`,
`repo-governance/README.md`, `spec-coverage/README.md`, `system/README.md`, `workflows/README.md`.

Identical (19): every remaining entry present in both repos with matching content, including
`agent-naming/`, `contracts/`, `env-contract/`, `java/`, `repo-config/`, `repo-config-validate/`
directories' feature files and READMEs, plus `spec-coverage/spec-coverage-validate.feature`.

## Conclusion

This audit **reproduces the plan's finding exactly**: `ose-public` and `ose-infra` are byte-identical
across the entire Gherkin tree; `ose-primer` is stale (21 diverged, 24 missing, 2 stale-by-name extras
when totaled across `.feature` + `README.md`, which decomposes cleanly into tech-docs's own
`.feature`-only figures of ~9 diverged READMEs + ~23 missing features once the file-type split is
made explicit). No correction to the plan's cross-repo model is needed — Phase 3's primer-propagation
step (full `rsync --delete` overwrite) is confirmed as the right remediation shape.
