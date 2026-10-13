// Example 52: A Sanitized 500 Envelope for Unhandled Exceptions.
//
// The /boom handler ALWAYS panics with sensitive detail. A recovery
// middleware turns the panic into a generic JSON envelope; the raw message
// only ever reaches server logs, never the wire:
//
//	curl -i http://127.0.0.1:8000/boom   # => 500 {"error":{"code":"internal_error",...}}
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => co-09: every response below is encoded JSON, never hand-built text
	"log"           // => the server-side log that DOES see the sensitive detail
	"net/http"      // => the stdlib server, mux, and middleware shape (co-06, co-07)
)

// apiError is the inner failure shape every example in this batch returns.
type apiError struct { // => {"code":...,"message":...} -- co-11's two-key envelope
	Code    string `json:"code"`    // => a stable, machine-matchable code
	Message string `json:"message"` // => deliberately generic on 500s, never the panic text
} // => apiError closes: the inner object

// errorEnvelope wraps apiError at the fixed "error" key the page documents.
type errorEnvelope struct { // => the outer key stays constant even as statuses vary
	Error apiError `json:"error"` // => one consistent {"error":{...}} shape, every error
} // => errorEnvelope closes

// writeJSON writes body as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, body any) { // => one serialization path for every response
	w.Header().Set("Content-Type", "application/json")      // => the stdlib never sets this FOR you (co-09)
	w.WriteHeader(status)                                   // => the status the client checks first (co-03)
	if err := json.NewEncoder(w).Encode(body); err != nil { // => Encode streams straight onto the wire
		// => headers are already committed, so a late encode failure is only loggable
		log.Printf("encode response: %v", err) // => server-side only, never leaked to the client
	} // => the encode-error branch ends
} // => writeJSON ends

// writeError writes the consistent {"error":{...}} envelope with a status.
func writeError(w http.ResponseWriter, status int, code, message string) { // => co-11, co-03: shape + status
	writeJSON(w, status, errorEnvelope{Error: apiError{Code: code, Message: message}}) // => one line, every error
} // => writeError ends

// withRecovery is the middleware: plain func(http.Handler) http.Handler.
func withRecovery(next http.Handler) http.Handler { // => catches EVERYTHING the routes below panic with
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { // => the per-request closure
		defer func() { // => deferred BEFORE next runs, so it catches that run's panic
			if rec := recover(); rec != nil { // => a panic escaped the handler below
				// => deliberately generic: never leaks rec's message or a stack trace;
				// => a real deployment logs the value SERVER-SIDE here, just never returns it
				log.Printf("panic on %s %s: %v", r.Method, r.URL.Path, rec) // => the ONLY place detail lands
				writeError(w, http.StatusInternalServerError,               // => co-03: server-side failure
					"internal_error", "an unexpected error occurred") // => the sanitized envelope curl sees
			} // => the recovered-panic branch ends
		}() // => the deferred closure ends
		next.ServeHTTP(w, r) // => routing + handler run here, under the recover above
	}) // => the closure ends
} // => withRecovery ends

// boom always fails on purpose, to trigger the middleware above.
func boom(w http.ResponseWriter, r *http.Request) { // => co-08: a handler that never returns normally
	panic("something exploded with sensitive internal details") // => co-11: an ORDINARY panic, not a domain error
	// => this string never reaches the client -- withRecovery replaces it entirely
} // => boom ends: unreachable code after panic, intentionally

// newHandler assembles routing, then wraps it once with the middleware.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()         // => the routing table: exactly one route here
	mux.HandleFunc("GET /boom", boom) // => co-08: always fails, on purpose
	return withRecovery(mux)          // => catches every panic from every route
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
