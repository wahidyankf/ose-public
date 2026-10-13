// Example 15: Typed Query Param.
//
// r.URL.Query().Get("q") reads a query parameter straight from the URL --
// with no conversion and no required-ness check from the stdlib. A missing
// q arrives as the empty string, so "required" is a branch you write.
package main

import (
	"encoding/json" // => the echoed value goes out as JSON (co-09)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-12)
)

// search treats q as REQUIRED: an absent or empty value is a client error.
func search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q") // => "" both when absent and when sent empty (co-12)
	// => Get returns the zero value -- "" -- for a missing key: the stdlib
	// => never rejects anything, so "required" is this handler's own rule
	if q == "" { // => the required-ness check, hand-written (co-10)
		w.WriteHeader(http.StatusBadRequest) // => refuse before doing any work
		w.Write([]byte(`{"error":"missing required query param q"}`))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"query": q}) // => echoes the parsed value back
	// => q is already decoded text: "?q=hi%20there" arrives as "hi there"
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /search", search) // => note: no {q} placeholder anywhere in this path
	// => a query param lives in r.URL.Query(), never in the pattern --
	// => the split between path and query params is entirely conventional (co-12)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
