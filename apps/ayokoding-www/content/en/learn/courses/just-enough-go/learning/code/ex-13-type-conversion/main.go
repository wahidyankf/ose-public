package main

import "fmt"

func main() { // => Each conversion names its destination type.
	n := 7                     // => n has inferred type int.
	var wide int64 = int64(n)  // => wide is the same value in int64 form.
	fmt.Println(float64(wide)) // => Output: 7 as a float64.
}
