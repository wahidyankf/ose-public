// => Example 69: Pid File Marks the Process.
// => Daemons write a pid file so supervisors and scripts find them without
// => guessing. This example writes the process id to a workdir file, reads
// => it back, verifies the number matches, and prints fixed confirmations:
// => never the pid itself, which changes every run.
package main

import (
	"fmt"           // => prints the fixed confirmations
	"os"            // => the process id and the workdir file
	"path/filepath" // => joins the workdir with the file name
)

// => writePid stores the current process id in dir/server.pid.
// => supervisors read this file to signal or supervise the process
func writePid(dir string) (string, error) { // => the directory plus the written path
	// => fixed name, chosen dir: supervisors know where to look
	path := filepath.Join(dir, "server.pid") // => the conventional name, fixed
	// => the pid as decimal text: supervisors parse one integer
	if err := os.WriteFile(path, []byte(fmt.Sprint(os.Getpid())), 0644); err != nil { // => readable by owner and group
		return "", err // => unwritable dirs fail here, named
	}
	return path, nil // => the path for the verification below
}

// => readPid reads a pid file back and parses its single integer.
// => reading back proves the file holds what was written
func readPid(path string) (int, error) { // => the path plus the parsed pid
	raw, err := os.ReadFile(path) // => the whole file: one short line
	if err != nil {               // => missing files fail here, named
		return 0, err // => zero plus the reason
	}
	var pid int // => the parsed process id
	// => Sscanf parses the decimal text: exactly one integer expected
	if _, err := fmt.Sscanf(string(raw), "%d", &pid); err != nil { // => garbage fails here
		return 0, err // => zero plus the parse reason
	}
	return pid, nil // => the pid the file holds
}

func main() {
	// => the workdir holds the pid file: committed code stays clean
	dir, err := os.MkdirTemp("", "ginpid") // => a fresh temp dir per run
	if err != nil {                        // => temp dirs rarely fail: name it when they do
		fmt.Println("FAIL tempdir:", err) // => the failure names itself
		return                            // => nowhere to write: stop here
	}
	// => temp dirs vanish: parallel runs never share pid files
	defer os.RemoveAll(dir)    // => clean the temp dir: runs leave no trace
	path, err := writePid(dir) // => write this process's id
	if err != nil {            // => the write failure, reported not hidden
		fmt.Println("FAIL write:", err) // => names the unwritable place
		return                          // => nothing to verify: stop here
	}
	fmt.Println("wrote server.pid") // => Output: wrote server.pid
	// => read back and compare: the file must hold this process's id
	// => the read parses the file: text back into a number
	pid, err := readPid(path) // => the stored number, parsed
	if err != nil {           // => the read failure, reported not hidden
		fmt.Println("FAIL read:", err) // => names the unreadable file
		return                         // => nothing to compare: stop here
	}
	// => equality proves the round trip: written and read agree
	if pid != os.Getpid() { // => the file must name this process, no other
		fmt.Println("FAIL mismatch") // => a wrong number fails the lesson
		return                       // => mismatch stops here: supervisors would signal strangers
	}
	fmt.Println("pid verified") // => Output: pid verified
}
