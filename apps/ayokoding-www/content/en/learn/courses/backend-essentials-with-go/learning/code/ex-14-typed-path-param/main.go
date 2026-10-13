// Example 14: Typed Path Param.
//
// The ServeMux pattern "/items/{item_id}" matches the path segment; the
// handler reads it back with r.PathValue and converts it to an int with
// strconv. The conversion is hand-written -- the stdlib matches text, it
// does not type-check for you, so the failure branch is your code.
package main

import (
	"encoding/json" // => the echoed value goes out as JSON (co-09)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server and its path patterns (co-12)
	"strconv"       // => the typed conversion the mux does NOT do for you
)

// readItem converts the matched segment to an int, or rejects it.
func readItem(w http.ResponseWriter, r *http.Request) {
	idText := r.PathValue("item_id") // => the {item_id} segment, still a string (co-12)
	// => the name inside PathValue MUST match the {item_id} placeholder in
	// => the registered pattern -- that name match is the whole mechanism
	id, err := strconv.Atoi(idText) // => hand-typed conversion: text -> int
	if err != nil {                 // => "/items/abc" fails HERE, inside your own handler
		// => the stdlib has no automatic 422: a failed conversion gets
		// => whatever status YOUR branch writes -- this course uses 400
		w.WriteHeader(http.StatusBadRequest)                      // => reject before doing any work (co-10)
		w.Write([]byte(`{"error":"item_id must be an integer"}`)) // => a tiny error envelope
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"item_id": id}) // => the TYPED int, echoed back
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /items/{item_id}", readItem) // => {item_id} is the path placeholder (co-12)
	// => the mux matched the segment as TEXT; everything typed happens
	// => inside the handler -- that split is the stdlib's whole story
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
