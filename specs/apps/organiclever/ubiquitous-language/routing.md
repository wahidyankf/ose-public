# Ubiquitous Language — routing

**Bounded context**: `routing`
**Maintainer**: organiclever-web team
**Last reviewed**: 2026-05-02

## One-line summary

Disabled-route guards. v0 has no authentication, so `/login` and `/profile` exist only as 404 stubs to communicate "feature not yet available" without leaking placeholders into other contexts.

## Terms

| Term             | Definition                                                                                     | Code identifier(s)                   | Used in features    |
| ---------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------- |
| `Disabled route` | A route deliberately rendering `not-found.tsx` because the underlying feature is not v0 scope. | `DisabledRoute` (component)          | `routing/*.feature` |
| `/login` guard   | The 404 stub at `/login`. Communicates "no auth in v0".                                        | (route segment) `login`              | `routing/*.feature` |
| `/profile` guard | The 404 stub at `/profile`. Communicates "no profile in v0".                                   | (route segment) `profile`            | `routing/*.feature` |
| `Not-found page` | The shared 404 component used by disabled routes and any other unmatched URL.                  | `NotFound` (Next.js `not-found.tsx`) | `routing/*.feature` |

## Forbidden synonyms

- "Auth" / "authentication" / "session" — not v0 concepts. Anywhere these appear in source or specs without explicit "out-of-scope" framing is a finding.
- "Profile" — owned here only as a disabled-route surface. Never as a settings/preferences synonym (those belong to `settings`).
- "404" — generic browser term; prefer "disabled route" when describing OrganicLever's intentional guards versus genuine "page not found".
