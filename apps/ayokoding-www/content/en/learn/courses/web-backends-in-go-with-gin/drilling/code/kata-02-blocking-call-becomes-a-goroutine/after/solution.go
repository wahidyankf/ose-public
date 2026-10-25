// => Kata 2 solution: the fetch joins before the answer.
// => The fetch moved into a goroutine and the handler joins it through a
// => buffered channel: same greeting, free handler meanwhile. Answering
// => only after the join keeps the guarantee the inline version had.
package main

import (
	"fmt"                      // => prints the assembled greeting
	"github.com/gin-gonic/gin" // => the handler that fans out and joins
	"net/http/httptest"        // => in-process request and recorder
)

// => fetchTitle pretends to retrieve a title: fixed bytes, no I/O.
// => the same stand-in: only its calling shape changed
func fetchTitle(name string) string { // => the work, now off the line
	return "Dr " + name // => fixed bytes: the wait is simulated, not real
}

// => greet fans the fetch out, joins it, and answers with the result.
// => the goroutine plus channel is the async idiom: same guarantee
func greet(c *gin.Context) { // => the handler that waits at the join
	name := c.Param("name")      // => the name travels into the goroutine
	done := make(chan string, 1) // => buffered: the fetch never blocks
	go func() {                  // => the fetch leaves the handler line
		done <- fetchTitle(name) // => the title travels back
	}()
	// => join before answering: the response waits for the work, always
	title := <-done                                   // => block until the fetch completes: the await point
	c.JSON(200, gin.H{"greeting": "hello, " + title}) // => assembled after the join
}

// => newRouter wires the single converted route.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)         // => silence the debug banner for golden output
	router := gin.New()               // => bare engine: no hidden middleware
	router.GET("/greet/:name", greet) // => the converted route
	return router                     // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the name is the variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => the assertion surface
	router.ServeHTTP(w, req)                                  // => fan-out and join run inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => joined, not inline: the greeting prints byte-identical
	check(router, "/greet/Sari") // => Output: GET /greet/Sari -> 200 {"greeting":"hello, Dr Sari"}
}
