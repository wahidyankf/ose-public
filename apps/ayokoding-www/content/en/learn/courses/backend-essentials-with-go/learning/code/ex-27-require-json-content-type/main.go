// Example 27: A Hand-Written Content-Type Rejection.
//
// The stdlib automates NOTHING here: net/http never checks Content-Type,
// so this handler refuses a JSON-shaped body sent with a wrong media type
// BEFORE any parsing runs -- a hand-written 415, where the Python track's
// FastAPI did the equivalent natively by framework default.
package main

import (
	"encoding/json" // => the decode only runs once the media type is right (co-13)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-21)
	"strings"       // => prefix match tolerates "; charset=utf-8" parameters
)

// note is the body type -- but parsing only runs once Content-Type is right.
type note struct {
	Text string `json:"text"` // => the one required field this minimal note model carries
}

// createNote checks the media type FIRST, then parses the body.
func createNote(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	// => the hand-written check the stdlib does NOT do for you (co-21):
	// => net/http never parses, validates, or rejects based on Content-Type,
	// => so the check lives in this handler, before Decode ever runs
	if ct := r.Header.Get("Content-Type"); !strings.HasPrefix(ct, "application/json") {
		// => HasPrefix, not equality: "application/json; charset=utf-8"
		// => is still a JSON promise and must not be rejected
		w.WriteHeader(http.StatusUnsupportedMediaType)                       // => 415: refuse BEFORE any parsing (co-03)
		w.Write([]byte(`{"error":"Content-Type must be application/json"}`)) // => structured envelope (co-11)
		return
	}
	var n note
	if err := json.NewDecoder(r.Body).Decode(&n); err != nil { // => the body itself is validated second
		w.WriteHeader(http.StatusBadRequest) // => a malformed body is a different failure than 415
		w.Write([]byte(`{"error":"invalid json body"}`))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(n) // => only reached when the media type AND body both check out
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /notes", createNote) // => a route whose Content-Type gate is hand-written (co-21)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
