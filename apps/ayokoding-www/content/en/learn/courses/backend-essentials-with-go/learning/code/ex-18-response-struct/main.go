// Example 18: A Separate Response Struct Filters the Output.
//
// Two distinct structs -- one for the input shape, one for the output
// shape -- keep a sensitive field reachable on the way in but structurally
// absent on the way out. The filtering happens by construction: the output
// struct simply has no field to leak.
package main

import (
	"encoding/json" // => both directions are stdlib (co-09, co-13)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server
)

// itemIn is the INPUT validation shape: everything the client may send.
type itemIn struct {
	Name       string `json:"name"`        // => safe to echo back to the client
	SecretNote string `json:"secret_note"` // => a field the response must NOT leak
}

// itemOut is the OUTPUT shape: a strict subset of itemIn's fields.
type itemOut struct {
	Name string `json:"name"` // => the ONLY field this struct is allowed to expose
}

// createItem decodes with itemIn and answers with itemOut.
func createItem(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	var in itemIn
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil { // => input validated first (co-10)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid json body"}`))
		return
	}
	out := itemOut{Name: in.Name} // => filtering BY CONSTRUCTION (co-09)
	// => even if this handler later grew and returned in itself by
	// => mistake, out above is the only thing ever encoded -- secret_note
	// => has no route to the wire because itemOut has no such field
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out) // => secret_note never reaches the response body
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /items", createItem) // => the same route shape as Example 17 (co-02)
	// => one input struct and one output struct is the Go-stdlib version
	// => of the Python track's response_model pattern (co-09, co-10)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
