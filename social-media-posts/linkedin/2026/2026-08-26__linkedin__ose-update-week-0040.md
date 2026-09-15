Posted: Wednesday, August 26, 2026
Platform: LinkedIn
Window: 2026-08-18 18:36:31 +0700 → 2026-08-26 07:33:08 +0700. ~216 commits across three repos (ose-public 75, private sibling 64, beaver-nest 77).

---

OPEN SHARIA ENTERPRISE
Week 40

Highlights: BeaverNest now has its own focused repository. Its former Flutter/F# surfaces were removed from ose-public; an Nx workspace with Phoenix LiveView now carries local Codex chat and quizzing studies.

🌐 Cross-repo

ose-public and the private sibling remain the parity pair. BeaverNest is independent; live work belongs in wahidyankf/beaver-nest, outside ose-public's Rhino byte-identity and governance propagation.

🌳 ose-public

Runtime port handling now follows a single contract across all listeners: an explicit flag wins, then an app-specific environment variable, then the documented default; malformed values fail at startup rather than creating ambiguous deployments.

Contributor docs now agree on setup, Nx, ports, prerequisites, names, and repository boundaries. PR review gained risk-based routing, shared context, evidence-backed refutation, and bounded recovery.

🏗️ Private sibling

The active Node B/C CI pool now uses a 3+3 topology: six clearly named runners on a 6 GB profile with thin-pool discard. The obsolete pdm-ose VM and template were retired.

An idempotent play aligned two hypervisors and six runners on one Tailscale version while retaining their existing tailnet identities. Infrastructure lint installs OpenTofu explicitly, and Rhino falls back safely when a changed-base reference cannot resolve.

🦫 BeaverNest

The new Phoenix LiveView app can run page-scoped local Codex conversations, stream responses, resume a completed same-tab thread after reload, and switch model or reasoning effort without losing context. The bridge stays read-only: approvals are disabled, and network access plus web search remain off. The app also carries an installable PWA shell for private home use.

One family-only environment is intended to stay online continuously, and Phoenix LiveView is the right fit so far. BeaverNest also serves as a lab for AI-assisted coding in everyday activities, using a dynamically typed language such as Elixir, feeding useful insights back into other OSE products.

Quizzing studies add study, quiz, and review modes, browser-persisted progress, adaptive review queues, swipe navigation, and a confirmed reset.

🔜 Next 2–4 weeks

BeaverNest is intended for continuous family use, not public or general-purpose use. Production hosting is the next step, alongside authentication, always-on launch, server-side persistence, and backups. In ose-public, the Rhino Rust-to-F# rewrite remains a reviewed plan—not shipped functionality.

Clean boundaries unlocked both sides: OSE became smaller and clearer, while BeaverNest found a stack and repository shaped for its purpose.

Insha Allah.

- ose-public: https://github.com/wahidyankf/ose-public
- BeaverNest: https://github.com/wahidyankf/beaver-nest
- OrganicLever: https://www.organiclever.com/
- Updates: https://www.oseplatform.com/updates/
- Learning: https://www.ayokoding.com
