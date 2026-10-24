// => Example 29: Recovery Turns Panics into 500.
// => Panics must never escape as dropped connections; recovery middleware
// => converts them into 500 answers. This example panics on one route,
// => recovers with a JSON envelope, and prints the 500 beside a healthy
// => route that never panics.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => recovery middleware (co-02, co-05)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => newRouter recovers panics into a JSON envelope for every route.
// => CustomRecoveryWithWriter discards the stack log: goldens stay clean
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: recovery added by hand
	// => the recovery handler answers 500 in the shared error shape
	router.Use(gin.CustomRecoveryWithWriter(discard{}, func(c *gin.Context, _ any) { // => stack trace goes nowhere
		c.AbortWithStatusJSON(500, gin.H{"error": "internal failure"}) // => same envelope, every panic
	}))
	// => this handler panics on purpose: the lesson needs a real panic
	router.GET("/boom", func(c *gin.Context) { panic("planned detonation") })     // => recovered into 500, never a drop (co-05)
	router.GET("/fine", func(c *gin.Context) { c.String(200, "still standing") }) // => healthy routes ignore recovery
	return router                                                                 // => hand the wired engine back
}

// => discard swallows the stack trace recovery would otherwise log.
// => golden output must hold only our prints: logs would poison it
type discard struct{} // => an io.Writer that keeps nothing

// => Write drops every byte and reports success: the trace vanishes.
func (discard) Write(p []byte) (int, error) { // => keep the Writer contract, drop the content
	return len(p), nil // => pretend everything was written
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the panicking path is the variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => recovery runs around the panic
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => the panic becomes a 500 envelope: the connection survives (co-05)
	check(router, "/boom") // => Output: GET /boom -> 500 {"error":"internal failure"}
	// => healthy routes never notice the middleware: 200 as usual
	check(router, "/fine") // => Output: GET /fine -> 200 still standing
}
