# Ubiquitous Language — app-shell

**Bounded context**: `app-shell`
**Maintainer**: organiclever-web team
**Last reviewed**: 2026-05-02

## One-line summary

Cross-cutting UI shell — i18n keys, design tokens, layout chrome, navigation skeleton, error boundaries, app loggers, and the UI shell xstate machine. Shared kernel; owns no domain entities.

## Terms

| Term             | Definition                                                                                                                | Code identifier(s)                     | Used in features      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------- |
| `App shell`      | The persistent UI frame mounted under `/app/**` — header, side nav, tab bar, overlay tree.                                | (folder) `src/contexts/app-shell/`     | `app-shell/*.feature` |
| `appMachine`     | The xstate v5 UI-shell machine tracking `darkMode`, `isDesktop`, and selected logger overlay. No IO, no aggregate model.  | `appMachine` (xstate v5 machine)       | `app-shell/*.feature` |
| `i18n key`       | A string identifier (e.g. `home.title`) resolved at render time to a localized string by `app-shell`'s translation table. | `useT()`, `translations` (TS table)    | `app-shell/*.feature` |
| `Design token`   | A semantic CSS variable (e.g. `--color-primary`) consumed by all contexts' presentation layers.                           | `--color-primary`, `--font-sans`, etc. | `app-shell/*.feature` |
| `TabBar`         | The 60 px mobile bottom navigation rendered for `/app/home`, `/app/history`, `/app/progress`, `/app/settings`.            | `TabBar` (component)                   | `app-shell/*.feature` |
| `SideNav`        | The 220 px desktop side navigation rendered above the `lg` breakpoint.                                                    | `SideNav` (component)                  | `app-shell/*.feature` |
| `Overlay tree`   | The portal root mounting bottom sheets, modals, and the Add Entry / Logger overlays above the page tree.                  | `OverlayTree` (component)              | `app-shell/*.feature` |
| `Logger`         | A development-only debug surface (e.g. focus logger) toggled from the app shell.                                          | (folder) `loggers/`                    | `app-shell/*.feature` |
| `Error boundary` | The React error boundary catching render errors inside `/app/**` and rendering a recoverable fallback.                    | `ErrorBoundary` (component)            | `app-shell/*.feature` |

## Forbidden synonyms

- "Theme" as a stored value — owned by `settings`. Inside `app-shell`, prefer "resolved theme" (the CSS class applied to `<html>` after reading `Preferences.theme`).
- "Layout" — overloaded term in Next.js. Inside `app-shell`, prefer "app shell" or "chrome".
- "Domain" — `app-shell` owns no domain entities. Reject any "domain object" in this context's source.
