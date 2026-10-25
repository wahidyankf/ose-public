Posted: Sunday, October 25, 2026
Platform: LinkedIn
Window: 2026-10-17 21:30:31 +0700 → 2026-10-25 18:45:38 +0700. 503 commits across seven repositories (ose-public 21, private sibling 407, OSE Rules 12, BeaverNest 16, RHINO 17, HIPPO 21, py-typekit 9).

---

OPEN SHARIA ENTERPRISE
Week 48

Highlights: AyoKoding now tracks learner progress and suggests next steps. The private FinRegTech chat added saved history and images, with a database-and-file backup check in staging.

🌐 OSE Rules and cross-repo

Each repository keeps agent definitions in its own `agents/` folder, with generated integrations for Muse and other coding tools. HIPPO adds resource tiers and checks more command launchers; quick Markdown checks run without machine admission, and scanner caches publish atomically.

🌳 OSE public and private

AyoKoding's learning pages show course and path progress, let learners resume, and suggest a next lesson. Progress is stored locally in the browser. Its CLI adds course-code authoring and checking, but courses must opt in before their examples can run.

The private FinRegTech chat adds saved conversations, renaming, image attachments, interrupted-session recovery, and per-generation reasoning choice. A live staging drill passed for database and attachment recovery, though the folder was empty; recovery with saved images remains unproved. A cleanup timer handles deleted and expired files without touching active snapshots. Chat remains in staging, not publicly launched.

🏗️ RHINO and HIPPO

RHINO puts generated integrations where each coding tool expects them and lets repositories choose their agent-definition folder. HIPPO adds an optional very-heavy tier, capacity-aware scheduling, and CPU/runtime measurements per job.

🌿 BeaverNest and py-typekit

BeaverNest's release path now works on a fresh Linux host, and restore refuses backups that fail integrity checks. py-typekit adds launcher checks that help stop Python tooling from bypassing resource checks.

We're testing Herdr (https://herdr.dev/) to ease AI work across machines, and exploring remote execution rules for capacity, dispatch records, and cleanup. We're also experimenting with Tencent VMs for more economical deployments.

🔜 Looking ahead

Deployment and CI/CD experiments with cloudflared and Tencent are going well. We'll move infrastructure from our paid Vercel account to Tencent one service at a time. We also plan to rewrite AyoKoding with Phoenix LiveView to better fit its use cases and give us more flexibility without breaking the bank. Next, we'll pursue the chat's final staging recovery proof and prepare courses for runnable examples.

Insha Allah.

- ose-public: https://github.com/wahidyankf/ose-public
- OSE Rules: https://github.com/wahidyankf/ose-rules
- BeaverNest: https://github.com/wahidyankf/beaver-nest
- RHINO: https://github.com/wahidyankf/rhino
- HIPPO: https://github.com/wahidyankf/hippo
- py-typekit: https://github.com/wahidyankf/py-typekit
- Updates: https://www.oseplatform.com/updates/
- Learning: https://www.ayokoding.com
