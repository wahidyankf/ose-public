---
description: The current per-project tag table, two worked tag-declaration examples, and the tag anti-patterns to avoid.
when_to_use: Use when copying an existing project's tag set as a template or checking a new tag set against known anti-patterns.
---

# Tag Convention — Tags, Examples, and Anti-Patterns

## Current Project Tags

| Project                    | Tags                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| `ayokoding-www`            | `["type:app", "platform:nextjs", "lang:ts", "domain:ayokoding"]`         |
| `ayokoding-www-be-e2e`     | `["type:e2e", "platform:playwright", "lang:ts", "domain:ayokoding"]`     |
| `ayokoding-www-fe-e2e`     | `["type:e2e", "platform:playwright", "lang:ts", "domain:ayokoding"]`     |
| `crane-cli`                | `["type:app", "platform:cli", "lang:fsharp", "domain:crane"]`            |
| `roots-be` †               | `["type:app", "platform:gin", "lang:go", "domain:roots"]`                |
| `roots-be-e2e` †           | `["type:e2e", "platform:playwright", "lang:ts", "domain:roots"]`         |
| `roots-contracts` †        | `["type:lib", "domain:roots"]`                                           |
| `organiclever-app-web`     | `["type:app", "platform:nextjs", "lang:ts", "domain:organiclever"]`      |
| `organiclever-app-web-e2e` | `["type:e2e", "platform:playwright", "lang:ts", "domain:organiclever"]`  |
| `organiclever-be`          | `["type:app", "platform:giraffe", "lang:fsharp", "domain:organiclever"]` |
| `organiclever-be-e2e`      | `["type:e2e", "platform:playwright", "lang:ts", "domain:organiclever"]`  |
| `organiclever-www`         | `["type:app", "platform:nextjs", "lang:ts", "domain:organiclever"]`      |
| `organiclever-www-fe-e2e`  | `["type:e2e", "platform:playwright", "lang:ts", "domain:organiclever"]`  |
| `ose-app-web`              | `["type:app", "platform:nextjs", "lang:ts", "domain:ose"]`               |
| `ose-app-web-e2e`          | `["type:e2e", "platform:playwright", "lang:ts", "domain:ose"]`           |
| `ose-be`                   | `["type:app", "platform:giraffe", "lang:fsharp", "domain:ose"]`          |
| `ose-be-e2e`               | `["type:e2e", "platform:playwright", "lang:ts", "domain:ose"]`           |
| `ose-id-be`                | `["type:app", "platform:aspnetcore", "lang:csharp", "domain:ose"]`       |
| `ose-id-be-e2e` ‡          | `["type:e2e", "platform:dotnet", "lang:csharp", "domain:ose"]`           |
| `ose-id-web`               | `["type:app", "platform:nextjs", "lang:ts", "domain:ose"]`               |
| `ose-id-web-e2e`           | `["type:e2e", "platform:playwright", "lang:ts", "domain:ose"]`           |
| `ose-www`                  | `["type:app", "platform:nextjs", "lang:ts", "domain:ose"]`               |
| `ose-www-be-e2e`           | `["type:e2e", "platform:playwright", "lang:ts", "domain:ose"]`           |
| `ose-www-fe-e2e`           | `["type:e2e", "platform:playwright", "lang:ts", "domain:ose"]`           |
| `Rhino`                    | `["type:app", "platform:cli", "lang:fsharp", "domain:tooling"]`          |
| `fsharp-crane-core`        | `["type:lib", "lang:fsharp", "domain:crane"]`                            |
| `fsharp-env-loader`        | `["type:lib", "lang:fsharp", "domain:config"]`                           |
| `ts-env-loader`            | `["type:lib", "lang:ts", "domain:config"]`                               |
| `web-ui`                   | `["type:lib", "lang:ts", "domain:ui"]`                                   |
| `web-ui-token`             | `["type:lib", "lang:ts", "domain:ui"]`                                   |

† Landed with the projects in `islamic-be-init` DU2–DU4.
‡ Uses Reqnroll/xUnit instead of Playwright — `ose-id-be` is the repository's first C# app; see
`docs/explanation/software-engineering/programming-languages/c-sharp/testing-standards.md` and
`evidence/phase-1/bdd-tooling-csharp-extension.txt`.

## Example: Complete Tag Declaration

An F#/Giraffe backend app declares all four dimensions:

```json
{
  "name": "organiclever-be",
  "tags": ["type:app", "platform:giraffe", "lang:fsharp", "domain:organiclever"]
}
```

A library has no platform boundary, so it omits `platform:` and declares the other three:

```json
{
  "name": "ts-env-loader",
  "tags": ["type:lib", "lang:ts", "domain:config"]
}
```

A Java/Spring Boot backend app follows the same four-dimension shape:

```json
{
  "name": "ose-lms-be",
  "tags": ["type:app", "platform:springboot", "lang:java", "domain:ose"]
}
```

## Anti-Patterns

- **Omitting required dimensions**: Every project must declare `type:` and `domain:`. Omitting them breaks graph queries and boundary rules that rely on these dimensions.
- **Inventing non-standard values**: Adding values outside the controlled vocabulary (e.g., `platform:express`, `lang:javascript`, `domain:internal`) fragments the tag space. Add new values only by updating this convention.
- **Using a non-prefixed format**: Tags must use the `dimension:value` prefix format (e.g., `type:app`). Bare tags such as `app` or `golang` are not queryable by dimension.
- **Adding a `stack:` dimension**: The four-dimension scheme captures type, platform, language, and domain. A separate `stack:` field duplicates `platform:` and `lang:` without adding information. Use the defined dimensions instead.
- **Tagging apps with `domain:tooling` when they belong to a product**: `domain:tooling` is for general-purpose dev utilities with no product affiliation. An app that serves a specific product must carry that product's domain tag.
