// => Example 43: Request Scoped Values Ride Context.
// => Request ids and deadlines travel on the standard context, crossing
// => handler and goroutine boundaries alike. This example carries a request
// => id from middleware through a helper goroutine and prints the id every
// => layer observed.
package main

import (
	"context"                  // => request-scoped values ride here (co-07)
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => middleware sets values handlers read (co-06)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => idKey is the context key type for request ids.
// => an unexported struct type can never collide with other packages
type idKey struct{} // => keys are types, not strings: collisions are impossible

// => stamp stores a fixed request id on every request context.
// => middleware owns the stamping: handlers only read (co-06)
func stamp(c *gin.Context) { // => the first layer every request crosses
	// => WithValue derives a child context carrying req-7 for this request
	ctx := context.WithValue(c.Request.Context(), idKey{}, "req-7") // => fixed id, golden-stable
	c.Request = c.Request.WithContext(ctx)                          // => handlers and helpers see the value
	c.Next()                                                        // => the chain runs under the value
}

// => lookup reads the request id back out, defaulting when absent.
// => helpers take ctx so they work in handlers and goroutines alike
func lookup(ctx context.Context) string { // => the standard context, not gin's
	if id, ok := ctx.Value(idKey{}).(string); ok { // => type-assert the value back out
		return id // => the stamped id travels with the request
	}
	return "no-id" // => unstamped contexts degrade honestly
}

// => fetch simulates a helper that needs the id far from the handler.
// => real helpers query stores; this one only proves the value arrives
func fetch(ctx context.Context) string { // => ctx crosses the goroutine boundary
	done := make(chan string, 1) // => buffered: the helper never blocks
	go func() {                  // => the value rides into the goroutine (co-07)
		done <- lookup(ctx) // => same id on the other side of go
	}()
	return <-done // => wait for the helper: deterministic join
}

// => who answers with the id seen at three layers: middleware, handler, helper.
// => all three must agree: the value crossed every boundary intact
func who(c *gin.Context) { // => the handler reads at its own layer
	handlerID := lookup(c.Request.Context())                     // => the handler's own view
	helperID := fetch(c.Request.Context())                       // => the helper's view, via goroutine
	c.JSON(200, gin.H{"handler": handlerID, "helper": helperID}) // => both views, one body (co-04)
}

// => newRouter stamps every request, then serves the id back three ways.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: middleware added by hand
	router.Use(stamp)         // => every request below carries req-7 (co-06)
	router.GET("/who", who)   // => one route, three agreeing views
	return router             // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => stamp, handler, and helper run
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => handler and helper agree on req-7: the value crossed intact (co-07)
	check(router, "/who") // => Output: GET /who -> 200 {"handler":"req-7","helper":"req-7"}
}
