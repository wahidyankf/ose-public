package main

import "fmt"

func main() { // => main evaluates ordered boolean cases against one integer.
	n := -2  // => The negative value will match the second case.
	switch { // => Without an expression after switch, each case is a condition.
	case n > 0: // => This branch is skipped because -2 is not positive.
		fmt.Println("positive") // => It would print positive for a value above zero.
	case n < 0: // => This is the first true case for -2.
		fmt.Println("negative") // => Output: negative.
	default: // => Zero reaches this fallback.
		fmt.Println("zero") // => It would print zero.
	}
}
