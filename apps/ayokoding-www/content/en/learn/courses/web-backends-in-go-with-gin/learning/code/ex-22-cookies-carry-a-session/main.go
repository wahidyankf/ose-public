// => Example 22: Cookies Carry a Session.
// => Cookies keep client state across requests without a server store. This
// => example logs a user in by setting a session cookie, greets the holder
// => on the next request, and answers 401 when the cookie is absent.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => SetCookie and Cookie helpers (co-04)
	"net/http"                 // => cookie attributes and status codes (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => login sets the session cookie for one fixed user.
// => the cookie value names the user: a real service would sign it
func login(c *gin.Context) { // => the login endpoint owns the cookie
	// => HttpOnly keeps scripts away; Path=/ sends it on every route
	c.SetCookie("session", "sari", 3600, "/", "", false, true) // => one hour, this host, no JS (co-04)
	c.String(http.StatusOK, "logged in as sari")               // => the receipt names the holder
}

// => greet reads the session cookie and answers only when it is present.
// => Cookie returns ErrNoCookie for anonymous requests: 401, not 500
func greet(c *gin.Context) { // => the guarded endpoint trusts the cookie
	who, err := c.Cookie("session") // => empty string plus an error when absent
	if err != nil || who == "" {    // => anonymous requests stop here
		c.JSON(http.StatusUnauthorized, gin.H{"error": "login first"}) // => 401 names the fix (co-05)
		return                                                         // => no cookie, no greeting
	}
	c.String(http.StatusOK, "hello, "+who) // => the holder is greeted by name
}

// => newRouter wires the login and greeting routes this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)    // => silence the debug banner for golden output
	router := gin.New()          // => bare engine: no hidden middleware
	router.POST("/login", login) // => POST because logging in changes state
	router.GET("/hello", greet)  // => GET because greeting only reads
	return router                // => hand the wired engine back
}

// => check serves one request with an optional cookie and prints the answer.
// => the cookie travels in the Cookie header exactly like a browser sends
func check(router *gin.Engine, method string, target string, cookie string) { // => empty cookie means anonymous
	req := httptest.NewRequest(method, target, nil) // => server-side request, no socket
	if cookie != "" {                               // => named holders send their session
		req.Header.Set("Cookie", cookie) // => the browser's half of the contract
	}
	w := httptest.NewRecorder() // => in-memory response capture
	router.ServeHTTP(w, req)    // => cookie logic runs inside
	// => the Set-Cookie header matters on login: print it beside the body
	line := fmt.Sprintf("%s %s cookie=%s -> %d set=%s", method, target, short(cookie), w.Code, short(w.Header().Get("Set-Cookie"))) // => status core: always present
	if w.Body.String() != "" {                                                                                                      // => every answer here has a body
		line += " " + w.Body.String() // => bodies join with one space
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

// => short trims long header values for the log line.
// => cookies carry attributes: only the name=value head is printed
func short(v string) string { // => empty stays empty: anonymous shows cookie=
	if len(v) > 14 { // => session=sari plus attributes exceeds the window
		return v[:14] + "..." // => the head identifies the value
	}
	return v // => short values print whole
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => anonymous greeting fails: no cookie, no name, 401 (co-05)
	check(router, "GET", "/hello", "") // => Output: GET /hello cookie= -> 401 set= {"error":"login first"}
	// => login sets the session: the Set-Cookie head proves the attributes
	check(router, "POST", "/login", "") // => Output: POST /login cookie= -> 200 set=session=sari; ... logged in as sari
	// => the holder returns with the cookie: greeted by name
	check(router, "GET", "/hello", "session=sari") // => Output: GET /hello cookie=session=sari -> 200 set= hello, sari
}
