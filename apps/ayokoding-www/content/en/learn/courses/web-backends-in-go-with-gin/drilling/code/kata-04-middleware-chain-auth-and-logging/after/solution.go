// => Kata 4 solution: guard aborts, counter wraps, handler serves.
// => The token check moved into aborting middleware and the counting into
// => a wrapping middleware: the handler serves only admitted requests,
// => and the counts prove both strangers never arrived and holders did.
package main

import (
	"fmt"                      // => prints each answer with its count
	"github.com/gin-gonic/gin" // => the chained middlewares
	"net/http/httptest"        // => in-process request and recorder
)

// => counted admits nobody itself: it wraps the chain and counts completions.
type counted struct { // => the shared counting state
	hits int // => admitted requests observed so far
}

// => count wraps the chain: strangers aborted below never reach the increment.
func (k *counted) count(c *gin.Context) { // => the outer layer
	c.Next()                      // => the guard and handler run inside
	if c.Writer.Status() == 200 { // => only completed answers count
		// => 401s skip the increment: only completions count
		// => increments happen past the guard: counted means admitted
		k.hits++ // => strangers aborted with 401 never arrive here
	}
}

// => guard aborts strangers before the handler: admitted requests continue.
func guard(c *gin.Context) { // => the inner layer, closest to the handler
	if c.GetHeader("Authorization") != "Bearer s3cret" { // => one fixed token
		c.AbortWithStatusJSON(401, gin.H{"error": "no entry"}) // => strangers stop here
		return                                                 // => the handler and the count never run for strangers
	}
	// => admitted requests flow inward: the handler runs next
	c.Next() // => holders continue to the handler
}

// => vault serves admitted requests: the guard already did the checking.
func vault(c *gin.Context) { // => small again: guards live outside
	// => served marks admission: strangers never reach this line
	c.String(200, "served") // => the answer only holders see
}

// => newRouter chains counting outside the guard outside the handler.
func newRouter(k *counted) *gin.Engine { // => the counter arrives injected
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: middleware added by hand
	// => registration order is execution order: count outside, guard inside
	router.GET("/vault", k.count, guard, vault) // => wrap, guard, serve: in that order
	return router                               // => hand the wired engine back
}

// => check serves one GET with a token and prints the answer with the count.
func check(k *counted, router *gin.Engine, token string) { // => the ledger travels with the check
	req := httptest.NewRequest("GET", "/vault", nil) // => fixed path, varying token
	if token != "" {                                 // => named holders send their bearer
		req.Header.Set("Authorization", "Bearer "+token) // => the credential under test
	}
	w := httptest.NewRecorder()                                                   // => the assertion surface
	router.ServeHTTP(w, req)                                                      // => count, guard, and handler run in order
	fmt.Println("token=", token, "->", w.Code, w.Body.String(), "count=", k.hits) // => one golden line
}

func main() {
	k := &counted{}        // => empty ledger at startup
	router := newRouter(k) // => wrap, guard, serve: wiring separate from traffic
	// => the stranger aborts at the guard: uncounted, 401
	check(k, router, "") // => Output: token=  -> 401 {"error":"no entry"} count= 0
	// => the holder passes both layers: served, counted once
	check(k, router, "s3cret") // => Output: token= s3cret -> 200 served count= 1
}
