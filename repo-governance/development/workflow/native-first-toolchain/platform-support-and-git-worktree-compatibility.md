---
description: Which platforms toolchain setup supports and how, and why toolchain validation and provisioning work correctly from a git worktree.
when_to_use: Use when setting up the toolchain on Ubuntu/Linux, or when confirming toolchain commands are worktree-safe.
---

# Platform Support and Git Worktree Compatibility

## Platform Support

Toolchain setup supports both **macOS** and **Ubuntu/Linux**. Install commands differ per platform:

- **macOS**: Homebrew (`brew install`), Homebrew casks (`brew install --cask`)
- **Ubuntu**: apt (`sudo apt-get install`), curl scripts (Volta, rustup, dotnet-install)
- **Cross-platform**: Volta, rustup, dotnet-install, cargo — same install commands on both platforms

Ubuntu requires system build dependencies before compiling some toolchains:

```bash
sudo apt-get install -y build-essential autoconf curl git \
  libncurses-dev libssl-dev libreadline-dev libsqlite3-dev \
  libbz2-dev libffi-dev zlib1g-dev
```

The `Brewfile` is macOS-only (harmless on Linux — `brew` command not available).

## Git Worktree Compatibility

`./rhino toolchain validate` and `./rhino toolchain provision` inspect the repository at the
working directory unless `--root` names another, and `npm run doctor` runs from the repository root
of the checkout that invokes it, so both behave the same from a worktree root as from the primary
checkout. This matters because the repository uses git worktrees heavily for AI agent isolation
(`worktrees/`).

Per the [Worktree Toolchain Initialization](../worktree-setup.md) practice, the read-only
`npm run doctor` is required as the second step of a mandatory two-step init (after the
checksum-pinned HIPPO-guarded `npm install`) whenever a worktree is created. Validation never
installs anything, which makes running it for every new worktree cheap enough to codify as a rule;
only when it reports drift does the transactionally guarded `./rhino toolchain provision --apply`
run, followed by `npm run doctor` again. Mere re-entry does not trigger setup.
