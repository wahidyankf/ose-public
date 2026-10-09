package main

import "fmt"

func main() { // => Distinguishes absent key from a stored zero.
	counts := map[string]int{"ok": 0}   // => An existing key can also hold zero.
	value, present := counts["missing"] // => Missing key gives zero and false.
	fmt.Println(value, present)         // => Output: 0 false.
}
