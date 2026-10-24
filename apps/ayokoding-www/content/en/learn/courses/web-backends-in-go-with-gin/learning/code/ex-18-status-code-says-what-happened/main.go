// => Example 18: Status Code Says What Happened.
// => The status code is the one-line summary every client reads first, so
// => each outcome needs its own. This example serves the five most common
// => outcomes on one resource and prints the code each request earns.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => one resource, five outcomes (co-04)
	"net/http"                 // => the status code vocabulary (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds the creation body from a fixed string
)

// => newRouter wires one widget resource with a code per outcome.
// => the map is the store; the codes are the lesson (co-04)
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)                // => silence the debug banner for golden output
	router := gin.New()                      // => bare engine: no hidden middleware
	store := map[string]string{"w1": "gear"} // => one widget exists from the start
	// => reading what exists is 200 with the value in the body
	router.GET("/widgets/:id", func(c *gin.Context) { // => read one widget
		v, ok := store[c.Param("id")] // => the lookup decides the code
		if !ok {                      // => missing ids are not empty 200s
			c.JSON(http.StatusNotFound, gin.H{"error": "no widget"}) // => 404 names the absence (co-05)
			return                                                   // => nothing to serve: stop at the code
		}
		c.JSON(http.StatusOK, gin.H{"id": c.Param("id"), "value": v}) // => 200 with the found shape
	})
	// => creating with a blank value is a 400: the client sent nonsense
	router.POST("/widgets", func(c *gin.Context) { // => create one widget
		var in struct { // => the creation shape lives inline: id plus value
			ID    string `json:"id" binding:"required"`    // => identity is mandatory
			Value string `json:"value" binding:"required"` // => so is the payload
		}
		// => binding failures are client mistakes: 400 with the envelope
		if err := c.ShouldBindJSON(&in); err != nil { // => missing fields fail here (co-10)
			c.JSON(http.StatusBadRequest, gin.H{"error": "bad widget"}) // => 400, fixed shape (co-05)
			return                                                      // => invalid input never touches the store
		}
		store[in.ID] = in.Value                                           // => the store gains the widget
		c.JSON(http.StatusCreated, gin.H{"id": in.ID, "value": in.Value}) // => 201: something new exists
	})
	// => deleting what exists is 204: success with nothing to say
	router.DELETE("/widgets/:id", func(c *gin.Context) { // => remove one widget
		// => deleting twice still succeeds: the end state is identical
		delete(store, c.Param("id"))   // => absent keys delete silently
		c.Status(http.StatusNoContent) // => 204: gone, no body follows
	})
	return router // => hand the wired engine back
}

// => check serves one request in-process and prints method, status, and body.
// => bodies print only when present: 204 leaves no trailing space
func check(router *gin.Engine, method string, target string, body string) { // => method, path, and payload vary
	r := httptest.NewRequest(method, target, strings.NewReader(body)) // => fixed bytes, no socket
	r.Header.Set("Content-Type", "application/json")                  // => JSON bodies bind below
	w := httptest.NewRecorder()                                       // => in-memory response capture
	router.ServeHTTP(w, r)                                            // => the outcome code is the lesson
	line := fmt.Sprintf("%s %s -> %d", method, target, w.Code)        // => status core: always present
	if w.Body.String() != "" {                                        // => 204 prints the code alone
		line += " " + w.Body.String() // => bodies join with one space
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => the stored widget reads back 200 with its shape intact
	check(router, "GET", "/widgets/w1", "") // => Output: GET /widgets/w1 -> 200 {"id":"w1","value":"gear"}
	// => no widget w9 exists: 404 names the absence instead of an empty 200 (co-05)
	check(router, "GET", "/widgets/w9", "") // => Output: GET /widgets/w9 -> 404 {"error":"no widget"}
	// => a complete body creates: 201 promises the widget now exists
	check(router, "POST", "/widgets", `{"id":"w2","value":"spring"}`) // => Output: POST /widgets -> 201 {"id":"w2","value":"spring"}
	// => a blank value breaks required: 400 blames the body, not the store
	check(router, "POST", "/widgets", `{"id":"w3","value":""}`) // => Output: POST /widgets -> 400 {"error":"bad widget"}
	// => deleting answers 204 with no body at all: gone is the message
	check(router, "DELETE", "/widgets/w1", "") // => Output: DELETE /widgets/w1 -> 204
}
