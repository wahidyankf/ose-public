# BRD — Adopt wahidyankf-web

## Business Goal and Rationale

Fold the maintainer's personal portfolio site (`wahidyankf-web`) — currently
living standalone in `wahidyankf/oss` — into `ose-public` so it runs under
the same monorepo quality gates, CI pipeline, Vercel deploy mechanism,
and AI-agent content toolchain used by `ayokoding-web`, `oseplatform-web`,
and `organiclever-fe`.

The site is a recruiter-facing portfolio and an evolving demo surface for
the maintainer's public-facing engineering output. Four concrete business
drivers sit behind the adoption:

1. **Toolchain consolidation.** Keeping the portfolio on a stale Next.js 14
   - React 18 + Tailwind 3 + Vitest 0.31 stack in a separate repo means the
     maintainer spends time on two divergent toolchains instead of one;
     content maker / checker / fixer agents configured for `ose-public`
     cannot reach the portfolio; security fixes, dependency upgrades, and
     cross-site CVE remediation happen twice (or, more typically, on a lag).
     Adoption collapses both toolchains into one and places the portfolio
     behind the same `typecheck / lint / test:quick / spec-coverage` pre-push
     gate and `prod-<app>-web`-driven Vercel pipeline that every other web
     app in this repo uses.
2. **Future home for a personal journal.** Post-adoption, the site becomes
   the natural container for a personal journal (short engineering
   reflections, project updates, field notes). The journal itself is out of
   scope for this plan; the adoption sets up the scaffolding that a
   follow-up journal plan will consume. Handling the journal in a later
   plan keeps this plan's delivery scope tight and lets the journal's
   content strategy be designed against the adopted code rather than in the
   abstract.
3. **Marketing and branding for `ose-public`.** `ose-public` is currently
   a one-maintainer project. Hosting the maintainer's public portfolio
   inside the same monorepo gives the project a credible public face,
   aligns the portfolio's engineering standards with the monorepo's, and
   lets visitors link from the portfolio back to the repository as
   proof-of-work for the broader platform.
4. **Reusable template for portfolio builders.** Once adopted,
   `apps/wahidyankf-web/` is a reference implementation of a
   production-grade personal portfolio on Next.js 16 + React 19 + Tailwind
   4 + Vitest 4, complete with Playwright-BDD E2E, axe-core accessibility
   checks, `rhino-cli` coverage validation, oxlint jsx-a11y, Gherkin
   specs, and a Vercel production-branch deploy pipeline. External users
   adopting `ose-public` as a template can fork this app as a starting
   point for their own portfolio.

## Business Impact

**Pain points relieved**:

- Eliminate a second repo whose CI, hooks, and deployment settings drift
  from `ose-public`'s.
- Eliminate the gap between the maintainer's stated engineering standards
  (repo conventions) and the state of a publicly-visible portfolio that
  recruiters and collaborators read as a proof-of-work signal.
- Remove the manual upgrade tax of tracking Next/React/Tailwind/Vitest
  majors in a second place.
- Unblock the follow-up journal initiative — without this adoption, a
  journal either lives on the stale external repo or needs a fresh app
  scaffold.

**Expected benefits**:

- Portfolio site inherits every quality gate improvement landed on
  `ose-public` automatically.
- Deployment becomes a one-agent force-push to `prod-wahidyankf-web`,
  identical to the existing three production-deploy agents.
- Content agents (`docs-checker`, `readme-checker`, `docs-link-checker`,
  `apps-*-content-maker` patterns) become applicable to the portfolio.
- The monorepo gains a visible public face that doubles as marketing for
  the broader `ose-public` platform.
- External users cloning `ose-public` as a template inherit a working
  portfolio example they can fork.

## Affected Roles (Hats the Maintainer Wears / Agents That Consume This File)

This is a content-placement list, not a sign-off list. Code review on the
plan-execution PR is the only approval gate.

- **Repo maintainer** — owns the portfolio content and the upgrade path;
  drives the plan-execution workflow through each phase.
- **`plan-maker` / `plan-checker` / `plan-fixer`** — author and validate
  this plan; must find the Gherkin acceptance criteria, the phased
  delivery, and the scoped worktree strategy inside these files.
- **`plan-executor` / `plan-execution-checker`** — drive and verify the
  per-phase commits.
- **`swe-typescript-dev`** — implements the port and upgrade.
- **`apps-wahidyankf-web-deployer`** (to be created in P6) — owns the
  production-branch force-push step.
- **Future content checkers** — `docs-link-checker` and `readme-checker`
  already run across the repo and will apply to the adopted README and
  any content directories once the app lands on `main`.

## Success Metrics

Per the plans convention, each metric below is tagged as an observable
fact, a cited measurement, qualitative reasoning, or a labelled judgment
call. No fabricated numeric targets.

1. **Single source of truth for the portfolio** — _Observable fact_:
   after adoption, `grep -r wahidyankf-web apps/` inside `ose-public`
   returns the new app directory, and the upstream `wahidyankf/oss /
apps-standalone/wahidyankf-web` directory is no longer the canonical
   source (signalled in its README — handled in a follow-up outside this
   plan's scope).
2. **All quality gates green on the new app** — _Observable fact_: `nx
affected -t typecheck lint test:quick spec-coverage` exits zero on the
   commit that concludes P5.
3. **Unit-test coverage meets the content-platform floor** — _Observable
   fact_: `rhino-cli test-coverage validate
apps/wahidyankf-web/coverage/lcov.info 80` exits zero. The 80% floor
   matches `ayokoding-web` and `oseplatform-web` (both are content
   platforms with no API/auth mock layer); `organiclever-fe` uses a 70%
   floor because it mocks API/auth layers by design, which does not
   apply here.
4. **Stack parity with the other three Next.js apps** — _Observable
   fact_: `apps/wahidyankf-web/package.json` pins the same exact versions
   for `vitest`, `jsdom`, `@vitejs/plugin-react`, `vite-tsconfig-paths`,
   `@amiceli/vitest-cucumber`, `tailwindcss`, `@tailwindcss/postcss`,
   `@testing-library/react`, `@testing-library/jest-dom`,
   `@vitest/coverage-v8`, and `@types/node` as `ayokoding-web` and
   `oseplatform-web` carry.
5. **Deploy-branch parity with the other three web apps** — _Observable
   fact_: `git branch -r | grep prod-wahidyankf-web` returns a result
   after P6, matching the existing three `prod-*-web` branches.
6. **No dependency older than the versions verified during P0 research** —
   _Observable fact_: `package.json` matches the upgrade matrix in
   `tech-docs.md` exactly.
7. **Template reusability signal** — _Qualitative reasoning_: an external
   user who forks `apps/wahidyankf-web/` into a fresh repo and replaces
   only `src/app/data.ts` and `public/` should get a deployable portfolio
   without touching the Nx, Vitest, Playwright, or Tailwind configuration.
   No quantitative target — this is structural, not numeric.
8. **Maintenance-tax reduction for the maintainer** — _Judgment call:_ we
   expect one-touch dependency upgrades (the root-level lockfile handles
   all apps after adoption) to materially reduce the time spent on
   Next/React/Tailwind bumps across the portfolio; no baseline measured.
9. **Journal scaffolding unblocked** — _Observable fact_: after P7, a
   future journal plan can add an `/journal` route and an MDX content
   pipeline to the adopted app without repeating any of this plan's P1-P6
   work; the adoption commit contains the Next.js 16 app, tests, gates,
   and deploy branch the journal plan needs as dependencies.

## Business-Scope Non-Goals

- **Not adding a journal feature**. The journal that motivates driver
  (2) is explicitly deferred to a follow-up plan. This adoption lands
  only the existing upstream routes (`/`, `/cv`, `/personal-projects`).
  The adopted app's structure accommodates a later `/journal` route
  without refactor, but building it is out of scope here.
- **Not migrating content strategy**. The adopted site keeps its current
  information architecture (home, CV, personal-projects). Content
  redesigns are out of scope.
- **Not writing the "use this as a template" guide**. Driver (4) is
  structural — the adopted app will naturally serve as a template, but
  authoring an external-facing adoption guide (README for external
  forkers) is its own follow-up plan.
- **Not introducing a new shared library**. The port lives inside
  `apps/wahidyankf-web/` and uses its own `components/` and `utils/`
  directories; we do not yet lift anything into `libs/`.
- **Not implementing server-side APIs**. The site remains a
  statically-friendly Next.js 16 App Router build (`output: "standalone"`)
  with no tRPC, no BFF routes, no backend dependencies.
- **Not wiring the production domain on Vercel**. DNS and Vercel project
  configuration happen outside this repo after merge.
- **Not deleting the upstream `wahidyankf/oss` directory**. A deprecation
  notice there is a separate follow-up.

## Business Risks and Mitigations

| Risk                                                                                              | Likelihood | Impact | Mitigation                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency upgrade introduces runtime regression (Tailwind v4 config shift, React 19 API changes) | Medium     | Medium | Phase P2 dedicated to upgrade + codemod runs; Playwright smoke in P4 catches regressions before P6 deploy wiring.                                                                                                       |
| Production branch accidentally created with stale content                                         | Low        | Medium | P6 creates `prod-wahidyankf-web` from `main` only _after_ P5 quality gates are green. The deployer agent's workflow (force-push main→prod branch) matches siblings.                                                     |
| Tag-vocabulary extension (`domain:wahidyankf`) breaks existing tag-query consumers                | Low        | Low    | The tag convention explicitly allows extensions via doc update; checker agents read the live file. A grep sweep in P6 confirms no hard-coded allowlist anywhere.                                                        |
| Maintainer abandons the plan mid-way leaving the repo in a partial state                          | Low        | Medium | Phase boundaries are commit points on `main`. At any phase boundary the app is either absent (pre-P1) or internally consistent. No phase leaves a broken test suite.                                                    |
| Upstream license on portfolio content is not MIT-compatible                                       | Low        | High   | P0 checks the upstream `LICENSE` file; both `ose-public` app and scaffolding directories accept MIT per the root licensing notice. Block the plan if incompatible.                                                      |
| Stack drift from the other three Next.js apps at adoption time                                    | Medium     | Medium | The README's Stack Parity table and the `tech-docs.md` upgrade matrix pin exact shared versions for every test-stack package. P2 verification grep confirms parity before the phase commit.                             |
| Adopted app's configuration is too bespoke to be usable as a fork template for others             | Low        | Low    | Every config file in `apps/wahidyankf-web/` is either identical to its sibling in `ayokoding-web` / `oseplatform-web` / `organiclever-fe` or explicitly delta-documented in `tech-docs.md`. No hidden bespoke defaults. |
