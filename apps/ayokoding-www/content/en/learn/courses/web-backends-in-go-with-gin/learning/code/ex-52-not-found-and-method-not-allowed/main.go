// => Example 52: Not Found and Method Not Allowed.
// => Absences come in two flavors: no such path versus wrong verb on a real
// => path. This example serves a two-verb resource and prints all four cells
// => of the matrix: two hits, one 404, and one 405.
package main

import (
	"fmt"                      // => prints one verdict per matrix cell
	"github.com/gin-gonic/gin" // => the absence matrix under test (co-05)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => newRouter serves GET and POST on /items with 405 switched on.
// => HandleMethodNotAllowed separates wrong-verb from unknown-path (co-05)
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                                               // => silence the debug banner for golden output
	router := gin.New()                                                     // => bare engine: no hidden middleware
	router.HandleMethodNotAllowed = true                                    // => wrong verb becomes 405, not 404
	router.GET("/items", func(c *gin.Context) { c.String(200, "listed") })  // => the read cell
	router.POST("/items", func(c *gin.Context) { c.String(201, "stored") }) // => the write cell
	return router                                                           // => hand the wired engine back
}

// => cell serves one method-path combination and prints status with body.
// => the matrix varies both halves: four cells, four lines
func cell(router *gin.Engine, method string, target string) { // => verb plus path vary together
	req := httptest.NewRequest(method, target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                                // => the assertion surface
	router.ServeHTTP(w, req)                                   // => absence logic runs inside (co-09)
	fmt.Println(method, target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => both verbs on the real path hit: the two happy cells
	cell(router, "GET", "/items")  // => Output: GET /items -> 200 listed
	cell(router, "POST", "/items") // => Output: POST /items -> 201 stored
	// => unknown path misses everything: 404, plain and stable
	cell(router, "GET", "/nope") // => Output: GET /nope -> 404 404 page not found
	// => real path, wrong verb: 405 names the method problem (co-05)
	cell(router, "DELETE", "/items") // => Output: DELETE /items -> 405 405 method not allowed
}
