---
title: "Intermediate"
weight: 10000002
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Master production FastAPI patterns through 28 annotated examples covering dependency injection, OAuth2, JWT authentication, SQLAlchemy async, background tasks, WebSockets, testing, custom middleware, application lifecycle, response streaming, sub-applications, and configuration management"
tags: ["fastapi", "python", "web-framework", "tutorial", "by-example", "intermediate", "jwt", "sqlalchemy", "websocket", "testing", "dependency-injection"]
---

## Group 11: Advanced Dependency Injection

### Example 28: Class-Based Dependencies

Dependencies can be classes, not just functions. Class-based dependencies use `__call__` to make instances callable, enabling stateful dependencies that initialize resources once and reuse them across requests.

```python
# main.py - Class-based dependencies for stateful resource sharing
from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException

app = FastAPI()

class Paginator:                      # => Class-based dependency
    def __init__(self, max_limit: int = 100):
        self.max_limit = max_limit    # => Configuration stored on instance
                                      # => Injected once at dependency registration time

    def __call__(                     # => __call__ makes instance behave like function
        self,
        skip: int = 0,
        limit: int = 20,
    ) -> dict:
        if limit > self.max_limit:    # => Enforce maximum page size
            raise HTTPException(
                status_code=400,
                detail=f"limit cannot exceed {self.max_limit}",
            )
        return {"skip": skip, "limit": min(limit, self.max_limit)}
                                      # => Returns pagination dict for handler

paginate = Paginator(max_limit=50)    # => Create instance with custom configuration
                                      # => This instance is reused across requests

class RateLimiter:                    # => Stateful class tracking request counts
    def __init__(self, max_requests: int = 10):
        self.max_requests = max_requests
        self.requests: dict[str, int] = {}
                                      # => In-memory counter per client IP
                                      # => Production: use Redis for distributed limiting

    def __call__(self, request) -> None:
                                      # => request: fastapi.Request (type hint omitted for brevity)
        from fastapi import Request
        client_ip = "127.0.0.1"       # => Simplified; use request.client.host in real code
        count = self.requests.get(client_ip, 0)
        if count >= self.max_requests:
            raise HTTPException(status_code=429, detail="Too many requests")
                                      # => 429 Too Many Requests
        self.requests[client_ip] = count + 1

rate_limit = RateLimiter(max_requests=5)

@app.get("/items")
def list_items(
    pagination: Annotated[dict, Depends(paginate)],
                                      # => paginate instance is callable; Depends calls it
    _: Annotated[None, Depends(rate_limit)],
                                      # => rate_limit instance checks and increments counter
):
    return {"items": [], **pagination}
```

**Key Takeaway**: Class instances with `__call__` work as dependencies. Initialize class-level state (configuration, counters) once; `__call__` runs per request with shared state.

**Why It Matters**: Class-based dependencies enable the stateful patterns that function-based dependencies cannot express cleanly. A connection pool, a loaded ML model, or a Redis client initialized once at startup and shared across thousands of requests requires class-level state. Without class-based dependencies, these resources either become module-level globals (hard to test) or are reconstructed per-request (wasteful). FastAPI's `Depends()` system treats instances identically to functions, making stateful and stateless dependencies interchangeable at the usage site.

---

### Example 29: Nested Dependencies and Dependency Scoping

Dependencies can themselves declare dependencies, creating chains. FastAPI resolves the full dependency tree, caches each dependency result within a single request, and ensures teardown order is correct.

```python
# main.py - Nested dependencies with request-scoped caching
from typing import Annotated, Generator
from fastapi import FastAPI, Depends

app = FastAPI()

# Simulated database connection class
class DBConnection:
    def __init__(self, conn_str: str):
        self.conn_str = conn_str
        self.closed = False
        print(f"[DB] Opened connection to {conn_str}")
                                      # => Printed once per request, not per dependency use

    def close(self):
        self.closed = True
        print(f"[DB] Closed connection to {conn_str}")

# Level 1 dependency: database connection
def get_db() -> Generator[DBConnection, None, None]:
                                      # => Generator dependency enables setup + teardown
    db = DBConnection("postgresql://localhost/mydb")
                                      # => Setup: runs before yielding
    try:
        yield db                      # => Yield the resource; FastAPI injects what is yielded
    finally:
        db.close()                    # => Teardown: runs after handler returns
                                      # => Guaranteed even if handler raises an exception

# Level 2 dependency: uses db connection
def get_user_repo(
    db: Annotated[DBConnection, Depends(get_db)],
                                      # => Declares dependency on get_db
                                      # => get_db is called once; result cached for this request
) -> dict:
    return {"repo": "UserRepo", "db": db.conn_str}
                                      # => UserRepo wraps the db connection

def get_order_repo(
    db: Annotated[DBConnection, Depends(get_db)],
                                      # => get_db is the SAME dependency as above
                                      # => FastAPI caches get_db result: same db object injected
                                      # => Connection opened ONCE, not twice
) -> dict:
    return {"repo": "OrderRepo", "db": db.conn_str}

# Level 3 handler: uses both repos
@app.get("/orders/user/{user_id}")
def user_orders(
    user_id: int,
    user_repo: Annotated[dict, Depends(get_user_repo)],
    order_repo: Annotated[dict, Depends(get_order_repo)],
                                      # => Both repos declared; get_db called once total
):
    return {
        "user_id": user_id,
        "user_repo": user_repo["repo"],
        "order_repo": order_repo["repo"],
        "same_db": user_repo["db"] == order_repo["db"],
                                      # => True: same connection object injected to both
    }
```

**Key Takeaway**: FastAPI caches dependency results within a single request. A dependency used by multiple sub-dependencies is called once per request, preventing duplicate resource creation.

**Why It Matters**: Database connection sharing within a single request is critical for transactional consistency. If `get_user_repo` and `get_order_repo` each opened their own database connection, updates to users and orders would run in separate transactions—breaking atomicity for operations that must succeed or fail together. FastAPI's dependency caching ensures the same connection (and transaction) flows through the entire request without explicit plumbing code in handlers.

---

## Group 12: Security and Authentication

### Example 30: OAuth2 Password Flow - Login Endpoint

FastAPI's `OAuth2PasswordBearer` and `OAuth2PasswordRequestForm` implement the OAuth2 Password grant type—the standard pattern for username/password authentication in API-first applications. This example shows the login endpoint that issues tokens.

```python
# main.py - OAuth2 Password flow login endpoint
from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import hashlib

app = FastAPI()

# Simulated user database
fake_users_db = {
    "alice": {
        "username": "alice",
        "hashed_password": hashlib.sha256("secret".encode()).hexdigest(),
                                      # => In production: use bcrypt via passlib
                                      # => hashlib.sha256 is INSECURE for passwords
        "email": "alice@example.com",
        "disabled": False,
    }
}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
                                      # => Declares that tokens come from POST /token
                                      # => Adds "Authorize" button to Swagger UI
                                      # => tokenUrl is the endpoint that issues tokens

class Token(BaseModel):               # => OAuth2 token response model
    access_token: str
    token_type: str                   # => Always "bearer" for OAuth2 Bearer tokens

def verify_password(plain: str, hashed: str) -> bool:
    return hashlib.sha256(plain.encode()).hexdigest() == hashed
                                      # => Check if plain password matches hash
                                      # => Use passlib.context.verify() in production

@app.post("/token", response_model=Token)
                                      # => Standard OAuth2 token endpoint at POST /token
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
                                      # => OAuth2PasswordRequestForm reads username/password
                                      # => from application/x-www-form-urlencoded body
                                      # => Fields: form_data.username, form_data.password
):
    user = fake_users_db.get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
                                      # => WWW-Authenticate header required by OAuth2 spec
        )
    # In production: generate real JWT token here
    access_token = f"fake-token-for-{user['username']}"
                                      # => Real code: create_access_token(data={"sub": username})
    return Token(access_token=access_token, token_type="bearer")
                                      # => Response: {"access_token": "...", "token_type": "bearer"}
```

**Key Takeaway**: Use `OAuth2PasswordRequestForm` to read credentials from form data, verify them against stored hashes, and return an `access_token` with `token_type: "bearer"`.

**Why It Matters**: Implementing OAuth2 Password flow with `OAuth2PasswordRequestForm` ensures your token endpoint is compatible with the OAuth2 specification—meaning any OAuth2 client library in any language can authenticate against your API without custom code. FastAPI's Swagger UI automatically shows an "Authorize" dialog when `OAuth2PasswordBearer` is declared, enabling immediate manual testing of authenticated endpoints during development, replacing the manual `curl` token-fetching step that slows down development iteration.

---

### Example 31: JWT Token Creation and Verification

JSON Web Tokens (JWT) encode user identity and claims in a signed, self-contained token. This example shows creating tokens during login and verifying them on protected endpoints using `python-jose`.

```python
# main.py - JWT token creation and verification
# pip install "python-jose[cryptography]" passlib[bcrypt]
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt           # => python-jose library for JWT operations
from pydantic import BaseModel

app = FastAPI()

SECRET_KEY = "your-256-bit-secret-key-change-in-production"
                                         # => NEVER hardcode in production; use env var
ALGORITHM = "HS256"                      # => HMAC-SHA256 signing algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 30         # => Token valid for 30 minutes

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class TokenData(BaseModel):              # => Decoded token payload model
    username: Optional[str] = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()              # => Copy to avoid mutating the original dict
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
                                         # => Default 15 minutes if not specified
    to_encode.update({"exp": expire})    # => Add expiration claim to payload
                                         # => JWT spec: "exp" is Unix timestamp
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
                                         # => Signs payload with SECRET_KEY
                                         # => Returns base64url-encoded JWT string
    return encoded_jwt                   # => "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
                                         # => oauth2_scheme extracts Bearer token from header
                                         # => Authorization: Bearer eyJhbGciO...
) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                                         # => Verifies signature AND checks expiration
                                         # => Raises JWTError if invalid or expired
        username: Optional[str] = payload.get("sub")
                                         # => "sub" (subject) claim contains the user identifier
        if username is None:
            raise credentials_exception
        return username                  # => Return verified username string
    except JWTError:                     # => Invalid signature, expired token, malformed JWT
        raise credentials_exception

@app.get("/users/me")
async def get_me(
    current_user: Annotated[str, Depends(get_current_user)],
                                         # => get_current_user runs before handler
                                         # => Returns username if token valid, 401 if not
):
    return {"username": current_user}    # => Only reached with valid JWT
```

**Key Takeaway**: Create JWTs with `jwt.encode()` including an `exp` claim, and verify them with `jwt.decode()`. Wrap verification in a `get_current_user` dependency that protects endpoints.

**Why It Matters**: JWTs enable stateless authentication that scales horizontally without shared session storage. Any server in a cluster can verify a JWT using the shared `SECRET_KEY` without querying a central session store—eliminating a distributed system bottleneck. The `exp` claim provides automatic token expiry without server-side session management. However, JWTs cannot be revoked before expiry without additional infrastructure (token blacklist), making short expiry windows (15-30 minutes) with refresh token rotation the recommended production pattern.

---

### Example 32: Role-Based Access Control

Extend the JWT authentication pattern to include user roles in the token payload. Create separate dependencies for different permission levels and use them to protect routes based on user roles.

```python
# main.py - Role-based access control with JWT claims
from typing import Annotated, List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

app = FastAPI()
SECRET_KEY = "change-me-in-production"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class User(BaseModel):
    username: str
    roles: List[str]                  # => List of role strings: ["user", "admin"]

def decode_token(token: str) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        roles = payload.get("roles", [])
                                      # => roles claim: ["user"] or ["user", "admin"]
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return User(username=username, roles=roles)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    return decode_token(token)        # => Returns User model with username and roles

def require_role(*required_roles: str):
                                      # => Factory function returning a dependency
                                      # => Call with: Depends(require_role("admin"))
    def role_checker(
        user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        for role in required_roles:   # => Check if user has ANY of the required roles
            if role in user.roles:
                return user           # => Role found: allow access, return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
                                      # => 403 Forbidden: authenticated but not authorized
            detail=f"Requires role(s): {', '.join(required_roles)}",
        )
    return role_checker               # => Return the checker function as the dependency

@app.get("/profile")
def user_profile(
    user: Annotated[User, Depends(get_current_user)],
                                      # => Requires any authenticated user
):
    return {"username": user.username, "roles": user.roles}

@app.delete("/admin/users/{user_id}")
def admin_delete_user(
    user_id: int,
    admin: Annotated[User, Depends(require_role("admin"))],
                                      # => Requires "admin" role; 403 otherwise
):
    return {"deleted": user_id, "by": admin.username}

@app.get("/reports")
def view_reports(
    user: Annotated[User, Depends(require_role("admin", "analyst"))],
                                      # => Requires "admin" OR "analyst" role
):
    return {"reports": [], "viewer": user.username}
```

**Key Takeaway**: Embed roles in JWT claims and create dependency factories with `require_role(*roles)` to enforce role-based access. The factory pattern avoids duplicating role-check logic.

**Why It Matters**: Role-based access control implemented as dependencies composes cleanly with FastAPI's declarative route definitions. Adding an "admin" requirement to an existing endpoint is a one-line change at the route level, not a modification of business logic. The factory pattern `require_role("admin")` reads like natural language at the point of use, making access control decisions visible during code review without requiring reviewers to understand the underlying dependency chain implementation.

---

## Group 13: Database Integration with SQLAlchemy

### Example 33: Async SQLAlchemy Setup

SQLAlchemy 2.0 with asyncio provides non-blocking database operations. This example shows the engine, session factory, and base model setup needed for FastAPI async database integration.

```python
# database.py - Async SQLAlchemy configuration
# pip install "sqlalchemy[asyncio]" asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator

# Async database URL (note: postgresql+asyncpg://)
DATABASE_URL = "postgresql+asyncpg://user:password@localhost/dbname"
                                      # => asyncpg is the async PostgreSQL driver
                                      # => Not psycopg2 (that's blocking)

engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,                     # => Number of connections to maintain in pool
    max_overflow=20,                  # => Additional connections when pool is full
    echo=False,                       # => Set True to log all SQL statements
                                      # => Useful for debugging; disable in production
)
                                      # => engine manages the connection pool lifecycle

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,             # => Use AsyncSession (not regular Session)
    expire_on_commit=False,          # => Don't expire objects after commit
                                     # => Prevents lazy-load errors after session closes
)

class Base(DeclarativeBase):         # => Declarative base for all models
    pass                             # => All models inherit from Base

# Dependency to inject database session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
                                     # => Create session using async context manager
                                     # => Session opened before yield
        try:
            yield session            # => Inject session into route handler
        except Exception:
            await session.rollback() # => Roll back on any unhandled exception
            raise                    # => Re-raise after rollback
        finally:
            await session.close()   # => Always close session (context manager handles this)

# models.py - SQLAlchemy async model
from sqlalchemy import String, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column

class Item(Base):                    # => ORM model inheriting from Base
    __tablename__ = "items"          # => Database table name

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
                                     # => Primary key with B-tree index
    name: Mapped[str] = mapped_column(String(100), nullable=False)
                                     # => VARCHAR(100) NOT NULL column
    price: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
                                     # => Nullable VARCHAR(500)
```

**Key Takeaway**: Use `create_async_engine` with `asyncpg` driver and `AsyncSession` for non-blocking database operations. The `get_db` generator dependency manages session lifecycle per request.

**Why It Matters**: Async database access is the difference between 1,000 and 10,000 concurrent connections on the same hardware. A blocking `psycopg2` query freezes the event loop for the duration of the database round trip—typically 1-50ms—during which no other requests are handled. Async SQLAlchemy with `asyncpg` yields the event loop during I/O waits, allowing thousands of concurrent requests to interleave database operations. For read-heavy APIs with modest compute requirements, this single change can eliminate the need for additional server instances.

---

### Example 34: CRUD Operations with Async SQLAlchemy

Implement Create, Read, Update, and Delete operations using async SQLAlchemy session methods. These patterns compose with FastAPI's dependency injection to create clean, testable data access layers.

```python
# main.py - CRUD operations with async SQLAlchemy
from typing import Annotated, List, Optional
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from pydantic import BaseModel

# Assume engine, AsyncSessionLocal, Base, get_db, Item (model) from previous example

app = FastAPI()

class ItemCreate(BaseModel):          # => Request body for creating items
    name: str
    price: float
    description: Optional[str] = None

class ItemUpdate(BaseModel):          # => Request body for updating items (all optional)
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None

class ItemResponse(BaseModel):        # => Response model with database ID
    id: int
    name: str
    price: float
    description: Optional[str]

    class Config:
        from_attributes = True        # => Enable ORM mode: read from SQLAlchemy model attrs
                                      # => Allows Pydantic to read Item.id, Item.name etc.

@app.post("/items", response_model=ItemResponse)
async def create_item(
    item_data: ItemCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
                                      # => Inject async session from get_db dependency
):
    db_item = Item(**item_data.model_dump())
                                      # => Create ORM instance from Pydantic model dict
    db.add(db_item)                   # => Stage item for insertion (not yet in DB)
    await db.commit()                 # => Execute INSERT, commit transaction
    await db.refresh(db_item)         # => Reload to get DB-generated values (id, created_at)
    return db_item                    # => Return ORM instance; response_model converts it

@app.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(Item).where(Item.id == item_id))
                                      # => select(Item).where(...) builds SQL: SELECT * FROM items WHERE id = ?
    item = result.scalar_one_or_none()
                                      # => scalar_one_or_none: returns Item or None
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.get("/items", response_model=List[ItemResponse])
async def list_items(
    skip: int = 0,
    limit: int = 20,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
):
    result = await db.execute(select(Item).offset(skip).limit(limit))
                                      # => .offset(skip) = SQL OFFSET; .limit(limit) = SQL LIMIT
    return result.scalars().all()     # => scalars() extracts Item objects; all() returns list

@app.delete("/items/{item_id}", status_code=204)
async def delete_item(item_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(delete(Item).where(Item.id == item_id))
                                      # => Executes: DELETE FROM items WHERE id = ?
    if result.rowcount == 0:          # => rowcount: number of rows affected
        raise HTTPException(status_code=404, detail="Item not found")
    await db.commit()                 # => Commit the DELETE transaction
```

**Key Takeaway**: Use SQLAlchemy 2.0 `select()`, `update()`, `delete()` statement builders with `await db.execute()`. Call `await db.commit()` after write operations and `await db.refresh()` to reload generated values.

**Why It Matters**: Async SQLAlchemy CRUD patterns enable database-backed APIs to handle thousands of concurrent requests without thread pool exhaustion. The repository pattern (separating CRUD functions from route handlers) makes the code independently testable—unit tests can stub the database session, integration tests use a real database. SQLAlchemy 2.0's `select()` builder API is type-safe and composable, making complex queries with joins, filters, and ordering readable and IDE-navigable.

---

### Example 35: SQLAlchemy Relationships and Joins

SQLAlchemy relationships enable navigating between related models. This example shows one-to-many relationships, eager loading with `selectinload`, and joining related data in queries.

```python
# main.py - SQLAlchemy relationships and eager loading
from typing import List
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship, selectinload
from pydantic import BaseModel
from database import Base, get_db    # => From previous example

app = FastAPI()

class Author(Base):
    __tablename__ = "authors"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    books: Mapped[List["Book"]] = relationship(
        "Book",
        back_populates="author",      # => Bidirectional relationship
        lazy="select",                # => Default: lazy load (don't load unless accessed)
                                      # => With async, always use eager loading instead
    )

class Book(Base):
    __tablename__ = "books"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column()
    author_id: Mapped[int] = mapped_column(ForeignKey("authors.id"))
                                      # => Foreign key referencing authors.id
    author: Mapped["Author"] = relationship("Author", back_populates="books")
                                      # => Many-to-one: each book has one author

class BookResponse(BaseModel):
    id: int
    title: str
    author_name: str

    class Config:
        from_attributes = True

class AuthorWithBooks(BaseModel):
    id: int
    name: str
    books: List[dict]                 # => Include related books in response

    class Config:
        from_attributes = True

@app.get("/authors/{author_id}/with-books")
async def get_author_with_books(
    author_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Author)
        .where(Author.id == author_id)
        .options(selectinload(Author.books))
                                      # => selectinload: eager loading for async
                                      # => Issues a second SELECT for books where author_id = ?
                                      # => NOT a JOIN; avoids N+1 for large result sets
    )
    author = result.scalar_one_or_none()
    if author is None:
        return {"error": "Author not found"}
    return {
        "id": author.id,
        "name": author.name,
        "books": [{"id": b.id, "title": b.title} for b in author.books],
                                      # => author.books is already loaded (no lazy load)
    }
```

**Key Takeaway**: Use `selectinload()` for eager loading relationships in async SQLAlchemy. It issues a separate SELECT for related records rather than lazy loading, which is incompatible with async sessions.

**Why It Matters**: Lazy loading—the default in SQLAlchemy—triggers additional SQL queries when relationship attributes are accessed. In an async context, lazy loading is impossible without a running event loop at access time, causing `MissingGreenlet` errors that crash endpoints. `selectinload` solves this by loading relationships eagerly in a separate query before the session closes. Understanding eager vs lazy loading prevents the most common async SQLAlchemy production bug: a 200 response in development that becomes a 500 crash under production load.

---

## Group 14: WebSockets

### Example 36: WebSocket Basic Connection

FastAPI supports WebSocket connections through `@app.websocket()` decorated handlers. WebSocket routes use an `async def` function that receives a `WebSocket` object and must call `accept()` before communicating.

```python
# main.py - Basic WebSocket echo server
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

app = FastAPI()

# Simple HTML client for testing WebSocket without extra tools
html = """
<!DOCTYPE html>
<html>
<script>
    var ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = function(event) { console.log("Received:", event.data); };
    function send(msg) { ws.send(msg); }
</script>
<button onclick="send('Hello Server')">Send</button>
</html>
"""

@app.get("/")
async def home():
    return HTMLResponse(html)         # => Serve HTML client for testing

@app.websocket("/ws")                 # => WebSocket route at ws://host/ws
async def websocket_endpoint(websocket: WebSocket):
                                      # => websocket: WebSocket object for this connection
    await websocket.accept()          # => Must call accept() to establish WebSocket handshake
                                      # => Without accept(), connection is rejected
    try:
        while True:                   # => Keep connection open; loop until disconnect
            data = await websocket.receive_text()
                                      # => Blocks until client sends a text message
                                      # => data is the string the client sent
                                      # => Also: receive_bytes(), receive_json()
            print(f"Received: {data}")
            await websocket.send_text(f"Echo: {data}")
                                      # => Send response back to same client
                                      # => Also: send_bytes(), send_json()
    except WebSocketDisconnect:       # => Raised when client closes connection
        print("Client disconnected")  # => Normal disconnect; no need to re-raise
                                      # => Connection is already closed at this point
```

**Key Takeaway**: Decorate with `@app.websocket()`, call `await websocket.accept()`, then loop with `receive_text()` and `send_text()`. Catch `WebSocketDisconnect` for graceful cleanup on client disconnect.

**Why It Matters**: WebSockets enable real-time features that polling cannot achieve efficiently: live collaboration, push notifications, gaming state synchronization, and financial data streaming. An API that pushes stock price updates via WebSocket uses 100x fewer server resources than one where 10,000 clients poll every second, because each WebSocket connection is idle (no CPU, minimal memory) between messages. FastAPI's async WebSocket support handles thousands of concurrent connections on a single server that would require a cluster with polling architectures.

---

### Example 37: WebSocket Connection Manager for Broadcasting

Real applications need to broadcast messages to multiple connected clients. A `ConnectionManager` class tracks active connections and provides broadcast methods—a pattern for chat rooms, live dashboards, and collaborative editing.

```python
# main.py - WebSocket connection manager for broadcasting
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List

app = FastAPI()

class ConnectionManager:              # => Manages multiple WebSocket connections
    def __init__(self):
        self.active_connections: List[WebSocket] = []
                                      # => List of all currently connected clients

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()      # => Accept the WebSocket handshake
        self.active_connections.append(websocket)
                                      # => Add to active connections list
        print(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.remove(websocket)
                                      # => Remove from list on disconnect
        print(f"Client disconnected. Total: {len(self.active_connections)}")

    async def send_personal(self, message: str, websocket: WebSocket) -> None:
        await websocket.send_text(message)
                                      # => Send to one specific client only

    async def broadcast(self, message: str) -> None:
        for connection in self.active_connections:
                                      # => Send same message to ALL connected clients
            await connection.send_text(message)
                                      # => Each send is async; clients receive in order

manager = ConnectionManager()         # => Single instance shared across all connections

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
                                      # => Wait for message from this client
            await manager.send_personal(
                f"[You] {data}", websocket,
            )                         # => Echo back to sender labeled "[You]"
            await manager.broadcast(
                f"[Client {client_id}] {data}",
            )                         # => Broadcast to ALL connected clients
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"[System] Client {client_id} left the chat")
                                      # => Notify remaining clients of departure
```

**Key Takeaway**: A `ConnectionManager` class encapsulates the list of active connections and provides `connect()`, `disconnect()`, and `broadcast()` methods. One shared instance routes messages between all connected clients.

**Why It Matters**: The connection manager pattern is the foundation of all real-time collaborative features. Chat applications, multiplayer games, live document editing, and team dashboards all require broadcasting state changes to multiple subscribers. This in-process implementation is sufficient for single-server deployments. Production systems with multiple server instances need a distributed pub/sub backbone (Redis Pub/Sub or Kafka) behind the connection manager, with each server instance broadcasting to only its locally connected clients.

---

## Group 15: Testing

### Example 38: Testing with TestClient

FastAPI's `TestClient` wraps an HTTPX client to make test requests against your application without starting a real server. Tests can be synchronous even for async applications.

```python
# test_main.py - Testing FastAPI endpoints with TestClient
# pip install httpx pytest
from fastapi import FastAPI, Depends, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float
    description: Optional[str] = None

items_db: dict[int, Item] = {
    1: Item(name="Widget", price=9.99),
}

@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    return items_db[item_id]

@app.post("/items", status_code=201)
def create_item(item: Item):
    new_id = max(items_db.keys()) + 1 if items_db else 1
    items_db[new_id] = item
    return {"id": new_id, **item.model_dump()}

# --- Tests below ---

client = TestClient(app)              # => Create test client bound to app
                                      # => No real server; requests handled in-process

def test_get_existing_item():
    response = client.get("/items/1")  # => HTTP GET request to /items/1
    assert response.status_code == 200 # => Check status code
    data = response.json()             # => Parse JSON response body
    assert data["name"] == "Widget"    # => Check specific field value
    assert data["price"] == 9.99

def test_get_nonexistent_item():
    response = client.get("/items/999")
    assert response.status_code == 404  # => Expect 404 for missing item
    assert response.json()["detail"] == "Item not found"
                                        # => Check error message

def test_create_item():
    payload = {"name": "Gadget", "price": 49.99}
    response = client.post("/items", json=payload)
                                        # => json= sends Content-Type: application/json
    assert response.status_code == 201  # => Expect 201 Created
    data = response.json()
    assert data["name"] == "Gadget"
    assert "id" in data                 # => Check that ID was assigned

def test_create_item_validation_error():
    response = client.post("/items", json={"name": "Bad"})
                                        # => Missing required "price" field
    assert response.status_code == 422  # => Expect 422 Unprocessable Entity
    errors = response.json()["detail"]
    assert any(e["loc"] == ["body", "price"] for e in errors)
                                        # => Check that price field is in errors
```

**Key Takeaway**: Use `TestClient(app)` to make in-process HTTP requests in synchronous tests. It supports the full HTTP API: `.get()`, `.post()`, `.put()`, `.delete()` with `json=`, `headers=`, and `params=` arguments.

**Why It Matters**: FastAPI's `TestClient` enables black-box API testing without network overhead or server startup time, making tests run in milliseconds. Tests validate the full request-response cycle including middleware, dependencies, and response model filtering—not just isolated handler functions. When CI runs 500 API tests in 10 seconds instead of 2 minutes, developers run the full suite on every commit rather than deferring testing to CI, catching regressions before they reach code review.

---

### Example 39: Dependency Override in Tests

Override dependencies in tests to replace database sessions, authentication checks, and external services with test doubles. This creates isolated, deterministic tests without real databases or network calls.

```python
# test_auth.py - Overriding dependencies for isolated testing
from fastapi import FastAPI, Depends, HTTPException
from fastapi.testclient import TestClient
from typing import Annotated

app = FastAPI()

# --- Application code ---

def get_current_user() -> dict:       # => Production: verifies JWT from request header
    # In production: decode JWT, verify, return user
    raise HTTPException(status_code=401, detail="Not authenticated")
                                      # => This is never called in tests (overridden)

def get_db():                         # => Production: returns real database session
    raise RuntimeError("Real DB not available in tests")
                                      # => This is never called in tests (overridden)

@app.get("/profile")
def get_profile(
    user: Annotated[dict, Depends(get_current_user)],
    db = Depends(get_db),
):
    return {"username": user["username"], "email": user["email"]}

# --- Test code ---

def fake_current_user() -> dict:      # => Test double for get_current_user
    return {"username": "testuser", "email": "test@example.com"}
                                      # => Returns hardcoded user without auth logic

class FakeDB:                         # => Test double for database session
    def query(self): return []        # => Returns empty results

def fake_get_db():                    # => Test double for get_db
    return FakeDB()                   # => Returns in-memory fake, no real DB needed

# Override dependencies for all tests using this client
app.dependency_overrides[get_current_user] = fake_current_user
                                      # => Replace get_current_user with fake_current_user
                                      # => Every Depends(get_current_user) now calls fake
app.dependency_overrides[get_db] = fake_get_db
                                      # => Replace get_db with fake_get_db

client = TestClient(app)

def test_profile_authenticated():
    response = client.get("/profile")  # => No auth header needed; fake_current_user runs
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
                                       # => Gets testuser from fake dependency

def cleanup():
    app.dependency_overrides.clear()   # => Remove all overrides after tests
                                       # => Restore original dependencies
```

**Key Takeaway**: Use `app.dependency_overrides[original_dep] = fake_dep` to replace dependencies in tests. Clear overrides after tests with `app.dependency_overrides.clear()`.

**Why It Matters**: Dependency overrides enable true unit testing of HTTP handlers without real infrastructure. A test suite that requires a running PostgreSQL database cannot run in CI without Docker, slowing feedback loops from seconds to minutes. With dependency overrides, the handler's request-parsing and response-formatting logic is tested in isolation, while a separate integration test validates the database interaction. This separation lets developers run fast unit tests locally and reserve slow integration tests for CI, maintaining developer velocity without sacrificing coverage.

---

## Group 16: Application Lifecycle and Configuration

### Example 40: Application Startup and Shutdown Events

FastAPI supports lifecycle hooks via `@app.on_event("startup")` (deprecated in FastAPI 0.93+) and the recommended `lifespan` context manager. Use lifecycle events to initialize and clean up resources: database connections, ML models, caches.

```python
# main.py - Application lifecycle with lifespan context manager
from contextlib import asynccontextmanager
from fastapi import FastAPI
import asyncio

# Simulated resources
class MLModel:
    def __init__(self):
        self.loaded = False
    def load(self):
        self.loaded = True
        print("[Startup] ML model loaded")
    def predict(self, data: str) -> str:
        return f"prediction for: {data}"
    def unload(self):
        self.loaded = False
        print("[Shutdown] ML model unloaded")

ml_model = MLModel()                  # => Module-level model instance

class DatabasePool:
    def __init__(self):
        self.pool = None
    async def connect(self):
        await asyncio.sleep(0.01)     # => Simulate async pool initialization
        self.pool = "connected"
        print("[Startup] Database pool initialized")
    async def close(self):
        await asyncio.sleep(0.01)     # => Simulate async pool teardown
        self.pool = None
        print("[Shutdown] Database pool closed")

db_pool = DatabasePool()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup: code runs before app accepts requests ---
    print("[Startup] Starting application...")
    ml_model.load()                   # => Sync startup task
    await db_pool.connect()           # => Async startup task
    print("[Startup] Application ready")

    yield                             # => App runs here; yields control to FastAPI

    # --- Shutdown: code runs after last request, before process exits ---
    print("[Shutdown] Shutting down...")
    await db_pool.close()             # => Async cleanup
    ml_model.unload()                 # => Sync cleanup
    print("[Shutdown] Goodbye")

app = FastAPI(lifespan=lifespan)      # => Pass lifespan to FastAPI constructor
                                      # => FastAPI calls it during startup and shutdown

@app.get("/predict")
def predict(data: str):
    if not ml_model.loaded:
        return {"error": "Model not ready"}
    return {"result": ml_model.predict(data)}
                                      # => Model guaranteed loaded because startup ran

@app.get("/db-status")
def db_status():
    return {"connected": db_pool.pool is not None}
                                      # => Pool guaranteed initialized
```

**Key Takeaway**: Use the `lifespan` context manager (recommended in FastAPI 0.93+) for startup and shutdown logic. Code before `yield` runs at startup; code after `yield` runs at shutdown.

**Why It Matters**: Proper lifecycle management prevents the most common production startup failures: endpoints receiving requests before the database pool is ready, or ML models responding with errors while still loading from disk. The `lifespan` pattern guarantees startup completes before traffic arrives and cleanup runs before the process exits—preventing connection leaks that accumulate when Kubernetes restarts pods frequently. Kubernetes liveness and readiness probes depend on this: the app should not become "ready" until all startup tasks complete successfully.

---

### Example 41: Configuration Management with Pydantic Settings

Use `pydantic-settings` to load configuration from environment variables and `.env` files with type validation. This pattern centralizes configuration, documents required variables, and prevents runtime crashes from missing or malformed config.

```python
# config.py - Application configuration with pydantic-settings
# pip install pydantic-settings
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AnyHttpUrl
from typing import List
from functools import lru_cache

class Settings(BaseSettings):         # => BaseSettings reads from environment variables
    model_config = SettingsConfigDict(
        env_file=".env",              # => Load from .env file if present
        env_file_encoding="utf-8",
        case_sensitive=False,         # => DB_HOST and db_host both work
    )

    # Application settings
    app_name: str = "My FastAPI App"  # => Default value; override with APP_NAME env var
    debug: bool = False               # => APP_DEBUG=true enables debug mode
    secret_key: str = Field(          # => Required: SECRET_KEY env var must be set
        ...,                          # => No default = raises error if not set
        min_length=32,                # => Must be at least 32 chars for security
    )

    # Database settings
    database_url: str = Field(        # => DATABASE_URL env var
        default="postgresql+asyncpg://user:pass@localhost/db",
    )
    db_pool_size: int = 10            # => DB_POOL_SIZE env var; default 10

    # CORS settings
    allowed_origins: List[str] = ["http://localhost:3000"]
                                      # => ALLOWED_ORIGINS env var: JSON array string
                                      # => ALLOWED_ORIGINS='["https://myapp.com"]'

    # JWT settings
    jwt_secret_key: str = Field(..., min_length=32)
                                      # => JWT_SECRET_KEY env var; required
    jwt_expire_minutes: int = 30      # => JWT_EXPIRE_MINUTES; default 30

@lru_cache()                          # => Cache Settings instance; reads env vars once
def get_settings() -> Settings:
    return Settings()                 # => Reads from environment + .env file
                                      # => lru_cache ensures single instance per process

# main.py - Using settings in application
from fastapi import FastAPI, Depends
from typing import Annotated

app = FastAPI()

@app.get("/config-info")
def config_info(
    settings: Annotated[Settings, Depends(get_settings)],
                                      # => Depends(get_settings) injects Settings instance
                                      # => lru_cache means same Settings object every time
):
    return {
        "app_name": settings.app_name,
        "debug": settings.debug,
        "db_pool_size": settings.db_pool_size,
        # Never return secret_key or jwt_secret_key!
    }
# .env file content:
# SECRET_KEY=my-very-long-secret-key-at-least-32-chars
# JWT_SECRET_KEY=another-very-long-secret-key-here
# DATABASE_URL=postgresql+asyncpg://alice:pass@localhost/prod
# APP_NAME=Production API
```

**Key Takeaway**: `BaseSettings` reads environment variables and `.env` files with full Pydantic validation. Use `@lru_cache()` on the factory function to create one Settings instance per process.

**Why It Matters**: Configuration validation at startup catches misconfiguration before it causes runtime failures. An application that starts successfully but crashes at the first database query (because `DATABASE_URL` was misspelled in the deployment manifest) wastes valuable incident response time. Pydantic Settings with required fields (using `...` as default) makes misconfiguration a hard startup failure—immediately visible in deployment logs—rather than a runtime 500 error that triggers 3 AM alerts. The `@lru_cache()` pattern prevents repeated environment variable reads, which can be slow in containerized environments.

---

## Group 17: Custom Middleware and Response Streaming

### Example 42: Starlette BaseHTTPMiddleware

For more control than `@app.middleware("http")`, subclass `BaseHTTPMiddleware` from Starlette. This pattern enables middleware with initialization parameters, helper methods, and shared state across requests.

```python
# main.py - Class-based middleware with BaseHTTPMiddleware
import time
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

app = FastAPI()

class RequestLogMiddleware(BaseHTTPMiddleware):
                                      # => Subclass BaseHTTPMiddleware for class-based middleware
    def __init__(self, app: ASGIApp, log_level: str = "INFO"):
        super().__init__(app)         # => Must call super().__init__(app)
        self.log_level = log_level    # => Store configuration on instance

    async def dispatch(self, request: Request, call_next) -> Response:
                                      # => dispatch() is called for every HTTP request
                                      # => Equivalent to the middleware function body
        start = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"
                                      # => request.client.host is the client IP address

        response = await call_next(request)
                                      # => Call the next handler (route or inner middleware)

        duration_ms = (time.perf_counter() - start) * 1000
        log_line = (
            f"[{self.log_level}] {client_ip} "
            f"{request.method} {request.url.path} "
            f"{response.status_code} {duration_ms:.1f}ms"
        )
        print(log_line)               # => "[INFO] 127.0.0.1 GET /items 200 12.3ms"
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
                                      # => Middleware that adds security headers
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
                                      # => Prevents MIME-type sniffing attacks
        response.headers["X-Frame-Options"] = "DENY"
                                      # => Prevents clickjacking via iframes
        response.headers["X-XSS-Protection"] = "1; mode=block"
                                      # => Legacy XSS protection header
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

# Add middleware in reverse order (last added runs first)
app.add_middleware(RequestLogMiddleware, log_level="INFO")
app.add_middleware(SecurityHeadersMiddleware)
                                      # => SecurityHeadersMiddleware runs first (outermost)
                                      # => RequestLogMiddleware runs second

@app.get("/items")
def list_items():
    return {"items": []}
```

**Key Takeaway**: Subclass `BaseHTTPMiddleware` and implement `dispatch()` for class-based middleware with configuration, helper methods, and shared state. Multiple middleware layers wrap around each other in reverse registration order.

**Why It Matters**: Security headers protect users from a class of browser-based attacks without requiring changes to individual route handlers. `X-Content-Type-Options: nosniff` prevents browsers from executing uploaded HTML files as JavaScript when served as `text/plain`—closing a common file upload exploit. Implementing security headers as middleware ensures every endpoint, including third-party routers and sub-applications mounted to the main app, inherits the protection automatically without manual annotation of each route.

---

### Example 43: Streaming Responses

`StreamingResponse` allows FastAPI to send data to the client progressively rather than buffering the entire response. Use it for large file downloads, server-sent events (SSE), and AI text generation streams.

```python
# main.py - Streaming responses for large data and SSE
import asyncio
import json
from datetime import datetime
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

async def generate_large_data():      # => Async generator yielding chunks
    for i in range(100):              # => Simulate 100 database rows
        row = {"id": i, "value": f"item-{i}", "timestamp": datetime.now().isoformat()}
        yield json.dumps(row) + "\n"  # => Newline-delimited JSON (NDJSON)
                                      # => Each line is a complete JSON object
        await asyncio.sleep(0.01)     # => Simulate database row retrieval time

@app.get("/stream/data")
async def stream_data():
    return StreamingResponse(
        generate_large_data(),        # => Pass generator (not called yet)
        media_type="application/x-ndjson",
                                      # => MIME type for newline-delimited JSON
    )                                 # => FastAPI calls next() on generator per chunk
                                      # => Client receives data progressively

async def event_stream(max_events: int = 10):
                                      # => Server-Sent Events (SSE) format
    for i in range(max_events):
        event_data = json.dumps({"count": i, "time": datetime.now().isoformat()})
        yield f"data: {event_data}\n\n"
                                      # => SSE format: "data: {json}\n\n"
                                      # => Two newlines separate events
        await asyncio.sleep(1)        # => Send one event per second
    yield "data: {\"done\": true}\n\n"
                                      # => Final event signals stream end

@app.get("/stream/events")
async def stream_events():
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
                                      # => SSE media type; browser EventSource API uses this
        headers={
            "Cache-Control": "no-cache",
                                      # => Prevent caching of event stream
            "X-Accel-Buffering": "no",
                                      # => Disable nginx buffering for real-time delivery
        },
    )
# JavaScript client:
# const source = new EventSource('/stream/events');
# source.onmessage = (e) => console.log(JSON.parse(e.data));
```

**Key Takeaway**: Use `StreamingResponse` with an async generator to stream data progressively. For Server-Sent Events, format chunks as `"data: {json}\n\n"` with `text/event-stream` media type.

**Why It Matters**: Streaming responses solve two distinct problems: memory efficiency for large data transfers and latency reduction for incremental results. An endpoint exporting 10,000 database rows buffered entirely before sending requires 50MB of RAM; the same endpoint streamed requires only the memory for one row at a time. For AI text generation (ChatGPT-style), streaming sends each token to the user as it generates rather than waiting for the complete response—transforming a 30-second wait into a perceived response that starts immediately and types itself out progressively.

---

## Group 18: Sub-Applications and Versioning

### Example 44: Mounting Sub-Applications for API Versioning

FastAPI applications can mount other FastAPI or Starlette applications at path prefixes. This pattern enables clean API versioning, microservice composition, and tenant isolation.

```python
# main.py - API versioning with mounted sub-applications
from fastapi import FastAPI
from pydantic import BaseModel

# Version 1 API
v1_app = FastAPI(
    title="My API v1",
    version="1.0.0",
    docs_url="/docs",                 # => Docs at /v1/docs
)

class ItemV1(BaseModel):
    id: int
    name: str                         # => v1: simple name field

@v1_app.get("/items/{item_id}")
def get_item_v1(item_id: int):
    return ItemV1(id=item_id, name=f"item-{item_id}")
                                      # => GET /v1/items/42 => {"id": 42, "name": "item-42"}

# Version 2 API (new fields, different behavior)
v2_app = FastAPI(
    title="My API v2",
    version="2.0.0",
    docs_url="/docs",                 # => Docs at /v2/docs
)

class ItemV2(BaseModel):
    id: int
    name: str
    display_name: str                 # => v2: additional computed field
    version: str = "v2"

@v2_app.get("/items/{item_id}")
def get_item_v2(item_id: int):
    return ItemV2(
        id=item_id,
        name=f"item-{item_id}",
        display_name=f"Item #{item_id} (v2)",
    )                                 # => GET /v2/items/42 => includes display_name

# Root app mounts versioned sub-apps
root_app = FastAPI(title="My API Gateway")

root_app.mount("/v1", v1_app)         # => All v1_app routes accessible under /v1/
                                      # => GET /v1/items/1 routes to v1_app
root_app.mount("/v2", v2_app)         # => All v2_app routes accessible under /v2/
                                      # => GET /v2/items/1 routes to v2_app

@root_app.get("/")
def api_info():
    return {
        "versions": ["v1", "v2"],
        "latest": "v2",
        "v1_docs": "/v1/docs",        # => Each version has its own docs
        "v2_docs": "/v2/docs",
    }
```

**Key Takeaway**: Mount separate FastAPI applications with `app.mount("/prefix", sub_app)` to implement API versioning. Each sub-application has its own routes, middleware, and OpenAPI docs.

**Why It Matters**: Sub-application mounting enables backward-compatible API evolution without the complexity of version branching in a monolithic router. When v2 changes a field name, existing v1 clients continue to work because their requests route to the unmodified v1 sub-application. Each version can have independently configured middleware, CORS settings, and rate limits. The separate OpenAPI docs per version let mobile apps still using v1 browse the correct documentation without confusion from v2 additions.

---

### Example 45: APIRouter with Prefix, Tags, and Dependencies

`APIRouter` is the primary tool for organizing FastAPI applications into modular components. Combine prefix, tags, and dependencies on the router to apply shared configuration to all routes in a group.

```python
# routers/users.py - A complete user management router
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

# Inline dependency for demonstration
def get_current_admin():
    return {"username": "admin", "role": "admin"}
                                      # => In production: verify JWT admin role

router = APIRouter(
    prefix="/users",                  # => All routes start with /users
    tags=["users"],                   # => All routes tagged "users" in OpenAPI
    dependencies=[Depends(get_current_admin)],
                                      # => All routes in this router require admin auth
                                      # => Applied automatically without per-route declaration
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorized"},
    },                                # => These responses documented for all routes in router
)

class User(BaseModel):
    id: int
    username: str
    email: str
    active: bool = True

fake_users: List[User] = [
    User(id=1, username="alice", email="alice@example.com"),
    User(id=2, username="bob", email="bob@example.com"),
]

@router.get("/", response_model=List[User])
                                      # => Full path: GET /users/
                                      # => Requires admin (from router dependencies)
def list_users():
    return fake_users

@router.get("/{user_id}", response_model=User)
                                      # => Full path: GET /users/{user_id}
def get_user(user_id: int):
    user = next((u for u in fake_users if u.id == user_id), None)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# main.py - Include the router
from fastapi import FastAPI
# from routers.users import router as users_router  # In real project

main_app = FastAPI()
main_app.include_router(router)       # => Routes registered: GET /users/, GET /users/{user_id}
                                      # => Admin dependency applied to both
```

**Key Takeaway**: Set `prefix`, `tags`, and `dependencies` on `APIRouter` to apply shared configuration to all routes in the router. Include it with `app.include_router()`.

**Why It Matters**: Router-level dependencies eliminate the most common FastAPI security mistake: forgetting to add auth checks to individual endpoints. When the admin router enforces `get_current_admin` at the router level, a developer adding a new admin endpoint to that router cannot accidentally create an unauthenticated endpoint. The prefix also makes route structure self-documenting—`router = APIRouter(prefix="/admin")` immediately communicates the security boundary to code reviewers, even before they see the dependencies.

---

## Group 19: Advanced Pydantic Patterns

### Example 46: Pydantic v2 Model Validators and Computed Fields

Pydantic v2 introduces `@model_validator` for validation across multiple fields simultaneously, and `@computed_field` for read-only fields computed from other fields. These patterns enable rich domain model validation.

```python
# main.py - Pydantic v2 model validators and computed fields
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel, Field, model_validator, computed_field
import re

app = FastAPI()

class UserRegistration(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8)
    confirm_password: str             # => Must match password
    email: str

    @model_validator(mode="after")    # => Runs after all individual field validators
                                      # => mode="after": receives fully validated model instance
                                      # => mode="before": receives raw input dict
    def passwords_must_match(self) -> "UserRegistration":
                                      # => self is the model instance
                                      # => Must return self (or raise ValueError)
        if self.password != self.confirm_password:
            raise ValueError("password and confirm_password must match")
                                      # => ValueError message included in 422 response
        return self

    @model_validator(mode="after")
    def username_not_in_password(self) -> "UserRegistration":
        if self.username.lower() in self.password.lower():
            raise ValueError("password must not contain username")
        return self

class Product(BaseModel):
    name: str
    price: float = Field(gt=0)
    discount_percent: float = Field(ge=0, le=100, default=0)

    @computed_field                   # => Field computed from other fields
    @property                         # => Must also be a @property
    def discounted_price(self) -> float:
        return round(self.price * (1 - self.discount_percent / 100), 2)
                                      # => price=100, discount=10 => discounted_price=90.0
                                      # => Included in JSON response automatically

    @computed_field
    @property
    def on_sale(self) -> bool:
        return self.discount_percent > 0
                                      # => True if discount_percent > 0

@app.post("/register")
def register(user: UserRegistration):
    return {"username": user.username, "email": user.email}
                                      # => confirm_password not in response (response_model could filter)

@app.post("/products")
def create_product(product: Product):
    return product                    # => Includes discounted_price and on_sale in response
                                      # => POST {"name": "Widget", "price": 100, "discount_percent": 20}
                                      # => Returns: {"name": "Widget", "price": 100,
                                      # =>           "discount_percent": 20,
                                      # =>           "discounted_price": 80.0, "on_sale": true}
```

**Key Takeaway**: Use `@model_validator(mode="after")` for cross-field validation and `@computed_field` with `@property` for derived values included in serialization.

**Why It Matters**: Cross-field validation eliminates a class of inconsistent state bugs that single-field validators cannot catch. A date range where `end_date < start_date`, a price where `discount > original_price`, or mismatched passwords are all detected at the model boundary before business logic executes. Computed fields keep derived values consistent—`discounted_price` always reflects the current `price` and `discount_percent`, eliminating the desynchronization that occurs when computed values are stored separately.

---

### Example 47: Pydantic Aliases and Config

Pydantic field aliases map external JSON field names (often camelCase from JavaScript) to Python attribute names (snake_case). The `model_config` class enables customizing serialization behavior for the whole model.

```python
# main.py - Pydantic aliases for JSON field name mapping
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel, Field
from pydantic.alias_generators import to_camel

app = FastAPI()

class OrderItem(BaseModel):
    model_config = {                  # => Pydantic v2 model configuration
        "populate_by_name": True,     # => Accept both snake_case and camelCase
                                      # => Without this: only alias works for input
        "alias_generator": to_camel,  # => Auto-generate camelCase aliases for all fields
                                      # => snake_case Python names <-> camelCase JSON names
    }

    product_id: int                   # => Python: product_id; JSON: productId (auto-aliased)
    unit_price: float                 # => Python: unit_price; JSON: unitPrice
    quantity: int
    discount_code: Optional[str] = None
                                      # => Python: discount_code; JSON: discountCode

class LegacyItem(BaseModel):          # => Manual aliases for non-standard external field names
    item_id: int = Field(alias="ItemID")
                                      # => JSON field "ItemID" maps to Python item_id
    item_name: str = Field(alias="ItemName")
    unit_cost: float = Field(alias="Cost_USD")
                                      # => Non-standard: legacy system uses Cost_USD

@app.post("/orders/items", response_model=OrderItem)
def create_order_item(item: OrderItem):
                                      # => Accepts JSON with camelCase keys:
                                      # => {"productId": 1, "unitPrice": 9.99, "quantity": 2}
    return item                       # => Response also uses camelCase (alias_generator)

@app.post("/legacy/items", response_model=LegacyItem)
def create_legacy_item(item: LegacyItem):
                                      # => Accepts JSON: {"ItemID": 1, "ItemName": "Widget", "Cost_USD": 9.99}
                                      # => item.item_id = 1, item.item_name = "Widget"
    return item
# Note: To serialize responses using aliases, add:
# @app.post("/orders/items", response_model=OrderItem)
# def ...:
#     return item.model_dump(by_alias=True)  # => Returns {"productId": ...} instead of {"product_id": ...}
```

**Key Takeaway**: Use `alias_generator=to_camel` with `populate_by_name=True` to automatically map between Python snake_case attributes and JSON camelCase keys. Use `Field(alias="...")` for individual field overrides.

**Why It Matters**: JavaScript clients send camelCase JSON keys while Python uses snake_case by convention. Without aliases, APIs must choose between inconsistent Python code (using camelCase attribute names) or inconsistent JavaScript clients (using snake_case JSON). Pydantic aliases let both sides follow their native conventions—Python code reads `item.product_id` while the JSON wire format shows `"productId"`. The `alias_generator=to_camel` approach converts an entire model automatically, eliminating per-field alias declarations that become maintenance overhead as models grow.

---

## Group 20: Background Processing and Advanced Patterns

### Example 48: Dependency-Scoped Caching with functools.cache

Cache expensive computations and external lookups at multiple scopes: per-request (via dependency chain), per-process (via module-level LRU cache), or externally (via Redis). This example shows in-process caching patterns.

```python
# main.py - In-process caching strategies
from functools import lru_cache
from typing import Annotated
import time
from fastapi import FastAPI, Depends

app = FastAPI()

# Process-level cache: persists for the lifetime of the process
@lru_cache(maxsize=128)               # => Cache up to 128 unique argument combinations
def expensive_computation(key: str) -> dict:
                                      # => Function must be deterministic for caching to be safe
    print(f"[CACHE MISS] Computing for key: {key}")
    time.sleep(0.1)                   # => Simulate 100ms computation
    return {"key": key, "result": key.upper() * 3, "computed_at": time.time()}
                                      # => time.time() changes each call
                                      # => But lru_cache returns CACHED result after first call
                                      # => So computed_at is the time of first computation

@lru_cache(maxsize=10)
def get_config_from_external() -> dict:
                                      # => Read config from file/env once; cache forever
    print("[CACHE MISS] Reading config")
    return {"theme": "dark", "max_items": 100}

# Request-scoped cache via dependency chain (previous Example 29 showed this)
# FastAPI caches dependency results within a single request automatically

class SimpleCache:                    # => Simple TTL-aware in-process cache
    def __init__(self, ttl_seconds: int = 60):
        self._cache: dict = {}
        self._expiry: dict = {}
        self.ttl = ttl_seconds

    def get(self, key: str):
        if key in self._cache:
            if time.time() < self._expiry[key]: # => Check if not expired
                return self._cache[key]         # => Return cached value
            del self._cache[key]                # => Remove expired entry
            del self._expiry[key]
        return None                             # => Cache miss

    def set(self, key: str, value) -> None:
        self._cache[key] = value
        self._expiry[key] = time.time() + self.ttl
                                               # => Store expiry timestamp

item_cache = SimpleCache(ttl_seconds=30)       # => Cache items for 30 seconds

@app.get("/compute/{key}")
def compute(key: str):
    return expensive_computation(key)           # => Second call with same key: instant
                                               # => lru_cache returns cached result

@app.get("/items-cached/{item_id}")
def get_item_cached(item_id: int):
    cache_key = f"item:{item_id}"
    cached = item_cache.get(cache_key)
    if cached is not None:
        return {**cached, "from_cache": True}   # => Cache hit: return immediately
    result = {"id": item_id, "name": f"item-{item_id}", "price": 9.99}
    item_cache.set(cache_key, result)           # => Store in cache for 30 seconds
    return {**result, "from_cache": False}      # => Cache miss: computed and cached
```

**Key Takeaway**: Use `@lru_cache` for process-level memoization of pure functions. Build a simple TTL cache class for time-sensitive data. FastAPI's dependency system handles request-scoped caching automatically.

**Why It Matters**: In-process caching reduces database load and external API calls by orders of magnitude for frequently accessed, slowly changing data. Configuration values, permission sets, and lookup tables read from a database on every request create unnecessary load. An `lru_cache` on a `get_permissions()` function cuts 1,000 permission-check database queries to one per cache entry per process lifetime. For distributed systems with multiple processes, elevate to Redis for shared cache state across all instances.

---

### Example 49: Request Context with Middleware

Pass request-scoped data between middleware and handlers using Python's `contextvars` module. This enables tracing information, authenticated user objects, and request IDs to flow through the call stack without explicit parameter passing.

```python
# main.py - Request context with contextvars for tracing
import uuid
from contextvars import ContextVar
from fastapi import FastAPI, Request

app = FastAPI()

# ContextVar: per-async-task storage (per-coroutine, per-request in FastAPI)
request_id_var: ContextVar[str] = ContextVar("request_id", default="unknown")
                                      # => Each coroutine (request) has its own value
                                      # => Setting in middleware sets it for this request only
                                      # => Other concurrent requests have their own values

current_user_var: ContextVar[dict] = ContextVar("current_user", default={})

@app.middleware("http")
async def context_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
                                      # => Use client-provided ID or generate new one
    token = request_id_var.set(request_id)
                                      # => Set value in ContextVar for this coroutine
                                      # => token allows resetting to previous value
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
                                      # => Echo request ID back to client for correlation
        return response
    finally:
        request_id_var.reset(token)   # => Reset to previous value after request
                                      # => Prevents context bleeding between requests

def get_request_id() -> str:          # => Helper to read request ID anywhere
    return request_id_var.get()       # => Returns the ID set by middleware for current request

def log(message: str) -> None:
    rid = get_request_id()
    print(f"[{rid[:8]}] {message}")   # => All logs include request ID prefix

@app.get("/items/{item_id}")
async def get_item(item_id: int):
    log(f"Fetching item {item_id}")   # => Log includes request ID without explicit param
                                      # => "[a7c3f2e1] Fetching item 42"
    # Simulate service call
    log("Calling database")
    return {
        "item_id": item_id,
        "request_id": get_request_id(),
                                      # => Include request ID in response for debugging
    }
```

**Key Takeaway**: Use `ContextVar` to store request-scoped data set in middleware and read in handlers or service functions without passing it as explicit parameters through the call chain.

**Why It Matters**: Distributed tracing requires correlating all log lines from a single request across potentially dozens of function calls. Without `ContextVar`, every function that logs must accept a `request_id` parameter—polluting every function signature with infrastructure concerns. `ContextVar` gives each concurrent request its own isolated context, allowing tracing data to flow implicitly through the async call stack. OpenTelemetry's Python SDK uses `ContextVar` internally for trace context propagation, making it the standard approach for distributed tracing integration.

---

### Example 50: Pagination with Cursor-Based Approach

Offset-based pagination degrades at scale (large OFFSETs scan all preceding rows). Cursor-based pagination uses an opaque bookmark into the dataset, maintaining constant query performance regardless of page depth.

```python
# main.py - Cursor-based pagination for scalable list endpoints
from typing import Optional, List
from fastapi import FastAPI, Query
from pydantic import BaseModel
import base64
import json

app = FastAPI()

# Simulated dataset
items = [{"id": i, "name": f"Item {i}", "created_at": i * 1000} for i in range(1, 101)]
                                      # => 100 items with id 1..100

class PaginatedResponse(BaseModel):
    items: List[dict]
    next_cursor: Optional[str] = None # => None means no more pages
    has_more: bool

def encode_cursor(item_id: int) -> str:
    payload = json.dumps({"id": item_id})
    return base64.b64encode(payload.encode()).decode()
                                      # => Encodes {"id": 42} as base64 opaque string
                                      # => Clients treat this as an opaque bookmark

def decode_cursor(cursor: str) -> Optional[int]:
    try:
        payload = base64.b64decode(cursor.encode()).decode()
        return json.loads(payload)["id"]
                                      # => Decodes back to {"id": 42} => returns 42
    except Exception:
        return None                   # => Invalid cursor: start from beginning

@app.get("/items/cursor-paginated", response_model=PaginatedResponse)
def list_items_cursor(
    cursor: Optional[str] = Query(default=None, description="Pagination cursor from previous response"),
                                      # => cursor=None means start from beginning
    limit: int = Query(default=10, ge=1, le=50),
):
    if cursor is None:
        start_id = 0                  # => Start from first item
    else:
        start_id = decode_cursor(cursor) or 0
                                      # => Resume from cursor position

    # Filter and paginate (in real code: WHERE id > start_id LIMIT limit+1)
    filtered = [item for item in items if item["id"] > start_id]
                                      # => Items after cursor position
    page_items = filtered[: limit + 1]
                                      # => Fetch one extra to detect if more pages exist

    has_more = len(page_items) > limit
                                      # => Extra item exists => more pages available
    result_items = page_items[:limit] # => Trim back to requested limit

    next_cursor = None
    if has_more and result_items:
        next_cursor = encode_cursor(result_items[-1]["id"])
                                      # => Cursor points to last returned item's ID

    return PaginatedResponse(
        items=result_items,
        next_cursor=next_cursor,
        has_more=has_more,
    )
# GET /items/cursor-paginated => Returns items 1-10, next_cursor="eyJpZCI6IDEwfQ=="
# GET /items/cursor-paginated?cursor=eyJpZCI6IDEwfQ== => Returns items 11-20
```

**Key Takeaway**: Cursor-based pagination uses an opaque encoded position marker instead of numeric offsets. Query `WHERE id > cursor_id LIMIT n+1` maintains constant query performance regardless of page depth.

**Why It Matters**: Offset pagination performs full table scans to skip N rows before returning results. At page 1000 with 20 items per page, the database scans 20,000 rows it immediately discards—a performance cliff that slows response times linearly with page number. Cursor-based pagination uses `WHERE id > last_id LIMIT 20`, which hits an index directly regardless of which "page" is requested. For APIs exposing datasets with millions of rows, cursor pagination maintains sub-10ms query times at any depth while offset pagination degrades to seconds.

---

### Example 51: Error Response Standardization

Standardize all error responses across your API to a consistent JSON structure. This enables clients to write one error-handling function instead of parsing different formats from different endpoints.

```python
# main.py - Standardized error response format
from typing import Any, Optional
from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

class ErrorResponse(BaseModel):       # => Standard error response envelope
    error_code: str                   # => Machine-readable code: "ITEM_NOT_FOUND"
    message: str                      # => Human-readable message
    details: Optional[Any] = None     # => Additional context (validation errors, etc.)

def make_error(code: str, message: str, details=None) -> dict:
    return ErrorResponse(
        error_code=code,
        message=message,
        details=details,
    ).model_dump()                    # => Convert to dict for JSONResponse

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
                                      # => Override default HTTPException handler
                                      # => exc.status_code: HTTP status code
                                      # => exc.detail: original detail string
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        429: "RATE_LIMITED",
        500: "INTERNAL_ERROR",
    }
    return JSONResponse(
        status_code=exc.status_code,
        content=make_error(
            code=code_map.get(exc.status_code, "HTTP_ERROR"),
            message=str(exc.detail),
        ),
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
                                      # => Override default 422 validation error handler
    return JSONResponse(
        status_code=422,
        content=make_error(
            code="VALIDATION_ERROR",
            message="Request validation failed",
            details=exc.errors(),     # => List of individual field errors
        ),
    )

@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id != 1:
        raise HTTPException(status_code=404, detail="Item not found")
                                      # => Handler returns: {"error_code": "NOT_FOUND", "message": "Item not found"}
    return {"id": 1, "name": "Widget"}
```

**Key Takeaway**: Register `@app.exception_handler()` for `HTTPException` and `RequestValidationError` to replace FastAPI's default error format with a consistent application-wide error envelope.

**Why It Matters**: Inconsistent error response formats force clients to write multiple error parsers—one for validation errors (array format), one for HTTP errors (string format), and one for unhandled exceptions (HTML format). A single `ErrorResponse` envelope lets clients write one error handler function for all endpoints: read `error.error_code` for programmatic handling and `error.message` for display. Machine-readable `error_code` strings enable client-side retry logic, localization of error messages, and analytics on which errors occur most frequently in production.

---

### Example 52: Async Context Manager Dependencies

Generator dependencies with `yield` support async cleanup using `async with` patterns. This enables dependencies to open resources, yield them to the handler, and clean up after the response is sent—essential for database transactions and external API sessions.

```python
# main.py - Async context manager dependencies
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Depends
import asyncio

app = FastAPI()

class AsyncHTTPSession:               # => Simulated async HTTP client session
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.closed = False
        print(f"[Session] Opened connection to {base_url}")

    async def get(self, path: str) -> dict:
        await asyncio.sleep(0.01)     # => Simulate HTTP request
        return {"url": f"{self.base_url}{path}", "data": "response"}

    async def close(self):
        self.closed = True
        print(f"[Session] Closed connection to {self.base_url}")

async def get_http_session() -> AsyncGenerator[AsyncHTTPSession, None]:
                                      # => Generator yields session; cleanup runs after handler
    session = AsyncHTTPSession("https://api.external-service.com")
    try:
        yield session                 # => Handler receives the session
    finally:
        await session.close()         # => Always closed, even if handler raises exception

class DatabaseTransaction:            # => Simulated database transaction context
    def __init__(self, session):
        self.session = session
        self.committed = False

    async def commit(self):
        self.committed = True
        print("[TX] Transaction committed")

    async def rollback(self):
        print("[TX] Transaction rolled back")

async def get_transaction(db = None):
                                      # => In production: db would be injected via Depends(get_db)
    tx = DatabaseTransaction(db)
    try:
        yield tx                      # => Handler uses tx; can call tx.commit()
        if not tx.committed:
            await tx.rollback()       # => Auto-rollback if handler didn't commit
    except Exception:
        await tx.rollback()           # => Rollback on any exception
        raise                         # => Re-raise after rollback

@app.get("/external-data")
async def fetch_external(
    session: AsyncHTTPSession = Depends(get_http_session),
                                      # => session is open for duration of this handler
):
    result = await session.get("/users")
    return result                     # => Session closed automatically after return
```

**Key Takeaway**: Use `async def` generators with `yield` for dependencies that require async setup and cleanup. The `try/finally` pattern guarantees cleanup runs even when handlers raise exceptions.

**Why It Matters**: Resource cleanup guarantees prevent connection leaks that accumulate into system failures. An HTTP session that is not explicitly closed keeps a TCP connection open in `CLOSE_WAIT` state—harmless individually but catastrophic at scale when thousands of leaked connections exhaust the operating system's connection table. The `try/finally` pattern around `yield` makes cleanup unconditional: network errors, validation failures, and unhandled exceptions in handlers all trigger the cleanup path. This is the FastAPI-recommended pattern for database transaction management, replacing the `try/except/commit/rollback` boilerplate repeated in every handler.

---

### Example 53: Custom OpenAPI Schema Injection

Extend FastAPI's automatically generated OpenAPI schema with custom security schemes, additional metadata, webhook definitions, and schema extensions. This enables compatibility with API gateway tools that parse the schema.

```python
# main.py - Customizing the OpenAPI schema
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI()

@app.get("/items")
def list_items():
    return []

@app.get("/health")
def health():
    return {"status": "ok"}

def custom_openapi():
    if app.openapi_schema:            # => Return cached schema if already generated
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="My API",
        version="1.0.0",
        description="Custom OpenAPI schema with extensions",
        routes=app.routes,            # => Generate from registered routes
    )

    # Add API key security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "ApiKeyHeader": {             # => Define API key in header scheme
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",      # => Header name clients should send
        },
        "BearerAuth": {               # => Define JWT Bearer scheme
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",    # => Hints to tools that this is a JWT
        },
    }

    # Add x-logo extension for ReDoc
    openapi_schema["info"]["x-logo"] = {
        "url": "https://example.com/logo.png",
                                      # => Logo displayed in ReDoc documentation
    }

    # Add webhook definitions
    openapi_schema["webhooks"] = {
        "item-created": {             # => Webhook name
            "post": {
                "description": "Fired when a new item is created",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/Item"}
                        }
                    }
                },
                "responses": {"200": {"description": "Webhook received"}},
            }
        }
    }

    app.openapi_schema = openapi_schema  # => Cache for subsequent requests
    return app.openapi_schema

app.openapi = custom_openapi          # => Replace default openapi() method
```

**Key Takeaway**: Replace `app.openapi` with a custom function to modify the generated OpenAPI schema. Add security schemes, webhooks, and vendor extensions without losing auto-generation from route definitions.

**Why It Matters**: API gateway products (AWS API Gateway, Kong, Apigee) import OpenAPI schemas to configure routing, rate limiting, and authentication. These tools often require specific security scheme definitions or vendor extension fields (`x-amazon-apigateway-integration`, `x-kong-plugin-*`) not generated by FastAPI's default schema. Custom schema injection lets you maintain FastAPI's schema auto-generation for route documentation while adding gateway-specific annotations, eliminating hand-maintained schema files that drift out of sync with implementation.

---

### Example 54: Testing Async Endpoints with AsyncClient

For endpoints that use async dependencies or test teardown logic that requires async cleanup, use `httpx.AsyncClient` with `ASGITransport` and `pytest-asyncio`.

```python
# test_async.py - Async endpoint testing with AsyncClient
# pip install httpx pytest-asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    id: int
    name: str

@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    return Item(id=item_id, name=f"item-{item_id}")

@app.post("/items", response_model=Item, status_code=201)
async def create_item(item: Item):
    return item

# pytest configuration: add to pyproject.toml or pytest.ini
# [tool.pytest.ini_options]
# asyncio_mode = "auto"               # => All async test functions run with asyncio

@pytest.mark.asyncio                  # => Mark test as async (or use asyncio_mode=auto)
async def test_get_item():
    async with AsyncClient(
        transport=ASGITransport(app=app),
                                      # => ASGITransport routes requests to app without network
        base_url="http://test",       # => Dummy base URL; actual requests go to app
    ) as client:
        response = await client.get("/items/42")
                                      # => await: async HTTP request
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 42
        assert data["name"] == "item-42"

@pytest.mark.asyncio
async def test_create_item():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        payload = {"id": 1, "name": "Widget"}
        response = await client.post("/items", json=payload)
        assert response.status_code == 201
        assert response.json()["name"] == "Widget"

@pytest.fixture
async def async_client():             # => Reusable async client fixture
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client                  # => Yield to tests; cleanup runs after test

@pytest.mark.asyncio
async def test_using_fixture(async_client: AsyncClient):
    response = await async_client.get("/items/1")
                                      # => Use fixture client directly
    assert response.status_code == 200
```

**Key Takeaway**: Use `httpx.AsyncClient` with `ASGITransport(app=app)` for async test functions. Create a reusable `async_client` fixture for tests that share setup and teardown.

**Why It Matters**: Async test clients accurately test async endpoints including `await` chains in handlers, middleware, and dependencies. A synchronous `TestClient` wraps async code in a synchronous adapter that can mask timing-dependent bugs in concurrent code. `AsyncClient` also enables testing `asyncio.gather` patterns and concurrent request simulation in tests, catching race conditions in shared state before they cause production incidents. The fixture pattern reduces boilerplate and ensures client cleanup runs reliably even when assertions fail.

---

### Example 55: Health Check and Readiness Endpoints

Production deployments require health check endpoints for load balancers and container orchestrators. Distinguish between liveness (is the process running?) and readiness (can it serve traffic?) checks.

```python
# main.py - Liveness and readiness health check endpoints
import asyncio
import time
from fastapi import FastAPI, Response, status
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# Application state tracking
class AppState:
    started_at: float = time.time()
    database_healthy: bool = True     # => Updated by background health checker
    cache_healthy: bool = True
    shutting_down: bool = False       # => Set True when SIGTERM received

state = AppState()

class HealthStatus(BaseModel):
    status: str                       # => "healthy" | "degraded" | "unhealthy"
    uptime_seconds: float
    checks: dict

async def check_database() -> bool:
    try:
        await asyncio.sleep(0.001)    # => Simulate DB ping (use real connection in production)
        return True
    except Exception:
        return False

async def check_external_api() -> bool:
    # In production: ping external dependency
    return True                       # => Simplified for example

@app.get("/health/live")
async def liveness():                 # => Liveness: is the process alive and not deadlocked?
                                      # => Load balancer uses this to decide restart
                                      # => Should NEVER check external dependencies
    if state.shutting_down:
        return Response(
            content='{"status": "shutting_down"}',
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                      # => 503 tells LB to stop sending new requests
            media_type="application/json",
        )
    return {"status": "alive", "uptime": time.time() - state.started_at}

@app.get("/health/ready")
async def readiness():                # => Readiness: can the app serve requests?
                                      # => Kubernetes uses this for deployment health
                                      # => Should check all dependencies
    db_ok = await check_database()
    api_ok = await check_external_api()

    all_healthy = db_ok and api_ok
    status_str = "healthy" if all_healthy else "degraded"
    http_status = 200 if all_healthy else 503
                                      # => 503 during startup until DB connects
                                      # => Kubernetes won't route traffic until 200

    return Response(
        content=HealthStatus(
            status=status_str,
            uptime_seconds=time.time() - state.started_at,
            checks={"database": db_ok, "external_api": api_ok},
        ).model_dump_json(),
        status_code=http_status,
        media_type="application/json",
    )
```

**Key Takeaway**: Implement separate `/health/live` (process alive, no external checks) and `/health/ready` (dependencies healthy, can serve traffic) endpoints. Return 503 from readiness when dependencies are unavailable.

**Why It Matters**: Kubernetes and ECS rely on health check endpoints to prevent traffic routing to unhealthy pods. A single `/health` endpoint that checks the database creates a circular failure: when the database is slow, health checks time out, the pod is killed, it restarts and immediately checks the database again—amplifying load on an already struggling database. Separate liveness and readiness endpoints break this cycle: liveness keeps the pod alive, while readiness gates traffic until the database connection pool is established, allowing graceful degradation under partial failures.
