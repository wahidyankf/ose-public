// Example 54: Hand-Written Accept Header Negotiation.
//
// The stdlib never inspects Accept, so this handler enforces the contract
// itself: "application/json" (or any wildcard covering it) passes, anything
// else fails with a hand-written 406:
//
//	curl -i -H "Accept: application/json" http://127.0.0.1:8000/tasks  # => 200
//	curl -i -H "Accept: */*" http://127.0.0.1:8000/tasks                # => 200, like curl's own default
//	curl -i -H "Accept: text/plain" http://127.0.0.1:8000/tasks        # => 406
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => the list body AND the 406 detail both ride on the stdlib encoder
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-21: no negotiation help from this package)
	"strings"       // => substring match tolerates "application/json; charset=utf-8" parameters
)

// => the one list this example serves -- reached only after the check passes
var tasks = []map[string]string{{"title": "Buy milk"}} // => only served once wantsJSON approved the request

// wantsJSON is the ENTIRE negotiation rule in one pure function.
func wantsJSON(r *http.Request) bool { // => pure check: no I/O, trivially testable without a socket
	accept := r.Header.Get("Accept") // => co-21: the raw header this hand-written rule inspects
	if accept == "" {                // => no header at all: treat like curl's default wildcard
		// => Python's Header(default="*/*") did exactly this; Go spells the default by hand
		return true // => absent means "anything goes", so JSON is acceptable
	} // => the missing-header branch ends
	if strings.Contains(accept, "application/json") { // => the explicit opt-in, parameters tolerated
		return true // => "application/json" (or with "; charset=...") passes
	} // => the explicit branch ends
	if strings.Contains(accept, "*/*") { // => the wildcard: "*/*" covers every type, JSON included
		return true // => curl's own default Accept lands here
	} // => the wildcard branch ends
	return false // => everything else -- "text/plain", "text/html" -- is rejected
} // => wantsJSON ends: accept JSON or a wildcard for it, reject the rest

// listTasks runs the check FIRST, then serves the list only on success.
func listTasks(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature
	if !wantsJSON(r) { // => co-21: the dependency-equivalent gate, hand-written before any work
		w.Header().Set("Content-Type", "application/json") // => even the rejection speaks JSON
		w.WriteHeader(http.StatusNotAcceptable)            // => co-21: 406, hand-written, unlike the built-in 422
		_ = json.NewEncoder(w).Encode(map[string]string{   // => the flat {"detail":...} shape, mirroring Python
			"detail": "only application/json is supported", // => the single sentence a client can display
		}) // => the 406 body closes
		return // => early return: the list below is never reached on a rejection
	} // => the rejection branch ends
	w.Header().Set("Content-Type", "application/json") // => the happy path declares JSON too (co-09)
	_ = json.NewEncoder(w).Encode(tasks)               // => only reached once wantsJSON did not reject
} // => listTasks ends

// newHandler assembles the routing table, separate from main.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()               // => the routing table: exactly one route here
	mux.HandleFunc("GET /tasks", listTasks) // => the check lives INSIDE the handler, not in the mux
	return mux                              // => the mux IS an http.Handler, ready to serve
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
