// => Kata 8 starter: serving with no shutdown path.
// => The route answers but the server never shuts down gracefully: stopping
// => drops in-flight work mid-answer. Your task: shut down with a
// => ten-millisecond deadline around the fifty-millisecond route below, and
// => prove the deadline error fires when the work outlasts the bound.
package main

import (
	"fmt"                      // => prints each answer
	"github.com/gin-gonic/gin" // => the route you will drain
	"net/http/httptest"        // => in-process request and recorder
	"time"                     // => the slow work you will bound
)

// => newRouter wires one fifty-millisecond route: slower than your deadline.
// => the sleep stands in for wedged work: shutdown must give up on it
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                  // => silence the debug banner for golden output
	router := gin.New()                        // => bare engine: no hidden middleware
	router.GET("/slow", func(c *gin.Context) { // => the request that outlasts
		time.Sleep(50 * time.Millisecond) // => fifty milliseconds: past every short bound
		// => served only without a bound: the deadline takes precedence
		c.String(200, "too late") // => never served: the deadline fires first
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
// => TODO: replace this with a real loopback server plus Shutdown
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => no shutdown here: in-process has none to prove
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => slow but served in-process: your deadline must print its error instead
	check(router, "/slow") // => fifty milliseconds, served whole today
}
