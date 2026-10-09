package main

import (
	"context"
	"fmt"
	"time"
)

func main() { // => Waits for the deadline before reading Err.
	ctx, cancel := context.WithTimeout(context.Background(), time.Millisecond) // => Deadline about 1 ms away.
	defer cancel()                                                             // => Release timer resources after main.
	<-ctx.Done()                                                               // => Wait until deadline closes Done.
	fmt.Println(ctx.Err() == context.DeadlineExceeded)                         // => Output: true.
}
