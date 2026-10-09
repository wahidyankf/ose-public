package main

import "fmt"

func closeResource() { fmt.Println("cleanup") } // => The named cleanup function prints when it is called.

func main() { // => main registers cleanup before doing work.
	defer closeResource() // => Run closeResource when main returns.
	fmt.Println("work")   // => Output first: work; deferred cleanup prints afterward.
}
