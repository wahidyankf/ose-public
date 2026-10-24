// Example 65: Handle Every Error or Say Why Not.
//
// Dropped errors must carry a rationale, or they read as accidents. The write
// below is CHECKED; the close is dropped WITH its reason written beside it.
package main

import (
	"fmt" // => prints the write verdict and the documented-drop verdict
	"os"  // => CreateTemp and WriteFile: checked write, reasoned close
)

func main() {
	// => temp file in the OS dir: real handle, zero repo litter, auto-cleaned
	f, err := os.CreateTemp("", "ex65-*.txt") // => open CAN fail: checked next
	// => open failure is environmental: report it, do not continue blindly
	if err != nil { // => temp dir unwritable: nothing exists to write into
		fmt.Println("temp:", err) // => unreachable on a healthy machine
		return                    // => no handle, so no close to reason about
	}
	// => Remove at return: the run leaves no trace whatever happens below
	defer os.Remove(f.Name()) // => path captured now: cleanup is unconditional
	// => dropping Close's error is SAFE here because nothing was written yet:
	// => no buffered data exists to lose, so close cannot hide a failure.
	// => the rationale rides WITH the drop: future readers see the reasoning.
	defer f.Close() //nolint:errcheck // => safe: unwritten handle, nothing to flush
	// => the WRITE is checked: bytes on disk are the promise being made
	if _, err := f.WriteString("catat"); err != nil { // => the load-bearing check
		fmt.Println("write:", err) // => disk failure surfaces here, honestly
		return                     // => close still runs: defers are unconditional
	}
	fmt.Println("written") // => Output: written
}
