# OSE Platform Web C4 Diagrams

C4 architecture diagrams for the OSE Platform marketing and updates site (Next.js 16 content
platform).

## Diagrams

| Level     | File              | What It Shows                                                                          |
| --------- | ----------------- | -------------------------------------------------------------------------------------- |
| Context   | `context.md`      | The system and its external actors (visitors, authors, CI, Vercel)                     |
| Container | `container.md`    | Runtime containers: Next.js app, content directory, Vercel CDN, search index           |
| Component | `component-be.md` | tRPC API internals: router, procedures, content services, search index, route handlers |
| Component | `component-fe.md` | UI internals: pages, layout components, content renderers, search, theme               |

## C4 Level Summary

- **Context** — answers: who uses the system and how?
- **Container** — answers: what processes run and what data stores exist?
- **Component (BE)** — answers: what are the logical building blocks inside the tRPC API?
- **Component (FE)** — answers: what are the logical building blocks inside the UI?

## Technology Stack

| Layer     | Technology                            |
| --------- | ------------------------------------- |
| Framework | Next.js 16 (App Router, TypeScript)   |
| API       | tRPC v11                              |
| Search    | FlexSearch (in-memory, server-side)   |
| Markdown  | gray-matter + unified (remark/rehype) |
| Styling   | Tailwind CSS + shadcn/ui              |
| Hosting   | Vercel (standalone output, ISR)       |
| Content   | Markdown files with YAML frontmatter  |
| Languages | English only                          |

## Testing

| Suite           | App                    | Scope                            |
| --------------- | ---------------------- | -------------------------------- |
| Unit tests      | oseplatform-web        | Vitest, >= 80% line coverage     |
| Backend E2E     | oseplatform-web-be-e2e | Playwright, tRPC API endpoints   |
| Frontend E2E    | oseplatform-web-fe-e2e | Playwright, browser interactions |
| Link validation | oseplatform-cli        | Internal content link checks     |

## Related

- **Parent**: [oseplatform-web specs](../README.md)
- **Backend gherkin specs**: [be/gherkin/](../be/)
- **Frontend gherkin specs**: [fe/gherkin/](../fe/)
- **App source**: [apps/oseplatform-web/](../../../../apps/oseplatform-web/README.md)
