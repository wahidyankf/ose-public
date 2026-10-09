package main

import (
	"example/package-import/greet"
	"fmt"
)

func main() { // => The import path comes from go.mod plus the greet directory.
	// Imports are explicit; an unused import is a compile error.
	fmt.Println(greet.Message("Go")) // => Output: hello, Go
}
