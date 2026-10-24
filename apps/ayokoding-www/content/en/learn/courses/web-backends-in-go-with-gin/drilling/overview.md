---
title: "Drilling"
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 50
---

Drilling turns the sixteen concepts into recall, application, and habit. Work the recall questions from memory, solve the applied problems with an editor open, complete each kata starting from its Before starter before reading the After, run the checklist aloud, and argue with the interrogation prompts before reading the model answers.

## Recall Q&A

Twenty-four short-answer questions covering each of co-01 to co-16. Answer from memory, then check. Star the ones you miss and repeat them after a day; spaced repetition only works when the misses decide what comes back.

### Q1 (co-01): What does one Gin route map, and what picks the handler when paths overlap?

<details><summary>Answer</summary>

One method plus one path maps to one handler function, as in Example 1. When a literal path and a capture overlap, the literal always wins regardless of registration order, as Example 2 proves by registering the capture first and still serving /users/new literally.

</details>

### Q2 (co-01): Why does a wrong verb answer 405 instead of 404, and what switches that on?

<details><summary>Answer</summary>

404 claims the path is missing, which lies when the path exists under other verbs; 405 names the real problem so the client fixes the verb. Example 4 switches it on with HandleMethodNotAllowed, and Example 52 proves the matrix: hits per verb, 404 for unknown paths, 405 for wrong verbs on known paths.

</details>

### Q3 (co-02): Where does middleware run relative to the handler, and what decides the order?

<details><summary>Answer</summary>

Code before c.Next runs on the way in, code after it runs on the way out, forming an onion. Registration order is the onion order: first registered runs first going in and last coming out, as Example 28 records step by step. Example 73 shows the same onion both frameworks build.

</details>

### Q4 (co-02): How does a middleware stop the chain, and when should it?

<details><summary>Answer</summary>

AbortWithStatusJSON answers from the middleware and prevents every later handler from running, as the auth guard in Example 27 does for strangers. Stop the chain for policy decisions (auth, rate limits, CORS preflight) and continue it for observations (ids, logging, counting), so admitted requests still reach their handlers.

</details>

### Q5 (co-03): What is the difference between ShouldBindJSON, ShouldBindQuery, and ShouldBindUri?

<details><summary>Answer</summary>

Each reads a different part of the request into a struct: ShouldBindJSON parses the body per its Content-Type (Example 9), ShouldBindQuery parses the URL query with defaults for absent keys (Example 12), and ShouldBindUri converts path captures with validation (Example 13). ShouldBind without a suffix switches on the Content-Type automatically (Example 16).

</details>

### Q6 (co-03): Where do validation rules live, and when do they run?

<details><summary>Answer</summary>

Rules live as binding tags on the struct fields next to the shape they protect, and they run during the bind call — before the handler logic sees the value. Example 10 shows required, email, min, and gt rejecting bad bodies; Example 11 registers a custom weekday rule through the underlying validator for domain logic tags cannot express.

</details>

### Q7 (co-04): What does each outcome code promise: 200, 201, 204, 400, 404?

<details><summary>Answer</summary>

200 found with a body, 201 created with the new shape, 204 gone with no body, 400 bad input blaming the body, 404 missing naming the absence — Example 18 serves all five on one resource. Codes are the first language clients, proxies, and monitoring read, so each outcome owns its code instead of reusing 200.

</details>

### Q8 (co-04): How do JSON tags shape the wire contract, and what never leaves the server?

<details><summary>Answer</summary>

Tags rename fields, omitempty drops empty ones, and unexported fields never serialize at all — Example 19 hides a password hash by construction rather than by review discipline. The struct is the contract: rename keys to decouple Go names from the public API, omit empties to keep payloads honest, and keep internals unexported so they cannot leak.

</details>

### Q9 (co-05): What does the shared error envelope contain, and why must every failure share it?

<details><summary>Answer</summary>

Code plus message under an error key, always — Example 24 funnels validation, missing, and policy failures through one fail helper. Clients parse one shape for the whole API and switch on the machine-readable code; handlers choose status and fields but never invent new nesting, so one parsing path serves every endpoint including the capstone's.

</details>

### Q10 (co-05): When is a 422 or 410 more honest than a 400 or 404?

<details><summary>Answer</summary>

400 means the body failed to parse or validate; 422 means the shape parsed but the value is unacceptable, like a zero divisor or a flying status (Examples 24 and 75). 404 means not here; 410 means gone for policy reasons, like a retired item clients should stop requesting (Example 75). The status tells retry logic what to do; the envelope shape never varies.

</details>

### Q11 (co-06): What are the three dependency styles, and when does each win?

<details><summary>Answer</summary>

Closures capture a store directly and suit one or two routes (Example 35); interfaces hide implementations so memory, SQL, and stubs swap behind one seam (Examples 36 and 40); constructors take dependencies as parameters and return wired engines tests build without main (Examples 38 and 74). Closures for size, interfaces for swaps, constructors for testability.

</details>

### Q12 (co-06): How does context injection differ from constructor injection, and what guards each?

<details><summary>Answer</summary>

Constructor injection supplies service-wide dependencies at build time (NewRouter takes the store); context injection publishes per-request services from middleware with c.Set for handlers to MustGet (Example 37). Constructors are checked by the compiler — wrong types do not build — while context keys need discipline: MustGet panics on missing keys so wiring bugs surface in tests instead of serving nils.

</details>

### Q13 (co-07): Why must shared maps be locked, and what exactly must the lock span?

<details><summary>Answer</summary>

Go panics on concurrent map writes by design, so every access needs a mutex — and the lock must span the whole read-modify-write as one unit, or updates get lost between the read and the store (Example 55). Reads need the lock too, because the map header itself is shared state. The printed total equaling the request count is the proof a lock is correct.

</details>

### Q14 (co-07): How do channels, WaitGroup, and sync.Map divide concurrent work?

<details><summary>Answer</summary>

Channels move ownership: fan jobs out, collect results, close in order, and sort before printing because finish order is random (Example 56). WaitGroup joins: Add before starting, Done on every path, Wait before assembling, so handlers never answer from half-filled maps (Example 58). sync.Map trades the mutex for lock-free per-key counters with LoadOrStore publishing exactly one counter per name (Example 59).

</details>

### Q15 (co-08): What is the graceful shutdown sequence, and what bounds it?

<details><summary>Answer</summary>

Flip readiness first so new traffic sheds with 503, drain in-flight work, then stop — never stop first (Example 66). Shutdown waits for in-flight requests (Example 63) but only up to its deadline: when work outlasts the bound, it returns the deadline error instead of hanging forever (Example 64). Close is for tests and doomed processes; Shutdown is for production deploys.

</details>

### Q16 (co-08): Why do tests bind ephemeral ports, and what must never be printed?

<details><summary>Answer</summary>

Fixed ports collide between parallel tests and lie about readiness; :0 or httptest.NewServer lets the system assign a free loopback port per test (Example 62). Never print the port: golden output must be byte-stable across machines and runs, so tests assert status and body only. Real sockets stay on loopback — no packet ever leaves the machine in this course.

</details>

### Q17 (co-09): What is the one testing move this course repeats, and how do tables scale it?

<details><summary>Answer</summary>

Serve a request through the router into an httptest recorder — no socket, no network — and assert status plus exact body (Example 45). Tables scale it: list method-path-status-body rows as data, serve each in one loop, print PASS or FAIL per row, and never stop at the first failure so one run shows the full damage (Example 46).

</details>

### Q18 (co-10): What is the difference between a missing value, a wrong-typed value, and a rule-breaking value?

<details><summary>Answer</summary>

Missing breaks required, wrong-typed breaks conversion (a string where an int belongs fails before any rule runs), and rule-breaking parses but violates a constraint like min or oneof — all three answer 400 through the same envelope. Example 10 shows the layers: absent email fails required, malformed email fails email, short name fails min. Custom rules from Example 11 join the same failure path.

</details>

### Q19 (co-11): How do groups version an API, and what does nesting buy?

<details><summary>Answer</summary>

A group fixes one prefix for every route inside it, so /api/v1 and /api/v2 evolve side by side on one engine without repeated prefixes (Example 5). Groups nest: an admin group inside v1 composes both prefixes into one path. Loop-driven registration from a resource list scales the table — adding a resource appends a data line instead of a code block (Example 44).

</details>

### Q20 (co-12): How does one handler accept JSON, XML, and form, and what stays single?

<details><summary>Answer</summary>

ShouldBind switches on the request Content-Type and fills the same struct through format tags, so one handler accepts all three (Example 16). The response stays one shape — JSON in this course — because accepting broadly while answering narrowly keeps the contract small. Renders like c.XML and c.YAML serve format-specific routes from the same structs when clients need them (Example 20).

</details>

### Q21 (co-13): What makes logs separable under concurrency, and what must logs never contain in tests?

<details><summary>Answer</summary>

Request ids on every line turn concurrent logs into per-request stories: grep the id and the journey appears (Example 61). The default gin logger writes timestamps, so this course wires its own stamping and asserts id plus event only. Golden logs never contain the clock — production shippers add time at collection, while tests assert the shape that humans and machines actually query.

</details>

### Q22 (co-14): What makes a health endpoint trustworthy, and what must it never do?

<details><summary>Answer</summary>

It answers fast from memory with one fixed shape — ok plus version — flipping only the status between 200 and 503 as readiness changes (Example 25). It must never touch a store, a downstream call, or anything that can fail: the endpoint reports the process, and a health check that depends on the database reports the database instead. Keep the keys identical across 200 and 503 so monitors parse one schema.

</details>

### Q23 (co-15): Where does the wire contract live, and how is it frozen?

<details><summary>Answer</summary>

In the struct tags plus the hand-written OpenAPI document: json, xml, yaml, form, uri, and header tags declare every spelling of one shape, and openapi.json served beside the routes lets clients codegen from it (Example 76). Goldens freeze the bytes — the test fails the moment routes and schema disagree, so every contract change becomes a deliberate commit instead of silent drift.

</details>

### Q24 (co-16): What transfers between Gin and FastAPI, and what does not?

<details><summary>Answer</summary>

The onion order, the envelope discipline, the validation-at-the-boundary habit, and the round-trip testing shape transfer directly — Examples 71 to 78 map each one. Spelling does not: decorators become registration calls, Depends becomes constructors, Pydantic models become tagged structs, generated docs become a hand-written schema. Learn the decision in either framework and you can read both; copy the spelling and you can write neither.

</details>

## Applied problems

Eight applied problems. Each names a real situation and the course habit that solves it; work them with an editor open and check your answer against the named example before moving on.

### Problem 1: Name the verb before the path

Three client reports: a form resubmission that created two orders, a bookmark that broke after a rename, and a script that got 404 for a typoed method. For each, decide whether the fix is a 307 redirect preserving POST (Example 7), a 301 permanent move (Example 7), or a 405 naming the allowed verbs (Example 4), and write the one-line status justification the reviewer will read.

### Problem 2: Validate the signup form

A signup takes name, email, and seats. Write the struct with binding tags per Examples 10 and 72 so a one-letter name, a malformed email, and zero seats each fail with 400, then prove all three rejections plus the happy path in-process with a table like Example 46.

### Problem 3: Envelope the legacy handler

Find a handler that answers errors as plain text while successes speak JSON. Funnel all three of its failures through one fail helper per Examples 24 and 75, then run the old and new responses side by side and show the client parser shrinking to one branch.

### Problem 4: Split the god handler

Take a handler that checks the token, counts the call, and serves the answer in one body. Move the token into an aborting middleware and the counting into a wrapping middleware per kata 04, then prove with a spy like Example 51 that strangers never reach the handler and holders are counted once.

### Problem 5: Bound the fan-out

A program launches one goroutine per input line with no limit. Convert it to the three-worker pool from Example 56, sort the results before printing, and explain where the old version would exhaust memory first and why the channel protocol needs exactly three lifetime rules.

### Problem 6: Drain before you stop

A deploy script kills the server mid-request and clients see severed connections. Add readiness flipping before Shutdown per Example 66, bound the drain with a deadline per Example 64, and demonstrate the sequence in-process: open 200, draining 503, drained answer, clean shutdown.

### Problem 7: Freeze the contract

Pick the least-tested JSON endpoint in your own code and write the golden test from Example 49 for it: three frozen bodies, exact match, both sides shown on failure. Change one key deliberately, watch the golden fail, then decide whether the change or the golden was wrong and record why.

### Problem 8: Compare with FastAPI honestly

Take one route you know in FastAPI and rebuild it in Gin following Examples 71 to 78: routes as calls, Depends as a constructor, Pydantic as tagged structs, generated docs as a hand-written schema. List what transferred unchanged, what changed spelling, and which side you would choose for a ten-route service versus a hundred-route one, with reasons.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Make the starter match before peeking. Work them in order: the validation and async katas first, because rules and joins underlie everything; the test, middleware, and dependency katas next, because they train the three reflexes services demand daily; the race, envelope, and shutdown katas after, because each isolates one production judgement.

### Kata 1: Add validation that rejects a malformed body

The starter accepts any JSON with an id, including a zero quantity that makes no business sense. Add binding tags so a missing id or a non-positive qty fails with 400, then prove both rejections plus the happy path in-process.

**Before** (`drilling/code/kata-01-add-validation-rejects-malformed-body/before/starter.go`):

```go
// => Kata 1 starter: creation without validation.
// => The handler binds the body but checks nothing: missing ids and zero
// => quantities sail through. Your task: add binding tags so malformed
// => bodies fail with 400, then prove both rejections in-process.
package main

import (
	"fmt"                     // => prints each creation verdict
	"net/http/httptest"       // => in-process request and recorder
	"strings"                 // => builds request bodies from fixed strings
	"github.com/gin-gonic/gin" // => the router under test
)

// => Order is the creation shape with NO rules yet: add them.
// => TODO: require id, item, and a positive qty with binding tags
type Order struct { // => the shape your tags will protect
	ID   string `json:"id"`   // => TODO: binding:"required"
	Item string `json:"item"` // => TODO: binding:"required"
	Qty  int    `json:"qty"`  // => TODO: binding:"required,gt=0"
}

// => create binds and stores without checking: the gap to close.
func create(store map[string]Order) gin.HandlerFunc { // => the handler you will harden
	return func(c *gin.Context) { // => gin calls this per creation
		var in Order // => the bound shape, unchecked today
		// => TODO: fail with 400 and {"error":"bad order"} when binding fails
		if err := c.ShouldBindJSON(&in); err != nil { // => malformed JSON fails here already
			c.JSON(400, gin.H{"error": "bad json"}) // => today's envelope: keep or reshape
			return // => unparseable input never reaches the store
		}
		store[in.ID] = in // => stored unchecked: zero quantities live here
		c.JSON(201, in) // => 201 even for nonsense: your tags will change this
	}
}

// => newRouter wires the creation route around the injected store.
func newRouter(store map[string]Order) *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	router.POST("/orders", create(store)) // => the route you will prove
	return router // => hand the wired engine back
}

// => check serves one POST and prints the status with the body.
func check(router *gin.Engine, body string) { // => the body string is the variable
	req := httptest.NewRequest("POST", "/orders", strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json") // => JSON bodies bind below
	w := httptest.NewRecorder() // => the assertion surface
	router.ServeHTTP(w, req)    // => today's unchecked binding runs inside
	fmt.Println("POST /orders", body, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter(map[string]Order{}) // => empty store at startup
	// => today both pass: after your tags, only the first may
	check(router, `{"id":"o1","item":"book","qty":2}`) // => good bodies stay 201
	check(router, `{"id":"o2","item":"pen","qty":0}`) // => TODO: this must become 400
}
```

**After** (`drilling/code/kata-01-add-validation-rejects-malformed-body/after/solution.go`):

```go
// => Kata 1 solution: creation with validation enforced.
// => Binding tags reject malformed bodies before the store sees them: a
// => missing id or a non-positive qty fails with 400 and the bad_order
// => envelope, while good bodies echo back 201.
package main

import (
	"fmt"                     // => prints each creation verdict
	"net/http/httptest"       // => in-process request and recorder
	"strings"                 // => builds request bodies from fixed strings
	"github.com/gin-gonic/gin" // => tag validation on bind
)

// => Order is the creation shape with its rules attached to each field.
// => required, gt=0: the tags that close the starter's gap
type Order struct { // => rules live with the shape they protect
	ID   string `json:"id" binding:"required"`          // => identity is mandatory
	Item string `json:"item" binding:"required"`       // => contents are mandatory too
	Qty  int    `json:"qty" binding:"required,gt=0"`    // => zero quantities fail here now
}

// => create binds, validates, and stores: invalid input never lands.
func create(store map[string]Order) gin.HandlerFunc { // => the hardened handler
	return func(c *gin.Context) { // => gin calls this per creation
		var in Order // => the target: zero Order until binding fills it
		// => tags run here: missing id or non-positive qty fails
		if err := c.ShouldBindJSON(&in); err != nil { // => first broken rule fails
			c.JSON(400, gin.H{"error": "bad order"}) // => fixed envelope, no internals
			return // => invalid input never reaches the store
		}
// => the store trusts binding now: tags guard the gate
		store[in.ID] = in // => only validated orders land here
// => creation echoes the validated shape, never the raw body
		c.JSON(201, in) // => 201 with the validated shape
	}
}

// => newRouter wires the creation route around the injected store.
func newRouter(store map[string]Order) *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	router.POST("/orders", create(store)) // => the proven route
	return router // => hand the wired engine back
}

// => check serves one POST and prints the status with the body.
func check(router *gin.Engine, body string) { // => the body string is the variable
	req := httptest.NewRequest("POST", "/orders", strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json") // => JSON bodies bind below
	w := httptest.NewRecorder() // => the assertion surface
	router.ServeHTTP(w, req)    // => validated binding runs inside
	fmt.Println("POST /orders", body, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter(map[string]Order{}) // => empty store at startup
	// => the good body passes validation: 201 with the stored shape
	check(router, `{"id":"o1","item":"book","qty":2}`) // => Output: POST /orders {"id":"o1","item":"book","qty":2} -> 201 {"id":"o1","item":"book","qty":2}
	// => zero qty breaks gt=0: 400 with the fixed envelope
// => zero qty proves the tag: gt=0 rejects what required allowed
	check(router, `{"id":"o2","item":"pen","qty":0}`) // => Output: POST /orders {"id":"o2","item":"pen","qty":0} -> 400 {"error":"bad order"}
}
```

**Output** (`drilling/code/kata-01-add-validation-rejects-malformed-body/expected/main.stdout.txt`):

```text
POST /orders {"id":"o1","item":"book","qty":2} -> 201 {"id":"o1","item":"book","qty":2}
POST /orders {"id":"o2","item":"pen","qty":0} -> 400 {"error":"bad order"}
```

### Kata 2: Convert a blocking call into the async idiom

The starter fetches the greeting inline, so the handler owns the wait. Move the fetch into a goroutine, join it through a channel before answering, and prove the assembled greeting prints unchanged.

**Before** (`drilling/code/kata-02-blocking-call-becomes-a-goroutine/before/starter.go`):

```go
// => Kata 2 starter: inline fetch blocks the handler.
// => The greeting is fetched inline: the handler owns the wait and cannot
// => do anything else meanwhile. Your task: move the fetch into a
// => goroutine, join it through a channel, and answer only after the join.
package main

import (
	"fmt"                     // => prints the assembled greeting
	"net/http/httptest"       // => in-process request and recorder
	"github.com/gin-gonic/gin" // => the handler you will free
)

// => fetchTitle pretends to retrieve a title: fixed bytes, no I/O.
// => the stand-in slow call: inline today, goroutine after your change
func fetchTitle(name string) string { // => the work to move off the line
	return "Dr " + name // => fixed bytes: the wait is simulated, not real
}

// => greet fetches inline and answers: the blocking shape to convert.
// => TODO: go func with a channel, then join before answering
func greet(c *gin.Context) { // => the handler that waits inline today
	// => inline fetch: the handler is occupied for the whole call
	title := fetchTitle(c.Param("name")) // => TODO: move this into go func
	c.JSON(200, gin.H{"greeting": "hello, " + title}) // => answer after the wait
}

// => newRouter wires the single greeting route you will free.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	router.GET("/greet/:name", greet) // => the route to convert
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the name is the variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                   // => the assertion surface
	router.ServeHTTP(w, req)                      // => today's inline fetch runs inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => inline today: your conversion must print this exact line
	check(router, "/greet/Sari") // => the assembled greeting, unchanged after
}
```

**After** (`drilling/code/kata-02-blocking-call-becomes-a-goroutine/after/solution.go`):

```go
// => Kata 2 solution: the fetch joins before the answer.
// => The fetch moved into a goroutine and the handler joins it through a
// => buffered channel: same greeting, free handler meanwhile. Answering
// => only after the join keeps the guarantee the inline version had.
package main

import (
	"fmt"                     // => prints the assembled greeting
	"net/http/httptest"       // => in-process request and recorder
	"github.com/gin-gonic/gin" // => the handler that fans out and joins
)

// => fetchTitle pretends to retrieve a title: fixed bytes, no I/O.
// => the same stand-in: only its calling shape changed
func fetchTitle(name string) string { // => the work, now off the line
	return "Dr " + name // => fixed bytes: the wait is simulated, not real
}

// => greet fans the fetch out, joins it, and answers with the result.
// => the goroutine plus channel is the async idiom: same guarantee
func greet(c *gin.Context) { // => the handler that waits at the join
	name := c.Param("name") // => the name travels into the goroutine
	done := make(chan string, 1) // => buffered: the fetch never blocks
	go func() {                // => the fetch leaves the handler line
		done <- fetchTitle(name) // => the title travels back
	}()
	// => join before answering: the response waits for the work, always
	title := <-done // => block until the fetch completes: the await point
	c.JSON(200, gin.H{"greeting": "hello, " + title}) // => assembled after the join
}

// => newRouter wires the single converted route.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	router.GET("/greet/:name", greet) // => the converted route
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the name is the variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                   // => the assertion surface
	router.ServeHTTP(w, req)                      // => fan-out and join run inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => joined, not inline: the greeting prints byte-identical
	check(router, "/greet/Sari") // => Output: GET /greet/Sari -> 200 {"greeting":"hello, Dr Sari"}
}
```

**Output** (`drilling/code/kata-02-blocking-call-becomes-a-goroutine/expected/main.stdout.txt`):

```text
GET /greet/Sari -> 200 {"greeting":"hello, Dr Sari"}
```

### Kata 3: Write an in-process test for a new route

The starter serves a doubling route with no test at all. Add a go test file with two subtests — one doubling case and one unknown path — served through httptest, and prove both verdicts log their contracts.

**Before** (`drilling/code/kata-03-in-process-test-for-a-new-route/before/starter.go`):

```go
// => Kata 3 starter: a route with no test.
// => The doubling route serves but nothing proves it: no test file exists.
// => Your task: add router_test.go with two subtests (one doubling case,
// => one unknown path) served through httptest, logging each contract.
package main

import (
	"fmt"                     // => parses the doubled value (starter demo)
	"net/http/httptest"       // => you will serve through this in tests
	"github.com/gin-gonic/gin" // => the router your tests will build
)

// => NewRouter wires the doubling route your tests will prove.
// => exported so the test file you write builds it directly
func NewRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for test output
	router := gin.New()        // => bare engine: no hidden middleware
// => the route your tests will build through NewRouter
	router.GET("/double/:n", func(c *gin.Context) { // => the untested route
		n := 0 // => the parsed value, or zero when unparseable
		fmt.Sscanf(c.Param("n"), "%d", &n) // => one integer from the path
		c.JSON(200, gin.H{"doubled": n * 2}) // => the contract to prove
	})
	return router // => hand the wired engine back
}
```

**After** (`drilling/code/kata-03-in-process-test-for-a-new-route/after/router.go`):

```go
// => Kata 3 solution: the doubling route, unchanged.
// => The route needed no fix, only proof: the test file beside it serves
// => two subtests in-process and logs the contract each proves.
package main

import (
	"fmt"                     // => parses the doubled value
	"github.com/gin-gonic/gin" // => the router under test
)

// => NewRouter wires the doubling route the tests prove.
// => exported so router_test.go builds it directly
func NewRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for test output
	router := gin.New()        // => bare engine: no hidden middleware
	router.GET("/double/:n", func(c *gin.Context) { // => the proven route
		n := 0 // => the parsed value, or zero when unparseable
		fmt.Sscanf(c.Param("n"), "%d", &n) // => one integer from the path
		c.JSON(200, gin.H{"doubled": n * 2}) // => the contract under test
	})
	return router // => hand the wired engine back
}
```

**After** (`drilling/code/kata-03-in-process-test-for-a-new-route/after/router_test.go`):

```go
// => Kata 3 solution tests: two subtests prove the doubling route.
// => One doubling case plus one unknown path, served in-process through
// => httptest. Run with go test -v: timing is normalized away before the
// => golden comparison.
package main

import (
	"net/http/httptest" // => in-process request and recorder
	"testing"            // => the test toolchain: Run, Logf, Errorf
)

// => TestDouble serves the contract table through one shared router.
// => one doubling proof plus one absence proof, both logged
func TestDouble(t *testing.T) { // => the single test with two cases
	router := NewRouter() // => built once: construction is not under test
	cases := []struct {   // => the table: path in, status and body out
		name string // => the subtest name, shown in verbose output
		path string // => the request path under test
		code int    // => the expected status
		body string // => the expected body, exact
	}{ // => two rows: the double and the defined absence
		{"seven doubles to fourteen", "/double/7", 200, `{"doubled":14}`}, // => the doubling contract
		{"unknown is 404", "/halve/7", 404, "404 page not found"},             // => absences are defined too
	}
	for _, tc := range cases { // => one subtest per row, in table order
		tc := tc // => capture the loop variable: subtests keep their own
// => the name shows in -v output: failures point at their row
		t.Run(tc.name, func(t *testing.T) { // => the subtest: named, isolated
			req := httptest.NewRequest("GET", tc.path, nil) // => server-side request, no socket
			w := httptest.NewRecorder()                   // => the assertion surface
			router.ServeHTTP(w, req)                      // => full pipeline, minus the network
			if w.Code != tc.code {                        // => the status must match first
// => codes disagree loudly: got versus want, both printed
				t.Errorf("status = %d, want %d", w.Code, tc.code) // => both sides on failure
			}
			if w.Body.String() != tc.body { // => then the exact body
				t.Errorf("body = %s, want %s", w.Body.String(), tc.body) // => both sides on failure
			}
// => the proof names path, code, and body: the whole contract
			t.Logf("holds: %s -> %d %s", tc.path, tc.code, tc.body) // => the proof line per case
		})
	}
}
```

**Output** (`drilling/code/kata-03-in-process-test-for-a-new-route/expected/test.stdout.txt`):

```text
=== RUN   TestDouble
=== RUN   TestDouble/seven_doubles_to_fourteen
    router_test.go:40: holds: /double/7 -> 200 {"doubled":14}
=== RUN   TestDouble/unknown_is_404
    router_test.go:40: holds: /halve/7 -> 404 404 page not found
--- PASS: TestDouble
    --- PASS: TestDouble/seven_doubles_to_fourteen
    --- PASS: TestDouble/unknown_is_404
PASS
```

### Kata 4: Chain auth and logging middleware

The starter checks the token inside the handler and logs nothing. Move the token check into an aborting middleware and the request counting into a wrapping middleware, then prove a stranger is blocked and a holder is counted.

**Before** (`drilling/code/kata-04-middleware-chain-auth-and-logging/before/starter.go`):

```go
// => Kata 4 starter: auth and counting buried in the handler.
// => The handler checks the token itself and counts nothing: cross-cutting
// => work hides in route logic. Your task: move the token check into an
// => aborting middleware and the counting into a wrapping middleware, then
// => prove a stranger is blocked and a holder is counted.
package main

import (
	"fmt"                     // => prints each answer
	"net/http/httptest"       // => in-process request and recorder
	"github.com/gin-gonic/gin" // => the router you will wrap
)

// => vault answers only holders, counting inline: the shape to unwrap.
// => TODO: guard middleware aborts strangers; counter middleware counts
func vault(c *gin.Context) { // => today's handler does everything itself
	// => TODO: move this check into requireUser middleware with Abort
	if c.GetHeader("Authorization") != "Bearer s3cret" { // => inline auth: every handler repeats this
		c.JSON(401, gin.H{"error": "no entry"}) // => inline 401: the guard you will extract
		return // => strangers stop here, but inside the handler
	}
	// => TODO: count admitted requests in a wrapping middleware instead
// => served marks admission: strangers never reach this line
	c.String(200, "served") // => the answer only holders see
}

// => newRouter wires the single route you will wrap twice.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: middleware added by you
	router.GET("/vault", vault) // => TODO: guard, then count, then vault
	return router // => hand the wired engine back
}

// => check serves one GET with a token and prints the answer.
func check(router *gin.Engine, token string) { // => empty token exercises the block
	req := httptest.NewRequest("GET", "/vault", nil) // => fixed path, varying token
	if token != "" {                               // => named holders send their bearer
		req.Header.Set("Authorization", "Bearer "+token) // => the credential under test
	}
	w := httptest.NewRecorder() // => the assertion surface
	router.ServeHTTP(w, req)    // => today's inline check runs inside
	fmt.Println("token=", token, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => inline today: your middlewares must print these exact lines
	check(router, "") // => strangers blocked, handler counts nothing
	check(router, "s3cret") // => holders admitted, still uncounted
}
```

**After** (`drilling/code/kata-04-middleware-chain-auth-and-logging/after/solution.go`):

```go
// => Kata 4 solution: guard aborts, counter wraps, handler serves.
// => The token check moved into aborting middleware and the counting into
// => a wrapping middleware: the handler serves only admitted requests,
// => and the counts prove both strangers never arrived and holders did.
package main

import (
	"fmt"                     // => prints each answer with its count
	"net/http/httptest"       // => in-process request and recorder
	"github.com/gin-gonic/gin" // => the chained middlewares
)

// => counted admits nobody itself: it wraps the chain and counts completions.
type counted struct { // => the shared counting state
	hits int // => admitted requests observed so far
}

// => count wraps the chain: strangers aborted below never reach the increment.
func (k *counted) count(c *gin.Context) { // => the outer layer
	c.Next() // => the guard and handler run inside
	if c.Writer.Status() == 200 { // => only completed answers count
// => 401s skip the increment: only completions count
// => increments happen past the guard: counted means admitted
		k.hits++ // => strangers aborted with 401 never arrive here
	}
}

// => guard aborts strangers before the handler: admitted requests continue.
func guard(c *gin.Context) { // => the inner layer, closest to the handler
	if c.GetHeader("Authorization") != "Bearer s3cret" { // => one fixed token
		c.AbortWithStatusJSON(401, gin.H{"error": "no entry"}) // => strangers stop here
		return // => the handler and the count never run for strangers
	}
// => admitted requests flow inward: the handler runs next
	c.Next() // => holders continue to the handler
}

// => vault serves admitted requests: the guard already did the checking.
func vault(c *gin.Context) { // => small again: guards live outside
// => served marks admission: strangers never reach this line
	c.String(200, "served") // => the answer only holders see
}

// => newRouter chains counting outside the guard outside the handler.
func newRouter(k *counted) *gin.Engine { // => the counter arrives injected
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: middleware added by hand
// => registration order is execution order: count outside, guard inside
	router.GET("/vault", k.count, guard, vault) // => wrap, guard, serve: in that order
	return router // => hand the wired engine back
}

// => check serves one GET with a token and prints the answer with the count.
func check(k *counted, router *gin.Engine, token string) { // => the ledger travels with the check
	req := httptest.NewRequest("GET", "/vault", nil) // => fixed path, varying token
	if token != "" {                               // => named holders send their bearer
		req.Header.Set("Authorization", "Bearer "+token) // => the credential under test
	}
	w := httptest.NewRecorder() // => the assertion surface
	router.ServeHTTP(w, req)    // => count, guard, and handler run in order
	fmt.Println("token=", token, "->", w.Code, w.Body.String(), "count=", k.hits) // => one golden line
}

func main() {
	k := &counted{}      // => empty ledger at startup
	router := newRouter(k) // => wrap, guard, serve: wiring separate from traffic
	// => the stranger aborts at the guard: uncounted, 401
	check(k, router, "") // => Output: token=  -> 401 {"error":"no entry"} count= 0
	// => the holder passes both layers: served, counted once
	check(k, router, "s3cret") // => Output: token= s3cret -> 200 served count= 1
}
```

**Output** (`drilling/code/kata-04-middleware-chain-auth-and-logging/expected/main.stdout.txt`):

```text
token=  -> 401 {"error":"no entry"} count= 0
token= s3cret -> 200 served count= 1
```

### Kata 5: Split the handler from its dependency

The starter closes over a map type directly, so no other implementation can slot in. Define a Store interface with Get and Add, inject it through the constructor, and prove the memory implementation answers both reads.

**Before** (`drilling/code/kata-05-split-handler-from-dependency/before/starter.go`):

```go
// => Kata 5 starter: handlers closed over a concrete map.
// => The routes capture *map state directly: swapping implementations
// => means rewriting every handler. Your task: define a Store interface
// => with Get and Add, inject it through the constructor, and prove the
// => memory implementation answers both reads below.
package main

import (
	"fmt"                     // => prints each answer
	"net/http/httptest"       // => in-process request and recorder
	"github.com/gin-gonic/gin" // => the routes you will unplug from the map
)

// => newRouter closes both routes over the same concrete map.
// => TODO: depend on a Store interface; inject the memory one here
func newRouter(stock map[string]int) *gin.Engine { // => the concrete type to replace
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	router.GET("/stock/:sku", func(c *gin.Context) { // => read through the map
		c.JSON(200, gin.H{"qty": stock[c.Param("sku")]}) // => concrete access: your seam goes here
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                   // => in-memory response capture
	router.ServeHTTP(w, req)                      // => today's concrete access runs inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter(map[string]int{"bolt": 4}) // => concrete map at the edge
	// => direct today: your interface must print these exact lines
	check(router, "/stock/bolt") // => four on hand through the seam
	check(router, "/stock/nut") // => zero through the seam as well
}
```

**After** (`drilling/code/kata-05-split-handler-from-dependency/after/solution.go`):

```go
// => Kata 5 solution: handlers depend on the Store interface.
// => The routes call Get on an injected Store: the memory implementation
// => slots in at the edge, and SQL would slot into the same parameter
// => without touching a handler.
package main

import (
	"fmt"                     // => prints each answer
	"net/http/httptest"       // => in-process request and recorder
	"github.com/gin-gonic/gin" // => routes depend on the interface
)

// => Store is the counting contract: implementations decide where counts live.
// => handlers name Store, never the map: swaps touch one line
type Store interface { // => the seam the memory type implements
	Get(sku string) int      // => read the current count, zero when absent
	Add(sku string, n int) int // => add n and return the new total
}

// => memory is the map-backed Store for development and these checks.
type memory struct { // => the implementation handlers never name
	stock map[string]int // => the same map, now behind methods
}

// => Get reads one SKU, answering zero for unknown ones.
func (m *memory) Get(sku string) int { // => pointer receiver: the map is shared
	return m.stock[sku] // => missing keys read zero, like before
}

// => Add grows one SKU and returns the new total.
func (m *memory) Add(sku string, n int) int { // => mutation behind the interface
	m.stock[sku] += n // => the map still does the real work
	return m.stock[sku] // => callers print the total without re-reading
}

// => newRouter wires count routes against the Store interface.
// => Store (not *memory) is the parameter: any implementation fits
func newRouter(s Store) *gin.Engine { // => the seam is the signature
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	router.GET("/stock/:sku", func(c *gin.Context) { // => read through the interface
		c.JSON(200, gin.H{"qty": s.Get(c.Param("sku"))}) // => zero for unknown SKUs
	})
	router.POST("/stock/:sku/add/:n", func(c *gin.Context) { // => write through the interface
		n := 0 // => the parsed amount, or zero when unparseable
		fmt.Sscanf(c.Param("n"), "%d", &n) // => one integer from the path
		c.JSON(201, gin.H{"qty": s.Add(c.Param("sku"), n)}) // => 201 with the new total
	})
	return router // => hand the wired engine back
}

// => check serves one request in-process and prints method, status, and body.
func check(router *gin.Engine, method string, target string) { // => method and path vary
	req := httptest.NewRequest(method, target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                   // => in-memory response capture
	router.ServeHTTP(w, req)                      // => the interface serves every call
	fmt.Println(method, target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	// => the implementation is chosen once, at the edge: memory here
	router := newRouter(&memory{stock: map[string]int{"bolt": 4}}) // => handlers see Store, never *memory
	// => reads cross the interface: same answers, new seam
	check(router, "GET", "/stock/bolt") // => Output: GET /stock/bolt -> 200 {"qty":4}
	check(router, "GET", "/stock/nut") // => Output: GET /stock/nut -> 200 {"qty":0}
	// => writes cross it too: the total becomes seven behind the seam
	check(router, "POST", "/stock/bolt/add/3") // => Output: POST /stock/bolt/add/3 -> 201 {"qty":7}
}
```

**Output** (`drilling/code/kata-05-split-handler-from-dependency/expected/main.stdout.txt`):

```text
GET /stock/bolt -> 200 {"qty":4}
GET /stock/nut -> 200 {"qty":0}
POST /stock/bolt/add/3 -> 201 {"qty":7}
```

### Kata 6: Fix the race under load with a mutex

The starter counts visits in a plain map that panics under concurrent workers. Guard every access with a mutex spanning the whole read-modify-write, then prove ninety-six concurrent visits total exactly ninety-six.

**Before** (`drilling/code/kata-06-race-under-load-uses-a-mutex/before/starter.go`):

```go
// => Kata 6 starter: an unguarded counter under load.
// => The visits map is shared with no lock: concurrent workers race on it,
// => and Go panics on concurrent map writes. Your task: guard every access
// => with a mutex spanning the whole read-modify-write, then prove
// => ninety-six concurrent visits total exactly ninety-six.
package main

import (
	"fmt"                     // => prints the totals your lock will protect
	"net/http/httptest"       // => in-process requests by the hundred
	"sync"                    // => workers plus the mutex you will add
	"sync/atomic"             // => race-free outcome counters
	"github.com/gin-gonic/gin" // => the stateful router under load
)

// => counter is the shared visit ledger: add your mutex here.
// => TODO: mu sync.Mutex plus Lock/Unlock around every map access
type counter struct { // => the state every request mutates
	hits map[string]int // => TODO: guard me: concurrent writes panic today
}

// => visit records one hit: the read-modify-write your lock will span.
// => TODO: lock for the whole update: reads and writes alike
func (c *counter) visit(path string) int { // => one locked operation per call, after you
	c.hits[path]++      // => races today: two workers read, one write wins
	return c.hits[path] // => lost updates hide in this line
}

// => newRouter wires one counting route around the shared counter.
func newRouter(k *counter) *gin.Engine { // => the counter arrives injected
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
// => the route delegates counting: the handler owns no state
	router.GET("/visit", func(c *gin.Context) { // => every visit counts once
		c.JSON(200, gin.H{"visits": k.visit("/visit")}) // => the running total
	})
	return router // => hand the wired engine back
}

// => hammer serves total visits from workers goroutines and counts answers.
func hammer(router *gin.Engine, total int, workers int) (int64, int64) { // => workload size plus parallelism
	var ok, bad atomic.Int64 // => correct and broken answer counters
	var wg sync.WaitGroup    // => waits for every worker to finish
// => 96 divides by 16 into 6: fixed shares keep totals exact
	share := total / workers // => requests per worker: exact division below
	for w := 0; w < workers; w++ { // => one goroutine per worker
		wg.Add(1) // => count the worker before starting it
		go func() { // => workers visit concurrently, like real traffic
			defer wg.Done() // => always mark done, on every return path
			for i := 0; i < share; i++ { // => this worker's fixed share
				req := httptest.NewRequest("GET", "/visit", nil) // => identical request, every time
				rec := httptest.NewRecorder()                   // => fresh recorder per request
				router.ServeHTTP(rec, req)                      // => TODO: the mutex serializes here
				if rec.Code != 200 { // => any non-200 is a failure
					bad.Add(1) // => broken answers accumulate here
				} else {
					ok.Add(1) // => correct answers accumulate here
				}
			}
		}()
	}
// => all workers joined: the ledger holds the final total
	wg.Wait() // => join every worker: totals are final below
// => loads finalize the counts: workers already joined above
	return ok.Load(), bad.Load() // => the deterministic totals
}

func main() {
	k := &counter{hits: map[string]int{}} // => empty ledger at startup
	router := newRouter(k) // => wiring separate from traffic, as always
	// => panics today: your mutex must print served 96 correct 96 failed 0 total 96
	ok, bad := hammer(router, 96, 16) // => fixed workload, fixed parallelism
	fmt.Println("served", ok+bad, "correct", ok, "failed", bad, "total", k.hits["/visit"]) // => the exact total, guarded
}
```

**After** (`drilling/code/kata-06-race-under-load-uses-a-mutex/after/solution.go`):

```go
// => Kata 6 solution: the mutex spans the whole read-modify-write.
// => Every map access holds the lock: reads and writes alike, from the read
// => through the store. Ninety-six concurrent visits total exactly
// => ninety-six, which only a correct lock delivers.
package main

import (
	"fmt"                     // => prints the deterministic totals
	"net/http/httptest"       // => in-process requests by the hundred
	"sync"                    // => mutex plus workers
	"sync/atomic"             // => race-free outcome counters
	"github.com/gin-gonic/gin" // => the stateful router under load
)

// => counter is the shared visit ledger: a map behind a mutex.
// => every access holds the lock: reads and writes alike
type counter struct { // => the state every request mutates
	mu   sync.Mutex     // => serializes all map access
	hits map[string]int // => path to visit count
}

// => visit records one hit for the path and returns the new total.
// => the lock spans read-modify-write: no lost updates between them
func (c *counter) visit(path string) int { // => one locked operation per call
// => one holder at a time: the map never sees concurrent writes
	c.mu.Lock()         // => exclusive access for the whole update
// => deferred release: panics still unlock, never deadlock
	defer c.mu.Unlock() // => always release, on every return path
	c.hits[path]++      // => read, add, and store atomically together
	return c.hits[path] // => the new total, computed under the lock
}

// => newRouter wires one counting route around the shared counter.
func newRouter(k *counter) *gin.Engine { // => the counter arrives injected
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
// => the route delegates counting: the handler owns no state
	router.GET("/visit", func(c *gin.Context) { // => every visit counts once
		c.JSON(200, gin.H{"visits": k.visit("/visit")}) // => the running total
	})
	return router // => hand the wired engine back
}

// => hammer serves total visits from workers goroutines and checks answers.
func hammer(router *gin.Engine, total int, workers int) (int64, int64) { // => workload size plus parallelism
	var ok, bad atomic.Int64 // => correct-sequence and broken counters
	var wg sync.WaitGroup    // => waits for every worker to finish
// => 96 divides by 16 into 6: fixed shares keep totals exact
	share := total / workers // => requests per worker: exact division below
	for w := 0; w < workers; w++ { // => one goroutine per worker
		wg.Add(1) // => count the worker before starting it
		go func() { // => workers visit concurrently, like real traffic
			defer wg.Done() // => always mark done, on every return path
			for i := 0; i < share; i++ { // => this worker's fixed share
				req := httptest.NewRequest("GET", "/visit", nil) // => identical request, every time
				rec := httptest.NewRecorder()                   // => fresh recorder per request
				router.ServeHTTP(rec, req)                      // => the mutex serializes inside
				if rec.Code != 200 { // => any non-200 is a failure
					bad.Add(1) // => broken answers accumulate here
				} else {
					ok.Add(1) // => correct answers accumulate here
				}
			}
		}()
	}
// => all workers joined: the ledger holds the final total
	wg.Wait() // => join every worker: totals are final below
// => loads finalize the counts: workers already joined above
	return ok.Load(), bad.Load() // => the deterministic totals
}

func main() {
	k := &counter{hits: map[string]int{}} // => empty ledger at startup
	router := newRouter(k) // => wiring separate from traffic, as always
	// => ninety-six visits on sixteen workers: the mutex loses none
	ok, bad := hammer(router, 96, 16) // => fixed workload, fixed parallelism
	fmt.Println("served", ok+bad, "correct", ok, "failed", bad, "total", k.hits["/visit"]) // => Output: served 96 correct 96 failed 0 total 96
}
```

**Output** (`drilling/code/kata-06-race-under-load-uses-a-mutex/expected/main.stdout.txt`):

```text
served 96 correct 96 failed 0 total 96
```

### Kata 7: Wrap errors in the shared envelope

The starter answers failures as plain text while successes speak JSON. Funnel all three failures through one fail helper writing code plus message, and prove each envelope prints identically shaped.

**Before** (`drilling/code/kata-07-error-envelope-for-clients/before/starter.go`):

```go
// => Kata 7 starter: plain-text failures beside JSON success.
// => Success speaks JSON but failures speak text: clients branch on content
// => type to read errors. Your task: funnel all three failures through one
// => fail helper writing code plus message, and prove each envelope prints
// => identically shaped.
package main

import (
	"fmt"                     // => prints each answer
	"net/http"                // => status codes for the happy path
	"net/http/httptest"       // => in-process request and recorder
	"github.com/gin-gonic/gin" // => the routes you will envelope
)

// => newRouter serves one lookup with three unwrapped failures.
// => TODO: one fail helper; 400, 404, and 410 through the same shape
func newRouter(store map[string]string) *gin.Engine { // => the store arrives injected
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	router.GET("/items/:id", func(c *gin.Context) { // => look one item up
		id := c.Param("id") // => the identity under test
		if id == "" {       // => TODO: fail 400 bad_id through the envelope
// => text today, envelope after: the shape is the task
			c.String(400, "bad id") // => plain text today: your envelope goes here
			return // => invalid input never reaches the store
		}
		v, ok := store[id] // => the lookup decides the branch
		if !ok {           // => TODO: fail 404 no_item through the envelope
// => absence prints text now: your fail call replaces this
			c.String(404, "no item") // => plain text today: same envelope next
			return // => absence stops here
		}
		if v == "retired" { // => TODO: fail 410 retired through the envelope
// => refusal prints text now: 410 joins the envelope after
			c.String(410, "retired") // => plain text today: policy in the envelope next
			return // => refusals stop here too
		}
		c.JSON(http.StatusOK, gin.H{"id": id, "value": v}) // => TODO: needs net/http import for StatusOK
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the id is the variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                   // => the assertion surface
	router.ServeHTTP(w, req)                      // => today's plain failures run inside
// => status plus body per leg: the envelope shape is the assertion
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	store := map[string]string{"w1": "gear", "w2": "retired"} // => one live item, one retired
	router := newRouter(store) // => wiring separate from traffic, as always
	// => text today: your envelopes must print these shapes instead
	check(router, "/items/w1") // => the happy path stays JSON throughout
	check(router, "/items/w9") // => TODO: 404 {"error":{"code":"no_item",...}}
	check(router, "/items/w2") // => TODO: 410 {"error":{"code":"retired",...}}
}
```

**After** (`drilling/code/kata-07-error-envelope-for-clients/after/solution.go`):

```go
// => Kata 7 solution: one envelope for every failure.
// => All three failures funnel through fail into code plus message: 400,
// => 404, and 410 share the nesting, differing only in fields. Clients
// => parse one shape for the whole service.
package main

import (
	"fmt"                     // => prints each failure's envelope
	"net/http"                // => status codes across the failure set
	"net/http/httptest"       // => in-process request and recorder
	"github.com/gin-gonic/gin" // => one envelope for every failure
)

// => fail writes the shared error envelope: code plus message, always.
// => one helper means no handler invents its own error shape
func fail(c *gin.Context, status int, code string, message string) { // => status, machine code, human message
	// => the envelope never changes shape: only its fields vary
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}}) // => JSON even for failures
}

// => newRouter serves one lookup with three enveloped failures.
// => validation, absence, and refusal: same envelope, three codes
func newRouter(store map[string]string) *gin.Engine { // => the store arrives injected
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	router.GET("/items/:id", func(c *gin.Context) { // => look one item up
		id := c.Param("id") // => the identity under test
		if id == "" {       // => empty ids break the contract first
			fail(c, http.StatusBadRequest, "bad_id", "id must not be empty") // => 400 blames the client
			return // => invalid input never reaches the store
		}
		v, ok := store[id] // => the lookup decides the branch
		if !ok {           // => unknown ids are 404, not empty 200
			fail(c, http.StatusNotFound, "no_item", "no item "+id) // => 404 names the absence
			return // => absence stops here
		}
		if v == "retired" { // => retired items refuse: policy, not absence
			fail(c, http.StatusGone, "retired", "item "+id+" retired") // => 410 names the policy
			return // => refusals stop here too
		}
// => the found item echoes: envelopes stay for failures only
		c.JSON(http.StatusOK, gin.H{"id": id, "value": v}) // => the happy path
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the id is the variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                   // => the assertion surface
	router.ServeHTTP(w, req)                      // => every branch funnels through fail
// => status plus body per leg: the envelope shape is the assertion
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	store := map[string]string{"w1": "gear", "w2": "retired"} // => one live item, one retired
	router := newRouter(store) // => wiring separate from traffic, as always
	// => the live item answers plain JSON: envelopes are for failures only
	check(router, "/items/w1") // => Output: GET /items/w1 -> 200 {"id":"w1","value":"gear"}
	// => unknown ids answer 404 in the shared envelope
	check(router, "/items/w9") // => Output: GET /items/w9 -> 404 {"error":{"code":"no_item","message":"no item w9"}}
	// => retired items answer 410 in the same envelope: policy, not absence
	check(router, "/items/w2") // => Output: GET /items/w2 -> 410 {"error":{"code":"retired","message":"item w2 retired"}}
}
```

**Output** (`drilling/code/kata-07-error-envelope-for-clients/expected/main.stdout.txt`):

```text
GET /items/w1 -> 200 {"id":"w1","value":"gear"}
GET /items/w9 -> 404 {"error":{"code":"no_item","message":"no item w9"}}
GET /items/w2 -> 410 {"error":{"code":"retired","message":"item w2 retired"}}
```

### Kata 8: Shut down with a deadline

The starter serves with no shutdown path at all: stopping drops in-flight work. Add Shutdown with a ten-millisecond deadline around a fifty-millisecond route, and prove the deadline error fires when the work outlasts the bound.

**Before** (`drilling/code/kata-08-shutdown-with-a-deadline/before/starter.go`):

```go
// => Kata 8 starter: serving with no shutdown path.
// => The route answers but the server never shuts down gracefully: stopping
// => drops in-flight work mid-answer. Your task: shut down with a
// => ten-millisecond deadline around the fifty-millisecond route below, and
// => prove the deadline error fires when the work outlasts the bound.
package main

import (
	"fmt"                     // => prints each answer
	"net/http/httptest"       // => in-process request and recorder
	"time"                    // => the slow work you will bound
	"github.com/gin-gonic/gin" // => the route you will drain
)

// => newRouter wires one fifty-millisecond route: slower than your deadline.
// => the sleep stands in for wedged work: shutdown must give up on it
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	router.GET("/slow", func(c *gin.Context) { // => the request that outlasts
		time.Sleep(50 * time.Millisecond) // => fifty milliseconds: past every short bound
// => served only without a bound: the deadline takes precedence
		c.String(200, "too late")         // => never served: the deadline fires first
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
// => TODO: replace this with a real loopback server plus Shutdown
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                   // => in-memory response capture
	router.ServeHTTP(w, req)                      // => no shutdown here: in-process has none to prove
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => slow but served in-process: your deadline must print its error instead
	check(router, "/slow") // => fifty milliseconds, served whole today
}
```

**After** (`drilling/code/kata-08-shutdown-with-a-deadline/after/solution.go`):

```go
// => Kata 8 solution: the deadline fires before the work finishes.
// => Shutdown with a ten-millisecond deadline around the fifty-millisecond
// => route: fifty never fits inside ten, so the deadline error fires every
// => run. The verdict is golden-stable because the margin is absolute.
package main

import (
	"context"                 // => the ten-millisecond shutdown bound
	"fmt"                     // => prints the deadline verdict
	"net/http"                // => the real client for the slow trip
	"net/http/httptest"       // => the loopback server under test
	"time"                    // => the fifty-versus-ten race, fixed
	"github.com/gin-gonic/gin" // => the slow route that outlasts the bound
)

// => newRouter wires one fifty-millisecond route: slower than the deadline.
// => the sleep stands in for wedged work: shutdown gives up on it
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	router.GET("/slow", func(c *gin.Context) { // => the request that outlasts
		time.Sleep(50 * time.Millisecond) // => fifty milliseconds: past every short bound
// => served only without a bound: the deadline takes precedence
		c.String(200, "too late")         // => never served: the deadline fires first
	})
	return router // => hand the wired engine back
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	server := httptest.NewUnstartedServer(router) // => configured but not listening yet
// => Start opens the listener: the slow request can land now
	server.Start()                                // => loopback accepts: the race begins
	defer server.Close()                          // => release the port whatever happens
	// => the slow request flies in a goroutine: the deadline fires around it
	done := make(chan string, 1) // => buffered: the trip reports without blocking
	go func() {                // => the in-flight request, mid-air at shutdown
		client := &http.Client{Timeout: 5 * time.Second} // => hangs become failures, not hangs
		resp, err := client.Get(server.URL + "/slow") // => the fifty-millisecond trip
		if err != nil {                            // => Shutdown never kills this trip in time
			done <- "request failed" // => the failure travels the channel
			return                   // => nothing to read: report and stop
		}
		defer resp.Body.Close() // => always release the connection
// => finished travels the channel when nothing bounds the trip
		done <- "request finished"  // => unreachable before main returns: fifty beats ten
	}()
	// => let the request land server-side: still sleeping when the bound fires
// => ten milliseconds in: the request sleeps its fifty mid-flight
	time.Sleep(10 * time.Millisecond) // => fixed head start, never asserted
	// => ten milliseconds against fifty: the deadline always fires first
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond) // => the bound, fixed
	defer cancel()                    // => release the timer when done
	err := server.Config.Shutdown(ctx) // => wait ten milliseconds, then give up
	if err != nil {                   // => the wedged request outlasted the bound
		fmt.Println("shutdown:", err) // => Output: shutdown: context deadline exceeded
		return                        // => the deadline verdict is the whole lesson
	}
	fmt.Println("shutdown clean") // => unreachable: fifty never fits inside ten
	_ = done                      // => the trip is still mid-air: the process exits around it
}
```

**Output** (`drilling/code/kata-08-shutdown-with-a-deadline/expected/main.stdout.txt`):

```text
shutdown: context deadline exceeded
```

## Self-check checklist

Twenty-four self-check items, at least one per concept from co-01 to co-16. Read each aloud as a promise: if you hesitate on any item, return to its example before calling the course done.

- [ ] I can map one method plus one path to one handler and prove static beats capture (co-01).
- [ ] I can switch on HandleMethodNotAllowed so wrong verbs 405 instead of lying 404 (co-01).
- [ ] I can wrap every request in middleware with before-code, c.Next, and after-code in order (co-02).
- [ ] I can abort the chain from a guard so strangers never reach handlers (co-02).
- [ ] I can bind JSON bodies, queries, URIs, and headers into typed structs with defaults (co-03).
- [ ] I can choose 200, 201, 204, 400, and 404 per outcome and defend each choice (co-04).
- [ ] I can rename, omit, and hide struct fields with JSON tags as a contract (co-04).
- [ ] I can funnel every failure through one fail helper into code plus message (co-05).
- [ ] I can separate 422 and 410 from 400 and 404 by value-versus-shape and policy-versus-absence (co-05).
- [ ] I can close handlers over a store, hide it behind an interface, and build it from a constructor (co-06).
- [ ] I can inject per-request services through middleware and read them back without globals (co-06).
- [ ] I can guard shared maps with a mutex spanning the whole read-modify-write (co-07).
- [ ] I can fan work out over channels, join with WaitGroup, and sort before printing (co-07).
- [ ] I can drain in-flight work with Shutdown and bound the wait with a deadline (co-08).
- [ ] I can bind loopback ephemeral ports in tests and assert everything except the port (co-08).
- [ ] I can serve requests in-process through httptest and assert status plus exact body (co-09).
- [ ] I can scale one assertion into a table and one table into go test subtests (co-09).
- [ ] I can declare required, email, min, gt, and oneof rules with binding tags (co-10).
- [ ] I can version APIs with groups and register resources from data in a loop (co-11).
- [ ] I can render JSON, XML, and YAML from one struct with format tags (co-12).
- [ ] I can stamp request ids without timestamps and keep journals golden-stable (co-13).
- [ ] I can keep /healthz fast, fixed-shaped, and independent of every store (co-14).
- [ ] I can serve a hand-written openapi.json beside the routes and freeze it in goldens (co-15).
- [ ] I can map each Gin idiom to its FastAPI counterpart and choose per service size (co-16).

## Elaborative interrogation & self-explanation

Six why and why-not prompts. Each names a design decision and the rejected alternative; answer from your own experience first, then compare with the model answer. The goal is judgement transfer, not memorization.

### E1: Why does Gin validate during binding instead of in handlers, and what is lost in exchange?

<details><summary>Model answer</summary>

Validation during binding keeps invalid values from ever entering handler logic, at the cost of expressing rules as tags instead of code. Model answer: tags centralize the contract where the shape is defined and run the same checks for every handler, while hand-checks drift and duplicate; what is lost is arbitrary logic — cross-field rules stranger than oneof need custom validators or explicit code, which is exactly where Examples 11 and 32 put them.

</details>

### E2: Why must the response be written after c.Next returns in after-code, and what breaks otherwise?

<details><summary>Model answer</summary>

Writing before Next freezes the body before inner layers and the handler run, so their steps never appear — Example 28's first version printed three steps instead of five. Model answer: the writer must run last because the record is only complete after the whole chain returns; what breaks otherwise is silent incompleteness, the hardest kind, since the response looks right while missing the inner half.

</details>

### E3: Why do goldens freeze bytes instead of asserting structure, and when is structure enough?

<details><summary>Model answer</summary>

Byte goldens catch drift that structural assertions wave through: renamed keys, reordered fields, added wrappers — every accidental contract change fails loudly, as Examples 49 and 76 demonstrate. Model answer: freeze bytes for contracts clients depend on; structure suffices for internal invariants nobody else parses. The maintenance cost (updating goldens on deliberate change) is the mechanism, not overhead: each update is a reviewed contract decision.

</details>

### E4: Why does shutdown flip readiness before stopping, and what races without the flip?

<details><summary>Model answer</summary>

Flipping first closes the race where new requests arrive while the process is leaving: the orchestrator sees 503 and routes around, while in-flight work drains (Example 66). Model answer: without the flip, the load balancer keeps sending traffic to a dying process and every new arrival dies mid-flight; with it, old work finishes and new work never starts. The atomic flag is the whole mechanism — one boolean, visible to every goroutine.

</details>

### E5: Why do tests use ephemeral ports and pre-cancelled contexts instead of fixed ones and sleeps?

<details><summary>Model answer</summary>

Fixed ports collide between parallel tests and sleeps make suites slow and flaky; ephemeral ports plus pre-expired contexts prove the same branches instantly and deterministically (Examples 32, 62, 64). Model answer: determinism is a testability property, not a speed hack — a test that cannot flake is a test you trust, and fifty-versus-ten margins plus already-done channels remove time from the verdict entirely.

</details>

### E6: Why does Gin spell dependency injection as constructors instead of a container, and what does each side gain?

<details><summary>Model answer</summary>

Constructors make dependencies visible as parameters: tests build services with plain calls and the compiler rejects wrong wiring, while containers hide relationships in configuration (Example 74). Model answer: Gin gains explicitness and zero framework magic at the cost of threading parameters through call sites; FastAPI gains terse handlers at the cost of Depends graphs only readable at runtime. Choose per team: explicit construction for services you test heavily, containers for CRUD you scaffold fast.

</details>
