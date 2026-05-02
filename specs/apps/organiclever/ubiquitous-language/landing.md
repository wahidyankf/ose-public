# Ubiquitous Language — landing

**Bounded context**: `landing`
**Maintainer**: organiclever-web team
**Last reviewed**: 2026-05-02

## One-line summary

Marketing landing surface at `/` — hero, features, principles, rhythm demo, footer. No domain logic; pure presentational content.

## Terms

| Term                 | Definition                                                                                     | Code identifier(s)              | Used in features    |
| -------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------- | ------------------- |
| `Landing page`       | The route `/` rendering the marketing surface (no `/app` chrome).                              | (route) `/`                     | `landing/*.feature` |
| `Hero`               | The primary above-the-fold headline + CTA block.                                               | `LandingHero` (component)       | `landing/*.feature` |
| `Features section`   | The block listing OrganicLever's product features.                                             | `LandingFeatures` (component)   | `landing/*.feature` |
| `Principles section` | The block describing the OrganicLever approach (functional, local-first, measured).            | `LandingPrinciples` (component) | `landing/*.feature` |
| `Rhythm demo`        | The animated tile illustrating daily rhythm — a representative widget on the landing page.     | `LandingRhythmDemo` (component) | `landing/*.feature` |
| `Landing nav`        | The top navigation visible on `/`, distinct from the `app-shell` SideNav/TabBar inside `/app`. | `LandingNav` (component)        | `landing/*.feature` |
| `Landing footer`     | The closing section with links and metadata.                                                   | `LandingFooter` (component)     | `landing/*.feature` |
| `CTA`                | The "Open the app" call-to-action button linking from `/` to `/app/home`.                      | (button label) "Open the app"   | `landing/*.feature` |

## Forbidden synonyms

- "App" — `app-shell` owns the chrome inside `/app/**`. The landing page is _not_ the app; prefer "landing page".
- "Home" — used inside `/app/home` for the post-login dashboard, owned by `journal` + `app-shell`. The landing page is the marketing surface, not "home".
- "Header" / "footer" alone — qualify as `LandingNav`/`LandingFooter` to keep them distinct from `app-shell`'s header chrome.
