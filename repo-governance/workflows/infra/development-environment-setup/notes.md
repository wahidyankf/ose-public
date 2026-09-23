---
description: "Notes on version pinning, idempotency, macOS focus, lack of Windows support, CI parity, and git worktree compatibility."
when_to_use: "Use when you need background on why this workflow behaves the way it does."
---

# Notes

- **Version pinning**: All version requirements are read from config files in the repo
  (package.json, go.mod, global.json, .python-version and uv.lock, .fvmrc,
  .config/dotnet-tools.json). The doctor command proves each declared tool is present; it does not
  compare versions, because no `toolchains` entry declares one.
- **Idempotency**: Every step can be re-run safely. Running an install command for an
  already-installed tool is a no-op or an upgrade.
- **macOS focus**: This workflow prioritizes macOS (the primary development platform).
  Linux instructions are provided as alternatives where they differ.
- **No Windows support**: Windows is not a supported development platform for this repository.
- **CI parity**: CI installs each job's toolchains with the composite actions under
  `.github/actions/`. This workflow gives your local environment the same tools.
- **Git worktree compatible**: `npm run doctor`, `./rhino toolchain provision --apply`, and
  `./rhino env init` inspect the repository at the working directory, so they work the same from
  a worktree root as from the primary checkout.
