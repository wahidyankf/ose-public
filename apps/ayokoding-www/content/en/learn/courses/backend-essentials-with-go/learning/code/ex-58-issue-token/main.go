// Example 58: Issue a Token -- POST /login returns a token string.
//
// Where does the token a client presents on every later call actually come
// FROM? This issuing endpoint: it verifies one hardcoded user, then mints a
// fresh opaque token with crypto/rand and remembers it server-side:
//
//	curl -X POST http://127.0.0.1:8000/login -H 'Content-Type: application/json' -d '{"username":"alice","password":"wonderland"}'
//	curl -X POST http://127.0.0.1:8000/login -H 'Content-Type: application/json' -d '{"username":"alice","password":"wrong"}'  # => 401
package main // => one directory, one command; every import below is standard library

import (
	"crypto/rand"   // => an unguessable credential comes from the OS source, never a literal
	"encoding/hex"  // => random bytes -> header-safe printable text
	"encoding/json" // => the login body AND the token body both ride on the stdlib codec
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server: mux, handlers, statuses
	"strings"       // => TrimSpace, so whitespace-only credentials count as missing too
	"sync"          // => net/http serves handlers on their own goroutines; the map needs a lock
)

// username and password are the ONE registered user this example recognizes.
const (
	username = "alice"      // => the pedagogical user curl submits
	password = "wonderland" // => a hardcoded password -- never do this in real code (co-17 caveat)
	// => a real login endpoint looks up the user, verifies a HASHED password,
	// => then mints a fresh token -- this constant exists so curl stays deterministic
) // => the credentials block closes

var (
	storeMu sync.RWMutex          // => POST /login writes while later checks read the same map
	tokens  = map[string]string{} // => opaque token -> username; the record IS the identity (co-17)
	// => an unsigned opaque token cannot self-verify, so its record must live
	// => somewhere this process reads -- deployed for real, that store is the database
) // => the store block closes

// credentials is the shape POST /login expects.
type credentials struct { // => co-10: a typed model validates the login body
	Username string `json:"username"` // => a plain required string field
	Password string `json:"password"` // => required too, never returned or logged anywhere
} // => credentials closes

// tokenResponse declares the exact shape of a successful login.
type tokenResponse struct { // => co-09: the body IS just the token
	Token string `json:"token"` // => the ONLY thing the client needs for future requests
} // => tokenResponse closes

// apiError is the one failure envelope shape this example returns.
type apiError struct { // => {"code":...,"message":...} -- co-11's two-key envelope
	Code    string `json:"code"`
	Message string `json:"message"`
} // => apiError closes

// errorEnvelope wraps apiError at the fixed "error" key the page documents.
type errorEnvelope struct { // => the outer key stays constant even as statuses vary
	Error apiError `json:"error"`
} // => errorEnvelope closes

// detailEnvelope is the 422 body for a malformed login shape.
type detailEnvelope struct { // => co-10: validation failures list the problem, like FastAPI's detail
	Detail string `json:"detail"` // => one sentence: what the body was missing
} // => detailEnvelope closes

// mintToken produces a fresh 128-bit random credential, hex-encoded.
func mintToken() (string, error) { // => (value, error): the Go convention for a fallible mint
	raw := make([]byte, 16)                   // => 16 bytes = 128 bits of entropy, beyond brute-force reach
	if _, err := rand.Read(raw); err != nil { // => the OS source failed: refuse, never fall back to weak
		return "", err // => the caller turns this into a 500 -- no token without entropy
	} // => the failure branch ends
	return hex.EncodeToString(raw), nil // => 32 lowercase hex chars, safe in an Authorization header
} // => mintToken ends

// writeJSON centralizes every response this example sends.
func writeJSON(w http.ResponseWriter, status int, payload any) { // => one serialization path
	w.Header().Set("Content-Type", "application/json") // => the stdlib never sets this FOR you (co-09)
	w.WriteHeader(status)                              // => the status the client checks first (co-03)
	_ = json.NewEncoder(w).Encode(payload)             // => one JSON document onto the wire
} // => writeJSON ends

// login verifies credentials, then issues a token -- no session created.
func login(w http.ResponseWriter, r *http.Request) { // => co-17, co-18: issues a token, stores the record
	defer r.Body.Close()                                           // => always release the request body, valid or not
	var creds credentials                                          // => the zero-value target the decoder fills
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil { // => malformed JSON never reaches the check
		writeJSON(w, http.StatusUnprocessableEntity, // => co-10: validation runs BEFORE handler logic
			detailEnvelope{Detail: "username and password are required"}) // => 422, no token minted
		return // => early return: nothing below runs on an unreadable body
	} // => the decode branch ends
	if strings.TrimSpace(creds.Username) == "" || strings.TrimSpace(creds.Password) == "" { // => a field omitted entirely
		writeJSON(w, http.StatusUnprocessableEntity, // => co-10: missing field, same 422 as malformed JSON
			detailEnvelope{Detail: "username and password are required"}) // => never hints WHICH field was missing
		return // => early return: no partial credential on failure
	} // => the missing-field branch ends
	if creds.Username != username || creds.Password != password { // => reject any mismatch immediately
		// => deliberately ONE message for a wrong username AND a wrong password,
		// => so a caller cannot enumerate valid usernames from the response
		writeJSON(w, http.StatusUnauthorized, // => co-03: 401, not 404 -- the identity was rejected
			errorEnvelope{Error: apiError{Code: "unauthorized", Message: "invalid credentials"}}) // => no token leaked
		return // => early return: a failed login mints nothing
	} // => the bad-credentials branch ends
	token, err := mintToken() // => the fresh credential this login exists to create
	if err != nil {           // => no entropy: refuse loudly instead of issuing a weaker token
		writeJSON(w, http.StatusInternalServerError, // => 500: the server, not the caller, failed
			errorEnvelope{Error: apiError{Code: "internal_error", Message: "could not mint a token"}}) // => sanitized
		return // => early return: no record without a real token
	} // => the mint-failure branch ends
	storeMu.Lock()                                           // => the write lock: this insert races with later token checks
	tokens[token] = username                                 // => co-17: the SERVER remembers who this token belongs to
	storeMu.Unlock()                                         // => release: the next request may now present this token
	writeJSON(w, http.StatusOK, tokenResponse{Token: token}) // => co-09: just the token -- no session, no extra keys
	// => no server-side session beyond the token record: co-17's defining difference
} // => login ends

// newHandler assembles the routing table, separate from main.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()            // => the routing table: exactly one route here
	mux.HandleFunc("POST /login", login) // => co-17, co-18: the issuing endpoint
	return mux                           // => the mux IS an http.Handler, ready to serve
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
