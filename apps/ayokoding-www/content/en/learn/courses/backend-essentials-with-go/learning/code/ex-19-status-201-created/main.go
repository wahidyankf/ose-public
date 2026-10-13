// Example 19: Status 201 Created.
//
// w.WriteHeader(http.StatusCreated) overrides net/http's implicit 200 --
// RFC 9110's precise meaning for "a new resource now exists" is exactly
// what 201 (not 200) communicates to a well-behaved client.
package main

import (
	"encoding/json" // => the created resource echoes back as JSON (co-09)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server and its status constants (co-03)
)

// task is the resource the client wants created.
type task struct {
	Title string `json:"title"` // => the one field this minimal task model carries
}

// createTask decodes the body and answers with the precise 201 status.
func createTask(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	var t task
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil { // => input validated first (co-10)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid json body"}`))
		return
	}
	w.Header().Set("Content-Type", "application/json") // => headers BEFORE the status write (co-04)
	// => http.StatusCreated is just the self-documenting name for the int
	// => 201 -- a bare 201 works too, but the constant reads clearly
	w.WriteHeader(http.StatusCreated) // => 201, not the implicit 200 (co-03)
	// => without this call the first Write would have implied 200 -- a
	// => technically-passing but IMPRECISE code for "a new resource exists"
	json.NewEncoder(w).Encode(t) // => the body AFTER WriteHeader: wire order matters (co-01)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /tasks", createTask) // => POST creates; 201 is its precise status (co-02, co-03)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
