// => Example 34: Problem Details for Clients.
// => RFC 7807 gives errors a standard shape that any client can parse: type,
// => title, status, detail, and instance. This example answers a missing
// => order and a bad filter with problem+json bodies and prints both beside
// => the happy path.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => problem+json error responses (co-05)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => problem writes one RFC 7807 body with the shared five keys.
// => type names the failure class; instance names this occurrence (co-05)
func problem(c *gin.Context, status int, typ string, title string, detail string) { // => status core: always set
	// => application/problem+json tells generic clients how to parse this
	c.Header("Content-Type", "application/problem+json") // => the standard media type
	c.JSON(status, gin.H{                                // => the five keys every problem carries
		"type":     typ,                // => stable URI for the failure class
		"title":    title,              // => short human summary
		"status":   status,             // => the code, repeated inside
		"detail":   detail,             // => what happened this time
		"instance": c.Request.URL.Path, // => which request failed
	})
}

// => newRouter serves one order lookup with two problem branches.
// => missing orders and bad filters fail differently but shape alike
func newRouter(store map[string]string) *gin.Engine { // => the store arrives pre-filled
	gin.SetMode(gin.TestMode)                        // => silence the debug banner for golden output
	router := gin.New()                              // => bare engine: no hidden middleware
	router.GET("/orders/:id", func(c *gin.Context) { // => look one order up
		v, ok := store[c.Param("id")] // => the lookup decides the branch
		if !ok {                      // => unknown ids are problems, not panics
			// => out-of-band type URI: the class of failure, namespaced
			problem(c, 404, "https://api.example.com/problems/no-order", "No such order", "order "+c.Param("id")+" does not exist") // => 404 problem (co-05)
			return                                                                                                                  // => the problem is the whole answer
		}
		c.JSON(200, gin.H{"id": c.Param("id"), "item": v}) // => the happy path stays plain JSON (co-04)
	})
	router.GET("/orders", func(c *gin.Context) { // => list with an optional status filter
		// => only open and shut exist: anything else is a bad filter
		if s := c.Query("status"); s != "" && s != "open" && s != "shut" { // => unknown filters fail here
			problem(c, 400, "https://api.example.com/problems/bad-filter", "Bad status filter", "status must be open or shut") // => 400 problem
			return                                                                                                             // => the problem replaces the listing
		}
		c.JSON(200, []string{"o1"}) // => the fixed listing (co-04)
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path plus query is the variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                    // => in-memory response capture
	// => the problem media type rides the response: print it beside the body
	router.ServeHTTP(w, req)                                  // => problem branches run inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	store := map[string]string{"o1": "book"} // => one order exists from the start
	router := newRouter(store)               // => wiring separate from traffic, as always
	// => present orders answer plain JSON: problems are for failures only
	check(router, "/orders/o1") // => Output: GET /orders/o1 -> 200 {"id":"o1","item":"book"}
	// => unknown ids answer a 404 problem with all five keys (co-05)
	check(router, "/orders/o9") // => Output: GET /orders/o9 -> 404 {"detail":"order o9 does not exist","instance":"/orders/o9","status":404,"title":"No such order","type":"https://api.example.com/problems/no-order"}
	// => bad filters answer a 400 problem: same keys, different values
	check(router, "/orders?status=lost") // => Output: GET /orders?status=lost -> 400 {"detail":"status must be open or shut","instance":"/orders","status":400,"title":"Bad status filter","type":"https://api.example.com/problems/bad-filter"}
}
