---
name: apps-organiclever-fe-developing-content
description: Comprehensive guide for developing organiclever-fe, the landing and promotional website at www.organiclever.com. Covers Next.js 16 App Router, React 19, TailwindCSS, Radix UI/shadcn-ui, cookie-based auth, JSON data files, and Vercel deployment. Essential for development tasks on organiclever-fe.
---

# organiclever-fe Development Skill

## Purpose

This Skill provides guidance for developing and managing the **organiclever-fe** Next.js 16 application — the landing and promotional website at www.organiclever.com, featuring cookie-based authentication and Radix UI components.

**When to use this Skill:**

- Developing features for organiclever-fe
- Understanding the App Router structure
- Working with authentication or data patterns
- Configuring Vercel deployment
- Understanding organiclever-fe specific conventions

## Core Concepts

### App Overview

**organiclever-fe** (`apps/organiclever-fe/`):

- **Framework**: Next.js 16 with App Router
- **React**: React 19
- **Styling**: TailwindCSS + Radix UI / shadcn-ui components
- **Auth**: Cookie-based authentication
- **Data**: JSON data files in `src/data/`
- **URL**: https://www.organiclever.com/
- **Role**: Landing and promotional page
- **Deployment**: Vercel (`prod-organiclever-fe` branch)

### Tech Stack Details

| Layer      | Technology               |
| ---------- | ------------------------ |
| Framework  | Next.js 16 (App Router)  |
| UI Runtime | React 19                 |
| Styling    | TailwindCSS              |
| Components | Radix UI / shadcn-ui     |
| Auth       | Cookie-based sessions    |
| Data       | JSON files (`src/data/`) |
| Deployment | Vercel (auto-detected)   |
| Build      | Next.js built-in         |

## Directory Structure

```
apps/organiclever-fe/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard route
│   │   ├── login/              # Login route
│   │   ├── api/                # API route handlers
│   │   ├── contexts/           # App-level context providers
│   │   ├── fonts/              # Font assets
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Root page
│   ├── components/             # App-specific components (business logic, hardcoded content)
│   │   ├── Navigation.tsx      # Sidebar nav with app routes and logout
│   │   ├── Breadcrumb.tsx      # Pathname-aware breadcrumb
│   │   └── ui/                 # Generic UI primitives (shadcn-ui, data-agnostic)
│   ├── contexts/               # Shared React contexts
│   ├── data/                   # JSON data files
│   └── lib/                    # Utility functions and helpers
├── public/                     # Static assets
├── components.json             # shadcn-ui configuration
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # TailwindCSS configuration
├── tsconfig.json               # TypeScript configuration
├── vercel.json                 # Vercel deployment configuration
└── project.json                # Nx project configuration
```

## Authentication Pattern

**Cookie-based authentication**:

- Sessions stored in HTTP cookies (not localStorage)
- Login/logout handled via `src/app/api/` route handlers
- Auth state managed through React contexts (`src/contexts/`)
- Protected routes check cookie presence on server side (App Router)

**Login flow**:

```
User submits credentials → API route validates → Sets session cookie → Redirects to dashboard
```

**Auth context pattern**:

```typescript
// src/contexts/AuthContext.tsx
// Provides auth state to components via React context
// Reads cookie on client, server components check directly
```

## Data Pattern

**JSON data files** in `src/data/`:

- Static data stored as JSON (no database)
- Imported directly in server or client components
- Immutable at runtime (no write-back to files)
- Suitable for reference data, config, mock data

```typescript
// Example: importing data
import users from "@/data/users.json";
import settings from "@/data/settings.json";
```

## Component Architecture

Components are split across two levels with a strict boundary.

### `src/components/ui/` — Generic UI primitives

- Generated and managed by the shadcn-ui CLI (`npx shadcn-ui add ...`)
- Built on Radix UI primitives for accessibility
- Styled with TailwindCSS utility classes — fully customizable (source owned by project)
- **Zero business logic** — no hardcoded routes, content, or app-specific data
- Portable: could be dropped into any Next.js project unchanged
- Examples: `Button`, `Card`, `Input`, `Dialog`, `Table`, `Label`, `Alert`

### `src/components/` — App-specific components

- Compose `ui/` primitives with business logic and app content
- May contain hardcoded routes, brand strings, or prop contracts tied to this app
- Not portable — tightly coupled to organiclever-fe's domain
- Examples: `Navigation` (hardcodes `/dashboard` routes, "Organic Lever" brand, `logout` prop), `Breadcrumb` (reads live pathname)

### Why keep them separate

Do **not** move app-specific components into `ui/`. Three concrete reasons:

1. **shadcn-ui CLI conflict** — `npx shadcn-ui add <component>` writes directly into `components/ui/`. App-specific files placed there risk being silently overwritten.
2. **Abstraction clarity** — Developers expect `ui/` to contain drop-in, data-agnostic primitives. Finding opinionated, app-coupled components there breaks that contract and creates confusion.
3. **Portability boundary** — `ui/` components can be extracted into a shared design system in the future. App-specific components cannot. Mixing them makes that extraction painful.

**Decision rule:** if a component has hardcoded routes, brand content, or props tied to this app's domain → `src/components/`. If it is a generic, reusable primitive → `src/components/ui/`.

## Next.js App Router Conventions

### Route Structure

```
src/app/
├── layout.tsx          # Root layout (wraps all pages)
├── page.tsx            # Home page (/)
├── dashboard/
│   ├── layout.tsx      # Dashboard layout (optional)
│   └── page.tsx        # Dashboard page (/dashboard)
├── login/
│   └── page.tsx        # Login page (/login)
└── api/
    └── auth/
        └── route.ts    # API handler (/api/auth)
```

### Server vs Client Components

**Default**: Server Components (no `"use client"` directive needed)

**Use Client Components when**:

- Interactive state (`useState`, `useReducer`)
- Browser APIs
- Event handlers (`onClick`, `onChange`)
- React context consumers

```typescript
// Server Component (default)
export default async function DashboardPage() {
  const data = await fetchData(); // Direct async/await
  return <div>{data.title}</div>;
}

// Client Component
("use client");
export default function LoginForm() {
  const [email, setEmail] = useState("");
  return <input onChange={(e) => setEmail(e.target.value)} />;
}
```

## Vercel Deployment

### Production Branch

**Branch**: `prod-organiclever-fe` → [https://www.organiclever.com/](https://www.organiclever.com/)  
**Purpose**: Deployment-only branch that Vercel monitors  
**Build System**: Vercel (Next.js auto-detected, no `builds` array needed)  
**Security Headers**: Configured in `vercel.json`

### vercel.json Configuration

```json
{
  "version": 2,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Deployment Process

**Step 1: Validate Current State**

```bash
# Ensure on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Must be on main branch"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Uncommitted changes detected"
  exit 1
fi
```

**Step 2: Force Push to Production**

```bash
# Deploy to production
git push origin main:prod-organiclever-fe --force
```

**Step 3: Vercel Auto-Build**

Vercel automatically:

- Detects push to prod-organiclever-fe branch
- Pulls latest code
- Builds Next.js 16 application
- Deploys to https://www.organiclever.com/

### Why Force Push

**Safe for deployment branches**:

- prod-organiclever-fe is deployment-only (no direct commits)
- Always want exact copy of main branch
- Trunk-based development: main is source of truth

## Comparison with Other Apps

| Aspect              | organiclever-fe          | ayokoding-web                  | oseplatform-web         |
| ------------------- | ------------------------ | ------------------------------ | ----------------------- |
| **Framework**       | Next.js 16 (App Router)  | Next.js 16 (App Router)        | Hugo (PaperMod theme)   |
| **Language**        | TypeScript / React 19    | TypeScript / React 19          | Markdown / Go templates |
| **Styling**         | TailwindCSS + Radix UI   | TailwindCSS                    | PaperMod built-in       |
| **Auth**            | Cookie-based sessions    | None                           | None                    |
| **Data**            | JSON files + API routes  | tRPC + database                | Markdown content files  |
| **Build**           | Next.js (Vercel)         | Next.js (Vercel)               | Hugo SSG (Vercel)       |
| **Prod Branch**     | prod-organiclever-fe     | prod-ayokoding-web             | prod-oseplatform-web    |
| **Languages**       | English                  | Bilingual (Indonesian/English) | English only            |
| **Content Types**   | Landing + promo pages    | Tutorials, essays, videos      | Updates, about page     |
| **Complexity**      | Static + light auth      | Fullstack bilingual platform   | Simple landing page     |
| **Prod URL**        | www.organiclever.com     | ayokoding.com                  | oseplatform.com         |
| **Primary Purpose** | Landing/promotional page | Educational platform           | Project landing page    |

## Development Commands

### Option 1: Nx (host, recommended for frontend-only work)

```bash
# Start development server (http://localhost:3200)
nx dev organiclever-fe

# Build for production (local verification)
nx build organiclever-fe

# Type checking
npx tsc --noEmit --project apps/organiclever-fe/tsconfig.json
```

### Option 2: Docker Compose (containerized, or running alongside the backend)

Runs the app inside a Node.js 24 Alpine container. Useful when you need the backend alongside the
frontend, or want an environment closer to CI.

```bash
# From repository root — starts organiclever-fe in Docker
npm run organiclever-fe:dev

# Or start the frontend container only
docker compose -f infra/dev/organiclever-fe/docker-compose.yml up organiclever-fe
```

**First startup** (~2-4 min): installs npm dependencies inside the container.
**Subsequent starts**: fast — `node_modules` is persisted in a named Docker volume.

> `node_modules` is intentionally isolated from the host via a Docker named volume to prevent
> Alpine Linux binary conflicts with macOS/Windows/Linux host binaries.

## Common Patterns

### Adding a New Page

```typescript
// src/app/new-feature/page.tsx
export default function NewFeaturePage() {
  return (
    <main>
      <h1>New Feature</h1>
    </main>
  );
}
```

### Adding an API Route

```typescript
// src/app/api/new-endpoint/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: "example" });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}
```

### Using shadcn-ui Components

```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ExampleForm() {
  return (
    <form>
      <Input placeholder="Email" type="email" />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

## Content Validation Checklist

Before committing changes:

- [ ] TypeScript types are correct (no `any` without justification)
- [ ] Client components have `"use client"` directive
- [ ] Server components do NOT have `"use client"` directive
- [ ] Images use Next.js `<Image>` component (not `<img>`)
- [ ] Links use Next.js `<Link>` component (not `<a>` for internal links)
- [ ] All interactive elements are keyboard accessible
- [ ] Auth-protected routes check session cookie
- [ ] API routes return appropriate HTTP status codes

## Common Mistakes

### ❌ Mistake 1: Using `<img>` instead of Next.js Image

**Wrong**: `<img src="/logo.png" alt="Logo" />`

**Right**: `<Image src="/logo.png" alt="Logo" width={100} height={100} />`

### ❌ Mistake 2: Forgetting `"use client"` for interactive components

```typescript
// Wrong - useState in server component
export default function Counter() {
  const [count, setCount] = useState(0); // Error!
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// Right
("use client");
export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### ❌ Mistake 3: Fetching data client-side when server component suffices

**Wrong**: Using `useEffect` + `fetch` in client component for initial data

**Right**: Fetch data in async server component directly

### ❌ Mistake 4: Direct commits to prod-organiclever-fe

**Wrong**: `git checkout prod-organiclever-fe && git commit`

**Right**: Commit to `main`, use deployer agent to force-push

## Reference Documentation

**Project Configuration**:

- [apps/organiclever-fe/project.json](../../../apps/organiclever-fe/project.json) - Nx project config
- [apps/organiclever-fe/next.config.mjs](../../../apps/organiclever-fe/next.config.mjs) - Next.js config
- [apps/organiclever-fe/vercel.json](../../../apps/organiclever-fe/vercel.json) - Vercel deployment config

**Infrastructure**:

- [infra/dev/organiclever-fe/README.md](../../../infra/dev/organiclever-fe/README.md) - Docker Compose setup for frontend
- [infra/dev/organiclever-fe/docker-compose.yml](../../../infra/dev/organiclever-fe/docker-compose.yml) - Service definition
- [infra/dev/organiclever-fe/Dockerfile.web.dev](../../../infra/dev/organiclever-fe/Dockerfile.web.dev) - Frontend container image

**Related Skills**:

- `repo-practicing-trunk-based-development` - Git workflow and branch strategy
- `swe-programming-typescript` - TypeScript coding standards

**Related Agents**:

- `apps-organiclever-fe-deployer` - Deploys organiclever-fe to production
- `swe-typescript-developer` - TypeScript/Next.js development
- `swe-e2e-test-developer` - E2E testing with Playwright

---

This Skill packages essential organiclever-fe development knowledge for building and deploying the OrganicLever landing and promotional website at www.organiclever.com.
