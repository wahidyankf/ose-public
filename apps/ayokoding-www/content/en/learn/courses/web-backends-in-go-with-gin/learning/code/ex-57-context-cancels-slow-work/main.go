// => Example 57: Context Cancels Slow Work.
// => Slow dependencies must respect cancellation, or shutdowns hang waiting
// => for them. This example races a pre-cancelled context against instant
// => work, showing the cancel branch winning immediately and the work
// => branch winning when the context lives.
package main

import (
	"context"                  // => cancellation that handlers respect (co-07)
	"fmt"                      // => prints which branch won per case
	"github.com/gin-gonic/gin" // => the handler that watches its context (co-07)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"time"                     // => builds the pre-cancelled deadline
)

// => work answers from a helper that respects the request context.
// => select makes cancellation a normal branch with its own answer
func work(c *gin.Context) { // => the handler that never ignores Done
	// => the helper channel carries the answer; the test fills it or not
	done := make(chan string, 1)  // => buffered: the sender never blocks
	if c.Query("fast") == "yes" { // => the fast path completes before select
		done <- "finished" // => work already done when select runs
	}
	select { // => whichever branch is ready first wins, fairly
	case result := <-done: // => work won: answer normally
		c.String(200, result) // => the completed answer (co-04)
	case <-c.Request.Context().Done(): // => cancellation won: stop waiting
		// => 499 names the condition: the client went away first
		c.JSON(499, gin.H{"error": "client went away"}) // => fixed envelope, client-closed
	}
}

// => newRouter wires the single watching route this example serves.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	router.GET("/work", work) // => the handler that respects cancel
	return router             // => hand the wired engine back
}

// => check serves one request with a live or dead context and prints the winner.
// => expired contexts fire the cancel branch without any waiting
func check(router *gin.Engine, fast string, expired bool) { // => fast picks the branch, expired kills the context
	target := "/work" // => the path never changes: the query decides
	if fast != "" {   // => explicit fast=yes exercises the work branch
		target += "?fast=yes" // => the query the handler reads
	}
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	if expired {                                   // => the slow path needs no wall clock: pre-cancel instead
		// => a deadline in the past is already done: Done fires at once
		ctx, cancel := context.WithDeadline(req.Context(), time.Now().Add(-time.Second)) // => already expired
		defer cancel()                                                                   // => release the dead timer
		req = req.WithContext(ctx)                                                       // => the handler sees a done context
	}
	w := httptest.NewRecorder()                                                    // => the assertion surface
	router.ServeHTTP(w, req)                                                       // => select picks the ready branch (co-07)
	fmt.Println("GET", target, "expired=", expired, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => live context with fast work: the work branch wins at once
	check(router, "yes", false) // => Output: GET /work?fast=yes expired= false -> 200 finished
	// => pre-cancelled context: the cancel branch wins without waiting (co-07)
	check(router, "", true) // => Output: GET /work expired= true -> 499 {"error":"client went away"}
}
