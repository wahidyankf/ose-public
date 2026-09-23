---
description: "Notes on version pinning, idempotency, macOS focus, lack of Windows support, CI parity, and git worktree compatibility."
when_to_use: "Use when you need background on why this workflow behaves the way it does."
---

# Notes

- **Version pinning**: All version requirements are read from config files in the repo
  (package.json, go.mod, .tool-versions, global.json, .python-version, pubspec.yaml).
  The doctor command verifies these automatically.
- **Idempotency**: Every step can be re-run safely. Running an install command for an
  already-installed tool is a no-op or an upgrade.
- **macOS focus**: This workflow prioritizes macOS (the primary development platform).
  Linux instructions are provided as alternatives where they differ.
- **No Windows support**: Windows is not a supported development platform for this repository.
- **CI parity**: CI uses Docker containers with all tools pre-installed. This workflow ensures
  your local environment matches CI capabilities.
- **Git worktree compatible**: `npm run doctor`, `./rhino toolchain provision --apply`, and
  `./rhino env init` inspect the repository at the working directory, so they work the same from
  a worktree root as from the primary checkout.
