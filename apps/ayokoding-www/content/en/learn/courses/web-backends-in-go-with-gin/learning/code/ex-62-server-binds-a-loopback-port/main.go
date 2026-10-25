// => Example 62: Server Binds a Loopback Port.
// => Real serving starts with a listener, and tests take an ephemeral
// => loopback port the system chooses. This example serves gin on a
// => httptest server, exchanges one real HTTP round trip over loopback, and
// => prints the status with the body: never the port number itself.
package main

import (
	"fmt"                      // => prints the round-trip result
	"github.com/gin-gonic/gin" // => the router under real serving (co-08)
	"io"                       // => reads the response body whole
	"net/http"                 // => the real client for the round trip
	"net/http/httptest"        // => the loopback server (co-08, co-09)
	"time"                     // => bounds the client so hangs fail fast
)

// => newRouter wires the one ping route the round trip exercises.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                                           // => silence the debug banner for golden output
	router := gin.New()                                                 // => bare engine: no hidden middleware
	router.GET("/ping", func(c *gin.Context) { c.String(200, "pong") }) // => the route under test
	return router                                                       // => hand the wired engine back
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => NewServer binds 127.0.0.1 on an OS-chosen ephemeral port: never fixed (co-08)
	server := httptest.NewServer(router) // => a real listener on loopback
	defer server.Close()                 // => always release the port when done
	// => the client bounds the trip: five seconds is forever for loopback
	client := &http.Client{Timeout: 5 * time.Second} // => hangs become failures, not hangs
	// => a real HTTP exchange over a real socket: the only loopback in the course
	resp, err := client.Get(server.URL + "/ping") // => URL holds the ephemeral port: never printed
	if err != nil {                               // => loopback dials do not fail in practice
		fmt.Println("FAIL dial:", err) // => the failure names itself
		return                         // => no response to read: stop here
	}
	defer resp.Body.Close()          // => always release the connection
	body, _ := io.ReadAll(resp.Body) // => the whole pong, at most four bytes
	// => status and body prove the trip: the port stays out of the output
	fmt.Println("GET /ping ->", resp.StatusCode, string(body)) // => Output: GET /ping -> 200 pong
}
