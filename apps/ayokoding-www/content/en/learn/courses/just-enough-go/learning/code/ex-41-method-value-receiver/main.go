package main

import "fmt"

type Counter int // => Defined integer type can have methods.

func (counter Counter) Incremented() Counter { return counter + 1 } // => Returns 2 without changing caller's 1.

func main() { counter := Counter(1); fmt.Println(counter.Incremented(), counter) } // => Output: 2 1.
