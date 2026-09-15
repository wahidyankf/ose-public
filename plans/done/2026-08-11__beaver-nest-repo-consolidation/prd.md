---
title: "PRD: BeaverNest Repository Consolidation"
description: User stories and Gherkin acceptance criteria for folding beaver-nest into ose-public and retiring the fourth repository
category: explanation
subcategory: plans
tags:
  - governance
  - cross-repo
  - consolidation
created: 2026-08-06
---

# Product Requirements Document: BeaverNest Repository Consolidation

## Product Overview

This plan delivers a **repository-topology change**, not a feature. Three things ship:

1. The BeaverNest walking skeleton relocated into `ose-public` under tier-conformant names —
   `apps/beavernest-be`, `apps/beavernest-app-web`, `apps/beavernest-be-e2e`,
   `apps/beavernest-app-web-e2e` — with its specs tree, compose stack, brand token sheet, CI caller,
   and solution-file entries, all green under `ose-public`'s existing gates.
2. The BeaverNest narrative surface — a child product vision alongside the ecosystem vision, and the
   `beaver-nest`-unique idea two-pagers on the Phase 0 manifest, folded into `ose-public`'s backlog.
3. A four→three sweep of repository terminology across `ose-public`, `ose-primer`, and the private sibling,
   including the `apps/rhino-cli` runtime string, landing byte-identically where the byte-identity
   boundary requires it — followed by archiving `github.com/wahidyankf/beaver-nest`.

**Funnel exemptions, stated explicitly.** This plan is **not UI-bearing** for the purposes of the
UI-design-funnel rule: no screen, component, or layout is added or changed. `beavernest-app-web`
renders exactly the screen `beaver-nest-fe` renders today; the change is a relocation and a rename.
It is **not learning-bearing**: it authors no course, tutorial, or curriculum content, so no
`syllabus/` record applies.

## Personas

Hats the single maintainer wears, plus the agents that consume this document:

| Persona                  | What they need from this plan                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| **Repo steward**         | One unambiguous definition of "the OSE repos", with no four-versus-three carve-out to remember.    |
| **Product maintainer**   | BeaverNest's code reachable and buildable in the same workspace as everything else they maintain.  |
| **Release/infra**        | A CI surface that does not silently break, and an archive step that is reversible.                 |
| **`plan-checker`**       | Falsifiable acceptance criteria and an explicit exemption record for the conditional funnel gates. |
| **`repo-rules-checker`** | A post-sweep repository with no contradictory statements about cross-repo boundary membership.     |
| **`pr-review-*` fleet**  | Delivery units small enough to review whole, each independently green.                             |

## User Stories

- **US-1** — As the **repo steward**, I want the BeaverNest apps to live in `ose-public` under the
  repo's own naming tiers, so that I stop maintaining a second workspace for them.
- **US-2** — As the **product maintainer**, I want the ported apps to pass `ose-public`'s existing
  quality gates unchanged, so that the port is proven complete rather than merely copied.
- **US-3** — As the **repo steward**, I want the BeaverNest product vision to sit as a child of the
  ecosystem vision, so that the product's "why" survives the repository's retirement.
- **US-4** — As the **repo steward**, I want every `beaver-nest`-unique idea two-pager carried over
  without creating near-duplicates of existing briefs, so that the backlog stays a set of distinct
  problems.
- **US-5** — As the **repo steward**, I want every statement of the four-repo family rewritten to
  three across all three surviving repos, so that no document, agent, or binary contradicts another.
- **US-6** — As the **release/infra** owner, I want the `apps/rhino-cli` four-repo string change to
  land byte-identically in all three parity repos, so that the byte-identity gate stays green.
- **US-7** — As the **repo steward**, I want `github.com/wahidyankf/beaver-nest` archived rather than
  deleted, so that every existing inbound link keeps resolving and the decision stays reversible.
- **US-8** — As the **product maintainer**, I want the stalled `beaver-nest-app-setup` plan given an
  explicit disposition, so that its 72.5%-complete state is closed on the record rather than lost.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: BeaverNest product relocation into ose-public

  Background:
    Given the plan "sdlc-gate-registry-enforcement" has completed
    And the ose-public working tree is clean on the latest origin/main

  Scenario: Ported apps are registered under tier-conformant Nx project names
    Given the BeaverNest apps have been ported into ose-public
    When I run "npx nx show projects --json"
    Then the output contains "beavernest-be"
    And the output contains "beavernest-app-web"
    And the output contains "beavernest-be-e2e"
    And the output contains "beavernest-app-web-e2e"
    And the output contains no project name matching "beaver-nest-fe"

  Scenario: Ported apps pass the repository quality gate
    Given the four BeaverNest projects are registered in ose-public
    When I run "npx nx run-many -t test:quick -p beavernest-be,beavernest-app-web,beavernest-be-e2e,beavernest-app-web-e2e"
    Then the command exits with status 0
    And no project reports a skipped or narrowed test

  Scenario: No legacy app name survives outside the immutable plan archive
    Given the rename from beaver-nest-fe and beaver-nest-be is complete
    When I run "grep -rn 'beaver-nest-fe' apps libs specs infra .github .claude repo-config.yml"
    Then the command reports zero matches

  Scenario: Ported specs are discovered by the specs coverage gate
    Given the specs tree has been ported to specs/apps/beavernest/
    When I run "npx nx run-many -t specs:coverage -p beavernest-be,beavernest-app-web"
    Then the command exits with status 0
    And the ported feature files are counted rather than skipped

  Scenario: The BeaverNest backend answers on its documented endpoints
    Given the BeaverNest compose stack is running from infra/dev/beavernest-app/
    When I curl "http://127.0.0.1:19300/api/v1/readiness"
    Then the response status is 200
    And the response body contains "\"status\":\"ready\""

Feature: Narrative surface carried into ose-public

  Scenario: The product vision is registered as a child of the ecosystem vision
    Given repo-governance/vision/beavernest.md has been created
    When I read repo-governance/vision/README.md
    Then it links to ./beavernest.md as a child product vision
    And it still links to ./open-sharia-enterprise.md as the parent ecosystem vision

  Scenario: Unique idea briefs are carried without creating duplicates
    Given every brief on the frozen unique-idea manifest has been triaged
    When I compare the resulting plans/ideas/ listing against its pre-plan state
    Then every carried brief either exists as a new distinctly-named file or is folded into a named existing brief
    And no two briefs in plans/ideas/ describe the same underlying problem

  Scenario: The stalled app-setup plan reaches a terminal state
    Given the beaver-nest-app-setup plan was 72.5% complete with an unsatisfiable Unit 3
    When I read its disposition record in ose-public
    Then the plan is marked closed as delivered-as-descoped
    And its outstanding real work is named against the carried product idea briefs

Feature: Four-repo terminology reduced to three

  Scenario Outline: Each surviving repo states a three-repository family
    Given the four-to-three sweep has landed in "<repo>"
    When I run "grep -rn 'beaver-nest' AGENTS.md README.md docs/reference repo-governance .claude" in "<repo>"
    Then the only matches are inside plans/done or are explicitly marked historical references

    Examples:
      | repo        |
      | ose-public  |
      | ose-primer  |
      | private-sibling |

  Scenario: The rhino-cli runtime no longer claims a four-repo byte-identity boundary
    Given the parity message in apps/rhino-cli/src/application/parity.rs has been updated
    When I run "grep -c 'private-sibling, and beaver-nest' apps/rhino-cli/src/application/parity.rs"
    Then the count is 0
    And the message names exactly ose-public, ose-primer, and private-sibling

  Scenario: The rhino-cli change is byte-identical across the parity boundary
    Given the parity.rs edit has landed in all three parity repos
    When I run "rhino-cli parity manifest validate" in each repo
    Then each invocation exits with status 0
    And the three repos report the same manifest digest

  Scenario: The two boundary documents agree on membership
    Given the sweep has landed in ose-public
    When I read docs/reference/sdlc-gate-standard.md and docs/reference/related-repositories.md
    Then both state the rhino-cli byte-identity boundary spans exactly three repositories
    And neither describes a fourth family member

  Scenario: The LinkedIn post agent gathers from three repos
    Given .claude/agents/social-linkedin-post-maker.md has been swept
    When I read its commit-gathering instruction
    Then it names exactly ose-public, ose-primer, and private-sibling
    And its generated mirrors under .opencode and .cursor carry the same three names

Feature: Retirement of the fourth repository

  Scenario: The repository is archived rather than deleted
    Given every prior delivery unit has merged
    When I run "gh repo view wahidyankf/beaver-nest --json isArchived,visibility"
    Then the output reports isArchived true
    And the output reports visibility PUBLIC

  Scenario: The archived repository points readers at its new home
    Given the archive step is about to run
    When I read the beaver-nest README on its default branch
    Then it states the product now lives in ose-public
    And it links to the ose-public repository

  Scenario: Inbound links to the archived repository still resolve
    Given the repository has been archived
    When I fetch "https://github.com/wahidyankf/beaver-nest"
    Then the response status is 200
    And the page is served read-only rather than redirected
```

## Product Scope

**In scope**

- Relocation and rename of the four BeaverNest Nx projects, plus the `beaver-nest-contracts`
  project that lives under `specs/`.
- The `specs/apps/beavernest/` tree — 19 feature files, the OpenAPI contract, and the C4 scaffold.
- `infra/dev/beavernest-app/` — compose files, scripts, and the 16-file shell-test harness.
- `libs/web-ui-token/src/beavernest.css` — the brand token sheet the frontend imports.
- The staging CI caller, renamed to match the new domain token.
- The three F# projects added to `open-sharia-enterprise.sln`.
- `repo-governance/vision/beavernest.md` plus its registration in the vision index.
- Every `beaver-nest`-unique idea two-pager on the Phase 0 manifest, triaged under Integrate-Before-You-Add.
- A disposition record for the stalled `beaver-nest-app-setup` plan.
- The four→three terminology sweep across all three surviving repos.
- Archiving the GitHub repository.

**Out of scope**

- Any new BeaverNest capability — no assistant, content builder, posting helper, or LLM plumbing.
- Any deployment target, hosting, `prod-*`/`stag-*` branch, or Vercel project.
- `beaver-nest`'s governance tree, `apps/rhino-cli` fork, and `libs/web-ui` copy (the 35-duplicate idea overlap this line originally excluded has since resolved itself via cross-repo grooming — `beaver-nest` now carries 0 name-duplicate ideas, re-verified 2026-08-10).
- Preserving `beaver-nest` commit history inside `ose-public`.
- Changing the membership of the content-parity or byte-identity boundaries themselves.
- Deleting the GitHub repository or renaming it.
- Reconciling `ROADMAP.md` versus `roadmap.md` beyond what the port strictly needs — the case-only
  filename difference is noted as a hazard in `tech-docs.md`, not resolved as a deliverable.

## Product-Level Risks

| Risk                                                                                                                                       | Impact | Mitigation                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The rename touches F# namespaces, env-var prefixes, Dockerfiles, and the `.sln` — a partial rename leaves a half-working app               | HIGH   | The rename is a single delivery unit with a grep-based zero-match gate covering `apps`, `libs`, `specs`, `infra`, `.github`, `.claude`, and `repo-config.yml`.                                                                                      |
| `beavernest-app-web` breaks against `ose-public`'s older `libs/web-ui`                                                                     | MEDIUM | Anticipated: the two copies differ across 43 files (re-verified 2026-08-10, unchanged) including a `@storybook/nextjs-vite` → `@storybook/react-vite` swap. Fixed inside the app during Unit 1, with dependency pinning as the documented fallback. |
| `app-web` implies an `app.*` subdomain the product does not have — the SPA is co-served by the backend on one origin                       | LOW    | Recorded as a naming caveat in `tech-docs.md`. The tier vocabulary has no better fit, and the co-served topology is unchanged by the rename.                                                                                                        |
| Ported no-op echo targets (`test:e2e` on the backend, five on the frontend E2E suite) read as passing coverage they do not provide         | LOW    | Carried over as-is and named explicitly, so no acceptance clause in this plan cites a no-op target as evidence.                                                                                                                                     |
| A stale artifact rides along — `next-env.d.ts` from the abandoned Next.js migration, a README citing a nonexistent `specs:coverage` target | LOW    | Both are named in `tech-docs.md`'s file-impact tree for deletion or correction during the port.                                                                                                                                                     |

## Related Documentation

- [README.md](./README.md) — context, scope, resolved design decisions
- [brd.md](./brd.md) — business rationale, baseline, prior art, success metrics
- [tech-docs.md](./tech-docs.md) — architecture, file-impact analysis, rollback
- [delivery.md](./delivery.md) — phased delivery checklist
- [Gherkin Acceptance Criteria skill](../../../.claude/skills/plan-writing-gherkin-criteria/SKILL.md)
- [File Naming Convention §App Naming Types](../../../repo-governance/conventions/structure/file-naming.md)
