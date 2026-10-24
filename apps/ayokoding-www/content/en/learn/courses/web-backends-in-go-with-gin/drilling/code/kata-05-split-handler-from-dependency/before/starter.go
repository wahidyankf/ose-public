// => Kata 5 starter: handlers closed over a concrete map.
// => The routes capture *map state directly: swapping implementations
// => means rewriting every handler. Your task: define a Store interface
// => with Get and Add, inject it through the constructor, and prove the
// => memory implementation answers both reads below.
package main

import (
	"fmt"                      // => prints each answer
	"github.com/gin-gonic/gin" // => the routes you will unplug from the map
	"net/http/httptest"        // => in-process request and recorder
)

// => newRouter closes both routes over the same concrete map.
// => TODO: depend on a Store interface; inject the memory one here
func newRouter(stock map[string]int) *gin.Engine { // => the concrete type to replace
	gin.SetMode(gin.TestMode)                        // => silence the debug banner for golden output
	router := gin.New()                              // => bare engine: no hidden middleware
	router.GET("/stock/:sku", func(c *gin.Context) { // => read through the map
		c.JSON(200, gin.H{"qty": stock[c.Param("sku")]}) // => concrete access: your seam goes here
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => today's concrete access runs inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter(map[string]int{"bolt": 4}) // => concrete map at the edge
	// => direct today: your interface must print these exact lines
	check(router, "/stock/bolt") // => four on hand through the seam
	check(router, "/stock/nut")  // => zero through the seam as well
}
