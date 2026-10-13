// Example 7: net/http App.
//
// The first net/http example: a handler is any function with the signature
// func(http.ResponseWriter, *http.Request). That one signature IS the
// calling convention of every Go HTTP server -- stdlib muxes and third-party
// frameworks alike -- and net/http supplies the real socket server around
// it, the way wsgiref hosted WSGI callables in the Python track.
package main

import (
	"log"      // => Fatal() reports ListenAndServe's startup failure and exits
	"net/http" // => THE standard library HTTP toolkit: server, parsing, dispatch (co-06)
)

// helloHandler has THE handler signature: net/http calls it per request.
func helloHandler(w http.ResponseWriter, r *http.Request) { // => (w, r) is the calling convention
	// => w replaces Example 1's hand-assembled status/headers/body bytes:
	// => writes to w come out in wire order automatically
	// => *http.Request is the PARSED request -- method, URL, headers (co-06);
	// => the line-by-line parsing Examples 1-6 did by hand is free from here on
	w.Header().Set("Content-Type", "text/plain") // => one header, set by name -- no CRLF strings (co-04)
	w.WriteHeader(http.StatusOK)                 // => writes the status line "HTTP/1.1 200 OK"
	// => technically optional BEFORE the first body write: an unwritten
	// => status implies 200 anyway -- kept here to make the step visible
	w.Write([]byte("net/http hello")) // => the body, still just bytes on the wire (co-01)
}

func main() {
	http.HandleFunc("/", helloHandler) // => registers on the package-level DefaultServeMux
	// => "/" is a catch-all prefix: every path lands on helloHandler here
	// => Example 11 refines this with an explicit mux and method patterns

	// => ListenAndServe binds, accepts, parses, and dispatches -- every socket
	// => detail Example 1 hand-wrote -- and returns non-nil only at startup;
	// => log.Fatal reports that failure and ends the process with exit code 1
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", nil)) // => nil = serve the DefaultServeMux
}
