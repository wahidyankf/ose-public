package main

import "fmt"

func main() { // => Shows two test case names printed in sequence.
	for _, name := range []string{"positive", "zero"} { // => Two case labels.
		fmt.Println("subtest:", name) // => Prints each label; actual subtests are in main_test.go.
	}
}
