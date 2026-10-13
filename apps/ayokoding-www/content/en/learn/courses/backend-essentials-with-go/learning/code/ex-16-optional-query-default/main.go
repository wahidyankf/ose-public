// Example 16: Optional Query Param with a Default.
//
// Giving a query parameter a default value (limit = 10) makes it optional:
// the request without ?limit= uses the default, and a provided value is
// parsed with strconv -- where a non-integer is rejected by hand.
package main

import (
	"encoding/json" // => the echoed value goes out as JSON (co-09)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-12)
	"strconv"       // => the typed conversion for the provided value
)

// listItems uses limit=10 when the client sends nothing at all.
func listItems(w http.ResponseWriter, r *http.Request) {
	limit := 10 // => the default: any request without ?limit= keeps this
	// => the presence check is the ONLY thing that makes limit optional --
	// => compare Example 15, where the missing q was refused outright
	if s := r.URL.Query().Get("limit"); s != "" { // => only entered when the client sent a value
		n, err := strconv.Atoi(s) // => typed conversion, hand-written (co-12)
		if err != nil {           // => ?limit=abc lands here -- the typed check
			w.WriteHeader(http.StatusBadRequest) // => reject before any work (co-10)
			w.Write([]byte(`{"error":"limit must be an integer"}`))
			return
		}
		limit = n // => the caller's value wins over the default
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"limit": limit}) // => echoes whichever value was used
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /items", listItems) // => a listing route -- the shape the Advanced
	// => tier's limit/offset pagination builds directly on top of (co-19)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
