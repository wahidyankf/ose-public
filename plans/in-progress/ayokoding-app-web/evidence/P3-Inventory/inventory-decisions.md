# P3-Inventory decisions from the old-app verification

Inputs: the saved old sitemap (`old-sitemap.xml`, 3,279 `<loc>` entries), the committed redirect export
(`apps/ayokoding-web/internal/web/testdata/www-redirects.json`, 87 rules), and the old route tree
(`apps/ayokoding-www/src/app`). The inventory generated from them lists 3,291 URLs and 87 redirect sources.

## Verification result

- All 3,291 inventory URLs were requested once each against the running old app, with no redirect followed.
  3,290 answered 200 at the same path.
- The one URL that did not answer 200 is `/`. It answers 308 to `/en`.
- All 87 redirect sources answer the status and target the export records, when `:path*` is replaced by a sample
  segment. None differ.
- Twelve route-derived URLs are inventory entries the old sitemap does not list. Eleven answered 200. `/` is the
  twelfth; see below.

## Decision: `/` stays in the inventory

`/` is served by `apps/ayokoding-www/src/app/(entry)/page.tsx`, which calls `redirect(DEFAULT_LOCALE_HREF)` and so
sends every visitor to the default locale. The old app is correct to answer it with a redirect. The verifier's
expectation of 200 was wrong for this URL, so this is not a generator mismatch.

- The generator keeps `/`, because the route tree serves it.
- The gap report classifies `/` as `redirect` (status 308, not followed). It is not counted as a failure.
- The export does not list `/` as a redirect source, because `/` comes from a page, not a redirect rule.
- No route pattern failed its expansion, so no pattern was removed.

## Generator mismatches

None. The inventory and redirect export match the old app for every checked URL and source, except the `/` decision
above.

## Determinism

Two generations of the inventory were byte-identical (`inventory-determinism.txt`). A third generation after the
Go changes in this unit (`Body.Close` returned, and fail-loudly panics for two unreachable branches) was also
byte-identical to the committed file.
