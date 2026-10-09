package main

import "fmt"

type state int // => state is a distinct named type whose underlying type is int.

const ( // => iota resets to zero for this declaration group.
	queued  state = iota // => queued is state(0), starting this const group.
	running              // => The omitted expression repeats the prior specification with iota at 1.
	done                 // => iota advances again, giving done the value 2.
)

func main() { fmt.Println(queued, running, done) } // => Output: 0 1 2.
