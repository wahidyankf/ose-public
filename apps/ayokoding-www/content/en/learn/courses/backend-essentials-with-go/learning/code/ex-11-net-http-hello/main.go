// Example 11: net/http Hello.
//
// The same "hello" reply as Example 1, expressed with net/http's router:
// a ServeMux pattern registers the route, and the handler marshals a typed
// Go value with encoding/json. Contrast this against the six raw examples.
package main

import (
	"encoding/json" // => JSON serialization with no model layer beyond Go structs (co-09)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server and its router (co-06, co-07)
)

// helloHandler answers exactly what Example 1 answered -- minus every
// hand-written byte: no CRLF strings, no manual Content-Length arithmetic.
func helloHandler(w http.ResponseWriter, r *http.Request) {
	// => the raw tier wrote "HTTP/1.1 200 OK\r\n" by hand; here the status
	// => line, Date, and Content-Length headers are all net/http's work
	w.Header().Set("Content-Type", "application/json") // => set BY HAND, unlike FastAPI (co-09)
	// => the stdlib never guesses JSON: without this line net/http would
	// => sniff `{"msg":...}` as text/plain -- a real trap, hence the comment
	json.NewEncoder(w).Encode(map[string]string{"msg": "hello"}) // => serializes AND writes in one call
}

func main() {
	mux := http.NewServeMux()             // => an explicit router object: patterns in, dispatch out (co-07)
	mux.HandleFunc("GET /", helloHandler) // => method+path in ONE pattern, like @app.get("/")
	// => the "GET " prefix routes by method: a POST to "/" now gets an
	// => automatic 405 from the mux -- contrast Example 8's silent 200
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => serve THIS mux, not nil (co-07)
}
