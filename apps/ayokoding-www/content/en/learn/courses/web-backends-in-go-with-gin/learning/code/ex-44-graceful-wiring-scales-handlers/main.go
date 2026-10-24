// => Example 44: Graceful Wiring Scales Handlers.
// => Route tables grow, so wiring loops over a service list instead of
// => repeating blocks. This example registers three resources from one slice
// => of route descriptors and prints one answer from each.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => loop-driven route registration (co-06, co-11)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => resource describes one servable thing: its path and its fixed answer.
// => data drives wiring: adding a resource appends one line (co-11)
type resource struct { // => the route table as data, not code
	path   string // => the URL prefix this resource owns
	answer string // => the fixed body its routes serve
}

// => newRouter registers every resource's read routes from the one list.
// => the loop is the wiring: N resources cost N lines of data
func newRouter(all []resource) *gin.Engine { // => the catalog arrives at startup (co-11)
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: middleware added by hand
	for _, r := range all {   // => one pass per resource, same shape each time
		r := r // => capture the loop variable: every closure keeps its own
		// => each resource gets a group: /bolts, /nuts, /washers (co-11)
		g := router.Group("/" + r.path)  // => the group owns the prefix
		g.GET("", func(c *gin.Context) { // => list lives at the bare prefix
			c.JSON(200, gin.H{"resource": r.path, "answer": r.answer}) // => data-driven answer (co-04)
		})
		g.GET("/ping", func(c *gin.Context) { // => every resource answers ping too
			c.String(200, r.path+" ok") // => the name proves which group served
		})
	}
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => loop-wired routes serve
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	// => three resources, six routes, one loop: data scales the table
	catalog := []resource{{"bolts", "hex"}, {"nuts", "wing"}, {"washers", "flat"}} // => the whole API as data (co-11)
	router := newRouter(catalog)                                                   // => wiring separate from traffic, as always
	// => each group's list answers from the descriptor: no per-route code
	check(router, "/bolts")   // => Output: GET /bolts -> 200 {"answer":"hex","resource":"bolts"}
	check(router, "/nuts")    // => Output: GET /nuts -> 200 {"answer":"wing","resource":"nuts"}
	check(router, "/washers") // => Output: GET /washers -> 200 {"answer":"flat","resource":"washers"}
	// => ping proves the group prefix composes: resource plus suffix (co-06)
	check(router, "/nuts/ping") // => Output: GET /nuts/ping -> 200 nuts ok
}
