---
title: "Intermediate"
weight: 10000002
date: 2026-03-19T10:00:00+07:00
draft: false
description: "Master TanStack Start production patterns through 28 annotated examples covering server functions, mutations, authentication, sessions, middleware, TanStack Query, optimistic updates, and testing"
tags: ["tanstack-start", "tanstack-router", "typescript", "server-functions", "authentication", "tanstack-query", "tutorial", "by-example", "intermediate"]
---

This intermediate tutorial covers production-level TanStack Start patterns through 28 heavily annotated examples (28-55). Each example maintains 1-2.25 comment lines per code line.

## Prerequisites

Before starting, complete the [Beginner examples](/en/learn/software-engineering/platform-web/tools/fe-tanstack-start/by-example/beginner) or ensure you understand:

- File-based routing with `createFileRoute`
- Loaders and `useLoaderData`
- Error and not-found boundaries
- Navigation with `Link` and `useNavigate`

## Group 10: Server Functions

### Example 28: Basic `createServerFn`

`createServerFn` creates a type-safe server-only function callable from the client. The function runs exclusively on the server and its return value is serialized and sent to the client.

```typescript
// app/server/greet.ts
// => Server function file: can live anywhere, but app/server/ is idiomatic
import { createServerFn } from '@tanstack/start'
// => createServerFn: factory for server-only callable functions
// => Functions defined here NEVER run in the browser
// => Safe to use database clients, secret env vars, file system

export const getGreeting = createServerFn()
  // => createServerFn(): creates a server function builder
  .handler(async () => {
    // => handler: the actual server logic function
    // => Runs only on the server (Node.js/Bun/edge)
    // => Can access: process.env, file system, databases

    const now = new Date()
    // => Server-side date (accurate, not client time)
    const hour = now.getHours()
    // => hour: 0-23 (server timezone)

    const greeting =
      hour < 12
        ? 'Good morning'
        : hour < 18
          ? 'Good afternoon'
          : 'Good evening'
    // => Conditional greeting based on time of day
    // => "Good morning" (0-11), "Good afternoon" (12-17), "Good evening" (18-23)

    return { greeting, serverTime: now.toISOString() }
    // => Return value: serialized and sent to client
    // => { greeting: "Good afternoon", serverTime: "2026-03-19T08:00:00Z" }
  })
// => getGreeting: callable server function
// => getGreeting(): returns Promise<{ greeting: string, serverTime: string }>

// Usage in a loader or component:
// const result = await getGreeting()
// result.greeting === "Good afternoon"
// result.serverTime === "2026-03-19T08:00:00Z"
```

**Key Takeaway**: `createServerFn().handler(fn)` creates a function that always runs on the server. Call it from loaders, other server functions, or client event handlers - it's always executed server-side.

**Why It Matters**: Server functions replace the manual API route pattern where you write `GET /api/greeting`, parse the request, and return JSON. With `createServerFn`, you write a typed function and call it directly. The network boundary is invisible - TypeScript types flow end-to-end, no request/response parsing required. Production applications benefit from fewer files, fewer HTTP roundtrip abstractions, and automatic type safety for every server interaction.

### Example 29: Server Function with Input Validation

Server functions accept typed inputs using the `.validator()` method. Inputs are validated before the handler runs, providing safety for user-submitted data.

```typescript
// app/server/products.ts
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
// => zod: runtime schema validation (npm install zod)

const createProductSchema = z.object({
  // => Define expected input shape for createProduct
  name: z.string().min(1).max(100),
  // => name: required string, 1-100 chars
  price: z.number().positive(),
  // => price: positive number (>0)
  category: z.enum(['electronics', 'clothing', 'food', 'other']),
  // => category: must be one of these four values
})

export const createProduct = createServerFn()
  .validator(createProductSchema)
  // => validator: runs zod schema parse BEFORE handler
  // => Invalid data throws ZodError → client receives validation error
  // => Valid data is passed to handler as typed parameter

  .handler(async ({ data }) => {
    // => data: validated and typed by zod schema
    // => data.name: string (1-100 chars, guaranteed by validator)
    // => data.price: positive number (guaranteed)
    // => data.category: "electronics" | "clothing" | "food" | "other"

    // Simulated database insert
    const newProduct = {
      id: Math.floor(Math.random() * 1000),
      // => id: random integer (real app: database-generated UUID)
      ...data,
      // => Spread validated data into the new product object
      createdAt: new Date().toISOString(),
      // => createdAt: ISO timestamp for the record
    }

    console.log('Product created on server:', newProduct)
    // => Server log: only visible in server console, not browser
    // => Safe for sensitive data logging

    return { success: true, product: newProduct }
    // => Return success response with created product
    // => { success: true, product: { id: 423, name: "Widget", price: 29.99, ... } }
  })

// Usage:
// await createProduct({ data: { name: "Widget", price: 29.99, category: "electronics" } })
// => data wrapper: required by TanStack Start createServerFn calling convention
```

**Key Takeaway**: `.validator(schema)` validates input before the handler runs. The `data` parameter in the handler is the validated, typed result - runtime guarantees match TypeScript types.

**Why It Matters**: Server-side validation is non-negotiable for security. Client-side validation is a UX improvement; server-side validation is a security requirement - malicious users bypass client validation trivially. TanStack Start's `.validator()` ensures that even direct API calls (via curl or malicious scripts) cannot bypass validation. The zod integration means you define validation once and get both TypeScript types and runtime checking, eliminating the common drift between types and runtime behavior.

### Example 30: Calling Server Functions from Loaders

Server functions compose naturally with loaders. Call them inside loader functions to fetch data that requires server-only resources like databases or private API keys.

```typescript
// app/server/users.ts
import { createServerFn } from '@tanstack/start'

// Simulated database
const db = {
  users: [
    { id: 1, name: 'Zainab', email: 'z@example.com', role: 'admin' },
    { id: 2, name: 'Hassan', email: 'h@example.com', role: 'user' },
    { id: 3, name: 'Nadia', email: 'n@example.com', role: 'user' },
  ],
}
// => db.users: in-memory data (real app: PostgreSQL, MongoDB, etc.)

export const getUsers = createServerFn().handler(async () => {
  // => Server function: accesses simulated database
  // => In production: would use: await db.query('SELECT * FROM users')
  // => db connection string from process.env.DATABASE_URL (server-only)

  return db.users
  // => Returns: array of user objects
  // => [{ id: 1, name: "Zainab", ... }, ...]
})

// app/routes/admin/users.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getUsers } from '../../server/users'
// => Import server function into route file

export const Route = createFileRoute('/admin/users')({
  loader: async () => {
    const users = await getUsers()
    // => Call server function from loader
    // => During SSR: direct function call (no HTTP overhead)
    // => During client navigation: makes RPC call to server
    // => TypeScript infers: users is { id: number, name: string, email: string, role: string }[]

    return { users }
    // => Pass to component via loaderData
  },

  component: function AdminUsersPage() {
    const { users } = Route.useLoaderData()
    // => users: typed array from loader

    return (
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              {/* => "Zainab", "Hassan", "Nadia" */}
              <td>{user.email}</td>
              {/* => "z@example.com", etc. */}
              <td>{user.role}</td>
              {/* => "admin", "user" */}
            </tr>
          ))}
        </tbody>
      </table>
    )
  },
})
```

**Key Takeaway**: Server functions called from loaders benefit from SSR optimization - during server-side rendering, the call is a direct function invocation with no HTTP overhead. During client navigation, it automatically becomes an RPC call.

**Why It Matters**: The dual-mode behavior of server functions in loaders is one of TanStack Start's most powerful optimizations. During SSR, there is no HTTP roundtrip - the server calls the database directly and renders the full page. During client navigation, a minimal RPC call fetches only the new page's data. Production applications see significant performance improvements versus traditional SPAs that always make client-side API calls, especially on first page load where SSR eliminates the loading state entirely.

### Example 31: Mutations with Server Functions

Server functions that modify data (create, update, delete) are mutations. Call them from React event handlers or form submissions from client components.

```typescript
// app/server/posts.ts
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'

// Simulated post store
let posts = [
  { id: 1, title: 'First Post', content: 'Hello world' },
  { id: 2, title: 'Second Post', content: 'More content' },
]
// => In-memory store (real app: database with transactions)

export const deletePost = createServerFn()
  .validator(z.object({ id: z.number() }))
  // => Validate: id must be a number
  .handler(async ({ data }) => {
    // => data.id: validated number (e.g., 1)

    const before = posts.length
    // => before: number of posts before deletion

    posts = posts.filter((p) => p.id !== data.id)
    // => Filter out the post with matching id
    // => Immutable update: creates new array without the post

    const deleted = posts.length < before
    // => deleted: true if post was found and removed

    return { success: deleted, remainingCount: posts.length }
    // => { success: true, remainingCount: 1 }
  })

// app/routes/posts.tsx
'use client'
// => NOT needed: server function calls work from server components too
// => But if component has useState/onClick, add 'use client' boundary

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { deletePost } from '../../server/posts'

export const Route = createFileRoute('/posts')({
  component: function PostsWithDelete() {
    const [posts, setPosts] = useState([
      { id: 1, title: 'First Post' },
      { id: 2, title: 'Second Post' },
    ])
    // => Local state mirrors server state (real app: use TanStack Query)

    const handleDelete = async (id: number) => {
      // => handleDelete: async because deletePost is async
      const result = await deletePost({ data: { id } })
      // => Call server function with { data: { id: 1 } }
      // => deletePost runs on server, returns { success, remainingCount }

      if (result.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id))
        // => Update local state to reflect deletion
        // => Removes post from UI without page reload
      }
    }

    return (
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            {post.title}
            <button onClick={() => handleDelete(post.id)}>
              {/* => onClick: triggers server mutation */}
              Delete
            </button>
          </li>
        ))}
      </ul>
    )
  },
})
```

**Key Takeaway**: Mutation server functions run on the server and return results. Call them from client event handlers and update local state or invalidate queries based on the response.

**Why It Matters**: Server mutations via `createServerFn` eliminate the need for REST API endpoints for every data modification. The type-safe calling convention means a wrong parameter name or missing field is a TypeScript error, not a 400 Bad Request at runtime. Production CRUD applications (admin panels, content management, e-commerce) benefit from the reduced surface area - no API route files, no request parsing, no response serialization boilerplate.

## Group 11: Form Handling

### Example 32: Form Submission with Server Functions

HTML forms can submit to server functions, providing progressive enhancement - forms work without JavaScript enabled.

```tsx
// app/routes/contact.tsx
// => Contact form that submits to a server function
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'

const submitContact = createServerFn()
  .validator(z.object({
    name: z.string().min(1, 'Name is required'),
    // => name: required, min 1 char, error message for validation failure
    email: z.string().email('Valid email required'),
    // => email: must be valid email format
    message: z.string().min(10, 'Message must be at least 10 characters'),
    // => message: minimum 10 characters
  }))
  .handler(async ({ data }) => {
    // => data: { name, email, message } - all validated

    console.log('Contact form submitted:', data.email)
    // => Server-side logging (not visible to user)
    // => Real app: send email, save to DB, notify Slack

    return { success: true, message: 'Thank you for your message!' }
    // => Success response with user-facing message
  })

export const Route = createFileRoute('/contact')({
  component: function ContactPage() {
    const [status, setStatus] = useState<string>('')
    // => status: feedback message for user ("" | "Thank you..." | "Error...")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      // => Prevent default: handle submission via JavaScript

      const formData = new FormData(e.currentTarget)
      // => Extract all form field values

      try {
        const result = await submitContact({
          data: {
            name: formData.get('name') as string,
            // => Extract 'name' field value (string)
            email: formData.get('email') as string,
            // => Extract 'email' field value (string)
            message: formData.get('message') as string,
            // => Extract 'message' field value (string)
          },
        })
        setStatus(result.message)
        // => Update status with success message
        // => status: "Thank you for your message!"
      } catch (error) {
        setStatus('Submission failed. Please try again.')
        // => Show error feedback on failure
      }
    }

    return (
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Your name" required />
        {/* => name="name": matches formData.get('name') */}
        <input name="email" type="email" placeholder="Email" required />
        <textarea name="message" placeholder="Message" rows={5} />
        <button type="submit">Send Message</button>
        {status && <p>{status}</p>}
        {/* => Conditional render: show status if truthy */}
        {/* => Renders: "Thank you for your message!" */}
      </form>
    )
  },
})

// Fix missing useState import:
import { useState } from 'react'
```

**Key Takeaway**: Forms submit to server functions by extracting `FormData` and passing values as typed objects. The server function validates and processes the data, returning structured feedback.

**Why It Matters**: Server function-based form handling unifies validation and processing in one place. Both frontend field validation (via zod error messages) and backend processing (database writes, email sending) use the same schema. Production contact forms, user registration flows, and settings pages benefit from this colocation. When requirements change (adding a new field), the schema, handler, and form update together rather than separately across frontend validation, API route, and backend logic.

### Example 33: Form State with `useActionState`

React's `useActionState` hook manages form submission state (pending, error, success) declaratively. It works well with TanStack Start server functions for clean form UX.

```tsx
// app/routes/register.tsx
// => Registration form using useActionState for state management
'use client'
import { createFileRoute } from '@tanstack/react-router'
import { useActionState } from 'react'
// => useActionState: React 19 hook for form action state management
// => (React 18: useFormState from react-dom, deprecated in 19)
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'

const registerUser = createServerFn()
  .validator(z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(8),
  }))
  .handler(async ({ data }) => {
    // => Validate username uniqueness, hash password, insert to DB
    // => Simulated: just return success
    return { success: true, userId: 'user_' + data.username }
    // => { success: true, userId: "user_alice" }
  })

type FormState = {
  error?: string
  success?: string
}
// => FormState: possible states for the form

export const Route = createFileRoute('/register')({
  component: function RegisterPage() {
    const [state, formAction, isPending] = useActionState(
      // => useActionState: manages form action state
      async (prevState: FormState, formData: FormData): Promise<FormState> => {
        // => Action function: called on form submission
        // => prevState: previous form state (initial: {})
        // => formData: the form's data
        try {
          await registerUser({
            data: {
              username: formData.get('username') as string,
              email: formData.get('email') as string,
              password: formData.get('password') as string,
            },
          })
          return { success: 'Account created! Welcome aboard.' }
          // => Return success state: { success: "Account created!..." }
        } catch (e) {
          return { error: 'Registration failed. Please try again.' }
          // => Return error state: { error: "Registration failed..." }
        }
      },
      {} as FormState,
      // => Initial state: empty object (no error, no success)
    )
    // => state: current FormState ({ error? | success? })
    // => formAction: function to pass to form's action prop
    // => isPending: true while action is executing

    return (
      <form action={formAction}>
        {/* => action={formAction}: connects form to useActionState */}
        <input name="username" placeholder="Username" />
        <input name="email" type="email" placeholder="Email" />
        <input name="password" type="password" placeholder="Password" />
        <button type="submit" disabled={isPending}>
          {/* => disabled: prevents double-submit while pending */}
          {isPending ? 'Creating account...' : 'Register'}
          {/* => Text changes during submission */}
        </button>
        {state.error && <p style={{ color: 'red' }}>{state.error}</p>}
        {/* => Show error message if present */}
        {state.success && <p style={{ color: 'green' }}>{state.success}</p>}
        {/* => Show success message if present */}
      </form>
    )
  },
})
```

**Key Takeaway**: `useActionState` manages form pending, error, and success states declaratively. The form `action` prop connects to the state machine, automatically setting `isPending` during submission.

**Why It Matters**: Managing form submission state manually (pending boolean, error string, success flag) requires boilerplate `useState` hooks and careful cleanup logic. `useActionState` encapsulates this state machine, preventing issues like double-submission, stale error messages after success, and race conditions between multiple form submissions. Production registration, login, and settings forms benefit from the cleaner state management that `useActionState` provides, with fewer bugs and less code.

## Group 12: Authentication and Sessions

### Example 34: Session-Based Authentication

TanStack Start provides request-level session management through cookies. Use `getCookie`/`setCookie` from `@tanstack/start/server` in server functions.

```typescript
// app/server/auth.ts
// => Authentication server functions using cookie-based sessions
import { createServerFn } from '@tanstack/start'
import { getCookie, setCookie, deleteCookie } from 'vinxi/http'
// => vinxi/http: HTTP utilities from Vinxi (TanStack Start's build tool)
// => getCookie: read a cookie value by name
// => setCookie: set a cookie with options
// => deleteCookie: remove a cookie

import { z } from 'zod'

// Simulated user database
const users = [
  { id: 1, email: 'admin@example.com', password: 'hashed_pw', role: 'admin' },
  { id: 2, email: 'user@example.com', password: 'hashed_pw2', role: 'user' },
]
// => Real app: query PostgreSQL with bcrypt password hashing

export const login = createServerFn()
  .validator(z.object({
    email: z.string().email(),
    password: z.string(),
  }))
  .handler(async ({ data }) => {
    const user = users.find((u) => u.email === data.email)
    // => Find user by email
    // => user: { id, email, password, role } or undefined

    if (!user || user.password !== data.password) {
      // => Invalid credentials: email not found or password mismatch
      // => Real app: bcrypt.compare(data.password, user.password)
      throw new Error('Invalid email or password')
      // => Thrown error propagated to client as server function error
    }

    setCookie('session', JSON.stringify({ userId: user.id, role: user.role }), {
      // => setCookie: set 'session' cookie with user data
      // => Real app: use signed/encrypted session tokens (jose, iron-session)
      httpOnly: true,
      // => httpOnly: NOT accessible via JavaScript (XSS protection)
      secure: process.env.NODE_ENV === 'production',
      // => secure: HTTPS only in production
      sameSite: 'lax',
      // => sameSite: 'lax' prevents CSRF for most cases
      maxAge: 60 * 60 * 24 * 7,
      // => maxAge: 7 days in seconds (604800)
    })

    return { success: true, role: user.role }
    // => Return minimal info to client (not the full user object with hash)
  })

export const logout = createServerFn().handler(async () => {
  deleteCookie('session')
  // => Remove the session cookie
  // => Browser deletes the cookie on receiving response
  return { success: true }
  // => Confirm logout success
})

export const getSession = createServerFn().handler(async () => {
  const sessionCookie = getCookie('session')
  // => Read 'session' cookie value
  // => sessionCookie: '{"userId":1,"role":"admin"}' or undefined

  if (!sessionCookie) return null
  // => No cookie: not authenticated

  return JSON.parse(sessionCookie) as { userId: number; role: string }
  // => Parse JSON: { userId: 1, role: "admin" }
  // => Real app: verify JWT signature or database session
})
```

**Key Takeaway**: `setCookie`, `getCookie`, and `deleteCookie` from `vinxi/http` manage session cookies in server functions. Set `httpOnly: true` and `secure: true` for production security.

**Why It Matters**: Cookie-based authentication is the most practical approach for full-stack TanStack Start applications. HTTP-only cookies prevent JavaScript-based XSS theft of session tokens. The `sameSite: lax` prevents CSRF attacks for GET requests while still allowing cross-origin form submissions. Production authentication requires encrypted session values (never plain JSON as shown here) using libraries like `iron-session` or JWT with `jose`. These patterns protect user accounts from the most common web security vulnerabilities.

### Example 35: Route-Level Auth Guard

Combine `getSession` with `beforeLoad` to protect routes. The guard runs on both server (SSR) and client (navigation), ensuring consistent authentication.

```typescript
// app/routes/_authenticated.tsx
// => Pathless layout route that protects all children
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getSession } from '../server/auth'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // => beforeLoad: runs before loader and component
    // => location.href: current URL (for post-login redirect)

    const session = await getSession()
    // => Call server function to check session
    // => During SSR: direct call (no HTTP)
    // => During navigation: RPC call to server

    if (!session) {
      throw redirect({
        to: '/login',
        // => Redirect to login
        search: { redirect: location.href },
        // => Pass current URL for post-login redirect
        // => e.g., /login?redirect=%2Fdashboard
      })
    }

    return { session }
    // => Return session to make available in context
    // => Child routes can access: context.session
  },

  component: function AuthenticatedLayout() {
    return (
      <div>
        <header>
          <span>Authenticated Area</span>
          {/* => Header visible on all protected pages */}
        </header>
        <Outlet />
        {/* => Protected child routes render here */}
      </div>
    )
  },
})

// app/routes/_authenticated/dashboard.tsx
// => Protected dashboard: inherits auth guard from parent
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: ({ context }) => {
    // => context includes { session } from _authenticated's beforeLoad
    const session = context as { session: { userId: number; role: string } }
    return { userId: session.session.userId }
    // => Pass userId to component
  },
  component: function DashboardPage() {
    const { userId } = Route.useLoaderData()
    return <h1>Dashboard for user {userId}</h1>
    // => Renders: "Dashboard for user 1"
  },
})
```

**Key Takeaway**: Pathless layout routes with `beforeLoad` guards protect entire sections of an application. Children inherit the guard without needing their own auth checks.

**Why It Matters**: Centralizing auth guards in a layout route prevents security gaps that occur when guards are added per-component. A new route added under `_authenticated/` is automatically protected without any additional configuration. This "secure by default" architecture is essential for GDPR-compliant applications where accidentally exposing user data is a regulatory risk. The redirect includes the current URL so users return to their intended destination after login - a critical UX detail that reduces frustration.

### Example 36: Role-Based Access Control

Extend the auth pattern with role checks in `beforeLoad` to restrict specific routes to users with required permissions.

```typescript
// app/routes/_admin.tsx
// => Admin-only pathless layout route
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getSession } from '../server/auth'

export const Route = createFileRoute('/_admin')({
  beforeLoad: async () => {
    const session = await getSession()
    // => Get current session

    if (!session) {
      throw redirect({ to: '/login' })
      // => Not logged in: redirect to login
    }

    if (session.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
      // => Logged in but not admin: redirect to dashboard
      // => Avoid showing 403 error to regular users (confusing UX)
    }

    return { session }
    // => Admin confirmed: session available in child context
  },

  component: function AdminLayout() {
    return (
      <div className="admin-shell">
        <aside>
          <nav>
            <ul>
              <li>Users</li>
              {/* => Admin-only navigation items */}
              <li>Reports</li>
              <li>Settings</li>
            </ul>
          </nav>
        </aside>
        <main>
          <Outlet />
          {/* => Admin pages render here */}
        </main>
      </div>
    )
  },
})

// app/routes/_admin/users.tsx
// => Admin user management (inherits admin guard from _admin.tsx)
export const Route = createFileRoute('/_admin/users')({
  component: function AdminUsersPage() {
    return <h1>User Management</h1>
    // => Reachable only if role === "admin"
    // => Non-admins redirected before this renders
  },
})
```

**Key Takeaway**: Nested pathless layout routes compose auth guards. `_admin.tsx` checks authentication AND admin role, protecting all its children with both requirements.

**Why It Matters**: Role-based access control implemented at the route level creates a declarative security model that is easy to audit and maintain. The alternative - per-component role checks - requires reviewing every component to understand the application's access control policy. Layout-based RBAC means the security model lives in the route tree, visible at a glance. For compliance purposes (SOC 2, ISO 27001), being able to point to a single place where admin access is enforced is a significant operational advantage.

## Group 13: Middleware

### Example 37: Creating Middleware with `createMiddleware`

TanStack Start middleware intercepts server function calls to add cross-cutting concerns like logging, auth verification, and request enrichment.

```typescript
// app/middleware/logging.ts
// => Middleware for request logging
import { createMiddleware } from '@tanstack/start'
// => createMiddleware: factory for server-side middleware

export const loggingMiddleware = createMiddleware().server(
  // => .server(): the middleware function runs on server only
  async ({ next, data }) => {
    // => next: call the next middleware or handler
    // => data: the input data for the server function

    const startTime = Date.now()
    // => startTime: timestamp before handler runs

    console.log('[REQUEST]', new Date().toISOString(), 'data:', data)
    // => Log request with timestamp and input data
    // => Only visible in server console

    const result = await next()
    // => next(): calls the next middleware/handler
    // => Await: wait for handler to complete

    const duration = Date.now() - startTime
    // => duration: milliseconds the handler took

    console.log('[RESPONSE]', `${duration}ms`)
    // => Log response duration
    // => Example: "[RESPONSE] 42ms"

    return result
    // => Return the handler's result unchanged
    // => Middleware can modify result if needed
  },
)

// Usage: attach middleware to server functions
// export const myFn = createServerFn()
//   .middleware([loggingMiddleware])
//   .handler(async () => { ... })
// => loggingMiddleware runs before handler, logs request/response
```

**Key Takeaway**: `createMiddleware().server(fn)` creates server-side middleware. The `next()` function delegates to the next middleware or the final handler. Return `result` to pass the response through.

**Why It Matters**: Middleware enables cross-cutting concerns (logging, rate limiting, auth verification, analytics) to be written once and applied consistently across server functions. Without middleware, every server function that needs logging must manually add log statements, creating inconsistency and maintenance burden. Production applications use middleware to attach request IDs for distributed tracing, verify authentication before any handler runs, and collect performance metrics in a standardized format.

### Example 38: Auth Middleware for Server Functions

Create authentication middleware that verifies session cookies before allowing server function execution. Apply it to sensitive server functions.

```typescript
// app/middleware/auth.ts
// => Authentication middleware for server functions
import { createMiddleware } from '@tanstack/start'
import { getCookie } from 'vinxi/http'

export const requireAuth = createMiddleware().server(async ({ next }) => {
  // => requireAuth: middleware that verifies authentication
  // => No data parameter: auth check is input-independent

  const sessionCookie = getCookie('session')
  // => Read session cookie from the request
  // => sessionCookie: JSON string or undefined

  if (!sessionCookie) {
    throw new Error('Authentication required')
    // => Throw: stops execution, error sent to client
    // => Client should handle this as "not authenticated"
  }

  let session: { userId: number; role: string }
  try {
    session = JSON.parse(sessionCookie)
    // => Parse session data
    // => session: { userId: 1, role: "admin" }
  } catch {
    throw new Error('Invalid session')
    // => Malformed cookie: treat as unauthenticated
  }

  const result = await next({ context: { session } })
  // => Pass session in context to the handler
  // => context.session available in handler via { context }

  return result
  // => Return handler result
})

// Usage in a server function:
// export const getAdminData = createServerFn()
//   .middleware([requireAuth])
//   .handler(async ({ context }) => {
//     const { session } = context
//     // => session: { userId: 1, role: "admin" } (from middleware)
//     if (session.role !== 'admin') throw new Error('Forbidden')
//     return { data: 'sensitive admin data' }
//   })
```

**Key Takeaway**: Auth middleware extracts and validates the session before the handler runs, injecting the session object into context. Handlers access it via the `context` parameter.

**Why It Matters**: Auth middleware enforces authentication at the server function level, adding defense-in-depth beyond route guards. Route guards (in `beforeLoad`) protect page navigation, but server functions can be called directly via HTTP. Middleware ensures that even direct API calls without going through the router are authenticated. This two-layer protection (route guard + server function middleware) is the security architecture used by well-designed production applications handling sensitive data.

## Group 14: TanStack Query Integration

### Example 39: Setting Up TanStack Query

TanStack Query integrates with TanStack Start to provide client-side data caching, background refetching, and stale-while-revalidate behavior.

```typescript
// app/router.tsx (updated with QueryClient)
import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
// => QueryClient: manages cache, background fetching, and state
// => npm install @tanstack/react-query

import { routeTree } from './routeTree.gen'

export function createMyRouter() {
  const queryClient = new QueryClient({
    // => Create QueryClient instance per router creation
    // => Per-request in SSR, once on client
    defaultOptions: {
      queries: {
        // => Default options for all queries
        staleTime: 1000 * 60 * 5,
        // => staleTime: 5 minutes before considering data stale
        // => Stale data shows immediately, background refetch triggers
        gcTime: 1000 * 60 * 10,
        // => gcTime (garbage collection): remove unused cache after 10 min
      },
    },
  })
  // => queryClient: cache and configuration for all useQuery hooks

  return createRouter({
    routeTree,
    context: { queryClient },
    // => Inject queryClient into router context
    // => Accessible in loaders: ({ context }) => context.queryClient
    defaultPreload: 'intent',
  })
}

// app/routes/__root.tsx (updated with QueryClientProvider)
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
// => QueryClientProvider: makes queryClient available to all components

interface RouterContext {
  queryClient: QueryClient
  // => Router context type includes queryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // => createRootRouteWithContext: typed root route with context
  component: function RootLayout({ useRouteContext }) {
    const { queryClient } = Route.useRouteContext()
    // => Access queryClient from router context

    return (
      <QueryClientProvider client={queryClient}>
        {/* => Provide queryClient to all descendant components */}
        <html lang="en">
          <body>
            <Outlet />
          </body>
        </html>
      </QueryClientProvider>
    )
  },
})
```

**Key Takeaway**: Inject `QueryClient` into the router context and wrap the root layout with `QueryClientProvider`. This makes TanStack Query available to all components and enables loader-query coordination.

**Why It Matters**: TanStack Query solves client-side data synchronization: background refetching, stale-while-revalidate, cache invalidation after mutations, and optimistic updates. Without it, applications manually manage loading/error states, duplicate data fetching, and cache staleness. The integration with TanStack Start's router context enables loaders to prefetch queries and components to use cached data without network roundtrips. This combination delivers the performance of SSR with the interactivity of client-side data management.

### Example 40: `useQuery` with Prefetching in Loaders

Loaders can prefetch TanStack Query data so components receive already-cached results. This eliminates client-side loading states for initial page loads.

```typescript
// app/server/products.ts (updated)
import { createServerFn } from '@tanstack/start'

export const fetchProducts = createServerFn().handler(async () => {
  const res = await fetch('https://fakestoreapi.com/products?limit=10')
  // => Fetch 10 products from API
  return res.json() as Promise<Array<{ id: number; title: string; price: number }>>
  // => Returns typed product array
})

// app/routes/products.tsx (with TanStack Query integration)
import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useQuery } from '@tanstack/react-query'
// => queryOptions: creates reusable query configuration objects
// => useQuery: hook to read/manage cached query data
import { fetchProducts } from '../server/products'

const productsQueryOptions = queryOptions({
  // => queryOptions: defines a reusable query config
  queryKey: ['products'],
  // => queryKey: unique identifier for this query's cache slot
  // => ['products']: cache key is an array (enables granular invalidation)
  queryFn: () => fetchProducts(),
  // => queryFn: function that fetches the data
  // => Returns: Promise<Product[]>
})
// => productsQueryOptions: reusable config (use in loader + useQuery)

export const Route = createFileRoute('/products')({
  loader: ({ context }) => {
    return context.queryClient.prefetchQuery(productsQueryOptions)
    // => prefetchQuery: fetches and caches the query during SSR/navigation
    // => If already in cache and fresh: no-op (uses cached data)
    // => Returns Promise<void>: resolves when prefetch complete
  },
  // => By the time the component renders, query is already in cache

  component: function ProductsPage() {
    const { data: products = [], isLoading } = useQuery(productsQueryOptions)
    // => useQuery: reads from cache (prefetched by loader)
    // => data: Product[] (from cache, not a new fetch)
    // => isLoading: false (data already in cache from loader)
    // => data defaults to [] if cache miss

    if (isLoading) return <p>Loading...</p>
    // => Fallback: shown only if cache miss (e.g., direct URL visit without SSR)

    return (
      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.title} - ${p.price}</li>
          // => Renders cached product list immediately
        ))}
      </ul>
    )
  },
})
```

**Key Takeaway**: Prefetch queries in the loader using `context.queryClient.prefetchQuery(queryOptions)`. The component's `useQuery` reads from the already-populated cache, showing data immediately with `isLoading: false`.

**Why It Matters**: The loader-prefetch + useQuery pattern combines SSR performance with client-side cache benefits. On first load, the loader ensures data is available before the component renders. On subsequent navigation, TanStack Query serves cached data instantly while optionally refetching in the background. On mutation, `queryClient.invalidateQueries(['products'])` causes automatic refetch of all components showing product data. This architecture handles the full lifecycle of server data in production applications.

### Example 41: Optimistic Updates

Optimistic updates modify the UI immediately on mutation, then reconcile with the server response. This creates instant feedback for user actions.

```typescript
// app/routes/todos.tsx
// => Todo list with optimistic delete
'use client'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient, queryOptions } from '@tanstack/react-query'
// => useMutation: hook for data modifications with callbacks
// => useQueryClient: access the QueryClient from components

import { createServerFn } from '@tanstack/start'

interface Todo {
  id: number
  text: string
  done: boolean
}

// Simulated server state
let todos: Todo[] = [
  { id: 1, text: 'Learn TanStack Start', done: false },
  { id: 2, text: 'Build an app', done: false },
]

const getTodos = createServerFn().handler(async () => todos)
const deleteTodo = createServerFn()
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    todos = todos.filter((t) => t.id !== id)
    return { success: true }
  })

const todosQueryOptions = queryOptions({ queryKey: ['todos'], queryFn: getTodos })

export const Route = createFileRoute('/todos')({
  loader: ({ context }) => context.queryClient.prefetchQuery(todosQueryOptions),

  component: function TodosPage() {
    const queryClient = useQueryClient()
    // => queryClient: access the shared QueryClient

    const { data: todos = [] } = useQuery(todosQueryOptions)
    // => todos: current cached todo list

    const deleteMutation = useMutation({
      mutationFn: (id: number) => deleteTodo({ data: id }),
      // => mutationFn: calls deleteTodo server function

      onMutate: async (id) => {
        // => onMutate: called BEFORE mutationFn (optimistic update hook)
        await queryClient.cancelQueries({ queryKey: ['todos'] })
        // => Cancel in-progress fetches to prevent overwrite

        const previous = queryClient.getQueryData(['todos'])
        // => Snapshot current state (for rollback on error)

        queryClient.setQueryData(['todos'], (old: Todo[] = []) =>
          old.filter((t) => t.id !== id)
        )
        // => Immediately update cache: remove deleted todo
        // => UI updates BEFORE server responds (optimistic)

        return { previous }
        // => Return snapshot for use in onError
      },

      onError: (err, id, context) => {
        queryClient.setQueryData(['todos'], context?.previous)
        // => Rollback: restore previous data if mutation fails
        // => UI reverts to show the todo that failed to delete
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['todos'] })
        // => Refetch after mutation completes (success or failure)
        // => Ensures UI matches actual server state
      },
    })

    return (
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.text}
            <button onClick={() => deleteMutation.mutate(todo.id)}>
              {/* => mutate(id): triggers deleteMutation with the todo id */}
              Delete
            </button>
          </li>
        ))}
      </ul>
    )
  },
})
```

**Key Takeaway**: `onMutate` performs the optimistic update before the server responds. `onError` rolls back to the previous state on failure. `onSettled` refetches to confirm server state.

**Why It Matters**: Optimistic updates are the difference between an app that feels instant and one that feels sluggish. Waiting 200-500ms for a delete operation to complete before removing the item creates a perceived slow experience. With optimistic updates, the item disappears instantly and only reappears if the server reports an error. This pattern is used by every major social media platform and productivity tool because it dramatically improves perceived performance at minimal implementation cost.

## Group 15: Route Context and Guards

### Example 42: Route Context for Shared Services

The router context enables dependency injection - shared services (auth, analytics, feature flags) flow through the router to every loader and server function.

```typescript
// app/router.tsx (full context example)
import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'

// Simulated services
const authService = {
  getCurrentUser: async () => ({ id: 1, name: 'Yasmine', role: 'admin' }),
  // => getCurrentUser: async, returns user from session
}

const analyticsService = {
  track: (event: string, props?: Record<string, unknown>) => {
    console.log('[Analytics]', event, props)
    // => track: log analytics events
  },
}

export type RouterContext = {
  queryClient: QueryClient
  auth: typeof authService
  analytics: typeof analyticsService
}
// => RouterContext: type for all services in context

export function createMyRouter() {
  const queryClient = new QueryClient()
  return createRouter({
    routeTree,
    context: {
      queryClient,
      // => queryClient: TanStack Query cache
      auth: authService,
      // => auth: authentication service
      analytics: analyticsService,
      // => analytics: event tracking service
    } satisfies RouterContext,
    // => satisfies: TypeScript validates context matches RouterContext type
  })
}

// Usage in any route loader:
// loader: async ({ context }) => {
//   const user = await context.auth.getCurrentUser()
//   // => user: { id: 1, name: "Yasmine", role: "admin" }
//   context.analytics.track('page_view', { page: '/admin' })
//   // => Logs: "[Analytics] page_view { page: '/admin' }"
//   return { user }
// }
```

**Key Takeaway**: Inject shared services (auth, analytics, feature flags) into the router context. All loaders and `beforeLoad` functions access them via the `context` parameter without imports.

**Why It Matters**: Router context is TanStack Start's dependency injection system. Without it, every route file imports services directly, creating tight coupling and making testing difficult (you can't easily swap real services for mocks). With context injection, tests can create a router with mock services, and the routes under test use the mocks automatically. Production applications typically inject: authentication, database clients, feature flag services, analytics, and internationalization providers through context.

### Example 43: Redirects in Loaders

Loaders can redirect users based on data fetched during loading. This is useful for redirecting users who visit a page with incompatible data (e.g., visiting an old URL format).

```typescript
// app/routes/products.$productId.tsx (with redirect)
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$productId')({
  loader: async ({ params }) => {
    const response = await fetch(
      `https://fakestoreapi.com/products/${params.productId}`
    )
    // => Fetch product data

    if (response.status === 404) {
      // => Product does not exist in the database
      throw redirect({
        to: '/products',
        // => Redirect to product listing page
        search: { error: 'Product not found' },
        // => Pass error message as search param
        // => URL: /products?error=Product+not+found
      })
      // => throw redirect: stops loader, triggers navigation
    }

    const product = await response.json()
    // => product: the fetched product object

    if (product.category === 'discontinued') {
      // => Product exists but is discontinued
      throw redirect({
        to: '/products/$productId',
        params: { productId: product.successorId },
        // => Redirect to the successor product
        replace: true,
        // => replace: replaces history entry (back button skips this)
      })
    }

    return { product }
    // => Active product: return data for component
  },

  component: function ProductDetailPage() {
    const { product } = Route.useLoaderData()
    return <h1>{product.title}</h1>
    // => Renders only for active, non-discontinued products
  },
})
```

**Key Takeaway**: `throw redirect()` in a loader redirects based on loaded data. Use `replace: true` to skip the redirected-from URL in browser history.

**Why It Matters**: Data-driven redirects handle real-world data evolution - when product URLs change, when content is moved, or when deprecated API versions redirect to current ones. The `replace: true` option prevents infinite-loop-like back-button behavior where navigating back keeps triggering the same redirect. Production applications use loader-based redirects for URL canonicalization, A/B test traffic routing, and progressive feature rollouts based on user segments.

## Group 16: API Routes

### Example 44: HTTP API Routes

TanStack Start supports HTTP API routes alongside UI routes. Create them in `app/routes/api/` with `createAPIFileRoute`.

```typescript
// app/routes/api/health.ts
// => API route: returns JSON, no HTML
import { createAPIFileRoute } from '@tanstack/start/api'
// => createAPIFileRoute: factory for HTTP API endpoints
// => Similar to createFileRoute but for pure HTTP handlers

export const APIRoute = createAPIFileRoute('/api/health')({
  // => '/api/health': URL path for this endpoint
  // => Convention: API routes live under /api/

  GET: async ({ request }) => {
    // => GET: handler for HTTP GET requests
    // => request: standard Request object (Fetch API)

    const status = {
      status: 'ok',
      // => status: service health indicator
      timestamp: new Date().toISOString(),
      // => timestamp: current server time ISO string
      version: process.env.APP_VERSION ?? '1.0.0',
      // => version: from env var or default
      // => process.env.APP_VERSION: server-only env variable
    }
    // => status: { status: "ok", timestamp: "2026-03-19T...", version: "1.0.0" }

    return Response.json(status, { status: 200 })
    // => Response.json: creates JSON Response
    // => status: 200 OK
    // => Content-Type: application/json (set automatically)
    // => Body: { "status": "ok", "timestamp": "...", "version": "1.0.0" }
  },
})

// app/routes/api/products.ts
// => CRUD API routes for products
export const APIRoute2 = createAPIFileRoute('/api/products')({
  GET: async ({ request }) => {
    // => GET /api/products: list all products
    const url = new URL(request.url)
    // => Parse full URL for query parameters
    const limit = Number(url.searchParams.get('limit') ?? '10')
    // => limit: number from ?limit= param, default 10

    const products = Array.from({ length: limit }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      // => Simulated products (real app: database query)
    }))

    return Response.json({ products, total: products.length })
    // => Returns: { "products": [...], "total": 10 }
  },

  POST: async ({ request }) => {
    // => POST /api/products: create a new product
    const body = await request.json()
    // => Parse JSON request body

    return Response.json({ created: true, product: body }, { status: 201 })
    // => 201 Created: standard status for successful creation
  },
})
```

**Key Takeaway**: `createAPIFileRoute` creates HTTP endpoints at specified paths. Export handler functions keyed by HTTP method (`GET`, `POST`, `PUT`, `DELETE`, etc.).

**Why It Matters**: API routes in TanStack Start enable the same application to serve both HTML pages and JSON APIs from a single codebase. This is valuable for applications that need to expose APIs for mobile apps, third-party integrations, or webhook endpoints alongside a web UI. The `GET /api/health` endpoint is a production requirement for load balancers and monitoring systems (Kubernetes liveness probes, uptime monitoring services, CDN health checks). Having it in the same codebase as the UI routes simplifies deployment.

## Group 17: Testing

### Example 45: Testing Loaders with Mocked Server Functions

Test route loaders by mocking server functions and calling the loader function directly. This avoids full rendering and focuses on data logic.

```typescript
// app/routes/products.test.ts
// => Unit test for the products route loader
import { describe, it, expect, vi, beforeEach } from 'vitest'
// => vitest: fast unit test runner compatible with TanStack Start
// => vi.fn(): create mock functions; vi.mock(): mock modules

vi.mock('../server/products', () => ({
  // => Mock the server/products module
  fetchProducts: vi.fn().mockResolvedValue([
    // => fetchProducts: mock that resolves to test data
    { id: 1, title: 'Test Widget', price: 9.99 },
    { id: 2, title: 'Test Gadget', price: 19.99 },
  ]),
}))
// => All imports of fetchProducts will use the mock

describe('Products Route Loader', () => {
  // => describe: group related tests

  it('should return products from server function', async () => {
    // => Test: loader returns expected data structure

    const { fetchProducts } = await import('../server/products')
    // => Import mocked fetchProducts

    const result = await fetchProducts()
    // => Call the mocked server function
    // => result: [{ id: 1, title: "Test Widget", price: 9.99 }, ...]

    expect(result).toHaveLength(2)
    // => Assertion: result array has 2 items
    expect(result[0].title).toBe('Test Widget')
    // => Assertion: first product title matches
    expect(result[0].price).toBe(9.99)
    // => Assertion: first product price matches
  })

  it('should handle empty product list', async () => {
    // => Test: loader handles empty response gracefully
    const { fetchProducts } = await import('../server/products')
    vi.mocked(fetchProducts).mockResolvedValueOnce([])
    // => Override mock for this test: return empty array

    const result = await fetchProducts()
    expect(result).toHaveLength(0)
    // => Empty array returned correctly
    expect(Array.isArray(result)).toBe(true)
    // => Result is still an array (not null/undefined)
  })
})
```

**Key Takeaway**: Mock server functions with `vi.mock()` to unit-test loader logic in isolation. Tests verify data transformation and error handling without real HTTP calls.

**Why It Matters**: Testable server functions are a competitive advantage of TanStack Start's architecture. Because server functions are plain async functions (not tied to HTTP routes), they compose naturally with standard unit testing tools. A test suite that runs in milliseconds catches regressions before they reach staging. Production applications with comprehensive loader tests can refactor data fetching logic confidently, knowing that type errors and behavioral regressions surface immediately in CI.

### Example 46: Testing Components with Router

Test components that use TanStack Router hooks by wrapping them in a test router. This simulates real routing context without a browser.

```typescript
// app/routes/__tests__/products.test.tsx
// => Integration test for the products page component
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
// => @testing-library/react: component rendering utilities
// => npm install @testing-library/react @testing-library/jest-dom
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
// => createMemoryHistory: in-memory URL history (no browser needed)
// => RouterProvider: provides router context to component tree
import { routeTree } from '../../routeTree.gen'

function createTestRouter(initialPath = '/') {
  // => Factory: create a configured test router
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  // => Start at specified path in memory (not actual browser URL)

  return createRouter({
    routeTree,
    // => Use real route tree (or mock it for isolation)
    history,
    // => Use memory history: no browser needed
  })
  // => Returns configured router for test use
}

describe('Products Page', () => {
  it('renders product list when loaded', async () => {
    const router = createTestRouter('/products')
    // => Create router starting at /products

    await router.load()
    // => Run loaders: wait for all loaders to complete
    // => After this: loaderData is populated

    render(<RouterProvider router={router} />)
    // => Render the router (renders matched route component)
    // => RouterProvider: makes router available to all components

    await waitFor(() => {
      expect(screen.getByRole('list')).toBeInTheDocument()
      // => Wait for the <ul> list to appear in DOM
      // => getByRole('list'): finds element with role "list" (<ul>)
    })
    // => waitFor: retries assertion until it passes or times out
  })
})
```

**Key Takeaway**: Use `createMemoryHistory` and `createRouter` to create an in-memory test router. Call `router.load()` to run loaders before rendering with `<RouterProvider>`.

**Why It Matters**: Testing components in isolation from the routing infrastructure misses a class of bugs: components that break because they assume a route context, access the wrong params, or navigate to the wrong destination. The `createMemoryHistory` + `RouterProvider` pattern provides a real router without a browser, enabling fast integration tests that verify the full component-router interaction. Production TanStack Start applications with comprehensive router tests can ship navigation changes with confidence.

## Group 18: Streaming and Suspense

### Example 47: Streaming with React Suspense

TanStack Start supports streaming SSR with React Suspense. Wrap slow sections in `<Suspense>` to stream the fast parts first and progressively load the slow parts.

```tsx
// app/routes/dashboard.tsx
// => Dashboard with streaming: fast parts load first
import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
// => Suspense: React boundary that shows fallback while children load

export const Route = createFileRoute('/dashboard')({
  component: function DashboardPage() {
    return (
      <div>
        <h1>Dashboard</h1>
        {/* => Title renders immediately (no data needed) */}

        <Suspense fallback={<p>Loading stats...</p>}>
          {/* => Suspense boundary: shows fallback while StatsWidget loads */}
          {/* => fallback: UI shown while async children are resolving */}
          <StatsWidget />
          {/* => StatsWidget: fetches data, suspends while loading */}
        </Suspense>

        <Suspense fallback={<p>Loading activity...</p>}>
          {/* => Second Suspense: independent boundary for activity feed */}
          <ActivityFeed />
          {/* => ActivityFeed: loads independently from StatsWidget */}
          {/* => Fast widget won't block slow widget */}
        </Suspense>
      </div>
    )
    // => Streaming render order:
    // => 1. <h1>Dashboard</h1> streams first (no async)
    // => 2. "Loading stats..." and "Loading activity..." show as fallbacks
    // => 3. When StatsWidget resolves: replaces its fallback
    // => 4. When ActivityFeed resolves: replaces its fallback
    // => 5. Each resolves independently (no waterfall)
  },
})

// Hypothetical async component (uses a data-fetching hook that suspends):
async function StatsWidget() {
  // => In real TanStack Start apps: use useQuery with suspense: true option
  // => Or use a custom hook that throws a Promise when not ready
  await new Promise((r) => setTimeout(r, 300))
  // => Simulated slow data fetch (300ms)
  return <div>Total Users: 1420</div>
  // => Renders after delay: "Total Users: 1420"
}

async function ActivityFeed() {
  await new Promise((r) => setTimeout(r, 600))
  // => Simulated slower data fetch (600ms)
  return <div>5 new messages today</div>
  // => Renders after delay: "5 new messages today"
}
```

**Key Takeaway**: Wrap async sections in `<Suspense>` boundaries to stream HTML progressively. Each boundary resolves independently, preventing slow sections from blocking fast ones.

**Why It Matters**: Streaming SSR fundamentally changes how web application performance is measured. Instead of waiting for all data before sending any HTML (traditional SSR), streaming sends the page shell immediately, then progressively fills in data sections as they resolve. Google's Core Web Vitals score Time to First Byte (TTFB) and First Contentful Paint (FCP) improve dramatically because users see meaningful content within milliseconds. Production dashboards with multiple data widgets benefit most - each widget streams independently, making the page feel fast even when individual queries are slow.

### Example 48: Deferred Loading with Streaming

Use `defer` in loaders to stream non-critical data sections. Critical data blocks the render; deferred data streams as it resolves.

```typescript
// app/routes/profile.tsx
// => Profile page with streaming: critical data blocks, recommendations defer
import { createFileRoute, defer } from '@tanstack/react-router'
// => defer: wrapper that marks data as streamable (non-blocking)
import { Suspense } from 'react'

export const Route = createFileRoute('/profile')({
  loader: async () => {
    const criticalData = await fetch('/api/user/profile').then((r) => r.json())
    // => await: blocks render until profile loads
    // => Critical: page title, user name - needed before first paint

    const recommendationsPromise = fetch('/api/recommendations').then((r) =>
      r.json()
    )
    // => NOT awaited: starts fetch immediately but doesn't block
    // => recommendationsPromise: pending Promise (may take 2 seconds)

    return {
      profile: criticalData,
      // => profile: awaited, available before render
      recommendations: defer(recommendationsPromise),
      // => defer(): wraps Promise for streaming
      // => Component receives a deferred value
      // => Must be awaited inside <Await> component or Suspense
    }
  },

  component: function ProfilePage() {
    const { profile, recommendations } = Route.useLoaderData()
    // => profile: immediate data (awaited in loader)
    // => recommendations: deferred Promise-like object

    return (
      <div>
        <h1>{profile.name}</h1>
        {/* => Renders immediately (profile data was awaited) */}
        <p>{profile.bio}</p>
        {/* => Bio available immediately */}

        <Suspense fallback={<p>Loading recommendations...</p>}>
          {/* => Suspense wraps deferred section */}
          <RecommendationsSection recommendations={recommendations} />
          {/* => Renders when recommendations Promise resolves */}
        </Suspense>
      </div>
    )
  },
})

// Hypothetical RecommendationsSection using Await:
// function RecommendationsSection({ recommendations }: { recommendations: DeferredData }) {
//   const data = recommendations.use()  // throws Promise if not ready (triggers Suspense)
//   return <ul>{data.map(r => <li key={r.id}>{r.title}</li>)}</ul>
// }
```

**Key Takeaway**: `defer(promise)` marks loader data as non-blocking. Critical data awaited in the loader renders immediately; deferred data streams in when ready, wrapped in `<Suspense>`.

**Why It Matters**: The defer pattern implements the progressive loading UX used by Amazon, Facebook, and Google Search. Critical page content (user name, product title, article heading) loads immediately; secondary content (recommendations, related articles, social proof) loads progressively without blocking the primary content. This pattern directly improves Core Web Vitals: LCP (Largest Contentful Paint) measures when the primary content appears, and deferring secondary content ensures LCP is not delayed by slow recommendation engines or analytics queries.

## Group 19: Additional Intermediate Patterns

### Example 49: WebSocket Integration

TanStack Start supports WebSocket connections via Vinxi's WebSocket API, enabling real-time features alongside traditional HTTP routes.

```typescript
// app/routes/api/realtime.ts
// => WebSocket endpoint for real-time updates
import { createAPIFileRoute } from '@tanstack/start/api'

export const APIRoute = createAPIFileRoute('/api/realtime')({
  GET: async ({ request }) => {
    const upgradeHeader = request.headers.get('Upgrade')
    // => Upgrade: 'websocket' if this is a WebSocket upgrade request
    // => Regular HTTP GET if Upgrade header is absent

    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
      // => 426 Upgrade Required: tell client to use WebSocket
    }

    // WebSocket handling via Vinxi (Node.js adapter):
    // This pattern varies by deployment adapter
    // Shown here conceptually - consult Vinxi docs for adapter-specific API
    return new Response(null, {
      status: 101,
      // => 101 Switching Protocols: WebSocket upgrade response
      headers: {
        Upgrade: 'websocket',
        Connection: 'Upgrade',
      },
    })
    // => 101: browser and server switch to WebSocket protocol
  },
})

// Client-side WebSocket connection in a component:
// 'use client'
// function RealtimeWidget() {
//   const [messages, setMessages] = useState<string[]>([])
//   useEffect(() => {
//     const ws = new WebSocket('ws://localhost:3000/api/realtime')
//     // => WebSocket: browser API for persistent connections
//     ws.onmessage = (event) => {
//       setMessages(prev => [...prev, event.data])
//       // => Append new message to list
//     }
//     ws.onopen = () => ws.send('Hello, server!')
//     // => Send message after connection established
//     return () => ws.close()
//     // => Cleanup: close connection when component unmounts
//   }, [])
//   return <ul>{messages.map((m, i) => <li key={i}>{m}</li>)}</ul>
// }
```

**Key Takeaway**: WebSocket endpoints use API routes with HTTP 101 upgrade responses. The specific WebSocket handler API depends on the Vinxi deployment adapter (Node.js, Bun, etc.).

**Why It Matters**: Real-time features (live notifications, collaborative editing, live dashboards, chat) require WebSocket connections. TanStack Start's API routes co-locate WebSocket endpoints with the application code, eliminating separate WebSocket server deployments. The adapter-specific implementation means the same application code can use native WebSocket APIs on Node.js, Bun, or edge runtimes, with the Vinxi adapter abstracting the differences. Production applications like customer support systems and live monitoring dashboards rely on WebSocket for sub-second update delivery.

### Example 50: Search Params for Pagination

Implement pagination using search params with TanStack Router's `validateSearch`. URL-based pagination makes pages shareable and bookmarkable.

```typescript
// app/routes/articles.tsx
// => Paginated article list with URL-based pagination
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  // => page: minimum 1, defaults to 1 if absent
  // => /articles → page=1; /articles?page=3 → page=3
  pageSize: z.number().int().min(5).max(100).default(20),
  // => pageSize: 5-100 items, defaults to 20
})

export const Route = createFileRoute('/articles')({
  validateSearch: paginationSchema,
  // => Validates search params on every navigation

  loader: async ({ context }) => {
    const { page, pageSize } = context as unknown as z.infer<typeof paginationSchema>
    // => Extract pagination params from context
    // => Real pattern: use Route.useSearch() in component, or pass to loader via opts

    const articles = Array.from({ length: pageSize }, (_, i) => ({
      id: (page - 1) * pageSize + i + 1,
      // => id: sequential based on page and offset
      title: `Article ${(page - 1) * pageSize + i + 1}`,
      // => title: "Article 1", "Article 2", ..., "Article 21" on page 2
    }))

    return { articles, total: 100, page, pageSize }
    // => total: 100 articles (5 pages of 20)
  },

  component: function ArticlesPage() {
    const { articles, total, page, pageSize } = Route.useLoaderData()
    const totalPages = Math.ceil(total / pageSize)
    // => totalPages: 100/20 = 5

    return (
      <div>
        <ul>
          {articles.map((a) => (
            <li key={a.id}>{a.title}</li>
            // => Renders articles for current page
          ))}
        </ul>

        <nav>
          {page > 1 && (
            <Link to="/articles" search={{ page: page - 1, pageSize }}>
              Previous
              {/* => Link to previous page: /articles?page=2&pageSize=20 */}
            </Link>
          )}
          <span>Page {page} of {totalPages}</span>
          {/* => "Page 3 of 5" */}
          {page < totalPages && (
            <Link to="/articles" search={{ page: page + 1, pageSize }}>
              Next
              {/* => Link to next page: /articles?page=4&pageSize=20 */}
            </Link>
          )}
        </nav>
      </div>
    )
  },
})
```

**Key Takeaway**: URL-based pagination with `validateSearch` ensures page state is shareable, bookmarkable, and server-renderable. Navigation between pages is a type-safe `<Link>` update to the `page` search param.

**Why It Matters**: URL-based pagination is a critical UX requirement for data-heavy applications. When support staff share a link to a specific page of a customer list, or when users bookmark a search result page, the URL must encode the complete view state. JavaScript-only pagination (using component state) breaks the browser's back button, prevents deep linking, and harms SEO for content that should be indexed. TanStack Router's type-safe search params make URL-driven UI state the default rather than an afterthought.

---

Congratulations on completing the intermediate examples. You now understand TanStack Start's server functions, mutations, form handling, authentication, session management, middleware, TanStack Query integration, optimistic updates, and streaming patterns.

Continue to [Advanced](/en/learn/software-engineering/platform-web/tools/fe-tanstack-start/by-example/advanced) to learn SSR streaming patterns, deployment targets, performance optimization, and production architecture.
