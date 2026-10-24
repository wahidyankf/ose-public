// => Kata 2 starter: inline fetch blocks the handler.
// => The greeting is fetched inline: the handler owns the wait and cannot
// => do anything else meanwhile. Your task: move the fetch into a
// => goroutine, join it through a channel, and answer only after the join.
package main

import (
	"fmt"                      // => prints the assembled greeting
	"github.com/gin-gonic/gin" // => the handler you will free
	"net/http/httptest"        // => in-process request and recorder
)

// => fetchTitle pretends to retrieve a title: fixed bytes, no I/O.
// => the stand-in slow call: inline today, goroutine after your change
func fetchTitle(name string) string { // => the work to move off the line
	return "Dr " + name // => fixed bytes: the wait is simulated, not real
}

// => greet fetches inline and answers: the blocking shape to convert.
// => TODO: go func with a channel, then join before answering
func greet(c *gin.Context) { // => the handler that waits inline today
	// => inline fetch: the handler is occupied for the whole call
	title := fetchTitle(c.Param("name"))              // => TODO: move this into go func
	c.JSON(200, gin.H{"greeting": "hello, " + title}) // => answer after the wait
}

// => newRouter wires the single greeting route you will free.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)         // => silence the debug banner for golden output
	router := gin.New()               // => bare engine: no hidden middleware
	router.GET("/greet/:name", greet) // => the route to convert
	return router                     // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the name is the variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => the assertion surface
	router.ServeHTTP(w, req)                                  // => today's inline fetch runs inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => inline today: your conversion must print this exact line
	check(router, "/greet/Sari") // => the assembled greeting, unchanged after
}
