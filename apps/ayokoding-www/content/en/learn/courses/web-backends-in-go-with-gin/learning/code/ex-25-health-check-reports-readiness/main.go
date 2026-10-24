// => Example 25: Health Check Reports Readiness.
// => Orchestrators decide traffic by polling one route, so it must answer
// => fast with a fixed shape. This example serves a health endpoint
// => reporting version and readiness, flips readiness off, and prints the
// => shape each state produces.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => the health endpoint and its switch (co-14)
	"net/http"                 // => 200 for ready, 503 for draining (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => health owns the readiness flag the checks flip below.
// => a pointer means flips and reads share one flag (co-14)
type health struct { // => the whole dependency of this example
	ready   bool   // => false during startup and shutdown: no traffic then
	version string // => the build the orchestrator is polling
}

// => check routes the same /healthz path to the readiness-aware answer.
// => ready means 200; draining means 503 with the same shape (co-14)
func (h *health) check(c *gin.Context) { // => the method closes over the flag
	// => the shape never changes: only ok flips and the status follows
	if !h.ready { // => draining or starting: refuse traffic honestly
		c.JSON(http.StatusServiceUnavailable, gin.H{"ok": false, "version": h.version}) // => 503 keeps the shape (co-04)
		return                                                                          // => the orchestrator reads ok:false and routes away
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "version": h.version}) // => 200 with the same keys (co-04)
}

// => newRouter wires health beside one real route sharing the flag.
// => /healthz answers from memory: no store, no latency, no failure
func newRouter(h *health) *gin.Engine { // => the flag arrives pre-set by the caller
	gin.SetMode(gin.TestMode)                                           // => silence the debug banner for golden output
	router := gin.New()                                                 // => bare engine: no hidden middleware
	router.GET("/healthz", h.check)                                     // => the orchestrator polls exactly here (co-14)
	router.GET("/ping", func(c *gin.Context) { c.String(200, "pong") }) // => the real route beside it
	return router                                                       // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => readiness logic runs inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	// => ready from the start: traffic flows with 200 and ok:true
	h := &health{ready: true, version: "1.4.2"} // => the flag the checks share
	router := newRouter(h)                      // => the engine reads the same flag
	check(router, "/healthz")                   // => Output: GET /healthz -> 200 {"ok":true,"version":"1.4.2"}
	// => shutdown flips readiness first: 503 with the identical shape
	h.ready = false           // => drain: the orchestrator must route away (co-14)
	check(router, "/healthz") // => Output: GET /healthz -> 503 {"ok":false,"version":"1.4.2"}
	// => the real route is untouched by the flag: health and traffic differ
	check(router, "/ping") // => Output: GET /ping -> 200 pong
}
