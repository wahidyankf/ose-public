// => Example 74: Dependency Injection Styles.
// => FastAPI injects with Depends parameters on each handler; Gin injects
// => with constructors and closures that tests call directly. This example
// => builds one greeter service through a constructor taking the dependency
// => and prints both languages' answers from two builds.
package main

import (
	"fmt"                      // => prints each build's answer
	"github.com/gin-gonic/gin" // => constructor injection, Gin style (co-06, co-16)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => Dictionary translates one word; the dependency below, not the service.
// => the leaf dependency: fastapi would Depends() this, Gin passes it
type Dictionary struct { // => words in, translations out
	words map[string]string // => the lookup table, fixed per instance
}

// => Translate returns the word's translation or the word itself.
// => unknown words pass through: dictionaries degrade honestly
func (d *Dictionary) Translate(word string) string { // => the leaf lookup
	if t, ok := d.words[word]; ok { // => known words translate
		return t // => the translation wins
	}
	return word // => unknown words pass through unchanged
}

// => Greeter serves greetings through its dictionary: the service.
// => depends on *Dictionary: construction supplies it (co-06)
type Greeter struct { // => the service under test
	dict *Dictionary // => the injected leaf, never constructed inside
	lang string      // => en answers English, id answers Indonesian
}

// => NewGreeter builds the service from its dependencies.
// => the FastAPI Depends() equivalent: requirements as parameters
func NewGreeter(dict *Dictionary, lang string) *Greeter { // => dependencies in, service out (co-16)
	return &Greeter{dict: dict, lang: lang} // => stored, not built: injection, not construction
}

// => Greet renders hello in the service language through the dictionary.
// => handlers call this: business logic, no framework in sight
func (g *Greeter) Greet(name string) string { // => the pure domain method
	if g.lang == "id" { // => Indonesian when configured so
		return "halo, " + name // => the second language this demo speaks
	}
	return g.dict.Translate("hello") + ", " + name // => English through the dictionary
}

// => newRouter wires one route per greeter build.
// => two builds, two languages: the route table serves both (co-16)
func newRouter(en *Greeter, id *Greeter) *gin.Engine { // => both services arrive injected
	gin.SetMode(gin.TestMode)                                                                  // => silence the debug banner for golden output
	router := gin.New()                                                                        // => bare engine: no hidden middleware
	router.GET("/en/:name", func(c *gin.Context) { c.String(200, en.Greet(c.Param("name"))) }) // => English closure
	router.GET("/id/:name", func(c *gin.Context) { c.String(200, id.Greet(c.Param("name"))) }) // => Indonesian closure
	return router                                                                              // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the language prefix is the variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => injected services serve (co-09)
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	// => one shared dictionary, two greeters: the leaf is built once
	dict := &Dictionary{words: map[string]string{"hello": "hello"}} // => identity translation, honest
	en := NewGreeter(dict, "en")                                    // => English service around the dictionary
	id := NewGreeter(dict, "id")                                    // => Indonesian service around the same dictionary
	router := newRouter(en, id)                                     // => wiring separate from traffic, as always
	// => each build answers in its language: injection decides, not code (co-06)
	check(router, "/en/Sari") // => Output: GET /en/Sari -> 200 hello, Sari
	check(router, "/id/Sari") // => Output: GET /id/Sari -> 200 halo, Sari
}
