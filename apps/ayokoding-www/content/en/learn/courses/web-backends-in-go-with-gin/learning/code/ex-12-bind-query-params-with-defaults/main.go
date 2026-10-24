// => Example 12: Bind Query Params with Defaults.
// => Query binding fills a struct the way body binding does, with defaults
// => for keys the client omits. This example binds page, size, and order into
// => a Page struct and prints the struct each of three query strings produces.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => query binding into a typed struct (co-03)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => Page is the pagination contract: all three knobs in one typed value.
// => form tags name the query keys; default tags fill absent ones (co-03)
type Page struct { // => one struct for the whole query string
	Number int    `form:"page,default=1" binding:"min=1" json:"page"`              // => absent page means one: zero never survives min=1
	Size   int    `form:"size,default=20" binding:"max=100" json:"size"`           // => absent size means twenty, capped at one hundred
	Order  string `form:"order,default=asc" binding:"oneof=asc desc" json:"order"` // => only two directions exist
}

// => list binds the query into a Page and echoes the typed result back.
// => ShouldBindQuery parses the URL query, never the body (co-03)
func list(c *gin.Context) { // => the handler works with Page, not raw strings
	var p Page // => the target: zero Page until binding fills it
	// => min, max, and oneof run here too: the query is validated input
	if err := c.ShouldBindQuery(&p); err != nil { // => page=0 or order=sideways fails here
		c.JSON(400, gin.H{"error": "bad page"}) // => fixed envelope for a bad query (co-04)
		return                                  // => invalid pagination never reaches the logic below
	}
	c.JSON(200, p) // => the typed query, echoed as the contract (co-04)
}

// => newRouter wires the single listing route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)  // => silence the debug banner for golden output
	router := gin.New()        // => bare engine: no hidden middleware
	router.GET("/items", list) // => one path, typed query in and out (co-03)
	return router              // => hand the wired engine back
}

// => check serves one GET in-process and prints the query with the answer.
func check(router *gin.Engine, target string) { // => the query string is the variable
	req := httptest.NewRequest("GET", target, nil)            // => query rides in the URL, no body
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => query binding runs inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => an empty query still binds: defaults fill every field (co-03)
	check(router, "/items") // => Output: GET /items -> 200 {"page":1,"size":20,"order":"asc"}
	// => explicit values override the defaults field by field
	check(router, "/items?page=3&size=5&order=desc") // => Output: GET /items?page=3&size=5&order=desc -> 200 {"page":3,"size":5,"order":"desc"}
	// => page=0 breaks min=1: a bad query is a 400 like a bad body (co-10)
	check(router, "/items?page=0") // => Output: GET /items?page=0 -> 400 {"error":"bad page"}
}
