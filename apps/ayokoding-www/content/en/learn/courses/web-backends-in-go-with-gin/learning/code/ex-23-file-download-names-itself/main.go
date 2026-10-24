// => Example 23: File Download Names Itself.
// => Downloads need a filename and a content type, or browsers guess both
// => badly. This example serves a fixed report as an attachment with its
// => name and type set, and prints the headers with the body.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => attachment disposition plus data (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => report is the fixed file content every download serves.
// => constant bytes keep the size and body golden-stable
var report = []byte("month,total\njan,40\nfeb,55\n") // => three CSV lines, twenty-four bytes

// => download serves the report as a named attachment.
// => Content-Disposition names the file; the type names the bytes (co-04)
func download(c *gin.Context) { // => the handler owns the download contract
	// => attachment forces a save dialog; filename fills the suggested name
	c.Header("Content-Disposition", `attachment; filename="report.csv"`) // => save as report.csv
	// => Data writes status, type, and bytes in one call: no file I/O here
	c.Data(200, "text/csv", report) // => the type tells the OS which app opens it
}

// => newRouter wires the single download route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)       // => silence the debug banner for golden output
	router := gin.New()             // => bare engine: no hidden middleware
	router.GET("/report", download) // => one path, a file out (co-04)
	return router                   // => hand the wired engine back
}

// => check serves one GET and prints headers with the body.
// => the disposition and type ARE the answer here, not just the bytes
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                    // => in-memory response capture
	router.ServeHTTP(w, req)                       // => full pipeline, minus the socket
	// => one line carries status, disposition, type, and body together
	fmt.Println("GET", target, "->", w.Code, w.Header().Get("Content-Disposition"), w.Header().Get("Content-Type"), w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => the attachment names itself: type, filename, and bytes all agree (co-04)
	check(router, "/report") // => Output: GET /report -> 200 attachment; filename="report.csv" text/csv month,total
	// => Output: jan,40
	// => Output: feb,55
}
