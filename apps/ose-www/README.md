# OSE Platform website

`ose-www` is the public website for Open Sharia Enterprise (OSE), available at
[oseplatform.com](https://oseplatform.com). It gives product people and early engineers a clear
starting point for understanding OSE: why trustworthy, Sharia-compliant enterprise products need
to be designed as inspectable systems, what the platform is exploring, and how that work is
developing.

OSE is pre-alpha. The product direction, technical architecture, and public APIs can change as the
team learns. For the wider product context, see the repository
[roadmap](../../roadmap.md) and [application map](../../docs/reference/system-architecture/applications.md).

## What the site provides

- A public introduction to the OSE Platform and its product intent.
- An About page that explains the problem space and current approach.
- A chronological updates section, plus an RSS feed, for published progress and decisions.
- Search across the site's Markdown content.

The site is a Next.js 16 application using the App Router, TypeScript, Tailwind CSS, tRPC, and
Markdown content stored in this app. Its feature modules keep decision-making code in `core/` and
framework or IO work in `shell/`.

## Run locally

From the repository root, install the workspace dependencies and start the site:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-www:dev
```

Open <http://localhost:3100>. The development server uses port 3100 unless `OSE_WWW_PORT` names
another one. No local configuration is required for the standard site; that variable and the other
optional content and development-server settings are documented in
[.env.example](./.env.example).

For supported platforms, prerequisites, and recovery steps, follow
[Getting started with OSE Public](../../docs/tutorials/getting-started-with-ose-public.md).

## Publish or revise site content

The public pages and updates live in [`content/`](./content/). Update Markdown there to change
what the website publishes:

- `about.md` supplies the About page.
- `updates/_index.md` supplies the updates landing page.
- `updates/<date>-<slug>.md` supplies an individual update.

Each content file uses YAML frontmatter. `title` is required; `description`, `summary`, `date`,
`tags`, `categories`, `draft`, `weight`, `showtoc`, and `url` are supported when applicable. Build
the site after a content change to regenerate its search data and check the rendered result.

## Develop and verify

Run these commands from the repository root:

```bash
# Create the production build (also regenerates search data)
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-www:build

# Run the focused quality gate: typecheck, lint, unit tests, coverage, and spec checks
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-www:test:quick

# Run the unit suite only
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-www:test:unit

# Run the deterministic local-filesystem Integration suite manually
npm exec nx -- run ose-www:test:integration

# Run the website's companion frontend E2E suite
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-www-fe-e2e:test:e2e
```

The Unit runtime enforces 99% line coverage. Static `test:coverage:*` targets check the Gherkin
scenario-to-adapter mapping without running tests and are mandatory in `test:quick`.
`ose-www:test:integration` exercises the real content filesystem and prebuilt search-index paths
with isolated synthetic fixtures; it remains manual-impacted and scheduled-full, never part of
hooks or PR CI.

## Project layout

```text
apps/ose-www/
├── content/       # Public Markdown pages and updates
├── public/        # Static site assets
├── src/app/       # Thin Next.js routes
├── src/features/  # Product features, organized into core/ and shell/
├── tests/unit/    # Mandatory in-process Unit adapters
├── tests/integration/ # Local-filesystem Integration adapters
├── tests/e2e-fixtures/ # Synthetic content shared with public-boundary tests
└── project.json   # Nx targets for development, build, and verification
```

The behaviour specifications that describe the web and tRPC perspectives are in
[specs/apps/ose](../../specs/apps/ose/).

## Production delivery

The production site runs on Vercel at <https://oseplatform.com>. A GitHub Actions workflow runs the
website quality gates and E2E checks; when `apps/ose-www/` has changed and the gates pass, it
updates the `prod-ose-www` deployment branch. Vercel builds only from that branch.

Deployment is automated. Do not manually push to `prod-ose-www`; see the
[production workflow](../../.github/workflows/ose-www-test-local-deploy-prod.yml) and
[deployment reference](../../docs/reference/system-architecture/deployment.md) for the current
delivery path.

## Related references

- [Repository onboarding tutorial](../../docs/tutorials/getting-started-with-ose-public.md)
- [OSE specifications](../../specs/apps/ose/README.md)
- [Application architecture](../../docs/reference/system-architecture/applications.md)

## BDD and Testing

The canonical corpus is `specs/apps/ose/www/behaviours/`. This project owns mandatory Unit proof
through `test:unit` and deterministic local-resource proof through `test:integration`.
`ose-www-fe-e2e:test:e2e` and `ose-www-be-e2e:test:e2e` own the public browser and HTTP boundaries.
Matching `test:coverage:*` targets validate every applicable adapter or explicit boundary exemption
statically. The owner omits only a local `test:e2e` runtime because dedicated projects own that
public-boundary execution.
