// => Example 36: Interface Store Swaps Cleanly.
// => Closures hard-wire one map type, but an interface lets memory, disk, or
// => test doubles swap behind it. This example serves counts from a Store
// => interface backed by memory, and the route table never names the
// => implementation.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => handlers depend on the interface (co-06)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => Store is the counting contract: implementations decide where counts live.
// => handlers name Store, never the map: swaps touch one line (co-06)
type Store interface { // => the seam every test double implements
	Get(sku string) int        // => read the current count, zero when absent
	Add(sku string, n int) int // => add n and return the new total
}

// => memory is the map-backed Store for development and these checks.
// => production swaps this for SQL without touching handlers (co-06)
type memory struct { // => the simplest implementation that works
	stock map[string]int // => the same map closures used, now behind methods
}

// => Get reads one SKU, answering zero for unknown ones.
func (m *memory) Get(sku string) int { // => pointer receiver: the map is shared
	return m.stock[sku] // => missing keys read zero, like before
}

// => Add grows one SKU and returns the new total.
func (m *memory) Add(sku string, n int) int { // => mutation behind the interface
	m.stock[sku] += n   // => the map still does the real work
	return m.stock[sku] // => callers print the total without re-reading
}

// => newRouter wires count routes against the Store interface.
// => Store (not *memory) is the parameter: any implementation fits (co-06)
func newRouter(s Store) *gin.Engine { // => the seam is the signature
	gin.SetMode(gin.TestMode)                        // => silence the debug banner for golden output
	router := gin.New()                              // => bare engine: no hidden middleware
	router.GET("/stock/:sku", func(c *gin.Context) { // => read through the interface
		c.JSON(200, gin.H{"sku": c.Param("sku"), "qty": s.Get(c.Param("sku"))}) // => zero for unknown SKUs (co-04)
	})
	router.POST("/stock/:sku/add/:n", func(c *gin.Context) { // => write through the interface
		n := 0                                                                     // => the parsed amount, or zero when unparseable
		fmt.Sscanf(c.Param("n"), "%d", &n)                                         // => one integer from the path (co-03)
		c.JSON(201, gin.H{"sku": c.Param("sku"), "qty": s.Add(c.Param("sku"), n)}) // => 201 with the new total (co-04)
	})
	return router // => hand the wired engine back
}

// => check serves one request in-process and prints method, status, and body.
func check(router *gin.Engine, method string, target string) { // => method and path vary
	req := httptest.NewRequest(method, target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                                // => in-memory response capture
	router.ServeHTTP(w, req)                                   // => the interface serves every call
	fmt.Println(method, target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	// => the implementation is chosen once, at the edge: memory here
	s := &memory{stock: map[string]int{"bolt": 4}} // => one SKU with four on hand
	router := newRouter(s)                         // => handlers see Store, never *memory (co-06)
	// => reads cross the interface: same answers as the closure version
	check(router, "GET", "/stock/bolt") // => Output: GET /stock/bolt -> 200 {"qty":4,"sku":"bolt"}
	// => writes cross it too: the total becomes seven behind the seam
	check(router, "POST", "/stock/bolt/add/3") // => Output: POST /stock/bolt/add/3 -> 201 {"qty":7,"sku":"bolt"}
	// => unknown SKUs read zero through the interface, exactly as before
	check(router, "GET", "/stock/nut") // => Output: GET /stock/nut -> 200 {"qty":0,"sku":"nut"}
}
