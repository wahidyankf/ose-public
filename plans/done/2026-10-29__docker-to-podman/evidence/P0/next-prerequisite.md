# Next.js 16.4.3 prerequisite verification

Status: the approved exact 16.4.3 repin and generated lock update completed successfully. Installed package and lock integrity checks pass. The affected project baseline has not yet been run; it remains with the coordinator after independent review.

## Release and footprint

The maintainer selected Next.js 16.4.3 on 2026-10-26 for the five current Next.js apps. The [Next.js support policy](https://nextjs.org/support-policy) lists 16.x as Active LTS. The [official v16.4.3 release](https://github.com/vercel/next.js/releases/tag/v16.4.3) was published 2026-10-23 as verified signed tag commit `29bbeab`; its release notes include the Active LTS fix for extensionless Google Font URLs in both bundlers (`#100277`). The npm registry reports 16.4.3 as the current stable package version at this lookup. This is Path A (Active LTS); Path B's 60-day cutoff is not the selection path.

The pre-recorded exact footprint is seven files:

- `apps/ayokoding-www/package.json`: `next` and existing `@next/third-parties`
- `apps/ose-www/package.json`: `next`
- `apps/organiclever-www/package.json`: `next`
- `apps/ose-app-web/package.json`: `next`
- `apps/organiclever-app-web/package.json`: `next`
- `package.json`: existing Linux x64 GNU and musl `@next/swc` optional pins
- `package-lock.json`: generated resolutions, retaining the Playwright 1.61.0 update

This work compares the Next.js footprint against the shared dependency snapshot after the Playwright 1.61.0 transaction, not against `HEAD`. The intermediate `package-lock.json` SHA-256 was `8c2389d3633346a04e6a473a5a5975d7f56edd85927e46ba4a8ac557f409310d`; the Playwright-only lock diff SHA-256 was `7ef19506057adfd80e6a95201e758d29e5757702d0445fb7d919a7186a30a9ea`. The Playwright 1.61.0 changes remain in the final lock.

Final dependency packet fingerprints: `package-lock.json` SHA-256 `d77f4da841c99d306cd6eb6bf67f500dda20627cf7fbc5974fd4d5962a69ee04`; seven-file dependency diff SHA-256 `74466281079f58de6f6e237e27784d4172d05724417c813cc67ee6a7dbc8fbc1`. These values are also retained in ignored `local-tmp/swe-releaser/next-1643/final-fingerprints.json`.

Only the package pins and their matching generated dependency resolutions are authorized. No font, feature, test, host, build command, port, or unrelated dependency edit is included.

## Registry integrity and installed resolution

Read-only `npm view` requests ran under HIPPO ephemeral/light. SRI values returned by the registry:

| Package                    | Version | SHA-512 SRI                                                                                       |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `next`                     | 16.4.3  | `sha512-OqxKTGi9u80FydydsMNYNjnuje9Au+kvHlt2GZ//ftdpDHm1dxKqAaENoOOTX5wKzn+9vaKUNIfZeyZUuLhCnA==` |
| `@next/env`                | 16.4.3  | `sha512-a7tz1QCcWWkwC/rPJcPMJk/UNRu9CFhDd3OHYE5hddbJrs8BqRTalxI6GlKCWEGzRLHN+S/B7a4PAHCtm25aBQ==` |
| `@next/third-parties`      | 16.4.3  | `sha512-sBjXxFRJtW1UAnQT24vcevIvlvce6bOGXroL6+NVqoTMrb8bQvUgXkxACjbEO2rGKfFOzbq5CYjYQTBNK3vFiA==` |
| `@next/swc-linux-x64-gnu`  | 16.4.3  | `sha512-QymWvfUwDEC5/lpJOsxX5VAbyoR2D13+2Jsjz4be7gT4LPqEgdpkeLIR/HFfCLgKzoMhpJbp6I/JnogyNZHcaA==` |
| `@next/swc-linux-x64-musl` | 16.4.3  | `sha512-Vmjd9D7DpA4Vv3cUlr82QWgJD/BQZmns801vtC5VWHg6jCIA4a5vMKpQnfrM2pyCrp2eV0ENdUg4PlN3bAc2Yw==` |
| `sharp`                    | 0.35.5  | `sha512-Ywn4OnzGukp7CDMrp08RQ50YKmuwG47brZgIVPTvBaaAfQlRlygrRqSrxdCiL9M+LlzLBiJ68IR1QqvzHyjC7g==` |

The registry metadata declares optional `sharp: ^0.35.5` for Next.js 16.4.3; the registry's current satisfying version is 0.35.5, meeting the patched minimum for the SVG/librsvg issue. The final lock resolves `sharp` 0.35.5. A direct jq comparison confirmed registry SRI matches the final lock for Next, `@next/env`, `@next/third-parties`, both root Linux x64 SWC pins, and Sharp. Linux installed the GNU SWC optional package; the musl package is in the lock but is not installed on this glibc machine. Full read-only metadata is retained in ignored `local-tmp/swe-releaser/next-1643/`.

All seven recorded paths changed within scope. There were no source, test, font, hosting, build-command, or port changes. Three manifests whose existing dependency key order was temporarily changed by npm's `pkg set` have had that original order restored.

## Security review

As of 2026-10-27, the five dependency-policy sources were checked before mutation:

1. **NVD:** [CVE-2026-94484](https://nvd.nist.gov/vuln/detail/CVE-2026-94484) records Next.js affected through 16.3.8, fixed at 16.3.8. [CVE-2026-96889](https://nvd.nist.gov/vuln/detail/CVE-2026-96889) is the underlying librsvg use-after-free; the Next.js maintainer advisory below gives Next's affected range and fixed releases. NVD search did not return detail records for the most recent identifiers CVE-2026-94545 or CVE-2026-94482 at lookup time; their maintainer/Snyk records were checked directly.
2. **GitHub advisories:** the [Next.js maintainer advisory list](https://github.com/vercel/next.js/security/advisories) and individual advisories show the recent Next.js 16 vulnerabilities are fixed before 16.4.3. In particular, critical [GHSA-2464-fhr4-w9xw / CVE-2026-96889](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) affects 16.0.0 through 16.4.0 and is fixed in 16.4.1; critical [GHSA-673q-mjm6-r5xr](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr) and high [GHSA-p3m5-59mp-jv5r](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r) have the same 16.4.0 upper bound and 16.4.1 fix. [GHSA-vcvr-r3jv-pc5j / CVE-2026-94545](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j) affects 16.2.0 through versions before 16.3.6; [GHSA-h694-7cp9-m8p3](https://github.com/vercel/next.js/security/advisories/GHSA-h694-7cp9-m8p3) affects 16.3.0 and is fixed in 16.3.8. The other Sep 30 advisories reviewed for draft-mode cache, image-optimizer SSRF, development-server MCP, and SSG/ISR cache issues identify fixes in the 16.3.x line. All these fixed ranges precede 16.4.3.
3. **Snyk:** its [Next.js package page](https://security.snyk.io/package/npm/next) listed 16.4.3 as the latest version and reported no known direct vulnerabilities affecting it (82 historical findings across the package's full release history). Snyk's [CVE-2026-94482 record](https://security.snyk.io/vuln/SNYK-JS-NEXT-21460651) lists the affected ranges as `>=13.0.0 <15.5.28` and `>=16.0.0 <16.4.1`, so 16.4.3 is outside them. It reports CVSS 8.2 and EPSS 0.37% (30th percentile).
4. **Project security page:** the official [Next.js security advisories](https://github.com/vercel/next.js/security/advisories) list was reviewed; no listed issue affects 16.4.3 based on each affected and patched range.
5. **CISA KEV:** the [CISA KEV mirror catalog](https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json) was at catalog version 2026.10.23. The CVEs checked below were not found in that catalog; none has a KEV date-added or ransomware field there.

FIRST EPSS API values dated 2026-10-26 for high/critical CVEs checked:

| CVE            | EPSS probability | Percentile | Affected range status at 16.4.3           |
| -------------- | ---------------: | ---------: | ----------------------------------------- |
| CVE-2026-96889 |           0.529% |   44.468th | Patched before 16.4.3; GHSA fix is 16.4.1 |
| CVE-2026-94545 |           1.082% |   64.926th | Affected only before 16.3.6               |
| CVE-2026-94482 |           0.365% |   30.141st | Affected only before 16.4.1               |
| CVE-2026-94484 |           0.244% |   15.510th | Affected only before 16.3.8               |

The repository's literal EPSS urgency threshold is a score of 0.5 on FIRST's 0–1 scale; none of these values reaches it. EPSS is an informational signal, and KEV membership is checked separately as shown above. Known affected ranges were patched before the selected release. The post-install `npm audit --audit-level=moderate --json` exited 1 with 76 findings (7 low, 30 moderate, 34 high, 5 critical), down from 78 on the Playwright-only intermediate lock. None names `next`, `@next/third-parties`, `@next/env`, `sharp`, `playwright`, `playwright-core`, or `@playwright/test`. The existing moderate `playwright-bdd@8.5.1` finding remains through its Cucumber Gherkin/messages dependency chain; its suggested fix is a major version and was not applied. No audit fixes were run. Focused `npm ls` exited 0 and confirmed direct Next 16.4.3, `@next/third-parties` 16.4.3, `@next/env` 16.4.3, installed GNU SWC 16.4.3, Sharp 0.35.5, and Playwright packages 1.61.0. It also reports the pre-existing `@next/env` 16.0.0 nested under the web-ui Storybook plugin; no package outside the approved footprint was changed.

## Receipts and remaining gate

The read-only npm registry queries completed with exit 0 under HIPPO ephemeral/light. The guarded transactional/standard `npm pkg set` plus tool-managed `npm install` completed with exit 0; it added 2 packages and changed 10 installed packages. The prescribed post-install audit and focused installed-tree receipts are retained in `local-tmp/swe-releaser/next-1643/`. The coordinator will run the affected baseline after independent review of this stable dependency snapshot.
