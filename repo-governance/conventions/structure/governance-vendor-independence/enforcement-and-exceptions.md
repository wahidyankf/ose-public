---
description: How the vendor-audit scanner is run and what it respects, plus the explicit list of situations that never constitute a violation.
when_to_use: Use when running the vendor-independence audit manually, or checking whether a specific case is an explicitly permitted exception.
---

# Enforcement, and Exceptions and Escape Hatches

## Enforcement

Enforcement is automated via `rhino-cli repo-governance vendor validate`.

### Running the audit manually

```bash
# Audit the repo-governance/ directory (default)
./hippo run --class ephemeral --disk-path . -- \
  apps/rhino-cli/scripts/rhino-bin.sh repo-governance vendor validate repo-governance/

# Audit the canonical root instruction surface
./hippo run --class ephemeral --disk-path . -- \
  apps/rhino-cli/scripts/rhino-bin.sh repo-governance vendor validate AGENTS.md

# Or via Nx (cached)
./hippo run --class ephemeral --disk-path . -- \
  npm exec nx -- run rhino-cli:governance:vendor-audit-validation
```

The validator takes one path per invocation, so each covered surface is audited separately.

Exit code 0 means clean; exit code 1 means violations found. Each finding prints:

```
<file>:<line>  <forbidden-term>  →  "<suggested-replacement>"
```

### Pre-push integration

Two gates cover the audit at pre-push and in CI: one triggers on any `repo-governance/**/*.md`
change, the other on `AGENTS.md`. No manual invocation is needed on pushes.

`CLAUDE.md` carries no gate. It holds only the `@AGENTS.md` import directive, which the scanner
treats as a binding directive rather than a vendor term, so a gate there could never fail — and a
check that can never fail is worse than none.

### Scope of the scanner

The scanner respects all exemption mechanisms described in the "Allowlist Mechanism" section above:
code fences, `binding-example` fences, "Platform Binding Examples" heading sections, inline code
spans, link URL portions, HTML comments, and YAML frontmatter. The convention file itself
(`governance-vendor-independence.md`) is also permanently allowlisted.

The `rules-checker` agent continues to detect violations during its full audit sweep as a
complementary signal.

## Exceptions and Escape Hatches

The following are explicitly permitted and never constitute a violation:

1. **Inside `binding-example` fences**: any content, including vendor names and paths.
2. **Under "Platform Binding Examples" headings**: any content until the next same-level heading.
3. **The convention file itself** (`governance-vendor-independence.md`): this file uses vendor terms in examples to illustrate the rule. The audit tooling allowlists this file.
4. **`docs/reference/platform-bindings.md`**: catalog file; explicitly out of scope.
5. **The single-line `@AGENTS.md` import in `CLAUDE.md`**: treated as an inline binding directive (not a forbidden vendor term). Other appearances of vendor terms inside CLAUDE.md must use the standard allowlist mechanisms.
6. **Plans files** (`plans/`): explicitly out of scope.
7. **Citation context**: when citing an external source whose name happens to be a vendor term (e.g., "the AAIF specification donated by Anthropic in December 2025"), the citation is allowed. The pattern must be clearly attributive, not a product mention.
