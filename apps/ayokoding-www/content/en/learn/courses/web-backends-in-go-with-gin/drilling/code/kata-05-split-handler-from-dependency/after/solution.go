// => Kata 5 solution: handlers depend on the Store interface.
// => The routes call Get on an injected Store: the memory implementation
// => slots in at the edge, and SQL would slot into the same parameter
// => without touching a handler.
package main

import (
	"fmt"                      // => prints each answer
	"github.com/gin-gonic/gin" // => routes depend on the interface
	"net/http/httptest"        // => in-process request and recorder
)

// => Store is the counting contract: implementations decide where counts live.
// => handlers name Store, never the map: swaps touch one line
type Store interface { // => the seam the memory type implements
	Get(sku string) int        // => read the current count, zero when absent
	Add(sku string, n int) int // => add n and return the new total
}

// => memory is the map-backed Store for development and these checks.
type memory struct { // => the implementation handlers never name
	stock map[string]int // => the same map, now behind methods
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
// => Store (not *memory) is the parameter: any implementation fits
func newRouter(s Store) *gin.Engine { // => the seam is the signature
	gin.SetMode(gin.TestMode)                        // => silence the debug banner for golden output
	router := gin.New()                              // => bare engine: no hidden middleware
	router.GET("/stock/:sku", func(c *gin.Context) { // => read through the interface
		c.JSON(200, gin.H{"qty": s.Get(c.Param("sku"))}) // => zero for unknown SKUs
	})
	router.POST("/stock/:sku/add/:n", func(c *gin.Context) { // => write through the interface
		n := 0                                              // => the parsed amount, or zero when unparseable
		fmt.Sscanf(c.Param("n"), "%d", &n)                  // => one integer from the path
		c.JSON(201, gin.H{"qty": s.Add(c.Param("sku"), n)}) // => 201 with the new total
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
	router := newRouter(&memory{stock: map[string]int{"bolt": 4}}) // => handlers see Store, never *memory
	// => reads cross the interface: same answers, new seam
	check(router, "GET", "/stock/bolt") // => Output: GET /stock/bolt -> 200 {"qty":4}
	check(router, "GET", "/stock/nut")  // => Output: GET /stock/nut -> 200 {"qty":0}
	// => writes cross it too: the total becomes seven behind the seam
	check(router, "POST", "/stock/bolt/add/3") // => Output: POST /stock/bolt/add/3 -> 201 {"qty":7}
}
