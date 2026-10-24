// Example 24: Parse and Format Time.
//
// Go formats with a reference layout (Mon Jan 2 15:04:05 MST 2006) instead of
// % codes. Memorize the reference once: month 1, day 2, hour 3, minute 4.
package main

import (
	"fmt"  // => prints the parsed date in two renderings plus its weekday
	"time" // => Date, Parse, and Format: the fixed-clock toolkit below
)

func main() {
	// => fixed invoice date: constants keep the run deterministic, no clock
	invoice := time.Date(2026, time.October, 21, 9, 30, 0, 0, time.UTC) // => Oct 21
	// => layout "2006-01-02": the reference date rearranged into ISO order
	fmt.Println(invoice.Format("2006-01-02")) // => Output: 2026-10-21
	// => longer layout: full month name plus zero-padded day, same instant
	fmt.Println(invoice.Format("02 January 2006")) // => Output: 21 October 2026
	// => Weekday derives from the date: no lookup table needed anywhere
	fmt.Println(invoice.Weekday()) // => Output: Wednesday
	// => Parse inverts Format with the SAME layout language, same reference
	due, err := time.Parse("2006-01-02", "2026-11-21") // => layout first, text second
	// => malformed text fails here: Parse validates shape AND calendar reality
	if err != nil { // => e.g. month 13 fails: checked, never assumed
		fmt.Println("unexpected:", err) // => unreachable: the text is valid
	} else {
		// => After compares instants: due falls one month past the invoice
		fmt.Println("due after invoice:", due.After(invoice)) // => Output: due after invoice: true
	}
}
