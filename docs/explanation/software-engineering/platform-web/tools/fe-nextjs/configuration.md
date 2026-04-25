---
title: "Next.js Configuration"
description: Comprehensive guide to Next.js configuration including next.config.ts options, environment variables, TypeScript config, custom webpack, turbopack, and experimental features
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - configuration
  - typescript
  - webpack
  - turbopack
  - environment-variables
related:
  - ./deployment.md
  - ./typescript.md
  - ./performance.md
principles:
  - explicit-over-implicit
  - reproducibility
  - automation-over-manual
created: 2026-01-26
---

# Next.js Configuration

## Quick Reference

**Core Configuration**:

- [next.config.ts](#nextconfigts-options) - Main configuration file
- [Environment Variables](#environment-variables) - Config management
- [TypeScript Config](#typescript-configuration) - tsconfig.json
- [Path Aliases](#path-aliases) - Import shortcuts

**Advanced**:

- [Custom Webpack](#custom-webpack-configuration) - Webpack customization
- [Turbopack](#turbopack-configuration) - Fast bundler
- [Experimental Features](#experimental-features) - Bleeding edge
- [Image Configuration](#image-configuration) - Image optimization
- [Redirects & Rewrites](#redirects-and-rewrites) - URL transformation

## Overview

**Configuration** in Next.js is centralized in `next.config.ts` (or `.js`) and covers everything from build behavior to runtime settings. Understanding configuration options is essential for production applications.

**Configuration Philosophy**:

- **Convention over configuration** - Sensible defaults
- **Explicit is better than implicit** - TypeScript config
- **Environment-aware** - Different configs per environment
- **Build-time optimization** - Configure for production

This guide covers Next.js 16+ configuration for enterprise applications.

## next.config.ts Options

### Basic Configuration

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Remove X-Powered-By header
  poweredByHeader: false,

  // Enable gzip compression
  compress: true,

  // Standalone output for deployment
  output: "standalone",

  // TypeScript configuration
  typescript: {
    // Fail build on type errors
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Fail build on lint errors
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
```

### OSE Platform Configuration

```typescript
// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: "standalone",

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: isProd
      ? {
          exclude: ["error", "warn"],
        }
      : false,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.oseplatform.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_NAME: "OSE Platform",
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/old-dashboard",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/docs",
        destination: "/docs/getting-started",
        permanent: false,
      },
    ];
  },

  // Rewrites (internal routing)
  async rewrites() {
    return [
      {
        source: "/api/v2/:path*",
        destination: "https://api-v2.oseplatform.com/:path*",
      },
    ];
  },

  // Experimental features
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["@mui/material", "@mui/icons-material", "lodash"],

    // Partial Prerendering (Next.js 16+)
    // ppr: true,
  },
};

export default nextConfig;
```

## Environment Variables

### File Structure

```
project/
├── .env                    # All environments (committed)
├── .env.local              # Local overrides (never commit)
├── .env.development        # Development (committed)
├── .env.production         # Production (committed)
├── .env.test               # Test (committed)
└── .env.example            # Template (committed)
```

### .env.example

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.oseplatform.com
NEXT_PUBLIC_SITE_NAME=OSE Platform

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ose_platform

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Third-party APIs
GOLD_API_KEY=your-gold-api-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false

# Logging
LOG_LEVEL=info

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### Type-Safe Environment Variables

```typescript
// lib/env.ts
import { z } from "zod";

// Define schema for environment variables
const envSchema = z.object({
  // Public (exposed to browser - must start with NEXT_PUBLIC_)
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SITE_NAME: z.string(),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  // Private (server-only)
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  GOLD_API_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
```

```typescript
// Usage
import { env } from "@/lib/env";

// Type-safe access
const apiUrl = env.NEXT_PUBLIC_API_URL;
const dbUrl = env.DATABASE_URL;
const isAnalyticsEnabled = env.NEXT_PUBLIC_ENABLE_ANALYTICS;
```

### Loading Environment Variables

```typescript
// next.config.ts
import { config } from "dotenv";
import path from "path";

// Load environment-specific .env file
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
config({ path: path.resolve(process.cwd(), envFile) });

// Now process.env is populated
const nextConfig: NextConfig = {
  // config using process.env
};

export default nextConfig;
```

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    // Target
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],

    // Module
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,

    // Interop
    "allowJs": true,
    "esModuleInterop": true,
    "isolatedModules": true,

    // Type Checking
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,

    // JSX
    "jsx": "preserve",

    // Paths
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/features/*": ["./src/features/*"]
    },

    // Emit
    "noEmit": true,
    "incremental": true,

    // Next.js specific
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Custom Type Definitions

```typescript
// types/global.d.ts
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Public
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_SITE_NAME: string;

      // Private
      DATABASE_URL: string;
      JWT_SECRET: string;
      GOLD_API_KEY: string;
    }
  }
}
```

## Path Aliases

### Configuration

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/features/*": ["./src/features/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

### Usage

```typescript
// ❌ Relative imports
import { Button } from "../../../components/ui/Button";
import { db } from "../../../lib/db/client";

// ✅ Path aliases
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db/client";
```

## Custom Webpack Configuration

### Extending Webpack

```typescript
// next.config.ts
import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const nextConfig: NextConfig = {
  webpack: (config: Configuration, { isServer, dev }) => {
    // Add custom loader
    config.module?.rules?.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Add custom alias
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "@custom": path.resolve(__dirname, "custom"),
      },
    };

    // Add custom plugin
    if (!isServer && !dev) {
      config.plugins?.push(new SomePlugin());
    }

    return config;
  },
};

export default nextConfig;
```

### Bundle Analyzer

```typescript
// next.config.ts
import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // your config
};

export default bundleAnalyzer(nextConfig);
```

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

## Turbopack Configuration

### Enable Turbopack

```bash
# Development with Turbopack
next dev --turbo

# Package.json
{
  "scripts": {
    "dev": "next dev --turbo"
  }
}
```

### Turbopack Config

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
};

export default nextConfig;
```

## Experimental Features

### Available Experiments

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Partial Prerendering (Next.js 16+)
    ppr: true,

    // Optimize package imports
    optimizePackageImports: ["@mui/material", "@mui/icons-material", "lodash"],

    // Server Actions (stable in Next.js 16)
    serverActions: {
      bodySizeLimit: "2mb",
      allowedOrigins: ["oseplatform.com"],
    },

    // Turbo (bundler)
    turbo: {},

    // Typed routes
    typedRoutes: true,

    // Instrumentation
    instrumentationHook: true,

    // Web Vitals attribution
    webVitalsAttribution: ["CLS", "LCP"],
  },
};

export default nextConfig;
```

## Image Configuration

### Complete Image Config

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    // Remote image domains (deprecated - use remotePatterns)
    // domains: ['example.com'],

    // Remote patterns (recommended)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.oseplatform.com",
        port: "",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
    ],

    // Image formats
    formats: ["image/avif", "image/webp"],

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Disable image optimization
    unoptimized: false,

    // Image cache TTL
    minimumCacheTTL: 60,

    // Dangerous allow SVG
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};
```

## Redirects and Rewrites

### Redirects

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Basic redirect
      {
        source: "/old-blog",
        destination: "/blog",
        permanent: true, // 308 status code
      },

      // Wildcard redirect
      {
        source: "/old-blog/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },

      // Regex redirect
      {
        source: "/news/:year(\\d{4})/:month(\\d{2})/:slug",
        destination: "/blog/:year/:month/:slug",
        permanent: true,
      },

      // Conditional redirect
      {
        source: "/docs",
        has: [
          {
            type: "query",
            key: "version",
            value: "1",
          },
        ],
        destination: "/docs/v1",
        permanent: false,
      },

      // Header-based redirect
      {
        source: "/api",
        has: [
          {
            type: "header",
            key: "x-redirect-to-v2",
          },
        ],
        destination: "/api/v2",
        permanent: false,
      },
    ];
  },
};
```

### Rewrites

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Basic rewrite (internal)
      {
        source: "/about-us",
        destination: "/about",
      },

      // External API rewrite
      {
        source: "/api/v2/:path*",
        destination: "https://api-v2.oseplatform.com/:path*",
      },

      // Proxy rewrite
      {
        source: "/legacy/:path*",
        destination: "https://legacy.oseplatform.com/:path*",
      },

      // Fallback rewrites
      {
        source: "/:path*",
        destination: "/404",
        has: [
          {
            type: "header",
            key: "x-feature-flag",
            value: "disabled",
          },
        ],
      },
    ];
  },
};
```

### Headers

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      // Security headers for all routes
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },

      // Cache static assets
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // CORS headers for API
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://oseplatform.com",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};
```

## Internationalization (i18n)

### i18n Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  i18n: {
    locales: ["en", "id", "ar"],
    defaultLocale: "en",
    localeDetection: true,
    domains: [
      {
        domain: "oseplatform.com",
        defaultLocale: "en",
      },
      {
        domain: "id.oseplatform.com",
        defaultLocale: "id",
      },
      {
        domain: "ar.oseplatform.com",
        defaultLocale: "ar",
      },
    ],
  },
};
```

## Runtime Configuration

### Public Runtime Config

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  publicRuntimeConfig: {
    // Available on both server and client
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  },
  serverRuntimeConfig: {
    // Only available on server
    secret: process.env.JWT_SECRET,
  },
};
```

```typescript
// Usage
import getConfig from "next/config";

const { publicRuntimeConfig, serverRuntimeConfig } = getConfig();

console.log(publicRuntimeConfig.apiUrl);
// serverRuntimeConfig only available on server
```

**Note**: Prefer environment variables over runtime config.

## Output Configuration

### Standalone Output

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
};
```

**Generates**: `.next/standalone/` with minimal Node.js server.

### Export Output

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true, // Required for export
  },
};
```

**Generates**: Static HTML/CSS/JS files in `out/` directory.

## Best Practices

### ✅ Do

- **Use TypeScript** for configuration
- **Validate environment variables** with Zod
- **Use path aliases** for cleaner imports
- **Set security headers**
- **Enable React strict mode**
- **Use standalone output** for production
- **Document configuration** changes

### ❌ Don't

- **Don't commit** `.env.local`
- **Don't use runtime config** for secrets
- **Don't skip** TypeScript validation
- **Don't ignore** build warnings
- **Don't use** deprecated options
- **Don't expose secrets** to client

## Configuration Checklist

Before production:

- [ ] Environment variables validated
- [ ] Security headers configured
- [ ] Image domains whitelisted
- [ ] Redirects configured
- [ ] TypeScript strict mode enabled
- [ ] Path aliases set up
- [ ] Build output optimized
- [ ] Runtime configuration minimal
- [ ] CORS configured (if needed)
- [ ] Compression enabled

## Related Documentation

**Core Configuration**:

- [Deployment](deployment.md) - Production deployment
- [TypeScript](typescript.md) - TypeScript integration
- [Performance](performance.md) - Optimization

**Security**:

- [Security](security.md) - Security headers and practices

---

**Next.js Version**: 14+ (TypeScript config, Turbopack, experimental features)
