# Playwright 1.61.0 prerequisite verification

Status: package repin, browser downloads, native prerequisites, and three-browser smoke completed. Chromium, Firefox, and WebKit all passed the documented launch/about:blank/close smoke.

## Scope and selection

Verified worktree base: `71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7`.

The user selected Playwright 1.61.0 explicitly. The Microsoft Playwright v1.61.0 release was published on 2026-06-15. At the verification date, 2026-10-27, the 60-day cutoff was 2026-08-28; the selected release is older than the cutoff and meets that age threshold. Version 1.62.0 was also already eligible by age, so 1.61.0 is recorded as the user's bounded exact-version selection, not as the newest eligible release.

The only source manifest changes are exact `@playwright/test` pins from 1.60.0 to 1.61.0 in these nine E2E workspaces:

- `apps/ayokoding-www-be-e2e`
- `apps/ayokoding-www-fe-e2e`
- `apps/organiclever-app-web-e2e`
- `apps/organiclever-be-e2e`
- `apps/organiclever-www-fe-e2e`
- `apps/ose-app-web-e2e`
- `apps/ose-be-e2e`
- `apps/ose-www-be-e2e`
- `apps/ose-www-fe-e2e`

`package-lock.json` was updated by npm. Its three deduped Playwright package records are all 1.61.0; compatible existing dependency ranges in other workspaces were left unchanged. `npm ls @playwright/test playwright playwright-core --all` resolved one deduped 1.61.0 set (exit 0).

Registry tarball SRI values, independently read from npm registry metadata and present in the lock:

| Package            | Version | SHA-512 SRI                                                                                       |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------- |
| `@playwright/test` | 1.61.0  | `sha512-cKA5B6lpFEMyMGjxF54QihfYpB4FkEGH+qZhtArDEG+wezQAJY8Pq6C7T1SjWz+FFzt3TbyoXBQYk/0292TdJA==` |
| `playwright`       | 1.61.0  | `sha512-Z+7BeeqQPRRzklHsVFP4KTGIyMxKUmfeRA4WisM6G3/XW6nwGeX6fX9qYaDa+CiUqpOkb2f6X3nar05R3kSuJQ==` |
| `playwright-core`  | 1.61.0  | `sha512-caX7TrY3Ml6egyDX0WUcTHDxodl/b51y5wJOdCEA36QviK/s2g081hvmGs8eaE3DWb6NYZQ6BjO/QkNRPenoPA==` |

## Published browsers and native smoke

The official v1.61.0 browser manifest specifies Chromium and headless shell revision 1228 (Chrome 149.0.7827.55), Firefox revision 1532 (Firefox 151.0), WebKit revision 2311 (WebKit 26.5), and FFmpeg revision 1011. The documented Playwright install command completed with exit 0 and downloaded all four required revisions. Pre-existing Chromium/headless revision 1248 and FFmpeg revision 1013 were preserved.

A native launch smoke used the installed Playwright 1.61.0 package to launch each browser, load `about:blank`, and close it:

| Browser                | Result                                       |
| ---------------------- | -------------------------------------------- |
| Chromium 149.0.7827.55 | PASS: launched, loaded `about:blank`, closed |
| Firefox 151.0          | PASS: launched, loaded `about:blank`, closed |
| WebKit 26.5            | PASS: launched, loaded `about:blank`, closed |

The initial installer and Firefox launch identified missing Ubuntu packages `libxcursor1`, `libgtk-3-0t64`, `libpangocairo-1.0-0`, `libcairo-gobject2`, and `libgdk-pixbuf-2.0-0`. The first WebKit launch additionally reported missing GTK 4, GStreamer, Graphene, Wayland, media, text, and graphics libraries. The complete original diagnostics are preserved in the ignored task log. `apt-cache policy` showed the five initial packages absent with candidates `1:1.2.3-1build1`, `3.24.52-0ubuntu1`, `1.57.0-1`, `1.18.4-3`, and `2.44.5+dfsg-4ubuntu1`, respectively.

The first documented `playwright install-deps` HIPPO transactional/standard request was rejected before execution with exit125 because then-current free disk was below the balanced reservation. No APT/dpkg package changed during that denied request. After owner-authorized cleanup reclaimed 9,134,456,832 bytes from generated workspace build output, a fresh admission returned balanced-profile NORMAL with no current owners, waiters, or PSI pressure; the machine configuration checksum was unchanged. The original documented HIPPO transactional/standard install-deps request then completed with exit0. It added 231 packages and removed or upgraded zero packages. The five prior missing libraries are now installed at the candidate versions listed above. The installer used `NEEDRESTART_MODE=l`, which listed a proposed cron restart and deferred networkd-dispatcher, systemd-logind, and unattended-upgrades restarts; no service restart was executed, and no containers needed restart. Disk free space was 27,848,605,696 bytes before APT and 26,978,590,720 bytes after, a net use of 870,014,976 bytes. No HIPPO profile, reservation, or policy changed.

## Security and audit review

The five required sources were checked for the selected package versions as of 2026-10-27:

1. [NVD CVE-2025-59288](https://nvd.nist.gov/vuln/detail/CVE-2025-59288) reports the affected Playwright range as versions before 1.55.1. The selected version 1.61.0 is outside the affected range; the NVD record does not mark it in CISA KEV.
2. [GitHub Advisory GHSA-7mvr-c777-76hp](https://github.com/advisories/GHSA-7mvr-c777-76hp) identifies the same pre-1.55.1 affected range and fix 1.55.1. Its CVSS is 8.7; EPSS is 0.234% (13th percentile). Version 1.61.0 is outside the affected range.
3. [Snyk's Playwright package page](https://security.snyk.io/package/npm/playwright) records the historical issue as fixed before 1.61.0; its [@playwright/test page](https://security.snyk.io/package/npm/%40playwright%2Ftest) reports no direct vulnerabilities for that package.
4. [Microsoft Playwright security advisories](https://github.com/microsoft/playwright/security/advisories) showed no maintainer-published advisories at review time. The separately published GitHub Advisory Database entry is listed above.
5. The [CISA KEV mirror catalog](https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json), synchronized from CISA, was at catalog version 2026.10.23. CVE-2025-59288 was not present; consequently it had no KEV date-added or ransomware field in that catalog.

`npm audit --audit-level=moderate --json` exited 1 on the full lockfile: 78 findings (7 low, 30 moderate, 35 high, 6 critical). None names `playwright`, `playwright-core`, or `@playwright/test`. The full audit includes a moderate `playwright-bdd@8.5.1` finding through its existing Cucumber Gherkin/messages dependency chain; that package was not changed by this repin. The scoped npm install output separately reported 12 workspace findings (2 low, 6 moderate, 4 high); these counts have different scopes and are not interchangeable. No audit fix was run.

## Reproducibility receipts

The guarded commands used the repository-pinned `./hippo` consumer and the approved cloud machine configuration; no host-policy override was used. Ignored receipts and full command output are retained under `local-tmp/swe-releaser/playwright-161/`, including registry metadata, npm install output/exit, initial and corrected browser installer logs/exits, dpkg inventories/delta, browser smoke logs/exits, and full npm audit JSON/stderr/exit. The final install and browser download commands exited 0. The original pre-dependency smoke remains recorded as a diagnostic failure; the post-install smoke exited 0 with all three browsers passing.
