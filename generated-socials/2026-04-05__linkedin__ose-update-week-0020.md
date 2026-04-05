Posted: Sunday, April 5, 2026
Platform: LinkedIn

---

OPEN SHARIA ENTERPRISE
Week 20 / Phase 1, Week 8

This week: `FSL-1.1-MIT` licensing, CI reusable workflows, `rhino-cli` DX upgrades, spec coverage enforced across all 30 projects, and the Phase 1 Week 8 monthly update.

What changed:

📜 `FSL-1.1-MIT` Licensing
Migrated from `MIT` to `FSL-1.1-MIT` (Functional Source License). Source-available with one restriction: don't compete in the same functional domain during the initial period. Auto-converts to `MIT` after two years per release. Per-app domain scoping — product apps and behavioral specs (the WHAT) protected under `FSL`, libs and demos (the HOW) remain `MIT`. Educational content on ayokoding.com stays freely available.

⚙️ CI Standardization
Planned and executed a full CI overhaul. 8 reusable workflow templates (`_reusable-backend-coverage`, `-e2e`, `-integration`, `-lint`, `-spec-coverage`, `-typecheck`, `_reusable-frontend-e2e`, `_reusable-test-and-deploy`) now compose all 29 workflows. Each backend workflow is ~30 lines instead of 200+. Added `setup-language` composite action for consistent tool setup across CI.

🔧 `rhino-cli` Developer Experience
`doctor --fix` auto-installs missing tools. `--scope minimal` checks only core tools for fast CI runs. `env init` bootstraps `.env` from `.env.example` templates. `env backup` and `env restore` manage environment variables across the monorepo. `Playwright` browser, `Rust` toolchain, and `Flutter` SDK version checks added. `Brewfile` for declarative Homebrew dependencies. Two commands on a fresh machine: `brew bundle` + `rhino doctor --fix`.

✅ Spec Coverage Enforcement (30/30)
`rhino-cli spec-coverage validate` now enforced across all 30 projects in the pre-push hook and CI. Multi-language step extraction supporting `Go`, `TypeScript`, `Java`, `Kotlin`, `Python`, `Rust`, `F#`, `C#`, `Elixir`, `Clojure`, and `Dart`. If a Gherkin scenario exists without a corresponding step implementation, the push is blocked.

🧪 `oseplatform-web` E2E Test Apps
Dedicated BE and FE E2E test apps (`oseplatform-web-be-e2e`, `oseplatform-web-fe-e2e`) with `Playwright`, Docker infrastructure, and C4 architecture diagrams.

📚 AyoKoding
4 new by-example tutorials: `gh` CLI, `sed`, `awk`, and `jq`.

📋 Governance
AI agent model selection convention added. Development practices for PRs, verification, completeness, and CI blockers documented. Plan workflow quality gates with manual assertions and archival rules.

🔜 What's next:
CI is taking shape. Next four weeks focus on CD pipelines and infrastructure — that is the priority. OrganicLever's core domain features will start building on the sideline, but the deployment and infrastructure story comes first. Insha Allah.

Full monthly update (covers all of Phase 1 Weeks 5-8):
https://www.oseplatform.com/updates/2026-04-05-phase-1-week-8-wide-to-learn-narrow-to-ship

GitHub: https://github.com/wahidyankf/open-sharia-enterprise
Updates: https://www.oseplatform.com/updates/
Learning: https://www.ayokoding.com/
