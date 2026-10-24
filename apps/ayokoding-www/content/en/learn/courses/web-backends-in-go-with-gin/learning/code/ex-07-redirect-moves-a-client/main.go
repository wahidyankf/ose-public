// => Example 7: Redirect Moves a Client.
// => A redirect is a response, not routing magic: a 3xx status plus a
// => Location header the client follows. This example moves one GET
// => permanently and one POST with its method preserved, then prints the
// => status with the Location each answer carries.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => Redirect helper on the context (co-04)
	"net/http"                 // => redirect status codes (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => newRouter wires an old address, its replacement, and a form endpoint.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => the old docs page moved forever: clients should update bookmarks
	router.GET("/old-docs", func(c *gin.Context) { // => moved permanently (co-04)
		// => 301 tells caches and clients the move is permanent
		c.Redirect(http.StatusMovedPermanently, "/docs") // => Location: /docs
	})
	// => the replacement page answers normally: the redirect target exists
	router.GET("/docs", func(c *gin.Context) { c.String(200, "docs home") }) // => redirect landing page
	// => forms resubmit with 307 so the retry keeps the POST method
	router.POST("/submit", func(c *gin.Context) { // => temporary redirect, method kept (co-04)
		// => 307 repeats the POST at the new address; 302 might become GET
		c.Redirect(http.StatusTemporaryRedirect, "/received") // => Location: /received
	})
	router.POST("/received", func(c *gin.Context) { c.String(200, "received") }) // => the POST landing page
	return router                                                                // => hand the wired engine back
}

// => check serves one request in-process and prints status plus Location.
// => the Location header IS the answer for a redirect, not the body
func check(router *gin.Engine, method string, target string) { // => GET moves, POST moves too
	req := httptest.NewRequest(method, target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                     // => in-memory response capture
	router.ServeHTTP(w, req)                        // => full pipeline, minus the socket
	// => Header().Get reads the Location the redirect wrote (co-04)
	line := fmt.Sprintf("%s %s -> %d", method, target, w.Code) // => status core: always present
	if loc := w.Header().Get("Location"); loc != "" {          // => plain pages carry no Location to print
		line += " " + loc // => redirects join their target with one space
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => permanent move: caches may remember this one
	check(router, "GET", "/old-docs") // => Output: GET /old-docs -> 301 /docs
	// => temporary move keeping the method: the form resubmits as POST
	check(router, "POST", "/submit") // => Output: POST /submit -> 307 /received
	// => the landing pages answer directly: redirects resolve somewhere real
	check(router, "GET", "/docs") // => Output: GET /docs -> 200
}
