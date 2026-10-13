// Kata 13: Compose a request-id + timing middleware chain.
//
// Middleware wraps every request/response to add cross-cutting behavior
// without touching the handler. httptest proves both headers land.
package main

import (
	"fmt"               // => formats the elapsed seconds header value
	"log"               // => fail-fast on any self-check mismatch
	"net/http"          // => the middleware shape: func(http.Handler) http.Handler
	"net/http/httptest" // => drives the wrapped handler with no socket
)

// withRequestID stamps every response with an incrementing X-Request-Id.
func withRequestID(counter *int) func(http.Handler) http.Handler { // => co-16/co-04: tracing header middleware
	return func(next http.Handler) http.Handler { // => co-16: wraps a handler, returns a new handler
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { // => per-request closure
			*counter++                                           // => mocked id generator; real code might use uuid
			w.Header().Set("X-Request-Id", fmt.Sprint(*counter)) // => co-04: set BEFORE next runs, so it always commits
			next.ServeHTTP(w, r)                                 // => call the inner handler
		})
	}
}

// timingWriter stamps X-Process-Time at commit time.
type timingWriter struct { // => embeds the real writer, overrides the commit path
	http.ResponseWriter                // => body bytes flow through untouched
	clock               func() float64 // => mocked clock: deterministic, no real sleep
	start               float64        // => the start reading, captured before the handler
}

// WriteHeader stamps the elapsed time, then commits.
func (tw *timingWriter) WriteHeader(code int) { // => net/http calls this once per response
	elapsed := tw.clock() - tw.start                                               // => wall-clock cost of the wrapped handler only
	tw.ResponseWriter.Header().Set("X-Process-Time", fmt.Sprintf("%.3f", elapsed)) // => co-04/co-16
	tw.ResponseWriter.WriteHeader(code)                                            // => the actual status line goes out, header attached
}

// Write covers handlers that never call WriteHeader explicitly.
func (tw *timingWriter) Write(body []byte) (int, error) { // => Encode-only handlers land here
	elapsed := tw.clock() - tw.start                                               // => same stop-the-clock step
	tw.ResponseWriter.Header().Set("X-Process-Time", fmt.Sprintf("%.3f", elapsed)) // => still legal: nothing committed yet
	return tw.ResponseWriter.Write(body)                                           // => this Write commits an implicit 200 with the header
}

// withTiming measures the wrapped handler and stamps X-Process-Time.
func withTiming(clock func() float64) func(http.Handler) http.Handler { // => co-16: timing middleware factory
	return func(next http.Handler) http.Handler { // => the middleware shape
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { // => per-request closure
			start := clock()                                                   // => mocked start reading
			tw := &timingWriter{ResponseWriter: w, clock: clock, start: start} // => commit-interceptor
			next.ServeHTTP(tw, r)                                              // => the handler (and any inner middleware) runs here
		})
	}
}

func baseHandler(w http.ResponseWriter, r *http.Request) { // => co-08: endpoint logic, middleware-free
	_, _ = w.Write([]byte("ok")) // => plain body; middleware adds every header
}

func main() {
	readings := []float64{0.0, 0.25} // => mocked clock: start 0.0, end 0.25, deterministic
	call := 0                        // => which reading to return next
	clock := func() float64 {        // => each call returns the next mocked time
		v := readings[call]         // => 0.0 first, 0.25 second
		if call < len(readings)-1 { // => clamp at the last reading if called extra times
			call++
		}
		return v
	}
	counter := 0 // => the request-id sequence

	handler := withTiming(clock)(withRequestID(&counter)(http.HandlerFunc(baseHandler))) // => co-16: compose around the base

	req := httptest.NewRequest(http.MethodGet, "/", nil) // => synthetic request, no socket
	rec := httptest.NewRecorder()                        // => captures status + headers + body
	handler.ServeHTTP(rec, req)                          // => routing and both middlewares run in-process

	fmt.Println(rec.Code, rec.Body.String(), rec.Header().Get("X-Request-Id"), rec.Header().Get("X-Process-Time")) // => Output: 200 ok 1 0.250

	if rec.Header().Get("X-Request-Id") != "1" { // => every response carries a traceable id
		log.Fatalf("X-Request-Id = %q, want 1", rec.Header().Get("X-Request-Id"))
	}
	if rec.Header().Get("X-Process-Time") != "0.250" { // => cross-cutting timing added without touching baseHandler
		log.Fatalf("X-Process-Time = %q, want 0.250", rec.Header().Get("X-Process-Time"))
	}
	fmt.Println("kata-13 OK") // => the self-check line this track greps for
}
