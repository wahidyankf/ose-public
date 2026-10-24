// => Example 24: Error Envelope Stays Consistent.
// => Every failure must arrive in the same envelope, or clients parse errors
// => by status code instead of by shape. This example funnels validation,
// => missing, and internal failures through one helper and prints the shared
// => envelope each produces.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => one envelope helper for every failure (co-05)
	"net/http"                 // => status codes for the three failures (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds request bodies from fixed strings
)

// => fail writes the shared error envelope: code plus message, always.
// => one helper means no handler invents its own error shape (co-05)
func fail(c *gin.Context, status int, code string, message string) { // => status, machine code, human message
	// => the envelope never changes shape: only its fields vary
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}}) // => JSON even for failures (co-04)
}

// => divide divides a by b from the path, failing three different ways.
// => each branch funnels through fail: the shape stays identical (co-05)
func divide(c *gin.Context) { // => one handler, three failure modes
	var in struct { // => the operands arrive as path-shaped JSON
		A float64 `json:"a"`
		B float64 `json:"b"`
	}
	// => failure one: the body does not parse at all (co-03)
	if err := c.ShouldBindJSON(&in); err != nil { // => malformed JSON fails here
		fail(c, http.StatusBadRequest, "bad_input", "send numbers a and b") // => 400 blames the body
		return                                                              // => unparseable input never reaches the math
	}
	// => failure two: division by zero is a client mistake, not a crash
	if in.B == 0 { // => the denominator decides this branch
		fail(c, http.StatusUnprocessableEntity, "zero_divisor", "b must not be zero") // => 422: valid shape, bad value
		return                                                                        // => the math below would panic: stop first
	}
	// => failure three: a negative dividend trips a made-up business rule
	if in.A < 0 { // => the rule: this service divides positives only
		fail(c, http.StatusForbidden, "negative_dividend", "a must not be negative") // => 403: refused by policy
		return                                                                       // => policy failures answer before computing
	}
	c.JSON(http.StatusOK, gin.H{"result": in.A / in.B}) // => the happy path: one number (co-04)
}

// => newRouter wires the single division route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)      // => silence the debug banner for golden output
	router := gin.New()            // => bare engine: no hidden middleware
	router.POST("/divide", divide) // => one path, four envelopes out (co-05)
	return router                  // => hand the wired engine back
}

// => check serves one POST with the given body and prints status with body.
func check(router *gin.Engine, body string) { // => the body string is the variable
	req := httptest.NewRequest("POST", "/divide", strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json")                     // => JSON binder, explicitly
	w := httptest.NewRecorder()                                            // => in-memory response capture
	router.ServeHTTP(w, req)                                               // => each branch funnels through fail
	fmt.Println("POST /divide", body, "->", w.Code, w.Body.String())       // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => valid operands divide: the happy path skips the envelope
	check(router, `{"a":7,"b":2}`) // => Output: POST /divide {"a":7,"b":2} -> 200 {"result":3.5}
	// => broken JSON fails binding: same envelope, 400 (co-05)
	check(router, `{"a":7,`) // => Output: POST /divide {"a":7, -> 400 {"error":{"code":"bad_input","message":"send numbers a and b"}}
	// => zero divisor is shape-valid but meaningless: 422, same envelope
	check(router, `{"a":7,"b":0}`) // => Output: POST /divide {"a":7,"b":0} -> 422 {"error":{"code":"zero_divisor","message":"b must not be zero"}}
	// => negative dividends break policy: 403, same envelope again
	check(router, `{"a":-7,"b":2}`) // => Output: POST /divide {"a":-7,"b":2} -> 403 {"error":{"code":"negative_dividend","message":"a must not be negative"}}
}
