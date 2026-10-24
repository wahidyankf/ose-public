// Example 31: Require Nothing: Stdlib Only.
//
// A module with no require lines has no supply chain to audit or break.
// go list -m all (the run command of this unit) proves it names one module.
package main

import (
	"fmt"     // => stdlib: no require line needed, ever, for this import
	"sort"    // => stdlib: sorting without a dependency to pin or update
	"strings" // => stdlib: text utilities from the same trusted source
)

func main() {
	// => three stdlib packages collaborate: upper-case, then sort, then join
	words := []string{"golang", "stdlib", "pinning"} // => fixed input, fixed output
	// => ToUpper maps each word: strings needs no external helper package
	for i, w := range words { // => index write-back: the range-copy rule applies
		words[i] = strings.ToUpper(w) // => GOLANG, STDLIB, PINNING in place
	}
	// => sort orders in place: the same slice, now deterministic for printing
	sort.Strings(words) // => alphabetical: GOLANG, PINNING, STDLIB
	// => Join renders the verdict: one line proving stdlib sufficed entirely
	fmt.Println(strings.Join(words, "+")) // => Output: GOLANG+PINNING+STDLIB
}
