package main

import "fmt"

func twice(n int) int { return n * 2 }          // => twice receives an int and returns twice that value.
func main()           { fmt.Println(twice(4)) } // => twice(4) returns 8, which main prints.
