// => Example 45: First In-Process Test.
// => The whole testing cluster rests on one move: serve a request through
// => the router without a socket and assert on the recorder. This example
// => checks a hello route's status and body in-process and prints both
// => verdicts: PASS or FAIL, never maybe.
package main

import (
	"fmt"                      // => prints each assertion verdict
	"github.com/gin-gonic/gin" // => the router under test (co-09)
	"net/http/httptest"        // => the in-process test double (co-09)
	"strings"                  // => checks the body contains the greeting
)

// => newRouter wires the one hello route every assertion below serves.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                         // => silence the debug banner for golden output
	router := gin.New()                               // => bare engine: no hidden middleware
	router.GET("/hello/:name", func(c *gin.Context) { // => the route under test
		c.JSON(200, gin.H{"message": "hello, " + c.Param("name")}) // => the contract under test (co-04)
	})
	return router // => hand the wired engine back
}

// => verdict serves one request and prints PASS or FAIL with the reason.
// => assertions compare the recorder against the expected contract
func verdict(router *gin.Engine, target string, wantCode int, wantBody string) { // => path plus expectations
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                    // => the assertion surface
	router.ServeHTTP(w, req)                       // => the full pipeline, minus the network (co-09)
	// => status first: the cheapest assertion fails fastest
	if w.Code != wantCode { // => wrong code means stop: the body cannot redeem it
		fmt.Println("FAIL", target, "status", w.Code, "want", wantCode) // => the code verdict, with both sides
		return                                                          // => one failure per check keeps verdicts readable
	}
	// => then the body: exact match, no substrings, no excuses
	if strings.TrimSpace(w.Body.String()) != wantBody { // => whitespace-trimmed, then exact
		fmt.Println("FAIL", target, "body", w.Body.String(), "want", wantBody) // => the body verdict, both sides shown
		return                                                                 // => mismatch recorded: the contract changed
	}
	fmt.Println("PASS", target) // => both assertions held: the contract stands
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => the contract holds: 200 with the exact greeting body
	verdict(router, "/hello/Sari", 200, `{"message":"hello, Sari"}`) // => Output: PASS /hello/Sari
	// => the wrong expectation fails loudly: Sari is not Budi
	verdict(router, "/hello/Sari", 200, `{"message":"hello, Budi"}`) // => Output: FAIL /hello/Sari body {"message":"hello, Sari"} want {"message":"hello, Budi"}
	// => unknown paths fail the code assertion first: 404, not 200
	verdict(router, "/goodbye", 200, `404 page not found`) // => Output: FAIL /goodbye status 404 want 200
}
