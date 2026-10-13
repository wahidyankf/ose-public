// Example 26: Statelessness, Demonstrated.
//
// Three sequential requests, each with a different (or missing) X-Caller
// header, prove that nothing is remembered between them: every response
// depends entirely on that one request's own header, never on any request
// that came before it.
package main

import (
	"encoding/json" // => the per-request answer goes out as JSON (co-09)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-05)
)

// whoamiHandler derives its answer from THIS request and nothing else.
func whoamiHandler(w http.ResponseWriter, r *http.Request) {
	// => no package-level "last caller" variable is read or written here --
	// => the handler has ZERO memory of any request that came before this
	// => one (co-05); contrast Example 24's items map, which is
	// => intentional, in-process state. THIS handler deliberately holds none
	caller := r.Header.Get("X-Caller") // => read from THIS request's headers only (co-04)
	if caller == "" {                  // => reduce "no header sent" to a readable default
		caller = "anonymous" // => the only default in this whole handler
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"you_are": caller}) // => derived entirely from THIS request
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /whoami", whoamiHandler) // => a route whose response depends only on THIS request (co-05)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
