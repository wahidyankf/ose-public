// => Kata 4 starter: auth and counting buried in the handler.
// => The handler checks the token itself and counts nothing: cross-cutting
// => work hides in route logic. Your task: move the token check into an
// => aborting middleware and the counting into a wrapping middleware, then
// => prove a stranger is blocked and a holder is counted.
package main

import (
	"fmt"                      // => prints each answer
	"github.com/gin-gonic/gin" // => the router you will wrap
	"net/http/httptest"        // => in-process request and recorder
)

// => vault answers only holders, counting inline: the shape to unwrap.
// => TODO: guard middleware aborts strangers; counter middleware counts
func vault(c *gin.Context) { // => today's handler does everything itself
	// => TODO: move this check into requireUser middleware with Abort
	if c.GetHeader("Authorization") != "Bearer s3cret" { // => inline auth: every handler repeats this
		c.JSON(401, gin.H{"error": "no entry"}) // => inline 401: the guard you will extract
		return                                  // => strangers stop here, but inside the handler
	}
	// => TODO: count admitted requests in a wrapping middleware instead
	// => served marks admission: strangers never reach this line
	c.String(200, "served") // => the answer only holders see
}

// => newRouter wires the single route you will wrap twice.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)   // => silence the debug banner for golden output
	router := gin.New()         // => bare engine: middleware added by you
	router.GET("/vault", vault) // => TODO: guard, then count, then vault
	return router               // => hand the wired engine back
}

// => check serves one GET with a token and prints the answer.
func check(router *gin.Engine, token string) { // => empty token exercises the block
	req := httptest.NewRequest("GET", "/vault", nil) // => fixed path, varying token
	if token != "" {                                 // => named holders send their bearer
		req.Header.Set("Authorization", "Bearer "+token) // => the credential under test
	}
	w := httptest.NewRecorder()                                 // => the assertion surface
	router.ServeHTTP(w, req)                                    // => today's inline check runs inside
	fmt.Println("token=", token, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => inline today: your middlewares must print these exact lines
	check(router, "")       // => strangers blocked, handler counts nothing
	check(router, "s3cret") // => holders admitted, still uncounted
}
