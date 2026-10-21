// Example 59: Context Cancels Work.
//
// Contexts carry cancellation down call chains. An already-expired deadline
// reports DeadlineExceeded with no sleeping, no goroutines, no flakiness.
package main

import (
	"context" // => Deadline, cancel, and Done: the cancellation toolkit
	"fmt"     // => prints the deadline verdict and the cancel verdict
	"time"    // => fixed instants only: past dates, never sleeps or clocks
)

func main() {
	// => deadline one hour in the PAST: expired before it was even created
	past := time.Date(2020, time.January, 1, 0, 0, 0, 0, time.UTC) // => fixed
	// => WithDeadline against a past instant: Done is closed from birth
	ctx, cancel := context.WithDeadline(context.Background(), past) // => expired
	// => cancel is still required: the timer (however expired) needs release
	defer cancel() // => always call cancel: expired contexts hold resources too
	// => select on Done: closed immediately, so this branch runs at once
	select { // => the standard wait shape: Done case plus work case
	case <-ctx.Done(): // => closed channel: fires without any waiting here
		// => Err names the cause: DeadlineExceeded, not Canceled, exactly
		fmt.Println("done:", ctx.Err()) // => Output: done: context deadline exceeded
	default: // => skipped: Done was already closed, select takes the ready case
		fmt.Println("unexpectedly live") // => unreachable: past deadline fired
	}
	// => manual cancel: the second context dies by explicit decision, not time
	live, stop := context.WithCancel(context.Background()) // => cancellable root
	// => stop now: no work started, so cancellation is instant and total
	stop() // => the decision: every derived context below dies with live
	// => Done closes on cancel: same channel, different cause in Err
	<-live.Done()                        // => blocks until cancel: already fired, returns at once
	fmt.Println("canceled:", live.Err()) // => Output: canceled: context canceled
}
