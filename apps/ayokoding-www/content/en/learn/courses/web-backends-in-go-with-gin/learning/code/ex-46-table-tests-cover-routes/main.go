// => Example 46: Table Tests Cover Routes.
// => One assertion proves one case; a table proves the route. This example
// => lists five method-path-status-body cases in a slice, serves each
// => in-process, and prints a PASS or FAIL line per row.
package main

import (
	"fmt"                      // => prints one verdict per table row
	"github.com/gin-gonic/gin" // => the router every row serves (co-09)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds write bodies and compares answers
)

// => row is one test case: the request plus the answer it must produce.
// => tables turn five copy-pasted checks into five data lines (co-09)
type row struct { // => the case shape every row shares
	name   string // => what the row proves, printed with its verdict
	method string // => GET or POST: the verb under test
	target string // => path plus query: the address under test
	body   string // => write payload, empty for reads
	code   int    // => the expected status
	answer string // => the expected body, exact
}

// => newRouter wires a tiny catalog with read and write routes.
// => One liveness route, one capture, one echo: the rows below cover all three.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                                           // => silence the debug banner for golden output
	router := gin.New()                                                 // => bare engine: no hidden middleware
	router.GET("/ping", func(c *gin.Context) { c.String(200, "pong") }) // => the liveness row
	router.GET("/users/:id", func(c *gin.Context) {                     // => the capture row (co-03)
		c.JSON(200, gin.H{"id": c.Param("id")}) // => echo the captured id
	})
	router.POST("/echo", func(c *gin.Context) { // => the write row
		var in struct { // => the tiny bound shape
			Say string `json:"say" binding:"required"` // => say is mandatory
		}
		if err := c.ShouldBindJSON(&in); err != nil { // => missing say fails here
			c.JSON(400, gin.H{"error": "say something"}) // => 400, fixed envelope (co-05)
			return                                       // => invalid input never echoes
		}
		c.JSON(200, gin.H{"said": in.Say}) // => echo the said word
	})
	return router // => hand the wired engine back
}

// => run serves one row and prints its verdict with both sides on failure.
// => the loop below calls this per row: the table drives the traffic
func run(router *gin.Engine, r row) { // => one row in, one verdict out
	// => the body rides a reader: empty string means no payload
	req := httptest.NewRequest(r.method, r.target, strings.NewReader(r.body)) // => method, path, body from the row
	if r.body != "" {                                                         // => write rows declare JSON
		req.Header.Set("Content-Type", "application/json") // => the binder reads this
	}
	// => the recorder is the assertion surface: status, headers, body
	w := httptest.NewRecorder() // => the assertion surface
	// => ServeHTTP runs routing plus middleware exactly as live traffic would
	router.ServeHTTP(w, req) // => full pipeline, minus the network (co-09)
	// => code and body must both match: either mismatch fails the row
	if w.Code != r.code || strings.TrimSpace(w.Body.String()) != r.answer { // => exact on both halves
		fmt.Println("FAIL", r.name, "got", w.Code, w.Body.String()) // => the row name plus what happened
		return                                                      // => failure recorded: the next row still runs
	}
	fmt.Println("PASS", r.name) // => the row held: name the proof
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => five rows, five proofs: reads, captures, writes, and failures
	cases := []row{ // => the table: data, not five copied checks
		// => liveness first: a dead service fails every row after it
		{"ping answers pong", "GET", "/ping", "", 200, "pong"},                          // => liveness holds
		{"capture echoes id", "GET", "/users/7", "", 200, `{"id":"7"}`},                 // => path params echo
		{"echo repeats say", "POST", "/echo", `{"say":"hi"}`, 200, `{"said":"hi"}`},     // => writes bind and echo
		{"missing say is 400", "POST", "/echo", `{}`, 400, `{"error":"say something"}`}, // => validation fails loudly
		{"unknown path is 404", "GET", "/nope", "", 404, "404 page not found"},          // => absence is defined
	}
	// => the loop serves every row in order: failures never stop the table
	// => order is stable: verdicts print in table order every run
	for _, tc := range cases { // => the loop serves every row in order
		// => every row reports: five verdicts per run, stable order
		run(router, tc) // => one verdict per row, stable order
	}
}
