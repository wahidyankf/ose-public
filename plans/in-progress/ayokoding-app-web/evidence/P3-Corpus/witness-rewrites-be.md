# P3-Corpus: be witness rewrites

The be real-corpus config starts its server with no fixture selected; the be fixture config starts it with
`AYOKODING_WEB_FIXTURE=parity`. A step that expects fixture content either reads a rule-found witness (real config) or
keeps its fixture literal in the fixture config only. Witnesses come from `apps/ayokoding-web-be-e2e/tests/e2e/support/witness.ts`
and are chosen by rule over `apps/ayokoding-www/content`, never by hard-coded title.

## Rewritten steps (real config)

| Step file                                         | Step                                                                                                                     | Before                                             | Rule-found witness or change                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `content-rendering-http.steps.ts`                 | "a published Markdown lesson exists in the shared corpus"; "a reader requests its route without running browser scripts" | `/en/learn/courses/go-basics/learning/hello-world` | `lessonRoute` (first served lesson witness)                                                               |
| `content-rendering-http.steps.ts`                 | "the response contains the lesson title and readable article body"                                                       | `Hello World`                                      | `frontmatterTitle(lessonFile)` of the same witness                                                        |
| `discovery-documents.steps.ts`                    | "a reader requests a published content page"; "its HTML contains the current title, description, and canonical URL"      | go-basics literals, `Hello World`, `First program` | `courseRoute`; `frontmatterTitle(courseFile)`, `frontmatterDescription(courseFile)`, and the route itself |
| `discovery-documents.steps.ts`                    | "the sitemap lists canonical published routes"                                                                           | go-basics route literal                            | `lessonRoute`                                                                                             |
| `discovery-documents.steps.ts`                    | "feed entries have the existing ordering, metadata, and canonical destinations"                                          | `Hello World` marker                               | the `Hello World` marker is removed; `<item>` and the canonical base URL are still checked                |
| `routes-and-navigation-http.steps.ts`             | "the redirect does not depend on the old page still existing"                                                            | redirect destination taken from a literal          | `locationOf(request).split("?")[0] ?? ""`, asserted non-empty, then fetched and expected `200`            |
| `routes-and-navigation-http.feature` Examples row | the redirect lesson, `learning/intro` -> `learning/beginner`                                                             | `just-enough-python/learning/intro`                | `just-enough-python/learning/beginner` (`intro` does not exist in the real corpus)                        |

The `routes-and-navigation-http.steps.ts` import of `lessonRoute` was removed because nothing uses it.

## Fixture-only steps (fixture config, unchanged literals)

| Step file                            | Step                                                                    | Note                                                                                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local-development-http.steps.ts`    | "the {string} fixture is selected"                                      | Declared as `async ({ request: _request }, fixture: string)` with `expect(fixture).toBe("parity")`. A zero-argument form failed bddgen with "incorrect arguments"; an empty `{}` pattern warned under lint. |
| `routes-and-navigation-http.feature` | "A fixture-only old URL redirects 308 to its current page" (`@fixture`) | Uses the literal fixture route. The real-config run of the same step failed (404) because the step read the real lesson witness.                                                                            |

## Behaviour of the redirect step

The earlier shared step checked the redirect destination against a page that exists only in the fixture. It now asserts
that the Location is non-empty and that the destination answers 200 on the server under test. The check does not depend
on the old page still existing.

## Evidence

- `be-real-final.raw.txt`: 20 passed (be real-corpus config, final run).
- `be-fixture-final.raw.txt`: 5 passed (be fixture config, final run).
- `witness-red-be.raw.txt` and `witness-red-be-real.raw.txt`: the RED output of the real config with the switch removed.
- `witness-rewrite-be-real.raw.txt`: the first real-config run after the rewrites.
- Be typecheck and lint: `be-typecheck-1.raw.txt` and `be-lint-1.raw.txt`, both clean.
