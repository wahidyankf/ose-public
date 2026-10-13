// Example 61: Invalid Token -- a protected route with a malformed/wrong token.
//
// A token can be WRONG in two ways -- entirely absent (Example 60) or
// present-but-incorrect (THIS example) -- and a caller sees the SAME 401
// status either way, which is deliberate: never leak which half the caller
// hit. This example's curl sends a WELL-FORMED header with a garbage value:
//
//	curl -i http://127.0.0.1:8000/protected -H "Authorization: Bearer not-a-real-token"  # => 401, "invalid" message
//	curl -i http://127.0.0.1:8000/protected -H "Authorization: Bearer s3cr3t-token-abc123"  # => 200, for contrast
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => co-09: every response below is encoded JSON, never hand-built text
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server: mux, handlers, statuses
	"strings"       // => strips the "Bearer " scheme prefix from the header
	"sync"          // => the map below is read on every guarded request
)

// demoToken is the ONE credential this example accepts, kept in a map so the
// check below is a store LOOKUP -- the same shape ex-58's minted tokens use.
const demoToken = "s3cr3t-token-abc123" // => a fixed literal so curl stays deterministic
// => fully self-contained: nothing here is imported from any other example directory

var (
	storeMu sync.RWMutex         // => guards the map below, like every store in this batch
	tokens  = map[string]string{ // => opaque token -> username; seeded once, read thereafter
		demoToken: "alice", // => the single record the helper resolves
	} // => the map literal closes
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

// requireUser is the reusable guard -- identical SHAPE to Example 60.
func requireUser(r *http.Request) (string, bool, string) { // => (identity, ok, whyNot): the Go twin of Depends
	// => the difference this example exercises lives in what curl SENDS, not in this function's code
	const prefix = "Bearer "                                // => the exact scheme a curl -H flag would send
	header := r.Header.Get("Authorization")                 // => canonicalized, so wire casing is irrelevant
	if header == "" || !strings.HasPrefix(header, prefix) { // => genuinely absent -- Example 60's case
		// => still handled here so this guard stays fully correct standalone
		return "", false, "Authorization header missing" // => the absent reason, kept for completeness
	} // => the missing-header branch ends
	presented := header[len(prefix):] // => the raw string after "Bearer ": HTTPBearer did this in Python
	storeMu.RLock()                   // => the read lock for the store lookup
	username, ok := tokens[presented] // => server-side truth: no record means never issued here
	storeMu.RUnlock()                 // => release immediately: the value below is a copy
	if !ok {                          // => co-18: THIS example's focus -- present but WRONG
		// => a well-formed "Bearer <garbage>" header still fails the lookup;
		// => the prefix strip above means .presented holds just the raw string
		return "", false, "token is invalid" // => distinct message from the missing case above
	} // => the wrong-token branch ends
	return username, true, "" // => the resolved identity -- unreachable from THIS example's own curl,
	// => since the token sent is deliberately wrong, but still needed so every path returns a string
} // => requireUser ends

// protectedHandler is guarded entirely by the helper above.
func protected(w http.ResponseWriter, r *http.Request) { // => co-18: the body stays a single line of success
	user, ok, reason := requireUser(r) // => the guard runs BEFORE this body ever starts
	if !ok {                           // => the failure path: never calls the success line below
		writeError(w, http.StatusUnauthorized, // => co-03: 401 either way -- missing AND wrong collapse to one status
			"unauthorized", reason) // => co-11: structured envelope, "invalid" names THIS example
		return // => early return: the echo below only runs for a resolved user
	} // => the rejected branch ends
	writeJSON(w, http.StatusOK, map[string]string{"user": user}) // => never reached with THIS example's garbage token
} // => protected ends

// newHandler assembles the routing table, separate from main.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()                   // => the routing table: exactly one guarded route
	mux.HandleFunc("GET /protected", protected) // => co-18: guarded by requireUser, handler stays one success line
	return mux                                  // => the mux IS an http.Handler, ready to serve
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
