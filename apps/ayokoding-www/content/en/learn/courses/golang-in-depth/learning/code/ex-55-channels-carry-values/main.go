// Example 55: Channels Carry Values Between Goroutines.
//
// A channel is a typed pipe: one side sends, the other receives, and closing
// signals "no more". A single sender keeps the stream order deterministic.
package main

import "fmt" // => prints each word as it arrives, then the closed verdict

// stream sends every word, then closes the channel: closing is the sender's job.
// => send-only parameter: only this function may send or close, by type
// => close (not a sentinel value): receivers range cleanly to termination
func stream(words []string, out chan<- string) { // => producer: sends then closes
	// => range the input: order in equals order out, single sender guaranteed
	for _, w := range words { // => one send per word, in slice order
		out <- w // => send: hands the word to whoever receives next
	}
	// => close after the last send: receivers see termination, not a hang
	close(out) // => sender closes: receivers range until this exact point
}

func main() {
	// => unbuffered pipe: each send waits for its receive, lockstep rhythm
	words := make(chan string) // => no buffer: sender and receiver meet per word
	// => producer runs beside main: sends three words, then closes the pipe
	go stream([]string{"pagi", "siang", "sore"}, words) // => concurrent producer
	// => range receives until close: no count needed, termination is the signal
	for w := range words { // => one iteration per sent word, order preserved
		fmt.Println("got:", w) // => Output lines: got: pagi/siang/sore in order
	}
	// => loop ended means closed: the producer kept its closing promise
	fmt.Println("closed") // => Output: closed
}
