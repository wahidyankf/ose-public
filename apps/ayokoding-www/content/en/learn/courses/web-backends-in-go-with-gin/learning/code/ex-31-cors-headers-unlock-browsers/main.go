// => Example 31: CORS Headers Unlock Browsers.
// => Browsers block cross-origin reads unless the server opts in with CORS
// => headers. This example answers preflight OPTIONS with the allowed
// => origin, methods, and headers, then serves the real GET with the origin
// => echoed back.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => CORS middleware for browser clients (co-02)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => cors grants one trusted origin the methods and headers it needs.
// => preflight OPTIONS short-circuits here: no handler runs for it
func cors(c *gin.Context) { // => every response below carries these headers
	origin := "https://app.example.com" // => the one trusted web client
	// => the browser sends Origin: echo it back only when it matches
	if c.GetHeader("Origin") == origin { // => unlisted origins get no grant
		c.Header("Access-Control-Allow-Origin", origin) // => this origin may read the answer
	}
	// => preflight asks permission: methods and headers are the grant
	c.Header("Access-Control-Allow-Methods", "GET, POST")                   // => what the client may call
	c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization") // => what the client may send
	if c.Request.Method == "OPTIONS" {                                      // => preflight never reaches a handler
		c.AbortWithStatus(204) // => empty 204: permission granted, nothing more (co-04)
		return                 // => the chain stops at the grant
	}
	c.Next() // => real requests proceed to their handlers
}

// => newRouter wraps every route in the CORS layer.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)                                                   // => silence the debug banner for golden output
	router := gin.New()                                                         // => bare engine: middleware added by hand
	router.Use(cors)                                                            // => every answer carries the grant (co-02)
	router.GET("/data", func(c *gin.Context) { c.JSON(200, gin.H{"rows": 3}) }) // => the guarded resource
	return router                                                               // => hand the wired engine back
}

// => check serves one request with an origin and prints headers with body.
// => the Origin header decides whether the grant appears at all
func check(router *gin.Engine, method string, origin string) { // => method plus origin vary
	req := httptest.NewRequest(method, "/data", nil) // => fixed path, varying method
	if origin != "" {                                // => server-to-server calls send no Origin
		req.Header.Set("Origin", origin) // => the browser's address under test
	}
	w := httptest.NewRecorder() // => in-memory response capture
	router.ServeHTTP(w, req)    // => CORS runs around everything
	// => the grant header IS the answer for preflight: print it with the body
	line := fmt.Sprintf("%s /data origin=%s -> %d allow=%s", method, origin, w.Code, w.Header().Get("Access-Control-Allow-Origin")) // => status core: always present
	if w.Body.String() != "" {                                                                                                      // => preflight carries no body
		line += " " + w.Body.String() // => real answers join their JSON
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => trusted preflight: 204 with the origin granted, no body
	check(router, "OPTIONS", "https://app.example.com") // => Output: OPTIONS /data origin=https://app.example.com -> 204 allow=https://app.example.com
	// => trusted GET: the grant rides beside the real answer
	check(router, "GET", "https://app.example.com") // => Output: GET /data origin=https://app.example.com -> 200 allow=https://app.example.com {"rows":3}
	// => unlisted origin: answered, but granted nothing (co-05)
	check(router, "GET", "https://evil.example.com") // => Output: GET /data origin=https://evil.example.com -> 200 allow= {"rows":3}
}
