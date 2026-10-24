// => Example 9: Bind JSON into a Typed Struct.
// => Binding parses the body into a typed struct in one call, so handlers
// => work with fields instead of bytes. This example binds a JSON order into
// => an Order value, serves the stored shape back, and shows the error a
// => malformed body produces.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => ShouldBindJSON and typed models (co-03, co-15)
	"net/http"                 // => status codes for success and failure (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds request bodies from fixed strings
)

// => Order is the typed boundary of this example: JSON in, Order out.
// => json tags fix the wire names; the struct fixes the Go shape (co-15)
type Order struct { // => one struct is the contract both sides share
	ID    string `json:"id"`    // => the order key, echoed back untouched
	Item  string `json:"item"`  // => what was ordered, a plain string
	Count int    `json:"count"` // => how many: an int, never a string
}

// => createOrder binds the body and echoes the typed value back.
// => ShouldBindJSON picks the JSON binder from the Content-Type (co-03)
func createOrder(c *gin.Context) { // => the handler works with Order, not bytes
	var in Order // => the target: zero Order until binding fills it
	// => binding fails on malformed JSON or wrong types: 400, not 500 (co-05)
	if err := c.ShouldBindJSON(&in); err != nil { // => err names the first broken field
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad order"}) // => fixed envelope, no internals (co-04)
		return                                                     // => stop here: in holds nothing trustworthy
	}
	// => past binding, the struct is real data: serve it back typed
	c.JSON(http.StatusCreated, in) // => 201 with the stored shape (co-04)
}

// => newRouter wires the single creation route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)           // => silence the debug banner for golden output
	router := gin.New()                 // => bare engine: no hidden middleware
	router.POST("/orders", createOrder) // => one path, typed in and out (co-03, co-15)
	return router                       // => hand the wired engine back
}

// => check serves one POST with the given body and prints status with body.
// => the Content-Type header picks the binder, so it is always set here
func check(router *gin.Engine, body string) { // => the body string is the variable
	// => strings.NewReader turns the fixed body into a request stream
	req := httptest.NewRequest("POST", "/orders", strings.NewReader(body)) // => no socket, fixed bytes
	req.Header.Set("Content-Type", "application/json")                     // => JSON binder, explicitly
	w := httptest.NewRecorder()                                            // => in-memory response capture
	router.ServeHTTP(w, req)                                               // => binding runs inside the handler
	fmt.Println("POST /orders", body, "->", w.Code, w.Body.String())       // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => a well-formed body binds field by field and echoes back typed
	check(router, `{"id":"o1","item":"book","count":2}`) // => Output: POST /orders {"id":"o1","item":"book","count":2} -> 201 {"id":"o1","item":"book","count":2}
	// => count as a string breaks the int field: binding refuses, 400 (co-05)
	check(router, `{"id":"o2","item":"pen","count":"two"}`) // => Output: POST /orders {"id":"o2","item":"pen","count":"two"} -> 400 {"error":"bad order"}
	// => truncated JSON never parses: same 400, same envelope
	check(router, `{"id":"o3"`) // => Output: POST /orders {"id":"o3" -> 400 {"error":"bad order"}
}
