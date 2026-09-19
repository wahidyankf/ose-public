---
description: "Phase 8 (full scope only): install Erlang and Elixir so mix format can format the Elixir course corpora."
when_to_use: "Use when setting up Elixir/Erlang under full scope."
---

# Phase 8: Elixir/Erlang Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: formatting only. This repository ships no Elixir application or library. The `*.ex`
and `*.exs` files it tracks are AyoKoding course corpora under `apps/ayokoding-www/content/**`,
and the `format-elixir` / `format-verify-elixir` gates in `repo-config.yml` keep them formatted by
running `scripts/format-elixir.sh`, which shells out to `mix format` from the nearest `mix.exs`
ancestor. `./rhino toolchain validate` does not check Erlang or Elixir.

**No version is pinned.** There is no `.tool-versions` file at the repository root; any Erlang/OTP
and Elixir pair new enough to run `mix format` will do. The commands below use a known-good pair.

## 8.1 Install asdf version manager

```bash
# macOS
brew install asdf

# Linux
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.15.0
echo '. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc
source ~/.bashrc
```

**Success criteria**: `asdf --version` returns a version string.

## 8.2 Install Erlang

```bash
asdf plugin add erlang
asdf install erlang 27.3

# Set global default
asdf global erlang 27.3
```

**Note**: Erlang compilation requires build dependencies. On macOS: `brew install autoconf
openssl wxwidgets`. On Linux: `sudo apt-get install -y build-essential autoconf libncurses-dev
libssl-dev`.

**Success criteria**: `erl -noshell -eval 'io:format("~s",[erlang:system_info(otp_release)]),halt().'`
shows `27`.

## 8.3 Install Elixir

```bash
asdf plugin add elixir
asdf install elixir 1.19.5-otp-27

# Set global default
asdf global elixir 1.19.5-otp-27
```

**Success criteria**: `mix format --help` runs without error.
