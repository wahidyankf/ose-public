# Delivery Plan

## Phase 1: FE Gherkin Specs (Ayokoding + OSE Platform)

### 1.1 Move Ayokoding FE Feature Files Into Domain Subdirectories

- [x] Create directory `specs/apps/ayokoding/fe/gherkin/accessibility/`
- [x] `git mv specs/apps/ayokoding/fe/gherkin/accessibility.feature specs/apps/ayokoding/fe/gherkin/accessibility/accessibility.feature`
- [x] Create directory `specs/apps/ayokoding/fe/gherkin/content-rendering/`
- [x] `git mv specs/apps/ayokoding/fe/gherkin/content-rendering.feature specs/apps/ayokoding/fe/gherkin/content-rendering/content-rendering.feature`
- [x] Create directory `specs/apps/ayokoding/fe/gherkin/i18n/`
- [x] `git mv specs/apps/ayokoding/fe/gherkin/i18n.feature specs/apps/ayokoding/fe/gherkin/i18n/i18n.feature`
- [x] Create directory `specs/apps/ayokoding/fe/gherkin/navigation/`
- [x] `git mv specs/apps/ayokoding/fe/gherkin/navigation.feature specs/apps/ayokoding/fe/gherkin/navigation/navigation.feature`
- [x] Create directory `specs/apps/ayokoding/fe/gherkin/responsive/`
- [x] `git mv specs/apps/ayokoding/fe/gherkin/responsive.feature specs/apps/ayokoding/fe/gherkin/responsive/responsive.feature`
- [x] Create directory `specs/apps/ayokoding/fe/gherkin/search/`
- [x] `git mv specs/apps/ayokoding/fe/gherkin/search.feature specs/apps/ayokoding/fe/gherkin/search/search.feature`

### 1.2 Move OSE Platform FE Feature Files Into Domain Subdirectories

- [x] Create directory `specs/apps/oseplatform/fe/gherkin/accessibility/`
- [x] `git mv specs/apps/oseplatform/fe/gherkin/accessibility.feature specs/apps/oseplatform/fe/gherkin/accessibility/accessibility.feature`
- [x] Create directory `specs/apps/oseplatform/fe/gherkin/landing-page/`
- [x] `git mv specs/apps/oseplatform/fe/gherkin/landing-page.feature specs/apps/oseplatform/fe/gherkin/landing-page/landing-page.feature`
- [x] Create directory `specs/apps/oseplatform/fe/gherkin/navigation/`
- [x] `git mv specs/apps/oseplatform/fe/gherkin/navigation.feature specs/apps/oseplatform/fe/gherkin/navigation/navigation.feature`
- [x] Create directory `specs/apps/oseplatform/fe/gherkin/responsive/`
- [x] `git mv specs/apps/oseplatform/fe/gherkin/responsive.feature specs/apps/oseplatform/fe/gherkin/responsive/responsive.feature`
- [x] Create directory `specs/apps/oseplatform/fe/gherkin/theme/`
- [x] `git mv specs/apps/oseplatform/fe/gherkin/theme.feature specs/apps/oseplatform/fe/gherkin/theme/theme.feature`

### 1.3 Update Ayokoding Web Unit Test Step File Paths

- [x] Update `apps/ayokoding-web/test/unit/fe-steps/accessibility.steps.tsx`: change `fe/gherkin/accessibility.feature` to `fe/gherkin/accessibility/accessibility.feature`
- [x] Update `apps/ayokoding-web/test/unit/fe-steps/content-rendering.steps.tsx`: change `fe/gherkin/content-rendering.feature` to `fe/gherkin/content-rendering/content-rendering.feature`
- [x] Update `apps/ayokoding-web/test/unit/fe-steps/i18n.steps.tsx`: change `fe/gherkin/i18n.feature` to `fe/gherkin/i18n/i18n.feature`
- [x] Update `apps/ayokoding-web/test/unit/fe-steps/navigation.steps.tsx`: change `fe/gherkin/navigation.feature` to `fe/gherkin/navigation/navigation.feature`
- [x] Update `apps/ayokoding-web/test/unit/fe-steps/responsive.steps.tsx`: change `fe/gherkin/responsive.feature` to `fe/gherkin/responsive/responsive.feature`
- [x] Update `apps/ayokoding-web/test/unit/fe-steps/search.steps.tsx`: change `fe/gherkin/search.feature` to `fe/gherkin/search/search.feature`

### 1.4 Update OSE Platform Web Unit Test Step File Paths

- [x] Update `apps/oseplatform-web/test/unit/fe-steps/landing-page.steps.tsx`: change `fe/gherkin/landing-page.feature` to `fe/gherkin/landing-page/landing-page.feature`
- [x] Update `apps/oseplatform-web/test/unit/fe-steps/navigation.steps.tsx`: change `fe/gherkin/navigation.feature` to `fe/gherkin/navigation/navigation.feature`
- [x] Update `apps/oseplatform-web/test/unit/fe-steps/responsive.steps.tsx`: change `fe/gherkin/responsive.feature` to `fe/gherkin/responsive/responsive.feature`
- [x] Update `apps/oseplatform-web/test/unit/fe-steps/theme.steps.tsx`: change `fe/gherkin/theme.feature` to `fe/gherkin/theme/theme.feature`

### 1.5 Update Spec README Files

- [x] Update `specs/apps/ayokoding/README.md`:
  - [x] Structure tree: replace `gherkin/           # Frontend Gherkin scenarios (future)` with the new subdirectory structure listing all 6 domain directories (`accessibility/`, `content-rendering/`, `i18n/`, `navigation/`, `responsive/`, `search/`) and their feature files
  - [x] Add a new **Frontend Domains** table (analogous to the existing Backend Domains table) with rows for all 6 FE domains: accessibility, content-rendering, i18n, navigation, responsive, search
  - [x] Backend vs Frontend table: change the Frontend Domains cell from `Defined separately (future)` to `6 domains`
- [x] Update `specs/apps/oseplatform/README.md`:
  - [x] Structure tree: add `accessibility/` subdirectory with `accessibility.feature` (currently missing) and change the other 4 flat feature files to subdirectory paths (e.g., `landing-page/landing-page.feature` instead of `landing-page.feature`)
  - [x] Frontend Domains table: add an `accessibility` row with file `accessibility/accessibility.feature`
  - [x] Backend vs Frontend table: change Frontend Domains cell from `4 domains` to `5 domains`
  - [x] Scenario Summary table: add a `Frontend | accessibility | 5` row and update the total from `21` to `26`

### 1.6 Phase 1 Validation

- [x] Run `npx nx run ayokoding-web:test:quick` -- passes
- [x] Run `npx nx run oseplatform-web:test:quick` -- passes
- [x] Run `npx nx run ayokoding-web-fe-e2e:spec-coverage` -- passes (verify glob still finds files)
- [x] Run `npx nx run oseplatform-web-fe-e2e:spec-coverage` -- passes (verify glob still finds files)
- [x] Run `npm run lint:md` -- no broken links in updated READMEs
- [x] Verify no flat feature files remain directly under `specs/apps/ayokoding/fe/gherkin/`
- [x] Verify no flat feature files remain directly under `specs/apps/oseplatform/fe/gherkin/`
- [x] Commit: `refactor(specs): move ayokoding and oseplatform FE gherkin specs into domain subdirectories`

---

## Phase 2: Go Library Specs (golang-commons + hugo-commons)

### 2.1 Move golang-commons Feature Files Under gherkin/ Wrapper

- [x] Create directory `specs/libs/golang-commons/gherkin/testutil/`
- [x] `git mv specs/libs/golang-commons/testutil/capture-stdout.feature specs/libs/golang-commons/gherkin/testutil/capture-stdout.feature`
- [x] Remove empty directory `specs/libs/golang-commons/testutil/` (if git mv leaves it empty)
- [x] Create directory `specs/libs/golang-commons/gherkin/timeutil/`
- [x] `git mv specs/libs/golang-commons/timeutil/timestamp.feature specs/libs/golang-commons/gherkin/timeutil/timestamp.feature`
- [x] Remove empty directory `specs/libs/golang-commons/timeutil/` (if git mv leaves it empty)

### 2.2 Move hugo-commons Feature Files Under gherkin/ Wrapper

- [x] Create directory `specs/libs/hugo-commons/gherkin/links/`
- [x] `git mv specs/libs/hugo-commons/links/check-links.feature specs/libs/hugo-commons/gherkin/links/check-links.feature`
- [x] Remove empty directory `specs/libs/hugo-commons/links/` (if git mv leaves it empty)

### 2.3 Update Go Integration Test File Paths

- [x] Update `libs/golang-commons/testutil/capture-stdout.integration_test.go`: change `"../../../specs/libs/golang-commons/testutil"` to `"../../../specs/libs/golang-commons/gherkin/testutil"`
- [x] Update `libs/golang-commons/timeutil/timestamp.integration_test.go`: change `"../../../specs/libs/golang-commons/timeutil"` to `"../../../specs/libs/golang-commons/gherkin/timeutil"`
- [x] Update `libs/hugo-commons/links/check-links.integration_test.go`: change `"../../../specs/libs/hugo-commons/links"` to `"../../../specs/libs/hugo-commons/gherkin/links"`

### 2.4 Update specs/README.md Library Links (If Needed)

- [x] Check `specs/README.md` library links for golang-commons and hugo-commons -- update if they point to old directory paths

### 2.5 Phase 2 Validation

- [x] Run `npx nx run golang-commons:test:quick` -- passes
- [x] Run `npx nx run hugo-commons:test:quick` -- passes (if target exists; otherwise run `test:unit`)
- [x] Run `npx nx run golang-commons:test:integration` -- passes (verifies updated paths)
- [x] Run `npx nx run hugo-commons:test:integration` -- passes (verifies updated paths)
- [x] Verify project.json glob inputs still resolve (both use `**/*.feature`)
- [x] Verify no feature files remain outside `gherkin/` wrapper in `specs/libs/golang-commons/` or `specs/libs/hugo-commons/`
- [x] Run `npm run lint:md` -- no broken links
- [x] Commit: `refactor(specs): add gherkin/ wrapper to golang-commons and hugo-commons library specs`

---

## Phase 3: ts-ui Library Specs

### 3.1 Move ts-ui Feature Files Into Component Subdirectories

- [x] Create directory `specs/libs/ts-ui/gherkin/alert/`
- [x] `git mv specs/libs/ts-ui/gherkin/alert.feature specs/libs/ts-ui/gherkin/alert/alert.feature`
- [x] Create directory `specs/libs/ts-ui/gherkin/button/`
- [x] `git mv specs/libs/ts-ui/gherkin/button.feature specs/libs/ts-ui/gherkin/button/button.feature`
- [x] Create directory `specs/libs/ts-ui/gherkin/card/`
- [x] `git mv specs/libs/ts-ui/gherkin/card.feature specs/libs/ts-ui/gherkin/card/card.feature`
- [x] Create directory `specs/libs/ts-ui/gherkin/dialog/`
- [x] `git mv specs/libs/ts-ui/gherkin/dialog.feature specs/libs/ts-ui/gherkin/dialog/dialog.feature`
- [x] Create directory `specs/libs/ts-ui/gherkin/input/`
- [x] `git mv specs/libs/ts-ui/gherkin/input.feature specs/libs/ts-ui/gherkin/input/input.feature`
- [x] Create directory `specs/libs/ts-ui/gherkin/label/`
- [x] `git mv specs/libs/ts-ui/gherkin/label.feature specs/libs/ts-ui/gherkin/label/label.feature`

### 3.2 Update ts-ui Step File Paths

- [x] Update `libs/ts-ui/src/components/alert/alert.steps.tsx`: change `gherkin/alert.feature` to `gherkin/alert/alert.feature`
- [x] Update `libs/ts-ui/src/components/button/button.steps.tsx`: change `gherkin/button.feature` to `gherkin/button/button.feature`
- [x] Update `libs/ts-ui/src/components/card/card.steps.tsx`: change `gherkin/card.feature` to `gherkin/card/card.feature`
- [x] Update `libs/ts-ui/src/components/dialog/dialog.steps.tsx`: change `gherkin/dialog.feature` to `gherkin/dialog/dialog.feature`
- [x] Update `libs/ts-ui/src/components/input/input.steps.tsx`: change `gherkin/input.feature` to `gherkin/input/input.feature`
- [x] Update `libs/ts-ui/src/components/label/label.steps.tsx`: change `gherkin/label.feature` to `gherkin/label/label.feature`

### 3.3 Phase 3 Validation

- [ ] Run `npx nx run ts-ui:test:quick` -- passes
- [ ] Verify no flat feature files remain directly under `specs/libs/ts-ui/gherkin/`
- [ ] Run `npm run lint:md` -- no broken links
- [ ] Commit: `refactor(specs): move ts-ui gherkin specs into component subdirectories`

---

## Final Validation

- [ ] Run `npx nx affected -t test:quick` -- all affected projects pass
- [ ] Run `npm run lint:md` -- no markdown violations
- [ ] Verify the full `specs/` tree: no feature file exists as a direct child of any `gherkin/` directory (all are inside domain/component subdirectories, except CLI specs which are intentionally kept flat)
