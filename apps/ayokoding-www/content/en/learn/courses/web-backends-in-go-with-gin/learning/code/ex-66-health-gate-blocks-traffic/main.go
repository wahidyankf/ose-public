// => Example 66: Health Gate Blocks Traffic.
// => Draining starts before shutdown: the service marks itself unready,
// => finishes in-flight work, then stops. This example flips readiness off
// => mid-flight, shows new traffic getting 503 while the old request
// => drains, and prints all three outcomes in order.
package main

import (
	"context"                  // => the shutdown deadline after the drain (co-08)
	"fmt"                      // => prints the drain sequence
	"github.com/gin-gonic/gin" // => the gated routes (co-08, co-14)
	"io"                       // => reads response bodies whole
	"net/http"                 // => the real client for every leg
	"net/http/httptest"        // => the loopback server under test (co-08)
	"sync/atomic"              // => the race-free readiness flag
	"time"                     // => bounds the slow work and the shutdown
)

// => gate owns the readiness flag every route checks first.
// => one atomic boolean: flips are visible to all requests at once
type gate struct { // => the drain switch, shared process-wide
	ready atomic.Bool // => true serves, false sheds: flipped once below
}

// => newRouter wires health plus one slow route behind the gate.
// => the health route reports the flag; the slow route is the drain
func newRouter(g *gate) *gin.Engine { // => the gate arrives injected
	gin.SetMode(gin.TestMode)                     // => silence the debug banner for golden output
	router := gin.New()                           // => bare engine: middleware added by hand
	router.GET("/healthz", func(c *gin.Context) { // => the orchestrator polls here (co-14)
		if !g.ready.Load() { // => draining: refuse new traffic honestly
			c.JSON(503, gin.H{"ok": false}) // => 503 keeps the health shape (co-04)
			return                          // => the drain verdict, not an error
		}
		c.JSON(200, gin.H{"ok": true}) // => ready: traffic may flow
	})
	router.GET("/slow", func(c *gin.Context) { // => the in-flight request
		time.Sleep(50 * time.Millisecond) // => fixed work: short, never asserted
		c.String(200, "slowly done")      // => the answer the drain waits for
	})
	return router // => hand the wired engine back
}

// => get performs one real round trip and returns status with body.
// => the client bounds every leg: hangs become failures, not hangs
func get(client *http.Client, url string) (int, string) { // => status plus body, or the dial failure
	resp, err := client.Get(url) // => loopback round trip, port never printed
	if err != nil {              // => loopback dials do not fail in practice
		return 0, "dial failed" // => the failure travels as data
	}
	defer resp.Body.Close()              // => always release the connection
	body, _ := io.ReadAll(resp.Body)     // => the whole answer, at most dozens of bytes
	return resp.StatusCode, string(body) // => the leg's outcome
}

func main() {
	g := &gate{} // => ready defaults false: flip on when serving
	// => open first: the drain sequence needs traffic to shed
	g.ready.Store(true)                              // => open for traffic: the drain starts below
	router := newRouter(g)                           // => wiring separate from traffic, as always
	server := httptest.NewServer(router)             // => loopback listening: ready for traffic
	defer server.Close()                             // => release the port whatever happens
	client := &http.Client{Timeout: 5 * time.Second} // => generous bound, never hit
	// => ready first: 200 with ok true, traffic flowing
	code, body := get(client, server.URL+"/healthz") // => the open verdict
	fmt.Println("health open ->", code, body)        // => Output: health open -> 200 {"ok":true}
	// => the slow request flies: mid-air when the gate flips below
	done := make(chan string, 1) // => buffered: the drain reports without blocking
	go func() {                  // => the in-flight request, draining now
		_, slow := get(client, server.URL+"/slow") // => fifty milliseconds mid-air
		done <- slow                               // => the drained answer travels the channel
	}()
	time.Sleep(10 * time.Millisecond) // => fixed head start: mid-flight when flipping
	// => flip the gate BEFORE shutting down: new traffic sheds first (co-08)
	// => flipping sheds new traffic: in-flight work continues
	g.ready.Store(false) // => draining: the orchestrator routes away
	// => the second poll proves the flip: 503 with the same shape
	code, body = get(client, server.URL+"/healthz") // => the shed verdict
	fmt.Println("health draining ->", code, body)   // => Output: health draining -> 503 {"ok":false}
	// => shut down gracefully: the slow request still completes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second) // => generous deadline, never hit
	defer cancel()                                                          // => release the timer when done
	if err := server.Config.Shutdown(ctx); err != nil {                     // => drain, then exit (co-08)
		fmt.Println("shutdown:", err) // => shutdowns can fail: this one does not
		return                        // => failed shutdowns end the lesson here
	}
	// => the drained answer arrives after the flip: old work finishes (co-08)
	fmt.Println("drained", <-done) // => Output: drained slowly done
	fmt.Println("shutdown clean")  // => Output: shutdown clean
}
