package main

import "fmt"

func describe(value any) string { // => Accepts values of different dynamic types.
	switch item := value.(type) { // => Binds item at the type in each matching case.
	case string: // => Item is a string in this branch.
		return "string " + item // => "ship" becomes "string ship".
	case int: // => Item is an int in this branch.
		return fmt.Sprintf("int %d", item) // => 7 becomes "int 7".
	default: // => No known case matched.
		return "other" // => All unhandled dynamic types use this result.
	}
}

func main() { fmt.Println(describe("ship"), describe(7)) } // => Output: string ship int 7.
