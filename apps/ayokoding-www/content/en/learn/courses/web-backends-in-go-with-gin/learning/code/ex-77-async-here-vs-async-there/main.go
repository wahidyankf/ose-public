// => Example 77: Async Here vs Async There.
// => FastAPI awaits coroutines while Gin joins goroutines, but both answer
// => only after the work completes. This example fans one slow fetch to a
// => goroutine, joins it before answering, and prints the assembled
// => greeting the join made possible.
package main

import (
	"fmt"                      // => prints the assembled greeting
	"github.com/gin-gonic/gin" // => the handler that fans out and joins (co-07, co-16)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => fetchTitle pretends to retrieve a title: fixed bytes, no I/O.
// => the stand-in for a database or client call the handler awaits
func fetchTitle(name string) string { // => the slow dependency, instant here
	return "Dr " + name // => fixed bytes: the work both sides await
}

// => greet fans the fetch out, joins it, and answers with the result.
// => the goroutine plus channel is Gin's await: same guarantee (co-07)
func greet(c *gin.Context) { // => the handler that waits for its work
	name := c.Param("name")      // => the name travels into the goroutine
	done := make(chan string, 1) // => buffered: the fetch never blocks
	go func() {                  // => FastAPI would await here; Gin goes (co-16)
		done <- fetchTitle(name) // => the fetched title travels back
	}()
	// => join before answering: the response waits for the work, always
	title := <-done                                   // => block until the fetch completes: the await point
	c.JSON(200, gin.H{"greeting": "hello, " + title}) // => assembled after the join (co-04)
}

// => newRouter wires the single awaiting route this example serves.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)         // => silence the debug banner for golden output
	router := gin.New()               // => bare engine: no hidden middleware
	router.GET("/greet/:name", greet) // => the route that fans out and joins
	return router                     // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the name is the variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => the assertion surface
	router.ServeHTTP(w, req)                                  // => fan-out and join run inside (co-09)
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => the fetch completes before the answer: joined, never raced (co-07)
	check(router, "/greet/Sari") // => Output: GET /greet/Sari -> 200 {"greeting":"hello, Dr Sari"}
}
