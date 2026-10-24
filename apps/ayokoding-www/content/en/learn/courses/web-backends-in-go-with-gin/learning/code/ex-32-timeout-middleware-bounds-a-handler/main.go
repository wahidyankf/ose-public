// => Example 32: Timeout Middleware Bounds a Handler.
// => Slow handlers must not hold connections forever, so middleware bounds
// => them with a context deadline. This example wraps a patient handler in a
// => limit the checks control: a live context passes through, an expired one
// => fails immediately with a 504.
package main

import (
	"context"                  // => deadlines and cancellation (co-07)
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => timeout middleware (co-02)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"time"                     // => the 50-millisecond bound below
)

// => withTimeout bounds every handler with a 50-millisecond deadline.
// => the deadline rides the request context: handlers select on it (co-07)
func withTimeout(c *gin.Context) { // => the bound every route below shares
	// => WithTimeout derives a child context that expires after 50ms
	ctx, cancel := context.WithTimeout(c.Request.Context(), 50*time.Millisecond) // => the bound, fixed
	defer cancel()                                                               // => release the timer when the chain returns
	c.Request = c.Request.WithContext(ctx)                                       // => handlers below see the deadline
	c.Next()                                                                     // => the handler runs under the bound
}

// => patient waits for either work or the deadline, whichever comes first.
// => select makes the deadline a first-class outcome, not a crash (co-07)
func patient(c *gin.Context) { // => the handler that respects the bound
	// => work finishes through this channel; the test controls when
	work := make(chan string, 1)  // => buffered: the sender never blocks
	if c.Query("fast") == "yes" { // => the fast path completes immediately
		work <- "done" // => work already finished before select runs
	}
	select { // => whichever branch is ready first wins, fairly
	case result := <-work: // => work won: answer normally
		c.String(200, result) // => the fast answer (co-04)
	case <-c.Request.Context().Done(): // => the deadline won: stop waiting
		// => 504 names the condition: the server gave up in time (co-05)
		c.JSON(504, gin.H{"error": "handler timed out"}) // => fixed envelope, gateway timeout
	}
}

// => newRouter wraps the patient handler in the timeout bound.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)       // => silence the debug banner for golden output
	router := gin.New()             // => bare engine: middleware added by hand
	router.Use(withTimeout)         // => every route below runs bounded (co-02)
	router.GET("/patient", patient) // => the handler that watches the clock
	return router                   // => hand the wired engine back
}

// => check serves one GET and prints the status with the body.
// => the fast flag picks the immediate branch or the waiting one
func check(router *gin.Engine, fast string) { // => yes passes, empty waits out the clock
	target := "/patient" // => the path never changes: the query decides
	if fast != "" {      // => explicit fast=yes exercises the work branch
		target += "?fast=yes" // => the query the handler reads
	}
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	// => expire the context before serving: the deadline branch fires at once
	if fast == "" { // => the slow path needs no wall clock: pre-cancel instead
		ctx, cancel := context.WithDeadline(req.Context(), time.Now().Add(-time.Second)) // => already expired
		defer cancel()                                                                   // => release the dead timer
		req = req.WithContext(ctx)                                                       // => the middleware derives from an expired parent
	}
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => 50ms of real waiting would also work; this is instant
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => fast=yes completes before any deadline: the work branch wins
	check(router, "yes") // => Output: GET /patient?fast=yes -> 200 done
	// => pre-expired context: the deadline branch answers 504 at once (co-07)
	check(router, "") // => Output: GET /patient -> 504 {"error":"handler timed out"}
}
