// Example 32: Replace with a Local Path.
//
// The main module's go.mod replaces the greetmod path with ./greetmod, so the
// sibling evolves locally without publishing. The import reads normally.
package main

import (
	"fmt" // => prints the greeting the sibling module composed
	// => normal import path: replace invisibly redirects it to local files
	"golangindepth/ex32shop/greetmod" // => resolved via replace, not network
)

func main() {
	// => Hello lives in the sibling module: the call crosses modules locally
	fmt.Println(greetmod.Hello("Sari")) // => Output: selamat datang, Sari
}
