package main

import "fmt"

func main() { // => Short declarations are legal inside functions.
	name := "Ada"                        // => name has inferred type string.
	fmt.Printf("%s is %T\n", name, name) // => Output: Ada is string.
}
