---
description: Defines the four required project.json tag dimensions (type, platform, language, domain) and the special-case rules for Rust libs and tooling projects.
when_to_use: Use when tagging a new project's project.json for the first time.
---

# Tag Convention — Four-Dimension Scheme

Tags are the standard mechanism for attaching structured metadata to projects in `project.json`. Nx uses tags for boundary enforcement (`@nx/enforce-module-boundaries`), graph filtering (`nx graph --focus`), and `nx affected` scoping. Consistent tags across the workspace allow tooling to query by project kind, framework, language, or product domain without parsing project names.

## Four-Dimension Scheme

Every project declares tags along four dimensions. Each dimension uses a fixed prefix and a controlled vocabulary.

| Dimension | Prefix      | Allowed Values                                                                            | Required                       | Purpose                                                       |
| --------- | ----------- | ----------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| Type      | `type:`     | `app`, `lib`, `e2e`                                                                       | Always                         | Distinguishes deployable apps, reusable libs, and test suites |
| Platform  | `platform:` | `axum`, `cli`, `gin`, `giraffe`, `nextjs`, `playwright`, `springboot`                     | Apps and e2e projects          | Framework or runtime environment                              |
| Language  | `lang:`     | `dotnet`, `fsharp`, `go`, `java`, `python`, `rust`, `ts`                                  | Projects with application code | Primary language of source code                               |
| Domain    | `domain:`   | `ayokoding`, `config`, `crane`, `ferret`, `organiclever`, `ose`, `roots`, `tooling`, `ui` | Always                         | Business or product domain                                    |

## Special Rules

**Rust libs omit `platform:`**: A Rust library has no framework or runtime boundary — only a primary language. Declare `type:lib` and `lang:rust`; omit `platform:`.

**Python projects carry `lang:python`**: A project whose targets run pytest declares `lang:python`. CI language detection and `nx affected` scoping key off `lang:*`, so an untagged Python project silently skips its gate; the static behaviour validator rejects a pytest-driven project without the tag.

**Values are listed alphabetically**: The vocabulary is a set, not a ranking. Alphabetical order makes an omission visible when a new project is tagged.

**Use `domain:roots` for generic Sharia-compliance tooling**: Services and libraries that implement Islamic-finance or Sharia-compliance capability for any consumer use `domain:roots`. Use `domain:ose` only for projects belonging exclusively to the OSE product surface.

**Use `domain:tooling` for general-purpose utilities**: Projects that are not tied to a specific product domain (e.g., `Rhino`) use `domain:tooling`. Use a product domain tag only when the project belongs exclusively to that product.
