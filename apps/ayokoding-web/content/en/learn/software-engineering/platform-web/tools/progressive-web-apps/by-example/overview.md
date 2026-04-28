---
title: "Overview"
date: 2026-04-29T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn Progressive Web Apps through 85 heavily annotated code examples achieving 95% PWA coverage — manifests, service workers, Workbox, offline patterns, push notifications, and production checklists"
tags: ["pwa", "progressive-web-apps", "service-worker", "workbox", "offline", "by-example"]
---

**Want to build installable, offline-capable web apps?** This by-example tutorial provides 85 heavily annotated examples covering 95% of Progressive Web App concepts. Master manifests, service workers, Workbox strategies, push notifications, and production patterns through working code rather than lengthy explanations.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the PWA concept
2. **How it works** - A focused, heavily commented code example
3. **Key Takeaway** - A summary of the essential lesson
4. **Why It Matters** - Production context, when to use it, and deeper significance

This approach works best when you already understand JavaScript fundamentals and basic web development. You learn PWA mechanics by studying real code patterns rather than theoretical descriptions.

## What Is a Progressive Web App?

A Progressive Web App is a **web application that uses modern browser APIs** to deliver native-like experiences. Key characteristics:

- **Installable**: Users can add the app to their home screen or desktop via a web app manifest
- **Offline-capable**: A service worker caches assets and data so the app works without a network connection
- **Reliable**: Fast loading regardless of network quality because cached assets are served immediately
- **Engaging**: Push notifications and background sync keep users informed and data fresh
- **Secure**: PWAs require HTTPS to protect service worker registration and sensitive APIs

PWAs are not a framework — they are a set of browser standards layered on any existing web app. A vanilla HTML site, a React app, and a Next.js application can all become PWAs by adding a manifest and a service worker.

## Learning Path

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
  A["Beginner<br/>Manifests, SW Basics, Install<br/>Examples 1-28"] --> B["Intermediate<br/>Workbox, Push, IndexedDB<br/>Examples 29-57"]
  B --> C["Advanced<br/>Architecture, Testing, Production<br/>Examples 58-85"]
  D["0%<br/>No PWA Knowledge"] -.-> A
  C -.-> E["95%<br/>PWA Production Mastery"]

  style A fill:#0173B2,stroke:#000000,stroke-width:2px,color:#fff
  style B fill:#DE8F05,stroke:#000000,stroke-width:2px,color:#fff
  style C fill:#029E73,stroke:#000000,stroke-width:2px,color:#fff
  style D fill:#CC78BC,stroke:#000000,stroke-width:2px,color:#fff
  style E fill:#029E73,stroke:#000000,stroke-width:2px,color:#fff
```

## Coverage Philosophy: 95% Through 85 Examples

The 85 examples are organized progressively:

- **Beginner (Examples 1-28)**: Web app manifests, service worker lifecycle, caching strategies, install prompts, offline detection
- **Intermediate (Examples 29-57)**: Workbox 7.4.0, @serwist/next for Next.js, Background Sync (Chromium-only), push notifications, IndexedDB, Wake Lock, File System Access, advanced manifest fields
- **Advanced (Examples 58-85)**: Window Controls Overlay, offline-first architecture, cross-tab communication, streaming, navigation preload, update UX, performance, testing, security, and production checklists

Together, these examples cover **95% of what you'll encounter** in real-world PWA development.

## Annotation Density: 1-2.25 Comments Per Code Line

All examples maintain **1-2.25 comment lines per code line per example** to ensure deep understanding.

- Simple lines get 1 annotation explaining purpose or result
- Complex lines get 2 annotations explaining behavior, side effects, and caveats
- Use `// =>` notation to show expected values, API returns, or browser behavior

**Example**:

```javascript
// Register the service worker when the browser supports it
if ("serviceWorker" in navigator) {
  // => Feature detect: older browsers lack SW support
  const reg = await navigator.serviceWorker.register("/sw.js"); // => Sends fetch for /sw.js, parses + installs SW
  // => Returns ServiceWorkerRegistration object
  console.log("SW registered, scope:", reg.scope); // => Output: SW registered, scope: https://example.com/
}
```

## Structure of Each Example

All examples follow a consistent five-part format:

```
## Example N: Descriptive Title

2-3 sentence explanation of the PWA concept.

[Optional Mermaid diagram for complex relationships]

**Code**:

\`\`\`javascript
// Heavily annotated code example
\`\`\`

**Key Takeaway**: 1-2 sentence summary.

**Why It Matters**: 50-100 words explaining production significance.
```

## What's Covered

### Manifests and Installability

- **Web App Manifest**: Required fields, display modes, icons, screenshots, shortcuts
- **Maskable icons**: Safe zone rules, purpose field
- **iOS integration**: Meta tags, apple-touch-icon, status-bar-style
- **Install prompts**: `beforeinstallprompt`, custom install buttons, `appinstalled` event

### Service Workers

- **Registration**: `navigator.serviceWorker.register()`, scope, module type
- **Lifecycle**: install, activate, fetch events; skipWaiting, clients.claim
- **Caching strategies**: Cache First, Network First, Stale While Revalidate, Cache Only, Network Only
- **Offline fallback**: Caching /offline.html, serving when network fails
- **Cache versioning**: Naming, cleanup, busting

### Workbox 7.4.0

- **Setup**: `workbox-webpack-plugin`, `workbox-build`, `@serwist/next` for Next.js
- **Precaching**: `precacheAndRoute` for build assets
- **Routing**: `registerRoute` with URL pattern matching
- **Strategies**: ExpirationPlugin, BroadcastUpdatePlugin, BackgroundSyncPlugin
- **@serwist/next**: Replaces deprecated `@ducanh2912/next-pwa` and `next-pwa`

### Push and Notifications

- **Web Push**: VAPID keys, `pushManager.subscribe`, `web-push` npm package
- **Push events**: Receiving payloads, `showNotification`, action buttons
- **Notification click**: Focusing windows, opening URLs

### Background and Sync

- **Background Sync**: `registration.sync.register` (Chromium-only — not Firefox/Safari)
- **Periodic Background Sync**: `periodicSync.register` (Chromium-only)
- **IndexedDB**: `idb` v8 library, transactions, offline-first data patterns

### Modern APIs

- **Screen Wake Lock**: `navigator.wakeLock.request('screen')` — Baseline 2025, all browsers
- **File System Access**: `showOpenFilePicker`, `showSaveFilePicker`
- **Web Share**: `navigator.share`, `canShare`, files sharing
- **Badging**: `navigator.setAppBadge` (Chrome/Edge)
- **Storage**: `navigator.storage.estimate()`, `persist()`

### Advanced Patterns

- **Window Controls Overlay**: Desktop PWA title bar, CSS env vars
- **Offline-first architecture**: IndexedDB as primary store, sync queue
- **Cross-tab communication**: `BroadcastChannel`, service worker `postMessage`
- **Navigation preload**: Reducing service worker boot latency
- **Update flow**: Detecting new SW versions, prompting users to reload

### Production

- **Testing**: Playwright for service workers, Vitest with `workbox-testing`
- **Security**: Content Security Policy, HTTPS, mkcert for local development
- **Performance**: Web Vitals, render-blocking elimination, critical CSS
- **App stores**: PWABuilder (Microsoft Store), Bubblewrap (Play Store)
- **Production checklist**: Comprehensive pre-launch verification

## What's NOT Covered

- **Framework internals**: React, Vue, Angular architecture details
- **Backend development**: Server-side rendering, API design
- **Advanced TypeScript**: TypeScript features unrelated to PWA patterns
- **Mobile native development**: React Native, Capacitor, Cordova

## Prerequisites

### Required

- **JavaScript fundamentals**: ES6+ syntax, Promises, async/await, arrow functions
- **HTML/CSS**: Basic web fundamentals, link elements, meta tags
- **HTTP basics**: Understanding requests, responses, headers, caching
- **Programming experience**: You have built web pages or web apps before

### Recommended

- **TypeScript basics**: Helpful for Workbox and @serwist/next examples
- **Node.js**: For Workbox build tools and web-push server examples
- **npm/yarn**: Package management for Workbox installation
- **Fetch API**: Understanding fetch requests improves service worker comprehension

### Not Required

- **React/Next.js experience**: Examples cover Next.js integration but teach PWA concepts independently
- **Service worker prior experience**: This guide assumes you are new to service workers
- **Native app development**: PWA concepts are explained from the web perspective

## Browser Support Notes

Some PWA APIs have limited browser support. Accurate browser support information per feature:

- **Service Workers**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Web App Manifest**: All modern browsers
- **Background Sync**: Chromium-only (Chrome 61+, Edge) — NOT available in Firefox or Safari
- **Periodic Background Sync**: Chromium-only — NOT available in Firefox or Safari
- **beforeinstallprompt**: Chrome and Edge only — NOT available in Firefox or Safari
- **Badging API**: Chrome and Edge — limited support
- **Screen Wake Lock**: Baseline 2025 — all major browsers (Chrome, Firefox, Safari, Edge)
- **File System Access**: Chrome/Edge; Firefox experimental; Safari limited
- **Web Share API**: Widely supported across modern browsers

Examples document browser support clearly so you can make informed decisions about progressive enhancement.

## How to Use This Guide

### 1. Choose Your Starting Point

- **New to PWAs?** Start with Beginner (Example 1)
- **Know manifests and SW basics?** Jump to Intermediate (Example 29)
- **Building production features?** Browse Advanced (Example 58+)

### 2. Read the Example

Each example has five parts: brief explanation, optional diagram, annotated code, key takeaway, and why it matters.

### 3. Try the Code

Most examples are self-contained and can be added directly to any web project. For service worker examples, serve via localhost (file:// does not support service workers).

```bash
# Quick local server for trying examples
npx serve .
# Or with Node.js
npx http-server . -p 3000
```

### 4. Modify and Experiment

Change cache names, swap strategies, break things intentionally. Experimentation builds intuition faster than reading alone.

## Ready to Start?

Choose your learning path:

- **Beginner** - Start here if you are new to PWAs. Build foundation understanding through 28 core examples covering manifests, service worker lifecycle, and install prompts.
- **Intermediate** - Jump here if you know basic service workers. Master Workbox, push notifications, and advanced browser APIs through 29 examples.
- **Advanced** - Expert mastery through 28 advanced examples covering offline-first architecture, testing, performance, and production deployment.
