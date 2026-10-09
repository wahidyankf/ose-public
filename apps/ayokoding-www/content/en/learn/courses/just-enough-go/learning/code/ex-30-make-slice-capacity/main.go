package main

import "fmt"

func main() { // => Separates a slice’s readable length from reserved capacity.
	values := make([]int, 0, 10)          // => Length 0 means no readable elements yet.
	fmt.Println(len(values), cap(values)) // => Output: 0 10.
}
