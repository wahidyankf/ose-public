// Example 28: curl POST JSON, End to End.
//
// The complete local dev loop in miniature: serve with `go run .`, POST a
// JSON body with curl, and read the exact same shape back out -- the
// smallest possible example that exercises every step of the dev loop
// (co-22) at once.
package main

import (
	"encoding/json" // => decode the POST body, encode it straight back (co-13)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-22)
)

// echo is a body echoed straight back -- it proves the round trip.
type echo struct {
	Message string `json:"message"` // => arbitrary text the caller sends
	Count   int    `json:"count"`   // => a second, differently-typed field in the same body
	// => string AND int in one struct: Decode type-checks BOTH (co-10)
}

// echoHandler is the smallest possible "does the whole pipeline work" check.
func echoHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	var in echo
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil { // => curl sends JSON; this parses it (co-13)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid json body"}`))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(in) // => whatever curl sent, serialized straight back out
	// => byte-for-byte the same shape, just round-tripped through the
	// => typed struct: the full request -> handler -> response pipeline
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /echo", echoHandler) // => the final beginner-tier route; curl exercises it below
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
