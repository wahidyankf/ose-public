Posted: Saturday, October 17, 2026
Platform: LinkedIn
Window: 2026-10-07 21:36:17 +0700 → 2026-10-17 21:30:31 +0700. 794 commits across seven repositories (ose-public 52, private sibling 458, BeaverNest 38, OSE Rules 62, RHINO 50, HIPPO 94, py-typekit 40).

---

OPEN SHARIA ENTERPRISE
Week 47

Highlights: AyoKoding gained clearer learning paths and practical entry points. A private RegTech service advanced sign-in and staging readiness. RHINO and HIPPO also shipped practical improvements for engineering teams.

🌐 OSE Rules and cross-repo

Shared rules now narrow coding-agent permissions and clarify secret handling. Our DAG-aware planning foundation maps dependencies, so ready independent tasks can be split across machines while dependent tasks wait. Coordination across machines remains manual. BeaverNest adopted the newer Command Code and Muse integrations.

🌳 OSE public and private

AyoKoding's learning paths now show phases, and its catalog, category browsing, and course pages make it easier to move from a goal to the next lesson. Five just-enough primers and a Go backend-essentials course add practical entry points.

I retired the early OSE ID, LMS, and Roots apps to focus OSE on regulatory technology and core banking, accounting, and ERP, within the limits of my development machine and token budget. Those foundations weren't public services. I've also been exploring more affordable alternatives, including GLM Flash, DeepSeek, and Muse, to stretch that budget.

The private RegTech service added sign-in and profile flows, operator account management, and a readiness check, alongside staging release and database recovery work. These are development and staging capabilities, not a public launch.

An ISP-side TCP proxy kept stalling CI connections. We routed CI and staging through a Tailscale exit node over encrypted UDP, then verified a real deployment. A quick, successful TCP connection hid failures further down the path.

🏗️ RHINO and HIPPO

RHINO v0.13.0 protects links and partial staging while formatting changed regular files. HIPPO v0.9.0 adds a terminal dashboard for running jobs, queues, and capacity; source and tag filters narrow the view, and closing it leaves jobs running.

🔜 Looking ahead

I want to explore monitoring work across machines and coding harnesses, with a possible HIPPO extension for resource pressure across machines. Today, I connect via SSH/Mosh and manually track sessions with tmux. I'd also like to explore an evaluation platform. I don't yet know what it will look like.

Insha Allah.

- ose-public: https://github.com/wahidyankf/ose-public
- OSE Rules: https://github.com/wahidyankf/ose-rules
- BeaverNest: https://github.com/wahidyankf/beaver-nest
- RHINO: https://github.com/wahidyankf/rhino
- HIPPO: https://github.com/wahidyankf/hippo
- py-typekit: https://github.com/wahidyankf/py-typekit
- Updates: https://www.oseplatform.com/updates/
- Learning: https://www.ayokoding.com
