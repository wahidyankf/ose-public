// => Example 51: Auth Middleware Tested Alone.
// => Middleware deserves tests without handlers, so the test serves a spy
// => handler that records whether it ran. This example checks the auth guard
// => with three tokens and prints whether each request reached the spy or
// => stopped at the guard.
package main

import (
	"fmt"                      // => prints the spy report per case
	"github.com/gin-gonic/gin" // => the guard under test (co-02)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => spy records whether the chain reached the handler.
// => a boolean plus a name: reached means the guard admitted (co-09)
type spy struct { // => the test double at the end of the chain
	reached bool   // => true once any request passes the guard
	name    string // => the identity the guard admitted last
}

// => handler is the end of the test chain: it records the call.
// => real handlers do work; this one only proves it ran
func (s *spy) handler(c *gin.Context) { // => registered after the guard
	s.reached = true         // => the guard admitted: the chain is complete
	who, _ := c.Get("user")  // => the identity the guard set
	s.name, _ = who.(string) // => stored for the report line
	c.String(200, "served")  // => the answer only admitted requests see
}

// => guard is the bearer check under test: identical in shape to production.
// => copied small on purpose: the lesson is the spy, not the guard
func guard(c *gin.Context) { // => the middleware under test (co-02)
	if c.GetHeader("Authorization") != "Bearer s3cret" { // => one fixed token
		c.AbortWithStatusJSON(401, gin.H{"error": "no entry"}) // => strangers stop here (co-05)
		return                                                 // => the spy never runs for strangers
	}
	c.Set("user", "sari") // => admitted requests carry identity onward
	c.Next()              // => the spy runs next
}

// => newRouter chains the guard before the spy for every check.
func newRouter(s *spy) *gin.Engine { // => the spy arrives injected
	gin.SetMode(gin.TestMode)              // => silence the debug banner for golden output
	router := gin.New()                    // => bare engine: middleware added by hand
	router.GET("/vault", guard, s.handler) // => guard first, spy last (co-02)
	return router                          // => hand the wired engine back
}

// => check serves one request with a token and prints the spy report.
// => the report names the outcome: blocked, or served as whom
func check(s *spy, router *gin.Engine, token string) { // => empty token exercises the block
	s.reached = false                                // => reset per case: each report stands alone
	s.name = ""                                      // => the previous identity must not leak across
	req := httptest.NewRequest("GET", "/vault", nil) // => fixed path, varying token
	if token != "" {                                 // => named holders send their bearer
		req.Header.Set("Authorization", "Bearer "+token) // => the credential under test
	}
	w := httptest.NewRecorder() // => the assertion surface
	router.ServeHTTP(w, req)    // => guard runs, spy maybe runs (co-09)
	// => reached decides the report: served-as, or blocked-at-guard
	if s.reached { // => the chain completed: the guard admitted
		fmt.Println("token=", token, "->", w.Code, "served as", s.name) // => the admission report
		return                                                          // => served: the spy saw the request
	}
	fmt.Println("token=", token, "->", w.Code, "blocked at guard", w.Body.String()) // => the block report with the envelope
}

func main() {
	s := &spy{}            // => one spy for every case, reset per check
	router := newRouter(s) // => wiring separate from traffic, as always
	// => no token: blocked at the guard, the spy never runs
	check(s, router, "") // => Output: token=  -> 401 blocked at guard {"error":"no entry"}
	// => wrong token: same block, same envelope, spy still silent
	check(s, router, "guess") // => Output: token= guess -> 401 blocked at guard {"error":"no entry"}
	// => the fixed token admits: the spy runs and reports sari (co-02)
	check(s, router, "s3cret") // => Output: token= s3cret -> 200 served as sari
}
