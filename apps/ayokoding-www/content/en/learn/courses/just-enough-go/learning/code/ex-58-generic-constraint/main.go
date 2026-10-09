package main

import "fmt"

type Number interface{ int | float64 } // => Type set includes int and float64, without named variants.

func Double[T Number](value T) T { return value + value } // => Both permitted types support +.

func main() { fmt.Println(Double(3), Double(2.5)) } // => Output: 6 5.
