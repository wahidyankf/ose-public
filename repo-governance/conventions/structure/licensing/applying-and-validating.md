---
description: Step-by-step rules for licensing new applications and libraries, good/bad placement examples, and the validation checklist plus grep recipe for auditing compliance.
when_to_use: Read this when adding a new app or library directory, or when auditing the repository for licensing compliance.
---

# Applying and Validating Licensing

How to license a new directory, worked placement examples, and how to verify the repository is
compliant. Part of the [Per-Directory Licensing Convention](../licensing.md).

## Rules for New Directories

### New Product Applications

When adding a new product application to `apps/`:

1. Create a `LICENSE` file in the application directory using standard MIT text
2. Use the copyright notice format: `Copyright (c) 2025-2026 wahidyankf`

### New Shared Libraries

When adding a new library to `libs/`:

1. Create a `LICENSE` file in the library directory using standard MIT text
2. Use the copyright notice format: `Copyright (c) 2025-2026 wahidyankf`

### E2E Suites

E2E test suites do NOT require a per-directory LICENSE file — they inherit the root MIT license by
default, and `apps/*-e2e/` are the only directories that still do. Internal CLI tools once shared
that exemption; `apps/crane-cli/` carries its own LICENSE file, so a new in-repository CLI tool
takes one too.

## Examples

### Good: Per-Directory LICENSE Placement

```
apps/
  organiclever-www/
    LICENSE          <-- MIT (product app)
    src/
    ...
  crane-cli/
    LICENSE          <-- MIT (CLI tool)
    src/
    ...
libs/
  web-ui/
    LICENSE          <-- MIT (shared library)
    ...
```

### Bad: Missing LICENSE for New Product App

```
apps/
  new-product-app/
    src/             <-- No LICENSE file! Falls back to root MIT
    ...              <-- but explicit per-directory file preferred
```

Even though root MIT covers this, prefer placing an explicit LICENSE file for clarity.

## Validation

To verify licensing compliance across the repository:

1. Every directory listed as a product application has an MIT LICENSE file
2. Every `libs/*` directory has an MIT LICENSE file
3. No LICENSE file contains FSL or Functional Source License text
4. All LICENSE files use the correct copyright notice format
5. `LICENSING-NOTICE.md` accurately reflects the current licensing state

```bash
# Verify no FSL text remains in any LICENSE file
grep -r "Functional Source License" --include="LICENSE" .
# Expect: zero results
```

## References

**Related Repository Files:**

- [Root LICENSE](../../../../LICENSE) — MIT license
- [LICENSING-NOTICE.md](../../../../LICENSING-NOTICE.md) — Human-readable licensing summary
- [MIT License Rationale](../../../../docs/explanation/software-engineering/licensing/mit-license-rationale.md) — Why MIT

**Related Conventions:**

- [File Naming Convention](../file-naming.md) — Directory and file organization standards
- [Plans Organization](../plans.md) — Directory structure for planning documents

**External Resources:**

- [MIT License — Open Source Initiative](https://opensource.org/licenses/MIT)

**Agents:**

- `rules-checker` — Validates licensing compliance
- `rules-propagation` — Fixes licensing violations
