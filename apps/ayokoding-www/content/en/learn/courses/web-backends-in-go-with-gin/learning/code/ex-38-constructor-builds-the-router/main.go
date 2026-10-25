// => Example 38: Constructor Builds the Router.
// => A NewRouter function takes every dependency and returns a wired engine,
// => so tests build the service without main. This example constructs the
// => same router twice with different stores and prints each build's
// => isolated answers.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => the engine the constructor returns (co-06)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => Deps names everything NewRouter needs: the store, nothing else.
// => a struct keeps the signature stable as dependencies grow (co-06)
type Deps struct { // => one parameter, many fields, zero globals
	Stock map[string]int // => the only dependency this service has
}

// => NewRouter wires the whole service from its dependencies.
// => exported so other packages (and tests) can build it too
func NewRouter(d Deps) *gin.Engine { // => dependencies in, engine out
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: middleware added by hand
	// => the closure captures d.Stock: construction owns the wiring (co-06)
	router.GET("/stock/:sku", func(c *gin.Context) { // => read through the deps
		c.JSON(200, gin.H{"sku": c.Param("sku"), "qty": d.Stock[c.Param("sku")]}) // => zero for unknown SKUs (co-04)
	})
	return router // => the fully wired, immediately testable engine
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => full pipeline, minus the socket
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	// => two builds, two stores: construction isolates them completely
	shopA := NewRouter(Deps{Stock: map[string]int{"bolt": 4}}) // => shop A stocks bolts
	shopB := NewRouter(Deps{Stock: map[string]int{"nut": 9}})  // => shop B stocks nuts
	// => each build answers from its own store: no shared state (co-06)
	check(shopA, "/stock/bolt") // => Output: GET /stock/bolt -> 200 {"qty":4,"sku":"bolt"}
	check(shopA, "/stock/nut")  // => Output: GET /stock/nut -> 200 {"qty":0,"sku":"nut"}
	check(shopB, "/stock/nut")  // => Output: GET /stock/nut -> 200 {"qty":9,"sku":"nut"}
	check(shopB, "/stock/bolt") // => Output: GET /stock/bolt -> 200 {"qty":0,"sku":"bolt"}
}
