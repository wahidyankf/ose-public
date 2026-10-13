// Example 63: Protect Writes Only -- GET is open, POST/DELETE require a token.
//
// A common real-world policy: ANYONE can read the catalog, but only an
// authenticated caller can change it. The HTTP METHOD itself decides which
// rule applies -- the write routes wear the guard, the read route does not:
//
//	curl http://127.0.0.1:8000/items                                                              # => 200, no token
//	curl -X POST "http://127.0.0.1:8000/items?name=eggs"                                            # => 401
//	curl -X POST "http://127.0.0.1:8000/items?name=eggs" -H "Authorization: Bearer s3cr3t-token-abc123"  # => 200
//	curl -X DELETE http://127.0.0.1:8000/items/1 -H "Authorization: Bearer s3cr3t-token-abc123"      # => 200
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => co-09: every response below is encoded JSON, never hand-built text
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server: method-aware patterns, statuses (co-02, co-07)
	"strconv"       // => the DELETE id arrives as text; this converts it to an int
	"strings"       // => strips the "Bearer " prefix AND trims the ?name= value
	"sync"          // => handlers run on their own goroutines; both maps need a lock
)

// demoToken is the ONE credential the writes accept, kept in a map so the
// check below is a store LOOKUP -- the same shape ex-58's minted tokens use.
const demoToken = "s3cr3t-token-abc123" // => a fixed literal so curl stays deterministic
// => a real service mints fresh tokens with crypto/rand as ex-58 does; this
// => constant exists purely so the read/write SPLIT stays the focus

var (
	tokenMu sync.RWMutex         // => guards the token map below
	tokens  = map[string]string{ // => opaque token -> username; seeded once, read thereafter
		demoToken: "alice", // => the single record the guard resolves
	} // => the map literal closes
	storeMu sync.RWMutex      // => guards the items map AND the counter below
	items   = map[int]string{ // => in-memory store -- fine for this pedagogical example
		1: "milk",  // => two seed rows so the open GET has something to return before any write
		2: "bread", // => the second seed row, visible in the very first curl
	} // => the map literal closes
	nextID = 3 // => the next inserted id (co-05 caveat: not multi-worker safe --
	// => Example 80 revisits this exact tension with a REAL shared file instead)
) // => the store block closes

// apiError is the one failure envelope shape this example returns.
type apiError struct { // => {"code":...,"message":...} -- co-11's two-key envelope
	Code    string `json:"code"`
	Message string `json:"message"`
} // => apiError closes

// errorEnvelope wraps apiError at the fixed "error" key the page documents.
type errorEnvelope struct { // => the outer key stays constant even as statuses vary
	Error apiError `json:"error"`
} // => errorEnvelope closes

// writeJSON centralizes every response this example sends.
func writeJSON(w http.ResponseWriter, status int, payload any) { // => one serialization path
	w.Header().Set("Content-Type", "application/json") // => the stdlib never sets this FOR you (co-09)
	w.WriteHeader(status)                              // => the status the client checks first (co-03)
	_ = json.NewEncoder(w).Encode(payload)             // => one JSON document onto the wire
} // => writeJSON ends

// writeError writes the consistent {"error":{...}} envelope with a status.
func writeError(w http.ResponseWriter, status int, code, message string) { // => co-11, co-03: shape + status
	writeJSON(w, status, errorEnvelope{Error: apiError{Code: code, Message: message}}) // => one line, every error
} // => writeError ends

// validToken reports whether the request carries a known Bearer token.
func validToken(r *http.Request) bool { // => co-18: the yes/no decision, no identity needed here
	const prefix = "Bearer "                // => the exact scheme a curl -H flag would send
	header := r.Header.Get("Authorization") // => canonicalized, so wire casing is irrelevant
	if !strings.HasPrefix(header, prefix) { // => co-18: missing header or a foreign scheme both fail
		return false // => no credential to even look up
	} // => the missing-or-foreign branch ends
	presented := header[len(prefix):] // => just the credential after "Bearer "
	tokenMu.RLock()                   // => the read lock for the token lookup
	_, ok := tokens[presented]        // => server-side truth: no record means never issued here
	tokenMu.RUnlock()                 // => release immediately
	return ok                         // => reaching here with ok IS the "allowed" outcome
} // => validToken ends

// withAuth guards ONE route's side effect: raise-or-don't, then hand off.
func withAuth(next http.Handler) http.Handler { // => plain func(http.Handler) http.Handler, per write route
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { // => the per-request closure
		if !validToken(r) { // => co-18: either failure mode lands here
			writeError(w, http.StatusUnauthorized, // => co-03: 401 -- the write is blocked
				"unauthorized", "missing or invalid token") // => co-11: same envelope as ex-59..62
			return // => short-circuit: the write handler below never starts
		} // => the rejected branch ends
		next.ServeHTTP(w, r) // => allowed: the actual write runs now
	}) // => the closure ends
} // => withAuth ends: no return value needed -- reaching next IS the approval

// listItems is OPEN: no guard anywhere on this path.
func listItems(w http.ResponseWriter, r *http.Request) { // => co-02: reads are safe/idempotent, open to everyone
	storeMu.RLock()                                 // => the read lock: many GETs may run together
	snapshot := make(map[string]string, len(items)) // => string keys: JSON object keys are always strings
	for id, name := range items {                   // => copy under lock, encode after release
		snapshot[strconv.Itoa(id)] = name // => "1" -> "milk", exactly what curl sees
	} // => the copy loop ends
	storeMu.RUnlock()                     // => release before encoding: snapshot is safe to write
	writeJSON(w, http.StatusOK, snapshot) // => co-02: curl with zero headers succeeds here
} // => listItems ends

// createItem is GUARDED: the mux below wraps it with withAuth.
func createItem(w http.ResponseWriter, r *http.Request) { // => co-02, co-18: a WRITE -- token required
	name := strings.TrimSpace(r.URL.Query().Get("name")) // => ?name=eggs, mirroring Python's params={...}
	if name == "" {                                      // => a write with nothing to store is rejected
		writeError(w, http.StatusUnprocessableEntity, // => 422: the query value failed validation
			"invalid_body", "name is required") // => the client sent a write with no content
		return // => early return: nothing is stored on an empty name
	} // => the empty-name branch ends
	storeMu.Lock()                                                      // => the write lock: this insert races with concurrent GETs
	id := nextID                                                        // => claim the next id while holding the lock -- co-05: process-local
	nextID++                                                            // => advance before releasing, so no id is ever reused here
	items[id] = name                                                    // => the actual write this token protects
	storeMu.Unlock()                                                    // => release: GETs may now observe the new row
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "name": name}) // => co-02: 200 by default here,
	// => unlike ex-19's explicit 201 -- the status choice is the handler's own
} // => createItem ends

// deleteItem is GUARDED too: same wrapper, idempotent by design.
func deleteItem(w http.ResponseWriter, r *http.Request) { // => co-02, co-18: a WRITE -- token required
	id, err := strconv.Atoi(r.PathValue("item_id")) // => the {item_id} segment as an int
	if err != nil {                                 // => "/items/abc" was never a resource at all
		writeError(w, http.StatusBadRequest, // => 400: the path itself was malformed
			"invalid_id", "item_id must be an integer") // => text where an int belongs
		return // => early return: no store touch on a malformed id
	} // => the conversion branch ends
	storeMu.Lock()    // => the write lock for the mutation below
	delete(items, id) // => the actual write this token protects -- deleting an absent id
	// => is a no-op (no error), making delete naturally idempotent (co-02)
	storeMu.Unlock()                                              // => release
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true}) // => reports success even if the id was
	// => already gone -- by design, a second identical DELETE still returns the same body
} // => deleteItem ends

// newHandler wires the split: open reads, guarded writes, one line each.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()                                         // => the routing table: method-aware patterns (Go 1.22+)
	mux.HandleFunc("GET /items", listItems)                           // => co-02: NO wrapper at all -- reads stay open
	mux.Handle("POST /items", withAuth(http.HandlerFunc(createItem))) // => co-02, co-18: WRITE guarded
	// => withAuth runs for its SIDE EFFECT ONLY; createItem never sees the token value
	mux.Handle("DELETE /items/{item_id}", withAuth(http.HandlerFunc(deleteItem))) // => same guard, consistent policy
	return mux                                                                    // => the mux IS an http.Handler, ready to serve
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
