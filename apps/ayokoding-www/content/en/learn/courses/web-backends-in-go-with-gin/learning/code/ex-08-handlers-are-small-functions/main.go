// => Example 8: Handlers Are Small Functions.
// => Handlers are plain functions with the same signature, so shared
// => behavior wraps them instead of repeating inside them. This example
// => wraps two routes in a counting decorator and prints each body with
// => the call counts the wrapper observed.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => handlers share one function signature (co-01)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => counter records how many times each wrapped route ran.
// => a pointer receiver means every copy still writes one ledger
type counter struct { // => the shared behavior's tiny state
	hits map[string]int // => route name to call count, insertion-free
}

// => wrap decorates a handler so each call is counted before it runs.
// => middleware-shaped, but applied per route instead of globally (co-02)
func (k *counter) wrap(name string, next gin.HandlerFunc) gin.HandlerFunc { // => same signature in and out
	// => the closure remembers its name and ledger across calls
	return func(c *gin.Context) { // => gin calls this exactly like a plain handler
		k.hits[name]++ // => count first: even a failing handler was called
		next(c)        // => then run the real handler untouched
	}
}

// => newRouter wires two small handlers through one shared counter.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)             // => silence the debug banner for golden output
	router := gin.New()                   // => bare engine: no hidden middleware
	k := &counter{hits: map[string]int{}} // => one ledger for the whole engine
	// => each route names itself to the wrapper: counts stay per-route
	router.GET("/a", k.wrap("a", func(c *gin.Context) { c.String(200, "route a") })) // => small handler, wrapped
	router.GET("/b", k.wrap("b", func(c *gin.Context) { c.String(200, "route b") })) // => same wrapper, other name
	// => the ledger outlives the function: main reads it after traffic
	router.GET("/counts", func(c *gin.Context) { c.JSON(200, k.hits) }) // => expose the counts as JSON (co-04)
	return router                                                       // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => wrappers run around handlers
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => two calls to a, one to b: the ledger must show exactly that
	check(router, "/a") // => Output: GET /a -> 200 route a
	check(router, "/a") // => Output: GET /a -> 200 route a
	check(router, "/b") // => Output: GET /b -> 200 route b
	// => encoding/json sorts map keys: a before b, every run (co-04)
	check(router, "/counts") // => Output: GET /counts -> 200 {"a":2,"b":1}
}
