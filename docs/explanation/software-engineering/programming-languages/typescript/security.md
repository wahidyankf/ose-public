---
title: TypeScript Security
description: Defense-in-depth security for TypeScript applications including input validation, authentication, authorization, secure communication, and data protection for financial applications
category: explanation
subcategory: prog-lang
tags:
  - typescript
  - security
  - input-validation
  - authentication
  - authorization
  - xss-prevention
  - sql-injection-prevention
  - csrf-protection
  - jwt
  - oauth2
  - data-encryption
related:
  - ./web-services.md
  - ./best-practices.md
  - ./type-safety.md
principles:
  - explicit-over-implicit
---

# Security

Security in TypeScript applications requires defense-in-depth: **input validation**, **authentication**, **authorization**, **secure communication**, and **data protection**. This is especially critical for financial applications handling sensitive donation and payment data.

**Quick Reference**:

- [Input Validation](#input-validation)
  - [Zod Schema Validation](#zod-schema-validation)
  - [Class Validator](#class-validator)
  - [Type Guards](#type-guards)
- [XSS Prevention](#xss-prevention)
  - [React Automatic Escaping](#react-automatic-escaping)
  - [DOMPurify Sanitization](#dompurify-sanitization)
  - [Content Security Policy](#content-security-policy)
- [SQL Injection Prevention](#sql-injection-prevention)
  - [Parameterized Queries](#parameterized-queries)
  - [TypeORM Safety](#typeorm-safety)
  - [Prisma Safety](#prisma-safety)
- [Authentication](#authentication)
  - [Password Hashing](#password-hashing)
  - [JWT Authentication](#jwt-authentication)
  - [Session Management](#session-management)
  - [OAuth2 Integration](#oauth2-integration)
- [Authorization](#authorization)
  - [Role-Based Access Control](#role-based-access-control)
  - [Policy-Based Authorization](#policy-based-authorization)
  - [NestJS Guards](#nestjs-guards)
- [CSRF Protection](#csrf-protection)
- [Secure Communication](#secure-communication)
  - [HTTPS/TLS](#httpstls)
  - [Certificate Validation](#certificate-validation)
- [Secret Management](#secret-management)
  - [Environment Variables](#environment-variables)
  - [Validated Configuration](#validated-configuration)
- [Security Headers](#security-headers)
- [Rate Limiting](#rate-limiting)
- [Audit Logging](#audit-logging)
- [Dependency Security](#dependency-security)
- [Financial Domain Examples](#financial-domain-examples)
- [Security Best Practices](#security-best-practices)
- [Security Anti-patterns](#security-anti-patterns)
- [Security Testing](#security-testing)
- [Related Topics](#related-topics)
- [Sources](#sources)

## Input Validation

### Zod Schema Validation

Use Zod for runtime validation with TypeScript inference:

```typescript
import { z } from "zod";

// Define validation schema
const DonationSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(1_000_000_000, "Amount exceeds maximum allowed"),
  currency: z.enum(["IDR", "USD", "EUR"], {
    errorMap: () => ({ message: "Currency must be IDR, USD, or EUR" }),
  }),
  donorEmail: z.string().email("Invalid email address").max(160),
  donorName: z.string().min(2).max(100),
  paymentMethod: z.enum(["credit_card", "bank_transfer", "ewallet"]).optional(),
  notes: z.string().max(500).optional(),
});

// Infer TypeScript type from schema
type Donation = z.infer<typeof DonationSchema>;

// Validate input
function createDonation(input: unknown): Donation {
  // Throws ZodError if validation fails
  return DonationSchema.parse(input);
}

// Safe parsing with error handling
function createDonationSafe(input: unknown): { success: true; data: Donation } | { success: false; errors: string[] } {
  const result = DonationSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
  }
}

// Usage in API endpoint
import { Request, Response } from "express";

async function handleDonationCreate(req: Request, res: Response) {
  const result = createDonationSafe(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.errors,
    });
  }

  // Safe to use validated data
  const donation = result.data;

  try {
    const created = await donationRepository.save(donation);
    return res.status(201).json({ donation: created });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create donation" });
  }
}
```

The following diagram illustrates the defense-in-depth approach to input validation in TypeScript financial applications:

```mermaid
graph LR
    CLIENT[Client Request]:::blue
    L1["Layer 1: Controller<br/>Structure check + Sanitize"]:::teal
    L2["Layer 2: Schema Validation<br/>Zod + Business Rules"]:::purple
    L3["Layer 3: Database<br/>Check Constraints"]:::brown
    SUCCESS["✅ Success<br/>Donation created"]:::teal
    REJECT["❌ Reject<br/>400 / Constraint violation"]:::orange

    CLIENT --> L1
    L1 -->|Invalid| REJECT
    L1 -->|Valid| L2
    L2 -->|Invalid| REJECT
    L2 -->|Valid| L3
    L3 -->|Violation| REJECT
    L3 -->|Pass| SUCCESS

    classDef blue fill:#0173B2,stroke:#023B5A,color:#FFF
    classDef teal fill:#029E73,stroke:#01593F,color:#FFF
    classDef purple fill:#CC78BC,stroke:#7A4871,color:#FFF
    classDef brown fill:#CA9161,stroke:#7A5739,color:#FFF
    classDef orange fill:#DE8F05,stroke:#8A5903,color:#FFF
```

**Defense-in-Depth Layers**:

1. **Controller Layer** (green): Extract parameters, basic structure validation
2. **Schema Layer** (purple): Zod runtime validation, type coercion, business rules
3. **Database Layer** (brown): Constraints as final safety net

This multi-layer approach ensures malicious or invalid input is caught at the earliest possible stage.

### Class Validator

Use class-validator with class-transformer for NestJS applications:

```typescript
import { IsString, IsEmail, IsNumber, IsEnum, IsOptional, Min, Max, MaxLength, MinLength } from "class-validator";
import { Type } from "class-transformer";

enum Currency {
  IDR = "IDR",
  USD = "USD",
  EUR = "EUR",
}

enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  BANK_TRANSFER = "bank_transfer",
  EWALLET = "ewallet",
}

export class CreateDonationDto {
  @IsNumber()
  @Min(0.01, { message: "Amount must be greater than 0" })
  @Max(1_000_000_000, { message: "Amount exceeds maximum allowed" })
  @Type(() => Number)
  amount!: number;

  @IsEnum(Currency, { message: "Currency must be IDR, USD, or EUR" })
  currency!: Currency;

  @IsEmail({}, { message: "Invalid email address" })
  @MaxLength(160)
  donorEmail!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  donorName!: string;

  @IsEnum(PaymentMethod, { message: "Invalid payment method" })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}

// NestJS controller with automatic validation
import { Controller, Post, Body, ValidationPipe, HttpStatus } from "@nestjs/common";

@Controller("donations")
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Post()
  async create(@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) dto: CreateDonationDto) {
    // dto is already validated by NestJS
    const donation = await this.donationService.create(dto);
    return { donation };
  }
}
```

### Type Guards

Implement custom type guards for runtime type checking:

```typescript
import { Decimal } from "decimal.js";

interface Money {
  amount: Decimal;
  currency: "IDR" | "USD" | "EUR";
}

// Type guard
function isMoney(value: unknown): value is Money {
  return (
    typeof value === "object" &&
    value !== null &&
    "amount" in value &&
    value.amount instanceof Decimal &&
    "currency" in value &&
    typeof value.currency === "string" &&
    ["IDR", "USD", "EUR"].includes(value.currency)
  );
}

interface ZakatCalculationInput {
  wealth: Money;
  nisab: Money;
}

function isZakatCalculationInput(value: unknown): value is ZakatCalculationInput {
  return (
    typeof value === "object" &&
    value !== null &&
    "wealth" in value &&
    isMoney(value.wealth) &&
    "nisab" in value &&
    isMoney(value.nisab)
  );
}

// Safe calculation with type guard
function calculateZakat(input: unknown): { success: true; zakat: Money } | { success: false; error: string } {
  if (!isZakatCalculationInput(input)) {
    return { success: false, error: "Invalid input: expected ZakatCalculationInput" };
  }

  const { wealth, nisab } = input;

  if (wealth.currency !== nisab.currency) {
    return { success: false, error: "Currency mismatch between wealth and nisab" };
  }

  if (wealth.amount.lessThan(nisab.amount)) {
    return { success: false, error: "Wealth is below nisab threshold" };
  }

  const zakatAmount = wealth.amount.times(0.025);
  return {
    success: true,
    zakat: {
      amount: zakatAmount,
      currency: wealth.currency,
    },
  };
}
```

## XSS Prevention

### React Automatic Escaping

React escapes content by default:

```tsx
import React from "react";

interface CampaignProps {
  name: string;
  description: string;
  userInput: string;
}

function Campaign({ name, description, userInput }: CampaignProps) {
  // ✅ SAFE - React automatically escapes
  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
      {/* Even if userInput contains <script>alert('xss')</script>, it's rendered as text */}
      <div>{userInput}</div>
    </div>
  );
}

function DangerousComponent({ html }: { html: string }) {
  // ❌ DANGEROUS - only for trusted content!
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### DOMPurify Sanitization

Sanitize user HTML when needed:

```typescript
import DOMPurify from 'dompurify';

// Sanitize user-provided HTML
function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}

// React component with sanitized HTML
interface CampaignDescriptionProps {
  htmlContent: string;
}

function CampaignDescription({ htmlContent }: CampaignDescriptionProps) {
  const sanitized = sanitizeHtml(htmlContent);

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: sanitized,
      }}
    />
  );
}

// NestJS service for campaign creation
import { Injectable } from '@nestjs/common';

@Injectable()
export class CampaignService {
  async createCampaign(dto: CreateCampaignDto) {
    const sanitizedDescription = sanitizeHtml(dto.description);

    const campaign = this.campaignRepository.create({
      ...dto,
      description: sanitizedDescription,
    });

    return this.campaignRepository.save(campaign);
  }
}
```

### Content Security Policy

Configure CSP headers:

```typescript
import helmet from "helmet";
import express from "express";

const app = express();

// Use Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);

// NestJS implementation
import { NestFactory } from "@nestjs/core";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );

  await app.listen(3000);
}
```

## SQL Injection Prevention

### Parameterized Queries

Always use parameterized queries:

```typescript
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ✅ SAFE - parameterized query
async function searchDonationsByEmail(email: string) {
  const result = await pool.query("SELECT * FROM donations WHERE donor_email = $1", [email]);
  return result.rows;
}

// ❌ DANGEROUS - SQL injection vulnerable!
async function searchDonationsUnsafe(email: string) {
  const query = `SELECT * FROM donations WHERE donor_email = '${email}'`;
  const result = await pool.query(query); // DON'T DO THIS!
  return result.rows;
}

// ✅ SAFE - parameterized query with multiple parameters
async function searchByAmountRange(minAmount: number, maxAmount: number) {
  const result = await pool.query("SELECT * FROM donations WHERE amount >= $1 AND amount <= $2", [
    minAmount,
    maxAmount,
  ]);
  return result.rows;
}

// ✅ SAFE - LIKE queries
async function searchByNamePattern(pattern: string) {
  const likePattern = `%${pattern}%`;
  const result = await pool.query("SELECT * FROM donations WHERE donor_name ILIKE $1", [likePattern]);
  return result.rows;
}
```

### TypeORM Safety

TypeORM query builder provides safe parameterization:

```typescript
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Donation } from "./entities/donation.entity";

export class DonationRepository {
  constructor(
    @InjectRepository(Donation)
    private readonly repository: Repository<Donation>,
  ) {}

  // ✅ SAFE - TypeORM query builder
  async searchByEmail(email: string) {
    return this.repository.createQueryBuilder("donation").where("donation.donor_email = :email", { email }).getMany();
  }

  // ✅ SAFE - TypeORM find methods
  async searchByAmountRange(minAmount: number, maxAmount: number) {
    return this.repository.find({
      where: {
        amount: Between(minAmount, maxAmount),
      },
    });
  }

  // ✅ SAFE - Complex queries with parameters
  async getDonationReport(filters: {
    campaignId?: string;
    minAmount?: number;
    dateRange?: { start: Date; end: Date };
  }) {
    const query = this.repository.createQueryBuilder("donation");

    if (filters.campaignId) {
      query.andWhere("donation.campaign_id = :campaignId", { campaignId: filters.campaignId });
    }

    if (filters.minAmount) {
      query.andWhere("donation.amount >= :minAmount", { minAmount: filters.minAmount });
    }

    if (filters.dateRange) {
      query.andWhere("donation.created_at BETWEEN :start AND :end", {
        start: filters.dateRange.start,
        end: filters.dateRange.end,
      });
    }

    return query
      .select("SUM(donation.amount)", "total")
      .addSelect("COUNT(donation.id)", "count")
      .addSelect("AVG(donation.amount)", "average")
      .getRawOne();
  }
}
```

### Prisma Safety

Prisma provides type-safe queries by default:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ SAFE - Prisma automatically parameterizes
async function searchDonationsByEmail(email: string) {
  return prisma.donation.findMany({
    where: {
      donorEmail: email,
    },
  });
}

// ✅ SAFE - Complex filters
async function searchDonations(filters: {
  campaignId?: string;
  minAmount?: number;
  maxAmount?: number;
  dateRange?: { start: Date; end: Date };
}) {
  return prisma.donation.findMany({
    where: {
      campaignId: filters.campaignId,
      amount: {
        gte: filters.minAmount,
        lte: filters.maxAmount,
      },
      createdAt: filters.dateRange
        ? {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end,
          }
        : undefined,
    },
  });
}

// ✅ SAFE - Aggregations
async function getDonationStats(campaignId: string) {
  return prisma.donation.aggregate({
    where: {
      campaignId,
    },
    _sum: {
      amount: true,
    },
    _avg: {
      amount: true,
    },
    _count: true,
  });
}
```

## Authentication

### Password Hashing

Use bcrypt for password hashing:

```typescript
import bcrypt from "bcrypt";
import { z } from "zod";

const SALT_ROUNDS = 12;

// Password validation schema
const PasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

const UserRegistrationSchema = z.object({
  email: z.string().email(),
  password: PasswordSchema,
  confirmPassword: z.string(),
});

// Hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// User entity
interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: "donor" | "admin" | "finance_manager";
  createdAt: Date;
}

// Registration service
export class AuthService {
  async registerUser(input: unknown): Promise<{ success: true; user: User } | { success: false; errors: string[] }> {
    // Validate input
    const validation = UserRegistrationSchema.safeParse(input);

    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.errors.map((e) => e.message),
      };
    }

    const { email, password, confirmPassword } = validation.data;

    if (password !== confirmPassword) {
      return {
        success: false,
        errors: ["Passwords do not match"],
      };
    }

    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      return {
        success: false,
        errors: ["Email already registered"],
      };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await this.userRepository.create({
      email,
      passwordHash,
      role: "donor",
    });

    return { success: true, user };
  }

  async authenticate(
    email: string,
    password: string,
  ): Promise<{ success: true; user: User } | { success: false; error: string }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Prevent timing attacks - always run hash verification
      await bcrypt.hash(password, SALT_ROUNDS);
      return { success: false, error: "Invalid credentials" };
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return { success: false, error: "Invalid credentials" };
    }

    return { success: true, user };
  }
}
```

### JWT Authentication

Implement JWT authentication:

```typescript
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "1h";

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Generate JWT
function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Verify JWT
function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Attach user to request
  req.user = payload;
  next();
}

// Login endpoint
export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const result = await this.authService.authenticate(email, password);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    const token = generateToken(result.user);

    return res.json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
    });
  }

  async refresh(req: Request, res: Response) {
    const user = req.user!; // Set by authenticateToken middleware

    const refreshedUser = await this.userRepository.findById(user.userId);

    if (!refreshedUser) {
      return res.status(401).json({ error: "User not found" });
    }

    const token = generateToken(refreshedUser);

    return res.json({ token });
  }
}

// Usage in routes
import express from "express";

const router = express.Router();

router.post("/auth/login", (req, res) => authController.login(req, res));
router.post("/auth/refresh", authenticateToken, (req, res) => authController.refresh(req, res));
router.get("/donations", authenticateToken, (req, res) => donationController.list(req, res));
```

The following diagram illustrates the complete JWT authentication flow in a TypeScript financial application:

```mermaid
sequenceDiagram
    participant Client as Client<br/>(Browser/Mobile)
    participant Auth as AuthController<br/>login/refresh
    participant Service as AuthService<br/>authenticate
    participant Bcrypt as Bcrypt<br/>password verify
    participant JWT as JWT Library<br/>sign/verify
    participant Protected as Protected Route<br/>DonationController
    participant Middleware as authenticateToken<br/>Middleware
    participant DB as Database

    %% Login Flow
    Client->>Auth: POST /api/auth/login<br/>{email, password}
    Auth->>Service: authenticate(email, password)
    Service->>DB: Find user by email
    DB-->>Service: User record with passwordHash

    Service->>Bcrypt: compare(password, hash)
    Bcrypt-->>Service: true/false

    alt Invalid Credentials
        Bcrypt->>Bcrypt: hash(password, SALT_ROUNDS)<br/>(prevent timing attack)
        Service-->>Auth: {success: false, error}
        Auth-->>Client: 401 Unauthorized<br/>Invalid credentials
    else Valid Credentials
        Service-->>Auth: {success: true, user}
        Auth->>JWT: sign(payload, secret, {expiresIn: 1h})
        JWT->>JWT: Generate JWT<br/>userId, email, role<br/>exp timestamp
        JWT-->>Auth: token string
        Auth-->>Client: 200 OK<br/>{token: "eyJ...", user: {...}}
    end

    %% Protected Route Access
    Client->>Protected: GET /api/donations<br/>Authorization: "Bearer eyJ..."
    Protected->>Middleware: authenticateToken()
    Middleware->>Middleware: Extract token from header
    Middleware->>JWT: verify(token, secret)
    JWT->>JWT: Decode JWT<br/>Verify signature<br/>Check expiration

    alt Invalid/Expired Token
        JWT-->>Middleware: Error (invalid/expired)
        Middleware-->>Client: 401 Unauthorized<br/>Invalid token
    else Valid Token
        JWT-->>Middleware: payload {userId, email, role}
        Middleware->>Protected: req.user = payload
        Protected->>Protected: Process request<br/>(user authorized)
        Protected-->>Client: 200 OK<br/>{donations: [...]}
    end

    %% Token Refresh
    Client->>Auth: POST /api/auth/refresh<br/>Authorization: "Bearer eyJ..."
    Auth->>Middleware: authenticateToken()
    Middleware->>JWT: verify(token, secret)
    JWT-->>Middleware: payload
    Middleware->>Auth: req.user = payload
    Auth->>DB: Find user by userId
    DB-->>Auth: User record
    Auth->>JWT: sign(new payload, secret, {expiresIn: 1h})
    JWT-->>Auth: new token
    Auth-->>Client: 200 OK<br/>{token: "eyJ..."}
```

**Key Security Features**:

- **Password Hashing**: Bcrypt with 12 salt rounds prevents password leaks
- **Timing Attack Prevention**: Hash verification runs even when user not found
- **JWT Expiration**: Tokens expire after 1 hour (configurable)
- **Stateless Auth**: JWT contains claims, no server-side session storage
- **Token Refresh**: Clients can refresh tokens before expiration
- **Authorization Header**: Bearer token in `Authorization: Bearer <token>` header

### Session Management

Express session with secure configuration:

```typescript
import session from "express-session";
import RedisStore from "connect-redis";
import { createClient } from "redis";

// Redis client for session storage
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.connect();

// Session configuration
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    name: "financial.sid", // Custom name
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent JavaScript access
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax", // CSRF protection
    },
  }),
);

// Session controller
export class SessionController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const result = await this.authService.authenticate(email, password);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    // Store user in session
    req.session.userId = result.user.id;
    req.session.loginAt = Date.now();

    // Regenerate session ID to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: "Session error" });
      }

      return res.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
      });
    });
  }

  async logout(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }

      res.clearCookie("financial.sid");
      return res.json({ message: "Logged out successfully" });
    });
  }
}
```

### OAuth2 Integration

Implement OAuth2 with Passport.js:

```typescript
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Configure Google OAuth2
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user
        let user = await userRepository.findByGoogleId(profile.id);

        if (!user) {
          user = await userRepository.create({
            googleId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            role: "donor",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    },
  ),
);

// Serialize user
passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userRepository.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// OAuth routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("/dashboard");
});
```

## Authorization

### Role-Based Access Control

Implement RBAC:

```typescript
enum Role {
  DONOR = "donor",
  ADMIN = "admin",
  FINANCE_MANAGER = "finance_manager",
}

// Middleware to check roles
function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(user.role as Role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

// Usage in routes
router.get("/admin/users", authenticateToken, requireRole(Role.ADMIN), (req, res) => {
  // Only admins can access
});

router.get("/finance/reports", authenticateToken, requireRole(Role.ADMIN, Role.FINANCE_MANAGER), (req, res) => {
  // Admins and finance managers can access
});
```

### Policy-Based Authorization

Define authorization policies:

```typescript
interface User {
  id: string;
  role: Role;
}

interface Donation {
  id: string;
  donorId: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
}

class AuthorizationPolicy {
  // Admins can do anything
  canManageAll(user: User): boolean {
    return user.role === Role.ADMIN;
  }

  // Donors can view their own donations
  canViewDonation(user: User, donation: Donation): boolean {
    return this.canManageAll(user) || user.id === donation.donorId;
  }

  // Finance managers can view all donations
  canViewAllDonations(user: User): boolean {
    return this.canManageAll(user) || user.role === Role.FINANCE_MANAGER;
  }

  // Finance managers can approve donations
  canApproveDonation(user: User): boolean {
    return this.canManageAll(user) || user.role === Role.FINANCE_MANAGER;
  }

  // Donors can create donations
  canCreateDonation(user: User): boolean {
    return user.role === Role.DONOR || this.canManageAll(user);
  }
}

// Use in controllers
export class DonationController {
  constructor(private readonly policy: AuthorizationPolicy) {}

  async show(req: Request, res: Response) {
    const user = req.user!;
    const donation = await this.donationRepository.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    if (!this.policy.canViewDonation(user, donation)) {
      return res.status(403).json({ error: "You do not have permission to view this donation" });
    }

    return res.json({ donation });
  }

  async approve(req: Request, res: Response) {
    const user = req.user!;
    const donation = await this.donationRepository.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    if (!this.policy.canApproveDonation(user)) {
      return res.status(403).json({ error: "You do not have permission to approve donations" });
    }

    donation.status = "approved";
    const updated = await this.donationRepository.save(donation);

    return res.json({ donation: updated });
  }
}
```

### NestJS Guards

Implement authorization guards in NestJS:

```typescript
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

// Role decorator
export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);

// Role guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>("roles", [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}

// Policy guard
@Injectable()
export class DonationPolicyGuard implements CanActivate {
  constructor(private readonly policy: AuthorizationPolicy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const donationId = request.params.id;

    const donation = await this.donationRepository.findById(donationId);

    if (!donation) {
      return false;
    }

    return this.policy.canViewDonation(user, donation);
  }
}

// Usage in controllers
@Controller("donations")
export class DonationController {
  @Get(":id")
  @UseGuards(JwtAuthGuard, DonationPolicyGuard)
  async findOne(@Param("id") id: string) {
    return this.donationService.findOne(id);
  }

  @Post(":id/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FINANCE_MANAGER)
  async approve(@Param("id") id: string) {
    return this.donationService.approve(id);
  }
}
```

## CSRF Protection

```typescript
import csrf from "csurf";
import cookieParser from "cookie-parser";

// CSRF middleware
app.use(cookieParser());
app.use(csrf({ cookie: true }));

// Add CSRF token to responses
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Render form with CSRF token
app.get("/donation/new", (req, res) => {
  res.render("donation-form", {
    csrfToken: req.csrfToken(),
  });
});

// CSRF token in HTML form
// <form method="POST" action="/donations">
//   <input type="hidden" name="_csrf" value="<%= csrfToken %>">
//   <!-- Other fields -->
// </form>

// API routes should use token authentication instead
app.use("/api", (req, res, next) => {
  // Skip CSRF for API routes (use JWT instead)
  next();
});
```

## Secure Communication

### HTTPS/TLS

Force HTTPS in production:

```typescript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure && req.get("x-forwarded-proto") !== "https") {
    return res.redirect(301, `https://${req.get("host")}${req.url}`);
  }
  next();
});

// HSTS header
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});
```

### Certificate Validation

Validate SSL certificates for external API calls:

```typescript
import axios from "axios";
import https from "https";

// Configure axios with certificate validation
const api = axios.create({
  baseURL: "https://api.paymentgateway.com",
  httpsAgent: new https.Agent({
    rejectUnauthorized: true, // Validate certificates
    minVersion: "TLSv1.2", // Minimum TLS version
  }),
});

// Payment gateway service
export class PaymentGatewayService {
  async createPayment(amount: number, currency: string) {
    try {
      const response = await api.post(
        "/payments",
        {
          amount,
          currency,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PAYMENT_GATEWAY_API_KEY}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error("Payment creation failed");
    }
  }
}
```

## Secret Management

### Environment Variables

Never commit secrets to version control:

```typescript
// .env (add to .gitignore)
// DATABASE_URL=postgresql://user:pass@localhost/financial_prod
// JWT_SECRET=very_long_secret_key_here
// SESSION_SECRET=another_secret_key
// PAYMENT_GATEWAY_API_KEY=payment_api_key
// GOOGLE_CLIENT_ID=google_client_id
// GOOGLE_CLIENT_SECRET=google_client_secret

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Access secrets
const jwtSecret = process.env.JWT_SECRET;
const databaseUrl = process.env.DATABASE_URL;
```

### Validated Configuration

Use Zod to validate environment variables:

```typescript
import { z } from "zod";

const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  PAYMENT_GATEWAY_API_KEY: z.string(),
  REDIS_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

type Config = z.infer<typeof ConfigSchema>;

// Validate and export config
export const config: Config = ConfigSchema.parse(process.env);

// Usage
import { config } from "./config";

const app = express();
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
```

## Security Headers

```typescript
import helmet from "helmet";

app.use(helmet());

// Or configure individual headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
    frameguard: {
      action: "deny",
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  }),
);
```

## Rate Limiting

```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.connect();

// General rate limiter
const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rl:",
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});

app.use("/api/", limiter);

// Stricter rate limit for authentication
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rl:auth:",
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
});

app.use("/api/auth/login", authLimiter);
```

## Audit Logging

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column()
  action!: string;

  @Column()
  resourceType!: string;

  @Column({ nullable: true })
  resourceId?: string;

  @Column()
  ipAddress!: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column("jsonb", { nullable: true })
  changes?: Record<string, any>;

  @CreateDateColumn()
  occurredAt!: Date;
}

// Audit logging service
export class AuditService {
  constructor(private readonly auditRepository: Repository<AuditLog>) {}

  async log(params: {
    user: User;
    action: string;
    resourceType: string;
    resourceId?: string;
    req: Request;
    changes?: Record<string, any>;
  }) {
    const log = this.auditRepository.create({
      userId: params.user.id,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      ipAddress: this.getIpAddress(params.req),
      userAgent: params.req.get("user-agent"),
      changes: params.changes,
      occurredAt: new Date(),
    });

    await this.auditRepository.save(log);
  }

  private getIpAddress(req: Request): string {
    return (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "unknown";
  }
}

// Usage in controllers
export class DonationController {
  constructor(
    private readonly donationService: DonationService,
    private readonly auditService: AuditService,
  ) {}

  async approve(req: Request, res: Response) {
    const user = req.user!;
    const donationId = req.params.id;
    const donation = await this.donationService.findOne(donationId);

    const previousStatus = donation.status;
    const approved = await this.donationService.approve(donationId);

    // Log security-relevant action
    await this.auditService.log({
      user,
      action: "approve_donation",
      resourceType: "Donation",
      resourceId: donationId,
      req,
      changes: {
        previousStatus,
        newStatus: approved.status,
      },
    });

    return res.json({ donation: approved });
  }
}
```

## Dependency Security

```typescript
// package.json scripts
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "audit:prod": "npm audit --omit=dev"
  }
}

// Run security audits
// npm audit
// npm audit fix

// Use Snyk for continuous monitoring
// npm install -g snyk
// snyk auth
// snyk test
// snyk monitor

// Renovate or Dependabot for automated updates
// .github/dependabot.yml
```

## Financial Domain Examples

Complete security example for Zakat calculation API:

```typescript
import { z } from "zod";
import Decimal from "decimal.js";

// Zakat calculation schema
const ZakatCalculationSchema = z.object({
  wealth: z.object({
    amount: z.number().positive(),
    currency: z.enum(["IDR", "USD", "EUR"]),
  }),
  nisab: z.object({
    amount: z.number().positive(),
    currency: z.enum(["IDR", "USD", "EUR"]),
  }),
});

// Zakat service with security
@Injectable()
export class ZakatService {
  constructor(
    private readonly auditService: AuditService,
    private readonly userRepository: UserRepository,
  ) {}

  async calculate(user: User, input: unknown, req: Request) {
    // Validate input
    const validation = ZakatCalculationSchema.safeParse(input);

    if (!validation.success) {
      throw new BadRequestException({
        error: "Validation failed",
        details: validation.error.errors,
      });
    }

    const { wealth, nisab } = validation.data;

    // Check currency match
    if (wealth.currency !== nisab.currency) {
      throw new BadRequestException("Currency mismatch between wealth and nisab");
    }

    // Calculate Zakat (2.5% if wealth >= nisab)
    const wealthAmount = new Decimal(wealth.amount);
    const nisabAmount = new Decimal(nisab.amount);

    if (wealthAmount.lessThan(nisabAmount)) {
      throw new BadRequestException("Wealth is below nisab threshold");
    }

    const zakatAmount = wealthAmount.times(0.025);

    const result = {
      wealth: {
        amount: wealthAmount.toNumber(),
        currency: wealth.currency,
      },
      nisab: {
        amount: nisabAmount.toNumber(),
        currency: nisab.currency,
      },
      zakat: {
        amount: zakatAmount.toNumber(),
        currency: wealth.currency,
      },
    };

    // Audit log
    await this.auditService.log({
      user,
      action: "calculate_zakat",
      resourceType: "ZakatCalculation",
      req,
      changes: {
        input: validation.data,
        result,
      },
    });

    return result;
  }
}

// Controller with authentication and rate limiting
@Controller("zakat")
@UseGuards(JwtAuthGuard)
export class ZakatController {
  constructor(private readonly zakatService: ZakatService) {}

  @Post("calculate")
  async calculate(@Request() req, @Body() body: unknown) {
    return this.zakatService.calculate(req.user, body, req);
  }
}
```

## Security Best Practices

1. **Validate all input** - Use Zod or class-validator, never trust user input
2. **Escape output** - React/frameworks do this automatically, use DOMPurify for HTML
3. **Use parameterized queries** - TypeORM/Prisma prevent SQL injection
4. **Hash passwords** - Use bcrypt with 12+ salt rounds
5. **Implement authorization** - Check permissions before actions
6. **Enable CSRF protection** - Use csurf for traditional apps, token auth for APIs
7. **Force HTTPS** - Always use TLS in production
8. **Set security headers** - Use Helmet.js
9. **Rate limit APIs** - Prevent abuse with express-rate-limit
10. **Audit sensitive actions** - Log security events
11. **Keep dependencies updated** - Run `npm audit` and use Snyk
12. **Use TypeScript strict mode** - Enable `strict: true` in tsconfig.json

## Security Anti-patterns

### 1. Trusting User Input

```typescript
// ❌ DANGEROUS - no validation
async function updateDonation(id: string, data: any) {
  return donationRepository.save({ id, ...data });
}

// ✅ SAFE - validated input
async function updateDonation(id: string, data: unknown) {
  const validated = UpdateDonationSchema.parse(data);
  return donationRepository.save({ id, ...validated });
}
```

### 2. Committing Secrets

```typescript
// ❌ DANGEROUS - secrets in code
const API_KEY = "sk_live_123456789"; // NEVER DO THIS!

// ✅ SAFE - environment variables
const API_KEY = process.env.PAYMENT_GATEWAY_API_KEY!;
```

### 3. Weak Password Requirements

```typescript
// ❌ WEAK
const password = z.string().min(6);

// ✅ STRONG
const password = z
  .string()
  .min(12)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/)
  .regex(/[!@#$%^&*]/);
```

### 4. SQL Injection

```typescript
// ❌ DANGEROUS - string interpolation
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ SAFE - parameterized query
const query = "SELECT * FROM users WHERE email = $1";
const result = await pool.query(query, [email]);
```

### 5. Missing Authorization

```typescript
// ❌ DANGEROUS - no authorization check
async function deleteDonation(id: string) {
  return donationRepository.delete(id);
}

// ✅ SAFE - authorization check
async function deleteDonation(user: User, id: string) {
  const donation = await donationRepository.findOne(id);

  if (!policy.canDelete(user, donation)) {
    throw new ForbiddenException();
  }

  return donationRepository.delete(id);
}
```

## Security Testing

```typescript
import { Test } from "@nestjs/testing";
import request from "supertest";

describe("DonationController (security)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe("Authorization", () => {
    it("should reject unauthenticated requests", async () => {
      const response = await request(app.getHttpServer()).post("/donations").send({
        amount: 100,
        currency: "IDR",
      });

      expect(response.status).toBe(401);
    });

    it("should reject donors from approving donations", async () => {
      const token = await getAuthToken({ role: "donor" });

      const response = await request(app.getHttpServer())
        .post("/donations/123/approve")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it("should allow finance managers to approve donations", async () => {
      const token = await getAuthToken({ role: "finance_manager" });

      const response = await request(app.getHttpServer())
        .post("/donations/123/approve")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });

  describe("Input Validation", () => {
    it("should reject donations with negative amount", async () => {
      const token = await getAuthToken({ role: "donor" });

      const response = await request(app.getHttpServer())
        .post("/donations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: -100,
          currency: "IDR",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("amount");
    });

    it("should reject donations with invalid currency", async () => {
      const token = await getAuthToken({ role: "donor" });

      const response = await request(app.getHttpServer())
        .post("/donations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 100,
          currency: "INVALID",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("currency");
    });

    it("should reject XSS attempts", async () => {
      const token = await getAuthToken({ role: "donor" });

      const response = await request(app.getHttpServer())
        .post("/donations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 100,
          currency: "IDR",
          notes: '<script>alert("xss")</script>',
        });

      expect(response.status).toBe(201);
      const donation = response.body.donation;
      expect(donation.notes).not.toContain("<script>");
    });
  });

  describe("SQL Injection", () => {
    it("should prevent SQL injection in search", async () => {
      const token = await getAuthToken({ role: "donor" });

      const response = await request(app.getHttpServer())
        .get("/donations?email=' OR '1'='1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.donations).toHaveLength(0);
    });
  });

  describe("Rate Limiting", () => {
    it("should rate limit login attempts", async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app.getHttpServer()).post("/auth/login").send({
          email: "test@example.com",
          password: "wrong",
        }),
      );

      const responses = await Promise.all(promises);
      const tooManyRequests = responses.filter((r) => r.status === 429);

      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });
});
```

## Related Topics

- [Web Services](web-services.md) - NestJS security features
- [Type Safety](type-safety.md) - Compile-time safety
- [Error Handling](error-handling.md) - Secure error messages
- [Best Practices](best-practices.md) - Security best practices

## Sources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [jsonwebtoken Documentation](https://github.com/auth0/node-jsonwebtoken)
- [Passport.js Documentation](https://www.passportjs.org/)

---

**TypeScript Version**: 5.0+ (baseline), 5.7+ (stable maintenance), 5.9.x (latest stable)
**Node.js Version**: 18+ (baseline), 20+ (LTS recommended)
**Maintainers**: OSE Platform Documentation Team

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#0173B2','primaryTextColor':'#fff','primaryBorderColor':'#0173B2','lineColor':'#DE8F05','secondaryColor':'#029E73','tertiaryColor':'#CC78BC','fontSize':'16px'}}}%%
flowchart LR
    A[TypeScript Security] --> B[Type Safety<br/>Compile-Time]
    A --> C[Input Validation<br/>Runtime]
    A --> D[Authentication<br/>JWT]
    A --> E[Data Protection<br/>Encryption]

    B --> B1[Strict Types<br/>No any]
    B --> B2[Type Guards<br/>Validation]
    B --> B3[Branded Types<br/>Nominal]

    C --> C1[Zod Schema<br/>Validation]
    C --> C2[Class Validator<br/>Decorators]
    C --> C3[Joi<br/>Schema Validation]

    D --> D1[jsonwebtoken<br/>Token Signing]
    D --> D2[Passport.js<br/>Strategies]
    D --> D3[OAuth 2.0<br/>Authorization]

    E --> E1[crypto Module<br/>Node.js]
    E --> E2[AES-256-GCM<br/>Encryption]
    E --> E3[bcrypt<br/>Password Hash]

    B1 --> F[Zakat Amount<br/>Type-Safe]
    C1 --> G[Donation Input<br/>Schema Valid]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
    style D fill:#CC78BC,color:#fff
    style E fill:#0173B2,color:#fff
    style F fill:#DE8F05,color:#fff
    style G fill:#029E73,color:#fff
```
