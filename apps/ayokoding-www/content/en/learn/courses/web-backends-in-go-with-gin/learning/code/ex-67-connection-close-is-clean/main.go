// => Example 67: Connection Close Is Clean.
// => Close and Shutdown end servers differently: Close drops idle
// => connections at once, Shutdown drains them. This example closes one
// => idle server and shuts another down, printing what each ending returns
// => so the two verbs never blur together.
package main

import (
	"context"                  // => the shutdown deadline for the patient end (co-08)
	"fmt"                      // => prints both endings
	"github.com/gin-gonic/gin" // => the router both servers share (co-08)
	"net/http"                 // => the real client proving service first
	"net/http/httptest"        // => the two loopback servers under test (co-08)
	"time"                     // => bounds the graceful half of the lesson
)

// => newRouter wires one ping route: liveness both endings interrupt.
func newRouter() *gin.Engine { // => the shared system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => one route liveness-proves both servers before their endings
	router.GET("/ping", func(c *gin.Context) { c.String(200, "pong") }) // => alive until each ending
	return router                                                       // => hand the wired engine back
}

// => ping proves one server answers before its ending below.
func ping(server *httptest.Server) string { // => the liveness proof per server
	client := &http.Client{Timeout: 5 * time.Second} // => generous bound, never hit
	resp, err := client.Get(server.URL + "/ping")    // => loopback round trip, port never printed
	if err != nil {                                  // => loopback dials do not fail in practice
		return "dial failed" // => the failure travels as data
	}
	defer resp.Body.Close()     // => always release the connection
	if resp.StatusCode != 200 { // => anything but 200 is a broken server
		return "bad status" // => the failure names itself
	}
	return "pong" // => the server answered before its ending
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => the abrupt ending: Close drops everything idle at once
	abrupt := httptest.NewServer(router)       // => loopback listening: alive for now
	fmt.Println("abrupt alive:", ping(abrupt)) // => Output: abrupt alive: pong
	// => no grace period: Close returns once listeners shut
	abrupt.Close()               // => immediate: idle connections drop, no waiting (co-08)
	fmt.Println("abrupt closed") // => Output: abrupt closed
	// => the patient ending: Shutdown drains, then reports clean
	patient := httptest.NewServer(router) // => loopback listening: alive for now
	// => alive again: the second server proves itself before draining
	fmt.Println("patient alive:", ping(patient))                            // => Output: patient alive: pong
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second) // => generous deadline, never hit
	defer cancel()                                                          // => release the timer when done
	if err := patient.Config.Shutdown(ctx); err != nil {                    // => no in-flight work: returns at once (co-08)
		fmt.Println("shutdown:", err) // => shutdowns can fail: this one does not
		return                        // => failed shutdowns end the lesson here
	}
	fmt.Println("patient shutdown clean") // => Output: patient shutdown clean
}
