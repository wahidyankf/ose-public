// Example 17: JSON Request Body.
//
// json.NewDecoder(r.Body).Decode(&item) reads the request body and parses
// it into a typed struct in one call -- malformed JSON or mismatched types
// fail there, and the handler answers 400 before doing any real work.
package main

import (
	"encoding/json" // => the decoder AND the encoder: both directions are stdlib (co-13)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-13)
)

// item is the typed shape of the request body (co-13).
type item struct {
	Name  string  `json:"name"`  // => a missing field decodes as "" -- absence is not an error
	Price float64 `json:"price"` // => a JSON string here fails Decode: type mismatch
	// => the struct tags map Go field names to JSON keys; without them the
	// => decoder would match keys case-insensitively to the Go names
}

// createItem parses the body into item, or rejects the request.
func createItem(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close() // => handlers close the bodies they read (co-13)
	var it item
	if err := json.NewDecoder(r.Body).Decode(&it); err != nil { // => parse + type-check in one call
		// => by the time this LINE runs, parsing already happened: a
		// => malformed body never reaches the logic below (co-10)
		w.WriteHeader(http.StatusBadRequest)             // => the stdlib has no auto-422: this branch is yours
		w.Write([]byte(`{"error":"invalid json body"}`)) // => a tiny structured error (co-11)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(it) // => echo the decoded, typed struct straight back
	// => the round trip: JSON in -> typed Go struct -> JSON out (co-13)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /items", createItem) // => POST is the method that pairs a body (co-02)
	// => method-scoped: a GET /items gets the mux's automatic 405, so the
	// => body-parsing code only ever runs for requests that carry one
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
