Posted: Sunday, November 1, 2026
Platform: LinkedIn
Window: 2026-10-25 18:45:38 +0700 → 2026-11-01 19:15:28 +0700. 572 commits across eight repositories (ose-public 35, private sibling 452, OSE Rules 12, BeaverNest 13, RHINO 26, HIPPO 19, py-typekit 6, ex-bdd 9).

---

OPEN SHARIA ENTERPRISE
Week 49

Highlights: This week we focused on updating and rebalancing OSE infrastructure, using available machines more effectively, and defining remote dispatch. AyoKoding's rewrite and FinRegTech's staging work also progressed.

🌐 Infrastructure and remote dispatch

We updated CI runners, adjusted the fleet and staging capacity, and added cloud runner setup. OSE Rules now defines how to send compute to another controlled machine when local capacity is under pressure: check the target's capacity, admit work through HIPPO there, record the dispatch, and verify cleanup afterward. This is a governed workflow, not a claim that every check is automated.

🌳 OSE public

The AyoKoding rewrite loads learning content and tool data, with fixes to progress, search, navigation, and rendering. It remains under development and is not deployed to production. We chose Go to keep development resource needs modest and make deployment on a small VM practical.

The repository migrated from Docker to rootless Podman, with CI runner checks, build, publication, and database service verification.

🏗️ Private sibling

FinRegTech chat can handle up to three active answers per account, with one active answer per conversation and queued follow-ups. The interface also improves thinking-depth selection and readability on small phones. The chat remains in staging.

Finance runtime conversion and recovery tooling checks state, fences writers, rehearses on copies, and locks sensitive steps. Hostname transition stages are defined; the cutover remains ahead.

🏗️ RHINO and HIPPO

RHINO replaced its Rust implementation with Go while preserving its command interface, backed by differential tests. HIPPO added resource thresholds that scale with the machine and a per-machine swap gate; a follow-up fixed reservation handling after a volume device change.

🌿 BeaverNest and ex-bdd

ExBdd is an Elixir framework for executable Gherkin specifications. BeaverNest now depends on its separately maintained v0.1.0 instead of a vendored copy. Agent guards and tool pins were also refreshed across repositories, including py-typekit.

🔜 Looking ahead

Next, we'll continue the AyoKoding rewrite and FinRegTech transition. We plan to use Elixir for complex OSE services: its built-in tools support system design without new infrastructure. ExBdd will support testing those services.

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
