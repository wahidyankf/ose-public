package main

import (
	"fmt"
	"time"
)

func main() { // => Waits for the only select case, a timer.
	select { // => Waits because there is no default branch.
	case <-time.After(time.Millisecond): // => Timer channel becomes ready after roughly 1 ms.
		fmt.Println("timed out") // => Only possible output.
	}
}
