---
description: How the governance-vendor gate enforces the convention on every commit and pull request, what the scanner reads, and the explicit list of situations that never constitute a violation.
when_to_use: Use when running the vendor-independence check manually, reading a governance-vendor gate failure, or checking whether a specific case is an explicitly permitted exception.
---

# Enforcement, and Exceptions and Escape Hatches

## Enforcement

Enforcement is automated via `./rhino governance vendor validate`, which reads
`policies.governance.vendor` in `repo-config.yml`: its `roots`, `forbidden-terms`, and
`vocabulary-exceptions`.

### Gate wiring

The `governance-vendor` gate runs the validator on the pre-commit and pull-request surfaces, so a
forbidden term blocks the commit that introduces it and the pull request's quality gate. No manual
invocation is needed on commits.

### Running the check manually

```bash
./hippo run --class ephemeral --resource-tier light --disk-path . -- \
  ./rhino governance vendor validate
```

The validator takes no path argument; one run covers every declared root. Exit code 0 means clean,
exit code 1 means at least one finding, and exit code 2 means the policy is missing or invalid. Each
finding names the file and the term.

### What the scanner reads

The roots are `repo-governance/`, `AGENTS.md`, and `CLAUDE.md`. The scanner reads every file under
them in full and matches each declared term as a plain, case-sensitive substring. It does not skip
code fences, `binding-example` fences, "Platform Binding Examples" sections, inline code spans, link
targets, HTML comments, or YAML frontmatter. A term is permitted only in a file that a vocabulary
exception for that term names.

The `rules-checker` agent continues to detect violations during its full audit sweep as a
complementary signal, including the reviewer-applied `Skills` rule the gate does not enforce.

## Exceptions and Escape Hatches

The following are explicitly permitted and never constitute a violation:

1. **Files named in a term's vocabulary exception**: that term, in that file. Exceptions cover
   this convention's term pages and Platform Binding Examples pages only; see
   [Allowlist Mechanism](./allowlist-mechanism.md).
2. **Binding directory paths**: `.agents/`, `.claude/`, `.codex/`, `.opencode/`, and similar paths
   are not vendor terms and may be named anywhere.
3. **`docs/reference/platform-bindings.md`**: catalog file; outside the declared roots.
4. **`CLAUDE.md`**: it holds only the `@AGENTS.md` import directive, which names no vendor.
5. **Plans files** (`plans/`): outside the declared roots.
6. **Citation context**: when citing an external source whose name happens to be a vendor term,
   reword the citation to name the standard or organization role rather than the vendor where
   possible. A page that must keep a vendor name in a citation needs a vocabulary exception for it.
