// => Example 13: Bind URI Segments into a Struct.
// => Path captures can bind into a struct too, which validates them like any
// => other input. This example binds a tenant and a report id from the path,
// => rejects a blank tenant, and prints the struct each of three paths
// => produces.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => URI binding from path captures (co-03)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => ReportID names one report inside one tenant, both read from the path.
// => uri tags map struct fields to colon segments by name (co-03)
type ReportID struct { // => the path becomes a typed value
	Tenant string `uri:"tenant" binding:"required"` // => empty tenants never validate
	Number int    `uri:"number" binding:"min=1"`    // => report numbers start at one
}

// => report binds the two captures and echoes the typed identity back.
// => ShouldBindUri reads c.Params the way body binders read bytes (co-03)
func report(c *gin.Context) { // => the handler works with ReportID, not strings
	var id ReportID // => the target: zero ReportID until binding fills it
	// => number=abc fails the int conversion: a 400, not a panic (co-05)
	if err := c.ShouldBindUri(&id); err != nil { // => conversion and tags run here
		c.JSON(400, gin.H{"error": "bad report id"}) // => fixed envelope (co-04)
		return                                       // => unparseable paths never reach the logic below
	}
	c.JSON(200, id) // => the typed identity, echoed as the contract (co-04)
}

// => newRouter wires the single report route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)                              // => silence the debug banner for golden output
	router := gin.New()                                    // => bare engine: no hidden middleware
	router.GET("/tenants/:tenant/reports/:number", report) // => two captures, one struct (co-03)
	return router                                          // => hand the wired engine back
}

// => check serves one GET in-process and prints the path with the answer.
func check(router *gin.Engine, target string) { // => the path is the variable
	req := httptest.NewRequest("GET", target, nil)            // => captures ride in the URL
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => URI binding runs inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => both captures parse: the typed identity echoes back whole
	check(router, "/tenants/acme/reports/7") // => Output: GET /tenants/acme/reports/7 -> 200 {"Tenant":"acme","Number":7}
	// => number=abc is no int: the conversion fails before min runs (co-05)
	check(router, "/tenants/acme/reports/abc") // => Output: GET /tenants/acme/reports/abc -> 400 {"error":"bad report id"}
	// => number=0 parses but breaks min=1: valid shape, invalid value
	check(router, "/tenants/acme/reports/0") // => Output: GET /tenants/acme/reports/0 -> 400 {"error":"bad report id"}
}
