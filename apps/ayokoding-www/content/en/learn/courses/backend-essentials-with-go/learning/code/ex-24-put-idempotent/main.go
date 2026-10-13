// Example 24: PUT Is Idempotent.
//
// PUT means "create or fully replace": two identical PUTs must leave the
// resource in the exact same final state. This example overwrites an
// in-memory map entry twice and confirms the response is byte-identical
// both times -- idempotency verified by direct observation.
package main

import (
	"encoding/json" // => the replacement body and the reply are JSON (co-13)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-02)
	"strconv"       // => the path segment is text until this converts it
)

// items is the in-memory store: intentional process state, cleared on
// every restart. The Intermediate tier replaces it with SQLite proper.
var items = map[int]string{} // => item_id -> name; created or overwritten by PUT

// item is the full intended state of an item, sent by the client.
type item struct {
	Name string `json:"name"` // => PUT REPLACES the whole resource: this is the WHOLE state
}

// replaceItem always overwrites -- the definition of idempotent (co-02).
func replaceItem(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	id, err := strconv.Atoi(r.PathValue("item_id")) // => the typed path param, as in Example 14 (co-12)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"item_id must be an integer"}`))
		return
	}
	var it item
	if err := json.NewDecoder(r.Body).Decode(&it); err != nil { // => the replacement body (co-13)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid json body"}`))
		return
	}
	items[id] = it.Name // => always OVERWRITES, never appends or accumulates
	// => a SECOND identical call writes the SAME value again: idempotent
	// => (co-02) -- map assignment is create-or-replace, which is exactly
	// => RFC 9110's semantics for PUT
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"item_id": r.PathValue("item_id"), "name": items[id]})
	// => reads back the JUST-written value, confirming the overwrite landed
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("PUT /items/{item_id}", replaceItem) // => PUT means "create or fully replace" (co-02)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
