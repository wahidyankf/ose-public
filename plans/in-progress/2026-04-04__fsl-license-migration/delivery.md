# Delivery Plan: FSL-1.1-MIT License Migration

## Overview

**Delivery Type**: Direct commits to `main` (small, independent changes)

**Git Workflow**: Trunk Based Development — each phase is one commit

**Phase Order**: Phase 1 must be first (it establishes the license). Phases 2-5 can be done in any
order. Phase 6 (validation) must be last.

## Implementation Phases

### Phase 1: Replace LICENSE File

**Goal**: Establish the FSL-1.1-MIT license as the governing license for the repository.

- [ ] Fetch the canonical FSL-1.1-MIT license text from [fsl.software](https://fsl.software/)
- [ ] Replace the contents of `LICENSE` with the FSL-1.1-MIT text
- [ ] Set Licensor to `wahidyankf`
- [ ] Set Licensed Work to `open-sharia-enterprise`
- [ ] Set Change Date to `2028-04-04`
- [ ] Set Change License to `MIT`
- [ ] Verify the license text matches the canonical FSL-1.1 template exactly (except for the
      parameterized fields)
- [ ] Commit: `chore(license): replace MIT with FSL-1.1-MIT`

### Phase 2: Update Package Metadata and Core Documentation

**Goal**: Update package metadata and core project documentation that directly declare the license.

- [ ] Update `package.json`: change `"license": "MIT"` to `"license": "FSL-1.1-MIT"`
- [ ] Update `README.md`: replace the License section with FSL-1.1-MIT description including
      per-version rolling conversion (see [tech-docs.md](./tech-docs.md) for exact wording)
- [ ] Update `CLAUDE.md` line ~10: change `**License**: MIT` to `**License**: FSL-1.1-MIT`
- [ ] Update `CLAUDE.md` line ~688: change `- **License**: MIT` to `- **License**: FSL-1.1-MIT`
- [ ] Update `governance/vision/README.md`: change `Open source (MIT)` to
      `Source-available (FSL-1.1-MIT)` with conversion note
- [ ] Update `apps/oseplatform-web/content/about.md`:
  - License section (~line 187): change "MIT License" description to FSL-1.1-MIT
  - Key Resources (~line 218): change `License: MIT` to `License: FSL-1.1-MIT`
- [ ] Verify third-party LICENSE files are NOT modified:
  - `libs/elixir-cabbage/LICENSE` — still MIT (Matt Widmann)
  - `libs/elixir-gherkin/LICENSE` — still MIT (Matt Widmann)
  - `archived/ayokoding-web-hugo/LICENSE` — still MIT (Xin)
- [ ] Commit: `docs(license): update core references from MIT to FSL-1.1-MIT`

### Phase 2b: Update Convention Docs, Templates, and Examples

**Goal**: Update governance convention docs, principles examples, and templates that use MIT as the
project's license in examples or declarations.

- [ ] Update `governance/conventions/writing/oss-documentation.md`:
  - Badge example (~line 141): change `license-MIT-blue` to `license-FSL--1.1--MIT-blue`
  - README template license section (~line 187): change MIT to FSL-1.1-MIT
  - "Current Project" declaration (~line 724): change to `FSL-1.1-MIT License`
  - Leave generic license lists (e.g., "MIT, Apache 2.0, GPL") unchanged — they enumerate
    license types in general, not this project's specific license
- [ ] Update `governance/conventions/writing/readme-quality.md`:
  - Bad example (~line 248): change MIT License to FSL-1.1-MIT
  - Good example (~line 254): change MIT License to FSL-1.1-MIT with updated description
- [ ] Update `governance/principles/general/simplicity-over-complexity.md`:
  - YAML example (~line 175): change `license: MIT` to `license: FSL-1.1-MIT`
- [ ] Update `docs/how-to/hoto__add-new-lib.md`:
  - New lib README template (~line 249): change `MIT` to `FSL-1.1-MIT`
- [ ] Commit: `docs(license): update conventions, templates, and examples to FSL-1.1-MIT`

### Phase 2c: Update GitHub Repository Attributes

**Goal**: Update external platform metadata to reflect the new license.

- [ ] Update GitHub repository description: change "Open-source" to "Source-available"
      via `gh repo edit --description "Source-available Sharia-compliant enterprise platform. ..."`
- [ ] Verify GitHub license badge: after LICENSE file replacement (Phase 1), GitHub will show
      "Other" since FSL-1.1-MIT is not in GitHub's recognized license list — this is expected
- [ ] Commit: N/A (GitHub API change, no file change needed)

### Phase 3: Remove LGPL Dependencies from Production Apps

**Goal**: Eliminate the only LGPL dependency (`@img/sharp-libvips`) from production Next.js apps by
disabling server-side image optimization. Vercel handles optimization at the edge, so there is no
production performance impact.

#### 3a: Disable sharp in Production Next.js Apps

- [ ] In `apps/ayokoding-web/next.config.ts`, set `images.unoptimized: true`
- [ ] In `apps/oseplatform-web/next.config.ts`, set `images.unoptimized: true`
- [ ] In `apps/organiclever-fe/next.config.ts`, set `images.unoptimized: true`
- [ ] Run `nx run ayokoding-web:test:quick` — verify pass
- [ ] Run `nx run oseplatform-web:test:quick` — verify pass
- [ ] Run `nx run organiclever-fe:test:quick` — verify pass
- [ ] Run `nx run ayokoding-web:build` — verify build succeeds without sharp
- [ ] Run `nx run oseplatform-web:build` — verify build succeeds without sharp
- [ ] Run `nx run organiclever-fe:build` — verify build succeeds without sharp
- [ ] Commit: `fix(nextjs): disable server-side image optimization for FSL-1.1-MIT LGPL compliance`

#### 3b: Document Dependency Audit and Licensing

- [ ] Create `docs/explanation/software-engineering/licensing/dependency-compatibility.md`:
  - Audit methodology (date: 2026-04-04, scope: all production apps, ~10 projects)
  - Production dependency license summary table (all permissive except MPL-2.0 noted below)
  - Why `images.unoptimized: true` was set (LGPL-3.0 elimination)
  - MPL-2.0 HashiCorp libs: documented as file-level copyleft, no conflict with FSL
  - Demo apps (`a-demo-*`) excluded from audit with rationale
- [ ] Create `docs/explanation/software-engineering/licensing/README.md` — Index file
- [ ] Commit: `docs(licensing): add production dependency compatibility audit`

### Phase 4: Create LICENSING-NOTICE.md

**Goal**: Provide a human-readable summary for contributors and users who may be unfamiliar with
FSL-1.1-MIT.

- [ ] Create `LICENSING-NOTICE.md` in the repository root with:
  - One-paragraph summary of FSL-1.1-MIT
  - What users can and cannot do
  - Per-version rolling conversion explanation: each commit/release becomes MIT 2 years after
    its first public distribution (e.g., commit from 2026-04-04 → MIT on 2028-04-04, commit
    from 2026-06-15 → MIT on 2028-06-15)
  - How to find a fully MIT version (check out any commit older than 2 years)
  - The Change Date as the floor (earliest any code becomes MIT)
  - Note about third-party code under different licenses
  - Link to the LICENSE file and fsl.software
- [ ] Commit: `docs(license): add human-readable LICENSING-NOTICE.md`

### Phase 5: Validation

**Goal**: Verify all changes are complete and consistent.

#### 5a: License File and Package Metadata

- [ ] Verify `LICENSE` contains FSL-1.1-MIT text with correct parameters
- [ ] Verify `package.json` has `"license": "FSL-1.1-MIT"`

#### 5b: Documentation Completeness

- [ ] Verify `README.md` License section describes FSL-1.1-MIT with per-version rolling conversion
- [ ] Verify `CLAUDE.md` has no remaining `License: MIT` references (except in Change License
      context)
- [ ] Verify `governance/vision/README.md` reflects FSL-1.1-MIT
- [ ] Verify `apps/oseplatform-web/content/about.md` reflects FSL-1.1-MIT (both references)
- [ ] Verify `governance/conventions/writing/oss-documentation.md` updated (badge, template,
      "Current Project")
- [ ] Verify `governance/conventions/writing/readme-quality.md` updated (good/bad examples)
- [ ] Verify `governance/principles/general/simplicity-over-complexity.md` YAML example updated
- [ ] Verify `docs/how-to/hoto__add-new-lib.md` README template updated

#### 5c: Third-Party Code Preservation

- [ ] Verify third-party LICENSE files are unchanged (elixir-cabbage, elixir-gherkin,
      ayokoding-web-hugo)
- [ ] Verify third-party fork notes (FORK_NOTES.md) still reference upstream MIT correctly
- [ ] Verify dependency license references (database-audit-trail.md, README files) unchanged

#### 5d: External Platforms

- [ ] Verify GitHub repository description contains "Source-available" (not "Open-source")
- [ ] Verify GitHub license detection shows "Other" or no badge (expected for FSL)

#### 5e: LGPL Dependency Elimination

- [ ] Verify `images.unoptimized: true` is set in all 3 production Next.js apps
- [ ] Verify `@img/sharp-libvips` is no longer resolved in production app dependency trees
- [ ] Verify `docs/explanation/software-engineering/licensing/dependency-compatibility.md` exists

#### 5f: Stale Reference Sweep

- [ ] Run `grep -r "MIT License" --include="*.md"` across project-owned files (excluding
      `plans/done/`, third-party forks, dependency references, and the FSL license text itself)
- [ ] Run `grep -r '"license": "MIT"' --include="*.json"` — should return zero results
- [ ] Confirm every remaining "MIT" reference is either: a third-party license, a dependency
      license mention, a historical plan, or the FSL Change License declaration

#### 5g: Build Verification

- [ ] Run `npm run doctor` — verify all tools still OK
- [ ] Run `npx nx affected -t typecheck lint test:quick` — verify no breakage
- [ ] Verify `LICENSING-NOTICE.md` exists and explains per-version rolling conversion
