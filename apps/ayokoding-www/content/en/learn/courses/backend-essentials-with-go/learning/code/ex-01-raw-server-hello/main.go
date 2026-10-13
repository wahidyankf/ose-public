// Example 1: Raw Server Hello.
//
// An HTTP response is a fixed sequence of bytes: status line, headers, a
// blank line, then the body. This example writes every byte by hand on a
// raw TCP connection -- no net/http anywhere yet.
package main

import (
	"bufio" // => reads the request side line by line -- it parses nothing itself
	"fmt"   // => the operator-facing startup messages only
	"net"   // => the raw TCP toolkit this example and the next five run on (co-06)
)

// rawResponse is the entire reply, assembled by hand in wire order.
var rawResponse = "HTTP/1.1 200 OK\r\n" + // => status line: protocol, code, reason phrase (co-01)
	"Content-Type: text/plain\r\n" + // => one header: how the client should read the body
	"Content-Length: 5\r\n" + // => a second header: exactly how many body bytes follow
	"\r\n" + // => the blank line RFC 9110 requires to end the header block
	"hello" // => the body itself -- the 5 bytes promised above
// => every byte above is written by this program (co-01); a framework would
// => compose status line, headers, blank line, and body invisibly (co-06)

// handleConn serves one accepted TCP connection, start to finish.
func handleConn(conn net.Conn) { // => net.Conn is a bare, untyped, two-way byte pipe
	defer conn.Close() // => one reply per connection, then this server hangs up

	// => draining (not parsing) the request head first avoids a socket race:
	// => closing while bytes remain unread can reset the connection and
	// => destroy the reply already on its way, so read until the blank line
	reader := bufio.NewReader(conn) // => buffered line reader over that raw pipe
	for {
		line, err := reader.ReadString('\n') // => one full line, newline included
		// => ReadString hands back the line WITH its trailing newline
		if err != nil { // => the stream ended mid-request
			break // => whatever arrived is enough; the reply is written next
		}
		if line == "\r\n" { // => a lone CRLF marks end-of-headers (co-01)
			break // => the request head is fully consumed -- safe to answer
		}
	}
	conn.Write([]byte(rawResponse)) // => the ENTIRE response, one write, bytes only
	// => conn.Write accepts bytes, not string: the wire is a byte stream
}

func main() {
	// => bind localhost:8000 -- this tier has no TLS, no routing, no framework
	listener, err := net.Listen("tcp", "127.0.0.1:8000") // => err is non-nil when the port is taken
	if err != nil {                                      // => Go never panics on bind failure: you handle it
		fmt.Println("listen:", err) // => say exactly why the process is exiting
		return                      // => nothing is listening, so nothing to clean up
	}
	fmt.Println("listening on 127.0.0.1:8000") // => the operator's green light

	for { // => a server loop: one Accept per pass, forever
		conn, err := listener.Accept() // => BLOCKS until curl dials in
		// => conn is that one accepted connection; err covers Accept failures
		if err != nil { // => one failed accept must not kill the server
			fmt.Println("accept:", err) // => log it and move on
			continue                    // => drop this connection, serve the next
		}
		handleConn(conn) // => serve this connection to completion, then loop
	}
}
