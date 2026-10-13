// Example 60: Missing Token -- a protected route with no Authorization header at all.
//
// The FIRST of three 401 scenarios (60, 61, 62) sharing the SAME helper --
// only what curl sends differs, which is the whole teaching point. This
// example's curl sends NO header whatsoever:
//
//	curl -i http://127.0.0.1:8000/protected                                        # => 401, "missing" message
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
// => a real service mints fresh tokens with crypto/rand as ex-58 does; this
// => constant exists purely so THIS example's missing-header scenario is reproducible

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

// requireUser is the reusable guard -- any handler opts in by calling it first.
func requireUser(r *http.Request) (string, bool, string) { // => (identity, ok, whyNot): the Go twin of Depends
	const prefix = "Bearer "                                // => the exact scheme a curl -H flag would send
	header := r.Header.Get("Authorization")                 // => canonicalized, so wire casing is irrelevant
	if header == "" || !strings.HasPrefix(header, prefix) { // => co-18: no Authorization header AT ALL
		// => THIS example's scenario specifically: curl with no -H flag whatsoever
		return "", false, "Authorization header missing" // => the specific reason naming this example
	} // => the missing-header branch ends
	presented := header[len(prefix):] // => HTTPBearer already stripped the prefix in Python; Go does it by hand
	storeMu.RLock()                   // => the read lock for the store lookup
	username, ok := tokens[presented] // => server-side truth: no record means never issued here
	storeMu.RUnlock()                 // => release immediately: the value below is a copy
	if !ok {                          // => header present, but the token itself is wrong
		// => Example 61 is the one that actually exercises THIS branch;
		// => unreachable from THIS example's own curl, kept for completeness
		return "", false, "invalid token" // => the wrong-value reason, distinct from missing
	} // => the wrong-token branch ends
	return username, true, "" // => the resolved identity, for the handler to echo
	// => Example 62 is the one that actually reaches this successful return
} // => requireUser ends

// protectedHandler is guarded entirely by the helper above.
func protected(w http.ResponseWriter, r *http.Request) { // => co-18: ZERO auth logic in the body itself
	user, ok, reason := requireUser(r) // => the guard runs BEFORE any handler work starts
	if !ok {                           // => every path that could fail returns a 401 one frame up
		writeError(w, http.StatusUnauthorized, // => co-03: 401 -- the caller never identified itself
			"unauthorized", reason) // => co-11: structured envelope, "missing" names THIS example
		return // => early return: the success body below only runs for a resolved user
	} // => the rejected branch ends
	writeJSON(w, http.StatusOK, map[string]string{"user": user}) // => only reached once requireUser succeeded
} // => protected ends

// newHandler assembles the routing table, separate from main.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()                   // => the routing table: exactly one guarded route
	mux.HandleFunc("GET /protected", protected) // => co-18: guarded by requireUser, not by middleware here
	return mux                                  // => the mux IS an http.Handler, ready to serve
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
