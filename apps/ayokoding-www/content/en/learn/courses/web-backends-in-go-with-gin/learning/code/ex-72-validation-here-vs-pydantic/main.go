// => Example 72: Validation Here vs Pydantic.
// => Pydantic validates through model classes with field types; Gin
// => validates through struct tags on plain structs with the same rules.
// => This example binds the same member payload strictly and loosely and
// => prints which status each body earns under each strictness.
package main

import (
	"fmt"                      // => prints each binding verdict
	"github.com/gin-gonic/gin" // => tag validation versus plain binding (co-10, co-16)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds request bodies from fixed strings
)

// => Member is the payload with Pydantic-style rules as struct tags.
// => required, email, and range: the same rules, tag syntax (co-10)
type Member struct { // => the strict shape: rules enforced on bind
	Name  string `json:"name" binding:"required,min=2"`  // => present and spelled out
	Email string `json:"email" binding:"required,email"` // => present and shaped like mail
	Age   int    `json:"age" binding:"gte=0,lte=130"`    // => a human age, bounded both sides
}

// => bindStrict enforces every tag: the Pydantic-equivalent path.
// => ShouldBindJSON runs required, email, min, gte, and lte here
func bindStrict(c *gin.Context) { // => the strict handler: rules on
	var m Member                                 // => the target: zero Member until binding fills it
	if err := c.ShouldBindJSON(&m); err != nil { // => first broken rule fails here
		c.JSON(400, gin.H{"error": "bad member"}) // => 400, fixed envelope (co-05)
		return                                    // => invalid members never enter the logic
	}
	c.JSON(201, m) // => 201 with the validated member (co-04)
}

// => bindLoose skips validation: plain shape, no rules.
// => the same struct minus tags would bind anything parseable
func bindLoose(c *gin.Context) { // => the loose handler: rules off
	var raw map[string]any                         // => untyped: every JSON value fits somewhere
	if err := c.ShouldBindJSON(&raw); err != nil { // => only syntax errors fail here
		c.JSON(400, gin.H{"error": "bad json"}) // => malformed bodies still 400
		return                                  // => unparseable input stops here too
	}
	c.JSON(201, raw) // => 201 echoing whatever parsed (co-04)
}

// => newRouter wires the strict and loose paths side by side.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)          // => silence the debug banner for golden output
	router := gin.New()                // => bare engine: no hidden middleware
	router.POST("/strict", bindStrict) // => tags enforced (co-10)
	router.POST("/loose", bindLoose)   // => syntax only, no rules
	return router                      // => hand the wired engine back
}

// => check serves one POST and prints path, status, and body.
func check(router *gin.Engine, target string, body string) { // => target picks strictness, body the payload
	req := httptest.NewRequest("POST", target, strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json")                  // => JSON bodies bind below
	w := httptest.NewRecorder()                                         // => the assertion surface
	router.ServeHTTP(w, req)                                            // => strict or loose binding runs inside (co-09)
	fmt.Println("POST", target, body, "->", w.Code, w.Body.String())    // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => valid member, strict path: 201 with the validated shape
	check(router, "/strict", `{"name":"Sari","email":"sari@example.com","age":30}`) // => Output: POST /strict {"name":"Sari","email":"sari@example.com","age":30} -> 201 {"name":"Sari","email":"sari@example.com","age":30}
	// => bad email, strict path: the tag rejects what syntax accepts (co-10)
	check(router, "/strict", `{"name":"Sari","email":"nope","age":30}`) // => Output: POST /strict {"name":"Sari","email":"nope","age":30} -> 400 {"error":"bad member"}
	// => same bad email, loose path: parseable means acceptable here
	check(router, "/loose", `{"name":"Sari","email":"nope","age":30}`) // => Output: POST /loose {"name":"Sari","email":"nope","age":30} -> 201 {"age":30,"email":"nope","name":"Sari"}
	// => broken JSON fails both paths: syntax gates everything (co-16)
	check(router, "/loose", `{"name":`) // => Output: POST /loose {"name": -> 400 {"error":"bad json"}
}
