package main

import "fmt"

func main() { // => main runs a counted loop and then exits.
	for i := 0; i < 3; i++ { // => Start at zero, continue while i is below three, then increment.
		fmt.Println(i) // => Output: 0, then 1, then 2 on separate lines.
	}
}
