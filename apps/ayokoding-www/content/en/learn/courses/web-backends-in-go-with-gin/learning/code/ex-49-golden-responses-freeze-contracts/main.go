// => Example 49: Golden Responses Freeze Contracts.
// => Exact-body comparison freezes the contract: any byte change fails
// => loudly. This example serves a versioned status document, compares
// => three responses against frozen strings, and prints the verdict each
// => comparison earns.
package main

import (
	"fmt"                      // => prints one verdict per golden
	"github.com/gin-gonic/gin" // => the status document under test (co-09)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => newRouter serves one versioned status document and one greeting.
// => the document is the contract: goldens freeze it byte for byte
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                    // => silence the debug banner for golden output
	router := gin.New()                          // => bare engine: no hidden middleware
	router.GET("/status", func(c *gin.Context) { // => the frozen document
		c.JSON(200, gin.H{"service": "shop", "version": "1.4.2", "ok": true}) // => every key frozen below (co-04)
	})
	router.GET("/hello/:name", func(c *gin.Context) { // => the greeting beside it
		c.JSON(200, gin.H{"message": "hello, " + c.Param("name")}) // => one moving part: the name
	})
	return router // => hand the wired engine back
}

// => checkGolden serves one GET and compares the body against its frozen string.
// => goldens live in the test, not in files: three small contracts inline
func checkGolden(router *gin.Engine, tag string, target string, golden string) { // => tag names the contract
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                    // => the assertion surface
	router.ServeHTTP(w, req)                       // => full pipeline, minus the network (co-09)
	// => exact match on status and body: goldens forgive nothing
	if w.Code != 200 || w.Body.String() != golden { // => any drift fails the contract
		fmt.Println("FAIL", tag, "got", w.Code, w.Body.String()) // => the tag plus the drifted bytes
		return                                                   // => drift recorded: the contract changed somewhere
	}
	fmt.Println("PASS", tag) // => byte-identical: the contract stands
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => the status document matches its frozen bytes exactly
	checkGolden(router, "status frozen", "/status", `{"ok":true,"service":"shop","version":"1.4.2"}`) // => Output: PASS status frozen
	// => greetings freeze per name: Sari's bytes are Sari's alone
	checkGolden(router, "sari frozen", "/hello/Sari", `{"message":"hello, Sari"}`) // => Output: PASS sari frozen
	// => Budi's bytes differ from Sari's golden: the drift fails loudly
	checkGolden(router, "budi vs sari golden", "/hello/Budi", `{"message":"hello, Sari"}`) // => Output: FAIL budi vs sari golden got 200 {"message":"hello, Budi"}
}
