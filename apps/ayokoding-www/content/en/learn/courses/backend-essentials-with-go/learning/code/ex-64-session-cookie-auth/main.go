// Example 64: Session-Cookie Auth -- set a session cookie on login, read it next request.
//
// Login mints server-side state; the browser only ever holds an opaque
// cookie pointing at it. The cookie's PRESENCE in the store is the entire
// proof of identity for every request after the original login:
//
//	curl -c jar.txt -X POST "http://127.0.0.1:8000/login?username=alice&password=wonderland"  # => Set-Cookie lands in jar.txt
//	curl -b jar.txt http://127.0.0.1:8000/me                                                  # => 200 {"username":"alice"}
//	curl http://127.0.0.1:8000/me                                                             # => 401, no cookie jar at all
package main // => one directory, one command; every import below is standard library

import (
	"crypto/rand"   // => an unguessable session id comes from the OS source, never a counter
	"encoding/hex"  // => random bytes -> cookie-safe printable text
	"encoding/json" // => co-09: every response below is encoded JSON, never hand-built text
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server, including its cookie jar primitives (co-04, co-17)
	"sync"          // => net/http serves handlers on their own goroutines; the map needs a lock
)

// username and password are the ONE registered user this example recognizes.
const (
	username = "alice"      // => the pedagogical user curl submits
	password = "wonderland" // => a hardcoded password -- never do this in real code (co-17 caveat)
	// => a real login endpoint hashes and salts stored passwords -- this constant
	// => exists purely so curl has something deterministic to submit
) // => the credentials block closes

var (
	storeMu  sync.RWMutex          // => POST /login writes while GET /me reads the same map
	sessions = map[string]string{} // => session_id -> username; server-side state (co-17) -- this dict
	// => IS the session store; a real deployment puts this in Redis/a DB, because
	// => in-process memory vanishes on restart and is not shared across workers
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

// mintSessionID produces a fresh 128-bit random identifier, hex-encoded.
func mintSessionID() (string, error) { // => (value, error): the Go convention for a fallible mint
	raw := make([]byte, 16)                   // => 16 bytes = 128 bits: unguessable, never sequential
	if _, err := rand.Read(raw); err != nil { // => the OS source failed: refuse, never fall back to weak
		return "", err // => the caller turns this into a 500 -- no session without entropy
	} // => the failure branch ends
	return hex.EncodeToString(raw), nil // => 32 lowercase hex chars, safe inside a Cookie value
	// => also rotated on EVERY login, so an old leaked cookie cannot be replayed indefinitely
} // => mintSessionID ends

// login authenticates, then ESTABLISHES a session -- unlike ex-58's token
// endpoint, this one has a SIDE EFFECT: a new entry in the sessions map.
func login(w http.ResponseWriter, r *http.Request) { // => co-17: the session-creating endpoint
	gotUser := r.URL.Query().Get("username")        // => ?username=alice, mirroring Python's query-param login
	gotPass := r.URL.Query().Get("password")        // => ?password=wonderland -- curl's -c flag captures the result
	if gotUser != username || gotPass != password { // => co-17: reject any mismatch immediately
		// => deliberately the SAME message for a wrong username AND a wrong password --
		// => never let a caller distinguish "no such user" from "wrong password"
		writeError(w, http.StatusUnauthorized, // => co-03: 401 -- the credentials were rejected
			"unauthorized", "invalid credentials") // => a failed login must never set a cookie below
		return // => early return: no session entry, no Set-Cookie on failure
	} // => the bad-credentials branch ends
	sid, err := mintSessionID() // => a fresh, unguessable session identifier
	if err != nil {             // => no entropy: refuse loudly instead of issuing a weaker id
		writeError(w, http.StatusInternalServerError, // => 500: the server, not the caller, failed
			"internal_error", "could not create a session") // => sanitized, nothing leaked
		return // => early return: no record without a real id
	} // => the mint-failure branch ends
	storeMu.Lock()                  // => the write lock: this insert races with concurrent /me reads
	sessions[sid] = username        // => co-17: the SERVER remembers this session belongs to username
	storeMu.Unlock()                // => release: the next /me may now present this cookie
	http.SetCookie(w, &http.Cookie{ // => co-04: writes the Set-Cookie header -- curl's -c flag captures it
		Name:     "session_id",         // => the exact key meHandler reads back below
		Value:    sid,                  // => the minted id stands in for Python's uuid4 string
		Path:     "/",                  // => usable on every path, like a real session cookie
		HttpOnly: true,                 // => co-04: JS cannot read it -- mitigates theft via XSS
		SameSite: http.SameSiteLaxMode, // => default-level CSRF mitigation, mirroring Python's httponly cookie
	}) // => the SetCookie call closes
	writeJSON(w, http.StatusOK, map[string]string{"logged_in_as": username}) // => co-17: confirms WHO logged in --
	// => never the session id itself: leaking it in the JSON body too would defeat HttpOnly above
} // => login ends

// meHandler identifies the caller purely from the session cookie on THIS request.
func meHandler(w http.ResponseWriter, r *http.Request) { // => co-17: no password re-check anywhere here
	cookie, err := r.Cookie("session_id") // => curl's -b flag is what actually SENDS this cookie back
	if err != nil {                       // => err != nil means the request carried NO such cookie
		writeError(w, http.StatusUnauthorized, // => co-03: 401 -- no session presented
			"unauthorized", "no active session") // => covers "no cookie" and, below, "unknown cookie"
		return // => early return: no identity without a cookie
	} // => the missing-cookie branch ends
	storeMu.RLock()                     // => the read lock for the session lookup
	owner, ok := sessions[cookie.Value] // => the server never issued it, or a restart emptied the map
	storeMu.RUnlock()                   // => release immediately: owner below is a copy
	if !ok {                            // => no record: the cookie points at nothing this process remembers
		// => also covers a server restart, since sessions is in-memory and empties on reload
		writeError(w, http.StatusUnauthorized, // => co-03: same 401 as a missing cookie, deliberately
			"unauthorized", "no active session") // => never distinguishes the two -- no oracle for attackers
		return // => early return: only a known session reaches the echo below
	} // => the unknown-session branch ends
	writeJSON(w, http.StatusOK, map[string]string{"username": owner}) // => the SAME identity from login, confirmed
	// => co-17: the cookie's PRESENCE in sessions is the entire proof -- no password involved
} // => meHandler ends

// newHandler assembles the routing table, separate from main.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()            // => the routing table: two routes, one store
	mux.HandleFunc("POST /login", login) // => co-17: establishes the session + sets the cookie
	mux.HandleFunc("GET /me", meHandler) // => co-17: reads the cookie back on the NEXT request
	return mux                           // => the mux IS an http.Handler, ready to serve
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
