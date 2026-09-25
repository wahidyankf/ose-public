# Common Development Workflow — Pre-commit Automation

## Automated Quality Gates

Each Husky hook runs one surface of the `repo-config.yml` gate registry through
`./rhino gate run --surface <surface>`. List the live gates with `./rhino gate list`.

**Pre-commit Hook**:

1. **Public-safety screen**: Blocks outbound-unsafe staged content
2. **Format staged files**: The `format-staged` gate runs Prettier and each language's formatter on
   staged files and stages the result
3. **Lint and validate**: markdownlint, Mermaid, heading hierarchy, naming, front matter, emoji,
   repository configuration, environment policy, and `shellcheck`/`hadolint`/`actionlint`

**Commit-msg Hook**:

- **Public-safety message screen**: Blocks a commit message carrying outbound-unsafe content
- **Blocks the commit** on any declared `commit-msg` gate failure

**Pre-push Hook**:

- **Declared pre-push gates**: The public-safety tree screen and environment-policy validation
- No `test:quick` or Markdown lint runs here

**PR Quality Gate** (`pr-quality-gate.yml`):

- **The whole `pull-request` surface**: Every pre-commit and commit-msg gate over the changed range;
  formatting must replay with no diff
- **Run `test:quick` for affected projects**: Language jobs run affected `typecheck`, `lint`, and
  `test:quick` — every project must expose a `test:quick` target

> **Note**: `test:integration` and `test:e2e` do NOT run in pre-commit, pre-push, or PR/main gates.
> Select only impacted targets manually during development/review; scheduled GitHub Actions
> workflows run the complete suites. See [Nx Target Standards](../../../../repo-governance/development/infra/nx-targets.md)
> for the full execution model.

## Trust the Automation

**Philosophy**: Focus on code quality, let automation handle style

**What This Means**:

- Don't manually format code (Prettier handles it)
- Don't worry about markdown formatting (automated)
- Run `./rhino md internal-link validate` when you add, move, or rename a Markdown file (no gate
  checks links)
- Trust that affected tests run in the PR quality gate

**If Pre-commit Hook Fails**:

1. Read the error message carefully
2. Fix the reported issue
3. Re-stage files if needed
4. Commit again (creates NEW commit, don't amend unless asked)

**Common Failures**:

- **Markdown linting**: Run `npm run lint:md:fix` to auto-fix
- **Formatting replay on a PR**: Commit through the pre-commit hook so `format-staged` formats the
  file, or run `./rhino gate run --surface pre-commit` on the staged change
- **Test failures (PR quality gate)**: Fix the failing test, commit, push again
- **Commit message format**: Rewrite commit message following Conventional Commits
