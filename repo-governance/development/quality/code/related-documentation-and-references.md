---
description: "Related conventions and external references."
when_to_use: "Use for a related convention or reference."
---

# Related Documentation and References

## Related Documentation

- [Commit Message Convention](../../workflow/commit-messages.md) - Detailed commit message rules
- [No Machine-Specific Information in Commits](.././no-machine-specific-commits.md) - Practice prohibiting machine-specific paths and credentials from committed code
- [Trunk Based Development](../../workflow/trunk-based-development.md) - Git workflow and branching strategy
- [Git Push Safety Convention](../../workflow/git-push-safety.md) - Requires explicit per-instance user approval before any agent or automation runs `git push --force`, `--force-with-lease`, or `--no-verify`
- [Nx Target Standards](../../infra/nx-targets.md) - Canonical target names, `test:quick` composition rules, and caching configuration that the pre-push hook depends on
- [Rust Unsafe Code Policy](../../../../docs/explanation/software-engineering/programming-languages/rust/code-quality-standards.md#unsafe-code-policy) - MUST clause: all OSE application Rust crates MUST use `#![forbid(unsafe_code)]` in every crate root (`lib.rs` and `main.rs`)
- [Behaviour-Driven Development](../../behaviour-driven-development.md) - Mandatory Unit proof, higher-layer applicability, and the boundary owned by each runtime target

## References

- [Prettier Documentation](https://prettier.io/docs/en/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/lint-staged/lint-staged)
- [Conventional Commits](https://www.conventionalcommits.org/)
