// Scratch files: created per test, removed by Cleanup whatever happens.
// => temp dir location: t.TempDir (test side) keeps runs hermetic
// => write-then-read: the two operations this tiny helper pairs together
package main

import "os" // => WriteFile and ReadFile: the whole-file pair under test

// RoundTrip writes text to path and reads it back, proving the pair agrees.
// => (string, error): the read-back plus any failure from either direction
func RoundTrip(path string, text string) (string, error) { // => write, then read
	// => 0600: owner-only, the right default for scratch containing test data
	if err := os.WriteFile(path, []byte(text), 0600); err != nil { // => write half
		return "", err // => write failed: nothing valid to read back
	}
	// => ReadFile returns bytes: convert once, at the boundary, for compare
	back, err := os.ReadFile(path) // => read half: same path, fresh bytes
	// => read failure after a good write means the disk changed mid-test
	if err != nil { // => environmental: report, do not compare garbage
		return "", err // => nothing trustworthy came back
	}
	return string(back), nil // => identical text: the pair agrees exactly
}
