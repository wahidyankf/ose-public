---
title: "Capstone: Order Tracking Service"
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 40
---

Build a small order-tracking HTTP service with five routes: create an order with validation, list orders, read one order, move its status through a bounded workflow, and cancel it. Every failure answers in the shared error envelope, a health probe stands beside the routes, and an in-process go test suite proves the whole lifecycle without a socket.

## What you build

An order service stores orders in memory behind a repository, serves them through a Gin engine built by a constructor, and proves itself twice: a demo binary prints one line per lifecycle leg, and a go test suite asserts each leg with subtests. The five routes cover the full lifecycle of one order: POST /orders creates with validation and defaults the status to placed; GET /orders lists in insertion order; GET /orders/:id reads one back or 404s; PATCH /orders/:id/status moves the state through placed, paid, shipped, or cancelled and rejects anything else with 422; DELETE /orders/:id cancels with 204 and 404s the second time. GET /healthz answers ok true beside all of it.

## Architecture

store.go owns persistence: the Order type plus a MemoryStore with List, Get, Save, SetStatus, and Delete behind no interface this time — the capstone keeps the seam from Example 40 in mind but stays concrete so the file count stays small. main.go owns the HTTP boundary: the createInput and statusInput binding contracts, the shared fail helper, NewRouter wiring all six routes, and the demo main that walks the lifecycle leg by leg. orders_test.go owns the proof: a serve helper building every request, a check helper asserting status plus exact body, and TestOrderService walking the same lifecycle as ordered subtests. The tests share one router on purpose, like a round trip: creation must precede the move, which must precede the delete.

## Validation and errors

Creation requires id, item, and a positive qty through binding tags; the status transition requires one of the four workflow states through oneof. Every failure funnels through fail into code plus message: bad_order for 400s, no_order for 404s, bad_status for 422s. Unknown order ids 404 identically on read, move, and delete, so clients learn one absence shape for three routes. The demo prints all three failure families beside the happy path; the test suite asserts each one with both sides shown on failure.

## Health and operations

/healthz answers 200 with ok true from memory: no store, no latency, nothing that can fail except the process itself. The demo ends there, and the tests assert it last, proving the probe stands apart from the order lifecycle. The whole service runs in-process in tests and on loopback in the demo's httptest style — no ports, no network, no clock reads in any golden line.

## How to run it

The unit lives in learning/capstone/code with its own go.mod, go.sum, vendored Gin, and two harness runs: test compiles the package into a test binary and asserts the seven subtests with timing normalized away, and main builds the demo binary and prints the ten lifecycle lines. Run each with the command in the unit's own run.yaml. Both goldens live under expected/.

## Reading the goldens

The demo golden tells the lifecycle as ten lines: creation answers 201 with status placed, the zero-qty sibling answers 400 with bad_order, the listing shows one order, the read echoes it back, the paid move answers 200, the flying move answers 422 with bad_status, deletion answers 204 with no body, the second deletion answers 404 with no_order, and health answers 200. Read them as a contract review: every line the demo prints is a promise a client could rely on, and any change to those bytes is a breaking change until the golden is deliberately updated. The test golden tells the same story as seven holds lines, one per subtest, with the 204 leg logging holds without a body.

## Testing decisions

The suite shares one router across subtests instead of rebuilding per leg, because the lifecycle is the subject: the paid move only makes sense after creation, and the delete only after the move. Subtests stay sequential for the same reason — parallel legs would race the shared store and prove nothing about order. Timing normalization strips the seconds and drops the ok line so tool output compares byte for byte; the proof lives in the holds lines naming path, status, and body. When a subtest fails, both sides print: the got bytes and the wanted bytes, so the drift is visible without rerunning anything.

## Where to go next

Extend the service in the direction your work needs: add a paid-only refund route reusing the fail envelope; bound the workflow so shipped orders cannot move back to placed; page the listing with the Page struct from Example 12; stamp request ids with the middleware from Example 26 and assert them in the tests; or swap MemoryStore for SQL behind the repository interface from Example 40 without touching a route. Each extension is one kata-sized step, and the suite tells you when it holds.

---

## The code

Three files with one job each. store.go owns persistence behind the MemoryStore; main.go owns the HTTP boundary with NewRouter, the binding contracts, and the demo; orders_test.go owns the proof with the serve and check helpers plus the ordered lifecycle suite.

**`learning/capstone/code/go.mod`**:

```go
module example/capstone

go 1.27

require github.com/gin-gonic/gin v1.12.0

require (
	github.com/bytedance/gopkg v0.1.3 // indirect
	github.com/bytedance/sonic v1.15.0 // indirect
	github.com/bytedance/sonic/loader v0.5.0 // indirect
	github.com/cloudwego/base64x v0.1.6 // indirect
	github.com/gabriel-vasile/mimetype v1.4.12 // indirect
	github.com/gin-contrib/sse v1.1.0 // indirect
	github.com/go-playground/locales v0.14.1 // indirect
	github.com/go-playground/universal-translator v0.18.1 // indirect
	github.com/go-playground/validator/v10 v10.30.1 // indirect
	github.com/goccy/go-json v0.10.5 // indirect
	github.com/goccy/go-yaml v1.19.2 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/klauspost/cpuid/v2 v2.3.0 // indirect
	github.com/leodido/go-urn v1.4.0 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/pelletier/go-toml/v2 v2.2.4 // indirect
	github.com/quic-go/qpack v0.6.0 // indirect
	github.com/quic-go/quic-go v0.59.0 // indirect
	github.com/twitchyliquid64/golang-asm v0.15.1 // indirect
	github.com/ugorji/go/codec v1.3.1 // indirect
	go.mongodb.org/mongo-driver/v2 v2.5.0 // indirect
	golang.org/x/arch v0.22.0 // indirect
	golang.org/x/crypto v0.48.0 // indirect
	golang.org/x/net v0.51.0 // indirect
	golang.org/x/sys v0.41.0 // indirect
	golang.org/x/text v0.34.0 // indirect
	google.golang.org/protobuf v1.36.10 // indirect
)
```

**`learning/capstone/code/store.go`**:

```go
// => Capstone store: orders behind a memory repository.
// => The routes in main.go never touch a map directly: every read and
// => write crosses the MemoryStore below. Swapping this file for SQL keeps
// => every route, test, and golden byte identical.
package main

// => Order is the stored shape: identity, contents, and lifecycle state.
// => json tags fix the wire names the routes and tests share (co-15)
type Order struct { // => the domain type every layer trades in
	ID     string `json:"id"`     // => the order key, echoed back untouched
	Item   string `json:"item"`   // => what was ordered, a plain string
	Qty    int    `json:"qty"`    // => how many: an int, never a string
	Status string `json:"status"` // => placed, paid, shipped, or cancelled
}

// => MemoryStore keeps orders in a map with insertion order beside it.
// => keys preserves arrival order: List stays golden-stable (co-06)
type MemoryStore struct { // => the test double that behaves like a table
	rows map[string]Order // => id to Order, the actual storage
	keys []string         // => insertion order, kept beside the map
}

// => NewMemoryStore builds an empty store: tests start here every time.
// => construction keeps tests isolated: no shared state (co-09)
func NewMemoryStore() *MemoryStore { // => the fixture constructor
	return &MemoryStore{rows: map[string]Order{}, keys: []string{}} // => empty rows, empty order
}

// => List returns every order in insertion order.
// => empty slice, never nil: clients always see an array
func (m *MemoryStore) List() []Order { // => the full collection, ordered
	out := []Order{} // => start empty: filters remove, never invent
	for _, k := range m.keys { // => insertion order, not map order
		out = append(out, m.rows[k]) // => stable sequence every run
	}
	return out // => the ordered collection
}

// => Get returns one order and whether it exists.
// => the comma-ok idiom, lifted up for the routes to branch on
func (m *MemoryStore) Get(id string) (Order, bool) { // => one order plus presence
	o, ok := m.rows[id] // => map lookup with presence
	return o, ok       // => callers branch on ok, like maps do
}

// => Save inserts or replaces one order, tracking new ids in order.
// => upsert keeps creation one call: PUT-like semantics on POST
func (m *MemoryStore) Save(o Order) Order { // => store and echo what was stored
	if _, ok := m.rows[o.ID]; !ok { // => first sight of this id
		m.keys = append(m.keys, o.ID) // => remember the arrival order
	}
	m.rows[o.ID] = o // => store (or overwrite) the order
	return o          // => echo exactly what the store holds
}

// => SetStatus moves one order to a new lifecycle state.
// => false means unknown: the route answers 404 from this
func (m *MemoryStore) SetStatus(id string, status string) (Order, bool) { // => id plus the new state
	o, ok := m.rows[id] // => the order must exist before it can move
	if !ok {            // => unknown ids move nothing
		return Order{}, false // => zero order plus the absence
	}
	o.Status = status   // => the transition happens here, nowhere else
	m.rows[id] = o      // => write the moved order back
	return o, true      // => the moved order plus the presence
}

// => Delete removes one order, reporting whether one was there.
// => true removed something: the route answers 204 from this
func (m *MemoryStore) Delete(id string) bool { // => remove and report
	if _, ok := m.rows[id]; !ok { // => absent ids delete nothing
		return false // => the route answers 404 from this
	}
	delete(m.rows, id) // => remove the row itself
	kept := []string{} // => rebuild the order without the id
	for _, k := range m.keys { // => survivors keep their relative order
		if k != id { // => the deleted id drops out
			kept = append(kept, k) // => keep the survivors in order
		}
	}
	m.keys = kept // => the order forgets the id too
	return true   // => something was removed
}
```

**`learning/capstone/code/main.go`**:

```go
// => Capstone service: order tracking with five routes, validation,
// => structured errors, and a health check.
// => The demo below exercises every route in-process and prints one line
// => per leg. The test suite in orders_test.go proves the same contract
// => with go test subtests.
package main

import (
	"fmt"                     // => prints one line per demo leg
	"net/http"                // => status codes across the five routes (co-04)
	"net/http/httptest"       // => in-process demo traffic (co-09)
	"strings"                 // => builds the demo request bodies
	"github.com/gin-gonic/gin" // => the service under demo (co-16)
)

// => createInput is the creation contract: item and quantity, both required.
// => validation tags reject bad bodies before the store sees them (co-10)
type createInput struct { // => the boundary shape for POST /orders
	ID   string `json:"id" binding:"required"`   // => identity is mandatory
	Item string `json:"item" binding:"required"` // => contents are mandatory too
	Qty  int    `json:"qty" binding:"required,gt=0"` // => at least one: zero is not an order
}

// => statusInput is the transition contract: the next lifecycle state.
// => oneof bounds the workflow: placed, paid, shipped, cancelled
type statusInput struct { // => the boundary shape for PATCH status
	Status string `json:"status" binding:"required,oneof=placed paid shipped cancelled"` // => the four legal moves
}

// => fail writes the shared error envelope: code plus message, always.
// => one helper means every failure speaks the same shape (co-05)
func fail(c *gin.Context, status int, code string, message string) { // => status, machine code, human message
	// => the envelope never changes shape: only its fields vary
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}}) // => JSON even for failures (co-04)
}

// => NewRouter wires the five order routes plus health around the store.
// => exported so tests build the service without main (co-06)
func NewRouter(store *MemoryStore) *gin.Engine { // => the store arrives injected
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	// => creation validates, defaults the status, and answers 201
	router.POST("/orders", func(c *gin.Context) { // => route one: create
		var in createInput // => the bound shape, validated below
		// => missing id, item, or non-positive qty fails here (co-10)
		if err := c.ShouldBindJSON(&in); err != nil { // => first broken rule fails
			fail(c, http.StatusBadRequest, "bad_order", "send id, item, and positive qty") // => 400, fixed envelope
			return // => invalid input never reaches the store
		}
		o := store.Save(Order{ID: in.ID, Item: in.Item, Qty: in.Qty, Status: "placed"}) // => new orders start placed
		c.JSON(http.StatusCreated, o) // => 201 with the stored order (co-04)
	})
	// => the listing answers insertion order: stable, golden-friendly
	router.GET("/orders", func(c *gin.Context) { c.JSON(200, store.List()) }) // => route two: list
	// => reads branch on presence: found echoes, missing 404s
	router.GET("/orders/:id", func(c *gin.Context) { // => route three: read one
		o, ok := store.Get(c.Param("id")) // => the lookup decides the code
		if !ok {                          // => unknown ids are 404, not empty 200
			fail(c, http.StatusNotFound, "no_order", "no order "+c.Param("id")) // => 404 names the absence
			return // => absence stops here
		}
		c.JSON(http.StatusOK, o) // => the found order (co-04)
	})
	// => status moves validate the transition, then persist it
	router.PATCH("/orders/:id/status", func(c *gin.Context) { // => route four: move state
		var in statusInput // => the bound transition, validated below
		// => unknown states fail oneof before the store is touched
		if err := c.ShouldBindJSON(&in); err != nil { // => bad transitions fail here
			fail(c, http.StatusUnprocessableEntity, "bad_status", "status must be placed, paid, shipped, or cancelled") // => 422, same envelope
			return // => invalid transitions never reach the store
		}
		o, ok := store.SetStatus(c.Param("id"), in.Status) // => the move, persisted
		if !ok {                                          // => unknown ids move nothing
			fail(c, http.StatusNotFound, "no_order", "no order "+c.Param("id")) // => same 404 as the read path
			return // => absence stops here too
		}
		c.JSON(http.StatusOK, o) // => 200 with the moved order (co-04)
	})
	// => deletion answers 204 with no body: gone is the message
	router.DELETE("/orders/:id", func(c *gin.Context) { // => route five: cancel
		if !store.Delete(c.Param("id")) { // => false means nothing was there
			fail(c, http.StatusNotFound, "no_order", "no order "+c.Param("id")) // => same 404 as read and move
			return // => absence stops here as well
		}
		c.Status(http.StatusNoContent) // => 204: cancelled, nothing to say
	})
	// => health answers beside the versions: cheapest route in the service (co-14)
	router.GET("/healthz", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) }) // => the orchestrator polls here
	return router // => the fully wired, immediately testable service
}

// => leg serves one demo request and prints method, status, and body.
// => bodies print only when present: 204 leaves no trailing space
func leg(router *gin.Engine, method string, target string, body string) { // => method, path, and payload vary
	req := httptest.NewRequest(method, target, strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json") // => write bodies bind below
	w := httptest.NewRecorder() // => in-memory response capture
	router.ServeHTTP(w, req)    // => the whole service runs per leg (co-09)
	line := fmt.Sprintf("%s %s -> %d", method, target, w.Code) // => status core: always present
	if w.Body.String() != "" {                                 // => 204 prints the code alone
		line += " " + w.Body.String() // => bodies join with one space
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

func main() {
	// => the demo store starts empty: every leg below earns its answer
	router := NewRouter(NewMemoryStore()) // => wiring separate from traffic, as always
	// => creation validates and defaults to placed: 201 with the order
	leg(router, "POST", "/orders", `{"id":"o1","item":"book","qty":2}`) // => Output: POST /orders -> 201 {"id":"o1","item":"book","qty":2,"status":"placed"}
	// => zero qty breaks gt=0: 400 blames the body, not the store
	leg(router, "POST", "/orders", `{"id":"o2","item":"pen","qty":0}`) // => Output: POST /orders -> 400 {"error":{"code":"bad_order","message":"send id, item, and positive qty"}}
	// => the listing holds one order: insertion order, stable output
	leg(router, "GET", "/orders", "") // => Output: GET /orders -> 200 [{"id":"o1","item":"book","qty":2,"status":"placed"}]
	// => the stored order reads back whole: status travelled with it
	leg(router, "GET", "/orders/o1", "") // => Output: GET /orders/o1 -> 200 {"id":"o1","item":"book","qty":2,"status":"placed"}
	// => paid is a legal move: 200 with the moved order
	leg(router, "PATCH", "/orders/o1/status", `{"status":"paid"}`) // => Output: PATCH /orders/o1/status -> 200 {"id":"o1","item":"book","qty":2,"status":"paid"}
	// => flying is not a state: oneof rejects it with 422
	leg(router, "PATCH", "/orders/o1/status", `{"status":"flying"}`) // => Output: PATCH /orders/o1/status -> 422 {"error":{"code":"bad_status","message":"status must be placed, paid, shipped, or cancelled"}}
	// => cancellation answers 204 with no body: gone is the message
	leg(router, "DELETE", "/orders/o1", "") // => Output: DELETE /orders/o1 -> 204
	// => deleting again finds nothing: the same 404 as read and move
	leg(router, "DELETE", "/orders/o1", "") // => Output: DELETE /orders/o1 -> 404 {"error":{"code":"no_order","message":"no order o1"}}
	// => health answers beside the orders: 200 with ok true
	leg(router, "GET", "/healthz", "") // => Output: GET /healthz -> 200 {"ok":true}
}
```

**`learning/capstone/code/orders_test.go`**:

```go

// => Capstone tests: the order service contract as go test subtests.
// => Each subtest serves one request in-process against a shared router and
// => logs the contract it proves. Subtests run in order on purpose: create,
// => move, and delete form one lifecycle, like a round trip. Run with
// => go test -v: the harness strips timing and the ok line before goldens.
package main

import (
	"net/http/httptest" // => in-process request and recorder (co-09)
	"strings"            // => builds write bodies from fixed strings
	"testing"            // => the test toolchain: Run, Logf, Errorf
	"github.com/gin-gonic/gin" // => the router under test (co-09)
)

// => serve builds one JSON request, serves it, and returns the recorder.
// => the shared test helper: construction lives in exactly one place
func serve(router *gin.Engine, method string, target string, body string) *httptest.ResponseRecorder { // => method, path, and payload in
	// => strings.NewReader turns the fixed body into a request stream
	req := httptest.NewRequest(method, target, strings.NewReader(body)) // => no socket, fixed bytes
	req.Header.Set("Content-Type", "application/json") // => write bodies bind below
	w := httptest.NewRecorder() // => the assertion surface
	router.ServeHTTP(w, req)    // => the whole service runs per call
	return w                    // => callers assert on status and body
}

// => check asserts one status plus exact body, then logs the proven contract.
// => t.Helper marks this a helper: failures point at the caller line
func check(t *testing.T, w *httptest.ResponseRecorder, code int, body string) { // => the recorder plus its expectations
// => helper context: failures point at the calling subtest line
	t.Helper() // => failures blame the subtest, not this helper
	if w.Code != code { // => the status must match first
		t.Errorf("status = %d, want %d", w.Code, code) // => both sides on failure
	}
	if w.Body.String() != body { // => then the exact body
		t.Errorf("body = %s, want %s", w.Body.String(), body) // => both sides on failure
	} else if body == "" { // => bodiless answers log their status alone
		t.Logf("holds: %d (no body)", code) // => 204 proves itself without bytes
	} else {
		t.Logf("holds: %d %s", code, body) // => the proven contract, logged once (bodies only)
	}
}

// => TestOrderService walks one order lifecycle across ordered subtests.
// => sequential on purpose: each leg assumes the legs before it ran
func TestOrderService(t *testing.T) { // => the suite: one test, many legs
// => one router for seven legs: the lifecycle shares its world
// => one router for seven legs: the lifecycle shares its world
	router := NewRouter(NewMemoryStore()) // => empty store: the lifecycle starts here
// => leg one creates: the lifecycle starts with placed status
	t.Run("create places the order", func(t *testing.T) { // => leg one: validated creation
		check(t, serve(router, "POST", "/orders", `{"id":"o1","item":"book","qty":2}`), 201, `{"id":"o1","item":"book","qty":2,"status":"placed"}`) // => 201 with placed status
	})
	t.Run("zero qty is rejected", func(t *testing.T) { // => leg two: validation holds
		check(t, serve(router, "POST", "/orders", `{"id":"o2","item":"pen","qty":0}`), 400, `{"error":{"code":"bad_order","message":"send id, item, and positive qty"}}`) // => 400 blames the body
	})
// => leg three probes absence: unknown ids 404 without a store hit
	t.Run("missing order is 404", func(t *testing.T) { // => leg three: absence is defined
		check(t, serve(router, "GET", "/orders/o9", ""), 404, `{"error":{"code":"no_order","message":"no order o9"}}`) // => 404 names the absence
	})
	t.Run("paid is a legal move", func(t *testing.T) { // => leg four: the transition persists
		check(t, serve(router, "PATCH", "/orders/o1/status", `{"status":"paid"}`), 200, `{"id":"o1","item":"book","qty":2,"status":"paid"}`) // => 200 with the moved order
	})
// => leg five guards the workflow: flying never persists
	t.Run("unknown state is 422", func(t *testing.T) { // => leg five: oneof guards the workflow
		check(t, serve(router, "PATCH", "/orders/o1/status", `{"status":"flying"}`), 422, `{"error":{"code":"bad_status","message":"status must be placed, paid, shipped, or cancelled"}}`) // => 422 guards the transition
	})
// => leg six removes: the listing must forget o1 after this
	t.Run("delete cancels the order", func(t *testing.T) { // => leg six: gone is the message
		check(t, serve(router, "DELETE", "/orders/o1", ""), 204, ``) // => 204 with no body at all
	})
// => leg seven stands apart: health never touches orders
// => leg seven stands apart: health never touches orders
	t.Run("health answers beside orders", func(t *testing.T) { // => leg seven: the probe stands apart
		check(t, serve(router, "GET", "/healthz", ""), 200, `{"ok":true}`) // => 200 with ok true
	})
}
```

**Test output** (`learning/capstone/code/expected/test/test.stdout.txt`):

```text
=== RUN   TestOrderService
=== RUN   TestOrderService/create_places_the_order
    orders_test.go:52: holds: 201 {"id":"o1","item":"book","qty":2,"status":"placed"}
=== RUN   TestOrderService/zero_qty_is_rejected
    orders_test.go:55: holds: 400 {"error":{"code":"bad_order","message":"send id, item, and positive qty"}}
=== RUN   TestOrderService/missing_order_is_404
    orders_test.go:59: holds: 404 {"error":{"code":"no_order","message":"no order o9"}}
=== RUN   TestOrderService/paid_is_a_legal_move
    orders_test.go:62: holds: 200 {"id":"o1","item":"book","qty":2,"status":"paid"}
=== RUN   TestOrderService/unknown_state_is_422
    orders_test.go:66: holds: 422 {"error":{"code":"bad_status","message":"status must be placed, paid, shipped, or cancelled"}}
=== RUN   TestOrderService/delete_cancels_the_order
    orders_test.go:70: holds: 204 (no body)
=== RUN   TestOrderService/health_answers_beside_orders
    orders_test.go:75: holds: 200 {"ok":true}
--- PASS: TestOrderService
    --- PASS: TestOrderService/create_places_the_order
    --- PASS: TestOrderService/zero_qty_is_rejected
    --- PASS: TestOrderService/missing_order_is_404
    --- PASS: TestOrderService/paid_is_a_legal_move
    --- PASS: TestOrderService/unknown_state_is_422
    --- PASS: TestOrderService/delete_cancels_the_order
    --- PASS: TestOrderService/health_answers_beside_orders
PASS
```

**Demo output** (`learning/capstone/code/expected/main/main.stdout.txt`):

```text
POST /orders -> 201 {"id":"o1","item":"book","qty":2,"status":"placed"}
POST /orders -> 400 {"error":{"code":"bad_order","message":"send id, item, and positive qty"}}
GET /orders -> 200 [{"id":"o1","item":"book","qty":2,"status":"placed"}]
GET /orders/o1 -> 200 {"id":"o1","item":"book","qty":2,"status":"placed"}
PATCH /orders/o1/status -> 200 {"id":"o1","item":"book","qty":2,"status":"paid"}
PATCH /orders/o1/status -> 422 {"error":{"code":"bad_status","message":"status must be placed, paid, shipped, or cancelled"}}
DELETE /orders/o1 -> 204
DELETE /orders/o1 -> 404 {"error":{"code":"no_order","message":"no order o1"}}
GET /healthz -> 200 {"ok":true}
```
