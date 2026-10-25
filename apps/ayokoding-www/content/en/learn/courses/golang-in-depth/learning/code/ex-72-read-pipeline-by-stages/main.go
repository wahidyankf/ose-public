// Example 72: Read a Pipeline by Its Stages.
//
// A pipeline reads as stages: generate, transform, collect, each owning one
// channel. Fixed input keeps output deterministic; stage order stays visible.
package main

import "fmt" // => prints the collected doubling: one line, fully determined

// gen sends the fixed inputs, then closes: the generation stage, owning jobs.
// => owns its channel: creates, fills, closes, the full lifecycle in one place
func gen() <-chan int { // => receive-only return: callers can only consume
	// => buffered for all three: sends never block, stage never stalls
	out := make(chan int, 3) // => capacity matches input count exactly
	// => producer goroutine: the stage runs beside downstream stages
	go func() { // => anonymous: the stage body lives with its channel
		// => deferred close: the stage promises termination whatever happens
		defer close(out) // => collectors range to this close, then stop
		// => fixed inputs: 1, 2, 3: determinism starts at the source
		for _, n := range []int{1, 2, 3} { // => three sends, then done
			out <- n // => one value per pass: the stage's entire job
		}
	}()
	return out // => channel escapes: downstream stages range over it
}

// double receives values and sends twice each: the transform stage, pure.
// => owns nothing but the transform: input channel in, output channel out
func double(in <-chan int) <-chan int { // => receive-only in AND out: honest
	// => buffered three: transform never blocks on delivery downstream
	out := make(chan int, 3) // => same capacity: one slot per value, no wait
	// => stage goroutine: ranges input to close, sends transform per value
	go func() { // => mirrors gen: same lifecycle shape, different math
		defer close(out)    // => close when input closes: termination cascades
		for v := range in { // => ends exactly when gen's close lands
			out <- v * 2 // => the transform: doubling, the stage's one job
		}
	}()
	return out // => downstream collects: the pipeline extends by chaining
}

func main() {
	// => compose stages: gen feeds double feeds the collector, left to right
	got := []int{} // => collected output: the pipeline's final answer
	// => range the LAST stage: close cascades gen -> double -> here, in order
	for v := range double(gen()) { // => [2 4 6]: determined by fixed input
		got = append(got, v) // => collect: the only stage main owns directly
	}
	fmt.Println(got) // => Output: [2 4 6]
}
