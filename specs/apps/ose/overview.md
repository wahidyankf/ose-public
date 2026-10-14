# OSE — Product Overview

## OSE Application (`ose-app-*`)

AI-assisted gap analysis between regulator-published rule documents and company internal
policies. Target users: compliance officers and risk teams.

### Scope (ose-app)

- Regulatory document ingestion and storage
- Internal policy document ingestion and storage
- AI-assisted gap analysis between regulatory corpus and policy corpus
- Traceable GapItem records linking regulatory clause to missing policy area

## OSE Platform Web (`ose-web`)

Marketing and updates site for the Open Sharia Enterprise platform. Showcases the platform
vision, publishes development updates, and provides a searchable content library.

### Who uses it (ose-web)

- **Visitors** — potential contributors, adopters, and community members
- **Content authors** — the platform maintainer publishing markdown update posts

### What ships today (ose-web)

- Landing page with hero block and social links
- Update post listing at `/updates/` and individual update articles
- Full-text search via FlexSearch
- RSS feed at `/feed.xml`
- SEO: sitemap, robots.txt, per-route metadata
- Health probe at `health.check` tRPC procedure

### What is deferred (ose-web)

- Authenticated contributor portal
- Dynamic content management (CMS integration)
- Multi-language support (English-only today)
