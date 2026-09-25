# Common Development Workflow — Git Workflow

## Trunk Based Development

**Core Principle**: All development happens on `main` branch

**Branch Strategy**:

- **Default branch**: `main` (all development work)
- **Environment branches**: `prod-*` (deployment only, never commit directly)
- **No feature branches**: Commit small changes frequently to main
- **No long-lived branches**: Keep changes integrated

**Why Trunk Based Development?**

- Reduces merge conflicts (no long-lived branches)
- Encourages small, incremental changes
- Faster feedback loop
- Simplifies deployment pipeline

## Conventional Commits Format

**Pattern**: `<type>(<scope>): <description>`

**Required Format**:

- **type**: Category of change (see types below)
- **scope**: Optional but recommended (component/module affected)
- **description**: Imperative mood ("add" not "added"), no period at end

**Commit Types**:

- **feat**: New feature or capability
- **fix**: Bug fix
- **docs**: Documentation changes only
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code restructuring (no feature change, no bug fix)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build, packaging, or compiler configuration
- **chore**: Dependency updates and repository housekeeping
- **ci**: CI/CD pipeline changes
- **revert**: Reverting previous commit

**Examples**:

```bash
feat(auth): add OAuth2 login support
fix(api): handle null response in user endpoint
docs(readme): update installation instructions
refactor(utils): simplify date formatting logic
test(auth): add integration tests for login flow
```

**Thematic Commit Composition**:

- Do not stage or commit until the user explicitly authorizes a named change set.
- Once authorized, choose boundaries without another prompt unless the user prescribed them or a
  split would exceed the authorized scope.
- Use the fewest build-valid, independently reviewable and revertible commits, one coherent purpose
  each.
- Keep required tests, docs, specs, references, migrations and rollback, and generated mirrors with
  the change they complete. Split only independent concerns.

**Example** (wrong — unrelated purposes):

```bash
git commit -m "feat(auth): add login + fix(api): fix bug + docs: update readme"
```

**Example** (correct — independent purposes):

```bash
git commit -m "feat(auth): add OAuth2 login support"
git commit -m "fix(api): handle null response in user endpoint"
git commit -m "docs(readme): update installation instructions"
```

## Git Discipline

**CRITICAL**: Never stage or commit unless explicitly instructed by user

**Default Behaviour**:

- Do NOT run `git add` automatically
- Do NOT run `git commit` automatically
- User must explicitly request commits

**Commit Permission**:

- Authorization is scoped to the named change set, not continuous.
- After authorization, the agent owns thematic boundaries unless the user prescribes them.
- A boundary may not pull in work beyond the authorized scope.

**Why This Matters**:

- User controls git history
- Prevents unwanted commits
- User may prescribe commit boundaries; otherwise the agent applies the thematic boundary test
- Respects user's workflow preferences
