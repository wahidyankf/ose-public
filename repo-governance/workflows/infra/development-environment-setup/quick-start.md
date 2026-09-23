---
description: "The fast path: clone, run guarded npm install, validate with npm run doctor, and provision declared toolchains only when it reports drift."
when_to_use: "Use when you already have Homebrew/apt and Node.js/npm and want the short setup instead of manual phases."
---

# Quick Start

If you already have Homebrew (macOS) or apt (Linux) and Node.js/npm installed:

```bash
git clone https://github.com/wahidyankf/ose-public.git
cd open-sharia-enterprise
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
npm run doctor   # Read-only: probe every declared toolchain
```

`npm run doctor` runs `./rhino toolchain validate` under its own HIPPO guard and never installs
anything; it rejects every argument, so the retired `npm run doctor -- --fix` form exits 2. Only
when it reports a missing or drifted toolchain, provision the declared toolchains and validate
again:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply
npm run doctor
```

`--apply` is the explicit authorization for that mutation. A tool whose `repo-config.yml` entry
declares no provisioning is installed by hand through the matching phase below.

For manual step-by-step installation, follow the phases below.
