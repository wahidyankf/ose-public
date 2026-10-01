---
title: "SQL Database"
date: 2026-02-07T00:00:00+07:00
draft: false
description: "Production SQL database integration in TypeScript - from raw SQL with node-postgres to TypeORM and Prisma with type safety, migrations, and relations"
weight: 10000008
tags: ["typescript", "sql", "database", "postgres", "typeorm", "prisma", "orm"]
---

## Why SQL Database Integration Matters

SQL databases provide durable, ACID-compliant storage for application data with powerful querying, transactions, and referential integrity. Production applications require type-safe queries, automatic migrations, connection pooling, and protection against SQL injection.

**Core Benefits**:

- **Data persistence**: Survive server restarts and crashes
- **ACID guarantees**: Atomicity, Consistency, Isolation, Durability
- **Complex queries**: JOIN, GROUP BY, aggregations, subqueries
- **Type safety**: TypeScript types match database schema
- **Referential integrity**: Foreign keys enforce data consistency

**Problem**: Raw SQL queries lack type safety, require manual mapping, prone to SQL injection, and need manual connection management.

**Solution**: Use Object-Relational Mappers (ORMs) like TypeORM or Prisma that provide type safety, automatic migrations, and built-in protection against SQL injection.

## Standard Library First: node-postgres (pg)

PostgreSQL provides a Node.js driver (`pg`) for executing raw SQL queries without external ORMs.

### Basic SQL Queries with pg

The `pg` library connects to PostgreSQL and executes raw SQL with parameter binding.

**Installation**:

```bash
npm install pg @types/pg
# => Install PostgreSQL client
# => @types/pg: TypeScript type definitions
```

**Pattern**:

```typescript
import { Pool } from "pg";
// => Import PostgreSQL connection pool
// => Pool: Manages multiple database connections

const pool = new Pool({
  // => Create connection pool
  // => Reuses connections across requests
  host: "localhost",
  // => Database server hostname
  port: 5432,
  // => PostgreSQL default port
  database: "myapp",
  // => Database name
  user: "postgres",
  // => Database user
  password: "password",
  // => Database password (use environment variable in production)
  max: 20,
  // => Maximum connections in pool
  // => Tune based on application load
  idleTimeoutMillis: 30000,
  // => Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000,
  // => Wait 2 seconds for connection before timeout
});

// Create table
async function createUsersTable() {
  // => Create users table with SQL DDL
  const client = await pool.connect();
  // => Get connection from pool
  // => Must release after use

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        -- => Create table only if doesn't exist
        id SERIAL PRIMARY KEY,
        -- => Auto-incrementing integer primary key
        -- => SERIAL: Automatically creates sequence
        name VARCHAR(100) NOT NULL,
        -- => Variable character up to 100 chars
        -- => NOT NULL: Required field
        email VARCHAR(255) UNIQUE NOT NULL,
        -- => Email must be unique
        -- => Enforced by database
        created_at TIMESTAMP DEFAULT NOW()
        -- => Timestamp with default current time
        -- => Automatically set on insert
      )
    `);
    // => Execute DDL statement
    // => Creates table schema
    console.log("Users table created");
  } finally {
    client.release();
    // => Return connection to pool
    // => CRITICAL: Always release connections
  }
}

// Insert data
async function createUser(name: string, email: string) {
  // => Insert new user into database
  // => Returns created user with ID

  const result = await pool.query(
    // => Execute parameterized query
    // => Prevents SQL injection
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
    // => $1, $2: Positional parameters
    // => RETURNING *: Return inserted row
    [name, email],
    // => Parameter values
    // => Escaped automatically by pg
  );

  return result.rows[0];
  // => Return first row
  // => Contains id, name, email, created_at
}

// Query data
async function findUserByEmail(email: string) {
  // => Find user by email address
  // => Returns user or undefined

  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    // => Parameterized query
    // => Prevents SQL injection
    [email],
  );

  return result.rows[0];
  // => Return first matching row
  // => undefined if no match
}

// Update data
async function updateUserName(userId: number, newName: string) {
  // => Update user's name by ID
  // => Returns updated user

  const result = await pool.query(
    "UPDATE users SET name = $1 WHERE id = $2 RETURNING *",
    // => Update statement with RETURNING clause
    [newName, userId],
  );

  return result.rows[0];
  // => Return updated row
}

// Delete data
async function deleteUser(userId: number) {
  // => Delete user by ID
  // => Returns deleted user

  const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [userId]);

  return result.rows[0];
  // => Return deleted row
}

// Transaction example
async function transferMoney(fromUserId: number, toUserId: number, amount: number) {
  // => Transfer money between users
  // => Uses transaction for atomicity

  const client = await pool.connect();
  // => Get dedicated connection for transaction
  // => Transactions require single connection

  try {
    await client.query("BEGIN");
    // => Start transaction
    // => All following queries in transaction

    await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE user_id = $2",
      // => Deduct from sender
      [amount, fromUserId],
    );

    await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE user_id = $2",
      // => Add to recipient
      [amount, toUserId],
    );

    await client.query("COMMIT");
    // => Commit transaction
    // => Both updates succeed or both fail
    console.log("Transfer successful");
  } catch (error) {
    await client.query("ROLLBACK");
    // => Rollback transaction on error
    // => Reverts all changes
    console.error("Transfer failed:", error);
    throw error;
  } finally {
    client.release();
    // => Return connection to pool
  }
}

// Usage
await createUsersTable();
const user = await createUser("Alice", "alice@example.com");
// => Insert user
// => user: { id: 1, name: 'Alice', email: 'alice@example.com', created_at: '...' }

const found = await findUserByEmail("alice@example.com");
// => Query user
// => found: { id: 1, name: 'Alice', ... }
```

**Type safety attempt**:

```typescript
interface User {
  // => Define User type manually
  // => Must match database schema
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

async function findUserByEmailTyped(email: string): Promise<User | undefined> {
  // => Return typed user
  const result = await pool.query<User>(
    // => Generic type parameter
    // => Provides type hint, but not enforced
    "SELECT * FROM users WHERE email = $1",
    [email],
  );

  return result.rows[0];
  // => TypeScript thinks result is User
  // => But no runtime validation
}
```

**Limitations for production**:

- **No type safety**: SQL queries are strings, TypeScript can't validate
- **Manual mapping**: Convert database rows to TypeScript objects manually
- **SQL injection risk**: Parameterized queries required (easy to forget)
- **No migrations**: Manual schema management (CREATE TABLE scripts)
- **No relations**: Must manually JOIN tables
- **Connection management**: Must remember to release connections
- **No query builder**: Complex queries require raw SQL construction
- **Schema drift**: Database schema and TypeScript types can diverge

**When standard library suffices**:

- Simple applications (≤3 tables)
- Read-only queries (reporting, analytics)
- Performance-critical queries (ORM overhead matters)
- Learning SQL fundamentals

## Production Framework: TypeORM

TypeORM provides object-relational mapping with decorators, type safety, migrations, and relation support.

### Installation and Setup

```bash
npm install typeorm pg reflect-metadata
# => typeorm: ORM framework
# => pg: PostgreSQL driver
# => reflect-metadata: Required for decorators
```

**TypeScript configuration** (tsconfig.json):

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    // => Enable decorator syntax
    // => Required for @Entity, @Column, etc.
    "emitDecoratorMetadata": true
    // => Emit type metadata for decorators
    // => Required for type inference
  }
}
```

**Entity definition**:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
// => Import TypeORM decorators
// => Define database schema via TypeScript classes

@Entity("users")
// => Mark class as database entity
// => Table name: 'users'
export class User {
  @PrimaryGeneratedColumn()
  // => Auto-incrementing primary key
  // => Maps to SERIAL in PostgreSQL
  id: number;
  // => TypeScript type matches database type

  @Column({ type: "varchar", length: 100 })
  // => Column definition
  // => VARCHAR(100) in database
  name: string;
  // => TypeScript string type

  @Column({ type: "varchar", length: 255, unique: true })
  // => Unique constraint on email
  // => Database enforces uniqueness
  email: string;

  @CreateDateColumn()
  // => Automatically set to NOW() on insert
  // => TypeORM manages this column
  createdAt: Date;
  // => TypeScript Date type

  @OneToMany(() => Post, (post) => post.author)
  // => One-to-many relationship
  // => One user has many posts
  // => Lazy loading by default
  posts: Post[];
  // => TypeScript array of Post entities
}

@Entity("posts")
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  // => TEXT type for long content
  // => No length limit
  content: string;

  @Column({ type: "int" })
  // => Foreign key (manual definition)
  authorId: number;

  @ManyToOne(() => User, (user) => user.posts)
  // => Many-to-one relationship
  // => Many posts belong to one user
  author: User;
  // => TypeScript User type

  @CreateDateColumn()
  createdAt: Date;
}
```

**Database connection**:

```typescript
import { DataSource } from "typeorm";
// => TypeORM data source (replaces old Connection)

export const AppDataSource = new DataSource({
  // => Configure database connection
  type: "postgres",
  // => Database type
  host: process.env.DB_HOST || "localhost",
  // => Database host from environment
  port: parseInt(process.env.DB_PORT || "5432"),
  // => Database port
  username: process.env.DB_USER || "postgres",
  database: process.env.DB_NAME || "myapp",
  password: process.env.DB_PASSWORD,
  // => Credentials from environment variables
  entities: [User, Post],
  // => Register entity classes
  // => TypeORM scans for @Entity decorators
  migrations: ["src/migrations/*.ts"],
  // => Migration files location
  // => Auto-run on startup
  synchronize: process.env.NODE_ENV === "development",
  // => Auto-sync schema in development
  // => NEVER use in production (use migrations)
  logging: process.env.NODE_ENV === "development",
  // => Log SQL queries in development
  // => Useful for debugging
});

await AppDataSource.initialize();
// => Connect to database
// => Initialize connection pool
console.log("Database connected");
```

### CRUD Operations

TypeORM provides repository pattern for type-safe database operations.

**Create**:

```typescript
const userRepository = AppDataSource.getRepository(User);
// => Get repository for User entity
// => Repository: Type-safe CRUD operations

const user = new User();
// => Create new entity instance
// => TypeScript ensures properties match schema
user.name = "Alice";
user.email = "alice@example.com";
// => Set properties
// => Type-safe (email must be string)

await userRepository.save(user);
// => INSERT INTO users (name, email) VALUES (...)
// => Returns saved entity with generated ID
console.log("User created:", user.id);

// Alternative: inline creation
const bob = await userRepository.save({
  name: "Bob",
  email: "bob@example.com",
});
// => Create and save in one operation
```

**Read**:

```typescript
// Find by ID
const user = await userRepository.findOne({
  where: { id: 1 },
  // => WHERE id = 1
  // => Returns User | null
});

// Find by email
const alice = await userRepository.findOne({
  where: { email: "alice@example.com" },
  // => WHERE email = 'alice@example.com'
});

// Find all users
const allUsers = await userRepository.find();
// => SELECT * FROM users
// => Returns User[]

// Find with conditions
const users = await userRepository.find({
  where: {
    email: Like("%@example.com"),
    // => WHERE email LIKE '%@example.com'
    // => Find all users with example.com email
  },
  order: {
    createdAt: "DESC",
    // => ORDER BY created_at DESC
  },
  take: 10,
  // => LIMIT 10
  skip: 0,
  // => OFFSET 0 (pagination)
});

// Query builder for complex queries
const usersWithPosts = await userRepository
  .createQueryBuilder("user")
  // => Create query builder with alias
  .leftJoinAndSelect("user.posts", "post")
  // => LEFT JOIN posts ON user.id = post.author_id
  // => SELECT user.*, post.*
  .where("user.email LIKE :pattern", { pattern: "%@example.com" })
  // => Named parameter binding
  // => Prevents SQL injection
  .orderBy("user.createdAt", "DESC")
  .getMany();
// => Execute query, return User[]
```

**Update**:

```typescript
// Find and update
const user = await userRepository.findOne({ where: { id: 1 } });
if (user) {
  user.name = "Alice Updated";
  // => Modify property
  await userRepository.save(user);
  // => UPDATE users SET name = 'Alice Updated' WHERE id = 1
}

// Update without loading
await userRepository.update(
  { id: 1 },
  // => WHERE clause
  { name: "Alice Updated" },
  // => SET clause
);
// => UPDATE users SET name = 'Alice Updated' WHERE id = 1
// => Doesn't load entity first (more efficient)
```

**Delete**:

```typescript
// Find and delete
const user = await userRepository.findOne({ where: { id: 1 } });
if (user) {
  await userRepository.remove(user);
  // => DELETE FROM users WHERE id = 1
}

// Delete without loading
await userRepository.delete({ id: 1 });
// => DELETE FROM users WHERE id = 1
// => More efficient (no SELECT first)

// Soft delete (if @DeleteDateColumn defined)
await userRepository.softDelete({ id: 1 });
// => UPDATE users SET deleted_at = NOW() WHERE id = 1
// => Preserves data, marks as deleted
```

### Relations and Eager Loading

TypeORM handles relationships between entities automatically.

**Pattern**:

```typescript
// Create user with posts
const user = new User();
user.name = "Alice";
user.email = "alice@example.com";

const post1 = new Post();
post1.title = "First Post";
post1.content = "Hello world";
post1.author = user;
// => Set relationship
// => TypeORM manages foreign key

const post2 = new Post();
post2.title = "Second Post";
post2.content = "TypeORM is great";
post2.author = user;

await userRepository.save(user);
// => INSERT INTO users ...
const postRepository = AppDataSource.getRepository(Post);
await postRepository.save([post1, post2]);
// => INSERT INTO posts ... (2 queries)
// => Sets author_id automatically

// Eager loading (avoid N+1 queries)
const usersWithPosts = await userRepository.find({
  relations: ["posts"],
  // => Load related posts
  // => Single query with JOIN
});
// => User objects include posts array
// => usersWithPosts[0].posts: Post[]

// Lazy loading (separate query)
const user = await userRepository.findOne({ where: { id: 1 } });
const posts = await user.posts;
// => Separate query for posts
// => SELECT * FROM posts WHERE author_id = 1
// => N+1 query problem if not careful
```

### Transactions

TypeORM provides transaction support for atomic operations.

**Pattern**:

```typescript
import { AppDataSource } from "./data-source";

await AppDataSource.transaction(async (transactionalEntityManager) => {
  // => Create transaction
  // => All operations use same transaction

  const user = new User();
  user.name = "Alice";
  user.email = "alice@example.com";
  await transactionalEntityManager.save(user);
  // => INSERT user (transaction)

  const account = new Account();
  account.userId = user.id;
  account.balance = 1000;
  await transactionalEntityManager.save(account);
  // => INSERT account (transaction)

  // Both succeed or both fail
  // => Automatic COMMIT on success
  // => Automatic ROLLBACK on error
});
```

### Migrations

TypeORM generates migrations from entity changes.

**Generate migration**:

```bash
npx typeorm migration:generate -d src/data-source.ts -n CreateUsers
# => Compare entities with database schema
# => Generate migration file with diff
```

**Migration file** (auto-generated):

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsers1234567890 implements MigrationInterface {
  // => Migration class
  // => Timestamp in name for ordering

  public async up(queryRunner: QueryRunner): Promise<void> {
    // => Apply migration (forward)
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    // => Execute DDL
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // => Rollback migration (backward)
    await queryRunner.query(`DROP TABLE "users"`);
    // => Reverse the change
  }
}
```

**Run migrations**:

```bash
npx typeorm migration:run -d src/data-source.ts
# => Run pending migrations
# => Tracks applied migrations in database
```

**Production benefits**:

- **Type safety**: Entities are TypeScript classes (compile-time validation)
- **Automatic migrations**: Generate migrations from entity changes
- **Relation support**: Automatic JOIN, eager/lazy loading
- **Query builder**: Type-safe complex queries
- **Transaction support**: ACID guarantees
- **Connection pooling**: Built-in connection management
- **SQL injection protection**: Parameterized queries by default

**Trade-offs**:

- **External dependency**: TypeORM (500KB) + reflect-metadata
- **Learning curve**: Decorators, repositories, query builder
- **Performance overhead**: ORM abstraction slower than raw SQL
- **N+1 queries**: Easy to accidentally create (must use relations carefully)

**When to use TypeORM**:

- Applications with complex domain models (>5 entities)
- Need type safety (TypeScript types match database)
- Want automatic migrations
- Team familiar with Active Record pattern

## Production Framework: Prisma

Prisma provides schema-first development with generated TypeScript types and database migrations.

### Installation and Setup

```bash
npm install prisma @prisma/client
npx prisma init
# => Create prisma/ directory with schema.prisma
```

**Schema definition** (prisma/schema.prisma):

```prisma
// Database connection
datasource db {
  provider = "postgresql"
  // => Database type
  url      = env("DATABASE_URL")
  // => Connection string from environment
  // => Example: postgresql://user:password@localhost:5432/myapp
}

// Prisma Client generator
generator client {
  provider = "prisma-client-js"
  // => Generate TypeScript client
  // => Provides type-safe database API
}

// User model
model User {
  // => Define table schema
  // => Generates TypeScript types automatically
  id        Int      @id @default(autoincrement())
  // => Primary key with auto-increment
  // => @id: Primary key decorator
  // => @default(autoincrement()): Auto-generate value
  name      String   @db.VarChar(100)
  // => VARCHAR(100) in database
  email     String   @unique @db.VarChar(255)
  // => Unique constraint
  createdAt DateTime @default(now()) @map("created_at")
  // => @default(now()): Current timestamp
  // => @map: Map to snake_case column name
  posts     Post[]
  // => Relation: User has many Posts
  // => Prisma manages foreign keys

  @@map("users")
  // => Map to 'users' table name
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String   @db.VarChar(255)
  content   String   @db.Text
  // => TEXT type for long content
  authorId  Int      @map("author_id")
  // => Foreign key
  author    User     @relation(fields: [authorId], references: [id])
  // => Relation: Post belongs to User
  // => fields: Foreign key column
  // => references: Referenced column in User
  createdAt DateTime @default(now()) @map("created_at")

  @@map("posts")
}
```

**Generate client**:

```bash
npx prisma generate
# => Generate TypeScript types from schema
# => Creates @prisma/client with type-safe API
```

**Migrate database**:

```bash
npx prisma migrate dev --name init
# => Create migration and apply to database
# => Generates SQL migration file
```

### CRUD Operations

Prisma Client provides fully type-safe database operations.

**Setup**:

```typescript
import { PrismaClient } from "@prisma/client";
// => Import generated Prisma Client
// => Types match schema.prisma exactly

const prisma = new PrismaClient();
// => Create Prisma Client instance
// => Manages connection pool automatically
```

**Create**:

```typescript
const user = await prisma.user.create({
  // => prisma.user: Type-safe repository
  // => TypeScript validates data matches User model
  data: {
    name: "Alice",
    // => TypeScript knows 'name' is required
    email: "alice@example.com",
    // => TypeScript knows 'email' is required
  },
});
// => INSERT INTO users (name, email) VALUES (...)
// => Returns created user with ID
// => user.id: number (TypeScript knows type)

// Create with relations
const userWithPost = await prisma.user.create({
  data: {
    name: "Bob",
    email: "bob@example.com",
    posts: {
      create: [
        // => Create related posts
        { title: "First Post", content: "Hello" },
        { title: "Second Post", content: "World" },
      ],
    },
  },
  include: {
    posts: true,
    // => Include related posts in result
    // => Avoids N+1 query
  },
});
// => INSERT user and posts in transaction
// => userWithPost.posts: Post[] (fully typed)
```

**Read**:

```typescript
// Find unique
const user = await prisma.user.findUnique({
  where: { id: 1 },
  // => WHERE id = 1
  // => Returns User | null
});

// Find by unique field
const alice = await prisma.user.findUnique({
  where: { email: "alice@example.com" },
  // => WHERE email = 'alice@example.com'
  // => email is unique, so findUnique allowed
});

// Find many
const users = await prisma.user.findMany({
  where: {
    email: {
      endsWith: "@example.com",
      // => WHERE email LIKE '%@example.com'
      // => Type-safe query operators
    },
  },
  orderBy: {
    createdAt: "desc",
    // => ORDER BY created_at DESC
  },
  take: 10,
  // => LIMIT 10
  skip: 0,
  // => OFFSET 0
});

// Find with relations
const usersWithPosts = await prisma.user.findMany({
  include: {
    posts: true,
    // => Eager load posts
    // => Single query with JOIN
  },
});
// => usersWithPosts[0].posts: Post[] (fully typed)

// Select specific fields
const names = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    // => SELECT id, name FROM users
    // => Omit email, createdAt
  },
});
// => names[0].email: ERROR (TypeScript knows field not selected)
```

**Update**:

```typescript
// Update single record
const updated = await prisma.user.update({
  where: { id: 1 },
  // => WHERE id = 1
  data: {
    name: "Alice Updated",
    // => SET name = 'Alice Updated'
  },
});
// => UPDATE users SET name = 'Alice Updated' WHERE id = 1

// Update many
await prisma.user.updateMany({
  where: {
    email: {
      endsWith: "@example.com",
    },
  },
  data: {
    name: "Updated",
  },
});
// => UPDATE users SET name = 'Updated' WHERE email LIKE '%@example.com'
```

**Delete**:

```typescript
// Delete single record
await prisma.user.delete({
  where: { id: 1 },
});
// => DELETE FROM users WHERE id = 1

// Delete many
await prisma.user.deleteMany({
  where: {
    email: {
      endsWith: "@test.com",
    },
  },
});
// => DELETE FROM users WHERE email LIKE '%@test.com'
```

### Transactions

Prisma supports interactive and sequential transactions.

**Interactive transaction**:

```typescript
await prisma.$transaction(async (tx) => {
  // => Start transaction
  // => tx: Prisma Client scoped to transaction

  const user = await tx.user.create({
    data: { name: "Alice", email: "alice@example.com" },
  });
  // => INSERT user (transaction)

  await tx.post.create({
    data: {
      title: "First Post",
      content: "Hello",
      authorId: user.id,
    },
  });
  // => INSERT post (transaction)

  // Both succeed or both fail
  // => Auto COMMIT on success, ROLLBACK on error
});
```

**Sequential transaction** (simpler API):

```typescript
const [user, post] = await prisma.$transaction([
  // => Execute queries in transaction
  prisma.user.create({ data: { name: "Bob", email: "bob@example.com" } }),
  prisma.post.create({ data: { title: "Post", content: "Content", authorId: 1 } }),
]);
// => Both queries in single transaction
```

### Migrations

Prisma provides schema-first migrations with full history.

**Create migration**:

```bash
npx prisma migrate dev --name add_users_table
# => Create migration from schema changes
# => Generates SQL migration file
# => Applies migration to database
```

**Migration file** (auto-generated):

```sql
-- CreateTable
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Apply migrations** (production):

```bash
npx prisma migrate deploy
# => Apply pending migrations to production
# => Non-interactive (safe for CI/CD)
```

**Production benefits**:

- **Full type safety**: Generated types match database exactly
- **Schema-first**: Single source of truth (schema.prisma)
- **Zero-config migrations**: Automatic migration generation
- **Relation queries**: Elegant API for nested queries
- **Transaction support**: Interactive and sequential
- **No decorators**: Plain TypeScript types (simpler than TypeORM)
- **Database introspection**: Generate schema from existing database

**Trade-offs**:

- **External dependency**: Prisma (large: 20MB binary)
- **Build step required**: Must run `prisma generate` after schema changes
- **Query limitations**: Some complex queries require raw SQL
- **Migration control**: Less control than TypeORM migrations

**When to use Prisma**:

- New projects (schema-first development)
- Want maximum type safety (generated types)
- Prefer declarative schema over decorators
- Need migration automation

## SQL Database Progression Diagram

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph TB
    accTitle: SQL Database Progression Diagram
    accDescr: Graph with 3 nodes and 2 connections. Nodes: node-postgres raw SQL, TypeORM, Prisma. Connections: node-postgres raw SQL to TypeORM (Need type safety), node-postgres raw SQL to Prisma (Need schema-first).
    A[node-postgres raw<br/>SQL] -->|Need type safety| B[TypeORM]
    A -->|Need schema-first| C[Prisma]

    A:::standard
    B:::framework
    C:::framework

    classDef standard fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef framework fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px

    subgraph Standard[" Standard Library "]
        A
    end

    subgraph Production["Production<br/>Frameworks"]
        B
        C
    end

    classDef pal-CC78BC fill:#CC78BC,stroke:#0173B2,color:#000000,stroke-width:3px
    class Standard pal-CC78BC
    classDef pal-CC78BC-2 fill:#CC78BC,stroke:#029E73,color:#000000,stroke-width:3px
    class Production pal-CC78BC-2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Production Best Practices

### Connection Pooling

Configure connection pools for optimal performance.

**Pattern** (TypeORM):

```typescript
const AppDataSource = new DataSource({
  type: "postgres",
  // ... connection config
  poolSize: 20,
  // => Maximum connections in pool
  // => Tune based on load (default: 10)
  extra: {
    max: 20,
    // => Max connections
    min: 5,
    // => Min idle connections
    // => Keeps connections ready
    idleTimeoutMillis: 30000,
    // => Close idle connections after 30s
    connectionTimeoutMillis: 2000,
    // => Wait 2s for connection before timeout
  },
});
```

**Pattern** (Prisma):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool configuration in URL
  // postgresql://user:password@localhost:5432/myapp?pool_timeout=10&connection_limit=20
}
```

### Query Optimization

Optimize queries to avoid N+1 problems and unnecessary data loading.

**❌ N+1 Query Problem**:

```typescript
// TypeORM: Lazy loading causes N+1
const users = await userRepository.find();
// => SELECT * FROM users (1 query)

for (const user of users) {
  console.log(user.posts);
  // => SELECT * FROM posts WHERE author_id = ? (N queries!)
  // => Total: 1 + N queries
}
```

**✅ Solution: Eager Loading**:

```typescript
// TypeORM
const users = await userRepository.find({
  relations: ["posts"],
  // => JOIN posts table
  // => Single query
});

// Prisma
const users = await prisma.user.findMany({
  include: { posts: true },
  // => Single query with JOIN
});
```

### Error Handling

Handle database errors gracefully.

**Pattern**:

```typescript
try {
  const user = await prisma.user.create({
    data: {
      name: "Alice",
      email: "duplicate@example.com",
    },
  });
} catch (error) {
  if (error.code === "P2002") {
    // => Prisma error code for unique constraint violation
    console.error("Email already exists");
    // => User-friendly error message
  } else {
    console.error("Database error:", error);
    throw error;
  }
}
```

## Trade-offs and When to Use Each

### node-postgres (Standard Library)

**Use when**:

- Simple applications (≤3 tables)
- Performance critical (ORM overhead matters)
- Complex queries (raw SQL more expressive)
- Learning SQL fundamentals

**Avoid when**:

- Need type safety (string queries prone to errors)
- Complex domain models (manual mapping tedious)
- Want automatic migrations

### TypeORM

**Use when**:

- Complex domain models (>5 entities)
- Familiar with Active Record pattern
- Need decorator-based entities
- Want query builder for complex queries

**Avoid when**:

- Simple applications (overkill)
- Prefer schema-first development (Prisma better)
- Performance critical (raw SQL faster)

### Prisma

**Use when**:

- Starting new projects (schema-first)
- Want maximum type safety (generated types)
- Need migration automation
- Prefer declarative schema

**Avoid when**:

- Complex queries requiring raw SQL
- Large applications (20MB binary overhead)
- Need fine-grained migration control

## Common Pitfalls

### Pitfall 1: SQL Injection

**Problem**: String concatenation creates SQL injection vulnerability.

**Solution**: Always use parameterized queries.

```typescript
// ❌ BAD: SQL injection
const email = req.query.email;
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
// => Vulnerable: email = "'; DROP TABLE users; --"

// ✅ GOOD: Parameterized query
await pool.query("SELECT * FROM users WHERE email = $1", [email]);
// => Safe: Parameters escaped automatically
```

### Pitfall 2: N+1 Queries

**Problem**: Lazy loading causes N+1 query problem.

**Solution**: Use eager loading (relations/include).

```typescript
// ❌ BAD: N+1 queries
const users = await userRepository.find();
for (const user of users) {
  console.log(user.posts); // N queries
}

// ✅ GOOD: Single query with JOIN
const users = await userRepository.find({ relations: ["posts"] });
```

### Pitfall 3: Connection Leaks

**Problem**: Forgetting to release connections exhausts pool.

**Solution**: Always release connections (use try/finally).

```typescript
// ❌ BAD: Connection leak
const client = await pool.connect();
await client.query("SELECT * FROM users");
// => Connection never released!

// ✅ GOOD: Always release
const client = await pool.connect();
try {
  await client.query("SELECT * FROM users");
} finally {
  client.release(); // Always release
}
```

### Pitfall 4: Synchronize in Production

**Problem**: TypeORM `synchronize: true` drops/creates tables in production.

**Solution**: Never use synchronize in production, use migrations.

```typescript
// ❌ BAD: Data loss in production
synchronize: true  // Drops and recreates tables!

// ✅ GOOD: Use migrations
synchronize: process.env.NODE_ENV === 'development',
migrations: ['src/migrations/*.ts']
```

## Summary

SQL databases provide durable, ACID-compliant storage for application data. Raw SQL with node-postgres requires manual mapping and lacks type safety, while ORMs (TypeORM, Prisma) provide type safety, migrations, and relation support.

**Progression path**:

1. **Learn with node-postgres**: Understand SQL fundamentals
2. **Production with TypeORM**: Decorator-based entities and query builder
3. **Modern apps with Prisma**: Schema-first development and generated types

**Production checklist**:

- ✅ Connection pooling configured (20-50 connections)
- ✅ Migrations automated (never synchronize in prod)
- ✅ Parameterized queries (prevent SQL injection)
- ✅ Eager loading (avoid N+1 queries)
- ✅ Error handling (unique constraints, foreign keys)
- ✅ Indexes on foreign keys (query performance)
- ✅ Connection release (prevent leaks)

Choose SQL framework based on project needs: TypeORM for complex queries, Prisma for type safety and migrations.
