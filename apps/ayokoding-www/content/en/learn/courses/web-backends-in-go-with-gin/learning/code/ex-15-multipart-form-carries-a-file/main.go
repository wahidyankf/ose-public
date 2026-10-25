// => Example 15: Multipart Form Carries a File.
// => File uploads arrive as multipart forms: fields plus file parts under one
// => content type. This example hand-crafts a multipart body with a fixed
// => boundary, reads the file part in memory, and prints its name with its
// => size and the text field beside it.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => FormFile reads the uploaded part (co-03)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds the fixed multipart body
)

// => upload reads one text field and one file part from a multipart body.
// => FormFile opens the part; Open and Read stay in memory here (co-03)
func upload(c *gin.Context) { // => the handler sees fields and files, not bytes
	// => the text field rides beside the file: one form, two kinds of data
	title := c.PostForm("title") // => plain field, empty when absent
	// => FormFile looks up the part by its form name: "avatar" here
	part, err := c.FormFile("avatar") // => the uploaded file's handle
	if err != nil {                   // => missing part or broken body fails here
		c.JSON(400, gin.H{"error": "bad upload"}) // => fixed envelope (co-04)
		return                                    // => half-formed uploads never reach the logic below
	}
	// => Open streams the part content; this example reads it whole
	src, err := part.Open() // => the part as a readable stream
	if err != nil {         // => unreadable parts fail the same way
		c.JSON(400, gin.H{"error": "bad upload"}) // => same envelope, same status
		return                                    // => nothing half-read leaves this handler
	}
	defer src.Close() // => streams close even on the happy path
	// => a small buffer is enough: the fixture below is eleven bytes
	buf := make([]byte, 64) // => fixed buffer, no size guessing
	n, _ := src.Read(buf)   // => one read takes the whole fixture
	// => Filename, Size, and content prove the part arrived intact
	c.JSON(200, gin.H{"title": title, "name": part.Filename, "size": part.Size, "head": string(buf[:n])}) // => the receipt (co-04)
}

// => newRouter wires the single upload route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)      // => silence the debug banner for golden output
	router := gin.New()            // => bare engine: no hidden middleware
	router.POST("/upload", upload) // => one path, multipart body in (co-03)
	return router                  // => hand the wired engine back
}

// => body builds the fixed multipart payload both checks share.
// => a literal boundary keeps the bytes golden-stable across runs
func body() string { // => the same body builds both requests
	// => boundary "FIXED" never changes: writers usually randomize it
	b := "FIXED"          // => deterministic boundary for golden output
	var s strings.Builder // => assemble the body part by part
	// => the text field comes first: disposition plus value, CRLF-framed
	s.WriteString("--" + b + "\r\n")                                        // => opening boundary line
	s.WriteString("Content-Disposition: form-data; name=\"title\"\r\n\r\n") // => field header and blank line
	s.WriteString("portrait\r\n")                                           // => the field value itself
	// => the file part names its filename: the server echoes it back
	s.WriteString("--" + b + "\r\n")                                                          // => part boundary line
	s.WriteString("Content-Disposition: form-data; name=\"avatar\"; filename=\"me.png\"\r\n") // => file header
	s.WriteString("Content-Type: image/png\r\n\r\n")                                          // => part content type and blank line
	s.WriteString("PNG CONTENTS\r\n")                                                         // => eleven bytes of fixture content
	s.WriteString("--" + b + "--\r\n")                                                        // => closing boundary line
	return s.String()                                                                         // => the whole body as one fixed string
}

// => check serves one POST: full body or empty, and prints the answer.
func check(router *gin.Engine, full bool) { // => full picks the fixture or nothing
	var reqBody string                                   // => empty body exercises the missing-part path
	contentType := "multipart/form-data; boundary=FIXED" // => must name the same boundary
	if full {                                            // => the happy path carries the fixture
		reqBody = body() // => fixed bytes, fixed boundary
	}
	// => even the empty body needs the content type: the binder reads it
	req := httptest.NewRequest("POST", "/upload", strings.NewReader(reqBody)) // => no socket, fixed bytes
	req.Header.Set("Content-Type", contentType)                               // => multipart with our boundary
	w := httptest.NewRecorder()                                               // => in-memory response capture
	router.ServeHTTP(w, req)                                                  // => multipart parsing runs inside
	fmt.Println("POST /upload full=", full, "->", w.Code, w.Body.String())    // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => the full fixture parses: name, size, and content all echo back
	check(router, true) // => Output: POST /upload full= true -> 200 {"head":"PNG CONTENTS","name":"me.png","size":12,"title":"portrait"}
	// => the empty body has no avatar part: the same 400 envelope (co-05)
	check(router, false) // => Output: POST /upload full= false -> 400 {"error":"bad upload"}
}
