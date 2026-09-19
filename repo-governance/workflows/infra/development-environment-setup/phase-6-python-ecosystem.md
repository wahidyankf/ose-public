---
description: "Phase 6 (full scope only): install Python and ruff so the Python course corpora stay formatted."
when_to_use: "Use when setting up Python under full scope."
---

# Phase 6: Python Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: formatting only. This repository ships no Python application or library. The `*.py`
files it tracks are AyoKoding course corpora under `apps/ayokoding-www/content/**` plus a few
harness helper scripts, and the `format-ruff` / `format-verify-ruff` gates in `repo-config.yml`
keep them formatted. `./rhino toolchain validate` does not check Python or ruff.

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
add.

**Success criteria**: `python3 --version` shows 3.13 or later.

## 6.2 Install ruff

```bash
# macOS
brew install ruff

# Linux
pipx install ruff
```

**Success criteria**: `ruff --version` returns a version string.
