package main

import "fmt"

func main() { // => The function call in the right operand records whether it ran.
	calls := 0                                               // => calls starts at zero.
	ready := false && func() bool { calls++; return true }() // => false makes && skip the function call; ready stays false.
	fmt.Println(ready, calls)                                // => Output: false 0, proving the right operand was skipped.
}
