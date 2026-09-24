# Contributing to Open Sharia Enterprise

Thank you for your interest in Open Sharia Enterprise. This repository is in pre-alpha while we
stabilize its architecture and working patterns, so external code contributions and pull requests
are currently closed. Forking is welcome under the [MIT License](./LICENSE): you are free to adapt
the project for your own region or use case.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Repository Development](#repository-development)
- [Code Conventions](#code-conventions)
- [Testing](#testing)
- [External Contributions](#external-contributions)
- [Reporting Bugs](#reporting-bugs)
- [Product Feedback](#product-feedback)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

## Code of Conduct

We expect everyone taking part here — in issues, discussions, and reviews — to be respectful and
free of harassment. This repository has not yet published a root `CODE_OF_CONDUCT.md`; until it
does, treat the standard above as the rule rather than assuming a separate document covers it.

## Getting Started

Open Sharia Enterprise is an enterprise platform built with Node.js and organized as an Nx monorepo:
one repository holding several independently deployable applications and shared libraries, with
[Nx](https://nx.dev/) coordinating their build and test tasks.
The steps below describe how the maintainers work; they are not an invitation to open a pull
request, because [external contributions are closed](#external-contributions). If you are exploring
the project or preparing a fork, please:

1. Read this contributing guide completely
2. Review our [documentation](./docs/README.md)
3. Understand our [commit message conventions](./repo-governance/development/workflow/commit-messages.md)
4. Familiarize yourself with [Trunk Based Development](./repo-governance/development/workflow/trunk-based-development.md)

## Development Setup

### Prerequisites

Install both toolchains before you bootstrap:

- **Volta**, which selects the Node.js and npm versions pinned in `package.json` — so you do not
  install either separately. Read the versions from that file rather than from a list here, so the
  two can never drift apart.
- **Rust and Cargo**. The repository's tool checker is a Rust command-line application that
  `npm install` runs as a postinstall step. That step discards the checker's exit code, so without
  Cargo the check runs, prints `cargo: command not found`, and fails — while `npm install` still
  reports success and your toolchain goes unverified. The Git hooks are not so forgiving: they build
  the same binary and keep its exit code, so your first `git commit` stops outright. Install Rust
  with rustup as described in
  [Set up your development environment](./docs/how-to/setup-development-environment.md).

#### Installing Volta

macOS and Ubuntu Linux are the supported platforms. The Linux steps may work in WSL2 (Windows
Subsystem for Linux 2), but WSL2 is neither supported nor verified by this project. Native Windows
is not supported.

If you don't have Volta installed, run:

```bash
curl https://get.volta.sh | bash
```

Restart your terminal afterwards — the installer edits your shell profile, and the shell you ran it
from has not read the change yet.

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

   This installs the dependency tree, runs the toolchain checker, and sets up the Git hooks. Expect
   it to take a few minutes on a cold cache.

3. **Verify installation**:

   ```bash
   npm run graph
   ```

   This should open the Nx dependency graph in your browser, confirming that the setup is working.

### Common Setup Issues

**Issue**: your shell cannot find `volta`
**Solution**: Make sure Volta is installed and your terminal is restarted.

**Issue**: Wrong Node.js version
**Solution**: Run `volta install node@$(node -p "require('./package.json').volta.node")` so Volta
installs the version this checkout pins, rather than a version copied from these instructions.

**Issue**: `npm install` prints `cargo: command not found` but reports success
**Solution**: Install Rust. The postinstall step runs the Rust-built tool checker but discards its
exit code, so a missing Cargo does not stop the install — it prints that one line and continues,
and your toolchain goes unchecked. It stops being ignorable at your first `npm run doctor`, and at
your first `git commit` or `git push`, because the hooks build the same binary and keep its exit
code. Follow
[Set up your development environment](./docs/how-to/setup-development-environment.md), reopen the
terminal, then rerun `npm install`.

**Issue**: `npm install` fails outright
**Solution**: Clear npm cache with `npm cache clean --force` and try again.

## Project Structure

This is an **Nx monorepo** with the following structure:

```
ose-public/
├── apps/           # Deployable applications
│   └── [app-name]/ # Individual apps
├── libs/           # Reusable libraries
│   └── ts-[name]/  # TypeScript libraries (language-prefixed)
├── docs/           # Documentation, in the four Diátaxis categories below
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

## Repository Development

### Internal AI-Assisted Delivery

The repository uses [Trunk Based Development](./repo-governance/development/workflow/trunk-based-development.md).
For internal AI-assisted plan work, the repo-wide default delivery mode is `worktree-to-pr`:

1. Work happens on a short-lived plan branch in a disposable Git worktree.
2. The branch is pushed to a draft pull request targeting `main`.
3. The AI runs the configured PR review-maker/fixer cycle and required quality gates.
4. Once its done-definition is met, the AI marks the PR ready for review.
5. A merge occurs only after the repository's hardened merge preconditions hold; AI merges by
   default unless the plan explicitly requires a human merge gate.

This is an internal delivery process, not an invitation to submit external pull requests. The
[PR Merge Protocol](./repo-governance/development/workflow/pr-merge-protocol.md) defines the
required review, quality, branch-freshness, and testing conditions for a merge.

### Working in Your Fork

You may use this guide and the repository's documentation when working in your own fork. Your fork
is independent: choose the workflow, branch protections, review process, and deployment approach
that fit your project.

### Local Development Workflow

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
   npm exec nx -- affected -t test:quick
   ```

   Every affected project should report success. When one fails, Nx names the project and the
   target it failed on — rerun that one alone with `npm exec nx -- run <project>:test:quick` to see
   the full output without the other projects' noise.

4. **Run affected build**:

   ```bash
   npm exec nx -- affected -t build
   ```

   Each affected project should build without error, and Nx prints a cached-or-rebuilt line for
   every one. A failure here after a green quality gate usually means a type or import error the
   unit tests never exercised — read the first error, not the last, since the rest are typically
   fallout.

5. **Format code** (automatic on commit):

   ```bash
   npx prettier --write .
   ```

   This rewrites files in place and prints a line for every file it reads — a file it left alone is
   tagged `(unchanged)`, and a file it reformatted is not. So a run with no untagged lines means
   nothing needed reformatting. The pre-commit hook runs the same formatter over your staged files,
   so skipping this step costs you nothing but a surprise at commit time.

## Code Conventions

### Commit Messages

**All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format**:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Valid types**: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`,
`style`, `test`

**Examples**:

```bash
feat(auth): add JWT authentication
fix(api): prevent race condition in order processing
docs(readme): update installation instructions
refactor(utils): simplify date formatting logic
```

**Important rules**:

- Aim for a first line of 50 characters or fewer, so `git log --oneline` stays readable
- Use imperative mood ("add" not "added")
- Type and description are required
- Scope is optional but recommended

No hook or CI step checks this format; reviewers do. `commitlint.config.js` lets you check a message
on demand, and its header limit is 100 characters, not 50. Treat 50 as the target you write to and
100 as the hard ceiling. For complete details, see [Commit Message Convention](./repo-governance/development/workflow/commit-messages.md).

### Commit Granularity

**Split work into multiple logical commits**:

- **Split by type**: Different commit types (`feat`, `docs`, `refactor`) should be separate
- **Split by domain**: Changes to different parts of the codebase should be separate
- **Atomic commits**: Each commit should be self-contained and reversible

**Good example**:

```bash
git commit -m "feat(agents): add docs-link-checker agent"
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
- **Naming**: name a thing for what it does, not for what it is — `resolvePort`, not `portUtil`
- **Comments**: Explain "why", not "what" (code should be self-documenting)

### File Naming

- **Apps**: `[domain]-[type]` (e.g., `api-gateway`, `admin-dashboard`)
- **Libs**: `ts-[name]` (e.g., `ts-utils`, `ts-components`)
- **Documentation**: Follow [File Naming Convention](./repo-governance/conventions/structure/file-naming.md)

## Testing

### Running Tests

**Fast quality gate for affected projects** (recommended for pre-push):

```bash
npm exec nx -- affected -t test:quick
```

**Specific project quality gate**:

```bash
npm exec nx -- run [project-name]:test:quick
```

**Isolated unit tests for a specific project**:

```bash
npm exec nx -- run [project-name]:test:unit
```

**See**: [Nx Target Standards](./repo-governance/development/infra/nx-targets.md) for canonical target names, test composition rules, and the full execution model.

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

## External Contributions

External code contributions and pull requests are not being accepted at this time. Please do not
open a pull request against this repository, including from a fork.

You are welcome to fork the repository and build on it under the [MIT License](./LICENSE). If you
find a problem or have an idea, the feedback channels below remain the best way to share it without
opening a contribution PR.

## Reporting Bugs

### Before Reporting

1. **Search the existing issues** — someone may have filed the same thing already, and the
   discussion there is often faster than a fresh report.
2. **Update to the latest `main`** and try again, in case the fix has already landed.
3. **Check the documentation** — if a command behaved differently from what a page told you to
   expect, say which page, because that makes the report actionable either way.

### Bug Report Template

When opening an issue, include:

- **Description**: what broke, in one or two sentences
- **Steps to reproduce**: the exact commands or clicks, numbered, starting from a clean checkout
- **Expected behaviour**: what the documentation or the command's own output led you to expect
- **Actual behaviour**: what happened instead, quoted rather than paraphrased
- **Environment**: OS, Node.js version, browser (if applicable)
- **Logs/screenshots**: the error text itself, pasted rather than described, and a picture only
  where the problem is visual

## Product Feedback

This repository does not currently run a public feature-request or discussion channel. You are
welcome to explore an idea in your own MIT-licensed fork, but please do not open a feature request
or contribution pull request expecting project intake.

## Documentation

When maintaining a fork or doing internal work:

- **Update docs** if your changes affect user-facing behaviour
- **Follow Diátaxis**: a documentation taxonomy that sorts every page into one of four categories —
  tutorial, how-to, reference, or explanation. Write each page as exactly one of them.
- **Follow conventions**: See [Documentation Standards](./repo-governance/conventions/README.md)

### Documentation Structure

- `docs/tutorials/` - Learning-oriented guides
- `docs/how-to/` - Problem-solving guides
- `docs/reference/` - Technical reference
- `docs/explanation/` - Conceptual documentation

## Getting Help

### Questions

The project does not currently host public Discussions or real-time support. Start with the
[documentation hub](./docs/README.md); an independent fork is the appropriate place to experiment
with a workflow or feature idea.

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
npm exec nx -- affected -t build

# Run fast quality gate for affected projects (pre-push standard)
npm exec nx -- affected -t test:quick

# Run unit tests for a specific project
npm exec nx -- run [project-name]:test:unit

# Lint all projects
npm run lint

# View dependency graph
npm run graph

# Build specific project
npm exec nx -- build [project-name]

# Start development server for an app
npm exec nx -- dev [app-name]
```

**See**: [Nx Target Standards](./repo-governance/development/infra/nx-targets.md) for all canonical target names.

---

Thank you for respecting Open Sharia Enterprise's current intake boundary.

**Where to go next.** If you are here to run the project, start with
[Getting started with OSE Public](./docs/tutorials/getting-started-with-ose-public.md). If you are
here to understand it, start with the [development roadmap](./roadmap.md).
