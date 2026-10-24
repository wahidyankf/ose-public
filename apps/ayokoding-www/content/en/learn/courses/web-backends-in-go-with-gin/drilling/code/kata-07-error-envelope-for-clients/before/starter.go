// => Kata 7 starter: plain-text failures beside JSON success.
// => Success speaks JSON but failures speak text: clients branch on content
// => type to read errors. Your task: funnel all three failures through one
// => fail helper writing code plus message, and prove each envelope prints
// => identically shaped.
package main

import (
	"fmt"                      // => prints each answer
	"github.com/gin-gonic/gin" // => the routes you will envelope
	"net/http"                 // => status codes for the happy path
	"net/http/httptest"        // => in-process request and recorder
)

// => newRouter serves one lookup with three unwrapped failures.
// => TODO: one fail helper; 400, 404, and 410 through the same shape
func newRouter(store map[string]string) *gin.Engine { // => the store arrives injected
	gin.SetMode(gin.TestMode)                       // => silence the debug banner for golden output
	router := gin.New()                             // => bare engine: no hidden middleware
	router.GET("/items/:id", func(c *gin.Context) { // => look one item up
		id := c.Param("id") // => the identity under test
		if id == "" {       // => TODO: fail 400 bad_id through the envelope
			// => text today, envelope after: the shape is the task
			c.String(400, "bad id") // => plain text today: your envelope goes here
			return                  // => invalid input never reaches the store
		}
		v, ok := store[id] // => the lookup decides the branch
		if !ok {           // => TODO: fail 404 no_item through the envelope
			// => absence prints text now: your fail call replaces this
			c.String(404, "no item") // => plain text today: same envelope next
			return                   // => absence stops here
		}
		if v == "retired" { // => TODO: fail 410 retired through the envelope
			// => refusal prints text now: 410 joins the envelope after
			c.String(410, "retired") // => plain text today: policy in the envelope next
			return                   // => refusals stop here too
		}
		c.JSON(http.StatusOK, gin.H{"id": id, "value": v}) // => TODO: needs net/http import for StatusOK
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the id is the variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                    // => the assertion surface
	router.ServeHTTP(w, req)                       // => today's plain failures run inside
	// => status plus body per leg: the envelope shape is the assertion
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	store := map[string]string{"w1": "gear", "w2": "retired"} // => one live item, one retired
	router := newRouter(store)                                // => wiring separate from traffic, as always
	// => text today: your envelopes must print these shapes instead
	check(router, "/items/w1") // => the happy path stays JSON throughout
	check(router, "/items/w9") // => TODO: 404 {"error":{"code":"no_item",...}}
	check(router, "/items/w2") // => TODO: 410 {"error":{"code":"retired",...}}
}
