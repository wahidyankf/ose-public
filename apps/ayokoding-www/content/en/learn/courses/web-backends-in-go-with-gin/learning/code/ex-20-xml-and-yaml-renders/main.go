// => Example 20: XML and YAML Renders.
// => Not every client parses JSON, so responses render in the format each
// => client negotiates. This example serves the same release record as JSON,
// => XML, and YAML from three routes and prints each rendering.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => format-specific renderers (co-04, co-12)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => Release is the shared record: one struct, three wire spellings.
// => xml tags shape elements; yaml tags shape keys beside json (co-15)
type Release struct { // => the record every renderer shares
	Name    string `json:"name" xml:"name" yaml:"name"`          // => same field, three syntaxes
	Version string `json:"version" xml:"version" yaml:"version"` // => version travels everywhere
	Stable  bool   `json:"stable" xml:"stable" yaml:"stable"`    // => booleans spell alike in all three
}

// => release is the fixed record every renderer serves below.
func release() Release { // => one constructor: formats never invent data
	return Release{Name: "gin", Version: "1.12.0", Stable: true} // => fixed record, golden bytes
}

// => newRouter wires one route per format around the same record.
// => separate routes keep this example explicit; content negotiation
// => by Accept header is the production refinement of the same idea
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)                                            // => silence the debug banner for golden output
	router := gin.New()                                                  // => bare engine: no hidden middleware
	router.GET("/json", func(c *gin.Context) { c.JSON(200, release()) }) // => the default tongue (co-04)
	router.GET("/xml", func(c *gin.Context) { c.XML(200, release()) })   // => elements for XML clients (co-12)
	router.GET("/yaml", func(c *gin.Context) { c.YAML(200, release()) }) // => mappings for YAML clients (co-12)
	return router                                                        // => hand the wired engine back
}

// => check serves one GET in-process and prints the format with the body.
func check(router *gin.Engine, target string) { // => the format suffix is the variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => the renderer runs inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => JSON braces: the compact default every earlier example speaks
	check(router, "/json") // => Output: GET /json -> 200 {"name":"gin","version":"1.12.0","stable":true}
	// => XML root plus elements: legacy clients parse this shape (co-12)
	check(router, "/xml") // => Output: GET /xml -> 200 <Release><name>gin</name><version>1.12.0</version><stable>true</stable></Release>
	// => YAML mappings: config-shaped clients read this best (co-12)
	check(router, "/yaml") // => Output: GET /yaml -> 200 name: gin
	// => YAML continues on the next lines: version and stable follow
	// => Output: version: 1.12.0
	// => Output: stable: true
}
