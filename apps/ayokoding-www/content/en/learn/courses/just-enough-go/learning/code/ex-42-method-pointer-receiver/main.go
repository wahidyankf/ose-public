package main

import "fmt"

type Counter int // => Defined integer type, not a struct.

func (counter *Counter) Increment() { *counter++ } // => Pointer receiver writes the caller's value.

func main() { counter := Counter(1); counter.Increment(); fmt.Println(counter) } // => Output: 2.
