Posted: Sunday, November 22, 2026
Platform: LinkedIn
Window: 2026-11-15 20:55:09 +0700 → 2026-11-22 21:04:49 +0700. 125 commits across nine repositories (ose-public 7, private sibling 90, BeaverNest 4, RHINO 3, HIPPO 1, OSE Rules 3, py-typekit 1, ex-bdd 1, Super Agent 15).

---

OPEN SHARIA ENTERPRISE

Week 52

Highlights: OSE consolidated its DNS and domain registrations with Cloudflare. Infrastructure as Code moved to an encrypted remote state and apply-on-merge, and FinRegTech switched its staging app to Phoenix.

🏗️ Infrastructure as Code

OSE DNS and domain registrations were previously split across providers; all are now under Cloudflare. The on-premises and edge OpenTofu states moved to encrypted Cloudflare R2. In ose-private, the infra runner applies declared stacks after relevant infrastructure changes reach main, taking snapshots first. After OpenTofu succeeds, it can apply selected Ansible playbooks with recorded baselines; other playbooks remain manual.

🏗️ FinRegTech

The Phoenix app replaced the legacy backend and web pair in staging, and the team retired the legacy projects from the repository. The cutover was accepted with deviations, and follow-up verification remains open. Subsequent fixes addressed public-facing issues found in the retest.

🔎 Super Agent

Version 0.3.0 is out as an alpha pre-release. Profiles separate work and personal sources, connector specs can be validated and tested, and a pinned plugin host runs external connectors. Jira now uses the bundled specification engine alongside Outline. Check the changelog for breaking changes before upgrading.

📚 AyoKoding

The AI benchmark page in the source repository now groups models by consensus tier instead of a composite average, while keeping individual benchmark views. A tier needs agreement from at least half of the benchmarks that tier the model. Models with too little data or no consensus are identified separately. Publication depends on deployment.

🦫 BeaverNest

Codex chat now supports images generated during a turn, including unreferenced images. The image route checks access and file safety. The chat runner also prefers the host's Codex CLI, with a bundled fallback. These changes are in the family-only product's repository.

🛠️ RHINO and shared practices

RHINO v0.19.0 checks whether gates match hooks and workflows, and whether behavior scenarios have test bindings or valid exemptions. It can run selected gate entries. Its release notes describe consumer impacts, including stricter Mermaid label validation.

OSE Rules added a test and gate contract covering check placement, behavior scenarios, and unit-test coverage. RHINO and Super Agent have adopted the contract in their own repositories.

🔜 Looking ahead

In the near term, we aim to move fully to Infrastructure as Code and standardize OSE's workflows and tech stack. The goal is to make development and ongoing improvements easier.

Insha Allah.

- ose-public: https://github.com/wahidyankf/ose-public
- BeaverNest: https://github.com/wahidyankf/beaver-nest
- Super Agent: https://github.com/wahidyankf/super-agent
- RHINO: https://github.com/wahidyankf/rhino
- Updates: https://www.oseplatform.com/updates/
- Learning: https://www.ayokoding.com
