// => Example 28: Middleware Order Is Outer to Inner.
// => Middleware forms an onion: each layer runs its before-code, calls
// => inward, then runs its after-code. This example wraps one route in two
// => named layers that record their steps, and prints the exact visit order
// => the onion produces.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => layered middleware (co-02)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => joins the recorded steps for the body
)

// => steps records the visit order both layers and the handler append to.
// => package-level on purpose: the lesson is the order, not the plumbing
var steps []string // => reset per request below, appended in visit order

// => layer returns middleware that brackets the chain with its name.
// => the returned func closes over name: inner layers share one shape
func layer(name string) gin.HandlerFunc { // => inner layers only bracket
	return func(c *gin.Context) { // => gin calls this in registration order
		steps = append(steps, "in-"+name)  // => before-code: on the way in
		c.Next()                           // => dive one layer deeper
		steps = append(steps, "out-"+name) // => after-code: on the way out
	}
}

// => edge is the outermost layer: it brackets like the rest, then writes the
// => recorded visit order as the response body after the chain returns.
// => writing last is the trick: the body then holds every step (co-02)
func edge(c *gin.Context) { // => outermost: registered before the rest
	steps = append(steps, "in-outer")  // => before-code runs first of all
	c.Next()                           // => the inner layer and handler run here
	steps = append(steps, "out-outer") // => after-code runs last of all
	// => the response is written here, after every step was recorded
	c.String(200, strings.Join(steps, ",")) // => the order becomes the body (co-04)
}

// => newRouter wraps one route in outer then inner, in that order.
// => registration order IS the onion order: first registered, outermost
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: middleware added by hand
	// => outer first, inner second: the call order mirrors this line
	router.GET("/onion", edge, layer("inner"), func(c *gin.Context) { // => edge outside, inner inside
		steps = append(steps, "handler") // => the core runs between the ins and outs
	})
	return router // => hand the wired engine back
}

// => check serves one GET after resetting the ledger, then prints the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	steps = nil                                               // => fresh ledger per request: orders never mix
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => the onion wraps around the handler
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => in-outer, in-inner, handler, out-inner, out-outer: the onion order (co-02)
	check(router, "/onion") // => Output: GET /onion -> 200 in-outer,in-inner,handler,out-inner,out-outer
}
