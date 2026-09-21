---
description: "Phase 6 (full scope only): install Python, ruff, and uv so the FERRET Python projects build and the Python course corpora stay formatted."
when_to_use: "Use when setting up Python under full scope."
---

# Phase 6: Python Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: the FERRET Python projects (`apps/ferret-cli`, `apps/ferret-cli-e2e`) and formatting. FERRET
needs CPython 3.14.7 and uv 0.12.16, pinned by each project's `.python-version` and `uv.lock`; its Nx `install`
targets run `uv sync --locked`. The other `*.py` files are AyoKoding course corpora under
`apps/ayokoding-www/content/**` plus a few harness helper scripts, formatted by `ruff format` through
`scripts/format-staged` at pre-commit. `./rhino toolchain validate` does not check Python, uv, or ruff.

## 6.1 Install Python 3.13+

```bash
# macOS (via pyenv, recommended)
brew install pyenv
pyenv install 3.13.5
pyenv global 3.13.5

# Or use Homebrew directly
brew install python@3.13

# Linux
sudo apt-get install -y python3 python3-pip python3-venv
```

No `.python-version` file exists at the repository root; pin one alongside any Python project you
add, as the FERRET projects do.

**Success criteria**: `python3 --version` shows 3.13 or later.

## 6.2 Install ruff

```bash
# macOS
brew install ruff

# Linux
pipx install ruff
```

**Success criteria**: `ruff --version` returns a version string.

## 6.3 Install uv and CPython 3.14.7 (FERRET)

```bash
# macOS and Linux: the standalone installer pinned to the CI version
curl -LsSf https://astral.sh/uv/0.12.16/install.sh | sh

uv --version            # must print uv 0.12.16
uv python install 3.14.7
```

If another uv is first on `PATH`, run `uv self update 0.12.16` for a standalone install, or remove the other copy.

**Success criteria**: `uv --version` prints `uv 0.12.16` and `uv python find 3.14.7` prints an interpreter path.
