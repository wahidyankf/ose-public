# `playwright-bdd` companion repin evidence

Status: exact manifest and lock repin complete. Runtime compatibility revalidation remains open; this report does not claim any post-upgrade target passed.

## Selection and scope

Date checked: 2026-10-27. The user explicitly selected exact `playwright-bdd` 9.2.1 for the ten existing consumers and shared lockfile. The npm registry dates 9.2.1 to 2026-09-06. The repository's 60-day cutoff is 2026-08-28, so 9.2.1 does **not** meet the Path B age rule; 9.2.0, released 2026-06-18, does. The coordinator directed honoring the already-approved exact selection as a one-off version selection. This is recorded as an age exception, not normal Path B compliance and not a Path C security waiver.

The npm registry reports 9.2.1 as non-deprecated, with Node `>=20` and peer `@playwright/test >=1.44`. Its changelog says 9.2.1 removes obsolete experimental component-testing dependencies to support Playwright 1.63; 9.1.0 is the release whose changelog explicitly adds Playwright 1.61 support. The exact selected version remains compatible with the repository's Node 24 and Playwright 1.61 pins.

The only source-manifest edits in this repin replace the exact `playwright-bdd` pin from 8.5.1 to 9.2.1 in these ten existing manifests:

- `apps/ayokoding-www-be-e2e/package.json`
- `apps/ayokoding-www-fe-e2e/package.json`
- `apps/ose-www-be-e2e/package.json`
- `apps/ose-www-fe-e2e/package.json`
- `apps/organiclever-www-fe-e2e/package.json`
- `apps/ose-be-e2e/package.json`
- `apps/organiclever-be-e2e/package.json`
- `apps/ose-app-web-e2e/package.json`
- `apps/organiclever-app-web-e2e/package.json`
- `libs/web-ui/package.json`

No root dependency, feature, step definition, test, report option, CI file, timeout, coverage rule, or runtime setting was changed. Root `@cucumber/gherkin` 32.2.0 and `@cucumber/messages` 27.2.0 remain exact. Resolved Playwright identities remain 1.61.0; Next.js and `@next/third-parties` remain 16.4.3.

## Registry and lock verification

`npm view playwright-bdd@9.2.1` against `https://registry.npmjs.org` returned version 9.2.1, release date 2026-09-06, no deprecation flag, Node `>=20`, peer `@playwright/test >=1.44`, and tarball `https://registry.npmjs.org/playwright-bdd/-/playwright-bdd-9.2.1.tgz`.

The registry SRI is `sha512-gi7LTeat3ar1mPO53UBqQIv0HYHaw+GXq7P3stxGLPVlRpbW1ZmWre/yQBV/mtInJgEmKwBrJ/V1zT8NmJOuzg==`. An independently downloaded 289,867-byte tarball produced the same SHA-512 SRI. The post-install lock entry carries that URL and integrity.

The exact `npm install --registry=https://registry.npmjs.org` ran through the repository-pinned `./hippo` transactional/standard boundary and exited 0. The resulting `npm ls playwright-bdd @playwright/test playwright playwright-core next @next/third-parties @cucumber/gherkin @cucumber/messages` ran through HIPPO ephemeral/standard and exited 0. It confirms all ten existing consumers use 9.2.1, Playwright packages stay at 1.61.0, the two root Cucumber pins remain 32.2.0 and 27.2.0, and Next.js remains 16.4.3. BDD's newer Cucumber dependencies are nested where their ranges do not match those unchanged root pins.

| Receipt                                                                                    | SHA-256 / value                                                    |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Prior shared lock before this repin                                                        | `d77f4da841c99d306cd6eb6bf67f500dda20627cf7fbc5974fd4d5962a69ee04` |
| Resulting shared lock                                                                      | `8b518bdfcd60570205dd893813e1cb2529de0fb54a0fff885967024189b30aa2` |
| Current `git diff -- package-lock.json` digest (includes prior approved dependency repins) | `0f22d2b846ae656bf1644e50b9b9173e0c71acbb55105cbb943d097b2f372940` |

No unrelated dependency update was identified in the install delta: the changed lock closure is the approved `playwright-bdd`/Cucumber closure, while the already-approved Playwright and Next.js lock identities remain as previously recorded. The shared-lock diff digest above is explicitly against the worktree base and therefore also includes those earlier approved repins.

## Security and functional checks

The five required security sources were checked as of 2026-10-27:

1. [NVD keyword search for `playwright-bdd`](https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=playwright-bdd) returned zero CVEs.
2. [GitHub Advisory Database query for the npm package and 9.2.1](https://api.github.com/advisories?ecosystem=npm&affects=playwright-bdd%409.2.1&per_page=100) returned no advisories; the [upstream repository's advisories page](https://github.com/vitalets/playwright-bdd/security/advisories) also showed no published advisories.
3. [Snyk's `playwright-bdd` page](https://security.snyk.io/package/npm/playwright-bdd/9.2.1) reports no direct vulnerabilities and explicitly does not cover vulnerabilities in dependencies.
4. The upstream [changelog](https://github.com/vitalets/playwright-bdd/blob/main/CHANGELOG.md) lists no security or release-blocker notice for 9.2.1. Registry metadata has no deprecation field.
5. The current full-lock npm audit references CVE-2026-14257, CVE-2026-33937, and CVE-2026-59870. None is present in the [CISA KEV catalog mirror](https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json), catalog version 2026.10.26. FIRST EPSS values dated 2026-10-26 are: CVE-2026-14257 0.643% (50.525th percentile), CVE-2026-33937 1.907% (79.616th percentile), and CVE-2026-59870 0.740% (54.308th percentile). Each CVSS score is at least 7.0; none has EPSS at or above the 0.5 escalation threshold.

`npm audit --json` ran through HIPPO ephemeral/standard and exited 1 because the full monorepo lock contains existing findings. Before this BDD repin, the saved audit reported 76 findings (7 low, 30 moderate, 34 high, 5 critical). The fresh audit reports 74 (7 low, 28 moderate, 34 high, 5 critical). The two fewer moderate findings are the previous `playwright-bdd@8.5.1` and `@cucumber/gherkin-utils` findings; no new vulnerable package/advisory appeared. Existing root Cucumber findings remain under the explicitly preserved root pins. No audit fix was run.

The selected 9.x line introduces strict Cucumber-compatible step-arity validation. The independent pre-upgrade inventory identified ten consumer corpora with 171 files and 1,705 step declarations, and found no use of the removed `enrichReporterData`, `junit-modern`, `nameFormat`, attachments options, or BDD reporter imports. These static observations do not prove runtime compatibility. No source changes were made preemptively.

## Validation boundary and receipts

The pre-upgrade target checkpoint remains 38/52 PASS, one stopped row (`ose-be-e2e:typecheck`, where the 8.5.1 loader failed before TypeScript), and 13 unrun, plus a separate extra build PASS. Those results are pinned to the old dependency closure. No tests or target baselines were run by this repin worker. The root coordinator must complete fresh independent review and then revalidate affected targets; the 30 Playwright target identities require new proof, and the separate existing `libs/web-ui` test target also needs proof. The earlier 22 Next.js identities can be retained only if the independent resolved-closure comparison supports that.

Ignored command output and sanitized receipts are retained under `local-tmp/swe-releaser/bdd-companion-repin/`, including the pre-install receipt, exact registry tarball, registry/GitHub/NVD/KEV/EPSS responses, npm audit JSON, and final repin receipt. No stage, commit, or push was performed.
