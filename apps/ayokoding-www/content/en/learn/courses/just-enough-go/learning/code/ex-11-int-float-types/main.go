package main

import "fmt"

func main() { // => Go needs an explicit conversion before multiplying unlike numeric types.
	n := 3                      // => n has inferred type int.
	f := 2.5                    // => f has inferred type float64.
	fmt.Println(float64(n) * f) // => 3 becomes 3.0; output is 7.5.
}
