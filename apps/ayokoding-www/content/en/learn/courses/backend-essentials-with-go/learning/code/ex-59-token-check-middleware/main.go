// Example 59: Token-Check Middleware -- validates a Bearer token on protected routes.
//
// A MIDDLEWARE runs before routing decides which handler runs, so it is the
// right place for the cross-cutting question "is this caller allowed in?"
// rather than repeating the check in every handler. Only /protected needs a
// token here; /public never enters the token branch:
//
//	curl -i http://127.0.0.1:8000/public                                                     # => 200, no headers needed
//	curl -i http://127.0.0.1:8000/protected/data -H "Authorization: Bearer s3cr3t-token-abc123"  # => 200
//	curl -i http://127.0.0.1:8000/protected/data                                            # => 401
package main // => one directory, one command; every import below is standard library

import (
	"context"       // => carries the resolved identity from middleware to handler
	"encoding/json" // => co-09: every response below is encoded JSON, never hand-built text
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server: mux, handlers, middleware shape (co-06, co-07)
	"strings"       // => strips the "Bearer " scheme prefix from the header
	"sync"          // => the map below is read on every guarded request
)

// demoToken is the ONE credential this example accepts, kept in a map so the
// check below is a store LOOKUP -- the same shape ex-58's minted tokens use.
const demoToken = "s3cr3t-token-abc123" // => a fixed literal so curl stays deterministic
// => a real service mints fresh tokens with crypto/rand as ex-58 does; this
// => constant exists purely so the focus stays on the CHECK, not the minting

var (
	storeMu sync.RWMutex         // => guards the map below, like every store in this batch
	tokens  = map[string]string{ // => opaque token -> username; seeded once, read thereafter
		demoToken: "alice", // => the single record the middleware resolves
	} // => the map literal closes
) // => the store block closes

// ctxKey is the private context key type for the resolved identity.
type ctxKey string // => an unexported type: no other package can collide with it

// userKey is the single context key the middleware writes and the handler reads.
const userKey ctxKey = "user" // => the per-request namespace, like Python's request.state

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

// bearerToken extracts the credential from "Authorization: Bearer <token>".
func bearerToken(r *http.Request) (string, bool) { // => co-04: reads the raw header
	const prefix = "Bearer "                // => the exact scheme a curl -H flag would send
	header := r.Header.Get("Authorization") // => canonicalized, so wire casing is irrelevant
	if !strings.HasPrefix(header, prefix) { // => absent header AND a foreign scheme collapse here
		return "", false // => ONE outcome for both, never a distinguishing leak
	} // => the missing-or-foreign branch ends
	return header[len(prefix):], true // => just the credential; shape is checked by the store next
} // => bearerToken ends

// usernameForToken resolves a presented token against the token store.
func usernameForToken(presented string) (string, bool) { // => the store lookup IS the verification
	storeMu.RLock()                   // => many guarded GETs may run while nothing here ever writes
	defer storeMu.RUnlock()           // => released on return
	username, ok := tokens[presented] // => server-side truth: no record means never issued here
	return username, ok               // => ok=false covers "no header" and "unknown token" alike
} // => usernameForToken ends

// withTokenCheck is the middleware: plain func(http.Handler) http.Handler.
func withTokenCheck(next http.Handler) http.Handler { // => co-16: wraps EVERY request/response
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { // => the per-request closure
		if !strings.HasPrefix(r.URL.Path, "/protected") { // => co-16: only THIS prefix is guarded
			// => Example 63 explores a read/write split instead of this path-prefix split
			next.ServeHTTP(w, r) // => open path: untouched, straight to routing
			return               // => early return: the token branch below never runs for /public
		} // => the open-path branch ends
		presented, hasBearer := bearerToken(r) // => co-04: the raw header, scheme stripped
		username, ok := "", false              // => the resolved identity and whether anything resolved
		if hasBearer {                         // => only look up when a Bearer value was actually sent
			username, ok = usernameForToken(presented) // => one lookup drives the whole policy
		} // => the lookup branch ends
		if !ok { // => co-18: exact match or nothing -- no partial credit
			// => this branch fires for BOTH a missing header and a garbage one
			writeJSON(w, http.StatusUnauthorized, // => co-03: 401 -- who you claim to be was rejected
				errorEnvelope{Error: apiError{Code: "unauthorized", Message: "missing or invalid token"}}) // => co-11: structured, never bare
			return // => short-circuit: routing never runs, the guarded handler never starts
		} // => the rejected branch ends
		ctx := context.WithValue(r.Context(), userKey, username) // => co-16: attaches identity for the handler
		// => context is the Go twin of request.state: middleware writes, handlers read
		next.ServeHTTP(w, r.WithContext(ctx)) // => guarded path, identity attached -- routing runs now
	}) // => the closure ends
} // => withTokenCheck ends: the ENTIRE policy lives in this one condition

// publicHandler never touches the token branch at all.
func publicHandler(w http.ResponseWriter, r *http.Request) { // => no /protected prefix, always open
	writeJSON(w, http.StatusOK, map[string]string{"access": "public"}) // => zero headers, zero token, always
} // => publicHandler ends

// protectedHandler contains NO auth logic -- that separation is the whole point.
func protectedHandler(w http.ResponseWriter, r *http.Request) { // => co-18: only reachable with a valid token
	username, _ := r.Context().Value(userKey).(string) // => identity set by the middleware, not re-derived here
	// => the type assertion is safe: the middleware guaranteed a string before routing here
	writeJSON(w, http.StatusOK, map[string]string{"access": "protected", "user": username}) // => the trusted identity
} // => protectedHandler ends

// newHandler assembles routing, then wraps it once with the middleware.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()                               // => the routing table: two routes, one guard
	mux.HandleFunc("GET /public", publicHandler)            // => open: never enters the token branch
	mux.HandleFunc("GET /protected/data", protectedHandler) // => guarded: middleware checked it first
	return withTokenCheck(mux)                              // => one wrap covers EVERY route
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
