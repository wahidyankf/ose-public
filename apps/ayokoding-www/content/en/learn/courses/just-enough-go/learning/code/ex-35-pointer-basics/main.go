package main

import "fmt"

func main() { // => Takes an address and reads through the resulting pointer.
	value := 7            // => An addressable integer variable.
	pointer := &value     // => Stores value's address, not a copy of 7.
	fmt.Println(*pointer) // => Dereference reads 7.
}
