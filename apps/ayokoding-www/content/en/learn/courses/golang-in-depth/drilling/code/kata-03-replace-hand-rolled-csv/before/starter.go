// Starter: hand-rolled CSV split. The bug: quoted commas split rows.
// => strings.Split on commas: breaks the moment a field holds "a,b" quoted
// => rewrite: encoding/csv handles quotes, following the stdlib-first rule
package main

import (
	"fmt"     // => prints the mis-split fields: four instead of three
	"strings" // => Split: the naive tool this kata replaces with encoding/csv
)

func main() {
	// => quoted comma inside the second field: legal CSV, fatal for Split
	line := `sari,"jakarta, indonesia",41` // => three fields, one holds a comma
	// => naive split: every comma cuts, including the quoted one inside
	fields := strings.Split(line, ",") // => BUG: four pieces, quotes included
	// => four fields print: the middle city broke in two, quotes and all
	fmt.Println(len(fields), fields) // => wrong: 4 pieces, quotes leak into data
}
