package main

import "fmt"

func main() { // => Deferred calls belong to the surrounding main function.
	defer fmt.Println("first deferred")  // => Register the first call; it will run last.
	defer fmt.Println("second deferred") // => Register the second call; it will run second.
	defer fmt.Println("third deferred")  // => Register the third call; it will run first.
	fmt.Println("body")                  // => Output body now, then third, second, first deferred.
}
