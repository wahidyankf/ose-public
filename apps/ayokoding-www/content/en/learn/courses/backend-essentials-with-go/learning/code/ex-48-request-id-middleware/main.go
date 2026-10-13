// Example 48: Middleware -- X-Request-Id.
//
// Every response carries a fresh X-Request-Id header that no handler sets
// by hand: a middleware wrapper runs around the mux, stamps the header,
// then hands the request to routing. Try it with curl:
//
//	curl -i http://127.0.0.1:8000/tasks
//	curl -i http://127.0.0.1:8000/tasks   # => a DIFFERENT id from the first call
package main // => one directory, one command; every import below is standard library

import (
	"crypto/rand"   // => the OS cryptographic source for the fresh id on every request
	"encoding/json" // => the handler's list body rides on the stdlib encoder (co-09)
	"fmt"           // => formats the 16 random bytes as a UUID-shaped string
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server: mux, handlers, middleware shape (co-06, co-07)
)

// => the one list this example serves -- the handler knows NOTHING about request ids
var tasks = []map[string]string{{"title": "Buy milk"}} // => the body curl sees, header aside

// newRequestID mints a fresh UUIDv4-shaped string from 16 random bytes.
func newRequestID() string { // => one call per request: freshness lives here, not in the handler
	raw := make([]byte, 16)                   // => 128 bits of entropy, beyond brute-force reach
	if _, err := rand.Read(raw); err != nil { // => the OS source failed: no id is better than a weak one
		// => rand.Read fails only when the OS cannot supply entropy, so the
		// => fallback below still returns SOMETHING unique rather than an empty header
		return "00000000-0000-4000-8000-000000000000" // => a fixed fallback, never used in practice
	} // => the failure branch ends: below here raw holds 16 fresh bytes
	raw[6] = raw[6]&0x0f | 0x40                     // => forces the version nibble to 4, the UUIDv4 marker
	raw[8] = raw[8]&0x3f | 0x80                     // => forces the variant bits to 10, per RFC 4122
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", // => the 8-4-4-4-12 UUID text shape curl will see
		raw[0:4], raw[4:6], raw[6:8], raw[8:10], raw[10:16]) // => slices of the random bytes, hex-encoded
} // => newRequestID ends: a fresh, unpredictable id on every call

// withRequestID is the middleware: plain func(http.Handler) http.Handler.
func withRequestID(next http.Handler) http.Handler { // => the stdlib middleware shape: wrap, don't inherit
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { // => the per-request closure
		id := newRequestID() // => minted BEFORE routing, so it exists even if the handler fails
		// => set the header BEFORE next.ServeHTTP: net/http commits headers on
		// => the first Write, so a Set AFTER the handler would be silently lost --
		// => the Go analogue of Python's mutate-response-after-call_next, moved earlier
		w.Header().Set("X-Request-Id", id) // => co-04: the OUTGOING header, stamped on the way in
		next.ServeHTTP(w, r)               // => routing + the matched handler run here, header already queued
	}) // => the closure ends: the SAME response now carries the header
} // => withRequestID ends: zero per-route code, every route gets the header

// listTasks is the plain handler, unaware any middleware exists.
func listTasks(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature
	w.Header().Set("Content-Type", "application/json") // => the stdlib never guesses JSON for you (co-09)
	_ = json.NewEncoder(w).Encode(tasks)               // => the list body; the middleware adds the header around this
	// => Encode writes the body; the X-Request-Id header was queued before this ran
} // => listTasks ends: no id logic here by design

// newHandler assembles routing, then wraps it once with the middleware.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()               // => the routing table: exactly one route here
	mux.HandleFunc("GET /tasks", listTasks) // => co-08: a handler that knows nothing about request ids
	return withRequestID(mux)               // => one wrap covers EVERY route, now and later
} // => newHandler ends: mux inside, middleware outside

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
