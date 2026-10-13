# 010 — API Contract Delta: `content.getTree` Course Category

This plan is API-bearing in exactly one place: the tRPC query `content.getTree`
gains an optional `category` field on its tree nodes. This document is the
contract delta for that change. Everything else in the HTTP surface is
unchanged.

## Operation

| Aspect              | Before                                         | After                                  |
| ------------------- | ---------------------------------------------- | -------------------------------------- |
| Procedure           | `content.getTree` (query, public, no auth)     | Unchanged                              |
| Input               | `{ locale: "en" \| "id", rootSlug?: string }`  | Unchanged                              |
| Output node         | `{ title, slug, weight, isSection, children }` | Same, plus optional `category: string` |
| `content.getBySlug` | Page payload including `description`           | Unchanged (no shape change)            |

The procedure is mounted by spreading `navigationProcedures` into the
`content` router (`src/features/app-shell/shell/root-router.ts`); its input
schema lives in `src/features/navigation/shell/router.ts` and its output is
validated by `treeNodeSchema` in `src/features/navigation/core/schemas.ts`.
This plan adds `category: z.string().optional()` to that output schema;
without it the serializer would drop the field.

## Semantics

- `category` is present only on a node whose course `_index.md` frontmatter
  carries a `category` value that survived the tolerant runtime parse
  (`frontmatterSchema` `.catch(undefined)`). Today only course root nodes
  (`learn/courses/<id>`) carry it.
- When no category is known, the key is **absent** from the serialized JSON —
  never `null` and never an explicit `undefined`. Existing consumers that
  compare whole nodes with `toEqual` therefore see no change for
  category-less trees.
- The value is the raw category id string (for example
  `data-and-databases`). The runtime schema deliberately does not restrict it
  to the 14 known ids: a typo degrades to the catalog's "Other courses"
  grouping instead of hiding the page (NFR-07). The strict 14-id check lives
  in tests (`courseMetadataSchema`), not on the wire.
- No other field changes: no rename, no removal, no type change, no new
  required input, no pagination or ordering change (`weight` order is
  untouched).

## Serialized examples

Course node with a category (after):

```json
{
  "title": "SQL Essentials",
  "slug": "learn/courses/sql-essentials",
  "weight": 200,
  "isSection": true,
  "category": "data-and-databases",
  "children": []
}
```

Node without a category (before and after — byte-identical):

```json
{
  "title": "Learning",
  "slug": "learn/courses/sql-essentials/learning",
  "weight": 100,
  "isSection": true,
  "children": []
}
```

## Errors

Unchanged. An unknown locale still fails input validation; an unknown
`rootSlug` still returns an empty array; `content.getBySlug` for a missing
page still returns tRPC `NOT_FOUND` ("Page not found"). This delta adds no
new error code and no new failure mode: a malformed `category` in frontmatter
is dropped by the tolerant parse before it can reach the wire.

## Compatibility and rollback

- **Additive optional output field.** Old clients ignore unknown keys; new
  clients reading an old server simply see the key absent and render the
  "Other courses" fallback. Both directions are safe to deploy in any order.
- **Rollback** is the plan rollback in
  [002](./002-metadata-schema-and-migration.md#rollback): reverting the code
  removes the field from the schema and the wire; the frontmatter keys stay
  harmlessly in content because the old schema strips unknown keys.

## Contract scenarios

The delta is pinned by the Gherkin scenario "Course nodes carry their
category" in `backend/navigation/navigation-api.feature` (see
[006](./006-testing-strategy.md#gherkin-to-test-binding-map)): the
`sql-essentials` node includes `category: "data-and-databases"`, and nodes
without a category have no `category` field. It binds in Unit, Integration,
and both E2E adapters. The manual wire recipe that exercises the live
endpoint is in
[delivery.md Phase 5](../delivery.md#api-http-quality-gate-and-rule-16-retest).
