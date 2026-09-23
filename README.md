# 🌙 Open Sharia Enterprise

Open Sharia Enterprise (OSE) is an open-source platform for researching and building trustworthy,
Sharia-compliant enterprise products. It exists for organizations that need business software whose
rules, decisions, and foundations can be examined rather than treated as a black box.

OSE is for product people exploring that problem and early-career engineers who want to see how a
product platform is being built. This is a pre-alpha repository: the architecture and APIs will
change as product, research, assurance, and platform work develops.

This is the active OSE product monorepo, not a generic project starter. It holds OSE product work,
its supporting research, and the governance and automation that carry them.

This repository is one of the **OSE Code Repositories**, the five repositories OSE is built and
maintained in. The other four have distinct roles: the private sibling holds authorized operations,
[RHINO](https://github.com/wahidyankf/rhino) supplies repository hygiene,
[HIPPO](https://github.com/wahidyankf/hippo) supplies resource coordination, and
[BeaverNest](https://github.com/wahidyankf/beaver-nest) is an independent family product. Each of
the five versions and releases on its own schedule; the name is navigation, not a shared release.

The [repository comparison](./docs/reference/related-repositories.md) says which repository answers
which question.

External contributions are currently closed while the project stabilizes its product and engineering
patterns.

Choose the path that fits what you need:

- [🧭 Understand the product](#-understand-the-product) if you are evaluating OSE, mapping its
  workstreams, or looking for the product context.
- [🧰 Run OSE locally](#-run-ose-locally) if you want to start the OSE Platform website on your
  machine.

## 🧭 Understand the product

OSE works toward enterprise systems that make Sharia compliance a design constraint from the start.
The repository brings together product delivery, Shariah and regulatory research, enterprise-domain
research, security and governance work, platform engineering, and public learning. Each stream moves
when its own evidence and dependencies are ready, not on one portfolio-wide stage.

The current product and public surfaces are:

- **OSE Platform** — the platform’s public website at [oseplatform.com](https://oseplatform.com).
- **OrganicLever** — an active local-first productivity product workstream, with a marketing site,
  web client, backend, and end-to-end tests.
- **AyoKoding** — public engineering research and learning drawn from work around the platform.

Start with the [development roadmap](./roadmap.md) for the workstreams and readiness model. Then
use the [application map](./docs/reference/system-architecture/applications.md) to see the current
software surfaces and their responsibilities.

### Where the work lives

OSE uses an [Nx](https://nx.dev/) monorepo: one repository that contains several independently
deployable applications and shared libraries while Nx coordinates their development tasks.

| Location                      | What you will find                                                         |
| ----------------------------- | -------------------------------------------------------------------------- |
| [`apps/`](./apps/README.md)   | Product apps, public sites, command-line tools, and end-to-end test suites |
| [`libs/`](./libs/README.md)   | Shared code used by applications                                           |
| [`docs/`](./docs/README.md)   | Tutorials, how-to guides, technical reference, and explanations            |
| [`specs/`](./specs/README.md) | Product and behaviour specifications                                       |
| [`plans/`](./plans/README.md) | Current and completed planning records                                     |

## 🧰 Run OSE locally

This first run starts `ose-www`, the OSE Platform website, at <http://localhost:3100> — a small,
visible way into the product that needs no knowledge of the other services.

Want a paced walkthrough with expected results and recovery steps? Follow
[Getting started with OSE Public](./docs/tutorials/getting-started-with-ose-public.md).

### Supported platforms and prerequisites

macOS and Ubuntu Linux are supported. The Linux steps may work in WSL2 (Windows Subsystem for
Linux 2), but WSL2 is neither supported nor verified by this project. Native Windows is not
supported.

Before installing dependencies, have these tools available:

- Git to clone the repository.
- [Volta](https://volta.sh/) to install the Node.js and npm versions pinned in
  [`package.json`](./package.json).
- The .NET SDK used by the repository's F# and C# projects.
- Rust (`rustfmt`) only when you edit Rust course content; no workspace project is written in Rust.
- Docker and `jq` only for container-based or broader local-tooling work. Neither is needed for the
  first `ose-www` website run.

Follow [Set up your development environment](./docs/how-to/setup-development-environment.md) for
macOS or Ubuntu installation commands and recovery steps for a missing tool.

### Clone and bootstrap

```bash
git clone https://github.com/wahidyankf/ose-public.git
cd ose-public
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
```

`./hippo` verifies the pinned upstream release before `npm install` installs dependencies, Git
hooks, and repository tooling. Follow the onboarding tutorial's focused check; install optional
tools only when your chosen work needs them. `npm run doctor` is a read-only check of every
declared toolchain and accepts no arguments. Only when it reports a missing or drifted toolchain,
provision the declared toolchains under a transactional reservation, then check again:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply
npm run doctor
```

When the focused check is green, run the public website. If Cargo, Volta, or another tool it names
is still missing, return to the
[setup guide](./docs/how-to/setup-development-environment.md) rather than bypassing the check.

### Find and run the first project

List the projects that Nx can run:

```bash
npm run nx:show -- projects
```

The list it prints includes `ose-www`, the public website. Start that one:

```bash
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev ose-www
```

Open <http://localhost:3100> when the development server reports that it is ready.

Already using port 3100? Point the site somewhere else instead of guessing which process to stop:

```bash
OSE_WWW_PORT=4000 ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev ose-www
```

Then open <http://localhost:4000> instead.

The [Nx command guide](./docs/how-to/run-nx-commands.md) explains project discovery and the other
targets you can run.

From there, read [how OSE applications fit together](./docs/reference/system-architecture/applications.md)
or explore the [OSE Platform app](./apps/ose-www/) itself.

## Project status

OSE is pre-alpha. Expect breaking changes, evolving architecture, and experimental implementations.
The project uses TypeScript and Next.js for web applications, F#, C#, Java, and Go for
backend and document-processing work, and pinned external releases of RHINO and HIPPO for repository tooling.
See the
[technology-stack reference](./docs/reference/system-architecture/technology-stack.md) for the
current technical picture.

## License

OSE is available under the [MIT License](./LICENSE). See the
[licensing notice](./LICENSING-NOTICE.md) for the repository-wide statement.
