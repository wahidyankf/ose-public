// => Example 71: Routing Table vs Decorators.
// => FastAPI registers routes with decorators on functions; Gin registers
// => them with calls on an engine, and the table stays inspectable. This
// => example registers four routes, prints the sorted route table, and
// => serves one request to prove the table is live, not decorative.
package main

import (
	"fmt"                      // => prints the sorted route table
	"github.com/gin-gonic/gin" // => the explicit route table (co-01, co-16)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"sort"                     // => sorts the table: registration order varies (co-16)
)

// => newRouter registers four routes the table below lists.
// => every route is a call: the table is built, not declared (co-16)
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: routes attach by calling
	// => FastAPI would write @app.get("/users"): one decorator per function
	// => Gin writes router.GET("/users", ...): one call per route, same shape
	router.GET("/users", func(c *gin.Context) { c.String(200, "users") })    // => the collection
	router.POST("/users", func(c *gin.Context) { c.String(201, "created") }) // => the creation
	router.GET("/users/:id", func(c *gin.Context) { c.String(200, "one") })  // => the member
	router.GET("/healthz", func(c *gin.Context) { c.String(200, "ok") })     // => the probe
	return router                                                            // => hand the wired engine back
}

// => table prints every registered route sorted by method then path.
// => Routes() exposes the table as data: audit it, print it, test it
func table(router *gin.Engine) { // => the inspectable difference, demonstrated
	routes := router.Routes() // => every method-path pair, unsorted
	// => sort for goldens: registration order is an implementation detail
	sort.Slice(routes, func(i int, j int) bool { // => method first, then path
		if routes[i].Method != routes[j].Method { // => GET group before POST group
			return routes[i].Method < routes[j].Method // => alphabetical methods
		}
		return routes[i].Path < routes[j].Path // => alphabetical paths inside
	})
	for _, r := range routes { // => one line per route, stable order
		fmt.Println("route", r.Method, r.Path) // => the table made visible (co-16)
	}
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => four registrations, four table rows: nothing hidden, nothing extra
	table(router) // => Output: route GET /healthz
	// => Output: route GET /users
	// => Output: route GET /users/:id
	// => Output: route POST /users
	// => the table serves, not just lists: one live request proves it
	req := httptest.NewRequest("GET", "/users/7", nil)      // => server-side request, no socket
	w := httptest.NewRecorder()                             // => in-memory response capture
	router.ServeHTTP(w, req)                                // => the member route serves (co-09)
	fmt.Println("GET /users/7 ->", w.Code, w.Body.String()) // => Output: GET /users/7 -> 200 one
}
