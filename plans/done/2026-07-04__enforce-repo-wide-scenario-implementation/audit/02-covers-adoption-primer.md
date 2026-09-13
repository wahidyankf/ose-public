# ose-primer `@covers` Marker Adoption (Phase 0 Audit — Deliverable 2)

Command run from `~/ose-projects/ose-primer`:

```bash
git grep -l "@covers " -- apps libs
```

## Result: 8 files, all inside a single project (`rhino-cli`)

| File                                                            | Project   | `@covers` occurrences                   |
| --------------------------------------------------------------- | --------- | --------------------------------------- |
| `apps/rhino-cli/src/application/behavior_coverage/mod.rs`       | rhino-cli | 7 (1 doc mention + 6 markers)           |
| `apps/rhino-cli/src/application/behavior_coverage/types.rs`     | rhino-cli | 4 (doc mentions only, no markers)       |
| `apps/rhino-cli/src/application/behavior_coverage/validator.rs` | rhino-cli | 7 (1 doc mention + 6 markers)           |
| `apps/rhino-cli/src/application/domain_coverage/mod.rs`         | rhino-cli | 3 (1 doc mention + 2 markers)           |
| `apps/rhino-cli/src/application/mod.rs`                         | rhino-cli | 1 (doc mention only)                    |
| `apps/rhino-cli/src/cli.rs`                                     | rhino-cli | 3 (doc mentions only)                   |
| `apps/rhino-cli/src/commands/specs_coverage.rs`                 | rhino-cli | 1 marker                                |
| `apps/rhino-cli/tests/specs_tree.rs`                            | rhino-cli | 5 (Gherkin-step-glue text, not markers) |

- **Total files with `@covers` substring**: 8
- **Total `@covers` occurrences (any form)**: 34
- **Total literal `// @covers <path>:<title>` marker lines** (the actual coverage-declaring syntax): 16,
  all inside `apps/rhino-cli/src/application/behavior_coverage/mod.rs`,
  `apps/rhino-cli/src/application/behavior_coverage/validator.rs`,
  `apps/rhino-cli/src/application/domain_coverage/mod.rs`, and
  `apps/rhino-cli/src/commands/specs_coverage.rs`.

## Key finding: zero adoption outside `rhino-cli`

```bash
git grep -l "@covers " -- apps libs | grep -v "apps/rhino-cli" | wc -l
# => 0
```

None of the other 24 registered projects (11 `crud-be-*` variants, `crud-be-e2e`, 3 `crud-fe-*`
variants, `crud-fe-e2e`, `crud-fs-ts-nextjs`, 7 libs) contain a single `@covers` marker anywhere in their
source trees. The `@covers` marker is currently **rhino-cli's private self-test artifact** — it exists
only to test-drive the `application::behavior_coverage` module's own unit tests (each of the 6 unit
tests in `validator.rs` carries a `// @covers specs/apps/rhino/behavior/rhino-cli/gherkin/specs/*.feature:<title>`
comment linking it back to rhino-cli's own spec file). It has not been propagated to any of the 24
other projects this plan targets. See deliverable 4 for the follow-on finding that this marker isn't
even wired into rhino-cli's own _live_ CLI command path yet.
