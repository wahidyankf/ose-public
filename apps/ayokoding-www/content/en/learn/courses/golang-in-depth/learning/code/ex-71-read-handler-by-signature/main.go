// Example 71: Read a Handler by Its Signature.
//
// Idiomatic handlers are pure functions of request to response, testable with
// httptest.ResponseRecorder and zero network. Read signature first, body second.
package main

import (
	"fmt"               // => prints the recorded body and status verdict
	"net/http"          // => Request, ResponseWriter: the handler contract
	"net/http/httptest" // => NewRecorder: in-memory response, no socket
)

// greet writes "halo, {name}" from the query string, defaulting to "tamu".
// => signature tells all: ResponseWriter out, *Request in, nothing else
// => query param with default: the handler owns its fallback, not the caller
func greet(w http.ResponseWriter, r *http.Request) { // => the http contract
	// => Query().Get reads ?name=: empty when absent, no error to check
	name := r.URL.Query().Get("name") // => "" when the caller sent no name
	// => default at the boundary: downstream logic never sees the empty case
	if name == "" { // => guard: normalize before writing, keep writer dumb
		name = "tamu" // => fallback: every response greets SOMEONE
	}
	// => Fprintf to the writer: the response IS this call's side effect
	fmt.Fprintf(w, "halo, %s", name) // => status 200 implicit: no WriteHeader
}

func main() {
	// => fake request, in-process: no server listens, no port binds, no flakes
	req := httptest.NewRequest("GET", "/halo?name=sari", nil) // => fixed target
	// => recorder captures status, headers, body: the whole response, in memory
	rec := httptest.NewRecorder() // => implements ResponseWriter, records all
	// => call the handler directly: a function call, not an HTTP round trip
	greet(rec, req) // => the unit under test: handler as plain function
	// => Body.String renders captured bytes: assert content, not sockets
	fmt.Println(rec.Body.String()) // => Output: halo, sari
	// => Code defaults to 200: nothing wrote headers, recorder reports it
	fmt.Println("status:", rec.Code) // => Output: status: 200
}
