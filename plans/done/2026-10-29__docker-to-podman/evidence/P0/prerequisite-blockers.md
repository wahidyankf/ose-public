# P0 environment blockers and owner choices

## Status

Current P0 state as of 2026-10-27: the selected Ubuntu and Desktop Mac rootless
capability probes both pass, including cleanup. Desktop's full native run `13990`
passed all workload and before/after inventory checks. Before the URL, mobile-navigation
and Mermaid source repairs, the upgraded-pin checkpoint had 44 of 52 identities passed,
one failed and seven not yet run; two additional web-ui targets also remained. That
checkpoint is historical, and a fresh post-repair baseline has not completed. All ten
BDD generation/discovery groups pass. The URL synchronization, primary mobile-navigation
locator and Mermaid fallback repairs are applied with independent binding/projection review.
The Mermaid regression's three component keyboard tests pass; app lint, exact-file warning-denied
lint, formatting and diff checks pass under the documented one-line exception. The original full
axe cause remains unknown. Proposed closure review retains 34 of 52 affected and 84 of 106
original identities pending final source-closure confirmation; these are retention counts, not
new pass results. The current HIPPO
0.13.0 consumer accepts the unchanged host profile; its specific release-age
exception, native identity, status, consumer-contract and policy-smoke results are in
the [HIPPO prerequisite record](./hippo-prerequisite.md). No human step is currently
needed to resume the authorized work.

The maintainer approved Playwright 1.61.0, Next.js 16.4.3 and the narrow host-wide receive-SIGTERM
correction on 2026-10-26. Playwright package/browser installation, system libraries and native
three-browser launch smoke now pass. The Next.js repin and final dependency review also passed.
The reviewed AppArmor correction is applied and remains enforced; the actual Ubuntu post-change
capability and native teardown recheck passed. The original-pin baseline records 99 of 106 real
targets passed, two failed and five browser targets blocked, plus one N/A caller. Fifty-two affected
targets require revalidation against the final upgraded dependency state. The maintainer manually
installed both Mac CLIs; native version and package receipts confirm 6.1.4. Desktop provider
1.6.0 also passes its client check. These current results supersede the historical open-state
notes below; the [readiness gate](./readiness.md) tracks remaining P0 work.

Baseline revision is `71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7`, with the reviewed calculator
fixture repair recorded in the [baseline results](./baseline-targets.md).

## Playwright native platform support

The original baseline resolved Playwright 1.60.0 and Chromium/headless-shell revision 1223. The required
headless-shell binary is absent. The E2E target's heavy run completed all 3,278 build pages, then
reported 19 passing and 18 failing Playwright tests. Every failing case stopped at browser launch
because its executable was missing; those scenario assertions did not run.

The documented native browser installation failed before download with
`Playwright does not support chromium on ubuntu26.04-x64`. The installed package maps the host
to that exact platform but has no corresponding Chromium download mapping. The recorded install
run is `development-transactional-1793033980261-1589893`, task-failed, exit 1. This is not a
missing system-library or network diagnosis, and no browser was installed. A different cached
revision is not a substitute for the pin.

Upstream [Playwright 1.61.0](https://github.com/microsoft/playwright/releases/tag/v1.61.0) is the
earliest stable release found explicitly supporting Ubuntu 26.04. Its version-tagged
[browser manifest](https://raw.githubusercontent.com/microsoft/playwright/v1.61.0/packages/playwright-core/browsers.json)
requires Chromium/headless-shell revision 1228. The proposed native correction changes the nine
exact `@playwright/test` 1.60.0 E2E workspace pins and their lockfile resolutions to 1.61.0;
it does not alter scenarios, assertions, timeouts, or coverage requirements. The maintainer
explicitly approved this exact upgrade on 2026-10-26. A delegated Repin packet owns the nine
manifests, generated lock resolution, matching native browser install, and launch verification.
The original failed run remains evidence; this approval alone is not a passing baseline result.

Alternatives are a supported native Ubuntu 24.04 verification host or an
[official same-version Playwright container](https://playwright.dev/docs/docker). The container
route requires explicit native-first toolchain reconciliation;
it does not make the original native Ubuntu 26.04 installation supported.

Raw package/source/cache diagnosis remains ignored in
`local-tmp/swe-debugger/playwright-prerequisite.md`. No host-platform spoofing, cache substitution,
dependency edit, or second native installer attempt was performed by that debugger.

The subsequent authorized [Playwright repair](./playwright-prerequisite.md) installed the exact
1.61.0 packages and matching browsers. After [measured disk recovery](./disk-recovery.md), the
original guarded dependency installer passed, and Chromium, Firefox and WebKit each launched,
loaded `about:blank` and closed. This closes native browser prerequisites, not the pending
affected-target E2E results.

## Rootless network-helper confinement

The [Ubuntu capability probes](./ubuntu-capabilities.md) passed rootless operation, keep-id,
effective cgroup limits, network-none, internal DNS, and PostgreSQL readiness. Final task-owned
resource and invoking-user helper inventories were empty at their observed snapshots.

Native teardown nevertheless emitted a real network-helper error. The narrow read-only kernel
audit confirms at `2026-10-26T16:33:16Z`: operation `signal`, profile `pasta`, signal `term`, peer
`podman`, result `DENIED`. Installed podman-compose 1.6.0 ignores native `down` child statuses,
so its exit 0 does not prove each teardown succeeded. Individual native status codes were not
retained in that first log and are not inferred here.

The mechanism matches [Debian AppArmor bug 1100135](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1100135)
and [Podman issue 27372](https://github.com/podman-container-tools/podman/issues/27372). The local
audit is the evidence for this host. Its recorded Ubuntu indexes show installed versions equal
to their candidates: Podman `5.7.0+ds2-3build1`, AppArmor `5.0.2-0ubuntu1~26.04.1`, and passt
`0.0~git20260120.386b5f5-1`. No newer vendor candidate was demonstrated by that inspection.

The narrow proposed policy correction is:

```text
signal (receive) set=(term) peer=podman,
```

It keeps pasta enforced and allows only SIGTERM receipt from the exact named Podman profile,
subject to normal Unix signal permissions. At diagnosis the vendor pasta profile lacked a local
include, so the selected correction also required adding that include inside the vendor profile.
This is a host-wide permission expansion for matching pasta processes, including processes
outside this repository. Existing receipt permission from `unconfined` does not establish that
the named `podman` label has identical effective authority. No equivalence is presumed.

The installed alternative slirp4netns 1.3.3-1 has an actually loaded `unconfined` profile. A
task-local helper selection can preserve the host's existing policy files but changes the helper's
confinement boundary. That tradeoff also requires an owner choice; successful DNS/cleanup alone
would not prove security equivalence. A different supported host is the other proposed route.

The maintainer explicitly authorized only this narrow receive-SIGTERM correction on 2026-10-26.
Its concrete backup/partial-rollback packet passed independent re-review with zero findings.
The guarded [two-file correction](./ubuntu-policy-correction.md) then passed native parse and
profile replacement; pasta remains enforced and both installed hashes match the reviewed
candidates. Verified originals remain in a root-only backup. No other kernel setting, helper
selection, or third-party source changed. No helper was killed, store reset, or foreign resource pruned. Architecture and exact
audit/native-source reports remain in ignored `local-tmp/swe-architect/` and
`local-tmp/swe-debugger/`. The [post-change Ubuntu recheck](./ubuntu-policy-capability-recheck.md)
then passed the original rootless, keep-id, cgroup, DNS and PostgreSQL assertions. Actual stop,
container removal, named-volume removal and network removal returned 0, with zero matching
denials in a successfully queried kernel interval. Two newly attributed anonymous probe volumes
were removed; the complete final inventory matched the original inventory. Prior resources
remain intact. A live pasta process label was not captured, so the report limits its confinement
claim to loaded enforced policy and configured helper selection. This closes the local Ubuntu
capability prerequisite without supplying macOS, CI or migrated-runtime proof.

## Google font URL handling in Next.js

The original `organiclever-www:build` exited 1 with 18 font module-resolution failures. A bounded
read-only diagnostic established that all 18 generated JetBrains Mono virtual imports contained
three query entries instead of the expected single JSON entry. Their font-file URLs have the
extensionless shape `https://fonts.gstatic.com/l/font?kit=...&skey=...&v=v24`; unencoded ampersands
split the virtual query. The declared weights remain 400, 500, and 600, with Latin preload and
the existing stylesheet's six Unicode subsets.

This is the exact failure class in [Next.js issue 99114](https://github.com/vercel/next.js/issues/99114).
The original 16.2.6 Webpack loader also requires a terminal font-file extension. Its regex cannot
match these extensionless URLs, so the official `--webpack` flag does not establish a repair.
The original log contains no observed font TLS/DNS/fetch failure; the foreign ancestor-lockfile
warning is separate, and that foreign file remains untouched. These are historical diagnosis
findings from the original failing build.

The cause-level fix [PR 100158](https://github.com/vercel/next.js/pull/100158) and
[stable backport 100277](https://github.com/vercel/next.js/pull/100277) are included in
[Next.js 16.4.3](https://github.com/vercel/next.js/releases/tag/v16.4.3). This is the released
fix verified by the research; no 16.2.x release carrying it was found.

After the approved upgrade, frozen baseline row 55, `organiclever-www:build`, passed with inner
and HIPPO exit 0 under heavy admission. The baseline's dependency-closure review retained this
proof in the 44-pass pre-repair checkpoint; it remains subject to the final source-closure
review. See [upgraded-pin target results](./pin-upgrade-target-results.md).

The proposed route aligns the five apps' exact Next pins, AyoKoding's matching
`@next/third-parties`, the root Linux SWC pins, and lockfile to 16.4.3. Existing font inputs,
build commands, hosting configuration, ports, and application behavior must remain intact and
pass their required tests. OrganicLever's actual image copies the full `.next` plus dependencies
and runs Next normally; it does not currently use the standalone shape of AyoKoding/OSE.

The maintainer explicitly approved that cross-minor framework upgrade on 2026-10-26. Its exact
seven-file footprint and serialized dependency transaction are recorded in the technical document.
The original failed build remains historical evidence alongside the later passing row 55 result.
No third-party patch, font change, asset addition, or hosting change is authorized by this repair.
Exact raw CSS/source/query diagnostics remain ignored in
`local-tmp/swe-debugger/organiclever-font-build.md` and its attributed captures.
