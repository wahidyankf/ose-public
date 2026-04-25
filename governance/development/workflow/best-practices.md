# Best Practices for Workflow Development

> **Companion Document**: For common mistakes to avoid, see [Anti-Patterns](./anti-patterns.md)

## Overview

This document outlines best practices for development workflows, including Trunk Based Development, implementation methodology, commit messages, and reproducible environments. Following these practices ensures efficient, predictable, and high-quality development.

## Purpose

Provide actionable guidance for:

- Git workflow execution
- Implementation progression
- Commit message authoring
- Environment reproducibility
- Development process standards

## Best Practices

### Practice 1: Commit Directly to Main

**Principle**: Default to committing on main branch, use branches only when necessary.

**Good Example:**

```bash
# Work on main
git checkout main
git pull origin main

# Make small change
# ... edit files ...
npm test

# Commit to main
git add .
git commit -m "feat(auth): add email validation"
git push origin main
```

**Bad Example:**

```bash
# Creating branch for every task (unnecessary)
git checkout -b feature/tiny-typo-fix
# ... fix typo ...
git commit -m "fix typo"
# Wait days for PR review for one-line change
```

**Rationale:**

- Simplifies workflow
- Faster integration
- No merge conflicts from long-lived branches
- Continuous integration by default

### Practice 2: Make Small, Frequent Commits

**Principle**: Break work into small, atomic commits multiple times per day.

**Good Example:**

```bash
# Day 1
git commit -m "feat(auth): add User model"
git commit -m "feat(auth): add password hashing utility"
git commit -m "test(auth): add User model tests"

# Day 2
git commit -m "feat(auth): add login endpoint"
git commit -m "test(auth): add login endpoint tests"
```

**Bad Example:**

```bash
# One massive commit after a week
git commit -m "feat(auth): complete authentication system"
# 5000 lines changed across 50 files!
```

**Rationale:**

- Easier code review
- Easier to revert if needed
- Clear history
- Faster feedback

### Practice 3: Use Conventional Commits

**Principle**: Follow conventional commit format for clear, parseable history.

**Good Example:**

```bash
git commit -m "feat(api): add user registration endpoint"
git commit -m "fix(ui): resolve button alignment issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(auth): extract validation logic"
```

**Bad Example:**

```bash
git commit -m "updates"
git commit -m "fix stuff"
git commit -m "WIP"
git commit -m "asdf"
```

**Rationale:**

- Clear commit purpose
- Automated changelog generation
- Easy to search history
- Semantic versioning support

### Practice 4: Use Feature Flags Instead of Long-Lived Branches

**Principle**: Hide incomplete work with feature flags, not branches.

**Good Example:**

```javascript
// config/features.js
const FEATURES = {
  NEW_DASHBOARD: process.env.ENABLE_NEW_DASHBOARD === "true",
};

// In code
if (FEATURES.NEW_DASHBOARD) {
  return renderNewDashboard(); // Incomplete, hidden in production
} else {
  return renderOldDashboard(); // Production-ready
}
```

**Bad Example:**

```bash
# Long-lived feature branch (DO NOT DO THIS)
git checkout -b feature/new-dashboard
# ... work for 2 weeks on branch ...
# Massive merge conflicts when ready to merge!
```

**Rationale:**

- Code integrated immediately
- No merge conflicts
- Can toggle features without deployment
- Gradual rollouts

### Practice 5: Implement in Three Stages

**Principle**: Make it work → Make it right → Make it fast.

**Good Example:**

```markdown
## Stage 1: Make it work

- Implement basic functionality
- Get tests passing
- Commit working code

## Stage 2: Make it right

- Refactor for clarity
- Improve code organization
- Add documentation

## Stage 3: Make it fast

- Profile for bottlenecks
- Optimize hot paths
- Measure improvements
```

**Bad Example:**

```markdown
# Premature optimization (DO NOT DO THIS)

## Stage 1: Make it fast

- Optimize before implementation
- Complex micro-optimizations
- Code that doesn't work yet
```

**Rationale:**

- Working code first
- Avoid premature optimization
- Incremental improvement
- Clear progression

### Practice 6: Pin Dependencies for Reproducibility

**Principle**: Lock versions using package-lock.json and Volta.

**Good Example:**

```json
// package.json
{
  "volta": {
    "node": "24.13.1",
    "npm": "11.10.1"
  }
}

// Committed: package-lock.json (exact versions)
```

**Bad Example:**

```json
// package.json
{
  "dependencies": {
    "react": "^18.0.0"  // Unpinned - different versions on different machines!
  }
}

// .gitignore
package-lock.json  # NOT COMMITTED - WRONG!
```

**Rationale:**

- Consistent builds across machines
- No "works on my machine" issues
- Reproducible CI/CD
- Reliable dependency versions

### Practice 7: Keep CI Green at All Times

**Principle**: Never commit code that breaks CI, fix immediately if broken.

**Good Example:**

```bash
# Before pushing
npm test  # Verify tests pass
npm run lint  # Verify linting passes
npm run build  # Verify build succeeds

git push origin main

# If CI fails after push
git revert HEAD  # OR fix immediately
```

**Bad Example:**

```bash
git push origin main
# CI fails
# "I'll fix it later" (BLOCKS EVERYONE!)
```

**Rationale:**

- Broken main blocks everyone
- Fast feedback loop
- Team productivity
- Quality gate enforcement

### Practice 8: Use Environment-Specific Configuration

**Principle**: Different settings for development vs production.

**Good Example:**

```bash
# Development
NODE_ENV=development npm run dev

# Production
NODE_ENV=production npm run build

# .env.example (committed)
DATABASE_URL=
API_KEY=
```

**Bad Example:**

```bash
# Same config everywhere (DO NOT DO THIS)
const DB_URL = "production-db.example.com";  # Hardcoded!
```

**Rationale:**

- Safe local development
- No production credentials in code
- Environment-specific behavior
- Follows 12-factor app principles

### Practice 9: Split Commits by Domain

**Principle**: Separate concerns in different commits.

**Good Example:**

```bash
git commit -m "feat(api): add user endpoints"
git commit -m "feat(ui): add user profile page"
git commit -m "docs(api): document user endpoints"
```

**Bad Example:**

```bash
git commit -m "feat: add user functionality"
# 1000 lines: API + UI + docs + tests all in one commit
```

**Rationale:**

- Easier to review
- Easier to revert specific changes
- Clear history by domain
- Better git log navigation

### Practice 10: Test Before Committing

**Principle**: Run tests locally before every commit.

**Good Example:**

```bash
# Make changes
# ... edit files ...

# Test before committing
npm test
npm run lint

# All green - commit
git commit -m "feat(api): add validation"
```

**Bad Example:**

```bash
# Make changes
git commit -m "feat: add stuff"
git push

# Wait for CI to tell you tests failed (SLOW FEEDBACK!)
```

**Rationale:**

- Fast feedback loop
- Catch issues early
- Respect team's time
- Green CI

### Practice 11: Pull with Rebase Before Pushing

**Principle**: Always pull latest changes from remote main before pushing, preferring rebase for clean linear history in Trunk Based Development.

**Default Strategy: Rebase**

For Trunk Based Development with small, frequent commits, rebase creates cleaner linear history:

**Good Example (Rebase):**

```bash
# Work completed locally with commits
git status
# On branch main
# Your branch is ahead of 'origin/main' by 1 commit

# Pull with rebase BEFORE pushing (recommended for TBD)
git pull --rebase origin main

# If there are remote changes, Git replays your commits on top
# Linear history: no merge commits

# Review the result
git log --oneline --graph -10

# Now push your changes
git push origin main
# Success! Clean linear history preserved
```

**Bad Example:**

```bash
# Work completed locally
git push origin main

# Push rejected!
# error: failed to push some refs to 'origin'
# hint: Updates were rejected because the remote contains work that you do
# hint: not have locally. This is usually caused by another repository pushing
# hint: to the same ref.

# Now forced to pull and resolve
git pull origin main
# Merge required - could have been avoided!
```

**Rationale for Rebase-First Approach:**

- **Linear history**: No merge commits cluttering git log in TBD workflow
- **Cleaner visualization**: `git log --oneline` shows straight line of development
- **Better for TBD**: Small, frequent commits integrate cleanly without merge noise
- **Easier bisect**: `git bisect` works better with linear history
- **Simpler to understand**: Each commit applies directly on top of previous
- **Professional appearance**: Enterprise projects favor linear commit history

### When to Use Merge vs Rebase

#### Default: Use Rebase

**For normal Trunk Based Development workflow**:

```bash
# Daily workflow with rebase (RECOMMENDED)
git pull --rebase origin main
git push origin main
```

**When rebase is ideal**:

- Small, frequent commits (TBD standard workflow)
- Few local commits (1-3 commits)
- Working on main branch
- No conflicts expected
- Clean linear history desired
- Normal day-to-day development

#### When to Use Merge Instead

**Switch to merge when you encounter:**

**1. Heavy conflicts** - Easier to resolve all conflicts at once:

```bash
# Many conflicts during rebase? Abort and merge instead
git rebase --abort
git pull origin main  # Uses merge
# Resolve all conflicts in one merge commit
```

**2. Large divergence** - Many commits on both sides:

```bash
# You have 10 local commits, remote has 15 new commits
# Rebase would require resolving conflicts 10+ times
git pull origin main  # Merge is safer here
```

**3. Preserve parallel work timing** - Want to show work happened in parallel:

```bash
# Documenting simultaneous development by multiple developers
git pull origin main  # Merge preserves parallel history
```

**4. Safety preference** - When unsure, merge is safer:

```bash
# Unsure about conflicts or impact?
git pull origin main  # Merge doesn't rewrite history
```

**5. Already pushed commits** - NEVER rebase commits others have pulled:

```bash
# CRITICAL: If you've pushed and others pulled, ONLY merge
git pull origin main  # Never rebase shared commits!
```

### Git Configuration for Rebase

**Option 1: Configure main branch only (RECOMMENDED)**

```bash
# Make main branch always use rebase for pulls
git config branch.main.rebase true

# Verify configuration
git config branch.main.rebase
# Output: true

# Now `git pull` on main automatically rebases
git pull origin main  # Automatically uses --rebase
```

**Why branch-specific is recommended**: Predictable for main branch (TBD), but merge is still default for other branches.

**Option 2: Global configuration (all branches)**

```bash
# Make rebase default for all branches in this repository
git config pull.rebase true

# Or globally for all repositories
git config --global pull.rebase true

# Now all `git pull` commands use rebase by default
git pull origin main  # Automatically rebases
```

**Why global might be too aggressive**: Some branches (experimental, external PRs) may benefit from merge commits.

**Option 3: Explicit flag (most explicit)**

```bash
# Always specify strategy explicitly
git pull --rebase origin main  # Rebase
git pull origin main           # Merge (default)

# Add shell alias for convenience
git config --global alias.pr 'pull --rebase'
git pr origin main  # Shorthand for pull --rebase
```

**Recommendation**: Start with Option 1 (branch-specific for main), then expand to Option 2 if team is comfortable.

### Conflict Resolution Workflows

#### Resolving Rebase Conflicts

**Rebase applies commits one at a time**, so conflicts are resolved incrementally:

```bash
# Start rebase
git pull --rebase origin main

# Conflict in first commit being replayed
# CONFLICT (content): Merge conflict in src/auth.ts
# error: could not apply abc1234... feat(auth): add validation

# Resolve conflict in the file
# ... edit src/auth.ts to resolve conflict ...

# Stage the resolved file
git add src/auth.ts

# Continue rebase to next commit
git rebase --continue

# If another conflict appears, repeat:
# - Resolve conflict
# - git add <file>
# - git rebase --continue

# If too many conflicts, abort and use merge instead
git rebase --abort
git pull origin main  # Falls back to merge
```

**Rebase workflow**:

1. Conflict appears for ONE commit at a time
2. Resolve conflict
3. `git add` resolved files
4. `git rebase --continue`
5. Repeat until all commits applied
6. Or `git rebase --abort` to start over

#### Resolving Merge Conflicts

**Merge resolves all conflicts at once** in a single merge commit:

```bash
# Start merge
git pull origin main  # Default merge strategy

# Conflicts in multiple files
# CONFLICT (content): Merge conflict in src/auth.ts
# CONFLICT (content): Merge conflict in src/user.ts
# Automatic merge failed; fix conflicts and then commit the result.

# Resolve ALL conflicts in ALL files
# ... edit src/auth.ts ...
# ... edit src/user.ts ...

# Stage all resolved files
git add src/auth.ts src/user.ts

# Complete the merge with a merge commit
git commit -m "Merge remote-tracking branch 'origin/main'"

# Push merged result
git push origin main
```

**Merge workflow**:

1. All conflicts appear at once
2. Resolve all conflicts
3. `git add` all resolved files
4. `git commit` to complete merge
5. Creates one merge commit

#### Decision Tree: Rebase vs Merge Conflicts

```
Conflict during rebase?
├─ Few conflicts (1-2 files)
│  └─ Continue with rebase (resolve commit-by-commit)
│
├─ Many conflicts (3+ files) OR same file multiple times
│  └─ Abort rebase, use merge instead
│     └─ git rebase --abort
│     └─ git pull origin main
│
└─ Unsure or stuck
   └─ Abort rebase, use merge (safer)
      └─ git rebase --abort
      └─ git pull origin main
```

### Safety Considerations

#### Never Rebase Public Commits

**CRITICAL RULE**: Never rebase commits that others have pulled.

**Why this is dangerous:**

```bash
# You pushed commits yesterday
git push origin main
# Teammate pulled your commits
# Their work builds on your commits

# WRONG: Rebase commits you already pushed
git pull --rebase origin main  # Rewrites history
git push --force origin main   # BREAKS teammate's repository!

# Teammate's commits now based on non-existent history
# Their `git pull` will fail or create duplicate commits
```

**Safe approach**: Only rebase LOCAL commits never pushed:

```bash
# Safe: Rebase local commits before first push
git commit -m "feat: add feature"  # Local only
git pull --rebase origin main      # Safe - rewrites local commit
git push origin main               # First push - safe

# Unsafe: Rebase after pushing
git push origin main               # Others may have pulled
git pull --rebase origin main      # DANGEROUS - don't rewrite pushed commits
```

#### When Unsure, Merge is Safer

**If you're uncertain about impact**:

```bash
# Safe default: merge preserves all history
git pull origin main  # Merge strategy (default)

# No history rewriting
# No breaking others' repositories
# Can always clean up history later if needed
```

#### Aborting Operations

**Always have an escape path:**

```bash
# Abort rebase if things go wrong
git rebase --abort
# Returns to state before rebase started

# Abort merge if conflicts are overwhelming
git merge --abort
# Returns to state before merge started
```

### Best Practice in Daily Workflow

**Start of day workflow with rebase:**

```bash
# Configure main branch for rebase (one-time setup)
git config branch.main.rebase true

# Start of day: Get latest with rebase
git checkout main
git pull origin main  # Automatically rebases due to config

# Make changes
# ... work work work ...

# Commit locally
git add .
git commit -m "feat(auth): add validation"

# Before pushing: Pull with rebase again (main may have advanced)
git pull origin main  # Automatically rebases due to config

# Review history (should be linear)
git log --oneline --graph -10

# Push your changes
git push origin main
# Success! Linear history maintained
```

**When conflicts appear:**

```bash
# Pull with rebase
git pull origin main

# Conflict in one file
# Resolve conflict, then:
git add <resolved-file>
git rebase --continue

# If conflicts too complex:
git rebase --abort
git pull origin main  # Use merge instead
```

### Practice 12: Use Direct Push by Default; Create PRs Only When Explicitly Requested

**Principle**: PRs are opt-in, not the default. Push directly to `main` unless the user prompt or plan document explicitly requests a PR.

**Good Example:**

```bash
# Complete a feature with direct push (no PR needed)
git commit -m "feat(auth): add email validation"
git push origin main
```

**Bad Example:**

```bash
# Opening a PR for every commit "for safety" (DO NOT DO THIS)
gh pr create --title "feat: add email validation" --body "..."
# Unnecessary friction; blocks trunk-based integration
```

**Rationale:**

- Direct push is the TBD default — PRs add friction without safety benefit for routine commits
- PRs are appropriate only for worktree-based flows, external contributions, or when explicitly requested
- Plan delivery checklists must not include unsolicited PR steps

See [Git Push Default Convention](./git-push-default.md) for complete rules.

## Related Documentation

- [Trunk Based Development Convention](./trunk-based-development.md) - Complete TBD workflow
- [Commit Message Convention](./commit-messages.md) - Conventional Commits guide
- [Implementation Workflow Convention](./implementation.md) - Three-stage methodology
- [Reproducible Environments Convention](./reproducible-environments.md) - Environment practices
- [Anti-Patterns](./anti-patterns.md) - Common mistakes to avoid
- [Git Push Default Convention](./git-push-default.md) - PR opt-in rules for AI agents and plans

## Summary

Following these best practices ensures:

1. Commit directly to main
2. Make small, frequent commits
3. Use Conventional Commits
4. Use feature flags instead of branches
5. Implement in three stages (work → right → fast)
6. Pin dependencies for reproducibility
7. Keep CI green at all times
8. Use environment-specific configuration
9. Split commits by domain
10. Test before committing
11. Pull with rebase before pushing (linear history for TBD)
12. Use direct push by default; create PRs only when explicitly requested

Workflows built following these practices are efficient, predictable, and high-quality.

## Principles Implemented/Respected

- **Simplicity Over Complexity**: Single branch, small commits, clear workflow
- **Automation Over Manual**: CI enforcement, automated testing
- **Reproducibility First**: Pinned dependencies, environment configuration
- **Explicit Over Implicit**: Conventional Commits, clear commit messages

## Conventions Implemented/Respected

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Active voice, clear documentation of workflow practices
- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Workflow documents follow standardized kebab-case naming
- **[Linking Convention](../../conventions/formatting/linking.md)**: GitHub-compatible links to related workflow documentation
