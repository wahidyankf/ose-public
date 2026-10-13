// Example 50: Middleware -- Timing Header.
//
// The clock starts BEFORE the handler and stops AFTER it, so the elapsed
// time genuinely covers routing plus the handler. Every response carries
// the measurement as X-Process-Time in seconds:
//
//	curl -i http://127.0.0.1:8000/tasks   # => X-Process-Time: 0.000123
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => the handler's list body rides on the stdlib encoder (co-09)
	"fmt"           // => formats the elapsed seconds as a header-safe string
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server: mux, handlers, middleware shape (co-06, co-07)
	"time"          // => the monotonic clock: immune to wall-clock adjustments
)

// => the one list this example serves -- the handler knows NOTHING about timing
var tasks = []map[string]string{{"title": "Buy milk"}} // => the body curl sees; the header measures it

// timingWriter stamps X-Process-Time at the moment headers commit.
type timingWriter struct { // => embeds the real writer, overrides the commit path
	http.ResponseWriter           // => the underlying writer: body bytes flow through untouched
	start               time.Time // => the monotonic start, captured BEFORE the handler runs
} // => the struct closes: one extra field over the embedded writer

// WriteHeader computes the elapsed time, sets the header, then commits.
func (tw *timingWriter) WriteHeader(code int) { // => net/http calls this once per response
	elapsed := time.Since(tw.start) // => stops the clock AFTER the handler finished
	// => set the header BEFORE committing: a Set after WriteHeader would be silently lost
	tw.ResponseWriter.Header().Set("X-Process-Time", fmt.Sprintf("%f", elapsed.Seconds())) // => co-04: seconds as text
	tw.ResponseWriter.WriteHeader(code)                                                    // => the actual status line goes out, header attached
} // => WriteHeader ends: measure, stamp, then forward

// Write covers handlers that never call WriteHeader explicitly.
func (tw *timingWriter) Write(body []byte) (int, error) { // => Encode-only handlers land here
	elapsed := time.Since(tw.start) // => same stop-the-clock step as WriteHeader
	// => Header().Set is still legal here because nothing committed yet
	tw.ResponseWriter.Header().Set("X-Process-Time", fmt.Sprintf("%f", elapsed.Seconds())) // => co-04: same stamp
	return tw.ResponseWriter.Write(body)                                                   // => this Write commits an implicit 200 WITH the header
} // => Write ends: the implicit-200 path carries the timing too

// withTiming is the middleware: plain func(http.Handler) http.Handler.
func withTiming(next http.Handler) http.Handler { // => the stdlib middleware shape: wrap, don't inherit
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { // => the per-request closure
		tw := &timingWriter{ResponseWriter: w, start: time.Now()} // => co-16: wall-clock start, BEFORE the handler
		// => time.Now uses the monotonic reading when available, the right
		// => choice for elapsed measurement -- never time since midnight
		next.ServeHTTP(tw, r) // => the handler (and any inner middleware) runs here
	}) // => the closure ends: the header landed at commit time inside tw
} // => withTiming ends: zero per-route code, every route gets timed

// listTasks is the plain handler, unaware any middleware exists.
func listTasks(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature
	w.Header().Set("Content-Type", "application/json") // => the stdlib never guesses JSON for you (co-09)
	_ = json.NewEncoder(w).Encode(tasks)               // => the list body; the middleware measures this call
} // => listTasks ends

// newHandler assembles routing, then wraps it once with the middleware.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()               // => the routing table: exactly one route here
	mux.HandleFunc("GET /tasks", listTasks) // => co-08: a handler that never times itself
	return withTiming(mux)                  // => one wrap covers EVERY route
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
