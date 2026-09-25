# Common Development Workflow — Related Conventions

**Workflow Conventions**:

- [Trunk Based Development](../../../../repo-governance/development/workflow/trunk-based-development.md) - Git workflow details (all development targets `main`; see [Plans Organization Convention §Delivery Mode](../../../../repo-governance/conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode) for how a plan reaches `main` — `worktree-to-pr` is the default)
- [PR Merge Protocol](../../../../repo-governance/development/workflow/pr-merge-protocol.md) - `[AI]` merges by default once the five hardened preconditions hold; a `[HUMAN]` merge gate is an explicit per-plan opt-in; all quality gates must pass before merge
- [Commit Messages Convention](../../../../repo-governance/development/workflow/commit-messages.md) - Conventional Commits specification
- [Implementation Workflow](../../../../repo-governance/development/workflow/implementation.md) - Make it work → right → fast
- [Test-Driven Development](../../../../repo-governance/development/workflow/test-driven-development.md) - Required for all code changes (Red→Green→Refactor, all levels)

**Quality Conventions**:

- [Code Quality Convention](../../../../repo-governance/development/quality/code.md) - Git hooks, linting, formatting
- [Manual Behavioural Verification](../../../../repo-governance/development/quality/manual-behavioural-verification.md) - real-browser UI proof, `rtk curl` for HTTP, and protocol-native clients for non-HTTP APIs
- [Feature Change Completeness](../../../../repo-governance/development/quality/feature-change-completeness.md) - Specs, contracts, and tests must update with every feature change
- [CI Blocker Resolution](../../../../repo-governance/development/quality/ci-blocker-resolution.md) - Preexisting CI failures must be investigated and fixed, never bypassed
- [Reproducible Environments](../../../../repo-governance/development/workflow/reproducible-environments.md) - Volta, package-lock.json

**Architecture Conventions**:

- [Monorepo Structure Reference](../../../../docs/reference/monorepo-structure.md) - Nx workspace organization
- [Nx Target Standards](../../../../repo-governance/development/infra/nx-targets.md) - Canonical target names, mandatory targets per project type, caching rules
- [Functional Programming](../../../../repo-governance/development/pattern/functional-programming.md) - FP principles across languages
