// => Example 27: Abort Stops the Chain.
// => Auth middleware answers 401 itself when the credential is missing, so
// => the handler never runs for strangers. This example guards one route
// => with a bearer check, prints the blocked request and the admitted one,
// => and leaves a public route unwrapped.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => aborting middleware (co-02)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => requireUser blocks requests without the fixed bearer token.
// => AbortWithStatusJSON answers here: later handlers never run (co-02)
func requireUser(c *gin.Context) { // => the guard every private route names
	// => the Authorization header carries "Bearer <token>" by convention
	if c.GetHeader("Authorization") != "Bearer s3cret" { // => one fixed token for the demo
		// => Abort stops the chain AND writes the answer in one call
		c.AbortWithStatusJSON(401, gin.H{"error": "missing or bad token"}) // => 401 with the envelope (co-04, co-05)
		return                                                             // => the handler below never runs for strangers
	}
	c.Set("user", "sari") // => admitted requests carry their identity onward
	c.Next()              // => the chain continues to the handler
}

// => profile answers with the identity the guard admitted.
// => reaching this handler proves the token was valid (co-02)
func profile(c *gin.Context) { // => guards run first, handlers trust after
	who, _ := c.Get("user")         // => set by requireUser, never by strangers
	c.JSON(200, gin.H{"user": who}) // => the private answer (co-04)
}

// => newRouter guards one route and leaves one public.
// => middleware applies per route: only secrets need guards (co-02)
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: middleware added by hand
	// => the guard sits between the method and the handler: in that order
	router.GET("/profile", requireUser, profile)                              // => guarded: strangers stop here
	router.GET("/public", func(c *gin.Context) { c.String(200, "everyone") }) // => public: no guard at all
	return router                                                             // => hand the wired engine back
}

// => check serves one GET with an optional token and prints the answer.
// => the token travels in Authorization: empty means a stranger
func check(router *gin.Engine, target string, token string) { // => empty token exercises the block
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	if token != "" {                               // => named holders send their bearer
		req.Header.Set("Authorization", "Bearer "+token) // => the credential under test
	}
	w := httptest.NewRecorder()                                                // => in-memory response capture
	router.ServeHTTP(w, req)                                                   // => the guard runs before the handler
	fmt.Println("GET", target, "token=", token, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => no token: the guard aborts and the handler never runs (co-02)
	check(router, "/profile", "") // => Output: GET /profile token=  -> 401 {"error":"missing or bad token"}
	// => wrong token: same 401, same envelope, no hint about the secret
	check(router, "/profile", "guess") // => Output: GET /profile token= guess -> 401 {"error":"missing or bad token"}
	// => the fixed token admits: the guard sets the identity onward
	check(router, "/profile", "s3cret") // => Output: GET /profile token= s3cret -> 200 {"user":"sari"}
	// => the public route answers everyone: guards wrap only secrets
	check(router, "/public", "") // => Output: GET /public token=  -> 200 everyone
}
