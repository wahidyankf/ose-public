# Ubiquitous Language — settings

**Bounded context**: `settings`
**Maintainer**: organiclever-web team
**Last reviewed**: 2026-05-02

## One-line summary

User-local preferences (theme, locale, units) persisted in PGlite. Owns invariants like "exactly one preferences row per user" and the dark-mode toggle.

## Terms

| Term            | Definition                                                                                                    | Code identifier(s)             | Used in features     |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------- |
| `Preferences`   | The aggregate holding all user-local settings. Singleton per user.                                            | `Preferences` (TS type)        | `settings/*.feature` |
| `Theme`         | One of `light`, `dark`, or `system`. Drives the `data-theme` attribute on `<html>`.                           | `Theme` (TS string-literal)    | `settings/*.feature` |
| `Locale`        | BCP-47 language tag. Governs i18n key resolution in `app-shell`.                                              | `Locale` (TS type)             | `settings/*.feature` |
| `Units`         | Measurement units (`kg`/`lb`, `cm`/`in`, etc.) applied to weights and lengths displayed by the UI.            | `Units` (TS type)              | `settings/*.feature` |
| `Settings page` | The route `/app/settings` rendering the preferences form.                                                     | (route segment) `app/settings` | `settings/*.feature` |
| `Reset data`    | The action that wipes all PGlite stores (journal, routine, settings) and returns the user to the empty state. | `resetAllData` (use-case fn)   | `settings/*.feature` |
| `Export data`   | The action that serializes all PGlite stores into a downloadable JSON file.                                   | `exportAllData` (use-case fn)  | `settings/*.feature` |

## Forbidden synonyms

- "Profile" — not a v0 concept (no auth). Reserved for the disabled `/profile` 404 guard, owned by `routing`.
- "Configuration" — used by `app-shell` to mean runtime configuration (i18n keys, design tokens). Inside `settings`, prefer "preferences".
- "Theme" inside `app-shell` — `app-shell` consumes the resolved theme as a CSS class; only `settings` owns the user-chosen value.
