// => Example 65: Signals Trigger Shutdown.
// => Production stops arrive as OS signals, so servers translate them into
// => graceful shutdowns. This example traps SIGTERM, sends one to itself
// => once ready, and prints the shutdown the signal triggered: started,
// => signalled, drained, stopped.
package main

import (
	"context"                  // => the shutdown deadline after the signal (co-08)
	"fmt"                      // => prints the lifecycle lines
	"github.com/gin-gonic/gin" // => the router that stops gracefully (co-08)
	"net/http"                 // => the real client proving liveness
	"net/http/httptest"        // => the loopback server under test (co-08)
	"os"                       // => the process talking to itself
	"os/signal"                // => trapping the stop signal
	"syscall"                  // => SIGTERM by number, portably named
	"time"                     // => bounds the shutdown after the signal
)

// => newRouter wires one ping route: liveness before the signal lands.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                                           // => silence the debug banner for golden output
	router := gin.New()                                                 // => bare engine: no hidden middleware
	router.GET("/ping", func(c *gin.Context) { c.String(200, "pong") }) // => alive until shutdown
	return router                                                       // => hand the wired engine back
}

func main() {
	router := newRouter()                // => wiring separate from traffic, as always
	server := httptest.NewServer(router) // => loopback listening: ready for traffic
	defer server.Close()                 // => release the port whatever happens
	// => started first: the lifecycle reads top to bottom
	fmt.Println("started") // => Output: started
	// => Notify traps SIGTERM into a buffered channel: one signal fits
	// => one slot suffices: the lesson sends exactly one stop
	sigs := make(chan os.Signal, 1)      // => buffered: the signal never blocks
	signal.Notify(sigs, syscall.SIGTERM) // => the stop signal, trapped (co-08)
	defer signal.Stop(sigs)              // => release the trap when done
	// => the sender waits for readiness, then stops itself like deploys do
	go func() { // => the orchestrator, played by a goroutine
		// => poll the real endpoint: the signal fires only once serving
		client := &http.Client{Timeout: 5 * time.Second} // => bounds the readiness poll
		for {                                            // => retry until the server answers: readiness, not timing
			resp, err := client.Get(server.URL + "/ping") // => loopback poll, port never printed
			if err == nil {                               // => the server answered
				resp.Body.Close() // => release the poll connection
				break             // => ready: send the stop signal
			}
			time.Sleep(time.Millisecond) // => fixed beat: readiness polling, not racing
		}
		// => SIGTERM to self: the same signal orchestrators send (co-08)
		_ = syscall.Kill(syscall.Getpid(), syscall.SIGTERM) // => the stop arrives like production
	}()
	// => block until the trapped signal arrives: the graceful entry point
	// => receiving translates the OS event into ordinary program flow
	sig := <-sigs              // => the stop signal, caught not fatal
	fmt.Println("signal", sig) // => Output: signal terminated
	// => the signal starts the drain: five seconds, plenty for loopback
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second) // => the drain bound
	defer cancel()                                                          // => release the timer when done
	if err := server.Config.Shutdown(ctx); err != nil {                     // => stop accepting, drain, exit (co-08)
		fmt.Println("shutdown:", err) // => shutdowns can fail: this one does not
		return                        // => failed shutdowns end the lesson here
	}
	fmt.Println("shutdown clean") // => Output: shutdown clean
}
