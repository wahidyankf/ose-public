package main

import "fmt"

func main() { // => Stores three concrete types behind any values.
	values := []any{"ship", 7, true} // => Elements retain different dynamic types.
	for _, value := range values {   // => Visits string, int, then bool.
		fmt.Printf("%T %v\n", value, value) // => Prints each dynamic type and value.
	}
}
