package main

import "fmt"

type Runner interface{ Run() string } // => Both concrete types below satisfy this contract.

type Check struct{} // => Has no data fields; behavior comes from Run.

func (Check) Run() string { return "checked" } // => First implementation's result.

type Publish struct{} // => Second empty type with different Run behavior.

func (Publish) Run() string { return "published" } // => Second implementation's result.

func main() { // => Calls two implementations through one interface slice.
	for _, runner := range []Runner{Check{}, Publish{}} { // => Interface slice preserves this order.
		fmt.Println(runner.Run()) // => Prints checked, then published.
	}
}
