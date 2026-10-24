// => Example 60: Streaming Flushes Early Chunks.
// => Long answers stream chunk by chunk instead of buffering whole, so
// => clients read the first bytes early. This example streams three numbered
// => chunks with flushes between them and prints the joined body the
// => recorder captured.
package main

import (
	"fmt"                      // => prints the joined body
	"github.com/gin-gonic/gin" // => streaming with flushes (co-07, co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => stream writes three chunks, flushing after each one.
// => Flush pushes bytes out now: clients read before the handler ends
func stream(c *gin.Context) { // => the handler that never buffers whole
	// => chunked responses set no Content-Length: the end is marked by close
	c.Header("Content-Type", "text/plain") // => plain chunks, framed by the server
	for i := 1; i <= 3; i++ {              // => three fixed chunks, stable order
		// => Fprintf writes the chunk: "chunk 1\n" through "chunk 3\n"
		fmt.Fprintf(c.Writer, "chunk %d\n", i) // => one chunk per iteration
		c.Writer.Flush()                       // => push this chunk out before the next (co-07)
	}
}

// => newRouter wires the single streaming route this example serves.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)     // => silence the debug banner for golden output
	router := gin.New()           // => bare engine: no hidden middleware
	router.GET("/stream", stream) // => the route that streams (co-04)
	return router                 // => hand the wired engine back
}

// => check serves one GET in-process and prints the joined chunks.
// => the recorder joins every flushed chunk into one body
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                    // => Flush marks Flushed, keeps bytes
	router.ServeHTTP(w, req)                       // => chunks flush inside (co-09)
	// => %q shows the newlines: the joining is visible, not implied
	fmt.Printf("GET %s -> %d %q\n", target, w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => three chunks joined in order: the stream reads as one body here (co-07)
	check(router, "/stream") // => Output: GET /stream -> 200 "chunk 1\nchunk 2\nchunk 3\n"
}
