package main

import (
	"fmt"
	"sync"
)

func main() { // => Protects two concurrent increments with a mutex.
	var mutex sync.Mutex     // => Protects shared count.
	count := 0               // => Both workers increment this one value.
	var wait sync.WaitGroup  // => Tracks both workers.
	for i := 0; i < 2; i++ { // => Spawn two increments.
		wait.Add(1)                                                                    // => Register before starting each goroutine.
		go func() { defer wait.Done(); mutex.Lock(); defer mutex.Unlock(); count++ }() // => Lock surrounds count++.
	}
	wait.Wait()        // => Read count only after both writers finish.
	fmt.Println(count) // => Output: 2.
}
