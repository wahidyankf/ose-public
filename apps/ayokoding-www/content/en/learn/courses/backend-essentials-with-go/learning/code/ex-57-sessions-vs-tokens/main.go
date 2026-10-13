// Example 57: Sessions vs Tokens.
//
// A session and a bearer token both answer the same question -- who is this
// caller? -- but they place the credential in different transports: a cookie
// the browser manages automatically versus a header string the client must
// attach itself. In this stdlib-only Go track both records live server-side
// in maps, because an unsigned opaque token is verifiable only by lookup.
package main

import (
	"crypto/rand"   // => an unguessable credential comes from the OS's source, never a literal
	"crypto/subtle" // => constant-time confirmation of a match (the token-check lesson)
	"encoding/hex"  // => random bytes -> header/cookie-safe printable text
	"encoding/json" // => co-09: every response below is a typed struct, not a hand-built string
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server, as throughout this track (co-06, co-07)
	"strings"       // => strips the "Bearer " scheme prefix from the header
	"sync"          // => net/http serves handlers on their own goroutines; maps need a lock
)

// loginMechanismResponse is what a successful login confirms to the caller.
type loginMechanismResponse struct { // => co-09: a typed response, like a pydantic model
	Mechanism string `json:"mechanism"` // => "session" or "token", so curl output is comparable
}

// sessionLoginResponse adds the cookie VALUE the caller may echo for clarity.
type sessionLoginResponse struct { // => mirrors Python's {"mechanism", "session_id"} shape
	Mechanism string `json:"mechanism"`  // => the confirming field, identical across both logins
	SessionID string `json:"session_id"` // => the opaque id sent in the Set-Cookie header below
}

// tokenLoginResponse carries the credential its own handler just minted.
type tokenLoginResponse struct { // => mirrors Python's {"mechanism", "token"} shape
	Mechanism string `json:"mechanism"` // => same key on both login bodies keeps the contrast readable
	Token     string `json:"token"`     // => the client must hold this and attach it on every later call
}

// profileResponse is the shared identity body both profile endpoints return.
type profileResponse struct { // => co-09: one shape so the two mechanisms' outputs diff cleanly
	Mechanism string `json:"mechanism"` // => tells the reader which store resolved the caller
	Username  string `json:"username"`  // => the identity the record points at (co-17)
}

var (
	storeMu  sync.RWMutex          // => both stores are written by POST handlers and read by GET handlers
	sessions = map[string]string{} // => session id -> username; co-05 caveat: PROCESS-side memory,
	// => gone on restart and invisible to a second worker -- Example 80 makes that concrete
	tokens = map[string]string{} // => opaque token -> username; the Go-ified co-17 tradeoff:
	// => an unsigned token cannot self-verify, so its record lives in a store that some
	// => process must read -- deployed for real, that store is the shared database (capstone)
)

// mintToken produces a fresh 128-bit random credential, hex-encoded.
func mintToken() (string, error) {
	raw := make([]byte, 16) // => 16 bytes = 128 bits of entropy, beyond brute-force reach
	if _, err := rand.Read(raw); err != nil {
		// => rand.Read reads from the OS cryptographic source; ever failing is a
		// => genuine internal error, so the caller must refuse to serve on top of it
		return "", err
	}
	return hex.EncodeToString(raw), nil // => 32 lowercase hex chars, safe in a header or cookie
}

// usernameForSession resolves a session id straight from the sessions map.
func usernameForSession(id string) (string, bool) {
	storeMu.RLock() // => many GETs may run while a POST login writes the same map
	defer storeMu.RUnlock()
	username, ok := sessions[id] // => server-side truth: the RECORD is the identity (co-17)
	return username, ok          // => ok=false covers "no cookie value" and "unknown id" alike
}

// usernameForToken resolves a presented bearer token against the token store.
func usernameForToken(presented string) (string, bool) {
	storeMu.RLock()
	stored, ok := tokens[presented]
	storeMu.RUnlock()
	if !ok {
		// => no record at all: the presented credential was never issued here,
		// => exactly the branch a hardcoded constant skipped in Python's tier
		return "", false
	}
	// => defense in depth: the map hit names a candidate; the byte-level
	// => compare below RE-confirms equality without leaking timing to a caller,
	// => which is why crypto/subtle appears in every token check in this track
	if subtle.ConstantTimeCompare([]byte(presented), []byte(stored)) != 1 {
		return "", false
	}
	return stored, true
}

// bearerToken extracts the credential from "Authorization: Bearer <token>".
func bearerToken(r *http.Request) (string, bool) { // => co-04: reads the raw header like ex-61-63 did in Python
	const prefix = "Bearer "                // => the exact scheme token a curl -H "..." flag would send
	header := r.Header.Get("Authorization") // => net/http canonicalizes, so casing on the wire is irrelevant
	if !strings.HasPrefix(header, prefix) {
		// => absent header or a foreign scheme both funnel into this single
		// => miss -- deliberately ONE outcome for both, never a distinguishing leak
		return "", false
	}
	return header[len(prefix):], true // => just the credential; nothing here re-checks its shape
}

// loginSession stores a server-side session record and sets the cookie.
func loginSession(w http.ResponseWriter, r *http.Request) {
	sid, err := mintToken()
	if err != nil { // => minting failed: refuse loudly instead of issuing a weaker id
		writeError(w, 500, "internal_error", "could not mint a session id")
		return
	}
	storeMu.Lock()
	sessions[sid] = "alice" // => co-17: the SERVER remembers who this session belongs to
	storeMu.Unlock()
	http.SetCookie(w, &http.Cookie{ // => co-04: the browser never even asks -- cookies just arrive
		Name:     "session_id",         // => the exact key profileSession reads back below
		Value:    sid,                  // => the minted id stands in for Python's uuid4 string
		Path:     "/",                  // => usable on every path, like a real session cookie
		HttpOnly: true,                 // => JS cannot read the value -- the cookie's theft-hardening
		SameSite: http.SameSiteLaxMode, // => default-level CSRF mitigation, mirroring Python's SameSite=lax
	})
	writeJSON(w, http.StatusOK, sessionLoginResponse{"session", sid})
}

// profileSession identifies the caller purely from the session cookie.
func profileSession(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id") // => curl's -b flag is what actually presents this cookie
	if err != nil {                       // => err != nil means the request carried NO cookie
		writeError(w, 401, "unauthorized", "no valid session")
		return
	}
	username, ok := usernameForSession(cookie.Value)
	if !ok { // => a cookie the server never issued -- same 401 as a missing one
		writeError(w, 401, "unauthorized", "no valid session")
		return
	}
	writeJSON(w, http.StatusOK, profileResponse{"session", username})
}

// loginToken hands the caller a credential and keeps its record server-side.
func loginToken(w http.ResponseWriter, r *http.Request) {
	token, err := mintToken()
	if err != nil {
		writeError(w, 500, "internal_error", "could not mint a token")
		return
	}
	storeMu.Lock()
	tokens[token] = "alice" // => co-17: this record is what profileToken will read back
	storeMu.Unlock()
	writeJSON(w, http.StatusOK, tokenLoginResponse{"token", token})
}

// profileToken identifies the caller from the Authorization header alone.
func profileToken(w http.ResponseWriter, r *http.Request) {
	username, ok := "", false // => the resolved identity and whether anything resolved at all
	if presented, hasBearer := bearerToken(r); hasBearer {
		username, ok = usernameForToken(presented) // => one lookup drives the whole mechanism
	}
	if !ok { // => missing header AND unknown token collapse into ONE 401 body on purpose
		writeError(w, 401, "unauthorized", "missing or invalid token")
		return
	}
	writeJSON(w, http.StatusOK, profileResponse{"token", username})
}

// helper: the JSON plumbing this track's examples share, kept in-file for self-containment.

// apiError is the one failure envelope shape every example returns (co-11).
type apiError struct { // => {"error":{"code":...,"message":...}} -- co-11's two-key envelope
	Code    string `json:"code"`
	Message string `json:"message"`
}

// errorEnvelope wraps apiError at the fixed "error" key the page documents.
type errorEnvelope struct { // => the outer key stays constant even as statuses vary
	Error apiError `json:"error"`
}

// writeJSON writes body as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json") // => the stdlib never sets this FOR you (co-09)
	w.WriteHeader(status)                              // => the status a client checks first (co-03)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		// => headers are already committed, so a late encode failure is only loggable
		log.Printf("encode response: %v", err)
	}
}

// writeError writes the consistent {"error":{...}} envelope with a status.
func writeError(w http.ResponseWriter, status int, code, message string) { // => co-11, co-03: shape + status
	writeJSON(w, status, errorEnvelope{Error: apiError{Code: code, Message: message}})
}

func main() {
	mux := http.NewServeMux() // => one explicit router for all four routes (co-07)
	mux.HandleFunc("POST /login-session", loginSession)
	mux.HandleFunc("GET /profile-session", profileSession)
	mux.HandleFunc("POST /login-token", loginToken)
	mux.HandleFunc("GET /profile-token", profileToken)
	log.Fatal(http.ListenAndServe("127.0.0.1:8003", mux)) // => the advanced tier's shared port
}
