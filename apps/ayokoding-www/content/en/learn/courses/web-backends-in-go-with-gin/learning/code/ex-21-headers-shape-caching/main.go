// => Example 21: Headers Shape Caching.
// => Cache headers let clients and proxies skip work they already did. This
// => example serves a versioned document with an ETag, answers full content
// => on a miss, and answers 304 with no body when the client's copy matches.
package main

import (
	"crypto/sha256"            // => stable content hash for the ETag (co-04)
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => conditional responses with headers (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => document is the fixed content every check negotiates about.
// => constant bytes mean a constant ETag: caching stays deterministic
var document = []byte("the quick brown fox") // => eighteen bytes, never edited

// => etagOf hashes content into the quoted form ETags require.
// => sha256 is stable: same bytes, same tag, every run (co-04)
func etagOf(body []byte) string { // => hex in quotes, per the HTTP rule
	// => Sum256 returns thirty-two bytes: hex prints sixty-four digits
	return fmt.Sprintf("%q", fmt.Sprintf("%x", sha256.Sum256(body))) // => "hash" with quotes
}

// => doc serves the document, or 304 when the client already holds it.
// => If-None-Match carries the client's copy: match means skip the body
func doc(c *gin.Context) { // => one route, two outcomes by header
	tag := etagOf(document) // => recomputed per request: cheap and always fresh
	// => Cache-Control names the policy: an hour of public caching
	c.Header("Cache-Control", "public, max-age=3600") // => proxies may store this
	// => the client's tag matches ours: nothing new to send
	if c.GetHeader("If-None-Match") == tag { // => exact match, quotes included
		c.Status(304) // => not modified: headers only, no body (co-04)
		return        // => the client's copy is current: stop here
	}
	// => miss or no tag: serve the body with its ETag attached
	c.Header("ETag", tag)               // => the client stores this for next time
	c.Data(200, "text/plain", document) // => full content on first sight (co-04)
}

// => newRouter wires the single document route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	router.GET("/doc", doc)   // => one path, conditional responses (co-04)
	return router             // => hand the wired engine back
}

// => check serves one GET with an optional ETag and prints the answer.
// => the tag travels in If-None-Match: empty means a first visit
func check(router *gin.Engine, tag string) { // => empty tag exercises the miss path
	req := httptest.NewRequest("GET", "/doc", nil) // => fixed path, varying header
	if tag != "" {                                 // => absent header means no cached copy
		req.Header.Set("If-None-Match", tag) // => the client's stored copy
	}
	w := httptest.NewRecorder() // => in-memory response capture
	router.ServeHTTP(w, req)    // => conditional logic runs inside
	// => the ETag response header matters on a miss: print it beside the body
	line := fmt.Sprintf("GET /doc tag=%s -> %d etag=%s", short(tag), w.Code, short(w.Header().Get("ETag"))) // => both tags trimmed for the log
	if w.Body.String() != "" {                                                                              // => 304 carries no body
		line += " " + w.Body.String() // => misses join their eighteen bytes
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

// => short trims a tag for the log line: full hashes would drown the lesson.
// => first eight hex digits identify the tag without printing sixty-four
func short(tag string) string { // => empty stays empty: the miss path shows tag=
	if len(tag) > 10 { // => quoted hashes are long: trim inside the quotes
		return tag[:9] + "..." // => opening quote plus eight digits
	}
	return tag // => empty and short tags print as they are
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => first visit, no tag: full body with its ETag and cache policy
	check(router, "") // => Output: GET /doc tag= -> 200 etag="9ecb3656... the quick brown fox
	// => same tag back: 304 with no body and no ETag repeat (co-04)
	check(router, `"9ecb36561341d18eb65484e833efea61edc74b84cf5e6ae1b81c63533e25fc8f"`) // => Output: GET /doc tag="9ecb3656... -> 304 etag=
	// => a stale tag mismatches: full body again, like a first visit
	check(router, `"stale"`) // => Output: GET /doc tag="stale" -> 200 etag="9ecb3656... the quick brown fox
}
