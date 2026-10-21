// Example 23: Read and Write Files with os.
//
// The os package reads whole files in one call and writes them with explicit
// permission bits, so file I/O stays three lines plus honest error handling.
package main

import (
	"fmt" // => prints the round-tripped note and its byte count
	"os"  // => CreateTemp, WriteFile, ReadFile: the whole file toolkit
)

func main() {
	// => CreateTemp in the OS temp dir: real file, zero repo litter
	f, err := os.CreateTemp("", "ex23-*.txt") // => empty file, unique name
	// => open failure is environmental: report it, do not continue blindly
	if err != nil { // => temp dir unwritable: nothing else can proceed
		fmt.Println("temp:", err) // => unreachable on a healthy machine
		return                    // => no path exists, so nothing to clean
	}
	// => Remove the temp file when main exits: the run leaves no trace
	defer os.Remove(f.Name()) // => path captured now, removed at return
	// => Close the open handle: WriteFile below opens the path itself
	f.Close() // => ignoring THIS close is safe: nothing was written yet
	// => the note under test: fixed bytes, so the run is deterministic
	note := "catat: bayar zakat sebelum haul tiba\n" // => one line, newline kept
	// => WriteFile creates-or-truncates with exactly these permission bits
	// => 0600: owner read-write only, the right default for user data
	if err := os.WriteFile(f.Name(), []byte(note), 0600); err != nil { // => write
		fmt.Println("write:", err) // => disk failure surfaces here
		return                     // => read would see a half-written file
	}
	// => ReadFile returns the whole content: no streaming ceremony for small files
	back, err := os.ReadFile(f.Name()) // => bytes: decode only what you need
	// => read failure after a successful write means the disk changed mid-run
	if err != nil { // => vanishing temp file: environmental, report it
		fmt.Println("read:", err) // => unreachable in the normal case
		return                    // => nothing valid to compare against
	}
	// => string conversion for printing: comparison stays on bytes in real code
	fmt.Print(string(back))          // => Output: catat: bayar zakat sebelum haul tiba
	fmt.Println("bytes:", len(back)) // => Output: bytes: 37
}
