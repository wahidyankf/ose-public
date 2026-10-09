package main

import (
	"context"
	"fmt"
)

func main() { // => Cancels a child context before reading Done.
	ctx, cancel := context.WithCancel(context.Background()) // => Obtain a cancelable child context.
	cancel()                                                // => Closes Done and records Canceled.
	<-ctx.Done()                                            // => Immediate receive after cancellation.
	fmt.Println(ctx.Err() == context.Canceled)              // => Output: true.
}
