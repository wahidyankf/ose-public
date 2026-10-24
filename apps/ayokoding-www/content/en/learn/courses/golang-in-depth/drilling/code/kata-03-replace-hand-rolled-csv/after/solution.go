// Solution: encoding/csv parses quotes correctly, stdlib-first.
// => csv.Reader honors quoted commas: the exact case the starter mangled
// => three fields out: city stays whole, quotes consumed as syntax, not data
package main

import (
	"encoding/csv" // => Reader: the stdlib CSV parser, quotes handled
	"fmt"          // => prints the three correct fields plus their count
	"strings"      // => NewReader: feeds the fixed line to the CSV parser
)

func main() {
	// => same tricky line: quoted comma inside the city field, unchanged
	line := `sari,"jakarta, indonesia",41` // => three fields: the honest count
	// => csv.Reader over the line: quotes become syntax, not field content
	r := csv.NewReader(strings.NewReader(line)) // => in-memory: no file needed
	// => Read returns one record: all fields, quotes resolved, commas kept
	fields, err := r.Read() // => three fields: the parser earns its keep here
	// => fixed input parses cleanly: errors mean malformed CSV, never here
	if err != nil { // => unreachable: the line is valid CSV by construction
		fmt.Println("unexpected:", err) // => kept: real inputs check this
		return                          // => nothing valid to print on failure
	}
	// => city whole, quotes gone: the parser consumed syntax, kept data
	fmt.Println(len(fields), fields) // => Output: 3 [sari jakarta, indonesia 41]
}
