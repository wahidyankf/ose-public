// Example 29: Internal Packages Stay Private.
//
// main.go imports the ledger through its internal path. Code outside this
// module attempting the same import would fail to compile, by compiler rule.
package main

import (
	"fmt" // => prints balances read through the exported methods
	// => internal import: legal because main.go sits under the same module
	"golangindepth/ex29shop/internal/ledger" // => full path from module root
)

func main() {
	// => New is the only way in: the map initializes inside the constructor
	book := ledger.New() // => empty book: no balances anywhere yet
	// => Credit is the sanctioned mutation: the map itself stays hidden
	book.Credit("sari", 100) // => first credit creates the account entry
	book.Credit("sari", 25)  // => second credit accumulates onto the first
	// => Balance reads through the method: zero for strangers, sum for sari
	fmt.Println(book.Balance("sari")) // => Output: 125
	fmt.Println(book.Balance("budi")) // => Output: 0
}
