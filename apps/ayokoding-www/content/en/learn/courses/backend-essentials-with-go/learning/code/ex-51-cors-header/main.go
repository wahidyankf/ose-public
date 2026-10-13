// Example 51: Middleware -- CORS.
//
// The stdlib ships NO CORS helper, so this hand-written middleware is the
// whole policy: only https://example.com gets the header back. A browser
// blocks a cross-origin read WITHOUT the header, even on a 200:
//
//	curl -i -H "Origin: https://example.com" http://127.0.0.1:8000/tasks  # => header present
//	curl -i -H "Origin: https://evil.example" http://127.0.0.1:8000/tasks  # => 200, but NO header
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => the handler's list body rides on the stdlib encoder (co-09)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server: mux, handlers, middleware shape (co-06, co-07)
)

// allowOrigin is the ONLY origin this example trusts with a header back.
const allowOrigin = "https://example.com" // => co-04: a literal allow-list of one, checked per request

// => the one list this example serves -- the handler knows NOTHING about CORS
var tasks = []map[string]string{{"title": "Buy milk"}} // => CORSMiddleware's Go twin decides the header, not this

// withCORS is the middleware: plain func(http.Handler) http.Handler.
func withCORS(next http.Handler) http.Handler { // => the stdlib middleware shape: wrap, don't inherit
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { // => the per-request closure
		origin := r.Header.Get("Origin") // => co-04: reads the raw request header the browser set
		// => Header.Get canonicalizes, so the wire casing of "Origin" is irrelevant
		if origin == allowOrigin { // => exact match: only THIS origin earns the header back
			// => set BEFORE next.ServeHTTP so the header commits with the response
			w.Header().Set("Access-Control-Allow-Origin", origin) // => co-04/co-16: the header a browser enforces
			w.Header().Set("Vary", "Origin")                      // => caches must key on Origin, not serve one copy to all
		} // => the trusted-origin branch ends: untrusted origins get NO header, still a 200
		if r.Method == http.MethodOptions && origin == allowOrigin { // => a preflight probe from a trusted page
			w.Header().Set("Access-Control-Allow-Methods", "GET") // => only GET is permitted cross-origin here
			w.WriteHeader(http.StatusNoContent)                   // => 204: policy stated, no body needed
			return                                                // => short-circuit: the handler never runs for preflight
		} // => the preflight branch ends
		next.ServeHTTP(w, r) // => the real handler runs here, header already queued when deserved
	}) // => the closure ends
} // => withCORS ends: configured once, applies to every route below

// listTasks is the plain handler, unaware any middleware exists.
func listTasks(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature
	w.Header().Set("Content-Type", "application/json") // => the stdlib never guesses JSON for you (co-09)
	_ = json.NewEncoder(w).Encode(tasks)               // => the list body, with or without the CORS header
} // => listTasks ends

// newHandler assembles routing, then wraps it once with the middleware.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()               // => the routing table: exactly one route here
	mux.HandleFunc("GET /tasks", listTasks) // => co-08: no CORS logic inside the handler by design
	return withCORS(mux)                    // => one wrap covers EVERY route
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
