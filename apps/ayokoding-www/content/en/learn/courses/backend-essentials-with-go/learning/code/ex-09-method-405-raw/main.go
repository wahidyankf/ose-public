// Example 9: Method 405, Hand-Written.
//
// Unlike Example 8's silent empty 200, this handler explicitly rejects
// every non-GET method with a precise 405 -- including the RFC 9110
// mandated Allow header that tells the client what WOULD have worked.
package main

import (
	"log"      // => Fatal() for the ListenAndServe startup error
	"net/http" // => the stdlib server, as in Examples 7 and 8
)

// getOnlyWith405Handler answers GET and rejects everything else precisely.
func getOnlyWith405Handler(w http.ResponseWriter, r *http.Request) {
	switch r.Method { // => the same hand-written dispatch as Example 8 (co-02)
	case http.MethodGet:
		w.Write([]byte("get succeeded")) // => the one method this route supports
	default:
		// => defined ON PURPOSE, unlike Example 8's empty default branch,
		// => so the client gets a PRECISE rejection, not a silent 200
		w.Header().Set("Allow", "GET") // => lists the methods that ARE ok (co-04)
		// => RFC 9110: a 405 response MUST carry Allow -- the pair is
		// => mandatory together, not the status alone (co-03)
		w.WriteHeader(http.StatusMethodNotAllowed) // => writes "HTTP/1.1 405 Method Not Allowed"
		w.Write([]byte("method not allowed"))      // => a body that explains the rejection
	}
}

func main() {
	http.HandleFunc("/", getOnlyWith405Handler) // => one handler, every method reaching it
	// => the switch above is what a framework's method-scoped route would
	// => generate automatically -- Example 11's "GET " pattern does exactly
	// => this, one registration line at a time (co-07)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", nil)) // => DefaultServeMux, as in Example 8
}
