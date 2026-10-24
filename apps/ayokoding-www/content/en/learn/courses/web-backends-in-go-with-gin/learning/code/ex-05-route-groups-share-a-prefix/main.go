// => Example 5: Route Groups Share a Prefix.
// => Groups factor a shared prefix out of every route in a version or an
// => area. This example serves two API versions plus a nested admin group
// => from one engine, and shows an unversioned path falling through to 404.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => grouped routing with shared prefixes (co-11)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => newRouter versions the API with groups instead of repeated prefixes.
// => Group fixes the prefix once; routes inside stay short (co-11)
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => v1 answers the original status shape: a plain string
	v1 := router.Group("/api/v1")                                      // => every route below starts with /api/v1
	v1.GET("/status", func(c *gin.Context) { c.String(200, "v1 ok") }) // => first version
	// => v2 answers the newer envelope without touching v1's handler
	v2 := router.Group("/api/v2")                                              // => a second prefix, same engine
	v2.GET("/status", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) }) // => JSON envelope (co-04)
	// => groups nest: the admin area inherits the whole /api/v1 prefix
	admin := v1.Group("/admin")                                                // => full prefix becomes /api/v1/admin
	admin.GET("/users", func(c *gin.Context) { c.String(200, "admin users") }) // => nested area route
	return router                                                              // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the versioned path is the variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => full pipeline, minus the socket
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => each version answers its own shape on its own prefix
	check(router, "/api/v1/status") // => Output: GET /api/v1/status -> 200 v1 ok
	check(router, "/api/v2/status") // => Output: GET /api/v2/status -> 200 {"ok":true}
	// => the nested group composes both prefixes into one path
	check(router, "/api/v1/admin/users") // => Output: GET /api/v1/admin/users -> 200 admin users
	// => no group claims the bare path: versioning is mandatory here (co-05)
	check(router, "/status") // => Output: GET /status -> 404 404 page not found
}
