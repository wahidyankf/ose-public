package main

import "testing"

func TestDouble(t *testing.T) { // => go test discovers this Test-prefixed function.
	if got := double(2); got != 4 { // => Input 2 must produce 4.
		t.Fatalf("double(2) = %d", got) // => Report the actual result on failure.
	}
}
