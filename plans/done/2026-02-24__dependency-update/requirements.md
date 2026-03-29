# Requirements

## Objectives

1. **Security** — Remove known CVEs by upgrading packages that carry vulnerability advisories.
2. **Stability** — Adopt the latest stable patch and minor releases for all direct dependencies.
3. **Compatibility** — Evaluate major version bumps for feasibility without breaking running apps.
4. **Consistency** — Normalize version mismatches that exist within the same ecosystem
   (e.g., `go 1.24.2` vs `go 1.25` across go.mod files in the same repo).
5. **Reproducibility** — Ensure every lock file (`package-lock.json`, `go.sum`, `pubspec.lock`)
   is regenerated and committed alongside the dependency manifest changes.
6. **Traceability** — Each ecosystem's update is its own commit so the change history is auditable.

## Non-Functional Requirements

- **Security gate**: `npm audit` must report zero critical or high severity CVEs after Phase 2
  completes. Any critical CVE that cannot be resolved by the planned updates blocks the release
  of that ecosystem's changes.
- **Build reproducibility**: All lock files (`package-lock.json`, `go.sum` ×4, `pubspec.lock`)
  must be committed in the same commit as their manifest changes. No manifest change is
  committed without its corresponding lock file.
- **Zero regression**: No test that passes before any phase may fail after that phase's changes
  are applied. Each phase independently validates its own scope before the next begins.

## User Stories

### US-1: NPM Workspace

As a developer working on `organiclever-fe` or any `*-e2e` app,
I want all NPM packages updated to the latest compatible versions
so that I benefit from bug fixes, performance improvements, and security patches
without breaking the existing application behaviour.

### US-2: Go Modules (CLI Tools)

As a developer maintaining `ayokoding-cli` and `rhino-cli`,
I want the Go modules (including `cobra`, `yaml.v3`) updated to their latest releases
and the `go` directive in each go.mod normalized to the same version
so that the tools build cleanly and use current language features.

### US-3: Hugo Themes

As a content author updating `ayokoding-web` or `oseplatform-web`,
I want the Hugo themes (Hextra, PaperMod) updated to their latest stable releases
so that I receive upstream bug fixes and new theme features without manual patching.

### US-4: Flutter / Dart

As a developer working on `organiclever-app`,
I want all pub dependencies updated to their latest stable versions
so that the mobile and web app builds successfully with the current Flutter SDK.

### US-5: Maven / Spring Boot

As a developer working on `organiclever-be`,
I want the Spring Boot parent POM and all Maven dependencies updated
so that the backend runs on the latest stable Spring Boot release and benefits from security fixes.

### US-6: Audit Report

As a maintainer of this repository,
I want an audit report produced at the start of execution
that lists current vs. latest stable versions for every dependency
so that I can make informed decisions about which updates to apply.

## Acceptance Criteria

### AC-1: Audit Report Produced

```gherkin
Given the plan executor starts Phase 1
When the audit commands have completed for all five ecosystems
Then a human-readable audit report exists in generated-reports/
And the report lists current version and latest stable version for each dependency
And the report classifies each update as patch, minor, or major
And the report flags any known CVEs linked to current versions
```

### AC-2: NPM Packages Updated

```gherkin
Given the NPM audit is complete and target versions are confirmed
When `npm update` and/or explicit version bumps are applied and `npm install` re-runs
Then `package-lock.json` reflects the updated dependency tree
And `nx affected -t lint` passes for all affected NPM-based projects
And `nx affected -t test:quick` passes for all affected NPM-based projects
And `nx build organiclever-fe` produces a successful production build
```

### AC-3: Go Modules Updated

```gherkin
Given the Go module audit is complete
When `go get -u ./...` is run (or targeted updates applied) in each Go module root
Then go.mod and go.sum are updated for ayokoding-cli, rhino-cli, ayokoding-web, oseplatform-web
And the `go` directive is consistent across all four go.mod files
And `go build ./...` succeeds in ayokoding-cli and rhino-cli
And `nx build ayokoding-web` and `nx build oseplatform-web` produce successful Hugo builds
```

### AC-4: Hugo Themes Updated

```gherkin
Given the Hugo theme audit identifies newer releases of Hextra and PaperMod
When `hugo mod get -u` is run in ayokoding-web and oseplatform-web
Then go.mod and go.sum reflect the updated theme module versions
And `nx build ayokoding-web` succeeds with no layout or shortcode errors
And `nx build oseplatform-web` succeeds with no layout or shortcode errors
```

### AC-5: Flutter / Dart Packages Updated

```gherkin
Given the pub outdated audit is complete and the Flutter SDK constraint in pubspec.yaml is respected
When `flutter pub upgrade` is run in apps/organiclever-app/
Then pubspec.lock reflects the updated package versions
And `flutter build web` succeeds for the web target
And `flutter build apk` succeeds for the Android target
And all existing Flutter unit tests pass
```

### AC-6: Maven / Spring Boot Updated

```gherkin
Given the Maven version audit identifies newer stable Spring Boot and library versions
When the Spring Boot parent version and dependency versions are updated in pom.xml
Then `mvn verify` completes successfully inside apps/organiclever-be/
And all Spring Boot integration tests pass
And the actuator endpoints respond correctly on `mvn spring-boot:run`
```

### AC-7: No Regression in CI Gate

```gherkin
Given all per-ecosystem updates have been committed
When `nx affected -t test:quick` is run against the full set of changed projects
Then all projects pass the pre-push quality gate
And no new lint errors are introduced by the dependency updates
```

### AC-8: Lock Files Committed

```gherkin
Given dependency manifests have been updated in any ecosystem
When the changes are committed
Then the corresponding lock files are committed in the same commit
And no lock file is left in a dirty or partially updated state
```

### AC-9: NPM Security Gate

```gherkin
Given Phase 2 (NPM package updates) has been committed
When `npm audit` is run in the root workspace
Then the output reports zero critical severity CVEs
And the output reports zero high severity CVEs
```
