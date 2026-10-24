// => Example 6: Custom 404 for Unknown Routes.
// => The default 404 is plain text, which breaks clients that parse every
// => body as JSON. This example installs a JSON 404 for unknown paths and a
// => JSON 405 for wrong methods, so every absence speaks the same envelope.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => NoRoute and NoMethod hooks (co-05)
	"net/http"                 // => status codes for the envelopes (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => absent writes the shared error envelope with the given code and message.
// => one helper means 404 and 405 can never drift apart (co-04, co-05)
func absent(c *gin.Context, status int, code string, message string) { // => status, machine code, human message
	// => the envelope never changes shape: only its fields vary
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}}) // => JSON even for absences (co-04)
}

// => newRouter serves one real route and JSON envelopes for everything else.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => 405 instead of 404 when the path exists under another verb
	router.HandleMethodNotAllowed = true                                // => wrong verb is a different absence (co-05)
	router.GET("/ping", func(c *gin.Context) { c.String(200, "pong") }) // => the one real route
	// => NoRoute fires when no pattern matches: the JSON 404 lives here
	router.NoRoute(func(c *gin.Context) { // => unknown path handler (co-05)
		absent(c, http.StatusNotFound, "not_found", "no route for "+c.Request.URL.Path) // => echo the path, fixed shape
	})
	// => NoMethod fires when the path matches but the verb does not
	router.NoMethod(func(c *gin.Context) { // => wrong verb handler (co-05)
		absent(c, http.StatusMethodNotAllowed, "method_not_allowed", "GET "+c.Request.URL.Path+" only") // => say what exists instead
	})
	return router // => hand the wired engine back
}

// => check serves one request in-process and prints method, status, and body.
func check(router *gin.Engine, method string, target string) { // => both halves of the address vary
	req := httptest.NewRequest(method, target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                                // => in-memory response capture
	router.ServeHTTP(w, req)                                   // => NoRoute/NoMethod fire inside
	fmt.Println(method, target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => the real route still answers in plain text: only absences change
	check(router, "GET", "/ping") // => Output: GET /ping -> 200 pong
	// => unknown path: JSON envelope naming the missing route (co-05)
	check(router, "GET", "/missing") // => Output: GET /missing -> 404 {"error":{"code":"not_found","message":"no route for /missing"}}
	// => wrong verb on a known path: JSON 405 saying what exists
	check(router, "POST", "/ping") // => Output: POST /ping -> 405 {"error":{"code":"method_not_allowed","message":"GET /ping only"}}
}
