// => Example 26: Middleware Wraps Every Request.
// => Middleware runs before and after each handler, so cross-cutting work
// => lives in one place. This example stamps every request with a sequential
// => id, echoes the id in a header and the body, and prints both requests
// => with their ids.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => middleware around every handler (co-02)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"sync/atomic"              // => race-free counter for the id sequence (co-07)
)

// => ids hands out request ids: req-1, req-2, and so on, forever.
// => atomic keeps concurrent requests from sharing an id (co-07)
var ids atomic.Int64 // => process-wide counter, zero at startup

// => requestID stamps each request before the handler and echoes after.
// => c.Next runs the chain; code after it runs on the way out (co-02)
func requestID(c *gin.Context) { // => middleware shares the handler signature
	// => Add returns the new value: first request becomes 1
	n := ids.Add(1)                // => req-1, req-2: sequential and deterministic
	id := fmt.Sprintf("req-%d", n) // => the human form of the counter
	c.Set("requestID", id)         // => handlers read the id from the context
	c.Header("X-Request-Id", id)   // => clients read the same id on the way out
	c.Next()                       // => run the handler and everything after it in the chain
	// => nothing needed on the way out here: the header already carries it
}

// => hello answers with the id the middleware assigned.
// => handlers stay small: stamping lives in the middleware (co-02)
func hello(c *gin.Context) { // => the handler reads what middleware wrote
	id, _ := c.Get("requestID")                             // => the stamp, or nothing when unwrapped
	c.JSON(200, gin.H{"message": "hello", "requestID": id}) // => body echoes the id (co-04)
}

// => newRouter wraps every route in the id middleware.
// => Use applies to all routes registered after it on this engine (co-02)
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)     // => silence the debug banner for golden output
	router := gin.New()           // => bare engine: middleware added by hand
	router.Use(requestID)         // => every request below gets stamped
	router.GET("/hello", hello)   // => one route, wrapped (co-02)
	router.GET("/goodbye", hello) // => a second route proves every route is wrapped
	return router                 // => hand the wired engine back
}

// => check serves one GET and prints the id header with the body.
// => the id must match in the header and the JSON: same stamp, two places
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)                                            // => server-side request, no socket
	w := httptest.NewRecorder()                                                               // => in-memory response capture
	router.ServeHTTP(w, req)                                                                  // => middleware runs around the handler
	fmt.Println("GET", target, "->", w.Code, w.Header().Get("X-Request-Id"), w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => first request through the chain: stamped req-1 in both places
	check(router, "/hello") // => Output: GET /hello -> 200 req-1 {"message":"hello","requestID":"req-1"}
	// => the counter never resets: the second request is req-2
	check(router, "/goodbye") // => Output: GET /goodbye -> 200 req-2 {"message":"hello","requestID":"req-2"}
}
