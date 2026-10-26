# Source and dependency prerequisites

Inspection date: 2026-10-26. Repository source revision:
`bafba8b77f634cca89a5967f142767b81d743248`. Later merged commit
`98ce02f412f9eb8900052905a8bc84773cb7d0ef` changes only Git-push governance and does not
change these manifests. This records requirements and installed prerequisite evidence; it does
not claim a dependency import, NIF load, browser installation or runtime test.

## Exact import source and notices

The inspected BeaverNest commit is `8ec64d79958f5c260101283ec16443f95376174d`.
Its `libs/ex-bdd/` subtree contains 215 tracked paths. Import must use that tracked list,
including hidden configuration, source, tests, fixtures, `LICENSE` and `UPSTREAM.md`.

The MIT chain retains Micah Woods (2024), the original `huddlz-hq/cucumber` 1.0.0 commit
`114aceb7ed6a3e95eb496971e8a331a8a4b81a64`, and BeaverNest's maintenance/local-change
record. The Cucumber Compatibility Kit has its own MIT notice for Cucumber Ltd and contributors
(2020). Its 89 retained artifacts comprise 43 feature/Markdown-feature inputs, 41 NDJSON reference
files and five additional assets. Preserve the fixture README, existing exclusions and comparison
allowances; engine fixtures do not become consumer acceptance scenarios.

## Compatible requirements

These are inspected compatible candidates. Exact dependency patches and locks are resolved by
their implementing P1/P2 packets rather than by this inspection.

| Component       | Requirement and compatible candidate                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ExBdd           | The pinned `mix.exs` requires Elixir `~> 1.18` and NimbleParsec `~> 1.4`; Credo is dev/test-only.                                                                           |
| Phoenix         | 1.8.11 requires Elixir `~> 1.15`.                                                                                                                                           |
| LiveView        | 1.2.9 requires Elixir `~> 1.15` and accepts Phoenix `~> 1.8.0`.                                                                                                             |
| Elixir / OTP    | Elixir 1.20.4 supports OTP 27–29; installed metadata identifies Elixir 1.20.4 and OTP 29.1.2.                                                                               |
| MDEx            | 0.13.5 requires Elixir `~> 1.15`, MDExNative `>= 0.2.6`, and accepts optional LiveView `~> 0.20.0 or ~> 1.0`. MDExNative 0.2.11 is a compatible candidate.                  |
| YAML            | YamlElixir 2.12.2 requires Elixir `~> 1.17` and yamerl `~> 0.10`; use string keys and its success/error tuple API.                                                          |
| Node / npm      | Root Volta pins Node 24.16.0 and npm 11.11.0.                                                                                                                               |
| Browser tooling | Existing FE/BE owners lock Playwright 1.60.0 and playwright-bdd 8.5.1; FE also uses axe-core/playwright 4.10.1. Installed Playwright package metadata declares Node `>=18`. |

Versioned manifests support the library constraints:
[Phoenix](https://hex.pm/packages/phoenix/1.8.11/files/mix.exs),
[LiveView](https://hex.pm/packages/phoenix_live_view/1.2.9/files/mix.exs),
[MDEx](https://hex.pm/packages/mdex/0.13.5/files/mix.exs), and
[YamlElixir](https://hex.pm/packages/yaml_elixir/2.12.2/files/mix.exs).
The [Elixir compatibility documentation](https://elixir-lang.org/docs/) records supported OTP
versions. Repository package manifests, lockfile and installed package metadata supply the
Node/browser-tooling versions above.

## Actual-host native prerequisites

Installed system metadata identifies Linux x86_64, Ubuntu 26.04 and glibc 2.43. The documented
MDEx precompiled GNU/Linux target requires compatible libc 2.35 or newer; MDExNative documents
NIF ABI 2.15, supported from OTP 22. The observed platform meets those compatibility floors.
See the [versioned MDEx compilation guide](https://mdex.hexdocs.pm/0.13.5/compilation.html)
and [MDExNative documentation](https://mdex-native.hexdocs.pm/).

The alternative source-build prerequisites are present on the actual host: installed Rust/cargo
toolchain files, GCC 15/C compiler and make, with the Elixir/OTP and Cargo tools on the recorded
command PATH. Doctor session 6256 passed 24 declared toolchains with zero findings after the
command PATH correction. Detailed paths and metadata probes remain in ignored execution notes.
No missing compiler/runtime PATH capability was found for the documented `MDEX_NATIVE_BUILD=1`
fallback. No new compiler probe or BEAM process was started by this inspection.

This satisfies the checklist's documented-build-prerequisites alternative. Dependency fetching,
actual NIF loading or source compilation, and parse/render/sanitize smoke proof remain with
the implementing packet. Content rendering must retain the planned sanitizer boundary and must
not execute HEEx from source Markdown; see [MDEx safety](https://mdex.hexdocs.pm/0.13.5/safety.html).

## Browser setup still required

The installed Playwright 1.60.0 browser manifest requires Chromium/headless-shell revision 1223,
Firefox 1522 and WebKit 2287. Read-only cache inspection found only Chromium/headless-shell
revision 1248, with the required Firefox/WebKit revisions absent. Existing binaries therefore do
not establish readiness for the locked browser suite.

The separate browser-prerequisite repair must install the matching revisions through HIPPO and
prove launches before reference screenshots/E2E. Preserve unrelated cached revisions. No browser
was installed or launched by this inspection. The FE configuration uses all three engines locally
and Chromium in CI; BE uses default Chromium. Both old owners use port 3101 and retain their
existing explicit server-ownership rules. Playwright documents
[version-matched browser installation](https://playwright.dev/docs/browsers) and
[platform prerequisites](https://playwright.dev/docs/intro).

## Acceptance boundary

The source/notices, compatible-requirements record and actual-host documented native build
prerequisites are verified. Exact library locks, native runtime proof and browser readiness remain
explicitly pending in their owning actions; none is inferred from this inspection.
