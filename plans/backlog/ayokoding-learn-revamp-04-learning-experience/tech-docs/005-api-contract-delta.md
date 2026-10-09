# 005 — API Contract Delta

This plan is API-adjacent: it reads the tRPC procedure `coursePaths.getRouteData` and changes one
public HTTP address (`/en/learn/overview`). It adds no tRPC procedure, route handler, server action,
event, or protocol endpoint, and it sends nothing from the browser to any server.

## Surfaces Inspected (2026-10-09)

| Surface                           | Evidence                                                                                                                                                                                                                                   | Result                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| tRPC routers                      | `src/features/course-paths/shell/router.ts` (`getRouteData` returns `toCoursePathClientData(await loadRoutePathData(input), input)`), the content router, and the meta router. This plan adds no procedure and changes no input or output. | RETAIN `getRouteData`           |
| Route handlers and server actions | `src/app/**/route.ts` (feed, sitemap, tRPC handler). This plan adds none and uses no server action.                                                                                                                                        | No change                       |
| Redirects                         | `next.config.ts` `redirects()` and `src/redirects/*.ts`. This plan adds `src/redirects/learn-home.ts`.                                                                                                                                     | UPDATE `GET /en/learn/overview` |
| Browser-to-server data            | Progress lives in `localStorage` only; S1 asserts no non-`GET` request and no request carrying the key or record.                                                                                                                          | No new request                  |
| Machine-readable contracts        | The app has no OpenAPI or AsyncAPI document and no generated client for these surfaces.                                                                                                                                                    | None                            |

## Operation Index

| Action | Operation                                            | Section                                     |
| ------ | ---------------------------------------------------- | ------------------------------------------- |
| UPDATE | `GET /en/learn/overview` (page → permanent redirect) | [Op 1](#op-1--get-enlearnoverview)          |
| RETAIN | tRPC query `coursePaths.getRouteData`                | [Op 2](#op-2--trpc-coursepathsgetroutedata) |

## Op 1 — `GET /en/learn/overview`

- **Method and path:** `GET` (and `HEAD`) `/en/learn/overview`, with or without a query string.
- **Owning surface and caller:** `apps/ayokoding-www` Next.js redirect config; any browser, crawler,
  or old link.
- **Authentication, authorization, context:** none; public.
- **Request:** no headers required; no body; any query string is passed through by Next.js.
- **Before:** `200 OK`, `text/html`, the Overview page.
- **After (success):** `308 Permanent Redirect`, header `location: /en/learn` (plus the original query
  string when present), no meaningful body. The target `/en/learn` answers `200 OK` with the Learn home.

```http
GET /en/learn/overview HTTP/1.1
Host: localhost:3101
```

```http
HTTP/1.1 308 Permanent Redirect
location: /en/learn
```

- **Variants:** `/en/c/learn/overview` → `308` to `/en/learn/overview` (existing namespace rule) →
  `308` to `/en/learn`. `/EN/learn/overview` → `308` to `/en/learn/overview` (existing locale rule) →
  `308` to `/en/learn`.
- **Failures:** `/en/learn/overview/anything` → `404` (the rule has no `:path*`); `/id/learn/overview`
  → `404` as before (Indonesian Learn lives under `/id/belajar`).
- **Validation, idempotency, concurrency, pagination, rate limit:** none (static redirect).
- **Cache:** Next.js serves configured redirects without a cache header change; a 308 may be cached by
  browsers, which is intended for a permanent move.
- **Sensitive data:** none.
- **Machine-readable contract and codegen:** none.
- **Compatibility and rollout:** old links and bookmarks land on the Learn home in one or two hops.
  Search engines treat 308 as permanent. Rollback = revert the PR, which restores the page and
  removes the rule together.
- **Proof:** Unit (`tests/unit/redirects/learn-home.unit.test.ts`: the rule exists, is permanent, has
  no `:path*`, and sits after `courseRehomeRedirects` and before `learnThreeBucketRedirects` in
  `next.config.ts`); E2E (S31); manual `rtk curl` recipe in delivery Phase 6 and the production check
  after deploy. Integration: exempt (the redirect has no local resource boundary; the E2E against the
  production build is the alternative proof), using the standard exemption comment.

```gherkin
Scenario: S31 The old Learn overview address redirects to the Learn home
  When a visitor requests /en/learn/overview
  Then the response is a permanent redirect with status 308 to /en/learn

Scenario: S31a A deeper address under the old overview is not redirected
  When a visitor requests /en/learn/overview/anything
  Then the response status is 404
```

S31 lives in `specs/apps/ayokoding/www/behaviours/frontend/learning-progress/learn-home.feature`. S31a
joins the same file, also `@integration-exempt`, bound by the same unit test (no rule matches) and an
E2E request.

## Op 2 — tRPC `coursePaths.getRouteData`

- **Action:** RETAIN. Lesson pages now call it in one more situation (a remembered path for the
  current course, see [003](./003-active-path-and-navigation.md#active-path-rule)) through the existing
  `useRuntimeCoursePathData` hook, which already de-duplicates requests per locale.
- **Procedure:** query, input `"en" | "id"` (the locale schema), output `CoursePathClientData`
  (`manifests`, `prerequisitesByCourse`, `libraryCourseIds`, `courseLinks`, and plan 02's
  `outlineCourseIds`). Unchanged by this plan.
- **Authentication:** none; public. **Errors:** unchanged (invalid locale → tRPC `BAD_REQUEST`).
- **Cache, privacy:** unchanged. The request carries only the locale, never progress data.
- **Compatibility:** no field added, removed, or renamed. Lesson sequences reach the client as server
  props, not through tRPC (decision D6 in [007](./007-decision-records.md)).
- **Proof:** the existing router unit tests stay green; a new unit test asserts the output keys equal
  the set above; the request-log assertion in S1 shows only `GET` requests.

```gherkin
Scenario: The route data procedure keeps its output shape
  When the route data procedure is called for the English locale
  Then its output has exactly the keys manifests, prerequisitesByCourse, libraryCourseIds, courseLinks, and outlineCourseIds
```

This scenario is a unit test only (`tests/unit/features/course-paths/shell/route-data-shape.unit.test.ts`);
it guards the retained contract and adds no feature file.

## Contracts That Stay Authoritative

- The tRPC routers under `src/features/*/shell/router.ts`.
- `next.config.ts` `redirects()` with its module order.
- Plan 02's manifest schema and plan 03's metadata schema.
