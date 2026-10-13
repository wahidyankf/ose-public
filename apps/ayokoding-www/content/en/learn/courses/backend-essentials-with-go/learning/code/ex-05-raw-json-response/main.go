// Example 5: Raw JSON Response.
//
// JSON is text on the wire: a typed Go value is serialized to bytes by an
// explicit encoding/json call, and the Content-Length must be computed by
// hand because no framework exists yet to compute it (co-09).
package main

import (
	"bufio"         // => request-side line reading
	"encoding/json" // => the standard library's JSON encoder (co-09)
	"fmt"           // => operator-facing startup messages
	"net"           // => raw TCP (co-06)
	"strconv"       // => turns the computed byte count into header text
)

// handleConn serializes a Go value, sizes it, and writes the full response.
func handleConn(conn net.Conn) { // => one request, one JSON answer, one close
	defer conn.Close()

	reader := bufio.NewReader(conn)
	for { // => drain the request head before replying, as in Example 1
		line, err := reader.ReadString('\n')
		if err != nil || line == "\r\n" { // => blank line ends the request head
			break
		}
	}
	payload := map[string]any{"msg": "hello", "code": 1} // => an ordinary typed Go value...
	body, err := json.Marshal(payload)                   // => ...serialized to JSON bytes by hand (co-09)
	if err != nil {                                      // => Marshal fails only for unencodable types
		fmt.Println("marshal:", err) // => e.g. a channel or function value in the map
		return                       // => no response at all: the connection just closes
	}
	// => encoding/json sorts map keys: "code" lands before "msg" on the wire
	reply := "HTTP/1.1 200 OK\r\n" +
		"Content-Type: application/json\r\n" + // => tells the client THIS body is JSON (co-09)
		"Content-Length: " + strconv.Itoa(len(body)) + "\r\n" + // => computed, not guessed
		"Connection: close\r\n" +
		"\r\n" +
		string(body) // => the serialized JSON, appended after the blank line
	conn.Write([]byte(reply)) // => the whole JSON response, one write
}

func main() {
	listener, err := net.Listen("tcp", "127.0.0.1:8000") // => same bind as Examples 1-4
	if err != nil {
		fmt.Println("listen:", err)
		return
	}
	fmt.Println("listening on 127.0.0.1:8000")

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Println("accept:", err)
			continue
		}
		handleConn(conn) // => one JSON response per connection
	}
}
