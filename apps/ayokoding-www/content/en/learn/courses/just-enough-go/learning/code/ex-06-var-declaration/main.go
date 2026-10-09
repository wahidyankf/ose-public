package main

import "fmt"

func main() { // => The explicit types are checked against their initializers.
	var name string = "Ada" // => name is a string containing Ada.
	var year int = 2026     // => year is an int containing 2026.
	fmt.Println(name, year) // => Output: Ada 2026.
}
