// => Example 19: JSON Keys Follow a Contract.
// => JSON tags decide exactly which keys leave the server, hiding internals
// => and renaming fields for clients. This example serves a user with a
// => hidden password hash and renamed keys, then prints the contracted shape
// => beside the raw struct.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => JSON rendering of tagged structs (co-04, co-15)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => User is the stored shape: everything the service knows, not what it says.
// => unexported fields never serialize; tags rename the exported ones (co-15)
type User struct { // => storage and wire are two different contracts
	ID           string // => no tag: the key stays "ID", stable and short
	DisplayName  string `json:"name"`            // => clients see name, not DisplayName
	Email        string `json:"email,omitempty"` // => empty emails vanish from the body
	passwordHash string // => unexported: encoding/json cannot see it at all
}

// => user serves the stored user through its JSON contract.
// => the same struct serves storage and wire: tags draw the line (co-15)
func user(c *gin.Context) { // => the handler assembles the stored value
	// => the hash exists in memory but never crosses the boundary
	u := User{ID: "u1", DisplayName: "Sari", Email: "", passwordHash: "sha256:secret"} // => full stored shape
	c.JSON(200, u)                                                                     // => tags decide the keys: ID, name, and no email (co-04)
}

// => newRouter wires the single user route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)     // => silence the debug banner for golden output
	router := gin.New()           // => bare engine: no hidden middleware
	router.GET("/users/u1", user) // => one path, contracted JSON out (co-04)
	return router                 // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => full pipeline, minus the socket
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => name is renamed, email is omitted when empty, the hash never leaves (co-15)
	check(router, "/users/u1") // => Output: GET /users/u1 -> 200 {"ID":"u1","name":"Sari"}
}
