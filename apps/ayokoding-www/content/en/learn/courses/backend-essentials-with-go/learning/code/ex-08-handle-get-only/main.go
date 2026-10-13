// Example 8: Handle GET Only.
//
// A handler that answers GET and deliberately writes NOTHING for any other
// method. Unlike Python's BaseHTTPRequestHandler -- which replies 501 when
// a do_POST method is missing -- net/http does no method dispatch at all:
// every method reaches this handler, and an unhandled method gets a silent,
// empty 200. That imprecision is exactly what Example 9 fixes by hand.
package main

import (
	"log"      // => Fatal() for the ListenAndServe startup error
	"net/http" // => the stdlib server this tier now always runs on
)

// getOnlyHandler answers GET and is deliberately silent about everything else.
func getOnlyHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method { // => the ONE dispatch this handler implements (co-02)
	case http.MethodGet:
		// => net/http calls this handler for EVERY method; only GET
		// => gets a real reply -- the method check is your code, not
		// => the library's (contrast the Python do_GET magic name)
		w.Write([]byte("get succeeded")) // => the only case this handler answers
	default:
		// => deliberate: NOTHING is written for POST/PUT/DELETE/etc.
		// => net/http fills that silence with an implicit 200 and an
		// => empty body -- technically "success", pedagogically a trap
	}
}

func main() {
	http.HandleFunc("/", getOnlyHandler) // => every method, every path, one handler
	// => there is no do_GET/do_POST dispatch in net/http: r.Method is the
	// => only method information this handler ever sees (co-02)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", nil)) // => DefaultServeMux, as in Example 7
}
