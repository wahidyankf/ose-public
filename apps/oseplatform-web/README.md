# oseplatform-web

Official website for the **Open Sharia Enterprise** platform - an open-source Sharia-compliant enterprise solutions platform built in the open.

**Why This Matters**: Islamic finance is a multi-trillion dollar industry, but most Sharia-compliant enterprise solutions are proprietary and expensive. We're building an open-source alternative with Sharia-compliance at its core - not bolted on as an afterthought.

**What This Site Does**: Showcases the platform and shares our journey. Regular updates keep the community informed as we build with radical transparency.

**Why Open Source**: Transparency builds trust in Sharia-compliant systems. By building in the open, we make trustworthy enterprise technology accessible to organizations of all sizes.

## Architecture

- **Framework**: Next.js 16 (App Router, React Server Components)
- **Language**: TypeScript (strict mode)
- **API**: tRPC for type-safe server-client communication
- **Content**: Reads markdown with YAML frontmatter from `content/` (~6 pages: Landing, About, update posts)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Search**: FlexSearch for full-text search
- **Diagrams**: Mermaid diagram support
- **Testing**: Vitest (unit + integration), 80% line coverage enforced via rhino-cli

## Quick Start

```bash
# Development server (port 3100)
nx dev oseplatform-web

# Production build
nx build oseplatform-web

# Typecheck
nx run oseplatform-web:typecheck

# Lint (oxlint)
nx run oseplatform-web:lint

# Unit tests + coverage + links
nx run oseplatform-web:test:quick

# Integration tests
nx run oseplatform-web:test:integration
```

## Project Structure

```
oseplatform-web/
├── src/
│   ├── app/          # Next.js App Router pages and layouts
│   ├── server/       # tRPC routers and server-side logic
│   ├── components/   # React components (shadcn/ui + custom)
│   └── lib/          # Utilities, search, markdown processing
├── test/             # Test files (Vitest unit + integration)
├── content/          # Markdown pages with YAML frontmatter
└── project.json      # Nx project configuration
```

## Deployment

Deployed to Vercel via production branch `prod-oseplatform-web`.

- **Production**: <https://oseplatform.com>
- **Deploy**: Push `main` to `prod-oseplatform-web`; Vercel builds automatically

```bash
git push origin main:prod-oseplatform-web
```

## Related

- [Main Repository](https://github.com/wahidyankf/ose-public)
- [apps-oseplatform-web-deployer](../../.claude/agents/) - AI agent for deployments
