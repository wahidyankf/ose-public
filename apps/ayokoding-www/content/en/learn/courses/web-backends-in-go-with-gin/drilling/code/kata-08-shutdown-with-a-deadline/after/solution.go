// => Kata 8 solution: the deadline fires before the work finishes.
// => Shutdown with a ten-millisecond deadline around the fifty-millisecond
// => route: fifty never fits inside ten, so the deadline error fires every
// => run. The verdict is golden-stable because the margin is absolute.
package main

import (
	"context"                  // => the ten-millisecond shutdown bound
	"fmt"                      // => prints the deadline verdict
	"github.com/gin-gonic/gin" // => the slow route that outlasts the bound
	"net/http"                 // => the real client for the slow trip
	"net/http/httptest"        // => the loopback server under test
	"time"                     // => the fifty-versus-ten race, fixed
)

// => newRouter wires one fifty-millisecond route: slower than the deadline.
// => the sleep stands in for wedged work: shutdown gives up on it
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                  // => silence the debug banner for golden output
	router := gin.New()                        // => bare engine: no hidden middleware
	router.GET("/slow", func(c *gin.Context) { // => the request that outlasts
		time.Sleep(50 * time.Millisecond) // => fifty milliseconds: past every short bound
		// => served only without a bound: the deadline takes precedence
		c.String(200, "too late") // => never served: the deadline fires first
	})
	return router // => hand the wired engine back
}

func main() {
	router := newRouter()                         // => wiring separate from traffic, as always
	server := httptest.NewUnstartedServer(router) // => configured but not listening yet
	// => Start opens the listener: the slow request can land now
	server.Start()       // => loopback accepts: the race begins
	defer server.Close() // => release the port whatever happens
	// => the slow request flies in a goroutine: the deadline fires around it
	done := make(chan string, 1) // => buffered: the trip reports without blocking
	go func() {                  // => the in-flight request, mid-air at shutdown
		client := &http.Client{Timeout: 5 * time.Second} // => hangs become failures, not hangs
		resp, err := client.Get(server.URL + "/slow")    // => the fifty-millisecond trip
		if err != nil {                                  // => Shutdown never kills this trip in time
			done <- "request failed" // => the failure travels the channel
			return                   // => nothing to read: report and stop
		}
		defer resp.Body.Close() // => always release the connection
		// => finished travels the channel when nothing bounds the trip
		done <- "request finished" // => unreachable before main returns: fifty beats ten
	}()
	// => let the request land server-side: still sleeping when the bound fires
	// => ten milliseconds in: the request sleeps its fifty mid-flight
	time.Sleep(10 * time.Millisecond) // => fixed head start, never asserted
	// => ten milliseconds against fifty: the deadline always fires first
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond) // => the bound, fixed
	defer cancel()                                                                // => release the timer when done
	err := server.Config.Shutdown(ctx)                                            // => wait ten milliseconds, then give up
	if err != nil {                                                               // => the wedged request outlasted the bound
		fmt.Println("shutdown:", err) // => Output: shutdown: context deadline exceeded
		return                        // => the deadline verdict is the whole lesson
	}
	fmt.Println("shutdown clean") // => unreachable: fifty never fits inside ten
	_ = done                      // => the trip is still mid-air: the process exits around it
}
