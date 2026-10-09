package main

import "fmt"

func main() { // => Tests a successful and an unsuccessful assertion.
	var value any = "ship"     // => Dynamic type is string.
	name, ok := value.(string) // => Matching assertion returns ship, true.
	fmt.Println(name, ok)      // => Output: ship true.
	_, ok = value.(int)        // => Mismatch returns zero int and false, no panic.
	fmt.Println(ok)            // => Output: false.
}
