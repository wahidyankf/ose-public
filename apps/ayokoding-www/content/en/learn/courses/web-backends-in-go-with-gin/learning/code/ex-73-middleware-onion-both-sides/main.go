// => Example 73: Middleware Onion Both Sides.
// => Starlette wraps requests in middleware layers and Gin wraps them in an
// => onion with identical order: outer before-code first, inner after-code
// => first. This example records the before-and-after order of two layers
// => around one handler and prints the five-step visit sequence both
// => frameworks produce.
package main

import (
	"fmt"                      // => prints the visit sequence
	"github.com/gin-gonic/gin" // => the onion both frameworks share (co-02, co-16)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => joins the recorded steps for the body
)

// => steps records the visit order middleware and handler append to.
// => package-level on purpose: the lesson is the order, not the plumbing
var steps []string // => reset per request, appended in visit order

// => layer returns middleware that brackets the chain with its name.
// => Starlette spells this as classes; Gin as closures: same onion
func layer(name string) gin.HandlerFunc { // => outer names run first
	return func(c *gin.Context) { // => before-code, Next, after-code
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

// => newRouter wraps one route in the two-layer onion both sides share.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: middleware added by hand
	// => cors-like outer, auth-like inner: policy outside, identity inside
	router.GET("/guarded", edge, layer("inner"), func(c *gin.Context) { // => edge outside, inner inside
		steps = append(steps, "handler") // => the core runs between the ins and outs
	})
	return router // => hand the wired engine back
}

// => check serves one GET after resetting the ledger, then prints the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	steps = nil                                               // => fresh ledger per request: orders never mix
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => the onion wraps around the handler (co-09)
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => identical on both frameworks: ins in order, handler, outs reversed (co-16)
	check(router, "/guarded") // => Output: GET /guarded -> 200 in-outer,in-inner,handler,out-inner,out-outer
}
