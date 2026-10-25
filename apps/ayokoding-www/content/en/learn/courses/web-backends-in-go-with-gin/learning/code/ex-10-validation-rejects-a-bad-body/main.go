// => Example 10: Validation Rejects a Bad Body.
// => Binding tags declare the rules next to the fields, so malformed input
// => never reaches business logic. This example requires a name, a
// => well-formed email, and a positive count, then prints which rule each of
// => three bodies breaks.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => binding tags validated on bind (co-10)
	"net/http"                 // => status codes for success and failure (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds request bodies from fixed strings
)

// => Signup is the contract with its rules attached to each field.
// => validate tags run automatically during ShouldBindJSON (co-10)
type Signup struct { // => rules live with the shape they protect
	Name  string `json:"name" binding:"required,min=2"`  // => present and at least two letters
	Email string `json:"email" binding:"required,email"` // => present and shaped like a mail address
	Seats int    `json:"seats" binding:"required,gt=0"`  // => present and strictly positive
}

// => signup binds and validates, then echoes the accepted shape back.
// => binding and validation happen in the same call: one failure path
func signup(c *gin.Context) { // => the handler only sees valid signups
	var in Signup // => the target: zero Signup until binding fills it
	// => required, email, min, and gt all run here: first failure wins
	if err := c.ShouldBindJSON(&in); err != nil { // => err names the broken rule (co-10)
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad signup"}) // => fixed envelope, no internals (co-04)
		return                                                      // => invalid input never reaches the logic below
	}
	c.JSON(http.StatusCreated, in) // => 201 with the accepted shape (co-04)
}

// => newRouter wires the single signup route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)      // => silence the debug banner for golden output
	router := gin.New()            // => bare engine: no hidden middleware
	router.POST("/signup", signup) // => one path, rules on the struct (co-10)
	return router                  // => hand the wired engine back
}

// => check serves one POST with the given body and prints status with body.
func check(router *gin.Engine, body string) { // => the body string is the variable
	req := httptest.NewRequest("POST", "/signup", strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json")                     // => JSON binder, explicitly
	w := httptest.NewRecorder()                                            // => in-memory response capture
	router.ServeHTTP(w, req)                                               // => validation runs inside the handler
	fmt.Println("POST /signup", body, "->", w.Code, w.Body.String())       // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => every rule holds: the accepted shape echoes back with 201
	check(router, `{"name":"Sari","email":"sari@example.com","seats":2}`) // => Output: POST /signup {"name":"Sari","email":"sari@example.com","seats":2} -> 201 {"name":"Sari","email":"sari@example.com","seats":2}
	// => the name is one letter: min=2 rejects it before logic runs (co-10)
	check(router, `{"name":"S","email":"sari@example.com","seats":2}`) // => Output: POST /signup {"name":"S","email":"sari@example.com","seats":2} -> 400 {"error":"bad signup"}
	// => the email has no domain and seats is zero: two rules break at once
	check(router, `{"name":"Sari","email":"not-an-email","seats":0}`) // => Output: POST /signup {"name":"Sari","email":"not-an-email","seats":0} -> 400 {"error":"bad signup"}
}
