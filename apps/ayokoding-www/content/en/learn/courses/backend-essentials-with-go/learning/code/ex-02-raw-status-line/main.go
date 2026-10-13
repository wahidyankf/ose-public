// Example 2: Raw Status Line.
//
// A technically complete HTTP response needs surprisingly little: a status
// line, the blank line that closes the (empty) header block, and a body.
// This example sends exactly that and nothing more, so `curl -i` shows
// only the two lines this program actually wrote.
package main

import (
	"bufio" // => request-side line reading, as in Example 1
	"fmt"   // => operator-facing startup messages
	"net"   // => raw TCP, still nothing above it (co-06)
)

// rawResponse is the entire reply: a status line plus the end-of-headers
// blank line. Not one header is sent, and curl still accepts this reply.
var rawResponse = "HTTP/1.1 200 OK\r\n" + // => the status line, complete on its own
	"\r\n" + // => the blank line closes the EMPTY header block (co-01)
	"status ok" // => a close-delimited body: no Content-Length measures it
// => the connection close below is what tells curl the body has ended
// => note the version: HTTP/1.1 is on the wire because WE typed it

// handleConn replies to one connection with the three-part response above.
func handleConn(conn net.Conn) { // => one call per accepted TCP connection
	defer conn.Close() // => close-delimiting: the close itself ends the body

	// => drain the request head before answering, exactly as Example 1 did:
	// => an unread request can turn this close into a connection reset,
	// => which would race curl's read of a perfectly valid reply
	reader := bufio.NewReader(conn) // => buffered over the raw byte pipe
	for {
		line, err := reader.ReadString('\n') // => one header line at a time
		if err != nil {                      // => the stream cut off mid-head
			break // => enough arrived to justify a reply
		}
		if line == "\r\n" { // => blank line: the request head is fully consumed
			break // => safe to respond and hang up
		}
	}
	conn.Write([]byte(rawResponse)) // => status line + blank line + body, one write
	// => nothing was added around it: no Date, no Server -- raw tier only
	// => sends what this program explicitly wrote (co-06)
}

func main() {
	listener, err := net.Listen("tcp", "127.0.0.1:8000") // => the same bind as Example 1
	if err != nil {                                      // => the port may still be held by a previous example
		fmt.Println("listen:", err) // => report and exit rather than fake success
		return
	}
	fmt.Println("listening on 127.0.0.1:8000") // => start curl in a second terminal

	for {
		conn, err := listener.Accept() // => one connection per iteration
		if err != nil {
			fmt.Println("accept:", err)
			continue
		}
		handleConn(conn) // => a full request/response cycle, then loop again
	}
}
