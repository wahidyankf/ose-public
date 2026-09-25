# Brand Context Reference

Per-app brand guidance for UI development decisions.

## organiclever-www

- **Product**: Business productivity tracker (OrganicLever)
- **URL**: www.organiclever.com
- **Audience**: Business professionals, team managers
- **Personality**: Professional, efficient, trustworthy
- **Tone**: Formal but approachable, data-driven
- **Palette**: Neutral grayscale — `--primary: 0 0% 9%` (near-black)
- **Typography**: Clean sans-serif (currently Arial — migrating to next/font)
- **Unique tokens**: `--chart-1` through `--chart-5` for data visualization
- **UI character**: Dense data tables, charts, minimal decoration, productivity-focused
- **Framework**: Next.js 16, Tailwind v4, shadcn/ui, Storybook

## ayokoding-web

- **Product**: Educational coding platform (AyoKoding)
- **URL**: ayokoding.com
- **Audience**: Indonesian tech community, developers learning programming
- **Personality**: Approachable, educational, encouraging
- **Tone**: Informal, tutorial-oriented, bilingual (English + Indonesian)
- **Palette**: Blue-tinted — `--primary: hsl(221.2 83.2% 53.3%)` (vibrant blue)
- **Typography**: System font with font-feature-settings for ligatures
- **Unique tokens**: `--sidebar-*` (8 tokens) for navigation sidebar
- **UI character**: Content-focused, long-form reading, code blocks with syntax highlighting
- **Framework**: Next.js 16, Tailwind v4 + @tailwindcss/typography, shadcn/ui, rehype-pretty-code

## ose-web

- **Product**: OSE Platform marketing site
- **URL**: oseplatform.com
- **Framework**: Next.js 16 (App Router, TypeScript, tRPC)
- **Note**: Uses React components — can share UI components following the standard component patterns
