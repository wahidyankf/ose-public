---
title: "GitHub Actions Workflow Naming Convention"
description: Workflow filenames must mirror their workflow name field using kebab-case derivation
category: explanation
subcategory: development
tags:
  - github-actions
  - ci-cd
  - naming
  - workflow
created: 2026-03-13
updated: 2026-03-13
---

# GitHub Actions Workflow Naming Convention

GitHub Actions workflow files live in `.github/workflows/`. The filename of each workflow file must mirror its `name:` field. Developers must be able to derive the filename from the workflow name shown in the GitHub Actions UI, and vice versa.

## Principles Implemented/Respected

This convention implements/respects the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: The mapping between what GitHub Actions displays and what lives on disk is made explicit and deterministic. No guessing which file corresponds to a failing workflow run.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: A consistent mechanical derivation rule makes it possible to validate filename/name alignment automatically, without relying on human review.

## Conventions Implemented/Respected

This practice respects the following conventions:

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Workflow filenames use kebab-case, consistent with the broader file naming rules applied across the repository.

## Purpose

GitHub shows the `name:` field in the Actions tab, in PR status checks, and in email notifications. When a workflow fails, developers look at the name in the UI then need to find and edit the corresponding `.yml` file. Without a consistent mapping rule, locating the right file requires opening files until the matching name is found.

This convention eliminates that friction by requiring the filename to be a mechanical kebab-case derivation of the `name:` field.

## Scope

### What This Convention Covers

- All workflow files under `.github/workflows/`
- The relationship between the `name:` field and the `.yml` filename

### What This Convention Does NOT Cover

- Workflow content, structure, or job naming
- Reusable workflows called via `workflow_call`
- Scheduled or manually triggered workflow naming beyond the filename/name mapping

## Standards

### Derivation Rule

Derive the filename from the `name:` field by applying these transformations in order:

1. Convert to lowercase
2. Replace spaces with hyphens
3. Remove special characters: `+`, `(`, `)`, `/`, `#`
4. Replace `-` (space-hyphen-space) with `-`
5. Collapse consecutive hyphens to a single hyphen
6. Append `.yml`

The result must exactly match the filename (without path).

### Transformation Table

| Character or pattern in `name:` | Becomes in filename |
| ------------------------------- | ------------------- |
| Space (` `)                     | `-`                 |
| `-` (spaced hyphen)             | `-`                 |
| `+`                             | removed             |
| `(`                             | removed             |
| `)`                             | removed             |
| `/`                             | removed             |
| `#`                             | removed             |
| Consecutive hyphens (`--`)      | `-`                 |

### Complete Codebase Reference

Every workflow currently in the repository follows this rule:

| `name:` field                           | Filename                              |
| --------------------------------------- | ------------------------------------- |
| `Main CI`                               | `main-ci.yml`                         |
| `PR - Quality Gate`                     | `pr-quality-gate.yml`                 |
| `PR - Format`                           | `pr-format.yml`                       |
| `PR - Validate Links`                   | `pr-validate-links.yml`               |
| `Test and Deploy - AyoKoding Web`       | `test-and-deploy-ayokoding-web.yml`   |
| `Test and Deploy - OSE Platform Web`    | `test-and-deploy-oseplatform-web.yml` |
| `Test Demo Backend (Java/Spring Boot)`  | `test-demo-be-java-springboot.yml`    |
| `Test Demo Backend (Java/Vert.x)`       | `test-demo-be-java-vertx.yml`         |
| `Test Demo Backend (Elixir/Phoenix)`    | `test-demo-be-elixir-phoenix.yml`     |
| `Test Demo Backend (F#/Giraffe)`        | `test-demo-be-fsharp-giraffe.yml`     |
| `Test Demo Backend (Go/Gin)`            | `test-demo-be-golang-gin.yml`         |
| `Test Demo Backend (Python/FastAPI)`    | `test-demo-be-python-fastapi.yml`     |
| `Test Demo Backend (Rust/Axum)`         | `test-demo-be-rust-axum.yml`          |
| `Test Demo Backend (Kotlin/Ktor)`       | `test-demo-be-kotlin-ktor.yml`        |
| `Test Demo Backend (TypeScript/Effect)` | `test-demo-be-ts-effect.yml`          |
| `Test Demo Backend (C#/ASP.NET Core)`   | `test-demo-be-csharp-aspnetcore.yml`  |
| `Test Demo Backend (Clojure/Pedestal)`  | `test-demo-be-clojure-pedestal.yml`   |
| `Test OrganicLever Web`                 | `test-organiclever-web.yml`           |
| `Test - demo-fe-ts-nextjs`              | `test-demo-fe-ts-nextjs.yml`          |

## Examples

### PASS: Correctly aligned name and filename

```yaml
# File: .github/workflows/pr-quality-gate.yml
name: PR - Quality Gate
```

Derivation: `PR - Quality Gate` → lowercase → `pr - quality gate` → spaces to hyphens → `pr---quality-gate` → collapse hyphens → `pr-quality-gate` → append `.yml` → `pr-quality-gate.yml`. Matches filename.

---

```yaml
# File: .github/workflows/test-demo-be-java-springboot.yml
name: Test Demo Backend (Java/Spring Boot)
```

Derivation: `Test Demo Backend (Java/Spring Boot)` → lowercase → `test demo backend (java/spring boot)` → remove `(`, `)`, `/` → `test demo backend javaspring boot` → spaces to hyphens → `test-demo-backend-javaspring-boot` → collapse hyphens → `test-demo-backend-javaspring-boot` → append `.yml` → `test-demo-backend-javaspring-boot.yml`.

The actual filename is `test-demo-be-java-springboot.yml`. The `name:` uses the full word `Backend` while the filename abbreviates to `be`, and `Java/Spring Boot` maps to `java-springboot`. This is deliberate shortening for filename length. See the Special Considerations section below.

### FAIL: Misaligned name and filename

```yaml
# File: .github/workflows/quality-gate.yml  ← missing "pr-" prefix
name: PR - Quality Gate
```

A developer seeing "PR - Quality Gate" fail in the UI would look for `pr-quality-gate.yml`. They would not find it under `quality-gate.yml`.

## Special Considerations

### Permitted abbreviations for long names

When the fully derived filename would be excessively long (over 60 characters before `.yml`), abbreviations are permitted provided they are applied consistently and the mapping remains obvious. Established abbreviations in this codebase:

| Full word/phrase | Abbreviation                       |
| ---------------- | ---------------------------------- |
| `Backend`        | `be`                               |
| `Spring Boot`    | `springboot` (no space, no hyphen) |
| `ASP.NET Core`   | `aspnetcore`                       |

When using an abbreviation, update this table so the mapping remains documented and reviewable.

### Language/framework identifiers in parentheses

The pattern `(Language/Framework)` in a name maps to `language-framework` in the filename: parentheses are removed, the `/` is removed, a hyphen separates language from framework, and the whole segment is lowercased. For example, `(Java/Spring Boot)` → `java-springboot`.

### Adding new workflows

When creating a new workflow:

1. Choose a `name:` that describes the workflow's purpose clearly (it appears in the GitHub UI).
2. Derive the filename from the `name:` using the rule above.
3. If the derived name would exceed 60 characters, apply a documented abbreviation.
4. Add the new pair to the reference table in this document.

## Tools and Automation

Currently no automated validator enforces this rule. The `repo-governance-checker` agent validates adherence during governance audits.

## References

**Related Development Standards:**

- [Nx Target Standards](./nx-targets.md) - Consistent naming applied to Nx target identifiers
- [Commit Message Convention](../workflow/commit-messages.md) - Another naming consistency rule for developer-facing identifiers

**Agents:**

- `repo-governance-checker` - Validates that workflow filenames match their `name:` fields
- `repo-governance-fixer` - Corrects misaligned workflow filenames or name fields
