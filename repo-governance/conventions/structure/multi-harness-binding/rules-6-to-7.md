---
description: "Rules 6 and 7 — the harness-neutral generate:/validate: npm script naming constraints, and the requirement that every committed binding directory have a catalog entry."
when_to_use: Read this when naming a new npm script that produces or validates binding artifacts, or when adding a new binding directory and its catalog row.
---

# Multi-Harness Binding: npm Script Naming and Catalog Requirement (Rules 6-7)

Standards 6 and 7 of the [Multi-Harness Binding Convention](../multi-harness-binding.md): how binding
npm scripts must be named, and what the platform-bindings catalog must record.

## Rule 6 — Harness-Neutral npm Script Naming (AD8)

Every npm script that produces or validates platform-binding artifacts must satisfy three constraints:

1. **`generate:` namespace prefix** — scripts that produce binding output are named
   `generate:<operation>`. Scripts that validate binding output without producing new files use
   `validate:<operation>` (already established in the pre-push hook).
2. **No harness or vendor names in script identifiers** — the script key must describe the logical
   operation, not the tools or harnesses involved. A script that emits several harnesses' files in a
   single invocation must not be named after any one of them.
3. **One script per logical operation** — a single logical output (for example, "emit all
   platform-binding files from `AGENTS.md`") maps to exactly one npm script. Per-harness scripts are
   forbidden; if a new harness is added, the existing generator and its single script handle it.

**Rationale**: Per-harness script names couple the npm interface to vendor product names, must be
renamed whenever a harness is added or removed, and imply per-vendor invocation rather than the
single-generator model mandated by Rule 4. A harness-neutral namespace (`generate:bindings`) remains
stable as the harness matrix grows.

**Canonical example**:

| PASS: Correct                                                        | FAIL: Incorrect                               | Reason for failure                                     |
| -------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `"generate:bindings": "./rhino harness adapters generate"`           | `"sync:vendor-a-to-vendor-b": "..."`          | Contains vendor names; implies per-harness             |
| `"harness:bindings-validation": "./rhino harness adapters validate"` | `"validate:specific-harness-bindings": "..."` | Names a specific harness rather than the logical check |

## Rule 7 — Catalog Requirement

Every committed binding directory must have an entry in
[docs/reference/platform-bindings.md](../../../../docs/reference/platform-bindings.md) that records:

- The binding directory path.
- The root instruction file the harness reads.
- The harness's tier (native reader or non-native).
- Whether any higher-precedence file exists and whether it is an approved pure pointer.
- The provenance of the binding (generated vs. third-party-provided vs. hand-authored under waiver).

A binding directory without a catalog entry is treated as a parity-guard violation.
