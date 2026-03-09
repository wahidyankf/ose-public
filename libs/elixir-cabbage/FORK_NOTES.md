# Fork Notes: elixir-cabbage

## Origin

- **Upstream**: `cabbage-ex/cabbage` (hex: `cabbage`)
- **Upstream URL**: https://github.com/cabbage-ex/cabbage
- **Forked version**: `0.4.1` (tag `v0.4.1`, commit `3e8f7d2`)
- **Fork date**: 2026-03-09
- **Licence**: MIT (preserved in `LICENSE`)

## Rationale

See `plans/in-progress/2026-03-09__organiclever-be-exph/tech-docs.md` — "Why We Fork" section.

## Changes from Upstream

All changes are in `CHANGELOG.md` under `## OSE Fork Entries`. Summary:

1. **App atom renamed**: `app: :cabbage` → `app: :elixir_cabbage` in `mix.exs` to avoid Hex
   atom collision when both the vendored fork and any upstream package might be present.

2. **`Application.get_env` updated**: Both calls in `lib/cabbage.ex` changed from
   `Application.get_env(:cabbage, ...)` to `Application.get_env(:elixir_cabbage, ...)`.
   Users must configure the library under `:elixir_cabbage` in their `config/*.exs`.

3. **Config key in docstring updated**: `Cabbage.Feature` moduledoc now shows
   `config :elixir_cabbage` instead of `config :cabbage`.

4. **`Application.put_env` in test updated**: `test/feature_tags_test.exs` updated from
   `Application.put_env(:cabbage, :global_tags, ...)` to
   `Application.put_env(:elixir_cabbage, :global_tags, ...)`.

5. **Gherkin dep replaced**: `{:gherkin, "~> 2.0"}` (Hex) replaced with
   `{:elixir_gherkin, path: "../../libs/elixir-gherkin"}` (local path dep to our own fork).

6. **ExCoveralls pinned**: `{:excoveralls, "0.18.3", only: :test}` pinned and a `cover.lcov`
   Mix alias added to work around Alpine Docker code-path incompatibilities in Elixir 1.17.3.

7. **Quality tooling added**: `{:credo, "~> 1.7"}` and `{:dialyxir, "~> 1.4"}` added;
   `.credo.exs` (strict), `.formatter.exs`, `.dialyzer_ignore.exs` created.

8. **Nx integration**: `project.json` added with `test:quick`, `test:unit`, `lint`,
   `typecheck`, `install` targets.

## Known Limitations

### Dialyzer in Alpine Docker

`mix dialyzer` cannot run in the Alpine Docker environment used for local development. Mix
strips optional OTP app paths (`syntax_tools`, `compiler`) from the code path during its
internal compile step inside `Mix.Tasks.Dialyzer.run/1`. When PLT creation reaches
`:dialyzer.plt_info/1` → `prettypr:text/1` (from `syntax_tools`), the call fails with
`undefined function`.

**Workaround**: The `typecheck` Nx target is intended for CI only, where `erlef/setup-beam`
configures the full OTP installation and all OTP apps are available. Do not run
`nx run elixir-cabbage:typecheck` locally without a full OTP installation.
