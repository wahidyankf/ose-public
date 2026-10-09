package main

import "fmt"

func Map[T, U any](values []T, transform func(T) U) []U { // => Input and output types may differ.
	result := make([]U, len(values)) // => One output slot per input.
	for i, value := range values {   // => Keep each transformed value at its input index.
		result[i] = transform(value) // => Here int 1 becomes string "n=1".
	}
	return result // => []U is []string for the call below.
}

func main() { // => Calls Map with integer input and string output.
	words := Map([]int{1, 2}, func(value int) string { return fmt.Sprintf("n=%d", value) }) // => T=int, U=string.
	fmt.Println(words)                                                                      // => Output: [n=1 n=2].
}
