// Example 4: Raw Read Path.
//
// The request line arrives as space-separated tokens: method, path,
// protocol. Parsing it by hand and branching on the path with a plain
// if/else chain is the manual version of a framework router (co-12).
package main

import (
	"bufio"   // => reading the request head one line at a time
	"fmt"     // => operator-facing startup messages
	"net"     // => raw TCP (co-06)
	"strings" // => whitespace splitting of the request line (co-12)
)

// requestPath extracts ONLY the path token from a request line.
func requestPath(line string) string { // => a helper so the routing branch reads plainly
	fields := strings.Fields(line) // => splits "GET /a HTTP/1.1" on whitespace runs
	// => token 1 is the method, token 2 the path, token 3 the protocol
	if len(fields) < 2 { // => a mangled request line has no path token at all
		return "" // => the caller routes "" straight into the fallback branch
	}
	return fields[1] // => the raw path: "/a", "/b", or "/b?x=1" verbatim
}

// handleConn parses the request line, routes on it, and writes one answer.
func handleConn(conn net.Conn) { // => raw tier: one request, one reply, one close
	defer conn.Close()

	reader := bufio.NewReader(conn)
	first, err := reader.ReadString('\n') // => the FIRST line is the request line (co-12)
	if err != nil {                       // => a dead stream has no request worth answering
		return // => nothing sane to reply to; the deferred close ends it
	}
	path := requestPath(first) // => the parsed path, e.g. "/a" or "/b?x=1"
	var body string            // => selected by the if/else router below
	if path == "/a" {
		body = "route a" // => exact match: ONLY "/a" gets this body
	} else if path == "/b" {
		body = "route b" // => a second, independent exact match
	} else {
		body = "unknown route" // => "/", "/c", "/a/nested" all land here
	}
	for { // => still drain the REST of the request head before replying
		line, err := reader.ReadString('\n')
		if err != nil || line == "\r\n" { // => blank line: headers are done
			break
		}
	}
	reply := "HTTP/1.1 200 OK\r\n" + // => status first, as in every raw example
		"Content-Type: text/plain\r\n" + // => every branch answers plain text
		"Connection: close\r\n" + // => announces the close that follows
		"\r\n" +
		body // => whichever route the if/else chain selected
	conn.Write([]byte(reply)) // => the routed answer, one write
}

func main() {
	listener, err := net.Listen("tcp", "127.0.0.1:8000") // => the same bind as before
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
		handleConn(conn) // => one request parsed and routed per connection
	}
}
