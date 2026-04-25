---
title: "React Build & Deployment"
description: Build configuration and deployment strategies for React applications
category: explanation
subcategory: platform-web
tags:
  - react
  - build
  - deployment
  - vite
  - production
related:
  - ./best-practices.md
principles:
  - automation-over-manual
  - reproducibility
---

# React Build & Deployment

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [TypeScript React](./README.md) > Build & Deployment

**Related Guides**:

- [Best Practices](best-practices.md) - Production standards
- [Performance](performance.md) - Build optimization

## Overview

Building and deploying React applications for production requires configuration of build tools, environment variables, optimization, and deployment pipelines.

**Target Audience**: Developers deploying React applications to production, particularly Islamic finance platforms requiring secure, optimized builds.

**React Version**: React 19.0 with TypeScript 5+
**Build Tool**: Vite

## Vite Configuration

### Basic Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@core": path.resolve(__dirname, "./src/core"),
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
        },
      },
    },
  },

  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
```

### Environment Variables

```typescript
// .env.development
VITE_API_URL=http://localhost:8080/api
VITE_APP_TITLE=OSE Platform (Dev)

// .env.production
VITE_API_URL=https://api.oseplatform.com
VITE_APP_TITLE=OSE Platform

// src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  appTitle: import.meta.env.VITE_APP_TITLE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

// Usage
import { config } from './config';

const response = await fetch(`${config.apiUrl}/donations`);
```

### Type-Safe Environment Variables

```typescript
// src/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_ENABLE_ANALYTICS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// src/config.ts
function getEnvVar(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

export const config = {
  apiUrl: getEnvVar("VITE_API_URL"),
  appTitle: getEnvVar("VITE_APP_TITLE"),
  enableAnalytics: getEnvVar("VITE_ENABLE_ANALYTICS") === "true",
} as const;
```

## Production Builds

### Build Optimization

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      // Bundle size analysis
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  build: {
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor chunks
          if (id.includes("node_modules")) {
            if (id.includes("react")) {
              return "react-vendor";
            }
            if (id.includes("@tanstack/react-query")) {
              return "query-vendor";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
```

## Docker Deployment

### Multi-Stage Dockerfile

```dockerfile
# Build stage
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## CI/CD Pipelines

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "24"

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:ci

      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_APP_TITLE: "OSE Platform"

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "24"

cache:
  paths:
    - node_modules/

test:
  stage: test
  image: node:${NODE_VERSION}-alpine
  script:
    - npm ci
    - npm run lint
    - npm run test:ci
  artifacts:
    reports:
      coverage: coverage/
    expire_in: 1 week

build:
  stage: build
  image: node:${NODE_VERSION}-alpine
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

deploy-production:
  stage: deploy
  image: node:${NODE_VERSION}-alpine
  script:
    - npm ci
    - npm run build
    - npm run deploy
  environment:
    name: production
    url: https://oseplatform.com
  only:
    - main
```

## Cloud Deployments

### Vercel Deployment

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://api.oseplatform.com/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Netlify Deployment

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "24"

[[redirects]]
  from = "/api/*"
  to = "https://api.oseplatform.com/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### AWS S3 + CloudFront

```bash
#!/bin/bash
# deploy-aws.sh

# Build application
npm run build

# Upload to S3
aws s3 sync dist/ s3://oseplatform-web \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --exclude "*.map"

# Upload index.html without cache
aws s3 cp dist/index.html s3://oseplatform-web/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --metadata-directive REPLACE

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234ABCD5678 \
  --paths "/*"
```

```typescript
// CloudFormation template (infrastructure as code)
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {
    "WebsiteBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": "oseplatform-web",
        "WebsiteConfiguration": {
          "IndexDocument": "index.html",
          "ErrorDocument": "index.html"
        }
      }
    },
    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Origins": [
            {
              "DomainName": "oseplatform-web.s3-website-us-east-1.amazonaws.com",
              "Id": "S3Origin",
              "CustomOriginConfig": {
                "HTTPPort": 80,
                "OriginProtocolPolicy": "http-only"
              }
            }
          ],
          "Enabled": true,
          "DefaultRootObject": "index.html",
          "DefaultCacheBehavior": {
            "TargetOriginId": "S3Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "Compress": true
          }
        }
      }
    }
  }
}
```

## Container Orchestration

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://backend:8080
    depends_on:
      - backend
    networks:
      - ose-network

  backend:
    image: ose-platform-api:latest
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/oseplatform
    depends_on:
      - db
    networks:
      - ose-network

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=oseplatform
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ose-network

networks:
  ose-network:
    driver: bridge

volumes:
  postgres_data:
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oseplatform-web
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: oseplatform-web
  template:
    metadata:
      labels:
        app: oseplatform-web
    spec:
      containers:
        - name: web
          image: oseplatform-web:latest
          ports:
            - containerPort: 80
          env:
            - name: VITE_API_URL
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: api-url
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          livenessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: oseplatform-web
  namespace: production
spec:
  type: LoadBalancer
  selector:
    app: oseplatform-web
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  api-url: "https://api.oseplatform.com"
```

### Helm Chart

```yaml
# helm/values.yaml
replicaCount: 3

image:
  repository: oseplatform-web
  tag: latest
  pullPolicy: Always

service:
  type: LoadBalancer
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: oseplatform.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: ose-platform-tls
      hosts:
        - oseplatform.com

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## CDN Configuration

### CloudFlare Setup

```typescript
// cloudflare-config.ts
export const cloudflareConfig = {
  // Cache rules
  cacheRules: [
    {
      path: "/static/*",
      cacheTtl: 31536000, // 1 year
      browserTtl: 31536000,
    },
    {
      path: "/assets/*",
      cacheTtl: 31536000,
      browserTtl: 31536000,
    },
    {
      path: "*.js",
      cacheTtl: 86400, // 1 day
      browserTtl: 86400,
    },
    {
      path: "*.css",
      cacheTtl: 86400,
      browserTtl: 86400,
    },
    {
      path: "/index.html",
      cacheTtl: 0, // No cache
      browserTtl: 0,
    },
  ],

  // Security headers
  securityHeaders: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  },

  // Page rules
  pageRules: [
    {
      url: "oseplatform.com/*",
      settings: {
        ssl: "strict",
        minify: {
          html: true,
          css: true,
          js: true,
        },
        brotli: true,
      },
    },
  ],
};
```

## Monitoring & Logging

### Application Monitoring

```typescript
// src/monitoring/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        new BrowserTracing({
          tracingOrigins: ['localhost', 'oseplatform.com', /^\//],
        }),
      ],
      tracesSampleRate: 0.1,
      beforeSend(event, hint) {
        // Filter sensitive data
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
        }
        return event;
      },
    });
  }
}

// Usage in App.tsx
import { initSentry } from './monitoring/sentry';

initSentry();

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorPage />}>
      <Routes />
    </Sentry.ErrorBoundary>
  );
}
```

### Analytics Integration

```typescript
// src/analytics/analytics.ts
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

class Analytics {
  private enabled: boolean;

  constructor() {
    this.enabled = import.meta.env.VITE_ENABLE_ANALYTICS === "true";
  }

  track(event: AnalyticsEvent): void {
    if (!this.enabled) return;

    // Google Analytics
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", event.name, event.properties);
    }

    // Custom analytics
    this.sendToBackend(event);
  }

  page(path: string): void {
    if (!this.enabled) return;

    if (typeof window.gtag !== "undefined") {
      window.gtag("config", "GA_MEASUREMENT_ID", {
        page_path: path,
      });
    }
  }

  private async sendToBackend(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error("Analytics error:", error);
    }
  }
}

export const analytics = new Analytics();

// Usage
analytics.track({
  name: "donation_completed",
  properties: {
    amount: 100,
    currency: "USD",
    campaign: "zakat-2024",
  },
});
```

### Performance Monitoring

```typescript
// src/monitoring/performance.ts
export function initPerformanceMonitoring() {
  if ("PerformanceObserver" in window) {
    // Monitor Long Tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn("Long task detected:", {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      }
    });

    try {
      longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      // Longtask not supported
    }

    // Monitor Layout Shifts
    const clsObserver = new PerformanceObserver((list) => {
      let clsScore = 0;

      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsScore += (entry as any).value;
        }
      }

      if (clsScore > 0.1) {
        console.warn("High CLS detected:", clsScore);
      }
    });

    try {
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      // Layout shift not supported
    }

    // Web Vitals
    if ("web-vital" in window) {
      import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      });
    }
  }
}
```

## Health Checks

### Health Endpoint

```typescript
// src/health/health.ts
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  checks: {
    api: boolean;
    database: boolean;
    cache: boolean;
  };
}

export async function performHealthCheck(): Promise<HealthCheck> {
  const checks = {
    api: await checkApi(),
    database: await checkDatabase(),
    cache: await checkCache(),
  };

  const allHealthy = Object.values(checks).every((check) => check === true);
  const someHealthy = Object.values(checks).some((check) => check === true);

  return {
    status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    checks,
  };
}

async function checkApi(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkDatabase(): Promise<boolean> {
  try {
    const response = await fetch('/api/health/db', { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkCache(): Promise<boolean> {
  try {
    const response = await fetch('/api/health/cache', { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

// Health check component
export const HealthCheck: React.FC = () => {
  const [health, setHealth] = useState<HealthCheck | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const result = await performHealthCheck();
      setHealth(result);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  if (!health) return null;

  return (
    <div className={`health-status ${health.status}`}>
      <span>Status: {health.status}</span>
      <span>Version: {health.version}</span>
    </div>
  );
};
```

## OSE Platform Deployment Examples

### Zakat Service Deployment

```yaml
# k8s/zakat-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zakat-calculator
  namespace: ose-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zakat-calculator
  template:
    metadata:
      labels:
        app: zakat-calculator
    spec:
      containers:
        - name: calculator
          image: ose-zakat-calculator:latest
          ports:
            - containerPort: 3000
          env:
            - name: VITE_API_URL
              value: "https://api.oseplatform.com/zakat"
            - name: VITE_NISAB_API
              value: "https://api.goldprice.org"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"

---
apiVersion: v1
kind: Service
metadata:
  name: zakat-calculator
  namespace: ose-platform
spec:
  type: ClusterIP
  selector:
    app: zakat-calculator
  ports:
    - port: 3000
      targetPort: 3000
```

### Murabaha Application Deployment

```typescript
// deploy/murabaha/config.ts
export const murabahaConfig = {
  environment: "production",
  apiUrl: "https://api.oseplatform.com/murabaha",
  features: {
    creditCheck: true,
    instantApproval: false,
    documentUpload: true,
  },
  limits: {
    minAmount: 1000,
    maxAmount: 1000000,
    minMonths: 6,
    maxMonths: 60,
  },
  security: {
    encryptionEnabled: true,
    auditLogging: true,
    twoFactorAuth: true,
  },
};
```

## Security Hardening

### Content Security Policy

```typescript
// src/security/csp.ts
export const csp = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "https://cdn.oseplatform.com"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "img-src": ["'self'", "data:", "https:"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": ["'self'", "https://api.oseplatform.com", "wss://api.oseplatform.com"],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
};

// Apply in index.html
/*
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.oseplatform.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.oseplatform.com wss://api.oseplatform.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
*/
```

### Security Headers

```nginx
# nginx-security.conf
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Linter checks passing
- [ ] Bundle size analyzed
- [ ] Security scan completed
- [ ] Dependencies up to date
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] Error tracking configured
- [ ] Analytics configured

### Build Configuration

- [ ] Production build successful
- [ ] Source maps generated
- [ ] Assets optimized (images, fonts)
- [ ] Code splitting configured
- [ ] Lazy loading implemented
- [ ] Tree shaking enabled
- [ ] Minification enabled
- [ ] Compression enabled (gzip/brotli)

### Deployment

- [ ] SSL certificate configured
- [ ] DNS records updated
- [ ] CDN configured
- [ ] Cache headers set
- [ ] Security headers configured
- [ ] CSP policy configured
- [ ] Health checks working
- [ ] Monitoring active
- [ ] Logging configured
- [ ] Backup strategy in place

### Post-Deployment

- [ ] Smoke tests completed
- [ ] Performance metrics checked
- [ ] Error rates monitored
- [ ] User feedback collected
- [ ] Rollback plan ready
- [ ] Documentation updated
- [ ] Team notified

## Performance Optimization

### Code Splitting

```typescript
// Route-based code splitting
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ZakatCalculator = lazy(() => import('./pages/ZakatCalculator'));
const MurabahaApplication = lazy(() => import('./pages/MurabahaApplication'));

export const App: React.FC = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/zakat" element={<ZakatCalculator />} />
      <Route path="/murabaha" element={<MurabahaApplication />} />
    </Routes>
  </Suspense>
);
```

### Asset Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split(".").at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "img";
          } else if (/woff|woff2|ttf|eot/.test(extType)) {
            extType = "fonts";
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
      },
    },
  },
});
```

## Related Documentation

- **[Best Practices](best-practices.md)** - Production standards
- **[Performance](performance.md)** - Build optimization
- **[Security](security.md)** - Security configuration
- **[Testing](testing.md)** - CI/CD testing
