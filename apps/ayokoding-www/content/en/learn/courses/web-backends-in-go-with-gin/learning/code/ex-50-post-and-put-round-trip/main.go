// => Example 50: Post and Put Round Trip.
// => Writes need round-trip tests: create, replace, then read back to prove
// => the store holds both. This example posts a note, replaces it with put,
// => reads it back, and prints each leg of the trip.
package main

import (
	"fmt"                      // => prints each round-trip leg
	"github.com/gin-gonic/gin" // => write then read routes (co-09)
	"net/http"                 // => status codes across the trip (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds write bodies from fixed strings
)

// => newRouter wires one note resource with create, replace, and read.
// => POST creates, PUT replaces whole, GET reads: the REST triangle
func newRouter(store map[string]string) *gin.Engine { // => the store arrives injected
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => create stores the posted text under the posted id
	router.POST("/notes", func(c *gin.Context) { // => create one note
		var in struct { // => the creation shape, id included
			ID   string `json:"id" binding:"required"` // => identity is mandatory
			Text string `json:"text"`                  // => text may start empty
		}
		if err := c.ShouldBindJSON(&in); err != nil { // => missing id fails here (co-10)
			c.JSON(http.StatusBadRequest, gin.H{"error": "bad note"}) // => 400, fixed envelope (co-05)
			return                                                    // => invalid input never reaches the store
		}
		// => create overwrites silently: same call serves first and repeat posts
		store[in.ID] = in.Text                                          // => create stores the text
		c.JSON(http.StatusCreated, gin.H{"id": in.ID, "text": in.Text}) // => 201 with the stored note (co-04)
	})
	// => replace overwrites whatever the id held before
	router.PUT("/notes/:id", func(c *gin.Context) { // => replace one note whole
		var in struct { // => the replacement shape: text only
			Text string `json:"text" binding:"required"` // => replacements need text
		}
		if err := c.ShouldBindJSON(&in); err != nil { // => missing text fails here
			c.JSON(http.StatusBadRequest, gin.H{"error": "bad note"}) // => same 400, same envelope
			return                                                    // => invalid input never touches the store
		}
		// => replace needs no existence check: the trip overwrites by design
		store[c.Param("id")] = in.Text                                     // => replace stores the new text
		c.JSON(http.StatusOK, gin.H{"id": c.Param("id"), "text": in.Text}) // => 200 with the replaced note (co-04)
	})
	// => read proves the writes: the trip needs this leg
	router.GET("/notes/:id", func(c *gin.Context) { // => read one note back
		// => the lookup decides: found prints, missing 404s
		text, ok := store[c.Param("id")] // => the read proves the writes
		if !ok {                         // => unknown ids are 404, not empty 200
			c.JSON(http.StatusNotFound, gin.H{"error": "no note"}) // => 404, fixed envelope (co-05)
			return                                                 // => absence stops here
		}
		// => the read echoes id plus text: the receipt mirrors the write
		c.JSON(http.StatusOK, gin.H{"id": c.Param("id"), "text": text}) // => the stored text, read back
	})
	return router // => hand the wired engine back
}

// => leg serves one request and prints method, status, and body.
// => every leg of the trip prints: the sequence is the proof
func leg(router *gin.Engine, method string, target string, body string) { // => method, path, and payload vary
	req := httptest.NewRequest(method, target, strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json")                  // => write bodies bind below
	w := httptest.NewRecorder()                                         // => the assertion surface
	router.ServeHTTP(w, req)                                            // => writes mutate, reads observe (co-09)
	line := fmt.Sprintf("%s %s -> %d", method, target, w.Code)          // => status core: always present
	if w.Body.String() != "" {                                          // => every leg here has a body
		line += " " + w.Body.String() // => bodies join with one space
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

func main() {
	router := newRouter(map[string]string{}) // => empty store at startup
	// => create stores the first text: 201 with the note
	leg(router, "POST", "/notes", `{"id":"n1","text":"first"}`) // => Output: POST /notes -> 201 {"id":"n1","text":"first"}
	// => replace overwrites whole: the read must show the second text
	leg(router, "PUT", "/notes/n1", `{"text":"second"}`) // => Output: PUT /notes/n1 -> 200 {"id":"n1","text":"second"}
	// => the read proves both writes: second, not first (co-09)
	leg(router, "GET", "/notes/n1", "") // => Output: GET /notes/n1 -> 200 {"id":"n1","text":"second"}
	// => unknown ids read 404: the trip ends at absence too
	leg(router, "GET", "/notes/n9", "") // => Output: GET /notes/n9 -> 404 {"error":"no note"}
}
