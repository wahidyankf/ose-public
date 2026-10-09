package main

import "fmt"

func main() { // => main owns the countdown state.
	remaining := 3      // => First printed value is three.
	for remaining > 0 { // => The loop stops once remaining reaches zero.
		fmt.Println(remaining) // => Print the current positive count.
		remaining--            // => Decrement before the condition is checked again.
	}
}
