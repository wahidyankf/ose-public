// => Example 68: Timeouts Bound Slow Clients.
// => Server timeouts bound every phase of a connection so slow clients
// => cannot hold slots forever. This example configures read, write, and
// => idle timeouts on a real server and prints the configured values the
// => listener enforces: policy as data, never as hope.
package main

import (
	"fmt"                      // => prints the configured policy
	"github.com/gin-gonic/gin" // => the router behind the timeouts (co-08)
	"net/http"                 // => the server timeout fields (co-08)
	"net/http/httptest"        // => the loopback server under test (co-08)
	"time"                     // => the duration values below
)

// => newRouter wires one ping route: timeouts guard around it, unseen.
// => handlers never see these bounds: the server enforces them outside
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                                           // => silence the debug banner for golden output
	router := gin.New()                                                 // => bare engine: no hidden middleware
	router.GET("/ping", func(c *gin.Context) { c.String(200, "pong") }) // => instant work: bounds never fire here
	return router                                                       // => hand the wired engine back
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => unstarted first: timeouts are set before the listener opens
	server := httptest.NewUnstartedServer(router) // => configured but not listening yet
	// => read bounds the request headers and body: slow senders get cut
	server.Config.ReadTimeout = 5 * time.Second // => five seconds to finish sending (co-08)
	// => write bounds the response: slow readers get cut mid-answer
	server.Config.WriteTimeout = 10 * time.Second // => ten seconds to drain the answer
	// => idle bounds keep-alive reuse: quiet connections close after a minute
	server.Config.IdleTimeout = 60 * time.Second     // => a minute of silence, then close
	server.Start()                                   // => loopback listening under the new bounds
	defer server.Close()                             // => release the port when done
	client := &http.Client{Timeout: 5 * time.Second} // => the client bounds its own side too
	resp, err := client.Get(server.URL + "/ping")    // => loopback round trip, port never printed
	if err != nil {                                  // => loopback dials do not fail in practice
		fmt.Println("FAIL dial:", err) // => the failure names itself
		return                         // => no policy to print: stop here
	}
	defer resp.Body.Close() // => always release the connection
	// => the policy prints from the live config: values enforced, not wished
	fmt.Println("read", server.Config.ReadTimeout)   // => Output: read 5s
	fmt.Println("write", server.Config.WriteTimeout) // => Output: write 10s
	fmt.Println("idle", server.Config.IdleTimeout)   // => Output: idle 1m0s
	fmt.Println("GET /ping ->", resp.StatusCode)     // => Output: GET /ping -> 200
}
