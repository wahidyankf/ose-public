// => Kata 7 solution: one envelope for every failure.
// => All three failures funnel through fail into code plus message: 400,
// => 404, and 410 share the nesting, differing only in fields. Clients
// => parse one shape for the whole service.
package main

import (
	"fmt"                      // => prints each failure's envelope
	"github.com/gin-gonic/gin" // => one envelope for every failure
	"net/http"                 // => status codes across the failure set
	"net/http/httptest"        // => in-process request and recorder
)

// => fail writes the shared error envelope: code plus message, always.
// => one helper means no handler invents its own error shape
func fail(c *gin.Context, status int, code string, message string) { // => status, machine code, human message
	// => the envelope never changes shape: only its fields vary
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}}) // => JSON even for failures
}

// => newRouter serves one lookup with three enveloped failures.
// => validation, absence, and refusal: same envelope, three codes
func newRouter(store map[string]string) *gin.Engine { // => the store arrives injected
	gin.SetMode(gin.TestMode)                       // => silence the debug banner for golden output
	router := gin.New()                             // => bare engine: no hidden middleware
	router.GET("/items/:id", func(c *gin.Context) { // => look one item up
		id := c.Param("id") // => the identity under test
		if id == "" {       // => empty ids break the contract first
			fail(c, http.StatusBadRequest, "bad_id", "id must not be empty") // => 400 blames the client
			return                                                           // => invalid input never reaches the store
		}
		v, ok := store[id] // => the lookup decides the branch
		if !ok {           // => unknown ids are 404, not empty 200
			fail(c, http.StatusNotFound, "no_item", "no item "+id) // => 404 names the absence
			return                                                 // => absence stops here
		}
		if v == "retired" { // => retired items refuse: policy, not absence
			fail(c, http.StatusGone, "retired", "item "+id+" retired") // => 410 names the policy
			return                                                     // => refusals stop here too
		}
		// => the found item echoes: envelopes stay for failures only
		c.JSON(http.StatusOK, gin.H{"id": id, "value": v}) // => the happy path
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the id is the variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                    // => the assertion surface
	router.ServeHTTP(w, req)                       // => every branch funnels through fail
	// => status plus body per leg: the envelope shape is the assertion
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	store := map[string]string{"w1": "gear", "w2": "retired"} // => one live item, one retired
	router := newRouter(store)                                // => wiring separate from traffic, as always
	// => the live item answers plain JSON: envelopes are for failures only
	check(router, "/items/w1") // => Output: GET /items/w1 -> 200 {"id":"w1","value":"gear"}
	// => unknown ids answer 404 in the shared envelope
	check(router, "/items/w9") // => Output: GET /items/w9 -> 404 {"error":{"code":"no_item","message":"no item w9"}}
	// => retired items answer 410 in the same envelope: policy, not absence
	check(router, "/items/w2") // => Output: GET /items/w2 -> 410 {"error":{"code":"retired","message":"item w2 retired"}}
}
