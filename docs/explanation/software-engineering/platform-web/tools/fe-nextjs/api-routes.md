---
title: "Next.js API Routes"
description: Comprehensive guide to Next.js API routes including route handlers, HTTP methods, request/response handling, authentication, and REST API design
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - api-routes
  - route-handlers
  - rest-api
  - backend
  - http
related:
  - ./middleware.md
  - ./data-fetching.md
  - ./security.md
principles:
  - explicit-over-implicit
  - pure-functions
  - automation-over-manual
created: 2026-01-26
---

# Next.js API Routes

## Quick Reference

**Route Handlers**:

- [HTTP Methods](#http-methods) - GET, POST, PUT, DELETE, PATCH
- [Request Handling](#request-handling) - Headers, body, params
- [Response Types](#response-types) - JSON, streaming, redirects
- [Error Handling](#error-handling) - Status codes, error responses
- [Authentication](#authentication) - JWT, sessions, middleware

**Advanced**:

- [CORS Configuration](#cors-configuration) - Cross-origin requests
- [Rate Limiting](#rate-limiting) - Throttling and protection
- [Webhooks](#webhooks) - Third-party integrations
- [File Uploads](#file-uploads) - Multipart form data
- [API Versioning](#api-versioning) - Version management

## Overview

**Route Handlers** (API Routes) in Next.js App Router allow you to create custom request handlers using Web Request and Response APIs. They replace the older API Routes from Pages Router with a more powerful, standard-compliant approach.

**Key Features**:

- **Web Standards** - Built on Request and Response APIs
- **Server-only** - Never exposed to client
- **Edge or Node.js** - Runtime flexibility
- **Streaming** - Support for large responses
- **Type-safe** - Full TypeScript support

This guide covers Next.js 16+ Route Handlers for enterprise applications.

## HTTP Methods

### Basic Route Handler

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
```

### All HTTP Methods

```typescript
// app/api/users/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET(request: Request) {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const data = await request.json();
  const user = await db.user.create({ data });
  return NextResponse.json(user, { status: 201 });
}

export async function PUT(request: Request) {
  const data = await request.json();
  const user = await db.user.update({
    where: { id: data.id },
    data,
  });
  return NextResponse.json(user);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  await db.user.delete({ where: { id } });
  return NextResponse.json({ message: "User deleted" });
}

export async function PATCH(request: Request) {
  const data = await request.json();
  const user = await db.user.update({
    where: { id: data.id },
    data,
  });
  return NextResponse.json(user);
}
```

### OSE Platform: Zakat API

```typescript
// app/api/zakat/calculations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { z } from "zod";

const zakatCalculationSchema = z.object({
  wealth: z.number().positive(),
  nisab: z.number().positive(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch calculations
    const calculations = await db.zakatCalculation.findMany({
      where: { userId: session.user.id },
      orderBy: { calculatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await db.zakatCalculation.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      data: calculations,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error("GET /api/zakat/calculations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
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

    const { wealth, nisab, notes } = validation.data;

    // Business logic
    const eligible = wealth >= nisab;
    const zakatAmount = eligible ? wealth * 0.025 : 0;

    // Save to database
    const calculation = await db.zakatCalculation.create({
      data: {
        userId: session.user.id,
        wealth,
        nisab,
        zakatAmount,
        eligible,
        notes,
        calculatedAt: new Date(),
      },
    });

    return NextResponse.json(calculation, { status: 201 });
  } catch (error) {
    console.error("POST /api/zakat/calculations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Request Handling

### Reading Request Data

```typescript
// app/api/example/route.ts
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // 1. URL and query parameters
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // 2. Headers
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");

  // 3. Cookies
  const token = request.cookies.get("auth-token");

  // 4. JSON body
  const body = await request.json();

  // 5. FormData body
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // 6. Text body
  const text = await request.text();

  // 7. ArrayBuffer body
  const buffer = await request.arrayBuffer();

  return Response.json({ received: true });
}
```

### Dynamic Route Parameters

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await db.user.findUnique({
    where: { id: params.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const data = await request.json();

  const user = await db.user.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(user);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await db.user.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: "User deleted" });
}
```

### OSE Platform: Murabaha Application API

```typescript
// app/api/murabaha/applications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const application = await db.murabahaApplication.findUnique({
      where: {
        id: params.id,
        userId: session.user.id, // Security: only show user's own applications
      },
      include: {
        vendor: true,
        installments: {
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("GET /api/murabaha/applications/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate ownership
    const existing = await db.murabahaApplication.findUnique({
      where: { id: params.id },
      select: { userId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow updates to pending applications
    if (existing.status !== "pending") {
      return NextResponse.json({ error: "Cannot update non-pending application" }, { status: 400 });
    }

    // Update application
    const updated = await db.murabahaApplication.update({
      where: { id: params.id },
      data: {
        itemDescription: data.itemDescription,
        requestedAmount: data.requestedAmount,
        vendorId: data.vendorId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/murabaha/applications/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Response Types

### JSON Responses

```typescript
// Standard JSON response
return Response.json({ message: "Success" });

// With status code
return Response.json({ error: "Not found" }, { status: 404 });

// With headers
return Response.json(
  { data: "value" },
  {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  },
);

// NextResponse with cookies
const response = NextResponse.json({ message: "Success" });
response.cookies.set("session", "token", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7, // 1 week
});
return response;
```

### Streaming Responses

```typescript
// app/api/stream/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        const message = `Message ${i}\n`;
        controller.enqueue(encoder.encode(message));
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
```

### Redirects

```typescript
// app/api/redirect/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

// With status code
export async function POST(request: Request) {
  return NextResponse.redirect(new URL("/success", request.url), 303);
}
```

### File Downloads

```typescript
// app/api/download/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const fileBuffer = await generatePDF(); // Assume helper function

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="report.pdf"',
    },
  });
}
```

## Error Handling

### Centralized Error Handler

```typescript
// lib/api/errorHandler.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.errors,
      },
      { status: 400 },
    );
  }

  // Database errors
  if (error instanceof Error && error.message.includes("Unique constraint")) {
    return NextResponse.json({ error: "Resource already exists" }, { status: 409 });
  }

  // Default error
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

### Usage

```typescript
// app/api/users/route.ts
import { handleApiError } from "@/lib/api/errorHandler";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const user = await createUser(data);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### OSE Platform: Error Responses

```typescript
// app/api/waqf/donations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { z } from "zod";

const donationSchema = z.object({
  projectId: z.string().uuid(),
  amount: z.number().positive(),
  isAnonymous: z.boolean().default(false),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
    }

    const body = await request.json();
    const validation = donationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const { projectId, amount, isAnonymous, message } = validation.data;

    // Check if project exists and is active
    const project = await db.waqfProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found", code: "PROJECT_NOT_FOUND" }, { status: 404 });
    }

    if (!project.active) {
      return NextResponse.json(
        { error: "Project is not accepting donations", code: "PROJECT_INACTIVE" },
        { status: 400 },
      );
    }

    // Check if project goal is already met
    const totalDonations = await db.waqfDonation.aggregate({
      where: { projectId },
      _sum: { amount: true },
    });

    if (totalDonations._sum.amount >= project.fundingGoal) {
      return NextResponse.json({ error: "Project funding goal already met", code: "GOAL_MET" }, { status: 400 });
    }

    // Create donation
    const donation = await db.waqfDonation.create({
      data: {
        userId: session.user.id,
        projectId,
        amount,
        isAnonymous,
        message,
        donorName: isAnonymous ? null : session.user.name,
      },
    });

    return NextResponse.json(donation, { status: 201 });
  } catch (error) {
    console.error("POST /api/waqf/donations error:", error);

    if (error instanceof Error && error.message.includes("Insufficient funds")) {
      return NextResponse.json({ error: "Insufficient funds", code: "INSUFFICIENT_FUNDS" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
```

## Authentication

### JWT Authentication

```typescript
// lib/auth/jwt.ts
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function signToken(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
```

```typescript
// app/api/protected/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Protected data",
    userId: payload.sub,
  });
}
```

## CORS Configuration

### Enable CORS

```typescript
// app/api/public/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const data = { message: "Public API" };

  return NextResponse.json(data, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

## Rate Limiting

### Simple Rate Limiting

```typescript
// lib/api/rateLimiter.ts
const limitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = limitMap.get(ip);

  if (!record || now > record.resetAt) {
    limitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
```

```typescript
// app/api/limited/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/api/rateLimiter";

export async function GET(request: NextRequest) {
  const ip = request.ip || "unknown";

  if (!checkRateLimit(ip, 10, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  return NextResponse.json({ message: "Success" });
}
```

## Webhooks

### Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get("stripe-signature")!;

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Handle webhook event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        await handlePaymentFailure(failedPayment);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
```

## File Uploads

### Multipart Form Data

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "uploads");
    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

## API Versioning

### URL-Based Versioning

```
app/
└── api/
    ├── v1/
    │   └── users/
    │       └── route.ts
    └── v2/
        └── users/
            └── route.ts
```

```typescript
// app/api/v1/users/route.ts
export async function GET() {
  return Response.json({
    version: "v1",
    users: [],
  });
}

// app/api/v2/users/route.ts
export async function GET() {
  return Response.json({
    version: "v2",
    data: {
      users: [],
      pagination: {},
    },
  });
}
```

## Best Practices

### ✅ Do

- **Use TypeScript** for type safety
- **Validate input** with Zod or similar
- **Handle errors** gracefully
- **Return proper status codes**
- **Use authentication** for protected routes
- **Log errors** for debugging
- **Rate limit** public APIs
- **Document your API**

### ❌ Don't

- **Don't expose secrets** in responses
- **Don't skip input validation**
- **Don't return stack traces**
- **Don't use GET for mutations**
- **Don't skip authentication**
- **Don't ignore CORS** for public APIs
- **Don't log sensitive data**

## Related Documentation

**Core Next.js**:

- [Middleware](middleware.md) - Request modification
- [Data Fetching](data-fetching.md) - Calling APIs
- [Security](security.md) - API security

**Patterns**:

- [Best Practices](best-practices.md) - Production standards

---

**Next.js Version**: 14+ (Route Handlers stable)
