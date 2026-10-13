// Example 6: Raw 404.
//
// A raw handler decides its own status code by hand: 200 for the one known
// path, 404 for everything else. `curl -o /dev/null -w '%{http_code}'`
// verifies the exact numeric status the syllabus's acceptance criterion
// asks for, instead of eyeballing full responses.
package main

import (
	"bufio"   // => reading the request head
	"fmt"     // => operator-facing startup messages
	"net"     // => raw TCP (co-06)
	"strconv" // => Content-Length is computed, not guessed
	"strings" // => whitespace splitting of the request line (co-12)
)

// requestPath extracts the path token from a request line, as in Example 4.
func requestPath(line string) string { // => copied here so the example stays self-contained
	fields := strings.Fields(line) // => "GET /known HTTP/1.1" -> ["GET", "/known", "HTTP/1.1"]
	if len(fields) < 2 {           // => a mangled request line has no path token
		return ""
	}
	return fields[1] // => the raw path, exactly as the client typed it
}

// handleConn routes on the path and writes 200 or 404 by hand (co-03).
func handleConn(conn net.Conn) { // => one request, one hand-picked status
	defer conn.Close()

	reader := bufio.NewReader(conn)
	first, err := reader.ReadString('\n') // => the request line comes first
	if err != nil {                       // => no request line, no answer to give
		return // => the deferred close ends the connection quietly
	}
	path := requestPath(first) // => "/known", or anything else
	status := "HTTP/1.1 404 Not Found\r\n"
	body := "not found"
	// => RFC 9110: 404 means "the origin server did not find a
	// => current representation for the target resource" (co-03)
	if path == "/known" { // => the ONE path this server recognizes
		status = "HTTP/1.1 200 OK\r\n" // => a real resource -- 200 OK
		body = "found it"              // => confirms the known route ran
	}
	for { // => drain the remaining request head before replying
		line, err := reader.ReadString('\n')
		if err != nil || line == "\r\n" {
			break
		}
	}
	reply := status +
		"Content-Type: text/plain\r\n" + // => both branches answer plain text
		"Content-Length: " + strconv.Itoa(len(body)) + "\r\n" + // => sized per branch
		"Connection: close\r\n" +
		"\r\n" +
		body // => "found it" or "not found", whichever branch won
	conn.Write([]byte(reply)) // => the branch's status line and body, one write
}

func main() {
	listener, err := net.Listen("tcp", "127.0.0.1:8000") // => same bind as Examples 1-5
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
		handleConn(conn) // => one routed, status-picked answer per connection
	}
}
