// Example 21: Read a Request Header.
//
// r.Header.Get("X-Request-Id") reads an incoming request header by name --
// Get canonicalizes the lookup, and a header the client never sent arrives
// as the empty string, which this handler turns into an explicit JSON null.
package main

import (
	"encoding/json" // => the echoed header goes out as JSON (co-09)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-04)
)

// whoami echoes one request header back -- nothing more.
func whoami(w http.ResponseWriter, r *http.Request) {
	id := r.Header.Get("X-Request-Id") // => "" when the client sent nothing (co-04)
	// => Get canonicalizes its argument before looking up: "x-request-id"
	// => and "X-REQUEST-ID" both find the same header -- header names are
	// => case-insensitive per RFC 9110, and Go's canonical form is
	// => X-Request-Id (capitalized words, hyphen-separated)
	w.Header().Set("Content-Type", "application/json")
	out := map[string]any{"x_request_id": id} // => starts as whatever string arrived
	if id == "" {                             // => distinguish "absent" from an empty value
		out["x_request_id"] = nil // => JSON null, not an empty string (co-04)
	}
	json.NewEncoder(w).Encode(out) // => encodes null as null, strings as strings
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /whoami", whoami) // => a route whose only job is echoing request metadata (co-04)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
