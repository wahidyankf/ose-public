// Example 13: Health Endpoint.
//
// A GET /health route returning a fixed {"status": "ok"} body with the
// default 200 status -- the simplest possible handler, holding zero logic
// beyond a constant reply. A liveness check should never depend on
// anything that can itself fail.
package main

import (
	"encoding/json" // => the fixed body is still JSON on the wire (co-09)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-08)
)

// healthHandler is deliberately trivial: a liveness probe, nothing more.
func healthHandler(w http.ResponseWriter, r *http.Request) {
	// => this handler holds ZERO logic beyond returning a constant --
	// => deliberately so: a liveness probe must never depend on anything
	// => that can fail (a database, a downstream service); the Advanced
	// => tier's /ready endpoint is where a dependency check belongs
	w.Header().Set("Content-Type", "application/json")           // => set before any write (co-04)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"}) // => the constant body
	// => no WriteHeader call: the first Write implies 200, which is
	// => exactly the status a healthy process should report (co-03)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler) // => a conventional liveness-check path (co-08)
	// => GET-scoped: a POST /health gets the mux's automatic 405, which is
	// => fine -- probes only ever GET
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
