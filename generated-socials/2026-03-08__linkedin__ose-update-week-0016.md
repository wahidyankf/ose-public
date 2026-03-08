Posted: Sunday, March 8, 2026
Platform: LinkedIn

---

OPEN SHARIA ENTERPRISE
Week 0016, Phase 1 Week 4

---

🚀 Phase 1 Week 4: OrganicLever Takes Shape

Four weeks into Phase 1. OrganicLever is real — frontend deployed at www.organiclever.com, Spring Boot backend running in local dev, and a testing infrastructure built for scale. All product content is placeholder for now — the focus is on CI/CD infrastructure, not features.

**What shipped in 379 commits:**

OrganicLever (4 projects):

- organiclever-web: Next.js 16, React 19, TailwindCSS v4, shadcn-ui, cookie auth, members CRUD, Storybook 10 (99.57% coverage)
- organiclever-be: Spring Boot 4.0.3, Java 25, JSpecify + NullAway null safety (100% coverage)
- organiclever-web-e2e + organiclever-be-e2e: Playwright E2E tests, scheduled twice daily

Three-Tier BDD Testing:

- 26 Gherkin feature files, 99 scenarios — shared specs drive integration and E2E tiers
- Vitest-Cucumber + MSW (web), Cucumber JVM + MockMvc (backend), Godog (Go libs)
- Unit tests standalone for isolated logic

Coverage: Zero to 95%:

- All 7 projects now enforce 95%+ via rhino-cli test-coverage validate
- Progressive raises: 80% -> 85% -> 90% -> 95%
- golang-commons 100%, organiclever-be 100%, organiclever-web 99.57%

7 CI/CD Workflows:

- Push to main: test:quick + Codecov upload
- PR: quality gate + auto-format + link validation
- Scheduled: Hugo site deploys + E2E tests (twice daily)

Infrastructure:

- rhino-cli v0.4.0 -> v0.10.0 (5 new commands, domain-prefixed subcommands, 39 BDD scenarios)
- New shared libs: golang-commons + hugo-commons
- Dependency modernization: Next.js 14->16, Go 1.24->1.26, TailwindCSS v3->v4

**What's next:**

- Local dev + CI improvements
- Backend tech stack evaluation (multiple stacks in parallel — AI makes this practical)
- CD pipeline comes after tech stack decision settles

Infrastructure first. Features second. Quality over speed.

---

Phase 1 Goal: OrganicLever (productivity tracker)
Stack: Next.js (web) + Spring Boot (backend, evaluating alternatives)
Timeline: Quality over deadlines, Insha Allah

---

Full update post with Mermaid diagrams and detailed metrics:
https://www.oseplatform.com/updates/2026-03-08-phase-1-week-4-organiclever-takes-shape/

Every commit visible on GitHub. Monthly updates every second Sunday.

---

🔗 LINKS

- GitHub: https://github.com/wahidyankf/open-sharia-enterprise
- Latest Monthly Update: https://www.oseplatform.com/updates/2026-03-08-phase-1-week-4-organiclever-takes-shape/
- All Updates: https://www.oseplatform.com/updates/
- Learning Content: https://www.ayokoding.com/
