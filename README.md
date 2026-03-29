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
- **Demo backends**: [`demo-be-golang-gin`](./apps/demo-be-golang-gin/), [`demo-be-java-springboot`](./apps/demo-be-java-springboot/), [`demo-be-elixir-phoenix`](./apps/demo-be-elixir-phoenix/), [`demo-be-fsharp-giraffe`](./apps/demo-be-fsharp-giraffe/), [`demo-be-python-fastapi`](./apps/demo-be-python-fastapi/), [`demo-be-rust-axum`](./apps/demo-be-rust-axum/), [`demo-be-kotlin-ktor`](./apps/demo-be-kotlin-ktor/), [`demo-be-java-vertx`](./apps/demo-be-java-vertx/), [`demo-be-ts-effect`](./apps/demo-be-ts-effect/), [`demo-be-csharp-aspnetcore`](./apps/demo-be-csharp-aspnetcore/), [`demo-be-clojure-pedestal`](./apps/demo-be-clojure-pedestal/)
- **Demo frontends**: [`demo-fe-ts-nextjs`](./apps/demo-fe-ts-nextjs/), [`demo-fe-ts-tanstack-start`](./apps/demo-fe-ts-tanstack-start/), [`demo-fe-dart-flutterweb`](./apps/demo-fe-dart-flutterweb/)

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

[![Main CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/main-ci.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/main-ci.yml)

All projects enforce ≥90% test coverage as part of `test:quick`. Coverage is uploaded to [Codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise) on every push to `main`.

**CI Schedule**: `test:quick` on every push/PR; per-service workflows run on a schedule.

- [`apps/oseplatform-web`](./apps/oseplatform-web/)
  - [![Deploy](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-oseplatform-web.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-oseplatform-web.yml)
- [`apps/ayokoding-web`](./apps/ayokoding-web/)
  - [![Deploy](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-ayokoding-web.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-ayokoding-web.yml)
- [`apps/organiclever-fe`](./apps/organiclever-fe/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-organiclever.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-organiclever.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=organiclever-fe)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/organiclever-be`](./apps/organiclever-be/)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=organiclever-be)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/rhino-cli`](./apps/rhino-cli/)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=rhino-cli)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/ayokoding-cli`](./apps/ayokoding-cli/)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=ayokoding-cli)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/oseplatform-cli`](./apps/oseplatform-cli/)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=oseplatform-cli)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)

### 🧪 Demo Backend Apps

CI and coverage status for demo backend implementations across multiple languages and frameworks:

- [`apps/demo-be-java-springboot`](./apps/demo-be-java-springboot/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-java-springboot.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-java-springboot.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-java-springboot)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-be-elixir-phoenix`](./apps/demo-be-elixir-phoenix/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-elixir-phoenix.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-elixir-phoenix.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-elixir-phoenix)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-be-fsharp-giraffe`](./apps/demo-be-fsharp-giraffe/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-fsharp-giraffe.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-fsharp-giraffe.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-fsharp-giraffe)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-be-golang-gin`](./apps/demo-be-golang-gin/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-golang-gin.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-golang-gin.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-golang-gin)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-be-python-fastapi`](./apps/demo-be-python-fastapi/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-python-fastapi.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-python-fastapi.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-python-fastapi)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-be-rust-axum`](./apps/demo-be-rust-axum/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-rust-axum.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-rust-axum.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-rust-axum)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-be-kotlin-ktor`](./apps/demo-be-kotlin-ktor/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-kotlin-ktor.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-kotlin-ktor.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-kotlin-ktor)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-be-java-vertx`](./apps/demo-be-java-vertx/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-java-vertx.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-java-vertx.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-java-vertx)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-be-ts-effect`](./apps/demo-be-ts-effect/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-ts-effect.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-ts-effect.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-ts-effect)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-be-csharp-aspnetcore`](./apps/demo-be-csharp-aspnetcore/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-csharp-aspnetcore.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-csharp-aspnetcore.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-csharp-aspnetcore)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-be-clojure-pedestal`](./apps/demo-be-clojure-pedestal/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-clojure-pedestal.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-be-clojure-pedestal.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-clojure-pedestal)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)

### 🖥️ Demo Frontend Apps

Frontend implementations consuming the demo-be API:

- [`apps/demo-fe-ts-nextjs`](./apps/demo-fe-ts-nextjs/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-fe-ts-nextjs.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-fe-ts-nextjs.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-fe-ts-nextjs)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-fe-ts-tanstack-start`](./apps/demo-fe-ts-tanstack-start/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-fe-ts-tanstack-start.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-fe-ts-tanstack-start.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-fe-ts-tanstack-start)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)
- [`apps/demo-fe-dart-flutterweb`](./apps/demo-fe-dart-flutterweb/)
  - [![CI](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-fe-dart-flutterweb.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-demo-fe-dart-flutterweb.yml)
  - [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-fe-dart-flutterweb)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)

## 📚 Documentation

Organized using the [Diátaxis framework](https://diataxis.fr/): [Tutorials](./docs/tutorials/) (learning), [How-To](./docs/how-to/) (problem-solving), [Reference](./docs/reference/) (lookup), [Explanation](./docs/explanation/) (understanding).

**Viewing Tip**: The `docs/` folder works as an [Obsidian](https://obsidian.md/) vault.

See [`docs/README.md`](./docs/README.md) for details.

## 🤝 Contributing

🔒 **Contributions are currently closed** while we stabilize the architecture and patterns.

🎉 **Forking is welcome!** Build your own version for your region or use case — once the foundation is solid, we'll open contributions to the community.

## 📜 License

**MIT License** - Complete freedom to use, modify, and distribute for any purpose including commercial projects, enterprise solutions, and education. No restrictions. See [LICENSE](./LICENSE) for details.
