// Example 22: Set a Response Header.
//
// w.Header().Set(name, value) adds a custom response header -- but only
// if it happens BEFORE the first Write or WriteHeader call: the header map
// is live until the response starts, and later Sets are silently ignored.
package main

import (
	"encoding/json" // => the body this header rides along with (co-09)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-04)
)

// versionHandler reports a build/version header alongside its JSON body.
func versionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("X-App-Version", "1.0.0") // => set BEFORE any write, or it never lands (co-04)
	// => w.Header() stays mutable until WriteHeader or the first Write
	// => flushes the headers onto the wire; a Set after that is silently
	// => ignored -- the Go analogue of Python's queue-then-flush, with the
	// => flush point being "the first write" instead of an explicit call
	w.Header().Set("Content-Type", "application/json")         // => the other headers this response needs
	json.NewEncoder(w).Encode(map[string]string{"ok": "true"}) // => the body; the header rides along
	// => the return value here supplies only the BODY -- the headers were
	// => already queued above, exactly as in Example 19's WriteHeader order
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /version", versionHandler) // => a route that reports a build/version header (co-04)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
