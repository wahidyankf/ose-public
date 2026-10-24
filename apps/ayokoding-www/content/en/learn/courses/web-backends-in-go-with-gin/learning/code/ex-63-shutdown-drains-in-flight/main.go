// => Example 63: Shutdown Drains In-Flight Requests.
// => Shutdown waits for in-flight requests instead of dropping them, so slow
// => answers still land. This example starts one slow request, shuts the
// => server down mid-flight, and prints the completed answer beside the
// => clean shutdown result.
package main

import (
	"context"                  // => the shutdown deadline (co-08)
	"fmt"                      // => prints the drained answer and the result
	"github.com/gin-gonic/gin" // => the router that drains (co-08)
	"io"                       // => reads the response body whole
	"net/http"                 // => the real client plus the server handle
	"net/http/httptest"        // => the loopback server under test (co-08)
	"time"                     // => bounds the slow work and the shutdown
)

// => newRouter wires one slow route: fifty milliseconds of pretend work.
// => the sleep stands in for a store call: shutdown must outwait it
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                  // => silence the debug banner for golden output
	router := gin.New()                        // => bare engine: no hidden middleware
	router.GET("/slow", func(c *gin.Context) { // => the in-flight request
		time.Sleep(50 * time.Millisecond) // => fixed work: short, never asserted
		c.String(200, "slowly done")      // => the answer shutdown waits for
	})
	return router // => hand the wired engine back
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => unstarted servers shut down nothing: Start the listener first
	// => unstarted first: Start separates configuration from listening
	server := httptest.NewUnstartedServer(router) // => configured but not listening yet
	server.Start()                                // => now loopback accepts: the race begins
	defer server.Close()                          // => release the port whatever happens
	// => the client bounds the trip generously: drain takes milliseconds
	client := &http.Client{Timeout: 5 * time.Second} // => hangs become failures, not hangs
	// => the slow request flies in a goroutine: main shuts down around it
	type answer struct { // => the outcome the main thread waits for
		code int    // => the status the drained request earned
		body string // => the body shutdown waited to complete
		err  error  // => the dial failure, if loopback ever failed
	}
	done := make(chan answer, 1) // => buffered: the request never blocks
	go func() {                  // => the in-flight request, mid-air during shutdown
		resp, err := client.Get(server.URL + "/slow") // => the slow trip starts here
		if err != nil {                               // => loopback dials do not fail in practice
			done <- answer{err: err} // => the failure travels the channel
			return                   // => nothing to read: report and stop
		}
		defer resp.Body.Close()                                   // => always release the connection
		body, _ := io.ReadAll(resp.Body)                          // => the answer shutdown preserved
		done <- answer{code: resp.StatusCode, body: string(body)} // => the drained result
	}()
	// => let the request land server-side before shutting down: still in-flight
	// => ten milliseconds in: the request sleeps its fifty mid-flight
	time.Sleep(10 * time.Millisecond) // => fixed head start, never asserted
	// => Shutdown stops accepting and waits: the in-flight request completes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second) // => generous deadline, never hit
	defer cancel()                                                          // => release the timer when done
	if err := server.Config.Shutdown(ctx); err != nil {                     // => the graceful stop (co-08)
		fmt.Println("shutdown:", err) // => shutdowns can fail: this one does not
		return                        // => failed shutdowns end the lesson here
	}
	// => the drained answer arrives after the shutdown returned: nothing lost
	// => the channel joins the request: shutdown already waited first
	a := <-done       // => join the request: shutdown already waited for it
	if a.err != nil { // => the dial failure, reported not hidden
		fmt.Println("request:", a.err) // => loopback failures name themselves
		return                         // => no answer to print: stop here
	}
	fmt.Println("drained", a.code, a.body) // => Output: drained 200 slowly done
	fmt.Println("shutdown clean")          // => Output: shutdown clean
}
