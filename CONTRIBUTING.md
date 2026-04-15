# Contributing to Open Sharia Enterprise

Thank you for your interest in contributing to Open Sharia Enterprise! We welcome contributions from the community and appreciate your time and effort.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Code Conventions](#code-conventions)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow.

## Getting Started

Open Sharia Enterprise is an enterprise platform built with Node.js and organized as an Nx monorepo. Before contributing, please:

1. Read this contributing guide completely
2. Review our [documentation](./docs/README.md)
3. Understand our [commit message conventions](./governance/development/workflow/commit-messages.md)
4. Familiarize yourself with [Trunk Based Development](./governance/development/workflow/trunk-based-development.md)

## Development Setup

### Prerequisites

This project uses **Volta** to manage Node.js and npm versions automatically:

- **Node.js**: 24.13.1 (LTS)
- **npm**: 11.10.1

**Important**: You don't need to install these versions manually if you have Volta installed. Volta will automatically use the correct versions specified in `package.json`.

#### Installing Volta

If you don't have Volta installed:

**macOS/Linux**:

```bash
curl https://get.volta.sh | bash
```

**Windows**:
Download the installer from [volta.sh](https://volta.sh/)

After installation, restart your terminal and Volta will automatically manage Node.js/npm versions for this project.

### Installation Steps

1. **Clone the repository**:

   ```bash
   git clone https://github.com/wahidyankf/ose-public.git
   cd ose-public
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

   Volta will automatically use Node.js 24.13.1 and npm 11.10.1 as specified in `package.json`.

3. **Verify installation**:

   ```bash
   npm run graph
   ```

   This should open the Nx dependency graph in your browser, confirming that the setup is working.

### Common Setup Issues

**Issue**: `command not found: volta`
**Solution**: Make sure Volta is installed and your terminal is restarted.

**Issue**: Wrong Node.js version
**Solution**: Run `volta install node@24.13.1` to ensure Volta has the correct version.

**Issue**: `npm install` fails
**Solution**: Clear npm cache with `npm cache clean --force` and try again.

## Project Structure

This is an **Nx monorepo** with the following structure:

```
ose-public/
├── apps/           # Deployable applications
│   └── [app-name]/ # Individual apps
├── libs/           # Reusable libraries
│   └── ts-[name]/  # TypeScript libraries (language-prefixed)
├── docs/           # Documentation (Diátaxis framework)
│   ├── tutorials/  # Learning-oriented guides
│   ├── how-to/     # Problem-solving guides
│   ├── reference/  # Technical reference
│   └── explanation/ # Conceptual documentation
└── plans/          # Project planning documents
```

**Key concepts**:

- **Apps** (`apps/`) are deployable applications that consume libraries
- **Libs** (`libs/`) are reusable code shared across apps
- **Apps cannot import from other apps** (only from libs)
- **Libs can import from other libs** (no circular dependencies)

For detailed information, see:

- [Monorepo Structure](./docs/reference/monorepo-structure.md)
- [Add New App Guide](./docs/how-to/add-new-app.md)
- [Add New Lib Guide](./docs/how-to/add-new-lib.md)

## Making Changes

### Git Workflow: Trunk Based Development

This project uses **Trunk Based Development** (TBD):

- **Default**: Work directly on the `main` branch
- **Small, frequent commits**: Break work into tiny, mergeable increments
- **Feature flags**: Use toggles to hide incomplete features, not branches
- **Short-lived branches**: If branches are needed (e.g., for code review), merge within 1-2 days

**When to use branches**:

- Code review required by team policy (keep < 2 days)
- Experimental work that may be discarded
- External contributions via fork + PR

For complete details, see [Trunk Based Development Convention](./governance/development/workflow/trunk-based-development.md).

### Development Workflow

1. **Pull latest changes**:

   ```bash
   git pull origin main
   ```

2. **Make your changes**:
   - Edit code in `apps/` or `libs/`
   - Add tests for new functionality
   - Update documentation if needed

3. **Run the fast quality gate for affected projects**:

   ```bash
   nx affected -t test:quick
   ```

4. **Run affected build**:

   ```bash
   nx affected -t build
   ```

5. **Format code** (automatic on commit):

   ```bash
   npx prettier --write .
   ```

## Code Conventions

### Commit Messages

**All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format**:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Valid types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`

**Examples**:

```bash
feat(auth): add JWT authentication
fix(api): prevent race condition in order processing
docs(readme): update installation instructions
refactor(utils): simplify date formatting logic
```

**Important rules**:

- First line ≤ 50 characters
- Use imperative mood ("add" not "added")
- Type and description are required
- Scope is optional but recommended

This format is **enforced by commitlint** on every commit. For complete details, see [Commit Message Convention](./governance/development/workflow/commit-messages.md).

### Commit Granularity

**Split work into multiple logical commits**:

- **Split by type**: Different commit types (`feat`, `docs`, `refactor`) should be separate
- **Split by domain**: Changes to different parts of the codebase should be separate
- **Atomic commits**: Each commit should be self-contained and reversible

**Good example**:

```bash
git commit -m "feat(agents): add docs-link-general-checker agent"
git commit -m "docs(agents): update agent index with new agent"
git commit -m "fix(docs): correct frontmatter date format"
```

**Bad example**:

```bash
git commit -m "feat: add agent, update docs, fix dates"  # Too many changes in one commit
```

### Code Style

- **Prettier**: Code formatting is automatic (runs on commit via Husky)
- **TypeScript**: Use strict mode, avoid `any` types without justification
- **Naming**: Use descriptive names (functions, variables, files)
- **Comments**: Explain "why", not "what" (code should be self-documenting)

### File Naming

- **Apps**: `[domain]-[type]` (e.g., `api-gateway`, `admin-dashboard`)
- **Libs**: `ts-[name]` (e.g., `ts-utils`, `ts-components`)
- **Documentation**: Follow [File Naming Convention](./governance/conventions/structure/file-naming.md)

## Testing

### Running Tests

**Fast quality gate for affected projects** (recommended for pre-push):

```bash
nx affected -t test:quick
```

**Specific project quality gate**:

```bash
nx run [project-name]:test:quick
```

**Isolated unit tests for a specific project**:

```bash
nx run [project-name]:test:unit
```

**See**: [Nx Target Standards](./governance/development/infra/nx-targets.md) for canonical target names, test composition rules, and the full execution model.

### Test Requirements

- **All new features** must include tests
- **All bug fixes** must include regression tests
- **Aim for high coverage**: New code should maintain or improve coverage
- **Test types**: Unit tests (required), integration tests (recommended), e2e tests (for apps)

### Writing Tests

Place tests in `__tests__/` directory or co-located with source files:

```
libs/ts-utils/
├── src/
│   ├── lib/
│   │   └── format-date.ts
│   └── __tests__/
│       └── format-date.test.ts
```

## Submitting Changes

### Pull Request Process

1. **Push your changes** to your fork or branch

2. **Open a pull request** against `main` branch

3. **Fill out the PR template** with:
   - Description of changes
   - Related issues (if any)
   - Testing performed
   - Screenshots (if UI changes)

4. **Wait for code review**: Typically within 2-3 business days

5. **Address feedback**: Make requested changes

6. **Merge**: Once approved and tests pass, your PR will be merged

### PR Requirements

- **One PR per feature/bug fix**: Keep PRs focused and reviewable
- **Tests pass**: All CI checks must be green
- **No merge conflicts**: Rebase on latest `main` if needed
- **Code formatted**: Prettier must have run (automatic on commit)
- **Commits follow convention**: All commits must pass commitlint

### PR Size Guidelines

- **Ideal**: < 300 lines changed
- **Maximum**: < 1000 lines (break larger changes into multiple PRs)
- **Exception**: Generated code, migrations, or dependency updates

## Reporting Bugs

### Before Reporting

1. **Check existing issues**: Your bug may already be reported
2. **Try latest version**: Bug may be fixed in recent releases
3. **Search documentation**: Issue may be usage-related, not a bug

### Bug Report Template

When opening an issue, include:

- **Description**: Clear description of the bug
- **Steps to reproduce**: Numbered list of exact steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, Node.js version, browser (if applicable)
- **Logs/screenshots**: Any relevant error messages or screenshots

## Suggesting Enhancements

We welcome feature suggestions! When proposing an enhancement:

1. **Check existing issues**: Feature may already be proposed
2. **Describe the problem**: What problem does this solve?
3. **Describe the solution**: How would this feature work?
4. **Consider alternatives**: Are there other ways to solve this?
5. **Additional context**: Screenshots, mockups, or examples

## Documentation

Documentation is as important as code. When contributing:

- **Update docs** if your changes affect user-facing behavior
- **Follow Diátaxis**: Use appropriate category (tutorial, how-to, reference, explanation)
- **Follow conventions**: See [Documentation Standards](./governance/conventions/README.md)

### Documentation Structure

- `docs/tutorials/` - Learning-oriented guides
- `docs/how-to/` - Problem-solving guides
- `docs/reference/` - Technical reference
- `docs/explanation/` - Conceptual documentation

## Getting Help

### Questions and Discussions

- **Questions**: Open a GitHub Discussion in the "Q&A" category
- **General discussion**: GitHub Discussions "General" category
- **Real-time chat**: (Coming soon)

### Security Issues

**Do not open public issues for security vulnerabilities.**

See [SECURITY.md](./SECURITY.md) for reporting security issues privately.

### Maintainer Contact

For urgent matters, contact: <wahidyankf@gmail.com>

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Build all projects
npm run build

# Build affected projects
nx affected -t build

# Run fast quality gate for affected projects (pre-push standard)
nx affected -t test:quick

# Run unit tests for a specific project
nx run [project-name]:test:unit

# Lint all projects
npm run lint

# View dependency graph
npm run graph

# Build specific project
nx build [project-name]

# Start development server for an app
nx dev [app-name]
```

**See**: [Nx Target Standards](./governance/development/infra/nx-targets.md) for all canonical target names.

---

Thank you for contributing to Open Sharia Enterprise! Your contributions help build better, more secure enterprise solutions. 🚀
