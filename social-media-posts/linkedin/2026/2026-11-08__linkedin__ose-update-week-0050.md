Posted: Sunday, November 8, 2026
Platform: LinkedIn
Window: 2026-11-01 19:15:28 +0700 → 2026-11-08 20:05:33 +0700. 80 commits across eight repositories (ose-public 3, private sibling 55, OSE Rules 2, BeaverNest 4, RHINO 5, HIPPO 6, py-typekit 2, ex-bdd 3).

---

OPEN SHARIA ENTERPRISE
Week 50

Highlights: A quieter week, with attention on FinRegTech's runtime transition and more practical release checks for smaller machines.

🏗️ Private sibling

FinRegTech's staging runtime was converted to its new identity and write access reopened. The public endpoint then returned a gateway error. A code fix has merged, but the latest recorded evidence leaves the live restore and end-to-end verification open. The deployment path after conversion also needs a decision, so the transition is not yet complete.

Supporting changes improved conversion rehearsal and rollback, preserved network rules across restarts, and fixed a configuration issue that could stop chat file cleanup. The updated web and backend runtime images passed security scans in CI.

🏗️ HIPPO and shared tooling

HIPPO's release assessment now handles small machines more fairly: on hosts with at most two CPUs, it checks whether requests succeed and respond within limits instead of rejecting a release for busy CPUs alone. Swap-pressure thresholds now scale with host memory, and small incidental swap-outs no longer reject a release on their own. Health and other checks still apply.

Repositories adopted RHINO v0.16.7, whose README index validation avoids repeated scans, making the check much faster on large projects. Updated HIPPO pins also reached other repositories. RHINO, HIPPO, py-typekit, and ex-bdd also standardized conceptual diagrams on Mermaid.

🔜 Looking ahead

Next, we'll continue improving FinRegTech, moving from Vercel to Cloudflare, and developing the AyoKoding rewrite.

Insha Allah.

- ose-public: https://github.com/wahidyankf/ose-public
- OSE Rules: https://github.com/wahidyankf/ose-rules
- BeaverNest: https://github.com/wahidyankf/beaver-nest
- RHINO: https://github.com/wahidyankf/rhino
- HIPPO: https://github.com/wahidyankf/hippo
- py-typekit: https://github.com/wahidyankf/py-typekit
- ex-bdd: https://github.com/wahidyankf/ex-bdd
- Updates: https://www.oseplatform.com/updates/
- Learning: https://www.ayokoding.com
