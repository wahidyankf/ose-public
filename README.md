# 🌙 Open Sharia Enterprise

✨ An enterprise solutions platform for Sharia-compliant business systems.

🌐 **Live Sites**:

- **OSE Platform** ([oseplatform.com](https://oseplatform.com)) - Main platform website (under construction)
- **AyoKoding** ([ayokoding.com](https://ayokoding.com)) - Engineering research and learnings from this project, shared publicly as educational content
- **OrganicLever** ([organiclever.com](https://www.organiclever.com/)) - Landing and promotional website (Phase 1, in development)

## 🚧 Project Status

> ⚠️ **Phase 1 - In Development** - APIs and implementations may change significantly. **Contributions and pull requests are not being accepted** at this time.

**Current Phase: Phase 1 (OrganicLever - Productivity Tracker)**

Building OrganicLever, a full-stack individual productivity tracker:

- 🌐 **Landing site**: [organiclever.com](https://www.organiclever.com/) ([organiclever-fe](./apps/organiclever-fe/)) - Next.js promotional website
- ✅ **Phase 0 complete**: [ayokoding.com](https://ayokoding.com), [oseplatform.com](https://oseplatform.com), AI agents, governance, CLI tools

**Next Phase: Phase 2 (SMB Application)** - Small and medium business application building on OrganicLever's foundation.

**What to Expect:**

- 🔄 Breaking changes without notice
- 📐 Architecture still evolving
- 🧪 Experimental implementations

See **[ROADMAP.md](./ROADMAP.md)** for complete development phases and strategy.

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js** 24.13.1 LTS & **npm** 11.10.1 (managed via [Volta](https://docs.volta.sh/guide/getting-started))

### 📥 Installation

```bash
npm install
```

## 🛠️ Tech Stack

**Guiding Principle**: Technologies that keep you free - open formats, portable data, no vendor lock-in.

**Phase 0 (Complete):**

- Node.js & npm (via Volta) - Tooling and development infrastructure
- Hugo (Extended) - Static sites (oseplatform-web)
- Golang - CLI tools ([ayokoding-cli](./apps/ayokoding-cli/), [rhino-cli](./apps/rhino-cli/)) and future security infrastructure

**Current Phase 1 (OrganicLever):**

- Frontend (landing): Next.js + TypeScript
- Infrastructure: Kubernetes

See **[ROADMAP.md](./ROADMAP.md)** for complete tech stack evolution across all phases.

## 📂 Project Structure

This project uses **Nx** to manage applications and libraries:

```
open-sharia-enterprise/
├── apps/                  # Deployable applications (Nx monorepo)
├── apps-labs/             # Experimental apps and POCs (NOT in Nx monorepo)
│   └── README.md          # Labs directory documentation
├── libs/                  # Reusable libraries (Nx monorepo, flat structure)
├── docs/                  # Project documentation (Diataxis framework)
│   ├── tutorials/         # Learning-oriented guides
│   ├── how-to/            # Problem-oriented guides
│   ├── reference/         # Technical reference
│   └── explanation/       # Conceptual documentation
├── plans/                 # Project planning documents
│   ├── in-progress/       # Active project plans
│   ├── backlog/           # Planned projects for future
│   └── done/              # Completed and archived plans
├── nx.json                # Nx workspace configuration
├── tsconfig.base.json     # Base TypeScript configuration
├── package.json           # Project manifest with npm workspaces
└── README.md              # This file
```

**Applications** (`apps/`):

- **Sites**: [`oseplatform-web`](./apps/oseplatform-web/), [`ayokoding-web`](./apps/ayokoding-web/), [`organiclever-fe`](./apps/organiclever-fe/), [`organiclever-be`](./apps/organiclever-be/), [`organiclever-fe-e2e`](./apps/organiclever-fe-e2e/), [`organiclever-be-e2e`](./apps/organiclever-be-e2e/)
- **CLI tools**: [`ayokoding-cli`](./apps/ayokoding-cli/), [`rhino-cli`](./apps/rhino-cli/), [`oseplatform-cli`](./apps/oseplatform-cli/)
- **Demo apps**: 11 backend implementations (Go, Java, Elixir, F#, Python, Rust, Kotlin, TypeScript, C#, Clojure) + 3 frontends (Next.js, TanStack Start, Flutter Web) — see [Demo Apps CI & Coverage](./docs/reference/re__demo-apps-ci-coverage.md)

**Libraries** (`libs/`): Reusable shared code

**Labs** (`apps-labs/`): Standalone experiments and POCs (outside Nx)

**Learn More**: [Monorepo Structure Reference](./docs/reference/re__monorepo-structure.md) | [How to Add New App](./docs/how-to/hoto__add-new-app.md) | [How to Add New Library](./docs/how-to/hoto__add-new-lib.md) | [How to Run Nx Commands](./docs/how-to/hoto__run-nx-commands.md)

## 💻 Development

**Code Quality**: Automated checks run on every commit (Prettier formatting, Commitlint validation, markdown linting).

**Common Commands**:

```bash
npm run build                    # Build all projects
npm run test                     # Run tests
npm run lint                     # Lint code
nx dev [app-name]                # Start development server
nx build [app-name]              # Build specific project
nx affected -t build             # Build only affected projects
nx affected -t test:quick        # Run fast quality gate for affected projects
nx graph                         # Visualize dependencies
```

See [Code Quality](./governance/development/quality/code.md) and [Commit Messages](./governance/development/workflow/commit-messages.md) for details.

## 📊 CI & Test Coverage

All projects enforce ≥90% test coverage as part of `test:quick`. Coverage is uploaded to [Codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise) on every push to `main`.

**Quality gates**: pre-commit hooks (formatting, linting), pre-push hooks (`typecheck`, `lint`, `test:quick` for affected projects), [PR Quality Gate](./.github/workflows/pr-quality-gate.yml), and [Codecov Upload](./.github/workflows/codecov-upload.yml) on push to `main`.

- OSE Platform
  - [![Deploy](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-oseplatform-web.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-oseplatform-web.yml)
  - [`oseplatform-web`](./apps/oseplatform-web/) [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=oseplatform-web)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
  - [`oseplatform-cli`](./apps/oseplatform-cli/) [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=oseplatform-cli)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- AyoKoding
  - [![Deploy](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-ayokoding-web.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-ayokoding-web.yml)
  - [`ayokoding-web`](./apps/ayokoding-web/) [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=ayokoding-web)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
  - [`ayokoding-cli`](./apps/ayokoding-cli/) [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=ayokoding-cli)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- OrganicLever
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-organiclever.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-organiclever.yml)
  - [`organiclever-fe`](./apps/organiclever-fe/) [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=organiclever-fe)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
  - [`organiclever-be`](./apps/organiclever-be/) [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=organiclever-be)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`rhino-cli`](./apps/rhino-cli/)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=rhino-cli)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)

For demo app CI badges, see [Demo Apps CI & Coverage](./docs/reference/re__demo-apps-ci-coverage.md).

## 📚 Documentation

Organized using the [Diátaxis framework](https://diataxis.fr/): [Tutorials](./docs/tutorials/) (learning), [How-To](./docs/how-to/) (problem-solving), [Reference](./docs/reference/) (lookup), [Explanation](./docs/explanation/) (understanding).

**Viewing Tip**: The `docs/` folder works as an [Obsidian](https://obsidian.md/) vault.

See [`docs/README.md`](./docs/README.md) for details.

## 🎯 Motivation

Our mission is to democratize access to trustworthy, Sharia-compliant enterprise technology for organizations of all sizes, regardless of region or industry.

**The Opportunity:**

- Islamic enterprise (finance, commerce, cooperatives) is a multi-trillion dollar global market
- Existing platforms are proprietary, expensive, and domain-limited
- Most organizations rely on legacy systems retrofitted for Sharia compliance
- The gap: open-source, compliance-first solutions with radical transparency

**Our Solution:**

- Progressive complexity: individual (Phase 1) → SMB (Phase 2) → enterprise (Phase 3)
- Each phase funds the next; Phase 1/2 success funds Phase 3's certification budget
- Sharia-compliance built in from the ground up, not bolted on after

**What We Believe:**

- 🕌 **Sharia-compliance as a foundation** - Built in from the ground up, not bolted on later
- 🔓 **Transparency builds trust** - Open source code enables community verification of Sharia compliance
- 🤖 **AI-assisted development** - Systematic use of AI tools to enhance productivity and code quality
- 🛡️ **Security and governance from day one** - Architectural foundations, not afterthoughts
- 📚 **Learning in public** - Share our research and knowledge through [ayokoding.com](https://ayokoding.com)
- 🏗️ **Long-term foundation over quick wins** - Building solid foundations for a life-long project

For complete principles, see [governance/principles/](./governance/principles/README.md).

## 🤝 Contributing

🔒 **Contributions are currently closed** while we stabilize the architecture and patterns.

🎉 **Forking is welcome!** Build your own version for your region or use case — once the foundation is solid, we'll open contributions to the community.

## 📜 License

This repository uses **per-directory licensing** guided by: implementation code (HOW) can be MIT;
behavioral specifications (WHAT) must be FSL to prevent clean-room engineering of competing products.

- **Product apps and behavioral specs** ([FSL-1.1-MIT](./LICENSE)): Product apps, `specs/`, and
  E2E test suites (including `a-demo-be-e2e`, `a-demo-fe-e2e`) are FSL-licensed. Each product
  app scopes the competing-use restriction to its domain
- **Shared libraries and demo implementation code** ([MIT](./libs/golang-commons/LICENSE)): All
  `libs/` and `apps/a-demo-*` implementation directories (excluding `*-e2e`) are MIT-licensed

The FSL-1.1-MIT license converts to MIT on a **rolling per-version basis**: each commit becomes
MIT-licensed 2 years after its first public distribution.

See [LICENSING-NOTICE.md](./LICENSING-NOTICE.md) for full details |
[LICENSE](./LICENSE) for the root license text |
[Licensing Convention](./governance/conventions/structure/licensing.md) for internal rules.
