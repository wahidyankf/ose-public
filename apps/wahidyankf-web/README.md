# wahidyankf-web

Personal portfolio / CV / projects site for Wahidyan Kresna Fridayoka.
Adopted from [`wahidyankf/oss / apps-standalone/wahidyankf-web`](https://github.com/wahidyankf/oss/tree/main/apps-standalone/wahidyankf-web)
in 2026-04 and retrofitted to the `ose-public` Nx monorepo conventions.

**Framework**: Next.js 16 (App Router) · React 19 · Tailwind CSS 4
**Language**: TypeScript
**Deployment**: Vercel via `prod-wahidyankf-web` branch
**Production domain**: <https://www.wahidyankf.com/>
**Dev port**: 3201

## Development

```bash
# Start the dev server (localhost:3201)
nx dev wahidyankf-web

# Production build
nx build wahidyankf-web

# Local production preview
nx start wahidyankf-web
```

## Quality gates

```bash
# Type check only
nx run wahidyankf-web:typecheck

# oxlint + jsx-a11y
nx run wahidyankf-web:lint

# Unit tests (Vitest 4, jsdom)
nx run wahidyankf-web:test:unit

# Fast pre-push gate (unit + coverage ≥80% via rhino-cli)
nx run wahidyankf-web:test:quick

# Integration tests (node environment; empty at adoption time)
nx run wahidyankf-web:test:integration

# Gherkin spec coverage check
nx run wahidyankf-web:spec-coverage
```

## Testing stack

- **Vitest 4** + `@vitejs/plugin-react` + `jsdom` for unit tests
- **`@amiceli/vitest-cucumber`** for Gherkin acceptance specs at the unit
  level (feature files under `specs/apps/wahidyankf/fe/gherkin/`)
- **`@testing-library/react`** + **`@testing-library/jest-dom`** for
  component interaction
- Coverage enforced at ≥80% via `rhino-cli test-coverage validate` —
  aligned to `apps/ayokoding-web` and `apps/oseplatform-web`

End-to-end tests live in the sibling project `apps/wahidyankf-web-e2e/`
(lands in P4 of the adoption plan) using Playwright-BDD and
`@axe-core/playwright` for WCAG 2.1 AA smoke.

## Deployment

`prod-wahidyankf-web` branch receives force-pushes from `main` via the
`apps-wahidyankf-web-deployer` agent. Vercel watches the branch and
rebuilds on every push. The scheduled CI workflow
(`.github/workflows/test-and-deploy-wahidyankf-web.yml`, lands in P6)
runs quality gates and invokes the deployer.

## Structure

```
apps/wahidyankf-web/
├── public/                   # Static assets (favicon, fonts)
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── cv/page.tsx       # Curriculum vitae
│   │   ├── personal-projects/page.tsx
│   │   ├── fonts/            # GeistVF, GeistMonoVF woff
│   │   ├── data.ts           # Portfolio content data
│   │   ├── layout.tsx
│   │   ├── head.tsx
│   │   ├── page.tsx          # Home
│   │   └── globals.css       # Tailwind 4 entry
│   ├── components/           # React components
│   ├── utils/                # Pure helpers (search, markdown, style)
│   └── test/setup.ts         # Vitest + Testing Library setup
└── test/unit/steps/          # Gherkin step implementations
```
