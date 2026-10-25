// => Example 76: OpenAPI from Code or Schema.
// => FastAPI generates OpenAPI from handlers; Gin serves a hand-written
// => schema beside them. This example serves a fixed OpenAPI document
// => describing its two routes and prints the title and version the
// => contract promises, plus the paths the schema lists.
package main

import (
	"fmt"                      // => prints the schema's promises
	"github.com/gin-gonic/gin" // => the schema served beside the routes (co-15, co-16)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => schema is the hand-written OpenAPI document for the two routes below.
// => fixed text: the schema is a contract, versioned like code (co-15)
const schema = `{"openapi":"3.0.3","info":{"title":"shop api","version":"1.4.2"},"paths":{"/items":{"get":{"summary":"list items"}},"/orders":{"get":{"summary":"list orders"}}}}`

// => newRouter serves the two listed routes plus the schema itself.
// => /openapi.json is the contract endpoint: clients codegen from it
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                                                    // => silence the debug banner for golden output
	router := gin.New()                                                          // => bare engine: no hidden middleware
	router.GET("/items", func(c *gin.Context) { c.JSON(200, []string{"bolt"}) }) // => the listed collection
	router.GET("/orders", func(c *gin.Context) { c.JSON(200, []string{"o1"}) })  // => the second listing
	router.GET("/openapi.json", func(c *gin.Context) {                           // => the schema beside the routes (co-15)
		c.Data(200, "application/json", []byte(schema)) // => fixed bytes: the contract, frozen
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => the assertion surface
	router.ServeHTTP(w, req)                                  // => routes and schema serve alike (co-09)
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => the listings answer plain JSON: the schema describes, routes serve
	check(router, "/items") // => Output: GET /items -> 200 ["bolt"]
	// => the schema serves byte for byte: title, version, and both paths
	check(router, "/openapi.json") // => Output: GET /openapi.json -> 200 {"openapi":"3.0.3","info":{"title":"shop api","version":"1.4.2"},"paths":{"/items":{"get":{"summary":"list items"}},"/orders":{"get":{"summary":"list orders"}}}}
}
