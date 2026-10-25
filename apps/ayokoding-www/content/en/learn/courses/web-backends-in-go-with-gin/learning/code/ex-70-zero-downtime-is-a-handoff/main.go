// => Example 70: Zero Downtime Is a Handoff.
// => Zero-downtime deploys hand traffic from the old build to the new one
// => with no gap. This example serves version one, starts version two
// => beside it, moves the client across, and prints both versions' answers
// => in order: v1, then v2, never nothing.
package main

import (
	"fmt"                      // => prints each version's answer
	"github.com/gin-gonic/gin" // => the versioned routers (co-08, co-16)
	"io"                       // => reads response bodies whole
	"net/http"                 // => the real client moving across
	"net/http/httptest"        // => the two loopback generations (co-08)
	"time"                     // => bounds the moving client
)

// => versioned wires one route that names its build.
// => the version string is the only difference between generations
func versioned(v string) *gin.Engine { // => the build label arrives at startup
	gin.SetMode(gin.TestMode)                                         // => silence the debug banner for golden output
	router := gin.New()                                               // => bare engine: no hidden middleware
	router.GET("/version", func(c *gin.Context) { c.String(200, v) }) // => the build names itself
	return router                                                     // => hand the wired engine back
}

// => ask performs one real round trip and returns the version it served.
// => the client moves across generations by changing which URL it calls
func ask(client *http.Client, url string) string { // => the generation URL under test
	resp, err := client.Get(url + "/version") // => loopback round trip, port never printed
	if err != nil {                           // => loopback dials do not fail in practice
		return "dial failed" // => the failure travels as data
	}
	defer resp.Body.Close()          // => always release the connection
	body, _ := io.ReadAll(resp.Body) // => the version string, a few bytes
	return string(body)              // => v1 or v2: whoever served
}

func main() {
	client := &http.Client{Timeout: 5 * time.Second} // => generous bound, never hit
	// => generation one serves alone first: the old world, working
	v1 := httptest.NewServer(versioned("v1"))   // => the old build on loopback
	fmt.Println("serving", ask(client, v1.URL)) // => Output: serving v1
	// => generation two starts BESIDE one: both answer during the handoff
	v2 := httptest.NewServer(versioned("v2"))        // => the new build on loopback
	fmt.Println("also serving", ask(client, v2.URL)) // => Output: also serving v2
	// => the router moves: new traffic goes to two, old drains from one
	fmt.Println("serving", ask(client, v2.URL)) // => Output: serving v2
	// => generation one stops only after two proves itself: never nothing (co-08)
	v1.Close()                // => the old build exits: its drain already finished
	fmt.Println("v1 retired") // => Output: v1 retired
	// => the new world serves alone: the handoff completed with no gap
	fmt.Println("serving", ask(client, v2.URL)) // => Output: serving v2
	v2.Close()                                  // => release the last port when done
}
