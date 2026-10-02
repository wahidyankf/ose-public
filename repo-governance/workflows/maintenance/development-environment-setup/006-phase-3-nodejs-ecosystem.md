---
description: "Phase 3: install Volta, then Node.js and npm at the versions pinned in package.json."
when_to_use: "Use when setting up or repairing the Node.js/npm toolchain via Volta."
---

# Phase 3: Node.js Ecosystem (Sequential)

## 3.1 Install Volta

```bash
# Install Volta (manages Node.js and npm versions)
curl https://get.volta.sh | bash

# Restart shell or source profile
source ~/.zshrc  # or ~/.bashrc
```

**Success criteria**: `volta --version` returns a version string.

**On failure**: Ensure `~/.volta/bin` is in your PATH. Check `~/.zshrc` or `~/.bashrc` for
the Volta PATH entry.

## 3.2 Install Node.js and npm via Volta

Volta auto-installs the correct versions when you enter the repo directory, because
`package.json` pins them via `volta.node` and `volta.npm`. Just run:

```bash
cd /path/to/open-sharia-enterprise
node --version   # Should show v24.13.1
npm --version    # Should show 11.10.1
```

If versions don't match, force install:

```bash
volta install node@24.13.1
volta install npm@11.10.1
```

**Success criteria**: `node --version` shows `v24.13.1` and `npm --version` shows `11.10.1`.
