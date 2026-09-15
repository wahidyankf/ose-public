Posted: Tuesday, August 18, 2026
Platform: LinkedIn
Window: 2026-08-11 18:49:50 +0700 → 2026-08-18 18:36:31 +0700. ~106 commits across both repos (ose-public 53, private sibling 53).

---

OPEN SHARIA ENTERPRISE

Week 39

Highlights: BeaverNest now runs a responsive Flutter workspace through its F# backend; AyoKoding expanded into connected career, accounting, Sharia accounting, and ERP paths; and both repositories tightened the rules that keep fast-moving code understandable.

🌐 Cross-repo

- ose-public and the private sibling now form the parity pair. ose-primer can evolve independently rather than inherit tooling and governance designed for different needs.
- A shared glossary gives repository-wide terms one meaning. Governance files use one word-based budget, and every main content-tree directory must carry an indexed README.
- Local environment setup now creates `.env.local`. Real environment files remain blocked from commits, while agent read protections focus on `.env.prod` and `.env.stag`.

🌳 ose-public

BeaverNest now serves a Flutter web client from the same F# app to ensure readiness and enable safe diagnostics. Its responsive status workspace verifies the hosted path from generated contracts to deployment assertions. The assistant experience is not there yet, but the product now has the client foundation on which it will grow.

AyoKoding gained connections in software and AI careers, security and operations, low-level systems, architecture, interview techniques, JVM internals, capstones, accounting, Sharia accounting, and ERP. The emphasis is shifting from isolated topics toward journeys that help learners choose what to study next.

Two dormant link-checking CLIs, their shared Rust library, and an empty legacy web shell were retired. The central Markdown gate now checks both live content trees directly, closing the gap those unused tools had hidden.

🏗️ Private sibling

CoralPolyp was removed after recovery work showed that no current product needs to keep the app group alive. The backend, frontend, E2E suites, sandbox, workflows, and stale environment wiring are no longer available; the platform can add them back when a concrete need returns.

CI now reuses runner-local Node, .NET, and Rust assets instead of repeatedly caching or reinstalling them, since self-hosted machines already retain them. JVM setup also disappeared because the repository builds no JVM project.

🔜 Next 2–4 weeks

The active BeaverNest work turns the new Flutter foundation toward a durable browser chat backed by authenticated coding-agent CLI sessions. The onboarding refresh will continue to align the public story, setup paths, and repository boundaries with what actually exists.

This week reinforced a pattern I value: progress is not only adding capability. Sometimes it is making one path real, then deleting the placeholders and duplicated machinery around it.

Insha Allah.

- ose-public: https://github.com/wahidyankf/ose-public
- OrganicLever: https://www.organiclever.com/
- Updates: https://www.oseplatform.com/updates/
- Learning: https://www.ayokoding.com
