---
title: "Advanced"
weight: 10000005
date: 2026-05-24T00:00:00+07:00
draft: false
description: "Examples 51–75: Retry and circuit-breaker decorators, observability port adapters, outbox pattern for reliable event publishing, graceful shutdown, configuration validation, and the full production hexagon — in Go (canonical) and Rust"
tags:
  [
    "hexagonal-architecture",
    "ports-and-adapters",
    "retry",
    "circuit-breaker",
    "observability",
    "outbox",
    "production",
    "tutorial",
    "by-example",
    "procedural",
    "go",
    "rust",
    "advanced",
  ]
---

This advanced tier completes the hexagonal procurement platform with production adapter patterns. The beginner tier established three-zone architecture and dependency inversion; the intermediate tier added adapter swap, anti-corruption layer, and CQRS read models. This tier adds resilience (retry, circuit breaker), observability (metrics, tracing), reliable event publishing (outbox), and production composition root wiring with graceful shutdown.

**Canonical sources**: Kat Zień — [How I write HTTP services in Go after 13 years](https://grafana.com/blog/2024/02/09/how-i-write-http-services-in-go-after-13-years/); Michael T. Nygard — [_Release It!_, 2nd ed.](https://pragprog.com/titles/mnee2/release-it-second-edition/) (Pragmatic Programmers, 2018); Jim Blandy, Jason Orendorff, Leonora F. S. Tindall — [_Programming Rust_, 3rd ed.](https://www.oreilly.com/library/view/programming-rust-3rd/9781098176228/) (O'Reilly, 2024); [OpenTelemetry Go](https://opentelemetry.io/docs/languages/go/); [OpenTelemetry Rust](https://opentelemetry.io/docs/languages/rust/).

## Retry Decorator (Examples 51–55)

### Example 51: RetryDecorator for Output Ports

A retry decorator transparently retries transient failures — callers receive a reliable interface without knowing retries happened. The decorator satisfies the same port interface as the inner implementation, so the application service requires no changes. This preserves the hexagonal invariant: the application zone depends only on the port interface, never on the adapter implementation.

```mermaid
sequenceDiagram
    accTitle: Example 51: RetryDecorator for Output Ports
    accDescr: Sequence diagram between AppService, RetryPORepository, PostgresPORepository. Messages: AppService to RetryPORepository: Save(ctx, po); RetryPORepository to PostgresPORepository: Save(ctx, po); PostgresPORepository to RetryPORepository: RetryableError (attempt 1); RetryPORepository to PostgresPORepository: Save(ctx, po); PostgresPORepository to RetryPORepository: RetryableError (attempt 2); RetryPORepository to PostgresPORepository: Save(ctx, po); PostgresPORepository to RetryPORepository: nil (success); RetryPORepository to AppService: nil.
    participant AS as AppService
    participant RR as RetryPORepository
    participant DB as PostgresPORepository

    AS->>RR: Save(ctx, po)
    RR->>DB: Save(ctx, po)
    DB-->>RR: RetryableError (attempt 1)
    Note over RR: wait backoff
    RR->>DB: Save(ctx, po)
    DB-->>RR: RetryableError (attempt 2)
    Note over RR: wait backoff
    RR->>DB: Save(ctx, po)
    DB-->>RR: nil (success)
    RR-->>AS: nil

    %%Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => RetryPORepository wraps any PurchaseOrderRepository and adds retry logic.
// => The inner field holds the real adapter (e.g., PostgresPORepository).
type RetryPORepository struct {
    // => inner: the decorated adapter; called on every attempt
    inner       PurchaseOrderRepository
    // => maxAttempts: total call budget including the first try (e.g., 3 = 1 call + 2 retries)
    maxAttempts int
    // => backoff: strategy that computes wait duration between attempts
    backoff      RetryBackoff
}

// => Save satisfies PurchaseOrderRepository so callers see no difference.
// => The application service injects RetryPORepository as PurchaseOrderRepository.
func (r *RetryPORepository) Save(
    ctx context.Context,
    po *PurchaseOrder,
) error {
    // => lastErr accumulates the error from each failed attempt.
    var lastErr error
    // => Loop from attempt 0 through maxAttempts-1.
    for attempt := 0; attempt < r.maxAttempts; attempt++ {
        // => On the first attempt, proceed immediately — no wait needed.
        if attempt > 0 {
            // => For subsequent attempts, compute how long to sleep before retrying.
            select {
            // => Wait for the backoff duration to elapse, then try again.
            case <-time.After(r.backoff.Wait(attempt)):
            // => If the caller cancelled or timed out, abort and return ctx.Err().
            case <-ctx.Done():
                return ctx.Err()
            }
        }
        // => Delegate to the real adapter for this attempt.
        err := r.inner.Save(ctx, po)
        // => Success path: return nil immediately without retrying.
        if err == nil {
            return nil
        }
        // => Non-retryable errors (e.g., NOT FOUND, constraint violation) fail fast.
        // => Retrying a NOT FOUND will never succeed — don't waste budget.
        if !IsRetryable(err) {
            return err
        }
        // => Retryable error: record it and continue to the next attempt.
        lastErr = err
    }
    // => All attempts exhausted — return the last observed error.
    // => Caller can inspect lastErr to understand what went wrong.
    return lastErr
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => RetryPORepository<R> wraps any type that implements PORepository.
// => Generic R: PORepository means the compiler monomorphizes, yielding zero vtable overhead.
pub struct RetryPORepository<R: PORepository> {
    // => inner: the decorated real adapter
    inner: R,
    // => max_attempts: total call budget (includes first try)
    max_attempts: u32,
    // => backoff: computes wait duration per attempt
    backoff: RetryBackoff,
}

// => Implement PORepository for the wrapper so callers see the same interface.
#[async_trait]
impl<R: PORepository + Send + Sync> PORepository for RetryPORepository<R> {
    async fn save(
        &self,
        ctx: &Context,
        po: &PurchaseOrder,
    ) -> Result<(), RepoError> {
        // => last_err tracks the most recent retryable error across the loop.
        let mut last_err: Option<RepoError> = None;
        // => Iterate up to max_attempts times.
        for attempt in 0..self.max_attempts {
            // => First attempt is immediate; subsequent attempts wait for backoff.
            if attempt > 0 {
                let wait = self.backoff.wait(attempt);
                // => select! races the backoff sleep against context cancellation.
                tokio::select! {
                    // => Backoff elapsed — proceed to retry.
                    _ = tokio::time::sleep(wait) => {}
                    // => Context cancelled — abort early, respect caller deadline.
                    _ = ctx.cancelled() => {
                        return Err(RepoError::Cancelled);
                    }
                }
            }
            // => Delegate to real adapter for this attempt.
            match self.inner.save(ctx, po).await {
                // => Success — return immediately.
                Ok(()) => return Ok(()),
                Err(e) if !is_retryable(&e) => {
                    // => Non-retryable error (constraint, not-found): fail fast.
                    return Err(e);
                }
                // => Retryable transient error — record and continue loop.
                Err(e) => last_err = Some(e),
            }
        }
        // => Budget exhausted — return the last retryable error.
        Err(last_err.unwrap())
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: A retry decorator satisfies the same port interface as the inner adapter — the application service is unaware retries are happening and requires no changes.

---

### Example 52: Exponential Backoff with Jitter

Exponential backoff prevents thundering herd — if multiple service instances all retry simultaneously, they overwhelm a recovering upstream. Adding random jitter spreads retries over time. The `RetryBackoff` interface used in Example 51 is satisfied by any backoff strategy, keeping policy separate from mechanism.

```mermaid
graph TD
    accTitle: Example 52: Exponential Backoff with Jitter
    accDescr: Graph with 4 nodes and 3 connections. Nodes: Attempt 0 immediate, Attempt 1 ~100 ms ± jitter, Attempt 2 ~200 ms ± jitter, Attempt 3 ~400 ms ± jitter. Connections: Attempt 0 immediate to Attempt 1 ~100 ms ± jitter, Attempt 1 ~100 ms ± jitter to Attempt 2 ~200 ms ± jitter, Attempt 2 ~200 ms ± jitter to Attempt 3 ~400 ms ± jitter.
    A["Attempt 0<br/>immediate"]:::teal
    B["Attempt 1<br/>~100 ms ± jitter"]:::blue
    C["Attempt 2<br/>~200 ms ± jitter"]:::orange
    D["Attempt 3<br/>~400 ms ± jitter"]:::purple

    A --> B --> C --> D

    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => RetryBackoff is the port interface for wait-time strategies.
// => Swapping fixed → exponential → adaptive requires only a different struct.
type RetryBackoff interface {
    // => Wait returns the duration to sleep before attempt number n (n >= 1).
    Wait(attempt int) time.Duration
}

// => ExponentialBackoff implements RetryBackoff with base * multiplier^attempt.
type ExponentialBackoff struct {
    // => initial: base duration for attempt 1 (e.g., 100ms)
    initial    time.Duration
    // => max: upper bound so backoff does not grow unbounded
    max        time.Duration
    // => multiplier: growth factor per step; 2.0 = standard doubling
    multiplier float64
}

// => Wait computes the capped exponential delay plus additive jitter.
func (b ExponentialBackoff) Wait(attempt int) time.Duration {
    // => Compute uncapped backoff: initial * multiplier^attempt
    d := time.Duration(float64(b.initial) *
        math.Pow(b.multiplier, float64(attempt)))
    // => Cap at max to prevent multi-minute sleeps on deep retry chains.
    if d > b.max {
        d = b.max
    }
    // => Jitter = random fraction in [0, d/2).
    // => Spreads retries across time window — prevents synchronized storms.
    jitter := time.Duration(rand.Int63n(int64(d / 2)))
    // => Return base delay plus jitter; result is in range [d, d + d/2).
    return d + jitter
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => ExponentialBackoff computes base * multiplier^attempt, capped at max, plus jitter.
pub struct ExponentialBackoff {
    // => initial: base delay for attempt 1
    pub initial: Duration,
    // => max: ceiling on computed delay
    pub max: Duration,
    // => multiplier: growth factor (2.0 = doubling)
    pub multiplier: f64,
}

// => Implement RetryBackoff trait so RetryPORepository<R> accepts this strategy.
impl RetryBackoff for ExponentialBackoff {
    fn wait(&self, attempt: u32) -> Duration {
        // => Compute uncapped delay: initial * multiplier^attempt
        let secs = self.initial.as_secs_f64()
            * self.multiplier.powi(attempt as i32);
        // => Cap at max to bound worst-case wait time.
        let base = Duration::from_secs_f64(secs.min(self.max.as_secs_f64()));
        // => Jitter: random fraction in [0, base/2).
        // => rand::random::<f64>() returns [0.0, 1.0); multiply by base/2.
        let jitter_secs = rand::random::<f64>() * base.as_secs_f64() / 2.0;
        // => Final wait = base + jitter, keeping retries temporally spread.
        base + Duration::from_secs_f64(jitter_secs)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Jitter randomizes the retry schedule, preventing multiple clients from colliding on the same retry instant after a shared upstream blip.

---

### Example 53: Retryable vs Non-Retryable Error Classification

Not all errors should be retried — a 404 Not Found will never succeed on retry while a network timeout might. Classifying errors at the adapter boundary keeps this decision close to the transport layer that understands what each error code means, while the retry decorator stays generic.

```mermaid
classDiagram
    accTitle: Example 53: Retryable vs Non-Retryable Error Classification
    accDescr: Class diagram with 2 items: RepoError, RetryableError. Relationships: RepoError to RetryableError: wraps transient/timeout variants.
    class RepoError {
        +NotFound
        +ConstraintViolation
        +Transient
        +Timeout
    }
    class RetryableError {
        +cause error
        +Error() string
        +Unwrap() error
    }
    RepoError <|-- RetryableError : wraps transient/timeout variants

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => RetryableError is a sentinel wrapper that marks an error as safe to retry.
// => The adapter wraps transient errors; the decorator unwraps to check.
type RetryableError struct {
    cause error
}

// => Error satisfies the error interface; delegates to the wrapped cause.
func (e RetryableError) Error() string { return e.cause.Error() }

// => Unwrap supports errors.As and errors.Is traversal through the chain.
func (e RetryableError) Unwrap() error { return e.cause }

// => WrapRetryable annotates an error as transient; called inside adapters.
// => Example: adapter calls WrapRetryable(pgErr) for connection-reset errors.
func WrapRetryable(err error) error {
    return RetryableError{cause: err}
}

// => IsRetryable checks whether the error chain contains a RetryableError.
// => Returns false for domain errors (not-found, constraint) — they must not retry.
func IsRetryable(err error) bool {
    // => errors.As walks the Unwrap chain looking for RetryableError.
    var re RetryableError
    return errors.As(err, &re)
}

// => Example adapter usage: PostgresPORepository wraps pgx connection errors.
func classifyPgError(err error) error {
    // => pgconn.ConnectError signals a transient network-level failure.
    var connErr *pgconn.ConnectError
    if errors.As(err, &connErr) {
        // => Wrap as retryable — the retry decorator will see this.
        return WrapRetryable(err)
    }
    // => All other pgx errors (constraint, syntax) are returned unwrapped.
    // => IsRetryable(err) will return false; decorator fails fast.
    return err
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => RepoError enumerates all possible repository failure modes.
// => Variant-level classification avoids stringly-typed error checking.
#[derive(Debug, thiserror::Error)]
pub enum RepoError {
    // => NotFound: aggregate does not exist — never retry, will always fail.
    #[error("not found: {0}")]
    NotFound(String),
    // => ConstraintViolation: DB constraint — never retry, data issue.
    #[error("constraint violation: {0}")]
    ConstraintViolation(String),
    // => Transient: network or pool exhaustion — safe to retry.
    #[error("transient: {0}")]
    Transient(String),
    // => Cancelled: context cancelled — abort; do not retry.
    #[error("cancelled")]
    Cancelled,
}

// => is_retryable inspects the variant to decide retry eligibility.
// => Called in RetryPORepository::save to gate the retry loop.
pub fn is_retryable(err: &RepoError) -> bool {
    // => Only Transient variant is safe to retry.
    // => All other variants signal permanent failure for this request.
    matches!(err, RepoError::Transient(_))
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Classify retryability at the adapter, not the decorator — only the adapter knows whether a given error code is transient; the decorator stays generic and policy-free.

---

### Example 54: Retry with Context Cancellation

Retries must respect context deadlines — a caller timing out should cancel in-progress retries immediately, not wait for the next backoff to expire. The `select` on `ctx.Done()` inside the backoff sleep makes the retry loop a first-class citizen of Go's context cancellation tree.

```mermaid
sequenceDiagram
    accTitle: Example 54: Retry with Context Cancellation
    accDescr: Sequence diagram between Caller401s deadline41, RetryPORepository, PostgresRepo. Messages: Caller401s deadline41 to RetryPORepository: Save(ctx, po); RetryPORepository to PostgresRepo: attempt 1; PostgresRepo to RetryPORepository: Transient error; Caller401s deadline41 to RetryPORepository: ctx.Done() fires at 150ms; RetryPORepository to Caller401s deadline41: ctx.Err() = DeadlineExceeded.
    participant C as Caller#40;1s deadline#41;
    participant RR as RetryPORepository
    participant DB as PostgresRepo

    C->>RR: Save(ctx, po)
    RR->>DB: attempt 1
    DB-->>RR: Transient error
    Note over RR: select: sleep(200ms) OR ctx.Done()
    C-->>RR: ctx.Done() fires at 150ms
    RR-->>C: ctx.Err() = DeadlineExceeded

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => This snippet shows the context-aware backoff sleep from Example 51.
// => It lives inside the retry loop where attempt > 0.

// => select races two channels: the backoff timer and the context cancellation.
select {
// => Case 1: backoff timer fires first — safe to proceed with the retry.
case <-time.After(r.backoff.Wait(attempt)):
    // => No action needed; loop body executes after the select.

// => Case 2: caller's context was cancelled or deadline exceeded mid-sleep.
// => The retry must abort immediately rather than sleeping past the deadline.
case <-ctx.Done():
    // => ctx.Err() is either context.Canceled or context.DeadlineExceeded.
    // => Return it unchanged so the application service can log the root cause.
    return ctx.Err()
}
// => After the select, the next inner.Save(ctx, po) call will also check
// => ctx.Done() before the adapter reaches the network, providing a second
// => cancellation checkpoint if the context expires between the select and the call.
```

{{< /tab >}}
{{< tab >}}

```rust
// => This snippet shows the context-aware backoff wait from Example 51.
// => Lives inside the retry loop where attempt > 0.

// => tokio::select! races two futures concurrently.
tokio::select! {
    // => Branch 1: sleep duration elapsed — proceed with the next attempt.
    _ = tokio::time::sleep(wait) => {
        // => Nothing to do; retry loop continues after select.
    }
    // => Branch 2: context cancelled — the caller's deadline has passed.
    // => Returning immediately avoids sleeping past the deadline.
    _ = ctx.cancelled() => {
        // => Return Cancelled variant so the caller knows why we stopped.
        // => The application service can convert this to an HTTP 408 or 503.
        return Err(RepoError::Cancelled);
    }
}
// => After the select completes the sleep branch, the next self.inner.save()
// => call also checks the context, providing a second cancellation checkpoint.
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: `select` on `ctx.Done()` inside the backoff sleep makes context cancellation interrupt the wait immediately — the retry decorator respects the caller's deadline at every sleep boundary.

---

### Example 55: Retry + Jitter Integration Test

Testing retry behavior requires a stub that fails N times then succeeds — this lets the test verify that exactly N+1 calls were made without touching real infrastructure. The stub satisfies the same port interface, so it plugs into the retry decorator unchanged.

```mermaid
sequenceDiagram
    accTitle: Example 55: Retry + Jitter Integration Test
    accDescr: Sequence diagram between Test, RetryPORepository, StubbedRepo40failFirst=241. Messages: Test to RetryPORepository: Save(ctx, po); RetryPORepository to StubbedRepo40failFirst=241: attempt 1 → RetryableError; RetryPORepository to StubbedRepo40failFirst=241: attempt 2 → RetryableError; RetryPORepository to StubbedRepo40failFirst=241: attempt 3 → nil (success); RetryPORepository to Test: nil; Test to StubbedRepo40failFirst=241: assert callCount == 3.
    participant T as Test
    participant RR as RetryPORepository
    participant S as StubbedRepo#40;failFirst=2#41;

    T->>RR: Save(ctx, po)
    RR->>S: attempt 1 → RetryableError
    RR->>S: attempt 2 → RetryableError
    RR->>S: attempt 3 → nil (success)
    RR-->>T: nil
    T->>S: assert callCount == 3

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => StubbedPORepository returns RetryableError for the first failFirst calls,
// => then delegates to the real inner adapter (or in-memory) for subsequent calls.
type StubbedPORepository struct {
    // => inner: real adapter that handles successful calls
    inner     PurchaseOrderRepository
    // => failFirst: number of calls that should return a retryable error
    failFirst int
    // => callCount: incremented on every Save invocation
    callCount int
}

// => Save counts the call, fails if within the failure window, delegates after.
func (s *StubbedPORepository) Save(
    ctx context.Context,
    po *PurchaseOrder,
) error {
    // => Increment before the branch so both failure and success paths are counted.
    s.callCount++
    // => First failFirst calls return a transient error wrapped as retryable.
    if s.callCount <= s.failFirst {
        return WrapRetryable(fmt.Errorf("transient: attempt %d", s.callCount))
    }
    // => After the failure window, delegate to the real adapter.
    return s.inner.Save(ctx, po)
}

// => Test: RetryPORepository with maxAttempts=3, stub failing first 2 calls.
func TestRetryPORepository_RetriesOnTransientError(t *testing.T) {
    // => Zero-jitter backoff ensures the test runs without real sleeps.
    backoff := ZeroBackoff{}
    // => In-memory inner adapter; only reached on the 3rd attempt.
    mem := NewInMemoryPORepository()
    stub := &StubbedPORepository{inner: mem, failFirst: 2}
    // => Wrap stub with retry decorator; maxAttempts=3 matches failFirst+1.
    retry := &RetryPORepository{inner: stub, maxAttempts: 3, backoff: backoff}

    po := newTestPO()
    // => Single Save call; internally makes 3 attempts.
    err := retry.Save(context.Background(), po)
    // => No error expected — 3rd attempt succeeded.
    assert.NoError(t, err)
    // => Assert total call count: 2 failures + 1 success = 3 calls.
    assert.Equal(t, 3, stub.callCount)
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => FailNTimes implements PORepository and fails for the first fail_first calls.
struct FailNTimes {
    // => inner: real in-memory repo reached after failure window
    inner: InMemoryPORepository,
    // => fail_first: number of initial calls that return Transient error
    fail_first: u32,
    // => call_count: atomically incremented on each save call
    call_count: AtomicU32,
}

#[async_trait]
impl PORepository for FailNTimes {
    async fn save(
        &self,
        ctx: &Context,
        po: &PurchaseOrder,
    ) -> Result<(), RepoError> {
        // => fetch_add returns the OLD value; compare to fail_first.
        let n = self.call_count.fetch_add(1, Ordering::SeqCst);
        // => Calls 0 through fail_first-1 return a transient error.
        if n < self.fail_first {
            return Err(RepoError::Transient(
                format!("transient: attempt {}", n + 1),
            ));
        }
        // => Subsequent calls delegate to the real adapter.
        self.inner.save(ctx, po).await
    }
}

// => Test: verify that 3 total attempts are made when first 2 fail.
#[tokio::test]
async fn test_retry_makes_three_attempts() {
    let stub = Arc::new(FailNTimes {
        inner: InMemoryPORepository::new(),
        fail_first: 2,
        call_count: AtomicU32::new(0),
    });
    // => ZeroBackoff returns Duration::ZERO — no real sleep in tests.
    let retry = RetryPORepository {
        inner: Arc::clone(&stub),
        max_attempts: 3,
        backoff: ZeroBackoff,
    };
    let po = test_po();
    // => Single call; internally makes 3 attempts.
    let result = retry.save(&Context::background(), &po).await;
    // => Third attempt succeeded — result must be Ok.
    assert!(result.is_ok());
    // => Total calls: 2 failures + 1 success = 3.
    assert_eq!(stub.call_count.load(Ordering::SeqCst), 3);
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: A `failFirst` stub lets you verify the exact retry count without real sleeps or network calls — inject `ZeroBackoff` so the test suite stays fast.

---

## Circuit Breaker Decorator (Examples 56–60)

### Example 56: CircuitBreaker State Machine

The circuit breaker prevents cascading failures — when a downstream service is degraded, fail fast instead of queueing requests that will all timeout. Three states drive the behavior: Closed (normal), Open (reject all), and HalfOpen (probe one request to test recovery).

```mermaid
stateDiagram-v2
    accTitle: Example 56: CircuitBreaker State Machine
    accDescr: State diagram with 4 items: start or end, Closed, Open, HalfOpen. Relationships: start or end to Closed; Closed to Open: failures >= threshold; Open to HalfOpen: timeout elapsed; HalfOpen to Closed: probe success; HalfOpen to Open: probe failure.
    [*] --> Closed
    Closed --> Open : failures >= threshold
    Open --> HalfOpen : timeout elapsed
    HalfOpen --> Closed : probe success
    HalfOpen --> Open : probe failure

    %% Color palette: Teal #029E73 = Closed, Orange #DE8F05 = Open, Blue #0173B2 = HalfOpen
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => CBState is an enumerated type for the three circuit breaker states.
type CBState int

// => Three constants represent the finite state machine's nodes.
const (
    // => CBClosed: normal operation — calls pass through; failures counted.
    CBClosed CBState = iota
    // => CBOpen: circuit tripped — all calls rejected fast without reaching backend.
    CBOpen
    // => CBHalfOpen: probe state — one call allowed to test if backend recovered.
    CBHalfOpen
)

// => CircuitBreaker holds the state machine and its configuration.
type CircuitBreaker struct {
    // => mu guards all state fields — Execute may be called concurrently.
    mu sync.Mutex
    // => state: current FSM node (Closed / Open / HalfOpen)
    state CBState
    // => failureCount: consecutive failures observed in Closed state
    failureCount int
    // => successCount: consecutive successes observed in HalfOpen state
    successCount int
    // => threshold: failures before transitioning Closed → Open
    threshold int
    // => halfOpenMax: successes required to transition HalfOpen → Closed
    halfOpenMax int
    // => timeout: duration to stay in Open before transitioning to HalfOpen
    timeout time.Duration
    // => lastFailure: timestamp of the most recent failure; used to compute timeout
    lastFailure time.Time
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => CBState encodes the three FSM nodes as an enum.
// => Each variant carries the mutable data for that state, avoiding a separate counter field.
#[derive(Debug, Clone)]
pub enum CBState {
    // => Closed: normal. failures counts consecutive errors toward threshold.
    Closed { failures: u32 },
    // => Open: rejecting calls. opened_at records when we entered Open state.
    Open { opened_at: Instant },
    // => HalfOpen: probing recovery. probes counts successful probe calls.
    HalfOpen { probes: u32 },
}

// => CircuitBreaker wraps state in a Mutex for thread-safe Execute calls.
pub struct CircuitBreaker {
    // => state: Mutex<CBState> ensures only one goroutine/task mutates state at a time.
    state: Mutex<CBState>,
    // => threshold: failure count that trips Closed → Open
    threshold: u32,
    // => half_open_max: successes needed to recover HalfOpen → Closed
    half_open_max: u32,
    // => timeout: how long the circuit stays Open before allowing a probe
    timeout: Duration,
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Model circuit breaker state as an enum or typed constants, not booleans — the three-state FSM (Closed / Open / HalfOpen) maps directly to the pattern's semantics and prevents impossible state combinations.

---

### Example 57: CircuitBreaker Execute Method

The `Execute` method is the circuit breaker's single entry point — it checks the current state, fast-fails if Open, delegates the operation, and records the result to drive state transitions. All state mutation happens under the mutex to prevent race conditions in concurrent request environments.

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => ErrCircuitOpen is returned when the circuit is Open — callers receive this
// => instead of a timeout, enabling fast-fail and fallback logic upstream.
var ErrCircuitOpen = errors.New("circuit breaker: open")

// => Execute checks state, runs op if allowed, and records the outcome.
func (cb *CircuitBreaker) Execute(
    ctx context.Context,
    op func() error,
) error {
    // => Lock only long enough to read and potentially update the state.
    cb.mu.Lock()
    // => currentState evaluates the FSM transition rules (Open → HalfOpen on timeout).
    state := cb.currentState()
    // => Fast-fail without calling op when the circuit is Open.
    if state == CBOpen {
        cb.mu.Unlock()
        // => Caller receives ErrCircuitOpen immediately — no network latency.
        return ErrCircuitOpen
    }
    // => For HalfOpen, decrement the remaining probe budget before unlocking.
    if state == CBHalfOpen {
        if cb.halfOpenMax <= 0 {
            cb.mu.Unlock()
            // => No probe slots left — still rejecting until a probe succeeds.
            return ErrCircuitOpen
        }
        cb.halfOpenMax--
    }
    cb.mu.Unlock()

    // => Run the real operation outside the lock; this is where latency lives.
    result := op()

    // => Lock again to record success or failure and drive state transitions.
    cb.mu.Lock()
    defer cb.mu.Unlock()
    // => recordResult increments failureCount or successCount and applies transitions.
    cb.recordResult(result)
    return result
}

// => currentState applies the Open → HalfOpen timeout transition before returning.
// => Must be called under cb.mu.
func (cb *CircuitBreaker) currentState() CBState {
    // => If Open and timeout has elapsed, transition to HalfOpen for probing.
    if cb.state == CBOpen &&
        time.Since(cb.lastFailure) >= cb.timeout {
        cb.state = CBHalfOpen
        cb.successCount = 0
    }
    return cb.state
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => CBError wraps either ErrCircuitOpen or the inner operation's error.
#[derive(Debug, thiserror::Error)]
pub enum CBError<E: std::error::Error> {
    // => CircuitOpen: fast-fail sentinel — no inner error, circuit is Open.
    #[error("circuit breaker: open")]
    CircuitOpen,
    // => Inner: the real operation returned an error.
    #[error("inner error: {0}")]
    Inner(E),
}

impl CircuitBreaker {
    // => execute is generic over the operation's output type T and error type E.
    pub fn execute<F, T, E>(
        &self,
        op: F,
    ) -> Result<T, CBError<E>>
    where
        F: FnOnce() -> Result<T, E>,
        E: std::error::Error,
    {
        // => Lock the state to evaluate the current FSM node.
        let mut state = self.state.lock().unwrap();
        // => Apply Open → HalfOpen timeout transition before checking.
        if let CBState::Open { opened_at } = *state {
            if opened_at.elapsed() >= self.timeout {
                // => Timeout elapsed: transition to HalfOpen to allow one probe.
                *state = CBState::HalfOpen { probes: 0 };
            }
        }
        // => Fast-fail when Open and timeout has not elapsed.
        if matches!(*state, CBState::Open { .. }) {
            return Err(CBError::CircuitOpen);
        }
        // => Drop the lock before calling op to avoid holding it across I/O.
        drop(state);

        // => Run the real operation; latency is here, outside the lock.
        let result = op();

        // => Re-acquire lock to record outcome and apply state transitions.
        let mut state = self.state.lock().unwrap();
        self.record_result(&mut state, &result);
        // => Map inner error to CBError::Inner; success passes through.
        result.map_err(CBError::Inner)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Release the mutex before calling the operation — holding it across a network call serializes all requests through the lock, defeating the purpose of concurrency.

---

### Example 58: CircuitBreaker Wrapping ExternalVendorClient

Wrapping the ERP client in a circuit breaker prevents PO creation from hanging when the ERP is unavailable. The `CBVendorClient` satisfies the `ExternalVendorClient` port, so the application service receives `ErrCircuitOpen` instead of a multi-second timeout, which it can convert to an HTTP 503.

```mermaid
classDiagram
    accTitle: Example 58: CircuitBreaker Wrapping ExternalVendorClient
    accDescr: Class diagram with 3 items: ExternalVendorClient, CBVendorClient, HTTPVendorClient. Relationships: CBVendorClient to HTTPVendorClient: wraps.
    class ExternalVendorClient {
        <<interface>>
        +FetchVendor(ctx, code) ExternalVendorDTO, error
    }
    class CBVendorClient {
        -inner ExternalVendorClient
        -cb CircuitBreaker
        +FetchVendor(ctx, code) ExternalVendorDTO, error
    }
    class HTTPVendorClient {
        +FetchVendor(ctx, code) ExternalVendorDTO, error
    }
    ExternalVendorClient <|.. CBVendorClient : satisfies
    ExternalVendorClient <|.. HTTPVendorClient : satisfies
    CBVendorClient --> HTTPVendorClient : wraps

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => CBVendorClient decorates ExternalVendorClient with circuit breaker protection.
// => Satisfies ExternalVendorClient — the application service sees no difference.
type CBVendorClient struct {
    // => inner: the real HTTP client that calls the ERP
    inner ExternalVendorClient
    // => cb: shared circuit breaker state; may protect multiple methods
    cb *CircuitBreaker
}

// => FetchVendor delegates through the circuit breaker.
func (c *CBVendorClient) FetchVendor(
    ctx context.Context,
    code string,
) (ExternalVendorDTO, error) {
    // => result holds the DTO captured inside the closure for return after Execute.
    var result ExternalVendorDTO
    // => Execute wraps the real call; returns ErrCircuitOpen if circuit is Open.
    err := c.cb.Execute(ctx, func() error {
        // => Closure captures code and writes into result — Go closure semantics.
        var e error
        result, e = c.inner.FetchVendor(ctx, code)
        return e
    })
    // => If err == ErrCircuitOpen, result is zero-value DTO — caller handles it.
    return result, err
}

// => Application service usage — circuit open returns an actionable error.
func (s *POService) handleCircuitOpen(err error) error {
    if errors.Is(err, ErrCircuitOpen) {
        // => ERP is down; return 503 Service Unavailable to the HTTP caller.
        // => This is faster than waiting for 30-second ERP timeouts to expire.
        return ErrServiceUnavailable
    }
    return err
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => CBVendorClient<C> wraps any ExternalVendorClient with circuit breaker logic.
pub struct CBVendorClient<C: ExternalVendorClient> {
    // => inner: real HTTP client for the ERP
    inner: C,
    // => cb: Arc allows sharing the CB across multiple async tasks
    cb: Arc<CircuitBreaker>,
}

#[async_trait]
impl<C: ExternalVendorClient + Send + Sync> ExternalVendorClient
    for CBVendorClient<C>
{
    async fn fetch_vendor(
        &self,
        code: &str,
    ) -> Result<ExternalVendorDTO, VendorClientError> {
        // => Execute takes a synchronous FnOnce; for async, block_in_place or
        // => restructure with a separate async-aware CB implementation.
        // => Here we show the synchronous pattern for clarity.
        self.cb
            .execute(|| {
                // => SAFETY: block_on is safe here because we own this task's context.
                tokio::runtime::Handle::current()
                    .block_on(self.inner.fetch_vendor(code))
            })
            // => Map CBError::CircuitOpen to domain-level ServiceUnavailable.
            .map_err(|e| match e {
                CBError::CircuitOpen => VendorClientError::ServiceUnavailable,
                CBError::Inner(inner) => inner,
            })
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Wrap the ERP client in a circuit breaker at the adapter layer — the application service receives a typed error it can convert to an HTTP 503 instead of blocking on multi-second timeouts.

---

### Example 59: Failure Rate Threshold

Count-based thresholds are brittle — three failures in a quiet period (10 req/s) should not trip the circuit, but three failures in a high-volume period (1000 req/s) might. A sliding window tracks the failure rate over the last N calls to open the circuit only when a significant fraction fail.

```mermaid
graph TD
    accTitle: Example 59: Failure Rate Threshold
    accDescr: Graph with 4 nodes and 3 connections. Nodes: Last 10 calls sliding window, failure rate > 50?, Stay Closed normal operation, Transition to Open reject calls. Connections: Last 10 calls sliding window to failure rate > 50?, failure rate > 50? to Stay Closed normal operation (No), failure rate > 50? to Transition to Open reject calls (Yes).
    A["Last 10 calls<br/>sliding window"]:::blue
    B{"failure rate<br/>> 50%?"}:::orange
    C["Stay Closed<br/>normal operation"]:::teal
    D["Transition to Open<br/>reject calls"]:::purple

    A --> B
    B -->|No| C
    B -->|Yes| D

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => WindowedCircuitBreaker extends CircuitBreaker with sliding-window rate tracking.
type WindowedCircuitBreaker struct {
    // => Embed the base circuit breaker for Execute and state machine logic.
    CircuitBreaker
    // => window stores the last windowSize call results (true = success, false = failure).
    window []bool
    // => windowSize: number of most-recent calls to consider for rate computation.
    windowSize int
    // => failureRate: fraction of failures that trips the circuit (e.g., 0.5 = 50%).
    failureRate float64
}

// => recordResult overrides the base to use rate-based threshold.
func (w *WindowedCircuitBreaker) recordResult(err error) {
    // => Append the new result; true = success, false = failure.
    w.window = append(w.window, err == nil)
    // => Trim window to the most recent windowSize entries.
    if len(w.window) > w.windowSize {
        w.window = w.window[len(w.window)-w.windowSize:]
    }
    // => Compute failure count from the current window.
    failures := 0
    for _, ok := range w.window {
        if !ok {
            failures++
        }
    }
    // => failure rate = failures / total calls in window
    rate := float64(failures) / float64(len(w.window))
    // => Trip the circuit only when the window is full and rate exceeds threshold.
    if len(w.window) == w.windowSize && rate >= w.failureRate {
        w.state = CBOpen
        w.lastFailure = time.Now()
    }
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => WindowedCircuitBreaker tracks call outcomes in a VecDeque sliding window.
pub struct WindowedCircuitBreaker {
    // => state: FSM node protected by a Mutex
    state: Mutex<CBState>,
    // => window: deque of the last window_size call results (true = success)
    window: Mutex<VecDeque<bool>>,
    // => window_size: how many recent calls contribute to the rate calculation
    window_size: usize,
    // => failure_rate: fraction threshold to open the circuit
    failure_rate: f64,
    pub timeout: Duration,
}

impl WindowedCircuitBreaker {
    // => record_result updates the window and re-evaluates the circuit state.
    fn record_result(&self, success: bool) {
        let mut win = self.window.lock().unwrap();
        // => Push the new result at the back of the deque.
        win.push_back(success);
        // => Pop the oldest entry to maintain exactly window_size entries.
        if win.len() > self.window_size {
            win.pop_front();
        }
        // => Only evaluate threshold once the window is fully populated.
        if win.len() < self.window_size {
            return;
        }
        // => Count failures in the window.
        let failures = win.iter().filter(|&&ok| !ok).count();
        // => Compute rate and compare to threshold.
        let rate = failures as f64 / self.window_size as f64;
        if rate >= self.failure_rate {
            // => Rate exceeded threshold — open the circuit.
            let mut state = self.state.lock().unwrap();
            *state = CBState::Open { opened_at: Instant::now() };
        }
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Rate-based thresholds adapt to traffic volume — a 50% failure rate is equally meaningful whether you handle 10 or 10,000 requests per second.

---

### Example 60: CircuitBreaker Callbacks

Callbacks notify the application when the circuit state changes — `OnOpen` fires an alert when the circuit trips, `OnClose` resolves it when service recovers. Callbacks are optional and should not block; run slow notifications in a goroutine or async task.

```mermaid
sequenceDiagram
    accTitle: Example 60: CircuitBreaker Callbacks
    accDescr: Sequence diagram between CircuitBreaker, AlertingPlatform. Messages: CircuitBreaker to CircuitBreaker: recordResult40failure41 — failures >= threshold; CircuitBreaker to CircuitBreaker: state = Open; CircuitBreaker to AlertingPlatform: OnOpen callback40lastErr41; AlertingPlatform to CircuitBreaker: 40async — non-blocking41; CircuitBreaker to CircuitBreaker: state = HalfOpen; CircuitBreaker to CircuitBreaker: probe succeeds → state = Closed; CircuitBreaker to AlertingPlatform: OnClose callback4041; AlertingPlatform to CircuitBreaker: 40async — non-blocking41.
    participant CB as CircuitBreaker
    participant AP as AlertingPlatform

    CB->>CB: recordResult#40;failure#41; — failures >= threshold
    CB->>CB: state = Open
    CB->>AP: OnOpen callback#40;lastErr#41;
    AP-->>CB: #40;async — non-blocking#41;
    Note over CB: after timeout
    CB->>CB: state = HalfOpen
    CB->>CB: probe succeeds → state = Closed
    CB->>AP: OnClose callback#40;#41;
    AP-->>CB: #40;async — non-blocking#41;

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => CBCallbacks holds optional hooks for state transition events.
// => nil functions are no-ops; callers only set the callbacks they care about.
type CBCallbacks struct {
    // => OnOpen fires when the circuit transitions Closed → Open.
    // => Receives the triggering error; use it to attach context to alerts.
    OnOpen func(err error)
    // => OnClose fires when the circuit transitions HalfOpen → Closed (recovery).
    OnClose func()
    // => OnHalfOpen fires when Open → HalfOpen (probe probe begins).
    OnHalfOpen func()
}

// => fireOnOpen fires the callback if set; called inside recordResult under mu.
func (cb *CircuitBreaker) fireOnOpen(err error) {
    if cb.callbacks.OnOpen == nil {
        return
    }
    // => Launch in a goroutine so a slow alert platform does not block Execute.
    go cb.callbacks.OnOpen(err)
}

// => Example wiring at composition root:
func buildCB() *CircuitBreaker {
    return &CircuitBreaker{
        threshold: 5,
        timeout:   30 * time.Second,
        callbacks: CBCallbacks{
            // => OnOpen: alert on-call team via PagerDuty.
            OnOpen: func(err error) {
                alerting.TriggerERP("erp_circuit_open", err.Error())
            },
            // => OnClose: resolve the alert when ERP recovers.
            OnClose: func() {
                alerting.Resolve("erp_circuit_open")
            },
        },
    }
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => CBCallbacks wraps optional boxed closures for state transition events.
pub struct CBCallbacks {
    // => on_open: called with the triggering error when circuit opens.
    // => Option allows callers to omit callbacks they do not need.
    pub on_open: Option<Box<dyn Fn(&dyn std::error::Error) + Send + Sync>>,
    // => on_close: called with no arguments when circuit recovers.
    pub on_close: Option<Box<dyn Fn() + Send + Sync>>,
}

impl CBCallbacks {
    // => fire_on_open launches the callback in a spawned task to avoid blocking Execute.
    pub fn fire_on_open(&self, err: &dyn std::error::Error) {
        if let Some(cb) = &self.on_open {
            // => Clone Arc-wrapped error message for the async task.
            let msg = err.to_string();
            let cb = Arc::clone(
                // SAFETY: caller stores cb as Arc<dyn Fn(..)>; shown simplified.
                &Arc::new(cb.as_ref() as *const _),
            );
            // => Spawn so the slow alerting I/O does not block the caller.
            tokio::spawn(async move {
                tracing::warn!("circuit opened: {}", msg);
            });
        }
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Fire state-change callbacks in a goroutine or spawned task — the circuit breaker's Execute path must stay low-latency and must never block on alerting I/O.

---

## Observability Port Adapters (Examples 61–65)

### Example 61: Metrics Port Interface

The metrics port decouples domain and application code from the Prometheus library — tests inject a no-op, production injects Prometheus. Keeping the interface in the `app/` package enforces the hexagonal rule: application code depends on an abstraction, not on a concrete metrics library.

```mermaid
classDiagram
    accTitle: Example 61: Metrics Port Interface
    accDescr: Class diagram with 3 items: MetricsCollector, NoopMetrics, PrometheusMetrics.
    class MetricsCollector {
        <<interface>>
        +IncrCounter(name, labels)
        +RecordHistogram(name, value, labels)
        +SetGauge(name, value, labels)
    }
    class NoopMetrics {
        +IncrCounter(name, labels)
        +RecordHistogram(name, value, labels)
        +SetGauge(name, value, labels)
    }
    class PrometheusMetrics {
        -counters map
        -histograms map
        +IncrCounter(name, labels)
        +RecordHistogram(name, value, labels)
        +SetGauge(name, value, labels)
    }
    MetricsCollector <|.. NoopMetrics : satisfies
    MetricsCollector <|.. PrometheusMetrics : satisfies

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => MetricsCollector is the output port for telemetry.
// => Defined in the app/ package — application services depend on this, not Prometheus.
type MetricsCollector interface {
    // => IncrCounter increments a named counter by 1 with optional label pairs.
    IncrCounter(name string, labels map[string]string)
    // => RecordHistogram records a single observation in a named histogram.
    RecordHistogram(name string, value float64, labels map[string]string)
    // => SetGauge sets a named gauge to an absolute value.
    SetGauge(name string, value float64, labels map[string]string)
}

// => NoopMetrics satisfies MetricsCollector with zero-overhead no-ops.
// => Used in unit tests and environments where metrics are not required.
type NoopMetrics struct{}

func (NoopMetrics) IncrCounter(_ string, _ map[string]string)              {}
func (NoopMetrics) RecordHistogram(_ string, _ float64, _ map[string]string) {}
func (NoopMetrics) SetGauge(_ string, _ float64, _ map[string]string)       {}

// => PrometheusMetrics is the production adapter in the adapter/out/ package.
// => Wraps prometheus.CounterVec and prometheus.HistogramVec behind the port.
type PrometheusMetrics struct {
    // => counters: registry of named CounterVec instances keyed by metric name
    counters   map[string]*prometheus.CounterVec
    // => histograms: registry of named HistogramVec instances keyed by metric name
    histograms map[string]*prometheus.HistogramVec
}

// => IncrCounter finds or creates a CounterVec and increments the labeled series.
func (p *PrometheusMetrics) IncrCounter(
    name string,
    labels map[string]string,
) {
    // => With(labels) returns the specific time series matching those label values.
    p.counters[name].With(prometheus.Labels(labels)).Inc()
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => MetricsCollector is the output port trait for telemetry.
// => Send + Sync required for injection into async services via Arc<dyn>.
pub trait MetricsCollector: Send + Sync {
    // => incr_counter increments a named counter with label key-value pairs.
    fn incr_counter(&self, name: &str, labels: &[(&str, &str)]);
    // => record_histogram records an observation with label key-value pairs.
    fn record_histogram(&self, name: &str, value: f64, labels: &[(&str, &str)]);
    // => set_gauge sets a gauge to an absolute value.
    fn set_gauge(&self, name: &str, value: f64, labels: &[(&str, &str)]);
}

// => NoopMetrics satisfies the trait with empty implementations.
// => Injected in tests and non-production builds.
pub struct NoopMetrics;

impl MetricsCollector for NoopMetrics {
    // => All methods are no-ops; the compiler optimizes these to nothing.
    fn incr_counter(&self, _: &str, _: &[(&str, &str)]) {}
    fn record_histogram(&self, _: &str, _: f64, _: &[(&str, &str)]) {}
    fn set_gauge(&self, _: &str, _: f64, _: &[(&str, &str)]) {}
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Define `MetricsCollector` in the application zone — tests inject `NoopMetrics` at zero cost, while production injects `PrometheusMetrics` without any application-layer changes.

---

### Example 62: InstrumentedRepository Decorator

The instrumented decorator records request count, latency, and error rate for every repository call — automatically, without touching the inner implementation. Stacking it on top of the retry and logging decorators means metrics measure the full call including retries, giving accurate latency percentiles.

```mermaid
classDiagram
    accTitle: Example 62: InstrumentedRepository Decorator
    accDescr: Class diagram with 5 items: PurchaseOrderRepo, InstrumentedPORepo, LoggingPORepository, RetryPORepository, PostgresPORepository. Relationships: InstrumentedPORepo to LoggingPORepository: wraps; LoggingPORepository to RetryPORepository: wraps; RetryPORepository to PostgresPORepository: wraps.
    class PurchaseOrderRepo {
        <<interface>>
        +Save(ctx, po) error
        +FindByID(ctx, id) PurchaseOrder, error
    }
    class InstrumentedPORepo {
        -inner PurchaseOrderRepo
        -metrics MetricsCollector
        -repoName string
    }
    class LoggingPORepository {
        -inner PurchaseOrderRepo
        -logger Logger
    }
    class RetryPORepository {
        -inner PurchaseOrderRepo
        -maxAttempts int
    }
    class PostgresPORepository {
        -pool pgxpool.Pool
    }
    PurchaseOrderRepo <|.. InstrumentedPORepo
    PurchaseOrderRepo <|.. LoggingPORepository
    PurchaseOrderRepo <|.. RetryPORepository
    PurchaseOrderRepo <|.. PostgresPORepository
    InstrumentedPORepo --> LoggingPORepository : wraps
    LoggingPORepository --> RetryPORepository : wraps
    RetryPORepository --> PostgresPORepository : wraps

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => InstrumentedPORepository wraps PurchaseOrderRepository and records metrics.
// => Satisfies PurchaseOrderRepository — transparent to the application service.
type InstrumentedPORepository struct {
    // => inner: the next decorator in the stack (e.g., LoggingPORepository)
    inner    PurchaseOrderRepository
    // => metrics: the MetricsCollector port injected at wiring time
    metrics  MetricsCollector
    // => repoName: label value that distinguishes this repo in dashboards
    repoName string
}

// => Save records call count, duration, and success/error status.
func (r *InstrumentedPORepository) Save(
    ctx context.Context,
    po *PurchaseOrder,
) error {
    // => Capture the start time before delegating to measure total latency.
    start := time.Now()
    // => Delegate to the inner stack; this includes retries, logging, and the real adapter.
    err := r.inner.Save(ctx, po)
    // => Compute elapsed duration in seconds for histogram compatibility.
    dur := time.Since(start).Seconds()

    // => Determine status label: "ok" or "error" for counter partitioning.
    status := "ok"
    if err != nil {
        status = "error"
    }
    // => Increment the total call counter with repo, operation, and status labels.
    r.metrics.IncrCounter("repo_calls_total", map[string]string{
        "repo":   r.repoName,
        "op":     "save",
        "status": status,
    })
    // => Record duration in the latency histogram for percentile dashboards.
    r.metrics.RecordHistogram("repo_call_duration_seconds", dur,
        map[string]string{
            "repo": r.repoName,
            "op":   "save",
        })
    // => Return the original error unchanged — instrumentation is transparent.
    return err
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => InstrumentedPORepository<R> wraps any PORepository and records metrics.
pub struct InstrumentedPORepository<R: PORepository> {
    // => inner: the next decorator in the stack
    inner: R,
    // => metrics: Arc<dyn MetricsCollector> for shared ownership across tasks
    metrics: Arc<dyn MetricsCollector>,
    // => repo_name: static label value for dashboard partitioning
    repo_name: &'static str,
}

#[async_trait]
impl<R: PORepository + Send + Sync> PORepository
    for InstrumentedPORepository<R>
{
    async fn save(
        &self,
        ctx: &Context,
        po: &PurchaseOrder,
    ) -> Result<(), RepoError> {
        // => Record start time before the async call.
        let start = Instant::now();
        // => Delegate to the inner stack (retries, logging, real adapter).
        let result = self.inner.save(ctx, po).await;
        // => Compute elapsed duration in seconds for histogram.
        let dur = start.elapsed().as_secs_f64();

        // => status label: "ok" or "error"
        let status = if result.is_ok() { "ok" } else { "error" };
        // => Increment total call counter.
        self.metrics.incr_counter(
            "repo_calls_total",
            &[("repo", self.repo_name), ("op", "save"), ("status", status)],
        );
        // => Record duration for latency percentiles.
        self.metrics.record_histogram(
            "repo_call_duration_seconds",
            dur,
            &[("repo", self.repo_name), ("op", "save")],
        );
        // => Return original result unchanged.
        result
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Place `InstrumentedPORepository` as the outermost decorator — it then measures the full call including retries and logging overhead, yielding accurate end-to-end latency percentiles for dashboards.

---

### Example 63: TracingPort Interface + OpenTelemetry Adapter

The tracing port decouples application code from OpenTelemetry's concrete API — the port interface defines `StartSpan` and `Span`, while the production adapter wraps `otel/trace`. This means the application zone never imports `go.opentelemetry.io` directly, keeping the dependency rule intact.

```mermaid
classDiagram
    accTitle: Example 63: TracingPort Interface + OpenTelemetry Adapter
    accDescr: Class diagram with 4 items: Tracer, Span, OtelTracer, NoopTracer. Relationships: OtelTracer to Span: creates OtelSpan.
    class Tracer {
        <<interface>>
        +StartSpan(ctx, name, opts) Context, Span
    }
    class Span {
        <<interface>>
        +SetAttribute(key, val)
        +RecordError(err)
        +End()
    }
    class OtelTracer {
        -tracer trace.Tracer
        +StartSpan(ctx, name, opts) Context, Span
    }
    class NoopTracer {
        +StartSpan(ctx, name, opts) Context, Span
    }
    Tracer <|.. OtelTracer : satisfies
    Tracer <|.. NoopTracer : satisfies
    OtelTracer --> Span : creates OtelSpan

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => Tracer is the output port for distributed tracing.
// => Defined in the app/ package — application code sees only this interface.
type Tracer interface {
    // => StartSpan creates a child span under ctx and returns a new context carrying it.
    // => The returned Span must be ended by the caller via defer span.End().
    StartSpan(ctx context.Context, name string) (context.Context, Span)
}

// => Span is the output port for an in-progress trace segment.
type Span interface {
    // => SetAttribute attaches a string key-value annotation to the span.
    SetAttribute(key, val string)
    // => RecordError marks the span as errored and attaches the error message.
    RecordError(err error)
    // => End closes the span and emits it to the collector.
    End()
}

// => OtelTracer is the production adapter in adapter/out/; wraps otel trace.Tracer.
type OtelTracer struct {
    // => tracer: concrete OpenTelemetry tracer obtained from otel.Tracer("service")
    tracer trace.Tracer
}

// => StartSpan delegates to the OpenTelemetry SDK and wraps the result.
func (t *OtelTracer) StartSpan(
    ctx context.Context,
    name string,
) (context.Context, Span) {
    // => otel trace.Tracer.Start returns (context.Context, trace.Span).
    ctx, span := t.tracer.Start(ctx, name)
    // => Wrap in OtelSpan to satisfy the port Span interface.
    return ctx, &OtelSpan{span: span}
}

// => OtelSpan wraps trace.Span to satisfy the port Span interface.
type OtelSpan struct{ span trace.Span }

// => SetAttribute delegates to the otel SDK's typed attribute API.
func (s *OtelSpan) SetAttribute(key, val string) {
    s.span.SetAttributes(attribute.String(key, val))
}

// => RecordError marks the span as errored in Jaeger / Honeycomb dashboards.
func (s *OtelSpan) RecordError(err error) { s.span.RecordError(err) }

// => End closes the span; must be called, typically via defer span.End().
func (s *OtelSpan) End() { s.span.End() }

// => NoopTracer satisfies Tracer with a no-op implementation for tests.
type NoopTracer struct{}

func (NoopTracer) StartSpan(ctx context.Context, _ string) (context.Context, Span) {
    // => Return ctx unchanged and a no-op span — zero allocations in tests.
    return ctx, NoopSpan{}
}

// => NoopSpan satisfies Span with empty methods.
type NoopSpan struct{}

func (NoopSpan) SetAttribute(_, _ string) {}
func (NoopSpan) RecordError(_ error)      {}
func (NoopSpan) End()                     {}
```

{{< /tab >}}
{{< tab >}}

```rust
// => Tracer is the output port trait for distributed tracing.
// => Send + Sync allows injection as Arc<dyn Tracer> into async services.
pub trait Tracer: Send + Sync {
    // => start_span creates a new child span and returns a boxed Span.
    fn start_span(&self, name: &str) -> Box<dyn Span + Send + Sync>;
}

// => Span is the output port trait for an active trace segment.
pub trait Span: Send + Sync {
    // => set_attribute attaches a key-value annotation.
    fn set_attribute(&self, key: &str, val: &str);
    // => record_error marks the span as failed.
    fn record_error(&self, err: &dyn std::error::Error);
    // => end closes and emits the span; called via Drop impl or explicitly.
    fn end(&self);
}

// => OtelTracer is the production adapter wrapping opentelemetry::trace::Tracer.
pub struct OtelTracer {
    // => inner: concrete OTel tracer obtained from global provider
    inner: opentelemetry::trace::BoxedTracer,
}

impl Tracer for OtelTracer {
    fn start_span(&self, name: &str) -> Box<dyn Span + Send + Sync> {
        // => Start a child span using the OTel SDK.
        let span = self.inner.start(name);
        // => Wrap in OtelSpan to satisfy the port interface.
        Box::new(OtelSpan { inner: span })
    }
}

// => NoopTracer satisfies Tracer with zero-cost no-ops for tests.
pub struct NoopTracer;

impl Tracer for NoopTracer {
    fn start_span(&self, _: &str) -> Box<dyn Span + Send + Sync> {
        // => Return a no-op span — no allocations, no I/O.
        Box::new(NoopSpan)
    }
}

// => NoopSpan satisfies Span with empty method bodies.
pub struct NoopSpan;

impl Span for NoopSpan {
    fn set_attribute(&self, _: &str, _: &str) {}
    fn record_error(&self, _: &dyn std::error::Error) {}
    fn end(&self) {}
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Define `Tracer` and `Span` as ports in the application zone — the application service calls `tracer.StartSpan(ctx, "save_po")` without knowing whether spans go to Jaeger, Honeycomb, or a test no-op.

---

### Example 64: Distributed Trace Propagation

Distributed traces connect the HTTP handler, application service, repository, and external client into a single trace tree. Context propagation via `context.Context` carries the active span through every layer without coupling each layer to the tracer implementation.

```mermaid
sequenceDiagram
    accTitle: Example 64: Distributed Trace Propagation
    accDescr: Sequence diagram between HTTP Handler, AppService, Repository, ERPClient. Messages: HTTP Handler to HTTP Handler: otelhttp extracts trace-id from headers; HTTP Handler to AppService: ctx with root span; AppService to AppService: StartSpan40ctx, issue_po41 → child span; AppService to Repository: ctx with child span; Repository to Repository: StartSpan40ctx, repo.save41 → grandchild span; Repository to ERPClient: ctx with grandchild span; ERPClient to ERPClient: StartSpan40ctx, erp.fetch41 → leaf span; ERPClient to Repository: return (leaf span ended); Repository to AppService: return (grandchild span ended); AppService to HTTP Handler: return (child span ended); HTTP Handler to HTTP Handler: root span ended full tree exported.
    participant H as HTTP Handler
    participant AS as AppService
    participant R as Repository
    participant E as ERPClient

    H->>H: otelhttp extracts trace-id from headers
    H->>AS: ctx with root span
    AS->>AS: StartSpan#40;ctx, "issue_po"#41; → child span
    AS->>R: ctx with child span
    R->>R: StartSpan#40;ctx, "repo.save"#41; → grandchild span
    R->>E: ctx with grandchild span
    E->>E: StartSpan#40;ctx, "erp.fetch"#41; → leaf span
    E-->>R: return (leaf span ended)
    R-->>AS: return (grandchild span ended)
    AS-->>H: return (child span ended)
    H-->>H: root span ended; full tree exported

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => Application service shows how trace context flows through layers.
func (s *POService) IssuePurchaseOrder(
    ctx context.Context,
    cmd IssuePOCommand,
) (PurchaseOrderID, error) {
    // => Start a child span for the use case; ctx now carries this span.
    ctx, span := s.tracer.StartSpan(ctx, "issue_purchase_order")
    // => defer End() ensures the span closes even if the function returns early.
    defer span.End()

    // => Annotate the span with business context for dashboards.
    span.SetAttribute("po.supplier_id", string(cmd.SupplierID))
    span.SetAttribute("po.total_lines", fmt.Sprint(len(cmd.Lines)))

    // => Downstream calls receive the same ctx — they inherit this span as parent.
    vendor, err := s.supplierACL.FetchSupplier(ctx, cmd.SupplierID)
    if err != nil {
        // => RecordError marks the span as errored in Jaeger / Honeycomb.
        span.RecordError(err)
        return "", err
    }
    po, err := NewPurchaseOrder(cmd, vendor)
    if err != nil {
        span.RecordError(err)
        return "", err
    }
    // => Repository receives ctx carrying the use-case span as its parent.
    // => The repository starts its own child span ("repo.save") inside Save.
    if err := s.repo.Save(ctx, po); err != nil {
        span.RecordError(err)
        return "", err
    }
    return po.Id, nil
}

// => HTTP handler wires otelhttp to extract W3C TraceContext from incoming headers.
func NewRouter(svc POService, tracer *OtelTracer) http.Handler {
    r := chi.NewRouter()
    // => otelhttp.NewHandler wraps the router to start a root span per request.
    // => It reads "traceparent" header (W3C TraceContext) and links to parent if present.
    return otelhttp.NewHandler(r, "procurement-api")
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => Application service propagates trace context via a tracing span.
// => #[tracing::instrument] auto-creates a span for the function.
#[tracing::instrument(skip(self, ctx), fields(supplier_id = %cmd.supplier_id))]
pub async fn issue_purchase_order(
    &self,
    ctx: &Context,
    cmd: IssuePOCommand,
) -> Result<PurchaseOrderId, AppError> {
    // => The instrument macro creates a span named "issue_purchase_order".
    // => All tracing::info!/error! inside are children of this span.

    // => Fetch vendor; child spans emitted inside fetch_supplier are nested here.
    let vendor = self
        .supplier_acl
        .fetch_supplier(ctx, &cmd.supplier_id)
        .await
        .map_err(|e| {
            // => Record error in the current span so Jaeger shows it as failed.
            tracing::error!(error = ?e, "fetch supplier failed");
            AppError::ExternalService(e.to_string())
        })?;

    let po = PurchaseOrder::new(cmd, vendor)?;

    // => Save emits its own "repo.save" child span inside.
    self.repo
        .save(ctx, &po)
        .await
        .map_err(|e| {
            tracing::error!(error = ?e, "save po failed");
            AppError::Persistence(e.to_string())
        })?;

    // => tracing::instrument closes the span when the function returns.
    Ok(po.id)
}

// => axum HTTP layer uses tower-http's TraceLayer to start a root span per request.
pub fn build_router(app_state: AppState) -> Router {
    Router::new()
        .route("/api/purchase-orders", post(create_po_handler))
        // => TraceLayer extracts W3C TraceContext from "traceparent" header.
        .layer(TraceLayer::new_for_http())
        .with_state(app_state)
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Pass `context.Context` (Go) or use `#[tracing::instrument]` (Rust) through every layer — the trace tree assembles automatically without any layer needing to import the tracer directly.

---

### Example 65: Health Check Port

Health check ports expose liveness and readiness endpoints — Kubernetes uses `/healthz` to decide whether to route traffic. A composite health checker aggregates per-dependency checks (DB, ERP, outbox) and returns 503 if any fail, triggering Kubernetes to pull the pod from rotation.

```mermaid
graph TD
    accTitle: Example 65: Health Check Port
    accDescr: Graph with 7 nodes and 10 connections. Nodes: GET /healthz, CompositeHealthCheck, DBHealthCheck pool.Ping, ERPHealthCheck HTTP HEAD /ping, OutboxHealthCheck count pending > max, 200 OK, 503 Service Unavailable. Connections: GET /healthz to CompositeHealthCheck, CompositeHealthCheck to DBHealthCheck pool.Ping, CompositeHealthCheck to ERPHealthCheck HTTP HEAD /ping, CompositeHealthCheck to OutboxHealthCheck count pending > max, DBHealthCheck pool.Ping to 200 OK (all pass), ERPHealthCheck HTTP HEAD /ping to 200 OK (all pass), OutboxHealthCheck count pending > max to 200 OK (all pass), DBHealthCheck pool.Ping to 503 Service Unavailable (any fail), ERPHealthCheck HTTP HEAD /ping to 503 Service Unavailable (any fail), OutboxHealthCheck count pending > max to 503 Service Unavailable (any fail).
    A["GET /healthz"]:::blue
    B["CompositeHealthCheck"]:::orange
    C["DBHealthCheck<br/>pool.Ping"]:::teal
    D["ERPHealthCheck<br/>HTTP HEAD /ping"]:::teal
    E["OutboxHealthCheck<br/>count pending > max"]:::teal
    F["200 OK"]:::teal
    G["503 Service<br/>Unavailable"]:::purple

    A --> B
    B --> C
    B --> D
    B --> E
    C & D & E -->|all pass| F
    C -->|any fail| G
    D -->|any fail| G
    E -->|any fail| G

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => HealthChecker is the output port for dependency health checks.
// => Each adapter (DB, ERP, outbox) implements this two-method interface.
type HealthChecker interface {
    // => Check returns nil if the dependency is healthy, an error otherwise.
    Check(ctx context.Context) error
    // => Name returns a human-readable label used in the health response body.
    Name() string
}

// => PODBHealthCheck pings the Postgres connection pool.
type PODBHealthCheck struct {
    // => pool: the pgxpool.Pool shared with all repository adapters
    pool *pgxpool.Pool
}

// => Check pings the database; returns an error if the connection is unavailable.
func (h *PODBHealthCheck) Check(ctx context.Context) error {
    // => Ping acquires a connection from the pool and sends a lightweight query.
    return h.pool.Ping(ctx)
}

func (h *PODBHealthCheck) Name() string { return "postgres" }

// => CompositeHealthCheck aggregates multiple HealthChecker implementations.
type CompositeHealthCheck struct {
    // => checks: ordered list of all registered health checkers
    checks []HealthChecker
}

// => Check runs all sub-checkers and returns the first error encountered.
func (c *CompositeHealthCheck) Check(ctx context.Context) error {
    for _, ch := range c.checks {
        if err := ch.Check(ctx); err != nil {
            // => Return immediately on first failure with checker name context.
            return fmt.Errorf("%s: %w", ch.Name(), err)
        }
    }
    return nil
}

// => HealthHandler serves GET /healthz; returns 200 or 503.
func HealthHandler(composite *CompositeHealthCheck) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if err := composite.Check(r.Context()); err != nil {
            // => 503 signals Kubernetes readiness probe to remove pod from load balancer.
            http.Error(w, err.Error(), http.StatusServiceUnavailable)
            return
        }
        // => 200 signals all dependencies are healthy; pod stays in rotation.
        w.WriteHeader(http.StatusOK)
    }
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => HealthChecker is the output port trait for per-dependency health checks.
#[async_trait]
pub trait HealthChecker: Send + Sync {
    // => check returns Ok(()) if healthy, Err(HealthError) otherwise.
    async fn check(&self) -> Result<(), HealthError>;
    // => name returns a label used in the health response body.
    fn name(&self) -> &'static str;
}

// => DBHealthCheck pings the sqlx PgPool.
pub struct DBHealthCheck {
    // => pool: shared connection pool used by all repository adapters
    pool: sqlx::PgPool,
}

#[async_trait]
impl HealthChecker for DBHealthCheck {
    async fn check(&self) -> Result<(), HealthError> {
        // => acquire() borrows a connection; drop releases it back to the pool.
        self.pool
            .acquire()
            .await
            .map(|_| ())
            .map_err(|e| HealthError::Database(e.to_string()))
    }
    fn name(&self) -> &'static str { "postgres" }
}

// => CompositeHealthCheck aggregates multiple HealthChecker trait objects.
pub struct CompositeHealthCheck {
    checks: Vec<Box<dyn HealthChecker>>,
}

impl CompositeHealthCheck {
    // => check_all runs every sub-checker and collects all errors.
    pub async fn check_all(&self) -> Vec<(&'static str, HealthError)> {
        let mut errors = Vec::new();
        for ch in &self.checks {
            if let Err(e) = ch.check().await {
                // => Collect all failures so the response body lists all unhealthy deps.
                errors.push((ch.name(), e));
            }
        }
        errors
    }
}

// => axum handler for GET /healthz; returns 200 or 503.
pub async fn health_handler(
    State(composite): State<Arc<CompositeHealthCheck>>,
) -> impl IntoResponse {
    let errors = composite.check_all().await;
    if errors.is_empty() {
        // => All checks passed — pod is ready to serve traffic.
        StatusCode::OK
    } else {
        // => At least one dependency is unhealthy — 503 triggers readiness probe failure.
        StatusCode::SERVICE_UNAVAILABLE
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Define `HealthChecker` as a port so each adapter self-reports its own health — the composite aggregator and HTTP handler stay generic and never import Postgres or HTTP client code directly.

---

## Outbox Pattern (Examples 66–70)

### Example 66: OutboxRepository Port + Postgres Adapter

The outbox repository port provides the database operations needed to implement the transactional outbox — saving entries in the same transaction as the aggregate, and later polling for unpublished entries. The port lives in the `app/` package; the Postgres adapter lives in `adapter/out/`.

```mermaid
classDiagram
    accTitle: Example 66: OutboxRepository Port + Postgres Adapter
    accDescr: Class diagram with 3 items: OutboxRepository, PostgresOutboxRepo, InMemoryOutboxRepo.
    class OutboxRepository {
        <<interface>>
        +SaveTx(ctx, tx, entry) error
        +FindUnpublished(ctx, limit) OutboxEntry[], error
        +MarkPublished(ctx, id) error
        +IncrementRetry(ctx, id) error
    }
    class PostgresOutboxRepo {
        -pool pgxpool.Pool
        +SaveTx(ctx, tx, entry) error
        +FindUnpublished(ctx, limit) OutboxEntry[], error
        +MarkPublished(ctx, id) error
        +IncrementRetry(ctx, id) error
    }
    class InMemoryOutboxRepo {
        -entries map
        +SaveTx(ctx, tx, entry) error
        +FindUnpublished(ctx, limit) OutboxEntry[], error
        +MarkPublished(ctx, id) error
        +IncrementRetry(ctx, id) error
    }
    OutboxRepository <|.. PostgresOutboxRepo : satisfies
    OutboxRepository <|.. InMemoryOutboxRepo : satisfies

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => OutboxEntry is the record stored in the outbox table.
// => It carries a serialized domain event waiting to be published.
type OutboxEntry struct {
    // => ID: UUID primary key for idempotent publishing
    ID          string
    // => AggregateId: the PO ID that raised the event (for debugging)
    AggregateId string
    // => EventType: discriminator used to deserialize Payload correctly
    EventType   string
    // => Payload: JSON-serialized domain event body
    Payload     []byte
    // => CreatedAt: when the entry was written; used for ordering
    CreatedAt   time.Time
    // => RetryCount: how many publish attempts have failed
    RetryCount  int
    // => PublishedAt: nil until the event is successfully published
    PublishedAt *time.Time
}

// => OutboxRepository is the output port for transactional outbox operations.
type OutboxRepository interface {
    // => SaveTx writes an outbox entry in the caller's active transaction.
    // => Must use the same tx as the aggregate save to ensure atomicity.
    SaveTx(ctx context.Context, tx pgx.Tx, entry OutboxEntry) error
    // => FindUnpublished fetches up to limit entries with PublishedAt IS NULL.
    FindUnpublished(ctx context.Context, limit int) ([]OutboxEntry, error)
    // => MarkPublished sets PublishedAt = NOW() for the given entry ID.
    MarkPublished(ctx context.Context, id string) error
    // => IncrementRetry increments RetryCount for the given entry ID.
    IncrementRetry(ctx context.Context, id string) error
}

// => PostgresOutboxRepository is the adapter implementing the port with pgx.
type PostgresOutboxRepository struct {
    // => pool: shared connection pool; SaveTx uses the tx parameter, not the pool
    pool *pgxpool.Pool
}

// => FindUnpublished queries for outbox rows not yet published.
func (r *PostgresOutboxRepository) FindUnpublished(
    ctx context.Context,
    limit int,
) ([]OutboxEntry, error) {
    rows, err := r.pool.Query(ctx,
        // => FOR UPDATE SKIP LOCKED prevents two publisher instances claiming the same rows.
        `SELECT id, aggregate_id, event_type, payload, created_at, retry_count
         FROM outbox
         WHERE published_at IS NULL
         ORDER BY created_at
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        limit,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    // => Scan each row into an OutboxEntry and collect into a slice.
    var entries []OutboxEntry
    for rows.Next() {
        var e OutboxEntry
        if err := rows.Scan(&e.ID, &e.AggregateId, &e.EventType,
            &e.Payload, &e.CreatedAt, &e.RetryCount); err != nil {
            return nil, err
        }
        entries = append(entries, e)
    }
    return entries, rows.Err()
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => OutboxEntry mirrors the outbox database table structure.
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct OutboxEntry {
    // => id: UUID primary key
    pub id: Uuid,
    // => aggregate_id: the PO UUID that generated this event
    pub aggregate_id: Uuid,
    // => event_type: discriminator for deserialization
    pub event_type: String,
    // => payload: JSON-encoded domain event body
    pub payload: serde_json::Value,
    // => created_at: entry creation timestamp; used for publish ordering
    pub created_at: DateTime<Utc>,
    // => retry_count: number of failed publish attempts
    pub retry_count: i32,
}

// => OutboxRepository is the async output port trait for outbox operations.
#[async_trait]
pub trait OutboxRepository: Send + Sync {
    // => save_tx writes an entry within an existing sqlx transaction.
    async fn save_tx(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        entry: OutboxEntry,
    ) -> Result<(), RepoError>;
    // => find_unpublished fetches up to limit undelivered entries.
    async fn find_unpublished(
        &self,
        limit: i64,
    ) -> Result<Vec<OutboxEntry>, RepoError>;
    // => mark_published sets published_at = NOW() for the given id.
    async fn mark_published(&self, id: Uuid) -> Result<(), RepoError>;
    // => increment_retry increments retry_count for the given id.
    async fn increment_retry(&self, id: Uuid) -> Result<(), RepoError>;
}

// => PostgresOutboxRepository implements OutboxRepository with sqlx queries.
pub struct PostgresOutboxRepository {
    // => pool: PgPool shared with all other repository adapters
    pool: sqlx::PgPool,
}

#[async_trait]
impl OutboxRepository for PostgresOutboxRepository {
    async fn find_unpublished(
        &self,
        limit: i64,
    ) -> Result<Vec<OutboxEntry>, RepoError> {
        // => FOR UPDATE SKIP LOCKED allows safe concurrent polling by multiple instances.
        sqlx::query_as::<_, OutboxEntry>(
            r#"SELECT id, aggregate_id, event_type, payload, created_at, retry_count
               FROM outbox
               WHERE published_at IS NULL
               ORDER BY created_at
               LIMIT $1
               FOR UPDATE SKIP LOCKED"#,
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| RepoError::Transient(e.to_string()))
    }
    // => Other methods (save_tx, mark_published, increment_retry) follow the same pattern.
    async fn save_tx(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        entry: OutboxEntry,
    ) -> Result<(), RepoError> {
        sqlx::query(
            "INSERT INTO outbox (id, aggregate_id, event_type, payload, created_at)
             VALUES ($1, $2, $3, $4, $5)",
        )
        .bind(entry.id)
        .bind(entry.aggregate_id)
        .bind(&entry.event_type)
        .bind(&entry.payload)
        .bind(entry.created_at)
        .execute(&mut **tx)
        .await
        .map(|_| ())
        .map_err(|e| RepoError::Transient(e.to_string()))
    }
    async fn mark_published(&self, id: Uuid) -> Result<(), RepoError> {
        sqlx::query("UPDATE outbox SET published_at = NOW() WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map(|_| ())
            .map_err(|e| RepoError::Transient(e.to_string()))
    }
    async fn increment_retry(&self, id: Uuid) -> Result<(), RepoError> {
        sqlx::query(
            "UPDATE outbox SET retry_count = retry_count + 1 WHERE id = $1",
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map(|_| ())
        .map_err(|e| RepoError::Transient(e.to_string()))
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: `SaveTx` takes the caller's active transaction as a parameter — this is the key that ensures the outbox entry and the aggregate write land in the same database commit.

---

### Example 67: Atomic Aggregate + Outbox Save

The transactional outbox guarantees exactly-once delivery semantics by writing the domain event and the aggregate state in the same database transaction. If the process crashes after commit, the outbox poller retries publishing. If it crashes before commit, neither the aggregate nor the event is persisted.

```mermaid
sequenceDiagram
    accTitle: Example 67: Atomic Aggregate + Outbox Save
    accDescr: Sequence diagram between AppService, Database, OutboxPoller. Messages: AppService to Database: BEGIN TX; AppService to Database: INSERT purchase_orders row; AppService to Database: INSERT outbox rows (one per domain event); AppService to Database: COMMIT; OutboxPoller to Database: SELECT unpublished outbox rows (separate transaction); OutboxPoller to OutboxPoller: publish each event to message bus; OutboxPoller to Database: UPDATE outbox SET published_at = NOW().
    participant AS as AppService
    participant DB as Database
    participant OP as OutboxPoller

    AS->>DB: BEGIN TX
    AS->>DB: INSERT purchase_orders row
    AS->>DB: INSERT outbox rows (one per domain event)
    AS->>DB: COMMIT
    Note over AS,DB: both writes atomic — no partial state possible
    OP->>DB: SELECT unpublished outbox rows (separate transaction)
    OP->>OP: publish each event to message bus
    OP->>DB: UPDATE outbox SET published_at = NOW()

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => SaveWithOutbox writes the aggregate and its domain events atomically.
// => This is the core of the transactional outbox pattern.
func SaveWithOutbox(
    ctx context.Context,
    pool *pgxpool.Pool,
    po *PurchaseOrder,
    poRepo *PostgresPORepository,
    outboxRepo *PostgresOutboxRepository,
) error {
    // => Begin a single database transaction covering both writes.
    tx, err := pool.Begin(ctx)
    if err != nil {
        return fmt.Errorf("begin tx: %w", err)
    }
    // => Rollback is a no-op after a successful Commit; safe to defer unconditionally.
    defer tx.Rollback(ctx)

    // => Write the aggregate row inside the transaction.
    if err := poRepo.SaveTx(ctx, tx, po); err != nil {
        return fmt.Errorf("save po: %w", err)
    }
    // => Write one outbox row per domain event raised by the aggregate.
    for _, event := range po.DomainEvents() {
        // => Serialize the event to JSON for storage; deserialized by the poller.
        payload, err := json.Marshal(event)
        if err != nil {
            return fmt.Errorf("marshal event: %w", err)
        }
        entry := OutboxEntry{
            // => UUID ensures idempotency — poller can detect duplicate publishes.
            ID:          uuid.New().String(),
            AggregateId: string(po.Id),
            // => EventType allows the poller to route events to the right handler.
            EventType:   event.EventType(),
            Payload:     payload,
            CreatedAt:   time.Now(),
        }
        if err := outboxRepo.SaveTx(ctx, tx, entry); err != nil {
            return fmt.Errorf("save outbox entry: %w", err)
        }
    }
    // => Clear events after writing so they are not re-processed on the next save.
    po.ClearEvents()
    // => Commit both the PO row and all outbox rows together.
    // => If Commit fails, both writes roll back — no orphaned outbox entries.
    return tx.Commit(ctx)
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => save_with_outbox writes the PO and all its domain events in one transaction.
pub async fn save_with_outbox(
    pool: &sqlx::PgPool,
    po: &PurchaseOrder,
    events: &[Box<dyn DomainEvent>],
) -> Result<(), RepoError> {
    // => Begin a transaction that covers all writes in this function.
    let mut tx = pool.begin().await
        .map_err(|e| RepoError::Transient(e.to_string()))?;

    // => Write the aggregate row inside the transaction.
    save_po_tx(&mut tx, po).await?;

    // => Write one outbox row per domain event.
    for event in events {
        // => Serialize to JSON; stored as JSONB in Postgres.
        let payload = serde_json::to_value(event.payload())
            .map_err(|e| RepoError::Transient(e.to_string()))?;
        let entry = OutboxEntry {
            id: Uuid::new_v4(),
            // => aggregate_id links the outbox row back to the PO for debugging.
            aggregate_id: po.id.0,
            event_type: event.event_type().to_string(),
            payload,
            created_at: Utc::now(),
            retry_count: 0,
        };
        save_outbox_tx(&mut tx, entry).await?;
    }
    // => Commit both the PO row and all outbox rows atomically.
    // => On failure, both writes roll back — consistent state guaranteed.
    tx.commit().await
        .map_err(|e| RepoError::Transient(e.to_string()))
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: The single `tx.Commit()` at the end is what makes the outbox pattern reliable — either the aggregate and its events land together, or neither does.

---

### Example 68: OutboxPublisher Background Worker

The outbox publisher polls for unpublished entries on a fixed interval, publishes each event to the message bus, and marks it published. The worker runs as a background goroutine or async task, terminating gracefully when the context or shutdown signal fires.

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => OutboxPublisher polls the outbox table and publishes events to the domain bus.
type OutboxPublisher struct {
    // => outboxRepo: the port for reading and updating outbox entries
    outboxRepo OutboxRepository
    // => bus: the DomainEventBus port for dispatching events to handlers
    bus DomainEventBus
    // => registry: maps EventType strings to concrete event structs for deserialization
    registry EventRegistry
    // => interval: how often to poll the outbox table (e.g., 5 * time.Second)
    interval time.Duration
    // => logger: structured logger for publish errors
    logger Logger
}

// => Run is the blocking entry point; launch via goroutine: go publisher.Run(ctx).
func (p *OutboxPublisher) Run(ctx context.Context) {
    // => NewTicker fires every interval; Stop releases the timer resource on exit.
    ticker := time.NewTicker(p.interval)
    defer ticker.Stop()
    for {
        select {
        // => On each tick, attempt to publish a batch of pending entries.
        case <-ticker.C:
            if err := p.publishBatch(ctx); err != nil {
                // => Log and continue — a failed batch does not crash the worker.
                p.logger.Error("outbox publish batch", "error", err)
            }
        // => When ctx is cancelled (shutdown), exit the loop cleanly.
        case <-ctx.Done():
            return
        }
    }
}

// => publishBatch fetches up to 100 unpublished entries and processes each.
func (p *OutboxPublisher) publishBatch(ctx context.Context) error {
    // => Fetch a bounded batch; prevents memory spikes on large backlogs.
    entries, err := p.outboxRepo.FindUnpublished(ctx, 100)
    if err != nil {
        return fmt.Errorf("find unpublished: %w", err)
    }
    for _, entry := range entries {
        // => Deserialize the payload using the event type registry.
        event, err := p.registry.Deserialize(entry.EventType, entry.Payload)
        if err != nil {
            // => Deserialization failure is non-retryable; increment and skip.
            p.outboxRepo.IncrementRetry(ctx, entry.ID)
            p.logger.Error("deserialize event", "id", entry.ID, "error", err)
            continue
        }
        // => Publish to the bus; handlers receive the event synchronously or async.
        if err := p.bus.Publish(ctx, event); err != nil {
            // => Bus publish failure may be transient; increment retry count.
            p.outboxRepo.IncrementRetry(ctx, entry.ID)
            p.logger.Error("publish event", "id", entry.ID, "error", err)
            continue
        }
        // => Mark as published only after the bus confirms delivery.
        if err := p.outboxRepo.MarkPublished(ctx, entry.ID); err != nil {
            p.logger.Error("mark published", "id", entry.ID, "error", err)
        }
    }
    return nil
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => OutboxPublisher polls and dispatches outbox entries.
pub struct OutboxPublisher {
    // => outbox_repo: Arc<dyn> allows sharing across the async runtime
    outbox_repo: Arc<dyn OutboxRepository>,
    // => bus: the domain event bus port for dispatching events
    bus: Arc<dyn DomainEventBus>,
    // => interval: polling period (e.g., Duration::from_secs(5))
    interval: Duration,
}

impl OutboxPublisher {
    // => run is the async entry point; launch via tokio::spawn(publisher.run(shutdown)).
    pub async fn run(
        &self,
        mut shutdown: tokio::sync::broadcast::Receiver<()>,
    ) {
        // => interval ticks on a fixed schedule; missed ticks are coalesced (not queued).
        let mut interval = tokio::time::interval(self.interval);
        loop {
            tokio::select! {
                // => On each tick, process the next batch of pending entries.
                _ = interval.tick() => {
                    if let Err(e) = self.publish_batch().await {
                        // => Log error and continue — the worker survives transient failures.
                        tracing::error!("outbox publish batch error: {:?}", e);
                    }
                }
                // => Shutdown signal received — exit the loop and allow graceful teardown.
                _ = shutdown.recv() => {
                    tracing::info!("OutboxPublisher shutting down");
                    return;
                }
            }
        }
    }

    // => publish_batch fetches up to 100 entries and processes each.
    async fn publish_batch(&self) -> Result<(), RepoError> {
        let entries = self.outbox_repo.find_unpublished(100).await?;
        for entry in entries {
            // => Publish to the bus; on error, increment retry and continue.
            match self.bus.publish(&entry).await {
                Ok(()) => {
                    // => Mark published after confirmed delivery.
                    if let Err(e) = self.outbox_repo
                        .mark_published(entry.id)
                        .await
                    {
                        tracing::error!("mark published failed: {:?}", e);
                    }
                }
                Err(e) => {
                    // => Increment retry count; the entry will be retried on the next tick.
                    tracing::error!("publish event failed: {:?}", e);
                    let _ = self.outbox_repo.increment_retry(entry.id).await;
                }
            }
        }
        Ok(())
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: The publisher loop is entirely decoupled from the write path — it reads from the outbox, publishes, and marks done in separate DB calls, so a crashed publisher leaves the outbox intact for the next run.

---

### Example 69: Dead-Letter Handling for Max-Retry Events

When an outbox entry exceeds its retry budget, moving it to a dead-letter store prevents it from blocking the outbox poller indefinitely. Operations teams can inspect the dead-letter table, fix the consumer bug, and re-queue entries manually.

```mermaid
graph TD
    accTitle: Example 69: Dead-Letter Handling for Max-Retry Events
    accDescr: Graph with 7 nodes and 6 connections. Nodes: publishBatch processes entry, publish success?, mark published done, increment retry_count, retry_count > maxRetries?, move to dead_letter table, skip entry log warning. Connections: publishBatch processes entry to publish success?, publish success? to mark published done (Yes), publish success? to increment retry_count (No), increment retry_count to retry_count > maxRetries?, retry_count > maxRetries? to move to dead_letter table (Yes), retry_count > maxRetries? to skip entry log warning (No).
    A["publishBatch<br/>processes entry"]:::blue
    B{"publish<br/>success?"}:::orange
    C["mark published<br/>done"]:::teal
    D["increment<br/>retry_count"]:::orange
    E{"retry_count<br/>> maxRetries?"}:::orange
    F["move to dead_letter<br/>table"]:::purple
    G["skip entry<br/>log warning"]:::gray

    A --> B
    B -->|Yes| C
    B -->|No| D
    D --> E
    E -->|Yes| F
    E -->|No| G

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef gray fill:#808080,stroke:#000000,color:#000000,stroke-width:2px

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Gray #808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => DeadLetterRepository is the output port for storing permanently failed events.
type DeadLetterRepository interface {
    // => SaveDead moves an outbox entry to the dead-letter store with a failure reason.
    SaveDead(ctx context.Context, entry OutboxEntry, reason string) error
}

// => MaxRetries is the configurable retry budget per outbox entry.
const MaxRetries = 5

// => handlePublishFailure decides whether to retry or dead-letter the entry.
func (p *OutboxPublisher) handlePublishFailure(
    ctx context.Context,
    entry OutboxEntry,
    publishErr error,
) {
    // => Increment retry counter in the outbox table.
    if err := p.outboxRepo.IncrementRetry(ctx, entry.ID); err != nil {
        p.logger.Error("increment retry", "id", entry.ID, "error", err)
        return
    }
    // => Check whether the updated entry exceeds the retry budget.
    if entry.RetryCount+1 >= MaxRetries {
        // => Entry has exceeded retry budget — move to dead-letter table.
        reason := fmt.Sprintf("max retries (%d) exceeded: %s",
            MaxRetries, publishErr.Error())
        if err := p.deadLetterRepo.SaveDead(ctx, entry, reason); err != nil {
            p.logger.Error("save dead letter", "id", entry.ID, "error", err)
            return
        }
        // => Mark as published so the poller skips it; the dead-letter table holds it.
        // => Operators query dead_letter to find and re-queue entries after fixing bugs.
        p.outboxRepo.MarkPublished(ctx, entry.ID)
        p.logger.Warn("entry dead-lettered", "id", entry.ID, "reason", reason)
    }
    // => Entry below retry budget: poller will retry on the next tick.
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => MAX_RETRIES is the per-entry retry budget before dead-lettering.
const MAX_RETRIES: i32 = 5;

impl OutboxPublisher {
    // => handle_publish_failure increments retry_count or moves to dead-letter.
    async fn handle_publish_failure(
        &self,
        entry: &OutboxEntry,
        err: &dyn std::error::Error,
    ) {
        // => Increment retry counter first.
        if let Err(e) = self.outbox_repo.increment_retry(entry.id).await {
            tracing::error!("increment_retry failed: {:?}", e);
            return;
        }
        // => entry.retry_count reflects the value before increment; compare to MAX-1.
        if entry.retry_count + 1 >= MAX_RETRIES {
            // => Budget exceeded — persist to dead-letter table.
            let reason = format!(
                "max retries ({}) exceeded: {}",
                MAX_RETRIES, err
            );
            if let Err(e) = self
                .dead_letter_repo
                .save_dead(entry.clone(), reason.clone())
                .await
            {
                tracing::error!("save_dead failed: {:?}", e);
                return;
            }
            // => Mark published so the poller ignores it; dead-letter holds the record.
            let _ = self.outbox_repo.mark_published(entry.id).await;
            tracing::warn!(
                id = ?entry.id,
                reason = %reason,
                "entry moved to dead-letter"
            );
        }
        // => Below budget: entry remains in outbox; poller retries on next tick.
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Mark dead-lettered entries as published so the poller skips them — the dead-letter table becomes the operator's queue for manual investigation and re-queueing after bug fixes.

---

### Example 70: Idempotent Event Handler

At-least-once delivery means consumers may receive the same event more than once — for example when the outbox publisher retries after a partial failure. An idempotency check rejects duplicates using a stored event ID, turning at-least-once delivery into effectively-once processing.

```mermaid
sequenceDiagram
    accTitle: Example 70: Idempotent Event Handler
    accDescr: Sequence diagram between OutboxPublisher, IdempotentHandler, IdempotencyStore, InnerHandler. Messages: OutboxPublisher to IdempotentHandler: Handle(ctx, event); IdempotentHandler to IdempotencyStore: Has(ctx, event.EventId()); IdempotencyStore to IdempotentHandler: false (first delivery); IdempotentHandler to InnerHandler: Handle(ctx, event); InnerHandler to IdempotentHandler: nil; IdempotentHandler to IdempotencyStore: Mark(ctx, event.EventId()); IdempotentHandler to OutboxPublisher: nil; OutboxPublisher to IdempotentHandler: Handle(ctx, event) [duplicate]; IdempotentHandler to IdempotencyStore: Has(ctx, event.EventId()); IdempotencyStore to IdempotentHandler: true (already processed); IdempotentHandler to OutboxPublisher: nil (no-op).
    participant P as OutboxPublisher
    participant IH as IdempotentHandler
    participant IS as IdempotencyStore
    participant H as InnerHandler

    P->>IH: Handle(ctx, event)
    IH->>IS: Has(ctx, event.EventId())
    IS-->>IH: false (first delivery)
    IH->>H: Handle(ctx, event)
    H-->>IH: nil
    IH->>IS: Mark(ctx, event.EventId())
    IH-->>P: nil

    P->>IH: Handle(ctx, event) [duplicate]
    IH->>IS: Has(ctx, event.EventId())
    IS-->>IH: true (already processed)
    IH-->>P: nil (no-op)

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => IdempotencyKeyStore is the output port for checking and recording processed events.
// => Production implementation: Redis with TTL; test implementation: in-memory map.
type IdempotencyKeyStore interface {
    // => Has returns true if the key was previously marked.
    Has(ctx context.Context, key string) (bool, error)
    // => Mark records the key as processed; TTL controls how long to remember it.
    Mark(ctx context.Context, key string) error
}

// => IdempotentEventHandler wraps an EventHandler with idempotency checking.
type IdempotentEventHandler struct {
    // => inner: the real handler that processes the event once
    inner EventHandler
    // => seen: the idempotency key store (Redis in production)
    seen IdempotencyKeyStore
}

// => Handle checks the idempotency store before delegating to the inner handler.
func (h *IdempotentEventHandler) Handle(
    ctx context.Context,
    event DomainEvent,
) error {
    // => EventId() returns the UUID assigned to this event at publish time.
    key := event.EventId()
    // => Check whether this event was already processed by a previous delivery.
    already, err := h.seen.Has(ctx, key)
    if err != nil {
        return fmt.Errorf("idempotency check: %w", err)
    }
    if already {
        // => Duplicate detected — return nil to acknowledge without re-processing.
        // => The publisher will mark the outbox entry published and move on.
        return nil
    }
    // => First delivery: delegate to the real handler.
    if err := h.inner.Handle(ctx, event); err != nil {
        // => Do not mark as seen on failure — allow retry to re-process.
        return err
    }
    // => Mark as seen only after successful processing.
    // => A crash between Handle and Mark causes a duplicate on the next delivery,
    // => which is acceptable because Handle must be idempotent too.
    return h.seen.Mark(ctx, key)
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => IdempotentEventHandler wraps an EventHandler with idempotency checking.
pub struct IdempotentEventHandler<H: EventHandler> {
    // => inner: the real handler invoked on first delivery
    inner: H,
    // => store: Arc<dyn IdempotencyKeyStore> backed by Redis in production
    store: Arc<dyn IdempotencyKeyStore>,
}

#[async_trait]
impl<H: EventHandler + Send + Sync> EventHandler
    for IdempotentEventHandler<H>
{
    async fn handle(
        &self,
        event: &dyn DomainEvent,
    ) -> Result<(), HandlerError> {
        let key = event.event_id().to_string();
        // => Check whether the event was already processed.
        let already = self
            .store
            .has(&key)
            .await
            .map_err(HandlerError::Idempotency)?;
        if already {
            // => Duplicate — return Ok to acknowledge without side effects.
            return Ok(());
        }
        // => Delegate to the real handler on first delivery.
        self.inner.handle(event).await?;
        // => Record the key only after successful processing.
        // => A crash here causes a duplicate retry; inner.handle must tolerate it.
        self.store
            .mark(&key)
            .await
            .map_err(HandlerError::Idempotency)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Mark the idempotency key only after the inner handler succeeds — a crash between `Handle` and `Mark` causes a benign duplicate retry, which is safe as long as the inner handler is itself idempotent.

---

## Production Wiring (Examples 71–75)

### Example 71: Composition Root — All Decorators Stacked

The composition root is the only place that knows about concrete types — it constructs each adapter and stacks the decorators. Application services receive the outermost decorator through the port interface and remain completely unaware of the internal layering.

```mermaid
classDiagram
    accTitle: Example 71: Composition Root — All Decorators Stacked
    accDescr: Class diagram with 5 items: PurchaseOrderRepo, InstrumentedPORepo, LoggingPORepository, RetryPORepository, PostgresPORepository. Relationships: InstrumentedPORepo to LoggingPORepository; LoggingPORepository to RetryPORepository; RetryPORepository to PostgresPORepository.
    class PurchaseOrderRepo {
        <<interface>>
    }
    class InstrumentedPORepo {
        outermost — measures full latency
    }
    class LoggingPORepository {
        logs each call with duration
    }
    class RetryPORepository {
        retries transient errors
    }
    class PostgresPORepository {
        innermost — real DB calls
    }
    PurchaseOrderRepo <|.. InstrumentedPORepo
    InstrumentedPORepo --> LoggingPORepository
    LoggingPORepository --> RetryPORepository
    RetryPORepository --> PostgresPORepository

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => BuildApp constructs the complete application from configuration.
// => It is the ONLY function that imports concrete adapter packages.
func BuildApp(cfg AppConfig) (*App, error) {
    // => Validate configuration before allocating any resources.
    if err := cfg.Validate(); err != nil {
        return nil, fmt.Errorf("invalid config: %w", err)
    }

    // => Create the Postgres connection pool with production tuning.
    pool, err := NewPgPool(context.Background(), cfg.DatabaseURL)
    if err != nil {
        return nil, fmt.Errorf("connect db: %w", err)
    }

    // => Initialize observability infrastructure.
    metrics := NewPrometheusMetrics()
    tracer := NewOtelTracer(cfg.ServiceName)
    logger := NewStructuredLogger(cfg.LogLevel)

    // => Build the repository decorator stack from innermost to outermost.
    // => PostgresPORepository: raw DB calls with pgx.
    baseRepo := postgres.NewPORepository(pool)
    // => RetryPORepository: retries transient DB errors 3 times with exponential backoff.
    retryRepo := NewRetryPORepository(baseRepo,
        3,
        ExponentialBackoff{initial: 100 * time.Millisecond, max: 2 * time.Second, multiplier: 2.0},
    )
    // => LoggingPORepository: logs each call with duration and status.
    loggedRepo := NewLoggingPORepository(retryRepo, logger)
    // => InstrumentedPORepository: outermost — measures latency including retries.
    instrumentedRepo := NewInstrumentedPORepository(loggedRepo, metrics, "po")

    // => Build the ERP client with circuit breaker protection.
    erpClient := http.NewVendorClient(cfg.ERPBaseURL, cfg.ERPTimeout)
    cb := NewCircuitBreaker(CBConfig{Threshold: 5, Timeout: 30 * time.Second})
    cbClient := NewCBVendorClient(erpClient, cb)

    // => Build the anti-corruption layer that translates ERP DTOs to domain types.
    supplierACL := app.NewSupplierACL(cbClient)

    // => Build outbox infrastructure.
    outboxRepo := postgres.NewOutboxRepository(pool)
    deadLetterRepo := postgres.NewDeadLetterRepository(pool)
    bus := NewDomainEventBus()
    outboxPublisher := NewOutboxPublisher(
        outboxRepo, deadLetterRepo, bus,
        5*time.Second, logger,
    )

    // => Build application services; they receive only port interfaces.
    poService := app.NewPOService(instrumentedRepo, supplierACL, tracer)

    // => Build health checkers.
    health := NewCompositeHealthCheck(
        &PODBHealthCheck{pool: pool},
    )

    return &App{
        poService:       poService,
        outboxPublisher: outboxPublisher,
        health:          health,
        pool:            pool,
        cfg:             cfg,
    }, nil
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => build_app constructs the complete application; called from main().
pub async fn build_app(cfg: AppConfig) -> Result<App, BuildError> {
    // => Validate configuration before allocating resources.
    cfg.validate()?;

    // => Create the Postgres pool with production connection settings.
    let pool = new_pg_pool(&cfg.database_url).await?;

    // => Initialize observability.
    let metrics: Arc<dyn MetricsCollector> = Arc::new(PrometheusMetrics::new());
    let tracer: Arc<dyn Tracer> = Arc::new(OtelTracer::new(&cfg.service_name));

    // => Build the repository decorator stack.
    let base_repo = PostgresPORepository::new(pool.clone());
    let retry_repo = RetryPORepository {
        inner: base_repo,
        max_attempts: 3,
        backoff: ExponentialBackoff {
            initial: Duration::from_millis(100),
            max: Duration::from_secs(2),
            multiplier: 2.0,
        },
    };
    let logged_repo = LoggingPORepository::new(retry_repo);
    // => Outermost decorator; measures latency including retries and logging.
    let instrumented_repo: Arc<dyn PORepository> = Arc::new(
        InstrumentedPORepository {
            inner: logged_repo,
            metrics: Arc::clone(&metrics),
            repo_name: "po",
        },
    );

    // => Build ERP client with circuit breaker.
    let erp_client = HTTPVendorClient::new(&cfg.erp_base_url);
    let cb = Arc::new(CircuitBreaker::new(5, Duration::from_secs(30)));
    let cb_client = CBVendorClient { inner: erp_client, cb };

    // => Build ACL and application service.
    let supplier_acl = SupplierACL::new(cb_client);
    let po_service = POService::new(
        Arc::clone(&instrumented_repo), supplier_acl, Arc::clone(&tracer),
    );

    // => Build outbox publisher.
    let outbox_repo: Arc<dyn OutboxRepository> =
        Arc::new(PostgresOutboxRepository { pool: pool.clone() });
    let bus = Arc::new(InMemoryDomainEventBus::new());
    let outbox_publisher = OutboxPublisher {
        outbox_repo: Arc::clone(&outbox_repo),
        bus: Arc::clone(&bus),
        interval: Duration::from_secs(5),
    };

    Ok(App { po_service, outbox_publisher, pool, cfg })
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: The composition root is the sole file that imports concrete adapter packages — all other code depends only on port interfaces, making adapters trivially swappable in tests and future migrations.

---

### Example 72: Graceful Shutdown

Graceful shutdown drains in-flight HTTP requests, stops the outbox publisher, and releases database connections in a deterministic order. Without it, a Kubernetes rolling deploy kills pods mid-request, causing 500 errors visible to users.

```mermaid
sequenceDiagram
    accTitle: Example 72: Graceful Shutdown
    accDescr: Sequence diagram between OS40SIGTERM41, main, HTTP Server, OutboxPublisher, PgPool. Messages: OS40SIGTERM41 to main: SIGTERM; main to main: cancel root context; main to HTTP Server: Shutdown4030s timeout41; HTTP Server to HTTP Server: stop accepting new requests; HTTP Server to HTTP Server: drain in-flight requests; HTTP Server to main: done; main to OutboxPublisher: ctx.Done() fires; OutboxPublisher to main: goroutine exits; main to PgPool: pool.Close(); PgPool to main: connections released; main to OS40SIGTERM41: process exits 0.
    participant OS as OS#40;SIGTERM#41;
    participant M as main
    participant HS as HTTP Server
    participant OP as OutboxPublisher
    participant DB as PgPool

    OS->>M: SIGTERM
    M->>M: cancel root context
    M->>HS: Shutdown#40;30s timeout#41;
    HS->>HS: stop accepting new requests
    HS->>HS: drain in-flight requests
    HS-->>M: done
    M->>OP: ctx.Done() fires
    OP-->>M: goroutine exits
    M->>DB: pool.Close()
    DB-->>M: connections released
    M->>OS: process exits 0

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => Run starts the HTTP server and background workers, then blocks until shutdown.
// => ctx is cancelled by the caller (typically via signal.NotifyContext).
func Run(ctx context.Context, app *App) error {
    // => Build the HTTP server with the app's router and configured address.
    srv := &http.Server{
        Handler: app.Router(),
        Addr:    app.cfg.Addr,
    }

    // => errCh receives the error from ListenAndServe when the server stops.
    errCh := make(chan error, 1)
    go func() {
        // => ListenAndServe blocks until the server is shut down.
        // => ErrServerClosed is the normal shutdown signal; caller should treat it as nil.
        if err := srv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
            errCh <- err
        }
    }()

    // => Start the outbox publisher in its own goroutine; ctx cancellation stops it.
    go app.OutboxPublisher.Run(ctx)

    // => Block until either the server errors or the context is cancelled (SIGTERM).
    select {
    case err := <-errCh:
        // => Unexpected server error — return immediately.
        return err
    case <-ctx.Done():
        // => Graceful shutdown path: give in-flight requests 30 seconds to finish.
        shutdownCtx, cancel := context.WithTimeout(
            context.Background(), 30*time.Second)
        defer cancel()
        // => Shutdown stops accepting new connections and waits for handlers to finish.
        if err := srv.Shutdown(shutdownCtx); err != nil {
            return fmt.Errorf("server shutdown: %w", err)
        }
    }
    // => Close the Postgres pool after the server is fully stopped.
    app.Pool.Close()
    return nil
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => run starts the axum server and background tasks, then waits for SIGTERM/Ctrl-C.
pub async fn run(app: App) -> Result<(), RunError> {
    // => Build a broadcast channel to signal shutdown to all background tasks.
    let (shutdown_tx, _) = tokio::sync::broadcast::channel::<()>(1);

    // => Clone a receiver for the outbox publisher before moving shutdown_tx.
    let publisher_shutdown = shutdown_tx.subscribe();

    // => Spawn the outbox publisher as a background task.
    let publisher_handle = tokio::spawn({
        let publisher = app.outbox_publisher;
        async move { publisher.run(publisher_shutdown).await }
    });

    // => Build the axum server bound to the configured address.
    let addr: std::net::SocketAddr = app.cfg.addr.parse()?;
    let server = axum::Server::bind(&addr)
        .serve(app.router().into_make_service());

    // => select! races the server against a CTRL-C / SIGTERM signal.
    tokio::select! {
        result = server => {
            // => Server exited unexpectedly (bind failure, etc.).
            return result.map_err(RunError::Server);
        }
        _ = tokio::signal::ctrl_c() => {
            // => Graceful shutdown signal received.
            tracing::info!("shutdown signal received");
        }
    }

    // => Broadcast shutdown to all background tasks (outbox publisher, etc.).
    let _ = shutdown_tx.send(());

    // => Wait for the publisher to finish its current batch before exiting.
    let _ = publisher_handle.await;

    // => Pool is dropped here; sqlx closes all connections.
    drop(app.pool);
    Ok(())
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Always drain in-flight requests before stopping background workers, and stop background workers before closing the database pool — the shutdown order matters as much as the shutdown itself.

---

### Example 73: Configuration Validation at Startup

Fail-fast configuration validation catches missing environment variables at process startup, not during the first production request. Collecting all errors rather than failing on the first one gives operators a complete list of what is missing.

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => AppConfig holds all configuration for the procurement service.
// => Fields are populated from environment variables before BuildApp is called.
type AppConfig struct {
    // => DatabaseURL: Postgres DSN; required for all repository adapters
    DatabaseURL string
    // => ERPBaseURL: base URL for the external vendor ERP; required for ACL
    ERPBaseURL string
    // => ServerPort: HTTP listen port; must be in 1–65535
    ServerPort int
    // => LogLevel: one of "debug", "info", "warn", "error"
    LogLevel string
    // => MaxRetries: retry budget for repository adapters; default 3
    MaxRetries int
    // => ServiceName: OTel service name for trace attribution
    ServiceName string
}

// => Validate returns an error listing ALL missing or invalid fields.
// => Collecting all errors gives operators a complete fix list rather than one-at-a-time.
func (c AppConfig) Validate() error {
    var errs []string
    // => DatabaseURL must be non-empty; an empty value will crash on first DB query.
    if c.DatabaseURL == "" {
        errs = append(errs, "DATABASE_URL is required")
    }
    // => ERPBaseURL must be non-empty; nil ERP client panics on first ACL call.
    if c.ERPBaseURL == "" {
        errs = append(errs, "ERP_BASE_URL is required")
    }
    // => ServerPort must be a valid TCP port number.
    if c.ServerPort <= 0 || c.ServerPort > 65535 {
        errs = append(errs, "SERVER_PORT must be between 1 and 65535")
    }
    // => MaxRetries defaults to 3 if not set; non-positive values are invalid.
    if c.MaxRetries <= 0 {
        errs = append(errs, "MAX_RETRIES must be a positive integer")
    }
    if len(errs) > 0 {
        // => Join all errors into a single message for log output.
        return fmt.Errorf("configuration errors: %s", strings.Join(errs, "; "))
    }
    return nil
}

// => main calls Validate before building the app; any error kills the process.
func main() {
    cfg := loadConfigFromEnv()
    // => Validate before allocating pools, tracers, or HTTP servers.
    if err := cfg.Validate(); err != nil {
        log.Fatalf("startup: %v", err)
    }
    app, err := BuildApp(cfg)
    if err != nil {
        log.Fatalf("build app: %v", err)
    }
    // => Run blocks until SIGTERM.
    if err := Run(context.Background(), app); err != nil {
        log.Fatalf("run: %v", err)
    }
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => AppConfig is deserialized from environment variables by the envy crate.
// => All fields are required unless marked with #[serde(default)].
#[derive(Debug, serde::Deserialize)]
pub struct AppConfig {
    // => database_url: Postgres DSN; required
    pub database_url: String,
    // => erp_base_url: ERP HTTP base URL; required
    pub erp_base_url: String,
    // => server_port: HTTP listen port; required
    pub server_port: u16,
    // => log_level: tracing subscriber filter; default "info"
    #[serde(default = "default_log_level")]
    pub log_level: String,
    // => max_retries: repository retry budget; default 3
    #[serde(default = "default_max_retries")]
    pub max_retries: u32,
    // => service_name: OTel service name; required for trace attribution
    pub service_name: String,
}

fn default_log_level() -> String { "info".to_string() }
fn default_max_retries() -> u32 { 3 }

// => ConfigError lists all validation failures found during validate().
#[derive(Debug, thiserror::Error)]
#[error("configuration errors: {0}")]
pub struct ConfigError(String);

impl AppConfig {
    // => validate checks business rules that serde deserialization cannot express.
    pub fn validate(&self) -> Result<(), ConfigError> {
        let mut errs = Vec::new();
        // => database_url must be non-empty even though serde accepted it.
        if self.database_url.is_empty() {
            errs.push("DATABASE_URL is required");
        }
        // => max_retries of 0 means no attempts, which would disable retries entirely.
        if self.max_retries == 0 {
            errs.push("MAX_RETRIES must be at least 1");
        }
        if !errs.is_empty() {
            return Err(ConfigError(errs.join("; ")));
        }
        Ok(())
    }
}

// => main deserializes all env vars at once, then validates, then builds the app.
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // => envy::from_env deserializes all fields at once; missing required fields fail here.
    let cfg = envy::from_env::<AppConfig>()?;
    // => validate() catches business-rule violations not handled by serde.
    cfg.validate()?;
    let app = build_app(cfg).await?;
    run(app).await?;
    Ok(())
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: Collect all configuration errors before returning — an operator fixing a misconfigured deployment should not need to restart the process five times to discover all five missing variables.

---

### Example 74: Connection Pool Tuning

Default connection pool settings are designed for development, not production. Tuning `MaxConns`, `MinConns`, `MaxConnLifetime`, and `MaxConnIdleTime` prevents the pool from starving under load, leaking connections, or accumulating stale TCP sessions behind a load balancer.

```mermaid
graph TD
    accTitle: Example 74: Connection Pool Tuning
    accDescr: Graph with 5 nodes and 4 connections. Nodes: MaxConns = 20 ceiling on DB connections, MinConns = 5 warm pool at startup, MaxConnLifetime = 30m recycle to avoid stale TCP, MaxConnIdleTime = 5m release unused under low load, HealthCheckPeriod = 1m ping idle connections. Connections: MaxConns = 20 ceiling on DB connections to MinConns = 5 warm pool at startup, MinConns = 5 warm pool at startup to MaxConnLifetime = 30m recycle to avoid stale TCP, MaxConnLifetime = 30m recycle to avoid stale TCP to MaxConnIdleTime = 5m release unused under low load, MaxConnIdleTime = 5m release unused under low load to HealthCheckPeriod = 1m ping idle connections.
    A["MaxConns = 20<br/>ceiling on DB<br/>connections"]:::blue
    B["MinConns = 5<br/>warm pool at startup"]:::teal
    C["MaxConnLifetime =<br/>30m<br/>recycle to avoid<br/>stale TCP"]:::orange
    D["MaxConnIdleTime = 5m<br/>release unused under<br/>low load"]:::purple
    E["HealthCheckPeriod =<br/>1m<br/>ping idle<br/>connections"]:::brown

    A --- B --- C --- D --- E

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => NewPgPool creates a pgxpool.Pool with production-grade connection settings.
func NewPgPool(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
    // => ParseConfig converts the DSN into a structured config object.
    cfg, err := pgxpool.ParseConfig(dsn)
    if err != nil {
        return nil, fmt.Errorf("parse dsn: %w", err)
    }

    // => MaxConns: ceiling on DB connections from this process.
    // => Prevents a single pod from exhausting all Postgres max_connections.
    // => Rule of thumb: (Postgres max_connections / pod count) * 0.8
    cfg.MaxConns = 20

    // => MinConns: keep these connections open even at idle.
    // => Eliminates cold-start latency spikes on the first post-idle requests.
    cfg.MinConns = 5

    // => MaxConnLifetime: recycle connections after this duration.
    // => Prevents TCP stale-connection issues when a load balancer terminates idle connections.
    cfg.MaxConnLifetime = 30 * time.Minute

    // => MaxConnIdleTime: release a connection back to the OS if idle for this long.
    // => Prevents pool from holding 20 connections during a 3AM quiet period.
    cfg.MaxConnIdleTime = 5 * time.Minute

    // => HealthCheckPeriod: send a lightweight ping to idle connections on this cadence.
    // => Evicts broken connections before an application request discovers them.
    cfg.HealthCheckPeriod = time.Minute

    return pgxpool.NewWithConfig(ctx, cfg)
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => new_pg_pool creates an sqlx PgPool with production connection settings.
pub async fn new_pg_pool(dsn: &str) -> Result<sqlx::PgPool, sqlx::Error> {
    sqlx::postgres::PgPoolOptions::new()
        // => max_connections: ceiling on connections per process instance.
        // => Keep below Postgres max_connections / expected pod count.
        .max_connections(20)
        // => min_connections: pool maintains at least this many open connections.
        // => Eliminates cold-start latency on the first wave of requests after idle.
        .min_connections(5)
        // => max_lifetime: recycle connections after this duration.
        // => Avoids accumulating stale TCP sessions behind NAT or load balancers.
        .max_lifetime(Duration::from_secs(1800))
        // => idle_timeout: close a connection that has been idle for this long.
        // => Reduces DB-side connection count during off-peak periods.
        .idle_timeout(Duration::from_secs(300))
        // => acquire_timeout: fail fast if no connection is available within this window.
        // => Prevents requests from queuing indefinitely behind a pool-starved service.
        .acquire_timeout(Duration::from_secs(5))
        .connect(dsn)
        .await
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: `MaxConnLifetime` is the most commonly missed setting — without it, long-lived TCP connections survive load balancer restarts and begin producing cryptic network errors days after deployment.

---

### Example 75: Full Production Hexagon — Integration Test

The complete production hexagon tested end-to-end: HTTP request arrives at the router, flows through the application service and all decorated adapters, writes to a real Postgres instance in a testcontainer, and returns the correct HTTP response. This test is the final verification that the composition root wires everything correctly.

```mermaid
sequenceDiagram
    accTitle: Example 75: Full Production Hexagon — Integration Test
    accDescr: Sequence diagram between Test, HTTP40POST /api/purchase-orders41, POService, InstrumentedRepo, RetryRepo, PostgresTestcontainer. Messages: Test to HTTP40POST /api/purchase-orders41: POST /api/purchase-orders lines: [...]; HTTP40POST /api/purchase-orders41 to POService: IssuePurchaseOrder(cmd); POService to InstrumentedRepo: Save(ctx, po); InstrumentedRepo to RetryRepo: Save(ctx, po) [with metrics]; RetryRepo to PostgresTestcontainer: INSERT purchase_orders; PostgresTestcontainer to RetryRepo: OK; RetryRepo to InstrumentedRepo: nil; InstrumentedRepo to POService: nil (metrics recorded); POService to HTTP40POST /api/purchase-orders41: po.Id; HTTP40POST /api/purchase-orders41 to Test: 201 Created id: po-uuid; Test to HTTP40POST /api/purchase-orders41: GET /api/purchase-orders/id; HTTP40POST /api/purchase-orders41 to Test: 200 OK status: DRAFT.
    participant T as Test
    participant H as HTTP#40;POST /api/purchase-orders#41;
    participant AS as POService
    participant IR as InstrumentedRepo
    participant RR as RetryRepo
    participant DB as PostgresTestcontainer

    T->>H: POST /api/purchase-orders {lines: [...]}
    H->>AS: IssuePurchaseOrder(cmd)
    AS->>IR: Save(ctx, po)
    IR->>RR: Save(ctx, po) [with metrics]
    RR->>DB: INSERT purchase_orders
    DB-->>RR: OK
    RR-->>IR: nil
    IR-->>AS: nil (metrics recorded)
    AS-->>H: po.Id
    H-->>T: 201 Created {id: "po-uuid"}
    T->>H: GET /api/purchase-orders/{id}
    H-->>T: 200 OK {status: "DRAFT"}

    %% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
```

{{< tabs items="Go,Rust" >}}
{{< tab >}}

```go
// => TestFullCreatePOFlow exercises the complete hexagon with a real Postgres container.
// => Uses testcontainers-go to spin up an isolated database per test run.
func TestFullCreatePOFlow(t *testing.T) {
    ctx := context.Background()

    // => Start a Postgres container; terminated automatically when test ends.
    pgContainer, err := postgres.RunContainer(ctx,
        testcontainers.WithImage("postgres:16-alpine"),
        postgres.WithDatabase("testdb"),
        postgres.WithUsername("test"),
        postgres.WithPassword("test"),
        testcontainers.WithWaitStrategy(
            wait.ForLog("database system is ready to accept connections"),
        ),
    )
    require.NoError(t, err)
    defer pgContainer.Terminate(ctx)

    // => Obtain the connection string from the running container.
    connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
    require.NoError(t, err)

    // => Build the full app with real DB; observability uses no-ops in tests.
    app, err := BuildApp(AppConfig{
        DatabaseURL: connStr,
        ERPBaseURL:  "http://localhost:0", // unused — stub ACL in test build
        ServerPort:  0,                   // use httptest.NewServer
        LogLevel:    "error",
        MaxRetries:  3,
        ServiceName: "test",
    })
    require.NoError(t, err)

    // => httptest.NewServer binds an ephemeral port; avoids port conflicts.
    ts := httptest.NewServer(app.Router())
    defer ts.Close()

    // => POST /api/purchase-orders with a valid payload.
    body := `{"supplier_id":"S001","lines":[{"sku":"SKU-1","qty":10,"unit_price":100}]}`
    resp, err := http.Post(
        ts.URL+"/api/purchase-orders",
        "application/json",
        strings.NewReader(body),
    )
    require.NoError(t, err)
    // => Expect 201 Created with the new PO ID in the response body.
    assert.Equal(t, http.StatusCreated, resp.StatusCode)

    var created struct{ ID string `json:"id"` }
    require.NoError(t, json.NewDecoder(resp.Body).Decode(&created))
    assert.NotEmpty(t, created.ID)

    // => GET /api/purchase-orders/{id} — verify the PO was persisted correctly.
    getResp, err := http.Get(ts.URL + "/api/purchase-orders/" + created.ID)
    require.NoError(t, err)
    assert.Equal(t, http.StatusOK, getResp.StatusCode)

    var po struct{ Status string `json:"status"` }
    require.NoError(t, json.NewDecoder(getResp.Body).Decode(&po))
    // => Newly created POs start in DRAFT status.
    assert.Equal(t, "DRAFT", po.Status)
}
```

{{< /tab >}}
{{< tab >}}

```rust
// => test_full_create_po_flow exercises the complete hexagon with a real Postgres testcontainer.
#[tokio::test]
async fn test_full_create_po_flow() {
    // => testcontainers::RunnableImage starts a Postgres container for this test.
    let pg = testcontainers::clients::Cli::default();
    let postgres_image = testcontainers_modules::postgres::Postgres::default();
    let container = pg.run(postgres_image);
    // => connection_string builds the DSN from the container's ephemeral port.
    let port = container.get_host_port_ipv4(5432);
    let dsn = format!(
        "postgres://postgres:postgres@localhost:{}/postgres",
        port
    );

    // => Build the full app wired to the testcontainer DB.
    // => NoopMetrics and NoopTracer are injected because production adapters
    // => require external collectors not available in CI.
    let cfg = AppConfig {
        database_url: dsn,
        erp_base_url: "http://localhost:0".to_string(),
        server_port: 0,
        log_level: "error".to_string(),
        max_retries: 3,
        service_name: "test".to_string(),
    };
    let app = build_app(cfg).await.expect("build_app failed");

    // => axum::Router::into_service lets us call the router without binding a port.
    let client = axum_test::TestClient::new(app.router());

    // => POST /api/purchase-orders — create a new PO.
    let resp = client
        .post("/api/purchase-orders")
        .json(&serde_json::json!({
            "supplier_id": "S001",
            "lines": [{"sku": "SKU-1", "qty": 10, "unit_price": 100}]
        }))
        .await;
    // => Expect 201 Created with PO UUID in the body.
    assert_eq!(resp.status(), 201);
    let created: serde_json::Value = resp.json().await;
    let id = created["id"].as_str().expect("id field missing");
    assert!(!id.is_empty());

    // => GET /api/purchase-orders/{id} — confirm the PO was persisted.
    let get_resp = client
        .get(&format!("/api/purchase-orders/{}", id))
        .await;
    assert_eq!(get_resp.status(), 200);
    let po: serde_json::Value = get_resp.json().await;
    // => Newly issued POs start in DRAFT status.
    assert_eq!(po["status"], "DRAFT");
}
```

{{< /tab >}}
{{< /tabs >}}

> **Key takeaway**: An end-to-end integration test with a real testcontainer database is the only test that validates the composition root — unit tests with in-memory adapters cannot catch wiring bugs, SQL schema mismatches, or connection pool misconfiguration.
