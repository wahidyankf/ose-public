---
title: Next.js Security
description: Comprehensive guide to securing Next.js applications with CSRF protection, XSS prevention, input validation, authentication, and OWASP Top 10 defenses
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - security
  - csrf
  - xss
  - authentication
  - authorization
  - owasp
  - input-validation
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
created: 2026-01-26
---

# Next.js Security

Security is critical for production applications. This guide covers comprehensive security practices for Next.js including CSRF protection, XSS prevention, input validation, authentication, authorization, and defenses against the OWASP Top 10 vulnerabilities.

## 📋 Quick Reference

- [CSRF Protection](#-csrf-protection) - Cross-Site Request Forgery prevention
- [XSS Prevention](#-xss-prevention) - Cross-Site Scripting defenses
- [Input Validation](#-input-validation) - Server-side validation with Zod
- [Authentication](#-authentication) - JWT and session-based auth
- [Authorization](#-authorization) - Role-based access control
- [SQL Injection Prevention](#-sql-injection-prevention) - Database security
- [Security Headers](#-security-headers) - HTTP security headers
- [Rate Limiting](#-rate-limiting) - API abuse prevention
- [Content Security Policy](#-content-security-policy) - CSP implementation
- [Secure File Uploads](#-secure-file-uploads) - File upload validation
- [API Security](#-api-security) - API route protection
- [Environment Variables](#-environment-variables) - Secrets management
- [OWASP Top 10](#-owasp-top-10) - Common vulnerability defenses
- [OSE Platform Examples](#-ose-platform-examples) - Islamic finance security patterns
- [Security Checklist](#-security-checklist) - Production deployment checklist
- [Related Documentation](#-related-documentation) - Cross-references

## 🛡️ CSRF Protection

**Cross-Site Request Forgery (CSRF)** attacks trick authenticated users into performing unwanted actions. Next.js provides built-in CSRF protection for Server Actions.

### Built-in CSRF Protection

Next.js automatically protects Server Actions with CSRF tokens:

```typescript
// actions/zakat.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Automatically protected with CSRF token
export async function calculateZakat(formData: FormData) {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Server Action is CSRF-protected by default
  const wealth = parseFloat(formData.get("wealth") as string);
  const nisab = parseFloat(formData.get("nisab") as string);

  // Calculate zakat...
}
```

### Custom CSRF Protection for API Routes

```typescript
// lib/csrf.ts
import { createHash, randomBytes } from "crypto";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashCsrfToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyCsrfToken(token: string, hashedToken: string): boolean {
  const hash = hashCsrfToken(token);
  return hash === hashedToken;
}
```

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { generateCsrfToken, hashCsrfToken } from "@/lib/csrf";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip CSRF for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return NextResponse.next();
  }

  // API routes require CSRF token
  if (pathname.startsWith("/api/")) {
    const csrfToken = request.headers.get("x-csrf-token");
    const csrfCookie = request.cookies.get("csrf-token")?.value;

    if (!csrfToken || !csrfCookie) {
      return NextResponse.json({ error: "CSRF token missing" }, { status: 403 });
    }

    const isValid = verifyCsrfToken(csrfToken, csrfCookie);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
```

```typescript
// app/api/csrf/route.ts
import { NextResponse } from "next/server";
import { generateCsrfToken, hashCsrfToken } from "@/lib/csrf";

export async function GET() {
  const token = generateCsrfToken();
  const hashedToken = hashCsrfToken(token);

  const response = NextResponse.json({ csrfToken: token });

  // Set hashed token in HTTP-only cookie
  response.cookies.set("csrf-token", hashedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600, // 1 hour
  });

  return response;
}
```

### Using CSRF Token in Client

```typescript
// hooks/useCsrfToken.ts
"use client";

import { useEffect, useState } from "react";

export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/csrf")
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken));
  }, []);

  return csrfToken;
}
```

```typescript
// components/ZakatForm.tsx
'use client';

import { useCsrfToken } from '@/hooks/useCsrfToken';

export function ZakatForm() {
  const csrfToken = useCsrfToken();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csrfToken) {
      alert('CSRF token not loaded');
      return;
    }

    const response = await fetch('/api/zakat/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ wealth: 10000, nisab: 5000 }),
    });

    const result = await response.json();
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={!csrfToken}>
        Calculate Zakat
      </button>
    </form>
  );
}
```

## 🔒 XSS Prevention

**Cross-Site Scripting (XSS)** allows attackers to inject malicious scripts. Next.js provides automatic XSS protection through React's escaping.

### React's Built-in XSS Protection

```typescript
// components/UserProfile.tsx
interface UserProfileProps {
  name: string;
  bio: string;
}

export function UserProfile({ name, bio }: UserProfileProps) {
  // React automatically escapes these values
  return (
    <div>
      <h2>{name}</h2>
      <p>{bio}</p>
    </div>
  );
}

// If user enters: <script>alert('XSS')</script>
// React renders it as text, not executed JavaScript
```

### Avoiding dangerouslySetInnerHTML

```typescript
// BAD - Vulnerable to XSS
export function UnsafeComponent({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// GOOD - Use markdown library with sanitization
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export function SafeMarkdown({ markdown }: { markdown: string }) {
  const html = marked(markdown);
  const sanitized = DOMPurify.sanitize(html);

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### HTML Sanitization Library

```bash
npm install isomorphic-dompurify
```

```typescript
// lib/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href", "title", "target"],
  });
}

// Usage
const userInput = '<script>alert("XSS")</script><p>Safe content</p>';
const safe = sanitizeHtml(userInput);
// Result: '<p>Safe content</p>'
```

### Content Security Policy for XSS

```typescript
// middleware.ts
import { NextResponse } from "next/server";

export function middleware() {
  const response = NextResponse.next();

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Restrict in production
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );

  return response;
}
```

## ✅ Input Validation

**Server-side validation** is critical - never trust client input.

### Validation with Zod

```bash
npm install zod
```

```typescript
// lib/validations/zakat.ts
import { z } from "zod";

export const zakatCalculationSchema = z.object({
  wealth: z.number().positive("Wealth must be positive").max(1_000_000_000, "Wealth exceeds maximum"),
  nisab: z.number().positive("Nisab must be positive").max(1_000_000, "Nisab exceeds maximum"),
  userId: z.string().uuid("Invalid user ID"),
});

export type ZakatCalculationInput = z.infer<typeof zakatCalculationSchema>;
```

```typescript
// app/api/zakat/calculate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { zakatCalculationSchema } from "@/lib/validations/zakat";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    // Validate input
    const validation = zakatCalculationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    // data is now type-safe and validated
    const zakatAmount = data.wealth >= data.nisab ? data.wealth * 0.025 : 0;

    return NextResponse.json({ zakatAmount }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Server Action Validation

```typescript
// actions/murabaha.ts
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const murabahaApplicationSchema = z.object({
  productName: z.string().min(3).max(100),
  purchasePrice: z.number().positive().max(10_000_000),
  preferredTerm: z.number().int().min(6).max(60),
});

export async function submitMurabahaApplication(formData: FormData) {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Parse form data
  const rawData = {
    productName: formData.get("productName"),
    purchasePrice: parseFloat(formData.get("purchasePrice") as string),
    preferredTerm: parseInt(formData.get("preferredTerm") as string, 10),
  };

  // Validate
  const validation = murabahaApplicationSchema.safeParse(rawData);

  if (!validation.success) {
    throw new Error(validation.error.errors[0]?.message ?? "Validation failed");
  }

  const data = validation.data;

  // Create application
  const application = await db.murabahaApplication.create({
    data: {
      userId: session.user.id,
      ...data,
      status: "PENDING",
    },
  });

  return { success: true, applicationId: application.id };
}
```

### File Upload Validation

```typescript
// lib/validations/file.ts
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "File size must be less than 5MB")
    .refine((file) => ALLOWED_TYPES.includes(file.type), "File type must be JPEG, PNG, WebP, or PDF"),
});
```

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fileUploadSchema } from "@/lib/validations/file";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const validation = fileUploadSchema.safeParse({ file });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "File validation failed",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    // Process file...
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file securely...

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

## 🔐 Authentication

Secure authentication patterns for Next.js.

### JWT Authentication

```bash
npm install jose
```

```typescript
// lib/auth/jwt.ts
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify<JWTPayload>(token, JWT_SECRET);
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
```

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword } from "@/lib/crypto";
import { createToken } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Find user
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create JWT
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set HTTP-only cookie
    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
```

### Password Hashing

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

```typescript
// lib/crypto.ts
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Session-Based Authentication

```typescript
// lib/auth/session.ts
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const sessionId = cookieStore.get("session-id")?.value;

  if (!sessionId) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  };
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}
```

## 🛂 Authorization

Role-based access control (RBAC) patterns.

### RBAC Middleware

```typescript
// lib/auth/rbac.ts
import { Session } from "./session";

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}

export enum Permission {
  CREATE_ZAKAT = "CREATE_ZAKAT",
  READ_ZAKAT = "READ_ZAKAT",
  UPDATE_ZAKAT = "UPDATE_ZAKAT",
  DELETE_ZAKAT = "DELETE_ZAKAT",
  MANAGE_USERS = "MANAGE_USERS",
  VIEW_REPORTS = "VIEW_REPORTS",
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.CREATE_ZAKAT,
    Permission.READ_ZAKAT,
    Permission.UPDATE_ZAKAT,
    Permission.DELETE_ZAKAT,
    Permission.MANAGE_USERS,
    Permission.VIEW_REPORTS,
  ],
  [Role.USER]: [Permission.CREATE_ZAKAT, Permission.READ_ZAKAT, Permission.UPDATE_ZAKAT, Permission.DELETE_ZAKAT],
  [Role.GUEST]: [Permission.READ_ZAKAT],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function requirePermission(session: Session | null, permission: Permission) {
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userRole = session.user.role as Role;

  if (!hasPermission(userRole, permission)) {
    throw new Error("Forbidden: insufficient permissions");
  }
}
```

```typescript
// app/api/zakat/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requirePermission, Permission } from "@/lib/auth/rbac";
import { db } from "@/lib/db";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();

    // Check permission
    requirePermission(session, Permission.DELETE_ZAKAT);

    // Verify ownership
    const calculation = await db.zakatCalculation.findUnique({
      where: { id: params.id },
    });

    if (!calculation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (calculation.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete
    await db.zakatCalculation.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

## 💉 SQL Injection Prevention

Prevent SQL injection with parameterized queries and ORMs.

### Using Prisma ORM (Safe)

```typescript
// SAFE - Prisma automatically uses parameterized queries
const user = await db.user.findUnique({
  where: { email: userInput }, // Automatically escaped
});

const zakatCalculations = await db.zakatCalculation.findMany({
  where: {
    userId: session.user.id,
    amount: { gte: minAmount }, // Safe parameterization
  },
});
```

### Raw Queries with Parameters

```typescript
// SAFE - Using parameterized queries
import { db } from "@/lib/db";

const results = await db.$queryRaw`
  SELECT * FROM zakat_calculations
  WHERE user_id = ${userId}
  AND amount >= ${minAmount}
`;
```

### Avoid String Concatenation

```typescript
// DANGEROUS - SQL Injection vulnerability
const query = `SELECT * FROM users WHERE email = '${userInput}'`;

// If userInput = "' OR '1'='1" - bypasses authentication!

// SAFE - Use Prisma or parameterized queries
const user = await db.user.findUnique({
  where: { email: userInput },
});
```

## 🔒 Security Headers

Configure security headers in middleware or next.config.ts.

### Security Headers in Middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";

export function middleware() {
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS filter
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Enforce HTTPS
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  return response;
}
```

### Security Headers in next.config.ts

```typescript
// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
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
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default config;
```

## ⏱️ Rate Limiting

Prevent API abuse with rate limiting.

### Simple In-Memory Rate Limiter

```typescript
// lib/rate-limit.ts
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
  interval: number; // milliseconds
  maxRequests: number;
}

export function rateLimit(identifier: string, config: RateLimitConfig): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = store[identifier];

  if (!record || record.resetTime < now) {
    // Reset window
    store[identifier] = {
      count: 1,
      resetTime: now + config.interval,
    };

    return { success: true, remaining: config.maxRequests - 1 };
  }

  if (record.count >= config.maxRequests) {
    return { success: false, remaining: 0 };
  }

  record.count++;

  return { success: true, remaining: config.maxRequests - record.count };
}
```

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  const ip = request.ip || "unknown";

  // Rate limit: 100 requests per minute
  const result = rateLimit(ip, {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "Retry-After": "60",
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", "100");
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));

  return response;
}
```

### Redis Rate Limiter

```bash
npm install ioredis
```

```typescript
// lib/rate-limit-redis.ts
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export async function rateLimitRedis(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<{ success: boolean; remaining: number }> {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  if (current > maxRequests) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: maxRequests - current };
}
```

## 🔐 Content Security Policy

Strict CSP implementation for XSS prevention.

### CSP Configuration

```typescript
// lib/csp.ts
export function generateCsp() {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: https:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ];

  return { csp: csp.join("; "), nonce };
}
```

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import { generateCsp } from "@/lib/csp";

export function middleware() {
  const { csp, nonce } = generateCsp();

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-CSP-Nonce", nonce);

  return response;
}
```

## 📁 Secure File Uploads

Validate and sanitize file uploads.

### File Type Validation

```typescript
// lib/file-validation.ts
import { createReadStream } from "fs";
import { FileTypeResult, fileTypeFromStream } from "file-type";

export async function validateFileType(file: File, allowedTypes: string[]): Promise<boolean> {
  // Check MIME type from file object
  if (!allowedTypes.includes(file.type)) {
    return false;
  }

  // Verify actual file content (magic numbers)
  const buffer = await file.arrayBuffer();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    },
  });

  const fileType = await fileTypeFromStream(stream as any);

  if (!fileType || !allowedTypes.includes(fileType.mime)) {
    return false;
  }

  return true;
}
```

```typescript
// app/api/upload/document/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateFileType } from "@/lib/file-validation";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // Size check
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Type validation
    const isValid = await validateFileType(file, ALLOWED_TYPES);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Generate safe filename
    const ext = path.extname(file.name);
    const safeFilename = `${randomUUID()}${ext}`;

    // Save file outside public directory
    const uploadDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, safeFilename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    return NextResponse.json({ filename: safeFilename }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

## 🔐 API Security

Secure API routes with authentication and authorization.

### API Route Protection

```typescript
// lib/api/protect.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

export async function protectApiRoute(request: NextRequest, requiredRole?: string) {
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (requiredRole && payload.role !== requiredRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return payload;
}
```

```typescript
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/api/protect";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Require admin role
  const auth = await protectApiRoute(request, "ADMIN");

  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  // Admin-only action
  const users = await db.user.findMany();

  return NextResponse.json(users, { status: 200 });
}
```

## 🔑 Environment Variables

Secure secrets management.

### Environment Variable Validation

```typescript
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_API_URL: z.string().url(),
  REDIS_URL: z.string().optional(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string().email(),
  SMTP_PASSWORD: z.string().min(1),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }

  return parsed.data;
}

export const env = validateEnv();
```

### .env.example Template

```bash
# .env.example - Template for environment variables

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Authentication
JWT_SECRET="your-32-character-or-longer-secret-key-here"

# API
NEXT_PUBLIC_API_URL="https://api.example.com"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="user@example.com"
SMTP_PASSWORD="your-smtp-password"
```

## 🛡️ OWASP Top 10

Defenses against OWASP Top 10 vulnerabilities.

### A01:2021 - Broken Access Control

```typescript
// DEFENSE: Always verify ownership and permissions

// BAD - No access control check
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await db.zakatCalculation.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

// GOOD - Verify ownership
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth();

  const calculation = await db.zakatCalculation.findUnique({
    where: { id: params.id },
  });

  if (!calculation || calculation.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.zakatCalculation.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
```

### A02:2021 - Cryptographic Failures

```typescript
// DEFENSE: Use bcrypt for passwords, HTTPS for transport

import bcrypt from "bcrypt";

// Hash passwords with sufficient cost factor
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Recommended: 10-12
  return bcrypt.hash(password, saltRounds);
}

// Always compare hashed passwords
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Enforce HTTPS in production
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && request.headers.get("x-forwarded-proto") !== "https") {
    return NextResponse.redirect(`https://${request.headers.get("host")}${request.nextUrl.pathname}`, { status: 308 });
  }

  return NextResponse.next();
}
```

### A03:2021 - Injection

```typescript
// DEFENSE: Use ORMs, validate input, parameterized queries

import { z } from "zod";

// Input validation with Zod
const searchSchema = z.object({
  query: z
    .string()
    .max(100)
    .regex(/^[a-zA-Z0-9\s]+$/),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  // Validate input
  const validation = searchSchema.safeParse({ query });

  if (!validation.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  // Use Prisma ORM (automatically prevents SQL injection)
  const results = await db.zakatCalculation.findMany({
    where: {
      notes: {
        contains: validation.data.query,
      },
    },
  });

  return NextResponse.json(results);
}
```

### A04:2021 - Insecure Design

```typescript
// DEFENSE: Implement security by design

// Secure password reset flow
export async function requestPasswordReset(email: string) {
  const user = await db.user.findUnique({ where: { email } });

  // Don't reveal if email exists (timing attack prevention)
  if (!user) {
    // Still wait same amount of time
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { success: true };
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Store hashed token with expiration
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    },
  });

  // Send email with token
  await sendEmail(user.email, `Reset link: /reset-password?token=${token}`);

  return { success: true };
}
```

### A05:2021 - Security Misconfiguration

```typescript
// DEFENSE: Secure defaults, minimize attack surface

// next.config.ts - Secure configuration
const config: NextConfig = {
  // Disable X-Powered-By header
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  // Disable directory listing
  trailingSlash: false,
};
```

### A06:2021 - Vulnerable Components

```bash
# Regular security audits
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated dependencies
npm outdated

# Use Dependabot or Renovate for automated updates
```

### A07:2021 - Identification and Authentication Failures

```typescript
// DEFENSE: Strong authentication, session management

// Enforce strong passwords
const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/[0-9]/, "Password must contain number")
  .regex(/[^A-Za-z0-9]/, "Password must contain special character");

// Implement account lockout after failed attempts
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function checkLoginAttempts(userId: string): Promise<boolean> {
  const attempts = await db.loginAttempt.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - LOCKOUT_DURATION),
      },
    },
  });

  return attempts < MAX_LOGIN_ATTEMPTS;
}
```

### A08:2021 - Software and Data Integrity Failures

```typescript
// DEFENSE: Verify integrity, use SRI, code signing

// Verify package integrity with lock files
// package-lock.json ensures same versions

// Subresource Integrity for CDN resources
export default function Page() {
  return (
    <html>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.example.com/styles.css"
          integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux"
          crossOrigin="anonymous"
        />
      </head>
      <body>Content</body>
    </html>
  );
}
```

### A09:2021 - Security Logging and Monitoring

```typescript
// lib/logger.ts
import { db } from "./db";

export async function logSecurityEvent(event: {
  type: "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "ACCESS_DENIED" | "DATA_BREACH";
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: string;
}) {
  await db.securityLog.create({
    data: {
      ...event,
      timestamp: new Date(),
    },
  });

  // Alert on critical events
  if (event.type === "DATA_BREACH") {
    await sendSecurityAlert(event);
  }
}

// Usage in API route
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const user = await authenticateUser(email, password);

    if (!user) {
      await logSecurityEvent({
        type: "LOGIN_FAILURE",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Failed login attempt for ${email}`,
      });

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await logSecurityEvent({
      type: "LOGIN_SUCCESS",
      userId: user.id,
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      details: "Successful login",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

### A10:2021 - Server-Side Request Forgery (SSRF)

```typescript
// DEFENSE: Whitelist allowed hosts, validate URLs

const ALLOWED_HOSTS = ["api.example.com", "cdn.example.com"];

export async function fetchExternalResource(url: string) {
  // Parse URL
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  // Check protocol (only HTTPS)
  if (parsedUrl.protocol !== "https:") {
    throw new Error("Only HTTPS allowed");
  }

  // Check host whitelist
  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    throw new Error("Host not allowed");
  }

  // Prevent access to private IPs
  if (isPrivateIP(parsedUrl.hostname)) {
    throw new Error("Private IPs not allowed");
  }

  // Make request
  const response = await fetch(parsedUrl.toString());

  return response;
}

function isPrivateIP(hostname: string): boolean {
  const privateRanges = [/^localhost$/, /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./];

  return privateRanges.some((range) => range.test(hostname));
}
```

## 🕌 OSE Platform Examples

Real-world security patterns for Islamic finance features.

### Secure Zakat Calculation with Audit Trail

```typescript
// actions/zakat-secure.ts
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/logger";

const zakatSchema = z.object({
  wealth: z.number().positive().max(1_000_000_000),
  nisab: z.number().positive().max(1_000_000),
});

export async function calculateZakatSecure(formData: FormData) {
  try {
    const session = await requireAuth();

    // Parse and validate input
    const rawData = {
      wealth: parseFloat(formData.get("wealth") as string),
      nisab: parseFloat(formData.get("nisab") as string),
    };

    const validation = zakatSchema.safeParse(rawData);

    if (!validation.success) {
      await logSecurityEvent({
        type: "ACCESS_DENIED",
        userId: session.user.id,
        ipAddress: "server",
        userAgent: "server",
        details: `Invalid zakat input: ${JSON.stringify(validation.error.errors)}`,
      });

      throw new Error("Invalid input");
    }

    const { wealth, nisab } = validation.data;

    // Calculate zakat
    const zakatRate = 0.025;
    const eligibleForZakat = wealth >= nisab;
    const zakatAmount = eligibleForZakat ? wealth * zakatRate : 0;

    // Store calculation with audit trail
    const calculation = await db.zakatCalculation.create({
      data: {
        userId: session.user.id,
        wealth,
        nisab,
        zakatAmount,
        eligibleForZakat,
        calculatedAt: new Date(),
      },
    });

    // Log successful calculation
    await logSecurityEvent({
      type: "LOGIN_SUCCESS",
      userId: session.user.id,
      ipAddress: "server",
      userAgent: "server",
      details: `Zakat calculated: ${calculation.id}`,
    });

    return {
      success: true,
      calculationId: calculation.id,
      zakatAmount,
    };
  } catch (error) {
    console.error("Zakat calculation error:", error);
    throw error;
  }
}
```

### Secure Murabaha Application with PII Protection

```typescript
// lib/encryption.ts
import crypto from "crypto";

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(":");
  const iv = Buffer.from(parts[0]!, "hex");
  const encrypted = parts[1]!;

  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

```typescript
// actions/murabaha-secure.ts
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { encrypt } from "@/lib/encryption";

const murabahaSchema = z.object({
  productName: z.string().min(3).max(100),
  purchasePrice: z.number().positive().max(10_000_000),
  preferredTerm: z.number().int().min(6).max(60),
  // PII fields
  nationalId: z.string().regex(/^\d{10}$/),
  phoneNumber: z.string().regex(/^\+?[\d\s-()]+$/),
});

export async function submitMurabahaSecure(formData: FormData) {
  const session = await requireAuth();

  // Parse and validate
  const rawData = {
    productName: formData.get("productName") as string,
    purchasePrice: parseFloat(formData.get("purchasePrice") as string),
    preferredTerm: parseInt(formData.get("preferredTerm") as string, 10),
    nationalId: formData.get("nationalId") as string,
    phoneNumber: formData.get("phoneNumber") as string,
  };

  const validation = murabahaSchema.safeParse(rawData);

  if (!validation.success) {
    throw new Error("Validation failed");
  }

  const data = validation.data;

  // Encrypt PII
  const encryptedNationalId = encrypt(data.nationalId);
  const encryptedPhoneNumber = encrypt(data.phoneNumber);

  // Store application with encrypted PII
  const application = await db.murabahaApplication.create({
    data: {
      userId: session.user.id,
      productName: data.productName,
      purchasePrice: data.purchasePrice,
      preferredTerm: data.preferredTerm,
      nationalId: encryptedNationalId,
      phoneNumber: encryptedPhoneNumber,
      status: "PENDING",
    },
  });

  return { success: true, applicationId: application.id };
}
```

## ✅ Security Checklist

Production deployment security checklist:

- [ ] **HTTPS Enabled**: All traffic over HTTPS with valid SSL certificate
- [ ] **Environment Variables**: All secrets in environment variables, not committed to Git
- [ ] **Input Validation**: Server-side validation with Zod on all user inputs
- [ ] **CSRF Protection**: Enabled for all state-changing operations
- [ ] **XSS Prevention**: No `dangerouslySetInnerHTML` without sanitization
- [ ] **SQL Injection**: Using ORM (Prisma) or parameterized queries
- [ ] **Authentication**: Secure JWT or session-based authentication
- [ ] **Authorization**: RBAC implemented for protected resources
- [ ] **Password Hashing**: bcrypt with salt rounds ≥ 12
- [ ] **Rate Limiting**: API rate limiting implemented
- [ ] **Security Headers**: All security headers configured
- [ ] **CSP**: Content Security Policy configured
- [ ] **Logging**: Security events logged with audit trail
- [ ] **Dependencies**: Regular `npm audit` and updates
- [ ] **File Uploads**: Type and size validation, magic number checks
- [ ] **Error Handling**: No sensitive data in error messages
- [ ] **CORS**: Configured with specific origins (not `*`)
- [ ] **Session Management**: Secure session cookies (httpOnly, secure, sameSite)
- [ ] **Data Encryption**: PII encrypted at rest
- [ ] **Backup Strategy**: Regular encrypted backups
- [ ] **Monitoring**: Security monitoring and alerting

## 🔗 Related Documentation

- [Next.js README](./README.md) - Next.js overview and getting started
- [Next.js API Routes](api-routes.md) - API security patterns
- [Next.js Middleware](middleware.md) - Authentication middleware
- [Next.js Configuration](configuration.md) - Security headers setup
- [Next.js TypeScript](typescript.md) - Type-safe security

---

**Next Steps:**

- Review [Next.js API Routes](api-routes.md) for secure API patterns
- Explore [Next.js Middleware](middleware.md) for authentication
- Check [Next.js Testing](testing.md) for security tests
- Read [Next.js Deployment](deployment.md) for production security
