// => Capstone tests: the order service contract as go test subtests.
// => Each subtest serves one request in-process against a shared router and
// => logs the contract it proves. Subtests run in order on purpose: create,
// => move, and delete form one lifecycle, like a round trip. Run with
// => go test -v: the harness strips timing and the ok line before goldens.
package main

import (
	"github.com/gin-gonic/gin" // => the router under test (co-09)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds write bodies from fixed strings
	"testing"                  // => the test toolchain: Run, Logf, Errorf
)

// => serve builds one JSON request, serves it, and returns the recorder.
// => the shared test helper: construction lives in exactly one place
func serve(router *gin.Engine, method string, target string, body string) *httptest.ResponseRecorder { // => method, path, and payload in
	// => strings.NewReader turns the fixed body into a request stream
	req := httptest.NewRequest(method, target, strings.NewReader(body)) // => no socket, fixed bytes
	req.Header.Set("Content-Type", "application/json")                  // => write bodies bind below
	w := httptest.NewRecorder()                                         // => the assertion surface
	router.ServeHTTP(w, req)                                            // => the whole service runs per call
	return w                                                            // => callers assert on status and body
}

// => check asserts one status plus exact body, then logs the proven contract.
// => t.Helper marks this a helper: failures point at the caller line
func check(t *testing.T, w *httptest.ResponseRecorder, code int, body string) { // => the recorder plus its expectations
	// => helper context: failures point at the calling subtest line
	t.Helper()          // => failures blame the subtest, not this helper
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
