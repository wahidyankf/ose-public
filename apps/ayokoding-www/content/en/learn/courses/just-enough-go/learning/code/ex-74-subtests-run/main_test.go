package main

import "testing"

func TestNamedCases(t *testing.T) { // => Parent test groups named cases.
	for _, name := range []string{"positive", "zero"} { // => Each label becomes a subtest name.
		t.Run(name, func(t *testing.T) { t.Log(name) }) // => Full subtest names end in /positive or /zero.
	}
}
