package main

import "fmt"

func main() { // => Reads from an already closed empty channel.
	values := make(chan int) // => Channel starts open and empty.
	close(values)            // => No values can arrive now.
	value, open := <-values  // => Closed empty channel yields 0, false.
	fmt.Println(value, open) // => Output: 0 false.
}
