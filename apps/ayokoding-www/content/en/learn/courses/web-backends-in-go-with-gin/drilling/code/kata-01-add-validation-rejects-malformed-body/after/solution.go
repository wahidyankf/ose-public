// => Kata 1 solution: creation with validation enforced.
// => Binding tags reject malformed bodies before the store sees them: a
// => missing id or a non-positive qty fails with 400 and the bad_order
// => envelope, while good bodies echo back 201.
package main

import (
	"fmt"                      // => prints each creation verdict
	"github.com/gin-gonic/gin" // => tag validation on bind
	"net/http/httptest"        // => in-process request and recorder
	"strings"                  // => builds request bodies from fixed strings
)

// => Order is the creation shape with its rules attached to each field.
// => required, gt=0: the tags that close the starter's gap
type Order struct { // => rules live with the shape they protect
	ID   string `json:"id" binding:"required"`       // => identity is mandatory
	Item string `json:"item" binding:"required"`     // => contents are mandatory too
	Qty  int    `json:"qty" binding:"required,gt=0"` // => zero quantities fail here now
}

// => create binds, validates, and stores: invalid input never lands.
func create(store map[string]Order) gin.HandlerFunc { // => the hardened handler
	return func(c *gin.Context) { // => gin calls this per creation
		var in Order // => the target: zero Order until binding fills it
		// => tags run here: missing id or non-positive qty fails
		if err := c.ShouldBindJSON(&in); err != nil { // => first broken rule fails
			c.JSON(400, gin.H{"error": "bad order"}) // => fixed envelope, no internals
			return                                   // => invalid input never reaches the store
		}
		// => the store trusts binding now: tags guard the gate
		store[in.ID] = in // => only validated orders land here
		// => creation echoes the validated shape, never the raw body
		c.JSON(201, in) // => 201 with the validated shape
	}
}

// => newRouter wires the creation route around the injected store.
func newRouter(store map[string]Order) *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)             // => silence the debug banner for golden output
	router := gin.New()                   // => bare engine: no hidden middleware
	router.POST("/orders", create(store)) // => the proven route
	return router                         // => hand the wired engine back
}

// => check serves one POST and prints the status with the body.
func check(router *gin.Engine, body string) { // => the body string is the variable
	req := httptest.NewRequest("POST", "/orders", strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json")                     // => JSON bodies bind below
	w := httptest.NewRecorder()                                            // => the assertion surface
	router.ServeHTTP(w, req)                                               // => validated binding runs inside
	fmt.Println("POST /orders", body, "->", w.Code, w.Body.String())       // => one golden line
}

func main() {
	router := newRouter(map[string]Order{}) // => empty store at startup
	// => the good body passes validation: 201 with the stored shape
	check(router, `{"id":"o1","item":"book","qty":2}`) // => Output: POST /orders {"id":"o1","item":"book","qty":2} -> 201 {"id":"o1","item":"book","qty":2}
	// => zero qty breaks gt=0: 400 with the fixed envelope
	// => zero qty proves the tag: gt=0 rejects what required allowed
	check(router, `{"id":"o2","item":"pen","qty":0}`) // => Output: POST /orders {"id":"o2","item":"pen","qty":0} -> 400 {"error":"bad order"}
}
