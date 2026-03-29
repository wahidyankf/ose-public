# Brand Context Reference

Per-app brand guidance for UI development decisions.

## organiclever-fe

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

## demo-fe-ts-nextjs

- **Product**: Technical demo frontend
- **Audience**: Developers evaluating the platform
- **Personality**: Minimal, functional, showcase-oriented
- **Tone**: Technical, neutral
- **Palette**: Neutral (inherits shared structural tokens, no brand overrides)
- **UI character**: Clean layout, demonstrates API integration, minimal styling
- **Framework**: Next.js 16, migrating to Tailwind v4 + shared tokens

## demo-fe-dart-flutterweb

- **Product**: Flutter Web demo frontend
- **Audience**: Developers evaluating Flutter
- **Palette**: Material 3 theme defaults
- **Note**: Cannot share React components — can consume CSS tokens via generated Dart constants

## oseplatform-web

- **Product**: OSE Platform marketing site
- **URL**: oseplatform.com
- **Framework**: Hugo + PaperMod theme
- **Note**: Not applicable to component design — Hugo-rendered static site, no React
