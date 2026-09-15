# PR Numbers

Full plan-attributable PR ledger across all three repos — 6 PRs total: the 3 budgeted (one per
repo, §Delivery Boundaries) plus the 3rd, 2026-08-09-dated deviation's 2 authorized follow-ups,
plus `ose-public` #161 (predates the budget, never counted against it). See §Delivery Boundaries
for the full deviation terms.

| Repo                | PR  | Opened     | Merged     | State                   | Notes                                                                                                                                                                                                     |
| ------------------- | --- | ---------- | ---------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ose-public          | 161 | 2026-08-08 | 2026-08-08 | MERGED                  | Plan-authoring docs-only PR; predates #162's opening, so no repo ever held 2 open at once — not counted against the 3-PR budget                                                                           |
| ose-public          | 162 | 2026-08-08 | (pending)  | OPEN                    | Budgeted execution PR; draft opened after Phase 1 gate, stays open through Phase 12                                                                                                                       |
| ose-primer          | 30  | 2026-08-09 | 2026-08-09 | MERGED                  | Budgeted execution PR — propagate optimize-cis gate changes and unify Rust version                                                                                                                        |
| ose-primer          | 31  | 2026-08-09 | 2026-08-09 | MERGED                  | Authorized follow-up (3rd deviation) — lint-component fix on the `crud-be-rust-axum` toolchain pin, discovered independently after #30 had already merged clean (opened +1h 24m after #30's merge)        |
| The private sibling | 29  | 2026-08-09 | 2026-08-09 | MERGED                  | Budgeted execution PR — propagate optimize-cis gate changes and unify Rust version                                                                                                                        |
| The private sibling | 30  | 2026-08-09 | 2026-08-09 | MERGED (admin override) | Authorized follow-up (3rd deviation) — lint-component fix across every pinned Rust toolchain; merged with the pre-existing, unrelated `coralpolyp` infra flake still red, per standing user authorization |
