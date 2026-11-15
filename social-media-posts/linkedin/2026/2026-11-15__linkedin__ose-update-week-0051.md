Posted: Sunday, November 15, 2026
Platform: LinkedIn
Window: 2026-11-08 20:05:33 +0700 → 2026-11-15 20:55:09 +0700. 196 commits across nine OSE repositories (ose-public 5, private sibling 125, BeaverNest 12, RHINO 7, HIPPO 1, OSE Rules 2, py-typekit 1, ex-bdd 1, Super Agent 42).

---

OPEN SHARIA ENTERPRISE

Week 51

Highlights: BeaverNest's chats gained richer messages and a more consistent layout, and Super Agent's retriever gained a way to describe connectors as data. RHINO and AyoKoding also advanced.

🏗️ FinRegTech

The repository record confirms that FinRegTech completed the staging transition reported last week. Development of the next version is underway.

🦫 BeaverNest

Both Family Chat and Codex chat now render Markdown, images, and supported Mermaid diagrams through a shared message component. The chat header and composer stay visible while the message list scrolls. Session and request handling also received security fixes, and child model restrictions now take precedence for accounts with an administrator role. These changes are merged in the family-only product's repository.

🔎 Super Agent

Super Agent (work in progress) aims to help us juggle work across multiple projects, data sources, and machines. Its current alpha connects people and coding tools to data sources through a retriever command-line tool and Model Context Protocol server. On its main branch, connector specifications can define operations and generate command-line and server tools; the bundled Outline connector now uses the engine for its operations. The published v0.2.0 alpha predates this connector work; coordination across machines remains an aim.

🛠️ RHINO and shared practices

RHINO v0.17.0 added vault manifest validation and commands to move declared secrets between local files and an unlocked Bitwarden vault. v0.18.0 adds references so an entry can read a secret owned by another entry. The v0.17.0 release also changes some exit statuses, so consumers should read the release notes before upgrading.

Across several independent repositories, a new consumer-correctness principle emphasizes designing interfaces so that consumers can use them correctly.

📚 AyoKoding

The AI benchmark data and model roster were refreshed, with FrontierCode-AA added to the composite. A new score selector can rank models by the composite average or an individual benchmark; models without a score on the chosen benchmark are unranked. These changes are in the source repository; publication depends on the site's deployment.

We'll keep refining the products and tools, Insha Allah.

- ose-public: https://github.com/wahidyankf/ose-public

- BeaverNest: https://github.com/wahidyankf/beaver-nest

- Super Agent: https://github.com/wahidyankf/super-agent

- RHINO: https://github.com/wahidyankf/rhino

- Updates: https://www.oseplatform.com/updates/

- Learning: https://www.ayokoding.com
