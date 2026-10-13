// Example 3: Raw Set Header.
//
// A response header is just text above the blank line. This example sets
// exactly one Content-Type header by hand and confirms curl receives it --
// there is no queue-then-flush step at this layer: bytes go out in the
// order they are written, and that order IS the syntax (co-04).
package main

import (
	"bufio" // => request-side line reading, unchanged from Example 1
	"fmt"   // => operator-facing startup messages
	"net"   // => raw TCP (co-06)
)

// rawResponse writes status line, ONE header, the blank line, and a body --
// in exactly that order, because the wire order is the syntax (co-04).
var rawResponse = "HTTP/1.1 200 OK\r\n" + // => status line first, always
	"Content-Type: text/plain\r\n" + // => the ONE header this example sets
	"\r\n" + // => the blank line ends the header block
	"plain text body" // => a body that matches that Content-Type
// => with no Content-Length, the close below is what ends the body

// handleConn drains the request head, then answers with the fixed response.
func handleConn(conn net.Conn) { // => one connection per call, as before
	defer conn.Close() // => the close that delimits the body arrives last

	// => same drain as Examples 1 and 2: consume the request head up to
	// => its blank line so the reply is not racing unread request bytes
	reader := bufio.NewReader(conn)
	for {
		line, err := reader.ReadString('\n') // => one header line per pass
		if err != nil {                      // => stream ended early
			break // => reply regardless; the head is as drained as it gets
		}
		if line == "\r\n" {
			break // => request fully received: answer, then hang up
		}
	}
	conn.Write([]byte(rawResponse)) // => the header text travels with the very bytes
	// => a client can now treat this body as text/plain -- that header is
	// => metadata the client reads BEFORE it reads the body (co-04)
}

func main() {
	listener, err := net.Listen("tcp", "127.0.0.1:8000") // => same bind as Examples 1 and 2
	if err != nil {
		fmt.Println("listen:", err) // => report the bind failure and exit
		return
	}
	fmt.Println("listening on 127.0.0.1:8000") // => curl in a second terminal

	for {
		conn, err := listener.Accept() // => blocks until the next dial-in
		if err != nil {
			fmt.Println("accept:", err)
			continue
		}
		handleConn(conn) // => serve, then take the next connection
	}
}
