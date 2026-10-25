// Example 17: Handle Errors Inside Defer.
//
// Deferred cleanup can fail too, and ignoring it hides data loss: a failed
// close can mean unwritten bytes. Merge the close error into the return.
package main

import (
	"errors" // => Join merges the write error with the close error
	"fmt"    // => prints which of the two operations the caller sees fail
	"os"     // => CreateTemp and file writes stand in for real file work
)

// save writes text to a temp file, refusing to ignore EITHER failure.
// => named return err: both the body and the defer assign into it
// => *os.File close can fail after a successful write: check it anyway
func save(text string) (err error) { // => named err shared with the defer
	// => CreateTemp puts the file in the OS temp dir: no repo litter
	f, err := os.CreateTemp("", "ex17-*.txt") // => real file, temp location
	// => open failure: nothing to clean up, return the error directly
	if err != nil { // => temp dir unwritable is an environment failure
		return err // => no file exists, so no deferred close is registered
	}
	// => deferred closure: close the file AND merge a close failure upward
	// => closure (not f.Close directly): a bare defer cannot see the error
	defer func() { // => runs after the body, before save returns to main
		// => Close flushes buffered data: its error can mean lost bytes
		if cerr := f.Close(); cerr != nil { // => close failed: do not swallow
			// => Join keeps both: a body error plus a close error stay visible
			err = errors.Join(err, cerr) // => nil body error joins cleanly too
		}
	}()
	// => remove the temp file: theBytes were proven writable, path is temp
	defer os.Remove(f.Name()) // => second defer runs FIRST: removes before close
	// => the real work: one write whose error the named return carries
	if _, err = f.WriteString(text); err != nil { // => write failure returns
		return err // => deferred close still runs: cleanup is unconditional
	}
	return nil // => success so far: the deferred close has the last word
}

func main() {
	// => happy path: write and close both succeed, error stays nil
	if err := save("hello"); err != nil { // => nil skips this branch
		fmt.Println("unexpected:", err) // => unreachable on success
	} else {
		fmt.Println("saved") // => Output: saved
	}
}
