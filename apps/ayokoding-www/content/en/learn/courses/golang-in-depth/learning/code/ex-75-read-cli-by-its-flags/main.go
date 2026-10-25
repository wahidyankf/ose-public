// Example 75: Read a CLI by Its Flags.
//
// The flag package declares a CLI's surface as variables with defaults and
// usage strings. Fixed args keep this run deterministic; the shape is real.
package main

import (
	"flag" // => NewFlagSet, String, Int: the declaration surface
	"fmt"  // => prints the greeting exactly n times, then the parsed values
)

func main() {
	// => own FlagSet (not the global): testable, no os.Args touched, ever
	fs := flag.NewFlagSet("greet", flag.ContinueOnError) // => named set, safe errors
	// => declarations ARE the interface: name, default, usage, one line each
	name := fs.String("name", "tamu", "who to greet")      // => string flag, tamu default
	count := fs.Int("n", 1, "how many greetings to print") // => int flag, 1 default
	// => fixed args stand in for the command line: deterministic by construction
	// => real CLIs pass os.Args[1:]; examples pass literals for reproducibility
	if err := fs.Parse([]string{"-name=sari", "-n=2"}); err != nil { // => parse
		fmt.Println("flags:", err) // => unreachable: fixed args are valid
		return                     // => parse failure: usage already printed
	}
	// => parsed values drive behavior: greet *name exactly *count times
	for i := 0; i < *count; i++ { // => dereference: flags are pointers by design
		fmt.Println("halo,", *name) // => Output twice: halo, sari
	}
}
