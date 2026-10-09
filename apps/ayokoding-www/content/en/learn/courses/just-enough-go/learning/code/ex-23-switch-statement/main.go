package main

import "fmt"

func main() { // => main selects a message for one command value.
	switch command := "check"; command { // => command is scoped to the switch statement.
	case "check": // => This case matches the current command.
		fmt.Println("validating") // => Output: validating.
	case "publish": // => This branch would run for publish, without fallthrough from check.
		fmt.Println("releasing") // => Its output would be releasing.
	default: // => Unknown commands use the fallback branch.
		fmt.Println("unknown") // => Its output would be unknown.
	}
}
