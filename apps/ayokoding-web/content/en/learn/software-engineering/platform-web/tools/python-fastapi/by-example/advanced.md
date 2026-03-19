---
title: "Advanced"
weight: 10000003
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Expert-level FastAPI patterns through 25 annotated examples covering custom exception handlers, middleware stacking, OpenAPI customization, rate limiting, caching, async concurrency, distributed tracing, Prometheus metrics, Docker deployment, and performance tuning"
tags: ["fastapi", "python", "web-framework", "tutorial", "by-example", "advanced", "performance", "deployment", "observability", "async", "docker", "prometheus"]
---

## Group 21: Exception Handling and Error Architecture

### Example 56: Custom Exception Classes and Handlers

Define domain-specific exception classes and register custom handlers to return consistent, meaningful error responses. This separates error representation concerns from business logic.

```python
# main.py - Custom exception hierarchy with dedicated handlers
from typing import Any
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

# --- Domain exception hierarchy ---

class AppException(Exception):        # => Base exception for all application exceptions
    def __init__(
        self,
        error_code: str,
        message: str,
        status_code: int = 500,
        details: Any = None,
    ):
        self.error_code = error_code   # => Machine-readable code: "USER_NOT_FOUND"
        self.message = message         # => Human-readable message
        self.status_code = status_code # => HTTP status code
        self.details = details         # => Optional extra context

class ResourceNotFoundError(AppException):
                                       # => Specific exception for 404 scenarios
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            error_code=f"{resource.upper()}_NOT_FOUND",
            message=f"{resource} with id {identifier} not found",
            status_code=404,
            details={"resource": resource, "id": identifier},
        )

class BusinessRuleError(AppException): # => Domain rule violations
    def __init__(self, rule: str, message: str):
        super().__init__(
            error_code=f"BUSINESS_RULE_{rule.upper()}",
            message=message,
            status_code=422,
        )

class ExternalServiceError(AppException):
                                       # => Errors from third-party integrations
    def __init__(self, service: str, detail: str):
        super().__init__(
            error_code="EXTERNAL_SERVICE_ERROR",
            message=f"External service {service} failed: {detail}",
            status_code=502,           # => 502 Bad Gateway for upstream failures
        )

# --- Global exception handler ---

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": exc.error_code,
            "message": exc.message,
            "details": exc.details,
        },
    )

@app.get("/users/{user_id}")
def get_user(user_id: int):
    if user_id != 1:
        raise ResourceNotFoundError("User", user_id)
                                       # => GET /users/99 => {"error_code": "USER_NOT_FOUND", ...}
    return {"id": 1, "username": "alice"}

@app.post("/orders")
def create_order(quantity: int):
    if quantity > 100:
        raise BusinessRuleError("MAX_ORDER_QUANTITY", "Cannot order more than 100 items at once")
                                       # => {"error_code": "BUSINESS_RULE_MAX_ORDER_QUANTITY", ...}
    return {"order": "created", "quantity": quantity}
```

**Key Takeaway**: Define a hierarchy of domain exception classes inheriting from a base `AppException`. Register one `@app.exception_handler(AppException)` to convert all domain exceptions to JSON responses uniformly.

**Why It Matters**: Domain exception classes make error handling code read like business rules rather than HTTP plumbing. `raise ResourceNotFoundError("User", user_id)` expresses intent clearly; `raise HTTPException(status_code=404, detail=f"User {user_id} not found")` does not. When error handling requirements change (adding a request ID to every error response, logging all 5xx errors), updating the single handler propagates the change everywhere. Exception hierarchies also enable middleware to distinguish database errors from business rule violations for separate metric tracking.

---

## Group 22: Async Concurrency Patterns

### Example 57: Concurrent External API Calls with asyncio.gather

Use `asyncio.gather()` to execute multiple I/O-bound operations concurrently within a single async handler. This reduces total response time from the sum of individual operations to the duration of the slowest one.

```python
# main.py - Concurrent async operations with asyncio.gather
import asyncio
import time
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# Simulated async service clients
async def fetch_user(user_id: int) -> dict:
    await asyncio.sleep(0.1)          # => Simulate 100ms database query
    return {"id": user_id, "username": f"user-{user_id}"}

async def fetch_user_orders(user_id: int) -> list:
    await asyncio.sleep(0.15)         # => Simulate 150ms orders query
    return [{"order_id": i, "user_id": user_id} for i in range(3)]

async def fetch_user_preferences(user_id: int) -> dict:
    await asyncio.sleep(0.08)         # => Simulate 80ms preferences query
    return {"theme": "dark", "notifications": True}

class UserProfile(BaseModel):
    user: dict
    orders: list
    preferences: dict
    fetch_time_ms: float

@app.get("/users/{user_id}/profile", response_model=UserProfile)
async def get_user_profile(user_id: int):
    start = time.perf_counter()

    # Sequential approach (SLOW): 100 + 150 + 80 = 330ms total
    # user = await fetch_user(user_id)
    # orders = await fetch_user_orders(user_id)
    # preferences = await fetch_user_preferences(user_id)

    # Concurrent approach (FAST): max(100, 150, 80) = ~150ms total
    user, orders, preferences = await asyncio.gather(
        fetch_user(user_id),           # => All three start simultaneously
        fetch_user_orders(user_id),    # => Event loop interleaves their I/O waits
        fetch_user_preferences(user_id),
    )                                  # => All three complete; results unpacked in order
                                       # => Total time ~150ms instead of 330ms

    elapsed = (time.perf_counter() - start) * 1000

    return UserProfile(
        user=user,
        orders=orders,
        preferences=preferences,
        fetch_time_ms=round(elapsed, 1),
                                       # => ~150ms with gather vs ~330ms sequential
    )

@app.get("/users/{user_id}/profile-safe")
async def get_user_profile_safe(user_id: int):
    # gather with return_exceptions=True: don't fail if one task errors
    results = await asyncio.gather(
        fetch_user(user_id),
        fetch_user_orders(user_id),
        fetch_user_preferences(user_id),
        return_exceptions=True,        # => Exceptions returned as values, not raised
    )
    profile = {}
    for key, result in zip(["user", "orders", "preferences"], results):
        if isinstance(result, Exception):
            profile[key] = {"error": str(result)}
                                       # => Partial failure: return what succeeded
        else:
            profile[key] = result
    return profile
```

**Key Takeaway**: Use `asyncio.gather()` to run multiple async I/O operations concurrently. Total time becomes the maximum of individual durations instead of their sum. Use `return_exceptions=True` for fault-tolerant concurrent fetching.

**Why It Matters**: Sequential async calls waste the concurrency advantage of async I/O. A user profile endpoint fetching from three services sequentially takes 330ms; the same three calls with `asyncio.gather` take 150ms—a 55% latency reduction. For aggregate pages that display data from many backend services (dashboard, feed, profile), concurrent fetching can reduce response times from seconds to hundreds of milliseconds. The `return_exceptions=True` flag enables graceful degradation—showing partial data when one service is slow rather than failing the entire response.

---

### Example 58: asyncio.TaskGroup for Structured Concurrency

Python 3.11 introduced `asyncio.TaskGroup` for structured concurrency—a safer alternative to `asyncio.gather` that automatically cancels sibling tasks when one fails. Use it for operations where partial failure should abort all work.

```python
# main.py - TaskGroup for structured concurrency (Python 3.11+)
import asyncio
from fastapi import FastAPI, HTTPException

app = FastAPI()

async def validate_user_exists(user_id: int) -> dict:
    await asyncio.sleep(0.05)
    if user_id == 99:
        raise ValueError(f"User {user_id} does not exist")
                                       # => If user doesn't exist, abort all other checks
    return {"id": user_id, "valid": True}

async def check_credit_limit(user_id: int, amount: float) -> bool:
    await asyncio.sleep(0.1)
    return amount <= 1000.0            # => Credit limit check

async def check_inventory(product_id: int, quantity: int) -> bool:
    await asyncio.sleep(0.08)
    return quantity <= 50              # => Inventory check

@app.post("/orders/validate")
async def validate_order(user_id: int, product_id: int, quantity: int, amount: float):
    try:
        async with asyncio.TaskGroup() as tg:
                                       # => TaskGroup: all tasks share a lifecycle
                                       # => If ANY task raises, all others are cancelled
            user_task = tg.create_task(validate_user_exists(user_id))
                                       # => Start user validation task
            credit_task = tg.create_task(check_credit_limit(user_id, amount))
                                       # => Start credit check task concurrently
            inventory_task = tg.create_task(check_inventory(product_id, quantity))
                                       # => Start inventory check concurrently
                                       # => All three run simultaneously
                                       # => TaskGroup waits for all to complete
                                       # => If user_task raises: credit and inventory are cancelled

        user = user_task.result()      # => Access results after TaskGroup exits
        credit_ok = credit_task.result()
        inventory_ok = inventory_task.result()

    except* ValueError as eg:         # => Python 3.11 ExceptionGroup handling
                                       # => except* catches exceptions from ANY task
        errors = [str(e) for e in eg.exceptions]
        raise HTTPException(status_code=400, detail={"validation_errors": errors})

    return {
        "valid": credit_ok and inventory_ok,
        "user": user,
        "credit_ok": credit_ok,
        "inventory_ok": inventory_ok,
    }
```

**Key Takeaway**: `asyncio.TaskGroup` (Python 3.11+) provides structured concurrency: tasks share a lifecycle, and any task failure cancels siblings automatically. Use `except*` to handle `ExceptionGroup` from task failures.

**Why It Matters**: `asyncio.gather` with `return_exceptions=True` can silently swallow exceptions while completing remaining tasks—causing partial order creation when inventory validation fails. `TaskGroup` enforces structured concurrency: if user validation fails because the user doesn't exist, the credit and inventory checks are cancelled immediately, preventing resource waste and ensuring all-or-nothing atomicity for validation operations. This "fail fast, cancel everything" semantic matches transaction isolation requirements better than independent concurrent calls.

---

## Group 23: Rate Limiting and Caching

### Example 59: In-Process Rate Limiting with Sliding Window

Implement rate limiting using an in-memory sliding window counter. This protects expensive endpoints from abuse and ensures fair resource allocation across clients.

```python
# main.py - Sliding window rate limiter as FastAPI dependency
import time
from collections import deque
from threading import Lock
from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, Request, status

app = FastAPI()

class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._windows: dict[str, deque] = {}
                                       # => Per-client request timestamp deques
        self._lock = Lock()            # => Thread safety for concurrent requests

    def is_allowed(self, client_id: str) -> tuple[bool, dict]:
        now = time.monotonic()         # => Monotonic clock: unaffected by system clock changes
        cutoff = now - self.window_seconds
                                       # => Requests before cutoff are outside the window

        with self._lock:               # => Acquire lock for thread-safe dict access
            if client_id not in self._windows:
                self._windows[client_id] = deque()
                                       # => New client: empty request timestamp deque

            window = self._windows[client_id]

            # Remove timestamps outside the sliding window
            while window and window[0] < cutoff:
                window.popleft()       # => Remove oldest timestamps

            request_count = len(window)
                                       # => Current request count in window

            if request_count >= self.max_requests:
                oldest = window[0] if window else now
                retry_after = int(oldest + self.window_seconds - now) + 1
                return False, {
                    "limit": self.max_requests,
                    "remaining": 0,
                    "retry_after": retry_after,
                }

            window.append(now)         # => Add current request timestamp
            return True, {
                "limit": self.max_requests,
                "remaining": self.max_requests - len(window),
                "reset_in": int(self.window_seconds),
            }

limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)
                                       # => Allow 10 requests per 60 seconds per client

def rate_limit_check(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    allowed, info = limiter.is_allowed(client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Retry after {info['retry_after']}s",
            headers={
                "X-RateLimit-Limit": str(info["limit"]),
                "X-RateLimit-Remaining": str(info["remaining"]),
                "Retry-After": str(info["retry_after"]),
                                       # => Standard Retry-After header
            },
        )

@app.get("/api/expensive", dependencies=[Depends(rate_limit_check)])
                                       # => dependencies= applies dep without injecting return value
def expensive_endpoint():
    return {"result": "expensive computation done"}
```

**Key Takeaway**: Implement sliding window rate limiting as a dependency that reads the client IP, checks a per-client request counter, and raises 429 with `Retry-After` headers on limit exceeded.

**Why It Matters**: Rate limiting is the first line of defense against API abuse and the key to fair multi-tenant resource allocation. Without it, one aggressive client (or a runaway script) can consume 100% of your server capacity, causing 503 errors for all other clients. The sliding window algorithm is fairer than fixed windows: it prevents the "burst at window boundary" exploit where clients send 10 requests at 11:59:59 and 10 more at 12:00:01, getting 20 in two seconds. Production systems should use Redis for distributed rate limiting across multiple server instances.

---

### Example 60: Response Caching with Cache-Control Headers

HTTP cache-control headers let browsers, CDNs, and proxies cache responses. FastAPI does not set these automatically—you must add them explicitly. Proper caching can reduce API server load by 90% for cacheable endpoints.

```python
# main.py - Response caching with Cache-Control headers
from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Any
import hashlib
import json
import time

app = FastAPI()

def make_etag(data: Any) -> str:
    content = json.dumps(data, sort_keys=True)
    return hashlib.md5(content.encode()).hexdigest()
                                       # => ETag: hash of response body
                                       # => Same data => same ETag => client can use cache

@app.get("/static-config")
def static_config(response: Response):
    config = {"max_items": 100, "theme": "light", "version": "1.0.0"}
    response.headers["Cache-Control"] = "public, max-age=3600"
                                       # => Cache for 1 hour in browser and CDN
                                       # => public: sharable across users
                                       # => max-age=3600: fresh for 3600 seconds
    return config                      # => CDN serves this response for 1 hour without contacting API

@app.get("/user/{user_id}/avatar")
def get_avatar(user_id: int, response: Response):
    avatar_data = {"url": f"https://cdn.example.com/avatars/{user_id}.jpg"}
    etag = make_etag(avatar_data)
    response.headers["ETag"] = f'"{etag}"'
                                       # => ETag allows conditional requests
                                       # => Client sends: If-None-Match: "{etag}"
                                       # => If unchanged: server returns 304 Not Modified
    response.headers["Cache-Control"] = "private, max-age=300"
                                       # => private: only client browser caches (not CDN)
                                       # => max-age=300: fresh for 5 minutes
    return avatar_data

@app.get("/feed")
def get_feed(request: Request, response: Response):
    feed_data = {"items": ["post1", "post2"], "updated_at": int(time.time())}
    response.headers["Cache-Control"] = "no-cache"
                                       # => no-cache: client must revalidate on every request
                                       # => NOT the same as no-store
                                       # => Client can cache but must send conditional request
    response.headers["Vary"] = "Authorization"
                                       # => Vary: different users get different cached versions
                                       # => Without Vary, CDN might serve one user's feed to another
    return feed_data

@app.get("/sensitive-data")
def get_sensitive(response: Response):
    response.headers["Cache-Control"] = "no-store"
                                       # => no-store: browser must NOT store this response
                                       # => Required for sensitive data: tokens, medical records
    return {"ssn": "REDACTED", "account": "..."}
```

**Key Takeaway**: Set `Cache-Control` headers explicitly on each endpoint based on data sensitivity and update frequency. Use `public` for shared data, `private` for user-specific data, and `no-store` for sensitive content.

**Why It Matters**: A single CDN cache-hit rate improvement from 0% to 80% reduces API server load by 80%, enabling the same infrastructure to handle 5x more traffic. Static reference data (configuration, lookup tables, static content) returning `Cache-Control: public, max-age=3600` costs one database query per hour per CDN edge node instead of one per request. The `Vary: Authorization` header is critical for authenticated responses—without it, a CDN might serve one user's private data to a different user with a different token, creating a data leak.

---

## Group 24: Observability

### Example 61: Structured Logging with Correlation IDs

Structured JSON logging with consistent correlation IDs enables log aggregation, filtering, and tracing across distributed services. Replace print statements and unstructured log strings with machine-parseable JSON log records.

```python
# main.py - Structured JSON logging for production observability
import json
import logging
import time
import uuid
from contextvars import ContextVar
from fastapi import FastAPI, Request

app = FastAPI()

request_id_var: ContextVar[str] = ContextVar("request_id", default="")

class StructuredLogger:
    def __init__(self, service_name: str):
        self.service_name = service_name

    def _log(self, level: str, event: str, **kwargs):
        record = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": level,
            "service": self.service_name,
            "request_id": request_id_var.get() or "no-request",
            "event": event,
            **kwargs,                  # => Additional context fields
        }
        print(json.dumps(record))      # => Machine-parseable JSON per line

    def info(self, event: str, **kwargs):
        self._log("INFO", event, **kwargs)

    def warning(self, event: str, **kwargs):
        self._log("WARNING", event, **kwargs)

    def error(self, event: str, **kwargs):
        self._log("ERROR", event, **kwargs)

logger = StructuredLogger(service_name="my-api")
                                       # => Reusable logger instance

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    token = request_id_var.set(request_id)
                                       # => Set request ID for this coroutine's context
    start = time.perf_counter()

    logger.info(
        "request_started",
        method=request.method,
        path=str(request.url.path),
        client_ip=request.client.host if request.client else None,
    )
    # => {"timestamp":"2026-03-19T10:00:00Z","level":"INFO","service":"my-api",
    # =>  "request_id":"a7c3f2e1","event":"request_started","method":"GET","path":"/items"}

    try:
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "request_completed",
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
        )
        return response
    except Exception as exc:
        logger.error("request_failed", error=str(exc), exc_type=type(exc).__name__)
        raise
    finally:
        request_id_var.reset(token)

@app.get("/items/{item_id}")
def get_item(item_id: int):
    logger.info("fetching_item", item_id=item_id)
                                       # => All logs from this request share the same request_id
    return {"id": item_id, "name": f"item-{item_id}"}
```

**Key Takeaway**: Use a structured JSON logger that includes `request_id`, `service`, `timestamp`, and context fields on every log line. Set the request ID in middleware using `ContextVar` so all logs in a request share the same ID.

**Why It Matters**: Unstructured log lines (`"GET /items/42 - 200 - 12ms"`) cannot be queried by field in log aggregators like Datadog, Splunk, or CloudWatch. Structured JSON logs enable queries like "show all requests where `duration_ms > 1000 AND status_code == 200`"—identifying slow successful requests that indicate N+1 query problems. Correlation IDs transform incident investigation from searching through thousands of interleaved log lines to filtering on `request_id` and reading a clean narrative of one request's execution from start to finish.

---

### Example 62: Prometheus Metrics with prometheus-client

Expose application metrics in Prometheus format for scraping by monitoring infrastructure. Track request counts, latency histograms, and business metrics to drive SLO dashboards and alerting.

```python
# main.py - Prometheus metrics integration
# pip install prometheus-client
import time
from fastapi import FastAPI, Request, Response
from prometheus_client import (
    Counter, Histogram, Gauge,
    generate_latest, CONTENT_TYPE_LATEST,
)

app = FastAPI()

# Define metrics (created once at module level)
REQUEST_COUNT = Counter(
    "http_requests_total",             # => Metric name
    "Total HTTP requests",             # => Help text shown in /metrics
    ["method", "endpoint", "status"],  # => Label names for dimensional grouping
)
                                       # => Counter: monotonically increasing (never decreases)
                                       # => Labels allow slicing: method="GET", endpoint="/items"

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
                                       # => Histogram: tracks distribution of values
                                       # => buckets: <= 5ms, <= 10ms, <= 25ms, ... <= 5s
)

ACTIVE_REQUESTS = Gauge(
    "http_requests_active",
    "Currently active HTTP requests",
)
                                       # => Gauge: value can go up or down
                                       # => Tracks concurrent in-flight requests

ITEMS_CREATED = Counter(
    "items_created_total",
    "Total items created",
)
                                       # => Business metric: not just infrastructure

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    ACTIVE_REQUESTS.inc()              # => Increment active requests gauge
    start = time.perf_counter()

    response = await call_next(request)

    duration = time.perf_counter() - start
    endpoint = request.url.path       # => Use raw path; avoid high-cardinality per-ID paths

    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=endpoint,
        status=str(response.status_code),
    ).inc()                            # => Increment counter with labels

    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=endpoint,
    ).observe(duration)                # => Record latency observation in histogram

    ACTIVE_REQUESTS.dec()             # => Decrement active requests gauge
    return response

@app.get("/metrics")
def metrics():                         # => Prometheus scrapes this endpoint
    return Response(
        content=generate_latest(),     # => Serialize all metrics to Prometheus text format
        media_type=CONTENT_TYPE_LATEST,
                                       # => text/plain; version=0.0.4; charset=utf-8
    )

@app.post("/items")
def create_item(name: str):
    ITEMS_CREATED.inc()                # => Increment business metric counter
    return {"name": name}
```

**Key Takeaway**: Define Prometheus metrics at module level (`Counter`, `Histogram`, `Gauge`), increment them in middleware and handlers, and expose them at a `/metrics` endpoint for scraping.

**Why It Matters**: Prometheus metrics are the industry standard for API observability in Kubernetes environments. The request latency `Histogram` with `buckets` enables SLO tracking: "99% of requests complete in under 500ms" becomes a Prometheus query (`histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))`). Alerting on `http_requests_total` rate drops detects deployment failures before error logs appear. Business metrics like `items_created_total` expose revenue-impact indicators alongside technical performance—essential for correlating deployment events with business outcomes.

---

### Example 63: OpenTelemetry Distributed Tracing

OpenTelemetry provides vendor-neutral distributed tracing that integrates with Jaeger, Zipkin, Datadog, and AWS X-Ray. Instrument FastAPI to automatically trace request flow across service boundaries.

```python
# main.py - OpenTelemetry auto-instrumentation and manual spans
# pip install opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-fastapi
# pip install opentelemetry-exporter-jaeger
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from fastapi import FastAPI
import asyncio

# Set up tracer provider
provider = TracerProvider()
# In production, add span exporter:
# from opentelemetry.exporter.jaeger.thrift import JaegerExporter
# provider.add_span_processor(BatchSpanProcessor(JaegerExporter(agent_host_name="jaeger")))

trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)    # => Get tracer for this module

app = FastAPI()

FastAPIInstrumentor.instrument_app(app)
                                       # => Auto-instrument: creates spans for all HTTP requests
                                       # => Adds trace_id and span_id to each request
                                       # => Propagates W3C TraceContext headers between services

async def db_query(query: str) -> list:
    with tracer.start_as_current_span("db.query") as span:
                                       # => Create child span for database operation
        span.set_attribute("db.statement", query)
                                       # => Add SQL query as span attribute for debugging
        span.set_attribute("db.system", "postgresql")
        await asyncio.sleep(0.05)      # => Simulate query execution
        result = [{"id": 1}, {"id": 2}]
        span.set_attribute("db.rows_returned", len(result))
        return result

async def external_api_call(url: str) -> dict:
    with tracer.start_as_current_span("http.external") as span:
        span.set_attribute("http.url", url)
        await asyncio.sleep(0.1)       # => Simulate external HTTP request
        return {"data": "response"}

@app.get("/items")
async def list_items():
    with tracer.start_as_current_span("list_items") as span:
        span.set_attribute("operation", "list")

        # These calls create child spans automatically
        items_data = await db_query("SELECT * FROM items LIMIT 20")
        metadata = await external_api_call("https://metadata.service/items")

        span.set_attribute("items.count", len(items_data))
        return {"items": items_data, "metadata": metadata}
# Trace hierarchy:
# [HTTP GET /items]
#   [list_items]
#     [db.query] SELECT * FROM items
#     [http.external] https://metadata.service/items
```

**Key Takeaway**: Use `FastAPIInstrumentor.instrument_app()` for automatic HTTP span creation. Create custom child spans with `tracer.start_as_current_span()` to trace database queries, external calls, and business operations.

**Why It Matters**: Distributed tracing answers the hardest production debugging question: "why is this endpoint slow today?" A Jaeger or Zipkin trace shows the exact span where time is spent—is it the database query (add an index), the external API call (add a circuit breaker), or the handler logic (add caching)? Without tracing, diagnosing a 2-second response requires adding timing logs to each suspect function, deploying, waiting for the slow request to recur, then interpreting logs. Tracing gives this timeline instantly for every request in production.

---

## Group 25: Production Deployment

### Example 64: Production Gunicorn Configuration

For production deployments, Gunicorn with UvicornWorker provides multiple processes (bypassing Python's GIL for CPU-bound work) while maintaining async I/O within each worker. This is the recommended production deployment pattern.

```python
# gunicorn_config.py - Production Gunicorn configuration for FastAPI
# Run with: gunicorn main:app --config gunicorn_config.py
import multiprocessing
import os

# Worker configuration
workers = multiprocessing.cpu_count() * 2 + 1
                                       # => Rule: 2 * CPU cores + 1 for I/O-bound apps
                                       # => 4 CPU cores => 9 workers
worker_class = "uvicorn.workers.UvicornWorker"
                                       # => ASGI worker: each worker is a uvicorn event loop
                                       # => Enables async I/O within each process
worker_connections = 1000              # => Max concurrent connections per worker

# Binding
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
                                       # => Listen on all interfaces; PORT from environment

# Timeouts
timeout = 30                           # => Worker killed after 30s (prevents hung workers)
graceful_timeout = 30                  # => Wait 30s for in-flight requests during shutdown
keepalive = 5                          # => Keep-alive connections for 5 seconds

# Logging
accesslog = "-"                        # => "-" means stdout (compatible with container logging)
errorlog = "-"                         # => Errors also to stdout
loglevel = os.getenv("LOG_LEVEL", "info").lower()
                                       # => Log level from environment: debug|info|warning|error

# Process management
preload_app = True                     # => Load app once in master, fork workers
                                       # => Saves memory (copy-on-write for loaded modules)
                                       # => WARNING: database connections before fork cause issues
                                       # => Use lifespan events for connections (they run per-worker)

# main.py - Minimal FastAPI app for production
from fastapi import FastAPI

app = FastAPI(
    docs_url=None,                     # => Disable Swagger UI in production
    redoc_url=None,                    # => Disable ReDoc in production
    openapi_url=None,                  # => Disable OpenAPI schema in production
                                       # => Security: don't expose API structure to public
)

@app.get("/health/live")
def liveness():
    return {"status": "alive"}
```

**Key Takeaway**: Run FastAPI in production with `gunicorn main:app -w $(nproc*2+1) -k uvicorn.workers.UvicornWorker`. Disable docs endpoints, configure timeout and keep-alive, and log to stdout.

**Why It Matters**: Single-process `uvicorn main:app` cannot use multiple CPU cores—Python's GIL limits CPU parallelism to one thread at a time within one process. Gunicorn forks multiple worker processes, each running an independent event loop, achieving true parallelism for request handling. The `2 * CPUs + 1` formula accounts for I/O wait time in async workers: while one request awaits a database response, other requests execute on the same event loop. Disabling docs in production prevents API structure discovery by attackers who probe for endpoints to target.

---

### Example 65: Docker Containerization for FastAPI

A production-ready Dockerfile uses multi-stage builds to minimize image size, runs as a non-root user for security, and follows best practices for layer caching.

```dockerfile
# Dockerfile - Production-optimized FastAPI container
# Stage 1: Build dependencies
FROM python:3.12-slim AS builder
                                       # => python:3.12-slim: minimal Debian image
                                       # => AS builder: name this stage for reference

WORKDIR /build

# Install build dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt
                                       # => --no-cache-dir: don't cache pip packages (smaller image)
                                       # => --user: install to /root/.local (copied to final stage)
                                       # => Separate COPY + RUN: Docker caches this layer
                                       # => requirements.txt change => rebuild; code change => reuse

# Stage 2: Production image
FROM python:3.12-slim AS production
                                       # => Fresh minimal image without build tools

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local
                                       # => Copy only packages; no pip cache or build tools

# Copy application code
COPY . .
                                       # => Copy after packages: code changes don't invalidate package cache

# Security: run as non-root user
RUN useradd --create-home appuser && chown -R appuser:appuser /app
                                       # => Create dedicated user; running as root is a security risk
USER appuser
                                       # => Switch to non-root user for all subsequent commands

# Make local packages findable
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/app
                                       # => Ensure installed packages are on PATH

# FastAPI health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health/live')"
                                       # => Container orchestrator restarts unhealthy containers

EXPOSE 8000
                                       # => Document the port (doesn't actually expose it)

CMD ["gunicorn", "main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "4", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "30"]
                                       # => Start gunicorn with 4 uvicorn workers
```

```python
# main.py - Corresponding minimal FastAPI app
from fastapi import FastAPI
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

@app.get("/health/live")
def liveness():
    return {"status": "alive"}        # => HEALTHCHECK target endpoint
```

**Key Takeaway**: Use multi-stage Dockerfile to build dependencies in one stage and copy only the installed packages to the final image. Run as a non-root user and add a HEALTHCHECK for orchestrator integration.

**Why It Matters**: Multi-stage builds reduce image size from ~1GB (with pip cache and build tools) to ~200MB, cutting container startup times from 30 seconds to under 5 seconds in cold-start scenarios. Non-root containers prevent a compromised application process from writing to system directories or accessing other containers' files—a security boundary that has contained real container escape attacks. The HEALTHCHECK enables Kubernetes readiness probes and Docker Swarm restart policies, ensuring only healthy instances receive traffic after blue-green deployments.

---

### Example 66: Environment-Based Configuration and Secrets

Manage application configuration across development, staging, and production environments using Pydantic Settings with environment-specific `.env` files and secret injection patterns.

```python
# config.py - Multi-environment configuration management
from enum import Enum
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from functools import lru_cache
import os

class Environment(str, Enum):
    development = "development"
    staging = "staging"
    production = "production"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.getenv("ENV_FILE", ".env"),
                                       # => ENV_FILE env var selects which .env to load
                                       # => .env for dev, .env.staging for staging
        env_ignore_empty=True,         # => Treat empty strings as unset (use defaults)
        extra="ignore",                # => Ignore unknown env vars (don't raise errors)
    )

    environment: Environment = Environment.development
                                       # => ENVIRONMENT=production sets prod mode

    # Application
    app_name: str = "FastAPI App"
    debug: bool = False
    secret_key: str = Field(min_length=32)
                                       # => SECRET_KEY env var; required, min 32 chars

    # Database
    database_url: str = "sqlite+aiosqlite:///./dev.db"
                                       # => Use SQLite for development (no setup needed)
                                       # => Override with DATABASE_URL=postgresql+asyncpg://...

    # Redis (optional)
    redis_url: str | None = None       # => REDIS_URL; None disables caching

    # External services
    stripe_api_key: str | None = None  # => STRIPE_API_KEY; None disables payments

    @field_validator("secret_key")
    @classmethod
    def secret_key_not_default(cls, v: str) -> str:
        dangerous_keys = {"changeme", "secret", "password", "dev-key"}
        if any(k in v.lower() for k in dangerous_keys):
            import warnings
            warnings.warn("SECRET_KEY contains weak value; change before production!")
        return v

    @property
    def is_production(self) -> bool:
        return self.environment == Environment.production

    @property
    def is_debug(self) -> bool:
        return self.debug and not self.is_production
                                       # => Debug mode blocked in production

@lru_cache
def get_settings() -> Settings:
    return Settings()

# main.py - Environment-aware application behavior
from fastapi import FastAPI, Depends
from typing import Annotated

def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        docs_url="/docs" if not settings.is_production else None,
                                       # => Disable docs in production
        redoc_url="/redoc" if not settings.is_production else None,
        debug=settings.is_debug,
    )
    return app

app = create_app()

@app.get("/debug-info")
def debug_info(settings: Annotated[Settings, Depends(get_settings)]):
    if not settings.is_debug:
        return {"error": "Debug endpoint disabled"}
    return {
        "environment": settings.environment,
        "database_url": settings.database_url.split("@")[-1],
                                       # => Show only host/db, not credentials
    }
```

**Key Takeaway**: Use `SettingsConfigDict` with `env_file=os.getenv("ENV_FILE", ".env")` to load environment-specific configuration files. Add validators that warn on weak secret keys and block debug mode in production.

**Why It Matters**: Environment-specific configuration loaded from environment variables enables the Twelve-Factor App methodology: the same Docker image runs in development, staging, and production by injecting different environment variables, eliminating "works on my machine" deployment failures. Blocking debug mode in production prevents the most dangerous FastAPI misconfiguration: interactive exception pages that display full stack traces, local variable values, and source code to any visitor—a complete information disclosure vulnerability that has caused real security incidents.

---

## Group 26: Performance Optimization

### Example 67: Async Database Connection Pool Tuning

Database connection pool configuration significantly impacts FastAPI throughput. This example shows how to size the pool correctly and diagnose pool exhaustion.

```python
# main.py - Database connection pool configuration and monitoring
from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, event
import time
import os

# Connection pool event listeners for monitoring
checkout_times: dict[int, float] = {}  # => Track when connections are checked out

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://user:pass@localhost/mydb"
)

engine = create_async_engine(
    DATABASE_URL,
    pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
                                        # => Base pool size (connections always open)
                                        # => Rule: min(cpu_count * 2, max_connections / num_workers)
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
                                        # => Extra connections above pool_size
                                        # => Total max: pool_size + max_overflow = 30
    pool_timeout=30,                    # => Wait up to 30s for a connection from pool
                                        # => Raises TimeoutError if no connection available
                                        # => Prevents requests from waiting forever
    pool_recycle=3600,                  # => Recycle connections after 1 hour
                                        # => Prevents stale connections from timing out
    pool_pre_ping=True,                 # => Test connection health before using
                                        # => Detects connections dropped by database/network
                                        # => Slightly slower per-request; prevents 500 errors
    echo_pool=os.getenv("DEBUG_POOL", "false").lower() == "true",
                                        # => Log pool checkout/return events for debugging
)

AsyncSessionFactory = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionFactory() as session:
        yield session

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield                               # => App runs
    await engine.dispose()             # => Close all pool connections on shutdown
                                        # => Prevents "connection still open" errors

app = FastAPI(lifespan=lifespan)

@app.get("/pool-status")
async def pool_status():
    pool = engine.pool
    return {
        "pool_size": pool.size(),       # => Configured pool_size
        "checked_out": pool.checkedout(),
                                        # => Currently in-use connections
        "overflow": pool.overflow(),    # => Overflow connections in use
        "invalid": pool.invalid(),      # => Connections marked invalid (pre-ping failed)
    }
```

**Key Takeaway**: Set `pool_size` based on `min(cpu_count * 2, max_connections / workers)`. Use `pool_pre_ping=True` to detect stale connections. Set `pool_timeout=30` to fail fast instead of queuing indefinitely.

**Why It Matters**: Connection pool exhaustion is a top cause of cascading API failures. When all pool connections are in use, new requests wait in a queue. Under high load, this queue grows until requests time out—creating a thundering herd when they retry simultaneously, exhausting the pool again. Setting `pool_timeout=30` turns indefinite queuing into fast 503 errors that trigger client retry logic with exponential backoff. `pool_pre_ping` prevents the subtle "connection reset by database after 8 hours of inactivity" failure that causes 500 errors at 3 AM when traffic resumes after overnight quiet.

---

### Example 68: Response Compression Middleware

Enable gzip compression for large responses to reduce network transfer time and bandwidth costs. FastAPI/Starlette includes `GZipMiddleware` that transparently compresses responses above a configured size threshold.

```python
# main.py - Response compression with GZip middleware
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
import json

app = FastAPI()

app.add_middleware(
    GZipMiddleware,
    minimum_size=500,                  # => Only compress responses >= 500 bytes
                                       # => Compressing tiny responses adds CPU overhead
                                       # => with no bandwidth benefit
    compresslevel=6,                   # => Compression level 1-9 (1=fast, 9=smallest)
                                       # => 6 is standard: good ratio, reasonable CPU
)

@app.get("/small")
def small_response():
    return {"message": "hi"}           # => < 500 bytes: NOT compressed
                                       # => Content-Encoding header absent

@app.get("/large")
def large_response():
    # Generate large response to demonstrate compression
    items = [{"id": i, "name": f"item-{i:05d}", "description": f"Description for item number {i}"} for i in range(500)]
    return {"items": items, "total": len(items)}
                                       # => >> 500 bytes: compressed if client supports gzip
                                       # => Client sends: Accept-Encoding: gzip
                                       # => Response: Content-Encoding: gzip
                                       # => Typical reduction: 500KB => 50KB (90% smaller)

@app.get("/already-compressed")
def pre_compressed():
    return large_response()            # => GZipMiddleware respects Content-Encoding
                                       # => If response already has Content-Encoding: gzip
                                       # => middleware skips re-compression

# Benchmark comparison for 1000-item JSON response:
# Without compression: ~150KB, ~50ms transfer on 25Mbps connection
# With gzip level 6:    ~15KB, ~5ms transfer on 25Mbps connection (90% reduction)
# Compression CPU cost: ~0.5ms per response (negligible vs transfer savings)
```

**Key Takeaway**: Add `GZipMiddleware` with `minimum_size=500` to automatically compress large JSON responses. Compression reduces transfer size by 70-90% for typical JSON data with negligible CPU overhead.

**Why It Matters**: Uncompressed JSON API responses waste 70-90% of network bandwidth. A list endpoint returning 1,000 items as uncompressed JSON takes 150KB; gzip-compressed, it takes 15KB. On mobile networks where 25Mbps is typical, this reduces transfer time from 50ms to 5ms—a 10x improvement that compounds when users navigate between multiple list views. The `minimum_size` threshold ensures compression overhead is only paid when compression actually helps, keeping tiny health check responses fast and uncompressed.

---

### Example 69: Async Task Queue with Background Processing

For operations that must complete reliably (emails, webhooks, report generation), use a proper async task queue instead of `BackgroundTasks`. This example shows a simple in-process queue and the interface for external queues.

```python
# main.py - Async task queue pattern for reliable background processing
import asyncio
from contextlib import asynccontextmanager
from typing import Callable, Any
from fastapi import FastAPI
from pydantic import BaseModel

class AsyncTaskQueue:                  # => Simple in-process async task queue
    def __init__(self):
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task: asyncio.Task | None = None

    async def start(self):
        self._worker_task = asyncio.create_task(self._worker())
                                       # => Start background worker coroutine
        print("[Queue] Worker started")

    async def stop(self):
        await self._queue.join()       # => Wait for all queued tasks to complete
        if self._worker_task:
            self._worker_task.cancel()
        print("[Queue] Worker stopped")

    async def _worker(self):
        while True:
            task_fn, args, kwargs = await self._queue.get()
                                       # => Block until a task is available
            try:
                if asyncio.iscoroutinefunction(task_fn):
                    await task_fn(*args, **kwargs)
                                       # => Async task: await it
                else:
                    await asyncio.to_thread(task_fn, *args, **kwargs)
                                       # => Sync task: run in thread pool
            except Exception as e:
                print(f"[Queue] Task failed: {e}")
                                       # => In production: retry with backoff, dead letter queue
            finally:
                self._queue.task_done() # => Signal task completion to queue.join()

    async def enqueue(self, fn: Callable, *args: Any, **kwargs: Any) -> None:
        await self._queue.put((fn, args, kwargs))
                                       # => Add task to queue; does not block handler

task_queue = AsyncTaskQueue()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await task_queue.start()
    yield
    await task_queue.stop()

app = FastAPI(lifespan=lifespan)

async def send_email(to: str, subject: str, body: str) -> None:
    await asyncio.sleep(2)             # => Simulate 2-second email send
    print(f"[Email] Sent to {to}: {subject}")

class UserCreate(BaseModel):
    username: str
    email: str

@app.post("/users")
async def create_user(user: UserCreate):
    # Save user to database (not shown)
    await task_queue.enqueue(
        send_email,
        to=user.email,
        subject="Welcome!",
        body=f"Hello {user.username}",
    )                                  # => Email queued immediately; response returns
    return {"username": user.username, "message": "User created, welcome email queued"}
                                       # => Response in <1ms; email sends in background
```

**Key Takeaway**: An `asyncio.Queue` with a background worker coroutine enables reliable in-process task queuing. Use `queue.join()` in shutdown to drain pending tasks before process exit.

**Why It Matters**: FastAPI's built-in `BackgroundTasks` runs tasks after the response but within the same request lifecycle—if the process crashes mid-task, the task is lost. An explicit queue with a persistent worker survives individual request failures. For business-critical operations (payment processing, compliance audit logs, contractual webhook deliveries), use a persistent external queue (Celery with Redis/RabbitMQ, Arq, or AWS SQS) that survives process restarts. The in-process queue shown here is appropriate for best-effort, low-criticality tasks in single-instance deployments.

---

### Example 70: WebSocket with Authentication

Authenticate WebSocket connections during the handshake phase using query parameters or subprotocol headers, since WebSocket connections cannot carry custom request headers after the initial HTTP upgrade.

```python
# main.py - Authenticated WebSocket connections
import asyncio
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from jose import JWTError, jwt

app = FastAPI()
SECRET_KEY = "your-secret-key-min-32-chars"
ALGORITHM = "HS256"

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload                 # => Returns decoded payload with user info
    except JWTError:
        return None                    # => Invalid token: return None

active_users: dict[str, WebSocket] = {}
                                       # => username -> WebSocket mapping

@app.websocket("/ws")
async def authenticated_ws(
    websocket: WebSocket,
    token: str = Query(...),           # => Token passed as query parameter
                                       # => ws://host/ws?token=eyJhbGci...
                                       # => WebSocket HTTP upgrade allows query params
):
    payload = decode_token(token)
    if payload is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                                       # => 1008: Policy violation (auth failure)
                                       # => Close BEFORE accept() = reject the connection
        return                         # => Exit handler immediately

    username = payload.get("sub", "unknown")
    await websocket.accept()           # => Accept only after auth succeeds
                                       # => All auth happens before this line

    active_users[username] = websocket
    try:
        await websocket.send_json({"event": "connected", "username": username})
                                       # => Notify client of successful connection

        while True:
            data = await websocket.receive_json()
                                       # => receive_json(): parse incoming JSON message
            message_type = data.get("type")

            if message_type == "broadcast":
                # Broadcast to all authenticated users
                for user, ws in list(active_users.items()):
                    try:
                        await ws.send_json({
                            "from": username,
                            "message": data.get("message"),
                        })
                    except Exception:
                        del active_users[user]  # => Remove disconnected users

    except WebSocketDisconnect:
        active_users.pop(username, None)
        print(f"[WS] {username} disconnected")
```

**Key Takeaway**: Pass JWT tokens as query parameters (`?token=...`) for WebSocket authentication. Call `websocket.close()` before `accept()` to reject unauthorized connections with the appropriate close code.

**Why It Matters**: WebSocket connections bypass HTTP middleware that checks Authorization headers because the upgrade response is sent before the persistent connection is established. Without explicit WebSocket authentication, any browser can open a WebSocket to your endpoint without credentials—receiving real-time updates intended for authenticated users only. Query parameter tokens are the standard solution, though they appear in server access logs—use short-lived tokens (5-minute expiry) rotated via a separate HTTP endpoint to minimize the exposure window of logged tokens.

---

### Example 71: API Key Management Pattern

Implement API key authentication with key rotation, scope-based permissions, and usage tracking. This pattern is standard for developer-facing APIs and service-to-service authentication.

```python
# main.py - API key management with scopes and usage tracking
import hashlib
import secrets
from datetime import datetime
from typing import Annotated, Optional, Set
from fastapi import FastAPI, Security, HTTPException, status
from fastapi.security import APIKeyHeader
from pydantic import BaseModel

app = FastAPI()

api_key_header = APIKeyHeader(
    name="X-API-Key",                 # => Header name clients send
    auto_error=True,                   # => Raise 403 automatically if header missing
)

class APIKey(BaseModel):               # => API key record stored in database
    key_id: str
    key_hash: str                      # => Store hash, never the raw key
    owner: str
    scopes: Set[str]                   # => Permissions: {"read:items", "write:items"}
    active: bool = True
    created_at: str = ""

# Simulated key store (use database in production)
api_keys_db: dict[str, APIKey] = {}

def generate_api_key() -> tuple[str, str]:
    raw_key = f"sk_{secrets.token_urlsafe(32)}"
                                       # => "sk_" prefix: identifiable as a secret key
                                       # => secrets.token_urlsafe: cryptographically random
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
                                       # => Hash for storage; never store raw keys
    return raw_key, key_hash

def verify_api_key_with_scope(required_scope: str):
                                       # => Dependency factory for scope-based auth
    def _verify(
        api_key: Annotated[str, Security(api_key_header)],
                                       # => Security() extracts key from X-API-Key header
    ) -> APIKey:
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        for key_record in api_keys_db.values():
            if key_record.key_hash == key_hash:
                if not key_record.active:
                    raise HTTPException(status_code=401, detail="API key revoked")
                if required_scope not in key_record.scopes:
                    raise HTTPException(
                        status_code=403,
                        detail=f"API key lacks required scope: {required_scope}",
                    )
                return key_record       # => Return key record for handler use
        raise HTTPException(status_code=401, detail="Invalid API key")
    return _verify

@app.post("/api-keys")
def create_api_key(owner: str, scopes: list[str]):
    raw_key, key_hash = generate_api_key()
    key_id = secrets.token_hex(8)
    record = APIKey(
        key_id=key_id,
        key_hash=key_hash,
        owner=owner,
        scopes=set(scopes),
        created_at=datetime.now().isoformat(),
    )
    api_keys_db[key_id] = record
    return {"key_id": key_id, "api_key": raw_key, "scopes": scopes}
                                       # => Return raw_key ONCE at creation time
                                       # => Never retrievable again (only hash stored)

@app.get("/items", dependencies=[Security(verify_api_key_with_scope("read:items"))])
def list_items():
    return {"items": []}
```

**Key Takeaway**: Generate API keys with `secrets.token_urlsafe()`, store only the SHA-256 hash, and verify by hashing the provided key. Use scope-based permission checks as dependency factories.

**Why It Matters**: Storing API keys as plain text in a database creates a catastrophic breach scenario: a single SQL injection or database backup leak exposes all API keys simultaneously. Hashing keys with SHA-256 limits a database breach to an offline cracking attack against random 256-bit keys—computationally infeasible. Showing the raw key only once at creation time (like GitHub personal access tokens do) is the industry standard. Scope-based permissions enforce least-privilege access: a data ingestion service with `write:items` scope cannot accidentally trigger `admin:delete` operations even if its key is compromised.

---

### Example 72: Request Deduplication

Prevent duplicate request processing from network retries using idempotency keys. Clients include a unique `Idempotency-Key` header; the server caches the first response and replays it for duplicate requests.

```python
# main.py - Idempotency key middleware for safe retries
import hashlib
import json
import time
from typing import Optional
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

app = FastAPI()

# In-memory idempotency store (use Redis in production)
idempotency_store: dict[str, dict] = {}
                                       # => key_hash -> {status_code, body, expires_at}
IDEMPOTENCY_TTL = 86400               # => Cache idempotent responses for 24 hours

@app.middleware("http")
async def idempotency_middleware(request: Request, call_next) -> Response:
    idempotency_key = request.headers.get("Idempotency-Key")
                                       # => Only POST/PUT/PATCH need idempotency
    if not idempotency_key or request.method not in ("POST", "PUT", "PATCH"):
        return await call_next(request)  # => Skip middleware for GET/DELETE

    # Create store key: hash of (idempotency_key + path) to scope per endpoint
    store_key = hashlib.sha256(
        f"{idempotency_key}:{request.url.path}".encode()
    ).hexdigest()

    cached = idempotency_store.get(store_key)
    if cached and cached["expires_at"] > time.time():
        return JSONResponse(
            status_code=cached["status_code"],
            content=cached["body"],
            headers={"X-Idempotent-Replayed": "true"},
                                       # => Tell client this is a cached replay
        )

    response = await call_next(request)

    if 200 <= response.status_code < 300:
                                       # => Only cache successful responses
        body_bytes = b""
        async for chunk in response.body_iterator:
            body_bytes += chunk        # => Read response body for caching
        body = json.loads(body_bytes)
        idempotency_store[store_key] = {
            "status_code": response.status_code,
            "body": body,
            "expires_at": time.time() + IDEMPOTENCY_TTL,
        }
        return JSONResponse(status_code=response.status_code, content=body)

    return response

@app.post("/payments")
def process_payment(amount: float, currency: str):
    return {"payment_id": "pay_abc123", "amount": amount, "status": "completed"}
# POST /payments + Idempotency-Key: my-unique-key-001 => processes payment
# POST /payments + Idempotency-Key: my-unique-key-001 => returns cached response, X-Idempotent-Replayed: true
# Network retry safe: payment processed exactly once regardless of retries
```

**Key Takeaway**: Implement idempotency by caching successful responses keyed by `Idempotency-Key` header hash. Return cached responses for duplicate requests with an `X-Idempotent-Replayed` header.

**Why It Matters**: Network timeouts cause clients to retry requests, potentially processing the same payment, creating the same order, or sending the same email multiple times. Idempotency keys break this cycle: the first successful response is cached, and retries receive the identical response without re-executing the operation. Payment processors (Stripe, Braintree) mandate idempotency keys for all mutation endpoints. Implementing idempotency at the middleware level adds the protection to all endpoints uniformly, without requiring every handler to implement its own deduplication logic.

---

### Example 73: FastAPI with GraphQL via Strawberry

Integrate a GraphQL API alongside REST endpoints using Strawberry—a Python-first GraphQL library with Pydantic-like type annotations. Mount the GraphQL endpoint as a sub-application.

```python
# main.py - GraphQL integration with Strawberry
# pip install strawberry-graphql[fastapi]
import strawberry
from strawberry.fastapi import GraphQLRouter
from fastapi import FastAPI
from typing import List, Optional

app = FastAPI()

# Define GraphQL types with Strawberry
@strawberry.type
class Book:                            # => Strawberry type: maps to GraphQL type Book
    id: int
    title: str
    author: str
    year: int

@strawberry.type
class Author:
    id: int
    name: str
    books: List[Book]                  # => Nested type: GraphQL { author { books { title } } }

# Simulated data
books_data = [
    Book(id=1, title="Python Cookbook", author="Beazley", year=2013),
    Book(id=2, title="Fluent Python", author="Ramalho", year=2022),
]

@strawberry.type
class Query:                           # => Root query type (required)
    @strawberry.field
    def books(self) -> List[Book]:     # => Query: { books { id title author } }
        return books_data

    @strawberry.field
    def book(self, id: int) -> Optional[Book]:
                                       # => Query: { book(id: 1) { title year } }
        return next((b for b in books_data if b.id == id), None)

@strawberry.type
class Mutation:                        # => Root mutation type
    @strawberry.mutation
    def create_book(self, title: str, author: str, year: int) -> Book:
                                       # => Mutation: mutation { createBook(title: "..." ...) { id } }
        new_book = Book(id=len(books_data) + 1, title=title, author=author, year=year)
        books_data.append(new_book)
        return new_book

schema = strawberry.Schema(query=Query, mutation=Mutation)
                                       # => Compile schema from type definitions

graphql_app = GraphQLRouter(
    schema,
    graphiql=True,                     # => Enable GraphiQL IDE at /graphql
)

app.include_router(graphql_app, prefix="/graphql")
                                       # => GraphQL available at POST /graphql
                                       # => GraphiQL IDE at GET /graphql

@app.get("/rest/books")               # => REST endpoint alongside GraphQL
def rest_books():
    return books_data
```

**Key Takeaway**: Use Strawberry's `@strawberry.type`, `@strawberry.field`, and `GraphQLRouter` to add a GraphQL endpoint alongside REST endpoints. Mount with `include_router(graphql_app, prefix="/graphql")`.

**Why It Matters**: GraphQL enables frontend teams to request exactly the data they need without negotiating API shape changes with the backend team. A mobile app needing only `{id, title}` from a book list does not receive the full book object including description and metadata—reducing response size by 80% on bandwidth-constrained mobile connections. REST and GraphQL complement each other: expose GraphQL for flexible client queries and REST for simple CRUD operations, webhooks, and file uploads where GraphQL's complexity provides no benefit.

---

### Example 74: Server-Sent Events for Real-Time Updates

Server-Sent Events (SSE) provide one-directional real-time data push from server to browser using standard HTTP. Unlike WebSockets, SSE works over HTTP/1.1, supports automatic reconnection, and passes through proxies that block WebSockets.

```python
# main.py - Server-Sent Events for real-time dashboard updates
import asyncio
import json
import time
from typing import AsyncGenerator
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"])

# Simulated metric source
async def generate_metrics() -> AsyncGenerator[str, None]:
    for _ in range(60):               # => Send 60 events (1 per second for 1 minute)
        data = {
            "cpu_percent": 45.2 + (time.time() % 10),
                                       # => Simulated fluctuating CPU metric
            "memory_percent": 62.1,
            "requests_per_sec": 142,
            "timestamp": time.time(),
        }
        yield f"event: metrics\ndata: {json.dumps(data)}\n\n"
                                       # => SSE format: event type + data + blank line
                                       # => "event:" line is optional (default is "message")
        yield f": heartbeat\n\n"       # => SSE comment line: keeps connection alive
                                       # => Prevents proxy/LB from closing idle connection
        await asyncio.sleep(1)         # => One event per second

    yield "event: done\ndata: {}\n\n" # => Signal stream end to client

@app.get("/stream/metrics")
async def stream_metrics(request: Request):
    async def event_generator():
        try:
            async for event in generate_metrics():
                if await request.is_disconnected():
                    break              # => Client disconnected: stop generating
                yield event
        except asyncio.CancelledError:
            pass                       # => Request cancelled: clean exit

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
                                       # => Prevent any caching of the event stream
            "X-Accel-Buffering": "no",
                                       # => Tell nginx to not buffer the response
            "Connection": "keep-alive",
        },
    )
# JavaScript client:
# const source = new EventSource('/stream/metrics');
# source.addEventListener('metrics', (e) => updateDashboard(JSON.parse(e.data)));
# source.addEventListener('done', () => source.close());
# source.onerror = () => { /* SSE auto-reconnects; log error */ };
```

**Key Takeaway**: Use `StreamingResponse` with `text/event-stream` media type and SSE format (`event: name\ndata: json\n\n`) for server-to-client real-time updates. Send periodic comment lines (`: heartbeat\n\n`) to keep the connection alive.

**Why It Matters**: SSE is the right tool for dashboards, live logs, and notification feeds—one-directional real-time data flowing from server to browser. Unlike WebSockets, SSE uses standard HTTP that passes through corporate proxies and load balancers without configuration changes. The browser's `EventSource` API handles reconnection automatically after network interruptions—clients reconnect and the server resumes streaming from where it left off using the `Last-Event-ID` header. For scenarios requiring bi-directional communication, use WebSockets instead.

---

### Example 75: Multi-Tenant API with Header-Based Tenant Routing

Multi-tenant SaaS APIs serve multiple customers from one deployment. Use tenant identification from JWT claims or custom headers to scope database queries, apply tenant-specific rate limits, and isolate data between tenants.

```python
# main.py - Multi-tenant data isolation pattern
from typing import Annotated, Optional
from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel

app = FastAPI()

class Tenant(BaseModel):
    tenant_id: str
    name: str
    plan: str                          # => "free" | "pro" | "enterprise"

# Simulated tenant registry
tenants_db: dict[str, Tenant] = {
    "tenant-001": Tenant(tenant_id="tenant-001", name="Acme Corp", plan="pro"),
    "tenant-002": Tenant(tenant_id="tenant-002", name="Beta Inc", plan="free"),
}

# Simulated tenant-scoped data store
tenant_data: dict[str, list] = {
    "tenant-001": [{"id": 1, "name": "Acme Item"}],
    "tenant-002": [{"id": 1, "name": "Beta Item"}],
}

def get_current_tenant(
    x_tenant_id: Annotated[Optional[str], Header()] = None,
                                       # => Tenant ID from X-Tenant-Id request header
                                       # => Real apps: extract from JWT "tenant_id" claim
) -> Tenant:
    if x_tenant_id is None:
        raise HTTPException(status_code=400, detail="X-Tenant-Id header required")
    tenant = tenants_db.get(x_tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

def require_plan(*plans: str):
                                       # => Dependency factory for plan-based feature gating
    def checker(
        tenant: Annotated[Tenant, Depends(get_current_tenant)],
    ) -> Tenant:
        if tenant.plan not in plans:
            raise HTTPException(
                status_code=402,       # => 402 Payment Required
                detail=f"Feature requires plan: {', '.join(plans)}. Current: {tenant.plan}",
            )
        return tenant
    return checker

@app.get("/items")
def list_items(
    tenant: Annotated[Tenant, Depends(get_current_tenant)],
):
    items = tenant_data.get(tenant.tenant_id, [])
                                       # => Scoped to this tenant only
                                       # => tenant-001 cannot see tenant-002's items
    return {"tenant": tenant.name, "items": items}

@app.post("/analytics/export")
def export_analytics(
    tenant: Annotated[Tenant, Depends(require_plan("pro", "enterprise"))],
                                       # => Only pro/enterprise tenants can export
):
    return {"tenant": tenant.name, "export": "started", "plan": tenant.plan}
```

**Key Takeaway**: Extract tenant identity from request headers or JWT claims using a dependency. Scope all database queries to `WHERE tenant_id = current_tenant.id` and use plan-based dependencies for feature gating.

**Why It Matters**: Tenant data isolation is the most critical correctness requirement in multi-tenant SaaS. A missing `WHERE tenant_id = ?` clause in one query exposes every customer's data to every other customer—a breach that violates GDPR, SOC 2, and every customer contract simultaneously. Implementing tenant scoping as a dependency ensures it is declared once and applied consistently. The plan-based feature gating pattern replaces scattered `if plan == "pro"` checks throughout the codebase with declarative `require_plan("pro")` dependencies that document and enforce pricing tiers at the route level.

---

### Example 76: OpenAPI Schema Versioning Documentation

Document breaking changes, deprecations, and migration paths in OpenAPI to help API consumers understand what changed between versions and how to migrate their integrations.

```python
# main.py - Documenting API changes with OpenAPI deprecation markers
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="Product API",
    description="""
## Changelog

### v2.0 (Current)
- `display_name` field added to Item response
- `tax` parameter deprecated; use `tax_rate` instead

### v1.0 (Deprecated endpoints marked below)
- Initial release with `tax` field
    """,
    version="2.0.0",
)

class ItemV1(BaseModel):               # => Legacy response model
    id: int
    name: str
    price: float
    tax: Optional[float] = None        # => Old field, to be removed in v3

class ItemV2(BaseModel):               # => Current response model
    id: int
    name: str
    price: float
    tax_rate: Optional[float] = None   # => Renamed from "tax"
    display_name: str                  # => New required field
    tax: Optional[float] = Field(
        default=None,
        deprecated=True,               # => Pydantic v2: marks field as deprecated in schema
        description="Deprecated: use tax_rate instead. Will be removed in v3.0.",
    )

@app.get(
    "/v1/items/{item_id}",
    response_model=ItemV1,
    deprecated=True,                   # => deprecated=True: crossed-out in Swagger UI
    summary="[DEPRECATED] Get Item (v1)",
    description="""
**Deprecated**: This endpoint will be removed in API version 3.0.

Please migrate to [GET /items/{item_id}](/docs#/items/get_item_v2_items__item_id__get).

**Migration guide**:
- `tax` field renamed to `tax_rate`
- `display_name` field added (required)
    """,
)
def get_item_v1(item_id: int):
    return ItemV1(id=item_id, name=f"item-{item_id}", price=9.99)

@app.get(
    "/items/{item_id}",
    response_model=ItemV2,
    tags=["items"],
    summary="Get Item (v2)",
)
def get_item_v2(item_id: int):
    return ItemV2(
        id=item_id,
        name=f"item-{item_id}",
        price=9.99,
        tax_rate=0.08,
        display_name=f"Item #{item_id}",
    )
```

**Key Takeaway**: Use `deprecated=True` on route decorators and `Field(deprecated=True)` on Pydantic fields to document deprecations in the OpenAPI schema. Include migration guides in endpoint descriptions.

**Why It Matters**: API consumers cannot migrate away from deprecated endpoints without knowing what changed and how. Marking deprecations in OpenAPI documentation creates visible warnings in Swagger UI (strikethrough styling) and in generated client SDK documentation, making it impossible for developers to miss them during code review. Including migration guides in the endpoint description eliminates support tickets asking "how do I migrate from v1 to v2?" API versioning handled through documentation rather than code branches keeps the implementation maintainable while respecting existing integrations.

---

### Example 77: Webhook Delivery with Retry Logic

Outbound webhook delivery requires reliability guarantees: retry on failure, exponential backoff, and signature verification so consumers can validate authenticity of webhook payloads.

```python
# main.py - Webhook delivery with retry and HMAC signature
import asyncio
import hashlib
import hmac
import json
import time
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import httpx

app = FastAPI()

WEBHOOK_SECRET = "shared-secret-between-sender-and-receiver"
                                       # => Shared secret for HMAC signature

def sign_payload(payload: dict, secret: str) -> str:
    body = json.dumps(payload, sort_keys=True)
    signature = hmac.new(
        secret.encode(),               # => HMAC key
        body.encode(),                 # => Message to sign
        hashlib.sha256,                # => Hash algorithm
    ).hexdigest()
    return f"sha256={signature}"       # => "sha256=abc123..." format (GitHub-style)

async def deliver_webhook(
    url: str,
    event_type: str,
    payload: dict,
    max_retries: int = 3,
) -> bool:
    signature = sign_payload(payload, WEBHOOK_SECRET)
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Event": event_type,
        "X-Webhook-Signature": signature,
                                       # => Receiver verifies this to confirm authenticity
        "X-Webhook-Timestamp": str(int(time.time())),
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        for attempt in range(max_retries):
            try:
                response = await client.post(url, json=payload, headers=headers)
                if 200 <= response.status_code < 300:
                    print(f"[Webhook] Delivered to {url}: {event_type}")
                    return True        # => Success: stop retrying
                print(f"[Webhook] Attempt {attempt+1}: HTTP {response.status_code}")
            except httpx.RequestError as e:
                print(f"[Webhook] Attempt {attempt+1}: Network error: {e}")

            if attempt < max_retries - 1:
                wait = (2 ** attempt) * 1.0  # => Exponential backoff: 1s, 2s, 4s
                await asyncio.sleep(wait)

    print(f"[Webhook] Failed after {max_retries} attempts: {url}")
    return False                       # => All retries exhausted

class OrderCreated(BaseModel):
    order_id: str
    customer_email: str
    total: float

@app.post("/orders")
async def create_order(order: OrderCreated, background_tasks: BackgroundTasks):
    # Save order to database (not shown)
    payload = {"event": "order.created", "data": order.model_dump()}
    background_tasks.add_task(
        deliver_webhook,
        "https://customer.example.com/webhooks",
                                       # => Customer's webhook endpoint
        "order.created",
        payload,
    )
    return {"order_id": order.order_id, "status": "created"}
```

**Key Takeaway**: Sign webhook payloads with HMAC-SHA256 and include the signature in a request header. Implement exponential backoff retry: `wait = 2^attempt` seconds between attempts.

**Why It Matters**: Unsigned webhooks cannot be verified by receivers—any server can send forged events claiming to be your API. HMAC signatures let receivers verify authenticity by computing the same signature with the shared secret: `hmac.compare_digest(received_sig, computed_sig)`. Exponential backoff retry prevents your webhook system from overwhelming a receiver that is temporarily down, which would exacerbate their recovery. Without retry logic, transient network failures cause permanent missed events—breaking integrations silently in ways that only surface during customer support investigations days later.

---

### Example 78: API Gateway Pattern with httpx

FastAPI can act as an API gateway: routing requests to downstream microservices, aggregating responses, and adding cross-cutting concerns (auth, rate limiting, caching) at the edge.

```python
# main.py - API gateway pattern aggregating microservices
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
import httpx

app = FastAPI(title="API Gateway")

# Service registry (use service discovery in production)
SERVICES = {
    "users": "http://users-service:8001",
    "orders": "http://orders-service:8002",
    "inventory": "http://inventory-service:8003",
}

# Shared async HTTP client (reuse connections)
http_client: Optional[httpx.AsyncClient] = None

@app.on_event("startup")
async def startup():
    global http_client
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(
            connect=5.0,               # => Connection timeout: 5 seconds
            read=30.0,                 # => Read timeout: 30 seconds
            write=10.0,
            pool=5.0,                  # => Pool acquisition timeout
        ),
        limits=httpx.Limits(
            max_connections=100,       # => Total concurrent connections
            max_keepalive_connections=20,
        ),
    )

@app.on_event("shutdown")
async def shutdown():
    if http_client:
        await http_client.aclose()    # => Close all connections cleanly

async def proxy_request(service: str, path: str, request: Request) -> dict:
    base_url = SERVICES.get(service)
    if not base_url:
        raise HTTPException(status_code=404, detail=f"Service {service} not found")
    url = f"{base_url}{path}"
    try:
        response = await http_client.request(
            method=request.method,
            url=url,
            headers={k: v for k, v in request.headers.items() if k.lower() != "host"},
                                       # => Forward headers except Host (set by httpx)
            content=await request.body() if request.method in ("POST", "PUT", "PATCH") else None,
        )
        return response.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=f"Service {service} timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail=f"Service {service} unavailable")

@app.get("/users/{user_id}/dashboard")
async def user_dashboard(user_id: int, request: Request):
    # Aggregate data from multiple services concurrently
    user_data, order_data, inventory_data = await asyncio.gather(
        proxy_request("users", f"/users/{user_id}", request),
        proxy_request("orders", f"/users/{user_id}/orders", request),
        proxy_request("inventory", f"/users/{user_id}/reserved", request),
        return_exceptions=True,        # => Partial failure: return what's available
    )
    return {
        "user": user_data if not isinstance(user_data, Exception) else None,
        "orders": order_data if not isinstance(order_data, Exception) else None,
        "inventory": inventory_data if not isinstance(inventory_data, Exception) else None,
    }
```

**Key Takeaway**: Use a shared `httpx.AsyncClient` with connection limits and timeouts to proxy requests to downstream services. `asyncio.gather` with `return_exceptions=True` enables partial-failure aggregation.

**Why It Matters**: An API gateway that creates a new HTTP client per request wastes 80% of response time establishing TCP connections. A shared `AsyncClient` with connection pooling reuses established connections, reducing per-request overhead from ~50ms (TCP handshake + TLS) to <1ms. Gateway-level timeout configuration (connect, read, pool) prevents slow downstream services from cascading into gateway unavailability—a 30-second read timeout limits the blast radius of a slow microservice to 30 seconds of degraded responses instead of indefinitely queued gateway threads.

---

### Example 79: Rate Limiting with Redis for Distributed Systems

In-process rate limiting breaks when multiple server instances run behind a load balancer—each instance tracks its own counter, allowing clients to exceed limits by round-robin across instances. Redis provides a shared counter for distributed rate limiting.

```python
# main.py - Distributed rate limiting with Redis
# pip install redis[asyncio]
import time
from typing import Annotated, Optional
from fastapi import FastAPI, Depends, HTTPException, Request, status

app = FastAPI()

# Rate limit configuration
RATE_LIMIT_REQUESTS = 100             # => Max requests per window
RATE_LIMIT_WINDOW = 60                # => Window size in seconds

# Simulated Redis client (use redis.asyncio.Redis in production)
class FakeRedis:                       # => Simulates Redis for this example
    def __init__(self):
        self._data: dict = {}

    async def incr(self, key: str) -> int:
        self._data[key] = self._data.get(key, 0) + 1
        return self._data[key]         # => Atomic increment; returns new value

    async def expire(self, key: str, seconds: int) -> None:
        pass                           # => Real Redis: set key expiry

    async def ttl(self, key: str) -> int:
        return RATE_LIMIT_WINDOW       # => Real Redis: returns remaining TTL

redis = FakeRedis()                    # => In production: redis = await aioredis.from_url("redis://localhost")

async def check_rate_limit(request: Request) -> dict:
    client_ip = request.client.host if request.client else "unknown"
    window_key = int(time.time()) // RATE_LIMIT_WINDOW
                                       # => Key changes every RATE_LIMIT_WINDOW seconds
                                       # => Creates fixed windows in Redis
    redis_key = f"rate_limit:{client_ip}:{window_key}"
                                       # => Unique key per client per time window

    count = await redis.incr(redis_key)
                                       # => Atomically increment and return new value
                                       # => Redis INCR is atomic: safe under concurrency
    if count == 1:
        await redis.expire(redis_key, RATE_LIMIT_WINDOW * 2)
                                       # => Set expiry on first request: auto-cleanup

    remaining = max(0, RATE_LIMIT_REQUESTS - count)
    if count > RATE_LIMIT_REQUESTS:
        ttl = await redis.ttl(redis_key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(RATE_LIMIT_REQUESTS),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(time.time()) + ttl),
                                       # => Unix timestamp when limit resets
                "Retry-After": str(ttl),
            },
        )
    return {"limit": RATE_LIMIT_REQUESTS, "remaining": remaining}

@app.get("/api/data")
async def get_data(
    rate_info: Annotated[dict, Depends(check_rate_limit)],
):
    return {"data": "response", "rate_info": rate_info}
```

**Key Takeaway**: Use Redis `INCR` with `EXPIRE` for distributed rate limiting. The Redis key format `rate_limit:{client_ip}:{window_key}` creates per-client, per-time-window counters shared across all server instances.

**Why It Matters**: In-process rate limiting in a load-balanced deployment with 10 server instances effectively multiplies the rate limit by 10—a "100 requests/minute" limit becomes "1,000 requests/minute" in practice. Redis `INCR` is atomic, meaning concurrent requests from different server instances safely share a single counter. The Lua script approach (`EVALSHA` for atomicity) solves the race condition between `INCR` and `EXPIRE` seen in simpler implementations. For sub-millisecond rate limit checks at scale, Redis's in-memory data structure operations are faster than any database query.

---

### Example 80: Production Checklist and Security Headers

Consolidate all production-readiness concerns into a single `create_production_app()` factory function. This pattern ensures consistent security headers, middleware ordering, and configuration across all deployments.

```python
# main.py - Production-ready FastAPI application factory
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        response.headers.update({
            "X-Content-Type-Options": "nosniff",
                                       # => Prevents MIME-type sniffing attacks
            "X-Frame-Options": "DENY",
                                       # => Prevents clickjacking
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
                                       # => HSTS: force HTTPS for 1 year
                                       # => Only set if you have HTTPS configured
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
                                       # => Disable browser APIs the app does not use
            "Content-Security-Policy": "default-src 'self'",
                                       # => Restrict resource loading to same origin
                                       # => Adjust for apps using CDN assets
        })
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[Startup] Initializing production resources...")
    # Initialize database pool, ML models, Redis connection here
    yield
    # Shutdown
    print("[Shutdown] Cleaning up production resources...")
    # Close database pool, save state, flush metrics here

def create_production_app() -> FastAPI:
    env = os.getenv("ENVIRONMENT", "development")
    is_prod = env == "production"

    app = FastAPI(
        title="Production API",
        version="1.0.0",
        docs_url=None if is_prod else "/docs",
                                       # => Disable docs in production
        redoc_url=None if is_prod else "/redoc",
        openapi_url=None if is_prod else "/openapi.json",
        lifespan=lifespan,
    )

    # Middleware order: added last runs first
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["api.example.com", "*.example.com"] if is_prod else ["*"],
                                       # => Reject requests with unknown Host headers
                                       # => Prevents Host header injection attacks
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://app.example.com"] if is_prod else ["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.get("/health/live", tags=["monitoring"])
    def liveness():
        return {"status": "alive", "environment": env}

    return app

app = create_production_app()
```

**Key Takeaway**: Use an `create_production_app()` factory to consolidate middleware ordering, security headers, environment-based feature flags, and lifecycle management. Environment variable `ENVIRONMENT=production` activates production-only restrictions.

**Why It Matters**: Security hardening applied inconsistently—some endpoints with CORS, others without; some responses with security headers, some without—creates exploitable gaps. The application factory pattern enforces that every deployment of the application includes the complete security middleware stack, independent of which routes are registered. Security headers (`HSTS`, `CSP`, `X-Frame-Options`) protect users from a range of browser-based attacks without any application logic changes. The `TrustedHostMiddleware` prevents Host header injection attacks that can cause cache poisoning in CDN configurations—a class of vulnerability invisible until it causes a production security incident.
