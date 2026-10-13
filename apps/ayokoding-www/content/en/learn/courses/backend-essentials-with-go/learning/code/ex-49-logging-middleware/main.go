// Example 49: Middleware -- Request Logging.
//
// Every request that reaches this app produces exactly ONE log line,
// emitted by the middleware -- no handler ever logs itself. The line shows
// method, path, and the status the handler actually sent:
//
//	curl -i http://127.0.0.1:8000/tasks   # => watch stderr for: GET /tasks -> 200
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => the handler's list body rides on the stdlib encoder (co-09)
	"log"           // => the access line AND the fatal-on-listen path share this package
	"net/http"      // => the stdlib server: mux, handlers, middleware shape (co-06, co-07)
)

// => the one list this example serves -- the handler knows NOTHING about logging
var tasks = []map[string]string{{"title": "Buy milk"}} // => the body curl sees; the log line describes it

// statusRecorder captures the status so the middleware can log it AFTER the handler.
type statusRecorder struct { // => embeds the real writer, overrides only the status path
	http.ResponseWriter     // => the underlying writer: headers and body flow through untouched
	status              int // => the code the handler chose; 0 means "nothing written yet"
} // => the struct closes: one extra field over the embedded writer

// WriteHeader records the code, then forwards it to the real connection.
func (rec *statusRecorder) WriteHeader(code int) { // => net/http calls this once per response
	if rec.status == 0 { // => first call wins: a second WriteHeader is a no-op in net/http too
		rec.status = code // => remember what the handler decided, for the log line below
	} // => the guard ends: repeated calls keep the FIRST code, like the stdlib
	rec.ResponseWriter.WriteHeader(code) // => the actual status line still goes to the wire here
} // => WriteHeader ends: capture, then forward

// Write ensures an implicit 200 is recorded when the handler never called WriteHeader.
func (rec *statusRecorder) Write(body []byte) (int, error) { // => handlers that just Encode hit this path
	if rec.status == 0 { // => no explicit status yet: net/http would send 200 implicitly
		rec.status = http.StatusOK // => record the implicit 200 so the log line is truthful
	} // => the implicit-status branch ends
	return rec.ResponseWriter.Write(body) // => the body bytes still flow to the wire
} // => Write ends: status captured, bytes forwarded

// withLogging is the middleware: plain func(http.Handler) http.Handler.
func withLogging(next http.Handler) http.Handler { // => the stdlib middleware shape: wrap, don't inherit
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { // => the per-request closure
		rec := &statusRecorder{ResponseWriter: w} // => the capturing writer the handler will write through
		// => the handler runs BEFORE the log line, so the outcome exists to be logged
		next.ServeHTTP(rec, r) // => routing + handler run here, status captured above
		if rec.status == 0 {   // => a handler that wrote nothing at all (should not happen here)
			rec.status = http.StatusOK // => default to 200 so the line never shows a zero
		} // => the empty-response guard ends
		log.Printf("%s %s -> %d", r.Method, r.URL.Path, rec.status) // => one structured line per request
		// => %s-style verbs: method, path, status -- the Go twin of Python's "%s %s -> %s" line
	}) // => the closure ends: the SAME response object went out unmodified
} // => withLogging ends: logging never mutates the response, only observes it

// listTasks is the plain handler, unaware any middleware exists.
func listTasks(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature
	w.Header().Set("Content-Type", "application/json") // => the stdlib never guesses JSON for you (co-09)
	_ = json.NewEncoder(w).Encode(tasks)               // => the list body; the middleware logs this AFTER it returns
} // => listTasks ends

// newHandler assembles routing, then wraps it once with the middleware.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()               // => the routing table: exactly one route here
	mux.HandleFunc("GET /tasks", listTasks) // => co-08: a handler that never logs itself
	return withLogging(mux)                 // => one wrap covers EVERY route, with zero per-route code
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the startup line, then access lines follow
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
