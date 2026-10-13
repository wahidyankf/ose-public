// Example 23: ServeMux vs Manual ServeHTTP -- the Same Route, Two Ways.
//
// Whatever net/http automates was still written once -- inside the mux.
// This example serves two identical routes side by side: "/auto" gets its
// method and path matching from the registered pattern, while "/manual"
// does the same matching by hand inside a raw ServeHTTP implementation.
package main

import (
	"encoding/json" // => only the "auto" route answers with JSON (co-09)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => both the mux AND the raw handler type come from here (co-07)
)

// manualHandler implements http.Handler BY HAND: one ServeHTTP method, no
// pattern syntax, no automatic method enforcement -- every check below is
// exactly the matching logic ServeMux performs upstream for "GET /auto".
type manualHandler struct{} // => zero state: all routing decisions live in ServeHTTP

func (manualHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// => ServeHTTP is the ONLY method the http.Handler interface requires;
	// => the mux calls it once per request, with the path already matched
	// => the mux matched the PATH above ("/manual"); the method is still ours
	if r.Method != http.MethodGet { // => hand-written method gate (co-02)
		w.Header().Set("Allow", "GET") // => required alongside 405 (co-03, co-04)
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte("method not allowed"))
		return
	}
	w.Header().Set("Content-Type", "text/plain") // => the mux sets NO Content-Type here either
	w.Write([]byte("manual hello"))              // => the hand-built reply body
}

func main() {
	mux := http.NewServeMux() // => the automatic router: patterns in, dispatch out (co-07)

	// => THE AUTOMATIC ROUTE: "GET /auto" encodes BOTH the method and the
	// => path in one registered pattern -- a wrong method never reaches the
	// => handler at all; the mux itself answers POST /auto with 405 + Allow
	mux.HandleFunc("GET /auto", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json") // => hand-set, as always in stdlib (co-09)
		json.NewEncoder(w).Encode(map[string]string{"via": "servemux"})
	})

	// => THE MANUAL ROUTE rides the same server: its pattern has no method,
	// => so every method reaches ServeHTTP, which enforces the method itself
	mux.Handle("/manual", manualHandler{}) // => the mux picks the path; the handler picks the method

	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => one mux serves both styles (co-08)
}
