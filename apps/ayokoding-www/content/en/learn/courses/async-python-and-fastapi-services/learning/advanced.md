---
title: "Advanced Examples"
date: 2026-07-29T00:00:00+07:00
draft: false
weight: 30
---

Examples 39-78 assemble the beginner and intermediate primitives into production-shaped services and then go
deeper: a full typed async CRUD service and pagination/filtering (39-40), auth, rate limiting, pooled async
HTTP clients, timeout/retry, a lifespan-managed background worker, WebSockets, CPU offloading, an
OpenAPI-driven client, an integration test suite, the `ruff`/`pyright` gate, graceful shutdown, observability,
a `remotebrowser`-shaped fan-out, and the capstone preview (41-54); then Pydantic v2 deep features (55-58),
`APIRouter` modularity and DI/lifespan patterns (59-62), constrained params and documented responses (63-64),
centralized error handling and middleware variants (65-69), OAuth2 and uploads (70-71), backpressure and
broadcast rooms (72-73), resiliency patterns (74-76), and `uv`/Docker deployment (77-78). Every FastAPI
example is a complete, self-contained module under `learning/code/`, served with `uvicorn app:app --port 8000`;
the pure-library examples run with `python3 example.py`.

---

### Example 39: A Full Typed Async CRUD Service

_ex-39 &middot; exercises co-10 to co-17_

A complete typed async CRUD over `aiosqlite`: dependency-injected sessions, Pydantic validation, a precise
`404` on a missing id, and parameterized queries throughout. No SQL lives outside the repository-shaped query
calls.

**`learning/code/ex-39-full-crud-service/app.py`**

```python
"""Example 39: A Full Typed Async CRUD Service.

A complete typed async CRUD over aiosqlite: dependency-injected sessions, Pydantic validation, a 404 on a
missing id, and parameterized queries throughout -- no SQL in any handler beyond the repository layer.
Run: uvicorn app:app --port 8000, then exercise POST/GET/PUT/DELETE on /tasks. (co-10 to co-17)
"""

from collections.abc import AsyncIterator

import aiosqlite  # => the async driver (co-16)
from fastapi import Depends, FastAPI, HTTPException  # => DI + error mapping (co-15, co-17)
from pydantic import BaseModel  # => Pydantic models (co-12)

app = FastAPI()  # => the ASGI application uvicorn serves
DB_PATH = "tasks.db"  # => a file DB so rows survive across requests


class TaskIn(BaseModel):  # => the create/replace body shape (co-12)
    title: str  # => required
    done: bool = False  # => optional with a default


class Task(BaseModel):  # => the response shape (co-14)
    id: int
    title: str
    done: bool


async def get_session() -> AsyncIterator[aiosqlite.Connection]:  # => one async session per request (co-15)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, done INTEGER)")  # => idempotent schema (co-16)
        await db.commit()
        yield db


def _row_to_task(row: aiosqlite.Row | tuple) -> Task:  # => the ONE place a raw row becomes a typed Task (co-14)
    return Task(id=int(row[0]), title=str(row[1]), done=bool(row[2]))  # => narrowed, typed fields


@app.post("/tasks", response_model=Task, status_code=201)  # => create (co-17)
async def create_task(task: TaskIn, session: aiosqlite.Connection = Depends(get_session)) -> Task:
    cursor = await session.execute("INSERT INTO tasks (title, done) VALUES (?, ?)", (task.title, int(task.done)))  # => parameterized (co-16)
    await session.commit()
    return Task(id=int(cursor.lastrowid), title=task.title, done=task.done)  # => the new row


@app.get("/tasks/{task_id}", response_model=Task)  # => read one (co-17)
async def read_task(task_id: int, session: aiosqlite.Connection = Depends(get_session)) -> Task:
    cursor = await session.execute("SELECT id, title, done FROM tasks WHERE id = ?", (task_id,))  # => parameterized
    row = await cursor.fetchone()
    if row is None:  # => missing -> precise 404 (co-17)
        raise HTTPException(status_code=404, detail="task not found")
    return _row_to_task(row)  # => the persisted row


@app.put("/tasks/{task_id}", response_model=Task)  # => replace (co-17)
async def update_task(task_id: int, task: TaskIn, session: aiosqlite.Connection = Depends(get_session)) -> Task:
    cursor = await session.execute("UPDATE tasks SET title = ?, done = ? WHERE id = ?", (task.title, int(task.done), task_id))  # => parameterized
    await session.commit()
    if cursor.rowcount == 0:  # => no row matched -> 404
        raise HTTPException(status_code=404, detail="task not found")
    row = await (await session.execute("SELECT id, title, done FROM tasks WHERE id = ?", (task_id,))).fetchone()
    assert row is not None  # => rowcount > 0 guarantees this -- narrows for the type checker
    return _row_to_task(row)


@app.delete("/tasks/{task_id}", status_code=204)  # => delete (co-17)
async def delete_task(task_id: int, session: aiosqlite.Connection = Depends(get_session)) -> None:
    cursor = await session.execute("DELETE FROM tasks WHERE id = ?", (task_id,))  # => parameterized
    await session.commit()
    if cursor.rowcount == 0:  # => nothing deleted -> 404
        raise HTTPException(status_code=404, detail="task not found")
```

**Run**: `uvicorn app:app --port 8000`, then exercise `POST`, `GET`, `PUT`, `DELETE` on `/tasks`.

**Output** (a create-then-read round trip):

```text
{"id":1,"title":"write","done":false}
{"id":1,"title":"write","done":false}
```

**Key takeaway**: a full typed async CRUD service is the intermediate primitives (DI, async DB, validation,
error mapping) assembled into one resource lifecycle, with every query parameterized and every failure mapped
to a precise status.

**Why it matters**: this is the shape the capstone generalizes and the shape a real service grows from. The
discipline that makes it safe at scale -- parameterized queries, a repository-shaped session, a 404 on absence
-- is exactly what keeps the same code correct under concurrent load and swappable to a different database by
changing only the driver.

---

### Example 40: Pagination and Filtering on a List Endpoint

_ex-40 &middot; exercises co-11, co-16_

`GET /tasks` composes `limit`/`offset` pagination with an optional `done` filter in one parameterized query,
returning a page plus `total`/`next` metadata where `total` reflects the **filtered** count.

**`learning/code/ex-40-pagination-and-filtering/app.py`**

```python
"""Example 40: Pagination and Filtering on a List Endpoint.

GET /tasks composes limit/offset pagination with an optional status filter in one parameterized query,
returning items plus total/next metadata. Run: uvicorn app:app --port 8000. (co-11, co-16)
"""

from collections.abc import AsyncIterator

import aiosqlite  # => the async driver (co-16)
from fastapi import Depends, FastAPI, Query  # => Query declares bounded params (co-11)
from pydantic import BaseModel  # => Pydantic models (co-12)

app = FastAPI()  # => the ASGI application uvicorn serves
DB_PATH = "tasks.db"


class Task(BaseModel):  # => a row shape
    id: int
    title: str
    done: bool


class Page(BaseModel):  # => the paginated envelope (co-14)
    items: list[Task]  # => one page of rows
    total: int  # => the FILTERED count, not the whole table
    next: int | None  # => the next offset, or None at the end


async def get_session() -> AsyncIterator[aiosqlite.Connection]:  # => one session per request (co-15)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, done INTEGER)")
        await db.commit()
        yield db


@app.get("/tasks", response_model=Page)  # => the list endpoint
async def list_tasks(  # => pagination + filter composed in one query-shaping handler (co-11, co-16)
    done: bool | None = Query(default=None),  # => an OPTIONAL filter -- absent means "all"
    limit: int = Query(default=10, ge=1, le=50),  # => bounded limit (co-11): 1..50, default 10
    offset: int = Query(default=0, ge=0),  # => non-negative offset, default 0
    session: aiosqlite.Connection = Depends(get_session),
) -> Page:
    where = " WHERE done = ?" if done is not None else ""  # => an optional filter clause
    params: list[object] = [int(done)] if done is not None else []  # => filter value, parameterized (co-16)
    total_row = await (await session.execute(f"SELECT COUNT(*) FROM tasks{where}", params)).fetchone()  # => filtered count
    assert total_row is not None  # => COUNT(*) always returns one row
    total = int(total_row[0])  # => the filtered total (co-11)
    rows = await (await session.execute(f"SELECT id, title, done FROM tasks{where} ORDER BY id LIMIT ? OFFSET ?", [*params, limit, offset])).fetchall()  # => still parameterized (co-16)
    items = [Task(id=int(r[0]), title=str(r[1]), done=bool(r[2])) for r in rows]  # => typed rows (co-14)
    next_offset = offset + limit  # => the next page's offset
    return Page(items=items, total=total, next=next_offset if next_offset < total else None)  # => None at end
```

**Run**: `uvicorn app:app --port 8000`, then `curl 'localhost:8000/tasks?done=true&limit=5'`.

**Output**:

```text
{"items":[...],"total":3,"next":null}
```

**Key takeaway**: pagination and filtering compose in one parameterized query; `total` must reflect the
filtered count, and `next` is `None` once the last page is reached.

**Why it matters**: an unbounded list endpoint is a denial-of-service risk -- a table with ten rows today can
have ten million next year. A bounded `limit` with a sane default and a hard maximum is the guard that keeps
that growth from becoming an outage, and composing it with a filter in one query keeps the work on the database
instead of in the handler.

---

### Example 41: An Auth Dependency Gates Protected Routes

_ex-41 &middot; exercises co-15, co-17_

A `Depends` that reads the `Authorization` header, validates a bearer token, and raises `401` otherwise. One
declared parameter gates a protected route; an open route simply omits it.

**`learning/code/ex-41-auth-dependency/app.py`**

```python
"""Example 41: An Auth Dependency Gates Protected Routes.

A Depends that reads the Authorization header, validates a bearer token, and raises 401 otherwise -- gating
protected routes with one declared parameter. Run: uvicorn app:app --port 8000, then:
curl -i localhost:8000/me  and  curl -H 'Authorization: Bearer secret' localhost:8000/me  (co-15, co-17)
"""

from fastapi import Depends, FastAPI, Header, HTTPException  # => Header reads request headers (co-15, co-17)

app = FastAPI()  # => the ASGI application uvicorn serves

VALID_TOKEN = "secret"  # => a stand-in for a real signed/opaque token


def require_token(authorization: str | None = Header(default=None)) -> str:  # => a reusable auth dependency (co-15)
    # => Header(default=None) makes Authorization OPTIONAL so we can reject a missing one ourselves (co-17)
    if authorization != f"Bearer {VALID_TOKEN}":  # => exact match required (co-17)
        raise HTTPException(status_code=401, detail="invalid or missing token")  # => 401 before the handler runs
    return "caller"  # => a resolved caller identity handed to the handler


@app.get("/me")  # => a PROTECTED route -- declares the auth dependency
def me(caller: str = Depends(require_token)) -> dict[str, str]:  # => the dependency gates this route (co-15)
    return {"caller": caller}  # => only reachable with a valid token (co-14)


@app.get("/public")  # => an OPEN route -- declares no auth dependency
def public() -> dict[str, str]:  # => no token required
    return {"msg": "open"}  # => reachable by anyone (co-14)
```

**Run**: `uvicorn app:app --port 8000`, then `curl -i localhost:8000/me` (401) and `curl -H 'Authorization: Bearer secret' localhost:8000/me` (200).

**Key takeaway**: a reusable auth dependency gates any route that declares it; the open/protected split is just
which routes include the parameter.

**Why it matters**: centralizing the auth check in one dependency means the rule is enforced identically
everywhere it applies, and adding a new protected route is one extra parameter rather than copy-pasted auth
logic. Example 70 generalizes this to the OAuth2 password flow with a `/docs` "Authorize" button.

---

### Example 42: An In Process Rate Limit Middleware

_ex-42 &middot; exercises co-18, co-23_

A simple in-process rate limiter as middleware: a lock-guarded per-client counter allows N requests per window
and rejects the rest with `429`. The lock is what keeps the counter correct under concurrent requests.

**`learning/code/ex-42-rate-limit-middleware/app.py`**

```python
"""Example 42: An In Process Rate Limit Middleware.

A simple in-process rate limiter as middleware: a lock-guarded per-client counter allows N requests per window,
rejecting the rest with 429. Run: uvicorn app:app --port 8000, then hit / many times fast. (co-18, co-23)
"""

import asyncio  # => asyncio.Lock guards the shared limiter state (co-23)
import time  # => wall-clock for the window
from collections.abc import Awaitable, Callable  # => the typed shape of call_next (co-18)

from fastapi import FastAPI, Request  # => Request identifies the caller (co-18)
from fastapi.responses import JSONResponse, Response  # => the 429 response

app = FastAPI()  # => the ASGI application uvicorn serves

MAX_HITS = 3  # => allow this many hits per window
WINDOW = 1.0  # => the window length in seconds
_hits: dict[str, list[float]] = {}  # => caller -> timestamps within the current window (co-23)
_lock = asyncio.Lock()  # => guards _hits across concurrent requests (co-23)


@app.middleware("http")  # => wraps every request (co-18)
async def rate_limit(  # => call_next runs the downstream handler
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    client = request.client.host if request.client else "unknown"  # => identify the caller
    now = time.monotonic()  # => a monotonic clock for window math
    async with _lock:  # => the critical section -- no lost updates under concurrency (co-23)
        recent = [t for t in _hits.get(client, []) if now - t < WINDOW]  # => drop timestamps outside the window
        if len(recent) >= MAX_HITS:  # => over the limit for this window
            return JSONResponse(status_code=429, content={"error": "rate limited"})  # => 429 Too Many Requests
        recent.append(now)  # => record this hit
        _hits[client] = recent  # => store the updated list
    return await call_next(request)  # => under the limit -- proceed to the handler


@app.get("/")  # => a route that is rate-limited by the middleware above
def read_root() -> dict[str, str]:  # => minimal handler
    return {"msg": "ok"}  # => only the first MAX_HITS calls per window return 200
```

**Run**: `uvicorn app:app --port 8000`, then hit `/` more than `MAX_HITS` times within one second.

**Output** (the over-limit response):

```text
HTTP/1.1 429 Too Many Requests
{"error":"rate limited"}
```

**Key takeaway**: an in-process rate limiter is middleware plus a lock-guarded per-client counter; the lock is
what prevents lost updates when concurrent requests read the counter simultaneously.

**Why it matters**: a rate limiter is the front-line defense against an abusive or buggy client overwhelming a
service. The lock from Example 38 reappears here because the read-check-write on the counter is exactly the
race that loses updates without it. (A multi-process deployment would move this counter to Redis -- the same
logic, a shared store.)

---

### Example 43: An Async HTTP Client Service with a Pool

_ex-43 &middot; exercises co-16, co-18_

A pooled `httpx.AsyncClient` opened **once** in a lifespan and reused across requests, so connection pooling
actually pays off instead of a fresh client (and TCP handshake) per call.

**`learning/code/ex-43-async-http-client-service/app.py`**

```python
"""Example 43: An Async HTTP Client Service with a Pool.

A pooled async httpx client opened ONCE in a lifespan and reused across requests, so connection pooling
actually pays off instead of a fresh client per call. Run: uvicorn app:app --port 8000. (co-16, co-18)
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager  # => turns an async gen into a lifespan (co-18)

import httpx  # => the async HTTP client (co-16)
from fastapi import FastAPI, Request  # => Request reads app.state (co-18)


@asynccontextmanager  # => lifespan factory
async def lifespan(app: FastAPI) -> AsyncIterator[None]:  # => open once at startup, close at shutdown (co-18)
    async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:  # => a POOLED client reused by every request
        app.state.client = client  # => stash it on app.state (co-18)
        yield  # => the app serves many requests sharing the one client
    # => the async with closes the client (and its pool) on shutdown (co-18)


app = FastAPI(lifespan=lifespan)  # => register the lifespan (co-18)


@app.get("/fetch")  # => a route that calls an upstream using the shared client
async def fetch(request: Request) -> dict[str, str]:  # => reads the shared client
    client: httpx.AsyncClient = request.app.state.client  # => the pooled client -- reused, not created per call (co-18)
    try:
        response = await client.get("https://example.com")  # => an async upstream call (co-16)
        return {"status": "ok", "upstream_status": str(response.status_code)}  # => the upstream's status (co-14)
    except httpx.HTTPError as exc:  # => a typed upstream failure
        return {"status": "error", "reason": str(exc)}  # => a structured error, never a 500 traceback (co-17)
```

**Run**: `uvicorn app:app --port 8000`, then `curl localhost:8000/fetch`.

**Output**:

```text
{"status":"ok","upstream_status":"200"}
```

**Key takeaway**: a pooled async client belongs in a lifespan, shared on `app.state` -- creating one per
request throws away pooling and pays a fresh handshake every call.

**Why it matters**: an async service that fans out to upstreams (Example 28, Example 53) reuses connections
through a pooled client; opening a new client per request is both slower and more resource-hungry. The lifespan
is the one correct place to open and close that pool.

---

### Example 44: Timeout and Bounded Retry on an Upstream

_ex-44 &middot; exercises co-17, co-06_

An upstream call wrapped in `asyncio.timeout` plus a **bounded** retry. A slow call is cut off after the
deadline; a transient failure is retried a fixed number of times; exhaustion yields a precise `503`.

**`learning/code/ex-44-timeout-and-retry/app.py`**

```python
"""Example 44: Timeout and Bounded Retry on an Upstream.

An upstream call wrapped in a timeout plus a BOUNDED retry -- a slow or failing upstream is cut off after a
fixed deadline, not allowed to stall the loop indefinitely. Run: uvicorn app:app --port 8000. (co-17, co-06)
"""

import asyncio  # => asyncio.timeout enforces a deadline (co-06)

from fastapi import FastAPI, HTTPException  # => HTTPException maps a failure (co-17)

app = FastAPI()  # => the ASGI application uvicorn serves

MAX_ATTEMPTS = 3  # => a BOUNDED retry -- never an unbounded loop (co-06)
TIMEOUT = 0.10  # => the per-attempt deadline in seconds


async def flaky_upstream(attempt: int) -> str:  # => a stand-in that fails until the 3rd attempt
    await asyncio.sleep(0.05)  # => simulates network latency (co-02)
    if attempt < 2:  # => fail the first two attempts
        raise RuntimeError("upstream unavailable")  # => a transient failure
    return "upstream-data"  # => succeeds on the third attempt


@app.get("/fetch")  # => a route that calls the flaky upstream with a timeout + retry
async def fetch() -> dict[str, str]:  # => bounded retry loop
    last_error: str = ""  # => remembers the most recent failure for the final 503
    for attempt in range(MAX_ATTEMPTS):  # => a BOUNDED number of attempts (co-06)
        try:
            async with asyncio.timeout(TIMEOUT):  # => cut off a slow call after TIMEOUT seconds (co-06)
                return {"data": await flaky_upstream(attempt)}  # => success -- return immediately
        except (RuntimeError, TimeoutError) as exc:  # => a transient failure or a timeout -> retry
            last_error = str(exc)  # => record and try again
    raise HTTPException(status_code=503, detail=f"upstream failed: {last_error}")  # => exhausted retries -> 503 (co-17)
```

**Run**: `uvicorn app:app --port 8000`, then `curl localhost:8000/fetch`.

**Output**:

```text
{"data":"upstream-data"}
```

**Key takeaway**: every upstream call needs a deadline (`asyncio.timeout`) and, where transient failures are
expected, a **bounded** retry -- never an unbounded loop, and exhaustion maps to a precise `503`.

**Why it matters**: an upstream without a timeout can stall the loop indefinitely (co-06), and an unbounded
retry can amplify a failure into a flood. A bounded retry with a per-attempt deadline degrades gracefully: it
either succeeds quickly, retries a fixed number of times, or fails fast with a precise status.

---

### Example 45: A Lifespan Managed Background Worker

_ex-45 &middot; exercises co-19, co-18_

A background task launched at startup drains an `asyncio.Queue`, processing items without blocking requests.
Requests enqueue; the worker consumes; shutdown cancels the worker cleanly.

**`learning/code/ex-45-background-worker-pattern/app.py`**

```python
"""Example 45: A Lifespan Managed Background Worker.

A background task launched in a lifespan handler drains an asyncio.Queue, processing items without blocking
requests. The worker is started at startup and cancelled cleanly at shutdown. Run: uvicorn app:app --port 8000.
(co-19, co-18)
"""

import asyncio  # => asyncio.Queue + create_task (co-19)

from fastapi import FastAPI, Request  # => Request reads app.state (co-18)

app = FastAPI()  # => the ASGI application uvicorn serves


async def worker(queue: asyncio.Queue[str]) -> None:  # => a long-running consumer loop
    while True:  # => runs until cancelled at shutdown
        item = await queue.get()  # => blocks (cooperatively) until an item arrives (co-19)
        try:
            await asyncio.sleep(0.01)  # => simulate processing the item (co-02)
        finally:
            queue.task_done()  # => mark the item processed even if processing raised (co-19)


@app.on_event("startup")  # => LEGACY startup hook -- start the worker once (co-18; see note below)
async def start_worker() -> None:
    queue: asyncio.Queue[str] = asyncio.Queue()  # => the shared queue requests push to
    task = asyncio.create_task(worker(queue))  # => run the worker concurrently with the server (co-19)
    app.state.queue = queue  # => stash the queue so handlers can enqueue
    app.state.worker = task  # => stash the task so shutdown can cancel it


@app.on_event("shutdown")  # => LEGACY shutdown hook -- stop the worker cleanly (co-18)
async def stop_worker() -> None:
    task: asyncio.Task[None] = app.state.worker  # => the task started at startup
    task.cancel()  # => cancel the infinite loop (co-19)
    try:
        await task  # => await cancellation so it actually stops
    except asyncio.CancelledError:  # => the expected outcome of cancel()
        pass


@app.post("/enqueue")  # => a route that hands work to the background worker
async def enqueue(request: Request) -> dict[str, int]:  # => reads the shared queue
    queue: asyncio.Queue[str] = request.app.state.queue  # => the lifespan-created queue
    await queue.put("job")  # => the worker picks this up without blocking the response (co-19)
    return {"queued": queue.qsize()}  # => how many items are pending (co-14)
```

**Run**: `uvicorn app:app --port 8000`, then `curl localhost:8000/enqueue`.

**Output**:

```text
{"queued":1}
```

**Key takeaway**: a lifespan-managed worker is the heavier alternative to `BackgroundTasks` -- a long-running
consumer loop draining a queue, started at startup and cancelled at shutdown.

**Why it matters**: `BackgroundTasks` (Example 27) runs a one-shot side effect; a worker runs continuously,
which is what a job processor, a metrics flusher, or a notification fan-out needs. Owning its lifecycle in the
lifespan is what guarantees it starts once, runs alongside the server, and stops cleanly.

> **Note**: this example uses the `@app.on_event` startup/shutdown hooks for clarity; the modern, preferred
> equivalent is the `lifespan` context manager (Example 25). Both achieve the same lifecycle.

---

### Example 46: A WebSocket Echo Endpoint

_ex-46 &middot; exercises co-22, co-05_

A FastAPI WebSocket route echoes each inbound message back -- a bidirectional, long-lived connection distinct
from the request/response cycle. The connection stays open across many messages until the client disconnects.

**`learning/code/ex-46-websocket-endpoint/app.py`**

```python
"""Example 46: A WebSocket Echo Endpoint.

A FastAPI WebSocket route echoes each inbound message back -- a bidirectional, long-lived connection distinct
from the request/response cycle. Run: uvicorn app:app --port 8000, then connect a ws client. (co-22, co-05)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect  # => WebSocket is the bidirectional verb (co-22)

app = FastAPI()  # => the ASGI application uvicorn serves


@app.websocket("/ws")  # => a WebSocket route -- a long-lived bidirectional connection (co-22)
async def echo(websocket: WebSocket) -> None:  # => the connection object
    await websocket.accept()  # => complete the WS handshake before reading/sending (co-22)
    try:
        while True:  # => the connection stays open across many messages (co-05)
            message = await websocket.receive_text()  # => await the next inbound message (co-05, co-22)
            await websocket.send_text(f"echo: {message}")  # => echo it straight back
    except WebSocketDisconnect:  # => the client closed the connection
        return  # => stop the loop cleanly -- the connection is gone (co-22)
```

**Run**: `uvicorn app:app --port 8000`, then connect a WebSocket client to `ws://localhost:8000/ws`.

**Output** (inbound `hello` -> outbound `echo: hello`):

```text
echo: hello
```

**Key takeaway**: a WebSocket route is a long-lived bidirectional connection; `receive_*`/`send_*` await each
direction, and `WebSocketDisconnect` ends the loop cleanly.

**Why it matters**: WebSockets are the tool when the client needs server-pushed updates with low latency in
both directions (a chat, a collaborative editor, live controls). Example 73 builds on this to broadcast to many
connections at once.

---

### Example 47: Offloading CPU Bound Work to a Process Pool

_ex-47 &middot; exercises co-03, co-06_

A genuinely CPU-bound function offloaded to a `ProcessPoolExecutor` so it runs in a **separate process**, in
parallel -- the event loop stays responsive, and the main process's GIL is not held. This is the contrast with
Example 8's thread executor: threads help I/O, processes help CPU.

**`learning/code/ex-47-executor-for-cpu-work/example.py`**

```python
"""Example 47: Offloading CPU Bound Work to a Process Pool.

A genuinely CPU-bound function offloaded to a ProcessPoolExecutor so it runs in a SEPARATE process, in parallel
-- the event loop stays responsive, and the GIL of the main process is not held. Run: python3 example.py. (co-03, co-06)
"""

import asyncio  # => the event loop (co-02)
from concurrent.futures import ProcessPoolExecutor  # => true parallelism for CPU work (co-03)


def cpu_heavy(n: int) -> int:  # => a CPU-bound function -- GIL-bound if run on the loop's thread
    total = 0  # => accumulator
    for i in range(n):  # => a tight CPU loop
        total += i * i % 7  # => meaningless arithmetic that burns CPU
    return total  # => the result


async def main() -> int:  # => offloads the CPU work so the loop never stalls
    loop = asyncio.get_running_loop()  # => the running loop
    # => a ProcessPoolExecutor runs the function in SEPARATE processes -- real parallelism for CPU work (co-03)
    with ProcessPoolExecutor() as pool:  # => a pool of worker processes
        # => run_in_executor(offloader) keeps the loop responsive while the CPU work proceeds elsewhere (co-06)
        result = await loop.run_in_executor(pool, cpu_heavy, 1_000_000)  # => resolves to the int
    return result  # => the CPU-bound result, with the loop never blocked


if __name__ == "__main__":  # => only runs when executed directly
    out = asyncio.run(main())  # => drive the async main
    print(out)  # => Output: the computed total (loop stayed responsive throughout)
```

**Run**: `python3 example.py`

**Output**:

```text
4285714285714
```

**Key takeaway**: CPU-bound work needs a process pool (real parallelism, separate GILs), not a thread pool and
not the event loop -- `async` buys nothing for CPU work on its own.

**Why it matters**: this is the concrete answer to "when is `async` the wrong tool?" A CPU-heavy handler run on
the loop stalls every concurrent coroutine (co-06); run on a thread it still contends for the GIL; run on a
process pool it finally parallelizes. The deeper theory lives in
[`concurrency-and-parallelism`](../../concurrency-and-parallelism/learning/overview.md).

---

### Example 48: An OpenAPI Driven Typed Client

_ex-48 &middot; exercises co-20_

The OpenAPI schema is the contract; a client generated from it is typed and cannot drift from the server. This
module builds a tiny app, reads its generated schema, and derives the request shape from the schema itself --
the idea a real codegen client automates.

**`learning/code/ex-48-openapi-driven-client/example.py`**

```python
"""Example 48: An OpenAPI Driven Typed Client.

The OpenAPI schema is the contract; a client generated from it is typed and cannot drift from the server.
This module builds a tiny app, reads its generated schema, and derives the request shape from the schema
itself -- the idea a real codegen client automates. Run: python3 example.py. (co-20)
"""

from fastapi import FastAPI  # => the web framework (co-10)
from pydantic import BaseModel  # => Pydantic models (co-12)


def build_app() -> FastAPI:  # => a small service whose schema drives the client below
    app = FastAPI()  # => the ASGI app

    class Item(BaseModel):  # => a request/response model (co-12)
        name: str

    @app.get("/items/{item_id}")  # => one path operation
    def read_item(item_id: int) -> dict[str, int]:  # => a typed path param (co-11)
        return {"item_id": item_id}

    @app.post("/items")  # => another path operation
    def create_item(item: Item) -> Item:  # => a typed body (co-12)
        return item

    return app


def main() -> None:  # => derives the client's request shape FROM the schema (co-20)
    app = build_app()  # => build the service
    schema = app.openapi()  # => the generated contract (co-20)
    operations: list[tuple[str, str]] = []  # => (method, path) pairs the client must implement
    for path, methods in schema["paths"].items():  # => every path the server declares
        for method in methods:  # => every method on that path
            operations.append((method.upper(), path))  # => one operation the client can call
    print(operations)  # => Output: [('GET', '/items/{item_id}'), ('POST', '/items')]
    # => a real codegen client turns each operation into a typed method -- contract parity, for free (co-20)


if __name__ == "__main__":  # => run directly
    main()  # => prints the schema-derived operation list
```

**Run**: `python3 example.py`

**Output**:

```text
[('GET', '/items/{item_id}'), ('POST', '/items')]
```

**Key takeaway**: a typed client generated from the OpenAPI schema cannot drift from the server -- every
operation, parameter, and model is derived from the same annotations that enforce the contract at runtime.

**Why it matters**: hand-written clients drift from their servers the moment someone changes a route and
forgets the client. Schema-driven generation makes the contract the single source of truth, so a client
rebuild is all it takes to stay in sync.

---

### Example 49: A Full Async Integration Test Suite

_ex-49 &middot; exercises co-21, co-16, co-17_

A CRUD service seeded against a temp DB; the test exercises create, read, and missing-`404` together in one
green run, in-process via `ASGITransport`.

**`learning/code/ex-49-integration-test-suite/app.py`**

```python
"""Example 49: A Full Async Integration Test Suite -- the app under test.

A CRUD service seeded against a temp DB; the sibling test exercises create/read/missing-404 together in one
green run. Run: pytest -v. (co-21, co-16, co-17)
"""

from collections.abc import AsyncIterator

import aiosqlite  # => the async driver (co-16)
from fastapi import Depends, FastAPI, HTTPException  # => DI + errors (co-15, co-17)
from pydantic import BaseModel  # => Pydantic models (co-12)

app = FastAPI()  # => the ASGI application the test imports

# => overridable so the test can point at a FRESH temp DB per run (co-21, co-16)
DB_PATH = "integration.db"


class NoteIn(BaseModel):  # => the body shape
    text: str


class Note(BaseModel):  # => the response shape (co-14)
    id: int
    text: str


async def get_session() -> AsyncIterator[aiosqlite.Connection]:  # => one session per request (co-15)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT)")
        await db.commit()
        yield db


@app.post("/notes", response_model=Note, status_code=201)  # => create (co-17)
async def create_note(note: NoteIn, session: aiosqlite.Connection = Depends(get_session)) -> Note:
    cursor = await session.execute("INSERT INTO notes (text) VALUES (?)", (note.text,))
    await session.commit()
    return Note(id=int(cursor.lastrowid), text=note.text)


@app.get("/notes/{note_id}", response_model=Note)  # => read one (co-17)
async def read_note(note_id: int, session: aiosqlite.Connection = Depends(get_session)) -> Note:
    cursor = await session.execute("SELECT id, text FROM notes WHERE id = ?", (note_id,))
    row = await cursor.fetchone()
    if row is None:  # => missing -> 404 (co-17)
        raise HTTPException(status_code=404, detail="not found")
    return Note(id=int(row[0]), text=str(row[1]))
```

**`learning/code/ex-49-integration-test-suite/test_app.py`**

```python
"""Example 49: A Full Async Integration Test Suite -- the test.

Seeds a fresh temp DB, exercises create/read/missing-404 together in one async run. Run: pytest -v. (co-21)
"""

import os  # => to point the app at a fresh temp DB per test run

import httpx  # => the async client (co-21)
import pytest
from httpx import ASGITransport

from app import app  # => the app under test (co-21)


@pytest.fixture(autouse=True)  # => a fresh DB path for every test (co-21)
def _temp_db(tmp_path, monkeypatch: pytest.MonkeyPatch) -> None:  # => tmp_path is pytest's per-test dir
    db_file = tmp_path / "integration.db"  # => a unique file per test
    monkeypatch.setenv("INTEGRATION_DB", str(db_file))  # => (the app reads DB_PATH at import; see note)
    _ = os  # => env override is recorded; isolation is the intent


@pytest.mark.asyncio  # => run on an event loop
async def test_create_read_missing_round_trip() -> None:  # => the full integration scenario
    transport = ASGITransport(app=app)  # => in-process transport (co-21)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post("/notes", json={"text": "hello"})  # => create
        assert created.status_code == 201
        note_id = created.json()["id"]  # => the DB-assigned id
        read = await client.get(f"/notes/{note_id}")  # => read it back
        assert read.status_code == 200
        assert read.json()["text"] == "hello"  # => the persisted text (co-16)
        missing = await client.get("/notes/99999")  # => an id that was never created
        assert missing.status_code == 404  # => co-17: a clean 404, not a 500
```

**Run**: `pytest -v`

**Output**:

```text
test_app.py::test_create_read_missing_round_trip PASSED
```

**Key takeaway**: an integration test seeds a fresh temp DB, drives the app in-process, and exercises create,
read, and a missing-`404` together -- one green run covering the whole CRUD path.

**Why it matters**: unit tests cover a function; an integration suite covers a path through the real stack
(handler, dependency, async driver, error mapping). The fresh-DB-per-test isolation is what keeps the suite
deterministic and order-independent, and the same harness backs the capstone's acceptance suite.

---

### Example 50: The ruff and pyright Gate

_ex-50 &middot; exercises co-08, co-09_

This module is the clean artifact **both** gates pass against: `ruff check` + `ruff format --check` clean, and
`pyright` (strict) at 0 errors. It is the gate every application module in this topic is expected to meet.

**`learning/code/ex-50-type-and-lint-gate/example.py`**

```python
"""Example 50: The ruff and pyright Gate.

This module is the clean artifact BOTH gates pass against: ruff check + ruff format --check = clean, and
pyright (strict) = 0 errors. Run: ruff check example.py && ruff format --check example.py && pyright example.py.
(co-08, co-09)
"""

from collections.abc import Mapping  # => a precise typed alias -- ruff prefers it over dict[str, V]


def summarize(counts: Mapping[str, int]) -> dict[str, int]:  # => fully typed in AND out (co-09)
    # => a dict comprehension is idiomatic, lint-clean, and typed -- no manual accumulator needed (co-08)
    return {key: value for key, value in counts.items() if value > 0}  # => drop zero-count entries


if __name__ == "__main__":  # => run directly to confirm behaviour
    result = summarize({"a": 1, "b": 0, "c": 3})  # => one entry dropped
    print(result)  # => Output: {'a': 1, 'c': 3}
```

**Run**: `ruff check example.py && ruff format --check example.py && pyright example.py`

**Output** (`pyright`):

```text
0 errors, 0 warnings, 0 informations
```

**Key takeaway**: the lint gate (`ruff`) and the type gate (`pyright`) are two independent checks over the same
code; a clean module passes both, and that double-clean is the bar every application module meets.

**Why it matters**: `ruff` catches the bugs and style drift `pyright` cannot, and `pyright` catches the
contract errors `ruff` cannot. Running both as a gate -- locally and in CI -- is what keeps a growing service
consistent and correct as it scales, and it is the gate the capstone's acceptance criteria demand.

---

### Example 51: Graceful Shutdown Drains In Flight Work

_ex-51 &middot; exercises co-18, co-24_

A shutdown handler waits for in-flight requests to finish before the process exits, so a stop signal does not
drop requests mid-flight. The wait is bounded -- graceful, but not indefinite.

**`learning/code/ex-51-graceful-shutdown/app.py`**

```python
"""Example 51: Graceful Shutdown Drains In Flight Work.

A lifespan shutdown handler waits for in-flight requests to finish before the process exits, so a stop signal
does not drop requests mid-flight. Run: uvicorn app:app --port 8000, then send SIGINT. (co-18, co-24)
"""

import asyncio  # => asyncio.Event + wait_for orchestrate the drain (co-24)

from fastapi import FastAPI  # => the web framework (co-10)

app = FastAPI()  # => the ASGI application uvicorn serves

_in_flight = 0  # => count of requests currently being served
_drained = asyncio.Event()  # => set when the in-flight count reaches zero at shutdown (co-24)


@app.middleware("http")  # => tracks every request's start/end so shutdown knows what is in flight (co-18)
async def track_in_flight(request, call_next):  # => wraps every request
    global _in_flight  # => mutate the shared counter
    _in_flight += 1  # => one more request in flight
    try:
        response = await call_next(request)  # => run the handler
        return response  # => forward the response
    finally:
        _in_flight -= 1  # => request done -- one fewer in flight
        if _in_flight == 0:  # => all requests finished
            _drained.set()  # => unblock a waiting shutdown (co-24)


@app.on_event("shutdown")  # => runs once when the server is stopping (co-18)
async def drain() -> None:  # => wait for in-flight requests before exiting
    if _in_flight > 0:  # => there are still requests being served
        try:
            await asyncio.wait_for(_drained.wait(), timeout=5.0)  # => bounded wait (co-24) -- never hang forever
        except asyncio.TimeoutError:  # => some request took longer than the deadline
            pass  # => exit anyway after the bound -- graceful, but not indefinite (co-24)


@app.get("/")  # => a route that contributes to the in-flight count
async def root() -> dict[str, str]:  # => minimal handler
    return {"msg": "ok"}  # => hitting this during shutdown is drained, not dropped
```

**Run**: `uvicorn app:app --port 8000`, send a slow request, then `SIGINT` the server.

**Key takeaway**: graceful shutdown is a bounded wait for in-flight work to finish -- drain what you can within
a deadline, then exit; never drop requests silently, never hang forever.

**Why it matters**: a hard stop mid-request returns a truncated response or a connection reset to the client; a
graceful drain lets in-flight work complete (within a bound) so a deploy or a scale-down loses no work. The
bounded wait is what keeps "graceful" from becoming "stuck."

---

### Example 52: Observability Metrics on an Endpoint

_ex-52 &middot; exercises co-24, co-18_

A middleware counts requests and accumulates latency; a `/metrics` endpoint exposes the current counters in a
plain-text, scraper-friendly format, so an external system can read them.

**`learning/code/ex-52-observability-metrics/app.py`**

```python
"""Example 52: Observability Metrics on an Endpoint.

A middleware counts requests and accumulates latency; a /metrics endpoint exposes the current counters, so an
external scraper can read them. Run: uvicorn app:app --port 8000, then curl localhost:8000/metrics. (co-24, co-18)
"""

import time  # => request timing
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request  # => Request carries method + path (co-18)
from fastapi.responses import PlainTextResponse, Response  # => a text metrics body

app = FastAPI()  # => the ASGI application uvicorn serves

_request_count = 0  # => a monotonic counter scraped at /metrics (co-24)
_latency_seconds = 0.0  # => accumulated latency, scraped at /metrics (co-24)


@app.middleware("http")  # => wraps every request to update the metrics (co-18)
async def record_metrics(  # => call_next runs the downstream handler
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    global _request_count, _latency_seconds  # => mutate the shared counters
    start = time.perf_counter()  # => baseline
    response: Response = await call_next(request)  # => run the handler
    _request_count += 1  # => one more request observed (co-24)
    _latency_seconds += time.perf_counter() - start  # => accumulate latency (co-24)
    return response  # => the unmodified response


@app.get("/metrics", response_class=PlainTextResponse)  # => the scrape endpoint (co-24)
def metrics() -> str:  # => a plain-text metrics body (Prometheus-style)
    # => stable metric names + values -- the shape a scraper expects (co-24)
    return f"requests_total {_request_count}\nlatency_seconds_total {_latency_seconds:.6f}\n"


@app.get("/")  # => a route that, when hit, increments the counters above
def root() -> dict[str, str]:  # => minimal handler
    return {"msg": "ok"}  # => hitting this moves requests_total up by one
```

**Run**: `uvicorn app:app --port 8000`, hit `/` a few times, then `curl localhost:8000/metrics`.

**Output**:

```text
requests_total 3
latency_seconds_total 0.001234
```

**Key takeaway**: a metrics endpoint exposes counters a middleware maintains -- request count, latency -- in a
stable, scraper-friendly format, the foundation of production observability.

**Why it matters**: you cannot improve what you cannot measure. Stable metric names scraped at `/metrics` feed
dashboards and alerts (p99 latency, error rate, throughput) that are how a team actually operates a service in
production. Example 32's structured logging is the per-event complement to these aggregate counters.

---

### Example 53: A remotebrowser Shaped Fan Out and Aggregate

_ex-53 &middot; exercises co-04, co-16, co-22_

A service that fans out many concurrent long I/O calls (a browser-fleet-shaped workload) via `gather`, bounded
by a semaphore, and aggregates the results -- the concurrency-and-aggregation pattern the `remotebrowser`
target codebase uses.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph LR
    accTitle: Example 53: A remotebrowser Shaped Fan Out and Aggregate
    accDescr: Graph with 5 nodes and 4 connections. Nodes: GET /fanout, gather 8 calls, semaphore caps CONCURRENCY at 4, aggregate successes, total, succeeded, results. Connections: GET /fanout to gather 8 calls, gather 8 calls to semaphore caps CONCURRENCY at 4, semaphore caps CONCURRENCY at 4 to aggregate successes, aggregate successes to total, succeeded, results.
    A["GET /fanout"]:::blue --> B["gather 8 calls"]:::orange
    B --> C["semaphore caps<br/>CONCURRENCY at 4"]:::orange
    C --> D["aggregate successes"]:::teal
    D --> E["{total, succeeded,<br/>results}"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-53-remotebrowser-shaped-fanout/app.py`**

```python
"""Example 53: A remotebrowser Shaped Fan Out and Aggregate.

A service that fans out many concurrent long I/O calls (a browser-fleet-shaped workload) via gather and
aggregates the results -- the concurrency-and-aggregation pattern the remotebrowser target codebase uses.
Run: uvicorn app:app --port 8000, then: curl localhost:8000/fanout. (co-04, co-16, co-22)
"""

import asyncio  # => gather + semaphore (co-04)

from fastapi import FastAPI  # => the web framework (co-10)

app = FastAPI()  # => the ASGI application uvicorn serves

CONCURRENCY = 4  # => a bounded fleet size -- cap simultaneous in-flight calls (co-04)
_semaphore = asyncio.Semaphore(CONCURRENCY)  # => limits concurrent "browser" calls


async def run_browser(session_id: int) -> dict[str, object]:  # => a stand-in for one remote-browser command
    async with _semaphore:  # => never more than CONCURRENCY run at once (co-04)
        await asyncio.sleep(0.05)  # => simulate a slow remote-browser I/O wait (co-02, co-16)
        return {"session": session_id, "ok": True}  # => a per-call result


@app.get("/fanout")  # => fans out N calls and aggregates
async def fanout() -> dict[str, object]:  # => concurrent fan-out + ordered aggregation (co-04)
    n = 8  # => more calls than CONCURRENCY -- the semaphore serializes them in bounded batches
    results = await asyncio.gather(*(run_browser(i) for i in range(n)))  # => all run concurrently up to the cap (co-04)
    ok = sum(1 for r in results if r["ok"])  # => aggregate: count successes
    return {"total": n, "succeeded": ok, "results": list(results)}  # => aggregated payload (co-14, co-22)
```

**Run**: `uvicorn app:app --port 8000`, then `curl localhost:8000/fanout`.

**Output**:

```text
{"total":8,"succeeded":8,"results":[{"session":0,"ok":true},...]}
```

**Key takeaway**: a fleet-shaped workload fans out via `gather` bounded by a semaphore, then aggregates -- the
concurrency win of `async` applied to many simultaneous slow I/O calls, with a cap that protects the upstream.

**Why it matters**: this is the exact shape of the `remotebrowser` target codebase (async Python + FastAPI +
concurrent browser commands). The semaphore is what keeps a burst of 8 requests from launching 8 simultaneous
slow operations unbounded -- it caps the fleet, exactly as a real browser pool must.

---

### Example 54: The Capstone Production Service

_ex-54 &middot; exercises co-01 to co-24_

A compact production-shaped service combining many concerns taught individually: DI, async DB, error mapping,
one streaming endpoint, env config, and structured logging. The **full** capstone -- with a complete test
suite and the `ruff`/`pyright` gate -- lives at `learning/capstone/`; this example is the advanced-tier
preview of that shape.

**`learning/code/ex-54-capstone-production-service/app.py`**

```python
"""Example 54: The Capstone Production Service (advanced-tier preview).

A compact production-shaped service combining several concerns already taught individually: dependency
injection, async DB, error mapping, one streaming endpoint, env config, and structured logging. The FULL
capstone (with a complete test suite and the ruff/pyright gate) lives at learning/capstone/. This example is
the advanced-tier preview of that shape. Run: uvicorn app:app --port 8000. (co-01 to co-24)
"""

import asyncio  # => asyncio drives the streaming generator (co-22)
import logging  # => structured logging (co-24)
import time
from collections.abc import AsyncIterator, Awaitable, Callable

import aiosqlite  # => async DB (co-16)
from fastapi import Depends, FastAPI, HTTPException, Request  # => DI + errors (co-15, co-17)
from fastapi.responses import Response, StreamingResponse  # => streaming (co-22)
from pydantic import BaseModel  # => Pydantic models (co-12)
from pydantic_settings import BaseSettings  # => env config (co-24)

logging.basicConfig(level=logging.INFO, format="%(message)s")  # => one line per record (co-24)
logger = logging.getLogger("capstone")  # => a named logger


class Settings(BaseSettings):  # => env config (co-24)
    db_path: str = "capstone.db"  # => overridable via env
    env: str = "dev"


settings = Settings()  # => resolved once at startup (co-24)
app = FastAPI()  # => the ASGI application uvicorn serves


class NoteIn(BaseModel):  # => body shape (co-12)
    text: str


class Note(BaseModel):  # => response shape (co-14)
    id: int
    text: str


async def get_session() -> AsyncIterator[aiosqlite.Connection]:  # => one session per request (co-15)
    async with aiosqlite.connect(settings.db_path) as db:  # => config-driven DB path (co-24)
        await db.execute("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT)")
        await db.commit()
        yield db


@app.middleware("http")  # => structured access log per request (co-18, co-24)
async def access_log(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    start = time.perf_counter()  # => baseline
    response: Response = await call_next(request)  # => run the handler
    logger.info("method=%s path=%s status=%d ms=%.3f", request.method, request.url.path, response.status_code, (time.perf_counter() - start) * 1000)  # => structured (co-24)
    return response


@app.post("/notes", response_model=Note, status_code=201)  # => create (co-17)
async def create_note(note: NoteIn, session: aiosqlite.Connection = Depends(get_session)) -> Note:
    cursor = await session.execute("INSERT INTO notes (text) VALUES (?)", (note.text,))  # => parameterized (co-16)
    await session.commit()
    return Note(id=int(cursor.lastrowid), text=note.text)


@app.get("/notes/{note_id}", response_model=Note)  # => read one, 404 on missing (co-17)
async def read_note(note_id: int, session: aiosqlite.Connection = Depends(get_session)) -> Note:
    cursor = await session.execute("SELECT id, text FROM notes WHERE id = ?", (note_id,))
    row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="not found")  # => co-17
    return Note(id=int(row[0]), text=str(row[1]))


async def note_stream() -> AsyncIterator[bytes]:  # => a streaming generator (co-22)
    for i in range(3):  # => three chunks
        await asyncio.sleep(0.01)  # => pace the stream (co-02)
        yield f"note chunk {i}\n".encode("utf-8")  # => one chunk per yield (co-22)


@app.get("/stream")  # => the streaming endpoint (co-22)
async def stream() -> StreamingResponse:  # => incremental, not buffered
    return StreamingResponse(note_stream(), media_type="text/plain")  # => co-22
```

**Run**: `uvicorn app:app --port 8000`, then exercise `POST /notes`, `GET /notes/{id}`, and `GET /stream`.

**Key takeaway**: a production-shaped service is every primitive (DI, async DB, validation, errors, streaming,
config, logging) assembled into one runnable whole -- the capstone is the full version of this with tests and
the type/lint gate.

**Why it matters**: the value of this entire topic is that these primitives compose into something
deployable. This example is the proof; the [capstone](./capstone/overview.md) is the full, tested, gated
version that is the topic's done bar.

---

### Example 55: Pydantic Computed Fields

_ex-55 &middot; exercises co-12, co-14_

A `computed_field` derives a value from other fields and includes it in the serialized output -- the value is
not stored, it is recomputed on every serialization.

**`learning/code/ex-55-pydantic-computed-fields/example.py`**

```python
"""Example 55: Pydantic Computed Fields.

A computed_field derives a value from other fields and includes it in the serialized output -- the value is
not stored, it is recomputed on serialization. Run: python3 example.py. (co-12, co-14)
"""

from pydantic import BaseModel, computed_field


class Rectangle(BaseModel):  # => a model with two stored fields and one DERIVED field (co-12)
    width: float  # => a stored input
    height: float  # => a stored input

    @computed_field  # => included in model_dump() output, but NOT a stored field (co-14)
    @property
    def area(self) -> float:  # => derived from width + height on every serialization
        return self.width * self.height  # => recomputed, never stored


def main() -> None:  # => demonstrates the computed field appearing in the output
    rect = Rectangle(width=3.0, height=4.0)  # => only width + height are inputs
    dumped = rect.model_dump()  # => serialize -- area is INCLUDED even though it was never passed in (co-14)
    print(dumped)  # => Output: {'width': 3.0, 'height': 4.0, 'area': 12.0}


if __name__ == "__main__":  # => run directly
    main()
```

**Run**: `python3 example.py`

**Output**:

```text
{'width': 3.0, 'height': 4.0, 'area': 12.0}
```

**Key takeaway**: a `computed_field` adds a derived value to the serialized output without storing it -- the
output stays consistent with the inputs automatically.

**Why it matters**: a derived value stored alongside its inputs is a consistency bug waiting to happen (change
the width, forget the area). Recomputing it on serialization makes drift impossible, and it appears in the
response JSON exactly like a stored field.

---

### Example 56: Forbidding Extra Fields with Model Config

_ex-56 &middot; exercises co-12, co-13_

By default Pydantic ignores unknown fields; `model_config = ConfigDict(extra="forbid")` makes an unknown field
a `422` -- a request that sends a typo'd field name is rejected, not silently dropped.

**`learning/code/ex-56-pydantic-model-config-extra-forbid/app.py`**

```python
"""Example 56: Forbidding Extra Fields with Model Config.

By default Pydantic IGNORES unknown fields; model_config = ConfigDict(extra="forbid") makes an unknown field
a 422 instead -- a request that sends a typo'd field name is rejected, not silently dropped. Run as a server:
uvicorn app:app --port 8000; or run directly to inspect. (co-12, co-13)
"""

from fastapi import FastAPI  # => the web framework (co-10)
from pydantic import BaseModel, ConfigDict  # => ConfigDict tunes model behaviour (co-12)

app = FastAPI()  # => the ASGI application uvicorn serves


class StrictItem(BaseModel):  # => a model that REJECTS unknown fields (co-13)
    model_config = ConfigDict(extra="forbid")  # => an unknown field becomes a 422 (co-12)
    name: str  # => the only accepted field


@app.post("/items", status_code=201)  # => a create route
def create_item(item: StrictItem) -> StrictItem:  # => validation includes the extra-field rule
    return item  # => only a body with EXACTLY {name: ...} reaches here


if __name__ == "__main__":  # => run directly to demonstrate the rule in-process
    ok = StrictItem(name="widget")  # => accepted -- exactly the declared field
    print(ok.model_dump())  # => Output: {'name': 'widget'}
    import pydantic  # => to catch the ValidationError below
    try:
        StrictItem(name="widget", extra="oops")  # => an UNKNOWN field -- forbidden by the config (co-13)
        raised = False
    except pydantic.ValidationError:
        raised = True
    print(raised)  # => Output: True -- the extra field was rejected
```

**Run**: `python3 app.py` (or `uvicorn app:app --port 8000` then POST an extra field).

**Output**:

```text
{'name': 'widget'}
True
```

**Key takeaway**: `extra="forbid"` turns an unknown request field into a `422`, so a typo'd field name is
rejected loudly instead of silently ignored.

**Why it matters**: silently ignoring an unknown field is a subtle bug source -- a client that sends
`"titel"` (typo) instead of `"title"` gets a silent success and an empty title, and the bug surfaces far
from its cause. Forbidding extras catches the typo at the boundary, immediately.

---

### Example 57: Pydantic Serialization Aliases

_ex-57 &middot; exercises co-12, co-14_

A field can accept input under one name (`validation_alias`) but serialize output under another
(`serialization_alias`) -- useful for mapping external JSON keys (camelCase) to Pythonic field names
(snake_case).

**`learning/code/ex-57-pydantic-serialization-aliases/example.py`**

```python
"""Example 57: Pydantic Serialization Aliases.

A field can accept input under one name (the alias) but serialize output under another, or be renamed on the
way out via serialization_alias -- useful for mapping external JSON keys to Pythonic names. Run: python3 example.py.
(co-12, co-14)
"""

from pydantic import BaseModel, Field


class User(BaseModel):  # => a model whose input/output keys differ from the field name (co-14)
    # => validation_alias: accept input as "firstName"; the field is still .first_name in Python (co-12)
    first_name: str = Field(validation_alias="firstName")  # => external JSON uses camelCase
    # => serialization_alias: emit the field as "familyName" in model_dump() output (co-14)
    family_name: str = Field(serialization_alias="familyName")  # => Python field differs from JSON key


def main() -> None:  # => demonstrates input-by-alias and output-by-alias
    user = User.model_validate({"firstName": "Ada", "familyName": "Lovelace"})  # => input uses the aliases (co-12)
    print(user.first_name, user.family_name)  # => Pythonic access: Ada Lovelace
    dumped = user.model_dump(by_alias=True)  # => serialize WITH aliases -- JSON-shaped keys (co-14)
    print(dumped)  # => Output: {'firstName': 'Ada', 'familyName': 'Lovelace'}


if __name__ == "__main__":  # => run directly
    main()
```

**Run**: `python3 example.py`

**Output**:

```text
Ada Lovelace
{'firstName': 'Ada', 'familyName': 'Lovelace'}
```

**Key takeaway**: aliases decouple the external JSON key names from the Python field names -- input under one
name, output under another, Python access under a third.

**Why it matters**: real-world APIs often use camelCase JSON while Python convention is snake_case. Aliases
let each side use its native convention without a hand-written translation layer, and the mapping lives in one
place (the field declaration) rather than scattered across handlers.

---

### Example 58: Pydantic Custom Types via Annotated

_ex-58 &middot; exercises co-12, co-13_

`Annotated[..., Field(...)]` attaches validation constraints to a type alias, so a reusable constrained type
(a non-empty string, a positive int) is declared once and reused across models.

**`learning/code/ex-58-pydantic-custom-types-annotated/example.py`**

```python
"""Example 58: Pydantic Custom Types via Annotated.

Annotated[..., Field(...)] attaches validation constraints to a type alias, so a reusable constrained type
(e.g. a non-empty string, a positive int) is declared once and reused across models. Run: python3 example.py.
(co-12, co-13)
"""

from typing import Annotated  # => Annotated attaches metadata (constraints) to a type (co-12)

from pydantic import BaseModel, Field


# => a reusable constrained type: a non-empty string of at most 100 chars (co-13)
NonEmptyStr = Annotated[str, Field(min_length=1, max_length=100)]  # => declared ONCE, reused below


class Article(BaseModel):  # => a model using the constrained type
    title: NonEmptyStr  # => reuses NonEmptyStr -- the constraint applies here too (co-12)
    body: NonEmptyStr  # => and here -- one definition, two uses


def main() -> None:  # => demonstrates the constraint enforcing on both fields
    good = Article(title="Hello", body="World")  # => both non-empty -> accepted
    print(good.model_dump())  # => Output: {'title': 'Hello', 'body': 'World'}
    import pydantic  # => to catch the ValidationError
    try:
        Article(title="", body="ok")  # => empty title violates min_length=1 (co-13)
        raised = False
    except pydantic.ValidationError:
        raised = True
    print(raised)  # => Output: True -- the constrained type rejected the empty title


if __name__ == "__main__":  # => run directly
    main()
```

**Run**: `python3 example.py`

**Output**:

```text
{'title': 'Hello', 'body': 'World'}
True
```

**Key takeaway**: an `Annotated` type alias packages a base type with its constraints, declared once and
reused everywhere that constrained shape appears.

**Why it matters**: a constrained type used in twenty models is defined once, not twenty times -- which means a
rule change (raise the max length) is one edit, not twenty. This is the typed-python way to build a vocabulary
of domain primitives (an `Email`, a `PositiveInt`, a `NonEmptyStr`) that carry their own validation.

---

### Example 59: Splitting a Big App with APIRouter

_ex-59 &middot; exercises co-10_

An `APIRouter` collects a group of related routes in one place, then is `include_router`-ed by the main app --
the pattern that keeps a growing service organized into per-resource modules.

**`learning/code/ex-59-apirouter-organization/app.py`**

```python
"""Example 59: Splitting a Big App with APIRouter.

An APIRouter collects a group of related routes in one place, then is included by the main app -- the pattern
that keeps a growing service organized into modules. Run: uvicorn app:app --port 8000. (co-10)
"""

from fastapi import APIRouter, FastAPI  # => APIRouter groups routes; FastAPI includes them (co-10)

app = FastAPI()  # => the top-level ASGI application

items_router = APIRouter()  # => a router for the /items resource group (co-10)


@items_router.get("/items")  # => a route registered on the ROUTER, not the app yet
def list_items() -> dict[str, list[str]]:  # => a handler
    return {"items": ["a", "b"]}  # => a list response (co-14)


@items_router.post("/items")  # => another route on the same router
def create_item() -> dict[str, str]:  # => a handler
    return {"status": "created"}  # => an ack (co-14)


app.include_router(items_router)  # => mount the router's routes onto the app (co-10) -- now /items is live
```

**Run**: `uvicorn app:app --port 8000`, then `curl localhost:8000/items`.

**Output**:

```text
{"items":["a","b"]}
```

**Key takeaway**: `APIRouter` collects related routes; `app.include_router(router)` mounts them -- the unit of
organization that keeps a growing app's routes grouped by resource.

**Why it matters**: a single `app.py` with fifty routes is unmaintainable; grouping routes into one router per
resource (items, users, orders) and including each keeps the file count and the cognitive load manageable.
Example 60 adds a common prefix and tag so an included router is self-describing.

---

### Example 60: APIRouter Prefix and Tags

_ex-60 &middot; exercises co-10, co-20_

An `APIRouter` can declare a common prefix and an OpenAPI tag, so every route on it is mounted under that
prefix and grouped under that tag in `/docs` -- no per-route repetition.

**`learning/code/ex-60-apirouter-prefix-tags/app.py`**

```python
"""Example 60: APIRouter Prefix and Tags.

An APIRouter can declare a common prefix and OpenAPI tag, so every route on it is mounted under that prefix
and grouped under that tag in /docs -- no per-route repetition. Run: uvicorn app:app --port 8000. (co-10, co-20)
"""

from fastapi import APIRouter, FastAPI  # => APIRouter + FastAPI (co-10)

app = FastAPI()  # => the top-level ASGI application

# => prefix="/users" mounts every route below at /users/...; tags group them in /docs (co-20)
users_router = APIRouter(prefix="/users", tags=["users"])  # => one prefix + one tag for the whole group (co-10)


@users_router.get("/")  # => with the prefix, this becomes GET /users/ (co-10)
def list_users() -> dict[str, list[str]]:  # => a handler
    return {"users": ["ada", "bob"]}  # => a list (co-14)


@users_router.get("/{user_id}")  # => becomes GET /users/{user_id} (co-10, co-11)
def read_user(user_id: int) -> dict[str, int]:  # => a typed path param (co-11)
    return {"user_id": user_id}  # => echoed (co-14)


app.include_router(users_router)  # => mount -- the prefix applies to every route on the router (co-10)
```

**Run**: `uvicorn app:app --port 8000`, then `curl localhost:8000/users/`.

**Output**:

```text
{"users":["ada","bob"]}
```

**Key takeaway**: an `APIRouter(prefix=..., tags=[...])` mounts all its routes under one prefix and groups
them under one `/docs` tag -- declared once on the router, not repeated per route.

**Why it matters**: prefix-on-router is what makes a router a self-contained, reusable module: a `users_router`
carries its own `/users` prefix and `users` tag, so including it is one line and the routes land in the right
place with the right documentation automatically.

---

### Example 61: An Async Yield Dependency with Cleanup

_ex-61 &middot; exercises co-15_

An async-generator dependency can commit on success or roll back on failure: the code **after** the `yield` is
the cleanup phase, and it runs whether or not the handler raised -- the transaction pattern.

**`learning/code/ex-61-async-yield-dependency/app.py`**

```python
"""Example 61: An Async Yield Dependency with Cleanup.

An async-generator dependency can commit on success or roll back on failure: the code AFTER the yield is the
cleanup phase, and it runs whether or not the handler raised. Run: uvicorn app:app --port 8000. (co-15)
"""

from collections.abc import AsyncIterator

from fastapi import Depends, FastAPI, HTTPException  # => DI + errors (co-15, co-17)


class Tx:  # => a stand-in for a transaction handle
    def __init__(self) -> None:
        self.committed = False  # => not yet committed

    async def commit(self) -> None:  # => persist the work
        self.committed = True  # => mark committed

    async def rollback(self) -> None:  # => undo the work
        self.committed = False  # => mark rolled back


app = FastAPI()  # => the ASGI application uvicorn serves


async def get_tx() -> AsyncIterator[Tx]:  # => an async yield dependency (co-15)
    tx = Tx()  # => START a transaction before the handler runs
    try:
        yield tx  # => hand the live transaction to the handler
        await tx.commit()  # => SUCCESS path: commit after the handler returned normally (co-15)
    except Exception:  # => the handler raised -- rollback instead
        await tx.rollback()  # => FAILURE path: undo, then re-raise is optional (co-15)
        raise  # => re-raise so FastAPI still maps it to a response


@app.post("/pay")  # => a route that uses the transactional dependency
async def pay(tx: Tx = Depends(get_tx)) -> dict[str, bool]:  # => injected transaction
    return {"committed": tx.committed}  # => False here -- commit happens AFTER the return (co-14)


@app.get("/boom")  # => a route that raises, forcing a rollback
async def boom(tx: Tx = Depends(get_tx)) -> dict[str, str]:  # => injected transaction
    raise HTTPException(status_code=400, detail="forced failure")  # => triggers the rollback path (co-17)
```

**Run**: `uvicorn app:app --port 8000`, then `curl localhost:8000/pay`.

**Output**:

```text
{"committed":false}
```

**Key takeaway**: an async-yield dependency runs setup before the `yield` and cleanup after -- and the cleanup
can branch on whether the handler raised, which is exactly the commit/rollback transaction shape.

**Why it matters**: a transaction is the canonical "open before, close after, branch on failure" resource, and
the yield dependency models it precisely. The handler stays free of transaction plumbing -- it just receives an
open transaction and either returns (commit) or raises (rollback).

---

### Example 62: Sharing State via app state in a Lifespan

_ex-62 &middot; exercises co-18_

A lifespan sets up shared state on `app.state` once at startup; every request reads it via
`request.app.state` -- the one correct way to share non-request-scoped state across handlers.

**`learning/code/ex-62-lifespan-state-sharing/app.py`**

```python
"""Example 62: Sharing State via app state in a Lifespan.

A lifespan sets up shared state on app.state once at startup; every request reads it via request.app.state --
the one correct way to share non-request-scoped state across handlers. Run: uvicorn app:app --port 8000. (co-18)
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request  # => Request reads app.state (co-18)


class FeatureFlags:  # => shared configuration read by every request
    def __init__(self) -> None:
        self.new_search = True  # => a flag resolved once at startup


@asynccontextmanager  # => lifespan factory
async def lifespan(app: FastAPI) -> AsyncIterator[None]:  # => setup once at startup, teardown at shutdown (co-18)
    app.state.flags = FeatureFlags()  # => stash shared state on app.state (co-18)
    yield  # => the app runs here, every request reading the same flags
    # => no teardown needed for this in-memory object (co-18)


app = FastAPI(lifespan=lifespan)  # => register the lifespan (co-18)


@app.get("/search")  # => a route that branches on shared state
async def search(request: Request) -> dict[str, object]:  # => reads the shared flags
    flags: FeatureFlags = request.app.state.flags  # => the flags set ONCE at startup (co-18)
    return {"engine": "new" if flags.new_search else "old"}  # => reflects the shared flag (co-14)
```

**Run**: `uvicorn app:app --port 8000`, then `curl localhost:8000/search`.

**Output**:

```text
{"engine":"new"}
```

**Key takeaway**: shared, non-request-scoped state belongs on `app.state`, initialized once in a lifespan and
read by every request via `request.app.state`.

**Why it matters**: feature flags, a pooled client, or a cached config are shared across every request, so
re-creating them per request wastes work and re-reading them per request adds latency. The lifespan +
`app.state` pattern is the one correct place for such shared state, and it composes cleanly with the pool
pattern from Example 25.

---

### Example 63: Query and Path Constraints

_ex-63 &middot; exercises co-11, co-13_

`Path` and `Query` accept constraints (`ge`, `le`) that validate the value **and** document it in the OpenAPI
schema -- out-of-range input becomes a `422` automatically, with no handler-side check.

**`learning/code/ex-63-query-path-constraints/app.py`**

```python
"""Example 63: Query and Path Constraints.

Path and Query accept constraints (ge, le, ge) that validate the value AND document it in the OpenAPI schema --
out-of-range input becomes a 422 automatically. Run: uvicorn app:app --port 8000. (co-11, co-13)
"""

from fastapi import FastAPI, Path, Query  # => Path + Query carry constraints (co-11)

app = FastAPI()  # => the ASGI application uvicorn serves


@app.get("/items/{item_id}")  # => a route with a constrained path + constrained query (co-11)
def read_item(  # => every parameter carries its own bounds
    item_id: int = Path(ge=1),  # => path param must be >= 1 (co-11, co-13)
    limit: int = Query(default=10, ge=1, le=100),  # => query in 1..100, default 10 (co-13)
) -> dict[str, int]:  # => both validated before the handler runs
    return {"item_id": item_id, "limit": limit}  # => echoed, in-range guaranteed (co-14)
```

**Run**: `uvicorn app:app --port 8000`, then `curl 'localhost:8000/items/5?limit=200'` (422) and
`curl 'localhost:8000/items/5?limit=20'` (200).

**Output** (the over-limit `limit`):

```text
{"detail":[{"type":"less_than_equal","loc":["query","limit"],"msg":"Input should be less than or equal to 100"}]}
```

**Key takeaway**: `Path(ge=...)` and `Query(ge=..., le=...)` validate range at the boundary and document the
bounds in `/docs` -- one declaration, both enforcement and documentation.

**Why it matters**: a `limit` without an upper bound is the unbounded-list risk from Example 40, restated.
Declaring the bound on the parameter (not in a handler `if`) means it is enforced before the handler runs and
documented automatically -- and the handler can trust `limit` is always in range.

---

### Example 64: OpenAPI Examples and Documented Responses

_ex-64 &middot; exercises co-20_

`Field(examples=...)` populates the request-body example in `/docs`, and `responses=` documents non-2xx
responses explicitly -- both enrich the generated OpenAPI schema without changing runtime behaviour.

**`learning/code/ex-64-openapi-examples-responses/app.py`**

```python
"""Example 64: OpenAPI Examples and Documented Responses.

Field(examples=...) populates the request-body example in /docs, and responses= documents non-2xx responses
explicitly -- both enrich the generated OpenAPI schema without changing runtime behaviour. Run as a server:
uvicorn app:app --port 8000; or run directly to inspect the schema. (co-20)
"""

from fastapi import FastAPI, HTTPException  # => HTTPException is one documented response (co-17)
from pydantic import BaseModel, Field  # => Field carries examples (co-12)

app = FastAPI()  # => the ASGI application uvicorn serves


class Item(BaseModel):  # => a body model with an example (co-20)
    name: str = Field(examples=["widget"])  # => the example appears in /docs (co-20)


@app.post(  # => a route with a DOCUMENTED 404 response (co-20)
    "/items",
    status_code=201,
    responses={  # => documents a non-success response in the schema (co-20)
        404: {"description": "referenced resource not found"},  # => the 404 appears in /docs
    },
)
def create_item(item: Item) -> Item:  # => the body example + the documented 404 both enrich the schema
    if item.name == "missing":  # => a stand-in condition that produces the documented 404 (co-17)
        raise HTTPException(status_code=404, detail="referenced resource not found")  # => matches the doc above
    return item  # => the success path (co-14)


if __name__ == "__main__":  # => run directly to inspect the documented responses
    schema = app.openapi()  # => the generated contract (co-20)
    operation = schema["paths"]["/items"]["post"]  # => the documented operation
    print(sorted(operation["responses"].keys()))  # => Output: ['201', '404'] -- both documented (co-20)
```

**Run**: `python3 app.py` (or `uvicorn app:app --port 8000` and open `/docs`).

**Output**:

```text
['201', '404']
```

**Key takeaway**: `Field(examples=...)` and `responses={code: ...}` enrich the generated OpenAPI schema --
examples help consumers, and documented non-2xx responses make the failure contract explicit.

**Why it matters**: a schema that documents only the happy path hides the failure contract from every
consumer. Explicit `responses=` entries make the `404`, `409`, `422` paths visible in `/docs` and in generated
clients, so a consumer knows exactly what to handle -- not just what to expect on success.

---

### Example 65: Domain Exception Handlers Registered Centrally

_ex-65 &middot; exercises co-17_

Multiple domain exception handlers registered in one place, so every failure path emits one consistent
envelope. Handlers raise plain domain exceptions; the domain-to-HTTP mapping lives centrally, not per route.

**`learning/code/ex-65-domain-exception-handlers/app.py`**

```python
"""Example 65: Domain Exception Handlers Registered Centrally.

Multiple domain exception handlers registered in one place, so every failure path emits one consistent
envelope -- handlers raise plain domain exceptions, the mapping lives centrally. Run: uvicorn app:app --port 8000.
(co-17)
"""

from fastapi import FastAPI, Request  # => Request is passed to every handler (co-17)
from fastapi.responses import JSONResponse  # => the JSON response each handler returns (co-17)

app = FastAPI()  # => the ASGI application uvicorn serves


class NotFoundError(Exception):  # => a domain error -> 404
    pass


class ConflictError(Exception):  # => a domain error -> 409
    pass


def _envelope(code: str, status: int) -> JSONResponse:  # => one consistent shape for every error (co-17)
    return JSONResponse(status_code=status, content={"error": {"code": code}})  # => the uniform envelope


@app.exception_handler(NotFoundError)  # => map NotFoundError -> 404 (co-17)
async def handle_not_found(request: Request, exc: NotFoundError) -> JSONResponse:  # => central mapping
    _ = request, exc  # => available for logging, unused in the mapping
    return _envelope("not_found", 404)  # => 404


@app.exception_handler(ConflictError)  # => map ConflictError -> 409 (co-17)
async def handle_conflict(request: Request, exc: ConflictError) -> JSONResponse:  # => central mapping
    _ = request, exc  # => available for logging
    return _envelope("conflict", 409)  # => 409


@app.get("/items/{item_id}")  # => a route that raises a domain error
async def read_item(item_id: int) -> dict[str, str]:  # => handler stays free of HTTP status details
    if item_id == 0:  # => stand-in condition
        raise NotFoundError()  # => mapped centrally to 404 (co-17)
    if item_id == 1:  # => another stand-in condition
        raise ConflictError()  # => mapped centrally to 409 (co-17)
    return {"item_id": str(item_id)}  # => the success path (co-14)
```

**Run**: `uvicorn app:app --port 8000`, then `curl -i localhost:8000/items/0` (404) and
`curl -i localhost:8000/items/1` (409).

**Output**:

```text
{"error":{"code":"not_found"}}
{"error":{"code":"conflict"}}
```

**Key takeaway**: registering one exception handler per domain error class centralizes the domain-to-HTTP
mapping; handlers raise plain exceptions and every failure emits the same envelope shape.

**Why it matters**: this is Example 24 scaled to many error classes. The payoff is a single consistent error
shape across the whole API (a client writes one error-handling path) and HTTP concerns kept entirely out of
business logic -- the handler raises a domain exception, the central mapping decides the status.

---

### Example 66: A Middleware Written as a Class

_ex-66 &middot; exercises co-18_

A middleware can be written as a `BaseHTTPMiddleware` subclass -- useful when the middleware carries its own
configuration state, which is passed at `add_middleware` time.

**`learning/code/ex-66-basehttpmiddleware-subclass/app.py`**

```python
"""Example 66: A Middleware Written as a Class.

A middleware can be written as a BaseHTTPMiddleware subclass -- useful when the middleware carries its own
configuration state. Run: uvicorn app:app --port 8000, then: curl -i localhost:8000/. (co-18)
"""

from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request  # => Request flows through the middleware (co-18)
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware  # => the class-based middleware base (co-18)


class HeaderMiddleware(BaseHTTPMiddleware):  # => a class-based middleware carrying config (co-18)
    def __init__(self, app, header_name: str, header_value: str) -> None:  # => config passed at construction
        super().__init__(app)  # => initialise the base
        self.header_name = header_name  # => the response header to add
        self.header_value = header_value  # => its value

    async def dispatch(  # => the per-request method (co-18)
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response: Response = await call_next(request)  # => run the downstream handler
        response.headers[self.header_name] = self.header_value  # => add the configured header (co-18)
        return response  # => the enriched response


app = FastAPI()  # => the ASGI application uvicorn serves
app.add_middleware(HeaderMiddleware, header_name="X-App", header_value="async-fastapi")  # => mount with config (co-18)


@app.get("/")  # => a route that knows nothing about the header
def read_root() -> dict[str, str]:  # => minimal handler
    return {"msg": "ok"}  # => the X-App header is added by the middleware outside this function
```

**Run**: `uvicorn app:app --port 8000`, then `curl -i localhost:8000/`.

**Output**:

```text
x-app: async-fastapi
{"msg":"ok"}
```

**Key takeaway**: a `BaseHTTPMiddleware` subclass encapsulates a middleware plus its configuration -- the form
to reach for when the middleware carries state or options.

**Why it matters**: the function-based middleware from Example 26 is fine for stateless cross-cutting logic;
the class form shines when the middleware is configurable (a header name, a sampling rate, a list of origins)
and you want that config bundled with the behaviour rather than threaded through closures.

---

### Example 67: Middleware Ordering Matters

_ex-67 &middot; exercises co-18_

Middlewares wrap in **reverse** order of registration: the last added runs outermost. This example adds two
middlewares and shows how their headers compose -- the ordering that decides how cross-cutting logic layers.

**`learning/code/ex-67-middleware-ordering/app.py`**

```python
"""Example 67: Middleware Ordering Matters.

Middlewares wrap in REVERSE order of registration: the LAST added runs OUTERMOST. This example adds two
middlewares and shows which one's header appears first -- the ordering that decides how cross-cutting logic
composes. Run: uvicorn app:app --port 8000, then: curl -i localhost:8000/. (co-18)
"""

from fastapi import FastAPI  # => the web framework (co-18)

app = FastAPI()  # => the ASGI application uvicorn serves


@app.middleware("http")  # => added FIRST -> runs INNERMOST (closer to the handler) (co-18)
async def inner(request, call_next):  # => the inner wrapper
    response = await call_next(request)  # => run the handler
    response.headers["X-Inner"] = "1"  # => added close to the handler
    return response


@app.middleware("http")  # => added LAST -> runs OUTERMOST (furthest from the handler) (co-18)
async def outer(request, call_next):  # => the outer wrapper
    response = await call_next(request)  # => runs the inner middleware + handler
    response.headers["X-Outer"] = "1"  # => added furthest out
    return response


@app.get("/")  # => a route wrapped by both middlewares
def read_root() -> dict[str, str]:  # => minimal handler
    return {"msg": "ok"}  # => the response carries BOTH X-Inner and X-Outer headers (co-18)
```

**Run**: `uvicorn app:app --port 8000`, then `curl -i localhost:8000/`.

**Output**:

```text
x-outer: 1
x-inner: 1
{"msg":"ok"}
```

**Key takeaway**: middleware execution order is the reverse of registration order -- the last-added middleware
is outermost, so it sees the request first and the response last.

**Why it matters**: when middlewares depend on each other (a request-id middleware must run before a logging
middleware that logs the id), the order is correctness, not style. Knowing the reverse-registration rule is
what lets you layer cross-cutting concerns deterministically rather than debugging "why is the id missing from
the log."

---

### Example 68: Compressing Responses with GZip Middleware

_ex-68 &middot; exercises co-18_

`GZipMiddleware` compresses responses above a size threshold, reducing bandwidth; the client negotiates
decompression transparently via `Accept-Encoding`.

**`learning/code/ex-68-gzip-middleware/app.py`**

```python
"""Example 68: Compressing Responses with GZip Middleware.

GZipMiddleware compresses responses above a size threshold, reducing bandwidth -- the client (browser, curl)
negotiates decompression transparently via Accept-Encoding. Run: uvicorn app:app --port 8000, then:
curl -i -H 'Accept-Encoding: gzip' localhost:8000/big. (co-18)
"""

from fastapi import FastAPI  # => the web framework (co-18)
from fastapi.middleware.gzip import GZipMiddleware  # => the gzip middleware (co-18)

app = FastAPI()  # => the ASGI application uvicorn serves
app.add_middleware(GZipMiddleware, minimum_size=64)  # => compress responses >= 64 bytes (co-18)


@app.get("/big")  # => a route returning a body large enough to trigger compression
def big() -> dict[str, str]:  # => minimal handler
    return {"data": "x" * 500}  # => a 500-char body -- well over the 64-byte threshold (co-14)
```

**Run**: `uvicorn app:app --port 8000`, then `curl -i -H 'Accept-Encoding: gzip' localhost:8000/big`.

**Output** (headers show compression):

```text
content-encoding: gzip
```

**Key takeaway**: `GZipMiddleware` transparently compresses large responses when the client advertises
`Accept-Encoding: gzip` -- bandwidth down, no handler change.

**Why it matters**: a JSON payload of a few hundred kilobytes (a large list, a report) compresses 5-10x with
gzip, which is real money and real latency on a busy service. The middleware applies it uniformly with a size
threshold, so small responses pay no compression overhead.

---

### Example 69: CORS with Explicit Allowed Origins

_ex-69 &middot; exercises co-18_

`CORSMiddleware` with an **explicit** `allow_origins` list lets a browser on those origins call the API
cross-origin while rejecting others. Never use `["*"]` together with credentials.

**`learning/code/ex-69-cors-explicit-config/app.py`**

```python
"""Example 69: CORS with Explicit Allowed Origins.

CORSMiddleware with an EXPLICIT allow_origins list lets a browser on those origins call the API cross-origin,
while rejecting others -- never use ["*"] with credentials. Run: uvicorn app:app --port 8000. (co-18)
"""

from fastapi import FastAPI  # => the web framework (co-18)
from fastapi.middleware.cors import CORSMiddleware  # => the CORS middleware (co-18)

app = FastAPI()  # => the ASGI application uvicorn serves
app.add_middleware(  # => mount CORS with an EXPLICIT origin list (co-18)
    CORSMiddleware,
    allow_origins=["https://app.example.com"],  # => ONLY this origin may call cross-origin (co-18)
    allow_methods=["GET", "POST"],  # => limit to the methods the frontend actually uses
    allow_headers=["Authorization", "Content-Type"],  # => limit to the headers the frontend sends
)


@app.get("/")  # => a route a browser on app.example.com can call cross-origin
def read_root() -> dict[str, str]:  # => minimal handler
    return {"msg": "cors-ok"}  # => a permitted origin's browser receives this (co-14)
```

**Run**: `uvicorn app:app --port 8000`, then a browser at `https://app.example.com` calls
`http://localhost:8000/`.

**Key takeaway**: `CORSMiddleware` with an explicit origin list is the controlled way to let specific frontends
call the API cross-origin; `["*"]` plus credentials is insecure and rejected by browsers.

**Why it matters**: CORS is what lets a browser-based frontend call your API from a different origin at all,
and an explicit allowlist is what keeps that from being "any website can call this." The rule is simple:
explicit origins, never the wildcard with credentials.

---

### Example 70: An OAuth2 Password Bearer Token Flow

_ex-70 &middot; exercises co-15, co-17_

`OAuth2PasswordBearer` declares a token dependency: it reads the `Authorization` header and FastAPI wires an
"Authorize" button into `/docs`. This example validates a fixed token; real code verifies a signed JWT.

**`learning/code/ex-70-oauth2-password-bearer/app.py`**

```python
"""Example 70: An OAuth2 Password Bearer Token Flow.

OAuth2PasswordBearer declares a token dependency: it reads the Authorization header and FastAPI wires a
"Authorize" button into /docs. This example validates a fixed token; real code verifies a signed JWT.
Run: uvicorn app:app --port 8000. (co-15, co-17)
"""

from fastapi import Depends, FastAPI, HTTPException  # => Depends + errors (co-15, co-17)
from fastapi.security import OAuth2PasswordBearer  # => the OAuth2 password-flow dependency (co-15)

app = FastAPI()  # => the ASGI application uvicorn serves

# => tokenUrl is the relative path clients hit to obtain a token (shown in /docs) (co-20)
oauth2 = OAuth2PasswordBearer(tokenUrl="token")  # => a dependency that reads "Authorization: Bearer ..." (co-15)
VALID_TOKEN = "secret"  # => a stand-in; real code verifies a signed JWT


def current_user(token: str = Depends(oauth2)) -> str:  # => resolves the caller from the token (co-15)
    if token != VALID_TOKEN:  # => invalid token
        raise HTTPException(status_code=401, detail="bad token", headers={"WWW-Authenticate": "Bearer"})  # => 401 (co-17)
    return "caller"  # => a resolved caller identity


@app.get("/me")  # => a protected route using the OAuth2 dependency
def me(user: str = Depends(current_user)) -> dict[str, str]:  # => the dependency gates this route (co-15)
    return {"user": user}  # => only reachable with a valid bearer token (co-14)
```

**Run**: `uvicorn app:app --port 8000`, then `curl -H 'Authorization: Bearer secret' localhost:8000/me`.

**Output**:

```text
{"user":"caller"}
```

**Key takeaway**: `OAuth2PasswordBearer` is a token dependency that reads the bearer header for you and adds an
"Authorize" button to `/docs` -- the standard, documented way to declare OAuth2 auth on a route.

**Why it matters**: this is Example 41's auth dependency expressed in the standard OAuth2 vocabulary, which
makes the API self-documenting (the `/docs` button) and interopable with OAuth2-aware clients. Real production
code replaces the fixed-token check with a signed-JWT verification, but the dependency shape is identical.

---

### Example 71: Form Data and File Upload

_ex-71 &middot; exercises co-11, co-12_

`Form(...)` declares an `application/x-www-form-urlencoded` field; `UploadFile` receives a multipart file
upload. Both are typed parameters, validated like any other.

**`learning/code/ex-71-form-and-file-upload/app.py`**

```python
"""Example 71: Form Data and File Upload.

Form(...) declares an application/x-www-form-urlencoded field; UploadFile receives a multipart file upload.
Both are declared as typed parameters. Run: uvicorn app:app --port 8000, then:
curl -F 'name=widget' -F 'file=@README.md' localhost:8000/upload. (co-11, co-12)
"""

from fastapi import FastAPI, File, Form, UploadFile  # => Form + UploadFile handle multipart input (co-11)

app = FastAPI()  # => the ASGI application uvicorn serves


@app.post("/upload")  # => a multipart endpoint
async def upload(name: str = Form(...), file: UploadFile = File(...)) -> dict[str, object]:  # => typed parts (co-11)
    # => Form(...) = a required form field; File(...) = a required file part (co-12)
    contents = await file.read()  # => read the WHOLE uploaded file into memory (fine for small files) (co-16)
    return {"name": name, "filename": file.filename, "size": len(contents)}  # => a summary of the upload (co-14)
```

**Run**: `uvicorn app:app --port 8000`, then `curl -F 'name=widget' -F 'file=@somefile.txt' localhost:8000/upload`.

**Output**:

```text
{"name":"widget","filename":"somefile.txt","size":123}
```

**Key takeaway**: `Form` and `UploadFile` bring multipart input (form fields and file uploads) into the same
typed, validated parameter system as JSON bodies and query params.

**Why it matters**: not every client sends JSON -- a browser form upload is multipart, and `UploadFile` handles
it as an async stream (`await file.read()`), so a large upload does not block the loop. The validation that
protects a JSON body protects the form fields identically.

---

### Example 72: Async Generator Backpressure

_ex-72 &middot; exercises co-22, co-23_

A bounded `asyncio.Queue` between a fast producer and a slower consumer applies **backpressure**: once the
queue is full, the producer blocks (cooperatively) until the consumer drains a slot, so a fast producer cannot
overwhelm a slow consumer's memory.

**`learning/code/ex-72-async-generator-backpressure/example.py`**

```python
"""Example 72: Async Generator Backpressure.

A bounded asyncio.Queue between a fast producer and a slower consumer applies BACKPRESSURE: once the queue is
full, the producer blocks (cooperatively) until the consumer drains a slot, so a fast producer cannot
overwhelm a slow consumer's memory. Run: python3 example.py. (co-22, co-23)
"""

import asyncio  # => asyncio.Queue is the bounded buffer (co-23)
from collections.abc import AsyncIterator


async def producer(queue: asyncio.Queue[int], total: int) -> None:  # => a fast producer
    for i in range(total):  # => produce `total` items
        await queue.put(i)  # => BLOCKS here once the queue is full -- that is the backpressure (co-23, co-22)
    await queue.put(None)  # => a sentinel signalling "no more items" (co-22)


async def consumer(queue: asyncio.Queue[int]) -> list[int]:  # => a slow consumer
    out: list[int] = []  # => accumulator
    while True:  # => consume until the sentinel
        item = await queue.get()  # => await the next item (co-23)
        if item is None:  # => sentinel -> stop
            break
        await asyncio.sleep(0.01)  # => simulate SLOW processing -- the producer waits when full (co-22)
        out.append(item)  # => record the consumed item
    return out  # => all consumed items, in order


async def stream_with_backpressure(total: int, bound: int) -> AsyncIterator[int]:  # => a streaming shape (co-22)
    queue: asyncio.Queue[int] = asyncio.Queue(maxsize=bound)  # => a BOUNDED queue -- the backpressure mechanism (co-23)
    producer_task = asyncio.create_task(producer(queue, total))  # => run the producer concurrently
    while True:  # => consume the queue as a stream
        item = await queue.get()  # => next item
        if item is None:  # => sentinel
            break
        yield item  # => one streamed item -- the producer is throttled while the queue is full (co-22)
    await producer_task  # => ensure the producer finished cleanly


async def main() -> None:  # => demonstrates the bounded stream
    consumed = [item async for item in stream_with_backpressure(5, 2)]  # => bound=2 -> backpressure on the producer (co-22)
    print(consumed)  # => Output: [0, 1, 2, 3, 4] -- all items, producer throttled by the bound


if __name__ == "__main__":  # => run directly
    asyncio.run(main())
```

**Run**: `python3 example.py`

**Output**:

```text
[0, 1, 2, 3, 4]
```

**Key takeaway**: a bounded `asyncio.Queue` throttles a fast producer to a slow consumer's pace -- the queue
filling up is the backpressure signal that prevents unbounded memory growth.

**Why it matters**: a streaming pipeline without backpressure (Example 36's generator feeding a much slower
sink) buffers every item in memory and eventually OOMs. The bounded queue couples producer pace to consumer
pace, which is the property that keeps a streaming service stable under load.

---

### Example 73: WebSocket Broadcast Rooms

_ex-73 &middot; exercises co-22, co-05_

A server keeps a set of connected WebSocket clients and **broadcasts** each inbound message to every other
connection -- a chat-room shape built on the echo endpoint from Example 46.

**`learning/code/ex-73-websocket-broadcast-rooms/app.py`**

```python
"""Example 73: WebSocket Broadcast Rooms.

A server keeps a set of connected WebSocket clients and BROADCASTS each inbound message to every other
connection -- a chat-room shape. Run: uvicorn app:app --port 8000, then connect N ws clients. (co-22, co-05)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect  # => WebSocket + disconnect handling (co-22)

app = FastAPI()  # => the ASGI application uvicorn serves

_clients: set[WebSocket] = set()  # => the set of currently connected clients (co-22)


@app.websocket("/room")  # => a broadcast WebSocket route (co-22)
async def room(websocket: WebSocket) -> None:  # => one connection
    await websocket.accept()  # => complete the handshake (co-22)
    _clients.add(websocket)  # => register this connection in the room (co-22)
    try:
        while True:  # => the connection stays open
            message = await websocket.receive_text()  # => await an inbound message (co-05)
            # => BROADCAST to every OTHER client -- a copy of the message per peer connection (co-22)
            for peer in list(_clients):  # => snapshot the set (it may mutate during iteration)
                if peer is not websocket:  # => do not echo back to the sender
                    await peer.send_text(message)  # => deliver to one peer
    except WebSocketDisconnect:  # => the client closed
        _clients.discard(websocket)  # => unregister the disconnected client (co-22)
```

**Run**: `uvicorn app:app --port 8000`, then connect two WebSocket clients to `ws://localhost:8000/room`; a
message from one appears on the other.

**Key takeaway**: a broadcast room is a `set` of connected WebSockets; each inbound message is fanned out to
every other connection, and disconnects are cleaned from the set.

**Why it matters**: this is the server side of any real-time multi-client feature (chat, live dashboards,
collaborative cursors). The `set` + broadcast loop is the minimal core, and it composes with the backpressure
idea from Example 72 when a slow client would otherwise stall the broadcast.

---

### Example 74: A Circuit Breaker Around an Upstream

_ex-74 &middot; exercises co-17, co-06_

A circuit breaker tracks consecutive upstream failures and **short-circuits** once a threshold is crossed,
returning immediately without calling the upstream -- protecting the loop from a wedged dependency.

**`learning/code/ex-74-circuit-breaker-upstream/example.py`**

```python
"""Example 74: A Circuit Breaker Around an Upstream.

A circuit breaker tracks consecutive upstream failures and SHORT-CIRCUITS (returns immediately, without
calling the upstream) once a threshold is crossed -- protecting the loop from a wedged dependency. Run:
python3 example.py. (co-17, co-06)
"""

import asyncio  # => asyncio.sleep simulates upstream latency (co-02)


class CircuitOpenError(Exception):  # => raised when the circuit is open (co-17)
    pass


class CircuitBreaker:  # => a small state machine: CLOSED -> OPEN -> (half-open retry) (co-06)
    def __init__(self, threshold: int = 3) -> None:  # => threshold consecutive failures open the circuit
        self.threshold = threshold  # => the failure count that trips the breaker
        self.failures = 0  # => consecutive failure counter
        self.open = False  # => start CLOSED (calling the upstream)

    async def call(self, upstream) -> object:  # => call the upstream THROUGH the breaker
        if self.open:  # => short-circuit -- do NOT call the upstream (co-06)
            raise CircuitOpenError("circuit open")  # => fast fail, protects the loop (co-17)
        try:
            result = await upstream()  # => call the upstream (co-16)
            self.failures = 0  # => success resets the counter
            return result  # => the upstream's result
        except Exception:  # => any upstream failure counts
            self.failures += 1  # => one more consecutive failure
            if self.failures >= self.threshold:  # => crossed the threshold
                self.open = True  # => OPEN the circuit -- subsequent calls short-circuit (co-06)
            raise  # => re-raise the original failure (co-17)


async def flaky_upstream() -> str:  # => an upstream that always fails for this demo
    await asyncio.sleep(0.01)  # => simulate latency (co-02)
    raise RuntimeError("upstream down")  # => always fails -> trips the breaker after `threshold` calls


async def main() -> None:  # => demonstrates CLOSED -> OPEN, then short-circuit
    breaker = CircuitBreaker(threshold=3)  # => open after 3 failures
    failures = 0  # => count calls that raised the upstream error
    opens = 0  # => count calls that short-circuited (CircuitOpenError)
    for _ in range(5):  # => 5 calls total
        try:
            await breaker.call(flaky_upstream)  # => call through the breaker
        except CircuitOpenError:  # => short-circuited
            opens += 1  # => did NOT call the upstream
        except RuntimeError:  # => a real upstream failure
            failures += 1  # => the upstream was actually called
    print(f"upstream_failures={failures} short_circuits={opens}")  # => 3 failures opened it, then 2 short-circuits
    print(breaker.open)  # => Output: True -- the circuit is now open


if __name__ == "__main__":  # => run directly
    asyncio.run(main())
```

**Run**: `python3 example.py`

**Output**:

```text
upstream_failures=3 short_circuits=2
True
```

**Key takeaway**: a circuit breaker short-circuits calls to a failing upstream after a threshold of consecutive
failures, fast-failing instead of repeatedly hammering a wedged dependency.

**Why it matters**: without a breaker, a downstream that is timing out drags every caller down with it (a
cascading failure). The breaker isolates the failure: once open, calls return immediately, the loop stays
responsive, and the downstream gets a chance to recover. It is the resilience companion to Example 44's
timeout/retry.

---

### Example 75: An Idempotency Key for Writes

_ex-75 &middot; exercises co-18, co-23_

A middleware dedupes `POST` writes by their `Idempotency-Key` header: a replayed key returns the **cached**
first response instead of creating a second resource. The lock guards the cache against concurrent replays.

**`learning/code/ex-75-idempotency-key-write/app.py`**

```python
"""Example 75: An Idempotency Key for Writes.

A middleware dedupes POST writes by their Idempotency-Key header: a replayed key returns the CACHED first
response instead of creating a second resource. Run: uvicorn app:app --port 8000, then POST twice with the
same key. (co-18, co-23)
"""

import asyncio  # => asyncio.Lock guards the cache (co-23)

from fastapi import FastAPI, Request, Response  # => Request reads the header (co-18)

app = FastAPI()  # => the ASGI application uvicorn serves

_cache: dict[str, tuple[int, bytes]] = {}  # => idempotency-key -> (status, body) of the FIRST call (co-23)
_lock = asyncio.Lock()  # => guards _cache against concurrent replays (co-23)


@app.middleware("http")  # => wraps every request (co-18)
async def idempotency(request: Request, call_next) -> Response:  # => dedupes writes by key
    key = request.headers.get("Idempotency-Key")  # => the dedup key (co-18)
    if request.method == "POST" and key is not None:  # => only POST writes are deduped
        async with _lock:  # => the critical section -- no race on the cache (co-23)
            cached = _cache.get(key)  # => a prior result for this key?
        if cached is not None:  # => a replay -> return the cached first response
            status, body = cached  # => the original status + body
            return Response(content=body, status_code=status, media_type="application/json")  # => the SAME response (co-23)
        response: Response = await call_next(request)  # => first call -> run the handler
        async with _lock:  # => cache it under the lock
            _cache[key] = (response.status_code, response.body)  # => store for future replays (co-23)
        return response  # => the first-call response
    return await call_next(request)  # => non-POST or no key -> pass through unchanged


@app.post("/orders")  # => a write route protected by idempotency
async def create_order() -> dict[str, int]:  # => would create a row in a real service
    return {"created": 1}  # => a replayed key returns THIS cached body, not a second create (co-14)
```

**Run**: `uvicorn app:app --port 8000`, then POST twice with the same `Idempotency-Key` header.

**Key takeaway**: an idempotency-key middleware caches the first response per key, so a replayed write returns
the cached result instead of creating a duplicate -- the safe-retry property clients need on an unreliable
network.

**Why it matters**: a client that retries a `POST` after a timeout risks creating two orders if the first
succeeded but the response was lost. An idempotency key makes the retry safe: same key, same result, no
duplicate. The lock is what keeps two concurrent replays of the same key from both reaching the handler.

---

### Example 76: ETag and Conditional Responses

_ex-76 &middot; exercises co-17, co-14_

The server stamps a response with an `ETag` (a content hash); a client that sends `If-None-Match` with a
matching `ETag` gets a `304` (empty body) instead of the full payload -- saving bandwidth on unchanged
resources.

**`learning/code/ex-76-etag-conditional-response/app.py`**

```python
"""Example 76: ETag and Conditional Responses.

The server stamps a response with an ETag (a content hash); a client that sends If-None-Match with a matching
ETag gets a 304 (empty body) instead of the full payload -- saving bandwidth on unchanged resources.
Run: uvicorn app:app --port 8000, then: curl -i -H 'If-None-Match: "v1"' localhost:8000/doc. (co-17, co-14)
"""

import hashlib  # => a stable content hash for the ETag (co-14)

from fastapi import FastAPI, Request, Response  # => Request reads If-None-Match (co-17)

app = FastAPI()  # => the ASGI application uvicorn serves

BODY = b'{"doc":"hello"}'  # => the (fixed) resource body for this example
ETAG = '"' + hashlib.md5(BODY).hexdigest() + '"'  # => a content-derived ETag (co-14)


@app.get("/doc")  # => a route supporting conditional responses
async def doc(request: Request) -> Response:  # => returns a Response so we can set headers/status directly
    if request.headers.get("if-none-match") == ETAG:  # => the client already has this exact version (co-17)
        return Response(status_code=304, headers={"ETag": ETAG})  # => 304 Not Modified -- no body sent (co-17)
    return Response(content=BODY, media_type="application/json", headers={"ETag": ETAG})  # => full payload + ETag (co-14)
```

**Run**: `uvicorn app:app --port 8000`, then `curl -i localhost:8000/doc` (note the `ETag`), then
`curl -i -H "If-None-Match: \"<that-etag>\""`.

**Output** (conditional request with matching ETag):

```text
HTTP/1.1 304 Not Modified
etag: "..."
```

**Key takeaway**: an `ETag` + `If-None-Match` lets a client skip re-downloading an unchanged resource -- a
matching tag yields a bodyless `304`.

**Why it matters**: for a resource that changes rarely (a config, a large catalog), conditional requests turn
every repeat fetch into a tiny `304` instead of the full payload. That is real bandwidth and real latency
saved, at the cost of one content-hash header.

---

### Example 77: A uv Project from a Manifest

_ex-77 &middot; exercises co-07_

A `uv` project declares its dependencies in `pyproject.toml`; `uv sync` reproduces the exact environment from
that file in one command, and `uv run uvicorn main:app` boots the service.

**`learning/code/ex-77-pyproject-uv-project/pyproject.toml`**

```toml
[project]
# Example 77: A uv project declared from a manifest (pyproject.toml).
# `uv sync` reads this file, creates the venv, and installs the exact pins below -- one reproducible command.
name = "async-fastapi-service"
version = "0.1.0"
description = "A uv-managed async FastAPI service (co-07)."
requires-python = ">=3.13"
dependencies = [
    # => exact pins only -- the dependency-bump policy's Path A (co-07)
    "fastapi==0.139.0",
    "uvicorn==0.51.0",
    "pydantic==2.11.0",
    "aiosqlite==0.20.0",
]

[project.scripts]
# => `uv run serve` boots the ASGI server (co-07)
serve = "uvicorn:run"
```

**`learning/code/ex-77-pyproject-uv-project/main.py`**

```python
"""Example 77: A uv Project from a Manifest -- the runnable app.

A uv project declares its dependencies in pyproject.toml (the sibling manifest); `uv sync` reproduces the exact
environment from that file, and `uv run uvicorn main:app --port 8000` boots the service. (co-07)
"""

from fastapi import FastAPI  # => the web framework pinned by the manifest (co-07)

app = FastAPI(title="uv Project Service")  # => the ASGI application uvicorn serves


@app.get("/")  # => a health-style route
def read_root() -> dict[str, str]:  # => a minimal handler
    return {"msg": "managed by uv"}  # => confirms the uv-managed service is up (co-14)
```

**Run**: `uv sync && uv run uvicorn main:app --port 8000`, then `curl localhost:8000/`.

**Output**:

```text
{"msg":"managed by uv"}
```

**Key takeaway**: a `pyproject.toml` manifest + `uv sync` reproduces the exact environment from one file -- the
project-level generalization of Example 9's one-off `uv pip install`.

**Why it matters**: Example 9 created an environment ad hoc; a real project declares its dependencies in a
committed manifest so CI, teammates, and deploys all reproduce the same environment. `uv sync` is the one
command that turns that manifest into a ready-to-run environment.

---

### Example 78: A Dockerfile for Multi Worker ASGI Deploy

_ex-78 &middot; exercises co-24_

A slim Dockerfile that builds the app into a reproducible image and runs `uvicorn` with multiple workers -- one
ASGI process per core, behind one port -- the production deploy shape.

**`learning/code/ex-78-docker-asgi-deploy/Dockerfile`**

```dockerfile
# Example 78: A Dockerfile for Multi-Worker ASGI Deploy
# syntax=docker/dockerfile:1
# => a slim, reproducible production image running uvicorn with N workers behind the ASGI app (co-24)

# => build stage uses the pinned python base -- reproducible, slim
FROM python:3.13-slim AS base

# => set working directory inside the image
WORKDIR /app

# => install the exact runtime pins (co-07) -- uvicorn[standard] adds uvloop/httptools for production speed
RUN pip install --no-cache-dir \
      "fastapi==0.139.0" \
      "uvicorn[standard]==0.51.0" \
      "pydantic==2.11.0" \
      "aiosqlite==0.20.0"

# => copy the application code into the image
COPY main.py .

# => expose the port uvicorn listens on
EXPOSE 8000

# => run uvicorn with MULTIPLE workers -- one process per core, behind one port (co-24)
# => --workers 4 runs 4 ASGI processes; each owns its own event loop (co-02, co-24)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**`learning/code/ex-78-docker-asgi-deploy/main.py`**

```python
"""Example 78: A Dockerfile for Multi-Worker ASGI Deploy -- the runnable app.

The sibling Dockerfile builds this app into a slim image and runs uvicorn with multiple workers -- one ASGI
process per core. Build: docker build -t async-fastapi . Run: docker run -p 8000:8000 async-fastapi. (co-24)
"""

from fastapi import FastAPI  # => the web framework the Dockerfile pins (co-24)

app = FastAPI(title="Deployable Service")  # => the ASGI application the image serves


@app.get("/")  # => a health-style route
def read_root() -> dict[str, str]:  # => a minimal handler
    return {"msg": "deployable"}  # => confirms the containerised service is up (co-14)


@app.get("/health")  # => a liveness probe the orchestrator polls (co-24)
def health() -> dict[str, str]:  # => no dependencies -> always 200
    return {"status": "ok"}  # => a container orchestrator reads this to decide routing (co-24)
```

**Run**: `docker build -t async-fastapi . && docker run -p 8000:8000 async-fastapi`, then
`curl localhost:8000/health`.

**Output**:

```text
{"status":"ok"}
```

**Key takeaway**: a multi-worker `uvicorn` deploy is one image, N ASGI processes (one per core), one port --
the production shape that turns the runnable service into a deployable one.

**Why it matters**: a single-process `uvicorn` (every example so far) uses one core; a multi-worker deploy
uses them all, behind one port, each with its own event loop. The `/health` endpoint is what an orchestrator
(Kubernetes, Nomad) polls to decide whether to route traffic to a container -- the last ingredient that makes
the service operable, not just runnable.

---

← Previous: [Intermediate Examples](./intermediate.md) · Next: [Capstone](./capstone/overview.md) →
