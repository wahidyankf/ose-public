// Kata 01: Parse a raw HTTP request line.
//
// A request line is three space-separated tokens: method, path, version.
// net/http parses this for you on every request; this kata parses it by
// hand once so the ServeMux dispatch in later katas reads as shorthand.
package main

import (
	"fmt"     // => prints the parsed parts and the rejection proof
	"log"     // => fail-fast on any self-check mismatch
	"strings" // => TrimSpace + Split isolate the three tokens
)

// ParseRequestLine splits "GET /items/5 HTTP/1.1" into its parts.
func ParseRequestLine(line string) (string, string, string, error) { // => co-01: request = method + path + version
	parts := strings.Split(strings.TrimSpace(line), " ") // => splits "GET /items/5 HTTP/1.1" into whitespace-separated fields
	if len(parts) != 3 {                                 // => a well-formed line has exactly 3 tokens
		return "", "", "", fmt.Errorf("malformed request line: %q", line) // => not a shape a server should ever accept
	}
	method, path, version := parts[0], parts[1], parts[2] // => unpack in RFC 9110 order: method, target, version
	return method, path, version, nil                     // => the caller gets the three parts a handler dispatches on
}

func main() {
	line := "GET /items/5 HTTP/1.1" // => a mocked raw line, never touching a socket
	method, path, version, err := ParseRequestLine(line)
	if err != nil { // => the happy path must never fail
		log.Fatalf("parse %q: %v", line, err)
	}
	fmt.Println(method, path, version) // => Output: GET /items/5 HTTP/1.1

	if method != "GET" { // => the verb carrying read semantics
		log.Fatalf("method = %q, want GET", method)
	}
	if path != "/items/5" { // => the resource, with a path param baked in
		log.Fatalf("path = %q, want /items/5", path)
	}
	if version != "HTTP/1.1" { // => the protocol version token
		log.Fatalf("version = %q, want HTTP/1.1", version)
	}

	_, _, _, err = ParseRequestLine("not a valid line") // => four tokens, so malformed
	raised := err != nil                                // => malformed input is rejected loudly
	fmt.Println(raised)                                 // => Output: True
	if !raised {                                        // => silence would be a mis-parse
		log.Fatalf("expected error for malformed line")
	}
	fmt.Println("kata-01 OK") // => the self-check line this track greps for
}
