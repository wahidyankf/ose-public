// => Example 41: In-Memory Store Resets Between Tests.
// => Tests need fresh state, so each check builds its own store instead of
// => sharing one. This example runs the same write-then-read scenario
// => against two separately built services and prints both isolated
// => results: the second starts empty even after the first wrote.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => constructor-built services (co-06)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds request bodies from fixed strings
)

// => build wires a counting service around a FRESH store every call.
// => calling build twice yields two isolated worlds: no shared state
func build() *gin.Engine { // => the test fixture constructor (co-09)
	gin.SetMode(gin.TestMode)                                // => silence the debug banner for golden output
	router := gin.New()                                      // => bare engine: no hidden middleware
	stock := map[string]int{}                                // => fresh map per build: tests never collide
	router.POST("/stock/:sku/add/:n", func(c *gin.Context) { // => write through the closure
		n := 0                                           // => the parsed amount, or zero when unparseable
		fmt.Sscanf(c.Param("n"), "%d", &n)               // => one integer from the path (co-03)
		stock[c.Param("sku")] += n                       // => mutate this build's map only
		c.JSON(201, gin.H{"qty": stock[c.Param("sku")]}) // => 201 with the new total (co-04)
	})
	router.GET("/stock/:sku", func(c *gin.Context) { // => read through the same closure
		c.JSON(200, gin.H{"qty": stock[c.Param("sku")]}) // => zero for unknown SKUs (co-04)
	})
	return router // => the isolated service under test
}

// => scenario writes three to bolt, then reads it back, printing both lines.
// => one scenario, run twice: isolation means identical answers
func scenario(router *gin.Engine, tag string) { // => tag names the world under test
	post := httptest.NewRequest("POST", "/stock/bolt/add/3", strings.NewReader("")) // => fixed write, no socket
	w := httptest.NewRecorder()                                                     // => in-memory response capture
	router.ServeHTTP(w, post)                                                       // => write three into this world's store
	fmt.Println(tag, "write ->", w.Code, w.Body.String())                           // => the write receipt
	get := httptest.NewRequest("GET", "/stock/bolt", nil)                           // => read the same SKU back
	w2 := httptest.NewRecorder()                                                    // => second capture, same world
	router.ServeHTTP(w2, get)                                                       // => the read must see the write above
	fmt.Println(tag, "read ->", w2.Code, w2.Body.String())                          // => the read proves isolation
}

func main() {
	// => world one writes three and reads three: its own private store
	scenario(build(), "world-one") // => Output: world-one write -> 201 {"qty":3}
	// => Output: world-one read -> 200 {"qty":3}
	// => world two starts empty: world one's three never leaks across (co-09)
	scenario(build(), "world-two") // => Output: world-two write -> 201 {"qty":3}
	// => Output: world-two read -> 200 {"qty":3}
}
