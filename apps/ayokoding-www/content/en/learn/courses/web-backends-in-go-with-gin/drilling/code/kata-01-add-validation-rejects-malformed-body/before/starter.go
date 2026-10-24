// => Kata 1 starter: creation without validation.
// => The handler binds the body but checks nothing: missing ids and zero
// => quantities sail through. Your task: add binding tags so malformed
// => bodies fail with 400, then prove both rejections in-process.
package main

import (
	"fmt"                      // => prints each creation verdict
	"github.com/gin-gonic/gin" // => the router under test
	"net/http/httptest"        // => in-process request and recorder
	"strings"                  // => builds request bodies from fixed strings
)

// => Order is the creation shape with NO rules yet: add them.
// => TODO: require id, item, and a positive qty with binding tags
type Order struct { // => the shape your tags will protect
	ID   string `json:"id"`   // => TODO: binding:"required"
	Item string `json:"item"` // => TODO: binding:"required"
	Qty  int    `json:"qty"`  // => TODO: binding:"required,gt=0"
}

// => create binds and stores without checking: the gap to close.
func create(store map[string]Order) gin.HandlerFunc { // => the handler you will harden
	return func(c *gin.Context) { // => gin calls this per creation
		var in Order // => the bound shape, unchecked today
		// => TODO: fail with 400 and {"error":"bad order"} when binding fails
		if err := c.ShouldBindJSON(&in); err != nil { // => malformed JSON fails here already
			c.JSON(400, gin.H{"error": "bad json"}) // => today's envelope: keep or reshape
			return                                  // => unparseable input never reaches the store
		}
		store[in.ID] = in // => stored unchecked: zero quantities live here
		c.JSON(201, in)   // => 201 even for nonsense: your tags will change this
	}
}

// => newRouter wires the creation route around the injected store.
func newRouter(store map[string]Order) *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)             // => silence the debug banner for golden output
	router := gin.New()                   // => bare engine: no hidden middleware
	router.POST("/orders", create(store)) // => the route you will prove
	return router                         // => hand the wired engine back
}

// => check serves one POST and prints the status with the body.
func check(router *gin.Engine, body string) { // => the body string is the variable
	req := httptest.NewRequest("POST", "/orders", strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json")                     // => JSON bodies bind below
	w := httptest.NewRecorder()                                            // => the assertion surface
	router.ServeHTTP(w, req)                                               // => today's unchecked binding runs inside
	fmt.Println("POST /orders", body, "->", w.Code, w.Body.String())       // => one golden line
}

func main() {
	router := newRouter(map[string]Order{}) // => empty store at startup
	// => today both pass: after your tags, only the first may
	check(router, `{"id":"o1","item":"book","qty":2}`) // => good bodies stay 201
	check(router, `{"id":"o2","item":"pen","qty":0}`)  // => TODO: this must become 400
}
