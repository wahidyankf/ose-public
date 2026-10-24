// => Example 42: Stub Store Fails on Purpose.
// => Happy paths are half the suite; a stub that always fails proves the
// => error branch answers correctly. This example injects a failing stock
// => service, prints the 503 it produces, and contrasts it with the working
// => service beside it.
package main

import (
	"errors"                   // => the stub's fixed failure value
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => error-branch coverage in-process (co-09)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => stocker counts stock: implementations succeed or fail by design.
// => one method is enough to show both branches of the handler
type stocker interface { // => the seam the stub and the real thing share
	Count(sku string) (int, error) // => count or the reason it is unknown
}

// => real counts from a fixed map: the happy-path implementation.
type real struct { // => the production-shaped stand-in
	stock map[string]int // => fixed data, no failure modes
}

// => Count reads the map, failing only for unknown SKUs.
func (r *real) Count(sku string) (int, error) { // => unknown SKUs are real failures too
	q, ok := r.stock[sku] // => the lookup decides the branch
	if !ok {              // => absent SKUs fail, like a real miss
		return 0, errors.New("unknown sku") // => fixed failure, no internals
	}
	return q, nil // => the stored count, no error
}

// => broken always fails: the stub that exercises the error branch.
// => stubs implement the interface with canned answers, good or bad
type broken struct{} // => no state: failure is the whole behavior

// => Count returns the outage for every SKU: the branch under test.
func (broken) Count(string) (int, error) { // => every SKU fails identically
	return 0, errors.New("warehouse unreachable") // => the outage under test (co-06)
}

// => newRouter wires the stock route against any stocker.
// => stocker (not *real) is the parameter: stubs fit the same slot
func newRouter(s stocker) *gin.Engine { // => the implementation arrives injected
	gin.SetMode(gin.TestMode)                        // => silence the debug banner for golden output
	router := gin.New()                              // => bare engine: no hidden middleware
	router.GET("/stock/:sku", func(c *gin.Context) { // => one route, two outcomes
		q, err := s.Count(c.Param("sku")) // => the seam decides success or failure
		if err != nil {                   // => the error branch under test
			// => 503 names the condition: try again later, nothing is wrong with the request
			c.JSON(503, gin.H{"error": "stock unavailable"}) // => fixed envelope, no internals (co-05)
			return                                           // => the failure is the whole answer
		}
		c.JSON(200, gin.H{"sku": c.Param("sku"), "qty": q}) // => the happy path (co-04)
	})
	return router // => hand the wired engine back
}

// => check serves one GET and prints which service answered with what.
func check(tag string, router *gin.Engine, target string) { // => tag names the implementation
	req := httptest.NewRequest("GET", target, nil)                 // => server-side request, no socket
	w := httptest.NewRecorder()                                    // => in-memory response capture
	router.ServeHTTP(w, req)                                       // => the stub or the real thing serves
	fmt.Println(tag, "GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	// => the working service answers counts: the branch everyone tests first
	check("real", newRouter(&real{stock: map[string]int{"bolt": 4}}), "/stock/bolt") // => Output: real GET /stock/bolt -> 200 {"qty":4,"sku":"bolt"}
	// => the broken stub answers 503 for everything: the branch this example exists for (co-09)
	check("broken", newRouter(broken{}), "/stock/bolt") // => Output: broken GET /stock/bolt -> 503 {"error":"stock unavailable"}
	// => even unknown SKUs fail through the stub: failure is total here
	check("broken", newRouter(broken{}), "/stock/nut") // => Output: broken GET /stock/nut -> 503 {"error":"stock unavailable"}
}
