# 🌙 Open Sharia Enterprise

✨ An enterprise solutions platform for Sharia-compliant business systems.

🌐 **Live Sites**:

- **OSE Platform** ([oseplatform.com](https://oseplatform.com)) - Main platform website (under construction)
- **AyoKoding** ([ayokoding.com](https://ayokoding.com)) - Shares the technological research and domain knowledge we develop for this project. What we learn while building Open Sharia Enterprise becomes accessible to the wider community through educational content
- **OrganicLever** ([organiclever.com](https://www.organiclever.com/)) - Landing and promotional website (Phase 1, in development)

## 🚧 Project Status

> ⚠️ **Phase 1 - In Development** - APIs and implementations may change significantly. **Contributions and pull requests are not being accepted** at this time.

**Current Phase: Phase 1 (OrganicLever - Productivity Tracker)**

Building OrganicLever, a full-stack individual productivity tracker:

- 🌐 **Landing site**: [organiclever.com](https://www.organiclever.com/) ([organiclever-web](./apps/organiclever-web/)) - Next.js promotional website
- 🐹 **Backend API**: Go/Gin REST API ([demo-be-golang-gin](./apps/demo-be-golang-gin/))
- ✅ **Phase 0 complete**: [ayokoding.com](https://ayokoding.com), [oseplatform.com](https://oseplatform.com), AI agents, governance, CLI tools

**Next Phase: Phase 2 (SMB Application)** - Small and medium business application building on OrganicLever's foundation.

**What to Expect:**

- 🔄 Breaking changes without notice
- 📐 Architecture still evolving
- 🧪 Experimental implementations

See **[ROADMAP.md](./ROADMAP.md)** for complete development phases and strategy.

## 🎯 Motivation

Our mission is to democratize access to trustworthy, Sharia-compliant enterprise technology for organizations of all sizes, regardless of region or industry.

**The Opportunity**: Islamic enterprise (finance, commerce, cooperatives, and beyond) represents a multi-trillion dollar global market, creating massive demand for Sharia-compliant business systems. While purpose-built platforms exist, they're typically proprietary, expensive, and limited to specific domains. Many organizations struggle with legacy systems retrofitted for Sharia compliance. The gap? Accessible, open-source solutions with built-in compliance and radical transparency—serving the entire spectrum of Islamic business needs.

**Our Solution**: We're building a global open-source platform with Sharia-compliance at its core—following a progressive complexity approach from individual users (Phase 1: OrganicLever productivity tracker) to SMB (Phase 2) to enterprise (Phase 3: full ERP and domain expansion). Each phase generates revenue to fund the next, with Phase 1/2 success funding Phase 3's significant certification budget. We're making trustworthy, transparent business systems accessible to any organization worldwide—regardless of size, region, or industry.

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
- Hugo (Extended) - Static sites (ayokoding-web, oseplatform-web)
- Golang - CLI tools ([ayokoding-cli](./apps/ayokoding-cli/), [rhino-cli](./apps/rhino-cli/)) and future security infrastructure

**Current Phase 1 (OrganicLever):**

- Backend: Go + Gin
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

**Applications** (`apps/`): [`oseplatform-web`](./apps/oseplatform-web/), [`ayokoding-web`](./apps/ayokoding-web/), [`ayokoding-cli`](./apps/ayokoding-cli/), [`rhino-cli`](./apps/rhino-cli/), [`oseplatform-cli`](./apps/oseplatform-cli/), [`organiclever-web`](./apps/organiclever-web/), [`organiclever-web-e2e`](./apps/organiclever-web-e2e/), [`demo-be-java-springboot`](./apps/demo-be-java-springboot/), [`demo-be-elixir-phoenix`](./apps/demo-be-elixir-phoenix/), [`demo-be-fsharp-giraffe`](./apps/demo-be-fsharp-giraffe/), [`demo-be-golang-gin`](./apps/demo-be-golang-gin/), [`demo-be-python-fastapi`](./apps/demo-be-python-fastapi/), [`demo-be-rust-axum`](./apps/demo-be-rust-axum/), [`demo-be-kotlin-ktor`](./apps/demo-be-kotlin-ktor/), [`demo-be-java-vertx`](./apps/demo-be-java-vertx/), [`demo-be-ts-effect`](./apps/demo-be-ts-effect/), [`demo-be-csharp-aspnetcore`](./apps/demo-be-csharp-aspnetcore/), [`demo-be-clojure-pedestal`](./apps/demo-be-clojure-pedestal/), [`demo-be-e2e`](./apps/demo-be-e2e/), [`demo-fe-ts-nextjs`](./apps/demo-fe-ts-nextjs/), [`demo-fe-ts-tanstackstart`](./apps/demo-fe-ts-tanstackstart/), [`demo-fe-ts-remix`](./apps/demo-fe-ts-remix/), [`demo-fe-dart-flutter`](./apps/demo-fe-dart-flutter/), [`demo-fe-elixir-phoenix`](./apps/demo-fe-elixir-phoenix/), [`demo-fe-e2e`](./apps/demo-fe-e2e/)

**Libraries** (`libs/`): Reusable shared code

**Labs** (`apps-labs/`): Experimental apps and POCs (`ayokoding-web__source-code`, `hello-rust-be`)

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

**CI Schedule**: `test:quick` runs on every push/PR. Per-service "Test Integration + E2E" workflows run 2x daily (WIB 06, 18).

| Project                                             | CI                                                                                                                                                                                                                                                                   | Coverage                                                                                                                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/oseplatform-web`](./apps/oseplatform-web/)   | [![Deploy](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-oseplatform-web.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-oseplatform-web.yml)                        | -                                                                                                                                                                    |
| [`apps/ayokoding-web`](./apps/ayokoding-web/)       | [![Deploy](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-ayokoding-web.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-and-deploy-ayokoding-web.yml)                            | -                                                                                                                                                                    |
| [`apps/organiclever-web`](./apps/organiclever-web/) | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-organiclever-web.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-organiclever-web.yml) | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=organiclever-web)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise) |
| [`apps/rhino-cli`](./apps/rhino-cli/)               | -                                                                                                                                                                                                                                                                    | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=rhino-cli)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)        |
| [`apps/ayokoding-cli`](./apps/ayokoding-cli/)       | -                                                                                                                                                                                                                                                                    | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=ayokoding-cli)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)    |
| [`apps/oseplatform-cli`](./apps/oseplatform-cli/)   | -                                                                                                                                                                                                                                                                    | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=oseplatform-cli)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)  |

### 🧪 Demo Backend Apps

Integration + E2E (2x daily) and coverage status for demo backend implementations across multiple languages and frameworks:

| Project                                                               | Integration + E2E (2x daily)                                                                                                                                                                                                                                                           | Coverage                                                                                                                                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/demo-be-java-springboot`](./apps/demo-be-java-springboot/)     | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-java-springboot.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-java-springboot.yml)     | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-java-springboot)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)   |
| [`apps/demo-be-elixir-phoenix`](./apps/demo-be-elixir-phoenix/)       | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-elixir-phoenix.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-elixir-phoenix.yml)       | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-elixir-phoenix)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)    |
| [`apps/demo-be-fsharp-giraffe`](./apps/demo-be-fsharp-giraffe/)       | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-fsharp-giraffe.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-fsharp-giraffe.yml)       | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-fsharp-giraffe)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)    |
| [`apps/demo-be-golang-gin`](./apps/demo-be-golang-gin/)               | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-golang-gin.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-golang-gin.yml)               | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-golang-gin)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)        |
| [`apps/demo-be-python-fastapi`](./apps/demo-be-python-fastapi/)       | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-python-fastapi.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-python-fastapi.yml)       | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-python-fastapi)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)    |
| [`apps/demo-be-rust-axum`](./apps/demo-be-rust-axum/)                 | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-rust-axum.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-rust-axum.yml)                 | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-rust-axum)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)         |
| [`apps/demo-be-kotlin-ktor`](./apps/demo-be-kotlin-ktor/)             | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-kotlin-ktor.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-kotlin-ktor.yml)             | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-kotlin-ktor)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)       |
| [`apps/demo-be-java-vertx`](./apps/demo-be-java-vertx/)               | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-java-vertx.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-java-vertx.yml)               | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-java-vertx)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)        |
| [`apps/demo-be-ts-effect`](./apps/demo-be-ts-effect/)                 | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-ts-effect.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-ts-effect.yml)                 | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-ts-effect)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)         |
| [`apps/demo-be-csharp-aspnetcore`](./apps/demo-be-csharp-aspnetcore/) | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-csharp-aspnetcore.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-csharp-aspnetcore.yml) | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-csharp-aspnetcore)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise) |
| [`apps/demo-be-clojure-pedestal`](./apps/demo-be-clojure-pedestal/)   | [![Integration + E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-clojure-pedestal.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/test-integration-e2e-demo-be-clojure-pedestal.yml)   | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-be-clojure-pedestal)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)  |

### 🖥️ Demo Frontend Apps

Five frontend implementations consuming the demo-be API, sharing 92 Gherkin scenarios across 15 feature files. E2E tests centralized in [`apps/demo-fe-e2e`](./apps/demo-fe-e2e/) (Playwright + playwright-bdd v8):

| Project                                                             | E2E (2x daily)                                                                                                                                                                                                                       | Coverage                                                                                                                                                                     |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/demo-fe-ts-nextjs`](./apps/demo-fe-ts-nextjs/)               | [![E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/e2e-demo-fe-ts-nextjs.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/e2e-demo-fe-ts-nextjs.yml)               | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-fe-ts-nextjs)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)        |
| [`apps/demo-fe-ts-tanstackstart`](./apps/demo-fe-ts-tanstackstart/) | [![E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/e2e-demo-fe-ts-tanstackstart.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/e2e-demo-fe-ts-tanstackstart.yml) | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-fe-ts-tanstackstart)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise) |
| [`apps/demo-fe-ts-remix`](./apps/demo-fe-ts-remix/)                 | [![E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/e2e-demo-fe-ts-remix.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/e2e-demo-fe-ts-remix.yml)                 | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-fe-ts-remix)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)         |
| [`apps/demo-fe-dart-flutter`](./apps/demo-fe-dart-flutter/)         | [![E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/e2e-demo-fe-dart-flutter.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/e2e-demo-fe-dart-flutter.yml)         | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-fe-dart-flutter)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)     |
| [`apps/demo-fe-elixir-phoenix`](./apps/demo-fe-elixir-phoenix/)     | [![E2E](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/e2e-demo-fe-elixir-phoenix.yml/badge.svg)](https://github.com/wahidyankf/open-sharia-enterprise/actions/workflows/e2e-demo-fe-elixir-phoenix.yml)     | [![codecov](https://codecov.io/gh/wahidyankf/open-sharia-enterprise/graph/badge.svg?flag=demo-fe-elixir-phoenix)](https://codecov.io/gh/wahidyankf/open-sharia-enterprise)   |

## 📚 Documentation

Organized using the [Diátaxis framework](https://diataxis.fr/): [Tutorials](./docs/tutorials/) (learning), [How-To](./docs/how-to/) (problem-solving), [Reference](./docs/reference/) (lookup), [Explanation](./docs/explanation/) (understanding).

**Viewing Tip**: The `docs/` folder works as an [Obsidian](https://obsidian.md/) vault.

See [`docs/README.md`](./docs/README.md) for details.

## 🤝 Contributing

🔒 **Contributions are currently closed** until the project patterns and architecture are stable enough to accept external contributions. This ensures we maintain code quality and regulatory compliance as we build the foundation.

However, 🎉 **you are welcome to fork this repository!** Feel free to:

- 🍴 Create your own fork for your region or use case
- 🧪 Experiment with extensions and modifications
- 🏗️ Build upon this project for your specific needs
- 📤 Share your improvements with the community

✨ Once the core patterns are established and the project is mature enough, we will open the contribution process. We look forward to collaborating with the community in the future!

## 📜 License

**MIT License** - Complete freedom to use, modify, and distribute for any purpose including commercial projects, enterprise solutions, and education. No restrictions. See [LICENSE](./LICENSE) for details.
