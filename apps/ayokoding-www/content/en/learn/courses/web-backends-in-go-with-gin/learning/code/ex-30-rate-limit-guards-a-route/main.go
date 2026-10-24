// => Example 30: Rate Limit Guards a Route.
// => Rate limiting answers 429 when a client spends its budget, protecting
// => the service from floods. This example guards an expensive route with a
// => two-token bucket, spends both tokens, and prints the 429 on the third
// => sequential call.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => limiting middleware (co-02)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"sync"                     // => the bucket lock: middleware runs concurrently (co-07)
	"time"                     // => refill arithmetic on the token clock
)

// => bucket is a two-token bucket with a very slow refill.
// => the hour-long window means no refill happens during the test run
type bucket struct { // => capacity, stock, and the last refill instant
	mu     sync.Mutex // => guards tokens: checks run on many goroutines (co-07)
	tokens float64    // => fractional stock smooths the refill math
	last   time.Time  // => when the stock was last topped up
}

// => take removes one token when the stock allows it.
// => false means the budget is spent: the caller answers 429
func (b *bucket) take() bool { // => one token per call, or none
	b.mu.Lock()         // => stock and clock update atomically
	defer b.mu.Unlock() // => always release, on every return path
	// => an hour per token: effectively no refill inside this example
	since := time.Since(b.last).Hours() // => fractional hours since topping up
	b.tokens += since / 1.0             // => one token per hour trickles back
	if b.tokens > 2 {                   // => the bucket never holds more than two
		b.tokens = 2 // => cap the stock at capacity
	}
	b.last = time.Now() // => the clock restarts at every check
	if b.tokens < 1 {   // => less than one whole token means empty
		return false // => budget spent: the caller answers 429
	}
	b.tokens--  // => spend one whole token on this request
	return true // => admitted: a token was spent
}

// => limit guards the expensive route with the shared bucket.
// => 429 names the condition: slow down and retry later (co-04)
func limit(b *bucket) gin.HandlerFunc { // => the bucket arrives pre-filled
	return func(c *gin.Context) { // => gin calls this before the handler
		if !b.take() { // => no token left for this request
			// => AbortWithStatusJSON answers here: the handler never runs
			c.AbortWithStatusJSON(429, gin.H{"error": "slow down"}) // => 429 with the envelope (co-05)
			return                                                  // => the expensive work below is skipped
		}
		c.Next() // => a token was spent: the request proceeds
	}
}

// => newRouter guards one expensive route with a two-token bucket.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)                 // => silence the debug banner for golden output
	router := gin.New()                       // => bare engine: middleware added by hand
	b := &bucket{tokens: 2, last: time.Now()} // => full bucket at startup
	// => the guard sits before the handler: no token, no work
	router.GET("/expensive", limit(b), func(c *gin.Context) { c.String(200, "computed") }) // => guarded route (co-02)
	return router                                                                          // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => the bucket spends per call
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => two tokens, two admissions: the expensive work runs twice
	check(router, "/expensive") // => Output: GET /expensive -> 200 computed
	check(router, "/expensive") // => Output: GET /expensive -> 200 computed
	// => the bucket is empty now: 429 without running the handler (co-02)
	check(router, "/expensive") // => Output: GET /expensive -> 429 {"error":"slow down"}
}
