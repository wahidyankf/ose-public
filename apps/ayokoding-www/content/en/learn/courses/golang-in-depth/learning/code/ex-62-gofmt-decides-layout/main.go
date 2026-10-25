// Example 62: gofmt Decides the Layout.
//
// Formatting debates end where gofmt begins: tabs, alignment, import grouping.
// The go/format package runs that same formatter as a library, shown here.
package main

import (
	"fmt"       // => prints the canonical bytes the formatter produces
	"go/format" // => Source: the gofmt algorithm itself, callable in-process
)

func main() {
	// => deliberately ugly: extra spaces, misaligned, the shape gofmt forbids
	ugly := "package main\n\nimport  \"fmt\"\n\nfunc  main()  { fmt.Println(  1 ) }\n"
	// => Source parses AND formats: syntax errors return as errors, not output
	canonical, err := format.Source([]byte(ugly)) // => the gofmt decision
	// => ugly but VALID input formats fine: errors mean broken syntax, not style
	if err != nil { // => unreachable: the input is ugly, not ungrammatical
		fmt.Println("unexpected:", err) // => kept: real callers check this
		return                          // => no canonical bytes exist to print
	}
	// => canonical gofmt output: double spaces collapsed, imports grouped tightly
	// => bodies stay one line: gofmt aligns tokens, it never reflows statements
	fmt.Print(string(canonical)) // => prints: package main, grouped import, one-line main
}
