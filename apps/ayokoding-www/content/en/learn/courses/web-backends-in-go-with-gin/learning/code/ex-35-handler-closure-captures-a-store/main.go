// => Example 35: Handler Closure Captures a Store.
// => Handlers need state, and a closure over a store is the smallest honest
// => way to supply it. This example closes two routes over one map, mutates
// => through one of them, and prints the mutation the other one reads.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => closures as handlers (co-06)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => newRouter closes both routes over the same map.
// => the map is created once and captured twice: one state, two views
func newRouter(store map[string]int) *gin.Engine { // => the store arrives pre-made (co-06)
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => the closure reads the captured map at request time: always fresh
	router.GET("/stock/:sku", func(c *gin.Context) { // => read through the closure
		c.JSON(200, gin.H{"sku": c.Param("sku"), "qty": store[c.Param("sku")]}) // => missing keys read zero (co-04)
	})
	// => the same map, written through the sibling route
	router.POST("/stock/:sku/add/:n", func(c *gin.Context) { // => write through the closure
		n := 0 // => the parsed amount, or zero when unparseable
		// => Sscanf parses the count; failure keeps zero deliberately
		fmt.Sscanf(c.Param("n"), "%d", &n)                                      // => one integer from the path (co-03)
		store[c.Param("sku")] += n                                              // => mutate the shared map
		c.JSON(201, gin.H{"sku": c.Param("sku"), "qty": store[c.Param("sku")]}) // => 201 with the new total (co-04)
	})
	return router // => hand the wired engine back
}

// => check serves one request in-process and prints method, status, and body.
func check(router *gin.Engine, method string, target string) { // => method and path vary
	req := httptest.NewRequest(method, target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                                // => in-memory response capture
	router.ServeHTTP(w, req)                                   // => closures run over the shared map
	line := fmt.Sprintf("%s %s -> %d", method, target, w.Code) // => status core: always present
	if w.Body.String() != "" {                                 // => every answer here has a body
		line += " " + w.Body.String() // => bodies join with one space
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

func main() {
	store := map[string]int{"bolt": 4} // => one SKU exists with four on hand
	router := newRouter(store)         // => both routes close over this map (co-06)
	// => the stored SKU reads four: closure state is live, not copied
	check(router, "GET", "/stock/bolt") // => Output: GET /stock/bolt -> 200 {"qty":4,"sku":"bolt"}
	// => adding three mutates the shared map: the total becomes seven
	check(router, "POST", "/stock/bolt/add/3") // => Output: POST /stock/bolt/add/3 -> 201 {"qty":7,"sku":"bolt"}
	// => the read route sees the mutation: same map, new total (co-06)
	check(router, "GET", "/stock/bolt") // => Output: GET /stock/bolt -> 200 {"qty":7,"sku":"bolt"}
}
